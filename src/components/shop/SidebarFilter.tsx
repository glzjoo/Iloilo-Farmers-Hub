import { useState, useEffect } from 'react';
import filter from '../../assets/icons/filter.svg';
import NearbyFarmerToggle from './NearbyFarmerToggle';

interface SidebarFilterProps {
    categories: string[];
    onCategoryChange: (categories: string[]) => void;
    sortBy: string;
    onSortChange: (sort: string) => void;
    priceRange: { min: number; max: number } | null;
    onPriceChange: (min: number, max: number) => void;
    onClear: () => void;
    hasFilters: boolean;
    trendingItems?: { id: string; name: string; image?: string }[];
    onTrendingClick?: (productId: string) => void;
    // NEW: Nearby farmers props
    showNearbyFarmers?: boolean;
    onNearbyToggle?: (active: boolean) => void;
    onLocationSelect?: (coords: { lat: number; lng: number } | null) => void;
    nearbyLocationError?: string | null;
    nearbyLoading?: boolean;
    isUsingManualLocation?: boolean;
}

const categoryOptions = [
    { label: 'Fresh Produce', value: 'Fresh Produce' },
    { label: 'Grains & Rice', value: 'Grains & Rice' },
    { label: 'Poultry', value: 'Poultry' },
    { label: 'Seafood', value: 'Seafood' },
    { label: 'Processed Goods', value: 'Processed Goods' },
    { label: 'Seeds', value: 'Seeds' },
    { label: 'Farm Products', value: 'Farm Products' },
] as const;

const sortOptions = [
    { label: 'Trending', value: 'trending' },
    { label: 'Newest', value: 'newest' },
    { label: 'Rating', value: 'rating' },
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' },
] as const;

export default function SidebarFilter({
    categories,
    onCategoryChange,
    sortBy,
    onSortChange,
    priceRange,
    onPriceChange,
    onClear,
    hasFilters,
    trendingItems = [],
    onTrendingClick,
    // NEW props
    showNearbyFarmers = false,
    onNearbyToggle = () => {},
    onLocationSelect = () => {},
    nearbyLocationError = null,
    nearbyLoading = false,
    isUsingManualLocation = false,
}: SidebarFilterProps) {
    const [localPriceMin, setLocalPriceMin] = useState(priceRange?.min?.toString() || '');
    const [localPriceMax, setLocalPriceMax] = useState(priceRange?.max?.toString() || '');

    useEffect(() => {
        setLocalPriceMin(priceRange?.min?.toString() || '');
        setLocalPriceMax(priceRange?.max?.toString() || '');
    }, [priceRange]);

    const handleCategoryToggle = (value: string) => {
        const newCategories = categories.includes(value)
            ? categories.filter(c => c !== value)
            : [...categories, value];
        onCategoryChange(newCategories);
    };

    const applyPriceFilter = () => {
        const min = parseFloat(localPriceMin) || 0;
        const max = parseFloat(localPriceMax) || Infinity;
        onPriceChange(min, max === Infinity ? 999999 : max);
    };

    // Check if any filters are active (including nearby)
    const hasAnyFilters = hasFilters || showNearbyFarmers;

    return (
        <aside className="w-full h-full bg-white border-r border-gray-100 pr-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                    <img src={filter} className="w-5 h-5" alt="Filter" />
                    Filters
                </h2>
                {hasAnyFilters && (
                    <button 
                        onClick={() => {
                            onClear();
                            onNearbyToggle(false);
                            onLocationSelect(null);
                        }}
                        className="text-xs text-red-600 hover:text-red-800 underline"
                    >
                        Clear All
                    </button>
                )}
            </div>

            {/* Trending - Dynamic clickable items */}
            {trendingItems.length > 0 && !showNearbyFarmers && (
                <div className="border-b border-gray-200 pb-5 mb-5">
                    <h3 className="text-[13px] font-semibold text-gray-800 mb-4 uppercase tracking-wider flex items-center gap-2">
                        <span className="text-red-500">🔥</span> Trending Now
                    </h3>
                    <div className="flex flex-col gap-2">
                        {trendingItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onTrendingClick?.(item.id)}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left group"
                            >
                                {item.image ? (
                                    <img 
                                        src={item.image} 
                                        alt={item.name}
                                        className="w-10 h-10 rounded object-cover"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                                        No img
                                    </div>
                                )}
                                <span className="text-sm text-gray-700 group-hover:text-primary font-medium truncate">
                                    {item.name}
                                </span>
                                <span className="ml-auto text-red-500 text-xs">→</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* NEARBY FARMERS TOGGLE - PROMINENT PLACEMENT */}
            <NearbyFarmerToggle
                isActive={showNearbyFarmers}
                onToggle={onNearbyToggle}
                onLocationSelect={onLocationSelect}
                locationError={nearbyLocationError}
                isLoading={nearbyLoading}
                isUsingManualLocation={isUsingManualLocation}
            />

            {/* Sort by - Hidden when showing nearby farmers */}
            {!showNearbyFarmers && (
                <div className="border-b border-gray-200 pb-5 mb-5">
                    <h3 className="text-[13px] font-semibold text-gray-800 mb-4 uppercase tracking-wider">
                        Sort By
                    </h3>
                    <div className="flex flex-col gap-2">
                        {sortOptions.map(option => (
                            <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                                <input 
                                    type="radio" 
                                    name="sort" 
                                    checked={sortBy === option.value}
                                    onChange={() => onSortChange(option.value)}
                                    className="w-4 h-4 text-primary focus:ring-primary cursor-pointer" 
                                />
                                <span className={`text-sm transition-colors ${
                                    sortBy === option.value 
                                        ? 'text-primary font-semibold' 
                                        : 'text-gray-700 group-hover:text-primary'
                                }`}>
                                    {option.label}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Category - Hidden when showing nearby farmers */}
            {!showNearbyFarmers && (
                <div className="border-b border-gray-200 pb-5 mb-5">
                    <h3 className="text-[13px] font-semibold text-gray-800 mb-4 uppercase tracking-wider">
                        Categories
                    </h3>
                    <div className="flex flex-col gap-2">
                        {categoryOptions.map(option => (
                            <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    checked={categories.includes(option.value)}
                                    onChange={() => handleCategoryToggle(option.value)}
                                    className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer" 
                                />
                                <span className={`text-sm transition-colors ${
                                    categories.includes(option.value)
                                        ? 'text-primary font-semibold' 
                                        : 'text-gray-700 group-hover:text-primary'
                                }`}>
                                    {option.label}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Price Range - Hidden when showing nearby farmers */}
            {!showNearbyFarmers && (
                <div className="pb-5">
                    <h3 className="text-[13px] font-semibold text-gray-800 mb-4 uppercase tracking-wider">
                        Price Range (₱)
                    </h3>
                    <div className="flex gap-2 mb-3">
                        <input
                            type="number"
                            placeholder="Min"
                            value={localPriceMin}
                            onChange={(e) => setLocalPriceMin(e.target.value)}
                            className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary focus:border-primary"
                        />
                        <span className="text-gray-400 self-center">-</span>
                        <input
                            type="number"
                            placeholder="Max"
                            value={localPriceMax}
                            onChange={(e) => setLocalPriceMax(e.target.value)}
                            className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-primary focus:border-primary"
                        />
                    </div>
                    <button
                        onClick={applyPriceFilter}
                        className="w-full py-1.5 bg-primary text-white text-xs font-semibold rounded hover:bg-green-700 transition-colors"
                    >
                        Apply Price
                    </button>
                </div>
            )}
        </aside>
    );
}