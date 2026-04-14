import { useNavigate } from 'react-router-dom';
//ActionGuardmodal
interface ActionGuardModalProps {
    isOpen: boolean;
    action: 'addToCart' | 'messageSeller' | 'buyNow';
    userRole: 'guest' | 'farmer' | 'consumer';
    onClose: () => void;
}

export default function ActionGuardModal({ 
    isOpen, 
    action, 
    userRole, 
    onClose 
}: ActionGuardModalProps) {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const actionLabels: Record<string, string> = {
        addToCart: 'add items to cart',
        messageSeller: 'message sellers',
        buyNow: 'make purchases'
    };

    const handleLogin = () => {
        navigate('/login');
        onClose();
    };

    const handleRegister = () => {
        navigate('/consumer-signup');
        onClose();
    };

    // Guest view - prompt to login/register
    if (userRole === 'guest') {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Login Required
                        </h3>
                        <p className="text-gray-600">
                            Please login or create an account to {actionLabels[action]}.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleLogin}
                            className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-green-700 transition-colors"
                        >
                            Login
                        </button>
                        <button
                            onClick={handleRegister}
                            className="w-full border-2 border-primary text-primary font-semibold py-3 rounded-xl hover:bg-green-50 transition-colors"
                        >
                            Create Account
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full text-gray-500 font-medium py-2 hover:text-gray-700 transition-colors"
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Farmer view - explain consumer-only feature
    if (userRole === 'farmer') {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Consumer Feature Only
                        </h3>
                        <p className="text-gray-600">
                            This feature is designed for buyers. As a farmer, you can browse products but cannot {actionLabels[action]}. Switch to a consumer account to use this feature.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={onClose}
                            className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-green-700 transition-colors"
                        >
                            Got it
                        </button>
                        <button
                            onClick={() => {
                                navigate('/shop');
                                onClose();
                            }}
                            className="w-full text-gray-500 font-medium py-2 hover:text-gray-700 transition-colors"
                        >
                            Continue Browsing
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}