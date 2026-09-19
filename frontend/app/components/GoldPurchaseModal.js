'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Scale, 
  Coins, 
  DollarSign, 
  User, 
  Phone, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle,
  ArrowDownRight,
  Sparkles,
  FileText
} from 'lucide-react';

const PURITY_PRESETS = [
  { label: '24K Has Külçe / Gram', value: '24K', ratio: 0.995 },
  { label: '22K Hurda / Bilezik', value: '22K', ratio: 0.916 },
  { label: '18K Hurda / Mücevher', value: '18K', ratio: 0.750 },
  { label: '14K Hurda / Takı', value: '14K', ratio: 0.585 },
  { label: 'Çeyrek / Yarım / Tam Ziynet', value: '22K', ratio: 0.916, category: 'Ziynet Altın' },
  { label: 'Ata / Cumhuriyet Altını', value: '22K', ratio: 0.916, category: 'Cumhuriyet Altını' },
];

export default function GoldPurchaseModal({
  isOpen,
  onClose,
  currentUser,
  liveRates,
  onSubmitPurchase
}) {
  if (!isOpen) return null;

  const [category, setCategory] = useState('Hurda Altın');
  const [itemDescription, setItemDescription] = useState('');
  const [purity, setPurity] = useState('22K');
  const [pureRateRatio, setPureRateRatio] = useState(0.916);
  const [weightGrams, setWeightGrams] = useState('');
  const [unitPricePerGram, setUnitPricePerGram] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Nakit (Kasa Çıkışı)');
  const [storageLocation, setStorageLocation] = useState('Hurda / Çıkma Kasası');
  
  // Müşteri & MASAK Bilgileri
  const [customerName, setCustomerName] = useState('');
  const [customerTc, setCustomerTc] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Canlı kurdan referans alış fiyatı belirleme
  useEffect(() => {
    if (!liveRates?.rates) return;
    
    let baseRate = 0;
    if (purity === '24K') {
      baseRate = Number(liveRates.rates?.HAS_ALTIN?.buy) || Number(liveRates.rates?.GRAM_ALTIN?.buy) || 7100;
    } else if (purity === '22K') {
      baseRate = Number(liveRates.rates?.ALTIN_22?.buy) || Math.round((Number(liveRates.rates?.HAS_ALTIN?.buy) || 7100) * 0.916);
    } else if (purity === '18K') {
      baseRate = Math.round((Number(liveRates.rates?.HAS_ALTIN?.buy) || 7100) * 0.750);
    } else if (purity === '14K') {
      baseRate = Number(liveRates.rates?.ALTIN_14?.buy) || Math.round((Number(liveRates.rates?.HAS_ALTIN?.buy) || 7100) * 0.585);
    }

    if (baseRate > 0 && (!unitPricePerGram || unitPricePerGram === '0')) {
      setUnitPricePerGram(baseRate.toString());
    }
  }, [purity, liveRates]);

  // Ayar değiştiğinde milyem oranını otomatik güncelle
  const handlePurityChange = (newPurity) => {
    setPurity(newPurity);
    const found = PURITY_PRESETS.find(p => p.value === newPurity);
    if (found) {
      setPureRateRatio(found.ratio);
    }
  };

  // Hesaplamalar
  const weightNum = parseFloat(weightGrams) || 0;
  const unitPriceNum = parseFloat(unitPricePerGram) || 0;
  const calculatedPureGrams = (weightNum * pureRateRatio).toFixed(3);
  const calculatedTotalPaid = Math.round(weightNum * unitPriceNum);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (weightNum <= 0) {
      setError('Lütfen geçerli bir gramaj giriniz.');
      return;
    }
    if (unitPriceNum <= 0) {
      setError('Lütfen geçerli bir gram alış fiyatı giriniz.');
      return;
    }
    if (!itemDescription.trim()) {
      setError('Lütfen satın alınan altın açıklamasını (örn: 2 adet 22k bilezik) yazınız.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitPurchase({
        category,
        item_description: itemDescription.trim(),
        purity,
        weight_grams: weightNum,
        pure_rate_ratio: pureRateRatio,
        pure_gold_grams: parseFloat(calculatedPureGrams),
        unit_price_per_gram: unitPriceNum,
        total_amount_paid: calculatedTotalPaid,
        payment_method: paymentMethod,
        storage_location: storageLocation,
        customer_name: customerName.trim() || 'Müşteri',
        customer_tc: customerTc.trim() || null,
        customer_phone: customerPhone.trim() || null,
        notes: notes.trim() || null
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Altın alım işlemi kaydedilemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#12141c] border border-amber-500/50 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        
        {/* MODAL BAŞLIĞI */}
        <div className="bg-gradient-to-r from-[#171b26] via-[#202637] to-[#171b26] p-4 lg:p-5 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-base lg:text-lg flex items-center gap-2">
                <span>MÜŞTERİDEN ALTIN SATIN AL (HURDA / ZİYNET ALIM)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Müşteriden alınan ziynet/hurda altını tartın, has karşılığını hesaplayın ve kasadan çıkışını işleyin.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#202533] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORUM İÇERİĞİ */}
        <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-950/50 border border-rose-500/50 rounded-xl text-rose-300 flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* İŞLEMİ YAPAN PERSONEL BİLGİLENDİRMESİ */}
          <div className="p-3 bg-[#181c28] rounded-xl border border-[#2b3347] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-amber-400" />
              <span className="text-slate-300 font-medium">İşlemi Gerçekleştiren Personel:</span>
            </div>
            <span className="font-bold text-white bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/30 font-mono">
              {currentUser?.full_name || 'Yetkili Personel'} ({currentUser?.role || 'STAFF'})
            </span>
          </div>

          {/* ALTIN TÜRÜ & AÇIKLAMA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Altın Kategorisi</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#0e1017] border border-[#262c3e] text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="Hurda Altın">Hurda Altın (Bilezik / Kolye / Kırık Takı)</option>
                <option value="Ziynet Altın">Ziynet Altın (Çeyrek, Yarım, Tam vb.)</option>
                <option value="Cumhuriyet Altını">Ata / Cumhuriyet / Reşat</option>
                <option value="24K Has Külçe">24K Has Altın / Külçe / Gram Altın</option>
                <option value="Bilezik (22K)">22 Ayar Burma / Ajda / Düz Bilezik</option>
                <option value="Pırlanta / Değerli Taş">Pırlanta Montür & Değerli Taş</option>
                <option value="Diğer">Diğer Kıymetli Maden</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Ürün / Takı Açıklaması *</label>
              <input
                type="text"
                required
                placeholder="Örn: 2 Adet 22 Ayar Burma Bilezik"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                className="w-full bg-[#0e1017] border border-[#262c3e] text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* AYAR & MİLYEM & TARTILAN GRAMAJ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Ayar (Purity)</label>
              <select
                value={purity}
                onChange={(e) => handlePurityChange(e.target.value)}
                className="w-full bg-[#0e1017] border border-[#262c3e] text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-amber-400 font-bold"
              >
                <option value="24K">24 Ayar (995 / 999 Milyem)</option>
                <option value="22K">22 Ayar (916 Milyem)</option>
                <option value="18K">18 Ayar (750 Milyem)</option>
                <option value="14K">14 Ayar (585 Milyem)</option>
                <option value="9K">9 Ayar (375 Milyem)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Tartılan Gramaj (gr) *</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={weightGrams}
                  onChange={(e) => setWeightGrams(e.target.value)}
                  className="w-full bg-[#0e1017] border border-[#262c3e] text-white rounded-xl p-2.5 pr-8 text-xs font-mono font-bold focus:outline-none focus:border-amber-400 text-lg"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-mono font-bold">gr</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Milyem Çarpanı</label>
              <input
                type="number"
                step="0.001"
                value={pureRateRatio}
                onChange={(e) => setPureRateRatio(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0e1017] border border-[#262c3e] text-slate-300 rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* ALIŞ FİYATI & ÖDENEN TOPLAM TUTAR BİLGİ KARTI */}
          <div className="p-4 bg-gradient-to-r from-[#171b26] to-[#12151f] rounded-xl border border-amber-500/30 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">Gram Alış Fiyatı (₺/gr) *</label>
                  {liveRates?.rates && (
                    <button
                      type="button"
                      onClick={() => {
                        let rate = 0;
                        if (purity === '24K') rate = Number(liveRates.rates?.HAS_ALTIN?.buy) || 7100;
                        else if (purity === '22K') rate = Number(liveRates.rates?.ALTIN_22?.buy) || 6500;
                        else if (purity === '14K') rate = Number(liveRates.rates?.ALTIN_14?.buy) || 4150;
                        else rate = Math.round((Number(liveRates.rates?.HAS_ALTIN?.buy) || 7100) * pureRateRatio);
                        setUnitPricePerGram(rate.toString());
                      }}
                      className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      <Sparkles className="w-3 h-3" />
                      Canlı Kurdan Al ({purity})
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    placeholder="Örn: 6550"
                    value={unitPricePerGram}
                    onChange={(e) => setUnitPricePerGram(e.target.value)}
                    className="w-full bg-[#0e1017] border border-[#262c3e] text-white rounded-xl p-2.5 pr-8 text-xs font-mono font-bold focus:outline-none focus:border-amber-400 text-base"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 font-mono font-bold">₺</span>
                </div>
              </div>

              {/* OTOMATİK HAS ALTIN & KASA ÇIKIŞ TUTARI */}
              <div className="bg-[#0e1017] p-3 rounded-xl border border-[#262c3e] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Hesaplanan Has Altın:</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">{calculatedPureGrams} gr Has</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#1a1f2e]">
                  <span className="text-slate-300 font-bold">Müşteriye Ödenecek Tutar:</span>
                  <span className="font-mono font-bold text-white text-base text-emerald-400">
                    {calculatedTotalPaid.toLocaleString('tr-TR')} ₺
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ÖDEME YÖNTEMİ & SAKLAMA YERİ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Kasadan Ödeme Türü</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-[#0e1017] border border-[#262c3e] text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="Nakit (Kasa Çıkışı)">💵 Nakit (Elden Kasa Çıkışı)</option>
                <option value="Banka Havalesi / FAST">🏦 Banka Havalesi / FAST</option>
                <option value="Takas Mahsubu">🪙 Yeni Ürünle Takas / Mahsup</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Alınan Altının Konumu</label>
              <select
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                className="w-full bg-[#0e1017] border border-[#262c3e] text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="Hurda / Çıkma Kasası">Hurda / Çıkma Kasası</option>
                <option value="Merkez Güvenli Kasa">Merkez Güvenli Kasa</option>
                <option value="Atölye (Eritme / Has Dönüşüm)">Atölye (Eritme / Has Dönüşüm)</option>
                <option value="İkinci El / Yenileme Vitrini">İkinci El / Yenileme Vitrini</option>
              </select>
            </div>
          </div>

          {/* MÜŞTERİ BİLGİLERİ (GİDER PUSULASI / MASAK UYUMLU) */}
          <div className="p-3 bg-[#131622] rounded-xl border border-[#262c3e] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                Müşteri Bilgileri (Gider Pusulası & MASAK Kaydı)
              </span>
              <span className="text-[10px] text-slate-400">Resmi Alım Takibi</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-slate-400 text-[10px] mb-0.5">Müşteri Adı Soyadı</label>
                <input
                  type="text"
                  placeholder="Ad Soyad"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-[#0e1017] border border-[#262c3e] text-white rounded-lg p-2 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] mb-0.5">T.C. Kimlik / Pasaport No</label>
                <input
                  type="text"
                  maxLength={11}
                  placeholder="11 haneli T.C. No"
                  value={customerTc}
                  onChange={(e) => setCustomerTc(e.target.value)}
                  className="w-full bg-[#0e1017] border border-[#262c3e] text-white rounded-lg p-2 text-xs focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] mb-0.5">Telefon Numarası</label>
                <input
                  type="tel"
                  placeholder="05XX XXX XX XX"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-[#0e1017] border border-[#262c3e] text-white rounded-lg p-2 text-xs focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] mb-0.5">İşlem / Ürün Notu</label>
              <input
                type="text"
                placeholder="Örn: Müşteri eski burma bileziğini nakde çevirdi, kilit sağlam."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#0e1017] border border-[#262c3e] text-white rounded-lg p-2 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* ONAY BUTONU */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-gold px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Kaydediliyor...' : 'Altın Alımını Tamamla & Kasaya İşle'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
