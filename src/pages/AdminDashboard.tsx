import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/layout/AdminLayout';
import { TrendingUp, Users, ShoppingBag, Store, Banknote, ArrowRight, Clock, CheckCircle, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Link } from 'react-router-dom'; // IMPORT LINK

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [stats, setStats] = useState({ onlineRev: 0, offlineRev: 0, onlineOrd: 0, offlineOrd: 0, totalItems: 0 });

  // STATE UNTUK FILTER TANGGAL (Default: Hari Ini)
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // Query dinamis berdasarkan startDate & endDate
      const { data: rangeOrders } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('status', 'Selesai')
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .order('created_at', { ascending: false });

      if (rangeOrders) {
        setOrders(rangeOrders.slice(0, 5)); // 5 transaksi terakhir

        let oRev = 0, fRev = 0, oOrd = 0, fOrd = 0, items = 0;
        const prodSales: Record<string, number> = {};

        rangeOrders.forEach(o => {
          if (o.order_type === 'Offline') { fRev += o.total_price; fOrd++; }
          else { oRev += o.total_price; oOrd++; }
          
          if (o.order_items) {
            o.order_items.forEach((item: any) => {
              items += item.quantity;
              prodSales[item.product_name] = (prodSales[item.product_name] || 0) + item.quantity;
            });
          }
        });

        setStats({ onlineRev: oRev, offlineRev: fRev, onlineOrd: oOrd, offlineOrd: fOrd, totalItems: items });
        
        const top = Object.entries(prodSales).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, qty]) => ({ name, qty }));
        setTopProducts(top);
      }
      setLoading(false);
    }
    fetchData();
  }, [startDate, endDate]); // Fetch ulang kalau tanggal berubah

  // Dummy data buat grafik jam
  const hourlyData = [
    { time: '10:00', online: 3, offline: 5 },
    { time: '12:00', online: 6, offline: 8 },
    { time: '14:00', online: 4, offline: 7 },
    { time: '16:00', online: 8, offline: 3 },
    { time: '18:00', online: 5, offline: 9 },
    { time: '20:00', online: 7, offline: 6 },
  ];

  // Format tanggal untuk tampilan sub-header
  const formatDateIndo = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'});
  };

  if (loading) return <AdminLayout><div className="p-10 text-center text-gray-500 font-bold">Memuat dashboard...</div></AdminLayout>;

  return (
    <AdminLayout>
      {/* HEADER & FILTER SECTION */}
      <div className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-gray-200 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Live Analytics Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ringkasan performa finansial Bananta Sultan <span className="font-bold text-gray-700">({formatDateIndo(startDate)} {startDate !== endDate && ` - ${formatDateIndo(endDate)}`})</span>.
          </p>
        </div>

        {/* UI FILTER TANGGAL MODERN */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 p-1.5 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
            <Calendar size={16} className="text-gray-400" />
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer"
            />
          </div>
          <span className="text-gray-400 text-xs font-bold px-1">s/d</span>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
            <Calendar size={16} className="text-gray-400" />
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* DUA KARTU BESAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* ONLINE */}
        <div className="bg-gradient-to-br from-[#F97316] to-[#EA580C] p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 opacity-90">
              <ShoppingBag size={18} />
              <p className="text-xs font-bold uppercase tracking-wider">Pendapatan Online (Web & WA)</p>
            </div>
            <h2 className="text-4xl font-bold mb-3">Rp {stats.onlineRev.toLocaleString('id-ID')}</h2>
            <div className="flex items-center gap-4 text-xs">
              <span className="bg-white/20 px-2 py-1 rounded flex items-center gap-1"><Store size={12}/> {stats.onlineOrd} Pesanan Masuk</span>
              <span className="bg-white/20 px-2 py-1 rounded">Rata-rata: Rp {(stats.onlineOrd > 0 ? stats.onlineRev/stats.onlineOrd : 0).toLocaleString('id-ID')}</span>
            </div>
          </div>
          <ShoppingBag className="absolute -bottom-4 -right-4 text-white opacity-20" size={140} />
        </div>

        {/* OFFLINE */}
        <div className="bg-gradient-to-br from-[#1F2937] to-[#111827] p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 opacity-90">
              <Store size={18} />
              <p className="text-xs font-bold uppercase tracking-wider">Pendapatan Kasir (Offline / Dine-In)</p>
            </div>
            <h2 className="text-4xl font-bold mb-3">Rp {stats.offlineRev.toLocaleString('id-ID')}</h2>
            <div className="flex items-center gap-4 text-xs">
              <span className="bg-white/10 px-2 py-1 rounded flex items-center gap-1"><Banknote size={12}/> {stats.offlineOrd} Transaksi Kasir POS</span>
              <span className="bg-white/10 px-2 py-1 rounded">Rata-rata: Rp {(stats.offlineOrd > 0 ? stats.offlineRev/stats.offlineOrd : 0).toLocaleString('id-ID')}</span>
            </div>
          </div>
          <Banknote className="absolute -bottom-4 -right-4 text-white opacity-10" size={140} />
        </div>
      </div>

      {/* STATISTIK KECIL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="bg-green-50 p-2 rounded-lg text-green-500"><TrendingUp size={20}/></div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase">Total Pendapatan Gabungan</p>
            <h2 className="text-lg font-bold text-gray-800">Rp {(stats.onlineRev + stats.offlineRev).toLocaleString('id-ID')}</h2>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="bg-blue-50 p-2 rounded-lg text-blue-500"><Users size={20}/></div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase">Total Menu Terjual</p>
            <h2 className="text-lg font-bold text-gray-800">{stats.totalItems} Porsi</h2>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="bg-orange-50 p-2 rounded-lg text-orange-500"><Clock size={20}/></div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase">Rata-rata Nilai Transaksi</p>
            <h2 className="text-lg font-bold text-gray-800">Rp {((stats.onlineRev + stats.offlineRev) / (stats.onlineOrd + stats.offlineOrd || 1)).toLocaleString('id-ID')}</h2>
          </div>
        </div>
      </div>

      {/* GRAFIK & MENU TERLARIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-sm text-gray-800 mb-4">Distribusi Jam Sibuk & Kanal Omzet</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#888'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#888'}} />
                <Tooltip cursor={{fill: '#f9fafb'}} />
                <Legend iconType="circle" wrapperStyle={{fontSize: '10px'}}/>
                <Bar dataKey="online" name="Online (Web)" fill="#F97316" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="offline" name="Offline (Kasir)" fill="#374151" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm text-gray-800">Menu Paling Laris</h3>
            <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-1 rounded">Berdasarkan Filter</span>
          </div>
          <div className="space-y-4">
            {topProducts.length === 0 ? <p className="text-xs text-gray-400 text-center py-10">Belum ada penjualan di periode ini.</p> : topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-300 w-4">#{i+1}</span>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{p.name}</p>
                    <p className="text-[10px] text-gray-500">Terjual {p.qty} Porsi</p>
                  </div>
                </div>
                <div className="bg-orange-50 text-orange-500 text-xs font-bold px-2 py-1 rounded-lg">{p.qty} Pcs</div>
              </div>
            ))}
          </div>
          
          {/* TOMBOL MENUJU KELOLA MENU */}
          <Link to="/admin/settings/menu" className="block w-full text-center mt-4 bg-gray-50 text-gray-600 text-xs font-bold py-2 rounded-lg hover:bg-gray-100 transition-colors">
            Kelola Stok & Menu Lainnya <ArrowRight size={12} className="inline ml-1"/>
          </Link>
        </div>
      </div>

      {/* TABEL TRANSAKSI TERAKHIR */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-sm text-gray-800">5 Transaksi Terakhir</h3>
          <span className="text-[10px] text-gray-400">Status realtime dari channel 'orders'</span>
        </div>
        
        <div className="space-y-3">
          {orders.length === 0 ? (
             <p className="text-xs text-gray-500 text-center py-4">Belum ada transaksi di periode ini.</p>
          ) : orders.map(o => (
            <div key={o.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${o.order_type === 'Offline' ? 'bg-gray-100 text-gray-600' : 'bg-orange-100 text-orange-500'}`}>
                  {o.order_type === 'Offline' ? <Store size={16}/> : <ShoppingBag size={16}/>}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-gray-800">#{o.id.slice(0,8).toUpperCase()}</p>
                    <span className={`text-[9px] font-bold px-1.5 rounded ${o.order_type === 'Offline' ? 'bg-gray-200 text-gray-700' : 'bg-orange-200 text-orange-700'}`}>{o.order_type}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">{o.customer_name} • {o.payment_method}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800">Rp {o.total_price.toLocaleString('id-ID')}</p>
                <p className="text-[10px] text-green-600 font-bold flex items-center justify-end gap-1"><CheckCircle size={10}/> Selesai</p>
              </div>
            </div>
          ))}
        </div>
        
        {/* TOMBOL LIHAT SEMUA TRANSAKSI */}
        <div className="mt-4 text-center">
          <Link to="/admin/orders" className="text-xs font-bold text-orange-500 hover:text-orange-600">
            Lihat Semua Transaksi <ArrowRight size={12} className="inline"/>
          </Link>
        </div>
      </div>

    </AdminLayout>
  );
}