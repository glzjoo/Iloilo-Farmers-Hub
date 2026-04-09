import { useNavigate } from 'react-router-dom';
import type { FarmerWithLocation } from '../../types';

interface FarmerCardProps {
  farmer: FarmerWithLocation & {
    distance: number;
    formattedDistance: string;
  };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-sm leading-none ${
            star <= Math.round(rating) ? 'text-yellow-500' : 'text-gray-300'
          }`}
        >
          ★
        </span>
      ))}
      <span className="text-xs text-gray-500 ml-1 font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function FarmerCard({ farmer }: FarmerCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/farmer/${farmer.uid}`);
  };

  // Get location display string
  const locationDisplay = farmer.farmLocation
    ? `${farmer.farmLocation.barangay}, ${farmer.farmLocation.city}`
    : farmer.farmAddress || 'Location not specified';

  // Get distance badge color
  const getDistanceColor = (distance: number): string => {
    if (distance <= 1) return 'bg-green-100 text-green-700';
    if (distance <= 2.5) return 'bg-blue-100 text-blue-700';
    if (distance <= 5) return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div
      onClick={handleClick}
      className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Image Container */}
      <div className="relative overflow-hidden">
        <img
          src={farmer.profileImage || '/placeholder-farmer.png'}
          alt={farmer.farmName || `${farmer.firstName} ${farmer.lastName}`}
          className="w-full h-44 object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Distance Badge */}
        <div
          className={`absolute top-2 right-2 rounded-full px-2.5 py-1 flex items-center gap-1 shadow-sm ${getDistanceColor(
            farmer.distance
          )}`}
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-[11px] font-semibold">{farmer.formattedDistance}</span>
        </div>
      </div>

      {/* Info Container */}
      <div className="p-3">
        {/* Farm Name */}
        <h3 className="text-sm font-bold text-gray-900 truncate">
          {farmer.farmName || `${farmer.firstName}'s Farm`}
        </h3>
        
        {/* Farmer Name */}
        <p className="text-xs text-gray-500 mt-0.5 truncate">
          {farmer.firstName} {farmer.lastName}
        </p>

        {/* Location */}
        <div className="flex items-center gap-1 mt-1.5">
          <svg
            className="w-3 h-3 text-gray-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-xs text-gray-400 truncate">{locationDisplay}</span>
        </div>

        {/* Rating - placeholder for now, can be connected to review system */}
        <div className="mt-2">
          <StarRating rating={4.5} />
        </div>
      </div>
    </div>
  );
}