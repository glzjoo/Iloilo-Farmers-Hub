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
  signUpFarmer: (data: FarmerSignupData) => Promise<void>;
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
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      const { user: newUser } = userCredential;

      await updateProfile(newUser, {
        displayName: `${data.firstName} ${data.lastName}`,
      });

      const userProfileData: UserProfile = {
        uid: newUser.uid,
        email: data.email,
        displayName: `${data.firstName} ${data.lastName}`,
        role: 'consumer',
        createdAt: new Date(),
      };

      const consumerData: Consumer = {
        uid: newUser.uid,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNo: data.phoneNo,
        email: data.email,
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
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/operation-not-allowed': 'Account creation is currently disabled.',
        'auth/weak-password': 'Password is too weak. Please use a stronger password.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
      };

      throw new Error(errorMessages[error.code] || `Failed to create account: ${error.message}`);
    }
  };

  const signUpFarmer = async (data: FarmerSignupData): Promise<void> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      const { user: newUser } = userCredential;

      await updateProfile(newUser, {
        displayName: `${data.firstName} ${data.lastName}`,
      });

      const userProfileData: UserProfile = {
        uid: newUser.uid,
        email: data.email,
        displayName: `${data.firstName} ${data.lastName}`,
        role: 'farmer',
        createdAt: new Date(),
      };

      const farmerData: Farmer = {
        uid: newUser.uid,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNo: data.phoneNo,
        email: data.email,
        idType: 'pending', // Will be updated after ID verification
        cardAddress: data.farmAddress, // Using farm address as card address for now
        profileImage: '',
        createdAt: new Date(),
      };

      await Promise.all([
        setDoc(doc(db, 'users', newUser.uid), {
          ...userProfileData,
          createdAt: serverTimestamp(),
        }),
        setDoc(doc(db, 'farmers', newUser.uid), {
          ...farmerData,
          farmName: data.farmName,
          farmAddress: data.farmAddress,
          farmType: data.farmType,
          verificationStatus: 'pending', // pending, verified, rejected
          createdAt: serverTimestamp(),
        }),
      ]);

      setUserProfile(userProfileData);

    } catch (error: any) {
      console.error('Farmer signup error:', error);
      
      if (auth.currentUser) {
        try {
          await auth.currentUser.delete();
        } catch (deleteError) {
          console.error('Failed to cleanup auth user:', deleteError);
        }
      }

      const errorMessages: Record<string, string> = {
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/operation-not-allowed': 'Account creation is currently disabled.',
        'auth/weak-password': 'Password is too weak. Please use a stronger password.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
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
    signUpFarmer,
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