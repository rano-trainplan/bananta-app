import { Link } from 'react-router-dom';
import { CreditCard, Truck, UtensilsCrossed, ChevronRight, Settings, Bike, Store } from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';

export default function AdminSettingsHub() {
  const menus = [
    { 
      title: 'Rekening & QRIS', 
      desc: 'Atur nomor rekening bank dan upload barcode QRIS', 
      icon: CreditCard, 
      path: '/admin/settings/payment',
      color: 'bg-blue-50 text-blue-600',
      badge: 'Keuangan'
    },
    { 
      title: 'Tarif Ongkir Kurir', 
      desc: 'Kelola daftar daerah dan harga ongkos kirim', 
      icon: Truck, 
      path: '/admin/settings/shipping',
      color: 'bg-orange-50 text-orange-600',
      badge: 'Logistik'
    },
    { 
      title: 'Pengelolaan Menu', 
      desc: 'Tambah, edit, atau hapus menu makanan & minuman', 
      icon: UtensilsCrossed, 
      path: '/admin/settings/menu',
      color: 'bg-green-50 text-green-600',
      badge: 'Produk'
    },
    { 
      title: 'Manajemen Kurir', 
      desc: 'Kelola data pengantar yang terdaftar', 
      icon: Bike, 
      path: '/admin/settings/couriers',
      color: 'bg-purple-50 text-purple-600',
      badge: 'SDM'
    },
        { 
      title: 'Pengaturan Sistem', 
      desc: 'Atur logo, nama usaha, alamat, dan jam operasional', 
      icon: Store, // Pastikan import { Store } from 'lucide-react' di atas
      path: '/admin/settings/system',
      color: 'bg-orange-50 text-orange-600',
      badge: 'Utama'
    },
  ];

  return (
    <AdminLayout>
      {/* HEADER YANG UDAH DIBENERIN */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 flex items-center gap-4">
        <div className="bg-brand-50 p-3 rounded-xl text-brand-500">
          <Settings size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pengaturan Toko</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola semua konfigurasi bisnis Anda di satu tempat.</p>
        </div>
      </div>

      {/* LIST MENU */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl">
        {menus.map((menu) => {
          const Icon = menu.icon;
          return (
            <Link 
              key={menu.title} 
              to={menu.path} 
              className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
            >
              <span className="absolute top-4 right-4 bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-md tracking-wider uppercase">
                {menu.badge}
              </span>

              <div className="flex flex-col gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${menu.color} transition-transform group-hover:scale-110`}>
                  <Icon size={28} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800 group-hover:text-brand-500 transition-colors">{menu.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{menu.desc}</p>
                </div>
                <div className="flex items-center text-brand-500 font-bold text-sm mt-2">
                  Buka Pengaturan <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </AdminLayout>
  );
}