import * as functions from 'firebase-functions/v1';
import Busboy from 'busboy';
import { db, storage, visionClient } from './config';
import { 
  checkRateLimit, 
  incrementCounters, 
  preprocessImage, 
  runFaceVerification,
  detectIDType,
  extractRSBSAData,
  extractPhilippineIDData
} from './utils';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const verifyFarmerId = functions
  .runWith({
    memory: '1GB',
    timeoutSeconds: 60
  })
  .https.onRequest(async (req, res) => {
    
    // Set CORS headers immediately for ALL responses
    res.set(corsHeaders);
    
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const limitCheck = checkRateLimit();
    if (!limitCheck.allowed) {
      res.status(429).json({ success: false, error: limitCheck.reason });
      return;
    }

    const bb = Busboy({ headers: req.headers });
    const files: { [key: string]: Buffer } = {};
    const fields: { [key: string]: string } = {};

    bb.on('file', (name: string, file: any) => {
      const chunks: Buffer[] = [];
      file.on('data', (data: Buffer) => chunks.push(data));
      file.on('end', () => {
        files[name] = Buffer.concat(chunks);
      });
    });

    bb.on('field', (name: string, value: string) => {
      fields[name] = value;
    });

    bb.on('finish', async () => {
      try {
        const { tempId, idType } = fields;

        if (!tempId || !files.idImage || !files.selfieImage) {
          res.status(400).json({ 
            success: false, 
            error: 'Missing tempId, ID image, or selfie',
            code: 'MISSING_DATA'
          });
          return;
        }

        const pendingDoc = await db.collection('pendingFarmers').doc(tempId).get();
        if (!pendingDoc.exists) {
          res.status(404).json({
            success: false,
            error: 'Registration session expired',
            code: 'SESSION_EXPIRED'
          });
          return;
        }

        const pendingData = pendingDoc.data();
        if ((pendingData?.verificationAttempts || 0) >= 3) {
          res.status(403).json({
            success: false,
            error: 'Maximum verification attempts reached',
            code: 'MAX_ATTEMPTS'
          });
          return;
        }

        await db.collection('pendingFarmers').doc(tempId).update({
          verificationAttempts: (pendingData?.verificationAttempts || 0) + 1,
          lastAttemptAt: new Date()
        });

        const idBuffer = files.idImage;        
        const selfieBuffer = files.selfieImage;
        const preprocessedBuffer = await preprocessImage(idBuffer);

        // Run Face++ verification
        const faceResult = await runFaceVerification(idBuffer, selfieBuffer);

        // Run OCR
        const [ocrResult] = await visionClient.documentTextDetection(preprocessedBuffer);
        const extractedText = ocrResult.fullTextAnnotation?.text || '';

        // DEBUG LOG - Check what Vision API returns
        console.log('=== OCR DEBUG ===');
        console.log('Extracted text length:', extractedText.length);
        console.log('Extracted text preview:', extractedText.substring(0, 500));
        console.log('Full annotation:', JSON.stringify(ocrResult.fullTextAnnotation, null, 2).substring(0, 1000));
        console.log('==================');        

        // Determine ID type and extract data
        const detectedType = detectIDType(extractedText);
        let extractedData;
        
        if (detectedType === 'Farmers and Fisheries ID (RSBSA)' || idType === 'farmers_fisheries_id') {
          extractedData = extractRSBSAData(extractedText);
        } else {
          extractedData = extractPhilippineIDData(extractedText);
        }

        // Upload images
        const timestamp = Date.now();
        const bucket = storage.bucket();
        
        const uploadImage = async (buffer: Buffer, filename: string) => {
          const path = `verifications/${tempId}/${filename}`;
          const file = bucket.file(path);
          await file.save(buffer, { metadata: { contentType: 'image/jpeg' } });
          await file.makePublic();
          return `https://storage.googleapis.com/${bucket.name}/${path}`;
        };

        const [IdCardUrl, selfieUrl] = await Promise.all([
          uploadImage(idBuffer, `id-card-${timestamp}.jpg`),
          uploadImage(selfieBuffer, `selfie-${timestamp}.jpg`)  
        ]);

        incrementCounters();

        // Determine final status
        const hasIdData = !!extractedData?.idNumber && !!extractedData?.fullName;
        const isVerified = faceResult.faceMatch.passed && hasIdData;

        await db.collection('pendingFarmers').doc(tempId).update({
          idVerified: isVerified,  // <-- ADD THIS LINE
          verificationResults: {
            faceMatch: faceResult.faceMatch,
            extractedData: extractedData,
            verified: isVerified,
            attemptedAt: new Date(),
            IdCardUrl: IdCardUrl,
            selfieUrl: selfieUrl
          }
        });

        res.json({
          success: true,
          verified: isVerified,
          tempId: tempId,
          verification: {
            faceMatch: faceResult.faceMatch,
            IdData: extractedData,
            IdType: idType || extractedData?.idType || 'Unknown',
            checks: {
              faceMatchPassed: faceResult.faceMatch.passed,
              IdDataExtracted: hasIdData
            }
          },
          IdCardUrl: IdCardUrl,
          selfieUrl: selfieUrl,
          rateLimit: {
            dailyRemaining: Math.max(0, 300 - (global as any).rateLimits?.daily?.count || 0),
            monthlyRemaining: Math.max(0, 900 - (global as any).rateLimits?.monthly?.count || 0)
          }
        });

      } catch (error: any) {
        console.error('Verification error:', error);
        res.status(500).json({ 
          success: false, 
          error: error.message || 'Verification failed',
          code: 'VERIFICATION_ERROR'
        });
      }
    });

    bb.on('error', (err: any) => {
      console.error('Busboy error:', err);
      res.status(400).json({ success: false, error: 'Invalid form data' });
    });

    bb.end(req.rawBody);
  });