import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import type { ConfirmationResult } from "firebase/auth";
import { auth } from "../../lib/firebase";
import logo from '../../assets/icons/logo.png';

export default function LoginSection() {
    const navigate = useNavigate();
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

    useEffect(() => {
        if (!recaptchaRef.current) {
            recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible',
            });
            recaptchaRef.current.render();
        }
    }, []);

    const handleLogin = async () => {
        setError('');

        // Strip non-digit characters, then format for PH
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
            const confirmationResult: ConfirmationResult = await signInWithPhoneNumber(
                auth,
                formattedPhone,
                recaptchaRef.current!
            );
            // Store confirmationResult so OTP page can use it to verify the code
            window.confirmationResult = confirmationResult;
            navigate('/otp');
        } catch (err: any) {
            setError(err.message || 'Failed to send OTP. Please try again.');
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
                <div className="flex flex-col gap-4">

                    <div>
                        <label className="block text-sm font-primary font-medium text-gray-700 mb-1">Mobile Number</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="e.g. 09123456789"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-primary outline-none focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-primary font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-primary outline-none focus:border-primary"
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-xs font-primary text-center">{error}</p>
                    )}

                    <button
                        id="login-button"
                        onClick={handleLogin}
                        disabled={loading}
                        className="w-full bg-primary text-white font-primary font-semibold py-2.5 rounded-full border-none cursor-pointer hover:bg-green-700 mt-2 disabled:opacity-50"
                    >
                        {loading ? 'Sending OTP...' : 'Login'}
                    </button>

                    <p className="text-sm font-primary text-center text-gray-600 mt-2">
                        Don't have an account?{" "}
                        <Link to="/farmer-signup" className="text-primary font-semibold no-underline hover:underline">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
            <div id="recaptcha-container"></div>
        </section>
    );
}
