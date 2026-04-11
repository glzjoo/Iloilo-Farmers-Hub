import { useState, useEffect } from 'react';
import {
  CITY_COORDINATES,
  BARANGAY_COORDINATES,
  typedBarangays,
  type Coordinates,
} from '../../hooks/useNearbyFarmers';

interface NearbyFarmerToggleProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
  onLocationSelect: (coords: Coordinates | null) => void;
  locationError: string | null;
  isLoading: boolean;
  isUsingManualLocation: boolean;
  gpsPermissionGranted?: boolean;
}

const cities = typedBarangays.cities.map((c) => c.name);

export default function NearbyFarmerToggle({
  isActive,
  onToggle,
  onLocationSelect,
  locationError,
  isLoading,
  isUsingManualLocation,
  gpsPermissionGranted = false,
}: NearbyFarmerToggleProps) {
  const [showManualSelector, setShowManualSelector] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('');

  const handleToggle = () => {
    if (!isActive) {
      onToggle(true);
    } else {
      onToggle(false);
      onLocationSelect(null);
      setShowManualSelector(false);
      setSelectedCity('');
      setSelectedBarangay('');
    }
  };

  const handleUseManual = () => {
    setShowManualSelector(true);
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSelectedBarangay('');
    
    if (city && CITY_COORDINATES[city]) {
      onLocationSelect(CITY_COORDINATES[city]);
    }
  };

  const handleBarangayChange = (barangay: string) => {
    setSelectedBarangay(barangay);
    
    if (selectedCity && BARANGAY_COORDINATES[selectedCity]?.[barangay]) {
      onLocationSelect(BARANGAY_COORDINATES[selectedCity][barangay]);
    } else if (selectedCity && CITY_COORDINATES[selectedCity]) {
      onLocationSelect(CITY_COORDINATES[selectedCity]);
    }
  };

  const getBarangaysForCity = (cityName: string): string[] => {
    const city = typedBarangays.cities.find((c) => c.name === cityName);
    return city ? city.barangays.map((b) => b.name) : [];
  };

  // Show manual selector if GPS error OR if GPS worked but no farmers found
  const shouldShowManualSelector = showManualSelector || (gpsPermissionGranted && isActive && !isLoading && !isUsingManualLocation);

  return (
    <div className="border-b border-gray-200 pb-5 mb-5">
      <h3 className="text-[13px] font-semibold text-gray-800 mb-4 uppercase tracking-wider flex items-center gap-2">
        <span className="text-primary">📍</span> Nearby Farmers
      </h3>

      {/* Main Toggle Button */}
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
          isActive
            ? 'border-primary bg-green-50'
            : 'border-gray-200 hover:border-primary hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center ${
              isActive ? 'bg-primary' : 'bg-gray-300'
            }`}
          >
            {isActive && (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <div className="text-left">
            <p className={`text-sm font-semibold ${isActive ? 'text-primary' : 'text-gray-700'}`}>
              {isActive ? 'Showing Nearby (5km)' : 'Show Nearby Farmers'}
            </p>
            <p className="text-xs text-gray-500">
              {isActive ? 'Click to disable' : 'Find farmers within 5km'}
            </p>
          </div>
        </div>
        {isLoading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        )}
      </button>

      {/* Error Message */}
      {locationError && !shouldShowManualSelector && (
        <div className="mt-3 p-3 bg-red-50 rounded-lg">
          <p className="text-xs text-red-600 mb-2">{locationError}</p>
          <button
            onClick={handleUseManual}
            className="text-xs text-primary font-semibold underline hover:text-green-700"
          >
            Use manual location instead →
          </button>
        </div>
      )}

      {/* Manual Location Selector */}
      {shouldShowManualSelector && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-3">
          <p className="text-xs text-gray-600 font-medium">
            {gpsPermissionGranted 
              ? 'No farmers found at your location. Try selecting a different area:'
              : 'Select your location:'}
          </p>
          
          {/* City Dropdown */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">City/Municipality</label>
            <select
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full px-2 py-2 text-sm border rounded focus:ring-1 focus:ring-primary focus:border-primary bg-white"
            >
              <option value="">Select city...</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Barangay Dropdown */}
          {selectedCity && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Barangay (optional)</label>
              <select
                value={selectedBarangay}
                onChange={(e) => handleBarangayChange(e.target.value)}
                className="w-full px-2 py-2 text-sm border rounded focus:ring-1 focus:ring-primary focus:border-primary bg-white"
              >
                <option value="">All barangays</option>
                {getBarangaysForCity(selectedCity).map((barangay) => (
                  <option key={barangay} value={barangay}>
                    {barangay}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Back to GPS (only show if not in empty state) */}
          {!gpsPermissionGranted && (
            <button
              onClick={() => {
                setShowManualSelector(false);
                onToggle(true);
              }}
              className="text-xs text-gray-500 hover:text-primary underline"
            >
              ← Try GPS instead
            </button>
          )}
        </div>
      )}

      {/* Active Status Indicator */}
      {isActive && !locationError && !shouldShowManualSelector && (
        <div className="mt-3 flex items-center gap-2 text-xs text-green-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
              clipRule="evenodd"
            />
          </svg>
          <span>
            {isUsingManualLocation
              ? `Using manual location: ${selectedCity}${selectedBarangay ? `, ${selectedBarangay}` : ''}`
              : 'Using your current GPS location'}
          </span>
        </div>
      )}
    </div>
  );
}