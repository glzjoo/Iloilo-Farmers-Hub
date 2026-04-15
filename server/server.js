// ============================================
// FILE: server.js (COMPLETE - WITH RSBSA SUPPORT)
// ============================================
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const FormData = require('form-data');
const axios = require('axios');
const vision = require('@google-cloud/vision');
const sharp = require('sharp');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');
const { getFirestore } = require('firebase-admin/firestore');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ==================== FIREBASE ADMIN SETUP ====================

const serviceAccount = require(path.join(__dirname, process.env.FIREBASE_SERVICE_ACCOUNT || 'firebase-service-account.json'));

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'your-project.appspot.com'
});

const storage = getStorage();
const db = getFirestore();

// API credentials
const FACEPP_API_KEY = process.env.FACEPP_API_KEY;
const FACEPP_API_SECRET = process.env.FACEPP_API_SECRET;
const FACEPP_BASE_URL = 'https://api-us.faceplusplus.com/facepp/v3';

const visionClient = new vision.ImageAnnotatorClient({
  keyFilename: path.join(__dirname, process.env.GOOGLE_VISION_KEY_FILE || 'vision-key.json')
});

// Validate credentials
if (!FACEPP_API_KEY || !FACEPP_API_SECRET) {
  console.error('❌ Missing Face++ credentials');
  process.exit(1);
}

// Rate limiting
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

