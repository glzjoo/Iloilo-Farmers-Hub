// ============================================
// FILE: src/components/location/FarmLocationPicker.tsx
// ============================================
import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import iloiloData from '../../data/iloilo-barangays.json';
import { 
  isWithinServiceArea, 
  getNearestCity, 
  isWithinSelectedBarangay,
  detectLocationFromCoordinates,
  calculateDistance,
  SERVICE_AREA_RADIUS_KM,
  PROXIMITY_RADIUS_KM,
  DETECTION_CONFIDENCE_THRESHOLD_KM,
  SUPPORTED_CITIES,
} from '../../services/locationService';
import ConfirmationModal from '../common/ConfirmationModal';
import ErrorModal from '../common/ErrorModal';

const GOOGLE_MAPS_LIBRARIES: ("places" | "marker" | "geometry" | "drawing" | "visualization")[] = ['places', 'marker'];

const mapContainerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '0.5rem',
};

const defaultCenter = {
  lat: 10.7202,
  lng: 122.5621,
};

export interface FarmLocation {
  province: string;
  city: string;
  barangay: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  accuracy: 'gps' | 'manual_pin' | 'barangay_centroid';
}

interface FarmLocationPickerProps {
  value: FarmLocation | null;
  onChange: (location: FarmLocation) => void;
  error?: string;
}

