import { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/icons/logo.png';

interface LocationState {
  phoneNo: string;  // Changed from phoneNumber
  flow: 'login';
}

export default function LoginOtpVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sendOTP, verifyOTP } = useAuth();
  
  const { phoneNo } = (location.state as LocationState) || {};  // Changed from phoneNumber
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!phoneNo) {  // Changed from phoneNumber
      navigate('/login', { 
        replace: true,
        state: { error: 'Please enter your phone number first' }
      });
      return;
    }

    const hasConfirmation = sessionStorage.getItem('loginConfirmation');
    if (hasConfirmation !== 'true') {
      sendInitialOTP();
    }
  }, []);

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
      await sendOTP(phoneNo);  // Changed from phoneNumber
      sessionStorage.setItem('loginConfirmation', 'true');
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

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

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

    try {
      setLoading(true);
      setError('');

      const confirmation = await sendOTP(phoneNo);  // Changed from phoneNumber
      const user = await verifyOTP(confirmation, code);
      
      if (!user) {
        throw new Error('Login failed. Please try again.');
      }

      sessionStorage.removeItem('loginConfirmation');
      sessionStorage.removeItem('loginPhone');

      navigate('/', { replace: true });
      
    } catch (err: any) {
      setError(err.message || 'Invalid code. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/login', { replace: true });
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('63')) {
      return `0${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
    }
    return phone;
  };

  if (!phoneNo) {  // Changed from phoneNumber
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
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <img src={logo} className="w-11 h-11 rounded-full object-cover" alt="Logo" />
          <span className="font-primary font-bold text-lg tracking-wide whitespace-nowrap">ILOILO FARMERS HUB</span>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-primary font-bold text-gray-800 mb-1">Verify Your Phone</h2>
          <p className="text-sm font-primary text-gray-500">
            Enter the 6-digit code sent to<br />
            <span className="font-semibold text-gray-700">{formatPhone(phoneNo)}</span>  {/* Changed from phoneNumber */}
          </p>
        </div>

        <div className="flex flex-col gap-4">
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
                Verifying...
              </>
            ) : (
              'Verify & Login'
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
            ← Back to Login
          </button>
        </div>
      </div>

      <div id="recaptcha-container"></div>
    </section>
  );
}