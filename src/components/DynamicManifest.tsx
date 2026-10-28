import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function DynamicManifest() {
  const location = useLocation();

  useEffect(() => {
    // Hapus semua tag manifest lama
    const existingLinks = document.querySelectorAll('link[rel="manifest"]');
    existingLinks.forEach(link => link.remove());

    // Tentukan manifest berdasarkan URL
    let manifestUrl = '/manifest-order.json'; 
    
    if (location.pathname.startsWith('/admin')) {
      manifestUrl = '/manifest-admin.json';
    } else if (location.pathname.startsWith('/kurir')) {
      manifestUrl = '/manifest-kurir.json';
    }

    // Suntikin manifest baru dengan parameter unik (biar browser gak nyimpen cache)
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = `${manifestUrl}?v=${Date.now()}`; // <-- Trik Anti-Cache
    document.head.appendChild(link);
  }, [location.pathname]);

  return null;
}