import { Home, Receipt, ShoppingCart, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext'; // Import useCart

export default function BottomNav() {
  const location = useLocation();
  const path = location.pathname;
  const { cartCount } = useCart(); // Ambil jumlah barang dari keranjang

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Receipt, label: 'Pesanan', path: '/history' },
    { icon: ShoppingCart, label: 'Keranjang', path: '/cart' },
    { icon: User, label: 'Akun', path: '/profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 flex justify-around py-3 px-2 z-50 rounded-t-2xl shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = path === item.path;
        const Icon = item.icon;
        return (
          <Link key={item.label} to={item.path} className={`flex flex-col items-center gap-1 relative ${isActive ? 'text-brand-500' : 'text-gray-400'}`}>
            
            {/* Ikon dengan Badge (Kalau Keranjang) */}
            <div className="relative">
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              
              {/* TAMBAHAN BADGE ANGKA */}
              {item.label === 'Keranjang' && cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>

            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}