import { z } from 'zod';

const nameRegex = /^[a-zA-Z\s'-]+$/;
const farmNameRegex = /^[a-zA-Z0-9\s&'-]+$/;
const phoneRegex = /^(09\d{9}|\+63\d{10})$/;

// Consumer signup schema
export const consumerSignupSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name is too long')
    .regex(nameRegex, 'First name can only contain letters, spaces, hyphens, and apostrophes')
    .transform((val) => val.trim()),
  
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name is too long')
    .regex(nameRegex, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
    .transform((val) => val.trim()),
  
  email: z.string()
    .email('e.g. sample@gmail.com')
    .optional()
    .or(z.literal('')),
 
  address: z
    .string()
    .min(5, 'Please enter a complete address')
    .max(200, 'Address is too long')
    .transform((val) => val.trim()),
  
  phoneNo: z
    .string()
    .regex(phoneRegex, 'e.g., 09123456789 or +639123456789'),
  
  interest: z.enum(['Rice', 'Corn', 'Vegetables', 'Fruits', 'Livestock', 'Poultry', 'Fishery', 'Other']),

  agreeToTerms: z.boolean().refine(Boolean, {
    message: 'You must agree to the terms and conditions',
  }),
  
}).strict();

export type ConsumerSignupData = z.infer<typeof consumerSignupSchema>;

// Farmer signup schema - WITH agreeToTerms
export const farmerSignupSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name is too long')
    .regex(nameRegex, 'First name can only contain letters, spaces, hyphens, and apostrophes')
    .transform((val) => val.trim()),
  
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name is too long')
    .regex(nameRegex, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
    .transform((val) => val.trim()),
  
  email: z.string()
    .email('e.g. sample@gmail.com')
    .optional()
    .or(z.literal('')),
  
  farmName: z
    .string()
    .min(2, 'Farm name must be at least 2 characters')
    .max(100, 'Farm name is too long')
    .regex(farmNameRegex, 'Farm name can only contain letters, numbers, spaces, &, hyphens, and apostrophes')
    .transform((val) => val.trim()),
  
  farmAddress: z
    .string()
    .min(5, 'Please enter a complete farm address')
    .max(200, 'Farm address is too long')
    .transform((val) => val.trim()),
  
  phoneNo: z
    .string()
    .regex(phoneRegex, 'e.g., 09123456789 or +639123456789'),
  
  farmType: z.enum(['Rice', 'Corn', 'Vegetables', 'Fruits', 'Livestock', 'Poultry', 'Fishery', 'Other']),
  
  agreeToTerms: z.boolean().refine(Boolean, {
    message: 'You must agree to the terms and conditions',
  }),
  
}).strict();

export type FarmerSignupData = z.infer<typeof farmerSignupSchema>;

// OTP validation schemas
export const phoneSchema = z.object({
  phoneNo: z.string().regex(phoneRegex, 'e.g., 09123456789 or +639123456789'),
});

export const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

export type PhoneData = z.infer<typeof phoneSchema>;
export type OTPData = z.infer<typeof otpSchema>;