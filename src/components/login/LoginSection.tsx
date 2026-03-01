import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/icons/logo.png';

export default function LoginSection() {
    const navigate = useNavigate();
    const { sendOTP } = useAuth();
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setError('');

        const digits = phone.replace(/\D/g, '');
        let formattedPhone = '';

        if (digits.startsWith('63') && digits.length === 12) {
            formattedPhone = `+${digits}`;
        } else if (digits.startsWith('0') && digits.length === 11) {
            formattedPhone = `+63${digits.slice(1)}`;
        } else if (digits.length === 10 && digits.startsWith('9')) {
            formattedPhone = `+63${digits}`;
        } else {
            setError('Enter a valid PH number (e.g. 09123456789)');
            return;
        }

        try {
            setLoading(true);

            await sendOTP(formattedPhone);

            sessionStorage.setItem('loginConfirmation', 'true');
            sessionStorage.setItem('loginPhone', formattedPhone);

            navigate('/login/otp-verification', {
                state: {
                    phoneNo: formattedPhone,
                    flow: 'login'
                }
            });

        } catch (err: any) {
            setError(err.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="flex items-center justify-center py-16 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <img src={logo} className="w-11 h-11 rounded-full object-cover" alt="Logo" />
                    <span className="font-primary font-bold text-lg tracking-wide whitespace-nowrap">ILOILO FARMERS HUB</span>
                </div>

                <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-700 text-xs font-primary text-center">
                        📱 Enter your phone number. We'll send a 6-digit OTP to verify your identity.
                    </p>
                </div>

                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-primary font-medium text-gray-700 mb-1">
                            Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => {
                                const digitsOnly = e.target.value.replace(/\D/g, '');
                                setPhone(digitsOnly);
                            }}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={12}
                            placeholder="e.g. 09123456789"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-xs font-primary text-center bg-red-50 p-2 rounded-lg">
                            {error}
                        </p>
                    )}

                    <button
                        onClick={handleLogin}
                        disabled={loading || phone.replace(/\D/g, '').length < 10}
                        className="w-full bg-primary text-white font-primary font-semibold py-3 rounded-full border-none cursor-pointer hover:bg-green-700 mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white inline mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Sending OTP...
                            </>
                        ) : (
                            'Send OTP'
                        )}
                    </button>

                    <div className="text-center space-y-2 mt-4">
                        <p className="text-sm font-primary text-gray-600">
                            Don't have an account?{" "}
                            <Link to="/consumer-signup" className="text-primary font-semibold hover:underline">
                                Sign Up as Consumer
                            </Link>
                        </p>
                        <p className="text-sm font-primary text-gray-600">
                            <Link to="/farmer-signup" className="text-primary font-semibold hover:underline">
                                Sign Up as Farmer
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}