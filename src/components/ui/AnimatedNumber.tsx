import { useEffect, useState } from 'react';

export default function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number, prefix?: string, suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1000; // Durasi animasi 1 detik (1000ms)
    
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Rumus easing biar gerakannya melambat di akhir (smooth)
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      
      setDisplayValue(Math.floor(easeOutProgress * value));
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(value); // Pastiin angka akhirnya pas
      }
    };
    
    window.requestAnimationFrame(step);
  }, [value]);

  return (
    <span>
      {prefix}{displayValue.toLocaleString('id-ID')}{suffix}
    </span>
  );
}