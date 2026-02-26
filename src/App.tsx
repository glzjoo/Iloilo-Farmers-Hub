import { Routes, Route, useLocation } from 'react-router-dom';  // removed BrowserRouter (if need BrowserRouter e balik lng)
import { useAuth } from './context/AuthContext';  // i dont think needed pa ang AuthProvider so i removed it from here, but if needed, just import it again
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
import IDVerificationPage from './pages/IDVerificationPage';
import NavbarLoggedInFarmer from './components/layout/NavbarLoggedInFarmer';
import SellModalPage from './pages/SellModalPage';
import MyListingPage from './pages/MyListingPage';

function AppLayout() {
    const location = useLocation();
    const { isLoggedIn } = useAuth();
    const isShopPage = location.pathname === '/shop';

    const getNavbar = () => {
        //write condition here next time for navbarloggedin if user or famer
        if (isLoggedIn) return <NavbarLoggedInFarmer />;
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
                <Route path="/id-verification" element={<IDVerificationPage />} />
                <Route path="/consumer-signup" element={<ConsumerSignupPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/otp" element={<OtpPage />} />
                <Route path="/profile" element={<ProfileInfoModal />} />
                <Route path="/sell" element={<SellModalPage />} />
                <Route path="/my-listings" element={<MyListingPage />} />
            </Routes>
            <Footer />
        </div>
    );
}

function App() {
    return <AppLayout />;  // just simpliefied wrapper
}

export default App;