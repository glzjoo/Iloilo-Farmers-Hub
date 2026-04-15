import * as sharp from 'sharp';
import axios from 'axios';
import FormData from 'form-data';
import { FACEPP_API_KEY, FACEPP_API_SECRET, FACEPP_BASE_URL } from './config';

export const rateLimits = {
  daily: { count: 0, date: new Date().toDateString() },
  monthly: { count: 0, month: new Date().getMonth() }
};

export function checkRateLimit() {
  const now = new Date();
  if (now.toDateString() !== rateLimits.daily.date) {
    rateLimits.daily = { count: 0, date: now.toDateString() };
  }
  if (now.getMonth() !== rateLimits.monthly.month) {
    rateLimits.monthly = { count: 0, month: now.getMonth() };
  }
  
  if (rateLimits.daily.count >= 300) return { allowed: false, reason: 'Daily limit reached (300)' };
  if (rateLimits.monthly.count >= 900) return { allowed: false, reason: 'Monthly limit reached (900)' };
  return { allowed: true };
}

export function incrementCounters() {
  rateLimits.daily.count++;
  rateLimits.monthly.count++;
}

export async function preprocessImage(buffer: Buffer) {
  try {
    return await (sharp as any)(buffer)
      .resize(2000, 1500, { fit: 'inside', withoutEnlargement: false })
      .modulate({ brightness: 1.1, contrast: 1.3 })
      .sharpen({ sigma: 1.5, flat: 1, jagged: 2 })
      .grayscale()
      .median(3)
      .jpeg({ quality: 95, progressive: true })
      .toBuffer();
  } catch (err) {
    console.error('Preprocessing failed:', err);
    return buffer;
  }
}

export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function detectIDType(text: string) {
  const upper = text.toUpperCase();

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
    { type: 'Philippine National ID', keywords: ['PHILSYS', 'NATIONAL ID', 'PHILIPPINE IDENTIFICATION'] },
    { type: 'TIN ID', keywords: ['TIN', 'BIR'] },
    { type: 'PRC ID', keywords: ['PRC', 'PROFESSIONAL REGULATION'] }
  ];

  for (const { type, keywords } of patterns) {
    if (keywords.some(kw => upper.includes(kw))) return type;
  }

  return 'Philippine Government ID';
}

