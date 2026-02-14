import { useState } from 'react';
import hamburgeIcon from '../assets/icons/hamburge-icon.svg';
import arrowLeftIcon from '../assets/icons/arrow-left.svg';

const trendingItems = ['avocado', 'bananas', 'rice', 'chicken'];

const sortOptions = ['Rating', 'Newest'];

const categoryOptions = [
    'fresh produce',
    'grains & rice',
    'poultry',
    'seafood',
    'processed goods',
    'seeds',
    'farm products',
];

const priceOptions = ['High-Low', 'Low-High'];

export default function HamburgerFilter() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                className="flex items-center gap-2 bg-transparent border-none cursor-pointer text-gray-700 text-sm font-semibold"
                onClick={() => setIsOpen(!isOpen)}
            >
                <img src={hamburgeIcon} className="w-5 h-5" />
                <span>All</span>
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 h-full w-64 bg-green-200 z-50 shadow-lg transform transition-transform duration-300 ease-in-out overflow-y-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="p-6">
                    {/* Close button */}


                    {/* Trending */}
                    <div className="mb-6">
                        <h3 className="text-base font-bold text-gray-900 mb-2">Trending</h3>
                        <ul className="list-none p-0 m-0 flex flex-col gap-1">
                            {trendingItems.map((item) => (
                                <li key={item}>
                                    <a href="#" className="text-green-700 text-sm underline hover:text-green-900">
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Sort by */}
                    <div className="mb-6">
                        <h3 className="text-base font-bold text-gray-900 mb-2">Sort by:</h3>
                        <ul className="list-none p-0 m-0 flex flex-col gap-1">
                            {sortOptions.map((option) => (
                                <li key={option} className="flex items-center gap-2">
                                    <input type="radio" name="sort" id={`sort-${option}`} className="accent-primary" />
                                    <label htmlFor={`sort-${option}`} className="text-sm text-gray-700">{option}</label>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <button
                        className="absolute bottom-1000 right-4 bg-primary text-white rounded-full w-7 h-7 flex items-center justify-center border-none cursor-pointer text-lg font-bold"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <img src={arrowLeftIcon} className="w-5 h-5" />
                    </button>
                    {/* Category */}
                    <div className="mb-6">
                        <h3 className="text-base font-bold text-green-700 mb-2">Category</h3>
                        <ul className="list-none p-0 m-0 flex flex-col gap-1">
                            {categoryOptions.map((option) => (
                                <li key={option} className="flex items-center gap-2">
                                    <input type="checkbox" id={`cat-${option}`} className="accent-primary" />
                                    <label htmlFor={`cat-${option}`} className="text-sm text-gray-700">{option}</label>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                        <h3 className="text-base font-bold text-green-700 mb-2">Price</h3>
                        <ul className="list-none p-0 m-0 flex flex-col gap-1">
                            {priceOptions.map((option) => (
                                <li key={option} className="flex items-center gap-2">
                                    <input type="radio" name="price" id={`price-${option}`} className="accent-primary" />
                                    <label htmlFor={`price-${option}`} className="text-sm text-gray-700">{option}</label>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </>
    );
}
