import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, MapPin, Package, User, Bike, ClipboardList, 
  TrendingUp, History, LogOut, ShieldCheck, Store, ArrowLeft, Lock
} from 'lucide-react';

export default function Courier() {
  const [orders, setOrders] = useState<any[]>([]);
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [proofPhoto, setProofPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'aktif' | 'riwayat'>('aktif');

  // STATE UNTUK SESSION KURIR
  const [couriers, setCouriers] = useState<any[]>([]);
  const [currentCourier, setCurrentCourier] = useState<any>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  
  // STATE UNTUK PIN LOGIN
  const [selectedCourierForLogin, setSelectedCourierForLogin] = useState<any>(null);
  const [pinInput, setPinInput] = useState('');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // STATE UNTUK STATISTIK DI HALAMAN LOGIN
  const [loginStats, setLoginStats] = useState<Record<string, { active: number, done: number }>>({});
  const [totalActiveOrders, setTotalActiveOrders] = useState(0);

  useEffect(() => {
    async function checkSession() {
      const savedCourierId = localStorage.getItem('courier_session_id');
      
      if (savedCourierId) {
        const { data } = await supabase.from('couriers').select('*').eq('id', savedCourierId).single();
        if (data) setCurrentCourier(data);
        else localStorage.removeItem('courier_session_id');
      } else {
        const { data } = await supabase.from('couriers').select('*').eq('is_active', true).order('name');
        setCouriers(data || []);

        const { data: activeOrders } = await supabase.from('orders').select('courier_id, status').in('status', ['Dikirim', 'Selesai']);
        
        if (activeOrders) {
          const counts: Record<string, { active: number, done: number }> = {};
          let totalActive = 0;
          
          activeOrders.forEach(o => {
            if (!counts[o.courier_id]) counts[o.courier_id] = { active: 0, done: 0 };
            
            if (o.status === 'Dikirim') {
              counts[o.courier_id].active += 1;
              totalActive += 1;
            } else if (o.status === 'Selesai') {
              counts[o.courier_id].done += 1;
            }
          });
          
          setLoginStats(counts);
          setTotalActiveOrders(totalActive);
        }
      }
      setIsCheckingSession(false);
    }
    checkSession();
  }, []);

  useEffect(() => {
    if (!currentCourier) return;

    fetchData();
    
    const channel = supabase.channel('courier-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'UPDATE' && payload.new.status === 'Dikirim' && !payload.new.courier_id) {
          playNotificationSound();
          toast.success("Pesanan baru siap diantar!");
        }
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentCourier]);

  const playNotificationSound = () => {
    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    audio.play().catch(e => console.log('Audio block by browser', e));
  };

  async function fetchData() {
    setLoading(true);
    
    const { data: active } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'Dikirim')
      .or(`courier_id.is.null,courier_id.eq.${currentCourier.id}`) 
      .order('updated_at', { ascending: false });
    setOrders(active || []);

    const { data: history } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'Selesai')
      .eq('courier_id', currentCourier.id) 
      .order('updated_at', { ascending: false });
    setHistoryOrders(history || []);

    setLoading(false);
  }

  const handleTakeTask = async (orderId: string) => {
    const { error } = await supabase.from('orders').update({
      courier_id: currentCourier.id
    }).eq('id', orderId).is('courier_id', null);

    if (error) {
      toast.error("Gagal ambil tugas. Mungkin sudah diambil kurir lain.");
    } else {
      toast.success("Tugas berhasil diambil!");
      fetchData();
    }
  };

  const handleFinishOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofPhoto) return toast.error("Wajib upload foto bukti pengiriman!");
    
    const fileExt = proofPhoto.name.split('.').pop();
    const fileName = `proof-terima-${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage.from('uploads').upload(fileName, proofPhoto);
    if (uploadError) return toast.error("Gagal upload bukti.");
    
    const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
    
    const { error } = await supabase.from('orders').update({ 
      status: 'Selesai', 
      proof_of_delivery: urlData.publicUrl 
    }).eq('id', selectedOrder.id);
    
    if (error) toast.error("Gagal selesaikan pesanan");
    else { 
      toast.success("Pesanan selesai!"); 
      setSelectedOrder(null); 
      setProofPhoto(null); 
      fetchData(); 
      setActiveTab('riwayat'); 
    }
  };

  const handleLogoutKurir = () => {
    if (confirm("Yakin mau ganti akun kurir?")) {
      localStorage.removeItem('courier_session_id');
      window.location.reload();
    }
  };

  const handleOpenPin = (courier: any) => {
    setSelectedCourierForLogin(courier);
    setPinInput('');
    setIsPinModalOpen(true);
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === selectedCourierForLogin.pin) {
      localStorage.setItem('courier_session_id', selectedCourierForLogin.id);
      setCurrentCourier(selectedCourierForLogin);
      setIsPinModalOpen(false);
    } else {
      toast.error("PIN Salah! Coba lagi.");
      setPinInput('');
    }
  };

  if (isCheckingSession) return <div className="p-10 text-center font-bold text-gray-500">Memeriksa identitas kurir...</div>;

  // --- LAYAR 1: PILIH KURIR ---
  if (!currentCourier) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col relative">
        
        <div className="bg-white px-4 py-3 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 text-orange-500 p-2 rounded-lg">
              <Store size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm text-gray-800 tracking-wide">BANANTA SULTAN</h1>
                <span className="bg-orange-100 text-orange-600 text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider">KURIR</span>
              </div>
              <p className="text-[10px] text-gray-500">Shift Operasional Lelilef</p>
            </div>
          </div>
          <Link to="/" className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors flex items-center gap-1">
            <ArrowLeft size={12} /> Web Utama
          </Link>
        </div>

        <div className="flex-1 p-5 max-w-md mx-auto w-full space-y-6 overflow-y-auto pb-24">
          
          <div className="text-center mt-4">
            <div className="relative inline-block mb-4">
              <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-orange-200">
                <Bike size={40} />
              </div>
              <div className="absolute bottom-0 right-0 bg-green-500 text-white p-1 rounded-full border-2 border-white">
                <CheckCircle size={14} />
              </div>
            </div>
            <h2 className="font-bold text-xl text-gray-800 mb-1">Pilih Identitas Kurir</h2>
            <p className="text-xs text-gray-500 leading-relaxed px-4">
              Pilih profil Anda dan masukkan PIN rahasia untuk mulai membuka daftar tugas.
            </p>
            
            <div className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-600 text-[10px] font-bold px-3 py-1.5 rounded-full mt-4 border border-orange-100">
              <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
              {totalActiveOrders > 0 ? `${totalActiveOrders} Pengantaran Menunggu Saat Ini` : 'Belum Ada Pengantaran'}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-end mb-3">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">DAFTAR RIDER LAPANGAN</h3>
              <span className="text-[10px] font-bold text-green-600 flex items-center gap-1"><CheckCircle size={10}/> Akun Terverifikasi</span>
            </div>

            <div className="space-y-3">
              {couriers.length === 0 ? (
                <p className="text-sm text-center text-red-500 py-4">Tidak ada kurir aktif. Hubungi Admin.</p>
              ) : (
                couriers.map((c) => {
                  const isOnline = c.is_active; 
                  
                  return (
                    <div 
                      key={c.id} 
                      onClick={() => {
                        if (!isOnline) return;
                        handleOpenPin(c);
                      }}
                      className={`bg-white rounded-2xl p-4 border transition-all ${
                        isOnline 
                          ? 'border-orange-200 shadow-sm hover:shadow-md cursor-pointer relative overflow-hidden group' 
                          : 'border-gray-200 opacity-60 grayscale cursor-not-allowed'
                      }`}
                    >
                      {isOnline && <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-400"></div>}

                      <div className="flex gap-3">
                        <div className="relative shrink-0">
                          <img 
                            src={c.photo_url || `https://ui-avatars.com/api/?name=${c.name}&background=F59E0B&color=fff`} 
                            alt={c.name} 
                            className={`w-12 h-12 rounded-full object-cover border-2 ${isOnline ? 'border-orange-100' : 'border-gray-200'}`} 
                          />
                          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        </div>

                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-bold text-sm text-gray-800">{c.name}</h4>
                              </div>
                              <p className="text-[10px] text-gray-500 mt-0.5 font-mono flex items-center gap-1">
                                <Bike size={10}/> {c.vehicle_type || 'Motor'} • {c.plate_number}
                              </p>
                            </div>
                            
                            <div className={`flex items-center gap-1 text-[10px] font-bold ${isOnline ? 'text-orange-500' : 'text-gray-400'}`}>
                              {isOnline ? 'Masuk' : 'Buka'} <ArrowLeft size={12} className="rotate-180"/>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-2">
                            {isOnline ? (
                              <>
                                {loginStats[c.id]?.active > 0 ? (
                                  <span className="bg-orange-500 text-white text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                                    <Package size={10} /> {loginStats[c.id].active} Tugas Antar
                                  </span>
                                ) : (
                                  <span className="bg-green-100 text-green-700 text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                                    Standby (Siap Antar)
                                  </span>
                                )}
                                <span className="text-[9px] text-gray-500 font-medium">{loginStats[c.id]?.done || 0} Antaran Selesai</span>
                              </>
                            ) : (
                              <span className="bg-gray-100 text-gray-500 text-[9px] font-bold px-2 py-1 rounded-md">Ishirahat / Off</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {isPinModalOpen && selectedCourierForLogin && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <form onSubmit={handleVerifyPin} className="bg-white p-6 rounded-3xl w-full max-w-sm space-y-5 shadow-2xl animate-fade-in-up">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Lock size={32} />
                </div>
                <h2 className="font-bold text-xl">Halo, {selectedCourierForLogin.name}</h2>
                <p className="text-xs text-gray-500 mt-1">Masukkan PIN rahasia Anda untuk melanjutkan.</p>
              </div>
              
              <div>
                <input 
                  type="password" 
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full bg-gray-50 border-2 border-gray-200 p-4 rounded-xl text-center text-3xl tracking-[1em] font-bold text-gray-800 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 outline-none transition-all"
                  required
                  autoFocus
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsPinModalOpen(false)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-200 transition-colors">Batal</button>
                <button type="submit" className="flex-[2] bg-[#F97316] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#EA580C] transition-colors shadow-md flex items-center justify-center gap-2">
                  <ShieldCheck size={18} /> Verifikasi PIN
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // --- LAYAR 2: DASHBOARD KURIR ---
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <img src={currentCourier.photo_url || `https://ui-avatars.com/api/?name=${currentCourier.name}&background=F59E0B&color=fff`} alt="Profile" className="w-10 h-10 rounded-full border-2 border-orange-100 object-cover" />
          <div>
            <h1 className="font-bold text-sm leading-tight text-gray-800">{currentCourier.name}</h1>
            <p className="text-[10px] text-gray-500 flex items-center gap-1"><ShieldCheck size={10} className="text-green-500"/> Kurir Terverifikasi</p>
          </div>
        </div>
        <button onClick={handleLogoutKurir} className="p-2 bg-red-50 rounded-full hover:bg-red-100 transition-colors text-red-500" title="Ganti Akun">
          <LogOut size={18} />
        </button>
      </header>

      <div className="p-4 space-y-4 max-w-3xl mx-auto">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-[#F97316] to-[#EA580C] text-white p-4 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[10px] font-bold tracking-wider opacity-90">PESANAN TERSEDIA</p>
              <h2 className="text-3xl font-bold mt-1 mb-2">{orders.filter(o => !o.courier_id).length}</h2>
              <p className="text-[10px] bg-white/20 inline-flex items-center gap-1 px-2 py-1 rounded-full"><ClipboardList size={10}/> Siap Diambil</p>
            </div>
            <Package className="absolute -bottom-4 -right-2 text-white opacity-20 transform rotate-12" size={90} />
          </div>
          
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[10px] font-bold tracking-wider text-gray-500">TUGAS SAYA</p>
              <h2 className="text-3xl font-bold mt-1 mb-2 text-gray-800">{orders.filter(o => o.courier_id === currentCourier.id).length}</h2>
              <p className="text-[10px] text-green-600 font-bold flex items-center gap-1"><TrendingUp size={12}/> Sedang Diantar</p>
            </div>
            <CheckCircle className="absolute -bottom-4 -right-2 text-green-500 opacity-10" size={90} />
          </div>
        </div>

        <div className="bg-gray-100 p-1 rounded-xl flex">
          <button onClick={() => setActiveTab('aktif')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'aktif' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Daftar Tugas</button>
          <button onClick={() => setActiveTab('riwayat')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'riwayat' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Riwayat Tugas</button>
        </div>

        {activeTab === 'aktif' ? (
          <div>
            {loading ? (
              <p className="text-center text-gray-500 text-sm py-4">Memuat tugas...</p>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
                <Package className="mx-auto text-gray-300 mb-2" size={40} />
                <p className="text-gray-500 text-sm font-medium">Belum ada tugas saat ini.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const isMine = order.courier_id === currentCourier.id;

                  return (
                    <div key={order.id} className={`p-4 rounded-2xl shadow-sm border ${isMine ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'}`}>
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-1.5 text-gray-600 bg-white/50 px-2 py-1 rounded-md text-[10px] font-bold border border-gray-100">
                          <ClipboardList size={12}/> #{order.id.slice(0, 6)}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border ${isMine ? 'bg-orange-500 text-white border-orange-600' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                          {isMine ? <><Bike size={10}/> Tugas Anda</> : 'Tersedia'}
                        </span>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-start gap-2">
                          <User size={14} className="text-orange-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] text-gray-400">Penerima</p>
                            <span className="font-bold text-sm text-gray-800">{order.customer_name}</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin size={14} className="text-orange-500 mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <p className="text-[10px] text-gray-400">Tujuan Antar</p>
                            <span className="text-xs text-gray-700 font-medium">{order.address}</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-200/50 pt-3 flex justify-between items-center gap-3">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Total</p>
                          <p className="text-base font-bold text-orange-500">Rp {order.total_price.toLocaleString('id-ID')}</p>
                        </div>
                        
                        {isMine ? (
                          <button onClick={() => setSelectedOrder(order)} className="bg-[#F97316] text-white text-xs px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#EA580C] transition-colors shadow-md">
                            <CheckCircle size={16}/> Selesai & Bukti
                          </button>
                        ) : (
                          <button onClick={() => handleTakeTask(order.id)} className="bg-blue-600 text-white text-xs px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-md">
                            <Bike size={16}/> Ambil Tugas
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4">
            <h2 className="font-bold text-sm text-gray-800 mb-3">Riwayat Pengantaran</h2>
            {historyOrders.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
                <History className="mx-auto text-gray-300 mb-2" size={40} />
                <p className="text-gray-500 text-sm font-medium">Belum ada riwayat.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historyOrders.map((order) => (
                  <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-sm text-gray-800">{order.customer_name}</h3>
                        <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1"><History size={10}/> {new Date(order.updated_at).toLocaleString('id-ID')}</p>
                      </div>
                      <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 border border-green-100">
                        <CheckCircle size={10}/> Selesai
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                      <p className="text-[10px] text-gray-400">Nominal Pesanan</p>
                      <p className="text-sm font-bold text-orange-500">Rp {order.total_price.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleFinishOrder} className="bg-white p-6 rounded-2xl w-full max-w-sm space-y-4 shadow-2xl">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={24} />
              </div>
              <h2 className="font-bold text-lg">Konfirmasi Selesai</h2>
            </div>
            
            <div>
              <label className="text-xs text-gray-600 font-bold mb-2 block">Foto Bukti Terima</label>
              <input type="file" accept="image/*" onChange={e => setProofPhoto(e.target.files?.[0] || null)} className="w-full border p-2 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-orange-500 outline-none" required />
            </div>
            
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => { setSelectedOrder(null); setProofPhoto(null); }} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-200 transition-colors">Batal</button>
              <button type="submit" className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors shadow-md">Selesai</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}