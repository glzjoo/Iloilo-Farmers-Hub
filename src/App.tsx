import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Shop from './pages/Shop';
import Navbar from './components/Navbar';
import NavbarWithFilter from './components/NavbarWithFilter';
import AboutUs from './pages/AboutUs';
import Subscriptions from './pages/Subscriptions';
import Footer from './components/Footer';
import BecomeASeller from './pages/BecomeASeller';
import CartPage from './pages/CartPage';
import ItemsDetailsPage from './pages/ItemsDetailsPage';
import MessagesPage from './pages/MessagesPage';
import NavbarLoggedIn from './components/NavbarLoggedIn';

// Pages that use the logged-in navbar
const loggedInPages = ['/item-details', '/cart', '/messages', '/account-setting'];

function AppLayout() {
    const location = useLocation();
    const isShopPage = location.pathname === '/shop';
    const isLoggedIn = loggedInPages.includes(location.pathname);

    const getNavbar = () => {
        if (isLoggedIn) return <NavbarLoggedIn />;
        if (isShopPage) return <NavbarWithFilter />;
        return <Navbar />;
    };

    return (
        <div className="flex flex-col min-h-screen">
            {getNavbar()}
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/subscriptions" element={<Subscriptions />} />
                <Route path="/become-a-seller" element={<BecomeASeller />} />
                <Route path="/item-details" element={<ItemsDetailsPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/messages" element={<MessagesPage />} />
            </Routes>
            <Footer />
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AppLayout />
        </BrowserRouter>
    );
}

export default App;