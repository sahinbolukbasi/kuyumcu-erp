'use client';

import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  ArrowRightLeft, 
  Sparkles, 
  DollarSign, 
  Printer, 
  Share2, 
  ShoppingCart, 
  TrendingUp, 
  Coins, 
  Check, 
  HelpCircle,
  Copy
} from 'lucide-react';

export default function GoldCurrencyCalculator({
  liveRates,
  onFastSale,
  currentUser
}) {
  // İşlem Türü: 'SELL' (Müşteriye Satış), 'BUY' (Müşteriden Alış / Hurda Bozdurma)
  const [tradeType, setTradeType] = useState('SELL');
  
  // Seçilen Varlık Kodu
  const [selectedAsset, setSelectedAsset] = useState('HAS_ALTIN');
  
  // Miktar (Gram veya Adet)
  const [quantity, setQuantity] = useState(10.0);
  
  // Özel Kur Düzenleme Modu
  const [customRateOverride, setCustomRateOverride] = useState('');
  
  // İşçilik Bedeli (TL/Gram veya Toplam TL)
  const [laborType, setLaborType] = useState('PER_GRAM'); // 'PER_GRAM' | 'TOTAL'
  const [laborAmount, setLaborAmount] = useState(150); // TL
  
  // Kâr Marjı (%)
  const [profitMarginPercent, setProfitMarginPercent] = useState(0);

  // Kopyalandı Bildirimi
  const [copiedQuote, setCopiedQuote] = useState(false);

  // Varlık Listesi ve Kur Eşlemesi
  const assetOptions = useMemo(() => {
    const r = liveRates?.rates || {};
    return [
      { id: 'HAS_ALTIN', name: 'Has Altın (24K - 995)', unit: 'Gram', type: 'GOLD', buy: r.HAS_ALTIN?.buy || 7120, sell: r.HAS_ALTIN?.sell || 7180 },
      { id: 'ALTIN_22K', name: '22 Ayar Bilezik & Külçe (916)', unit: 'Gram', type: 'GOLD', buy: r.ALTIN_22K?.buy || 6520, sell: r.ALTIN_22K?.sell || 6640 },
      { id: 'ALTIN_18K', name: '18 Ayar Altın (750)', unit: 'Gram', type: 'GOLD', buy: r.ALTIN_18K?.buy || 5340, sell: r.ALTIN_18K?.sell || 5490 },
      { id: 'ALTIN_14K', name: '14 Ayar Altın (585)', unit: 'Gram', type: 'GOLD', buy: r.ALTIN_14K?.buy || 4160, sell: r.ALTIN_14K?.sell || 4320 },
      { id: 'CEYREK', name: 'Çeyrek Altın (Yeni Tarih)', unit: 'Adet', type: 'COIN', buy: r.CEYREK?.buy || 11620, sell: r.CEYREK?.sell || 11840 },
      { id: 'YARIM', name: 'Yarım Altın', unit: 'Adet', type: 'COIN', buy: r.YARIM?.buy || 23240, sell: r.YARIM?.sell || 23680 },
      { id: 'TAM', name: 'Tam Ziynet Altın', unit: 'Adet', type: 'COIN', buy: r.TAM?.buy || 46480, sell: r.TAM?.sell || 47360 },
      { id: 'ATA', name: 'Cumhuriyet Ata Lira', unit: 'Adet', type: 'COIN', buy: r.ATA?.buy || 47850, sell: r.ATA?.sell || 48750 },
      { id: 'GREMSE', name: 'Gremse Altın (2.5\'luk)', unit: 'Adet', type: 'COIN', buy: r.GREMSE?.buy || 116200, sell: r.GREMSE?.sell || 118400 },
      { id: 'GUMUS_HAS', name: 'Gümüş Has (999)', unit: 'Gram', type: 'SILVER', buy: r.GUMUS_HAS?.buy || 88.50, sell: r.GUMUS_HAS?.sell || 93.20 },
      { id: 'USD', name: 'Amerikan Doları (USD)', unit: 'Döviz', type: 'FX', buy: r.USD?.buy || 41.20, sell: r.USD?.sell || 41.45 },
      { id: 'EUR', name: 'Euro (EUR)', unit: 'Döviz', type: 'FX', buy: r.EUR?.buy || 48.30, sell: r.EUR?.sell || 48.65 },
      { id: 'GBP', name: 'İngiliz Sterlini (GBP)', unit: 'Döviz', type: 'FX', buy: r.GBP?.buy || 56.40, sell: r.GBP?.sell || 56.90 },
      { id: 'CHF', name: 'İsviçre Frangı (CHF)', unit: 'Döviz', type: 'FX', buy: r.CHF?.buy || 51.10, sell: r.CHF?.sell || 51.60 },
    ];
  }, [liveRates]);

  const currentAsset = assetOptions.find(a => a.id === selectedAsset) || assetOptions[0];

  // Efektif Birim Fiyat (Alış veya Satış)
  const defaultRate = tradeType === 'SELL' ? currentAsset.sell : currentAsset.buy;
  const effectiveRate = customRateOverride ? parseFloat(customRateOverride) || defaultRate : defaultRate;

  // Hesaplamalar
  const baseValue = (parseFloat(quantity) || 0) * effectiveRate;
  
  // İşçilik Bedeli (Yalnızca Satışta ve Altın/Mücevherde Eklenir)
  let totalLabor = 0;
  if (tradeType === 'SELL' && currentAsset.type !== 'FX') {
    if (laborType === 'PER_GRAM') {
      totalLabor = (parseFloat(quantity) || 0) * (parseFloat(laborAmount) || 0);
    } else {
      totalLabor = parseFloat(laborAmount) || 0;
    }
  }

  // Kâr Marjı Tutarı
  const profitAmount = tradeType === 'SELL' ? (baseValue + totalLabor) * ((parseFloat(profitMarginPercent) || 0) / 100) : 0;

  // Net Toplam Tutar
  const grandTotal = Math.round(baseValue + totalLabor + profitAmount);

  // Döviz Eşdeğerleri
  const usdRate = assetOptions.find(a => a.id === 'USD')?.sell || 41.45;
  const eurRate = assetOptions.find(a => a.id === 'EUR')?.sell || 48.65;
  const grandTotalUSD = (grandTotal / usdRate).toFixed(2);
  const grandTotalEUR = (grandTotal / eurRate).toFixed(2);

  // Proforma Teklif Metni
  const quoteText = `GOLDEN GUARD MÜCEVHERAT - FİYAT TEKLİFİ
Tarih: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
İşlem: ${tradeType === 'SELL' ? 'MÜŞTERİYE SATIŞ' : 'MÜŞTERİDEN ALIŞ (BOZDURMA)'}
Varlık: ${currentAsset.name}
Miktar: ${quantity} ${currentAsset.unit}
Birim Kur: ${effectiveRate.toLocaleString('tr-TR')} ₺
İşçilik Bedeli: ${totalLabor.toLocaleString('tr-TR')} ₺
NET TOPLAM TUTAR: ${grandTotal.toLocaleString('tr-TR')} ₺ ($${grandTotalUSD} / €${grandTotalEUR})
Temsilci: ${currentUser?.full_name || 'Yetkili Satış Ekibi'}
İletişim: Kapalıçarşı Kalpakçılar Cad. No:42 Fatih / İst. Tel: (0212) 522 00 00`;

  const handleCopyQuote = () => {
    navigator.clipboard.writeText(quoteText);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2500);
  };

  const handlePrintQuote = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ÜST BAŞLIK BİLGİ KARTI */}
      <div className="bg-gradient-to-r from-[#141824] via-[#1a2030] to-[#141824] p-4 lg:p-6 rounded-2xl border border-amber-500/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg shrink-0">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
              <span>CANLI PİYASA MOTORU</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                KAPALIÇARŞI VE TCMB ANLIK
              </span>
            </div>
            <h2 className="font-cinzel text-lg lg:text-xl font-bold text-white tracking-wide mt-0.5">
              ALTIN & DÖVİZ HESAPLAMA PORTALI
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Alış ve satış işlemlerinde canlı borsa kurları, zanaatkâr işçiliği ve kâr marjı ile anlık net tutar hesaplayın.
            </p>
          </div>
        </div>

        {/* Alış / Satış Buton Şalteri */}
        <div className="flex items-center bg-[#090b10] p-1.5 rounded-xl border border-white/10 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setTradeType('SELL')}
            className={`flex-1 md:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              tradeType === 'SELL'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>💎 Müşteriye Satış</span>
          </button>
          <button
            type="button"
            onClick={() => setTradeType('BUY')}
            className={`flex-1 md:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
              tradeType === 'BUY'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🪙 Müşteriden Alış (Hurda/Bozdurma)</span>
          </button>
        </div>
      </div>

      {/* ANA HESAPLAMA ÇALIŞMA ALANI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SOL PANEL: PARAMETRELER VE GİRDİLER (7 Kolon) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Varlık Seçimi Kartı */}
          <div className="bg-[#12141c] border border-[#242938] rounded-2xl p-5 shadow-lg space-y-4">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>1. Altın, Ziynet veya Döviz Türü Seçin:</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {assetOptions.map(asset => {
                const isSelected = selectedAsset === asset.id;
                const rate = tradeType === 'SELL' ? asset.sell : asset.buy;
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => {
                      setSelectedAsset(asset.id);
                      setCustomRateOverride('');
                    }}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-b from-amber-500/20 to-[#161a26] border-amber-400 text-white shadow-lg'
                        : 'bg-[#181b26] border-[#222736] text-slate-300 hover:border-amber-500/40 hover:bg-[#1f2434]'
                    }`}
                  >
                    <div>
                      <div className="text-[11px] font-bold truncate">{asset.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{asset.unit}</div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[9px] text-slate-400 uppercase font-semibold">
                        {tradeType === 'SELL' ? 'Satış' : 'Alış'}:
                      </span>
                      <span className="font-mono text-xs font-bold text-amber-300">
                        {rate.toLocaleString('tr-TR')} ₺
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Miktar, Birim Kur ve İşçilik Girişleri */}
          <div className="bg-[#12141c] border border-[#242938] rounded-2xl p-5 shadow-lg space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Miktar */}
              <div>
                <label className="block text-slate-300 font-semibold text-xs mb-1.5">
                  Miktar ({currentAsset.unit}):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-[#090b10] border border-[#242938] text-white rounded-xl px-3.5 py-2.5 text-base font-mono font-bold focus:border-amber-400 focus:outline-none"
                    placeholder="10.00"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 font-bold">
                    {currentAsset.unit}
                  </span>
                </div>
              </div>

              {/* Birim Kur (Canlı veya Düzenlenebilir) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-semibold text-xs">
                    Birim Kur ({tradeType === 'SELL' ? 'Satış' : 'Alış'}):
                  </label>
                  {customRateOverride && (
                    <button
                      type="button"
                      onClick={() => setCustomRateOverride('')}
                      className="text-[10px] text-amber-400 hover:underline font-mono"
                    >
                      ↺ Canlı Kura Sıfırla
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={customRateOverride !== '' ? customRateOverride : defaultRate}
                    onChange={(e) => setCustomRateOverride(e.target.value)}
                    className="w-full bg-[#090b10] border border-[#242938] text-white rounded-xl px-3.5 py-2.5 text-base font-mono font-bold focus:border-amber-400 focus:outline-none"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-amber-400 font-bold">
                    ₺ / {currentAsset.unit}
                  </span>
                </div>
              </div>
            </div>

            {/* İşçilik Bedeli ve Kâr Marjı (Yalnızca Satış Modunda) */}
            {tradeType === 'SELL' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#202534]">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-300 font-semibold text-xs">
                      İşçilik Bedeli:
                    </label>
                    <div className="flex items-center gap-1 text-[10px] font-mono">
                      <button
                        type="button"
                        onClick={() => setLaborType('PER_GRAM')}
                        className={`px-1.5 py-0.5 rounded ${laborType === 'PER_GRAM' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-500'}`}
                      >
                        Gram Başı
                      </button>
                      <button
                        type="button"
                        onClick={() => setLaborType('TOTAL')}
                        className={`px-1.5 py-0.5 rounded ${laborType === 'TOTAL' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-500'}`}
                      >
                        Sabit Toplam
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      value={laborAmount}
                      onChange={(e) => setLaborAmount(e.target.value)}
                      className="w-full bg-[#090b10] border border-[#242938] text-white rounded-xl px-3.5 py-2 text-sm font-mono font-bold focus:border-amber-400 focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                      ₺ {laborType === 'PER_GRAM' ? '/ gr' : 'Toplam'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold text-xs mb-1.5">
                    Kâr Marjı (%):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      value={profitMarginPercent}
                      onChange={(e) => setProfitMarginPercent(e.target.value)}
                      className="w-full bg-[#090b10] border border-[#242938] text-white rounded-xl px-3.5 py-2 text-sm font-mono font-bold focus:border-amber-400 focus:outline-none"
                      placeholder="0"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 font-bold">
                      %
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SAĞ PANEL: CANLI NET HESAPLAMA VE AKSIYONLAR (5 Kolon) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-gradient-to-b from-[#161a26] via-[#10121a] to-[#0a0c12] border-2 border-amber-500/50 rounded-2xl p-5 lg:p-6 shadow-2xl flex flex-col justify-between space-y-5 relative overflow-hidden">
            
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#242938] pb-3">
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider font-mono ${
                  tradeType === 'SELL'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {tradeType === 'SELL' ? '● MÜŞTERİYE SATIŞ TUTARI' : '● MÜŞTERİYE ÖDENECEK TUTAR'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date().toLocaleDateString('tr-TR')}
                </span>
              </div>

              {/* Büyük Tutar Göstergesi */}
              <div className="p-4 rounded-xl bg-black/50 border border-amber-500/30 text-center space-y-1">
                <div className="text-[11px] text-slate-400 font-mono uppercase tracking-widest">
                  HESAPLANAN NET TUTAR
                </div>
                <div className="text-3xl lg:text-4xl font-display font-black text-amber-400 tracking-tight">
                  {grandTotal.toLocaleString('tr-TR')} <span className="text-xl font-normal text-slate-300">₺</span>
                </div>
                <div className="text-xs font-mono text-slate-400 flex items-center justify-center gap-3 pt-1">
                  <span>≈ ${grandTotalUSD}</span>
                  <span>•</span>
                  <span>≈ €{grandTotalEUR}</span>
                </div>
              </div>

              {/* Detay Dökümü */}
              <div className="space-y-2 text-xs font-mono bg-[#0c0e14] p-3.5 rounded-xl border border-[#202534]">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Seçili Varlık:</span>
                  <span className="font-bold text-white">{currentAsset.name}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Miktar:</span>
                  <span className="font-bold text-white">{quantity} {currentAsset.unit}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Birim Kur:</span>
                  <span className="font-bold text-amber-300">{effectiveRate.toLocaleString('tr-TR')} ₺</span>
                </div>
                <div className="flex items-center justify-between text-slate-300 border-t border-white/5 pt-1.5">
                  <span>Hammadde / Baz Değer:</span>
                  <span className="text-white">{Math.round(baseValue).toLocaleString('tr-TR')} ₺</span>
                </div>
                {tradeType === 'SELL' && totalLabor > 0 && (
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Toplam İşçilik:</span>
                    <span className="text-emerald-400">+{Math.round(totalLabor).toLocaleString('tr-TR')} ₺</span>
                  </div>
                )}
                {tradeType === 'SELL' && profitAmount > 0 && (
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Kâr Marjı (+%{profitMarginPercent}):</span>
                    <span className="text-amber-400">+{Math.round(profitAmount).toLocaleString('tr-TR')} ₺</span>
                  </div>
                )}
              </div>
            </div>

            {/* Aksiyon Butonları */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onFastSale) {
                    onFastSale({
                      id: 9999,
                      name: `${quantity} ${currentAsset.unit} ${currentAsset.name}`,
                      category: currentAsset.type === 'COIN' ? 'Ziynet' : currentAsset.type === 'FX' ? 'Döviz' : 'Altın',
                      purity: currentAsset.id.includes('22K') ? '22K' : currentAsset.id.includes('18K') ? '18K' : currentAsset.id.includes('14K') ? '14K' : '24K',
                      weight_grams: currentAsset.unit === 'Gram' ? parseFloat(quantity) : 0,
                      price: grandTotal,
                      cost_price: Math.round(baseValue),
                      barcode: `CALC-${Date.now().toString().slice(-6)}`
                    });
                  }
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-[0.99] transition"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>⚡ DOĞRUDAN SATIŞ FİŞİ KES (POS'A AKTAR)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyQuote}
                  className="py-2 px-3 rounded-xl bg-[#191c26] hover:bg-[#222736] border border-[#262c3e] text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  {copiedQuote ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Kopyalandı!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                      <span>WhatsApp Teklifi</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handlePrintQuote}
                  className="py-2 px-3 rounded-xl bg-[#191c26] hover:bg-[#222736] border border-[#262c3e] text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Proforma Yazdır</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
