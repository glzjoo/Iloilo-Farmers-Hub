import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signOut,
  signInWithPhoneNumber,
  updateProfile,
  type User as FirebaseUser,
  type ConfirmationResult,
  type ApplicationVerifier 
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, deleteDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { UserProfile, Consumer, Farmer } from '../types';
import type { ConsumerSignupData, FarmerSignupData } from '../lib/validations';

// Extended profile that combines auth + role-specific data
interface ExtendedUserProfile extends UserProfile {
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  phoneNo?: string;
  // Farmer-specific fields
  farmName?: string; 
  farmAddress?: string; 
  farmType?: string; 
  verificationStatus?: string; 
  // Consumer-specific fields
  interest?: string;
  address?: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: ExtendedUserProfile | null;
  loading: boolean;
  isLoggedIn: boolean;
  
  // OTP Flow
  sendOTP: (phoneNo: string) => Promise<ConfirmationResult>;
  verifyOTP: (confirmation: ConfirmationResult, otp: string) => Promise<FirebaseUser>;
  
  logout: () => Promise<void>;
  
  // Signup (passwordless OTP flow)
  signUpConsumer: (data: ConsumerSignupData, confirmation: ConfirmationResult, otp: string) => Promise<void>;
  
  // Farmer signup flow (3-step: form -> ID verification -> OTP)
  prepareFarmerSignup: (data: FarmerSignupData) => Promise<string>;
  storeVerificationData: (tempId: string, verificationData: VerificationData) => Promise<void>;
  completeFarmerSignup: (tempId: string, confirmation: ConfirmationResult, otp: string) => Promise<void>;
  getPendingFarmerData: (tempId: string) => Promise<FarmerSignupData | null>;
  
  refreshProfile: () => Promise<void>;
}

// ID Verification data structure (from your existing ID verification)
interface VerificationData {
  idType?: string;
  idNumber?: string;
  extractedAddress?: string;
  fullName?: string;
  faceMatchScore?: number;
  faceMatchPassed?: boolean;
  idCardImageUrl?: string;
  selfieImageUrl?: string;
  [key: string]: any; // For additional fields from your existing verification
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<ExtendedUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Store reCAPTCHA verifier
  const recaptchaVerifierRef = useRef<ApplicationVerifier | null>(null);

  const fetchCompleteProfile = async (firebaseUser: FirebaseUser, baseProfile: UserProfile): Promise<ExtendedUserProfile> => {
    try {
      if (baseProfile.role === 'farmer') {
        const farmerDoc = await getDoc(doc(db, 'farmers', firebaseUser.uid));
        if (farmerDoc.exists()) {
          const farmerData = farmerDoc.data() as Farmer;
          return {
            ...baseProfile,
            firstName: farmerData.firstName,
            lastName: farmerData.lastName,
            profileImage: farmerData.profileImage,
            phoneNo: farmerData.phoneNo,
            farmName: farmerData.farmName,
            farmAddress: farmerData.farmAddress,
            farmType: farmerData.farmType,
            verificationStatus: farmerData.verificationStatus,
          };
        }
      } else if (baseProfile.role === 'consumer') {
        const consumerDoc = await getDoc(doc(db, 'consumers', firebaseUser.uid));
        if (consumerDoc.exists()) {
          const consumerData = consumerDoc.data() as Consumer;
          return {
            ...baseProfile,
            firstName: consumerData.firstName,
            lastName: consumerData.lastName,
            profileImage: consumerData.profileImage,
            phoneNo: consumerData.phoneNo,
          };
        }
      }
    } catch (error) {
      console.error('Error fetching role-specific profile:', error);
    }
    
    return baseProfile;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const baseProfile = userDoc.data() as UserProfile;
            const completeProfile = await fetchCompleteProfile(firebaseUser, baseProfile);
            setUserProfile(completeProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => {
      unsubscribe();
      // Cleanup reCAPTCHA on unmount
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const baseProfile = userDoc.data() as UserProfile;
        const completeProfile = await fetchCompleteProfile(user, baseProfile);
        setUserProfile(completeProfile);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };


  // Send OTP to phone number
 const sendOTP = async (phoneNo: string): Promise<ConfirmationResult> => {
  let normalizedPhone = '';
  
  try {
    // Normalize phone first
    normalizedPhone = phoneNo.replace(/\s/g, '');
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '+63' + normalizedPhone.substring(1);
    }
    if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = '+' + normalizedPhone;
    }

    console.log('=== SEND OTP DEBUG ===');
    console.log('1. Phone normalized:', normalizedPhone);
    console.log('2. Auth exists:', !!auth);

    // Check if reCAPTCHA container exists
    let container = document.getElementById('recaptcha-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'recaptcha-container';
      document.body.appendChild(container);
      console.log('3. Created reCAPTCHA container');
    }

    // Reset the ref (don't try to clear, just create new)
    recaptchaVerifierRef.current = null;

    // Import and create reCAPTCHA
    console.log('4. Importing RecaptchaVerifier...');
    const { RecaptchaVerifier } = await import('firebase/auth');
    
    console.log('5. Creating RecaptchaVerifier with auth:', auth);
    console.log('6. Auth app name:', auth?.app?.name);
    
    recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: (response: any) => {
        console.log('reCAPTCHA verified:', response);
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
      }
    });

