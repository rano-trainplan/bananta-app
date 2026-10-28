import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, MapPin, Package, Bike, LogOut, ShieldCheck, 
  Store, ArrowLeft, Lock, Power, Phone, X, Navigation, Search, ChevronRight, Clock, Calendar
} from 'lucide-react';
import AnimatedNumber from '../components/ui/AnimatedNumber';

export default function Courier() {
  const [orders, setOrders] = useState<any[]>([]);
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailOrder, setDetailOrder] = useState<any>(null); 
  const [proofPhoto, setProofPhoto] = useState<File | null>(null);
  
  const [activeTab, setActiveTab] = useState<'tugas' | 'riwayat' | 'pendapatan'>('tugas');

  // STATE SESSION
  const [couriers, setCouriers] = useState<any[]>([]);
  const [currentCourier, setCurrentCourier] = useState<any>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  
  // STATE PIN
  const [selectedCourierForLogin, setSelectedCourierForLogin] = useState<any>(null);
  const [pinInput, setPinInput] = useState('');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // STATE STATISTIK LOGIN
  const [loginStats, setLoginStats] = useState<Record<string, { active: number, done: number }>>({});
  const [totalActiveOrders, setTotalActiveOrders] = useState(0);

  // STATE PENDAPATAN & FILTER
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [totalIncome, setTotalIncome] = useState(0);

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
        if (payload.eventType === 'UPDATE' && payload.new.status === 'Mencari Kurir' && !payload.new.courier_id) {
          playNotificationSound();
          toast.success("Pesanan baru siap diantar!");
        }
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentCourier, startDate, endDate]);

  const playNotificationSound = () => {
    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    audio.play().catch(e => console.log(e));
    setTimeout(() => { audio.currentTime = 0; audio.play().catch(e => console.log(e)); }, 1000);
    setTimeout(() => { audio.currentTime = 0; audio.play().catch(e => console.log(e)); }, 2000);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance("Pesanan baru siap diantar!");
      utterance.lang = 'id-ID';
      setTimeout(() => window.speechSynthesis.speak(utterance), 1500);
    }
  };

  async function fetchData() {
    
    
    const { data: active } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .in('status', ['Mencari Kurir', 'Dikirim'])
      .or(`courier_id.is.null,courier_id.eq.${currentCourier.id}`) 
      .order('updated_at', { ascending: false });
    setOrders(active || []);

    const { data: history } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'Selesai')
      .eq('courier_id', currentCourier.id)
      .gte('updated_at', `${startDate}T00:00:00`)
      .lte('updated_at', `${endDate}T23:59:59`)
      .order('updated_at', { ascending: false });
    setHistoryOrders(history || []);

    const income = (history || []).reduce((sum, order) => sum + (order.shipping_cost || 0), 0);
    setTotalIncome(income);
   
  }

  const handleTakeTask = async (orderId: string) => {
    const { error } = await supabase.from('orders').update({ 
      courier_id: currentCourier.id,
      status: 'Dikirim'
    }).eq('id', orderId).is('courier_id', null);
    
    if (error) toast.error("Gagal ambil tugas. Mungkin sudah diambil kurir lain.");
    else { toast.success("Tugas berhasil diambil!"); fetchData(); }
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

  const handleToggleStatus = async () => {
    const newStatus = !currentCourier.is_active;
    const { error } = await supabase.from('couriers').update({ is_active: newStatus }).eq('id', currentCourier.id);
    if (!error) {
      setCurrentCourier({ ...currentCourier, is_active: newStatus });
      toast.success(newStatus ? "Anda sekarang Standby!" : "Anda sekarang Off.");
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

  // --- LAYAR LOGIN PIN ---
  if (!currentCourier) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col relative">
        <div className="bg-white px-4 py-3 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 text-orange-500 p-2 rounded-lg"><Store size={20} /></div>
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
              <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-orange-200"><Bike size={40} /></div>
              <div className="absolute bottom-0 right-0 bg-green-500 text-white p-1 rounded-full border-2 border-white"><CheckCircle size={14} /></div>
            </div>
            <h2 className="font-bold text-xl text-gray-800 mb-1">Pilih Identitas Kurir</h2>
            <p className="text-xs text-gray-500 leading-relaxed px-4">Pilih profil Anda dan masukkan PIN rahasia untuk mulai membuka daftar tugas.</p>
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
              {couriers.map((c) => {
                const isOnline = c.is_active; 
                return (
                  <div key={c.id} onClick={() => { if (isOnline) handleOpenPin(c); }} className={`bg-white rounded-2xl p-4 border transition-all ${isOnline ? 'border-orange-200 shadow-sm hover:shadow-md cursor-pointer relative overflow-hidden group' : 'border-gray-200 opacity-60 grayscale cursor-not-allowed'}`}>
                    {isOnline && <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-400"></div>}
                    <div className="flex gap-3">
                      <div className="relative shrink-0">
                        <img src={c.photo_url || `https://ui-avatars.com/api/?name=${c.name}&background=F59E0B&color=fff`} alt={c.name} className={`w-12 h-12 rounded-full object-cover border-2 ${isOnline ? 'border-orange-100' : 'border-gray-200'}`} />
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-sm text-gray-800">{c.name}</h4>
                            <p className="text-[10px] text-gray-500 mt-0.5 font-mono flex items-center gap-1"><Bike size={10}/> {c.vehicle_type || 'Motor'} • {c.plate_number}</p>
                          </div>
                          <div className={`flex items-center gap-1 text-[10px] font-bold ${isOnline ? 'text-orange-500' : 'text-gray-400'}`}>
                            {isOnline ? 'Masuk' : 'Buka'} <ArrowLeft size={12} className="rotate-180"/>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {isOnline ? (
                            <>
                              {loginStats[c.id]?.active > 0 ? <span className="bg-orange-500 text-white text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1"><Package size={10} /> {loginStats[c.id].active} Tugas Antar</span> : <span className="bg-green-100 text-green-700 text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1">Standby (Siap Antar)</span>}
                              <span className="text-[9px] text-gray-500 font-medium">{loginStats[c.id]?.done || 0} Antaran Selesai</span>
                            </>
                          ) : <span className="bg-gray-100 text-gray-500 text-[9px] font-bold px-2 py-1 rounded-md">Ishirahat / Off</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {isPinModalOpen && selectedCourierForLogin && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <form onSubmit={handleVerifyPin} className="bg-white p-6 rounded-3xl w-full max-w-sm space-y-5 shadow-2xl animate-fade-in-up">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-3"><Lock size={32} /></div>
                <h2 className="font-bold text-xl">Halo, {selectedCourierForLogin.name}</h2>
                <p className="text-xs text-gray-500 mt-1">Masukkan PIN rahasia Anda untuk melanjutkan.</p>
              </div>
              <div>
                <input type="password" maxLength={4} value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))} placeholder="••••" className="w-full bg-gray-50 border-2 border-gray-200 p-4 rounded-xl text-center text-3xl tracking-[1em] font-bold text-gray-800 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 outline-none transition-all" required autoFocus />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsPinModalOpen(false)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-200 transition-colors">Batal</button>
                <button type="submit" className="flex-[2] bg-[#F97316] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#EA580C] transition-colors shadow-md flex items-center justify-center gap-2"><ShieldCheck size={18} /> Verifikasi PIN</button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // --- LAYAR DASHBOARD KURIR (DESAIN BARU) ---
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER ATAS */}
      <header className="bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={currentCourier.photo_url || `https://ui-avatars.com/api/?name=${currentCourier.name}&background=F59E0B&color=fff`} alt="Profile" className="w-10 h-10 rounded-full border-2 border-orange-100 object-cover" />
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight text-gray-800">{currentCourier.name}</h1>
            <p className="text-[10px] text-gray-500 flex items-center gap-1"><ShieldCheck size={10} className="text-green-500"/> KURIR TERVERIFIKASI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleToggleStatus} className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-colors ${currentCourier.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            <Power size={14} /> {currentCourier.is_active ? 'Standby' : 'Off'}
          </button>
          <button onClick={handleLogoutKurir} className="p-2 bg-red-50 rounded-full hover:bg-red-100 transition-colors text-red-500"><LogOut size={16} /></button>
        </div>
      </header>

      <div className="p-4 space-y-4 max-w-3xl mx-auto">
        
        {/* TABS NAVIGATION */}
        <div className="bg-gray-100 p-1 rounded-xl flex">
          <button onClick={() => setActiveTab('tugas')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${activeTab === 'tugas' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            Tugas {orders.filter(o => o.courier_id === currentCourier.id).length > 0 && <span className="bg-orange-500 text-white text-[9px] px-1.5 rounded-full">{orders.filter(o => o.courier_id === currentCourier.id).length}</span>}
          </button>
          <button onClick={() => setActiveTab('riwayat')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'riwayat' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Riwayat</button>
          <button onClick={() => setActiveTab('pendapatan')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'pendapatan' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Pendapatan</button>
        </div>

        {/* KONTEN TAB TUGAS */}
        {activeTab === 'tugas' && (
          <div className="space-y-4">
            
            {/* TUGAS AKTIF SAYA */}
            {orders.filter(o => o.courier_id === currentCourier.id).length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="font-bold text-sm text-gray-800">PESANAN BERJALAN ({orders.filter(o => o.courier_id === currentCourier.id).length})</h2>
                  <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">Bananta Sultan Express</span>
                </div>
                
                {orders.filter(o => o.courier_id === currentCourier.id).map(order => (
                  <div key={order.id} className="bg-white rounded-3xl p-5 shadow-sm border-2 border-orange-200 mb-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-orange-600"></div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-bold bg-gray-100 px-2 py-1 rounded-md text-gray-600">#{order.id.slice(0, 6)}</span>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-orange-500 text-white flex items-center gap-1"><Bike size={10}/> Tugas Anda</span>
                    </div>

                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Penerima</p>
                    <h3 className="font-bold text-lg text-gray-800 mb-3">{order.customer_name}</h3>

                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mb-3 flex gap-3 items-start">
                      <MapPin className="text-orange-500 shrink-0 mt-0.5" size={16}/>
                      <div>
                        <p className="text-xs font-bold text-gray-800">{order.address}</p>
                        <p className="text-[10px] text-gray-500 mt-1">Area Pengantaran Kota • Patokan dekat masjid</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`} target="_blank" rel="noreferrer" className="bg-white border border-gray-200 text-gray-700 py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-gray-50">
                        <Navigation size={12} className="text-blue-500"/> Buka Maps
                      </a>
                      <a href={`https://wa.me/${order.phone}`} target="_blank" rel="noreferrer" className="bg-white border border-gray-200 text-gray-700 py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-gray-50">
                        <Phone size={12} className="text-green-500"/> Hubungi
                      </a>
                    </div>

                    <div className="flex justify-between items-end border-t border-dashed border-gray-200 pt-3">
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Total COD / Tagihan</p>
                        <p className="font-bold text-lg text-orange-500">Rp {order.total_price.toLocaleString('id-ID')}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setDetailOrder(order)} className="bg-white border border-gray-200 text-gray-600 text-xs px-3 py-2 rounded-xl font-bold flex items-center gap-1 shadow-sm">
                          <Search size={12}/> Detail
                        </button>
                        <button onClick={() => setSelectedOrder(order)} className="bg-[#F97316] text-white text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-1 shadow-md hover:bg-[#EA580C]">
                          <CheckCircle size={14}/> Selesai
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PESANAN TERSEDIA (REBUTAN) */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm text-gray-800">PESANAN SIAP DIAMBIL ({orders.filter(o => !o.courier_id).length})</h2>
                </div>
                <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1"><Package size={12}/> {orders.filter(o => !o.courier_id).length} Pesanan Baru</span>
              </div>

              {orders.filter(o => !o.courier_id).length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-sm">
                  <Package className="mx-auto text-gray-200 mb-3" size={48} />
                  <p className="text-gray-500 text-xs font-medium">Belum ada pesanan baru.</p>
                </div>
              ) : (
                orders.filter(o => !o.courier_id).map(order => (
                  <div key={order.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-3">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-gray-100 px-2 py-1 rounded-md text-gray-600">#{order.id.slice(0, 6)}</span>
                        <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1"><Clock size={10}/> 5 menit lalu</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-green-50 text-green-600 flex items-center gap-1 border border-green-100"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Tersedia</span>
                    </div>

                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Penerima</p>
                    <h3 className="font-bold text-lg text-gray-800 mb-3">{order.customer_name}</h3>

                    <div className="space-y-1.5 mb-4">
                      <p className="text-xs text-gray-600 flex items-center gap-2"><MapPin size={14} className="text-orange-500"/> {order.address}</p>
                      <p className="text-xs text-gray-600 flex items-center gap-2"><Navigation size={14} className="text-blue-500"/> Jarak: ~1.2 km • Total COD</p>
                    </div>

                    <div className="flex justify-between items-end border-t border-dashed border-gray-200 pt-4">
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Ongkir / Total</p>
                        <p className="font-bold text-xl text-orange-500">Rp {order.total_price.toLocaleString('id-ID')}</p>
                      </div>
                      <button onClick={() => handleTakeTask(order.id)} className="bg-blue-600 text-white text-xs px-5 py-2.5 rounded-xl font-bold flex items-center gap-1 shadow-md hover:bg-blue-700">
                        Ambil <ChevronRight size={14}/>
                      </button>
                    </div>
                  </div>
                ))
              )}
              
              <div className="bg-gray-100/50 p-3 rounded-2xl text-center border border-dashed border-gray-300 mt-4 flex items-center justify-center gap-2">
                <Search size={14} className="text-gray-400 animate-pulse"/>
                <p className="text-[10px] text-gray-500 font-medium">Mencari orderan terdekat lainnya...</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB RIWAYAT */}
        {activeTab === 'riwayat' && (
          <div className="space-y-3">
            <h2 className="font-bold text-sm text-gray-800 mb-3">Riwayat Pengantaran ({historyOrders.length})</h2>
            {historyOrders.map((order) => (
              <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-gray-800">{order.customer_name}</h3>
                  <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1"><CheckCircle size={10} className="text-green-500"/> Selesai • {new Date(order.updated_at).toLocaleString('id-ID')}</p>
                </div>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">+Rp {(order.shipping_cost || 0).toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>
        )}

        {/* TAB PENDAPATAN */}
        {activeTab === 'pendapatan' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 animate-fade-in-up relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-green-100 text-green-700 text-[9px] font-bold px-3 py-1.5 rounded-bl-xl">Siap Cair</div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Pendapatan</p>
              <h2 className="text-4xl font-bold text-gray-800 mb-2">Rp <AnimatedNumber value={totalIncome} /></h2>
              
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1"><CheckCircle size={10}/> {historyOrders.length} Pengantaran Selesai</span>
                <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1"><Clock size={10}/> 100% Tepat Waktu</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3 border-b pb-3">
                <Calendar size={16} className="text-orange-500"/>
                <h3 className="font-bold text-sm text-gray-800">PERIODE LAPORAN</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Dari</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Sampai</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
              <div className="flex gap-2">
                <button className="bg-orange-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Hari Ini</button>
                <button className="bg-gray-100 text-gray-600 text-[10px] font-bold px-3 py-1.5 rounded-lg">Minggu Ini</button>
                <button className="bg-gray-100 text-gray-600 text-[10px] font-bold px-3 py-1.5 rounded-lg">Bulan Ini</button>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm text-gray-800">Rincian Pengantaran</h3>
                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">{historyOrders.length} Order</span>
              </div>
              
              <div className="space-y-3 mb-4">
                {historyOrders.map(o => (
                  <div key={o.id} className="flex justify-between items-center">
                    <div className="flex gap-3 items-center">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400"><Bike size={14}/></div>
                      <div>
                        <p className="text-xs font-bold text-gray-800 flex items-center gap-1">#{o.id.slice(0,6)} <span className="text-gray-400 font-normal">{o.customer_name}</span></p>
                        <p className="text-[10px] text-gray-500 flex items-center gap-1"><CheckCircle size={10} className="text-green-500"/> Selesai {new Date(o.updated_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})} WIT</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-green-600">+Rp {(o.shipping_cost || 0).toLocaleString('id-ID')}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed pt-3 space-y-2">
                <div className="flex justify-between text-xs text-gray-500"><span>Subtotal Ongkos Kirim</span><span>Rp {totalIncome.toLocaleString('id-ID')}</span></div>
                <div className="flex justify-between text-xs text-gray-500"><span>Bonus & Tips</span><span>Rp 0</span></div>
                <div className="flex justify-between text-xs text-gray-500"><span>Potongan Layanan</span><span className="text-green-600 font-bold">Gratis (0%)</span></div>
                <div className="flex justify-between text-sm font-bold text-orange-500 pt-2 border-t mt-2"><span>Total Bersih Diterima</span><span>Rp {totalIncome.toLocaleString('id-ID')}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DETAIL PESANAN (DESAIN BARU) */}
      {detailOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 max-h-[90vh]">
            
            <div className="p-5 flex justify-between items-start border-b border-gray-100">
              <div>
                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-1">BANANTA SULTAN EXPRESS</p>
                <h2 className="font-bold text-xl text-gray-800">Detail Tugas</h2>
              </div>
              <button type="button" onClick={() => setDetailOrder(null)} className="p-1.5 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors">
                <X size={18}/>
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 bg-gray-50/50">
              
              <div className="flex justify-between items-center bg-white border border-gray-100 p-3 rounded-xl shadow-sm">
                <p className="text-xs text-gray-500">Order ID: <span className="font-bold text-gray-800">#{detailOrder.id.slice(0,6)}</span></p>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-600 flex items-center gap-1 border border-blue-100"><Bike size={10}/> Sedang Diantar</span>
              </div>

              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Nama Pelanggan</p>
                <h3 className="font-bold text-lg text-gray-800">{detailOrder.customer_name}</h3>
              </div>

              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">No. HP (Klik untuk Chat)</p>
                <div className="bg-green-50 border border-green-100 p-3 rounded-xl flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-green-600"/>
                    <span className="font-bold text-sm text-green-800">{detailOrder.phone}</span>
                  </div>
                  <a href={`https://wa.me/${detailOrder.phone}`} target="_blank" rel="noreferrer" className="bg-white text-green-600 text-[10px] font-bold px-3 py-1.5 rounded-md shadow-sm border border-green-200">Kirim Pesan &gt;</a>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Alamat Lengkap</p>
                <div className="bg-white border border-gray-100 p-3 rounded-xl flex gap-3 items-start shadow-sm">
                  <MapPin size={18} className="text-orange-500 shrink-0 mt-0.5"/>
                  <div>
                    <p className="text-xs font-bold text-gray-800">{detailOrder.address}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Antar sesuai titik lokasi pelanggan</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                <div className="flex justify-between items-center border-b pb-2 mb-3">
                  <p className="text-xs font-bold text-gray-800">RINCIAN MENU</p>
                  <p className="text-[9px] font-bold text-gray-400">{detailOrder.order_items?.length || 0} Item Pesanan</p>
                </div>
                
                <div className="space-y-3 mb-4">
                  {detailOrder.order_items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-xs text-gray-800">{item.quantity}x {item.product_name}</p>
                        <p className="text-[10px] text-gray-400">Porsi {item.quantity} • Renyah Gurih</p>
                      </div>
                      <p className="font-bold text-xs text-gray-800">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed pt-3 space-y-2">
                  <div className="flex justify-between text-[10px] text-gray-500"><span>Subtotal Menu</span><span>Rp {(detailOrder.total_price - (detailOrder.shipping_cost || 0)).toLocaleString('id-ID')}</span></div>
                  <div className="flex justify-between text-[10px] text-gray-500"><span>Ongkos Kirim</span><span>Rp {(detailOrder.shipping_cost || 0).toLocaleString('id-ID')}</span></div>
                  <div className="flex justify-between text-sm font-bold text-gray-800 pt-2 border-t mt-2"><span>Total Tagihan</span><span className="text-orange-500">Rp {detailOrder.total_price.toLocaleString('id-ID')}</span></div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-white flex gap-2">
              <button onClick={() => setDetailOrder(null)} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors">Tutup</button>
              <button onClick={() => { setDetailOrder(null); setSelectedOrder(detailOrder); }} className="flex-1 bg-orange-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-orange-600 shadow-md transition-colors">
                <CheckCircle size={16}/> Selesaikan Pengantaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL UPLOAD BUKTI (SELESAI) */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleFinishOrder} className="bg-white p-6 rounded-3xl w-full max-w-sm space-y-4 shadow-2xl">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3"><CheckCircle size={24} /></div>
              <h2 className="font-bold text-lg">Konfirmasi Selesai</h2>
              <p className="text-xs text-gray-500 mt-1">Pastikan Anda mengambil foto bukti serah terima atau struk saat menyelesaikan pesanan.</p>
            </div>
            
            <div>
              <label className="text-xs text-gray-600 font-bold mb-2 block">Foto Bukti Terima</label>
              <input type="file" accept="image/*" onChange={e => setProofPhoto(e.target.files?.[0] || null)} className="w-full border border-gray-200 p-2 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-orange-500 outline-none" required />
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