import { ConfirmationResult, ApplicationVerifier } from 'firebase/auth';

declare global {
    interface Window {
        confirmationResult?: ConfirmationResult;
        recaptchaVerifier?: ApplicationVerifier;
    }
}