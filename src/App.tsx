import { Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import Shop from './pages/Shop';
import Navbar from './components/layout/Navbar';
import AboutUs from './pages/AboutUs';
import Subscriptions from './pages/Subscriptions';
import Footer from './components/layout/Footer';
import BecomeASeller from './pages/BecomeASeller';
import CartPage from './pages/CartPage';
import ItemsDetailsPage from './pages/ItemsDetailsPage';
import MessagesPage from './pages/MessagesPage';
import FarmerSignupPage from './pages/FarmerSignupPage';
import LoginPage from './pages/LoginPage';
import ConsumerSignupPage from './pages/ConsumerSignupPage';
import IDVerificationPage from './pages/IDVerificationPage';
import NavbarLoggedInFarmer from './components/layout/NavbarLoggedInFarmer';
import NavbarLoggedInConsumer from './components/layout/NavbarLoggedInConsumer';
import SellModalPage from './pages/SellModalPage';
import MyListingPage from './pages/MyListingPage';
import FarmerOtpPage from './pages/FarmerOtpPage';
import ConsumerOtpPage from './pages/ConsumerOtpPage';
import LoginOtpPage from './pages/LoginOtpPage';
import FarmerAccountPage from './pages/FarmerAccountPage';
import ConsumerAccountPage from './pages/ConsumerAccountPage';
import FarmerAccountSettingPage from './pages/FarmerAccountSetting';
import ConsumerAccountSettingPage from './pages/ConsumerAccountSetting';
import ReviewFarmer from './pages/ReviewFarmer';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import FarmerShopPage from './pages/FarmerShopPage';
//app.tsx
// Pages that should not have footer and should be full viewport height
const FULL_HEIGHT_PAGES = ['/messages'];

function AppLayout() {
    const { isLoggedIn, userProfile } = useAuth();
    const location = useLocation();

    const isFullHeightPage = FULL_HEIGHT_PAGES.includes(location.pathname);
    const isAdminPage = location.pathname.startsWith('/admin');

    const getNavbar = () => {
        if (!isLoggedIn) {
            return <Navbar />;
        }

        if (userProfile?.role === 'farmer') {
            return <NavbarLoggedInFarmer />;
        } else if (userProfile?.role === 'consumer') {
            return <NavbarLoggedInConsumer />;
        }

        return <Navbar />;
    };

    return (
        <div className={`flex flex-col ${isFullHeightPage ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
            {!isAdminPage && getNavbar()}

            {/* Main content area */}
            <div className={`flex-1 flex flex-col ${isFullHeightPage ? 'min-h-0 overflow-hidden' : ''}`}>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/subscriptions" element={<Subscriptions />} />
                    <Route path="/become-a-seller" element={<BecomeASeller />} />
                    {/* CHANGED: Added productId parameter */}
                    <Route path="/item/:productId" element={<ItemsDetailsPage />} />
                    {/* Keep old route for backward compatibility, redirect to new format */}
                    <Route path="/item-details" element={<ItemsDetailsPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/messages" element={<MessagesPage />} />
                    <Route path="/farmer-signup" element={<FarmerSignupPage />} />
                    <Route path="/id-verification" element={<IDVerificationPage />} />
                    <Route path="/otp-verification" element={<FarmerOtpPage />} />
                    <Route path="/consumer-signup" element={<ConsumerSignupPage />} />
                    <Route path="/consumer/otp-verification" element={<ConsumerOtpPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/login/otp-verification" element={<LoginOtpPage />} />
                    <Route path="/sell" element={<SellModalPage />} />
                    <Route path="/AddProduct" element={<SellModalPage />} />
                    <Route path="/my-listings" element={<MyListingPage />} />
                    <Route path="/farmer-account" element={<FarmerAccountPage />} />
                    <Route path="/farmer/:farmerId" element={<FarmerShopPage />} />
                    <Route path="/consumer-account" element={<ConsumerAccountPage />} />
                    <Route path="/farmer-account-setting" element={<FarmerAccountSettingPage />} />
                    <Route path="/consumer-account-setting" element={<ConsumerAccountSettingPage />} />
                    <Route path="/review-farmer" element={<ReviewFarmer />} />
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                </Routes>
            </div>

            {/* Only show footer if not a full-height or admin page */}
            {!isFullHeightPage && !isAdminPage && <Footer />}
        </div>
    );
}

function App() {
    return <AppLayout />;
}

export default App;