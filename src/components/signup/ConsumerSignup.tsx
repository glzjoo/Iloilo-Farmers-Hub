import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import logo from '../../assets/icons/logo.png';
import SignupToggle from './SignupToggle';
import { consumerSignupSchema, type ConsumerSignupData } from '../../lib/validations';
import { useAuth } from '../../context/AuthContext';
import { useSanitizedInput } from '../../hooks/useSanitizedInput';

export default function ConsumerSignup() {
  const navigate = useNavigate();
  const { sendOTP } = useAuth(); // NEW: Use sendOTP instead of signUpConsumer
  const { sanitizeName, sanitizeEmail, sanitizePhone } = useSanitizedInput();
  const [isLoading, setIsLoading] = useState(false);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    trigger,
    watch, // NEW: To get phone number for OTP
  } = useForm<ConsumerSignupData>({
    resolver: zodResolver(consumerSignupSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      address: '',
      phoneNo: '',
      interest: 'Vegetables' as const,
      // REMOVED: password, confirmPassword, agreeToTerms
    },
  });

  // Watch phone number for OTP step
  const phoneNo = watch('phoneNo');

  const onSubmit = async (data: ConsumerSignupData) => {
    setIsLoading(true);
    setFirebaseError(null);
    
    try {
      // NEW: Send OTP first, don't create account yet
      const confirmation = await sendOTP(data.phoneNo);
      
      // Navigate to OTP page with confirmation and form data
      navigate('/otp', { 
        state: { 
          confirmation,           // Pass confirmation result
          formData: data,        // Pass all form data
          flow: 'signup'         // Indicate this is signup, not login
        } 
      });
    } catch (error: any) {
      console.error('OTP error:', error);
      setFirebaseError(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    reset();
    setFirebaseError(null);
  };

  const getInputClass = (fieldName: keyof ConsumerSignupData) => {
    const baseClass = "w-full border rounded-lg px-4 py-2.5 text-sm font-primary outline-none transition-colors";
    return errors[fieldName] 
      ? `${baseClass} border-red-500 focus:border-red-500 bg-red-50` 
      : `${baseClass} border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary`;
  };

  return (
    <section className="flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <img src={logo} className="w-11 h-11 rounded-full object-cover" alt="Logo" />
            <span className="font-primary font-bold text-2xl">Consumer's Information</span>
          </div>
          <SignupToggle />
        </div>

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-sm font-primary">
            📱 We'll send a 6-digit OTP to your phone number to verify your account. No password needed!
          </p>
        </div>

        {/* Firebase Error Display */}
        {firebaseError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm font-primary">{firebaseError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-x-8 gap-y-5">
          {/* First Name */}
          <div>
            <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">
              First name <span className="text-red-500">*</span>
            </label>
            <Controller
              name="firstName"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  placeholder="Enter your first name"
                  className={getInputClass('firstName')}
                  onChange={(e) => {
                    const sanitized = sanitizeName(e.target.value);
                    field.onChange(sanitized);
                    if (sanitized.length >= 2) trigger('firstName');
                  }}
                  onBlur={() => trigger('firstName')}
                />
              )}
            />
            {errors.firstName && (
              <p className="mt-1 text-xs text-red-500 font-primary flex items-center gap-1">
                <span>⚠</span> {errors.firstName.message}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">
              Last name <span className="text-red-500">*</span>
            </label>
            <Controller
              name="lastName"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  placeholder="Enter your last name"
                  className={getInputClass('lastName')}
                  onChange={(e) => {
                    const sanitized = sanitizeName(e.target.value);
                    field.onChange(sanitized);
                    if (sanitized.length >= 2) trigger('lastName');
                  }}
                  onBlur={() => trigger('lastName')}
                />
              )}
            />
            {errors.lastName && (
              <p className="mt-1 text-xs text-red-500 font-primary flex items-center gap-1">
                <span>⚠</span> {errors.lastName.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">
              Email <span className="text-gray-400 text-xs italic">(Optional)</span>
            </label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="email"
                  placeholder="example@email.com"
                  className={getInputClass('email')}
                  onChange={(e) => {
                    const sanitized = sanitizeEmail(e.target.value);
                    field.onChange(sanitized);
                    if (sanitized.includes('@') && sanitized.includes('.')) {
                      trigger('email');
                    }
                  }}
                  onBlur={() => trigger('email')}
                />
              )}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500 font-primary flex items-center gap-1">
                <span>⚠</span> {errors.email.message}
              </p>
            )}
          </div>

          {/* Home Address */}
          <div>
            <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">
              Home Address <span className="text-red-500">*</span>
            </label>
            <input
              {...register('address')}
              type="text"
              placeholder="Enter your complete address"
              className={getInputClass('address')}
            />
            {errors.address && (
              <p className="mt-1 text-xs text-red-500 font-primary">{errors.address.message}</p>
            )}
          </div>

          {/* Contact Number - NOW PRIMARY IDENTIFIER */}
          <div>
            <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">
              Contact Number <span className="text-red-500">*</span> <span className="text-xs text-gray-500">(for OTP verification)</span>
            </label>
            <Controller
              name="phoneNo"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="tel"
                  placeholder="09123456789"
                  className={getInputClass('phoneNo')}
                  onChange={(e) => {
                    const sanitized = sanitizePhone(e.target.value);
                    field.onChange(sanitized);
                    if (sanitized.length === 11) trigger('phoneNo');
                  }}
                  onBlur={() => trigger('phoneNo')}
                />
              )}
            />
            {errors.phoneNo && (
              <p className="mt-1 text-xs text-red-500 font-primary">{errors.phoneNo.message}</p>
            )}
          </div>

          {/* Interest */}
          <div>
            <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">
              What do you want to buy? <span className="text-red-500">*</span>
            </label>
            <select
              {...register('interest')}
              className={getInputClass('interest')}
            >
              <option value="Rice">Rice</option>
              <option value="Corn">Corn</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Fruits">Fruits</option>
              <option value="Livestock">Livestock</option>
              <option value="Poultry">Poultry</option>
              <option value="Fishery">Fishery</option>
              <option value="Other">Other</option>
            </select>
            {errors.interest && (
              <p className="mt-1 text-xs text-red-500 font-primary">{errors.interest.message}</p>
            )}
          </div>

          {/* REMOVED: Password fields */}
          {/* REMOVED: Confirm Password */}
          {/* REMOVED: Terms checkbox (handle on OTP page or make implicit) */}

          {/* Terms - Simplified */}
          <div className="col-span-2 flex items-start gap-2 mt-2 p-3 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              required
              className="w-4 h-4 accent-primary cursor-pointer mt-0.5"
            />
            <span className="text-sm font-primary text-gray-600">
              By continuing, you agree to our{' '}
              <Link to="/terms" className="text-primary underline hover:text-green-700">Terms & Conditions</Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-primary underline hover:text-green-700">Privacy Policy</Link>
            </span>
          </div>

          {/* Buttons */}
          <div className="col-span-2 flex items-center justify-between mt-6">
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
              className="px-12 py-2.5 rounded-full border-2 border-red-500 text-red-500 font-primary font-bold bg-white cursor-pointer hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed text-lg transition-colors"
            >
              Clear All
            </button>
            
            <button
              type="submit"
              disabled={isLoading || phoneNo?.length !== 11}
              className="px-10 py-2.5 rounded-full border-none bg-primary text-white font-primary font-bold cursor-pointer hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending OTP...
                </>
              ) : (
                'Continue to OTP'
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}