import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/layout/AdminLayout';
import { Download, TrendingUp, ShoppingBag, Receipt, Box, Banknote } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import AnimatedNumber from '../components/ui/AnimatedNumber';

export default function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
    const getTodayString = () => new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());

  useEffect(() => {
    const interval = setInterval(() => {
      const today = getTodayString();
      setStartDate(prev => prev !== today ? today : prev);
      setEndDate(prev => prev !== today ? today : prev);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchReport() {
      setLoading(true);
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('status', 'Selesai')
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .order('created_at', { ascending: false });
      
      setOrders(data || []);
      setLoading(false);
    }
    fetchReport();
  }, [startDate, endDate]);

  // --- PERHITUNGAN DATA ---
  const totalRevenue = orders.reduce((sum, o) => sum + o.total_price, 0);
  const totalTransactions = orders.length;
  const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  
  let totalItems = 0;
  const productSales: Record<string, number> = {};
  const paymentMethods: Record<string, { count: number, total: number }> = { Tunai: { count: 0, total: 0 }, QRIS: { count: 0, total: 0 }, 'Transfer Bank': { count: 0, total: 0 }, 'E-Wallet': { count: 0, total: 0 } };
  const dailyData: Record<string, { date: string, revenue: number }> = {};

  orders.forEach(o => {
    if (o.order_items) {
      o.order_items.forEach((item: any) => {
        totalItems += item.quantity;
        productSales[item.product_name] = (productSales[item.product_name] || 0) + item.quantity;
      });
    }
    
    const method = o.payment_method || 'Tunai';
    if (paymentMethods[method]) {
      paymentMethods[method].count += 1;
      paymentMethods[method].total += o.total_price;
    }

    const date = new Date(o.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    if (!dailyData[date]) dailyData[date] = { date, revenue: 0 };
    dailyData[date].revenue += o.total_price;
  });

  const chartData = Object.values(dailyData).reverse();
  const topProducts = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, qty]) => ({ name, qty }));
  const pieData = Object.entries(paymentMethods).filter(([_, v]) => v.count > 0).map(([name, v]) => ({ name, value: v.total }));
  const COLORS = ['#F59E0B', '#D97706', '#B45309', '#78350F'];

  const handlePrint = () => window.print();

  if (loading) return <AdminLayout><div className="p-10 text-center">Memuat Laporan...</div></AdminLayout>;

  return (
    <AdminLayout>
      {/* CSS KHUSUS PRINT (LANDSCAPE & TABEL RAPI) */}
      <style>
        {`
          @media print {
            @page { size: landscape; margin: 10mm; }
            body * { visibility: hidden; }
            #print-area, #print-area * { visibility: visible; }
            #print-area { position: absolute; left: 0; top: 0; width: 100%; }
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            
            /* Sembunyikan bentuk Card saat print, ubah jadi tabel biasa */
            .print-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
            .print-table th, .print-table td { border: 1px solid #000; padding: 6px; text-align: left; }
            .print-table th { background-color: #f3f4f6 !important; font-weight: bold; }
          }
        `}
      </style>

      <div id="print-area" className="max-w-6xl mx-auto">
        
        {/* HEADER PRINT (MUNCUL DI PDF AJA) */}
        <div className="print-only hidden mb-6">
          <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold uppercase">Bananta Sultan Cafe & Resto</h1>
              <p className="text-sm">Lelilef Waebulen, Depan Bank BRI, Halmahera Tengah</p>
              <p className="text-sm">Telp/WA: 0821-5185-5286</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold">LAPORAN PENJUALAN</h2>
              <p className="text-sm">Periode: {startDate} s/d {endDate}</p>
            </div>
          </div>
        </div>

        {/* HEADER WEB (HILANG PAS PRINT) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 no-print">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Laporan Penjualan</h1>
            <p className="text-sm text-gray-500 mt-1">Analisis performa penjualan restoran.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2 text-sm">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="outline-none" />
              <span className="text-gray-400">s/d</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="outline-none" />
            </div>
            <button onClick={handlePrint} className="bg-brand-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-brand-600 shadow-md">
              <Download size={16}/> Cetak Laporan (PDF)
            </button>
          </div>
        </div>

        {/* 4 KARTU STATISTIK (WEB ONLY) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 no-print">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="bg-brand-50 w-8 h-8 rounded-lg flex items-center justify-center text-brand-500 mb-3"><Receipt size={16}/></div>
            <p className="text-[10px] font-bold text-gray-500 uppercase">Total Pendapatan</p>
           {/* Total Pendapatan */}
<h2 className="text-xl font-bold text-gray-800">Rp <AnimatedNumber value={totalRevenue} /></h2>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="bg-blue-50 w-8 h-8 rounded-lg flex items-center justify-center text-blue-500 mb-3"><ShoppingBag size={16}/></div>
            <p className="text-[10px] font-bold text-gray-500 uppercase">Total Transaksi</p>
            {/* Total Transaksi */}
<h2 className="text-xl font-bold text-gray-800"><AnimatedNumber value={totalTransactions} /></h2>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="bg-purple-50 w-8 h-8 rounded-lg flex items-center justify-center text-purple-500 mb-3"><TrendingUp size={16}/></div>
            <p className="text-[10px] font-bold text-gray-500 uppercase">Rata-rata Transaksi</p>
            {/* Rata-rata Transaksi */}
<h2 className="text-xl font-bold text-gray-800">Rp <AnimatedNumber value={avgTransaction} /></h2>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="bg-orange-50 w-8 h-8 rounded-lg flex items-center justify-center text-orange-500 mb-3"><Box size={16}/></div>
            <p className="text-[10px] font-bold text-gray-500 uppercase">Total Item Terjual</p>
            {/* Total Item Terjual */}
<h2 className="text-xl font-bold text-gray-800"><AnimatedNumber value={totalItems} /></h2>
          </div>
        </div>

        {/* RINGKASAN TEKS BUAT DI PRINT */}
        <div className="print-only hidden mb-4">
          <table className="w-full text-sm font-bold">
            <tbody>
              <tr>
                <td className="w-1/4 py-1">Total Pendapatan</td><td className="py-1">: Rp {totalRevenue.toLocaleString('id-ID')}</td>
                <td className="w-1/4 py-1">Total Item Terjual</td><td className="py-1">: {totalItems} Porsi</td>
              </tr>
              <tr>
                <td className="py-1">Total Transaksi</td><td className="py-1">: {totalTransactions} Transaksi</td>
                <td className="py-1">Rata-rata Transaksi</td><td className="py-1">: Rp {avgTransaction.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* CHART (WEB ONLY) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 no-print">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm col-span-1 md:col-span-2">
            <h3 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-brand-500"/> Tren Penjualan</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#888'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#888'}} tickFormatter={(val) => `Rp ${val/1000}rb`} />
                  <Tooltip formatter={(value: any) => `Rp ${value.toLocaleString('id-ID')}`} />
                  <Line type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={3} dot={{r: 4, fill: '#F59E0B'}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2"><Banknote size={16} className="text-brand-500"/> Metode Pembayaran</h3>
            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                    {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: any) => `Rp ${value.toLocaleString('id-ID')}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1 mt-2">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex justify-between items-center text-[10px]">
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[index]}}></span> {entry.name}</div>
                  <span className="font-bold text-gray-700">Rp {entry.value.toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BARIS BAWAH */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Produk Terlaris (WEB) */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm no-print">
            <h3 className="font-bold text-sm text-gray-800 mb-4">🏆 Produk Terlaris</h3>
            <div className="space-y-3">
              {topProducts.map((p) => (
                <div key={p.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-gray-700">{p.name}</span>
                    <span className="font-bold text-brand-600">{p.qty}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-brand-500 h-full rounded-full" style={{ width: `${(p.qty / (topProducts[0]?.qty || 1)) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabel Transaksi (WEB) */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm col-span-1 md:col-span-2 no-print">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm text-gray-800">Transaksi Terbaru</h3>
              <span className="text-[10px] text-gray-400">Menampilkan {Math.min(orders.length, 5)} terakhir</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] text-gray-500 uppercase">
                    <th className="pb-2 font-bold">No. Transaksi</th>
                    <th className="pb-2 font-bold">Waktu</th>
                    <th className="pb-2 font-bold">Metode</th>
                    <th className="pb-2 font-bold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {orders.slice(0, 5).map(o => (
                    <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 font-bold text-gray-700">#{o.id.slice(0,6).toUpperCase()}</td>
                      <td className="py-2 text-gray-500">{new Date(o.created_at).toLocaleString('id-ID', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</td>
                      <td className="py-2"><span className={`px-2 py-1 rounded text-[10px] font-bold ${o.payment_method === 'Tunai' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>{o.payment_method}</span></td>
                      <td className="py-2 font-bold text-right text-gray-800">Rp {o.total_price.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABEL DETAIL SEMUA TRANSAKSI (MUNCUL PAS PRINT) */}
          <div className="print-only hidden col-span-3 mt-4">
            <h3 className="font-bold text-sm mb-2">Detail Transaksi</h3>
            <table className="print-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Waktu</th>
                  <th>No. Transaksi</th>
                  <th>Pelanggan</th>
                  <th>Tipe</th>
                  <th>Metode Pembayaran</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, i) => (
                  <tr key={o.id}>
                    <td>{i + 1}</td>
                    <td>{new Date(o.created_at).toLocaleString('id-ID', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</td>
                    <td>#TRX-{o.id.slice(0,4).toUpperCase()}</td>
                    <td>{o.customer_name}</td>
                    <td>{o.order_type || 'Online'}</td>
                    <td>{o.payment_method}</td>
                    <td>Rp {o.total_price.toLocaleString('id-ID')}</td>
                    <td>Berhasil</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* FOOTER TTD PRINT */}
        <div className="print-only hidden mt-10">
          <div className="flex justify-between items-end">
            <div className="text-left text-xs">
              <p className="font-bold">Bananta Sultan Cafe & Resto</p>
              <p>Laporan ini dibuat secara otomatis oleh sistem.</p>
            </div>
            <div className="text-center text-xs">
              <p>Makassar, {new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</p>
              <div className="h-16"></div>
              <p className="font-bold underline">Admin Kasir</p>
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}