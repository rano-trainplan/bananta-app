import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ProtectedRoute() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cek session login saat ini
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Pantau kalau-kalau user logout/login dari tab lain
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Memeriksa Hak Akses...</div>;
  }

  // Kalau gak ada session (belum login), lempar ke halaman login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Kalau udah login, izinkan masuk ke halaman admin
  return <Outlet />;
}