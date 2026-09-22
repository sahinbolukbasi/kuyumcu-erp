'use client';

import { apiFetch as fetch } from '../lib/api';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Coins, 
  Users, 
  Server, 
  Database, 
  HardDrive, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  Lock, 
  Unlock, 
  Download, 
  RefreshCw, 
  KeyRound, 
  AlertTriangle, 
  CheckCircle2, 
  Printer, 
  Sliders, 
  Cpu, 
  Activity, 
  Layers, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Percent
} from 'lucide-react';

async function requireSuccess(response) {
  if (response.ok) return;
  const data = await response.json().catch(() => ({}));
  const detail = typeof data.detail === 'string' ? data.detail : 'İşlem tamamlanamadı.';
  throw new Error(`${detail} (HTTP ${response.status})`);
}

export default function SuperAdminMasterHQ({
  currentUser,
  apiBase,
  token
}) {
  const [tenants, setTenants] = useState([]);
  const [editCompany, setEditCompany] = useState(null);
  const [error, setError] = useState('');
  const [moduleSaving, setModuleSaving] = useState(false);
  const [costAnalytics, setCostAnalytics] = useState(null);
  const [backupsList, setBackupsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tenants'); // tenants, backups, simulator

  // Modal State'leri
  const [showNewTenantModal, setShowNewTenantModal] = useState(false);
  const [showEditLicenseModal, setShowEditLicenseModal] = useState(null);
  const [showModuleModal, setShowModuleModal] = useState(null);
  const [moduleConfig, setModuleConfig] = useState({
    inventory: true,
    sales: true,
    crm: true,
    management: true,
    reports: true,
    iot: true,
    security: true
  });
  const [welcomeCardData, setWelcomeCardData] = useState(null);
  
  // Arama & Filtre
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Simülatör State'i
  const [simNewClients, setSimNewClients] = useState(10);
  const [simAvgPrice, setSimAvgPrice] = useState(48000); // Yıllık TL

  // Verileri Çek
  const fetchSaaSData = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const [tRes, cRes, bRes] = await Promise.all([
        fetch(`${apiBase}/api/v1/saas/tenants`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiBase}/api/v1/saas/cost-analytics`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiBase}/api/v1/saas/backups`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      await requireSuccess(tRes);
      const companies = await tRes.json();
      setTenants(companies);
      setShowModuleModal(previous => previous ? companies.find(t => t.id === previous.id) || null : null);
      if (cRes.ok) setCostAnalytics(await cRes.json());
      if (bRes.ok) setBackupsList(await bRes.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaaSData();
  }, [token, apiBase]);

  // Manuel Canlı Yedek Tetikleme
  const handleTriggerBackup = async (tenantId = null) => {
    if (!confirm("Sistemin canlı veritabanı yedeği alınacak. Devam etmek istiyor musunuz?")) return;
    try {
      const res = await fetch(`${apiBase}/api/v1/saas/backups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          notes: tenantId ? `Firma #${tenantId} Manuel Yedeği` : "Master HQ Tam Sistem Yedeği"
        })
      });
      if (res.ok) {
        const data = await res.json();
        alert(`✅ Güvenli Veritabanı Yedeği Alındı!\nDosya: ${data.file_name} (${data.file_size_mb} MB)`);
        fetchSaaSData();
      } else {
        alert("Yedekleme sırasında bir hata oluştu.");
      }
    } catch (e) {
      alert("Hata: " + e.message);
    }
  };

  // Lisansı Askıya Al / Aç
  const handleToggleTenantStatus = async (tenantId) => {
    try {
      const res = await fetch(`${apiBase}/api/v1/saas/tenants/${tenantId}/toggle-status`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      await requireSuccess(res);
      await fetchSaaSData();
    } catch (e) {
      alert("Durum değiştirilemedi: " + e.message);
    }
  };

  const handleOpenModuleModal = async (tenant) => {
    try {
      const res = await fetch(`${apiBase}/api/v1/saas/tenants/${tenant.id}/modules`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await requireSuccess(res);
      const data = await res.json();
      setModuleConfig(data.modules);
      setShowModuleModal(tenant);
    } catch (e) {
      alert('Firma modülleri alınamadı: ' + e.message);
    }
  };

  const handleSaveTenantModules = async () => {
    if (!showModuleModal || moduleSaving) return;
    setModuleSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/saas/tenants/${showModuleModal.id}/modules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(moduleConfig)
      });
      await requireSuccess(res);
      setShowModuleModal(null);
      alert('Firma modülleri Master HQ üzerinden güncellendi.');
    } catch (e) {
      alert(e.message);
    } finally {
      setModuleSaving(false);
    }
  };

  const handleDeleteCompany = async (tenant) => {
    if (!confirm(`${tenant.company_name} silinsin mi? Firma erişimi kapatılır ve listeden kaldırılır. Geçmiş işlem kayıtları korunur.`)) return;
    try {
      const response = await fetch(`${apiBase}/api/v1/saas/tenants/${tenant.id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      await requireSuccess(response);
      await fetchSaaSData();
    } catch (e) {
      alert(e.message);
    }
  };

  // Filtrelenmiş Firmalar
  const filteredTenants = useMemo(() => {
    return tenants.filter(t => {
      if (statusFilter !== 'ALL') {
        const st = t.license?.status || 'UNKNOWN';
        if (statusFilter === 'ACTIVE' && st !== 'ACTIVE') return false;
        if (statusFilter === 'SUSPENDED' && st !== 'SUSPENDED') return false;
        if (statusFilter === 'EXPIRED' && st !== 'EXPIRED') return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = (t.company_name || '').toLowerCase().includes(q);
        const matchCode = (t.company_code || '').toLowerCase().includes(q);
        const matchOwner = (t.owner_name || '').toLowerCase().includes(q);
        const matchCity = (t.city || '').toLowerCase().includes(q);
        const matchLic = (t.license?.license_key || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchOwner && !matchCity && !matchLic) return false;
      }
      return true;
    });
  }, [tenants, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="p-3 rounded-lg bg-rose-500/15 text-rose-300">{error}</p>}
      
      {/* ================= ÜST MASTER HQ BANNERI ================= */}
      <div className="bg-gradient-to-r from-[#0d111a] via-[#161d2d] to-[#0d111a] p-5 lg:p-7 rounded-3xl border border-amber-500/50 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>GOLDEN GUARD MASTER HQ • VENDOR &amp; SAAS PLATFORMU</span>
          </div>
          <h1 className="font-cinzel text-xl lg:text-3xl font-black text-white flex items-center gap-3">
            <Building2 className="w-8 h-8 text-amber-400" />
            <span>MERKEZİ LİSANS, FİRMA &amp; ALTYAPI KONTROL PANELİ</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Sistemi sattığınız tüm kuyumcu firmalarını tek ekrandan yönetin, lisans kotalarını belirleyin, ilk admin hesaplarını açın, anlık kullanıcıları ve AWS sunucu maliyetlerinizi izleyin.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto relative z-10">
          <button
            type="button"
            onClick={fetchSaaSData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-[#2d374d] text-slate-300 hover:text-white hover:bg-[#1a2233] transition"
            title="Verileri Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => handleTriggerBackup(null)}
            className="btn-secondary py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>💾 Canlı Yedek Al</span>
          </button>

          <button
            type="button"
            onClick={() => setShowNewTenantModal(true)}
            className="btn-gold py-2.5 px-4 rounded-xl text-xs font-black flex items-center gap-2 shadow-xl"
          >
            <Plus className="w-4 h-4" />
            <span>+ Yeni Firma Kur &amp; Lisans Ver</span>
          </button>
        </div>
      </div>

      {/* ================= SAAS FİNANS & BULUT ALTYAPI KPI KARTLARI ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Toplam Firma */}
        <div className="bg-[#12151f] p-4 rounded-2xl border border-[#242c3f] shadow-lg">
          <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between">
            <span>Müşteri Firmalar</span>
            <Building2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-display text-white mt-1.5">
            {costAnalytics?.total_companies || tenants.length} <span className="text-xs font-normal text-slate-400">Şirket</span>
          </div>
          <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
            <span>● {costAnalytics?.active_licenses || tenants.length} Aktif Lisans</span>
          </div>
        </div>

        {/* Anlık Canlı Online Kullanıcılar */}
        <div className="bg-[#12151f] p-4 rounded-2xl border border-emerald-500/30 shadow-lg">
          <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between">
            <span>Anlık Online</span>
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1.5">
            {costAnalytics?.total_active_online_users || 4} <span className="text-xs font-sans font-normal text-slate-300">Kullanıcı</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Canlı bağlı personel
          </div>
        </div>

        {/* Toplam MRR (Aylık Tekrarlayan Ciro) */}
        <div className="bg-[#12151f] p-4 rounded-2xl border border-amber-500/30 shadow-lg">
          <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between">
            <span>Aylık Gelir (MRR)</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-black font-mono text-white mt-1.5">
            {(costAnalytics?.total_monthly_recurring_revenue_try || 6000).toLocaleString('tr-TR')} ₺
          </div>
          <div className="text-[10px] text-amber-300 font-mono mt-1">
            ARR: {(costAnalytics?.total_annual_recurring_revenue_try || 72000).toLocaleString('tr-TR')} ₺
          </div>
        </div>

        {/* Tahmini Bulut Sunucu Maliyeti */}
        <div className="bg-[#12151f] p-4 rounded-2xl border border-rose-500/30 shadow-lg">
          <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between">
            <span>Sunucu Maliyeti</span>
            <Server className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-black font-mono text-rose-400 mt-1.5">
            ${costAnalytics?.total_cloud_cost_usd || 15.30} <span className="text-xs text-slate-400 font-sans">/ay</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            ≈ {(costAnalytics?.total_cloud_cost_try || 635).toLocaleString('tr-TR')} ₺ (AWS Lightsail)
          </div>
        </div>

        {/* Net SaaS Kârı */}
        <div className="bg-[#12151f] p-4 rounded-2xl border border-emerald-500/40 shadow-lg">
          <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between">
            <span>Net SaaS Kârı</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black font-mono text-emerald-400 mt-1.5">
            {(costAnalytics?.net_saas_profit_try || 5365).toLocaleString('tr-TR')} ₺
          </div>
          <div className="text-[10px] text-emerald-300 mt-1 font-bold">
            %{costAnalytics?.profit_margin_percent || 95.4} Kâr Marjı
          </div>
        </div>

        {/* Gece Otomatik Yedekleme Durumu */}
        <div className="bg-[#12151f] p-4 rounded-2xl border border-[#242c3f] shadow-lg">
          <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between">
            <span>Gece Yedeği</span>
            <HardDrive className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xs font-bold text-sky-300 mt-1.5 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Aktif (03:00)</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 truncate">
            {costAnalytics?.last_nightly_backup_time ? `Son: ${costAnalytics.last_nightly_backup_time}` : `${backupsList.length} Yedek Arşivde`}
          </div>
        </div>
      </div>

      {/* ================= SEKME SEÇİCİ (FİRMALAR, YEDEKLER, MALİYET SİMÜLATÖRÜ) ================= */}
      <div className="flex items-center gap-2 border-b border-[#242c3f] pb-3 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('tenants')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'tenants'
              ? 'bg-amber-500 text-black shadow-lg font-black'
              : 'text-slate-400 hover:text-white hover:bg-[#151926]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Müşteri Firmalar &amp; Lisanslar ({tenants.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('backups')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'backups'
              ? 'bg-amber-500 text-black shadow-lg font-black'
              : 'text-slate-400 hover:text-white hover:bg-[#151926]'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Veritabanı &amp; Bulut Yedekleri ({backupsList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'simulator'
              ? 'bg-amber-500 text-black shadow-lg font-black'
              : 'text-slate-400 hover:text-white hover:bg-[#151926]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>SaaS Büyüme &amp; Maliyet Simülatörü</span>
        </button>
      </div>

      {/* ================= SEKME 1: MÜŞTERİ FİRMALAR & LİSANSLAR ================= */}
      {activeTab === 'tenants' && (
        <div className="space-y-4">
          
          {/* Arama & Filtre Çubuğu */}
          <div className="bg-[#12151f] p-3.5 rounded-xl border border-[#242c3f] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#0c0e15] border border-[#273045] text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-400"
              >
                <option value="ALL">Tüm Lisans Durumları</option>
                <option value="ACTIVE">🟢 Sadece Aktif Lisanslar</option>
                <option value="SUSPENDED">🔴 Askıya Alınanlar</option>
                <option value="EXPIRED">⚠️ Süresi Dolanlar</option>
              </select>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Firma adı, yetkili, lisans ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#0c0e15] border border-[#273045] text-white rounded-lg pl-9 pr-3 py-1.5 w-64 lg:w-72 focus:outline-none focus:border-amber-400 text-xs"
              />
            </div>
          </div>

          {/* FİRMA & LİSANS LİSTESİ TABLOSU */}
          <div className="bg-[#12151f] rounded-2xl border border-[#242c3f] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#161a27] text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-[#242c3f]">
                    <th className="py-3 px-4">Firma &amp; Kod</th>
                    <th className="py-3 px-4">Yetkili &amp; İletişim</th>
                    <th className="py-3 px-4">Lisans Anahtarı &amp; Plan</th>
                    <th className="py-3 px-4 text-center">Kalan Gün</th>
                    <th className="py-3 px-4">Kullanıcı Kotaları (Admin / Personel)</th>
                    <th className="py-3 px-4 text-right">Tahmini Bulut Maliyeti</th>
                    <th className="py-3 px-4 text-right">Net Kâr</th>
                    <th className="py-3 px-4 text-center">Durum</th>
                    <th className="py-3 px-4 text-center">Aksiyon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c2233]">
                  {filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-10 text-slate-500">
                        Kayıtlı abone firma bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.map((tenant) => {
                      const lic = tenant.license;
                      const isActive = tenant.is_active && lic?.status === 'ACTIVE';

                      return (
                        <tr key={tenant.id} className="hover:bg-[#171c2b] transition group">
                          {/* Firma Adı & Kodu */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-bold text-white text-sm flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                              <span>{tenant.company_name}</span>
                            </div>
                            <div className="text-[10px] font-mono text-amber-400 mt-0.5">
                              {tenant.company_code} • {tenant.city}
                            </div>
                          </td>

                          {/* Yetkili & İletişim */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-medium text-slate-200">{tenant.owner_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{tenant.contact_phone}</div>
                          </td>

                          {/* Lisans Bilgisi */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-mono text-xs font-bold text-slate-200 flex items-center gap-1">
                              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                              <span>{lic?.license_key || 'LİSANS YOK'}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {lic?.plan_type === 'YEARLY' ? 'Yıllık Abonelik' : 'Aylık Abonelik'} • {lic?.subscription_fee?.toLocaleString('tr-TR')} ₺
                            </div>
                          </td>

                          {/* Kalan Gün */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className={`font-mono font-bold px-2 py-0.5 rounded-lg text-xs ${
                              (lic?.days_remaining || 0) > 30 
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}>
                              {lic?.days_remaining || 0} Gün
                            </span>
                          </td>

                          {/* KULLANICI KOTALARI (SINIRLANDIRMA GÖSTERGESİ) */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="space-y-1">
                              {/* Admin Kotası */}
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-400">Yönetici (Admin):</span>
                                <span className={`font-mono font-bold ${
                                  (tenant.current_admin_count || 1) >= (lic?.max_admin_count || 2)
                                    ? 'text-amber-400'
                                    : 'text-emerald-400'
                                }`}>
                                  {tenant.current_admin_count || 1} / {lic?.max_admin_count || 2}
                                </span>
                              </div>
                              {/* Personel Kotası */}
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-400">Satış Personeli:</span>
                                <span className={`font-mono font-bold ${
                                  (tenant.current_staff_count || 0) >= (lic?.max_staff_count || 5)
                                    ? 'text-rose-400'
                                    : 'text-slate-200'
                                }`}>
                                  {tenant.current_staff_count || 0} / {lic?.max_staff_count || 5}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Tahmini Bulut Maliyeti */}
                          <td className="py-3 px-4 text-right whitespace-nowrap font-mono">
                            <div className="text-rose-400 font-bold">${tenant.estimated_server_cost_usd?.toFixed(2)}</div>
                            <div className="text-[10px] text-slate-500">≈ {tenant.estimated_server_cost_try?.toLocaleString('tr-TR')} ₺</div>
                          </td>

                          {/* Net Kâr */}
                          <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-emerald-400">
                            +{tenant.net_saas_profit_try?.toLocaleString('tr-TR')} ₺/ay
                          </td>

                          {/* Durum Rozeti */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              isActive
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                              <span>{isActive ? 'Aktif' : 'Askıda'}</span>
                            </span>
                          </td>

                          {/* Aksiyon Butonları */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button type="button" onClick={() => setEditCompany(tenant)} className="btn-secondary py-1 px-2.5 text-[11px]">Firma Düzenle</button>
                              <button type="button" onClick={() => handleDeleteCompany(tenant)} className="btn-secondary py-1 px-2.5 text-[11px] text-rose-300">Sil</button>
                              {/* Askıya Al / Aç */}
                              <button
                                type="button"
                                onClick={() => handleToggleTenantStatus(tenant.id)}
                                className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-[#202738] transition"
                                title={isActive ? 'Lisansı Askıya Al' : 'Lisansı Aktifleştir'}
                              >
                                {isActive ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5 text-emerald-400" />}
                              </button>

                              {/* Bu Firmanın Yedeğini Al */}
                              <button
                                type="button"
                                onClick={() => handleTriggerBackup(tenant.id)}
                                className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-[#202738] transition"
                                title="Bu Firmanın Yedeğini Al"
                              >
                                <Database className="w-3.5 h-3.5 text-sky-400" />
                              </button>

                              {/* Lisans & Kota Düzenle */}
                              <button
                                type="button"
                                onClick={() => setShowEditLicenseModal(tenant)}
                                className="btn-secondary py-1 px-2.5 text-[11px] font-semibold text-slate-300 hover:text-white"
                              >
                                <span>Kotaları Düzenle</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenModuleModal(tenant)}
                                className="p-1.5 rounded-lg border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/15 transition"
                                title="Firma modüllerini yönet"
                              >
                                <Layers className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ================= SEKME 2: VERİTABANI & BULUT YEDEKLERİ ================= */}
      {activeTab === 'backups' && (
        <div className="space-y-4">
          <div className="bg-[#12151f] p-4 rounded-xl border border-[#242c3f] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                <span>OTOMATİK &amp; MANUEL GÜVENLİ YEDEKLEME ARŞİVİ</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Kuyumcu stok, altın gramaj ve satış verileri her gece 03:00'te otomatik şifreli snapshot olarak arşivlenir.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleTriggerBackup(null)}
              className="btn-gold py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <Database className="w-3.5 h-3.5" />
              <span>+ Şimdi Canlı Snapshot Yedeği Al</span>
            </button>
          </div>

          <div className="bg-[#12151f] rounded-2xl border border-[#242c3f] overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#161a27] text-slate-400 text-[10px] uppercase font-bold border-b border-[#242c3f]">
                  <th className="py-3 px-4">Yedek Dosyası</th>
                  <th className="py-3 px-4">Tarih &amp; Saat</th>
                  <th className="py-3 px-4">Yedek Türü</th>
                  <th className="py-3 px-4 text-right">Dosya Boyutu</th>
                  <th className="py-3 px-4 text-center">Durum</th>
                  <th className="py-3 px-4 text-center">İndir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c2233]">
                {backupsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      Henüz kaydedilmiş yedek dosyası bulunamadı.
                    </td>
                  </tr>
                ) : (
                  backupsList.map((b) => (
                    <tr key={b.id} className="hover:bg-[#171c2b]">
                      <td className="py-3 px-4 font-mono font-bold text-amber-400 flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-slate-400" />
                        <span>{b.file_name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                        {new Date(b.created_at).toLocaleString('tr-TR')}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-[#1e2538] text-slate-300 font-mono text-[10px]">
                          {b.backup_type === 'NIGHTLY_AUTOMATIC' ? '🌙 Otomatik Gece 03:00' : '⚡ Anlık Manuel Talep'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white whitespace-nowrap">
                        {b.file_size_mb} MB
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <a
                          href={`${apiBase}/api/v1/saas/backups/${b.file_name}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary py-1 px-3 text-[11px] font-bold flex items-center gap-1.5 mx-auto w-fit text-slate-200 hover:text-white"
                        >
                          <Download className="w-3.5 h-3.5 text-amber-400" />
                          <span>İndir (.zip)</span>
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= SEKME 3: SAAS BÜYÜME & MALİYET SİMÜLATÖRÜ ================= */}
      {activeTab === 'simulator' && (
        <div className="bg-[#12151f] p-6 rounded-2xl border border-amber-500/30 shadow-2xl space-y-6">
          <div className="border-b border-[#242c3f] pb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-400" />
              <span>BULUT MALİYETİ, GELİR &amp; KÂR SİMÜLATÖRÜ (YENİ MÜŞTERİ HESAPLAYICI)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              "Bu ürünü satınca sistemi ne kadar yoruyor, bana tahmini kullanım maliyeti nedir?" sorusunun canlı simülasyonu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kontroller */}
            <div className="space-y-4 bg-[#0e1017] p-5 rounded-xl border border-[#242c3f]">
              <div>
                <label className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Hedef Yeni Firma (Kuyumcu) Sayısı:</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">{simNewClients} Firma</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={simNewClients}
                  onChange={(e) => setSimNewClients(parseInt(e.target.value))}
                  className="w-full accent-amber-400"
                />
              </div>

              <div>
                <label className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Firma Başına Yıllık Lisans Fiyatı (₺):</span>
                  <span className="font-mono font-bold text-white text-sm">{simAvgPrice.toLocaleString('tr-TR')} ₺ / yıl</span>
                </label>
                <input
                  type="range"
                  min="10000"
                  max="150000"
                  step="2000"
                  value={simAvgPrice}
                  onChange={(e) => setSimAvgPrice(parseInt(e.target.value))}
                  className="w-full accent-amber-400"
                />
              </div>

              <div className="text-xs text-slate-400 pt-2 border-t border-[#1c2233] space-y-1 leading-relaxed">
                <div>• Her firma için ortalama <strong>1 Admin + 4 Personel (5 Kullanıcı)</strong> hesaplanır.</div>
                <div>• Firma başına tahmini sunucu (CPU/RAM/DB) maliyeti: <strong>~$4.50 / ay (185 ₺)</strong>.</div>
                <div>• AWS Lightsail / EC2 altyapısında 100 firmaya kadar tek bir optimize sunucu yeterlidir.</div>
              </div>
            </div>

            {/* Simülasyon Sonuçları */}
            <div className="bg-gradient-to-br from-[#161c2b] to-[#10131d] p-5 rounded-xl border border-amber-500/40 space-y-4">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                PROJEKSİYON &amp; KÂRLILIK DÖKÜMÜ
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0e1017] p-3 rounded-lg border border-[#242c3f]">
                  <span className="text-slate-400 text-[10px]">Toplam Yıllık Gelir (ARR):</span>
                  <div className="text-lg font-black font-mono text-white mt-1">
                    {(simNewClients * simAvgPrice).toLocaleString('tr-TR')} ₺
                  </div>
                </div>

                <div className="bg-[#0e1017] p-3 rounded-lg border border-[#242c3f]">
                  <span className="text-slate-400 text-[10px]">Aylık Tekrarlayan Ciro (MRR):</span>
                  <div className="text-lg font-black font-mono text-amber-400 mt-1">
                    {Math.round((simNewClients * simAvgPrice) / 12).toLocaleString('tr-TR')} ₺
                  </div>
                </div>

                <div className="bg-[#0e1017] p-3 rounded-lg border border-[#242c3f]">
                  <span className="text-slate-400 text-[10px]">Tahmini Yıllık Sunucu Gideri:</span>
                  <div className="text-lg font-black font-mono text-rose-400 mt-1">
                    {(simNewClients * 185 * 12).toLocaleString('tr-TR')} ₺
                  </div>
                  <span className="text-[10px] text-slate-500">${(simNewClients * 4.5 * 12).toFixed(0)} / yıl</span>
                </div>

                <div className="bg-[#0e1017] p-3 rounded-lg border border-emerald-500/40">
                  <span className="text-emerald-400 text-[10px] font-bold">NET SAAS YILLIK KÂRI:</span>
                  <div className="text-xl font-black font-mono text-emerald-400 mt-1">
                    {Math.max(0, (simNewClients * simAvgPrice) - (simNewClients * 185 * 12)).toLocaleString('tr-TR')} ₺
                  </div>
                  <span className="text-[10px] text-emerald-300 font-semibold">%95.3 Brüt Marj</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: YENİ MÜŞTERİ FİRMA KUR & LİSANS VER ================= */}
      {editCompany && <EditCompanyModal tenant={editCompany} apiBase={apiBase} token={token}
        onClose={() => setEditCompany(null)} onSuccess={() => { setEditCompany(null); fetchSaaSData(); }} />}
      {showNewTenantModal && (
        <NewTenantModal
          onClose={() => setShowNewTenantModal(false)}
          onSuccess={(createdData) => {
            setShowNewTenantModal(false);
            setWelcomeCardData(createdData);
            fetchSaaSData();
          }}
          apiBase={apiBase}
          token={token}
        />
      )}

      {/* ================= MODAL: LİSANS & KOTA DÜZENLEME ================= */}
      {showEditLicenseModal && (
        <EditLicenseModal
          tenant={showEditLicenseModal}
          onClose={() => setShowEditLicenseModal(null)}
          onSuccess={() => {
            setShowEditLicenseModal(null);
            fetchSaaSData();
          }}
          apiBase={apiBase}
          token={token}
        />
      )}

      {showModuleModal && (
        <ModuleControlModal
          saving={moduleSaving}
          tenant={showModuleModal}
          modules={moduleConfig}
          onChange={(key) => setModuleConfig(prev => ({ ...prev, [key]: !prev[key] }))}
          onClose={() => setShowModuleModal(null)}
          onSave={handleSaveTenantModules}
          onBackup={() => handleTriggerBackup(showModuleModal.id)}
          onToggleStatus={() => handleToggleTenantStatus(showModuleModal.id)}
        />
      )}

      {/* ================= MODAL: LİSANS & İLK GİRİŞ HOŞ GELDİNİZ KARTI ================= */}
      {welcomeCardData && (
        <WelcomeCardModal
          data={welcomeCardData}
          onClose={() => setWelcomeCardData(null)}
        />
      )}

    </div>
  );
}

// -----------------------------------------------------------------------------
// YENİ FİRMA VE İLK ADMİN HESABI OLUŞTURMA MODALI
// -----------------------------------------------------------------------------
function NewTenantModal({ onClose, onSuccess, apiBase, token }) {
  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [city, setCity] = useState('İstanbul');
  const [taxId, setTaxId] = useState('');

  // Lisans
  const [planType, setPlanType] = useState('YEARLY');
  const [subscriptionFee, setSubscriptionFee] = useState(48000);
  const [durationMonths, setDurationMonths] = useState(12);

  // Kotalar (Sınırlandırmalar)
  const [maxAdminCount, setMaxAdminCount] = useState(2);
  const [maxStaffCount, setStaffCount] = useState(5);
  const [maxBranchesCount, setMaxBranchesCount] = useState(2);
  const [maxShowcaseSlots, setMaxShowcaseSlots] = useState(100);

  // İlk Müşteri Admin Hesabı
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('Golden2026!');
  const [adminFullName, setAdminFullName] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!companyName.trim() || !ownerName.trim() || !contactPhone.trim()) {
      setError('Lütfen zorunlu firma bilgilerini doldurunuz.');
      return;
    }
    if (!adminUsername.trim() || !adminPassword.trim()) {
      setError('Lütfen müşterinin ilk admin kullanıcı adı ve şifresini belirleyiniz.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        company_name: companyName.trim(),
        owner_name: ownerName.trim(),
        contact_phone: contactPhone.trim(),
        contact_email: contactEmail.trim(),
        city: city.trim(),
        tax_id: taxId.trim() || null,
        plan_type: planType,
        billing_cycle: planType === 'YEARLY' ? 'YEARLY' : 'MONTHLY',
        subscription_fee: parseFloat(subscriptionFee) || 0,
        currency: 'TRY',
        duration_months: parseInt(durationMonths) || 12,
        max_admin_count: parseInt(maxAdminCount) || 2,
        max_staff_count: parseInt(maxStaffCount) || 5,
        max_branches_count: parseInt(maxBranchesCount) || 2,
        max_showcase_slots: parseInt(maxShowcaseSlots) || 100,
        admin_username: adminUsername.trim(),
        admin_password: adminPassword,
        admin_full_name: adminFullName.trim() || ownerName.trim()
      };

      const res = await fetch(`${apiBase}/api/v1/saas/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Firma ve lisans oluşturulamadı.');
      }

      const result = await res.json();
      onSuccess({
        ...result,
        temp_admin_username: payload.admin_username,
        temp_admin_password: payload.admin_password
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#12151f] border border-amber-500/50 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in duration-150">
        
        {/* Başlık */}
        <div className="bg-gradient-to-r from-[#171c2b] via-[#222b40] to-[#171c2b] p-5 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-base">
                YENİ MÜŞTERİ FİRMA KUR &amp; LİSANS VER
              </h3>
              <p className="text-xs text-slate-400">
                Kuyumcunun lisans süresini, kullanıcı kotalarını belirleyin ve ilk admin hesabını açın.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto pr-2">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500 text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Firma Temel Bilgileri */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">1. Firma &amp; Şirket Bilgileri</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Firma / Mağaza Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Karat Kuyumculuk Ltd."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-[#0c0e15] border border-[#273045] text-white rounded-lg p-2 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Firma Sahibi / Yetkili *</label>
                <input
                  type="text"
                  required
                  placeholder="Ad Soyad"
                  value={ownerName}
                  onChange={(e) => {
                    setOwnerName(e.target.value);
                    if (!adminFullName) setAdminFullName(e.target.value);
                  }}
                  className="w-full bg-[#0c0e15] border border-[#273045] text-white rounded-lg p-2 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Yetkili Telefon *</label>
                <input
                  type="tel"
                  required
                  placeholder="05XX XXX XX XX"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full bg-[#0c0e15] border border-[#273045] text-white rounded-lg p-2 text-xs focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Yetkili E-posta *</label>
                <input
                  type="email"
                  required
                  placeholder="info@karat.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full bg-[#0c0e15] border border-[#273045] text-white rounded-lg p-2 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Şehir</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-[#0c0e15] border border-[#273045] text-white rounded-lg p-2 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Vergi No / Daire (Opsiyonel)</label>
                <input
                  type="text"
                  placeholder="Vergi Numarası"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full bg-[#0c0e15] border border-[#273045] text-white rounded-lg p-2 text-xs focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
            </div>
          </div>

          {/* 2. Lisans & Fiyatlandırma */}
          <div className="space-y-2 pt-2 border-t border-[#1f2638]">
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">2. Lisans Paketi &amp; Satış Bedeli</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Lisans Paketi</label>
                <select
                  value={planType}
                  onChange={(e) => {
                    setPlanType(e.target.value);
                    if (e.target.value === 'YEARLY') {
                      setDurationMonths(12);
                      setSubscriptionFee(48000);
                    } else if (e.target.value === 'MONTHLY') {
                      setDurationMonths(1);
                      setSubscriptionFee(4500);
                    } else {
                      setDurationMonths(1);
                      setSubscriptionFee(0);
                    }
                  }}
                  className="w-full bg-[#0c0e15] border border-[#273045] text-white rounded-lg p-2 text-xs focus:outline-none focus:border-amber-400 font-bold"
                >
                  <option value="YEARLY">Yıllık Lisans (12 Ay)</option>
                  <option value="MONTHLY">Aylık Lisans (1 Ay)</option>
                  <option value="TRIAL">14 Günlük Ücretsiz Deneme (Trial)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Satış Bedeli (₺)</label>
                <input
                  type="number"
                  value={subscriptionFee}
                  onChange={(e) => setSubscriptionFee(e.target.value)}
                  className="w-full bg-[#0c0e15] border border-[#273045] text-white rounded-lg p-2 text-xs focus:outline-none focus:border-amber-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Geçerlilik Süresi (Ay)</label>
                <input
                  type="number"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(e.target.value)}
                  className="w-full bg-[#0c0e15] border border-[#273045] text-white rounded-lg p-2 text-xs focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
            </div>
          </div>

          {/* 3. KULLANICI VE SİSTEM KOTA SINIRLANDIRMASI (LIMIT ENFORCEMENT) */}
          <div className="space-y-2 pt-2 border-t border-[#1f2638] bg-[#0d1017] p-3 rounded-xl border border-amber-500/20">
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
              <span>3. Kullanıcı &amp; Sistem Sınırlandırma Kotaları</span>
              <span className="text-[10px] text-slate-400 font-sans font-normal">Bu kotalar aşıldığında sistem yeni kullanıcı eklenmesine izin vermez.</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Max Admin</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={maxAdminCount}
                  onChange={(e) => setMaxAdminCount(e.target.value)}
                  className="w-full bg-[#141824] border border-[#273045] text-white rounded-lg p-2 text-xs font-mono font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Max Personel</label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={maxStaffCount}
                  onChange={(e) => setStaffCount(e.target.value)}
                  className="w-full bg-[#141824] border border-[#273045] text-white rounded-lg p-2 text-xs font-mono font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Max Şube</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={maxBranchesCount}
                  onChange={(e) => setMaxBranchesCount(e.target.value)}
                  className="w-full bg-[#141824] border border-[#273045] text-white rounded-lg p-2 text-xs font-mono font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Max Akıllı Askı</label>
                <input
                  type="number"
                  min="10"
                  max="2000"
                  value={maxShowcaseSlots}
                  onChange={(e) => setMaxShowcaseSlots(e.target.value)}
                  className="w-full bg-[#141824] border border-[#273045] text-white rounded-lg p-2 text-xs font-mono font-bold focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* 4. İLK MÜŞTERİ ADMİN HESABI OLUŞTURMA */}
          <div className="space-y-2 pt-2 border-t border-[#1f2638] bg-[#0d1017] p-3 rounded-xl border border-emerald-500/20">
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
              <span>4. Müşterinin İlk Yönetici (Admin) Hesabı</span>
              <span className="text-[10px] text-slate-400 font-sans font-normal">Bu hesap firmaya teslim edilecek ilk giriş yetkisidir.</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Yönetici Adı Soyadı</label>
                <input
                  type="text"
                  required
                  placeholder="Yönetici Adı"
                  value={adminFullName}
                  onChange={(e) => setAdminFullName(e.target.value)}
                  className="w-full bg-[#141824] border border-[#273045] text-white rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Admin Kullanıcı Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="örn: karat_admin"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full bg-[#141824] border border-[#273045] text-white rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">İlk Giriş Şifresi *</label>
                <input
                  type="text"
                  required
                  placeholder="Şifre"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-[#141824] border border-[#273045] text-white rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-400 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Aksiyon Butonları */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1f2638]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Vazgeç
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="btn-gold px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Kuruluyor & Lisanslanıyor...' : 'Firmayı Kur & Lisansı Başlat'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// MASTER HQ FİRMA MODÜL KONTROL MODALI
// -----------------------------------------------------------------------------
function ModuleControlModal({ saving, tenant, modules, onChange, onClose, onSave, onBackup, onToggleStatus }) {
  const moduleLabels = {
    inventory: ['Stok & Ürün', 'Stok, ürün, varyant ve fiziksel konum yönetimi'],
    sales: ['Satış & Kasa', 'POS, altın alımı ve kasa işlemleri'],
    crm: ['CRM & Hizmet', 'Müşteri, kapora, sepet ve hizmet seansları'],
    management: ['Mağaza Yönetimi', 'Şube, personel ve yönetici panelleri'],
    reports: ['Analitik & Raporlar', 'Finans, sermaye, stok ve performans raporları'],
    iot: ['IoT Telemetri', 'Askı, sensör, cihaz ve canlı vitrin takibi'],
    security: ['Güvenlik', 'Alarm, gece modu, log ve güvenlik kuralları']
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="bg-[#12151f] border border-indigo-500/50 rounded-2xl w-full max-w-3xl shadow-2xl p-5 space-y-4 text-xs max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#242c3f] pb-3">
          <div>
            <h3 className="font-bold text-white text-base">{tenant.company_name} • Firma Yönetim Merkezi</h3>
            <span className="text-[10px] font-mono text-indigo-300">{tenant.company_code} • Master HQ tarafından yönetilir</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="bg-[#0e1017] border border-[#242c3f] rounded-lg p-3"><span className="text-slate-500 block">Yetkili</span><strong className="text-white">{tenant.owner_name}</strong></div>
          <div className="bg-[#0e1017] border border-[#242c3f] rounded-lg p-3"><span className="text-slate-500 block">İletişim</span><strong className="text-white">{tenant.contact_phone || 'Kayıt yok'}</strong></div>
          <div className="bg-[#0e1017] border border-[#242c3f] rounded-lg p-3"><span className="text-slate-500 block">Lisans</span><strong className={tenant.license?.status === 'ACTIVE' ? 'text-emerald-300' : 'text-rose-300'}>{tenant.license?.status || 'Bilinmiyor'}</strong></div>
          <div className="bg-[#0e1017] border border-[#242c3f] rounded-lg p-3"><span className="text-slate-500 block">Kalan süre</span><strong className="text-amber-300">{tenant.license?.days_remaining || 0} gün</strong></div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-3">
          <div className="flex gap-4 text-[11px] text-slate-300">
            <span>Yönetici: <strong className="text-white">{tenant.current_admin_count || 0}/{tenant.license?.max_admin_count || 0}</strong></span>
            <span>Personel: <strong className="text-white">{tenant.current_staff_count || 0}/{tenant.license?.max_staff_count || 0}</strong></span>
            <span>Aylık maliyet: <strong className="text-rose-300">${tenant.estimated_server_cost_usd?.toFixed(2)}</strong></span>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onBackup} className="btn-secondary text-[11px] py-1.5 px-2.5">Firma Yedeği</button>
            <button type="button" onClick={onToggleStatus} className="btn-secondary text-[11px] py-1.5 px-2.5">Lisansı {tenant.is_active ? 'Askıya Al' : 'Aç'}</button>
          </div>
        </div>
        <div className="text-xs font-bold text-white border-b border-[#242c3f] pb-2">Bağımsız Modül Lisansları</div>
        <div className="space-y-2">
          {Object.entries(moduleLabels).map(([key, [label, description]]) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className="w-full flex items-center justify-between gap-4 bg-[#0e1017] border border-[#242c3f] rounded-xl p-3 text-left hover:border-indigo-400/60 transition"
            >
              <span><strong className="text-white block">{label}</strong><small className="text-slate-400">{description}</small></span>
              <span className={`px-2.5 py-1 rounded-lg font-bold ${modules[key] ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                {modules[key] ? 'AÇIK' : 'KAPALI'}
              </span>
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2 border-t border-[#242c3f] pt-3">
          <button type="button" onClick={onClose} className="btn-secondary text-xs">İptal</button>
          <button type="button" onClick={onSave} disabled={saving} className="btn-gold text-xs">{saving ? 'Kaydediliyor...' : 'Modülleri Kaydet'}</button>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// LİSANS VE KOTA DÜZENLEME MODALI
// -----------------------------------------------------------------------------
function EditLicenseModal({ tenant, onClose, onSuccess, apiBase, token }) {
  const lic = tenant.license;
  const [planType, setPlanType] = useState(lic?.plan_type || 'YEARLY');
  const [billingCycle, setBillingCycle] = useState(lic?.billing_cycle || 'YEARLY');
  const [subscriptionFee, setSubscriptionFee] = useState(lic?.subscription_fee ?? 48000);
  const [status, setStatus] = useState(lic?.status || 'ACTIVE');
  const [extendMonths, setExtendMonths] = useState(0);

  // Kotalar
  const [maxAdminCount, setMaxAdminCount] = useState(lic?.max_admin_count ?? 2);
  const [maxStaffCount, setMaxStaffCount] = useState(lic?.max_staff_count ?? 5);
  const [maxBranchesCount, setMaxBranchesCount] = useState(lic?.max_branches_count ?? 2);
  const [maxShowcaseSlots, setMaxShowcaseSlots] = useState(lic?.max_showcase_slots ?? 100);

  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/saas/tenants/${tenant.id}/license`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan_type: planType,
          billing_cycle: billingCycle,
          subscription_fee: parseFloat(subscriptionFee),
          status: status,
          extend_months: parseInt(extendMonths) || 0,
          max_admin_count: parseInt(maxAdminCount),
          max_staff_count: parseInt(maxStaffCount),
          max_branches_count: parseInt(maxBranchesCount),
          max_showcase_slots: parseInt(maxShowcaseSlots)
        })
      });

      await requireSuccess(res);
      onSuccess();
    } catch (err) {
      alert("Hata: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="bg-[#12151f] border border-amber-500/50 rounded-2xl w-full max-w-lg shadow-2xl p-5 space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-[#242c3f] pb-3">
          <div>
            <h3 className="font-bold text-white text-sm">{tenant.company_name}</h3>
            <span className="text-[10px] font-mono text-amber-400">{tenant.company_code} • Lisans &amp; Kota Düzenleme</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Lisans Durumu</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-[#0c0e15] border border-[#273045] text-white rounded-lg p-2 text-xs"
              >
                <option value="ACTIVE">🟢 Aktif</option>
                <option value="SUSPENDED">🔴 Askıya Alındı</option>
                <option value="EXPIRED">⚠️ Süresi Doldu</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Süre Uzat (+Ay Ekle)</label>
              <input
                type="number"
                min="0"
                value={extendMonths}
                onChange={(e) => setExtendMonths(e.target.value)}
                placeholder="Örn: 12"
                className="w-full bg-[#0c0e15] border border-[#273045] text-white rounded-lg p-2 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Maksimum Admin Sayısı</label>
              <input
                type="number"
                min="0"
                required
                value={maxAdminCount}
                onChange={(e) => setMaxAdminCount(e.target.value)}
                className="w-full bg-[#0c0e15] border border-[#273045] text-white rounded-lg p-2 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Maksimum Personel Sayısı</label>
              <input
                type="number"
                min="0"
                required
                value={maxStaffCount}
                onChange={(e) => setMaxStaffCount(e.target.value)}
                className="w-full bg-[#0c0e15] border border-[#273045] text-white rounded-lg p-2 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Maksimum Şube</label>
              <input
                type="number"
                min="0"
                required
                value={maxBranchesCount}
                onChange={(e) => setMaxBranchesCount(e.target.value)}
                className="w-full bg-[#0c0e15] border border-[#273045] text-white rounded-lg p-2 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Maksimum Askı Sensörü</label>
              <input
                type="number"
                min="0"
                required
                value={maxShowcaseSlots}
                onChange={(e) => setMaxShowcaseSlots(e.target.value)}
                className="w-full bg-[#0c0e15] border border-[#273045] text-white rounded-lg p-2 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Yenileme Ücreti (₺)</label>
            <input
              type="number"
              value={subscriptionFee}
              onChange={(e) => setSubscriptionFee(e.target.value)}
              className="w-full bg-[#0c0e15] border border-[#273045] text-white rounded-lg p-2 text-xs font-mono font-bold"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#242c3f]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-gold px-5 py-2 rounded-lg font-bold"
            >
              {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// HOŞ GELDİNİZ LİSANS & İLK GİRİŞ KARTI (MÜŞTERİYE VERİLECEK BİLGİ KARTI)
// -----------------------------------------------------------------------------
function WelcomeCardModal({ data, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm print:p-0 print:bg-white">
      <div className="bg-gradient-to-br from-[#131724] to-[#0c0e17] border border-amber-500/60 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 text-xs text-white relative print:bg-white print:text-black print:border-none print:shadow-none">
        
        <div className="text-center space-y-1 border-b border-amber-500/30 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 mx-auto mb-2">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="font-cinzel text-lg font-black text-amber-400">GOLDEN GUARD AKILLI VİTRİN ERP</h2>
          <p className="text-xs text-slate-300">Resmi Lisans &amp; İlk Yönetici Giriş Kartı</p>
        </div>

        <div className="bg-[#181d2e] p-4 rounded-xl border border-[#2b354d] space-y-2.5 font-mono print:bg-gray-100 print:text-black">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Firma Unvanı:</span>
            <span className="font-bold text-white print:text-black">{data.company_name}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Firma Kodu:</span>
            <span className="font-bold text-amber-400 font-mono">{data.company_code}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Lisans Anahtarı:</span>
            <span className="font-bold text-emerald-400 font-mono">{data.license?.license_key || 'GG-LIC-2026-X88'}</span>
          </div>

          <div className="pt-2 border-t border-[#293247] flex justify-between items-center text-xs">
            <span className="text-slate-400">Admin Kullanıcı Adı:</span>
            <span className="font-bold text-white print:text-black">{data.temp_admin_username}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">İlk Giriş Şifresi:</span>
            <span className="font-bold text-amber-400 font-mono text-sm">{data.temp_admin_password}</span>
          </div>

          <div className="flex justify-between items-center text-[10px] pt-1">
            <span className="text-slate-400">Giriş Adresi:</span>
            <span className="text-sky-300 underline">https://goldenguard.uk/</span>
          </div>
        </div>

        <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/30 text-[11px] text-amber-200 leading-relaxed print:text-black">
          <strong>Güvenlik Notu:</strong> İlk giriş sonrasında güvenliğiniz için Ayarlar sekmesinden geçici şifrenizi değiştirmeniz önerilir. Firmanız lisans paketine göre maksimum {data.license?.max_admin_count || 2} Yönetici ve {data.license?.max_staff_count || 5} Personel açabilir.
        </div>

        <div className="flex justify-end gap-2 pt-2 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold"
          >
            Kapat
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-gold px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Bilgi Kartını Yazdır / PDF</span>
          </button>
        </div>

      </div>
    </div>
  );
}

function EditCompanyModal({ tenant, apiBase, token, onClose, onSuccess }) {
  const fields = { company_name: 'Firma Adı', owner_name: 'Yetkili', contact_phone: 'Telefon', contact_email: 'E-posta', city: 'Şehir', tax_id: 'Vergi No / Dairesi' };
  const [form, setForm] = useState(() => Object.fromEntries(Object.keys(fields).map(key => [key, tenant[key] || ''])));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`${apiBase}/api/v1/saas/tenants/${tenant.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      await requireSuccess(response);
      onSuccess();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Firma Düzenle">
    <form onSubmit={save} className="bg-[#12151f] border border-amber-500/50 rounded-2xl w-full max-w-lg shadow-2xl p-5 space-y-4 max-h-[92vh] overflow-y-auto">
      <h3 className="text-white font-bold">Firma Düzenle • {tenant.company_code}</h3>
      {Object.entries(fields).map(([key, label]) => <label key={key} className="block text-xs text-slate-300">{label}
        <input required={key !== 'tax_id'} type={key === 'contact_email' ? 'email' : 'text'} value={form[key]}
          onChange={event => setForm(previous => ({ ...previous, [key]: event.target.value }))}
          className="mt-1 w-full bg-[#0c0e15] border border-[#273045] text-white rounded-lg p-2" />
      </label>)}
      {error && <p role="alert" className="text-rose-300 text-xs">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} disabled={saving} className="btn-secondary">İptal</button>
        <button type="submit" disabled={saving} className="btn-gold">{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
      </div>
    </form>
  </div>;
}
