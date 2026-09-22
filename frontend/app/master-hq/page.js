'use client';
import React, { useState, useEffect } from 'react';
import SuperAdminMasterHQ from '../components/SuperAdminMasterHQ';
import { ShieldCheck, Lock, Key, ArrowRight, AlertTriangle, LogOut, ExternalLink, Cpu } from 'lucide-react';

export default function MasterHQPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [masterKey, setMasterKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // API BASE tespiti
  const [apiBase, setApiBase] = useState('http://localhost:8000');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        setApiBase(`http://${window.location.hostname}:8000`);
      } else {
        setApiBase(window.location.origin);
      }

      // Daha önce bu oturumda giriş yapılmış mı?
      const savedAuth = sessionStorage.getItem('gg_master_auth');
      if (savedAuth === 'true') {
        setIsAuthenticated(true);
      }
    }
  }, []);

  const handleMasterLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${apiBase}/api/v1/master-auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: masterKey.trim(), otp: '' })
      });
      if (res.ok) {
        setIsAuthenticated(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('gg_master_auth', 'true');
        }
      } else {
        const err = await res.json();
        setErrorMsg(err.detail || 'Yetkisiz Erişim Denemesi! Geçersiz Master Güvenlik Anahtarı.');
      }
    } catch (err) {
      setErrorMsg('Sunucuya bağlanılamadı. API adresini kontrol edin.');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setMasterKey('');
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('gg_master_auth');
    }
  };

  // EĞER MASTER DOĞRULAMASI YAPILMAMIŞSA: İZOLE GÜVENLİK GİRİŞ EKRANI
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-neutral-900 text-white flex flex-col justify-between p-4 sm:p-8 font-sans">
        {/* Üst Güvenlik Rozeti */}
        <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono tracking-widest text-amber-400 uppercase font-black">
                Golden Guard Cloud Systems
              </div>
              <div className="text-xs text-zinc-400">Root Infrastructure &amp; License Provisioning</div>
            </div>
          </div>

          <a
            href="/"
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 transition-colors"
          >
            <span>Kuyumcu ERP Girişine Dön</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Orta Kart: Master Key Girişi */}
        <div className="max-w-md mx-auto w-full my-12">
          <div className="bg-zinc-900/90 border border-amber-500/40 rounded-3xl p-8 shadow-2xl shadow-amber-500/10 backdrop-blur-xl relative overflow-hidden">
            {/* Arka plan parlama efekti */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 text-black flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30 mb-4">
                <Lock className="w-8 h-8" />
              </div>
              <h1 className="text-xl font-black text-white tracking-tight">SaaS Master HQ Girişi</h1>
              <p className="text-xs text-zinc-400 mt-1">
                Bu alana yalnızca sistem sahibi erişebilir. Müşteri firmalar ve normal adminler buraya erişemez.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3.5 bg-red-950/80 border border-red-800/80 rounded-xl text-red-300 text-xs flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleMasterLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Master Güvenlik Anahtarı
                </label>
                <input
                  type="password"
                  value={masterKey}
                  onChange={(e) => setMasterKey(e.target.value)}
                  placeholder="Master Key giriniz..."
                  autoFocus
                  required
                  className="w-full bg-black/60 border border-zinc-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-white placeholder-zinc-500 rounded-xl px-4 py-3 text-sm font-mono tracking-widest outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black py-3 rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
              >
                {loading ? (
                  <span>Doğrulanıyor...</span>
                ) : (
                  <>
                    <span>Master HQ Konsolunu Aç</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-zinc-800 text-center">
              <div className="text-[10px] text-zinc-500 font-mono">
                SHA-256 Şifreli Oturum • İzole Bulut Yönetimi
              </div>
            </div>
          </div>
        </div>

        {/* Alt Bilgi */}
        <div className="text-center text-[11px] text-zinc-500 max-w-md mx-auto">
          Golden Guard Multi-Tenant Enterprise Cloud Architecture &copy; 2026. Tüm hakları saklıdır.
        </div>
      </div>
    );
  }

  // EĞER DOĞRULAMA BAŞARILIYSA: TAM MASTER HQ YÖNETİM MERKEZİ
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 flex flex-col font-sans">
      {/* Özel Üst Header Bar (Sadece Master HQ Kullanıcısı Görür) */}
      <header className="bg-zinc-950/95 border-b border-amber-500/30 sticky top-0 z-50 backdrop-blur-md px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-300 text-black flex items-center justify-center font-black text-sm shadow-md shadow-amber-500/20">
              👑
            </div>
            <div>
              <div className="text-xs font-black text-white flex items-center gap-2">
                <span>GOLDEN GUARD CORE MASTER HQ</span>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 text-[9px] font-mono rounded font-bold">
                  ROOT ADMIN
                </span>
              </div>
              <div className="text-[10px] text-zinc-400">
                Tüm Müşteri Firmalar, Lisanslar, Kotalar ve Bulut Maliyet Yönetimi
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 transition-colors"
            >
              <span>Mağaza ERP Önizleme</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-950/70 border border-red-800/60 transition-colors font-bold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Güvenli Çıkış</span>
            </button>
          </div>
        </div>
      </header>

      {/* Ana Master HQ Kokpiti */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6">
        <SuperAdminMasterHQ
          currentUser={{ username: 'MasterRoot', role: 'SUPER_ADMIN' }}
          apiBase={apiBase}
          token="MASTER_SESSION_ROOT"
        />
      </main>
    </div>
  );
}
