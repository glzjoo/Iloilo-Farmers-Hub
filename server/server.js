require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const FormData = require('form-data');
const axios = require('axios');
const vision = require('@google-cloud/vision');
const sharp = require('sharp');
const path = require('path');

const app = express();

// CORS - allow your React app
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// API credentials
const FACEPP_API_KEY = process.env.FACEPP_API_KEY;
const FACEPP_API_SECRET = process.env.FACEPP_API_SECRET;
const FACEPP_BASE_URL = 'https://api-us.faceplusplus.com/facepp/v3';

// Initialize Google Vision client
const visionClient = new vision.ImageAnnotatorClient({
  keyFilename: path.join(__dirname, process.env.GOOGLE_VISION_KEY_FILE || 'vision-key.json')
});

// Validate credentials
if (!FACEPP_API_KEY || !FACEPP_API_SECRET) {
  console.error('❌ Missing Face++ credentials');
  process.exit(1);
}

// Debug logging
console.log('Face++ Key:', FACEPP_API_KEY ? '✓ Loaded (' + FACEPP_API_KEY.substring(0, 5) + '...)' : '✗ Missing');
console.log('Face++ Secret:', FACEPP_API_SECRET ? '✓ Loaded (' + FACEPP_API_SECRET.substring(0, 5) + '...)' : '✗ Missing');

// Rate limiting (Face++ free tier: 300/day, 900/month)
const rateLimits = {
  daily: { count: 0, date: new Date().toDateString() },
  monthly: { count: 0, month: new Date().getMonth() }
};

function checkRateLimit() {
  const now = new Date();
  
  if (now.toDateString() !== rateLimits.daily.date) {
    rateLimits.daily = { count: 0, date: now.toDateString() };
  }
  
  if (now.getMonth() !== rateLimits.monthly.month) {
    rateLimits.monthly = { count: 0, month: now.getMonth() };
  }
  
  if (rateLimits.daily.count >= 300) {
    return { allowed: false, reason: 'Daily limit reached (300)' };
  }
  
  if (rateLimits.monthly.count >= 900) {
    return { allowed: false, reason: 'Monthly limit reached (900)' };
  }
  
  return { allowed: true };
}

function incrementCounters() {
  rateLimits.daily.count++;
  rateLimits.monthly.count++;
}

// ==================== MAIN VERIFICATION ENDPOINT ====================

app.post('/api/verify-farmer-id', upload.fields([
  { name: 'idImage', maxCount: 1 },
  { name: 'selfieImage', maxCount: 1 }
]), async (req, res) => {
  const limitCheck = checkRateLimit();
  if (!limitCheck.allowed) {
    return res.status(429).json({ 
      success: false, 
      error: limitCheck.reason,
      code: 'RATE_LIMIT'
    });
  }

  try {
    const { userId, idType, idNumber } = req.body;
    
    if (!req.files?.idImage || !req.files?.selfieImage) {
      return res.status(400).json({ 
        success: false,
        error: 'Both ID image and selfie are required',
        code: 'MISSING_IMAGES'
      });
    }

    console.log(`🔍 Processing verification for farmer: ${userId}`);

    const idBuffer = req.files.idImage[0].buffer;
    const selfieBuffer = req.files.selfieImage[0].buffer;

    // Preprocess ID image for better OCR
    const preprocessedBuffer = await preprocessImage(idBuffer);

    // Run Face++ face comparison and Google Vision OCR in parallel
    const [faceResult, ocrResult] = await Promise.all([
      runFaceVerification(idBuffer, selfieBuffer),
      runOCR(preprocessedBuffer)
    ]);

    incrementCounters();

    // DEBUG: Log the results
    console.log('Face Match Score:', faceResult.faceMatch?.score);
    console.log('Face Match Confidence:', faceResult.faceMatch?.confidence);
    console.log('Extracted ID Number:', ocrResult.extractedData?.idNumber);
    console.log('Is Face Verified:', faceResult.isVerified);

    // Determine verification status - LOWERED THRESHOLD to 60 for better UX
    // Or require both face match AND ID extraction
    const faceThreshold = 60; // Lowered from 70
    const hasFaceMatch = faceResult.faceMatch?.score > faceThreshold;
    const hasIdData = !!ocrResult.extractedData?.idNumber;
    
    // More lenient: pass if face match is good OR we have decent face score + some ID data
    const isVerified = hasFaceMatch || (faceResult.faceMatch?.score > 50 && hasIdData);

    const response = {
      success: true,
      verified: isVerified,
      farmerId: userId,
      verification: {
        faceMatch: faceResult.faceMatch,
        idData: ocrResult.extractedData,
        idType: idType || ocrResult.extractedData.idType || 'Unknown',
        providedIdNumber: idNumber,
        extractedIdNumber: ocrResult.extractedData.idNumber,
        checks: {
          faceMatchPassed: hasFaceMatch,
          idExtracted: hasIdData,
          threshold: faceThreshold
        }
      },
      rateLimit: {
        dailyRemaining: 300 - rateLimits.daily.count,
        monthlyRemaining: 900 - rateLimits.monthly.count
      }
    };

    console.log(`✅ Verification complete: ${isVerified ? 'APPROVED' : 'REJECTED'} (Score: ${faceResult.faceMatch?.score}%)`);
    res.json(response);

  } catch (error) {
    console.error('❌ Verification error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Verification failed',
      details: error.message,
      code: 'VERIFICATION_ERROR'
    });
  }
});

