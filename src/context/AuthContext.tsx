import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  type User as FirebaseUser 
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { UserProfile, Consumer, Farmer } from '../types';
import type { ConsumerSignupData, FarmerSignupData } from '../lib/validations';

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
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signUpConsumer: (data: ConsumerSignupData) => Promise<void>;
  prepareFarmerSignup: (data: FarmerSignupData) => Promise<string>;
  completeFarmerSignup: (tempId: string, verificationData: any) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<ExtendedUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch complete profile based on role
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
    
    // Fallback to base profile if role-specific fetch fails
    return baseProfile;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // First get base user profile to check role
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const baseProfile = userDoc.data() as UserProfile;
            // Then fetch complete profile with role-specific data
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

  // Manual refresh function - call this after profile updates
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

  const signUpConsumer = async (data: ConsumerSignupData): Promise<void> => {
    try {
      // Generate internal auth email from phone number (Firebase Auth requires email format)
      // This is only for Firebase Auth internal use, not stored in Firestore
      const authEmail = `${data.phoneNo.replace(/\D/g, '')}@ifh.user`;
      
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        authEmail,
        data.password
      );

      const { user: newUser } = userCredential;

      await updateProfile(newUser, {
        displayName: `${data.firstName} ${data.lastName}`,
      });

      const userProfileData: UserProfile = {
        uid: newUser.uid,
        email: data.email || null, // Only real email if provided
        displayName: `${data.firstName} ${data.lastName}`,
        role: 'consumer',
        createdAt: new Date(),
      };

      const consumerData: Consumer = {
        uid: newUser.uid,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNo: data.phoneNo,
        email: data.email || null,
        address: data.address,
        profileImage: '',
        createdAt: new Date(),
      };

      await Promise.all([
        setDoc(doc(db, 'users', newUser.uid), {
          ...userProfileData,
          createdAt: serverTimestamp(),
        }),
        setDoc(doc(db, 'consumers', newUser.uid), {
          ...consumerData,
          interest: data.interest,
          createdAt: serverTimestamp(),
          // REMOVED: authEmail and hasRealEmail fields
        }),
      ]);

      // Set complete profile immediately after signup
      setUserProfile({
        ...userProfileData,
        firstName: data.firstName,
        lastName: data.lastName,
        profileImage: '',
      });

    } catch (error: any) {
      console.error('Consumer signup error:', error);
      
      if (auth.currentUser) {
        try {
          await auth.currentUser.delete();
        } catch (deleteError) {
          console.error('Failed to cleanup auth user:', deleteError);
        }
      }

      const errorMessages: Record<string, string> = {
        'auth/email-already-in-use': 'An account with this phone number already exists.',
        'auth/invalid-email': 'Invalid phone number format.',
        'auth/operation-not-allowed': 'Account creation is currently disabled.',
        'auth/weak-password': 'Password is too weak. Please use a stronger password.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
      };

      throw new Error(errorMessages[error.code] || `Failed to create account: ${error.message}`);
    }
  };

  const prepareFarmerSignup = async (data: FarmerSignupData): Promise<string> => {
    try {
      // Generate internal auth email from phone number (Firebase Auth requires email format)
      // This is only for Firebase Auth internal use, not stored in Firestore
      const authEmail = `${data.phoneNo.replace(/\D/g, '')}@ifh.farmer`;
      
      const tempId = crypto.randomUUID();
      
      const pendingData = {
        tempId,
        farmerData: data,
        authEmail, // Keep temporarily for account creation after verification
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
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

  const completeFarmerSignup = async (
    tempId: string, 
    verificationData: any
  ): Promise<void> => {
    try {
      const pendingDoc = await getDoc(doc(db, 'pendingFarmers', tempId));
      
      if (!pendingDoc.exists()) {
        throw new Error('Signup session expired. Please start over.');
      }

      const pendingData = pendingDoc.data();
      const data: FarmerSignupData = pendingData.farmerData;

      // Use the temporary authEmail for Firebase Auth account creation
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        pendingData.authEmail,
        data.password
      );

      const { user: newUser } = userCredential;

      await updateProfile(newUser, {
        displayName: `${data.firstName} ${data.lastName}`,
      });

      const userProfileData: UserProfile = {
        uid: newUser.uid,
        email: data.email || null, // Only real email if provided
        displayName: `${data.firstName} ${data.lastName}`,
        role: 'farmer',
        createdAt: new Date(),
      };

      const farmerData: Farmer = {
        uid: newUser.uid,
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
        setDoc(doc(db, 'users', newUser.uid), {
          ...userProfileData,
          createdAt: serverTimestamp(),
          verifiedAt: serverTimestamp(),
        }),
        setDoc(doc(db, 'farmers', newUser.uid), {
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
          // REMOVED: authEmail and hasRealEmail fields
        }),
      ]);

      await setDoc(doc(db, 'pendingFarmers', tempId), {
        ...pendingData,
        status: 'completed',
        completedAt: serverTimestamp(),
        assignedUid: newUser.uid,
      });

      // Set complete profile immediately after signup
      setUserProfile({
        ...userProfileData,
        firstName: data.firstName,
        lastName: data.lastName,
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

      const errorMessages: Record<string, string> = {
        'auth/email-already-in-use': 'An account with this phone number already exists.',
        'auth/invalid-email': 'Invalid phone number format.',
        'auth/operation-not-allowed': 'Account creation is currently disabled.',
        'auth/weak-password': 'Password is too weak.',
      };

      throw new Error(errorMessages[error.code] || `Failed to create account: ${error.message}`);
    }
  };

  const login = async (identifier: string, password: string): Promise<void> => {
    try {
      let authEmail = identifier;
      
      // If identifier looks like a phone number, convert to auth email format
      const phoneRegex = /^(\+63|0)\d{10}$/;
      if (phoneRegex.test(identifier.replace(/\s/g, ''))) {
        const normalizedPhone = identifier.replace(/\s/g, '').replace(/^0/, '+63');
        authEmail = `${normalizedPhone.replace('+', '')}@ifh.user`;
      }

      await signInWithEmailAndPassword(auth, authEmail, password);
    } catch (error: any) {
      const errorMessages: Record<string, string> = {
        'auth/invalid-credential': 'Invalid phone number or password.',
        'auth/user-not-found': 'No account found with this phone number.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
      };
      
      throw new Error(errorMessages[error.code] || 'Failed to sign in. Please try again.');
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setUserProfile(null);
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
    login,
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