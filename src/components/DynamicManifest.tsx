import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function DynamicManifest() {
  const location = useLocation();

  useEffect(() => {
    // Hapus manifest lama kalau ada
    const existingLink = document.querySelector('link[rel="manifest"]');
    if (existingLink) existingLink.remove();

    // Tentukan manifest berdasarkan URL
    let manifestUrl = '/manifest-order.json'; // Default pelanggan
    
    if (location.pathname.startsWith('/admin')) {
      manifestUrl = '/manifest-admin.json';
    } else if (location.pathname.startsWith('/kurir')) {
      manifestUrl = '/manifest-kurir.json';
    }

    // Suntikin manifest baru ke head
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = manifestUrl;
    document.head.appendChild(link);
  }, [location.pathname]);

  return null;
}