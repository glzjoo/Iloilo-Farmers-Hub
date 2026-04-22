import { useState } from 'react';
import {
  CITY_COORDINATES,
  BARANGAY_COORDINATES,
  typedBarangays,
  type Coordinates,
} from '../../hooks/useNearbyFarmers';
//NearbyFarmerToggle.tsx
type NearbyMode = 'selection' | 'choosing' | 'gps' | 'manual';

interface NearbyFarmerToggleProps {
  mode: NearbyMode;
  onFindFarmersClick: () => void;
  onBack: () => void;
  onEnableGPS: () => void;
  onEnableManual: () => void;
  onLocationSelect: (coords: Coordinates | null, city?: string, barangay?: string) => void;
  locationError: string | null;
  isLoading: boolean;
}

const cities = typedBarangays.cities.map((c) => c.name);

export default function NearbyFarmerToggle({
  mode,
  onFindFarmersClick,
  onBack,
  onEnableGPS,
  onEnableManual,
  onLocationSelect,
  locationError,
  isLoading,
}: NearbyFarmerToggleProps) {
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('');

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSelectedBarangay('');
  };

  const handleBarangayChange = (barangay: string) => {
    setSelectedBarangay(barangay);
  };

  const handleApplyManual = () => {
    let coords: Coordinates | null = null;
    
    if (selectedCity && BARANGAY_COORDINATES[selectedCity]?.[selectedBarangay]) {
      coords = BARANGAY_COORDINATES[selectedCity][selectedBarangay];
    } else if (selectedCity && CITY_COORDINATES[selectedCity]) {
      coords = CITY_COORDINATES[selectedCity];
    }
    
    // Pass city and barangay along with coordinates
    onLocationSelect(coords, selectedCity, selectedBarangay || undefined);
  };

  const getBarangaysForCity = (cityName: string): string[] => {
    const city = typedBarangays.cities.find((c) => c.name === cityName);
    return city ? city.barangays.map((b) => b.name) : [];
  };

  const canApplyManual = selectedCity !== '';

  // STEP 1: Initial button
  if (mode === 'selection') {
    return (
      <div className="border-b border-gray-200 pb-5 mb-5">
        <button
          onClick={onFindFarmersClick}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-primary text-white font-semibold hover:bg-green-700 transition-all shadow-sm hover:shadow-md"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Find farmers near you
        </button>
      </div>
    );
  }

  // STEP 2: Choose GPS or Manual
  if (mode === 'choosing') {
    return (
      <div className="border-b border-gray-200 pb-5 mb-5">

        <h3 className="text-[13px] font-semibold text-gray-800 mb-3 uppercase tracking-wider flex items-center gap-2">
          <span className="text-primary">📍</span> Nearby Farmers
        </h3>

        <div className="space-y-3">
          <p className="text-xs text-gray-600 bg-blue-50 p-3 rounded-lg">
            Choose between GPS or manual to find farmers near you
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onEnableGPS}
              className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-primary bg-green-50 hover:bg-green-100 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-primary text-center">Use GPS</span>
            </button>

            <button
              onClick={onEnableManual}
              className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-gray-50 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-gray-700 text-center">Manual</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 3a: GPS Mode (requesting or active)
  if (mode === 'gps') {
    return (
      <div className="border-b border-gray-200 pb-5 mb-5">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Browse All Products
        </button>

        <h3 className="text-[13px] font-semibold text-gray-800 mb-3 uppercase tracking-wider flex items-center gap-2">
          <span className="text-primary">📍</span> Nearby Farmers
        </h3>

        {isLoading ? (
          <div className="flex flex-col items-center gap-3 p-4 bg-green-50 rounded-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="text-sm text-gray-600">Finding your location...</span>
          </div>
        ) : locationError ? (
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-red-600">{locationError}</p>
            <p className="text-xs text-gray-500 mt-1">Switching to manual mode...</p>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-green-700">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Using GPS Location</span>
          </div>
        )}
      </div>
    );
  }

  // STEP 3b: Manual Mode (or fallback from GPS)
  if (mode === 'manual') {
    return (
      <div className="border-b border-gray-200 pb-5 mb-5">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Browse All Products
        </button>

        <h3 className="text-[13px] font-semibold text-gray-800 mb-3 uppercase tracking-wider flex items-center gap-2">
          <span className="text-primary">📍</span> Nearby Farmers
        </h3>

        <div className="space-y-3">
          {locationError && (
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
              GPS unavailable. Please select location manually.
            </p>
          )}

          <div className="p-3 bg-gray-50 rounded-lg space-y-3">
            <p className="text-xs font-semibold text-gray-700">
              {locationError ? 'Select location to continue:' : 'Select your location:'}
            </p>
            
            <div>
              <label className="text-xs text-gray-500 mb-1 block">City/Municipality *</label>
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

            <button
              onClick={handleApplyManual}
              disabled={!canApplyManual || isLoading}
              className={`w-full py-2 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                canApplyManual && !isLoading
                  ? 'bg-primary text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Searching...
                </>
              ) : (
                'Apply Location'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}