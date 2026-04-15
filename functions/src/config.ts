import { initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import * as vision from '@google-cloud/vision';

// Initialize Firebase Admin
initializeApp();

export const db = getFirestore();
export const storage = getStorage();

// Face++ API Keys from environment
export const FACEPP_API_KEY = process.env.FACEPP_API_KEY || '';
export const FACEPP_API_SECRET = process.env.FACEPP_API_SECRET || '';
export const FACEPP_BASE_URL = 'https://api-us.faceplusplus.com/facepp/v3';

// Vision API credentials from environment JSON
let visionCredentials = {};
try {
  const creds = process.env.GOOGLE_VISION_CREDENTIALS;
  if (creds) {
    visionCredentials = JSON.parse(creds);
    console.log('✓ Vision API credentials loaded from environment');
  } else {
    console.warn('⚠ GOOGLE_VISION_CREDENTIALS not found in environment');
  }
} catch (error) {
  console.error('✗ Failed to parse GOOGLE_VISION_CREDENTIALS:', error);
}

// Initialize Vision client with credentials from env
export const visionClient = new vision.ImageAnnotatorClient({
  credentials: visionCredentials
});