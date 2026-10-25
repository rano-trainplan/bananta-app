import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Lock, Mail, ArrowRight, Eye, EyeOff, ShieldCheck, ChevronLeft, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Login berhasil! Selamat datang Admin.");
      navigate('/admin');
    } catch (error: any) {
      toast.error(error.message || "Gagal login. Periksa email dan password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] relative overflow-hidden flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 selection:bg-orange-200">
      
      {/* BACKGROUND GRADIENT MESH */}
      <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-orange-100/60 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-yellow-100/60 rounded-full blur-[120px]"></div>
      </div>

      {/* TOP BAR (Responsif: Rapi ke samping di layar besar) */}
      <div className="absolute top-0 w-full p-4 sm:p-6 lg:px-10 flex flex-row justify-between items-center z-10">
        {/* Kiri: Logo & Nama */}
        <div className="flex items-center gap-2 sm:gap-3">
          <img src="/logo-candu.png" alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
          <span className="font-bold text-gray-800 text-sm sm:text-base tracking-tight whitespace-nowrap">Bananta Sultan</span>
        </div>
        
        {/* Kanan: Status System (Rapi ke samping) */}
        <div className="flex flex-row items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-bold text-gray-500 whitespace-nowrap">
          <span className="flex items-center gap-1.5 text-green-600"><span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></span> System Online</span>
          <span className="text-gray-300">|</span>
          <span>Server v2.4.2</span>
        </div>
      </div>

      {/* KARTU LOGIN UTAMA (Responsif: Proporsional di semua device) */}
      <div className="w-full max-w-[420px] bg-white/90 backdrop-blur-2xl border border-white/60 p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2rem] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] relative z-10 mt-16 sm:mt-10 animate-fade-in-up">
        
        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mb-4 animate-float">
            <img src="/logo-candu.png" alt="Ayam Geprek Candu" className="w-full h-full object-contain drop-shadow-xl" />
          </div>
          
          <div className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-600 text-[9px] sm:text-[10px] font-extrabold px-3 py-1 rounded-full mb-3 tracking-wider uppercase">
            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
            Portal Admin
          </div>
          
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1.5 tracking-tight">Masuk ke Dashboard</h1>
          <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed px-2">Akses kredensial terverifikasi untuk memantau outlet, inventaris, dan finansial Bananta Sultan.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
          
          {/* Input Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-wide ml-1">Email Administrator</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white outline-none transition-all placeholder:text-gray-400" 
                placeholder="admin@bananta.com" 
                required 
              />
            </div>
          </div>

          {/* Input Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] sm:text-xs font-bold text-gray-600 uppercase tracking-wide ml-1">Kata Sandi Akses</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-3 sm:py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white outline-none transition-all placeholder:text-gray-400" 
                placeholder="••••••••" 
                required 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Ingat Saya & Lupa Password */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-orange-500 border-orange-500' : 'border-gray-300 bg-white group-hover:border-orange-400'}`}>
                {rememberMe && <CheckCircle2 size={12} className="text-white" />}
              </div>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)} 
              />
              <span className="text-[11px] sm:text-xs font-medium text-gray-600">Ingat saya</span>
            </label>
            <a href="#" className="text-[11px] sm:text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors">Lupa Password?</a>
          </div>

          {/* Tombol Login */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full relative overflow-hidden bg-orange-500 text-white py-3.5 rounded-xl font-bold text-sm shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] hover:bg-orange-600 hover:shadow-[0_6px_20px_rgba(249,115,22,0.23)] hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Memverifikasi...
              </span>
            ) : (
              <>Masuk Dashboard <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        {/* Footer Card */}
        <div className="mt-8 text-center space-y-3 border-t border-gray-100 pt-6">
          <div className="flex flex-wrap items-center justify-center gap-2 text-[9px] sm:text-[10px] font-bold text-gray-400">
            <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-green-500"/> End-to-End Encrypted</span>
            <span className="hidden sm:inline">•</span>
            <span>Bananta HQ Enterprise</span>
          </div>
          <Link to="/" className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors">
            <ChevronLeft size={14} /> Kembali ke Website Utama
          </Link>
        </div>

      </div>
    </div>
  );
}