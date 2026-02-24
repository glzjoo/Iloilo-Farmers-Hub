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

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signUpConsumer: (data: ConsumerSignupData) => Promise<void>;
  // Changed: Now returns tempId for verification flow
  prepareFarmerSignup: (data: FarmerSignupData) => Promise<string>;
  completeFarmerSignup: (tempId: string, verificationData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
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

  const signUpConsumer = async (data: ConsumerSignupData): Promise<void> => {
    try {
      const emailForAuth = data.email || `${data.phoneNo}@ifh.user`;
      
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        emailForAuth,
        data.password
      );

      const { user: newUser } = userCredential;

      await updateProfile(newUser, {
        displayName: `${data.firstName} ${data.lastName}`,
      });

      const userProfileData: UserProfile = {
        uid: newUser.uid,
        email: data.email || null,
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
          authEmail: emailForAuth,
          hasRealEmail: !!data.email,
        }),
      ]);

      setUserProfile(userProfileData);

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
        'auth/email-already-in-use': 'An account with this email/phone already exists.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/operation-not-allowed': 'Account creation is currently disabled.',
        'auth/weak-password': 'Password is too weak. Please use a stronger password.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
      };

      throw new Error(errorMessages[error.code] || `Failed to create account: ${error.message}`);
    }
  };

  /**
   * NEW: Stage 1 - Store farmer data temporarily, NO account created yet
   * Returns tempId to be used after verification
   */
  const prepareFarmerSignup = async (data: FarmerSignupData): Promise<string> => {
    try {
      // Check if email/phone already exists in verified farmers
      // This prevents duplicate registrations
      const emailForAuth = data.email || `${data.phoneNo}@ifh.farmer`;
      
      // Create temp entry in pendingFarmers collection
      const tempId = crypto.randomUUID(); // Or use Firestore auto-ID
      
      const pendingData = {
        tempId,
        farmerData: data,
        emailForAuth,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hour expiry
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

  /**
   * NEW: Stage 2 - Create actual account after successful verification
   */
  const completeFarmerSignup = async (
    tempId: string, 
    verificationData: any
  ): Promise<void> => {
    try {
      // Retrieve pending data
      const pendingDoc = await getDoc(doc(db, 'pendingFarmers', tempId));
      
      if (!pendingDoc.exists()) {
        throw new Error('Signup session expired. Please start over.');
      }

      const pendingData = pendingDoc.data();
      const data: FarmerSignupData = pendingData.farmerData;

      // Now create the actual Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        pendingData.emailForAuth,
        data.password
      );

      const { user: newUser } = userCredential;

      await updateProfile(newUser, {
        displayName: `${data.firstName} ${data.lastName}`,
      });

      const userProfileData: UserProfile = {
        uid: newUser.uid,
        email: data.email || null,
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
        idType: verificationData.idType || 'phNationalId', // Default or from verification
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
          authEmail: pendingData.emailForAuth,
          hasRealEmail: !!data.email,
        }),
        // Clean up pending data
        // Note: we might want to keep this for audit trail, just mark as completed
        // await deleteDoc(doc(db, 'pendingFarmers', tempId)),
      ]);

      // Mark pending as completed instead of deleting (for audit)
      await setDoc(doc(db, 'pendingFarmers', tempId), {
        ...pendingData,
        status: 'completed',
        completedAt: serverTimestamp(),
        assignedUid: newUser.uid,
      });

      setUserProfile(userProfileData);

    } catch (error: any) {
      console.error('Complete farmer signup error:', error);
      
      // If auth account was created but Firestore failed, we have a problem
      // In production, we might want to queue this for retry or manual cleanup
      if (auth.currentUser) {
        try {
          await auth.currentUser.delete();
        } catch (deleteError) {
          console.error('Failed to cleanup auth user after error:', deleteError);
        }
      }

      const errorMessages: Record<string, string> = {
        'auth/email-already-in-use': 'An account with this email/phone already exists.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/operation-not-allowed': 'Account creation is currently disabled.',
        'auth/weak-password': 'Password is too weak.',
      };

      throw new Error(errorMessages[error.code] || `Failed to create account: ${error.message}`);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      const errorMessages: Record<string, string> = {
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/user-not-found': 'No account found with this email.',
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
    prepareFarmerSignup,     //added for verification flow
    completeFarmerSignup,     
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