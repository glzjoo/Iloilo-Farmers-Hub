import logo from '../../assets/icons/Logo.svg';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import messagesIcon from '../../assets/icons/messages.svg';
import accountSettingsIcon from '../../assets/icons/account-settings.svg';
import logOutIcon from '../../assets/icons/log-out.svg';
import { useAuth } from '../../context/AuthContext';
import SearchBar from '../Search/SearchBar';
import mylisting from '../../assets/icons/mylisting.svg';
import settingIcon from '../../assets/icons/settings.svg';
import LanguageSwitcher from './LanguageSwitcher';


export default function NavbarLoggedInFarmer() {
    const [showDropdown, setShowDropdown] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, userProfile, logout, loading } = useAuth();
    const { t } = useTranslation();

    const linkClass = (path: string) =>
        `no-underline text-sm font-semibold transition-colors ${location.pathname === path ? 'text-primary' : 'text-gray-700 hover:text-green-700'}`;

    // Get display data from userProfile
    const displayName = userProfile
        ? `${userProfile.firstName} ${userProfile.lastName}`
        : user?.displayName || 'Loading...';

    // Show real email if provided, otherwise show phone number (always available)
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
        <header className="w-full sticky top-0 z-50">
            <nav className="bg-primary w-full">
                <div className="max-w-7xl mx-auto flex justify-end px-6 pt-2">
                    <LanguageSwitcher />
                </div>

                <div className="max-w-7xl mx-auto flex items-center justify-between px-6 pb-4 pt-1 gap-4">
                    <Link to="/" className="flex items-center gap-2 text-white no-underline shrink-0">
                        <img src={logo} className="h-8 w-auto" />
                    </Link>

                    <SearchBar />

                    <div className="flex items-center gap-3 shrink-0">
                        <Link to="/sell">
                            <button className="bg-secondary text-white font-bold rounded-md cursor-pointer px-4 py-1">
                                {t('sell')}
                            </button>
                        </Link>

                        {/* Profile button*/}
                        <div className="relative">
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="flex items-center gap-2 bg-transparent border-none cursor-pointer text-white"
                            >
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

                                    {/* Dropdown items */}
                                    <div className="py-2">
                                        <Link to="/farmer-account" className="flex items-center gap-4 w-full px-5 py-3.5 no-underline hover:bg-gray-50 text-left">
                                            <img src={accountSettingsIcon} className="w-7 h-7" />
                                            <div>
                                                <p className="text-base font-bold text-black">{t('my_account')}</p>

                                                {/* show email here */}
                                                <p className="text-xs text-gray-400">bea4@gmail.com</p>
                                            </div>
                                        </Link>
                                        <Link to="/my-listings" className="flex items-center gap-4 w-full px-5 py-3.5 no-underline hover:bg-gray-50 text-left">
                                            <img src={mylisting} className="w-7 h-7" />
                                            <div>
                                                <p className="text-base font-bold text-black">{t('my_listing')}</p>
                                                <p className="text-xs text-gray-400">{t('my_listing_desc')}</p>
                                            </div>
                                        </Link>
                                        <Link to="/messages" className="flex items-center gap-4 w-full px-5 py-3.5 no-underline hover:bg-gray-50 text-left">
                                            <img src={messagesIcon} className="w-7 h-7" />
                                            <div>
                                                <p className="text-base font-bold text-black">{t('messages')}</p>
                                                {/* show number of unread messages here */}
                                                <p className="text-xs text-gray-400">{t('no_unread')}</p>
                                            </div>
                                        </Link>
                                        <Link to="/farmer-account-setting" className="flex items-center gap-4 w-full px-5 py-3.5 no-underline hover:bg-gray-50 text-left">
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
                </div>
            </nav>

            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto relative flex items-center justify-center gap-10 px-6 py-3">
                    <Link to="/" className={linkClass('/')}>{t('nav_home')}</Link>
                    <Link to="/shop" className={linkClass('/shop')}>{t('nav_shop')}</Link>
                    <Link to="/subscriptions" className={linkClass('/subscriptions')}>{t('nav_subscriptions')}</Link>
                    <Link to="/become-a-seller" className={linkClass('/become-a-seller')}>{t('nav_become_seller')}</Link>
                    <Link to="/about" className={linkClass('/about')}>{t('nav_about')}</Link>
                </div>
            </div>
        </header>
    );
}