import logo from '../../assets/icons/logo.svg';
import savedItemsIcon from '../../assets/icons/saved-items.png';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SearchBar from '../Search/SearchBar';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
    const location = useLocation();
    const { t } = useTranslation();
    const linkClass = (path: string) =>
        `no-underline text-sm font-semibold transition-colors ${location.pathname === path ? 'text-primary' : 'text-gray-700 hover:text-green-700'
        }`;
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

                    <div className="flex items-center gap-2 shrink-0">
                        <button className="bg-transparent border-none cursor-pointer p-1">
                            <Link to="/cart" className="flex items-center gap-2 p-1 no-underline">
                                <img src={savedItemsIcon} className="w-6 h-6 brightness-0 invert" />
                            </Link>
                        </button>
                        <Link to="/consumer-signup" className="no-underline">
                            <span className="text-white text-base font-medium ml-1">Sign Up</span>
                        </Link>
                        <span className="text-white text-base font-medium">|</span>
                        <Link to="/login" className="no-underline">
                            <span className="text-white text-base font-medium">{t('login')}</span>
                        </Link>
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
