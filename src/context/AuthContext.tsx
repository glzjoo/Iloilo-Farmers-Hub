// src/context/AuthContext.tsx
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
import SuspensionNoticeModal from '../components/admin/SuspensionNoticeModal';

interface ExtendedUserProfile extends UserProfile {
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  phoneNo?: string;
  farmName?: string;
  farmType?: string;
  verificationStatus?: string;
  interest?: string;
  address?: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: ExtendedUserProfile | null;
  loading: boolean;
  isLoggedIn: boolean;
  sendOTP: (phoneNo: string) => Promise<ConfirmationResult>;
  verifyOTP: (confirmation: ConfirmationResult, otp: string) => Promise<FirebaseUser>;
  logout: () => Promise<void>;
  signUpConsumer: (data: ConsumerSignupData, confirmation: ConfirmationResult, otp: string) => Promise<void>;
  prepareFarmerSignup: (data: FarmerSignupData) => Promise<string>;
  storeVerificationData: (tempId: string, verificationData: VerificationData) => Promise<void>;
  completeFarmerSignup: (tempId: string, confirmation: ConfirmationResult, otp: string) => Promise<void>;
  getPendingFarmerData: (tempId: string) => Promise<FarmerSignupData | null>;
  refreshProfile: () => Promise<void>;
}

interface VerificationData {
  idType?: string;
  idNumber?: string;
  extractedAddress?: string;
  fullName?: string;
  faceMatchScore?: number;
  faceMatchPassed?: boolean;
  idCardImageUrl?: string;
  selfieImageUrl?: string;
  [key: string]: any;
}

interface FarmerWithLocation extends Farmer {
  farmLocation?: {
    province: string;
    city: string;
    barangay: string;
    coordinates: { lat: number; lng: number };
    accuracy: 'gps' | 'manual_pin' | 'barangay_centroid';
  };
  farmAddressDetails?: string;
  locationGeohash?: string | null;
  locationUpdatedAt?: Date;
  nextLocationUpdateAt?: Date;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<ExtendedUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [suspensionInfo, setSuspensionInfo] = useState<{
    type: 'warning' | '1 week suspension' | '30 days suspension' | 'permanent';
    suspendedUntil?: Date | null;
  } | null>(null);

  const recaptchaVerifierRef = useRef<ApplicationVerifier | null>(null);