// ==================== UPLOAD HELPER ====================
async function uploadVerificationImage(buffer, filename, tempId) {
  try {
    const bucket = storage.bucket();
    const path = `verifications/${tempId}/${filename}`;
    const file = bucket.file(path);
    
    await file.save(buffer, {
      metadata: {
        contentType: 'image/jpeg',
        metadata: {
          tempId: tempId,
          uploadedAt: new Date().toISOString()
        }
      }
    });

    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${path}`;
    
    console.log(`✓ Uploaded: ${publicUrl}`);
    return publicUrl;
    
  } catch (error) {
    console.error('❌ Storage upload error:', error);
    return null;
  }
}

// ==================== RSBSA (Farmers & Fisheries ID) Extraction ====================
// Separate algorithm for Department of Agriculture RSBSA IDs
// Layout: Horizontal, Photo left, Info right
// Name format: First Name [Middle Initial] Last Name (after "FULL NAME" label)
// ID format: XX-XX-XX-XXX-XXXXXX (RSBSA Reference No.)

function extractRSBSAData(text) {
  const data = {
    fullName: null,
    surname: null,
    givenName: null,
    middleName: null,
    idNumber: null,
    mobileWalletNo: null,
    idType: 'Farmers and Fisheries ID (RSBSA)',
    issuingAgency: 'Department of Agriculture'
  };

  const lines = text.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const upperText = text.toUpperCase();
  
  console.log('RSBSA Extraction - Processing...');

  // Extract RSBSA Reference Number (format: XX-XX-XX-XXX-XXXXXX)
  // Look for "RSBSA Reference No." label first
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upperLine = line.toUpperCase();
    
    if (upperLine.includes('RSBSA') && (upperLine.includes('REFERENCE') || upperLine.includes('REF'))) {
      // Try same line: look for pattern after label
      const sameLineMatch = line.match(/(\d{2}[-\s]?\d{2}[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{6})/);
      if (sameLineMatch) {
        data.idNumber = sameLineMatch[1].replace(/[\s]/g, '');
        break;
      }
      
      // Try next line (common case)
      if (lines[i + 1]) {
        const cleanNext = lines[i + 1].trim();
        const nextLineMatch = cleanNext.match(/^(\d{2}[-\s]?\d{2}[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{6})$/);
        if (nextLineMatch) {
          data.idNumber = nextLineMatch[1].replace(/[\s]/g, '');
          break;
        }
      }
    }
  }

  // Fallback: Search entire text for RSBSA number pattern
  if (!data.idNumber) {
    const rsbsaPattern = /\b(\d{2}[-\s]?\d{2}[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{6})\b/;
    const match = text.match(rsbsaPattern);
    if (match) {
      data.idNumber = match[1].replace(/[\s]/g, '');
    }
  }

  // Extract Mobile Wallet Number (optional)
  for (let i = 0; i < lines.length; i++) {
    const upperLine = lines[i].toUpperCase();
    if (upperLine.includes('MOBILE WALLET') || upperLine.includes('MOBILE NO') || upperLine.includes('WALLET NO')) {
      // Check same line
      const mobileMatch = lines[i].match(/(09\d{9})/);
      if (mobileMatch) {
        data.mobileWalletNo = mobileMatch[1];
        break;
      }
      // Check next line
      if (lines[i + 1]) {
        const nextMobileMatch = lines[i + 1].match(/(09\d{9})/);
        if (nextMobileMatch) {
          data.mobileWalletNo = nextMobileMatch[1];
          break;
        }
      }
    }
  }

  // NAME EXTRACTION - RSBSA Format
  // Layout: After 'FULL NAME' label
  // Format: First Name [Middle Initial] Last Name
  // Example: "JEAN BETH" (line 1), "C SANDA" (line 2) 
  // Or: "JEAN BETH C SANDA" (single line)
  
  let nameStartIndex = -1;
  
  // Find "FULL NAME" label (flexible matching)
  for (let i = 0; i < lines.length; i++) {
    const upperLine = lines[i].toUpperCase().replace(/\s+/g, ' ').trim();
    if (upperLine === 'FULL NAME' || 
        upperLine === 'NAME' || 
        upperLine === 'FULLNAME' ||
        upperLine.includes('FULL NAME')) {
      nameStartIndex = i;
      break;
    }
  }

  if (nameStartIndex !== -1 && nameStartIndex + 1 < lines.length) {
    // Collect potential name lines (up to 3 lines after label)
    const potentialNameLines = [];
    for (let i = nameStartIndex + 1; i < Math.min(nameStartIndex + 4, lines.length); i++) {
      const line = lines[i];
      const upper = line.toUpperCase();
      
      // Stop conditions (hit another label or ID number)
      if (upper.includes('RSBSA') && upper.includes('REFERENCE')) break;
      if (upper.includes('MOBILE WALLET')) break;
      if (upper.includes('DEPARTMENT OF')) break;
      if (upper.includes('NATIONAL REGISTRY')) break;
      if (line.match(/^\d{2}[-\s]\d{2}[-\s]\d{2}/)) break; // ID number pattern
      if (line.match(/^09\d{9}$/)) break; // Mobile number
      
      // Must be all caps and reasonable length (names on IDs are all caps)
      if (/^[A-Z][A-Z\s\.]+$/.test(line) && line.length > 2 && line.length < 50) {
        potentialNameLines.push(line);
      }
    }

    if (potentialNameLines.length > 0) {
      // Join lines: "JEAN BETH" + "C SANDA" = "JEAN BETH C SANDA"
      const fullNameText = potentialNameLines.join(' ');
      const nameParts = fullNameText.trim().split(/\s+/).filter(p => p.length > 0);
      
      if (nameParts.length >= 2) {
        // Strategy: Last word is typically the surname
        // Words before that are first name + optional middle initial
        
        data.surname = nameParts[nameParts.length - 1];
        
        // Look for middle initial (single letter, or letter with period, before surname)
        let middleIdx = -1;
        for (let j = 1; j < nameParts.length - 1; j++) {
          const part = nameParts[j].replace('.', '').trim();
          if (part.length === 1 && /^[A-Z]$/.test(part)) {
            middleIdx = j;
            data.middleName = part;
            break;
          }
        }
        
        // First name is everything from start to middle initial (or to surname if no middle)
        if (middleIdx !== -1) {
          data.givenName = nameParts.slice(0, middleIdx).join(' ');
        } else {
          data.givenName = nameParts.slice(0, nameParts.length - 1).join(' ');
        }
        
        // Construct full name
        data.fullName = [data.givenName, data.middleName, data.surname]
          .filter(Boolean)
          .join(' ');
      }
    }
  }

  // Fallback name extraction if label method fails
  if (!data.fullName) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip headers and labels
      const upper = line.toUpperCase();
      if (upper.includes('DEPARTMENT') || 
          upper.includes('AGRICULTURE') || 
          upper.includes('REGISTRY') || 
          upper.includes('SYSTEM') ||
          upper.includes('RSBSA') || 
          upper.includes('REFERENCE') ||
          upper.includes('MOBILE') || 
          upper.includes('WALLET') ||
          upper.includes('FARMERS') || 
          upper.includes('FISHERS') ||
          upper.includes('NATIONAL') ||
          upper.includes('BASIC') ||
          upper.includes('SECTORS')) {
        continue;
      }
      
      // Look for ALL CAPS name pattern
      if (/^[A-Z][A-Z\s\.]+$/.test(line) && line.length > 5 && line.length < 50) {
        const parts = line.split(/\s+/).filter(p => p.length > 0);
        
        if (parts.length >= 2 && parts.length <= 6) {
          // Check if last part looks like a surname (not a single letter)
          if (parts[parts.length - 1].length > 1) {
            data.surname = parts[parts.length - 1];
            
            // Check for middle initial in the middle
            let middleIdx = -1;
            for (let j = 1; j < parts.length - 1; j++) {
              const p = parts[j].replace('.', '');
              if (p.length === 1) {
                middleIdx = j;
                data.middleName = p;
                break;
              }
            }
            
            if (middleIdx !== -1) {
              data.givenName = parts.slice(0, middleIdx).join(' ');
            } else {
              data.givenName = parts.slice(0, parts.length - 1).join(' ');
            }
            
            data.fullName = [data.givenName, data.middleName, data.surname]
              .filter(Boolean)
              .join(' ');
            break;
          }
        }
      }
    }
  }

  console.log('RSBSA Extracted Data:', {
    idNumber: data.idNumber,
    fullName: data.fullName,
    surname: data.surname,
    givenName: data.givenName,
    middleName: data.middleName,
    mobileWalletNo: data.mobileWalletNo
  });

  return data;
}

// ==================== ID TYPE DETECTION ====================
function detectIDType(text) {
  const upper = text.toUpperCase();
  
  // Check for RSBSA/Farmers ID first (most specific)
  if (upper.includes('FARMERS AND FISHERS') || 
      upper.includes('NATIONAL REGISTRY SYSTEM FOR BASIC SECTORS') ||
      upper.includes('RSBSA') ||
      (upper.includes('DEPARTMENT OF AGRICULTURE') && upper.includes('REGISTRY'))) {
    return 'Farmers and Fisheries ID (RSBSA)';
  }

  const patterns = [
    { type: 'Philippine Passport', keywords: ['PASSPORT', 'DEPARTMENT OF FOREIGN AFFAIRS'] },
    { type: "Driver's License", keywords: ['DRIVER', 'LTO', 'LAND TRANSPORTATION'] },
    { type: 'UMID / SSS ID', keywords: ['UMID', 'SSS', 'SOCIAL SECURITY'] },
    { type: 'PhilHealth ID', keywords: ['PHILHEALTH'] },
    { type: "Voter's ID", keywords: ['VOTER', 'COMELEC'] },
    { type: 'Postal ID', keywords: ['POSTAL', 'PHLPOST'] },
    { type: 'Philippine National ID', keywords: ['PHILSYS', 'NATIONAL ID', 'PHILIPPINE IDENTIFICATION', 'PHILIPPINE IDENTIFICATION CARD', 'PHIL ID'] },
    { type: 'TIN ID', keywords: ['TIN', 'BIR', 'BUREAU OF INTERNAL REVENUE'] },
    { type: 'PRC ID', keywords: ['PRC', 'PROFESSIONAL REGULATION'] }
  ];

  for (const { type, keywords } of patterns) {
    if (keywords.some(kw => upper.includes(kw))) return type;
  }
  
  return 'Philippine Government ID';
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
    const { tempId, idType, idNumber } = req.body;
    
    if (!tempId) {
      return res.status(400).json({
        success: false,
        error: 'Missing tempId. Please complete registration form first.',
        code: 'MISSING_TEMP_ID'
      });
    }

    // Verify tempId exists
    const pendingDoc = await db.collection('pendingFarmers').doc(tempId).get();
    if (!pendingDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Registration session expired or not found. Please start over.',
        code: 'SESSION_EXPIRED'
      });
    }

    const pendingData = pendingDoc.data();
    
    // Check max attempts
    if (pendingData.verificationAttempts >= pendingData.maxAttempts) {
      return res.status(403).json({
        success: false,
        error: 'Maximum verification attempts reached. Please start registration again.',
        code: 'MAX_ATTEMPTS'
      });
    }

    // Increment attempt counter
    await db.collection('pendingFarmers').doc(tempId).update({
      verificationAttempts: (pendingData.verificationAttempts || 0) + 1,
      lastAttemptAt: new Date()
    });

    if (!req.files?.idImage || !req.files?.selfieImage) {
      return res.status(400).json({ 
        success: false,
        error: 'Both ID image and selfie are required',
        code: 'MISSING_IMAGES'
      });
    }

    console.log(`🔍 Processing verification for tempId: ${tempId}, ID Type: ${idType || 'auto-detect'}`);

    const idBuffer = req.files.idImage[0].buffer;
    const selfieBuffer = req.files.selfieImage[0].buffer;

    // Preprocess ID image for better OCR
    const preprocessedBuffer = await preprocessImage(idBuffer);

    // Run Face++ and Google Vision in parallel
    const [faceResult, ocrResult] = await Promise.all([
      runFaceVerification(idBuffer, selfieBuffer),
      runOCR(preprocessedBuffer, idBuffer)
    ]);

    incrementCounters();

    // Determine which extraction algorithm to use
    const detectedIdType = detectIDType(ocrResult.preprocessed.text + ' ' + ocrResult.original.text);
    console.log('Detected ID Type:', detectedIdType);
    
    let extractedData;
    
    // Route to appropriate extraction algorithm
    if (detectedIdType === 'Farmers and Fisheries ID (RSBSA)' || idType === 'farmers_fisheries_id') {
      console.log('Using RSBSA extraction algorithm');
      extractedData = extractRSBSAData(ocrResult.preprocessed.text + '\n' + ocrResult.original.text);
    } else {
      console.log('Using Philippine National ID extraction algorithm');
      extractedData = extractPhilippineIDData(ocrResult.preprocessed.text + '\n' + ocrResult.original.text);
    }

    console.log('Face Match Score:', faceResult.faceMatch?.score);
    console.log('Extracted ID Number:', extractedData?.idNumber);
    console.log('Extracted Name:', extractedData?.fullName);

    // Determine verification status
    const faceThreshold = 60;
    const hasFaceMatch = faceResult.faceMatch?.score > faceThreshold;
    const hasIdData = !!extractedData?.idNumber && !!extractedData?.fullName;
    
    const isVerified = hasFaceMatch && hasIdData;

    // Upload images to Firebase Storage
    const [idCardUrl, selfieUrl] = await Promise.all([
      uploadVerificationImage(idBuffer, `id-card-${Date.now()}.jpg`, tempId),
      uploadVerificationImage(selfieBuffer, `selfie-${Date.now()}.jpg`, tempId)
    ]);

    // Update pending document
    await db.collection('pendingFarmers').doc(tempId).update({
      verificationResults: {
        faceMatch: faceResult.faceMatch,
        extractedData: extractedData,
        verified: isVerified,
        attemptedAt: new Date(),
        idCardUrl: idCardUrl,
        selfieUrl: selfieUrl
      }
    });

    const response = {
      success: true,
      verified: isVerified,
      tempId: tempId,
      verification: {
        faceMatch: faceResult.faceMatch,
        idData: extractedData,
        idType: idType || extractedData?.idType || 'Unknown',
        providedIdNumber: idNumber,
        extractedIdNumber: extractedData?.idNumber,
        checks: {
          faceMatchPassed: hasFaceMatch,
          idDataExtracted: hasIdData,
          threshold: faceThreshold
        }
      },
      idCardUrl: idCardUrl || null,
      selfieUrl: selfieUrl || null,
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

// ==================== PHILIPPINE NATIONAL ID EXTRACTION ====================
// Position-based algorithm for Philsys IDs (unchanged from original)

function extractPhilippineIDData(text) {
  const data = {
    fullName: null,
    surname: null,
    givenName: null,
    middleName: null,
    idNumber: null,
    dateOfBirth: null,
    nationality: 'Filipino',
    address: null,
    placeOfBirth: null,
    idType: 'Philippine National ID',
    sex: null,
    height: null,
    weight: null,
    bloodType: null,
    dateIssued: null,
    dateExpired: null
  };

  const lines = text.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  // Remove garbage lines
  const cleanLines = lines.filter(line => {
    const upper = line.toUpperCase();
    const garbagePatterns = [
      'REPUBLIKANG PILIPINAS', 'REPUBLIC OF THE PHILIPPINES',
      'PHILIPPINE STATISTICS AUTHORITY', 'DEPARTMENT OF',
      'BUREAU OF', 'COMMISSION ON', 'ANG REPUBLIKA',
      'PILIPINAS', 'FILIPINAS', 'PAMBANSA', 'PAGKAKAKILANLAN',
      'PHILIPPINES', 'REPUBLIC', 'APELYIDO', 'PANGALAN',
      'GIVEN', 'NAMES', 'LAST', 'NAME', 'MIDDLE', 'GITNANG',
      'PETSA', 'KAPANGANAKAN', 'DATE', 'BIRTH', 'TIRAHAN',
      'ADDRESS', 'CITY', 'ZONE', 'SREPUBLIKAND', 'REPUBLIKANGPL', 'INASIE'
    ];
    const isGarbage = garbagePatterns.some(g => upper.includes(g));
    return !isGarbage && line.length < 60 && line.length > 2;
  });

  // ID NUMBER: Look for 4-4-4-4 format
  const nationalIdPattern = /\b(\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4})\b/;
  const nationalIdMatch = text.match(nationalIdPattern);
  if (nationalIdMatch) {
    data.idNumber = nationalIdMatch[1].replace(/[\s\-]/g, '');
  }

  // Name extraction - Look for labels
  const surnameIndex = cleanLines.findIndex(l => 
    l.toUpperCase().includes('APELLIDO') || 
    l.toUpperCase().includes('LAST NAME') ||
    l.toUpperCase().includes('SURNAME')
  );
  
  const givenIndex = cleanLines.findIndex(l => 
    l.toUpperCase().includes('MGA PANGALAN') || 
    l.toUpperCase().includes('GIVEN NAMES') ||
    l.toUpperCase().includes('FIRST NAME')
  );
  
  const middleIndex = cleanLines.findIndex(l => 
    l.toUpperCase().includes('GITNANG APELLIDO') || 
    l.toUpperCase().includes('MIDDLE NAME')
  );

  if (surnameIndex !== -1 && cleanLines[surnameIndex + 1]) {
    data.surname = cleanLines[surnameIndex + 1];
  }
  if (givenIndex !== -1 && cleanLines[givenIndex + 1]) {
    data.givenName = cleanLines[givenIndex + 1];
  }
  if (middleIndex !== -1 && cleanLines[middleIndex + 1]) {
    data.middleName = cleanLines[middleIndex + 1];
  }

  if (data.surname || data.givenName) {
    const parts = [data.givenName, data.middleName, data.surname].filter(Boolean);
    if (parts.length > 0) data.fullName = parts.join(' ');
  }

  // Fallback name extraction
  if (!data.fullName) {
    for (let i = 0; i < Math.min(15, cleanLines.length); i++) {
      const line = cleanLines[i];
      if (/^[A-Z][A-Z\s\-\.]+$/.test(line) && 
          line.split(/\s+/).length >= 2 && 
          line.split(/\s+/).length <= 5 &&
          line.length > 8 && 
          line.length < 40) {
        data.fullName = line;
        break;
      }
    }
  }

  // Address extraction
  const addressIndex = cleanLines.findIndex((l, idx) => {
    const upper = l.toUpperCase();
    return (upper.includes('TIRAHAN') || upper.includes('ADDRESS')) &&
           !upper.includes('APELLIDO') && !upper.includes('PANGALAN');
  });

  if (addressIndex !== -1 && cleanLines[addressIndex + 1]) {
    data.address = cleanLines[addressIndex + 1];
  }

  // Date of Birth
  const dobIndex = cleanLines.findIndex(l => 
    l.toUpperCase().includes('PETSA NG KAPANGANAKAN') || 
    l.toUpperCase().includes('DATE OF BIRTH')
  );
  
  if (dobIndex !== -1) {
    const dateMatch = cleanLines[dobIndex].match(/(\d{1,2}[\/\-\.\s]\d{1,2}[\/\-\.\s]\d{2,4})/) ||
                     (cleanLines[dobIndex + 1] && cleanLines[dobIndex + 1].match(/(\d{1,2}[\/\-\.\s]\d{1,2}[\/\-\.\s]\d{2,4})/));
    if (dateMatch) data.dateOfBirth = dateMatch[1];
  }

  // Clean up
  data.fullName = cleanName(data.fullName);
  data.surname = cleanName(data.surname);
  data.givenName = cleanName(data.givenName);

  return data;
}

function cleanName(name) {
  if (!name) return null;
  return name.replace(/\s+/g, ' ').replace(/[^\w\s\-]/g, '').trim();
}

// ==================== HELPER FUNCTIONS ====================

async function preprocessImage(buffer) {
  try {
    return await sharp(buffer)
      .resize(2000, 1500, { fit: 'inside', withoutEnlargement: false })
      .modulate({ brightness: 1.1, contrast: 1.3 })
      .sharpen({ sigma: 1.5, flat: 1, jagged: 2 })
      .grayscale()
      .median(3)
      .jpeg({ quality: 95, progressive: true })
      .toBuffer();
  } catch (err) {
    console.error('Preprocessing failed, using original:', err);
    return buffer;
  }
}

async function runOCR(preprocessedBuffer, originalBuffer) {
  const [preprocessedResult, originalResult] = await Promise.all([
    visionClient.documentTextDetection(preprocessedBuffer).catch(() => null),
    visionClient.documentTextDetection(originalBuffer).catch(() => null)
  ]);

  const parseResult = (result) => {
    if (!result || !result[0]) return { text: '', confidence: 0, pages: [] };
    const fullText = result[0].fullTextAnnotation?.text || '';
    const pages = result[0].fullTextAnnotation?.pages || [];
    const confidence = pages[0]?.blocks?.[0]?.confidence || 0;
    return { text: fullText, confidence, pages };
  };

  return {
    preprocessed: parseResult(preprocessedResult),
    original: parseResult(originalResult)
  };
}

async function runFaceVerification(idBuffer, selfieBuffer) {
  console.log('👤 Running face detection...');
  
  const idFaceResult = await detectFaceWithRetry(idBuffer);
  await delay(1000);
  
  const selfieFaceResult = await detectFaceWithRetry(selfieBuffer);
  
  if (!idFaceResult.faces?.length) {
    throw new Error('No face detected in ID image');
  }
  if (!selfieFaceResult.faces?.length) {
    throw new Error('No face detected in selfie');
  }

  console.log(`✓ ID face: ${idFaceResult.faces.length}, Selfie face: ${selfieFaceResult.faces.length}`);

  await delay(1000);
  
  const compareResult = await compareFacesWithRetry(
    idFaceResult.faces[0].face_token,
    selfieFaceResult.faces[0].face_token
  );

  const confidence = compareResult.confidence || 0;
  
  return {
    isVerified: confidence > 60,
    faceMatch: {
      score: Math.round(confidence),
      rawConfidence: confidence,
      confidence: confidence > 80 ? 'High' : confidence > 60 ? 'Medium' : 'Low',
      threshold: 60,
      passed: confidence > 60
    }
  };
}

async function detectFaceWithRetry(imageBuffer, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const formData = new FormData();
      formData.append('api_key', FACEPP_API_KEY);
      formData.append('api_secret', FACEPP_API_SECRET);
      formData.append('image_file', imageBuffer, 'image.jpg');
      formData.append('return_attributes', 'facequality,blur,eyestatus,headpose');

      const { data } = await axios.post(
        `${FACEPP_BASE_URL}/detect`,
        formData,
        { headers: formData.getHeaders(), timeout: 60000 }
      );
      
      return data;
    } catch (err) {
      console.warn(`Face detection attempt ${i + 1} failed:`, err.response?.data?.error_message || err.message);
      if (i === retries) throw err;
      await delay(2000 * (i + 1));
    }
  }
}

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
        { headers: formData.getHeaders(), timeout: 60000 }
      );
      
      return data;
    } catch (err) {
      console.warn(`Face compare attempt ${i + 1} failed:`, err.response?.data?.error_message || err.message);
      if (i === retries) throw err;
      await delay(2000 * (i + 1));
    }
  }
}

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
      vision: !!visionClient,
      firebase: !!db,
      storage: !!storage,
      algorithms: ['RSBSA-Farmers-ID-v1', 'Philippine-National-ID-v1']
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    features: ['Face++ Face Match', 'Google Vision OCR', 'RSBSA ID Extraction', 'National ID Extraction']
  });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║   IFH ID Verification Server                   ║
║   Running on port ${PORT}                        ║
╠════════════════════════════════════════════════╣
║   Algorithms:                                  ║
║   • RSBSA Farmers ID (First-Middle-Last)     ║
║   • Philippine National ID (Position-based)  ║
╚════════════════════════════════════════════════╝
  `);
});