import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import ShopAll from "../components/shop/ShopAll";


const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Rice', 'Corn', 'Livestock', 'Poultry', 'Fishery', 'Other'];

export default function Shop() {
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('q') || '';
    const [selectedCategory, setSelectedCategory] = useState('All');

    return (
        <div className="flex flex-col items-center justify-center">
            <h2 className="text-4xl font-bold text-primary font-primary text-center mt-10">
                {searchQuery ? `Results for "${searchQuery}"` : 'SHOP ALL'}
            </h2>

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-2 mt-6 mb-4 max-w-4xl px-4">
                {CATEGORIES.map(category => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === category
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            <ShopAll searchQuery={searchQuery} selectedCategory={selectedCategory} />
        </div>
    );
}