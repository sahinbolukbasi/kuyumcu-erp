'use client';

import { apiFetch as fetch } from '../lib/api';

import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Save,
  Upload,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileText,
  Image,
  Settings,
  Globe,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  CreditCard,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Info,
  HelpCircle
} from 'lucide-react';

export default function CompanyProfileManager({
  currentUser,
  apiBase,
  token,
  onRefresh
}) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  // Form State
  const [form, setForm] = useState({
    company_title: '',
    tax_office: '',
    tax_number: '',
    mersis_no: '',
    central_registration_no: '',
    trade_registry_no: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    integrator_type: 'MANUAL',
    integrator_api_url: '',
    integrator_api_key: '',
    integrator_api_secret: '',
    integrator_username: '',
    integrator_password: '',
    e_invoice_active: true,
    e_archive_active: true,
    sandbox_mode: true,
    default_payment_term_days: 7,
    default_currency: 'TRY',
    default_language: 'TR',
    invoice_footer_note: ''
  });

  // Profili Çek
  const fetchProfile = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/invoices/company-profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setForm({
          company_title: data.company_title || '',
          tax_office: data.tax_office || '',
          tax_number: data.tax_number || '',
          mersis_no: data.mersis_no || '',
          central_registration_no: data.central_registration_no || '',
          trade_registry_no: data.trade_registry_no || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
          integrator_type: data.integrator_type || 'MANUAL',
          integrator_api_url: data.integrator_api_url || '',
          integrator_api_key: '',
          integrator_api_secret: '',
          integrator_username: data.integrator_username || '',
          integrator_password: '',
          e_invoice_active: data.e_invoice_active !== false,
          e_archive_active: data.e_archive_active !== false,
          sandbox_mode: data.sandbox_mode !== false,
          default_payment_term_days: data.default_payment_term_days || 7,
          default_currency: data.default_currency || 'TRY',
          default_language: data.default_language || 'TR',
          invoice_footer_note: data.invoice_footer_note || ''
        });
      }
    } catch (e) {
      console.error("Profil yüklenemedi", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, [token]);

  // Form Güncelleme
  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Profil Kaydet
  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await fetch(`${apiBase}/api/v1/invoices/company-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setSuccessMsg('✅ Firma profili başarıyla güncellendi!');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const err = await res.json();
        setErrorMsg(err.detail || 'Kaydetme hatası');
      }
    } catch (e) {
      setErrorMsg('Sunucu hatası: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Logo Yükleme
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Logo dosyası 2MB\'dan büyük olamaz.');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${apiBase}/api/v1/invoices/company-profile/logo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(prev => ({ ...prev, logo_base64: data.logo_base64, logo_mime_type: data.logo_mime_type }));
        setSuccessMsg('✅ Logo başarıyla yüklendi!');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const err = await res.json();
        setErrorMsg(err.detail || 'Logo yükleme hatası');
      }
    } catch (e) {
      setErrorMsg('Logo yükleme hatası: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  // Logo Silme
  const handleDeleteLogo = async () => {
    if (!token || !confirm('Logoyu kaldırmak istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`${apiBase}/api/v1/invoices/company-profile/logo`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setProfile(prev => ({ ...prev, logo_base64: null, logo_mime_type: null }));
        setSuccessMsg('✅ Logo kaldırıldı.');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (e) {
      setErrorMsg('Logo silme hatası');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
        <span className="ml-3 text-slate-400 text-sm">Firma profili yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* BAŞLIK */}
      <div className="bg-gradient-to-r from-[#12141c] via-[#1a1d2c] to-[#12141c] p-4 lg:p-6 rounded-2xl border border-emerald-500/40 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block mr-1.5"></span>
              FIRMA PROFILI & e-FATURA YAPILANDIRMASI
            </div>
            <h2 className="font-cinzel text-lg lg:text-2xl font-bold text-white mt-1">
              GOLDEN GUARD — ŞİRKET BİLGİLERİ & e-FATURA AYARLARI
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Firma bilgilerinizi, logonuzu ve e-Fatura/e-Arşiv entegratör ayarlarınızı buradan yönetin.
            </p>
          </div>
        </div>
      </div>

      {/* Başarı/Hata Mesajları */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SOL: Logo & Önizleme */}
        <div className="lg:col-span-1 space-y-4">
          <div className="luxury-card p-4 border-emerald-500/30">
            <h3 className="font-cinzel text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Image className="w-4 h-4 text-emerald-400" />
              FİRMA LOGOSU
            </h3>

            {/* Logo Önizleme */}
            <div className="flex items-center justify-center p-6 bg-[#0e1017] rounded-xl border border-[#242938] mb-3 min-h-[120px]">
              {profile?.logo_base64 ? (
                <img
                  src={`data:${profile.logo_mime_type || 'image/png'};base64,${profile.logo_base64}`}
                  alt="Firma Logosu"
                  className="max-h-24 max-w-full object-contain"
                />
              ) : (
                <div className="text-center text-slate-500">
                  <Image className="w-10 h-10 mx-auto mb-1 opacity-40" />
                  <span className="text-xs">Logo yüklenmemiş</span>
                </div>
              )}
            </div>

            {/* Logo Yükleme Butonları */}
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                {uploading ? 'Yükleniyor...' : 'Logo Yükle'}
              </button>
              {profile?.logo_base64 && (
                <button
                  onClick={handleDeleteLogo}
                  className="py-2 px-3 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <p className="text-[10px] text-slate-500 mt-1.5">PNG, JPEG veya WebP • Max 2MB</p>
          </div>

          <p className="text-xs text-amber-300 p-3 border border-amber-500/30 rounded-lg">Entegratör ve XML aktarımı sonraki aşamada etkinleştirilecektir. Bu sürüm PDF taslakları üretir; entegratör şifrelerinizi buraya girmeyiniz.</p>
        </div>

        {/* SAĞ: Firma Bilgileri Formu */}
        <div className="lg:col-span-2 space-y-4">
          <div className="luxury-card p-4 border-emerald-500/30">
            <h3 className="font-cinzel text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-emerald-400" />
              FİRMA BİLGİLERİ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Şirket Ünvanı *</label>
                <input
                  type="text"
                  value={form.company_title}
                  onChange={(e) => handleChange('company_title', e.target.value)}
                  className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Vergi Dairesi *</label>
                <input
                  type="text"
                  value={form.tax_office}
                  onChange={(e) => handleChange('tax_office', e.target.value)}
                  className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Vergi Numarası *</label>
                <input
                  type="text"
                  value={form.tax_number}
                  onChange={(e) => handleChange('tax_number', e.target.value)}
                  className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Mersis No</label>
                <input
                  type="text"
                  value={form.mersis_no}
                  onChange={(e) => handleChange('mersis_no', e.target.value)}
                  className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Ticaret Sicil No</label>
                <input
                  type="text"
                  value={form.trade_registry_no}
                  onChange={(e) => handleChange('trade_registry_no', e.target.value)}
                  className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Merkezi Sicil No</label>
                <input
                  type="text"
                  value={form.central_registration_no}
                  onChange={(e) => handleChange('central_registration_no', e.target.value)}
                  className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Adres *</label>
                <textarea
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  rows={2}
                  className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Telefon</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">E-posta</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Web Sitesi</label>
                <input
                  type="text"
                  value={form.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://www.goldenguard.com"
                  className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* e-Fatura / e-Arşiv Ayarları */}
          <div className="luxury-card p-4 border-emerald-500/30">
            <h3 className="font-cinzel text-sm font-bold text-white flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-emerald-400" />
              e-FATURA & e-ARŞİV AYARLARI
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0e1017] border border-[#242938]">
                <div>
                  <div className="text-xs text-white font-semibold">e-Fatura</div>
                  <div className="text-[10px] text-slate-400">Vergi No'lu alıcılar için</div>
                </div>
                <button
                  onClick={() => handleChange('e_invoice_active', !form.e_invoice_active)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    form.e_invoice_active
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {form.e_invoice_active ? 'AKTİF' : 'PASİF'}
                </button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0e1017] border border-[#242938]">
                <div>
                  <div className="text-xs text-white font-semibold">e-Arşiv</div>
                  <div className="text-[10px] text-slate-400">Bireysel alıcılar için</div>
                </div>
                <button
                  onClick={() => handleChange('e_archive_active', !form.e_archive_active)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    form.e_archive_active
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {form.e_archive_active ? 'AKTİF' : 'PASİF'}
                </button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0e1017] border border-[#242938]">
                <div>
                  <div className="text-xs text-white font-semibold">Sandbox (Test) Modu</div>
                  <div className="text-[10px] text-slate-400">Canlıya geçmeden önce test</div>
                </div>
                <button
                  onClick={() => handleChange('sandbox_mode', !form.sandbox_mode)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    form.sandbox_mode
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {form.sandbox_mode ? 'TEST' : 'CANLI'}
                </button>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Vade (Gün)</label>
                <input
                  type="number"
                  value={form.default_payment_term_days}
                  onChange={(e) => handleChange('default_payment_term_days', parseInt(e.target.value) || 7)}
                  className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Varsayılan Para Birimi</label>
                <select
                  value={form.default_currency}
                  onChange={(e) => handleChange('default_currency', e.target.value)}
                  className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="TRY">TRY - Türk Lirası</option>
                  <option value="USD">USD - Amerikan Doları</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Varsayılan Dil</label>
                <select
                  value={form.default_language}
                  onChange={(e) => handleChange('default_language', e.target.value)}
                  className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="TR">Türkçe</option>
                  <option value="EN">English</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Fatura Dipnotu</label>
                <textarea
                  value={form.invoice_footer_note}
                  onChange={(e) => handleChange('invoice_footer_note', e.target.value)}
                  rows={2}
                  className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Kaydet Butonu */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-lg shadow-emerald-900/50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Kaydediliyor...' : 'Firma Profilini Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}