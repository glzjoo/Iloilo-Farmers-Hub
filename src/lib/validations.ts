import { z } from 'zod';

// Custom email validation regex for stricter validation
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Name validation - letters, spaces, and common name characters only
const nameRegex = /^[a-zA-Z\s'-]+$/;

// Farm name validation - allow letters, numbers, spaces, and common business characters
const farmNameRegex = /^[a-zA-Z0-9\s&'-]+$/;

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
  
  email: z
    .string()
    .min(5, 'Email is too short')
    .max(100, 'Email is too long')
    .regex(emailRegex, 'Please enter a valid email address (e.g., user@example.com)')
    .transform((val) => val.toLowerCase().trim())
    .refine((email) => !email.includes('..'), {
      message: 'Email cannot contain consecutive dots',
    })
    .refine((email) => !email.startsWith('.') && !email.endsWith('.'), {
      message: 'Email cannot start or end with a dot',
    }),
  
  address: z
    .string()
    .min(5, 'Please enter a complete address')
    .max(200, 'Address is too long')
    .transform((val) => val.trim()),
  
  phoneNo: z
    .string()
    .regex(/^09\d{9}$/, 'Please enter a valid Philippine mobile number (e.g., 09123456789)'),
  
  interest: z.enum(['Rice', 'Corn', 'Vegetables', 'Fruits', 'Livestock', 'Poultry', 'Fishery', 'Other']),
  
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  
  confirmPassword: z.string(),
  
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the Terms & Conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type ConsumerSignupData = z.infer<typeof consumerSignupSchema>;

// Farmer signup schema
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
  
  email: z
    .string()
    .min(5, 'Email is too short')
    .max(100, 'Email is too long')
    .regex(emailRegex, 'Please enter a valid email address (e.g., user@example.com)')
    .transform((val) => val.toLowerCase().trim())
    .refine((email) => !email.includes('..'), {
      message: 'Email cannot contain consecutive dots',
    })
    .refine((email) => !email.startsWith('.') && !email.endsWith('.'), {
      message: 'Email cannot start or end with a dot',
    }),
  
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
    .regex(/^09\d{9}$/, 'Please enter a valid Philippine mobile number (e.g., 09123456789)'),
  
  farmType: z.enum(['Rice', 'Corn', 'Vegetables', 'Fruits', 'Livestock', 'Poultry', 'Fishery', 'Other']),
  
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  
  confirmPassword: z.string(),
  
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the Terms & Conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type FarmerSignupData = z.infer<typeof farmerSignupSchema>;