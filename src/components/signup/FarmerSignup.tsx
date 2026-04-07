import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import logo from '../../assets/icons/logo.png';
import SignupToggle from './SignupToggle';
import FarmLocationPicker from '../location/FarmLocationPicker';
import { farmerSignupSchema, type FarmerSignupData } from '../../lib/validations';
import { useAuth } from '../../context/AuthContext';
import { useSanitizedInput } from '../../hooks/useSanitizedInput';

export default function FarmerSignup() {
  const navigate = useNavigate();
  const { prepareFarmerSignup } = useAuth();
  const { sanitizeName, sanitizeFarmName, sanitizeEmail, sanitizePhone } = useSanitizedInput();
  const [isLoading, setIsLoading] = useState(false);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [customFarmType, setCustomFarmType] = useState('');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    trigger,
    watch,
  } = useForm<FarmerSignupData>({
    resolver: zodResolver(farmerSignupSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      farmName: '',
      farmLocation: undefined,
      farmAddressDetails: '',
      phoneNo: '',
      farmType: 'Rice',
      agreeToTerms: false,
    },
  });

  const farmLocation = watch('farmLocation');

  const onSubmit = handleSubmit(async (data) => {
    console.log('=== BUTTON CLICKED / FORM SUBMITTED ===');
    setIsLoading(true);
    setFirebaseError(null);

    try {
      const submitData: FarmerSignupData = {
        ...data,
        farmType: data.farmType === 'Other' && customFarmType.trim()
          ? customFarmType.trim() as any
          : data.farmType,
      };
      
      console.log('Calling prepareFarmerSignup with data:', submitData);
      const tempId = await prepareFarmerSignup(submitData);
      console.log('Got tempId, navigating...', tempId);

      navigate('/id-verification', {
        state: {
          tempId,
          farmerData: submitData,
          userType: 'farmer'
        }
      });
      console.log('Navigate called!');
    } catch (error: any) {
      console.error('=== FULL ERROR ===', error);
      console.error('Error stack:', error.stack);
      setFirebaseError(error.message || 'Failed to initialize signup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  });

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

  console.log('=== RENDER ===', {
    isLoading,
    formErrors: errors,
    errorCount: Object.keys(errors).length,
    isValid: Object.keys(errors).length === 0,
    farmLocation,
  });

  return (
    <section className="flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-10">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <img src={logo} className="w-11 h-11 rounded-full object-cover" alt="Logo" />
            <span className="font-primary font-bold text-2xl">Farmer's Information</span>
          </div>
          <SignupToggle />
        </div>

        {firebaseError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm font-primary">{firebaseError}</p>
          </div>
        )}

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-sm font-primary">
            <span className="font-bold">Next Steps:</span> 1) Verify your identity with ID + selfie, 2) We'll send OTP to your phone to create your account. <span className="font-semibold">No password needed!</span>
          </p>
        </div>

        <form onSubmit={onSubmit} className="grid grid-cols-2 gap-x-8 gap-y-5">
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

          {/* Farm Location Picker */}
          <div className="col-span-2">
            <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">
              Farm Location <span className="text-red-500">*</span>
            </label>
            <Controller
              name="farmLocation"
              control={control}
              render={({ field }) => (
                <FarmLocationPicker
                  value={field.value || null}
                  onChange={(location) => {
                    field.onChange(location);
                    trigger('farmLocation');
                  }}
                  error={errors.farmLocation?.message}
                />
              )}
            />
            {farmLocation?.coordinates && (
              <p className="mt-2 text-sm text-green-600 font-primary">
                ✅ Location set: {farmLocation.barangay}, {farmLocation.city} 
                ({farmLocation.coordinates.lat.toFixed(4)}, {farmLocation.coordinates.lng.toFixed(4)})
                {farmLocation.accuracy === 'gps' && ' • GPS'}
                {farmLocation.accuracy === 'manual_pin' && ' • Manual pin'}
                {farmLocation.accuracy === 'barangay_centroid' && ' • Barangay center'}
              </p>
            )}
          </div>

          {/* Additional Address Details */}
          <div className="col-span-2">
            <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">
              Additional Address Details <span className="text-gray-400 text-xs italic">(Optional)</span>
              <span className="text-xs text-gray-500 font-normal block">Street name, landmark, or specific directions</span>
            </label>
            <input
              {...register('farmAddressDetails')}
              type="text"
              placeholder="e.g., Near Oton Public Market, along the highway"
              className={getInputClass('farmAddressDetails')}
            />
            {errors.farmAddressDetails && (
              <p className="mt-1 text-xs text-red-500 font-primary">{errors.farmAddressDetails.message}</p>
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
            <Controller
              name="farmType"
              control={control}
              render={({ field }) => (
                field.value === 'Other' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customFarmType}
                      onChange={(e) => setCustomFarmType(e.target.value)}
                      placeholder="Type your farm type"
                      className={getInputClass('farmType')}
                      autoFocus
                      required
                    />
                    <button
                      type="button"
                      onClick={() => { field.onChange('Rice'); setCustomFarmType(''); }}
                      className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer bg-transparent border-none"
                      title="Back to list"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <select
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
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
                )
              )}
            />
            {errors.farmType && (
              <p className="mt-1 text-xs text-red-500 font-primary">{errors.farmType.message}</p>
            )}
          </div>

          {/* Terms */}
          <div className="col-span-2 flex items-start gap-2 mt-2 p-3 bg-gray-50 rounded-lg">
            <input
              {...register('agreeToTerms')}
              type="checkbox"
              className="w-4 h-4 accent-primary cursor-pointer mt-0.5"
            />
            <span className="text-sm font-primary text-gray-600">
              By continuing, you agree to our{' '}
              <Link to="/terms" className="text-primary underline hover:text-green-700">Terms & Conditions</Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-primary underline hover:text-green-700">Privacy Policy</Link>
            </span>
          </div>
          {errors.agreeToTerms && (
            <p className="col-span-2 text-xs text-red-500 font-primary">{errors.agreeToTerms.message}</p>
          )}

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