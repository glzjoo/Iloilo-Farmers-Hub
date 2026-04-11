import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useCallback, useMemo, useEffect } from "react";
import ShopAll from "../components/shop/ShopAll";
import SidebarFilter from "../components/shop/SidebarFilter";
import type { ProductQueryOptions } from "../services/shopService";
import { getTrendingItems } from "../services/shopService";
import { useNearbyFarmers } from "../hooks/useNearbyFarmers";

const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Rice', 'Corn', 'Livestock', 'Poultry', 'Fishery', 'Other'];

const topToSidebarMap: Record<string, string[]> = {
    'Vegetables': ['Fresh Produce'],
    'Fruits': ['Fresh Produce'],
    'Rice': ['Grains & Rice'],
    'Corn': ['Grains & Rice'],
    'Livestock': ['Farm Products'],
    'Poultry': ['Poultry'],
    'Fishery': ['Seafood'],
    'Other': ['Processed Goods', 'Seeds']
};

const sidebarToDbMap: Record<string, string[]> = {
    'Fresh Produce': ['Vegetables', 'Fruits'],
    'Grains & Rice': ['Rice', 'Corn'],
    'Poultry': ['Poultry'],
    'Seafood': ['Fishery'],
    'Processed Goods': ['Other'],
    'Seeds': ['Other'],
    'Farm Products': ['Livestock']
};

