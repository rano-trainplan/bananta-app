import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { ShoppingCart, Plus, Minus, Trash2, Search, Banknote, QrCode, X, CheckCircle, Archive, RotateCcw, Printer, CreditCard, Wallet, MessageSquare, ArrowRight } from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';

export default function Pos() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [heldOrders, setHeldOrders] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'QRIS' | 'Kartu' | 'E-Wallet'>('Tunai');
  const [cashGiven, setCashGiven] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [receiptData, setReceiptData] = useState<any>(null);
   const [orderType, setOrderType] = useState<'Dine-In' | 'Take Away'>('Dine-In');

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase.from('products').select('*').eq('is_active', true);
      setProducts(data || []);
    }
    fetchProducts();
    const savedHeld = JSON.parse(localStorage.getItem('pos_held_orders') || '[]');
    setHeldOrders(savedHeld);
  }, []);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => setCart(prev => prev.filter(item => item.id !== id));

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const kembalian = Number(cashGiven) - cartTotal;

  const handleHoldOrder = () => {
    if (cart.length === 0) return toast.error("Keranjang kosong!");
    const newHeld = [...heldOrders, { id: Date.now().toString(), cart, notes, time: new Date().toISOString() }];
    setHeldOrders(newHeld);
    localStorage.setItem('pos_held_orders', JSON.stringify(newHeld));
    setCart([]);
    setNotes('');
    toast.success("Pesanan disimpan (Hold)!");
  };

  const handleRecallOrder = (held: any) => {
    if (cart.length > 0) {
      if (!confirm("Keranjang saat ini akan diganti. Lanjut?")) return;
    }
    setCart(held.cart);
    setNotes(held.notes);
    const newHeld = heldOrders.filter(h => h.id !== held.id);
    setHeldOrders(newHeld);
    localStorage.setItem('pos_held_orders', JSON.stringify(newHeld));
    toast.success("Pesanan dipanggil kembali!");
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (confirm("Yakin mau membatalkan pesanan ini?")) {
      setCart([]);
      setNotes('');
      setCashGiven('');
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error("Keranjang kosong!");
    if (paymentMethod === 'Tunai' && Number(cashGiven) < cartTotal) return toast.error("Uang tunai kurang!");
    
    setLoading(true);
    try {
      const { data: orderData, error: orderError } = await supabase.from('orders').insert([{
        customer_name: 'Pelanggan Kasir',
        phone: '-',
        address: 'Dine-In / Take Away',
        total_price: cartTotal,
        payment_method: paymentMethod,
        status: 'Selesai',
        delivery_type: 'Ambil di Toko',
        order_type: 'Offline'
      }]).select().single();

      if (orderError) throw orderError;

      const itemsToInsert = cart.map(item => ({
        order_id: orderData.id,
        product_name: item.name,
        quantity: item.qty,
        price: item.price
      }));
      await supabase.from('order_items').insert(itemsToInsert);

      toast.success("Transaksi Berhasil!");
      
      setReceiptData({
        orderId: orderData.id,
        time: new Date().toLocaleString('id-ID'),
        items: cart,
        total: cartTotal,
        payment: paymentMethod,
        cashGiven: Number(cashGiven),
        kembalian: kembalian,
        method: 'Dine-In / Take Away',
        kasir: 'Admin POS'
      });

      setCart([]);
      setNotes('');
      setCashGiven('');
      setIsModalOpen(false);
      
    } catch (error) {
      console.error(error);
      toast.error("Gagal memproses transaksi.");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout>
      <div className="flex h-[calc(100vh-80px)] bg-gray-100 -m-6 overflow-hidden">
        
        {/* KIRI: Katalog Menu */}
        <div className="flex-1 p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-brand-900">Menu Kasir</h1>
              <p className="text-sm text-gray-500">Pilih menu untuk pelanggan offline</p>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Cari menu..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-6">
            {filteredProducts.map(p => (
              <div key={p.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between group">
                <img src={p.image_url || 'https://placehold.co/400'} alt={p.name} className="w-full h-32 object-cover rounded-xl mb-3" />
                <div>
                  <h3 className="font-bold text-sm text-gray-800 leading-tight">{p.name}</h3>
                  <p className="text-brand-600 font-bold mt-1">Rp {p.price.toLocaleString('id-ID')}</p>
                </div>
                <button onClick={() => addToCart(p)} className="mt-3 w-full bg-brand-50 text-brand-600 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1 hover:bg-brand-500 hover:text-white transition-colors">
                  <Plus size={16}/> Tambah
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* KANAN: Keranjang */}
        <div className="w-[400px] bg-white shadow-xl flex flex-col h-full border-l border-gray-200">
          
          <div className="p-4 border-b bg-brand-900 text-white flex justify-between items-center">
            <h2 className="font-bold text-lg flex items-center gap-2"><ShoppingCart size={20}/> Keranjang</h2>
            <span className="bg-white/20 px-2 py-1 rounded text-xs">{cart.reduce((a, b) => a + b.qty, 0)} Item</span>
          </div>

          {heldOrders.length > 0 && (
            <div className="bg-yellow-50 border-b p-3 flex gap-2 overflow-x-auto">
              <div className="text-xs text-yellow-700 font-bold flex items-center gap-1 mr-2"><Archive size={14}/> Disimpan:</div>
              {heldOrders.map(h => (
                <button key={h.id} onClick={() => handleRecallOrder(h)} className="bg-white border border-yellow-200 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded shadow-sm whitespace-nowrap hover:bg-yellow-100 flex items-center gap-1">
                  <RotateCcw size={10}/> Panggil
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
            {cart.length === 0 ? (
              <div className="text-center text-gray-400 mt-20">
                <ShoppingCart size={48} className="mx-auto mb-3 opacity-20"/>
                <p className="text-sm">Belum ada pesanan.</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-3">
                  <img src={item.image_url} className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1">
                    <h4 className="font-bold text-xs text-gray-800">{item.name}</h4>
                    <p className="text-xs text-brand-600 font-bold mt-0.5">Rp {item.price.toLocaleString('id-ID')}</p>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border">
                        <button onClick={() => updateQty(item.id, -1)} className="p-1 bg-white rounded shadow-sm text-gray-600"><Minus size={12}/></button>
                        <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="p-1 bg-white rounded shadow-sm text-gray-600"><Plus size={12}/></button>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t bg-white space-y-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><MessageSquare size={12}/> Catatan Pesanan</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Contoh: tanpa bawang, level 5" className="w-full bg-gray-50 border border-gray-200 p-2 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-500" />
            </div>

            <div className="border-t border-dashed pt-3 flex justify-between font-bold text-xl text-brand-900">
              <span>Total</span>
              <span>Rp {cartTotal.toLocaleString('id-ID')}</span>
            </div>

            <button onClick={() => setIsModalOpen(true)} disabled={cart.length === 0} className="w-full bg-brand-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-brand-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex justify-center items-center gap-2">
              Proses Pembayaran <ArrowRight size={16}/>
            </button>

            <div className="grid grid-cols-3 gap-2">
              <button onClick={handleHoldOrder} disabled={cart.length === 0} className="bg-white border border-gray-200 text-gray-600 py-2 rounded-xl text-[10px] font-bold flex flex-col items-center justify-center gap-1 hover:bg-gray-50 disabled:opacity-50">
                <Archive size={16}/> Simpan
              </button>
              <button disabled={!receiptData} className="bg-white border border-gray-200 text-gray-600 py-2 rounded-xl text-[10px] font-bold flex flex-col items-center justify-center gap-1 hover:bg-gray-50 disabled:opacity-50">
                <Printer size={16}/> Struk
              </button>
              <button onClick={handleClearCart} disabled={cart.length === 0} className="bg-red-50 border border-red-100 text-red-500 py-2 rounded-xl text-[10px] font-bold flex flex-col items-center justify-center gap-1 hover:bg-red-100 disabled:opacity-50">
                <X size={16}/> Batal
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL PEMBAYARAN BARU (Sesuai Gambar 3) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-[#8B5A2B] p-5 flex justify-between items-center text-white">
              <div>
                <h2 className="font-bold text-xl flex items-center gap-2"><Banknote size={24}/> Pembayaran Kasir</h2>
                <p className="text-xs opacity-80 mt-1">Pesanan POS #551-2041 • Meja 04</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 bg-white/20 rounded-full hover:bg-white/30"><X size={20}/></button>
            </div>
            
            <div className="p-5 space-y-4">
              {/* Total Tagihan Card */}
              <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-24 h-24 bg-orange-100 rounded-br-full opacity-50"></div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 relative z-10">Total Tagihan</p>
                <p className="text-4xl font-bold text-orange-600 relative z-10">Rp {cartTotal.toLocaleString('id-ID')}</p>
                <div className="flex justify-center gap-2 mt-2 relative z-10">
                  <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded">3 Menu Pilihan</span>
                  <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded">• PPN 0% (Stall Khusus)</span>
                </div>
              </div>

              {/* TAMBAHAN BARU: PILIHAN LAYANAN */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Tipe Pesanan</label>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setOrderType('Dine-In')} 
                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs border-2 transition-all ${orderType === 'Dine-In' ? 'bg-orange-50 border-orange-500 text-orange-600' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                  >
                    Makan di Tempat (Dine-In)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setOrderType('Take Away')} 
                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs border-2 transition-all ${orderType === 'Take Away' ? 'bg-orange-50 border-orange-500 text-orange-600' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                  >
                    Dibungkus (Take Away)
                  </button>
                </div>
              </div>

              {/* Metode Pembayaran */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pilih Metode Pembayaran</label>
                  <span className="text-[10px] text-green-600 font-bold flex items-center gap-1"><CheckCircle size={10}/> Auto-Sync Kasir</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <button onClick={() => setPaymentMethod('Tunai')} className={`py-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 border-2 transition-all ${paymentMethod === 'Tunai' ? 'bg-orange-50 border-orange-500 text-orange-600 shadow-sm' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}>
                    <Banknote size={20}/> Tunai
                  </button>
                  <button onClick={() => setPaymentMethod('QRIS')} className={`py-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 border-2 transition-all ${paymentMethod === 'QRIS' ? 'bg-orange-50 border-orange-500 text-orange-600 shadow-sm' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}>
                    <QrCode size={20}/> QRIS
                  </button>
                  <button onClick={() => setPaymentMethod('Kartu')} className={`py-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 border-2 transition-all ${paymentMethod === 'Kartu' ? 'bg-orange-50 border-orange-500 text-orange-600 shadow-sm' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}>
                    <CreditCard size={20}/> Kartu
                  </button>
                  <button onClick={() => setPaymentMethod('E-Wallet')} className={`py-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 border-2 transition-all ${paymentMethod === 'E-Wallet' ? 'bg-orange-50 border-orange-500 text-orange-600 shadow-sm' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}>
                    <Wallet size={20}/> E-Wallet
                  </button>
                </div>
              </div>

              {/* Input Uang & Kembalian */}
              {paymentMethod === 'Tunai' && (
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-gray-700">Uang Diterima (Rp)</label>
                    <span className="text-[10px] text-gray-400">Nominal Tunai Pelanggan</span>
                  </div>
                  <div className="relative mb-3">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rp</span>
                    <input type="number" value={cashGiven} onChange={e => setCashGiven(e.target.value)} placeholder="0" className="w-full bg-gray-50 border border-gray-200 p-3 pl-12 rounded-xl text-xl font-bold outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                  
                  <div className="flex gap-2 mb-4">
                    <button onClick={() => setCashGiven('170000')} className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-colors ${Number(cashGiven) === 170000 ? 'bg-gray-800 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Uang Pas</button>
                    <button onClick={() => setCashGiven('200000')} className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-colors ${Number(cashGiven) === 200000 ? 'bg-gray-800 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>200.000</button>
                    <button onClick={() => setCashGiven('300000')} className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-colors ${Number(cashGiven) === 300000 ? 'bg-gray-800 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>300.000</button>
                    <button onClick={() => setCashGiven('500000')} className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-colors ${Number(cashGiven) === 500000 ? 'bg-gray-800 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>500.000</button>
                  </div>

                  <div className="flex justify-between items-center bg-gray-100 p-3 rounded-xl">
                    <span className="text-sm font-bold text-gray-600 flex items-center gap-1"><Banknote size={16}/> Kembalian</span>
                    <span className={`text-2xl font-bold ${kembalian < 0 ? 'text-red-500' : 'text-orange-600'}`}>
                      {kembalian < 0 ? 'Uang Kurang!' : `Rp ${kembalian.toLocaleString('id-ID')}`}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500" />
                <p className="text-xs text-gray-600 font-medium">Kirim Salinan Struk via WhatsApp (Pelanggan VIP)</p>
              </div>

              <button onClick={handleCheckout} disabled={loading || (paymentMethod === 'Tunai' && Number(cashGiven) < cartTotal)} className="w-full bg-[#F59E0B] text-white py-4 rounded-xl font-bold text-base hover:bg-[#D97706] transition-colors shadow-md flex justify-center items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed">
                {loading ? 'Memproses...' : <><CheckCircle size={20}/> Selesaikan Transaksi & Cetak</>}
              </button>

              <div className="flex justify-between items-center px-1">
                <button onClick={handleHoldOrder} className="text-xs font-bold text-gray-500 flex items-center gap-1 hover:text-gray-800"><Archive size={14}/> Tahan Pesanan (Hold)</button>
                <button onClick={() => { setIsModalOpen(false); handleClearCart(); }} className="text-xs font-bold text-red-500 flex items-center gap-1 hover:text-red-700"><X size={14}/> Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL STRUK BARU (Sesuai Gambar 4) */}
      {receiptData && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
            {/* Header Struk */}
            <div className="bg-white p-6 pb-2 text-center relative">
              <div className="w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-200">
                <CheckCircle size={28}/>
              </div>
              <h2 className="font-bold text-xl text-green-700">Pembayaran Berhasil!</h2>
              <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">Transaksi Tercatat & Lunas</p>
              
              <div className="bg-orange-50 text-orange-600 text-[10px] font-bold px-3 py-1 rounded-full inline-block mt-3">KODE KIRIM: SUDAH TERKIRIM</div>
              
              <h3 className="font-bold text-2xl text-gray-800 mt-3 tracking-wider">BANANTA SULTAN</h3>
              <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">Lelilef Waebulen, Depan Bank BRI<br/>Halmahera Tengah, Maluku Utara<br/><b>WA Hotline: 0821-5185-5286</b></p>
            </div>
            
            <div className="p-6 overflow-y-auto font-mono text-xs text-gray-800 space-y-4">
              <div className="border-t border-b border-dashed border-gray-300 py-3 space-y-1.5">
                <div className="flex justify-between"><span>No. Transaksi</span><span className="font-bold">#{receiptData.orderId.slice(0,6).toUpperCase()}</span></div>
                <div className="flex justify-between"><span>Tanggal</span><span>{receiptData.time} WIT</span></div>
                <div className="flex justify-between"><span>Kasir</span><span>Admin Pos (Rian P.)</span></div>
                <div className="flex justify-between">
  <span>Layanan</span>
  <span className="bg-gray-100 px-2 py-0.5 rounded font-bold">{receiptData.method}</span>
</div>
              </div>

              <div className="border-b border-dashed border-gray-300 py-3 space-y-3">
                {receiptData.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between">
                    <div>
                      <p className="font-bold">{item.name}</p>
                      <p className="text-gray-500 text-[10px]">{item.qty} x Rp {item.price.toLocaleString('id-ID')} <span className="bg-gray-100 px-1 rounded ml-1">Level 2</span></p>
                    </div>
                    <p className="font-bold">Rp {(item.price * item.qty).toLocaleString('id-ID')}</p>
                  </div>
                ))}
              </div>

              <div className="border-b border-dashed border-gray-300 py-3 space-y-1.5">
                <div className="flex justify-between text-gray-500">
                  <p>Subtotal ({receiptData.items.length} Item)</p>
                  <p>Rp {receiptData.total.toLocaleString('id-ID')}</p>
                </div>
                <div className="flex justify-between text-gray-500">
                  <p>PPN Resto (0% UMKM)</p>
                  <p>Rp 0</p>
                </div>
                <div className="flex justify-between font-bold text-lg text-gray-800 mt-2">
                  <p>TOTAL</p>
                  <p>Rp {receiptData.total.toLocaleString('id-ID')}</p>
                </div>
              </div>

              <div className="border-b border-dashed border-gray-300 py-3 space-y-1.5">
                <div className="flex justify-between">
                  <p>Metode Bayar</p>
                  <p className="font-bold">{receiptData.payment} (Cash)</p>
                </div>
                <div className="flex justify-between">
                  <p>Uang Diterima</p>
                  <p className="font-bold">Rp {receiptData.cashGiven.toLocaleString('id-ID')}</p>
                </div>
                <div className="flex justify-between font-bold text-lg text-orange-600 mt-2">
                  <p>KEMBALI</p>
                  <p>Rp {receiptData.kembalian.toLocaleString('id-ID')}</p>
                </div>
              </div>

              <div className="text-center pt-3 text-gray-500">
                <div className="w-48 h-12 bg-gray-200 mx-auto mb-2 flex items-center justify-center text-[8px] tracking-widest">|||| ||| |||| || ||| ||||</div>
                <p className="font-bold text-gray-800 text-sm">Terima kasih atas kunjungan Anda!</p>
                <p className="text-[10px] mt-1">Simpan nota ini sebagai bukti pembayaran yang sah.</p>
                <p className="text-[10px]">Barang yang sudah dibeli tidak dapat dikembalikan.</p>
                <p className="text-[8px] mt-3 tracking-widest text-gray-400">POWERED BY BANANTA POS CLOUD SYSTEM</p>
              </div>
            </div>
            
            {/* Footer Tombol Struk */}
            <div className="p-4 border-t bg-gray-50 flex gap-2">
              <button onClick={() => window.print()} className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 flex items-center justify-center gap-2"><Printer size={18}/> Print Struk</button>
              <button onClick={() => setReceiptData(null)} className="flex-1 bg-[#F59E0B] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#D97706] flex items-center justify-center gap-2 shadow-md"><CheckCircle size={18}/> Tutup (Selesai)</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}