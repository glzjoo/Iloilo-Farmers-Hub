import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import searchIcon from '../../assets/icons/search.svg';

export default function SearchBar() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('q') || '');

    const handleSearch = () => {
        if (query.trim()) {
            navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
        } else {
            navigate('/shop');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="flex items-center bg-white rounded-full px-4 py-1.5 gap-2 flex-1 max-w-md">
            <input
                type="text"
                placeholder="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="border-none outline-none bg-transparent text-sm w-full text-gray-700"
            />
            <button
                onClick={handleSearch}
                className="bg-transparent border-none cursor-pointer p-0"
            >
                <img src={searchIcon} className="w-5 h-5 opacity-50" />
            </button>
        </div>
    );
}
