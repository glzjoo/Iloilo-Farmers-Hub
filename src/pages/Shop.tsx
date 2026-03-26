import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import ShopAll from "../components/shop/ShopAll";
import SidebarFilter from "../components/shop/SidebarFilter";


const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Rice', 'Corn', 'Livestock', 'Poultry', 'Fishery', 'Other'];

export default function Shop() {
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('q') || '';
    const [selectedCategory, setSelectedCategory] = useState('All');

    return (
        <div className="w-full pb-10 mt-10 mb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-start gap-4 md:gap-8 mb">
                {/* Left Sidebar Filter */}
                <div className="w-[220px] lg:w-[250px] flex-shrink-0 hidden md:block">
                    <SidebarFilter />
                </div>
                {/* Right Content */}
                <div className="flex-1 min-w-0">
                    {/* Category Filter */}
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                        {CATEGORIES.map(category => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${selectedCategory === category
                                    ? 'bg-primary text-white border border-primary'
                                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    <ShopAll searchQuery={searchQuery} selectedCategory={selectedCategory} />
                </div>
            </div>
        </div>
    );
}