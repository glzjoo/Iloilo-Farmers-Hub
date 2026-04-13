import { geohashQueryBounds } from 'geofire-common';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationBound {
  lower: string;
  upper: string;
}

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
 * Format distance for GPS mode - shows approximate ranges only (privacy)
 * - 0-1km: "Within 1km"
 * - 1-2km: "1-2km"
 * - 2-3km: "2-3km"
 * - 3-4km: "3-4km"
 * - 4-5km: "4-5km"
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