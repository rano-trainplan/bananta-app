import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Clock, HelpCircle, Bike, FileText, CheckCircle2, ExternalLink, MessageCircle } from 'lucide-react';
import BottomNav from '../components/layout/BottomNav';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Profile() {
  const [storeSettings, setStoreSettings] = useState<any>(null);

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase.from('store_settings').select('*').eq('id', 1).single();
      if (data) setStoreSettings(data);
    }
    fetchSettings();
  }, []);

  // Ganti format nomor HP ke wa.me
  const waNumber = storeSettings?.store_phone 
    ? storeSettings.store_phone.replace(/^0/, '62').replace(/\D/g, '') 
    : '6282151855286';

  return (
    <div className="pb-24 min-h-screen bg-gray-50 relative">
      {/* HEADER */}
      <header className="bg-white p-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-bold text-base leading-tight">Profil & Bantuan</h1>
            <p className="text-[10px] text-gray-500">Restoran & Cafe Lelilef</p>
          </div>
        </div>
        <span className="bg-green-50 text-green-600 border border-green-100 px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Buka
        </span>
      </header>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        
        {/* KARTU PROFIL UTAMA */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-16 bg-orange-50/50"></div>

          {/* Avatar / Logo Toko */}
          <div className="relative mt-2 mb-3">
            <div className="w-20 h-20 bg-white rounded-full p-1 shadow-md relative z-10">
              {storeSettings?.store_logo ? (
                <img src={storeSettings.store_logo} alt="Logo" className="w-full h-full rounded-full object-contain bg-white" />
              ) : (
                <div className="w-full h-full rounded-full border-2 border-orange-500 flex items-center justify-center text-orange-500 text-4xl font-bold bg-orange-50/20">
                  {storeSettings?.store_name ? storeSettings.store_name.charAt(0) : 'B'}
                </div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 bg-green-500 text-white p-1 rounded-full border-2 border-white z-20 shadow-sm">
              <CheckCircle2 size={14} />
            </div>
          </div>

          <h2 className="font-bold text-xl text-gray-800 flex items-center justify-center gap-1">
            {storeSettings?.store_name || 'Bananta Sultan'} <span className="text-yellow-400 text-sm">⭐</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">Restoran & Cafe • Lelilef Waebulen</p>

          {/* Badges */}
          <div className="flex flex-wrap justify-center gap-2 mt-3 mb-5">
            <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-orange-100 flex items-center gap-1">
              ⭐ 4.9 (500+ Ulasan)
            </span>
            <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-gray-200">
              Halal Food
            </span>
            <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-100">
              Dine-In & Takeaway
            </span>
          </div>

          {/* Tombol Aksi */}
          <div className="flex w-full gap-2 relative z-10">
            <a href={`tel:${storeSettings?.store_phone || '082151855286'}`} className="flex-1 bg-gray-50 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
              <Phone size={14} /> Hubungi
            </a>
            <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" className="flex-1 bg-green-500 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-green-600 shadow-md transition-colors">
              <MessageCircle size={14} /> WhatsApp
            </a>
          </div>
        </div>

        {/* KARTU KONTAK & ALAMAT */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-2 space-y-1">
          
          {/* Alamat */}
          <div className="p-3 flex items-start gap-4 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group">
            <div className="bg-orange-50 p-2.5 rounded-xl text-orange-500 mt-0.5 group-hover:scale-110 transition-transform">
              <MapPin size={20} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Alamat Lengkap</p>
                <a href={`https://maps.google.com/?q=${storeSettings?.store_address || 'Lelilef Waebulen'}`} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-orange-500 flex items-center gap-1">
                  Maps <ExternalLink size={10}/>
                </a>
              </div>
              <p className="text-sm font-bold text-gray-800">Lelilef Waebulen</p>
              <div className="bg-orange-50/50 border border-orange-100/50 p-2 rounded-lg mt-1.5">
                <p className="text-[10px] text-gray-600 leading-relaxed">
                  <span className="font-bold text-orange-600">Patokan:</span> {storeSettings?.store_address || 'Depan Bank BRI Waebulen, samping jalan raya, kedai warna kuning.'}
                </p>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100 mx-4"></div>

          {/* Telepon */}
          <div className="p-3 flex items-start gap-4">
            <div className="bg-orange-50 p-2.5 rounded-xl text-orange-500 mt-0.5">
              <Phone size={20} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nomor Kontak Toko</p>
                <button onClick={() => { navigator.clipboard.writeText(storeSettings?.store_phone || '0821-5185-5286'); alert('Nomor disalin!') }} className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200 transition-colors">Salin</button>
              </div>
              <p className="text-sm font-bold text-orange-500 font-mono tracking-wider">{storeSettings?.store_phone || '0821-5185-5286'}</p>
              <p className="text-[10px] text-gray-500 mt-1">Tersedia untuk pengiriman & pertanyaan via WhatsApp.</p>
            </div>
          </div>

          <div className="h-px bg-gray-100 mx-4"></div>

          {/* Jam Operasional */}
          <div className="p-3 flex items-start gap-4">
            <div className="bg-orange-50 p-2.5 rounded-xl text-orange-500 mt-0.5">
              <Clock size={20} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Jam Buka & Tutup</p>
                <span className="bg-green-50 text-green-600 text-[9px] font-bold px-2 py-0.5 rounded border border-green-100">Hari Ini Buka</span>
              </div>
              <p className="text-sm font-bold text-gray-800">{storeSettings?.store_hours || '10.00 - 22.00 WIT'}</p>
              <p className="text-[10px] text-gray-500 mt-1">Buka setiap hari (Senin s/d Minggu).</p>
            </div>
          </div>
        </div>

        {/* BANTUAN & LAYANAN */}
        <div>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-2">Bantuan & Layanan</h3>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-2 space-y-1">
            
            <a href="#" className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-colors group">
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2 rounded-xl text-gray-500 group-hover:text-orange-500 transition-colors"><HelpCircle size={18}/></div>
                <div>
                  <p className="text-xs font-bold text-gray-800">Pertanyaan Umum (FAQ)</p>
                  <p className="text-[10px] text-gray-500">Cara order, pembayaran & ongkos kirim</p>
                </div>
              </div>
              <span className="text-gray-300 text-lg">›</span>
            </a>

            <a href="#" className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-colors group">
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2 rounded-xl text-gray-500 group-hover:text-orange-500 transition-colors"><Bike size={18}/></div>
                <div>
                  <p className="text-xs font-bold text-gray-800">Area Antar & Kurir Resto</p>
                  <p className="text-[10px] text-gray-500">Jangkauan kurir wilayah Lelilef & sekitar</p>
                </div>
              </div>
              <span className="text-gray-300 text-lg">›</span>
            </a>

            <a href="#" className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-2xl transition-colors group">
              <div className="flex items-center gap-3">
                <div className="bg-orange-50 p-2 rounded-xl text-orange-500"><FileText size={18}/></div>
                <div>
                  <p className="text-xs font-bold text-gray-800 flex items-center gap-2">Layanan Komplain & Saran</p>
                  <p className="text-[10px] text-gray-500">Kritik pelayanan untuk hasil lebih ramah</p>
                </div>
              </div>
              <span className="bg-orange-100 text-orange-600 text-[9px] font-bold px-2 py-1 rounded-md">Respon Cepat</span>
            </a>
          </div>
        </div>

        {/* FOOTER VERSI */}
        <div className="text-center pt-4 pb-2">
          <p className="text-[10px] text-gray-400 font-medium">{storeSettings?.store_name || 'Bananta Sultan'} Cafe & Resto • v1.4.0</p>
          <p className="text-[9px] text-gray-400 mt-0.5">Cita Rasa Terbaik untuk Pelanggan Setia</p>
        </div>

      </div>
      <BottomNav />
    </div>
  );
}