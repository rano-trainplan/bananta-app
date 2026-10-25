import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowLeft, X, Image as ImageIcon, Store, Bike, Copy, Check, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, cartTotal } = useCart();
  const navigate = useNavigate();

  const [nama, setNama] = useState('');
  const [noHp, setNoHp] = useState('');
  const [alamat, setAlamat] = useState('');
  const [metode, setMetode] = useState('QRIS');
  const [buktiTransfer, setBuktiTransfer] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [deliveryType, setDeliveryType] = useState<'Ambil di Toko' | 'Diantar Kurir'>('Diantar Kurir');
  const [pickupTime, setPickupTime] = useState('');
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: rates } = await supabase.from('shipping_rates').select('*');
      if (rates && rates.length > 0) {
        setShippingRates(rates);
        setSelectedArea(rates[0].id);
        setShippingCost(rates[0].cost);
      }
      const { data: settings } = await supabase.from('store_settings').select('*').eq('id', 1).single();
      if (settings) setStoreSettings(settings);
    }
    fetchData();
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} disalin!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const areaId = e.target.value;
    setSelectedArea(areaId);
    const area = shippingRates.find(a => a.id === areaId);
    setShippingCost(area ? area.cost : 0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setBuktiTransfer(file); setPreviewUrl(URL.createObjectURL(file)); }
  };

  const handleRemovePhoto = () => { setBuktiTransfer(null); setPreviewUrl(null); };

  const handleApplyDiscount = async () => {
    if (!discountCode) return;
    const today = new Date().getDay();
    if (discountCode.toUpperCase() === 'JUMATBERKAH' && today !== 5) return toast.error("Promo Jumat Berkah hanya berlaku di hari Jumat!");
    const { data, error } = await supabase.from('discounts').select('*').eq('code', discountCode.toUpperCase()).eq('is_active', true).single();
    if (error || !data) return toast.error("Kode diskon tidak valid.");
    if (cartTotal < data.min_purchase) return toast.error(`Minimal belanja Rp ${data.min_purchase.toLocaleString('id-ID')}`);
    setDiscountAmount(data.discount_amount);
    toast.success(`Diskon ${data.title} berhasil!`);
  };

  const isPickup = deliveryType === 'Ambil di Toko';
  const finalShipping = isPickup ? 0 : shippingCost;
  const grandTotal = cartTotal + finalShipping - discountAmount;
  const isCourierTooCheap = !isPickup && cartTotal < 100000;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Keranjang masih kosong!");
    if (!nama || !noHp) return alert("Harap isi nama dan no HP!");
    if (!isPickup && !alamat) return alert("Harap isi alamat pengiriman!");
    if (isCourierTooCheap) return alert("Minimum order untuk Kurir adalah Rp 100.000!");
    if (!buktiTransfer) return alert("Harap upload bukti pembayaran!");
    if (isPickup && !pickupTime) return alert("Harap pilih jadwal pengambilan!");

    setIsLoading(true);

    try {
      let proofUrl = null;
      const fileExt = buktiTransfer.name.split('.').pop();
      const fileName = `proof-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('uploads').upload(fileName, buktiTransfer);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
      proofUrl = urlData.publicUrl;

      // 1. Simpan Pesanan
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_name: nama,
          phone: noHp,
          order_type: 'Online',
          address: isPickup ? 'Ambil di Toko' : alamat,
          total_price: grandTotal,
          payment_method: metode,
          status: 'Dibuat',
          payment_proof: proofUrl,
          delivery_type: deliveryType,
          pickup_time: pickupTime ? new Date(pickupTime).toISOString() : null
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Simpan Item Pesanan
      const itemsToInsert = cart.map(item => ({
        order_id: orderData.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price
      }));
      await supabase.from('order_items').insert(itemsToInsert);

      // 3. KURANGI STOK PRODUK OTOMATIS
      for (const item of cart) {
        const { data: productData } = await supabase.from('products').select('stock').eq('id', item.id).single();
        
        if (productData) {
          const currentStock = productData.stock || 0;
          const newStock = Math.max(0, currentStock - item.quantity); // Pastikan gak minus
          
          await supabase.from('products').update({ stock: newStock }).eq('id', item.id);
        }
      }

      toast.success("Pesanan berhasil dibuat!");
      cart.forEach(item => removeFromCart(item.id));
      
      // Simpan ID pesanan ke HP pelanggan
      const existingOrders = JSON.parse(localStorage.getItem('my_orders') || '[]');
      localStorage.setItem('my_orders', JSON.stringify([...existingOrders, orderData.id]));

      navigate(`/tracking/${orderData.id}`);

    } catch (error) {
      console.error(error);
      alert("Gagal membuat pesanan. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative pb-32">
      <header className="bg-white p-4 shadow-sm flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate('/')} className="p-2 bg-gray-100 rounded-full"><ArrowLeft size={18} /></button>
        <h1 className="font-bold text-lg">Keranjang & Checkout</h1>
      </header>

      <div className="p-4 space-y-6">
        
        {/* JIKA KERANJANG KOSONG */}
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="bg-orange-100 p-6 rounded-full mb-4">
              <ShoppingBag size={48} className="text-orange-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Keranjang Masih Kosong</h2>
            <p className="text-sm text-gray-500 mb-6">Kamu belum memilih menu apapun. Yuk, pesan makanan atau minuman favoritmu dulu!</p>
            <button 
              onClick={() => navigate('/')} 
              className="bg-[#F59E0B] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-[#D97706] transition-colors"
            >
              Lihat Menu Sekarang
            </button>
          </div>
        ) : (
          
          <>
            {/* LIST ITEM */}
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-3 items-center">
                  <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                  <div className="flex-1">
                    <h4 className="font-bold text-sm">{item.name}</h4>
                    <p className="text-[#F59E0B] font-bold text-sm mt-1">Rp {item.price.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => updateQuantity(item.id, -1)} className="p-1 bg-gray-100 rounded-md"><Minus size={14}/></button>
                    <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item.id, 1)} className="p-1 bg-gray-100 rounded-md"><Plus size={14}/></button>
                    <button type="button" onClick={() => removeFromCart(item.id)} className="p-1 ml-2 text-red-500"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleCheckout} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
              
              {/* INFORMASI PENGIRIMAN */}
              <h3 className="font-bold text-md border-b pb-2">Informasi Pengiriman</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button" 
                  onClick={() => setDeliveryType('Ambil di Toko')} 
                  className={`flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl border-2 transition-all ${
                    isPickup 
                      ? 'bg-[#F59E0B] text-white border-[#F59E0B] shadow-md' 
                      : 'bg-white text-gray-500 border-gray-200'
                  }`}
                >
                  <Store size={18}/> Ambil di Toko
                </button>
                <button 
                  type="button" 
                  onClick={() => setDeliveryType('Diantar Kurir')} 
                  className={`flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl border-2 transition-all ${
                    !isPickup 
                      ? 'bg-[#F59E0B] text-white border-[#F59E0B] shadow-md' 
                      : 'bg-white text-gray-500 border-gray-200'
                  }`}
                >
                  <Bike size={18}/> Diantar Kurir
                </button>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nama Lengkap</label>
                <input type="text" value={nama} onChange={e => setNama(e.target.value)} className="w-full bg-gray-50 border p-2 rounded-lg text-sm" required />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">No. WhatsApp</label>
                <input type="tel" value={noHp} onChange={e => setNoHp(e.target.value)} className="w-full bg-gray-50 border p-2 rounded-lg text-sm" required />
              </div>

              {isPickup ? (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Jadwal Ambil</label>
                  <input type="datetime-local" value={pickupTime} onChange={e => setPickupTime(e.target.value)} className="w-full bg-gray-50 border p-2 rounded-lg text-sm" required />
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Alamat Lengkap</label>
                    <textarea value={alamat} onChange={e => setAlamat(e.target.value)} className="w-full bg-gray-50 border p-2 rounded-lg text-sm h-20 resize-none" required={!isPickup} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Daerah Pengiriman</label>
                    <select value={selectedArea} onChange={handleAreaChange} className="w-full bg-gray-50 border p-2 rounded-lg text-sm" required={!isPickup}>
                      {shippingRates.map(area => (<option key={area.id} value={area.id}>{area.area_name} - Rp {area.cost.toLocaleString('id-ID')}</option>))}
                    </select>
                  </div>
                  {isCourierTooCheap && <p className="text-xs text-red-500 font-bold">Minimum order Rp 100.000 untuk Kurir!</p>}
                </>
              )}

              {/* METODE PEMBAYARAN */}
              <h3 className="font-bold text-md border-b pb-2 pt-2">Metode Pembayaran</h3>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setMetode('QRIS')} 
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl border-2 transition-all ${
                    metode === 'QRIS' ? 'bg-[#F59E0B] text-white border-[#F59E0B] shadow-md' : 'bg-white text-gray-500 border-gray-200'
                  }`}
                >
                  QRIS
                </button>
                <button 
                  type="button" 
                  onClick={() => setMetode('Transfer Bank')} 
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl border-2 transition-all ${
                    metode === 'Transfer Bank' ? 'bg-[#F59E0B] text-white border-[#F59E0B] shadow-md' : 'bg-white text-gray-500 border-gray-200'
                  }`}
                >
                  Transfer
                </button>
              </div>

              {metode === 'QRIS' && storeSettings?.qris_image && (
                <div className="bg-gray-50 p-3 rounded-lg text-center border">
                  <p className="text-sm font-bold mb-2">Scan QRIS:</p>
                  <img src={storeSettings.qris_image} alt="QRIS" className="w-48 h-48 object-contain mx-auto rounded-lg" />
                  <p className="text-lg font-bold text-[#F59E0B] mt-2">Total: Rp {grandTotal.toLocaleString('id-ID')}</p>
                </div>
              )}

              {metode === 'Transfer Bank' && storeSettings && (
                <div className="space-y-3">
                  <div onClick={() => handleCopy(storeSettings.bank_account, 'No. Rek ' + storeSettings.bank_name)} className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 rounded-xl shadow-md text-white cursor-pointer relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-sm">{storeSettings.bank_name}</p>
                      {copied === 'No. Rek ' + storeSettings.bank_name ? <Check size={16} /> : <Copy size={16} className="opacity-50 group-hover:opacity-100" />}
                    </div>
                    <p className="text-lg font-mono tracking-widest">{storeSettings.bank_account}</p>
                    <p className="text-xs opacity-80 mt-1">a.n. {storeSettings.bank_owner}</p>
                  </div>

                  {storeSettings.bank_name_2 && (
                    <div onClick={() => handleCopy(storeSettings.bank_account_2, 'No. Rek ' + storeSettings.bank_name_2)} className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-4 rounded-xl shadow-md text-white cursor-pointer relative overflow-hidden group">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-bold text-sm">{storeSettings.bank_name_2}</p>
                        {copied === 'No. Rek ' + storeSettings.bank_name_2 ? <Check size={16} /> : <Copy size={16} className="opacity-50 group-hover:opacity-100" />}
                      </div>
                      <p className="text-lg font-mono tracking-widest">{storeSettings.bank_account_2}</p>
                      <p className="text-xs opacity-80 mt-1">a.n. {storeSettings.bank_owner_2}</p>
                    </div>
                  )}

                  <p className="text-center text-sm text-gray-500">Klik kartu buat copy No. Rek</p>
                  <div className="bg-gray-50 p-3 rounded-lg text-center border">
                    <p className="text-sm font-bold text-gray-600">Total Transfer:</p>
                    <p className="text-xl font-bold text-[#F59E0B]">Rp {grandTotal.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              )}

              {/* UPLOAD BUKTI */}
              <div>
                <label className="text-xs text-red-500 mb-1 block font-bold">Upload Bukti (Wajib)</label>
                {!previewUrl ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer relative">
                    <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <ImageIcon className="mx-auto text-gray-400 mb-1" size={24} />
                    <p className="text-xs text-gray-500">Pilih gambar</p>
                  </div>
                ) : (
                  <div className="relative">
                    <img src={previewUrl} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                    <button type="button" onClick={handleRemovePhoto} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"><X size={14} /></button>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <input type="text" placeholder="Kode Promo (JUMATBERKAH)" value={discountCode} onChange={e => setDiscountCode(e.target.value)} className="flex-1 bg-gray-50 border p-2 rounded-lg text-sm" />
                <button type="button" onClick={handleApplyDiscount} className="bg-gray-800 text-white px-4 rounded-lg text-sm font-bold">Pakai</button>
              </div>

              <div className="border-t pt-3 mt-3 space-y-1 text-sm text-gray-600">
                <div className="flex justify-between"><span>Subtotal</span><span>Rp {cartTotal.toLocaleString('id-ID')}</span></div>
                {!isPickup && <div className="flex justify-between"><span>Ongkir</span><span>Rp {finalShipping.toLocaleString('id-ID')}</span></div>}
                {discountAmount > 0 && <div className="flex justify-between text-green-600 font-bold"><span>Diskon</span><span>- Rp {discountAmount.toLocaleString('id-ID')}</span></div>}
                <div className="flex justify-between font-bold text-lg text-[#F59E0B] mt-2"><span>Total</span><span>Rp {grandTotal.toLocaleString('id-ID')}</span></div>
              </div>
            </form>
          </>
        )}
      </div>

      {/* TOMBOL BAYAR STICKY DI BAWAH LAYAR */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 p-4 z-[60] shadow-[0_-4px_20px_rgba(0,0,0,0.1)] pb-6">
          <button 
            type="button"
            onClick={(e) => handleCheckout(e as any)}
            disabled={isLoading || !buktiTransfer || isCourierTooCheap}
            className={`w-full py-3.5 rounded-xl font-bold text-base transition-all ${
              (!buktiTransfer || isCourierTooCheap || isLoading) 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-[#F59E0B] text-white shadow-lg hover:bg-[#D97706]'
            }`}
          >
            {isLoading ? 'Memproses...' : isCourierTooCheap ? 'Min. Order 100rb' : !buktiTransfer ? 'Upload Bukti Dulu' : 'Pesan Sekarang'}
          </button>
        </div>
      )}
    </div>
  );
}