    console.log('7. RecaptchaVerifier created:', !!recaptchaVerifierRef.current);

    console.log('8. Calling signInWithPhoneNumber...');
    console.log('   - auth:', auth);
    console.log('   - phone:', normalizedPhone);
    console.log('   - verifier:', recaptchaVerifierRef.current);

    const confirmationResult = await signInWithPhoneNumber(
      auth,
      normalizedPhone,
      recaptchaVerifierRef.current
    );

    console.log('9. OTP sent successfully!');
    return confirmationResult;
    
  } catch (error: any) {
    console.error('=== SEND OTP FAILED ===');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Stack:', error.stack);
    
    recaptchaVerifierRef.current = null;
    
    throw new Error(`Failed to send OTP: ${error.message}`);
  }
};

  // Verify OTP and return the user (for chaining with account creation)
  const verifyOTP = async (confirmation: ConfirmationResult, otp: string): Promise<FirebaseUser> => {
    try {
      const result = await confirmation.confirm(otp);
      return result.user;
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      
      const errorMessages: Record<string, string> = {
        'auth/invalid-verification-code': 'Invalid OTP. Please check and try again.',
        'auth/code-expired': 'OTP has expired. Please request a new one.',
      };
      
      throw new Error(errorMessages[error.code] || 'Failed to verify OTP. Please try again.');
    }
  };

  // Consumer signup with OTP verification (passwordless)
  const signUpConsumer = async (
    data: ConsumerSignupData,
    confirmation: ConfirmationResult,
    otp: string
  ): Promise<void> => {
    try {
      // Step 1: Verify OTP (this creates the Firebase Auth user)
      const firebaseUser = await verifyOTP(confirmation, otp);
      
      if (!firebaseUser) {
        throw new Error('Failed to create account. Please try again.');
      }

      // Step 2: Update profile
      await updateProfile(firebaseUser, {
        displayName: `${data.firstName} ${data.lastName}`,
      });

      // Step 3: Create Firestore records
      const userProfileData: UserProfile = {
        uid: firebaseUser.uid,
        email: data.email || null,
        displayName: `${data.firstName} ${data.lastName}`,
        role: 'consumer',
        createdAt: new Date(),
      };

      const consumerData: Consumer = {
        uid: firebaseUser.uid,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNo: data.phoneNo,
        email: data.email || null,
        address: data.address,
        profileImage: '',
        createdAt: new Date(),
        interest: data.interest,
      };

      await Promise.all([
        setDoc(doc(db, 'users', firebaseUser.uid), {
          ...userProfileData,
          createdAt: serverTimestamp(),
        }),
        setDoc(doc(db, 'consumers', firebaseUser.uid), {
          ...consumerData,
          createdAt: serverTimestamp(),
        }),
      ]);

      // Set local state
      setUserProfile({
        ...userProfileData,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNo: data.phoneNo,
        profileImage: '',
      });

    } catch (error: any) {
      console.error('Consumer signup error:', error);
      
      // Cleanup if needed
      if (auth.currentUser) {
        try {
          await auth.currentUser.delete();
        } catch (deleteError) {
          console.error('Failed to cleanup auth user:', deleteError);
        }
      }

      throw error;
    }
  };

