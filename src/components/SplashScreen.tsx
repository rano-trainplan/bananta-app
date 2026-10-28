import { useEffect, useState } from 'react';
import { Store } from 'lucide-react';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Durasi splash screen 1.5 detik
    const timer = setTimeout(() => {
      setIsFading(true);
      setTimeout(onFinish, 500); // Tunggu animasi fade-out selesai (0.5s)
    }, 1500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white ${isFading ? 'splash-fade-out' : ''}`}>
      
      {/* Logo dengan Efek Ripple & Float */}
      <div className="relative flex items-center justify-center mb-6">
        {/* Ripple 1 */}
        <div className="absolute w-32 h-32 bg-orange-400 rounded-full animate-pulse-ring"></div>
        {/* Ripple 2 (Delay) */}
        <div className="absolute w-32 h-32 bg-orange-300 rounded-full animate-pulse-ring" style={{ animationDelay: '0.5s' }}></div>
        
        {/* Logo Utama */}
        <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-[2rem] shadow-2xl flex items-center justify-center animate-logo-float">
          <Store size={48} className="text-white drop-shadow-md" />
        </div>
      </div>

      {/* Teks */}
      <h1 className="text-2xl font-bold text-gray-800 tracking-wide mb-2 animate-fade-in-up">
        Bananta Sultan
      </h1>
      <p className="text-xs text-gray-400 font-medium tracking-widest uppercase animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        Resto & Delivery
      </p>

      {/* Loading Bar */}
      <div className="mt-8 w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-orange-500 rounded-full animate-[loading-bar_1.5s_ease-in-out_forwards]" style={{ width: '0%' }}></div>
      </div>
      
      <style>{`
        @keyframes loading-bar {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}