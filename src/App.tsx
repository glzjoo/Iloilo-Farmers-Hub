import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Shop from './pages/Shop';
import Navbar from './components/Navbar';
import NavbarWithFilter from './components/NavbarWithFilter';
import AboutUs from './pages/AboutUs';
import Subscriptions from './pages/Subscriptions';
import Footer from './components/Footer';
import BecomeASeller from './pages/BecomeASeller';
import Discounts from './pages/Discounts';
import CartPage from './pages/CartPage';
import ItemsDetailsPage from './pages/ItemsDetailsPage';

function AppLayout() {
    const location = useLocation();
    const isShopPage = location.pathname === '/shop';

    return (
        <div className="flex flex-col min-h-screen">
            {isShopPage ? <NavbarWithFilter /> : <Navbar />}
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/subscriptions" element={<Subscriptions />} />
                <Route path="/become-a-seller" element={<BecomeASeller />} />
                <Route path="/discounts" element={<Discounts />} />
                <Route path="/item-details" element={<ItemsDetailsPage />} />
                <Route path="/cart" element={<CartPage />} />
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