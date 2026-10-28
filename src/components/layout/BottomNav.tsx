import { Home, Receipt, ShoppingCart, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext'; // <-- IMPORT BARU

export default function BottomNav() {
  const location = useLocation();
  const path = location.pathname;
  const { cartCount } = useCart();
  const { t } = useLanguage(); // <-- PANGGIL HOOK

  const navItems = [
    { icon: Home, label: t('nav_home'), path: '/' },
    { icon: Receipt, label: t('nav_history'), path: '/history' },
    { icon: ShoppingCart, label: t('nav_cart'), path: '/cart' },
    { icon: User, label: t('nav_profile'), path: '/profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 flex justify-around py-3 px-2 z-50 rounded-t-2xl shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = path === item.path;
        const Icon = item.icon;
        return (
          <Link key={item.label} to={item.path} className={`flex flex-col items-center gap-1 relative ${isActive ? 'text-brand-500' : 'text-gray-400'}`}>
            
            <div className="relative">
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              
              {item.path === '/cart' && cartCount > 0 && (
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