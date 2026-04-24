import logo from '../../assets/icons/logo.svg';
import savedItemsIcon from '../../assets/icons/saved-items.png';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SearchBar from '../Search/SearchBar';
import LanguageSwitcher from './LanguageSwitcher';
import logoOnly from '../../assets/icons/LogoOnly.svg';

export default function Navbar() {
    const location = useLocation();
    const { t } = useTranslation();
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Close drawer on route change
    useEffect(() => {
        setDrawerOpen(false);
    }, [location.pathname]);

    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (drawerOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [drawerOpen]);

    const linkClass = (path: string) =>
        `no-underline text-sm font-semibold transition-colors ${location.pathname === path ? 'text-primary' : 'text-gray-700 hover:text-green-700'
        }`;

    const drawerLinkClass = (path: string) =>
        `block w-full px-6 py-3 no-underline text-base font-semibold transition-colors ${location.pathname === path ? 'text-primary bg-green-50' : 'text-gray-700 hover:bg-gray-50'
        }`;

    return (
        <>
            <header className="w-full sticky top-0 z-50">
                <nav className="bg-primary w-full">
                    <div className="max-w-7xl mx-auto flex justify-end px-4 sm:px-6 pt-2">
                        <LanguageSwitcher />
                    </div>
                    <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 pb-3 sm:pb-4 pt-1 gap-2 sm:gap-3">

                        {/*Mobile Left */}
                        <div className="flex md:hidden items-center shrink-0">
                            {location.pathname === '/shop' ? (
                                <button onClick={() => window.history.back()} className="bg-transparent border-none cursor-pointer p-1 -ml-2 text-white hover:bg-white/10 rounded-full transition">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                            ) : (
                                <Link to="/" className="flex items-center gap-2 text-white no-underline">
                                    <img src={logoOnly} className="h-8 w-auto" alt="Iloilo Farmers Hub" />
                                </Link>
                            )}
                        </div>

                        {/* Logo */}
                        <Link to="/" className="hidden md:flex items-center gap-2 text-white no-underline shrink-0">
                            <img src={logo} className="h-8 w-auto" alt="Iloilo Farmers Hub" />
                        </Link>

                        {/* Center: Search Bar */}

                        <SearchBar />


                        {/* 4. Desktop actions */}
                        <div className="hidden md:flex items-center gap-2 shrink-0">
                            <button className="bg-transparent border-none cursor-pointer p-1">
                                <Link to="/cart" className="flex items-center gap-2 p-1 no-underline hover:bg-white/10 rounded-full transition">
                                    <img src={savedItemsIcon} className="w-6 h-6 brightness-0 invert" />
                                </Link>
                            </button>
                            <Link to="/consumer-signup" className="no-underline ml-1">
                                <span className="text-white text-base font-medium">Sign Up</span>
                            </Link>
                            <span className="text-white text-base font-medium mx-1">|</span>
                            <Link to="/login" className="no-underline">
                                <span className="text-white text-base font-medium">{t('login')}</span>
                            </Link>
                        </div>

                        {/* Mobile Filter */}
                        <div className="flex md:hidden items-center gap-2 shrink-0">
                            {location.pathname === '/shop' ? (
                                <button
                                    onClick={() => window.dispatchEvent(new Event('openMobileFilter'))}
                                    className="flex items-center justify-center bg-transparent border-none cursor-pointer p-1 text-white hover:bg-white/10 rounded-full transition"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                </button>
                            ) : (
                                // Standard Navigation
                                <>
                                    <Link to="/cart" className="flex items-center p-1 no-underline hover:bg-white/10 rounded-full transition">
                                        <img src={savedItemsIcon} className="w-6 h-6 brightness-0 invert" />
                                    </Link>
                                    <button
                                        onClick={() => setDrawerOpen(true)}
                                        className="bg-transparent border-none cursor-pointer p-1 text-white hover:bg-white/10 rounded-full transition"
                                        aria-label="Open menu"
                                    >
                                        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Desktop nav links */}
                <div className="hidden md:block bg-white border-b border-gray-200 shadow-sm">
                    <div className="max-w-7xl mx-auto relative flex items-center justify-center gap-10 px-6 py-3">
                        <Link to="/" className={linkClass('/')}>{t('nav_home')}</Link>
                        <Link to="/shop" className={linkClass('/shop')}>{t('nav_shop')}</Link>
                        <Link to="/subscriptions" className={linkClass('/subscriptions')}>{t('nav_subscriptions')}</Link>
                        <Link to="/become-a-seller" className={linkClass('/become-a-seller')}>{t('nav_become_seller')}</Link>
                        <Link to="/about" className={linkClass('/about')}>{t('nav_about')}</Link>
                    </div>
                </div>
            </header>

            {/* Mobile slide-out drawer */}
            {drawerOpen && (
                <div className="fixed inset-0 z-[100] md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 transition-opacity"
                        onClick={() => setDrawerOpen(false)}
                    />
                    {/* Drawer panel */}
                    <div className="absolute top-0 right-0 h-full w-72 bg-white shadow-2xl flex flex-col animate-slide-in-right">
                        {/* Drawer header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <span className="text-lg font-bold text-gray-900">Menu</span>
                            <button
                                onClick={() => setDrawerOpen(false)}
                                className="bg-transparent border-none cursor-pointer p-1 text-gray-500 hover:text-gray-700"
                                aria-label="Close menu"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Nav links */}
                        <div className="flex-1 overflow-y-auto py-2">
                            <Link to="/" className={drawerLinkClass('/')}>{t('nav_home')}</Link>
                            <Link to="/shop" className={drawerLinkClass('/shop')}>{t('nav_shop')}</Link>
                            <Link to="/subscriptions" className={drawerLinkClass('/subscriptions')}>{t('nav_subscriptions')}</Link>
                            <Link to="/become-a-seller" className={drawerLinkClass('/become-a-seller')}>{t('nav_become_seller')}</Link>
                            <Link to="/about" className={drawerLinkClass('/about')}>{t('nav_about')}</Link>

                            <div className="border-t border-gray-100 my-2" />

                            <Link to="/consumer-signup" className={drawerLinkClass('/consumer-signup')}>Sign Up</Link>
                            <Link to="/login" className={drawerLinkClass('/login')}>{t('login')}</Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}