export default function FarmLocationPicker({ value, onChange, error }: FarmLocationPickerProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [selectedProvince] = useState('Iloilo');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedBarangay, setSelectedBarangay] = useState<string>('');
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [pinSource, setPinSource] = useState<'gps' | 'manual_pin' | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string>('');

  // Modal states
  const [showServiceAreaError, setShowServiceAreaError] = useState(false);
  const [showProximityConfirm, setShowProximityConfirm] = useState(false);
  const [showUncertainDetection, setShowUncertainDetection] = useState(false);
  const [pendingGPSCoords, setPendingGPSCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [detectedLocation, setDetectedLocation] = useState<{ city: string; barangay: string } | null>(null);
  const [detectionDistance, setDetectionDistance] = useState<number>(0);

  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const lastNotifiedLocation = useRef<string>('');

  const cities = iloiloData.cities;
  const barangays = selectedCity 
    ? cities.find(c => c.name === selectedCity)?.barangays || []
    : [];

  const getCurrentCoordinates = useCallback(() => {
    if (markerPosition) return markerPosition;
    
    if (selectedBarangay && selectedCity) {
      const barangay = cities
        .find(c => c.name === selectedCity)
        ?.barangays.find(b => b.name === selectedBarangay);
      
      if (barangay?.centroid) {
        return {
          lat: barangay.centroid.lat,
          lng: barangay.centroid.lng,
        };
      }
    }
    
    return null;
  }, [markerPosition, selectedBarangay, selectedCity, cities]);

  useEffect(() => {
    if (selectedCity && selectedBarangay) {
      const coords = getCurrentCoordinates();
      if (coords) {
        const locationData: FarmLocation = {
          province: selectedProvince,
          city: selectedCity,
          barangay: selectedBarangay,
          coordinates: coords,
          accuracy: markerPosition ? (pinSource ?? 'manual_pin') : 'barangay_centroid',
        };
        
        const locationSignature = `${selectedProvince}-${selectedCity}-${selectedBarangay}-${coords.lat}-${coords.lng}-${markerPosition ? (pinSource ?? 'manual') : 'centroid'}`;
        
        if (locationSignature !== lastNotifiedLocation.current) {
          lastNotifiedLocation.current = locationSignature;
          onChange(locationData);
        }
      }
    }
  }, [selectedCity, selectedBarangay, markerPosition, pinSource, onChange, selectedProvince, getCurrentCoordinates]);

  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    if (markerRef.current) {
      markerRef.current.map = null;
      markerRef.current = null;
    }

    if (markerPosition) {
      const { AdvancedMarkerElement } = google.maps.marker;
      
      markerRef.current = new AdvancedMarkerElement({
        map: mapRef.current,
        position: markerPosition,
        title: 'Farm Location',
        gmpDraggable: true,
      });

      markerRef.current.addListener('dragend', () => {
        const position = markerRef.current?.position;
        if (position) {
          const lat = typeof position.lat === 'function' ? position.lat() : position.lat;
          const lng = typeof position.lng === 'function' ? position.lng() : position.lng;
          setMarkerPosition({ lat, lng });
          setPinSource('manual_pin');
        }
      });
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.map = null;
      }
    };
  }, [markerPosition, isLoaded]);

  const handleUseGPS = () => {
    setIsLocating(true);
    setLocationError('');
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const gpsCoords = { lat: latitude, lng: longitude };
        
        validateGPSLocation(gpsCoords);
        setIsLocating(false);
      },
      (err) => {
        let message = 'Unable to retrieve your location';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            message = 'Location permission denied. Please enable GPS or use map pin.';
            break;
          case err.POSITION_UNAVAILABLE:
            message = 'Location information unavailable.';
            break;
          case err.TIMEOUT:
            message = 'Location request timed out.';
            break;
        }
        setLocationError(message);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const validateGPSLocation = (coords: { lat: number; lng: number }) => {
    if (!isWithinServiceArea(coords)) {
      setPendingGPSCoords(coords);
      setShowServiceAreaError(true);
      return;
    }

    if (selectedCity && selectedBarangay) {
      const proximityCheck = isWithinSelectedBarangay(coords, selectedCity, selectedBarangay);
      
      if (!proximityCheck.isWithin) {
        const detected = detectLocationFromCoordinates(coords);
        if (detected) {
          setPendingGPSCoords(coords);
          setDetectedLocation({ city: detected.city, barangay: detected.barangay });
          setDetectionDistance(detected.distanceFromBarangay);
          
          if (detected.distanceFromBarangay > DETECTION_CONFIDENCE_THRESHOLD_KM) {
            setShowUncertainDetection(true);
          } else {
            setShowProximityConfirm(true);
          }
        } else {
          setLocationError(
            `Unable to detect a valid location near your GPS coordinates. Please place the pin manually on the map.`
          );
        }
        return;
      }    }

    acceptGPSLocation(coords);
  };

  const acceptGPSLocation = (coords: { lat: number; lng: number }) => {
    setMarkerPosition(coords);
    setPinSource('gps');
    
    if (!selectedCity) {
      const nearestCity = getNearestCity(coords);
      if (nearestCity) {
        setSelectedCity(nearestCity.city);
        const city = iloiloData.cities.find(c => c.name === nearestCity.city);
        if (city) {
          let nearestBarangay = null;
          let minDistance = Infinity;
          for (const b of city.barangays) {
            if (!b.centroid) continue;
            const dist = calculateDistance(coords.lat, coords.lng, b.centroid.lat, b.centroid.lng);
            if (dist < minDistance) {
              minDistance = dist;
              nearestBarangay = b.name;
            }
          }
          if (nearestBarangay) {
            setSelectedBarangay(nearestBarangay);
          }
        }
      }
    }
  };

  const handleConfirmLocationUpdate = () => {
    if (pendingGPSCoords && detectedLocation) {
      setSelectedCity(detectedLocation.city);
      setSelectedBarangay(detectedLocation.barangay);
      setMarkerPosition(pendingGPSCoords);
      setPinSource('gps');
    }
    setShowProximityConfirm(false);
    setShowUncertainDetection(false);
    setPendingGPSCoords(null);
    setDetectedLocation(null);
    setDetectionDistance(0);
  };

  const handleRejectLocationUpdate = () => {
    setShowProximityConfirm(false);
    setShowUncertainDetection(false);
    setPendingGPSCoords(null);
    setDetectedLocation(null);
    setDetectionDistance(0);
    setLocationError(`GPS location is too far from ${selectedBarangay}. Please use manual pin or select a different barangay.`);
  };

  const handleServiceAreaErrorClose = () => {
    setShowServiceAreaError(false);
    setPendingGPSCoords(null);
  };

  const handleUncertainConfirm = () => {
    setShowUncertainDetection(false);
    setShowProximityConfirm(true);
  };

  const handleUncertainCancel = () => {
    setShowUncertainDetection(false);
    setPendingGPSCoords(null);
    setDetectedLocation(null);
    setDetectionDistance(0);
    setLocationError(`GPS location is too far from ${selectedBarangay}. Please place the pin manually on the map for accuracy.`);
  };

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setMarkerPosition({
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      });
      setPinSource('manual_pin');
    }
  }, []);

  const getMapCenter = useCallback(() => {
    if (markerPosition) return markerPosition;
    
    if (selectedBarangay && selectedCity) {
      const barangay = cities
        .find(c => c.name === selectedCity)
        ?.barangays.find(b => b.name === selectedBarangay);
      
      if (barangay?.centroid) {
        return {
          lat: barangay.centroid.lat,
          lng: barangay.centroid.lng,
        };
      }
    }
    
    return defaultCenter;
  }, [markerPosition, selectedBarangay, selectedCity, cities]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const showGPSButton = selectedCity && selectedBarangay;

  if (!isLoaded) {
    return (
      <div className="w-full h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Service Area Error Modal */}
      <ErrorModal
        isOpen={showServiceAreaError}
        title="Location Outside Service Area"
        message={
          <div className="space-y-2">
            <p>We currently only accept farmers from the following areas:</p>
            <ul className="list-disc list-inside text-left bg-gray-50 p-3 rounded-lg text-sm">
              {SUPPORTED_CITIES.map(city => (
                <li key={city}>{city}</li>
              ))}
            </ul>
            <p className="text-xs text-gray-500 mt-2">
              Your GPS location is more than {SERVICE_AREA_RADIUS_KM}km from any of these cities.
            </p>
          </div>
        }
        buttonLabel="I Understand"
        onClose={handleServiceAreaErrorClose}
      />

      {/* Uncertain Detection Warning Modal */}
      <ConfirmationModal
        isOpen={showUncertainDetection}
        title="Location Detection Uncertain"
        variant="warning"
        message={
          <div className="space-y-3 text-left">
            <p>
              Your GPS is quite far from the nearest barangay center we have on record.
            </p>
            <p className="text-sm text-gray-600">
              We think you might be in <strong>{detectedLocation?.barangay}, {detectedLocation?.city}</strong>, but this may not be accurate due to:
            </p>
            <ul className="text-xs text-gray-500 list-disc list-inside space-y-1 bg-gray-50 p-3 rounded-lg">
              <li>You might be near a barangay border</li>
              <li>Our barangay center coordinates may be offset</li>
              <li>GPS accuracy limitations</li>
            </ul>
            <p className="text-sm font-medium text-gray-700 mt-2">
              What would you like to do?
            </p>
          </div>
        }
        confirmLabel={`Use "${detectedLocation?.barangay}" Anyway`}
        cancelLabel="Keep My Selected Location"
        onConfirm={handleUncertainConfirm}
        onCancel={handleUncertainCancel}
      />

      {/* Proximity Confirmation Modal - SIMPLIFIED */}
      <ConfirmationModal
        isOpen={showProximityConfirm}
        title="Update Location?"
        variant="warning"
        message={
          <div className="space-y-3 text-left">
            <p>
              Your GPS location is too far from your selected <strong>{selectedBarangay}</strong>.
            </p>
            {detectedLocation && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">Detected Location:</span><br/>
                  {detectedLocation.barangay}, {detectedLocation.city}
                </p>
              </div>
            )}
            <p className="text-sm text-gray-500">
              Would you like to update your farm location to match your GPS coordinates?
            </p>
          </div>
        }
        confirmLabel={`Update to ${detectedLocation ? `${detectedLocation.barangay}, ${detectedLocation.city}` : 'Detected Location'}`}
        cancelLabel="Keep Current Selection"
        onConfirm={handleConfirmLocationUpdate}
        onCancel={handleRejectLocationUpdate}
      />

      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 text-sm font-primary">
          <span className="font-bold">⚠️ Important:</span> You can only update your farm location every 3 months. Please ensure this is accurate.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">
            Province
          </label>
          <input
            type="text"
            value={selectedProvince}
            disabled
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base font-primary bg-gray-100 text-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">
            City/Municipality <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedCity}
            onChange={(e) => {
              setSelectedCity(e.target.value);
              setSelectedBarangay('');
              setMarkerPosition(null);
              setPinSource(null);
              lastNotifiedLocation.current = '';
            }}
            className={`w-full border rounded-lg px-4 py-3 text-base font-primary outline-none transition-colors ${
              error ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary'
            }`}
          >
            <option value="">Select city</option>
            {cities.map((city) => (
              <option key={city.psgcCode} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">
            Barangay <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedBarangay}
            onChange={(e) => {
              setSelectedBarangay(e.target.value);
              setMarkerPosition(null);
              setPinSource(null);
              lastNotifiedLocation.current = '';
            }}
            disabled={!selectedCity}
            className={`w-full border rounded-lg px-4 py-3 text-base font-primary outline-none transition-colors ${
              error ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary'
            } ${!selectedCity ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          >
            <option value="">
              {selectedCity ? 'Select barangay' : 'Select city first'}
            </option>
            {barangays.map((barangay) => (
              <option key={barangay.psgcCode} value={barangay.name}>
                {barangay.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showGPSButton && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUseGPS}
            disabled={isLocating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-primary text-sm hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            {isLocating ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Getting location...
              </>
            ) : (
              <>
                📍 Use My Current Location
              </>
            )}
          </button>
          <span className="text-xs text-gray-500 font-primary">
            or click on map to place pin
          </span>
        </div>
      )}

      {!showGPSButton && (
        <p className="text-xs text-gray-500 font-primary italic">
          💡 Select both City/Municipality and Barangay first to enable GPS location
        </p>
      )}

      {locationError && (
        <p className="text-xs text-red-500 font-primary flex items-center gap-1">
          <span>⚠</span> {locationError}
        </p>
      )}

      {selectedCity && selectedBarangay && (
        <div className="space-y-2">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={getMapCenter()}
            zoom={15}
            onClick={handleMapClick}
            onLoad={onMapLoad}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',
            }}
          />
          <p className="text-xs text-gray-500 font-primary">
            {markerPosition 
              ? ` Pin placed (${pinSource === 'gps' ? 'GPS' : 'manual'}). Drag to adjust.` 
              : '💡 Tip: Click on map to place pin at exact farm entrance'}
          </p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 font-primary flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}