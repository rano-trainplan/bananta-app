import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react'; // <-- IMPORT BARU
import Home from './pages/Home';
import Cart from './pages/Cart';
import Tracking from './pages/Tracking';
import Admin from './pages/Admin';
import AdminDashboard from './pages/AdminDashboard'; 
import AdminShipping from './pages/AdminShipping';
import AdminSettings from './pages/AdminSettings';
import AdminSettingsHub from './pages/AdminSettingsHub';
import AdminMenu from './pages/AdminMenu';
import AdminCouriers from './pages/AdminCouriers';
import Courier from './pages/Courier';
import History from './pages/History';
import Profile from './pages/Profile';
import { CartProvider } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';
import { Toaster } from 'react-hot-toast';
import Pos from './pages/Pos';
import AdminReports from './pages/AdminReports'; 
import Reupload from './pages/Reupload';
import AdminSettingsSystem from './pages/AdminSettingsSystem';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

// IMPORT KOMPONEN BARU
import DynamicManifest from './components/DynamicManifest';
import SplashScreen from './components/SplashScreen';

function AppContent() {
  const location = useLocation();
  // Cek apakah lagi di halaman admin
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className={isAdminPage ? "min-h-screen bg-gray-50" : "max-w-md mx-auto bg-white min-h-screen shadow-2xl relative"}>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/tracking/:orderId" element={<Tracking />} />
        <Route path="/reupload/:orderId" element={<Reupload />} />
        <Route path="/history" element={<History />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/kurir" element={<Courier />} />

        {/* PROTECTED ADMIN ROUTES (Wajib Login) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/orders" element={<Admin />} />
          <Route path="/admin/settings" element={<AdminSettingsHub />} />
          <Route path="/admin/settings/payment" element={<AdminSettings />} />
          <Route path="/admin/settings/shipping" element={<AdminShipping />} />
          <Route path="/admin/settings/menu" element={<AdminMenu />} />
          <Route path="/admin/settings/couriers" element={<AdminCouriers />} />
          <Route path="/admin/settings/system" element={<AdminSettingsSystem />} />
          <Route path="/admin/pos" element={<Pos />} />
          <Route path="/admin/reports" element={<AdminReports />} />
        </Route>
      </Routes>
      <Toaster position="bottom-center" />
    </div>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  // Cek apakah user baru pertama kali buka di sesi ini
  useEffect(() => {
    const hasVisited = sessionStorage.getItem('hasVisited');
    if (hasVisited) {
      setShowSplash(false);
    } else {
      sessionStorage.setItem('hasVisited', 'true');
    }
  }, []);

  return (
    <CartProvider>
      <LanguageProvider>
        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
        <BrowserRouter>
          <DynamicManifest />
          <AppContent />
        </BrowserRouter>
      </LanguageProvider>
    </CartProvider>
  );
}

export default App;