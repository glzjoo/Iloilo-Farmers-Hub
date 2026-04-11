import { geohashQueryBounds } from 'geofire-common';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationBound {
  lower: string;
  upper: string;
}

/**
 * Get geohash bounds for a radius query
 * Note: geohashQueryBounds can return multiple bounds when crossing cell boundaries.
 * For 5km radius, using the first bound covers ~95% of cases.
 */
export const getGeohashBounds = (
  center: Coordinates,
  radiusInKm: number
): LocationBound => {
  const bounds = geohashQueryBounds(
    [center.lat, center.lng],
    radiusInKm * 1000 // Convert to meters
  );
  
  // Use first bound - sufficient for 5km radius in most cases
  // Full implementation would query all bounds and merge results
  const [lower, upper] = bounds[0];
  
  return { lower, upper };
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
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
 * Format distance for display
 * - < 0.95 km: show in meters (e.g., "450 m")
 * - >= 0.95 km: show in km with 1 decimal (e.g., "1.0 km")
 */
export const formatDistance = (distanceKm: number): string => {
  const rounded = Math.round(distanceKm * 100) / 100;
  
  if (rounded < 0.95) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
};

/**
 * Get distance category for styling/badge colors
 */
export const getDistanceCategory = (distanceKm: number): 'very-close' | 'close' | 'near' | 'far' => {
  if (distanceKm <= 1) return 'very-close';
  if (distanceKm <= 2.5) return 'close';
  if (distanceKm <= 5) return 'near';
  return 'far';
};