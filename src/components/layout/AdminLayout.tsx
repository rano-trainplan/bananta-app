import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard, Store, Bike, LogOut, ArrowLeft, ClipboardList, ShoppingCart, BarChart3, } from 'lucide-react';
import { supabase } from '../../lib/supabase'; // <--- TAMBAHIN INI

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // URUTAN MENU BARU
  const menuItems = [
    { label: 'Kasir (POS)', path: '/admin/pos', icon: ShoppingCart },
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
     { label: 'Laporan', path: '/admin/reports', icon: BarChart3 }, // <-- TAMBAHAN BARU
    { label: 'Pesanan', path: '/admin/orders', icon: ClipboardList },
    { label: 'Manajemen Kurir', path: '/admin/settings/couriers', icon: Bike },
    { label: 'Pengaturan Toko', path: '/admin/settings', icon: Store }, 
  ];

  const isSettingsPage = location.pathname.startsWith('/admin/settings');
  const isSubSettingsPage = location.pathname.startsWith('/admin/settings/') && location.pathname !== '/admin/settings';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* OVERLAY */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:shadow-none md:border-r md:border-gray-200
      `}>
        <div className="p-5 border-b flex justify-between items-center">
          <h2 className="font-bold text-lg text-brand-500">Admin Panel</h2>
          <button onClick={() => setIsOpen(false)} className="md:hidden p-1 bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            // Cek aktif: Dashboard aktif kalau path /admin aja. Pengaturan aktif kalau /admin/settings
            const isActive = 
              item.path === '/admin' ? location.pathname === '/admin' :
              item.path === '/admin/settings' ? isSettingsPage :
              location.pathname === item.path;
            
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 p-3 rounded-lg font-semibold transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-500' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t">
          <button 
            onClick={async () => {
              if(confirm('Yakin mau logout dari Admin Panel?')) {
                await supabase.auth.signOut();
                navigate('/login');
              }
            }} 
            className="flex items-center gap-3 p-3 w-full text-red-500 font-semibold rounded-lg hover:bg-red-50"
          >
            <LogOut size={20} /> Logout Admin
          </button>
        </div>
      </aside>

      {/* KONTEN UTAMA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden md:ml-64">
        <header className="bg-white p-4 shadow-sm flex items-center gap-4 md:hidden">
          {isSubSettingsPage ? (
            <button onClick={() => navigate('/admin/settings')} className="p-2 bg-gray-100 rounded-lg">
              <ArrowLeft size={24} />
            </button>
          ) : (
            <button onClick={() => setIsOpen(true)} className="p-2 bg-gray-100 rounded-lg">
              <Menu size={24} />
            </button>
          )}
          
          <h1 className="font-bold text-lg">
            {isSubSettingsPage ? 'Kembali' : 'Admin'}
          </h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
}