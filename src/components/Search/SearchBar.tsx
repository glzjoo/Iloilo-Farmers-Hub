import { useState, useCallback } from 'react';
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

import { useRef } from 'react';

export default function SearchBar() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { sanitizeSearch } = useSanitizedInput();
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [isSearching, setIsSearching] = useState(false);

    // Debounced search for future autocomplete feature
    const debouncedSearch = useDebounce((searchQuery: string) => {
        // Future: Call API for autocomplete suggestions
        console.log('Autocomplete query:', searchQuery);
    }, 300);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        
        // Real-time sanitization: prevent dangerous characters
        const sanitized = value.replace(/[<>\"'&]/g, '');
        setQuery(sanitized);
        
        // Trigger debounced autocomplete (future feature)
        if (sanitized.length > 2) {
            debouncedSearch(sanitized);
        }
    };

    const handleSearch = () => {
        const trimmedQuery = query.trim();
        
        if (!trimmedQuery) {
            // Empty search: go to shop without query param
            navigate('/shop');
            return;
        }

        // Full sanitization before navigation
        const sanitized = sanitizeSearch(trimmedQuery);
        
        if (!sanitized) {
            navigate('/shop');
            return;
        }

        setIsSearching(true);
        navigate(`/shop?q=${encodeURIComponent(sanitized)}`);
        
        // Reset searching state after navigation
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
        // Focus back on input
        const input = document.querySelector('input[type="text"]') as HTMLInputElement;
        input?.focus();
    };

    return (
        <div className="flex items-center bg-white rounded-full px-4 py-1.5 gap-2 flex-1 max-w-md relative">
            <input
                type="text"
                placeholder="Search products..."
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                maxLength={50}
                className="border-none outline-none bg-transparent text-sm w-full text-gray-700 placeholder-gray-400"
                aria-label="Search products"
            />
            
            {/* Clear button - visible when query exists */}
            {query && (
                <button
                    onClick={clearSearch}
                    className="text-gray-400 hover:text-gray-600 text-sm p-1 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="Clear search"
                    type="button"
                >
                    ✕
                </button>
            )}
            
            {/* Search button */}
            <button
                onClick={handleSearch}
                disabled={isSearching}
                className="bg-transparent border-none cursor-pointer p-0 disabled:opacity-50"
                aria-label="Search"
                type="button"
            >
                <img 
                    src={searchIcon} 
                    className={`w-5 h-5 opacity-50 ${isSearching ? 'animate-pulse' : ''}`} 
                    alt="Search"
                />
            </button>
            
            {/* Character count warning */}
            {query.length >= 45 && (
                <span className="absolute -bottom-5 left-4 text-xs text-orange-500">
                    {50 - query.length} characters left
                </span>
            )}
        </div>
    );
}