import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/layout/AdminLayout';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Upload, X, Search, Filter, Tag, BookOpen, ShieldCheck } from 'lucide-react';

export default function AdminMenu() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    id: '', name: '', price: '', price_friday: '', category: 'Makanan', description: '', image_url: '', is_active: true, stock: '0' 
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').order('name');
    setProducts(data || []);
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    await supabase.from('products').update({ is_active: newStatus, status: newStatus ? 'aktif' : 'nonaktif' }).eq('id', id);
    toast.success(`Menu di-${newStatus ? 'aktifkan' : 'nonaktifkan'}`);
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin mau hapus menu ini?')) return;
    await supabase.from('products').delete().eq('id', id);
    toast.success('Menu dihapus');
    fetchProducts();
  };

  const openModal = (product?: any) => {
    if (product) {
      setFormData({
        id: product.id,
        name: product.name,
        price: product.price,
        price_friday: product.price_friday || '',
        category: product.category,
        description: product.description || '',
        image_url: product.image_url || '',
        is_active: product.is_active ?? true,
        stock: product.stock ?? 0
      });
      setPreviewUrl(product.image_url || null);
    } else {
      setFormData({ id: '', name: '', price: '', price_friday: '', category: 'Makanan', description: '', image_url: '', is_active: true, stock: '0' });
      setPreviewUrl(null);
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setImageFile(file); setPreviewUrl(URL.createObjectURL(file)); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let finalImageUrl = formData.image_url;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `menu-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('uploads').upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
        finalImageUrl = urlData.publicUrl;
      }

      const payload = {
        name: formData.name,
        price: Number(formData.price),
        price_friday: formData.price_friday ? Number(formData.price_friday) : null,
        category: formData.category,
        description: formData.description,
        image_url: finalImageUrl,
        is_active: formData.is_active,
        status: formData.is_active ? 'aktif' : 'nonaktif',
        stock: Number(formData.stock)
      };

      if (formData.id) {
        await supabase.from('products').update(payload).eq('id', formData.id);
        toast.success('Menu diupdate!');
      } else {
        await supabase.from('products').insert([payload]);
        toast.success('Menu ditambahkan!');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan menu.");
    }
  };

  const totalMenu = products.length;
  const totalPromo = products.filter(p => p.price_friday).length;
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Katalog Dapur</h1>
        <p className="text-sm text-gray-500 mt-1">Sultan Kitchen Admin Panel</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="bg-orange-100 p-2.5 rounded-xl text-orange-500"><BookOpen size={20}/></div>
          <div>
            <p className="text-xs text-gray-500 font-bold">Total Menu</p>
            <h3 className="text-lg font-bold text-gray-800">{totalMenu} Menu</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="bg-red-100 p-2.5 rounded-xl text-red-500"><Tag size={20}/></div>
          <div>
            <p className="text-xs text-gray-500 font-bold">Promo Spesial</p>
            <h3 className="text-lg font-bold text-gray-800">{totalPromo} Menu</h3>
          </div>
        </div>
      </div>

      <button onClick={() => openModal()} className="w-full bg-[#F59E0B] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:bg-[#D97706] transition-colors mb-4">
        <Plus size={18} /> Tambah Menu Baru
      </button>

      <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex items-center gap-2 mb-4">
        <Search size={18} className="text-gray-400" />
        <input 
          type="text" 
          placeholder="Cari produk, kode..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-sm font-medium text-gray-700 outline-none" 
        />
        <div className="bg-gray-100 p-1.5 rounded-lg text-gray-500"><Filter size={16}/></div>
      </div>

      <div className="space-y-3">
        {filteredProducts.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex gap-3 items-center">
            <img src={p.image_url || 'https://placehold.co/100x100?text=No+Image'} alt={p.name} className="w-20 h-20 rounded-xl object-cover" />
            
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">{p.category}</span>
                  <h3 className="font-bold text-sm text-gray-800 leading-tight">{p.name}</h3>
                  <p className="text-[10px] font-bold text-gray-400 mt-0.5">Stok: {p.stock ?? 0}</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={p.is_active ?? true} 
                    onChange={() => handleToggleStatus(p.id, p.is_active ?? true)} 
                  />
                  <span className="slider"></span>
                </label>
              </div>
              
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm font-bold text-orange-500">Rp {p.price.toLocaleString('id-ID')}</p>
                {p.price_friday && (
                  <span className="bg-red-100 text-red-500 text-[9px] font-bold px-1.5 py-0.5 rounded">Promo</span>
                )}
              </div>

              <div className="flex gap-3 mt-2">
                <button onClick={() => openModal(p)} className="text-[10px] font-bold text-gray-600 flex items-center gap-1 hover:text-orange-500">
                  <Edit size={12}/> Edit
                </button>
                <button onClick={() => handleDelete(p.id)} className="text-[10px] font-bold text-red-500 flex items-center gap-1 hover:text-red-700">
                  <Trash2 size={12}/> Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-orange-50 border border-orange-100 rounded-xl p-4 flex gap-3 items-start">
        <ShieldCheck className="text-orange-500 shrink-0 mt-0.5" size={18} />
        <div>
          <p className="font-bold text-xs text-orange-600">Tips Dapur Lezat!</p>
          <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">Pastikan deskripsi menu selalu mencantumkan bahan utama agar pelanggan yakin dengan pilihannya.</p>
        </div>
      </div>

      {/* MODAL TAMBAH/EDIT MENU */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden flex flex-col max-h-[95vh]">
            
            <div className="p-5 flex justify-between items-start border-b border-gray-100">
              <div>
                <h2 className="font-bold text-xl text-gray-800">{formData.id ? 'Edit Menu' : 'Tambah Menu Baru'}</h2>
                <p className="text-[10px] text-gray-500 mt-1">Sultan Kitchen Admin Panel</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 bg-gray-100 text-gray-400 rounded-full hover:bg-gray-200"><X size={16}/></button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto">
              
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Upload Gambar Menu</label>
                {previewUrl ? (
                  <div className="relative mb-2">
                    <img src={previewUrl} alt="Preview" className="w-full h-40 object-cover rounded-xl border border-gray-200" />
                    <button type="button" onClick={() => { setImageFile(null); setPreviewUrl(null); }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5"><X size={14}/></button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer relative hover:bg-gray-50">
                    <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <div className="w-10 h-10 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-2"><Upload size={20} /></div>
                    <p className="text-xs font-bold text-gray-700">Ketik untuk upload foto menu</p>
                    <p className="text-[10px] text-gray-400 mt-1">Format JPG, PNG (Maks. 2MB)</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Nama Menu <span className="text-red-500">*</span></label>
                <input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="Contoh: Ayam Geprek Sambal Korek" 
                  className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none" 
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 block">Harga Normal <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                    <input 
                      type="number" 
                      value={formData.price} 
                      onChange={e => setFormData({...formData, price: e.target.value})} 
                      placeholder="20.000" 
                      className="w-full bg-gray-50 border border-gray-200 p-2.5 pl-9 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none" 
                      required 
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-gray-700">Harga Jumat</label>
                    <span className="bg-green-100 text-green-600 text-[9px] font-bold px-1.5 rounded">Promo</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                    <input 
                      type="number" 
                      value={formData.price_friday || ''} 
                      onChange={e => setFormData({...formData, price_friday: e.target.value})} 
                      placeholder="18.000" 
                      className="w-full bg-gray-50 border border-gray-200 p-2.5 pl-9 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none" 
                    />
                  </div>
                </div>
              </div>

              {/* TAMBAHAN INPUT STOK */}
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Jumlah Stok Tersedia <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📦</span>
                  <input 
                    type="number" 
                    value={formData.stock} 
                    onChange={e => setFormData({...formData, stock: e.target.value})} 
                    placeholder="cth: 50" 
                    className="w-full bg-gray-50 border border-gray-200 p-2.5 pl-9 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none" 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Kategori <span className="text-red-500">*</span></label>
                <select 
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})} 
                  className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option>Makanan</option>
                  <option>Minuman</option>
                  <option>Snack & Dessert</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Deskripsi Menu</label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="Tuliskan bahan, rasa, porsi, atau level kepedasan..." 
                  className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-sm h-20 resize-none focus:ring-2 focus:ring-orange-500 outline-none" 
                />
              </div>

              <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-gray-800">Status Menu</p>
                  <p className="text-[10px] text-gray-500">Langsung aktifkan di menu pemesanan pelanggan</p>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={formData.is_active} 
                    onChange={e => setFormData({...formData, is_active: e.target.checked})} 
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-200 transition-colors">Batal</button>
                <button type="submit" className="flex-1 bg-[#F59E0B] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#D97706] transition-colors shadow-md flex justify-center items-center gap-2">
                  <Plus size={16}/> Simpan Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}