export default function Shop() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const searchQuery = searchParams.get('q') || '';
    
    // UI state
    const [activeTopCategory, setActiveTopCategory] = useState<string>('All');
    const [sidebarCategories, setSidebarCategories] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<string>('trending');
    const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);
    const [trendingItems, setTrendingItems] = useState<{id: string; name: string; image: string}[]>([]);
    const [trendingLoading, setTrendingLoading] = useState(false);
    const [trendingError, setTrendingError] = useState<string | null>(null);

    // Nearby farmers state
    const [showNearbyFarmers, setShowNearbyFarmers] = useState(false);
    const [gpsPermissionGranted, setGpsPermissionGranted] = useState(false);
    
    const {
        farmers: nearbyFarmers,
        loading: nearbyLoading,
        error: nearbyError,
        locationError: nearbyLocationError,
        requestLocation,
        isUsingManualLocation,
        setManualLocation,
    } = useNearbyFarmers({ radiusKm: 5, requireActiveProducts: true });

    // Fetch trending items on mount with error handling
    useEffect(() => {
        const fetchTrending = async () => {
            try {
                setTrendingLoading(true);
                setTrendingError(null);
                const items = await getTrendingItems(4);
                setTrendingItems(items);
            } catch (err) {
                console.error('Failed to fetch trending items:', err);
                setTrendingError('Failed to load trending items');
                setTrendingItems([]);
            } finally {
                setTrendingLoading(false);
            }
        };
        fetchTrending();
    }, []);

    // Combine all filters
    const queryOptions: ProductQueryOptions = useMemo(() => {
        let categories: string[] = [];
        
        if (activeTopCategory !== 'All') {
            categories = [activeTopCategory];
        }
        
        if (sidebarCategories.length > 0) {
            const dbCategories = sidebarCategories
                .flatMap(c => sidebarToDbMap[c] || [])
                .filter(Boolean);
            categories = [...new Set([...categories, ...dbCategories])];
        }
        
        return {
            categories: categories.length > 0 ? categories : undefined,
            sortBy: sortBy as ProductQueryOptions['sortBy'] || 'trending',
            minPrice: priceRange?.min,
            maxPrice: priceRange?.max,
            limit: 100
        };
    }, [activeTopCategory, sidebarCategories, sortBy, priceRange]);

    const handleTopCategoryClick = useCallback((category: string) => {
        setActiveTopCategory(category);
        if (category !== 'All') {
            const mappedCategories = topToSidebarMap[category] || [];
            setSidebarCategories(mappedCategories);
        } else {
            setSidebarCategories([]);
        }
    }, []);

    const handleSidebarCategoryChange = useCallback((categories: string[]) => {
        setSidebarCategories(categories);
        if (categories.length === 0) {
            setActiveTopCategory('All');
        } else {
            const matchingTop = Object.entries(topToSidebarMap).find(([top, sides]) => 
                sides.length === categories.length && 
                sides.every(s => categories.includes(s))
            );
            setActiveTopCategory(matchingTop ? matchingTop[0] : 'All');
        }
    }, []);

    const handleSortChange = useCallback((sort: string) => {
        setSortBy(sort);
    }, []);

    const handlePriceChange = useCallback((min: number, max: number) => {
        setPriceRange({ min, max });
    }, []);

    const handleClearFilters = useCallback(() => {
        setActiveTopCategory('All');
        setSidebarCategories([]);
        setSortBy('trending');
        setPriceRange(null);
        setShowNearbyFarmers(false);
        setGpsPermissionGranted(false);
        setManualLocation(null);
    }, [setManualLocation]);

    const handleTrendingClick = useCallback((productId: string) => {
        navigate(`/item/${productId}`);
    }, [navigate]);

    // Handle nearby farmers toggle
    const handleNearbyToggle = useCallback((active: boolean) => {
        setShowNearbyFarmers(active);
        setGpsPermissionGranted(false);
        if (active) {
            requestLocation();
        } else {
            setManualLocation(null);
        }
    }, [requestLocation, setManualLocation]);

    // Handle manual location selection when no farmers found
    const handleManualLocationSelect = useCallback((coords: { lat: number; lng: number } | null) => {
        setManualLocation(coords);
    }, [setManualLocation]);

    // Track GPS permission status
    useEffect(() => {
        if (showNearbyFarmers && !nearbyLoading && !isUsingManualLocation) {
            if (!nearbyLocationError && !nearbyError) {
                setGpsPermissionGranted(true);
            }
        }
    }, [showNearbyFarmers, nearbyLoading, nearbyLocationError, nearbyError, isUsingManualLocation]);

    const hasActiveFilters = activeTopCategory !== 'All' || 
                            sidebarCategories.length > 0 || 
                            sortBy !== 'trending' ||
                            priceRange !== null ||
                            showNearbyFarmers;

    return (
        <div className="w-full pb-10 mt-10 mb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-start gap-4 md:gap-8">
                {/* Sidebar */}
                <div className="w-[220px] lg:w-[250px] flex-shrink-0 hidden md:block">
                    <SidebarFilter 
                        categories={sidebarCategories}
                        onCategoryChange={handleSidebarCategoryChange}
                        sortBy={sortBy}
                        onSortChange={handleSortChange}
                        priceRange={priceRange}
                        onPriceChange={handlePriceChange}
                        onClear={handleClearFilters}
                        hasFilters={hasActiveFilters}
                        trendingItems={trendingItems}
                        onTrendingClick={handleTrendingClick}
                        // Nearby farmers props
                        showNearbyFarmers={showNearbyFarmers}
                        onNearbyToggle={handleNearbyToggle}
                        onLocationSelect={handleManualLocationSelect}
                        nearbyLocationError={nearbyLocationError}
                        nearbyLoading={nearbyLoading}
                        isUsingManualLocation={isUsingManualLocation}
                        gpsPermissionGranted={gpsPermissionGranted}
                    />
                    {trendingError && (
                        <div className="mt-2 p-2 bg-red-50 text-red-600 text-xs rounded">
                            {trendingError}
                        </div>
                    )}
                </div>
                
                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    {/* Top Category Buttons - Hidden when showing nearby farmers */}
                    {!showNearbyFarmers && (
                        <div className="flex flex-wrap justify-center gap-2 mb-6">
                            {CATEGORIES.map(category => (
                                <button
                                    key={category}
                                    onClick={() => handleTopCategoryClick(category)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                                        activeTopCategory === category
                                            ? 'bg-primary text-white border border-primary'
                                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Page Title - Only show when nearby farmers active */}
                    {showNearbyFarmers && (
                        <div className="mb-6 text-center">
                            <h1 className="text-2xl font-bold text-gray-900">Farmers Near You</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Discover local farmers within 5km of your location
                            </p>
                        </div>
                    )}

                    <ShopAll 
                        searchQuery={searchQuery} 
                        queryOptions={queryOptions}
                        nearbyFarmers={nearbyFarmers}
                        showNearbyFarmers={showNearbyFarmers}
                        nearbyLoading={nearbyLoading}
                        nearbyError={nearbyError}
                        onManualLocationSelect={handleManualLocationSelect} // ADD THIS
                        isUsingManualLocation={isUsingManualLocation}
                        gpsPermissionGranted={gpsPermissionGranted}
                    />
                </div>
            </div>
        </div>
    );
}