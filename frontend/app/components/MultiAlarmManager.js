'use client';

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Search, 
  Layers, 
  Clock, 
  UserCheck, 
  ShieldCheck,
  RefreshCw,
  Eye,
  Sliders
} from 'lucide-react';

export default function MultiAlarmManager({
  alerts,
  slots,
  currentUser,
  onIdentifyLift,
  onOpenResetModal,
  onRefreshSlots,
  onBatchResetAll
}) {
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'CRITICAL' | 'WARNING'

  const filteredAlerts = (alerts || []).filter(a => {
    if (filterType === 'ALL') return true;
    if (filterType === 'CRITICAL') return (a.weight_lost || 0) > 10;
    if (filterType === 'WARNING') return (a.weight_lost || 0) <= 10;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ÜST BİLGİ & BAŞLIK KARTI */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#141724] via-[#1b1f2e] to-[#141724] border border-rose-500/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400">
            <ShieldAlert className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-cinzel text-lg lg:text-xl font-bold text-white tracking-wide">
                VİTRİN GÜVENLİK &amp; ÇOKLU ALARM YÖNETİM MERKEZİ
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                CANLI MESH SENSÖRLERİ
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Sensör ağırlık sapmaları, yetkisiz askı hareketleri ve vitrin güvenlik durumu anlık denetlenmektedir.
            </p>
          </div>
        </div>

        {/* TOPLU AKSİYONLAR */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onRefreshSlots}
            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 border-[#2b3247] hover:border-slate-400 text-slate-300"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sensörleri Yenile</span>
          </button>

          {alerts && alerts.length > 0 && (
            <button
              onClick={onBatchResetAll}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-700 to-red-800 hover:from-rose-600 hover:to-red-700 text-white font-bold text-xs shadow-lg shadow-rose-950/50 flex items-center gap-2 transition active:scale-95 border border-rose-400/50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Tüm Alarmları Sıfırla &amp; Normale Döndür</span>
            </button>
          )}
        </div>
      </div>

      {/* METRİK ŞERİDİ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#12141c] border border-rose-500/30">
          <div className="text-[10px] font-mono uppercase text-slate-400">Aktif Kritik Alarm</div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1 flex items-baseline gap-2">
            <span>{alerts?.length || 0}</span>
            <span className="text-xs text-slate-400 font-normal">Adet Slot</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#12141c] border border-amber-500/30">
          <div className="text-[10px] font-mono uppercase text-slate-400">Toplam Eksilen Gramaj</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1 flex items-baseline gap-2">
            <span>
              {(alerts || []).reduce((acc, a) => acc + (parseFloat(a.weight_lost) || 0), 0).toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 font-normal">gr</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#12141c] border border-emerald-500/30">
          <div className="text-[10px] font-mono uppercase text-slate-400">Güvenli / Normal Slotlar</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1 flex items-baseline gap-2">
            <span>
              {(slots || []).filter(s => s.status === 'NORMAL').length}
            </span>
            <span className="text-xs text-slate-400 font-normal">/ {slots?.length || 0} Slot</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#12141c] border border-indigo-500/30">
          <div className="text-[10px] font-mono uppercase text-slate-400">Nöbetçi Güvenlik Yetkilisi</div>
          <div className="text-sm font-bold text-white mt-1 truncate">
            {currentUser?.full_name || 'Yetkili Personel'}
          </div>
          <div className="text-[10px] text-indigo-400 font-mono">
            {currentUser?.role === 'ADMIN' ? '👑 Sistem Yöneticisi' : currentUser?.role === 'MANAGER' ? '🏬 Mağaza Müdürü' : currentUser?.role === 'ALARM_MANAGER' ? '🚨 Alarm Sorumlusu' : '👤 Satış Personeli'}
          </div>
        </div>
      </div>

      {/* FİLTRE VE ALARM LİSTESİ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">Filtre:</span>
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filterType === 'ALL' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-[#181b26] text-slate-400 hover:text-white'
              }`}
            >
              Tümü ({alerts?.length || 0})
            </button>
            <button
              onClick={() => setFilterType('CRITICAL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filterType === 'CRITICAL' ? 'bg-rose-500 text-white font-bold' : 'bg-[#181b26] text-slate-400 hover:text-white'
              }`}
            >
              Yüksek Sapma (&gt;10g)
            </button>
            <button
              onClick={() => setFilterType('WARNING')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filterType === 'WARNING' ? 'bg-yellow-500 text-slate-950 font-bold' : 'bg-[#181b26] text-slate-400 hover:text-white'
              }`}
            >
              Hassas Sapma (≤10g)
            </button>
          </div>

          <span className="text-[11px] text-slate-400 font-mono">
            {filteredAlerts.length} alarm listeleniyor
          </span>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#12141c] border border-emerald-500/30 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="text-base font-bold text-white">Harika! Şu Anda Aktif Bir Alarm Bulunmuyor</div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Tüm vitrin slotları, askılar ve ağırlık sensörleri kalibre edilmiş referans değerlerinde güvenle çalışmaktadır.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAlerts.map((alert, idx) => {
              const matchedSlot = (slots || []).find(s => s.id === alert.slot_id);
              const weightLost = parseFloat(alert.weight_lost || 0);

              return (
                <div 
                  key={alert.slot_id || idx}
                  className="p-5 rounded-2xl bg-gradient-to-b from-[#181c2a] to-[#12141c] border border-rose-500/60 shadow-xl space-y-4 hover:border-rose-400 transition"
                >
                  {/* BAŞLIK & DURUM */}
                  <div className="flex items-start justify-between gap-2 border-b border-[#252b3d] pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 animate-pulse">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span>Slot #{alert.slot_id}</span>
                          <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                            ALARM AKTİF
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {matchedSlot?.name || `Vitrin Askı Bölmesi #${alert.slot_id}`}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">Eksilen Net Ağırlık</div>
                      <div className="text-base font-bold font-mono text-rose-400">
                        -{weightLost.toFixed(2)} gr
                      </div>
                    </div>
                  </div>

                  {/* SENSÖR VE ÜRÜN DETAYLARI */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#0c0e14] border border-[#232838]">
                      <span className="text-[10px] text-slate-400 block">Referans / Beklenen</span>
                      <strong className="text-white font-mono text-sm">
                        {(parseFloat(matchedSlot?.expected_weight) || 0).toFixed(2)} gr
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#0c0e14] border border-[#232838]">
                      <span className="text-[10px] text-slate-400 block">Şu An Okunan Sensör</span>
                      <strong className="text-rose-400 font-mono text-sm">
                        {(parseFloat(matchedSlot?.current_weight) || 0).toFixed(2)} gr
                      </strong>
                    </div>
                  </div>

                  {/* OLASI BAĞLI ÜRÜNLER */}
                  {matchedSlot?.products && matchedSlot.products.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-[#141724] border border-[#262c3e] text-xs">
                      <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">Askıda Kayıtlı Mücevherler:</div>
                      <div className="space-y-1">
                        {matchedSlot.products.slice(0, 2).map(p => (
                          <div key={p.id} className="flex items-center justify-between text-slate-300 text-[11px]">
                            <span className="font-semibold text-white truncate max-w-[180px]">{p.name}</span>
                            <span className="text-amber-400 font-mono">{p.weight_grams} gr</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* EYLEM BUTONLARI (2 NET AYRI BUTON) */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    {/* BUTON 1: Ürünü Eşle & Zimmete Al */}
                    <button
                      type="button"
                      onClick={() => onIdentifyLift(alert.slot_id, alert.weight_lost)}
                      className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:brightness-110 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition active:scale-95"
                    >
                      <Search className="w-4 h-4" />
                      <span>Ürünü Eşle &amp; Al</span>
                    </button>

                    {/* BUTON 2: Hatayı Kapat & Vitrini Sıfırla (Sistemi Normale Döndür) */}
                    <button
                      type="button"
                      onClick={() => onOpenResetModal(alert)}
                      className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-900 to-red-950 hover:from-rose-800 hover:to-red-900 text-rose-100 border border-rose-500/80 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition active:scale-95"
                    >
                      <RotateCcw className="w-4 h-4 text-rose-300" />
                      <span>Sistemi Normale Döndür</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TÜM VİTRİN SLOKLARI DURUM TABLOSU */}
      <div className="p-5 rounded-2xl bg-[#12141c] border border-[#242938] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-white">TÜM VİTRİN VE ASKI SLOTLARININ ANLIK DURUMU</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {slots?.length || 0} Konum Aktif
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#181b26] text-slate-400 text-[10px] font-mono uppercase">
              <tr>
                <th className="p-2.5">Slot ID</th>
                <th className="p-2.5">Konum / Vitrin Adı</th>
                <th className="p-2.5">Beklenen (gr)</th>
                <th className="p-2.5">Anlık Sensör (gr)</th>
                <th className="p-2.5">Fark / Sapma</th>
                <th className="p-2.5">Güvenlik Durumu</th>
                <th className="p-2.5 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222736]">
              {(slots || []).map(s => {
                const diff = (parseFloat(s.current_weight) || 0) - (parseFloat(s.expected_weight) || 0);
                const isAlarm = s.status === 'ALARM' || Math.abs(diff) > 0.15;

                return (
                  <tr key={s.id} className="hover:bg-[#161a26] transition">
                    <td className="p-2.5 font-mono text-amber-400 font-bold">#{s.id}</td>
                    <td className="p-2.5 font-medium text-white">{s.name}</td>
                    <td className="p-2.5 font-mono text-slate-300">{(parseFloat(s.expected_weight) || 0).toFixed(2)}</td>
                    <td className="p-2.5 font-mono font-bold text-slate-200">{(parseFloat(s.current_weight) || 0).toFixed(2)}</td>
                    <td className="p-2.5 font-mono font-bold">
                      {Math.abs(diff) < 0.05 ? (
                        <span className="text-emerald-400">0.00 gr</span>
                      ) : diff > 0 ? (
                        <span className="text-blue-400">+{diff.toFixed(2)} gr</span>
                      ) : (
                        <span className="text-rose-400">{diff.toFixed(2)} gr</span>
                      )}
                    </td>
                    <td className="p-2.5">
                      {isAlarm ? (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px] inline-flex items-center gap-1 border border-rose-500/30 animate-pulse">
                          <AlertTriangle className="w-3 h-3" /> ALARM
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] inline-flex items-center gap-1 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> NORMAL
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 text-right">
                      {isAlarm ? (
                        <button
                          type="button"
                          onClick={() => onOpenResetModal({ slot_id: s.id, weight_lost: Math.abs(diff).toFixed(2) })}
                          className="px-2.5 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-[11px] font-bold border border-rose-500/40"
                        >
                          Sıfırla
                        </button>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Stabil</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
