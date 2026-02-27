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
import { doc, setDoc, getDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { UserProfile, Consumer, Farmer } from '../types';

// Extended profile that combines auth + role-specific data
interface ExtendedUserProfile extends UserProfile {
  firstName?: string;
  lastName?: string;
  phoneNo?: string;
  profileImage?: string;
  
  // For farmers
  farmName?: string; 
  farmAddress?: string; 
  farmType?: string; 
  verificationStatus?: string; 
}

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: ExtendedUserProfile | null;
  loading: boolean;
  isLoggedIn: boolean;
  
  // OTP Flow
  sendOTP: (phoneNo: string) => Promise<ConfirmationResult>;
  verifyOTP: (confirmation: ConfirmationResult, otp: string) => Promise<void>;
  
  logout: () => Promise<void>;
  
  // Signup (now uses same OTP flow)
  signUpConsumer: (data: ConsumerSignupData, confirmation: ConfirmationResult, otp: string) => Promise<void>;
  prepareFarmerSignup: (data: FarmerSignupData) => Promise<string>;
  completeFarmerSignup: (tempId: string, verificationData: any, confirmation: ConfirmationResult, otp: string) => Promise<void>;
  
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Consumer signup data without password
interface ConsumerSignupData {
  firstName: string;
  lastName: string;
  phoneNo: string;
  email?: string | null;
  address: string;
  interest?: string;
}

// Farmer signup data without password
interface FarmerSignupData {
  firstName: string;
  lastName: string;
  phoneNo: string;
  email?: string | null;
  farmName: string;
  farmAddress: string;
  farmType: string;
}

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

    return () => unsubscribe();
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
    try {
      // Normalize to E.164 format (+639123456789)
      let normalizedPhone = phoneNo.replace(/\s/g, '');
      if (normalizedPhone.startsWith('0')) {
        normalizedPhone = '+63' + normalizedPhone.substring(1);
      }
      if (!normalizedPhone.startsWith('+')) {
        normalizedPhone = '+' + normalizedPhone;
      }

      // Create invisible reCAPTCHA
      const { RecaptchaVerifier } = await import('firebase/auth');
      
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => console.log('reCAPTCHA verified'),
          'expired-callback': () => {
            recaptchaVerifierRef.current = null;
          }
        });
      }

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        normalizedPhone,
        recaptchaVerifierRef.current
      );

      return confirmationResult;
      
    } catch (error: any) {
      console.error('Send OTP error:', error);
      recaptchaVerifierRef.current = null;
      
      const errorMessages: Record<string, string> = {
        'auth/invalid-phone-number': 'Invalid phone number format.',
        'auth/too-many-requests': 'Too many requests. Please try again later.',
        'auth/captcha-check-failed': 'Security check failed. Please try again.',
        'auth/phone-number-already-exists': 'An account with this phone number already exists.',
      };
      
      throw new Error(errorMessages[error.code] || `Failed to send OTP: ${error.message}`);
    }
  };

  // Verify OTP and sign in
  const verifyOTP = async (confirmation: ConfirmationResult, otp: string): Promise<void> => {
    try {
      await confirmation.confirm(otp);
      // onAuthStateChanged will handle the rest (fetching profile)
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      
      const errorMessages: Record<string, string> = {
        'auth/invalid-verification-code': 'Invalid OTP. Please check and try again.',
        'auth/code-expired': 'OTP has expired. Please request a new one.',
      };
      
      throw new Error(errorMessages[error.code] || 'Failed to verify OTP. Please try again.');
    }
  };

  // Consumer signup with OTP verification
  const signUpConsumer = async (
    data: ConsumerSignupData,
    confirmation: ConfirmationResult,
    otp: string
  ): Promise<void> => {
    try {
      // Step 1: Verify OTP (this creates the Firebase Auth user)
      await confirmation.confirm(otp);
      
      // Get the newly created user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Failed to create account. Please try again.');
      }

      // Step 2: Update profile
      await updateProfile(currentUser, {
        displayName: `${data.firstName} ${data.lastName}`,
      });

      // Step 3: Create Firestore records
      const userProfileData: UserProfile = {
        uid: currentUser.uid,
        email: data.email || null,
        displayName: `${data.firstName} ${data.lastName}`,
        role: 'consumer',
        createdAt: new Date(),
      };

      const consumerData: Consumer = {
        uid: currentUser.uid,
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
        setDoc(doc(db, 'users', currentUser.uid), {
          ...userProfileData,
          createdAt: serverTimestamp(),
        }),
        setDoc(doc(db, 'consumers', currentUser.uid), {
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

  // Prepare farmer signup (no auth account yet)
  const prepareFarmerSignup = async (data: FarmerSignupData): Promise<string> => {
    try {
      const tempId = crypto.randomUUID();
      
      const pendingData = {
        tempId,
        farmerData: data,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        verificationAttempts: 0,
        maxAttempts: 3,
      };

      await setDoc(doc(db, 'pendingFarmers', tempId), pendingData);

      return tempId;
    } catch (error: any) {
      console.error('Prepare farmer signup error:', error);
      throw new Error('Failed to initialize signup. Please try again.');
    }
  };

  // Complete farmer signup with OTP
  const completeFarmerSignup = async (
    tempId: string,
    verificationData: any,
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

      // Step 1: Verify OTP (creates Firebase Auth account)
      await confirmation.confirm(otp);
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Failed to create account. Please try again.');
      }

      // Step 2: Update profile
      await updateProfile(currentUser, {
        displayName: `${data.firstName} ${data.lastName}`,
      });

      // Step 3: Create Firestore records
      const userProfileData: UserProfile = {
        uid: currentUser.uid,
        email: data.email || null,
        displayName: `${data.firstName} ${data.lastName}`,
        role: 'farmer',
        createdAt: new Date(),
      };

      const farmerData: Farmer = {
        uid: currentUser.uid,
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

      await Promise.all([
        setDoc(doc(db, 'users', currentUser.uid), {
          ...userProfileData,
          createdAt: serverTimestamp(),
          verifiedAt: serverTimestamp(),
        }),
        setDoc(doc(db, 'farmers', currentUser.uid), {
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
            extractedAddress: sanitize(verificationData.address),
            idCardImageUrl: sanitize(verificationData.idCardImageUrl),
            selfieImageUrl: sanitize(verificationData.selfieImageUrl),
            verifiedAt: serverTimestamp(),
            verifiedBy: 'face++_cloudVision',
          },
          createdAt: serverTimestamp(),
        }),
      ]);

      // Clean up pending data
      await deleteDoc(doc(db, 'pendingFarmers', tempId));

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
      console.error('Complete farmer signup error:', error);
      
      if (auth.currentUser) {
        try {
          await auth.currentUser.delete();
        } catch (deleteError) {
          console.error('Failed to cleanup auth user after error:', deleteError);
        }
      }

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
    completeFarmerSignup,
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