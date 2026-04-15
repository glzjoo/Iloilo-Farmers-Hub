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
  formatDistance,
  formatManualDistance,
  type Coordinates,
} from '../services/locationService';
import iloiloBarangays from '../data/iloilo-barangays.json';
//useNearbyFarmers
interface NearbyFarmerResult extends FarmerWithLocation {
  distance: number;
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
  setManualLocation: (location: Coordinates | null, city?: string, barangay?: string) => void;
}

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

const CITY_COORDINATES: Record<string, Coordinates> = {};
typedBarangays.cities.forEach((city) => {
  if (city.barangays.length > 0) {
    CITY_COORDINATES[city.name] = {
      lat: city.barangays[0].centroid.lat,
      lng: city.barangays[0].centroid.lng,
    };
  }
});

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
  const [manualCriteria, setManualCriteria] = useState<{city?: string, barangay?: string}>({});

  const requestLocation = useCallback(() => {
    setLocationError(null);
    setIsUsingManualLocation(false);
    setManualCriteria({});
    setFarmers([]); // Clear previous results immediately

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
            message = 'Location access denied. Please enable location permissions.';
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

  const setManualLocation = useCallback((location: Coordinates | null, city?: string, barangay?: string) => {
    setLocationError(null);
    if (location) {
      setUserLocation(location);
      setIsUsingManualLocation(true);
      setManualCriteria({ city, barangay });
    } else {
      setUserLocation(null);
      setIsUsingManualLocation(false);
      setManualCriteria({});
      setFarmers([]);
    }
  }, []);

  useEffect(() => {
    if (!userLocation) {
      setFarmers([]);
      return;
    }

    const fetchNearbyFarmers = async () => {
      setLoading(true);
      setError(null);

      try {
        let snapshot: QuerySnapshot<DocumentData>;

        if (isUsingManualLocation && manualCriteria.city) {
          console.log('=== MANUAL MODE ===');
          console.log('City:', manualCriteria.city);
          console.log('Barangay:', manualCriteria.barangay || 'Any');

          let farmersQuery;
          
          if (manualCriteria.barangay) {
            farmersQuery = query(
              collection(db, 'farmers'),
              where('farmLocation.city', '==', manualCriteria.city),
              where('farmLocation.barangay', '==', manualCriteria.barangay),
              where('verificationStatus', '==', 'verified')
            );
          } else {
            farmersQuery = query(
              collection(db, 'farmers'),
              where('farmLocation.city', '==', manualCriteria.city),
              where('verificationStatus', '==', 'verified')
            );
          }

          snapshot = await getDocs(farmersQuery);
          console.log('Manual query results:', snapshot.docs.length);

        } else {
          console.log('=== GPS MODE ===');
          console.log('User location:', userLocation);

          const bounds = getGeohashBounds(userLocation, radiusKm);
          console.log('Geohash bounds:', bounds);

          const farmersQuery = query(
            collection(db, 'farmers'),
            where('locationGeohash', '>=', bounds.lower),
            where('locationGeohash', '<=', bounds.upper),
            where('verificationStatus', '==', 'verified')
          );

          snapshot = await getDocs(farmersQuery);
          console.log('GPS query results (before distance filter):', snapshot.docs.length);
        }

        const results: NearbyFarmerResult[] = [];
        
        for (const doc of snapshot.docs) {
          const farmerData = doc.data() as FarmerWithLocation;
          
          if (!farmerData.farmLocation?.coordinates) continue;

          const farmerLat = farmerData.farmLocation.coordinates.lat;
          const farmerLng = farmerData.farmLocation.coordinates.lng;

          let distance: number;
          let formattedDistance: string;

          if (isUsingManualLocation) {
            distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              farmerLat,
              farmerLng
            );
            formattedDistance = formatManualDistance(distance);
          } else {
            distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              farmerLat,
              farmerLng
            );
            
            if (distance > radiusKm) continue;
            
            // Use privacy-friendly distance format for GPS
            formattedDistance = formatDistance(distance);
          }

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

          if (!hasActiveProducts) continue;

          results.push({
            ...farmerData,
            uid: doc.id,
            distance,
            formattedDistance,
            hasActiveProducts,
          });
        }

        if (isUsingManualLocation) {
          results.sort((a, b) => (a.farmName || '').localeCompare(b.farmName || ''));
        } else {
          // Sort by distance but keep the privacy ranges
          results.sort((a, b) => a.distance - b.distance);
        }

        console.log('Final results:', results.length);
        setFarmers(results);

      } catch (err: any) {
        console.error('Error fetching nearby farmers:', err);
        setError(err.message || 'Failed to fetch nearby farmers');
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyFarmers();
  }, [userLocation, radiusKm, requireActiveProducts, isUsingManualLocation, manualCriteria]);

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

export { CITY_COORDINATES, BARANGAY_COORDINATES, typedBarangays };
export type { Coordinates };