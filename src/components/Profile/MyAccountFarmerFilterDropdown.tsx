import { useState } from 'react';

interface FilterOptions {
    category: string;
    status: string;
    sortBy: string;
}

interface Props {
    onApply: (filters: FilterOptions) => void;
    onClose: () => void;
}

const categories = ['All', 'Vegetables', 'Fruits', 'Rice', 'Corn', 'Livestock', 'Poultry', 'Fishery', 'Other'];
const statuses = ['All', 'Active', 'Inactive'];
const sortOptions = ['Newest', 'Oldest', 'Price: High-Low', 'Price: Low-High', 'Name: A-Z', 'Name: Z-A'];

export default function MyAccountFarmerFilterDropdown({ onApply, onClose }: Props) {
    const [category, setCategory] = useState('All');
    const [status, setStatus] = useState('All');
    const [sortBy, setSortBy] = useState('Newest');

    const handleApply = () => {
        onApply({ category, status, sortBy });
        onClose();
    };

    const handleReset = () => {
        setCategory('All');
        setStatus('All');
        setSortBy('Newest');
    };

    return (
        <div className="absolute right-0 top-full mt-2 w-[280px] bg-white rounded-xl shadow-lg border border-gray-200 z-50 p-5">
            {/* Category */}
            <div className="mb-4">
                <h4 className="text-sm font-bold text-gray-800 mb-2">Category</h4>
                <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${category === cat
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Status */}
            <div className="mb-4">
                <h4 className="text-sm font-bold text-gray-800 mb-2">Status</h4>
                <div className="flex gap-2">
                    {statuses.map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatus(s)}
                            className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${status === s
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sort By */}
            <div className="mb-5">
                <h4 className="text-sm font-bold text-gray-800 mb-2">Sort by</h4>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary cursor-pointer"
                >
                    {sortOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                <button
                    onClick={handleReset}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                    Reset
                </button>
                <button
                    onClick={handleApply}
                    className="flex-1 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold cursor-pointer hover:bg-green-700 transition-colors"
                >
                    Apply
                </button>
            </div>
        </div>
    );
}