  const fetchCompleteProfile = async (firebaseUser: FirebaseUser, baseProfile: UserProfile): Promise<ExtendedUserProfile> => {
    try {
      if (baseProfile.role === 'farmer') {
        const farmerDoc = await getDoc(doc(db, 'farmers', firebaseUser.uid));
        if (farmerDoc.exists()) {
          const farmerData = farmerDoc.data() as FarmerWithLocation;
          return {
            ...baseProfile,
            firstName: farmerData.firstName,
            lastName: farmerData.lastName,
            profileImage: farmerData.profileImage,
            phoneNo: farmerData.phoneNo,
            farmName: farmerData.farmName,
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
            const userData = userDoc.data();
            const suspensionType = userData.suspensionType;

            // Handle warning — show notice but allow login (only if not already acknowledged)
            if (suspensionType === 'warning' && !userData.suspended && !userData.warningAcknowledged) {
              setSuspensionInfo({
                type: 'warning',
                suspendedUntil: null,
              });
              // Don't return — allow login to proceed
            }

            if (userData.suspended) {
              const suspendedUntil = userData.suspendedUntil?.toDate?.();

              if ((suspensionType === '1 week suspension' || suspensionType === '30 days suspension') && suspendedUntil && new Date() > suspendedUntil) {
                // Suspension expired — auto-clear and allow login
                await updateDoc(doc(db, 'users', firebaseUser.uid), {
                  suspended: false,
                  suspensionType: null,
                  suspendedUntil: null,
                });
              } else {
                await signOut(auth);
                setUser(null);
                setUserProfile(null);
                setLoading(false);
                setSuspensionInfo({
                  type: suspensionType || 'permanent',
                  suspendedUntil: suspendedUntil || null,
                });
                return;
              }
            }

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
      if (recaptchaVerifierRef.current) {
        try {
          (recaptchaVerifierRef.current as any).clear();
        } catch (e) {
          // ignore
        }
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

  // FIXED: Proper reCAPTCHA cleanup
  const sendOTP = async (phoneNo: string): Promise<ConfirmationResult> => {
    let normalizedPhone = phoneNo.replace(/\s/g, '');
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '+63' + normalizedPhone.substring(1);
    }
    if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = '+' + normalizedPhone;
    }

    // FIX 1: Properly clear existing reCAPTCHA
    if (recaptchaVerifierRef.current) {
      try {
        (recaptchaVerifierRef.current as any).clear();
      } catch (e) {
        console.log('No previous reCAPTCHA to clear');
      }
      recaptchaVerifierRef.current = null;
    }

    // FIX 2: Ensure container exists and is empty
    let container = document.getElementById('recaptcha-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'recaptcha-container';
      document.body.appendChild(container);
    } else {
      container.innerHTML = '';
    }

    const { RecaptchaVerifier } = await import('firebase/auth');

    recaptchaVerifierRef.current = new RecaptchaVerifier(auth, container, {
      size: 'invisible',
      callback: () => {
        console.log('reCAPTCHA verified');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired - user should resend OTP');
      },
    });

    return await signInWithPhoneNumber(auth, normalizedPhone, recaptchaVerifierRef.current);
  };

  // FIXED: Better error handling with code-expired
  const verifyOTP = async (confirmation: ConfirmationResult, otp: string): Promise<FirebaseUser> => {
    try {
      const result = await confirmation.confirm(otp);
      return result.user;
    } catch (error: any) {
      console.error('Verify OTP error:', error);

      const errorMessages: Record<string, string> = {
        'auth/invalid-verification-code': 'Invalid OTP. Please check and try again.',
        'auth/code-expired': 'This code has expired. Please request a new OTP.',
        'auth/invalid-verification-id': 'Session expired. Please resend the OTP.',
      };

      throw new Error(errorMessages[error.code] || 'Failed to verify OTP. Please try again.');
    }
  };

  const signUpConsumer = async (
    data: ConsumerSignupData,
    confirmation: ConfirmationResult,
    otp: string
  ): Promise<void> => {
    try {
      const firebaseUser = await verifyOTP(confirmation, otp);
      if (!firebaseUser) {
        throw new Error('Failed to create account. Please try again.');
      }

      await updateProfile(firebaseUser, {
        displayName: `${data.firstName} ${data.lastName}`,
      });

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

      setUserProfile({
        ...userProfileData,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNo: data.phoneNo,
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
      throw error;
    }
  };

  const prepareFarmerSignup = async (data: FarmerSignupData): Promise<string> => {
    try {
      const tempId = `farmer_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

      const pendingData = {
        tempId,
        farmerData: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email || null,
          farmName: data.farmName,
          farmLocation: data.farmLocation,
          farmAddressDetails: data.farmAddressDetails || '',
          phoneNo: data.phoneNo,
          farmType: data.farmType,
          agreeToTerms: data.agreeToTerms,
        },
        idVerified: false,
        verificationData: null,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      const docRef = doc(db, 'pendingFarmers', tempId);
      await setDoc(docRef, pendingData);

      try {
        sessionStorage.setItem('farmerSignupTempId', tempId);
        sessionStorage.setItem(`farmerSignup_${tempId}`, JSON.stringify({
          farmerData: data,
          idVerified: false,
          timestamp: Date.now(),
        }));
      } catch (e) {
        console.warn('sessionStorage failed:', e);
      }

      return tempId;
    } catch (error: any) {
      console.error('prepareFarmerSignup FAILED:', error);
      throw new Error(`Failed to initialize signup: ${error.message}`);
    }
  };

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

  const getPendingFarmerData = async (tempId: string): Promise<FarmerSignupData | null> => {
    try {
      const pendingDoc = await getDoc(doc(db, 'pendingFarmers', tempId));
      if (pendingDoc.exists()) {
        return pendingDoc.data().farmerData as FarmerSignupData;
      }
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

      const result = await confirmation.confirm(otp);
      const firebaseUser = result.user;

      if (!firebaseUser) {
        throw new Error('Failed to create account. Please try again.');
      }

      await updateProfile(firebaseUser, {
        displayName: `${data.firstName} ${data.lastName}`,
      });

      const userProfileData: UserProfile = {
        uid: firebaseUser.uid,
        email: data.email || null,
        displayName: `${data.firstName} ${data.lastName}`,
        role: 'farmer',
        createdAt: new Date(),
      };

      const geofireCommon = await import('geofire-common');
      const geohash = data.farmLocation?.coordinates
        ? geofireCommon.geohashForLocation([data.farmLocation.coordinates.lat, data.farmLocation.coordinates.lng])
        : null;

      const displayAddress = data.farmLocation
        ? `${data.farmLocation.barangay}, ${data.farmLocation.city}, ${data.farmLocation.province}`
        : 'Address not provided';

      const farmerData: FarmerWithLocation = {
        uid: firebaseUser.uid,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNo: data.phoneNo,
        email: data.email || null,
        idType: verificationData.idType || 'phNationalId',
        cardAddress: verificationData.extractedAddress || displayAddress,
        profileImage: '',
        createdAt: new Date(),
        farmName: data.farmName,
        farmType: data.farmType,
        farmLocation: data.farmLocation,
        farmAddressDetails: data.farmAddressDetails || '',
        locationGeohash: geohash,
        locationUpdatedAt: data.farmLocation ? new Date() : undefined,
        nextLocationUpdateAt: data.farmLocation ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) : undefined,
      };

      const sanitize = (val: any) => val === undefined ? null : val;

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...userProfileData,
        createdAt: serverTimestamp(),
        verifiedAt: serverTimestamp(),
      });

      await setDoc(doc(db, 'farmers', firebaseUser.uid), {
        ...farmerData,
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

      await deleteDoc(doc(db, 'pendingFarmers', tempId));
      sessionStorage.removeItem(`farmerSignup_${tempId}`);
      sessionStorage.removeItem('farmerSignupTempId');

      setUserProfile({
        ...userProfileData,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNo: data.phoneNo,
        profileImage: '',
        farmName: data.farmName,
        farmType: data.farmType,
        verificationStatus: 'verified',
      });
    } catch (error: any) {
      console.error('Complete farmer signup error:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setUserProfile(null);
      if (recaptchaVerifierRef.current) {
        try {
          (recaptchaVerifierRef.current as any).clear();
        } catch (e) {
          // ignore
        }
        recaptchaVerifierRef.current = null;
      }
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
      {suspensionInfo && (
        <SuspensionNoticeModal
          type={suspensionInfo.type}
          suspendedUntil={suspensionInfo.suspendedUntil}
          onClose={async () => {
            if (suspensionInfo.type === 'warning' && user) {
              try {
                await updateDoc(doc(db, 'users', user.uid), {
                  warningAcknowledged: true
                });
              } catch (e) {
                console.error('Failed to acknowledge warning', e);
              }
            }
            setSuspensionInfo(null);
          }}
        />
      )}
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