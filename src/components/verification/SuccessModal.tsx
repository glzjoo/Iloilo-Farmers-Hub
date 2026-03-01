interface SuccessModalProps {
  farmerData: {
    firstName: string;
    lastName: string;
    email?: string;
    phoneNo: string;
  };
  onLogin: () => void;
  onProfile: () => void;
}

export default function SuccessModal({ farmerData, onLogin, onProfile }: SuccessModalProps) {
  return (
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
          Welcome to Iloilo Farmers Hub, {farmerData.firstName}! Your farmer account is now active and ready to use.
        </p>

        {/* Account Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Name:</span> {farmerData.firstName} {farmerData.lastName}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Phone:</span> {farmerData.phoneNo}
          </p>
          {farmerData.email && (
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Email:</span> {farmerData.email}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onLogin}
            className="w-full py-3 rounded-full bg-primary text-white font-primary font-bold hover:bg-green-700 transition-colors"
          >
            Go to Dashboard
          </button>
          
          <button
            onClick={onProfile}
            className="w-full py-3 rounded-full border-2 border-primary text-primary font-primary font-bold hover:bg-green-50 transition-colors"
          >
            Complete Your Profile
          </button>
        </div>

        <p className="mt-4 text-xs text-gray-400">
          You can now start selling your products!
        </p>
      </div>
    </div>
  );
}