// ==================== HELPER FUNCTIONS ====================

// Image preprocessing for better OCR
async function preprocessImage(buffer) {
  try {
    return await sharp(buffer)
      .resize(2000, 1500, { fit: 'inside', withoutEnlargement: true })
      .modulate({ brightness: 1.1, contrast: 1.2 })
      .sharpen({ sigma: 1, flat: 1, jagged: 2 })
      .normalize()
      .jpeg({ quality: 90, progressive: true })
      .toBuffer();
  } catch (err) {
    console.warn('Preprocessing failed, using original:', err.message);
    return buffer;
  }
}

// Face++ face verification (ID photo vs selfie)
async function runFaceVerification(idBuffer, selfieBuffer) {
  console.log('👤 Running face detection...');
  
  // Detect face in ID with delay to avoid rate limits
  const idFaceResult = await detectFaceWithRetry(idBuffer);
  await delay(1000);
  
  // Detect face in selfie
  const selfieFaceResult = await detectFaceWithRetry(selfieBuffer);
  
  if (!idFaceResult.faces?.length) {
    throw new Error('No face detected in ID image');
  }
  if (!selfieFaceResult.faces?.length) {
    throw new Error('No face detected in selfie');
  }

  console.log(`✓ ID face: ${idFaceResult.faces.length}, Selfie face: ${selfieFaceResult.faces.length}`);
  console.log(`  ID face token: ${idFaceResult.faces[0].face_token.substring(0, 10)}...`);
  console.log(`  Selfie face token: ${selfieFaceResult.faces[0].face_token.substring(0, 10)}...`);

  await delay(1000);
  
  // Compare faces
  const compareResult = await compareFacesWithRetry(
    idFaceResult.faces[0].face_token,
    selfieFaceResult.faces[0].face_token
  );

  const confidence = compareResult.confidence || 0;
  
  // DEBUG: Log comparison result
  console.log('Face++ Compare Result:', {
    confidence: confidence,
    threshold: 70,
    request_id: compareResult.request_id
  });

  return {
    isVerified: confidence > 60, // Lowered threshold
    faceMatch: {
      score: Math.round(confidence),
      rawConfidence: confidence,
      confidence: confidence > 80 ? 'High' : confidence > 60 ? 'Medium' : 'Low',
      threshold: 60,
      matched: confidence > 60
    }
  };
}

// Face++ detect face with retry
async function detectFaceWithRetry(imageBuffer, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const formData = new FormData();
      formData.append('api_key', FACEPP_API_KEY);
      formData.append('api_secret', FACEPP_API_SECRET);
      formData.append('image_file', imageBuffer, 'image.jpg');
      formData.append('return_attributes', 'facequality,blur,headpose');

      const { data } = await axios.post(
        `${FACEPP_BASE_URL}/detect`,
        formData,
        { 
          headers: formData.getHeaders(), 
          timeout: 60000 
        }
      );
      
      return data;
    } catch (err) {
      console.warn(`Face detection attempt ${i + 1} failed:`, err.response?.data?.error_message || err.message);
      if (i === retries) throw err;
      await delay(2000 * (i + 1));
    }
  }
}

// Face++ compare faces with retry
async function compareFacesWithRetry(token1, token2, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const formData = new FormData();
      formData.append('api_key', FACEPP_API_KEY);
      formData.append('api_secret', FACEPP_API_SECRET);
      formData.append('face_token1', token1);
      formData.append('face_token2', token2);

      const { data } = await axios.post(
        `${FACEPP_BASE_URL}/compare`,
        formData,
        { 
          headers: formData.getHeaders(), 
          timeout: 60000 
        }
      );
      
      return data;
    } catch (err) {
      console.warn(`Face compare attempt ${i + 1} failed:`, err.response?.data?.error_message || err.message);
      if (i === retries) throw err;
      await delay(2000 * (i + 1));
    }
  }
}

