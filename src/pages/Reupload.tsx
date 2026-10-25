import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { ArrowLeft, UploadCloud, AlertCircle, Copy, Check, HelpCircle, MessageCircle, Info } from 'lucide-react';

export default function Reupload() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function checkOrder() {
      if (!orderId) return;
      try {
        const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).single();
        
        if (error || !data) {
          toast.error("Pesanan tidak ditemukan.");
          navigate('/');
          return;
        }
        setOrder(data);
      } catch (err) {
        console.error(err);
        toast.error("Gagal memuat data pesanan.");
      } finally {
        setFetching(false);
      }
    }
    checkOrder();
  }, [orderId, navigate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(`#${order?.id.slice(0, 8).toUpperCase()}`);
    setCopied(true);
    toast.success('ID Pesanan disalin!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("Pilih gambar bukti transfer dulu!");
    
    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `proof-reupload-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('uploads').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName);

      const { error: updateError } = await supabase.from('orders').update({
        payment_proof: urlData.publicUrl,
        status: 'Validasi'
      }).eq('id', orderId);

      if (updateError) throw updateError;

      toast.success("Bukti berhasil diupload ulang! Menunggu validasi admin.");
      navigate(`/tracking/${orderId}`);

    } catch (error) {
      console.error(error);
      toast.error("Gagal upload bukti. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-500">Memuat data pesanan...</div>;
  if (!order) return null;

  return (
    <div className="pb-24 min-h-screen bg-gray-50 relative">
      
      {/* HEADER */}
      <div className="bg-white/80 backdrop-blur-md p-4 shadow-sm mb-4 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/tracking/${orderId}`} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
            <ArrowLeft size={18}/>
          </Link>
          <div>
            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">Upload Ulang</p>
            <h1 className="text-sm font-bold text-gray-800">Bukti Transfer</h1>
          </div>
        </div>
        <button className="text-xs font-bold text-gray-500 flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-full">
          <HelpCircle size={14} /> Bantuan
        </button>
      </div>

      <div className="px-4 space-y-4 max-w-md mx-auto">
        
        {/* KOTAK PERINGATAN MERAH */}
        <div className="bg-[#FFF0F0] border border-red-100 p-4 rounded-2xl flex gap-3 items-start">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <p className="font-bold text-sm text-red-700">Pembayaran Ditolak Admin</p>
              <span className="text-[9px] font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded">Perlu Revisi</span>
            </div>
            <p className="text-xs text-red-600 leading-relaxed mb-3">
              Bukti transfer sebelumnya tidak valid atau nominal tidak sesuai. Silakan upload ulang struk yang jelas agar pesanan segera diproses.
            </p>
            <div className="bg-white p-2.5 rounded-lg border border-red-100 flex items-start gap-2">
               <span className="text-red-500 text-[10px] mt-0.5">⚠️</span>
               <p className="text-[10px] text-gray-600 font-medium">Alasan: <span className="font-bold text-gray-800">Foto blur & nominal transfer terpotong</span></p>
            </div>
          </div>
        </div>

        {/* RINCIAN PESANAN */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">ID Pesanan</p>
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm text-gray-800 bg-gray-50 border border-gray-200 px-2 py-1 rounded-md">#{order.id.slice(0, 8).toUpperCase()}</p>
                <button onClick={handleCopy} className="text-gray-400 hover:text-green-500 transition-colors">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Pembayaran</p>
              <p className="font-bold text-lg text-orange-500">Rp {order.total_price.toLocaleString('id-ID')}</p>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
                <span className="font-bold text-xs">BCA</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-800">Bank Central Asia</p>
                <p className="text-[9px] text-gray-500">a.n Bananta Sultan Resto</p>
              </div>
            </div>
            <p className="font-mono text-sm font-bold text-gray-700">8881 2349 881</p>
          </div>
        </div>

        {/* CARD FORM UPLOAD */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 block">Pilih Foto Bukti Baru *</label>
          
          <form onSubmit={handleUpload} className="space-y-4">
            
            {/* AREA UPLOAD */}
            {!file ? (
              <div className="border-2 border-dashed border-orange-200 bg-orange-50/30 rounded-2xl p-8 text-center cursor-pointer relative hover:bg-orange-50 transition-colors">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={e => setFile(e.target.files?.[0] || null)} 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  required 
                />
                <div className="w-12 h-12 bg-orange-400 text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                  <UploadCloud size={24} />
                </div>
                <p className="text-sm font-bold text-gray-800 mb-1">Klik untuk pilih gambar</p>
                <p className="text-[10px] text-gray-500 mb-4 px-4 leading-relaxed">Pastikan tulisan nominal, tanggal, dan rekening penerima terlihat jelas & tidak terpotong.</p>
                
                <div className="flex items-center justify-center gap-2 text-[9px] font-bold text-gray-400">
                  <span className="border border-gray-200 px-2 py-1 rounded bg-white">JPG</span>
                  <span className="border border-gray-200 px-2 py-1 rounded bg-white">PNG</span>
                  <span className="border border-gray-200 px-2 py-1 rounded bg-white">WEBP</span>
                  <span className="text-orange-500 ml-1">• Maks. 5MB</span>
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-gray-200">
                <img 
                  src={URL.createObjectURL(file)} 
                  alt="Preview" 
                  className="w-full h-48 object-cover" 
                />
                <button 
                  type="button"
                  onClick={() => setFile(null)}
                  className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-md"
                >
                  Ganti Foto
                </button>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || !file} 
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                loading || !file 
                  ? 'bg-orange-200 text-white cursor-not-allowed' 
                  : 'bg-orange-400 text-white shadow-md hover:bg-orange-500'
              }`}
            >
              {loading ? 'Mengirim...' : <><UploadCloud size={18}/> Kirim Bukti Baru</>}
            </button>
          </form>
        </div>

        {/* TIPS */}
        <div className="bg-[#EFF6FF] p-4 rounded-2xl flex gap-3 items-start">
          <div className="bg-blue-500 text-white p-1.5 rounded-lg shrink-0 mt-0.5">
            <Info size={16} />
          </div>
          <div>
            <p className="font-bold text-xs text-blue-800 mb-1">Tips Upload Bukti yang Benar:</p>
            <ul className="text-[10px] text-blue-700 list-disc list-inside space-y-1">
              <li>Pastikan foto tidak blur, goyang, atau terpotong pada bagian penting.</li>
              <li>Nominal transfer harus persis sama: <span className="font-bold">Rp {order.total_price.toLocaleString('id-ID')}</span>.</li>
              <li>Tampilkan nomor referensi atau kode transaksi perbankan.</li>
              <li>Gunakan screenshot m-banking resmi atau struk cetak ATM.</li>
            </ul>
          </div>
        </div>

        {/* BANTUAN CS */}
        <div className="text-center pt-2 pb-6">
          <p className="text-[10px] text-gray-500 mb-2">Mengalami kendala saat upload bukti?</p>
          <a href="https://wa.me/6282151855286" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-full text-[10px] font-bold hover:bg-green-100 transition-colors">
            <MessageCircle size={14} /> Hubungi CS Bananta via WhatsApp
          </a>
        </div>

      </div>
    </div>
  );
}