import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import {
  Eye, X, Calendar, Filter, Store, CheckCircle,
  XCircle, Clock, Truck, MapPin, Phone, ArrowLeft,
  User, 
} from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';

export default function Admin() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [modalType, setModalType] = useState<'detail' | 'proof' | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [filterStatus, setFilterStatus] = useState('Semua');

  // REALTIME LISTENER (Biar Admin Gak Perlu Refresh)
  useEffect(() => {
    fetchOrders();
    
    const channel = supabase.channel('admin-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders(); // Langsung tarik data baru tiap ada perubahan
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [startDate, endDate]);

  async function fetchOrders() {
    // Jangan tampilkan loading spinner kalau cuma update realtime
    if (orders.length === 0) setLoading(true); 
    
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`)
      .order('created_at', { ascending: false });

    if (error) console.error(error); 
    else setOrders(data || []);
    setLoading(false);
  }

  const filteredOrders = orders.filter(o => {
    if (filterStatus === 'Semua') return true;
    if (filterStatus === 'Diproses') return ['Validasi', 'Masak', 'Mencari Kurir', 'Dikirim'].includes(o.status);
    return o.status === filterStatus;
  });



  const countSelesai = orders.filter(o => o.status === 'Selesai').length;
  const countDitolak = orders.filter(o => o.status === 'Ditolak').length;
  const countDiproses = orders.filter(o => ['Validasi', 'Masak', 'Mencari Kurir', 'Dikirim'].includes(o.status)).length;

  const handleAcceptOrder = async (id: string) => {
    await supabase.from('orders').update({ status: 'Validasi' }).eq('id', id);
    toast.success("Pesanan diterima!");
  };

  const handleValidatePayment = async (id: string) => {
    await supabase.from('orders').update({ status: 'Masak' }).eq('id', id);
    toast.success("Pembayaran divalidasi! Lanjut masak."); setModalType(null);
  };

  const handleRejectPayment = async (id: string) => {
    await supabase.from('orders').update({ status: 'Ditolak' }).eq('id', id);
    toast.error("Minta upload ulang bukti TF."); setModalType(null);
  };

  const handleReleaseToCouriers = async (id: string) => {
    if (!confirm("Lepas pesanan ini ke semua kurir? (Siapa cepat, dia dapat)")) return;
    await supabase.from('orders').update({
      courier_id: null,
      status: 'Mencari Kurir'
    }).eq('id', id);
    toast.success("Pesanan dilepas ke kurir!"); 
    setModalType(null); 
  };

  // Fungsi buat nentuin tampilan Badge Status
  const renderStatusBadge = (status: string) => {
    if (status === 'Selesai') return <span className="text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 bg-green-100 text-green-700"><CheckCircle size={10}/> Selesai</span>;
    if (status === 'Ditolak') return <span className="text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 bg-red-100 text-red-700"><XCircle size={10}/> Ditolak</span>;
    if (status === 'Mencari Kurir') return <span className="text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 bg-orange-100 text-orange-700"><Clock size={10} className="animate-pulse"/> Mencari Kurir</span>;
    if (status === 'Dikirim') return <span className="text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 bg-blue-100 text-blue-700"><Truck size={10}/> Diambil Kurir</span>;
    
    return <span className="text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 bg-gray-100 text-gray-700"><Clock size={10}/> {status}</span>;
  };

  return (
    <AdminLayout>
      {/* TOP INFO & HEADER */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-orange-100 p-2 rounded-xl text-orange-500"><Store size={24} /></div>
          <div>
            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">Sultan Kitchen</p>
            <h2 className="font-bold text-sm text-gray-800">Panel Kasir & Dapur</h2>
          </div>
        </div>
        <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Toko Buka
        </span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Daftar Pesanan</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola dan pantau seluruh transaksi pelanggan secara realtime.</p>
      </div>

      {/* FILTER TANGGAL */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200">
          <Filter size={16} className="text-gray-500" />
          <div className="h-5 w-px bg-gray-300 mx-1"></div>
          <Calendar size={16} className="text-gray-400" />
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-sm font-semibold text-gray-700 outline-none w-32" />
          <span className="text-gray-400 text-xs">s/d</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-sm font-semibold text-gray-700 outline-none w-32" />
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
        {[
          { label: 'Semua', count: orders.length, color: 'bg-orange-500' },
          { label: 'Selesai', count: countSelesai, color: 'bg-green-500' },
          { label: 'Ditolak', count: countDitolak, color: 'bg-red-500' },
          { label: 'Diproses', count: countDiproses, color: 'bg-gray-800' },
        ].map((tab) => (
          <button
            key={tab.label}
            onClick={() => setFilterStatus(tab.label)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-colors border ${
              filterStatus === tab.label
                ? `${tab.color} text-white border-transparent`
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label} 
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
               filterStatus === tab.label ? 'bg-white/20' : 'bg-gray-100 text-gray-500'
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* LIST PESANAN */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">Memuat pesanan...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
          <p className="text-gray-500 font-medium">Belum ada pesanan di periode/status ini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isDitolak = order.status === 'Ditolak';
            
            return (
              <div key={order.id} className={`bg-white rounded-xl shadow-sm border p-4 transition-all hover:shadow-md ${isDitolak ? 'border-red-200' : 'border-gray-200'}`}>
                
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded">#{order.id.slice(0, 6)}</span>
                    <span className="text-xs text-gray-400 font-medium">{new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIT</span>
                  </div>
                  {renderStatusBadge(order.status)}
                </div>

                <div className="mb-4">
                  <h3 className="font-bold text-sm text-gray-800 uppercase">{order.customer_name}</h3>
                  <div className="text-xs text-gray-500 mt-1 flex flex-col gap-0.5">
                    <p>Metode: {order.payment_method} • {order.order_items?.length || 0} Item</p>
                    {order.address && <p className="flex items-center gap-1"><MapPin size={10}/> {order.address}</p>}
                    {order.phone && <p className="flex items-center gap-1"><Phone size={10}/> {order.phone}</p>}
                  </div>
                  {isDitolak && <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1"><XCircle size={10} /> Alasan: Bukti transfer tidak valid</p>}
                </div>

                <div className="border-t border-dashed border-gray-200 my-3"></div>

                <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-end">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Total Pesanan</p>
                    <p className="text-lg font-bold text-orange-500">Rp {order.total_price.toLocaleString('id-ID')}</p>
                  </div>
                  
                  <div className="flex gap-2 w-full sm:w-auto">
                    {order.status === 'Dibuat' && (
                      <button onClick={() => handleAcceptOrder(order.id)} className="flex-1 sm:flex-none justify-center bg-blue-500 text-white text-xs px-4 py-2 rounded-lg font-bold flex items-center">Terima Pesanan</button>
                    )}
                    {order.status === 'Validasi' && (
                      <button onClick={() => { setSelectedOrder(order); setModalType('proof'); }} className="flex-1 sm:flex-none justify-center bg-orange-500 text-white text-xs px-4 py-2 rounded-lg font-bold flex items-center">Cek Bukti TF</button>
                    )}
                    {order.status === 'Masak' && (
                      <button onClick={() => handleReleaseToCouriers(order.id)} className="flex-1 sm:flex-none justify-center bg-orange-500 text-white text-xs px-4 py-2 rounded-lg font-bold flex items-center gap-1">
                        <Truck size={14}/> Lepas ke Kurir
                      </button>
                    )}
                    
                    {/* TOMBOL DETAIL BARU MUNCUL PAS SELESAI */}
                    {order.status === 'Selesai' && (
                      <button onClick={() => { setSelectedOrder(order); setModalType('detail'); }} className={`flex-1 sm:flex-none justify-center text-xs px-4 py-2 rounded-lg font-bold flex items-center gap-1 bg-gray-100 text-gray-600 hover:bg-gray-200`}>
                        <Eye size={14} /> Detail
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DETAIL (MUNCUL PAS KLIK TOMBOL DETAIL) */}
      {modalType === 'detail' && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-sm max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex justify-between items-start sticky top-0 bg-white z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded">#{selectedOrder.id.slice(0,6)}</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">🕒 {new Date(selectedOrder.created_at).toLocaleString('id-ID', {day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit'})} WIT</span>
                </div>
                <h2 className="font-bold text-lg text-gray-800">Detail Pesanan</h2>
              </div>
              <button onClick={() => setModalType(null)} className="p-1.5 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors">
                <X size={18}/>
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 bg-gray-50/50">
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pelanggan</p>
                  <a href={`https://wa.me/${selectedOrder.phone}`} target="_blank" rel="noreferrer" className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <Phone size={10}/> WhatsApp
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-full text-gray-500"><User size={16}/></div>
                  <div>
                    <p className="font-bold text-sm text-gray-800 uppercase">{selectedOrder.customer_name}</p>
                    <p className="text-xs text-gray-500">{selectedOrder.phone}</p>
                  </div>
                </div>
                <div className="border-t border-dashed pt-3 flex items-start gap-3">
                  <div className="bg-gray-100 p-2 rounded-full text-gray-500 mt-0.5"><MapPin size={16}/></div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Alamat Pengantaran</p>
                    <p className="text-xs text-gray-700 font-medium mt-0.5">{selectedOrder.address}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Rincian Menu ({selectedOrder.order_items?.length || 0} Item)</p>
                </div>
                <div className="space-y-2">
                  {selectedOrder.order_items?.map((item: any, idx: number) => (
                    <div key={idx} className="bg-white border border-gray-100 p-3 rounded-xl flex justify-between items-center shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="bg-orange-100 text-orange-600 font-bold text-xs px-1.5 py-0.5 rounded">{item.quantity}x</span>
                        <div>
                          <p className="font-bold text-sm text-gray-800">{item.product_name}</p>
                        </div>
                      </div>
                      <p className="font-bold text-sm text-gray-800">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Total Tagihan</p>
                </div>
                <p className="text-xl font-bold text-orange-600">Rp {selectedOrder.total_price.toLocaleString('id-ID')}</p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-white flex gap-2">
              <button onClick={() => setModalType(null)} className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-200 transition-colors w-full justify-center">
                <ArrowLeft size={16}/> Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CEK BUKTI TF */}
      {modalType === 'proof' && selectedOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-4 rounded-2xl w-full max-w-sm">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-lg">Bukti Transfer</h2>
              <button onClick={() => setModalType(null)} className="p-1 bg-gray-200 rounded-full"><X size={18}/></button>
            </div>
            {selectedOrder.payment_proof ? (
              <img src={selectedOrder.payment_proof} alt="Bukti TF" className="w-full rounded-lg border mb-4" />
            ) : (
              <p className="text-center text-red-500 italic mb-4">Pelanggan tidak upload bukti.</p>
            )}
            <div className="flex gap-2">
              <button onClick={() => handleRejectPayment(selectedOrder.id)} className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold text-sm">Minta Upload Ulang</button>
              <button onClick={() => handleValidatePayment(selectedOrder.id)} className="flex-1 bg-green-500 text-white py-2 rounded-lg font-bold text-sm">Validasi</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}