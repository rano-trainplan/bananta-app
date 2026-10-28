import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { Search, Star, MapPin } from 'lucide-react';
import BottomNav from '../components/layout/BottomNav';
import { supabase } from '../lib/supabase';
import type { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext'; // <-- IMPORT

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const { addToCart } = useCart();
  const { t } = useLanguage(); // <-- PANGGIL HOOK

  const isFriday = new Date().getDay() === 5;

  useEffect(() => {
    async function fetchData() {
      const { data: prodData, error } = await supabase.from('products').select('*');
      if (error) console.error("Gagal ambil data:", error);
      else setProducts(prodData || []);

      const { data: settings } = await supabase.from('store_settings').select('*').eq('id', 1).single();
      if (settings) setStoreSettings(settings);

      setLoading(false);
    }
    
    fetchData();

    const channel = supabase.channel('realtime-products')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, (payload) => {
        setProducts(prevProducts => 
          prevProducts.map(p => p.id === payload.new.id ? { ...p, stock: payload.new.stock } : p)
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    toast.success(`${product.name} masuk keranjang! 🛒`);
  };

  const filteredProducts = products.filter((product) => {
    const matchCategory = activeCategory === 'Semua' || product.category === activeCategory;
    const matchSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="pb-24 min-h-screen bg-gray-50 relative">
      <header className="bg-white p-4 rounded-b-3xl shadow-sm mb-4">
        
        {/* HEADER: LOGO, NAMA, ALAMAT BERJALAN */}
        <div className="flex items-center gap-3 w-full overflow-hidden mb-4">
          
          {/* LOGO DINAMIS */}
          {storeSettings?.store_logo ? (
            <img src={storeSettings.store_logo} alt="Logo" className="w-10 h-10 rounded-full object-contain bg-white shadow-sm border border-gray-100 shrink-0" />
          ) : (
            <div className="w-10 h-10 bg-[#F59E0B] rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0">
              {storeSettings?.store_name ? storeSettings.store_name.charAt(0) : 'B'}
            </div>
          )}

          {/* NAMA & ALAMAT BERJALAN */}
          <div className="flex-1 min-w-0 pr-2">
            <h1 className="font-bold text-lg leading-tight truncate">
              {storeSettings?.store_name || 'Bananta Sultan'}
            </h1>
            
            <div className="flex items-center gap-1 overflow-hidden relative">
              <MapPin size={10} className="text-gray-500 shrink-0"/> 
              
              {/* Marquee Wrapper */}
              <div className="overflow-hidden whitespace-nowrap w-full relative">
                <div className="animate-marquee">
                  <span className="text-xs text-gray-500 pr-8">
                    {storeSettings?.store_address || 'Lelilef Waebulen, Depan Bank BRI'}
                  </span>
                  <span className="text-xs text-gray-500 pr-8">
                    {storeSettings?.store_address || 'Lelilef Waebulen, Depan Bank BRI'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AVATAR USER */}
          <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden shrink-0">
            <img src="https://ui-avatars.com/api/?name=User&background=random" alt="User" />
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder={t('search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]" 
          />
        </div>
      </header>

      <div className="px-4">
        {/* BANNER PROMO */}
        <div 
          className="rounded-2xl p-5 text-white mb-6 relative overflow-hidden shadow-lg"
          style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}
        >
          <div className="relative z-10">
            {isFriday ? (
              <>
                <h2 className="font-bold text-lg mb-1">{storeSettings?.promo_title_friday || t('promo_title_friday')}</h2>
                <p className="text-xs opacity-90 mb-3">{storeSettings?.promo_subtitle_friday || t('promo_sub_friday')}</p>
              </>
            ) : (
              <>
                <h2 className="font-bold text-lg mb-1">{storeSettings?.promo_title || t('promo_title_default')}</h2>
                <p className="text-xs opacity-90 mb-3">{storeSettings?.promo_subtitle || t('promo_sub_default')}</p>
              </>
            )}
            <span className="bg-white text-[#D97706] text-xs font-bold py-1 px-3 rounded-full">
              {storeSettings?.promo_badge || t('promo_btn')}
            </span>
          </div>
          <Star className="absolute right-4 bottom-4 text-white opacity-20" size={80} />
        </div>

        {/* KATEGORI */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-2">
          {['Semua', 'Makanan', 'Minuman', 'Snack'].map((cat) => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                activeCategory === cat 
                  ? 'bg-[#F59E0B] text-white' 
                  : 'bg-white text-gray-600 shadow-sm border border-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex justify-between items-end mb-4 mt-2">
          <div>
            <h3 className="font-bold text-lg">{t('menu_title')}</h3>
            <p className="text-xs text-gray-500">{t('menu_sub')}</p>
          </div>
        </div>

        {/* LIST PRODUK */}
        {loading ? (
          <p className="text-center text-gray-500 py-10">Memuat menu...</p>
        ) : (
          <div className="space-y-4">
            {filteredProducts.length === 0 ? (
              <p className="text-center text-gray-500 py-10">Menu tidak ditemukan.</p>
            ) : (
              filteredProducts.map((product) => {
                const isFridayPrice = isFriday && product.price_friday;
                const displayPrice = (isFridayPrice && product.price_friday) ? Number(product.price_friday) : Number(product.price);

                return (
                  <div key={product.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
                    <img src={product.image_url} alt={product.name} className="w-24 h-24 object-cover rounded-xl" />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-gray-800">{product.name}</h4>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{product.description}</p>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex flex-col">
                          {isFridayPrice && (
                            <span className="text-xs text-gray-400 line-through">Rp {product.price.toLocaleString('id-ID')}</span>
                          )}
                          <span className="font-bold text-[#F59E0B]">Rp {displayPrice.toLocaleString('id-ID')}</span>
                          <span className="text-[10px] text-gray-500 mt-0.5">{t('stock_remaining')}: {(product as any).stock || 0}</span>
                        </div>
                        
                        {(product as any).stock > 0 ? (
                          <button 
                            onClick={() => handleAddToCart({ ...product, price: displayPrice })}
                            className="bg-[#F59E0B] text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg leading-none active:scale-90 transition-transform"
                          >
                            +
                          </button>
                        ) : (
                          <div className="bg-gray-100 text-gray-400 px-3 py-1.5 rounded-lg text-xs font-bold cursor-not-allowed">
                            {t('sold_out')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}