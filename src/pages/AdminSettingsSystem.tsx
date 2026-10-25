import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import AdminLayout from '../components/layout/AdminLayout';
import { Store, MapPin, Phone, Clock, Upload, X, Save, Image as ImageIcon, Tag, AlignLeft, MousePointerClick } from 'lucide-react';

export default function AdminSettingsSystem() {
  const [form, setForm] = useState({
    storeName: '',
    storeAddress: '',
    storePhone: '',
    storeHours: '',
    storeLogo: '',
    promoTitle: '',
    promoSubtitle: '',
    promoBadge: ''
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('store_settings').select('*').eq('id', 1).single();
      if (data) {
        setForm({
          storeName: data.store_name || '',
          storeAddress: data.store_address || '',
          storePhone: data.store_phone || '',
          storeHours: data.store_hours || '',
          storeLogo: data.store_logo || '',
          promoTitle: data.promo_title || '',
          promoSubtitle: data.promo_subtitle || '',
          promoBadge: data.promo_badge || ''
        });
        setPreviewLogo(data.store_logo || null);
      }
    }
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setLogoFile(file); setPreviewLogo(URL.createObjectURL(file)); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let logoUrl = form.storeLogo;
      
      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const fileName = `logo-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('uploads').upload(fileName, logoFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);
        logoUrl = data.publicUrl;
      }

      const { error } = await supabase.from('store_settings').update({
        store_name: form.storeName,
        store_address: form.storeAddress,
        store_phone: form.storePhone,
        store_hours: form.storeHours,
        store_logo: logoUrl,
        promo_title: form.promoTitle,
        promo_subtitle: form.promoSubtitle,
        promo_badge: form.promoBadge
      }).eq('id', 1);

      if (error) throw error;
      toast.success("Pengaturan sistem berhasil disimpan!");
      setLogoFile(null);
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan pengaturan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      {/* HEADER PAGE */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-orange-100 text-orange-600 p-1.5 rounded-lg"><Store size={16}/></span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Konfigurasi</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Pengaturan Sistem</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-lg">Atur identitas utama usaha, logo, dan banner promo yang akan tampil di seluruh aplikasi pelanggan.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* KOLOM KIRI: LOGO */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><ImageIcon size={18} className="text-orange-500"/> Logo Usaha</h3>
              
              <div className="flex flex-col items-center">
                {previewLogo ? (
                  <div className="relative mb-4 group">
                    <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-200 p-2 bg-gray-50 flex items-center justify-center overflow-hidden">
                      <img src={previewLogo} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => { setLogoFile(null); setPreviewLogo(null); setForm({...form, storeLogo: ''}) }} 
                      className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16}/>
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 mb-4 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                    <ImageIcon size={32} className="mb-2 opacity-50" />
                    <span className="text-[10px] font-medium">Belum ada logo</span>
                  </div>
                )}
                
                <div className="w-full relative">
                  <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  <button type="button" className="w-full bg-orange-50 text-orange-600 border border-orange-100 py-2.5 rounded-xl text-xs font-bold hover:bg-orange-100 transition-colors flex items-center justify-center gap-2">
                    <Upload size={14} /> Pilih File Logo
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-3 text-center">Format PNG, JPG.<br/>Rekomendasi rasio 1:1 (Kotak).</p>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: INFORMASI & PROMO */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* CARD INFORMASI */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-4"><Store size={18} className="text-orange-500"/> Informasi Utama Toko</h3>
              
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1.5 block">Nama Usaha</label>
                <div className="relative">
                  <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input name="storeName" value={form.storeName} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all" placeholder="Cth: Bananta Sultan" required />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 mb-1.5 block">Alamat Lengkap</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 text-gray-400" size={18} />
                  <textarea name="storeAddress" value={form.storeAddress} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none h-24 resize-none transition-all" placeholder="Cth: Lelilef Waebulen, Depan Bank BRI..." required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1.5 block">Nomor Telepon / WA</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input name="storePhone" value={form.storePhone} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all" placeholder="Cth: 0821xxxxxx" required />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1.5 block">Jam Buka & Tutup</label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input name="storeHours" value={form.storeHours} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all" placeholder="Cth: 10.00 - 22.00 WIT" required />
                  </div>
                </div>
              </div>
            </div>

            {/* CARD PROMO */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-4"><Tag size={18} className="text-orange-500"/> Banner Promo (Halaman Utama)</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1.5 block">Judul Promo</label>
                  <div className="relative">
                    <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input name="promoTitle" value={form.promoTitle} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all" placeholder="Cth: Diskon 25% Hari Ini!" />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1.5 block">Teks Sub-Judul Promo</label>
                  <div className="relative">
                    <AlignLeft className="absolute left-3.5 top-3 text-gray-400" size={18} />
                    <input name="promoSubtitle" value={form.promoSubtitle} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all" placeholder="Cth: Nikmati promo spesial untuk semua menu makanan." />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1.5 block">Teks Tombol Promo</label>
                  <div className="relative">
                    <MousePointerClick className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input name="promoBadge" value={form.promoBadge} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all" placeholder="Cth: Ambil Promo" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* TOMBOL SIMPAN FIXED BOTTOM / ATAS */}
        <div className="flex justify-end pt-4 pb-12">
          <button type="submit" disabled={loading} className="bg-brand-500 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-brand-600 transition-all disabled:opacity-50 flex items-center gap-2">
            <Save size={18} /> {loading ? 'Menyimpan Data...' : 'Simpan Semua Pengaturan'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}