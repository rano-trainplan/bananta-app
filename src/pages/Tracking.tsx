import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Phone, MessageCircle, Store, Bike, CheckCircle, Clock, ChefHat, AlertTriangle, ArrowLeft, Navigation, XCircle } from 'lucide-react';
import BottomNav from '../components/layout/BottomNav';
import { useLanguage } from '../context/LanguageContext';

export default function Tracking() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const { t } = useLanguage();

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId || orderId === '0') return;
      const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).single();
      if (error) console.error(error); else setOrder(data);
      setLoading(false);
    }
    fetchOrder();

    const channel = supabase.channel('customer-track')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, 
      (payload) => { setOrder(payload.new); })
      .subscribe();

    const interval = setInterval(() => { fetchOrder(); }, 10000);

    return () => { 
      clearInterval(interval);
      supabase.removeChannel(channel); 
    };
  }, [orderId]);

  // LOGIKA TIMER 1 JAM
  useEffect(() => {
    if (order?.status === 'Menunggu Pembayaran') {
      const interval = setInterval(async () => {
        const orderTime = new Date(order.created_at).getTime();
        const expireTime = orderTime + 60 * 60 * 1000; 
        const now = new Date().getTime();
        const distance = expireTime - now;

        if (distance < 0) {
          clearInterval(interval);
          setTimeLeft('Waktu Habis');
          await supabase.from('orders').update({ status: 'Dibatalkan' }).eq('id', order.id);
          setOrder((prev: any) => ({ ...prev, status: 'Dibatalkan' }));
        } else {
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          setTimeLeft(`${minutes} menit ${seconds} detik`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [order]);

  if (loading) return <div className="p-10 text-center">Memuat status...</div>;
  if (!order) return <div className="p-10 text-center">Pesanan tidak ditemukan.</div>;

  const statusOrder = ['Dibuat', 'Validasi', 'Masak', 'Dikirim', 'Selesai'];
  const currentIndex = statusOrder.indexOf(order.status);

  const getStepStatus = (stepKey: string) => {
    const stepIndex = statusOrder.indexOf(stepKey);
    if (order.status === 'Selesai') return 'done'; 
    if (stepIndex < currentIndex) return 'done'; 
    if (stepIndex === currentIndex) {
        if (order.status === 'Validasi') return 'done'; 
        return 'active'; 
    }
    return 'pending';
  };

  return (
    <div className="pb-24 min-h-screen bg-gray-50 relative">
      
      {/* STYLE ANIMASI (Ditaruh paling atas di dalam div utama) */}
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .animate-ping {
          animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>

      <div className="bg-white/80 backdrop-blur-md p-4 rounded-b-3xl shadow-sm mb-4 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><ArrowLeft size={18}/></Link>
          <div>
            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">Live Delivery</p>
            <h1 className="text-lg font-bold text-gray-800">{t('tracking_title')}</h1>
          </div>
        </div>
        <p className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">#{order.id.slice(0,8)}</p>
      </div>

      <div className="px-4 space-y-4">
        
        {/* STATUS MENUNGGU PEMBAYARAN */}
        {order.status === 'Menunggu Pembayaran' && (
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="text-orange-500" size={20} />
              <p className="font-bold text-orange-600">Menunggu Transfer</p>
            </div>
            <p className="text-sm text-orange-800 mb-3">
              Silakan transfer <b>PERSIS</b> sebesar <b>Rp {order.total_price.toLocaleString('id-ID')}</b> ke rekening toko. 
              Sisa waktu: <b className="text-red-600">{timeLeft}</b>
            </p>
            <p className="text-xs text-orange-700 font-bold">*Jika lewat 1 jam, pesanan otomatis dibatalkan.</p>
          </div>
        )}

        {/* STATUS DIBATALKAN */}
        {order.status === 'Dibatalkan' && (
          <div className="bg-gray-100 border border-gray-300 p-4 rounded-xl text-center">
            <XCircle className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="font-bold text-gray-700 text-lg">Pesanan Dibatalkan</p>
            <p className="text-sm text-gray-500 mt-1">Waktu pembayaran habis atau dibatalkan Admin.</p>
            <Link to="/" className="mt-4 block bg-orange-500 text-white py-2 rounded-lg font-bold text-sm">Pesan Ulang</Link>
          </div>
        )}

        {/* STATUS DITOLAK */}
        {order.status === 'Ditolak' && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2"><AlertTriangle className="text-red-500" size={20} /><p className="font-bold text-red-600">{t('order_rejected')}</p></div>
            <p className="text-sm text-red-800 mb-3">Bukti transfer tidak valid. Silakan hubungi Admin.</p>
          </div>
        )}

        {/* PETA & KURIR */}
        {(order.status === 'Dikirim' || order.status === 'Selesai') && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative">
            <div className="h-48 bg-[#E5E7EB] relative overflow-hidden">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#4B5563 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              <svg className="absolute top-1/2 left-10 right-10 w-[calc(100%-80px)] h-10 -translate-y-1/2" preserveAspectRatio="none">
                <path d="M0,20 Q50,0 100,20 T200,20 T300,20" fill="none" stroke="#F59E0B" strokeWidth="4" strokeDasharray="6,4" />
              </svg>
              <div className="absolute top-1/2 left-4 -translate-y-1/2 bg-white p-2 rounded-full shadow-lg border border-gray-100 z-10"><Store size={16} className="text-orange-500" /><span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-gray-500">Resto</span></div>
              <div className={`absolute top-1/2 z-10 transition-all duration-1000 ease-in-out ${order.status === 'Dikirim' ? 'left-1/2 -translate-x-1/2 animate-bounce' : 'right-4 -translate-y-1/2 translate-x-1/2'}`}>
                <div className="bg-orange-500 p-2.5 rounded-full shadow-lg border-2 border-white"><Bike size={18} className="text-white" /></div>
              </div>
              <div className="absolute top-1/2 right-4 -translate-y-1/2 bg-white p-2 rounded-full shadow-lg border border-gray-100 z-10"><Navigation size={16} className="text-green-500" /><span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-gray-500">Tujuan</span></div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <img src={order.courier_photo || `https://ui-avatars.com/api/?name=${order.courier_name || 'Kurir'}&background=F59E0B&color=fff`} alt="Kurir" className="w-12 h-12 rounded-full object-cover border-2 border-orange-100" />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5"><h3 className="font-bold text-sm text-gray-800">{order.courier_name || t('courier_search')}</h3></div>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5 bg-gray-100 px-1.5 py-0.5 rounded inline-block">{order.courier_plate || '-'} • Vario Hitam</p>
                </div>
                <div className="flex gap-2">
                  {order.courier_phone && (
                    <>
                      <a href={`https://wa.me/${order.courier_phone}`} target="_blank" rel="noreferrer" className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors"><MessageCircle size={16} /></a>
                      <a href={`tel:${order.courier_phone}`} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"><Phone size={16} /></a>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TIMELINE ANIMASI BARU */}
        {(order.status !== 'Dibatalkan' && order.status !== 'Menunggu Pembayaran') && (
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-sm text-gray-800">{t('tracking_timeline')}</h3>
              <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Real-time</span>
            </div>
            
            <div className="relative pl-6 space-y-6">
              {/* GARIS VERTIKAL ANIMASI */}
              <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="bg-green-500 w-full transition-all duration-1000 ease-in-out" 
                  style={{ height: `${(currentIndex / (statusOrder.length - 1)) * 100}%` }}
                ></div>
              </div>

              {[
                { key: 'Dibuat', label: t('status_created'), sub: 'Pesanan telah masuk ke sistem dapur', icon: Clock, time: order.created_at },
                { key: 'Validasi', label: t('status_validated'), sub: 'Transaksi otomatis terverifikasi', icon: CheckCircle, time: order.updated_at },
                { key: 'Masak', label: t('status_cooking'), sub: 'Makanan disiapkan & higienis', icon: ChefHat, time: order.updated_at },
                { key: 'Dikirim', label: t('status_delivering'), sub: `Pesanan diantar ke alamat`, icon: Bike, time: order.updated_at },
                { key: 'Selesai', label: t('status_done'), sub: 'Konfirmasi penerimaan makanan', icon: CheckCircle, time: order.updated_at },
              ].map((step) => {
                const status = getStepStatus(step.key);
                const Icon = step.icon;
                
                return (
                  <div key={step.key} className="relative group">
                    {/* TITIK TIMELINE */}
                    <div className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center z-10 border-2 transition-all duration-500 ${
                      status === 'done' ? 'bg-green-500 border-green-500 text-white scale-110' : 
                      status === 'active' ? 'bg-orange-500 border-orange-500 text-white shadow-[0_0_0_4px_rgba(249,115,22,0.2)] scale-110' : 
                      'bg-white border-gray-200 text-gray-300 scale-100'
                    }`}>
                      <Icon size={12} strokeWidth={3} />
                      
                      {/* ANIMASI DENYUT (PULSE) KHUSUS YANG AKTIF */}
                      {status === 'active' && (
                        <span className="absolute inset-0 rounded-full bg-orange-400 animate-ping opacity-75"></span>
                      )}
                    </div>
                    
                    <div className={`${status === 'pending' ? 'opacity-40' : 'opacity-100'} ml-2 transition-opacity duration-500`}>
                      <div className="flex justify-between items-start">
                        <p className={`text-sm font-bold transition-colors duration-300 ${
                          status === 'active' ? 'text-orange-600' : 
                          status === 'done' ? 'text-green-700' : 
                          'text-gray-800'
                        }`}>
                          {step.label}
                          {status === 'active' && <span className="ml-2 text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full animate-pulse">Aktif</span>}
                        </p>
                        {status !== 'pending' && step.time && (
                          <p className="text-[10px] text-gray-400 font-medium">
                            {new Date(step.time).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}
                          </p>
                        )}
                      </div>
                      {status !== 'pending' && <p className="text-[10px] text-gray-500 mt-0.5">{step.sub}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BUKTI PENGANTARAN KURIR (FOTO) */}
        {order.status === 'Selesai' && order.proof_of_delivery && (
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-green-200 mb-2 animate-fade-in-up">
            <h3 className="font-bold text-sm text-green-600 mb-3 flex items-center gap-2">
              <CheckCircle size={16} /> Bukti Pengantaran Kurir
            </h3>
            <img 
              src={order.proof_of_delivery} 
              alt="Bukti Terima" 
              className="w-full h-auto max-h-64 object-cover rounded-xl border border-gray-200 shadow-sm" 
            />
            <p className="text-[10px] text-center text-gray-400 mt-2 italic">Pesanan telah diterima oleh pelanggan.</p>
          </div>
        )}

        {/* ALAMAT & RINCIAN */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-start gap-3">
            <div className="bg-orange-50 p-2 rounded-full text-orange-500 mt-0.5"><Navigation size={16}/></div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{t('destination')}</p>
              <p className="text-xs font-bold text-gray-800">{order.address}</p>
            </div>
          </div>
          <div className="border-t border-dashed pt-3 flex justify-between items-center text-xs">
            <p className="text-gray-500">{order.order_items?.length || 0} Menu • {order.payment_method}</p>
            <p className="font-bold text-gray-800">Rp {order.total_price.toLocaleString('id-ID')} <span className="text-green-600 text-[9px] bg-green-50 px-1.5 py-0.5 rounded ml-1">Lunas</span></p>
          </div>
        </div>

        <Link to="/" className="block text-center text-sm font-bold bg-[#F59E0B] text-white py-3.5 rounded-xl shadow-lg hover:bg-[#D97706] transition-colors mb-4">{t('back_home')} <ArrowLeft size={16} className="inline ml-1 rotate-180"/></Link>
      </div>
      <BottomNav />
    </div>
  );
}