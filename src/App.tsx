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
import ProtectedRoute from './components/auth/ProtectedRoute';
import GuestRoute from './components/auth/GuestRoute';
import AdminRoute from './components/auth/AdminRoute';
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
                    {/* ── Public Routes ── */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/subscriptions" element={<Subscriptions />} />
                    <Route path="/become-a-seller" element={<BecomeASeller />} />
                    <Route path="/item/:productId" element={<ItemsDetailsPage />} />
                    <Route path="/item-details" element={<ItemsDetailsPage />} />
                    <Route path="/farmer/:farmerId" element={<FarmerShopPage />} />

                    {/* ── Guest-Only Routes (redirect if already logged in) ── */}
                    <Route path="/farmer-signup" element={<GuestRoute><FarmerSignupPage /></GuestRoute>} />
                    <Route path="/id-verification" element={<GuestRoute><IDVerificationPage /></GuestRoute>} />
                    <Route path="/otp-verification" element={<GuestRoute><FarmerOtpPage /></GuestRoute>} />
                    <Route path="/consumer-signup" element={<GuestRoute><ConsumerSignupPage /></GuestRoute>} />
                    <Route path="/consumer/otp-verification" element={<GuestRoute><ConsumerOtpPage /></GuestRoute>} />
                    <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
                    <Route path="/login/otp-verification" element={<GuestRoute><LoginOtpPage /></GuestRoute>} />

                    {/* ── Authenticated Routes (any logged-in user) ── */}
                    <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
                    <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
                    <Route path="/review-farmer" element={<ProtectedRoute><ReviewFarmer /></ProtectedRoute>} />

                    {/* ── Farmer-Only Routes ── */}
                    <Route path="/sell" element={<ProtectedRoute allowedRoles={['farmer']}><SellModalPage /></ProtectedRoute>} />
                    <Route path="/AddProduct" element={<ProtectedRoute allowedRoles={['farmer']}><SellModalPage /></ProtectedRoute>} />
                    <Route path="/my-listings" element={<ProtectedRoute allowedRoles={['farmer']}><MyListingPage /></ProtectedRoute>} />
                    <Route path="/farmer-account" element={<ProtectedRoute allowedRoles={['farmer']}><FarmerAccountPage /></ProtectedRoute>} />
                    <Route path="/farmer-account-setting" element={<ProtectedRoute allowedRoles={['farmer']}><FarmerAccountSettingPage /></ProtectedRoute>} />

                    {/* ── Consumer-Only Routes ── */}
                    <Route path="/consumer-account" element={<ProtectedRoute allowedRoles={['consumer']}><ConsumerAccountPage /></ProtectedRoute>} />
                    <Route path="/consumer-account-setting" element={<ProtectedRoute allowedRoles={['consumer']}><ConsumerAccountSettingPage /></ProtectedRoute>} />

                    {/* ── Admin Routes ── */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
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