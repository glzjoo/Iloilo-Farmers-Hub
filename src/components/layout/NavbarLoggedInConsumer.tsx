import logo from '../../assets/icons/Logo.svg';
import logoOnly from '../../assets/icons/LogoOnly.svg';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import messagesIcon from '../../assets/icons/messages.svg';
import logOutIcon from '../../assets/icons/log-out.svg';
import cartIcon from '../../assets/icons/saved-items.png';
import { useAuth } from '../../context/AuthContext';
import SearchBar from '../Search/SearchBar';
import settingIcon from '../../assets/icons/settings.svg';
import LanguageSwitcher from './LanguageSwitcher';


export default function NavbarLoggedInConsumer() {
    const [showDropdown, setShowDropdown] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, userProfile, logout, loading } = useAuth();
    const { t } = useTranslation();
    const [open, setOpen] = useState(false)


    // Close drawer on route change
    useEffect(() => {
        setDrawerOpen(false);
        setShowDropdown(false);
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
        `no-underline text-sm font-semibold transition-colors ${location.pathname === path ? 'text-primary' : 'text-gray-700 hover:text-green-700'}`;

    const drawerLinkClass = (path: string) =>
        `block w-full px-6 py-3 no-underline text-base font-semibold transition-colors ${location.pathname === path ? 'text-primary bg-green-50' : 'text-gray-700 hover:bg-gray-50'
        }`;

    const displayName = userProfile
        ? `${userProfile.firstName} ${userProfile.lastName}`
        : user?.displayName || 'Loading...';

    const contactInfo = userProfile?.email || userProfile?.phoneNo || '';

    const initial = userProfile?.firstName?.charAt(0).toUpperCase()
        || user?.displayName?.charAt(0).toUpperCase()
        || '?';

    const photoUrl = userProfile?.profileImage;

    if (loading) {
        return (
            <header className="w-full sticky top-0 z-50">
                <nav className="bg-primary w-full h-20 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </nav>
            </header>
        );
    }

    return (
        <>
            <header className={`w-full sticky top-0 z-50 ${location.pathname === '/messages' ? 'hidden md:block' : ''}`}>
                <nav className="bg-primary w-full">
                    {/* Top Bar: Language Switcher */}
                    <div className="max-w-7xl mx-auto flex justify-end px-4 sm:px-6 pt-2">
                        <LanguageSwitcher />
                    </div>

                    {/* Middle Bar: Navigation & Search */}
                    <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 pb-3 sm:pb-4 pt-1 gap-2 sm:gap-3">

                        {/* Mobile Left: Back Arrow  */}
                        <div className="flex md:hidden items-center shrink-0">
                            {location.pathname === '/shop' ? (
                                <button onClick={() => navigate(-1)} className="bg-transparent border-none cursor-pointer p-1 -ml-2 text-white hover:bg-white/10 rounded-full transition">
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

                        {/*Desktop Left: Full Logo */}
                        <Link to="/" className="hidden md:flex items-center gap-2 text-white no-underline shrink-0">
                            <img src={logo} className="h-8 w-auto" alt="Iloilo Farmers Hub" />
                        </Link>

                        <SearchBar />


                        {/* Desktop actions */}
                        <div className="hidden md:flex items-center gap-3 shrink-0">
                            <Link to="/cart">
                                <button className="bg-transparent border-none cursor-pointer p-1 hover:bg-white/10 rounded-full transition">
                                    <img src={cartIcon} className="w-6 h-6 brightness-0 invert" />
                                </button>
                            </Link>

                            {/* Profile button */}
                            <div className="relative">
                                <button
                                    onClick={() => { setShowDropdown(!showDropdown); setOpen(!open) }}
                                    className="flex items-center gap-1 bg-transparent border-none cursor-pointer text-white">
                                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center overflow-hidden">
                                        {photoUrl ? (
                                            <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-primary font-bold text-sm">{initial}</span>
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-semibold text-white leading-tight">
                                            {displayName}
                                        </p>
                                        <p className="text-xs text-green-200 leading-tight">{contactInfo}</p>
                                    </div>
                                    <span className="text-white text-xs">▾</span>
                                </button>

                                {/* Dropdown menu */}
                                {showDropdown && (
                                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg overflow-hidden z-50">
                                        <div className="bg-primary p-4 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                {photoUrl ? (
                                                    <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-primary font-bold">{initial}</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-white font-semibold text-sm">{displayName}</p>
                                                <p className="text-green-200 text-xs">{contactInfo}</p>
                                            </div>
                                        </div>

                                        <div className="py-2">
                                            <Link to="/messages" className="flex items-center gap-4 w-full px-5 py-3.5 no-underline hover:bg-gray-50 text-left">
                                                <img src={messagesIcon} className="w-7 h-7" />
                                                <div>
                                                    <p className="text-base font-bold text-black">{t('messages')}</p>
                                                    <p className="text-xs text-gray-400">{t('no_unread')}</p>
                                                </div>
                                            </Link>
                                            <Link to="/consumer-account-setting" className="flex items-center gap-4 w-full px-5 py-3.5 no-underline hover:bg-gray-50 text-left">
                                                <img src={settingIcon} className="w-7 h-7" />
                                                <div>
                                                    <p className="text-base font-bold text-black">{t('settings')}</p>
                                                </div>
                                            </Link>

                                            <button
                                                onClick={() => { logout(); navigate('/'); setShowDropdown(false); }}
                                                className="flex items-center gap-4 w-full px-5 py-3.5 bg-transparent border-none cursor-pointer hover:bg-gray-50 text-left"
                                            >
                                                <img src={logOutIcon} className="w-7 h-7" />
                                                <div>
                                                    <p className="text-base font-bold text-red-500">{t('log_out')}</p>
                                                    <p className="text-xs text-red-400">{t('log_out_desc')}</p>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/*Filter (on Shop) */}
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
                                        <img src={cartIcon} className="w-6 h-6 brightness-0 invert" />
                                    </Link>
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden">
                                        {photoUrl ? (
                                            <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-primary font-bold text-xs">{initial}</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setDrawerOpen(true)}
                                        className="bg-transparent border-none cursor-pointer p-1 text-white hover:bg-white/10 rounded-full transition"
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

                {/* consumer navigation links */}
                <div className="hidden md:block bg-white border-b border-gray-200 shadow-sm">
                    <div className="max-w-7xl mx-auto relative flex items-center justify-center gap-10 px-6 py-3">
                        <Link to="/" className={linkClass('/')}>{t('nav_home')}</Link>
                        <Link to="/shop" className={linkClass('/shop')}>{t('nav_shop')}</Link>
                        <Link to="/subscriptions" className={linkClass('/subscriptions')}>{t('nav_subscriptions')}</Link>
                        <Link to="/become-a-seller" className={linkClass('/become-a-seller')}>{t('nav_become_seller')}</Link>
                        <Link to="/about" className={linkClass('/about')}>{t('nav_about')}</Link>
                    </div>
                </div>
            </header >

            {/* Mobile slide-out drawer */}
            {
                drawerOpen && (
                    <div className="fixed inset-0 z-[100] md:hidden">
                        <div
                            className="absolute inset-0 bg-black/50 transition-opacity"
                            onClick={() => setDrawerOpen(false)}
                        />
                        <div className="absolute top-0 right-0 h-full w-72 bg-white shadow-2xl flex flex-col animate-slide-in-right">
                            {/* Profile header */}
                            <div className="bg-primary p-5 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    {photoUrl ? (
                                        <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-primary font-bold">{initial}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-semibold text-sm truncate">{displayName}</p>
                                    <p className="text-green-200 text-xs truncate">{contactInfo}</p>
                                </div>
                                <button
                                    onClick={() => setDrawerOpen(false)}
                                    className="bg-transparent border-none cursor-pointer p-1 text-white/80 hover:text-white"
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

                                <Link to="/messages" className={drawerLinkClass('/messages')}>
                                    <span className="flex items-center gap-3">
                                        <img src={messagesIcon} className="w-5 h-5" />
                                        {t('messages')}
                                    </span>
                                </Link>
                                <Link to="/consumer-account-setting" className={drawerLinkClass('/consumer-account-setting')}>
                                    <span className="flex items-center gap-3">
                                        <img src={settingIcon} className="w-5 h-5" />
                                        {t('settings')}
                                    </span>
                                </Link>

                                <div className="border-t border-gray-100 my-2" />

                                <button
                                    onClick={() => { logout(); navigate('/'); setDrawerOpen(false); }}
                                    className="flex items-center gap-3 w-full px-6 py-3 bg-transparent border-none cursor-pointer text-red-500 font-semibold text-base hover:bg-red-50"
                                >
                                    <img src={logOutIcon} className="w-5 h-5" />
                                    {t('log_out')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
}
