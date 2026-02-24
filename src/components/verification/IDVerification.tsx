import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/icons/logo.png';
import type { FarmerSignupData } from '../../lib/validations';

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
  const { completeFarmerSignup } = useAuth();
  
  const { tempId, farmerData } = location.state as { 
    tempId: string; 
    farmerData: FarmerSignupData;
  } || {};

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [idImage, setIdImage] = useState<File | null>(null);
  const [selfieImage, setSelfieImage] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  
  const idInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!tempId) {
      navigate('/farmer-signup', { 
        replace: true,
        state: { error: 'Please complete the signup form first' }
      });
    }
  }, [tempId, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IDVerificationFormData>({
    resolver: zodResolver(idVerificationSchema),
    defaultValues: {
      idType: 'drivers_license',
      idNumber: '',
      agreeToVerification: false,
    },
  });

  // SOLUTION 1: Fuzzy name matching with Levenshtein distance
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

  // Helper: Calculate string similarity using Levenshtein distance
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

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'id' | 'selfie') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === 'id') {
        setIdImage(file);
        setIdPreview(result);
      } else {
        setSelfieImage(file);
        setSelfiePreview(result);
      }
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const triggerSelfie = () => {
    if (selfieInputRef.current) {
      selfieInputRef.current.setAttribute('capture', 'user');
      selfieInputRef.current.click();
    }
  };

  const onSubmit = async (data: IDVerificationFormData) => {
    if (!idImage || !selfieImage) {
      setError('Please upload both ID and selfie images');
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
      formData.append('selfieImage', selfieImage);
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

      // Use fuzzy name matching
      const nameMatches = checkNameMatch(
        result.verification?.idData?.fullName, 
        farmerData
      );

      if (result.verified && nameMatches) {
        setIsCreatingAccount(true);
        
        try {
          await completeFarmerSignup(tempId, {
            idType: data.idType,
            faceMatchScore: result.verification?.faceMatch?.score,
            faceMatchPassed: result.verification?.faceMatch?.passed,
            idNumber: result.verification?.idData?.idNumber,
            fullName: result.verification?.idData?.fullName,
            address: result.verification?.idData?.address,
            idCardUrl: result.idCardUrl,
            selfieUrl: result.selfieUrl,
          });
          
          setShowSuccessModal(true);
        } catch (accountError: any) {
          setError(`Verification passed but account creation failed: ${accountError.message}. Please try again.`);
        } finally {
          setIsCreatingAccount(false);
        }
      } else if (result.verified && !nameMatches) {
        // Better error message with suggestions
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

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate('/login', { 
      replace: true,
      state: { message: 'Account created successfully! Please log in with your credentials.' }
    });
  };

  const handleGoToProfile = () => {
    setShowSuccessModal(false);
    navigate('/profile', { replace: true });
  };

  const handleRetry = () => {
    setVerificationResult(null);
    setIdImage(null);
    setSelfieImage(null);
    setIdPreview(null);
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
      {/* Header */}
      <div className="text-center mb-8">
        <img src={logo} className="w-16 h-16 rounded-full object-cover mx-auto mb-4" alt="Logo" />
        <h1 className="font-primary font-bold text-2xl text-gray-800">Farmer ID Verification</h1>
        <p className="text-gray-600 mt-2">
          Please verify your identity to complete your registration
        </p>
      </div>

      {/* Cross-reference Info Card */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Registration Details</h3>
        <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
          <p><span className="font-medium">Name:</span> {farmerData?.firstName} {farmerData?.lastName}</p>
          <p><span className="font-medium">Farm:</span> {farmerData?.farmName}</p>
          <p><span className="font-medium">Phone:</span> {farmerData?.phoneNo}</p>
          <p><span className="font-medium">Email:</span> {farmerData?.email || 'N/A'}</p>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          Ensure your ID name matches "{farmerData?.firstName} {farmerData?.lastName}" (middle names OK)
        </p>
      </div>

      {/* Error Display - Now with better formatting for multi-line errors */}
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

      {/* Verification Result (when failed/pending) */}
      {verificationResult && !verificationResult.verified && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-600 text-xl">⚠</span>
            <h3 className="font-semibold text-yellow-800">Verification Failed</h3>
          </div>
          <div className="text-sm text-gray-700 space-y-1">
            <p>Face Match Score: {verificationResult.verification?.faceMatch?.score}% 
              (Required: 80%)
            </p>
            <p>Attempts remaining: {attemptsLeft}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ID Type Selection */}
        <div>
          <label className="block text-sm font-primary font-semibold text-gray-800 mb-2">
            ID Type <span className="text-red-500">*</span>
          </label>
          <select
            {...register('idType')}
            className={getInputClass('idType')}
          >
            <option value="drivers_license">Driver's License (LTO)</option>
            <option value="national_id">Philsys National ID</option>
            <option value="umid">UMID (SSS/GSIS)</option>
            <option value="passport">Philippine Passport</option>
            <option value="other">Other Government ID</option>
          </select>
          {errors.idType && (
            <p className="mt-1 text-xs text-red-500 font-primary">{errors.idType.message}</p>
          )}
        </div>

        {/* ID Number */}
        <div>
          <label className="block text-sm font-primary font-semibold text-gray-800 mb-2">
            ID Number <span className="text-red-500">*</span>
          </label>
          <input
            {...register('idNumber')}
            type="text"
            placeholder="Enter ID number as shown on your card"
            className={getInputClass('idNumber')}
          />
          {errors.idNumber && (
            <p className="mt-1 text-xs text-red-500 font-primary">{errors.idNumber.message}</p>
          )}
        </div>

        {/* ID Image Upload */}
        <div>
          <label className="block text-sm font-primary font-semibold text-gray-800 mb-2">
            ID Card Photo <span className="text-red-500">*</span>
          </label>
          <div 
            onClick={() => idInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              idPreview ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-primary hover:bg-gray-50'
            }`}
          >
            {idPreview ? (
              <div className="relative">
                <img src={idPreview} alt="ID Preview" className="max-h-48 mx-auto rounded shadow" />
                <p className="text-green-600 text-sm mt-2 font-primary">✓ ID uploaded</p>
                <p className="text-xs text-gray-500">Click to change</p>
              </div>
            ) : (
              <div className="text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
                </svg>
                <p className="font-primary text-sm">Click to upload ID card</p>
                <p className="text-xs text-gray-400 mt-1">Clear photo of front side</p>
              </div>
            )}
            <input
              ref={idInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImageSelect(e, 'id')}
              className="hidden"
            />
          </div>
        </div>

        {/* Selfie Upload */}
        <div>
          <label className="block text-sm font-primary font-semibold text-gray-800 mb-2">
            Selfie Photo <span className="text-red-500">*</span>
          </label>
          <div 
            onClick={triggerSelfie}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              selfiePreview ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-primary hover:bg-gray-50'
            }`}
          >
            {selfiePreview ? (
              <div className="relative">
                <img src={selfiePreview} alt="Selfie Preview" className="max-h-48 mx-auto rounded-full shadow w-32 h-32 object-cover" />
                <p className="text-green-600 text-sm mt-2 font-primary">✓ Selfie uploaded</p>
                <p className="text-xs text-gray-500">Click to retake</p>
              </div>
            ) : (
              <div className="text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="font-primary text-sm">Click to take selfie</p>
                <p className="text-xs text-gray-400 mt-1">Face must match your ID photo</p>
              </div>
            )}
            <input
              ref={selfieInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={(e) => handleImageSelect(e, 'selfie')}
              className="hidden"
            />
          </div>
        </div>

        {/* Agreement */}
        <div className="flex items-start gap-3">
          <input
            {...register('agreeToVerification')}
            type="checkbox"
            className="w-4 h-4 mt-1 accent-primary cursor-pointer"
          />
          <label className="text-sm font-primary text-gray-600">
            I consent to the ID verification process. I confirm that the information provided is accurate 
            and I am the person in the ID and selfie. I understand that false information will result in 
            account suspension and legal action.
          </label>
        </div>
        {errors.agreeToVerification && (
          <p className="text-xs text-red-500 font-primary">{errors.agreeToVerification.message}</p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || isCreatingAccount || !idImage || !selfieImage}
          className="w-full py-3 rounded-full bg-primary text-white font-primary font-bold cursor-pointer hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg transition-colors flex items-center justify-center gap-2"
        >
          {isCreatingAccount ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Account...
            </>
          ) : isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verifying...
            </>
          ) : (
            'Verify & Create Account'
          )}
        </button>

        {/* Go Back Button */}
        <button
          type="button"
          onClick={handleGoBack}
          disabled={isLoading || isCreatingAccount}
          className="w-full py-3 rounded-full border-2 border-gray-300 text-gray-600 font-primary font-bold hover:bg-gray-50 transition-colors"
        >
          Back to Registration
        </button>
      </form>

      {/* Help */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-400">
          Your data is encrypted and securely processed. 
          <button onClick={() => navigate('/')} className="text-primary hover:underline ml-1">
            Cancel and return home
          </button>
        </p>
      </div>

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 className="font-primary font-bold text-2xl text-gray-800 mb-2">
              Account Created Successfully!
            </h2>
            
            <p className="text-gray-600 mb-6">
              Your identity has been verified and your farmer account is now active. 
              Welcome to Iloilo Farmers Hub!
            </p>

            {/* Verification Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Face Match:</span>{' '}
                {verificationResult?.verification?.faceMatch?.confidence} (
                {verificationResult?.verification?.faceMatch?.score}%)
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">ID Type:</span>{' '}
                {verificationResult?.verification?.idData?.idType}
              </p>
              {verificationResult?.verification?.idData?.fullName && (
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Verified Name:</span>{' '}
                  {verificationResult.verification.idData.fullName}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleSuccessClose}
                className="w-full py-3 rounded-full bg-primary text-white font-primary font-bold hover:bg-green-700 transition-colors"
              >
                Log In Now
              </button>
              
              <button
                onClick={handleGoToProfile}
                className="w-full py-3 rounded-full border-2 border-primary text-primary font-primary font-bold hover:bg-green-50 transition-colors"
              >
                View My Profile
              </button>
            </div>

            <p className="mt-4 text-xs text-gray-400">
              A confirmation has been sent to {farmerData?.email || farmerData?.phoneNo}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}