import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, MapPin, Package, Bike, 
  LogOut, ShieldCheck, Store, ArrowLeft, Lock, 
  Power, Wallet
} from 'lucide-react';
import AnimatedNumber from '../components/ui/AnimatedNumber';

export default function Courier() {
  const [orders, setOrders] = useState<any[]>([]);
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [proofPhoto, setProofPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
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
        if (payload.eventType === 'UPDATE' && payload.new.status === 'Dikirim' && !payload.new.courier_id) {
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
    audio.play().catch(e => console.log('Audio block by browser', e));
  };

  async function fetchData() {
    setLoading(true);
    
    // Ambil Tugas
    const { data: active } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'Dikirim')
      .or(`courier_id.is.null,courier_id.eq.${currentCourier.id}`) 
      .order('updated_at', { ascending: false });
    setOrders(active || []);

    // Ambil Riwayat & Hitung Pendapatan
    const { data: history } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'Selesai')
      .eq('courier_id', currentCourier.id)
      .gte('updated_at', `${startDate}T00:00:00`)
      .lte('updated_at', `${endDate}T23:59:59`)
      .order('updated_at', { ascending: false });
      
    setHistoryOrders(history || []);

    // LOGIKA PENDAPATAN (Misal: Rp 5.000 per antar)
    const komisiPerTugas = 5000;
    const income = (history || []).length * komisiPerTugas;
    setTotalIncome(income);

    setLoading(false);
  }

  const handleToggleStatus = async () => {
    const newStatus = !currentCourier.is_active;
    const { error } = await supabase.from('couriers').update({ is_active: newStatus }).eq('id', currentCourier.id);
    if (!error) {
      setCurrentCourier({ ...currentCourier, is_active: newStatus });
      toast.success(newStatus ? "Anda sekarang Standby!" : "Anda sekarang Off.");
    }
  };

  const handleTakeTask = async (orderId: string) => {
    const { error } = await supabase.from('orders').update({ courier_id: currentCourier.id }).eq('id', orderId).is('courier_id', null);
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
        {/* Header & Hero Section sama kayak sebelumnya */}
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

  // --- LAYAR DASHBOARD KURIR ---
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
          <button onClick={() => setActiveTab('tugas')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'tugas' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Tugas</button>
          <button onClick={() => setActiveTab('riwayat')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'riwayat' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Riwayat</button>
          <button onClick={() => setActiveTab('pendapatan')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'pendapatan' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Pendapatan</button>
        </div>

        {/* KONTEN TAB */}
        {activeTab === 'tugas' && (
          <div>
            {loading ? <p className="text-center text-gray-500 text-sm py-4">Memuat...</p> : orders.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm"><Package className="mx-auto text-gray-300 mb-2" size={40} /><p className="text-gray-500 text-sm font-medium">Belum ada tugas.</p></div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const isMine = order.courier_id === currentCourier.id;
                  return (
                    <div key={order.id} className={`p-4 rounded-2xl shadow-sm border ${isMine ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'}`}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-bold bg-gray-100 px-2 py-1 rounded">#{order.id.slice(0, 6)}</span>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${isMine ? 'bg-orange-500 text-white' : 'bg-blue-50 text-blue-600'}`}>{isMine ? 'Tugas Anda' : 'Tersedia'}</span>
                      </div>
                      <div className="space-y-2 mb-3 text-xs">
                        <p className="font-bold text-gray-800">{order.customer_name}</p>
                        <p className="text-gray-500 flex items-center gap-1"><MapPin size={12}/> {order.address}</p>
                      </div>
                      <div className="border-t border-gray-200/50 pt-3 flex justify-between items-center">
                        <p className="font-bold text-orange-500 text-sm">Rp {order.total_price.toLocaleString('id-ID')}</p>
                        {isMine ? (
                          <button onClick={() => setSelectedOrder(order)} className="bg-[#F97316] text-white text-xs px-4 py-2 rounded-xl font-bold hover:bg-[#EA580C]">Selesai</button>
                        ) : (
                          <button onClick={() => handleTakeTask(order.id)} className="bg-blue-600 text-white text-xs px-4 py-2 rounded-xl font-bold hover:bg-blue-700">Ambil</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'pendapatan' && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-100 text-green-600 p-3 rounded-full"><Wallet size={24}/></div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Pendapatan</p>
                <h2 className="text-3xl font-bold text-gray-800">Rp <AnimatedNumber value={totalIncome} /></h2>
              </div>
            </div>

            <div className="flex gap-2 mb-4 bg-gray-50 p-2 rounded-xl border">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-gray-500 block mb-1">Dari</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-white border p-2 rounded-lg text-xs" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-gray-500 block mb-1">Sampai</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-white border p-2 rounded-lg text-xs" />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 text-center">*Pendapatan dihitung Rp 5.000 / tugas selesai.</p>
          </div>
        )}

        {activeTab === 'riwayat' && (
          <div className="space-y-3">
            <h2 className="font-bold text-sm text-gray-800 mb-3">Riwayat ({historyOrders.length})</h2>
            {historyOrders.map((order) => (
              <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-sm text-gray-800">{order.customer_name}</h3>
                    <p className="text-[10px] text-gray-500 mt-1">{new Date(order.updated_at).toLocaleString('id-ID')}</p>
                  </div>
                  <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-[10px] font-bold">Selesai</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL UPLOAD BUKTI */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleFinishOrder} className="bg-white p-6 rounded-2xl w-full max-w-sm space-y-4">
            <h2 className="font-bold text-lg text-center">Selesaikan Tugas</h2>
            <input type="file" accept="image/*" onChange={e => setProofPhoto(e.target.files?.[0] || null)} className="w-full border p-2 rounded-xl text-sm" required />
            <div className="flex gap-2">
              <button type="button" onClick={() => setSelectedOrder(null)} className="flex-1 bg-gray-100 py-2 rounded-xl font-bold">Batal</button>
              <button type="submit" className="flex-1 bg-orange-500 text-white py-2 rounded-xl font-bold">Selesai</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}