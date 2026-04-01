import { useSearchParams } from "react-router-dom";
import { useState, useCallback, useMemo } from "react";
import ShopAll from "../components/shop/ShopAll";
import SidebarFilter from "../components/shop/SidebarFilter";
import type { ProductQueryOptions } from "../services/shopService";

const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Rice', 'Corn', 'Livestock', 'Poultry', 'Fishery', 'Other'];

// Map top buttons to sidebar categories (for visual sync)
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

// Map sidebar to ACTUAL DATABASE values (sidebar can map to multiple DB categories)
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
    const searchQuery = searchParams.get('q') || '';
    
    // UI state - ALL independent, no mutual exclusion
    const [activeTopCategory, setActiveTopCategory] = useState<string>('All');
    const [sidebarCategories, setSidebarCategories] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<string>('newest');
    const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);

    // Combine all filters additively
    const queryOptions: ProductQueryOptions = useMemo(() => {
        // Start with base categories from top button (if not All)
        let categories: string[] = [];
        
        if (activeTopCategory !== 'All') {
            categories = [activeTopCategory]; // Top button uses direct DB value
        }
        
        // Add sidebar selections (additive) - map to actual DB values
        if (sidebarCategories.length > 0) {
            const dbCategories = sidebarCategories
                .flatMap(c => sidebarToDbMap[c] || [])
                .filter(Boolean);
            categories = [...new Set([...categories, ...dbCategories])];
        }
        
        return {
            categories: categories.length > 0 ? categories : undefined,
            sortBy: sortBy as ProductQueryOptions['sortBy'] || 'newest',
            minPrice: priceRange?.min,
            maxPrice: priceRange?.max,
            limit: 100
        };
    }, [activeTopCategory, sidebarCategories, sortBy, priceRange]);

    // Handlers
    const handleTopCategoryClick = useCallback((category: string) => {
        setActiveTopCategory(category);
        // Sync sidebar to match top button
        if (category !== 'All') {
            const mappedCategories = topToSidebarMap[category] || [];
            setSidebarCategories(mappedCategories);
        } else {
            setSidebarCategories([]);
        }
    }, []);

    const handleSidebarCategoryChange = useCallback((categories: string[]) => {
        setSidebarCategories(categories);
        // If user clears sidebar, reset top to All
        if (categories.length === 0) {
            setActiveTopCategory('All');
        } else {
            // Check if sidebar matches a top button exactly
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
        setSortBy('newest');
        setPriceRange(null);
    }, []);

    const hasActiveFilters = activeTopCategory !== 'All' || 
                            sidebarCategories.length > 0 || 
                            sortBy !== 'newest' ||
                            priceRange !== null;

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
                    />
                </div>
                
                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    {/* Active Filters Bar */}
                    {hasActiveFilters && (
                        <div className="mb-4 flex flex-wrap items-center gap-2 p-3 bg-green-50 rounded-lg">
                            <span className="text-sm font-semibold text-green-800">Active:</span>
                            {activeTopCategory !== 'All' && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                    {activeTopCategory}
                                </span>
                            )}
                            {sidebarCategories.map(cat => (
                                <span key={cat} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                    {cat}
                                </span>
                            ))}
                            {sortBy !== 'newest' && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                                    Sort: {sortBy.replace('-', ' ')}
                                </span>
                            )}
                            {priceRange && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                    ₱{priceRange.min} - ₱{priceRange.max}
                                </span>
                            )}
                            <button 
                                onClick={handleClearFilters}
                                className="ml-auto text-xs text-red-600 hover:text-red-800 underline"
                            >
                                Clear All
                            </button>
                        </div>
                    )}

                    {/* Top Category Buttons */}
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

                    <ShopAll 
                        searchQuery={searchQuery} 
                        queryOptions={queryOptions}
                    />
                </div>
            </div>
        </div>
    );
}