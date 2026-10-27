import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import {
  Eye,  X, Calendar, Filter, Store, CheckCircle,
  XCircle, Clock, Truck, MapPin, Phone, ArrowLeft,
  User, CreditCard, Check
} from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import { Link } from 'react-router-dom'; 

export default function Admin() {
  const [orders, setOrders] = useState<any[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [modalType, setModalType] = useState<'detail' | 'proof' | 'courier' | null>(null);
  

  const [selectedCourierId, setSelectedCourierId] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [filterStatus, setFilterStatus] = useState('Semua');

 
    useEffect(() => {
    fetchOrders();
    fetchCouriers();
  }, [startDate, endDate]);

  async function fetchOrders() {
    setLoading(true);
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

  async function fetchCouriers() {
    const { data } = await supabase.from('couriers').select('*').order('name');
    setCouriers(data || []);
  }

  const filteredOrders = orders.filter(o => {
    if (filterStatus === 'Semua') return true;
    if (filterStatus === 'Diproses') return ['Validasi', 'Masak', 'Dikirim'].includes(o.status);
    return o.status === filterStatus;
  });

  const totalSelesai = orders.filter(o => o.status === 'Selesai');
  const totalPendapatanSelesai = totalSelesai.reduce((sum, o) => sum + o.total_price, 0);

  const countSelesai = orders.filter(o => o.status === 'Selesai').length;
  const countDitolak = orders.filter(o => o.status === 'Ditolak').length;
  const countDiproses = orders.filter(o => ['Validasi', 'Masak', 'Dikirim'].includes(o.status)).length;

  const handleAcceptOrder = async (id: string) => {
    await supabase.from('orders').update({ status: 'Validasi' }).eq('id', id);
    toast.success("Pesanan diterima!"); fetchOrders();
  };

  const handleValidatePayment = async (id: string) => {
    await supabase.from('orders').update({ status: 'Masak' }).eq('id', id);
    toast.success("Pembayaran divalidasi! Lanjut masak."); setModalType(null); fetchOrders();
  };

  const handleRejectPayment = async (id: string) => {
    await supabase.from('orders').update({ status: 'Ditolak' }).eq('id', id);
    toast.error("Minta upload ulang bukti TF."); setModalType(null); fetchOrders();
  };

  const openCourierModal = (order: any) => {
    setSelectedOrder(order);
    setModalType('courier');
    setSelectedCourierId('');
  };

  const handleAssignCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourierId) return toast.error("Pilih kurir dulu!");
    
    const selectedCourier = couriers.find(c => c.id === selectedCourierId);
    if (!selectedCourier) return toast.error("Kurir tidak ditemukan");

    await supabase.from('orders').update({
      courier_id: selectedCourier.id, // <-- Disimpen ID-nya buat login kurir
      courier_name: selectedCourier.name,
      courier_phone: selectedCourier.phone,
      courier_plate: selectedCourier.plate_number,
      courier_photo: selectedCourier.photo_url,
      status: 'Dikirim'
    }).eq('id', selectedOrder.id);

    toast.success("Kurir ditugaskan! Pesanan jalan."); 
    setModalType(null); 
    fetchOrders();
  };

  return (
    <AdminLayout>
      {/* TOP INFO */}
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

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Daftar Pesanan</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola dan pantau seluruh transaksi pelanggan secara realtime.</p>
      </div>

      {/* FILTER */}
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
            const isSelesai = order.status === 'Selesai';
            
            return (
              <div key={order.id} className={`bg-white rounded-xl shadow-sm border p-4 transition-all hover:shadow-md ${isDitolak ? 'border-red-200' : 'border-gray-200'}`}>
                
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded">#{order.id.slice(0, 6)}</span>
                    <span className="text-xs text-gray-400 font-medium">{new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIT</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${
                    isSelesai ? 'bg-green-100 text-green-700' : 
                    isDitolak ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {isSelesai ? <CheckCircle size={10} /> : isDitolak ? <XCircle size={10} /> : <Clock size={10} />}
                    {order.status}
                  </span>
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
                      <button onClick={() => openCourierModal(order)} className="flex-1 sm:flex-none justify-center bg-orange-500 text-white text-xs px-4 py-2 rounded-lg font-bold flex items-center gap-1">
                        <Truck size={14}/> Tugaskan Kurir
                      </button>
                    )}
                    <button onClick={() => { setSelectedOrder(order); setModalType('detail'); }} className={`flex-1 sm:flex-none justify-center text-xs px-4 py-2 rounded-lg font-bold flex items-center gap-1 ${isDitolak ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      <Eye size={14} /> Detail
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FOOTER SUMMARY */}
      {!loading && filteredOrders.length > 0 && (
        <div className="mt-6 bg-orange-50 border border-orange-100 rounded-xl p-4 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">Total Transaksi Selesai</p>
            <p className="text-xs text-gray-500 mt-0.5">{totalSelesai.length} pesanan terverifikasi</p>
          </div>
          <p className="text-xl font-bold text-orange-600">Rp {totalPendapatanSelesai.toLocaleString('id-ID')}</p>
        </div>
      )}

      {/* MODAL DETAIL (TAMPILAN BARU) */}
      {modalType === 'detail' && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-sm max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            
            {/* Header Modal */}
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

            {/* Body Modal */}
            <div className="p-5 overflow-y-auto space-y-5 bg-gray-50/50">
              
              {/* Status Card */}
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="bg-orange-500 w-2.5 h-2.5 rounded-full animate-pulse"></div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">Status Pesanan: Sedang Diproses</p>
                    <p className="text-[10px] text-gray-500">({selectedOrder.status})</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-orange-600">{selectedOrder.status === 'Masak' ? 'Dimasak' : selectedOrder.status}</span>
              </div>

              {/* Info Pelanggan */}
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

              {/* Rincian Menu */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Rincian Menu ({selectedOrder.order_items?.length || 0} Item)</p>
                  <p className="text-[10px] text-gray-400 font-medium">Porsi</p>
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

              {/* Rincian Pembayaran */}
              <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Metode Pembayaran</span>
                  <span className="font-bold text-orange-600 flex items-center gap-1"><CreditCard size={12}/> {selectedOrder.payment_method}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Status Pembayaran</span>
                  <span className="bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded">Lunas (Terverifikasi)</span>
                </div>
              </div>

              {/* Total Tagihan */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Total Tagihan</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Sudah Termasuk Pajak</p>
                </div>
                <p className="text-xl font-bold text-orange-600">Rp {selectedOrder.total_price.toLocaleString('id-ID')}</p>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-gray-100 bg-white flex gap-2">
              <button onClick={() => setModalType(null)} className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-200 transition-colors">
                <ArrowLeft size={16}/> Tutup
              </button>
              {selectedOrder.status === 'Masak' && (
                <button onClick={() => { setModalType(null); openCourierModal(selectedOrder); }} className="flex-1 bg-orange-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-orange-600 shadow-md transition-colors">
                  <Truck size={16}/> Tugaskan Kurir
                </button>
              )}
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

      {/* MODAL KURIR (TAMPILAN BARU) */}
      {modalType === 'courier' && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden flex flex-col shadow-2xl max-h-[90vh] my-auto">
            
            {/* HEADER MODAL */}
            <div className="p-5 flex justify-between items-start border-b border-gray-100">
              <div className="flex gap-3 items-center">
                <div className="bg-orange-500 p-3 rounded-2xl text-white shadow-md shadow-orange-200">
                  <Truck size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-lg text-gray-800">Tugaskan Kurir</h2>
                    <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded">#{selectedOrder.id.slice(0,6)}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">Pilih kurir armada aktif untuk pengantaran</p>
                </div>
              </div>
              <button type="button" onClick={() => setModalType(null)} className="p-1.5 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors">
                <X size={18}/>
              </button>
            </div>

            <form onSubmit={handleAssignCourier} className="flex-1 overflow-y-auto p-5 space-y-5">
              
              {/* KARTU RINGKASAN PESANAN */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-gray-800 uppercase">{selectedOrder.customer_name}</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1"><MapPin size={10}/> {selectedOrder.address}</p>
                </div>
                <div className="text-right">
                  <span className="bg-green-100 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mb-1">
                    {selectedOrder.payment_method}
                  </span>
                  <p className="font-bold text-sm text-orange-500">Rp {selectedOrder.total_price.toLocaleString('id-ID')}</p>
                </div>
              </div>

              {/* PILIHAN KURIR */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-bold text-gray-700">Pilih Armada Kurir</label>
                  <Link to="/admin/settings/couriers" className="text-[10px] font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1">
                    + Tambah Kurir
                  </Link>
                </div>
                
                <div className="space-y-2">
                  {couriers.length === 0 ? (
                    <p className="text-xs text-red-500 text-center py-4">Belum ada data kurir. Tambah dulu di menu Pengaturan.</p>
                  ) : couriers.map(c => {
                    const isSelected = selectedCourierId === c.id;
                    
                    return (
                      <div 
                        key={c.id} 
                        onClick={() => setSelectedCourierId(c.id)}
                        className={`flex items-center justify-between p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isSelected ? 'bg-orange-200 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                            {c.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-gray-800">{c.name}</h4>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {isSelected ? 'Standby (Siap Antar)' : 'Tersedia'}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-0.5">{c.plate_number} • {c.vehicle_type || 'Motor'}</p>
                          </div>
                        </div>
                        
                        {/* RADIO BUTTON BULAT */}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}`}>
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CATATAN UNTUK KURIR */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-gray-700">Catatan untuk Kurir</label>
                  <span className="text-[9px] text-gray-400 font-medium">Opsional</span>
                </div>
                <textarea 
                  placeholder="Cth: Titip di satpam / bawa tas termos..."
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none resize-none h-20"
                />
              </div>

              {/* FOOTER TOMBOL */}
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setModalType(null)} 
                  className="flex-1 py-3 bg-white border-2 border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={!selectedCourierId}
                  className={`flex-[2] py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    selectedCourierId 
                      ? 'bg-[#F59E0B] text-white shadow-lg hover:bg-[#D97706]' 
                      : 'bg-orange-200 text-white cursor-not-allowed'
                  }`}
                >
                  <Truck size={18} /> Kirim & Tugaskan
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}