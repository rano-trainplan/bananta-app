import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/layout/AdminLayout';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Bike, Phone, Upload, X, ShieldCheck, User, Lock } from 'lucide-react';

export default function AdminCouriers() {
  const [couriers, setCouriers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    id: '', name: '', phone: '', plate_number: '', photo_url: '', 
    vehicle_type: '', is_active: true, pin: '' 
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => { fetchCouriers(); }, []);

  async function fetchCouriers() {
    const { data } = await supabase.from('couriers').select('*').order('name');
    setCouriers(data || []);
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin mau hapus kurir ini?')) return;
    await supabase.from('couriers').delete().eq('id', id);
    toast.success('Kurir dihapus');
    fetchCouriers();
  };

  const openModal = (courier?: any) => {
    if (courier) {
      setFormData({
        id: courier.id,
        name: courier.name,
        phone: courier.phone || '',
        plate_number: courier.plate_number || '',
        photo_url: courier.photo_url || '',
        vehicle_type: courier.vehicle_type || '',
        is_active: courier.is_active ?? true,
        pin: courier.pin || ''
      });
      setPreviewUrl(courier.photo_url || null);
    } else {
      setFormData({ id: '', name: '', phone: '', plate_number: '', photo_url: '', vehicle_type: '', is_active: true, pin: '' });
      setPreviewUrl(null);
    }
    setPhotoFile(null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setPhotoFile(file); setPreviewUrl(URL.createObjectURL(file)); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let finalPhotoUrl = formData.photo_url;
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `courier-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('uploads').upload(fileName, photoFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
        finalPhotoUrl = urlData.publicUrl;
      }

      const payload = {
        name: formData.name,
        phone: formData.phone,
        plate_number: formData.plate_number,
        photo_url: finalPhotoUrl,
        vehicle_type: formData.vehicle_type,
        is_active: formData.is_active,
        pin: formData.pin
      };

      if (formData.id) {
        await supabase.from('couriers').update(payload).eq('id', formData.id);
        toast.success('Data kurir diupdate!');
      } else {
        await supabase.from('couriers').insert([payload]);
        toast.success('Kurir baru ditambahkan!');
      }
      setIsModalOpen(false);
      fetchCouriers();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan kurir.");
    }
  };

  const totalKurir = couriers.length;
  const siapJalan = couriers.filter(c => c.is_active).length;
  const sedangJalan = totalKurir - siapJalan;

  return (
    <AdminLayout>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Kurir</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data pengantar yang terdaftar...</p>
        </div>
        <button onClick={() => openModal()} className="bg-[#F59E0B] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm shadow-md hover:bg-[#D97706] transition-colors">
          <Plus size={18} /> Tambah Kurir
        </button>
      </div>

      <div className="bg-white rounded-full px-5 py-3 shadow-sm border border-gray-100 mb-6 flex justify-between items-center max-w-md">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
          <span className="text-sm font-bold text-gray-700">{totalKurir} Kurir Terdaftar</span>
        </div>
        <div className="flex gap-4 text-xs font-bold">
          <span className="text-green-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> {siapJalan} Siap</span>
          <span className="text-orange-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> {sedangJalan} Jalan</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 max-w-3xl">
        {couriers.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="relative">
                  <img 
                    src={c.photo_url || `https://ui-avatars.com/api/?name=${c.name}&background=F59E0B&color=fff`} 
                    alt={c.name} 
                    className="w-14 h-14 rounded-full object-cover border-2 border-gray-100" 
                  />
                  {c.is_active && (
                    <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full">
                      <div className="bg-green-500 w-3 h-3 rounded-full border-2 border-white"></div>
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-800 text-lg">{c.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.is_active ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-gray-100 text-gray-500'}`}>
                      {c.is_active ? 'Aktif • Siap Antar' : 'Nonaktif'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1"><Phone size={12}/> {c.phone || '-'}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => openModal(c)} className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"><Edit size={16}/></button>
                <button onClick={() => handleDelete(c.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"><Trash2 size={16}/></button>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-200 my-4"></div>

            <div className="flex justify-between items-center text-xs">
              <span className="bg-orange-50 text-orange-600 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <Bike size={14}/> {c.plate_number}
              </span>
              <span className="text-gray-500 font-medium">{c.vehicle_type || 'Motor'}</span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[95vh]">
            
            <div className="bg-orange-50 p-5 flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-0.5">Armada Baru</p>
                <h2 className="font-bold text-xl text-gray-800">{formData.id ? 'Edit Kurir' : 'Tambah Kurir Baru'}</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 bg-white text-gray-400 rounded-full hover:bg-gray-100"><X size={16}/></button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto">
                            <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Jenis / Merk Motor</label>
                <div className="relative">
                  <Bike className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    value={formData.vehicle_type} 
                    onChange={e => setFormData({...formData, vehicle_type: e.target.value})} 
                    placeholder="Contoh: Honda Vario 160 Hitam" 
                    className="w-full bg-gray-50 border border-gray-200 p-2.5 pl-9 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-orange-500 outline-none" 
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Foto Profil Kurir</label>
                {previewUrl ? (
                  <div className="relative inline-block">
                    <img src={previewUrl} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-orange-200" />
                    <button type="button" onClick={() => { setPhotoFile(null); setPreviewUrl(null); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={12}/></button>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3 cursor-pointer relative">
                    <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <div className="bg-white p-2 rounded-lg text-orange-400 shadow-sm"><Upload size={20} /></div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-700">Unggah Foto Profil</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Nama Lengkap Kurir <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="Contoh: Alex Pratama" 
                    className="w-full bg-gray-50 border border-gray-200 p-2.5 pl-9 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none" 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Nomor WhatsApp / HP <span className="text-red-500">*</span></label>
                <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-orange-500">
                  <div className="px-3 border-r border-gray-200 flex items-center gap-1 text-sm font-bold text-gray-600">
                    <Phone size={14} className="text-orange-500"/> +62
                  </div>
                  <input 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    placeholder="812-xxxx-xxxx" 
                    className="w-full bg-transparent p-2.5 text-sm outline-none" 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Plat Nomor Kendaraan <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Bike className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    value={formData.plate_number} 
                    onChange={e => setFormData({...formData, plate_number: e.target.value})} 
                    placeholder="CONTOH: DG 6598 SRN" 
                    className="w-full bg-gray-50 border border-gray-200 p-2.5 pl-9 rounded-xl text-sm font-mono font-bold text-gray-700 focus:ring-2 focus:ring-orange-500 outline-none" 
                    required 
                  />
                </div>
              </div>

              {/* INPUT PIN BARU */}
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                <label className="text-xs font-bold text-gray-800 mb-1 block flex items-center gap-1"><Lock size={12}/> PIN Rahasia Kurir (4 Angka)</label>
                <input 
                  type="text"
                  maxLength={4}
                  value={formData.pin} 
                  onChange={e => setFormData({...formData, pin: e.target.value.replace(/\D/g, '')})} 
                  placeholder="Contoh: 1234" 
                  className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-sm font-bold tracking-widest focus:ring-2 focus:ring-orange-500 outline-none" 
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-200 transition-colors">Batal</button>
                <button type="submit" className="flex-1 bg-[#F59E0B] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#D97706] transition-colors shadow-md flex justify-center items-center gap-2">
                  <ShieldCheck size={16}/> Simpan Kurir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}