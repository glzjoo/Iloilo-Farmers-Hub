import fs from 'fs';

const OUTPUT_PATH = './src/data/iloilo-barangays.json';
const PROVINCE_CODE = '063000000';
const TARGET_MUNICIPALITIES = ['Oton', 'Pavia', 'San Miguel', 'Iloilo City'];

const headers = {
  'User-Agent': 'IloiloFarmersHub-Thesis/1.0 (your-email@school.edu)'
};

// Manual coordinates for known problematic barangays (backup data)
const MANUAL_COORDINATES = {
  // Oton
  'Batuan Ilaud': { lat: 10.6931, lng: 122.4736 },
  'Caboloan Norte': { lat: 10.7056, lng: 122.4814 },
  'Caboloan Sur': { lat: 10.6989, lng: 122.4789 },
  'Polo Maestra Bita': { lat: 10.7156, lng: 122.4892 },
  // Pavia - Purok barangays (use town center as approximation)
  'Purok I (Pob.)': { lat: 10.7753, lng: 122.5419 },
  'Purok II (Pob.)': { lat: 10.7760, lng: 122.5425 },
  'Purok III (Pob.)': { lat: 10.7745, lng: 122.5430 },
  'Purok IV (Pob.)': { lat: 10.7758, lng: 122.5410 },
};

async function fetchJSON(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

async function geocodeBarangay(barangayName, municipalityName) {
  // Try exact name first
  let query = `${barangayName}, ${municipalityName}, Iloilo, Philippines`;
  let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
  
  try {
    let data = await fetchJSON(url);
    if (data && data[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), source: 'nominatim' };
    }
    
    // Fallback 1: Remove parentheticals like "(Pob.)" or "Pob."
    const cleanName = barangayName.replace(/\(.*?\)/g, '').replace(/Pob\./gi, '').replace(/Bgy\./gi, 'Barangay').trim();
    if (cleanName !== barangayName) {
      query = `${cleanName}, ${municipalityName}, Iloilo, Philippines`;
      url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
      
      await new Promise(r => setTimeout(r, 1000)); // Rate limit
      data = await fetchJSON(url);
      if (data && data[0]) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), source: 'nominatim-clean' };
      }
    }
    
    // Fallback 2: Check manual coordinates
    if (MANUAL_COORDINATES[barangayName]) {
      return { ...MANUAL_COORDINATES[barangayName], source: 'manual' };
    }
    
    console.warn(`⚠️  Not found: ${barangayName}, ${municipalityName}`);
    return null;
  } catch (e) {
    console.error(`❌ Error: ${barangayName}`, e.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Fetching Iloilo barangays with fallback coordinates...');
  
  // FIX: Removed spaces in URLs
  const allMunicipalities = await fetchJSON(`https://psgc.gitlab.io/api/provinces/${PROVINCE_CODE}/municipalities.json`);
  
  const targetMunicipalities = allMunicipalities.filter(m => 
    TARGET_MUNICIPALITIES.includes(m.name)
  );

  if (targetMunicipalities.length === 0) {
    console.error('❌ No municipalities found. Check spelling.');
    process.exit(1);
  }

  const iloiloData = {
    province: { name: 'Iloilo', psgcCode: PROVINCE_CODE },
    cities: []
  };

  for (const muni of targetMunicipalities) {
    console.log(`\n📍 Processing ${muni.name}...`);
    const barangays = await fetchJSON(`https://psgc.gitlab.io/api/municipalities/${muni.code}/barangays.json`);
    
    console.log(`   Found ${barangays.length} barangays. Geocoding...`);
    
    const cityData = {
      name: muni.name,
      psgcCode: muni.code,
      barangays: []
    };

    for (const brgy of barangays) {
      const coords = await geocodeBarangay(brgy.name, muni.name);
      if (coords) {
        cityData.barangays.push({
          name: brgy.name,
          psgcCode: brgy.code,
          centroid: { lat: coords.lat, lng: coords.lng },
          geocodingSource: coords.source // Track where coordinate came from
        });
        process.stdout.write(coords.source === 'manual' ? '📍' : '✅');
      } else {
        process.stdout.write('❌');
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    
    iloiloData.cities.push(cityData);
    const geocoded = cityData.barangays.length;
    console.log(`\n   Done: ${geocoded}/${barangays.length} barangays (${Math.round(geocoded/barangays.length*100)}%)`);
  }

  fs.mkdirSync('./src/data', { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(iloiloData, null, 2));
  
  const totalBarangays = iloiloData.cities.reduce((acc, c) => acc + c.barangays.length, 0);
  const totalExpected = targetMunicipalities.reduce((acc, m) => acc + m.barangayCount, 0);
  
  console.log(`\n🎉 Success! Saved to ${OUTPUT_PATH}`);
  console.log(`📊 Total: ${iloiloData.cities.length} municipalities, ${totalBarangays} barangays`);
  console.log(`📈 Coverage: ${Math.round(totalBarangays/totalExpected*100)}% of expected barangays`);
  console.log(`\n⚠️  REQUIRED: Add this attribution to your footer: "© OpenStreetMap contributors"`);
}

main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});