import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import AdminLayout from '../components/layout/AdminLayout';
import { Building2, User, CreditCard, Upload, QrCode, ShieldCheck, X } from 'lucide-react';

export default function AdminSettings() {
  const [form, setForm] = useState({
    bank1Name: '', bank1Owner: '', bank1Account: '',
    bank2Name: '', bank2Owner: '', bank2Account: '',
    qris: ''
  });
  const [qrisFile, setQrisFile] = useState<File | null>(null);
  const [previewQris, setPreviewQris] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('store_settings').select('*').eq('id', 1).single();
      if (data) {
        setForm({
          bank1Name: data.bank_name || '', bank1Owner: data.bank_owner || '', bank1Account: data.bank_account || '',
          bank2Name: data.bank_name_2 || '', bank2Owner: data.bank_owner_2 || '', bank2Account: data.bank_account_2 || '',
          qris: data.qris_image || ''
        });
      }
    }
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setQrisFile(file); setPreviewQris(URL.createObjectURL(file)); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let qrisUrl = form.qris;
      if (qrisFile) {
        const ext = qrisFile.name.split('.').pop();
        const fileName = `qris-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('uploads').upload(fileName, qrisFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);
        qrisUrl = data.publicUrl;
      }

      const { error } = await supabase.from('store_settings').update({
        bank_name: form.bank1Name, bank_owner: form.bank1Owner, bank_account: form.bank1Account,
        bank_name_2: form.bank2Name, bank_owner_2: form.bank2Owner, bank_account_2: form.bank2Account,
        qris_image: qrisUrl
      }).eq('id', 1);

      if (error) throw error;
      toast.success("Pengaturan disimpan!");
      setQrisFile(null);
    } catch (error) {
      console.error(error);
      toast.error("Gagal simpan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Pengaturan Rekening & QRIS</h1>
        <p className="text-sm text-gray-500">Atur info pembayaran dan QRIS untuk pelanggan.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
        {/* KARTU REKENING 1 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">Rekening Utama (Wajib)</h3>
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">Primary</span>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Nama Bank</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input name="bank1Name" value={form.bank1Name} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="BRI / BCA / Mandiri" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Pemilik Akun</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input name="bank1Owner" value={form.bank1Owner} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Nama Pemilik" required />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Nomor Rekening</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input name="bank1Account" value={form.bank1Account} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="1234567890" required />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KARTU REKENING 2 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">Rekening Kedua</h3>
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">Opsional</span>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Nama Bank</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input name="bank2Name" value={form.bank2Name} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="BRI / BCA / Mandiri" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Pemilik Akun</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input name="bank2Owner" value={form.bank2Owner} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Nama Pemilik" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Nomor Rekening</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input name="bank2Account" value={form.bank2Account} onChange={handleChange} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="1234567890" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KARTU QRIS */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">QRIS Standar Pembayaran Nasional</h3>
            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded flex items-center gap-1"><ShieldCheck size={12}/> Terverifikasi</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PREVIEW */}
            <div>
              <p className="text-xs font-bold text-gray-500 mb-2">Preview QRIS Saat Ini</p>
              {previewQris || form.qris ? (
                <div className="relative inline-block border-2 border-gray-200 rounded-xl p-2 bg-white">
                  <img src={previewQris || form.qris} alt="QRIS" className="w-full max-w-[200px] object-contain rounded-lg" />
                  <button type="button" onClick={() => { setQrisFile(null); setPreviewQris(null); setForm({...form, qris: ''}) }} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md"><X size={14}/></button>
                </div>
              ) : (
                <div className="w-full max-w-[200px] h-[200px] border-2 border-dashed rounded-xl flex items-center justify-center text-gray-400 text-sm">Belum ada QRIS</div>
              )}
            </div>

            {/* UPLOAD */}
            <div>
              <p className="text-xs font-bold text-gray-500 mb-2">Upload File QRIS Baru</p>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer relative hover:bg-gray-50 h-full flex flex-col justify-center items-center">
                <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                <Upload className="text-brand-500 mb-2" size={32} />
                <p className="font-bold text-sm text-gray-700">Pilih Gambar QRIS</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, atau PDF (Maks. 2MB)</p>
              </div>
            </div>
          </div>
          <div className="mt-4 bg-blue-50 p-3 rounded-lg flex gap-2 items-start">
            <QrCode className="text-blue-500 shrink-0" size={18} />
            <p className="text-xs text-blue-800">Barcode QRIS ini otomatis tampil di halaman checkout pelanggan saat memilih metode pembayaran Non-Tunai.</p>
          </div>
        </div>

        {/* TOMBOL */}
        <button type="submit" disabled={loading} className="w-full bg-brand-500 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-brand-600 transition-all disabled:opacity-50">
          {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </form>
    </AdminLayout>
  );
}