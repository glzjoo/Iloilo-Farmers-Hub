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
      runOCR(preprocessedBuffer, idBuffer) // Pass both preprocessed and original
    ]);

    incrementCounters();

    // Use the improved position-based extraction algorithm
    const extractedData = mergeOCRResults(ocrResult.preprocessed, ocrResult.original);

    // DEBUG: Log the results
    console.log('Face Match Score:', faceResult.faceMatch?.score);
    console.log('Extracted ID Number:', extractedData?.idNumber);
    console.log('Extracted Name:', extractedData?.fullName);
    console.log('Is Face Verified:', faceResult.isVerified);

    // Determine verification status
    const faceThreshold = 60;
    const hasFaceMatch = faceResult.faceMatch?.score > faceThreshold;
    const hasIdData = !!extractedData?.idNumber && !!extractedData?.fullName;
    
    // Require both face match AND valid ID data
    const isVerified = hasFaceMatch && hasIdData;

    const response = {
      success: true,
      verified: isVerified,
      farmerId: userId,
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

// Run OCR on both preprocessed and original
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

// Merge and select best OCR results
function mergeOCRResults(preprocessed, original) {
  const best = preprocessed.confidence > original.confidence ? preprocessed : original;
  const backup = preprocessed.confidence > original.confidence ? original : preprocessed;

  let text = best.text;
  if (text.length < 50 && backup.text.length > 50) {
    text = backup.text;
  }

  // Use the position-based extraction algorithm
  return extractPhilippineIDData(text);
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

  await delay(1000);
  
  // Compare faces
  const compareResult = await compareFacesWithRetry(
    idFaceResult.faces[0].face_token,
    selfieFaceResult.faces[0].face_token
  );

  const confidence = compareResult.confidence || 0;
  
  console.log('Face++ Compare Result:', {
    confidence: confidence,
    threshold: 60,
    request_id: compareResult.request_id
  });

  return {
    isVerified: confidence > 60,
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
      formData.append('return_attributes', 'facequality,blur,eyestatus,headpose');

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

// Utility: delay function
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/*DONT CHANGE MY POSITION BASED ALGO, THIS IS THE BEST ALGO FOR PHILIPPINE ID EXTRACTION FOR NOW.
I KNOW IT LOOKS MESSY BUT IT WORKS BETTER THAN ANYTHING ELSE OUT THERE. PLEASE DONT CHANGE IT. 
USED POSITION BASED EXTRACTION FOR PHILIPPINE ID BECAUSE PHILIPPINE IDS HAVE VERY INCONSISTENT FORMATS AND LAYOUTS, 
MAKING LABEL-BASED OR PATTERN-BASED EXTRACTION UNRELIABLE.

I BEG YOU. I SWEAR ON MY LIFE. I SWEAR ON MY FAMILY. I SWEAR ON MY DOG. I SWEAR ON MY HONOR. I SWEAR ON MY GRAVE. 
I SWEAR ON THE GRAVE OF MY ANCESTORS. I SWEAR ON THE GRAVE OF MY DESCENDANTS. I SWEAR ON THE GRAVE OF ALL PHILIPPINES. 
PLEASE DONT CHANGE IT.*/

// IMPROVED: Philippine ID extraction - POSITION BASED ALGORITHM
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
    idType: null,
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

  const upperText = text.toUpperCase();

  // Detect ID type
  data.idType = detectIDType(upperText);

  // Remove garbage lines
  const cleanLines = lines.filter(line => {
    const upper = line.toUpperCase();
    const garbagePatterns = [
      'REPUBLIKANG PILIPINAS',
      'REPUBLIC OF THE PHILIPPINES',
      'PHILIPPINE STATISTICS AUTHORITY',
      'DEPARTMENT OF',
      'BUREAU OF',
      'COMMISSION ON',
      'ANG REPUBLIKA',
      'PILIPINAS',
      'IDENTIFICATION',
      'IFICATION',
      'ENTIFICATION',
      'SECURITY',
      '-----',
      '=====',
      '...',
      'SREPUBLIKAND',  // OCR garbage
      'REPUBLIKANGPL', // OCR garbage
      'INASIE'         // OCR garbage
    ];
    const isGarbage = garbagePatterns.some(g => upper.includes(g));
    const isTooLong = line.length > 60;
    const isTooShort = line.length < 2;
    return !isGarbage && !isTooLong && !isTooShort;
  });

  console.log('Clean lines:', cleanLines);

  // STRATEGY 1: Position-based
  const positionData = extractByPosition(cleanLines, data.idType, text);
  Object.assign(data, positionData);

  // STRATEGY 2: Label-based
  if (!data.fullName || !data.idNumber) {
    const labelData = extractLabeledFields(text, cleanLines);
    Object.assign(data, labelData);
  }

  // STRATEGY 3: Pattern-based fallback
  if (!data.fullName || !data.idNumber || !data.dateOfBirth) {
    const patternData = extractByPatterns(text, cleanLines);
    for (const key of Object.keys(patternData)) {
      if (!data[key] && patternData[key]) {
        data[key] = patternData[key];
      }
    }
  }

  // Construct full name from parts if needed
  if (!data.fullName && (data.surname || data.givenName)) {
    const parts = [data.givenName, data.middleName, data.surname].filter(Boolean);
    if (parts.length > 0) {
      data.fullName = parts.join(' ');
    }
  }

  // Clean up
  data.fullName = cleanName(data.fullName);
  data.surname = cleanName(data.surname);
  data.givenName = cleanName(data.givenName);
  data.middleName = cleanName(data.middleName);

  // DEBUG: Log final extracted data
  console.log('FINAL EXTRACTED DATA:', {
    fullName: data.fullName,
    idNumber: data.idNumber,
    dateOfBirth: data.dateOfBirth,
    address: data.address,
    idType: data.idType
  });

  return data;
}

function detectIDType(text) {
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
    if (keywords.some(kw => text.includes(kw))) return type;
  }
  return 'Philippine Government ID';
}

// Position-based extraction
function extractByPosition(lines, idType, fullText) {
  const data = {};

  // PHILIPPINE NATIONAL ID (PHILSYS)
  if (idType === 'Philippine National ID' || idType === 'Philippine Government ID') {
    
    // ID NUMBER: Look for 4-4-4-4 format
    const nationalIdPattern = /\b(\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4})\b/;
    const nationalIdMatch = fullText.match(nationalIdPattern);
    if (nationalIdMatch) {
      data.idNumber = nationalIdMatch[1].replace(/[\s\-]/g, '');
    }

    // If not found, check clean lines
    if (!data.idNumber) {
      const idLine = lines.find(l => /^\d{4}[\s\-]\d{4}[\s\-]\d{4}[\s\-]\d{4}$/.test(l));
      if (idLine) data.idNumber = idLine.replace(/[\s\-]/g, '');
    }

    // NAME EXTRACTION - Look for Filipino/English labels
    const surnameIndex = lines.findIndex(l => 
      l.toUpperCase().includes('APELLIDO') || 
      l.toUpperCase().includes('LAST NAME') ||
      l.toUpperCase().includes('SURNAME')
    );
    
    const givenIndex = lines.findIndex(l => 
      l.toUpperCase().includes('MGA PANGALAN') || 
      l.toUpperCase().includes('GIVEN NAMES') ||
      l.toUpperCase().includes('FIRST NAME')
    );
    
    const middleIndex = lines.findIndex(l => 
      l.toUpperCase().includes('GITNANG APELLIDO') || 
      l.toUpperCase().includes('MIDDLE NAME')
    );

    // Extract surname
    if (surnameIndex !== -1 && lines[surnameIndex + 1]) {
      data.surname = lines[surnameIndex + 1];
    }

    // Extract given names
    if (givenIndex !== -1 && lines[givenIndex + 1]) {
      data.givenName = lines[givenIndex + 1];
    }

    // Extract middle name
    if (middleIndex !== -1 && lines[middleIndex + 1]) {
      data.middleName = lines[middleIndex + 1];
    }

    // Construct full name from parts
    if (data.surname || data.givenName || data.middleName) {
      const parts = [data.givenName, data.middleName, data.surname].filter(Boolean);
      if (parts.length > 0) {
        data.fullName = parts.join(' ');
      }
    }

    // Fallback: If no labels found, look for name pattern
    if (!data.fullName) {
      for (let i = 0; i < Math.min(15, lines.length); i++) {
        const line = lines[i];
        // All caps, 2-4 words, reasonable length
        if (/^[A-Z][A-Z\s\-\.]+$/.test(line) && 
            line.split(/\s+/).length >= 2 && 
            line.split(/\s+/).length <= 5 &&
            line.length > 8 && 
            line.length < 40) {
          
          // Check if next line is also name (continuation)
          const nextLine = lines[i + 1];
          if (nextLine && /^[A-Z][A-Z\s\-\.]+$/.test(nextLine) && 
              nextLine.split(/\s+/).length <= 3 &&
              nextLine.length < 30) {
            data.fullName = line + ' ' + nextLine;
            i++;
          } else {
            data.fullName = line;
          }
          break;
        }
      }
    }

    // ADDRESS - Fixed to skip label lines
    const addressIndex = lines.findIndex((l, idx) => {
      const upper = l.toUpperCase();
      // Must contain address keyword but NOT be a label itself
      const hasAddressKeyword = upper.includes('TIRAHAN') || 
                                upper.includes('ADDRESS') ||
                                upper.includes('RESIDENCE');
      const isLabel = upper.includes('APELLIDO') || 
                      upper.includes('LAST NAME') ||
                      upper.includes('SURNAME') ||
                      upper.includes('PANGALAN') ||
                      upper.includes('GIVEN') ||
                      upper.includes('MIDDLE') ||
                      upper.includes('PETSA') ||
                      upper.includes('DATE');
      
      return hasAddressKeyword && !isLabel && idx < lines.length - 1;
    });

    if (addressIndex !== -1) {
      // Get next line(s) that look like actual address
      let addressLines = [];
      for (let i = addressIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        const upper = line.toUpperCase();
        
        // Stop if we hit another label
        if (upper.includes('APELLIDO') || 
            upper.includes('LAST NAME') ||
            upper.includes('PANGALAN') ||
            upper.includes('GIVEN') ||
            upper.includes('MIDDLE') ||
            upper.includes('PETSA') ||
            upper.includes('DATE') ||
            upper.includes('BIRTH') ||
            upper.includes('KAPANGANAKAN')) {
          break;
        }
        
        // Valid address line should contain street/road indicators or be reasonably long
        const hasAddressIndicator = /(ST\.|STREET|AVE\.|AVENUE|RD\.|ROAD|CITY|BARANGAY|BRGY|PROVINCE)/i.test(line);
        const isReasonableLength = line.length > 10 && line.length < 100;
        
        if ((hasAddressIndicator || isReasonableLength) && !line.match(/^\d{4}[\s\-]\d{4}/)) {
          addressLines.push(line);
          // Stop after 2 lines of address
          if (addressLines.length >= 2) break;
        }
      }
      
      if (addressLines.length > 0) {
        data.address = addressLines.join(', ');
      }
    }

    // Fallback: If no address found, look for street/road patterns
    if (!data.address) {
      const streetLine = lines.find(l => 
        /(ST\.|STREET|AVE\.|AVENUE|RD\.|ROAD|BLVD|BOULEVARD)/i.test(l) &&
        l.length > 15 &&
        l.length < 100
      );
      if (streetLine) {
        // Check if next line is city/province
        const lineIdx = lines.indexOf(streetLine);
        if (lineIdx !== -1 && lines[lineIdx + 1] && lines[lineIdx + 1].length > 5) {
          data.address = streetLine + ', ' + lines[lineIdx + 1];
        } else {
          data.address = streetLine;
        }
      }
    }

    // DATE OF BIRTH
    const dobIndex = lines.findIndex(l => 
      l.toUpperCase().includes('PETSA NG KAPANGANAKAN') || 
      l.toUpperCase().includes('DATE OF BIRTH') ||
      l.toUpperCase().includes('BIRTH DATE')
    );
    
    if (dobIndex !== -1) {
      // Try same line
      const dateMatch = lines[dobIndex].match(/(\d{1,2}[\/\-\.\s]\d{1,2}[\/\-\.\s]\d{2,4})/);
      if (dateMatch) {
        data.dateOfBirth = dateMatch[1];
      } else if (lines[dobIndex + 1]) {
        // Try next line
        const nextDateMatch = lines[dobIndex + 1].match(/(\d{1,2}[\/\-\.\s]\d{1,2}[\/\-\.\s]\d{2,4})/);
        if (nextDateMatch) {
          data.dateOfBirth = nextDateMatch[1];
        } else {
          // Maybe it's in format like "MARCH 23, 2005"
          const textDateMatch = lines[dobIndex + 1].match(/([A-Z]+ \d{1,2},? \d{4})/i);
          if (textDateMatch) data.dateOfBirth = textDateMatch[1];
        }
      }
    }
  }

  // UMID / SSS ID
  else if (idType === 'UMID / SSS ID') {
    const sssIndex = lines.findIndex(l => l.toUpperCase().includes('SSS'));
    for (let i = Math.max(0, sssIndex - 2); i < Math.min(sssIndex + 5, lines.length); i++) {
      const line = lines[i];
      if (/^[A-Z\s\-\.]+$/.test(line) && 
          line.split(/\s+/).length >= 2 && 
          line.length > 8 && 
          line.length < 35) {
        data.fullName = line;
        break;
      }
    }
  }

  // DRIVER'S LICENSE
  else if (idType === "Driver's License") {
    for (let i = 0; i < Math.min(8, lines.length); i++) {
      const line = lines[i];
      if (/^[A-Z][A-Z\s\-\.]+$/.test(line) && 
          line.split(/\s+/).length >= 2 && 
          line.length > 8) {
        data.fullName = line;
        break;
      }
    }
  }

  // PASSPORT
  else if (idType === 'Philippine Passport') {
    const passportIndex = lines.findIndex(l => l.toUpperCase().includes('PASSPORT'));
    if (passportIndex !== -1) {
      const nameLines = lines.slice(passportIndex + 1, passportIndex + 4);
      const nameLine = nameLines.find(l => 
        /^[A-Z][A-Z\s\-\.]+$/.test(l) && 
        l.split(/\s+/).length >= 2
      );
      if (nameLine) data.fullName = nameLine;
    }
  }

  // Generic fallback
  if (!data.fullName && !data.surname) {
    for (const line of lines.slice(0, 15)) {
      const words = line.split(/\s+/);
      const isAllCaps = /^[A-Z\s\-\.]+$/.test(line);
      const wordCount = words.length;
      const hasCommonName = words.some(w => 
        ['JUAN', 'MARIA', 'JOSE', 'ANA', 'PEDRO', 'ROSARIO', 'DELA', 'DE', 'LOS', 'SANTOS', 'CRUZ', 'REYES', 'GARCIA', 'ANDRADA', 'ALEJAGA', 'REY', 'JANE'].includes(w)
      );
      
      if (isAllCaps && 
          wordCount >= 2 && 
          wordCount <= 5 && 
          line.length > 8 && 
          line.length < 35 &&
          (hasCommonName || wordCount >= 3)) {
        data.fullName = line;
        break;
      }
    }
  }

  return data;
}

