import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SidebarFilter from '../components/shop/SidebarFilter';
import ShopAll from '../components/shop/ShopAll';
import { getTrendingItems, type ProductQueryOptions } from '../services/shopService';
import { useNearbyFarmers } from '../hooks/useNearbyFarmers';

export default function Shop() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [trendingItems, setTrendingItems] = useState<{id: string; name: string; image?: string}[]>([]);
    
    // Filter states
    const [categories, setCategories] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState('trending');
    const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);
    
    // Nearby farmers state
    const [showNearbyFarmers, setShowNearbyFarmers] = useState(false);
    const {
        farmers: nearbyFarmers,
        loading: nearbyLoading,
        error: nearbyError,
        locationError: nearbyLocationError,
        requestLocation,
        isUsingManualLocation,
        setManualLocation,
    } = useNearbyFarmers({ radiusKm: 5, requireActiveProducts: true });

    // Build query options for products
    const queryOptions: ProductQueryOptions = {
        categories: categories.length > 0 ? categories : undefined,
        sortBy: sortBy as any,
        limit: 100,
        minPrice: priceRange?.min,
        maxPrice: priceRange?.max,
    };

    // Fetch trending items on mount
    useEffect(() => {
        const fetchTrending = async () => {
            const items = await getTrendingItems(5);
            setTrendingItems(items);
        };
        fetchTrending();
    }, []);

    // Handle search from URL params
    useEffect(() => {
        const searchFromUrl = searchParams.get('q') || searchParams.get('search') || '';
        if (searchFromUrl) {
            setSearchQuery(searchFromUrl);
        }
    }, [searchParams]);

    // Handle clear filters
    const handleClearFilters = () => {
        setCategories([]);
        setSortBy('trending');
        setPriceRange(null);
        setSearchQuery('');
        setSearchParams({});
    };

    const handleTrendingClick = (productId: string) => {
        // Navigate to product or set search
        window.location.href = `/item/${productId}`;
    };

    // Handle nearby farmers toggle
    const handleNearbyToggle = (active: boolean) => {
        setShowNearbyFarmers(active);
        if (active) {
            requestLocation();
        } else {
            setManualLocation(null);
        }
    };

    // Check if any filters are active
    const hasFilters = 
        categories.length > 0 || 
        sortBy !== 'trending' || 
        priceRange !== null ||
        searchQuery !== '';

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-12">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar Filters */}
                    <div className="w-full lg:w-64 flex-shrink-0">
                        <SidebarFilter
                            categories={categories}
                            onCategoryChange={setCategories}
                            sortBy={sortBy}
                            onSortChange={setSortBy}
                            priceRange={priceRange}
                            onPriceChange={(min, max) => setPriceRange({ min, max })}
                            onClear={handleClearFilters}
                            hasFilters={hasFilters}
                            trendingItems={trendingItems}
                            onTrendingClick={handleTrendingClick}
                            // Nearby farmers props
                            showNearbyFarmers={showNearbyFarmers}
                            onNearbyToggle={handleNearbyToggle}
                            onLocationSelect={setManualLocation}
                            nearbyLocationError={nearbyLocationError}
                            nearbyLoading={nearbyLoading}
                            isUsingManualLocation={isUsingManualLocation}
                        />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Page Title */}
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold text-gray-900">
                                {showNearbyFarmers ? 'Farmers Near You' : 'Shop All Products'}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {showNearbyFarmers 
                                    ? 'Discover local farmers within 5km of your location'
                                    : 'Browse fresh produce directly from local farmers'
                                }
                            </p>
                        </div>

                        {/* Products or Nearby Farmers */}
                        <ShopAll
                            searchQuery={searchQuery}
                            queryOptions={queryOptions}
                            // Nearby farmers props
                            nearbyFarmers={nearbyFarmers}
                            showNearbyFarmers={showNearbyFarmers}
                            nearbyLoading={nearbyLoading}
                            nearbyError={nearbyError}
                            onManualLocationSelect={setManualLocation}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}