// Google Vision OCR
async function runOCR(imageBuffer) {
  console.log('📝 Running OCR...');
  
  try {
    const [result] = await visionClient.textDetection(imageBuffer);
    const text = result.fullTextAnnotation?.text || '';
    
    console.log(`✓ OCR complete: ${text.length} characters`);
    
    return {
      extractedData: extractPhilippineIDData(text),
      rawText: text.substring(0, 1000) // Limit for response
    };
  } catch (err) {
    console.error('OCR error:', err);
    return {
      extractedData: { idType: null, fullName: null, idNumber: null },
      rawText: ''
    };
  }
}

// Extract data from Philippine IDs
function extractPhilippineIDData(text) {
  const data = {
    idType: null,
    fullName: null,
    idNumber: null,
    dateOfBirth: null,
    address: null
  };

  const lines = text.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const upperText = text.toUpperCase();

  // Detect ID type
  const idTypes = [
    { type: 'Philippine Passport', keywords: ['PASSPORT', 'REPUBLIC OF THE PHILIPPINES', 'DFA'] },
    { type: "Driver's License", keywords: ['DRIVER', 'LTO', 'LICENSE', 'DL NO'] },
    { type: 'UMID', keywords: ['UMID', 'SSS', 'GSIS'] },
    { type: 'Philsys National ID', keywords: ['PHILSYS', 'NATIONAL ID', 'PCN'] },
    { type: 'Postal ID', keywords: ['POSTAL', 'PHLPOST'] },
    { type: 'Voter ID', keywords: ['COMELEC', 'VOTER'] },
    { type: 'TIN ID', keywords: ['TIN', 'BIR'] }
  ];
  
  const detectedType = idTypes.find(t => 
    t.keywords.some(k => upperText.includes(k))
  );
  data.idType = detectedType?.type || 'Government ID';

  // Extract name (look for "Surname, Firstname" or ALL CAPS names)
  const namePatterns = [
    /^([A-Z][A-Z\s]+),\s*([A-Z][A-Z\s]+)$/i, // Lastname, Firstname
    /^([A-Z]{2,30})\s+([A-Z]{2,30})$/ // Firstname Lastname
  ];
  
  for (const line of lines) {
    for (const pattern of namePatterns) {
      const match = line.match(pattern);
      if (match && line.length > 5 && line.length < 40) {
        data.fullName = line.replace(/,/g, ', ');
        break;
      }
    }
    if (data.fullName) break;
  }

  // Extract ID number (various formats)
  const idPatterns = [
    /\b(\d{4}\s?\d{4}\s?\d{4})\b/, // Philsys: 1234 5678 9012
    /\b([A-Z]{1,2}\d{6,10})\b/, // Driver's: A12345678
    /\b(\d{10,12})\b/, // Generic 10-12 digits
    /NO[.:]?\s*(\d+)/i // "No. 123456"
  ];

  for (const pattern of idPatterns) {
    const match = text.match(pattern);
    if (match) {
      data.idNumber = match[1].replace(/\s/g, '');
      break;
    }
  }

  // Extract date of birth
  const datePatterns = [
    /(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/, // MM/DD/YYYY
    /(\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})/, // YYYY/MM/DD
    /(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[.,]?\s*\d{1,2},?\s*\d{4}/i // Jan 1, 1990
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      data.dateOfBirth = match[1];
      break;
    }
  }

  return data;
}

// Utility: delay function
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== STATUS ENDPOINTS ====================

app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    rateLimits: {
      daily: { used: rateLimits.daily.count, limit: 300, remaining: 300 - rateLimits.daily.count },
      monthly: { used: rateLimits.monthly.count, limit: 900, remaining: 900 - rateLimits.monthly.count }
    },
    services: {
      facepp: !!FACEPP_API_KEY,
      vision: !!visionClient
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║   IFH ID Verification Server                   ║
║   Running on port ${PORT}                        ║
╠════════════════════════════════════════════════╣
║   Face++ API: ${FACEPP_API_KEY ? '✓ Connected' : '✗ Missing'}              ║
║   Google Vision: ${process.env.GOOGLE_VISION_KEY_FILE ? '✓ Connected' : '✗ Missing'}           ║
║   Threshold: 60% (lowered for better UX)       ║
╚════════════════════════════════════════════════╝
  `);
});