import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import iloiloData from '../../data/iloilo-barangays.json';

// Move this OUTSIDE the component to prevent reloads
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

// Export the interface so it can be used by other components
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
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string>('');

  // Refs for AdvancedMarkerElement
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  // Use ref to track if we've already notified parent to prevent infinite loop
  const lastNotifiedLocation = useRef<string>('');

  const cities = iloiloData.cities;
  const barangays = selectedCity 
    ? cities.find(c => c.name === selectedCity)?.barangays || []
    : [];

  // Get coordinates from barangay centroid or current marker
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

  // Update parent when selection changes - FIXED: Prevent infinite loop
  useEffect(() => {
    if (selectedCity && selectedBarangay) {
      const coords = getCurrentCoordinates();
      if (coords) {
        const locationData: FarmLocation = {
          province: selectedProvince,
          city: selectedCity,
          barangay: selectedBarangay,
          coordinates: coords,
          accuracy: markerPosition ? 'manual_pin' : 'barangay_centroid',
        };
        
        // Create a signature of current state to compare
        const locationSignature = `${selectedProvince}-${selectedCity}-${selectedBarangay}-${coords.lat}-${coords.lng}-${markerPosition ? 'pin' : 'centroid'}`;
        
        // Only notify if something actually changed
        if (locationSignature !== lastNotifiedLocation.current) {
          lastNotifiedLocation.current = locationSignature;
          onChange(locationData);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity, selectedBarangay, markerPosition]);

  // Create or update AdvancedMarkerElement when position changes
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.map = null;
      markerRef.current = null;
    }

    // Create new marker if position exists
    if (markerPosition) {
      const { AdvancedMarkerElement } = google.maps.marker;
      
      markerRef.current = new AdvancedMarkerElement({
        map: mapRef.current,
        position: markerPosition,
        title: 'Farm Location',
        gmpDraggable: true,
      });

      // Handle drag end
      markerRef.current.addListener('dragend', () => {
        const position = markerRef.current?.position;
        if (position) {
          const lat = typeof position.lat === 'function' ? position.lat() : position.lat;
          const lng = typeof position.lng === 'function' ? position.lng() : position.lng;
          setMarkerPosition({ lat, lng });
        }
      });
    }

    // Cleanup
    return () => {
      if (markerRef.current) {
        markerRef.current.map = null;
      }
    };
  }, [markerPosition, isLoaded]);

  // Handle GPS location
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
        setMarkerPosition({ lat: latitude, lng: longitude });
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

  // Handle map click
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setMarkerPosition({
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      });
    }
  }, []);

  // Map center based on selection
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

  const mapCenter = getMapCenter();

  // Store map reference when loaded
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  if (!isLoaded) {
    return (
      <div className="w-full h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Warning Banner */}
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 text-sm font-primary">
          <span className="font-bold">⚠️ Important:</span> You can only update your farm location every 3 months. Please ensure this is accurate.
        </p>
      </div>

      {/* 3-Column Layout: Province | City | Barangay */}
      <div className="grid grid-cols-3 gap-4">
        {/* Province (Fixed) */}
        <div>
          <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">
            Province
          </label>
          <input
            type="text"
            value={selectedProvince}
            disabled
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-primary bg-gray-100 text-gray-600"
          />
        </div>

        {/* City/Municipality Dropdown */}
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
              lastNotifiedLocation.current = '';
            }}
            className={`w-full border rounded-lg px-4 py-2.5 text-sm font-primary outline-none transition-colors ${
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

        {/* Barangay Dropdown */}
        <div>
          <label className="block text-sm font-primary font-semibold text-gray-800 mb-1">
            Barangay <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedBarangay}
            onChange={(e) => {
              setSelectedBarangay(e.target.value);
              setMarkerPosition(null);
              lastNotifiedLocation.current = '';
            }}
            disabled={!selectedCity}
            className={`w-full border rounded-lg px-4 py-2.5 text-sm font-primary outline-none transition-colors ${
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

      {/* GPS Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleUseGPS}
          disabled={isLocating || !selectedBarangay}
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
          {selectedBarangay ? 'or click on map to place pin' : 'Select barangay first'}
        </span>
      </div>

      {/* Location Error */}
      {locationError && (
        <p className="text-xs text-red-500 font-primary">{locationError}</p>
      )}

      {/* Map */}
      {selectedCity && selectedBarangay && (
        <div className="space-y-2">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={15}
            onClick={handleMapClick}
            onLoad={onMapLoad}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              mapId: 'DEMO_MAP_ID', // Required for AdvancedMarkerElement
            }}
          />
          <p className="text-xs text-gray-500 font-primary">
            {markerPosition 
              ? '✅ Pin placed. Drag to adjust exact farm location.' 
              : '💡 Tip: Click on map to place pin at exact farm entrance'}
          </p>
        </div>
      )}

      {/* Validation Error */}
      {error && (
        <p className="text-xs text-red-500 font-primary flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}