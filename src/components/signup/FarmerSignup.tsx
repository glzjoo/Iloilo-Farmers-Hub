import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import logo from '../../assets/icons/logo.png';
import SignupToggle from './SignupToggle';
import { farmerSignupSchema, type FarmerSignupData } from '../../lib/validations';
import { useAuth } from '../../context/AuthContext';
import { useSanitizedInput } from '../../hooks/useSanitizedInput';

export default function FarmerSignup() {
  const navigate = useNavigate();
  const { prepareFarmerSignup } = useAuth();
  const { sanitizeName, sanitizeFarmName, sanitizeEmail, sanitizePhone } = useSanitizedInput();
  const [isLoading, setIsLoading] = useState(false);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    trigger,
  } = useForm<FarmerSignupData>({
    resolver: zodResolver(farmerSignupSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      farmName: '',
      farmAddress: '',
      phoneNo: '',
      farmType: 'Rice', 
      agreeToTerms: false, 
    },
  });

  const onSubmit = async (data: FarmerSignupData) => {
    setIsLoading(true);
    setFirebaseError(null);
    
    try {
      const tempId = await prepareFarmerSignup(data);
      
      navigate('/id-verification', { 
        state: { 
          tempId,
          farmerData: data,
          userType: 'farmer' 
        } 
      });
    } catch (error: any) {
      console.error('Signup preparation error:', error);
      setFirebaseError(error.message || 'Failed to initialize signup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    reset();
    setFirebaseError(null);
  };

  const getInputClass = (fieldName: keyof FarmerSignupData) => {
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
            <span className="font-primary font-bold text-2xl">Farmer's Information</span>
          </div>
          <SignupToggle />
        </div>

        {/* Firebase Error Display */}
        {firebaseError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm font-primary">{firebaseError}</p>
          </div>
        )}

        {/* Info Banner - UPDATED for OTP */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-sm font-primary">
            <span className="font-bold">Next Steps:</span> 1) Verify your identity with ID + selfie, 2) We'll send OTP to your phone to create your account. <span className="font-semibold">No password needed!</span>
          </p>
        </div>

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

          {/* Farm Name */}
          <div>
            <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">
              Farm Name <span className="text-red-500">*</span>
            </label>
            <Controller
              name="farmName"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  placeholder="Enter your farm name"
                  className={getInputClass('farmName')}
                  onChange={(e) => {
                    const sanitized = sanitizeFarmName(e.target.value);
                    field.onChange(sanitized);
                    if (sanitized.length >= 2) trigger('farmName');
                  }}
                  onBlur={() => trigger('farmName')}
                />
              )}
            />
            {errors.farmName && (
              <p className="mt-1 text-xs text-red-500 font-primary flex items-center gap-1">
                <span>⚠</span> {errors.farmName.message}
              </p>
            )}
          </div>

          {/* Farm Address */}
          <div className="col-span-2">
            <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">
              Farm Address <span className="text-red-500">*</span>
            </label>
            <input
              {...register('farmAddress')}
              type="text"
              placeholder="Enter your complete farm address"
              className={getInputClass('farmAddress')}
            />
            {errors.farmAddress && (
              <p className="mt-1 text-xs text-red-500 font-primary">{errors.farmAddress.message}</p>
            )}
          </div>

          {/* Contact Number */}
          <div>
            <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">
              Contact Number <span className="text-red-500">*</span> <span className="text-xs text-gray-500">(for OTP)</span>
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

          {/* Farm Type */}
          <div>
            <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">
              Farm Type <span className="text-red-500">*</span>
            </label>
            <select
              {...register('farmType')}
              className={getInputClass('farmType')}
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
            {errors.farmType && (
              <p className="mt-1 text-xs text-red-500 font-primary">{errors.farmType.message}</p>
            )}
          </div>


          {/* Terms */}
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

          {/* Buttons - Full Width */}
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
              disabled={isLoading}
              className="px-10 py-2.5 rounded-full border-none bg-primary text-white font-primary font-bold cursor-pointer hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Preparing...
                </>
              ) : (
                'Continue to Verification'
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}