import { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { ConfirmationResult } from 'firebase/auth';
import logo from '../../assets/icons/logo.png';
import { useAuth } from '../../context/AuthContext';
import SuccessModal from '../verification/SuccessModal';
import type { ConsumerSignupData } from '../../lib/validations';

interface LocationState {
  phoneNumber: string;
  flow: 'signup';
}

export default function ConsumerOtpVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sendOTP, verifyOTP, signUpConsumer } = useAuth();
  
  const { phoneNumber } = (location.state as LocationState) || {};
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(true);
  const [countdown, setCountdown] = useState(60);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [consumerData, setConsumerData] = useState<ConsumerSignupData | null>(null);

  // Load consumer data from sessionStorage and send OTP
  useEffect(() => {
    // Load form data
    const storedData = sessionStorage.getItem('consumerSignupData');
    if (storedData) {
      setConsumerData(JSON.parse(storedData));
    }

    if (!phoneNumber) {
      navigate('/consumer-signup', { 
        replace: true,
        state: { error: 'Please complete the signup form first' }
      });
      return;
    }

    // Check if we already have a confirmation (user refreshed page)
    const hasConfirmation = sessionStorage.getItem('consumerConfirmation');
    if (hasConfirmation === 'true') {
      // Need to resend OTP since confirmation can't be stored
      sendInitialOTP();
    } else {
      navigate('/consumer-signup', { replace: true });
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendInitialOTP = async () => {
    try {
      setSending(true);
      setError('');
      const confirmation = await sendOTP(phoneNumber);
      setConfirmationResult(confirmation);
      sessionStorage.setItem('consumerConfirmation', 'true');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleResend = async () => {
    setCountdown(60);
    await sendInitialOTP();
  };

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (index === 5 && value) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code: string = otp.join('')) => {
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    if (!confirmationResult) {
      setError('Session expired. Please request a new code.');
      return;
    }

    if (!consumerData) {
      setError('Signup data not found. Please start over.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Verify OTP and create account
      await signUpConsumer(consumerData, confirmationResult, code);
      
      // Cleanup
      sessionStorage.removeItem('consumerSignupData');
      sessionStorage.removeItem('consumerConfirmation');
      
      // Show success
      setShowSuccessModal(true);
      
    } catch (err: any) {
      setError(err.message || 'Invalid code. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    setShowSuccessModal(false);
    navigate('/', { replace: true });
  };

  const handleGoToProfile = () => {
    setShowSuccessModal(false);
    navigate('/profile', { replace: true });
  };

  const handleGoBack = () => {
    navigate('/consumer-signup', { replace: true });
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('09')) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }
    return phone;
  };

  if (!phoneNumber) {
    return (
      <section className="flex items-center justify-center py-16">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex items-center justify-center py-16 px-4">
      {/* Success Modal */}
      {showSuccessModal && consumerData && (
        <SuccessModal
          farmerData={{ // Reusing SuccessModal with consumer data
            firstName: consumerData.firstName,
            lastName: consumerData.lastName,
            phoneNo: consumerData.phoneNo,
            email: consumerData.email
          }}
          onLogin={handleGoToDashboard}
          onProfile={handleGoToProfile}
        />
      )}

      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <img src={logo} className="w-11 h-11 rounded-full object-cover" alt="Logo" />
          <span className="font-primary font-bold text-lg tracking-wide whitespace-nowrap">ILOILO FARMERS HUB</span>
        </div>

        <div className="text-center mb-6">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full mb-2">
            Step 2 of 2
          </span>
          <h2 className="text-xl font-primary font-bold text-gray-800 mb-1">Verify Your Phone</h2>
          <p className="text-sm font-primary text-gray-500">
            Enter the 6-digit code sent to<br />
            <span className="font-semibold text-gray-700">{formatPhone(phoneNumber)}</span>
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {/* OTP Box */}
          <div className="flex items-center justify-between gap-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                maxLength={1}
                value={otp[i]}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={loading || sending}
                className="w-12 h-12 text-center text-lg font-primary font-bold border-2 border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-gray-100"
              />
            ))}
          </div>

          {sending && (
            <p className="text-sm font-primary text-gray-500 text-center">
              Sending code...
            </p>
          )}

          {error && (
            <p className="text-red-500 text-sm font-primary text-center bg-red-50 p-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            onClick={() => handleVerify()}
            disabled={loading || sending || otp.some(d => !d)}
            className="w-full bg-primary text-white font-primary font-semibold py-3 rounded-full border-none cursor-pointer hover:bg-green-700 mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </>
            ) : (
              'Verify & Create Account'
            )}
          </button>

          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-sm font-primary text-gray-500">
                Resend code in <span className="font-semibold">{countdown}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={sending}
                className="text-primary font-semibold bg-transparent border-none cursor-pointer hover:underline font-primary text-sm disabled:opacity-50"
              >
                Resend Code
              </button>
            )}
          </div>

          <button
            onClick={handleGoBack}
            disabled={loading}
            className="text-sm font-primary text-center text-gray-500 bg-transparent border-none cursor-pointer hover:underline"
          >
            ← Back to Signup
          </button>
        </div>
      </div>

      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container"></div>
    </section>
  );
}