// Label-based extraction
function extractLabeledFields(text, lines) {
  const data = {};

  for (let i = 0; i < lines.length; i++) {
    const upper = lines[i].toUpperCase();
    
    if (['SURNAME', 'LAST NAME', 'FAMILY NAME'].some(l => upper === l || upper.includes(l + ':'))) {
      if (lines[i + 1] && !lines[i + 1].toUpperCase().includes('NAME')) {
        data.surname = lines[i + 1];
      }
    }
    if (['GIVEN NAME', 'FIRST NAME', 'FORENAME'].some(l => upper === l || upper.includes(l + ':'))) {
      if (lines[i + 1]) data.givenName = lines[i + 1];
    }
    if (['MIDDLE NAME', 'MIDDLE INITIAL', 'MOTHER'].some(l => upper === l || upper.includes(l + ':'))) {
      if (lines[i + 1]) data.middleName = lines[i + 1];
    }
  }

  console.log('Extracted data from position:', {
    surname: data.surname,
    givenName: data.givenName,
    middleName: data.middleName,
    fullName: data.fullName,
    dateOfBirth: data.dateOfBirth,  
    address: data.address,          
    idNumber: data.idNumber
  });

  return data;
}

// Pattern-based fallback
function extractByPatterns(text, lines) {
  const data = {};

  // ID Number backup patterns
  if (!data.idNumber) {
    const patterns = [
      /\b(\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4})\b/,
      /\b([A-Z]{1,2}\d{6,10})\b/,
      /\b(\d{2}[\s\-]?\d{4}[\s\-]?\d{4})\b/,
      /\b(\d{9,12})\b/
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        data.idNumber = match[1].replace(/[\s\-]/g, '');
        break;
      }
    }
  }

  // Date patterns
  const dateMatches = text.match(/(\d{1,2}[\/\-\.\s]\d{1,2}[\/\-\.\s]\d{2,4})/g) || [];
  if (dateMatches.length > 0 && !data.dateOfBirth) {
    data.dateOfBirth = dateMatches[0];
  }
  if (dateMatches.length > 1) {
    data.dateIssued = dateMatches[dateMatches.length - 2];
    data.dateExpired = dateMatches[dateMatches.length - 1];
  }

  // Sex
  const sexMatch = text.match(/\b(MALE|FEMALE)\b/i);
  if (sexMatch && !data.sex) {
    data.sex = sexMatch[1].toUpperCase();
  }

  return data;
}

function cleanName(name) {
  if (!name) return null;
  return name
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\-]/g, '')
    .trim();
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
      algorithm: 'position-based-extraction-v1'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    features: ['Face++ Face Match', 'Google Vision OCR', 'Image Preprocessing', 'Position-Based Philippine ID Extraction']
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
║   Face++ API: ${FACEPP_API_KEY ? '✓ Connected' : '✗ Missing'}              ║
║   Google Vision: ${process.env.GOOGLE_VISION_KEY_FILE ? '✓ Connected' : '✗ Missing'}           ║
║   Algorithm: Position-Based Philippine ID    ║
║   Threshold: 60% (face match)                ║
╚════════════════════════════════════════════════╝
  `);
});