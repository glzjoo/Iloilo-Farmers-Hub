import { useSearchParams, useNavigate } from "react-router-dom";
import { useState, useCallback, useMemo, useEffect } from "react";
import ShopAll from "../components/shop/ShopAll";
import SidebarFilter from "../components/shop/SidebarFilter";
import type { ProductQueryOptions } from "../services/shopService";
import { getTrendingItems } from "../services/shopService";

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
    const [sortBy, setSortBy] = useState<string>('trending'); // Default to trending
    const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);
    const [trendingItems, setTrendingItems] = useState<{id: string; name: string; image?: string}[]>([]);

    // Fetch trending items on mount
    useEffect(() => {
        const fetchTrending = async () => {
            const items = await getTrendingItems(4);
            setTrendingItems(items);
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
    }, []);

    const handleTrendingClick = useCallback((productId: string) => {
        navigate(`/item/${productId}`);
    }, [navigate]);

    const hasActiveFilters = activeTopCategory !== 'All' || 
                            sidebarCategories.length > 0 || 
                            sortBy !== 'trending' ||
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
                        trendingItems={trendingItems}
                        onTrendingClick={handleTrendingClick}
                    />
                </div>
                
                {/* Main Content */}
                <div className="flex-1 min-w-0">

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