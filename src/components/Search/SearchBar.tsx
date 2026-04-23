import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import searchIcon from '../../assets/icons/search.svg';
import { useSanitizedInput } from '../../hooks/useSanitizedInput';
//searchbar.tsx
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
    const [mobileExpanded, setMobileExpanded] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const mobileInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus mobile input when expanded
    useEffect(() => {
        if (mobileExpanded && mobileInputRef.current) {
            mobileInputRef.current.focus();
        }
    }, [mobileExpanded]);

    const debouncedSearch = useDebounce((searchQuery: string) => {
        console.log('Autocomplete query:', searchQuery);
    }, 300);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const sanitized = value.replace(/[<>\\"'&]/g, '');
        setQuery(sanitized);

        if (sanitized.length > 2) {
            debouncedSearch(sanitized);
        }
    };

    const handleSearch = () => {
        const trimmedQuery = query.trim();

        if (!trimmedQuery) {
            navigate('/shop');
            setMobileExpanded(false);
            return;
        }

        const sanitized = sanitizeSearch(trimmedQuery);

        if (!sanitized) {
            navigate('/shop');
            setMobileExpanded(false);
            return;
        }

        setIsSearching(true);
        navigate(`/shop?q=${encodeURIComponent(sanitized)}`);
        setMobileExpanded(false);
        
        setTimeout(() => setIsSearching(false), 500);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
        if (e.key === 'Escape') {
            setMobileExpanded(false);
        }
    };

    const clearSearch = () => {
        setQuery('');
        inputRef.current?.focus();
        mobileInputRef.current?.focus();
    };

    return (
        <>
            {/* Desktop: always-visible search bar */}
            <div className="hidden md:flex items-center bg-white rounded-full px-4 py-2 gap-2 w-full max-w-[400px] relative h-10">
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

            {/* Mobile: inline search pill (Shopee/Lazada pattern) */}
            <button
                onClick={() => setMobileExpanded(true)}
                className="md:hidden flex items-center gap-2 bg-white rounded-full px-3 py-1.5 flex-1 min-w-0 border-none cursor-pointer h-9"
                aria-label="Open search"
                type="button"
            >
                <img src={searchIcon} className="w-4 h-4 opacity-40 shrink-0" alt="" />
                <span className="text-gray-400 text-sm truncate text-left">Search products...</span>
            </button>

            {/* Mobile: expanded search overlay */}
            {mobileExpanded && (
                <div className="fixed inset-0 z-[110] md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setMobileExpanded(false)}
                    />
                    {/* Search bar panel */}
                    <div className="absolute top-0 left-0 right-0 bg-primary px-4 py-3 shadow-lg animate-slide-down">
                        <div className="flex items-center bg-white rounded-full px-4 py-2 gap-2 h-10">
                            <input
                                ref={mobileInputRef}
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

                            <button
                                onClick={() => setMobileExpanded(false)}
                                className="text-gray-400 hover:text-gray-600 text-sm p-1 shrink-0"
                                aria-label="Close search"
                                type="button"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}