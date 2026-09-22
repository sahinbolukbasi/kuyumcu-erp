'use client';

import { apiFetch as fetch } from '../lib/api';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Cpu,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Link2,
  Unlink,
  Package,
  Smartphone,
  Wifi,
  MapPin,
  Activity,
  BarChart3,
  Radio,
  ShieldCheck,
  Clock,
  Zap,
  Layers,
  Edit3,
  Save,
  Eye,
  ChevronRight,
  Signal,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  Server,
  KeyRound
} from 'lucide-react';

export default function DeviceManager({
  currentUser,
  apiBase,
  token,
  products = [],
  branches = [],
  onRefresh
}) {
  const [devices, setDevices] = useState([]);
  const [deviceStats, setDeviceStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');

  // Filtreler
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  // Form State
  const [form, setForm] = useState({
    device_id: '',
    device_type: 'PICO_W',
    mac_address: '',
    label: '',
    branch_id: 1,
    location_desc: '',
    ip_address: '192.168.1.100',
    port: 80,
    wifi_ssid: ''
  });

  // Ürün Atama State
  const [assignProductId, setAssignProductId] = useState('');
  const [assignSlotId, setAssignSlotId] = useState('');
  const [assignQuantity, setAssignQuantity] = useState(1);

  // Cihazları Çek
  const fetchDevices = async () => {
    if (!token) return;
    setLoading(true);
    try {
      let url = `${apiBase}/api/v1/devices`;
      const params = [];
      if (branchFilter !== 'ALL') params.push(`branch_id=${branchFilter}`);
      if (statusFilter !== 'ALL') params.push(`status=${statusFilter}`);
      if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`);
      if (params.length) url += '?' + params.join('&');

      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setDevices(await res.json());
    } catch (e) {
      console.error("Cihaz listesi hatası", e);
    } finally {
      setLoading(false);
    }
  };

  // İstatistikleri Çek
  const fetchStats = async () => {
    if (!token || currentUser?.role !== 'ADMIN') return;
    try {
      const res = await fetch(`${apiBase}/api/v1/devices/analytics/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setDeviceStats(await res.json());
    } catch (e) {}
  };

  useEffect(() => {
    fetchDevices();
    fetchStats();
  }, [token, branchFilter, statusFilter]);

  // Cihaz Ekle
  const handleAddDevice = async () => {
    if (!token || !form.device_id || !form.label) {
      setActionError('Device ID ve etiket zorunludur.');
      return;
    }
    setActionError('');
    try {
      const res = await fetch(`${apiBase}/api/v1/devices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setShowAddModal(false);
        setForm({ device_id: '', device_type: 'PICO_W', mac_address: '', label: '', branch_id: 1, location_desc: '', ip_address: '192.168.1.100', port: 80, wifi_ssid: '' });
        setActionMsg('✅ Cihaz başarıyla kaydedildi!');
        fetchDevices();
        fetchStats();
        setTimeout(() => setActionMsg(''), 3000);
      } else {
        const err = await res.json();
        setActionError(err.detail || 'Cihaz ekleme hatası');
      }
    } catch (e) {
      setActionError('Sunucu hatası: ' + e.message);
    }
  };

  // Cihaz Eşleştir
  const handlePairDevice = async (deviceId) => {
    if (!token) return;
    try {
      const res = await fetch(`${apiBase}/api/v1/devices/${deviceId}/pair`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActionMsg(`✅ Cihaz eşleştirildi! Token: ${data.auth_token}`);
        fetchDevices();
        setTimeout(() => setActionMsg(''), 5000);
      } else {
        const err = await res.json();
        setActionError(err.detail || 'Eşleştirme hatası');
      }
    } catch (e) {
      setActionError('Sunucu hatası');
    }
  };

  // 6 Haneli Kod ile Eşleştirme
  const handleGeneratePairCode = async (deviceId) => {
    if (!token) return;
    try {
      const res = await fetch(`${apiBase}/api/v1/devices/${deviceId}/generate-pair-code`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActionMsg(`✅ Eşleştirme kodu: ${data.pair_code} — Bu kodu Pico config.py PAIR_CODE değerine yazın.`);
        setTimeout(() => setActionMsg(''), 15000);
      } else {
        const err = await res.json();
        setActionError(err.detail || 'Kod üretme hatası');
      }
    } catch (e) {
      setActionError('Sunucu hatası');
    }
  };

  // Cihaz Eşleştirme Kaldır
  const handleUnpairDevice = async (deviceId) => {
    if (!token || !confirm('Eşleştirmeyi kaldırmak istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`${apiBase}/api/v1/devices/${deviceId}/unpair`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setActionMsg('✅ Eşleştirme kaldırıldı.');
        fetchDevices();
        setTimeout(() => setActionMsg(''), 3000);
      }
    } catch (e) {}
  };

  // Cihaza Ürün Ata
  const handleAssignProduct = async () => {
    if (!token || !selectedDevice || !assignProductId || !assignSlotId) {
      setActionError('Ürün ve slot seçimi zorunludur.');
      return;
    }
    try {
      const res = await fetch(`${apiBase}/api/v1/devices/${selectedDevice.id}/assign-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          product_id: parseInt(assignProductId),
          slot_id: parseInt(assignSlotId),
          quantity: assignQuantity
        })
      });
      if (res.ok) {
        setActionMsg('✅ Ürün cihaza atandı!');
        setShowAssignModal(false);
        fetchDevices();
        setTimeout(() => setActionMsg(''), 3000);
      } else {
        const err = await res.json();
        setActionError(err.detail || 'Atama hatası');
      }
    } catch (e) {
      setActionError('Sunucu hatası');
    }
  };

  // Cihaz Sil
  const handleDeleteDevice = async (deviceId) => {
    if (!token || !confirm('Cihazı silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`${apiBase}/api/v1/devices/${deviceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setActionMsg('✅ Cihaz silindi.');
        fetchDevices();
        fetchStats();
        setTimeout(() => setActionMsg(''), 3000);
      }
    } catch (e) {}
  };

  // Cihaz Detayını Aç
  const handleOpenDetail = async (device) => {
    setSelectedDevice(device);
    setShowDetailModal(true);
  };

  // Filtrelenmiş cihazlar
  const filteredDevices = useMemo(() => {
    return devices.filter(d => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!d.device_id?.toLowerCase().includes(q) && !d.label?.toLowerCase().includes(q) && !d.mac_address?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [devices, searchQuery]);

  // Durum renkleri
  const statusColors = {
    'ACTIVE': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    'INACTIVE': 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    'MAINTENANCE': 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  };

  return (
    <div className="space-y-6">
      {/* Mesajlar */}
      {actionMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {actionMsg}
        </div>
      )}
      {actionError && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {actionError}
        </div>
      )}

      {/* BAŞLIK */}
      <div className="bg-gradient-to-r from-[#12141c] via-[#1a1d2c] to-[#12141c] p-4 lg:p-6 rounded-2xl border border-cyan-500/40 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
              <Cpu className="w-8 h-8" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse inline-block mr-1.5"></span>
                IoT CİHAZ YÖNETİMİ & ÜRÜN ATAMA
              </div>
              <h2 className="font-cinzel text-lg lg:text-2xl font-bold text-white mt-1">
                CİHAZ LİSTESİ
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {deviceStats ? `${deviceStats.total_devices} cihaz • ${deviceStats.online_devices} çevrimiçi • ${deviceStats.total_products_assigned} ürün atanmış` : 'Yükleniyor...'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white font-bold text-xs flex items-center gap-2 transition active:scale-95 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Yeni Cihaz Ekle
          </button>
        </div>
      </div>

      {/* İSTATİSTİK KARTLARI */}
      {deviceStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          <div className="p-3 rounded-xl bg-[#12141c] border border-cyan-500/30">
            <div className="text-[10px] text-slate-400 uppercase">Toplam Cihaz</div>
            <div className="text-xl font-bold text-white font-mono">{deviceStats.total_devices}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#12141c] border border-emerald-500/30">
            <div className="text-[10px] text-slate-400 uppercase">Çevrimiçi</div>
            <div className="text-xl font-bold text-emerald-400 font-mono">{deviceStats.online_devices}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#12141c] border border-rose-500/30">
            <div className="text-[10px] text-slate-400 uppercase">Çevrimdışı</div>
            <div className="text-xl font-bold text-rose-400 font-mono">{deviceStats.offline_devices}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#12141c] border border-amber-500/30">
            <div className="text-[10px] text-slate-400 uppercase">Aktif Alarm</div>
            <div className="text-xl font-bold text-amber-400 font-mono">{deviceStats.active_alerts}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#12141c] border border-indigo-500/30">
            <div className="text-[10px] text-slate-400 uppercase">Atanan Ürün</div>
            <div className="text-xl font-bold text-indigo-400 font-mono">{deviceStats.total_products_assigned}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#12141c] border border-sky-500/30">
            <div className="text-[10px] text-slate-400 uppercase">Tür Sayısı</div>
            <div className="text-xl font-bold text-sky-400 font-mono">{deviceStats.devices_by_type?.length || 0}</div>
          </div>
        </div>
      )}

      {/* FİLTRELER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-[#12141c] p-3 rounded-xl border border-[#242938]">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Device ID, etiket veya MAC ile ara..."
            className="w-full bg-[#0e1017] border border-[#242938] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
        >
          <option value="ALL">Tüm Mağazalar</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
        >
          <option value="ALL">Tüm Durumlar</option>
          <option value="ACTIVE">Aktif</option>
          <option value="INACTIVE">Pasif</option>
          <option value="MAINTENANCE">Bakımda</option>
        </select>
        <button onClick={() => { fetchDevices(); fetchStats(); }} className="p-1.5 rounded-lg bg-[#0e1017] border border-[#242938] text-slate-400 hover:text-white transition">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* CİHAZ LİSTESİ */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
          <span className="ml-3 text-slate-400 text-sm">Cihazlar yükleniyor...</span>
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="text-center p-12 bg-[#12141c] rounded-xl border border-[#242938]">
          <Cpu className="w-12 h-12 mx-auto text-slate-600 mb-2" />
          <p className="text-slate-400 text-sm">Henüz cihaz bulunmuyor.</p>
          <p className="text-slate-500 text-xs mt-1">"Yeni Cihaz Ekle" butonuna tıklayarak ilk cihazı kaydedin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredDevices.map((device) => (
            <div
              key={device.id}
              className="bg-[#12141c] border border-[#242938] rounded-xl p-3.5 hover:border-cyan-500/40 transition cursor-pointer"
              onClick={() => handleOpenDetail(device)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    device.is_online ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-white truncate">{device.label}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${statusColors[device.status] || 'bg-slate-500/20 text-slate-300'}`}>
                        {device.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{device.device_id}</div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                      <span className="flex items-center gap-0.5">
                        <Signal className="w-3 h-3" />
                        {device.wifi_rssi || '-'} dBm
                      </span>
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />
                        {device.branch_name || `Şube #${device.branch_id}`}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Layers className="w-3 h-3" />
                        {device.slot_count} slot
                      </span>
                    </div>
                    {device.last_ping && (
                      <div className="text-[9px] text-slate-600 mt-0.5">
                        Son: {new Date(device.last_ping).toLocaleString('tr-TR')}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {device.status !== 'ACTIVE' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePairDevice(device.id); }}
                      className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition"
                      title="Cihazı Eşleştir"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleGeneratePairCode(device.id); }}
                    className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition"
                    title="6 Haneli Kod Oluştur"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteDevice(device.id); }}
                    className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition"
                    title="Cihazı Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= MODAL: Cihaz Ekle ================= */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content max-w-lg border-cyan-500/50 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#242938] mb-4">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                <h3 className="font-cinzel text-base font-bold text-white">Yeni IoT Cihazı Ekle</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Device ID *</label>
                <input type="text" value={form.device_id} onChange={(e) => setForm(prev => ({ ...prev, device_id: e.target.value }))}
                  placeholder="PICO_VITRIN_01" className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500" />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Etiket *</label>
                <input type="text" value={form.label} onChange={(e) => setForm(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="Nişantaşı VIP Vitrin" className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Cihaz Tipi</label>
                <select value={form.device_type} onChange={(e) => setForm(prev => ({ ...prev, device_type: e.target.value }))}
                  className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500">
                  <option value="PICO_W">Raspberry Pi Pico W</option>
                  <option value="ESP32">ESP32</option>
                  <option value="ESP8266">ESP8266</option>
                  <option value="CUSTOM">Özel Donanım</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">MAC Adresi</label>
                <input type="text" value={form.mac_address} onChange={(e) => setForm(prev => ({ ...prev, mac_address: e.target.value }))}
                  placeholder="E4:5F:01:XX:XX:XX" className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Mağaza</label>
                <select value={form.branch_id} onChange={(e) => setForm(prev => ({ ...prev, branch_id: parseInt(e.target.value) }))}
                  className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500">
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Konum Açıklaması</label>
                <input type="text" value={form.location_desc} onChange={(e) => setForm(prev => ({ ...prev, location_desc: e.target.value }))}
                  placeholder="Ana giriş sağ vitrin" className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">IP Adresi</label>
                <input type="text" value={form.ip_address} onChange={(e) => setForm(prev => ({ ...prev, ip_address: e.target.value }))}
                  className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Port</label>
                <input type="number" value={form.port} onChange={(e) => setForm(prev => ({ ...prev, port: parseInt(e.target.value) || 80 }))}
                  className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500" />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Wi-Fi SSID</label>
                <input type="text" value={form.wifi_ssid} onChange={(e) => setForm(prev => ({ ...prev, wifi_ssid: e.target.value }))}
                  placeholder="Mağaza Wi-Fi Ağı" className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500" />
              </div>
            </div>

            <button onClick={handleAddDevice}
              className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-lg">
              <Save className="w-4 h-4" />
              Cihazı Kaydet
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL: Cihaz Detayı ================= */}
      {showDetailModal && selectedDevice && (
        <div className="modal-overlay" onClick={() => { setShowDetailModal(false); setSelectedDevice(null); }}>
          <div className="modal-content max-w-2xl border-cyan-500/50 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#242938] mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <h3 className="font-cinzel text-base font-bold text-white">{selectedDevice.label}</h3>
              </div>
              <button onClick={() => { setShowDetailModal(false); setSelectedDevice(null); }} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Cihaz Bilgileri */}
            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              <div className="p-3 rounded-lg bg-[#0e1017] border border-[#242938]">
                <div className="text-slate-400 text-[10px] uppercase mb-1">Device ID</div>
                <div className="text-white font-mono font-bold">{selectedDevice.device_id}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#0e1017] border border-[#242938]">
                <div className="text-slate-400 text-[10px] uppercase mb-1">Durum</div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${selectedDevice.is_online ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${statusColors[selectedDevice.status] || ''}`}>
                    {selectedDevice.status}
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#0e1017] border border-[#242938]">
                <div className="text-slate-400 text-[10px] uppercase mb-1">Tip / MAC</div>
                <div className="text-white font-mono">{selectedDevice.device_type} • {selectedDevice.mac_address || 'MAC Yok'}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#0e1017] border border-[#242938]">
                <div className="text-slate-400 text-[10px] uppercase mb-1">Mağaza / Konum</div>
                <div className="text-white">{selectedDevice.branch_name || `Şube #${selectedDevice.branch_id}`} • {selectedDevice.location_desc || '-'}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#0e1017] border border-[#242938]">
                <div className="text-slate-400 text-[10px] uppercase mb-1">IP / Port</div>
                <div className="text-white font-mono">{selectedDevice.ip_address}:{selectedDevice.port}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#0e1017] border border-[#242938]">
                <div className="text-slate-400 text-[10px] uppercase mb-1">Wi-Fi Sinyal</div>
                <div className="text-white font-mono">{selectedDevice.wifi_rssi} dBm • {selectedDevice.wifi_ssid || '-'}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#0e1017] border border-[#242938]">
                <div className="text-slate-400 text-[10px] uppercase mb-1">İstatistik</div>
                <div className="text-white">{selectedDevice.total_heartbeats} heartbeat • {selectedDevice.total_alarms} alarm</div>
              </div>
              <div className="p-3 rounded-lg bg-[#0e1017] border border-[#242938]">
                <div className="text-slate-400 text-[10px] uppercase mb-1">Son Ping</div>
                <div className="text-white font-mono">{selectedDevice.last_ping ? new Date(selectedDevice.last_ping).toLocaleString('tr-TR') : 'Hiç'}</div>
              </div>
            </div>

            {/* Eşleştirme Bilgisi */}
            {selectedDevice.auth_token && (
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs mb-4">
                <div className="text-emerald-300 font-bold mb-1">🔗 Eşleştirildi</div>
                <div className="text-slate-300 font-mono text-[10px]">Token: {selectedDevice.auth_token}</div>
                <div className="text-slate-400 text-[10px]">{selectedDevice.paired_by} tarafından {selectedDevice.paired_at ? new Date(selectedDevice.paired_at).toLocaleString('tr-TR') : ''}</div>
              </div>
            )}

            {/* Aksiyon Butonları */}
            <div className="flex items-center gap-2 pt-3 border-t border-[#242938]">
              {selectedDevice.status !== 'ACTIVE' ? (
                <button onClick={() => { handlePairDevice(selectedDevice.id); setShowDetailModal(false); }}
                  className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95">
                  <Link2 className="w-3.5 h-3.5" />
                  Cihazı Eşleştir
                </button>
              ) : (
                <button onClick={() => { handleUnpairDevice(selectedDevice.id); setShowDetailModal(false); }}
                  className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95">
                  <Unlink className="w-3.5 h-3.5" />
                  Eşleştirmeyi Kaldır
                </button>
              )}
              <button onClick={() => { setShowAssignModal(true); }}
                className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95">
                <Package className="w-3.5 h-3.5" />
                Ürün Ata
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: Ürün Ata ================= */}
      {showAssignModal && selectedDevice && (
        <div className="modal-overlay" onClick={() => { setShowAssignModal(false); }}>
          <div className="modal-content max-w-lg border-indigo-500/50 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#242938] mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-400" />
                <h3 className="font-cinzel text-base font-bold text-white">
                  Ürün Ata: {selectedDevice.label}
                </h3>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Ürün Seç *</label>
                <select value={assignProductId} onChange={(e) => setAssignProductId(e.target.value)}
                  className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
                  <option value="">-- Ürün Seçin --</option>
                  {products.filter(p => p.status === 'Kasada' || p.status === 'Vitrinde').map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.purity} • {p.weight_grams}g • {p.price?.toLocaleString('tr-TR')} ₺)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Slot / Askı Seç *</label>
                <select value={assignSlotId} onChange={(e) => setAssignSlotId(e.target.value)}
                  className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
                  <option value="">-- Slot Seçin --</option>
                  {selectedDevice.slots?.map(s => (
                    <option key={s.id} value={s.id}>#{s.slot_number} {s.label} ({s.slot_type})</option>
                  ))}
                  {(!selectedDevice.slots || selectedDevice.slots.length === 0) && (
                    <option value="NEW">+ Yeni Slot Oluştur</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Adet</label>
                <input type="number" value={assignQuantity} onChange={(e) => setAssignQuantity(parseInt(e.target.value) || 1)} min={1}
                  className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
              </div>

              <button onClick={handleAssignProduct}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-lg">
                <Package className="w-4 h-4" />
                Ürünü Cihaza Ata
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}