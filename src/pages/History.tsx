import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, ShoppingCart, ArrowRight, MapPin, Globe, Bike, MessageCircle } from 'lucide-react';
import BottomNav from '../components/layout/BottomNav';

export default function History() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      // Ambil daftar ID pesanan dari HP pelanggan (localStorage)
      const myOrderIds = JSON.parse(localStorage.getItem('my_orders') || '[]');

      // Kalau belum pernah pesan, tampilkan kosong
      if (myOrderIds.length === 0) {
        setLoading(false);
        return;
      }

      // Hanya minta Supabase ambil pesanan yang ID-nya ada di daftar HP
      const { data } = await supabase
        .from('orders')
        .select('*')
        .in('id', myOrderIds) 
        .order('created_at', { ascending: false });

      setOrders(data || []);
      setLoading(false);
    }
    
    fetchHistory();
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-500">Memuat riwayat...</div>;

  return (
    <div className="pb-24 min-h-screen bg-gray-50 relative">
      {/* HEADER */}
      <header className="bg-white p-4 shadow-sm flex items-center gap-3 sticky top-0 z-10 border-b border-gray-100">
        <Link to="/" className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"><ArrowLeft size={18} /></Link>
        <h1 className="font-bold text-lg text-gray-800">Riwayat Pesanan</h1>
      </header>

      <div className="p-4 max-w-md mx-auto">
        
        {/* JIKA BELUM ADA PESANAN (EMPTY STATE) */}
        {orders.length === 0 ? (
          <div className="space-y-6">
            
            {/* Kotak Utama Kosong */}
            <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm flex flex-col items-center justify-center mt-4">
              {/* Ilustrasi Boks (Pakai Emoji biar gampang, atau ganti dengan SVG) */}
              <div className="text-6xl mb-4 drop-shadow-md">🎁</div>
              
              <h3 className="font-bold text-base text-gray-800 mb-2">Belum Ada Riwayat Pesanan</h3>
              <p className="text-xs text-gray-500 mb-6 leading-relaxed px-2">
                Kamu belum pernah melakukan pemesanan di Bananta Sultan lewat perangkat ini. Makanan lezat buatan kami siap diantar ke tempatmu!
              </p>
              
              <Link 
                to="/" 
                className="bg-white border-2 border-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2 w-full justify-center"
              >
                <ShoppingCart size={16} className="text-gray-800"/> Pesan Sekarang <ArrowRight size={16} />
              </Link>
            </div>

            {/* Banner Favorit Warga */}
            <Link to="/" className="block bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
             <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-2xl">
  🍗
</div>
<div>
  <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-0.5">Favorit Warga Bananta Sultan</p>
  <p className="text-sm font-bold text-gray-800 group-hover:text-orange-500 transition-colors">Ayam Geprek Candu</p>
  <p className="text-[10px] text-gray-500 mt-0.5">Pedas nampol, kriuk maksimal...</p>
</div>
              <ArrowRight size={16} className="text-gray-300 group-hover:translate-x-1 transition-transform"/>
            </Link>

            {/* Keuntungan Pesan Online */}
            <div className="pt-2">
              <h4 className="text-xs font-bold text-gray-800 mb-4 px-1">Keuntungan Pesan Online di Bananta Sultan</h4>
              
              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="bg-green-50 text-green-600 p-2 rounded-xl shrink-0"><Bike size={18}/></div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">Pengantaran Cepat</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">Langsung diantarkan oleh kurir resmi resto dalam kondisi hangat & higienis.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="bg-blue-50 text-blue-600 p-2 rounded-xl shrink-0"><Globe size={18}/></div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">Bayar Sangat Praktis</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">Dukungan penuh untuk QRIS instan, e-wallet, dan transfer bank otomatis.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="bg-orange-50 text-orange-500 p-2 rounded-xl shrink-0"><MapPin size={18}/></div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">Live Tracking Akurat</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">Pantau perjalanan pesanan secara live dari wajan dapur hingga ke depan pintu.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bantuan Bawah */}
            <div className="flex items-center justify-between pt-6 pb-2 border-t border-gray-200 mt-4 px-1">
              <div className="flex items-center gap-2 text-gray-600">
                <MessageCircle size={16} />
                <p className="text-xs font-medium">Ada kendala dengan akunmu?</p>
              </div>
              <a href="https://wa.me/6282151855286" target="_blank" rel="noreferrer" className="text-xs font-bold text-green-600 hover:text-green-700 underline underline-offset-2">
                Hubungi Bantuan
              </a>
            </div>

          </div>
        ) : (
          
          // JIKA SUDAH ADA PESANAN (LIST RIWAYAT)
          <div className="space-y-3 mt-2">
            {orders.map((order) => (
              <Link to={`/tracking/${order.id}`} key={order.id} className="block bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded">#{order.id.slice(0, 6)}</span>
                    <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1"><Clock size={10}/> {new Date(order.created_at).toLocaleString('id-ID', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                    order.status === 'Selesai' ? 'bg-green-100 text-green-700' : 
                    order.status === 'Ditolak' ? 'bg-red-100 text-red-700' : 
                    'bg-orange-100 text-orange-700'
                  }`}>{order.status}</span>
                </div>
                
                <div className="mb-3">
                  <h3 className="font-bold text-sm text-gray-800 uppercase">{order.customer_name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{order.order_items?.length || 0} Menu • {order.payment_method}</p>
                </div>

                <div className="border-t border-dashed border-gray-200 my-2"></div>
                
                <div className="flex justify-between items-center pt-1">
                  <p className="text-sm font-bold text-[#F59E0B]">Rp {order.total_price.toLocaleString('id-ID')}</p>
                  <p className="text-[10px] text-gray-400 font-bold group-hover:text-orange-500 transition-colors flex items-center gap-1">Lihat Detail <ArrowRight size={12}/></p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      <BottomNav />
    </div>
  );
}