import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from '../../assets/icons/logo.png';
import { useAuth } from '../../context/AuthContext';

export default function OtpAuthentication() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleOtpChange = (index: number, value: string) => {
        if (value.length === 1 && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        setError('');
        const code = inputRefs.current.map((input) => input?.value || '').join('');

        if (code.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        if (!window.confirmationResult) {
            setError('Session expired. Please go back and try again.');
            return;
        }

        try {
            setLoading(true);
            await window.confirmationResult.confirm(code);
            login();
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Invalid code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="flex items-center justify-center py-16">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <img src={logo} className="w-11 h-11 rounded-full object-cover" />
                    <span className="font-primary font-bold text-lg tracking-wide whitespace-nowrap">ILOILO FARMERS HUB</span>
                </div>

                <h2 className="text-xl font-primary font-bold text-center text-gray-800 mb-2">Authentication</h2>
                <p className="text-sm font-primary text-center text-gray-500 mb-6">Enter the 6-digit code sent to your number</p>

                <div className="flex flex-col gap-4">
                    {/* OTP Box */}
                    <div className="flex items-center justify-between gap-2">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <input
                                key={i}
                                ref={(el) => { inputRefs.current[i] = el; }}
                                type="text"
                                maxLength={1}
                                onChange={(e) => handleOtpChange(i, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                className="w-12 h-12 text-center text-lg font-primary font-bold border-2 border-gray-300 rounded-lg outline-none focus:border-primary transition-colors"
                            />
                        ))}
                    </div>
                    <p className="text-xs font-primary text-gray-500 text-center">A code has been sent to your number</p>

                    {error && (
                        <p className="text-red-500 text-xs font-primary text-center">{error}</p>
                    )}

                    <button
                        onClick={handleVerify}
                        disabled={loading}
                        className="w-full bg-primary text-white font-primary font-semibold py-2.5 rounded-full border-none cursor-pointer hover:bg-green-700 mt-2 disabled:opacity-50"
                    >
                        {loading ? 'Verifying...' : 'Verify'}
                    </button>

                    <p className="text-sm font-primary text-center text-gray-600 mt-2">
                        Didn't receive a code?{" "}
                        <button className="text-primary font-semibold bg-transparent border-none cursor-pointer hover:underline font-primary text-sm p-0">
                            Resend
                        </button>
                    </p>

                    <Link to="/login" className="text-sm font-primary text-center text-gray-500 no-underline hover:underline">
                        ← Back to Login
                    </Link>
                </div>
            </div>
        </section>
    );
}
