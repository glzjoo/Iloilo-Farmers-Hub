interface IDVerificationSuccessModalProps {
  verificationResult: any;
  farmerData: {
    firstName: string;
    lastName: string;
    phoneNo: string;
  };
  onContinue: () => void;
}

export default function IDVerificationSuccessModal({ 
  verificationResult, 
  farmerData, 
  onContinue 
}: IDVerificationSuccessModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="font-primary font-bold text-2xl text-gray-800 mb-2">
          ID Verification Passed!
        </h2>
        
        <p className="text-gray-600 mb-4">
          Great job, {farmerData.firstName}! Your identity has been verified successfully.
        </p>

        {/* Next Step Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800 font-semibold text-sm mb-1">📱 Next Step: Phone Verification</p>
          <p className="text-blue-600 text-sm">
            We'll send a 6-digit OTP to <span className="font-bold">{farmerData.phoneNo}</span> to secure your account.
          </p>
        </div>

        {/* Verification Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Face Match Score:</span>{' '}
            {verificationResult?.verification?.faceMatch?.score ?? 'N/A'}%
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">ID Type:</span>{' '}
            {verificationResult?.verification?.idData?.idType || 'National ID'}
          </p>
          {verificationResult?.verification?.idData?.fullName && (
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Verified Name:</span>{' '}
              {verificationResult.verification.idData.fullName}
            </p>
          )}
        </div>

        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="w-full py-3 rounded-full bg-primary text-white font-primary font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
        >
          Continue to Phone Verification
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <p className="mt-4 text-xs text-gray-400">
          Step 2 of 3 complete • No password needed!
        </p>
      </div>
    </div>
  );
}