// Prepare farmer signup - Store data temporarily before ID verification
  const prepareFarmerSignup = async (data: FarmerSignupData): Promise<string> => {
    try {
      // Simple timestamp + random ID (works in all browsers)
      const tempId = `farmer_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      
      console.log('Generated tempId:', tempId);

      const pendingData = {
        tempId,
        farmerData: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email || null,
          farmName: data.farmName,
          farmAddress: data.farmAddress,
          phoneNo: data.phoneNo,
          farmType: data.farmType,
          agreeToTerms: data.agreeToTerms,
        },
        idVerified: false,
        verificationData: null,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      console.log('Saving to Firestore...', pendingData);
      
      // Store in Firestore
      const docRef = doc(db, 'pendingFarmers', tempId);
      await setDoc(docRef, pendingData);
      
      console.log('Firestore save successful');

      // Also store in sessionStorage as backup
      try {
        sessionStorage.setItem('farmerSignupTempId', tempId);
        sessionStorage.setItem(`farmerSignup_${tempId}`, JSON.stringify({
          farmerData: data,
          idVerified: false,
          timestamp: Date.now(),
        }));
        console.log('sessionStorage backup saved');
      } catch (e) {
        console.warn('sessionStorage failed (might be disabled):', e);
      }

      return tempId;
      
    } catch (error: any) {
      console.error('=== prepareFarmerSignup FAILED ===', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw new Error(`Failed to initialize signup: ${error.message}`);
    }
  };

  // Store ID verification data after ID verification step
  const storeVerificationData = async (tempId: string, verificationData: VerificationData): Promise<void> => {
    try {
      const pendingRef = doc(db, 'pendingFarmers', tempId);
      const pendingDoc = await getDoc(pendingRef);
      
      if (!pendingDoc.exists()) {
        throw new Error('Signup session not found. Please start over.');
      }

      await updateDoc(pendingRef, {
        idVerified: true,
        verificationData: verificationData,
        verifiedAt: serverTimestamp(),
      });

      // Update sessionStorage too
      const sessionData = sessionStorage.getItem(`farmerSignup_${tempId}`);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        parsed.idVerified = true;
        parsed.verificationData = verificationData;
        sessionStorage.setItem(`farmerSignup_${tempId}`, JSON.stringify(parsed));
      }
    } catch (error: any) {
      console.error('Store verification data error:', error);
      throw new Error('Failed to save verification data. Please try again.');
    }
  };

  // Get pending farmer data (useful for checking session status)
  const getPendingFarmerData = async (tempId: string): Promise<FarmerSignupData | null> => {
    try {
      // Try Firestore first
      const pendingDoc = await getDoc(doc(db, 'pendingFarmers', tempId));
      if (pendingDoc.exists()) {
        return pendingDoc.data().farmerData as FarmerSignupData;
      }

      // Fallback to sessionStorage
      const sessionData = sessionStorage.getItem(`farmerSignup_${tempId}`);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        return parsed.farmerData as FarmerSignupData;
      }

      return null;
    } catch (error) {
      console.error('Get pending farmer data error:', error);
      return null;
    }
  };

  // Complete farmer signup after OTP verification
  // Complete farmer signup after OTP verification
  const completeFarmerSignup = async (
    tempId: string,
    confirmation: ConfirmationResult,
    otp: string
  ): Promise<void> => {
    try {
      const pendingDoc = await getDoc(doc(db, 'pendingFarmers', tempId));
      
      if (!pendingDoc.exists()) {
        throw new Error('Signup session expired. Please start over.');
      }

      const pendingData = pendingDoc.data();
      const data: FarmerSignupData = pendingData.farmerData;
      const verificationData: VerificationData = pendingData.verificationData || {};

      // Step 1: Verify OTP (creates Firebase Auth account)
      const result = await confirmation.confirm(otp);
      const firebaseUser = result.user;
      
      if (!firebaseUser) {
        throw new Error('Failed to create account. Please try again.');
      }

      console.log('Firebase user created:', firebaseUser.uid);

      // Step 2: Update profile
      await updateProfile(firebaseUser, {
        displayName: `${data.firstName} ${data.lastName}`,
      });

      // Step 3: Create Firestore records with explicit auth context
      const userProfileData: UserProfile = {
        uid: firebaseUser.uid,
        email: data.email || null,
        displayName: `${data.firstName} ${data.lastName}`,
        role: 'farmer',
        createdAt: new Date(),
      };

      const farmerData: Farmer = {
        uid: firebaseUser.uid,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNo: data.phoneNo,
        email: data.email || null,
        idType: verificationData.idType || 'phNationalId',
        cardAddress: verificationData.extractedAddress || data.farmAddress,
        profileImage: '',
        createdAt: new Date(),
      };

      const sanitize = (val: any) => val === undefined ? null : val;

      // Use Promise.all with individual error handling
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          ...userProfileData,
          createdAt: serverTimestamp(),
          verifiedAt: serverTimestamp(),
        });
        console.log('Users document created');
      } catch (userError: any) {
        console.error('Failed to create users doc:', userError);
        throw new Error(`Failed to create user profile: ${userError.message}`);
      }

      try {
        await setDoc(doc(db, 'farmers', firebaseUser.uid), {
          ...farmerData,
          farmName: data.farmName,
          farmAddress: data.farmAddress,
          farmType: data.farmType,
          verificationStatus: 'verified',
          verificationData: {
            faceMatchScore: sanitize(verificationData.faceMatchScore),
            faceMatchPassed: sanitize(verificationData.faceMatchPassed),
            extractedIdNumber: sanitize(verificationData.idNumber),
            extractedFullName: sanitize(verificationData.fullName),
            extractedAddress: sanitize(verificationData.extractedAddress),
            idCardImageUrl: sanitize(verificationData.idCardImageUrl),
            selfieImageUrl: sanitize(verificationData.selfieImageUrl),
            verifiedAt: serverTimestamp(),
            verifiedBy: 'face++_cloudVision',
          },
          createdAt: serverTimestamp(),
        });
        console.log('Farmers document created');
      } catch (farmerError: any) {
        console.error('Failed to create farmers doc:', farmerError);
        throw new Error(`Failed to create farmer profile: ${farmerError.message}`);
      }

      // Clean up pending data
      await deleteDoc(doc(db, 'pendingFarmers', tempId));
      sessionStorage.removeItem(`farmerSignup_${tempId}`);
      sessionStorage.removeItem('farmerSignupTempId');

      // Set local state
      setUserProfile({
        ...userProfileData,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNo: data.phoneNo,
        profileImage: '',
        farmName: data.farmName,
        farmAddress: data.farmAddress,
        farmType: data.farmType,
        verificationStatus: 'verified',
      });

    } catch (error: any) {
      console.error('=== Complete farmer signup error ===', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Don't delete auth user here - let the user retry or contact support
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setUserProfile(null);
      recaptchaVerifierRef.current = null;
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Failed to sign out. Please try again.');
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    isLoggedIn: !!user,
    sendOTP,
    verifyOTP,
    logout,
    signUpConsumer,
    prepareFarmerSignup,
    storeVerificationData,
    completeFarmerSignup,
    getPendingFarmerData,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}