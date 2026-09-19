'use client';

import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, UserCheck, X } from 'lucide-react';

export default function CriticalAlarmResetModal({
  alertData,
  currentUser,
  onClose,
  onConfirmReset,
  isSubmitting = false
}) {
  const [reasonNotes, setReasonNotes] = useState('');
  const [confirmedCheck, setConfirmedCheck] = useState(false);

  if (!alertData) return null;

  const weightLost = alertData.weight_lost || 0.0;
  const slotId = alertData.slot_id || alertData.id;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content max-w-lg border-2 border-rose-500 shadow-2xl bg-gradient-to-b from-[#181116] via-[#12141c] to-[#0d0f17] text-white p-6 rounded-2xl" 
        onClick={e => e.stopPropagation()}
      >
        {/* Başlık */}
        <div className="flex items-start justify-between pb-4 border-b border-rose-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-500/60 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-rose-400 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 font-bold">
                KRİTİK GÜVENLİK İŞLEMİ
              </span>
              <h3 className="font-cinzel text-base font-bold text-white">
                ALARMI SUSTUR & VİTRİNİ SIFIRLA
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">
            ✕
          </button>
        </div>

        {/* Yetkili & Konum Bilgisi */}
        <div className="mt-4 space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span className="text-slate-300">İşlemi Yapan Yetkili:</span>
            </div>
            <div className="font-bold text-white font-mono">
              {currentUser?.full_name || 'Yetkili Personel'}{' '}
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 ml-1">
                {currentUser?.role === 'ADMIN' ? 'Yönetici' : currentUser?.role === 'MANAGER' ? 'Müdür' : 'Personel'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-[#090b10] border border-[#242938]">
              <span className="text-slate-400 block text-[10px]">İlgili Vitrin Askısı:</span>
              <strong className="text-white text-sm">Askı #{slotId}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-[#090b10] border border-rose-500/40">
              <span className="text-rose-400 block text-[10px] font-bold">Eksilen Net Ağırlık:</span>
              <strong className="text-rose-300 text-sm font-bold">-{weightLost} gr</strong>
            </div>
          </div>

          {/* Kritik Uyarı Metni */}
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/50 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>DİKKAT: EKSİK GRAMAJ KAYIP / AÇIK OLARAK KAYDEDİLECEK!</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Bu butona bastığınızda Askı #{slotId} üzerindeki <strong>{weightLost} gr</strong> eksilme sistemde 
              <span className="text-rose-300 font-bold"> "KAYIP / AÇIK" </span> 
              olarak onaylanacaktır. Vitrin sensörünün referansı mevcut ağırlığa sıfırlanacak, alarm susturulacak ve sistem eski çalışır haline getirilecektir.
            </p>
            <p className="text-[10px] text-slate-400 italic">
              Bu işlem yetkili adınız, kullanıcı kimliğiniz ve işlem zamanıyla birlikte Güvenlik Denetim Günlüğüne (Audit Trail) kalıcı olarak işlenecektir.
            </p>
          </div>

          {/* Açıklama / Not Alanı */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
              Sıfırlama Gerekçesi / Açıklama (Zorunlu Değil):
            </label>
            <input
              type="text"
              value={reasonNotes}
              onChange={(e) => setReasonNotes(e.target.value)}
              placeholder="Örn: Müşteri denemesi sırasında düşme veya sahte ağırlık alarmı"
              className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Onay Kutusu */}
          <label className="flex items-center gap-2.5 p-2 rounded-lg bg-[#0e1017] border border-[#242938] cursor-pointer hover:border-amber-500/40 transition">
            <input
              type="checkbox"
              checked={confirmedCheck}
              onChange={(e) => setConfirmedCheck(e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
            <span className="text-[11px] text-slate-300 select-none">
              Eksik gramajın kayıp olarak işleneceğini ve vitrin sensörünün sıfırlanacağını anladım, onaylıyorum.
            </span>
          </label>
        </div>

        {/* Butonlar */}
        <div className="flex items-center justify-end gap-2.5 mt-5 pt-4 border-t border-[#242938]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
          >
            Vazgeç
          </button>
          <button
            type="button"
            disabled={!confirmedCheck || isSubmitting}
            onClick={() => onConfirmReset(alertData.id, reasonNotes)}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg transition ${
              confirmedCheck && !isSubmitting
                ? 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white shadow-rose-900/50'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{isSubmitting ? 'İşleniyor...' : '⚠️ Kayıp Olarak Onayla & Vitrini Sıfırla'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
