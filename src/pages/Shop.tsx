import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useCallback, useMemo, useEffect } from "react";
import ShopAll from "../components/shop/ShopAll";
import SidebarFilter from "../components/shop/SidebarFilter";
import type { ProductQueryOptions } from "../services/shopService";
import { getTrendingItems } from "../services/shopService";
import { useNearbyFarmers } from "../hooks/useNearbyFarmers";

type NearbyMode = 'selection' | 'choosing' | 'gps' | 'manual';

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
    const [activeTopCategory, setActiveTopCategory] = useState<string>('All');
    const [sidebarCategories, setSidebarCategories] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<string>('trending');
    const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);
    const [trendingItems, setTrendingItems] = useState<{ id: string; name: string; image: string }[]>([]);
    const [, setTrendingLoading] = useState(false);
    const [trendingError, setTrendingError] = useState<string | null>(null);

    // Nearby farmers state
    const [nearbyMode, setNearbyMode] = useState<NearbyMode>('selection');
    const [hasSearched, setHasSearched] = useState(false);

    const {
        farmers: nearbyFarmers,
        loading: nearbyLoading,
        error: nearbyError,
        locationError: nearbyLocationError,
        requestLocation,
        isUsingManualLocation,
        setManualLocation,
    } = useNearbyFarmers({ radiusKm: 5, requireActiveProducts: true });

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
            const matchingTop = Object.entries(topToSidebarMap).find(([_top, sides]) =>
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
    }, []);

    const handleTrendingClick = useCallback((productId: string) => {
        navigate(`/item/${productId}`);
    }, [navigate]);

    // Nearby farmers handlers - REVISED
    const handleFindFarmersClick = useCallback(() => {
        setNearbyMode('choosing'); // Show choice between GPS and Manual
        setHasSearched(false);
    }, []);

    const handleNearbyBack = useCallback(() => {
        setNearbyMode('selection');
        setHasSearched(false);
        setManualLocation(null);
    }, [setManualLocation]);

    const handleEnableGPS = useCallback(() => {
        setNearbyMode('gps');
        setHasSearched(true); // Mark as searched immediately (attempted)
        requestLocation();
    }, [requestLocation]);

    const handleEnableManual = useCallback(() => {
        setNearbyMode('manual');
        // Don't mark as searched yet, wait for Apply
    }, []);

    const handleLocationSelect = useCallback((coords: { lat: number; lng: number } | null, city?: string, barangay?: string) => {
        setHasSearched(true);
        setManualLocation(coords, city, barangay); // Pass city/barangay
    }, [setManualLocation]);

    // Auto-fallback to manual if GPS denied
    useEffect(() => {
        if (nearbyMode === 'gps' && nearbyLocationError && !isUsingManualLocation) {
            // GPS failed, auto-switch to manual
            setNearbyMode('manual');
        }
    }, [nearbyMode, nearbyLocationError, isUsingManualLocation]);

    const hasActiveFilters = activeTopCategory !== 'All' ||
        sidebarCategories.length > 0 ||
        sortBy !== 'trending' ||
        priceRange !== null;

    // mobile filter state
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    useEffect(() => {
        const handleOpenFilter = () => setIsMobileFilterOpen(true);
        window.addEventListener('openMobileFilter', handleOpenFilter);
        return () => window.removeEventListener('openMobileFilter', handleOpenFilter);
    }, []);


    return (
        <div className="w-full pb-10 mt-0 md:mt-10 mb-8">

            {/*  MOBILE FILTER DROPDOWN */}
            {isMobileFilterOpen && (
                <div className="fixed inset-0 z-30 md:hidden top-[95px] flex flex-col">

                    {/* Dark Backdrop (Clicking this closes the dropdown) */}
                    <div
                        className="absolute inset-0 bg-black/60 transition-opacity"
                        onClick={() => setIsMobileFilterOpen(false)}
                    />

                    {/* Dropdown Panel */}
                    <div className="relative w-full bg-white rounded-b-3xl shadow-2xl flex flex-col max-h-[75vh] animate-slide-down">

                        {/* Scrollable Filter Content */}

                        <div className="flex-1 overflow-y-auto p-5">
                            <SidebarFilter
                                idPrefix='mobile'
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
                                nearbyMode={nearbyMode}
                                onFindFarmersClick={handleFindFarmersClick}
                                onNearbyBack={handleNearbyBack}
                                onEnableGPS={handleEnableGPS}
                                onEnableManual={handleEnableManual}
                                onLocationSelect={handleLocationSelect}
                                nearbyLocationError={nearbyLocationError}
                                nearbyLoading={nearbyLoading}
                            />
                        </div>

                        {/* Sticky Footer Actions */}
                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3 rounded-b-3xl">
                            <button
                                onClick={() => { handleClearFilters(); setIsMobileFilterOpen(false); }}
                                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-bold bg-white cursor-pointer hover:bg-gray-100 transition-colors"
                            >
                                Reset
                            </button>
                            <button
                                onClick={() => setIsMobileFilterOpen(false)}
                                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold border-none cursor-pointer hover:bg-green-700 transition-colors"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- 2. MAIN CONTENT CONTAINER --- */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-start gap-4 md:gap-8 mt-4 md:mt-0">

                {/* Desktop Sidebar (Hidden on mobile) */}
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
                        nearbyMode={nearbyMode}
                        onFindFarmersClick={handleFindFarmersClick}
                        onNearbyBack={handleNearbyBack}
                        onEnableGPS={handleEnableGPS}
                        onEnableManual={handleEnableManual}
                        onLocationSelect={handleLocationSelect}
                        nearbyLocationError={nearbyLocationError}
                        nearbyLoading={nearbyLoading}
                    />
                    {trendingError && nearbyMode === 'selection' && (
                        <div className="mt-2 p-2 bg-red-50 text-red-600 text-xs rounded">
                            {trendingError}
                        </div>
                    )}
                </div>

                {/* Product Grid Area */}
                <div className="flex-1 min-w-0">
                    {nearbyMode === 'selection' && (
                        <div className="flex overflow-x-auto gap-2 mb-6 pb-2 -mx-2 px-2 scrollbar-hide">
                            {CATEGORIES.map(category => (
                                <button
                                    key={category}
                                    onClick={() => handleTopCategoryClick(category)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${activeTopCategory === category
                                        ? 'bg-primary text-white border border-primary'
                                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    )}

                    <ShopAll
                        searchQuery={searchQuery}
                        queryOptions={queryOptions}
                        nearbyFarmers={nearbyFarmers}
                        nearbyMode={nearbyMode}
                        nearbyLoading={nearbyLoading}
                        nearbyError={nearbyError}
                        isUsingManualLocation={isUsingManualLocation}
                        hasSearched={hasSearched}
                    />
                </div>
            </div>
        </div>
    );
}