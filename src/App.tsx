import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import Shop from './pages/Shop';
import Navbar from './components/layout/Navbar';
import NavbarWithFilter from './components/layout/NavbarWithFilter';
import AboutUs from './pages/AboutUs';
import Subscriptions from './pages/Subscriptions';
import Footer from './components/layout/Footer';
import BecomeASeller from './pages/BecomeASeller';
import CartPage from './pages/CartPage';
import ItemsDetailsPage from './pages/ItemsDetailsPage';
import MessagesPage from './pages/MessagesPage';
import FarmerSignupPage from './pages/FarmerSignupPage';
import LoginPage from './pages/LoginPage';
import OtpPage from './pages/OtpPage';
import NavbarLoggedIn from './components/layout/NavbarLoggedIn';
import ConsumerSignupPage from './pages/ConsumerSignupPage';
import ProfileInfoModal from './pages/ProfileInfoModal';


function AppLayout() {
    const location = useLocation();
    const { isLoggedIn } = useAuth();
    const isShopPage = location.pathname === '/shop';

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
                <Route path="/farmer-signup" element={<FarmerSignupPage />} />
                <Route path="/consumer-signup" element={<ConsumerSignupPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/otp" element={<OtpPage />} />
                <Route path="/profile" element={<ProfileInfoModal />} />
            </Routes>
            <Footer />
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppLayout />
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;