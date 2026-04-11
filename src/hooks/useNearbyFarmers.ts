import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  type QuerySnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { FarmerWithLocation } from '../types';
import {
  calculateDistance,
  getGeohashBounds,
  type Coordinates,
} from '../services/locationService';
import iloiloBarangays from '../data/iloilo-barangays.json';
//useNearbyFarmers.ts
interface NearbyFarmerResult extends FarmerWithLocation {
  distance: number; // in km
  formattedDistance: string;
  hasActiveProducts: boolean;
}

interface UseNearbyFarmersOptions {
  radiusKm?: number;
  requireActiveProducts?: boolean;
}

interface UseNearbyFarmersReturn {
  farmers: NearbyFarmerResult[];
  loading: boolean;
  error: string | null;
  locationError: string | null;
  requestLocation: () => void;
  isUsingManualLocation: boolean;
  setManualLocation: (location: Coordinates | null) => void;
}

// Type for the barangay JSON structure
interface BarangayInfo {
  name: string;
  psgcCode: string;
  centroid: {
    lat: number;
    lng: number;
  };
}

interface CityInfo {
  name: string;
  psgcCode: string;
  barangays: BarangayInfo[];
}

interface BarangayData {
  province: {
    name: string;
    psgcCode: string;
  };
  cities: CityInfo[];
}

const typedBarangays = iloiloBarangays as unknown as BarangayData;

// Build a lookup map for city coordinates (using first barangay centroid as approximation)
const CITY_COORDINATES: Record<string, Coordinates> = {};
typedBarangays.cities.forEach((city) => {
  if (city.barangays.length > 0) {
    CITY_COORDINATES[city.name] = {
      lat: city.barangays[0].centroid.lat,
      lng: city.barangays[0].centroid.lng,
    };
  }
});

// Build barangay coordinate lookup
const BARANGAY_COORDINATES: Record<string, Record<string, Coordinates>> = {};
typedBarangays.cities.forEach((city) => {
  BARANGAY_COORDINATES[city.name] = {};
  city.barangays.forEach((barangay) => {
    BARANGAY_COORDINATES[city.name][barangay.name] = {
      lat: barangay.centroid.lat,
      lng: barangay.centroid.lng,
    };
  });
});

export const useNearbyFarmers = (
  options: UseNearbyFarmersOptions = {}
): UseNearbyFarmersReturn => {
  const { radiusKm = 5, requireActiveProducts = true } = options;

  const [farmers, setFarmers] = useState<NearbyFarmerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [isUsingManualLocation, setIsUsingManualLocation] = useState(false);

  // Request browser geolocation
  const requestLocation = useCallback(() => {
    setLocationError(null);
    setIsUsingManualLocation(false);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (err) => {
        let message = 'Unable to retrieve your location';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            message = 'Location access denied. Please enable location permissions or use manual selection.';
            break;
          case err.POSITION_UNAVAILABLE:
            message = 'Location information unavailable';
            break;
          case err.TIMEOUT:
            message = 'Location request timed out';
            break;
        }
        setLocationError(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  // Set manual location (from dropdown)
  const setManualLocation = useCallback((location: Coordinates | null) => {
    setLocationError(null);
    if (location) {
      setUserLocation(location);
      setIsUsingManualLocation(true);
    } else {
      setUserLocation(null);
      setIsUsingManualLocation(false);
      setFarmers([]);
    }
  }, []);

  // Fetch nearby farmers when location changes
  useEffect(() => {
    if (!userLocation) {
      setFarmers([]);
      return;
    }

    const fetchNearbyFarmers = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get geohash bounds for the radius
        const bounds = getGeohashBounds(userLocation, radiusKm);

        // Query farmers within geohash bounds
        // Note: For complete accuracy with large radii, query all bounds from geohashQueryBounds
        const farmersQuery = query(
          collection(db, 'farmers'),
          where('locationGeohash', '>=', bounds.lower),
          where('locationGeohash', '<=', bounds.upper),
          where('status', '==', 'active')
        );

        const snapshot: QuerySnapshot<DocumentData> = await getDocs(farmersQuery);
        
        // Process results and calculate exact distances
        const results: NearbyFarmerResult[] = [];
        
        for (const doc of snapshot.docs) {
          const farmerData = doc.data() as FarmerWithLocation;
          
          // Skip farmers without location coordinates
          if (!farmerData.farmLocation?.coordinates) continue;

          const farmerLat = farmerData.farmLocation.coordinates.lat;
          const farmerLng = farmerData.farmLocation.coordinates.lng;

          // Calculate exact distance using Haversine
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            farmerLat,
            farmerLng
          );

          // Filter by exact radius (geohash is a box, so we need to filter)
          if (distance > radiusKm) continue;

          // Check if farmer has active products (if required)
          // FIXED: Query Firestore directly instead of using getProducts
          let hasActiveProducts = true;
          if (requireActiveProducts) {
            try {
              const productsQuery = query(
                collection(db, 'products'),
                where('farmerId', '==', doc.id),
                where('status', '==', 'active'),
                limit(1)
              );
              const productsSnapshot = await getDocs(productsQuery);
              hasActiveProducts = !productsSnapshot.empty;
            } catch {
              hasActiveProducts = false;
            }
          }

          results.push({
            ...farmerData,
            uid: doc.id,
            distance,
            formattedDistance: formatDistance(distance),
            hasActiveProducts,
          });
        }

        // Sort by distance (nearest first) - client side
        if (isUsingManualLocation) {
          // Random shuffle for manual mode (centroid approximations not accurate for distance)
          for (let i = results.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [results[i], results[j]] = [results[j], results[i]];
          }
        } else {
          // Sort by distance (nearest first) for GPS mode
          results.sort((a, b) => a.distance - b.distance);
        }

        setFarmers(results);
      } catch (err: any) {
        console.error('Error fetching nearby farmers:', err);
        setError(err.message || 'Failed to fetch nearby farmers');
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyFarmers();
  }, [userLocation, radiusKm, requireActiveProducts]);

  return {
    farmers,
    loading,
    error,
    locationError,
    requestLocation,
    isUsingManualLocation,
    setManualLocation,
  };
};

// Helper to format distance (duplicated from locationService for internal use)
const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
};

// Export coordinate lookups for use in other components
export { CITY_COORDINATES, BARANGAY_COORDINATES, typedBarangays };
export type { Coordinates };