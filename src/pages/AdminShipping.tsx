import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import AdminLayout from '../components/layout/AdminLayout';
import { MapPin, Plus, Trash2, Truck, AlertCircle, Clock } from 'lucide-react';

export default function AdminShipping() {
  const [rates, setRates] = useState<any[]>([]);
  const [areaName, setAreaName] = useState('');
  const [cost, setCost] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRates(); }, []);

  async function fetchRates() {
    const { data } = await supabase.from('shipping_rates').select('*').order('area_name');
    setRates(data || []);
    setLoading(false);
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaName || !cost) return toast.error("Isi semua data!");
    
    const { error } = await supabase.from('shipping_rates').insert([{ area_name: areaName, cost: Number(cost) }]);
    if (error) toast.error("Gagal nambah ongkir");
    else {
      toast.success("Ongkir ditambahkan!");
      setAreaName('');
      setCost('');
      fetchRates();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus daerah ini?")) return;
    const { error } = await supabase.from('shipping_rates').delete().eq('id', id);
    if (error) toast.error("Gagal hapus");
    else { toast.success("Dihapus!"); fetchRates(); }
  };

  return (
    <AdminLayout>
      {/* HEADER HALAMAN */}
      <div className="flex items-start gap-3 mb-6">
        <div className="bg-orange-100 p-2.5 rounded-xl text-orange-500 mt-1">
          <Truck size={24} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-800">Manajemen Tarif Ongkir Kurir</h1>
            <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Logistik</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Atur zona tarif pengiriman area lingkup tambang Leilief.</p>
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        
        {/* CARD TAMBAH DAERAH */}
        <div className="bg-[#F3F4F6] p-5 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={18} className="text-gray-600" />
            <h3 className="font-bold text-sm text-gray-800">Tambah Daerah Baru</h3>
          </div>
          
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 mb-1 block uppercase">Nama Daerah / Titik Temu</label>
                <input 
                  type="text" 
                  placeholder="cth: Apartemen Jeju, Blok A" 
                  value={areaName} 
                  onChange={e => setAreaName(e.target.value)} 
                  className="w-full bg-white border-none p-3 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none shadow-sm" 
                  required 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 mb-1 block uppercase">Harga Ongkir (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                  <input 
                    type="number" 
                    placeholder="15000" 
                    value={cost} 
                    onChange={e => setCost(e.target.value)} 
                    className="w-full bg-white border-none p-3 pl-9 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none shadow-sm" 
                    required 
                  />
                </div>
              </div>
            </div>
            <button type="submit" className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-md mt-2">
              <Plus size={18} /> Tambah Daerah Pengiriman
            </button>
          </form>
        </div>

        {/* LIST ONGKIR AKTIF */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-gray-800">Daftar Ongkir Aktif</h3>
              <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{rates.length} Lokasi</span>
            </div>
            <span className="text-[10px] text-gray-500 flex items-center gap-1"><Clock size={12}/> Urut tarif terendah</span>
          </div>

          <div className="space-y-2">
            {loading ? (
              <p className="text-center text-gray-500 text-sm py-4">Memuat data...</p>
            ) : rates.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-4">Belum ada data ongkir.</p>
            ) : (
              rates.map((rate) => (
                <div key={rate.id} className="bg-[#F3F4F6] p-3 rounded-xl flex justify-between items-center border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm text-gray-400">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-800">{rate.area_name}</p>
                      <p className="text-xs text-orange-500 font-semibold">Rp {rate.cost.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(rate.id)} 
                    className="p-2 bg-red-100 text-red-500 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* INFO SYARAT */}
        <div className="bg-[#F3F4F6] p-4 rounded-xl border border-gray-200 flex gap-3 items-start">
          <AlertCircle size={18} className="text-gray-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm text-gray-800">Syarat Layanan Kurir Internal</p>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              Pesanan di atas <b className="text-gray-800">Rp 100.000</b> memenuhi syarat minimal layanan antar langsung kurir internal Bananta Sultan ke pos/mess pelanggan.
            </p>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}