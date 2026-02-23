import { useCallback } from 'react';

// Hook to sanitize name inputs in real-time
export function useSanitizedInput() {
  // Only allow letters, spaces, hyphens, and apostrophes
  const sanitizeName = useCallback((value: string): string => {
    return value
      .replace(/[^a-zA-Z\s'-]/g, '') // Remove numbers and special characters
      .replace(/\s{2,}/g, ' ')       // Replace multiple spaces with single space
      .trimStart();                   // Don't allow leading spaces
  }, []);

  // Strict email sanitization
  const sanitizeEmail = useCallback((value: string): string => {
    return value
      .replace(/[^a-zA-Z0-9._%+-@]/g, '')                // Remove invalid characters
      .replace(/\.{2,}/g, '.')                          // Replace multiple dots with single
      .replace(/^\.+/, '')                              // Remove leading dots
      .replace(/@\.+/g, '@')                            // Remove dots after @
      .trim();
  }, []);

    // Farm name allows: letters, numbers, spaces, &, -, ', and .
  const sanitizeFarmName = useCallback((value: string): string => {
    return value
      .replace(/[^a-zA-Z0-9\s&'-.]/g, '')  // Allow letters, numbers, spaces, &, ', -, and .
      .replace(/\s{2,}/g, ' ')              // Replace multiple spaces with single space
      .trimStart();                         // Don't allow leading spaces
  }, []);

  // Phone number sanitization (Philippine format)
  const sanitizePhone = useCallback((value: string): string => {
    // Only allow digits, max 11 characters starting with 09
    const digitsOnly = value.replace(/\D/g, '').slice(0, 11);
    
    if (digitsOnly.length === 0) return '';
    if (digitsOnly.length === 1) return digitsOnly === '0' ? '0' : '';
    if (digitsOnly.length === 2) return digitsOnly.startsWith('09') ? digitsOnly : '09';
    
    return digitsOnly.startsWith('09') ? digitsOnly : '09' + digitsOnly.slice(0, 9);
  }, []);

  return { sanitizeName, sanitizeEmail, sanitizePhone, sanitizeFarmName };
}