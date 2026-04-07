import { useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import searchIcon from '../../assets/icons/search.svg';
import { useSanitizedInput } from '../../hooks/useSanitizedInput';

// Debounce hook for future autocomplete
function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}

export default function SearchBar() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { sanitizeSearch } = useSanitizedInput();
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [isSearching, setIsSearching] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const debouncedSearch = useDebounce((searchQuery: string) => {
        console.log('Autocomplete query:', searchQuery);
    }, 300);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const sanitized = value.replace(/[<>\"'&]/g, '');
        setQuery(sanitized);

        if (sanitized.length > 2) {
            debouncedSearch(sanitized);
        }
    };

    const handleSearch = () => {
        const trimmedQuery = query.trim();

        if (!trimmedQuery) {
            navigate('/shop');
            return;
        }

        const sanitized = sanitizeSearch(trimmedQuery);

        if (!sanitized) {
            navigate('/shop');
            return;
        }

        setIsSearching(true);
        navigate(`/shop?q=${encodeURIComponent(sanitized)}`);
        
        setTimeout(() => setIsSearching(false), 500);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    };

    const clearSearch = () => {
        setQuery('');
        inputRef.current?.focus();
    };

    return (
        <div className="flex items-center bg-white rounded-full px-4 py-2 gap-2 w-[400px] max-w-xl shrink-0 relative h-10">
            <input
                ref={inputRef}
                type="text"
                placeholder="Search products..."
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                maxLength={50}
                className="border-none outline-none bg-transparent text-sm w-full text-gray-700 placeholder-gray-400 min-w-0"
                aria-label="Search products"
            />
            
            {query && (
                <button
                    onClick={clearSearch}
                    className="text-gray-400 hover:text-gray-600 text-sm p-1 rounded-full hover:bg-gray-100 transition-colors shrink-0"
                    aria-label="Clear search"
                    type="button"
                >
                    ✕
                </button>
            )}
            
            <button
                onClick={handleSearch}
                disabled={isSearching}
                className="bg-transparent border-none cursor-pointer p-0 disabled:opacity-50 shrink-0"
                aria-label="Search"
                type="button"
            >
                <img 
                    src={searchIcon} 
                    className={`w-5 h-5 opacity-50 ${isSearching ? 'animate-pulse' : ''}`} 
                    alt="Search"
                />
            </button>
        </div>
    );
}