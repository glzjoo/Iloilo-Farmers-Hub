import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/icons/logo.png';
import type { FarmerSignupData } from '../../lib/validations';
import CameraCapture from './CameraCapture';
import IDVerificationSuccessModal from './IDVerificationSuccessModal'; // Changed from SuccessModal
import IDUploadSection from './IDUploadSection';
import SelfieCaptureSection from './SelfieCaptureSection';
import VerificationInfoCard from './VerificationInfoCard';

const idVerificationSchema = z.object({
  idType: z.enum(['passport', 'drivers_license', 'national_id', 'umid', 'other']),
  idNumber: z.string().min(5, 'ID number is required'),
  agreeToVerification: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the verification process',
  }),
});

type IDVerificationFormData = z.infer<typeof idVerificationSchema>;

const API_URL = import.meta.env.VITE_VERIFICATION_API_URL || 'http://localhost:3001';

export default function IDVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { storeVerificationData } = useAuth();
  
  const { tempId, farmerData } = location.state as { 
    tempId: string; 
    farmerData: FarmerSignupData;
  } || {};

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [idImage, setIdImage] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IDVerificationFormData>({
    resolver: zodResolver(idVerificationSchema),
    defaultValues: {
      idType: 'national_id',
      idNumber: '',
      agreeToVerification: false,
    },
  });

  useEffect(() => {
    if (!tempId) {
      navigate('/farmer-signup', { 
        replace: true,
        state: { error: 'Please complete the signup form first' }
      });
    }
  }, [tempId, navigate]);

  const handleCapture = (file: File) => {
    setSelfieFile(file);
    setSelfiePreview(URL.createObjectURL(file));
    setShowCamera(false);
  };

  const handleCancelCamera = () => {
    setShowCamera(false);
  };

  const handleRetake = () => {
    setSelfieFile(null);
    setSelfiePreview(null);
    setShowCamera(true);
  };

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }
    setIdImage(file);
    setIdPreview(URL.createObjectURL(file));
    setError(null);
  };

  const checkNameMatch = (extractedName: string, formData: FarmerSignupData): boolean => {
    if (!extractedName) return false;
    
    const normalize = (str: string) => 
      str.toLowerCase()
         .replace(/[^a-z\s]/g, '')
         .replace(/\s+/g, ' ')
         .trim();
    
    const extracted = normalize(extractedName);
    const registered = normalize(`${formData.firstName} ${formData.lastName}`);
    
    const extractedWords = extracted.split(' ');
    const registeredWords = registered.split(' ');
    
    let extractedIndex = 0;
    let matchedWords = 0;
    
    for (const regWord of registeredWords) {
      const foundIndex = extractedWords.slice(extractedIndex).findIndex(extWord => 
        extWord.includes(regWord) || 
        regWord.includes(extWord) ||
        calculateSimilarity(extWord, regWord) > 0.8
      );
      
      if (foundIndex !== -1) {
        matchedWords++;
        extractedIndex += foundIndex + 1;
      }
    }
    
    return matchedWords === registeredWords.length;
  };

  const calculateSimilarity = (str1: string, str2: string): number => {
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0 || len2 === 0) return 0;
    
    if (str1.includes(str2) || str2.includes(str1)) {
      const longer = Math.max(len1, len2);
      const shorter = Math.min(len1, len2);
      return shorter / longer;
    }
    
    const matrix: number[][] = [];
    
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    
    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    
    return 1 - distance / maxLen;
  };

  const handleContinueToOTP = async () => {
    try {
      await storeVerificationData(tempId, {
        idType: verificationResult?.verification?.idData?.idType || 'national_id',
        faceMatchScore: verificationResult?.verification?.faceMatch?.score ?? null,
        faceMatchPassed: verificationResult?.verification?.faceMatch?.passed ?? null,
        idNumber: verificationResult?.verification?.idData?.idNumber ?? null,
        fullName: verificationResult?.verification?.idData?.fullName ?? null,
        extractedAddress: verificationResult?.verification?.idData?.address ?? null,
        idCardImageUrl: verificationResult?.idCardUrl ?? null,
        selfieImageUrl: verificationResult?.selfieUrl ?? null,
      });

      navigate('/otp-verification', {
        state: {
          tempId,
          phoneNumber: farmerData.phoneNo,
          userType: 'farmer',
          purpose: 'signup'
        }
      });
    } catch (error: any) {
      setError(`Failed to save verification: ${error.message}. Please try again.`);
      setShowSuccessModal(false);
    }
  };

  const onSubmit = async (data: IDVerificationFormData) => {
    if (!idImage || !selfieFile) {
      setError('Please upload your ID and capture a live selfie');
      return;
    }

    if (!tempId) {
      setError('Session expired. Please start signup again.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('idImage', idImage);
      formData.append('selfieImage', selfieFile);
      formData.append('tempId', tempId);
      formData.append('idType', data.idType);
      formData.append('idNumber', data.idNumber);

      const response = await fetch(`${API_URL}/api/verify-farmer-id`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Verification failed');
      }

      setVerificationResult(result);
      setAttemptsLeft(prev => prev - 1);

      const nameMatches = checkNameMatch(
        result.verification?.idData?.fullName, 
        farmerData
      );

      if (result.verified && nameMatches) {
        setShowSuccessModal(true);
        
      } else if (result.verified && !nameMatches) {
        const extracted = result.verification?.idData?.fullName || 'Unknown';
        const registered = `${farmerData.firstName} ${farmerData.lastName}`;
        
        setError(
          `Name mismatch detected.\n\n` +
          `ID shows: "${extracted}"\n` +
          `You registered: "${registered}"\n\n` +
          `Please ensure your registered name matches your ID exactly, including:\n` +
          `• Middle names or maiden names\n` +
          `• Correct spelling\n` +
          `• Full first name (not nicknames)`
        );
      } else {
        if (attemptsLeft <= 1) {
          setError('Maximum verification attempts reached. Please start registration again.');
          setTimeout(() => navigate('/farmer-signup', { replace: true }), 3000);
        } else {
          setError(`Verification failed: ${result.verification?.faceMatch?.message || 'Face does not match ID'}. You have ${attemptsLeft - 1} attempts left.`);
        }
      }

    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Failed to verify identity. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setVerificationResult(null);
    setIdImage(null);
    setIdPreview(null);
    setSelfieFile(null);
    setSelfiePreview(null);
    setError(null);
  };

  const handleGoBack = () => {
    navigate('/farmer-signup', { 
      replace: true,
      state: { farmerData }
    });
  };

  const getInputClass = (fieldName: keyof IDVerificationFormData) => {
    const baseClass = "w-full border rounded-lg px-4 py-2.5 text-sm font-primary outline-none transition-colors";
    return errors[fieldName] 
      ? `${baseClass} border-red-500 focus:border-red-500 bg-red-50` 
      : `${baseClass} border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary`;
  };

  if (!tempId) {
    return (
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-10 text-center">
        <p className="text-gray-600">Redirecting to signup...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-10">
      {showCamera && (
        <CameraCapture 
          onCapture={handleCapture}
          onCancel={handleCancelCamera}
        />
      )}

      {showSuccessModal && (
        <IDVerificationSuccessModal
          verificationResult={verificationResult}
          farmerData={farmerData}
          onContinue={handleContinueToOTP}
        />
      )}

      <div className="text-center mb-8">
        <img src={logo} className="w-16 h-16 rounded-full object-cover mx-auto mb-4" alt="Logo" />
        <h1 className="font-primary font-bold text-2xl text-gray-800">Farmer ID Verification</h1>
        <p className="text-gray-600 mt-2">
          Please verify your identity to continue registration
        </p>
        <p className="text-sm text-blue-600 mt-2 font-medium">
          Step 2 of 3: ID Verification → OTP Verification
        </p>
      </div>

      <VerificationInfoCard farmerData={farmerData} />

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm font-primary whitespace-pre-line">{error}</p>
          {attemptsLeft > 0 && attemptsLeft < 3 && (
            <button 
              onClick={handleRetry}
              className="mt-2 text-sm text-primary hover:underline font-medium"
            >
              Try with different photos
            </button>
          )}
        </div>
      )}

      {verificationResult && !verificationResult.verified && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-600 text-xl">⚠</span>
            <h3 className="font-semibold text-yellow-800">Verification Failed</h3>
          </div>
          <div className="text-sm text-gray-700 space-y-1">
            <p>Face Match Score: {verificationResult.verification?.faceMatch?.score}% (Required: 80%)</p>
            <p>Attempts remaining: {attemptsLeft}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-primary font-semibold text-gray-800 mb-2">
            ID Type <span className="text-red-500">*</span>
          </label>
          <select {...register('idType')} className={getInputClass('idType')}>
            <option value="national_id">Philsys National ID</option>
            <option value="drivers_license">Driver's License (LTO)</option>
            <option value="umid">UMID (SSS/GSIS)</option>
            <option value="passport">Philippine Passport</option>
            <option value="other">Other Government ID</option>
          </select>
          {errors.idType && <p className="mt-1 text-xs text-red-500 font-primary">{errors.idType.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-primary font-semibold text-gray-800 mb-2">
            ID Number <span className="text-red-500">*</span>
          </label>
          <input {...register('idNumber')} type="text" placeholder="Enter ID number as shown on your card" className={getInputClass('idNumber')} />
          {errors.idNumber && <p className="mt-1 text-xs text-red-500 font-primary">{errors.idNumber.message}</p>}
        </div>

        <IDUploadSection 
          idPreview={idPreview}
          onImageSelect={handleImageSelect}
        />

        <SelfieCaptureSection 
          selfiePreview={selfiePreview}
          onOpenCamera={() => setShowCamera(true)}
          onRetake={handleRetake}
        />

        <div className="flex items-start gap-3">
          <input {...register('agreeToVerification')} type="checkbox" className="w-4 h-4 mt-1 accent-primary cursor-pointer" />
          <label className="text-sm font-primary text-gray-600">
            I consent to the ID verification process. I confirm that the information provided is accurate 
            and I am the person in the ID and selfie. I understand that false information will result in 
            account suspension and legal action.
          </label>
        </div>
        {errors.agreeToVerification && <p className="text-xs text-red-500 font-primary">{errors.agreeToVerification.message}</p>}

        <button
          type="submit"
          disabled={isLoading || !idImage || !selfieFile}
          className="w-full py-3 rounded-full bg-primary text-white font-primary font-bold cursor-pointer hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verifying...
            </>
          ) : (
            'Verify Identity'
          )}
        </button>

        <button
          type="button"
          onClick={handleGoBack}
          disabled={isLoading}
          className="w-full py-3 rounded-full border-2 border-gray-300 text-gray-600 font-primary font-bold hover:bg-gray-50 transition-colors"
        >
          Back to Registration
        </button>
      </form>
    </div>
  );
}