import { initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import * as vision from '@google-cloud/vision';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin
initializeApp();

export const db = getFirestore();
export const storage = getStorage();

// Face++ API Keys from environment
export const FACEPP_API_KEY = process.env.FACEPP_API_KEY || '';
export const FACEPP_API_SECRET = process.env.FACEPP_API_SECRET || '';
export const FACEPP_BASE_URL = 'https://api-us.faceplusplus.com/facepp/v3';

// Vision API credentials - try env first, then file
let visionCredentials: any = {};

try {
  // Try environment variable first
  const creds = process.env.GOOGLE_VISION_CREDENTIALS;
  if (creds && creds.trim().length > 0) {
    visionCredentials = JSON.parse(creds);
    console.log('✓ Vision API credentials loaded from environment');
  } else {
    throw new Error('Env var not found');
  }
} catch (envError) {
  // Fallback to file
  try {
    const credsPath = path.join(__dirname, 'vision-key.json');
    if (fs.existsSync(credsPath)) {
      const fileCreds = fs.readFileSync(credsPath, 'utf8');
      visionCredentials = JSON.parse(fileCreds);
      console.log('✓ Vision API credentials loaded from file');
    } else {
      console.warn('⚠ GOOGLE_VISION_CREDENTIALS not found in environment or file');
    }
  } catch (fileError) {
    console.error('✗ Failed to load Vision API credentials:', fileError);
  }
}

// Initialize Vision client
export const visionClient = new vision.ImageAnnotatorClient({
  credentials: visionCredentials
});