export function extractRSBSAData(text: string) {
  const data = {
    fullName: null as string | null,
    surname: null as string | null,
    givenName: null as string | null,
    middleName: null as string | null,
    idNumber: null as string | null,
    mobileWalletNo: null as string | null,
    idType: 'Farmers and Fisheries ID (RSBSA)',
    issuingAgency: 'Department of Agriculture'
  };

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Extract RSBSA Reference Number
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upperLine = line.toUpperCase();

    if (upperLine.includes('RSBSA') && (upperLine.includes('REFERENCE') || upperLine.includes('REF'))) {
      const sameLineMatch = line.match(/(\d{2}[-\s]?\d{2}[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{6})/);
      if (sameLineMatch) {
        data.idNumber = sameLineMatch[1].replace(/[\s]/g, '');
        break;
      }
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

  if (!data.idNumber) {
    const rsbsaPattern = /\b(\d{2}[-\s]?\d{2}[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{6})\b/;
    const match = text.match(rsbsaPattern);
    if (match) data.idNumber = match[1].replace(/[\s]/g, '');
  }

  // Extract Mobile Wallet
  for (let i = 0; i < lines.length; i++) {
    const upperLine = lines[i].toUpperCase();
    if (upperLine.includes('MOBILE WALLET') || upperLine.includes('MOBILE NO')) {
      const mobileMatch = lines[i].match(/(09\d{9})/);
      if (mobileMatch) {
        data.mobileWalletNo = mobileMatch[1];
        break;
      }
      if (lines[i + 1]) {
        const nextMobileMatch = lines[i + 1].match(/(09\d{9})/);
        if (nextMobileMatch) {
          data.mobileWalletNo = nextMobileMatch[1];
          break;
        }
      }
    }
  }

  // Name Extraction
  let nameStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const upperLine = lines[i].toUpperCase().replace(/\s+/g, ' ').trim();
    if (upperLine === 'FULL NAME' || upperLine === 'NAME' || upperLine.includes('FULL NAME')) {
      nameStartIndex = i;
      break;
    }
  }

  if (nameStartIndex !== -1 && nameStartIndex + 1 < lines.length) {
    const potentialNameLines = [];
    for (let i = nameStartIndex + 1; i < Math.min(nameStartIndex + 4, lines.length); i++) {
      const line = lines[i];
      const upper = line.toUpperCase();
      
      if (upper.includes('RSBSA') && upper.includes('REFERENCE')) break;
      if (upper.includes('MOBILE WALLET')) break;
      if (line.match(/^\d{2}[-\s]\d{2}[-\s]\d{2}/)) break;
      if (line.match(/^09\d{9}$/)) break;
      
      if (/^[A-Z][A-Z\s\.]+$/.test(line) && line.length > 2 && line.length < 50) {
        potentialNameLines.push(line);
      }
    }

    if (potentialNameLines.length > 0) {
      const fullNameText = potentialNameLines.join(' ');
      const nameParts = fullNameText.trim().split(/\s+/).filter(p => p.length > 0);

      if (nameParts.length >= 2) {
        data.surname = nameParts[nameParts.length - 1];
        let middleIdx = -1;
        for (let j = 1; j < nameParts.length - 1; j++) {
          const part = nameParts[j].replace('.', '').trim();
          if (part.length === 1 && /^[A-Z]$/.test(part)) {
            middleIdx = j;
            data.middleName = part;
            break;
          }
        }

        if (middleIdx !== -1) {
          data.givenName = nameParts.slice(0, middleIdx).join(' ');
        } else {
          data.givenName = nameParts.slice(0, nameParts.length - 1).join(' ');
        }

        data.fullName = [data.givenName, data.middleName, data.surname].filter(Boolean).join(' ');
      }
    }
  }

  return data;
}

export function extractPhilippineIDData(text: string) {
  const data = {
    fullName: null as string | null,
    surname: null as string | null,
    givenName: null as string | null,
    middleName: null as string | null,
    idNumber: null as string | null,
    dateOfBirth: null as string | null,
    nationality: 'Filipino',
    address: null as string | null,
    idType: 'Philippine National ID'
  };

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const cleanLines = lines.filter(line => {
    const upper = line.toUpperCase();
    const garbage = ['REPUBLIKANG', 'PHILIPPINE STATISTICS', 'DEPARTMENT OF', 'BUREAU OF', 'COMMISSION ON'];
    return !garbage.some(g => upper.includes(g)) && line.length < 60 && line.length > 2;
  });

  // ID Number pattern 4-4-4-4
  const nationalIdPattern = /\b(\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4})\b/;
  const nationalIdMatch = text.match(nationalIdPattern);
  if (nationalIdMatch) {
    data.idNumber = nationalIdMatch[1].replace(/[\s\-]/g, '');
  }

  // Name extraction
  const surnameIndex = cleanLines.findIndex(l => l.toUpperCase().includes('APELLIDO') || l.toUpperCase().includes('LAST NAME'));
  const givenIndex = cleanLines.findIndex(l => l.toUpperCase().includes('MGA PANGALAN') || l.toUpperCase().includes('GIVEN NAMES'));
  const middleIndex = cleanLines.findIndex(l => l.toUpperCase().includes('GITNANG APELLIDO') || l.toUpperCase().includes('MIDDLE NAME'));

  if (surnameIndex !== -1 && cleanLines[surnameIndex + 1]) data.surname = cleanLines[surnameIndex + 1];
  if (givenIndex !== -1 && cleanLines[givenIndex + 1]) data.givenName = cleanLines[givenIndex + 1];
  if (middleIndex !== -1 && cleanLines[middleIndex + 1]) data.middleName = cleanLines[middleIndex + 1];

  if (data.surname || data.givenName) {
    const parts = [data.givenName, data.middleName, data.surname].filter(Boolean);
    if (parts.length > 0) data.fullName = parts.join(' ');
  }

  return data;
}

export async function runFaceVerification(idBuffer: Buffer, selfieBuffer: Buffer) {
  const idFace = await detectFaceWithRetry(idBuffer);
  await delay(1000);
  const selfieFace = await detectFaceWithRetry(selfieBuffer);
  
  if (!idFace.faces?.[0] || !selfieFace.faces?.[0]) {
    throw new Error('No face detected in one or both images');
  }

  await delay(1000);
  const comparison = await compareFacesWithRetry(
    idFace.faces[0].face_token,
    selfieFace.faces[0].face_token
  );

  const confidence = comparison.confidence || 0;
  return {
    isVerified: confidence > 60,
    faceMatch: {
      score: Math.round(confidence),
      passed: confidence > 60,
      threshold: 60,
      confidence: confidence > 80 ? 'High' : confidence > 60 ? 'Medium' : 'Low'
    }
  };
}

async function detectFaceWithRetry(imageBuffer: Buffer, retries = 2) {
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
    } catch (err: any) {
      if (i === retries) throw err;
      await delay(2000 * (i + 1));
    }
  }
  throw new Error('Face detection failed');
}

async function compareFacesWithRetry(token1: string, token2: string, retries = 2) {
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
    } catch (err: any) {
      if (i === retries) throw err;
      await delay(2000 * (i + 1));
    }
  }
  throw new Error('Face comparison failed');
}