import logo from '../../assets/icons/logo.png';
import searchIcon from '../../assets/icons/search.svg';
import cartIcon from '../../assets/icons/shopping-cart.svg';
import accountIcon from '../../assets/icons/account-icon.svg';
import languageIcon from '../../assets/icons/language-logo.svg';
import { Link, useLocation } from 'react-router-dom';


export default function Navbar() {
    const location = useLocation();
    const linkClass = (path: string) =>
        `no-underline text-sm font-semibold transition-colors ${location.pathname === path ? 'text-primary' : 'text-gray-700 hover:text-green-700'
        }`;
    return (
        <header className="w-full sticky top-0 z-50">
            <nav className="bg-primary w-full">
                <div className="max-w-7xl mx-auto flex justify-end px-6 pt-2">
                    <button className="flex items-center gap-1 bg-transparent border-none cursor-pointer text-white">
                        <img src={languageIcon} className="w-5 h-5 brightness-0 invert" />
                        <span className="text-xs font-medium">English</span>
                        <span className="text-xs">▾</span>
                    </button>
                </div>

                <div className="max-w-7xl mx-auto flex items-center justify-between px-6 pb-4 pt-1 gap-4">
                    <Link to="/" className="flex items-center gap-2 text-white no-underline shrink-0">
                        <img src={logo} className="w-11 h-11 rounded-full object-cover" />
                        <span className="font-primary font-bold text-lg tracking-wide whitespace-nowrap">ILOILO FARMERS HUB</span>
                    </Link>

                    <div className="flex items-center bg-white rounded-full px-4 py-1.5 gap-2 flex-1 max-w-md">
                        <input
                            type="text"
                            placeholder="Search"
                            className="border-none outline-none bg-transparent text-sm w-full text-gray-700"
                        />
                        <img src={searchIcon} className="w-5 h-5 opacity-50" />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button className="bg-transparent border-none cursor-pointer p-1">
                            <Link to="/farmer-signup" className="flex items-center gap-2 p-1 no-underline">
                                <img src={cartIcon} className="w-8 h-8 brightness-0 invert" />
                            </Link>
                        </button>

                        <img src={accountIcon} className="w-8 h-8 brightness-0 invert" />
                        <Link to="/farmer-signup" className="no-underline">
                            <span className="text-white text-base font-medium ml-1">Sign Up</span>
                        </Link>
                        <span className="text-white text-base font-medium">|</span>
                        <Link to="/login" className="no-underline">
                            <span className="text-white text-base font-medium">Login</span>
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-center gap-10 px-6 py-3">
                    <Link to="/" className={linkClass('/')}>HOME</Link>
                    <Link to="/shop" className={linkClass('/shop')}>SHOP</Link>
                    <Link to="/subscriptions" className={linkClass('/subscriptions')}>SUBSCRIPTIONS</Link>
                    <Link to="/become-a-seller" className={linkClass('/become-a-seller')}>BECOME A SELLER</Link>
                    <Link to="/about" className={linkClass('/about')}>ABOUT US</Link>
                </div>
            </div>
        </header>
    );
}
