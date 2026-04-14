// ============================================
// FILE: src/services/locationService.ts
// ============================================
import { geohashQueryBounds } from 'geofire-common';
import iloiloData from '../data/iloilo-barangays.json';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationBound {
  lower: string;
  upper: string;
}

// Pre-computed city centroids (calculated from barangay averages)
export const CITY_CENTROIDS: Record<string, Coordinates> = {
  'Iloilo City': { lat: 10.7202, lng: 122.5621 },
  'Oton': { lat: 10.7178, lng: 122.4725 },
  'Pavia': { lat: 10.7698, lng: 122.5349 },
  'San Miguel': { lat: 10.7887, lng: 122.4655 },
};

export const SUPPORTED_CITIES = Object.keys(CITY_CENTROIDS);
export const SERVICE_AREA_RADIUS_KM = 15; // Max distance from any city center
export const PROXIMITY_RADIUS_KM = 8; // Max distance from selected barangay
export const DETECTION_CONFIDENCE_THRESHOLD_KM = 2; // Threshold for uncertain detection

export const getGeohashBounds = (
  center: Coordinates,
  radiusInKm: number
): LocationBound => {
  const bounds = geohashQueryBounds(
    [center.lat, center.lng],
    radiusInKm * 1000
  );
  
  const [lower, upper] = bounds[0];
  
  return { lower, upper };
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (value: number): number => (value * Math.PI) / 180;

/**
 * Check if coordinates are within the service area (15km of any supported city)
 */
export const isWithinServiceArea = (coords: Coordinates): boolean => {
  for (const city of SUPPORTED_CITIES) {
    const cityCenter = CITY_CENTROIDS[city];
    const distance = calculateDistance(
      coords.lat, coords.lng,
      cityCenter.lat, cityCenter.lng
    );
    if (distance <= SERVICE_AREA_RADIUS_KM) {
      return true;
    }
  }
  return false;
};

/**
 * Find the nearest city to given coordinates
 */
export const getNearestCity = (coords: Coordinates): { city: string; distance: number } | null => {
  let nearest = null;
  let minDistance = Infinity;

  for (const city of SUPPORTED_CITIES) {
    const cityCenter = CITY_CENTROIDS[city];
    const distance = calculateDistance(
      coords.lat, coords.lng,
      cityCenter.lat, cityCenter.lng
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearest = city;
    }
  }

  return nearest ? { city: nearest, distance: minDistance } : null;
};

/**
 * Find the nearest barangay within a specific city
 */
export const getNearestBarangayInCity = (
  coords: Coordinates, 
  cityName: string
): { barangay: string; distance: number } | null => {
  const city = iloiloData.cities.find(c => c.name === cityName);
  if (!city) return null;

  let nearest = null;
  let minDistance = Infinity;

  for (const barangay of city.barangays) {
    if (!barangay.centroid) continue;
    const distance = calculateDistance(
      coords.lat, coords.lng,
      barangay.centroid.lat,
      barangay.centroid.lng
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearest = barangay.name;
    }
  }

  return nearest ? { barangay: nearest, distance: minDistance } : null;
};

/**
 * Check if coordinates are within proximity of selected barangay (8km)
 */
export const isWithinSelectedBarangay = (
  coords: Coordinates,
  cityName: string,
  barangayName: string
): { isWithin: boolean; distance: number } => {
  const city = iloiloData.cities.find(c => c.name === cityName);
  const barangay = city?.barangays.find(b => b.name === barangayName);
  
  if (!barangay?.centroid) {
    return { isWithin: false, distance: Infinity };
  }

  const distance = calculateDistance(
    coords.lat, coords.lng,
    barangay.centroid.lat,
    barangay.centroid.lng
  );

  return {
    isWithin: distance <= PROXIMITY_RADIUS_KM,
    distance,
  };
};

/**
 * Get full location detection from coordinates (city + barangay)
 * Returns distance from barangay centroid for confidence checking
 */
export const detectLocationFromCoordinates = (
  coords: Coordinates
): { city: string; barangay: string; distanceFromCity: number; distanceFromBarangay: number } | null => {
  const nearestCity = getNearestCity(coords);
  if (!nearestCity) return null;

  const nearestBarangay = getNearestBarangayInCity(coords, nearestCity.city);
  if (!nearestBarangay) return null;

  return {
    city: nearestCity.city,
    barangay: nearestBarangay.barangay,
    distanceFromCity: nearestCity.distance,
    distanceFromBarangay: nearestBarangay.distance,
  };
};

/**
 * Format distance for GPS mode - shows approximate ranges only (privacy)
 */
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm <= 1) return 'Within 1km';
  if (distanceKm <= 2) return '1-2km';
  if (distanceKm <= 3) return '2-3km';
  if (distanceKm <= 4) return '3-4km';
  if (distanceKm <= 5) return '4-5km';
  return '5km+';
};

/**
 * Format distance for manual mode - shows "~X km" (centroid approximation)
 */
export const formatManualDistance = (distanceKm: number): string => {
  return `~${Math.round(distanceKm)} km`;
};

export const getDistanceCategory = (distanceKm: number): 'very-close' | 'close' | 'near' | 'far' => {
  if (distanceKm <= 1) return 'very-close';
  if (distanceKm <= 2.5) return 'close';
  if (distanceKm <= 5) return 'near';
  return 'far';
};