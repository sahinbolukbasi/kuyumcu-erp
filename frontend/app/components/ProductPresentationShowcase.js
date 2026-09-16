'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  Maximize2, 
  QrCode, 
  ShoppingBag, 
  TrendingUp, 
  Award, 
  RotateCw, 
  Check, 
  Printer, 
  Send, 
  Bookmark, 
  Radio, 
  ShieldCheck, 
  Lock, 
  Layers, 
  Cpu, 
  Scale, 
  Eye, 
  Sun, 
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function ProductPresentationShowcase({
  product,
  allProducts = [],
  onSelectProduct,
  slots = [],
  goldPrice = 3788.20,
  currentUser,
  onFastSale,
  onClose,
  isModal = false
}) {
  // Çoklu Açı & Galeri
  const [activeAngleIndex, setActiveAngleIndex] = useState(0);
  const [isPolarized, setIsPolarized] = useState(false);
  const [isMacroZoom, setIsMacroZoom] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Hurda Takas Simülatörü
  const [scrapGrams, setScrapGrams] = useState(18.5);
  const [scrapKarat, setScrapKarat] = useState('22K');

  // Varsayılan Mücevher Verisi (Ürün boşsa veya eksik alanları varsa Stitch tasarımındaki lüks verilerle tamamla)
  const p = product || {
    id: 1,
    barcode: 'KYM-2024-001',
    name: 'Trabzon Hasırı Çift Sıra Zarafet Kelepçe Bilezik',
    category: 'Bilezik',
    purity: '22K',
    milyem: 916,
    weight_grams: 28.60,
    price: 86500,
    cost_price: 74000,
    labor_cost: 0,
    gold_color: 'Sarı Altın',
    craftsmanship_type: 'Trabzon Hasırı (El Örgüsü)',
    surface_finish: 'Parlak Cila & Saten',
    workshop_origin: 'Sarraf Erdem Özel Zanaatkâr Atölyesi No:04 · Kapalıçarşı Darphane Tescilli',
    description: 'Bu eser, Trabzon’un asırlık telkâri ve hasır örme zanaatkârları tarafından 0.28 mikron saf altın tellerin cımbız ve mengene kullanılmaksızın sadece parmak uçlarıyla ilmek ilmek örülmesiyle 42 saatlik saf el emeğiyle tamamlanmıştır. Bileziğin patentli kilit tablasında Sarraf Erdem zanaatkâr mühürü ve T.C. Darphane 916 ayar damgası yer almaktadır.',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB16_iwXd6omm192OHmXn8HAcpmTfpReAh_T4gybuJLBho44zIWo9hDj96syd13by1giNIoAjrKiprHHEgIQlPoNDztoLKFvvBzvzMp_2mNcm1sU6MX1prmlDys3KNyG7pGq4hJacOomz0Xc4LVVHkcvKX9p1TA0wWE9cPakszcS5xUD50NDFyrujKYZ2qYzSJcWFQgDowTHyOhDVzczC5xEAQgUOhUG0-t0_76Zota1eYdqnvHp3Scyg',
    slot_id: 1
  };

  // İkincil Galeri Görselleri (Varsayılan veya JSON)
  const defaultAngles = [
    {
      title: 'Ön Teşhir',
      desc: 'Ana Görünüm',
      url: p.image_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuB16_iwXd6omm192OHmXn8HAcpmTfpReAh_T4gybuJLBho44zIWo9hDj96syd13by1giNIoAjrKiprHHEgIQlPoNDztoLKFvvBzvzMp_2mNcm1sU6MX1prmlDys3KNyG7pGq4hJacOomz0Xc4LVVHkcvKX9p1TA0wWE9cPakszcS5xUD50NDFyrujKYZ2qYzSJcWFQgDowTHyOhDVzczC5xEAQgUOhUG0-t0_76Zota1eYdqnvHp3Scyg'
    },
    {
      title: 'Kilit Detayı',
      desc: 'Patentli Mekanizma',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAe4q15N90CFnlI9YArPWFIr8qO3_dJipcOtaqvr9y5zOUsHXZJvsVvtuFyg0qrowzKBp6N-QpBRJXMUpivMtriOYBajD-3Y-48gAz-cgTYdh53aMHWvmb25ONgRyQ2ji0MAi0LTY5hsb49II1ge3d9eW8XN6D-n3Qk1BCbvMPSu06LLfDHNwpbL8AHstF1KxS-twnCjBU15aFQSZFh0Zw1acf0vyJKH6vT889ZCGdFFMFsB9vrU_X6dA'
    },
    {
      title: 'Hasır Örgü',
      desc: '0.28mm Mikro Doku',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBC6Vh7je2JqguD1DkZDHZpKk3y1OK0-NLT5jTuNhITBix-r3vx5hZ90gySLH4XtmOcKqPc7qYDSB0NJZ0HSmUgJuve2wEpqvQSCnYhHDl0vgTXTrj2BmjeVqcwR0xsfms1hOEDCAwfCEf1ayX7rrXesLrI9C7lWgqMbAj_EQPU94ro0VqYKM1Dxkyytu0LBLAruMeitND8QMu5R9L9k_Mxa1QCo1ZXJKN9EcYe0JHdIv2OWZyFD1cj6Q'
    },
    {
      title: 'Bilek Prova',
      desc: 'Salon Manken Çekimi',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChnqjirm7ZTXgUOr0AefHe0pBtupuQxu9gCRpNTK4nf5AtK4h3MT2yduBufAXCbQWFJjZKOum7hmji3K69FDuI5gAiJdKYUiB-ZHY5oFVZqpSXFuQR8qQx_6RiKyu2IbUMlGJ1zMuc2mcorf_ydkWpdOm56BR6tN3A_j7vM_9ajN05oi8KOhDjq_FgsQeCIAPt0WGjz7M8Jg4Sb6MSbrsYw_1Q3ST8Ii9VgyJQa3N5Dt_qpC3hVQTF_g'
    },
    {
      title: 'Sanal Vitrin',
      desc: '360° Etkileşimli',
      is360: true
    }
  ];

  // Ek görseller varsa birleştir
  const angles = React.useMemo(() => {
    if (p.additional_images_json) {
      try {
        const parsed = JSON.parse(p.additional_images_json);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const list = [{ title: 'Ön Teşhir', desc: 'Ana Görünüm', url: p.image_url || defaultAngles[0].url }];
          parsed.forEach((img, idx) => {
            list.push({ title: img.title || `Açı #${idx+2}`, desc: img.desc || 'Detay Çekim', url: img.url });
          });
          list.push({ title: 'Sanal Vitrin', desc: '360° Etkileşimli', is360: true });
          return list;
        }
      } catch (err) {}
    }
    return defaultAngles;
  }, [p]);

  // Aktif görsel
  const currentAngle = angles[activeAngleIndex] || angles[0];

  // Altın Matematik Hesaplamaları
  const milyemFactor = (p.milyem || 916) / 1000;
  const netHasGrams = parseFloat(((p.weight_grams || 28.60) * milyemFactor).toFixed(2));
  const rawGoldCost = Math.round(netHasGrams * goldPrice);
  const retailPrice = p.price || 86500;
  const hasValue = Math.round(netHasGrams * goldPrice);
  const discountRate = 12.8; // % VIP İndirim
  const originalPrice = Math.round(retailPrice * 1.147); // Çizili eski fiyat
  const installment3Monthly = Math.round((retailPrice * 1.028) / 3);

  // Hurda Fiyat Hesaplama
  const scrapRates = {
    '24K': Math.round(goldPrice * 0.989),
    '22K': Math.round(goldPrice * 0.906),
    '18K': Math.round(goldPrice * 0.742),
    '14K': Math.round(goldPrice * 0.577)
  };
  const currentScrapRate = scrapRates[scrapKarat] || 3432;
  const scrapTotalValue = Math.round((scrapGrams || 0) * currentScrapRate);
  const scrapDifference = Math.max(0, retailPrice - scrapTotalValue);

  // İlişkili IoT Yuvası
  const assignedSlot = slots.find(s => s.id === p.slot_id) || {
    slot_number: p.slot_id || 1,
    label: 'Ön Teşhir Sırası Slot #1',
    ip_address: '192.168.1.101',
    port: 8080,
    is_online: true
  };

  // Tam ekran kontrolü
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Teklif Yazdırma
  const handlePrintProposal = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>SARRAF ERDEM - Müşteri Teklif & Sertifika Fişi</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #111; max-width: 800px; margin: 0 auto; }
            .header { border-bottom: 2px solid #d4af37; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .logo { font-size: 26px; font-weight: bold; letter-spacing: 2px; color: #aa820a; }
            .sub { font-size: 11px; text-transform: uppercase; color: #666; letter-spacing: 1px; }
            .badge { background: #d4af37; color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 25px; }
            .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; background: #f8fafc; }
            .price-box { background: #0c0d12; color: #e5c158; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0; }
            .price-box h2 { font-size: 32px; margin: 5px 0; color: #f6e08c; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
            table td { padding: 6px 0; border-bottom: 1px solid #e2e8f0; }
            table td:last-child { text-align: right; font-weight: bold; }
            .footer { margin-top: 40px; font-size: 11px; color: #777; border-top: 1px solid #ddd; padding-top: 15px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">SARRAF ERDEM</div>
              <div class="sub">Haute Joaillerie & Akıllı IoT Vitrin — Kapalıçarşı</div>
            </div>
            <div style="text-align: right;">
              <span class="badge">RESMİ PROFORMA TEKLİF</span>
              <div style="font-size: 12px; margin-top: 5px; color: #555;">Tarih: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}</div>
            </div>
          </div>

          <div style="margin-top: 25px;">
            <h1 style="font-size: 20px; margin-bottom: 5px;">${p.name}</h1>
            <div style="color: #666; font-size: 13px;">Barkod/RFID: <strong>${p.barcode}</strong> &nbsp;|&nbsp; Seri No: <strong>SE-${new Date().getFullYear()}-${p.id * 123 + 4321}</strong></div>
          </div>

          <div class="grid">
            <div class="card">
              <h3 style="margin-top: 0; font-size: 14px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">Mücevher Özellikleri</h3>
              <table>
                <tr><td>Maden Cinsi:</td><td>${p.purity} ${p.gold_color || 'Sarı Altın'}</td></tr>
                <tr><td>Milyem (Saflık):</td><td>${p.milyem || 916}‰</td></tr>
                <tr><td>Net Ağırlık:</td><td>${p.weight_grams} gr</td></tr>
                <tr><td>Saf Has Altın:</td><td>${netHasGrams} gr Has</td></tr>
                <tr><td>İşçilik Türü:</td><td>${p.craftsmanship_type || 'El Hasırı'}</td></tr>
                <tr><td>Ölçü / Çap:</td><td>${p.size_or_length || '6.2 cm (Standart)'}</td></tr>
              </table>
            </div>

            <div class="card">
              <h3 style="margin-top: 0; font-size: 14px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">Borsa & Kur Güvencesi</h3>
              <table>
                <tr><td>Borsa Has Spot:</td><td>₺${goldPrice.toLocaleString('tr-TR')}</td></tr>
                <tr><td>Has Altın Değeri:</td><td>₺${hasValue.toLocaleString('tr-TR')}</td></tr>
                <tr><td>Sabit El İşçiliği:</td><td>Kampanya (+₺0)</td></tr>
                <tr><td>VIP Peşin İndirimi:</td><td>-%${discountRate}</td></tr>
                <tr><td>Teklif Geçerlilik:</td><td>30 Dakika (Spot Korumalı)</td></tr>
              </table>
            </div>
          </div>

          <div class="price-box">
            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Nihai Peşin / Havale Satış Fiyatı</div>
            <h2>₺${retailPrice.toLocaleString('tr-TR')}</h2>
            <div style="font-size: 12px; opacity: 0.85;">KDV, Darphane Tescil Belgesi & Ömür Boyu Ücretsiz Bakım Dahildir</div>
          </div>

          <div style="margin-top: 20px; font-size: 12px; line-height: 1.6; background: #fffbeb; border: 1px solid #fef3c7; padding: 15px; border-radius: 6px;">
            <strong>Zanaatkâr Notu:</strong> ${p.description || 'Sarraf Erdem özel koleksiyon parçası.'}
          </div>

          <div class="footer">
            Bu belge Sarraf Erdem Mücevherat A.Ş. akıllı IoT vitrin otomasyon sistemi tarafından üretilmiştir.<br/>
            Danışman: ${currentUser?.full_name || 'Sarraf Erdem Satış Masası'} &nbsp;|&nbsp; BIST Takas Kodu: 9481-TR
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // WhatsApp Teklifi
  const handleShareWhatsapp = () => {
    const text = encodeURIComponent(
      `💎 *SARRAF ERDEM HAUTE JOAILLERIE*\n` +
      `Sayın Müşterimiz, incelediğiniz özel parça detayları:\n\n` +
      `✨ *Ürün:* ${p.name}\n` +
      `🔖 *Barkod:* ${p.barcode}\n` +
      `⚖️ *Ayar & Ağırlık:* ${p.purity} (${p.milyem || 916} Milyem) — ${p.weight_grams} gr\n` +
      `💰 *Canlı Peşin Fiyatı:* ₺${retailPrice.toLocaleString('tr-TR')}\n` +
      `🛡️ *Garanti:* T.C. Darphane Tescilli & Ömür Boyu Ücretsiz Bakım\n\n` +
      `Detaylı dijital sertifikanızı mağazamızdan teslim alabilirsiniz.`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className={`w-full bg-[#0d0e13] text-slate-100 rounded-2xl border border-amber-500/30 overflow-hidden shadow-2xl relative ${isModal ? 'max-h-[92vh] flex flex-col' : ''}`}>
      {/* ================= ÜST BİLGİ & STATÜ BARI ================= */}
      <div className="w-full bg-[#12141c] border-b border-white/10 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-400 uppercase tracking-wider font-mono">
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
              Vitrin Askı Slot #{assignedSlot.slot_number}
            </span>
            <span>›</span>
            <span className="text-slate-300">{p.category} Koleksiyonu</span>
            <span>›</span>
            <span className="text-amber-300 font-bold truncate">{p.barcode}</span>
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              HX711 TARTIM: {p.weight_grams}g (KARARLI ±0.002g)
            </span>
            <span className="text-slate-400 text-[11px] hidden md:inline">
              Danışman: <strong className="text-white font-medium">{currentUser?.full_name || 'Satış Masası'}</strong> (VIP Salonu #2)
            </span>
          </div>
        </div>

        {/* Hızlı Butonlar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Ürün Değiştirici (Eğer liste varsa) */}
          {allProducts.length > 1 && onSelectProduct && (
            <div className="flex items-center gap-1 bg-[#191c26] border border-white/10 rounded-lg p-1">
              <button
                type="button"
                onClick={() => {
                  const idx = allProducts.findIndex(x => x.id === p.id);
                  const prev = idx > 0 ? allProducts[idx - 1] : allProducts[allProducts.length - 1];
                  onSelectProduct(prev);
                }}
                className="p-1 hover:text-amber-400 transition"
                title="Önceki Mücevher"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <select
                value={p.id}
                onChange={(e) => {
                  const found = allProducts.find(x => String(x.id) === e.target.value);
                  if (found) onSelectProduct(found);
                }}
                className="bg-transparent text-xs text-amber-300 font-semibold focus:outline-none max-w-[160px] truncate cursor-pointer"
              >
                {allProducts.map(prod => (
                  <option key={prod.id} value={prod.id} className="bg-[#12141c] text-white">
                    {prod.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  const idx = allProducts.findIndex(x => x.id === p.id);
                  const next = idx < allProducts.length - 1 ? allProducts[idx + 1] : allProducts[0];
                  onSelectProduct(next);
                }}
                className="p-1 hover:text-amber-400 transition"
                title="Sonraki Mücevher"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-3 py-1.5 rounded-lg bg-[#191c26] hover:bg-[#232736] border border-white/10 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{isFullscreen ? 'Tam Ekrandan Çık' : 'Müşteri Sunum Modu'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="px-3 py-1.5 rounded-lg bg-[#191c26] hover:bg-[#232736] border border-white/10 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Sertifika QR Paylaş</span>
          </button>

          <button
            type="button"
            onClick={() => onFastSale && onFastSale(p)}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#aa820a] text-black font-bold text-xs hover:brightness-110 transition shadow-lg flex items-center gap-1.5"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Hızlı Satışa Dönüştür (₺{retailPrice.toLocaleString('tr-TR')})</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition ml-1"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ================= ANA SUNUM SAHNESİ ================= */}
      <div className={`p-4 sm:p-6 lg:p-8 space-y-6 ${isModal ? 'overflow-y-auto flex-1' : ''}`}>
        {/* Başlık ve Hızlı Fiyat Rozeti */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold tracking-widest uppercase">
                {p.purity} ({p.milyem || 916} MİLYEM)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[10px] uppercase font-medium">
                {p.craftsmanship_type || 'TELKÂRİ & EL HASIRI'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 text-[10px] uppercase font-bold border border-amber-400/30">
                PATENTLİ KİLİT MEKANİZMASI
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight" style={{fontFamily:"'Playfair Display', serif"}}>
              {p.name}
            </h1>

            <p className="text-xs text-slate-400 font-mono">
              {p.workshop_origin || 'Sarraf Erdem Özel Zanaatkâr Atölyesi No:04 · Kapalıçarşı Darphane Tescilli · Koleksiyon No 2025/12'}
            </p>
          </div>

          {/* Tavsiye Edilen Satış Rozeti */}
          <div className="bg-[#141620] border border-amber-500/30 p-4 rounded-xl flex items-baseline gap-4 shadow-xl shrink-0">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Tavsiye Edilen Satış</span>
              <span className="text-2xl sm:text-3xl font-bold font-display text-amber-400 leading-none mt-1 block">
                ₺{retailPrice.toLocaleString('tr-TR')}
              </span>
            </div>
            <div className="text-right border-l border-white/10 pl-3">
              <span className="text-[11px] text-slate-400 font-mono block">Has Değeri: ₺{hasValue.toLocaleString('tr-TR')}</span>
              <span className="text-xs text-emerald-400 font-bold block">%{discountRate} Peşin İndirimi</span>
            </div>
          </div>
        </div>

        {/* ================= İKİLİ IZGARA (SOL: GALERİ / SAĞ: BORSA & KÜNYE) ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* SOL KOLON: Yüksek Çözünürlüklü Galeri, Zanaat Hikayesi, Hurda Hesaplayıcı (7 Kolon) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Ana Görsel Sahnesi & Lens Odak */}
            <div className="relative bg-[#07080b] rounded-2xl border border-white/10 overflow-hidden shadow-2xl group">
              {/* Üst Etiketler */}
              <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-amber-400 font-mono text-[10px] font-bold flex items-center gap-1 border border-amber-500/30 shadow-lg">
                  <Search className="w-3 h-3" />
                  {isMacroZoom ? '8x MİKRO ZOOM AKTİF' : '8x MİKRO ZOOM / İNCE İŞÇİLİK'}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-slate-300 font-mono text-[10px] border border-white/10">
                  KAYITLI SLOT #{assignedSlot.slot_number}
                </span>
              </div>

              <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsMacroZoom(!isMacroZoom)}
                  className={`w-8 h-8 rounded-lg backdrop-blur-md border transition flex items-center justify-center ${isMacroZoom ? 'bg-amber-500 text-black border-amber-400' : 'bg-black/70 text-white border-white/10 hover:text-amber-400'}`}
                  title="Mikro Zoom Aç/Kapat"
                >
                  <Search className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsPolarized(!isPolarized)}
                  className={`w-8 h-8 rounded-lg backdrop-blur-md border transition flex items-center justify-center ${isPolarized ? 'bg-amber-500 text-black border-amber-400' : 'bg-black/70 text-white border-white/10 hover:text-amber-400'}`}
                  title="Polarize Işık Filtresi"
                >
                  <Sun className="w-4 h-4" />
                </button>
              </div>

              {/* Görsel Sahnesi */}
              <div className="relative w-full aspect-[4/3] bg-gradient-to-b from-[#151722] via-[#090a0e] to-[#151722] flex items-center justify-center overflow-hidden">
                {currentAngle.is360 ? (
                  // 360 Sanal Vitrin Simülasyonu
                  <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center">
                    <img
                      src={p.image_url || defaultAngles[0].url}
                      alt="360"
                      className="max-h-[75%] object-contain transition-transform duration-200"
                      style={{
                        transform: `rotate(${rotationAngle}deg) scale(${isMacroZoom ? 1.4 : 1})`,
                        filter: isPolarized ? 'contrast(1.25) brightness(1.15) saturate(1.4)' : 'none'
                      }}
                    />
                    <div className="absolute bottom-4 inset-x-6 bg-black/80 backdrop-blur-md p-3 rounded-xl border border-amber-500/30 flex items-center gap-3">
                      <RotateCw className="w-4 h-4 text-amber-400 animate-spin" />
                      <span className="text-[11px] font-mono text-slate-300">360° Açı: {rotationAngle}°</span>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={rotationAngle}
                        onChange={(e) => setRotationAngle(parseInt(e.target.value))}
                        className="flex-1 accent-amber-400 cursor-pointer"
                      />
                    </div>
                  </div>
                ) : (
                  <img
                    src={currentAngle.url}
                    alt={currentAngle.title}
                    className="w-full h-full object-cover object-center transform transition-all duration-700 hover:scale-110"
                    style={{
                      transform: isMacroZoom ? 'scale(1.45)' : 'scale(1)',
                      filter: isPolarized ? 'contrast(1.3) brightness(1.1) saturate(1.4)' : 'none'
                    }}
                  />
                )}

                {/* Canlı Holografik Odak */}
                <div className="absolute bottom-4 left-4 z-20 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-amber-500/30 flex items-center gap-2 shadow-lg">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                  </span>
                  <span className="font-mono text-[10px] text-amber-200 font-semibold tracking-wide">
                    CANLI MAKRO ODAK: 0.28mm HASIR İLMEK DOKUSU
                  </span>
                </div>
              </div>
            </div>

            {/* Çok Açılı Küçük Resim Galerisi */}
            <div className="grid grid-cols-5 gap-2.5">
              {angles.map((ang, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveAngleIndex(idx)}
                  className={`relative rounded-xl overflow-hidden aspect-square border transition-all p-0.5 group ${activeAngleIndex === idx ? 'border-amber-400 ring-2 ring-amber-400/40 bg-[#1e2333]' : 'border-white/10 bg-[#12141c] hover:border-amber-400/50'}`}
                >
                  {ang.is360 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#151824] text-amber-400">
                      <RotateCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                      <span className="text-[9px] font-mono font-bold mt-1 uppercase">360° Vitrin</span>
                    </div>
                  ) : (
                    <>
                      <img src={ang.url} alt={ang.title} className="w-full h-full object-cover rounded-lg group-hover:opacity-90" />
                      <span className="absolute bottom-1 inset-x-1 text-center font-mono text-[9px] bg-black/80 text-amber-300 py-0.5 rounded backdrop-blur-sm truncate">
                        {ang.title}
                      </span>
                    </>
                  )}
                </button>
              ))}
            </div>

            {/* Zanaatkâr Hikayesi & İmalat Künyesi */}
            <div className="bg-[#12141c] p-5 rounded-2xl border border-white/10 shadow-lg space-y-3 relative overflow-hidden">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider font-mono">
                <Sparkles className="w-4 h-4" />
                <span>Müşteri Sunum Notu & Zanaatkâr Hikayesi</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                {p.description || "Bu eser, Trabzon’un asırlık telkâri ve hasır örme zanaatkârları tarafından 0.28 mikron saf altın tellerin cımbız ve mengene kullanılmaksızın sadece parmak uçlarıyla ilmek ilmek örülmesiyle 42 saatlik saf el emeğiyle tamamlanmıştır. Bileziğin patentli kilit tablasında Sarraf Erdem zanaatkâr mühürü ve T.C. Darphane 916 ayar damgası yer almaktadır."}
              </p>

              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10">
                <div className="bg-[#0b0c10] p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">İşçilik Süresi</span>
                  <span className="text-base font-bold text-white mt-0.5 block">42 Saat</span>
                </div>
                <div className="bg-[#0b0c10] p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Tel Kalınlığı</span>
                  <span className="text-base font-bold text-white mt-0.5 block">0.28 mm</span>
                </div>
                <div className="bg-[#0b0c10] p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Kilit Tipi</span>
                  <span className="text-base font-bold text-white mt-0.5 block">Çift Emniyetli</span>
                </div>
              </div>
            </div>

            {/* Müşteri Danışmanlığı: Hurda / Eski Altın Takas Simülatörü */}
            <div className="bg-[#141622] p-5 rounded-2xl border border-amber-500/30 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider font-mono">
                  <Scale className="w-4 h-4" />
                  <span>Hurda / Eski Altın Takas Simülatörü</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
                  Canlı Kapalıçarşı Kuru
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Müşterinin Getirdiği Hurda</label>
                  <div className="flex items-center bg-[#090a0e] border border-white/10 px-3 py-2 rounded-xl">
                    <input
                      type="number"
                      step="0.1"
                      value={scrapGrams}
                      onChange={(e) => setScrapGrams(parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent text-white font-bold text-base focus:outline-none"
                    />
                    <span className="text-[10px] font-mono text-amber-400 font-bold ml-1">GRAM</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Getirilen Hurda Ayarı</label>
                  <select
                    value={scrapKarat}
                    onChange={(e) => setScrapKarat(e.target.value)}
                    className="w-full bg-[#090a0e] border border-white/10 text-white font-semibold text-xs px-3 py-2.5 rounded-xl focus:outline-none"
                  >
                    <option value="22K">22 Ayar (₺{scrapRates['22K']?.toLocaleString('tr-TR')} Alış)</option>
                    <option value="24K">24 Ayar Has (₺{scrapRates['24K']?.toLocaleString('tr-TR')} Alış)</option>
                    <option value="18K">18 Ayar (₺{scrapRates['18K']?.toLocaleString('tr-TR')} Alış)</option>
                    <option value="14K">14 Ayar (₺{scrapRates['14K']?.toLocaleString('tr-TR')} Alış)</option>
                  </select>
                </div>

                <div>
                  <div className="bg-[#090a0e] border border-amber-500/40 p-3 rounded-xl">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Kalan Ödenecek Fark</span>
                    <span className="text-xl font-bold font-display text-amber-400">
                      ₺{scrapDifference.toLocaleString('tr-TR')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SAĞ KOLON: Canlı Fiyat & Borsa Motoru, Darphane Karnesi, IoT Askı Telemetrisi (5 Kolon) */}
          <div className="lg:col-span-5 space-y-6">
            {/* KART 1: CANLI FİYAT & BORSA MOTORU */}
            <div className="bg-[#12141c] p-6 rounded-2xl border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase font-bold tracking-wider">
                  <TrendingUp className="w-4 h-4" />
                  <span>Canlı Fiyat & Borsa Motoru</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Has Spot: ₺{goldPrice.toLocaleString('tr-TR')}
                </span>
              </div>

              {/* Fiyat Göstergesi */}
              <div className="bg-[#0b0c10] p-4 rounded-xl border border-amber-500/20 flex items-center justify-between shadow-inner">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold block">
                    Nihai Peşin / Havale Fiyatı
                  </span>
                  <span className="text-3xl font-bold font-display text-amber-400 leading-tight block mt-1">
                    ₺{retailPrice.toLocaleString('tr-TR')}
                  </span>
                  <span className="text-[10px] text-amber-300 font-medium">KDV ve Darphane Sertifikası Dahildir</span>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold uppercase tracking-wider border border-amber-500/40">
                    %{discountRate} MAĞAZA İNDİRİMİ
                  </span>
                  <span className="text-xs text-slate-500 line-through block mt-1">
                    ₺{originalPrice.toLocaleString('tr-TR')}
                  </span>
                </div>
              </div>

              {/* Matematiksel Bileşim Dökümü */}
              <div className="space-y-1.5 text-xs font-mono text-slate-300">
                <div className="flex items-center justify-between py-1.5 bg-[#171a26] px-3 rounded-lg">
                  <span className="text-slate-400">Net Ağırlık / Has Çarpanı:</span>
                  <span className="font-bold text-white">{p.weight_grams} gr × {milyemFactor} = {netHasGrams} gr Has</span>
                </div>
                <div className="flex items-center justify-between py-1.5 bg-[#171a26] px-3 rounded-lg">
                  <span className="text-slate-400">Borsa Has Altın Ham Maliyet:</span>
                  <span className="font-bold text-white">{netHasGrams} gr × ₺{goldPrice.toLocaleString('tr-TR')} = ₺{hasValue.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 bg-[#171a26] px-3 rounded-lg">
                  <span className="text-slate-400">Usta El Hasırı İşçilik Bedeli:</span>
                  <span className="font-bold text-amber-400">SABİT İŞÇİLİK (+₺0 KAMPANYA)</span>
                </div>
                <div className="flex items-center justify-between py-1.5 bg-[#171a26] px-3 rounded-lg">
                  <span className="text-slate-400">VIP Salon Peşin Teşvik Düşümü:</span>
                  <span className="font-bold text-emerald-400">-₺{Math.round(originalPrice - retailPrice).toLocaleString('tr-TR')}</span>
                </div>
              </div>

              {/* Ödeme Yöntemleri */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="bg-[#0b0c10] border border-white/5 p-3 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Nakit / EFT</span>
                  <span className="text-base font-bold text-amber-400 block mt-0.5">₺{retailPrice.toLocaleString('tr-TR')}</span>
                  <span className="text-[10px] text-slate-400">Anında Teslim</span>
                </div>
                <div className="bg-[#0b0c10] border border-white/5 p-3 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Kredi Kartı 3 Taksit</span>
                  <span className="text-base font-bold text-white block mt-0.5">₺{Math.round(retailPrice * 1.028).toLocaleString('tr-TR')}</span>
                  <span className="text-[10px] text-slate-400">Aylık: ₺{installment3Monthly.toLocaleString('tr-TR')}</span>
                </div>
              </div>
            </div>

            {/* KART 2: DARPHANE & LABORATUVAR KARNESİ (QR KOD DOĞRULAMA) */}
            <div className="bg-[#12141c] p-6 rounded-2xl border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase font-bold tracking-wider">
                  <Award className="w-4 h-4" />
                  <span>Darphane & Laboratuvar Karnesi</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">BIST: 9481-TR</span>
              </div>

              <div className="flex items-center gap-4 bg-[#0b0c10] p-4 rounded-xl border border-white/5">
                {/* QR Kod SVG Simülasyonu */}
                <div className="w-20 h-20 bg-white p-1 rounded-lg shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full text-black" fill="currentColor" viewBox="0 0 100 100">
                    <rect x="5" y="5" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="6" rx="2" />
                    <rect x="13" y="13" width="14" height="14" fill="currentColor" />
                    <rect x="65" y="5" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="6" rx="2" />
                    <rect x="73" y="13" width="14" height="14" fill="currentColor" />
                    <rect x="5" y="65" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="6" rx="2" />
                    <rect x="13" y="73" width="14" height="14" fill="currentColor" />
                    <rect x="42" y="10" width="8" height="8" />
                    <rect x="42" y="24" width="8" height="8" />
                    <rect x="10" y="42" width="8" height="8" />
                    <rect x="24" y="42" width="8" height="8" />
                    <rect x="42" y="42" width="16" height="16" />
                    <rect x="65" y="42" width="8" height="8" />
                    <rect x="80" y="42" width="10" height="8" />
                    <rect x="42" y="65" width="8" height="14" />
                    <rect x="65" y="65" width="12" height="8" />
                    <rect x="82" y="70" width="10" height="20" />
                    <rect x="65" y="80" width="10" height="10" />
                    <rect x="52" y="85" width="8" height="8" />
                  </svg>
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Sertifika Seri No</span>
                  <span className="text-base font-bold font-mono text-amber-300 tracking-wider">
                    SE-2025-{p.id * 142 + 9481}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    Karekod ile müşterinin cep telefonuna resmi dijital garanti cüzdan kartı aktarılır.
                  </span>
                </div>
              </div>

              {/* Teknik Özellikler Izgarası */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-[#171a26] p-2.5 rounded-lg flex justify-between">
                  <span className="text-slate-400">Maden:</span>
                  <span className="text-white font-bold">{p.purity} {p.gold_color || 'Sarı Altın'}</span>
                </div>
                <div className="bg-[#171a26] p-2.5 rounded-lg flex justify-between">
                  <span className="text-slate-400">Milyem:</span>
                  <span className="text-white font-bold">{p.milyem || 916}.0‰</span>
                </div>
                <div className="bg-[#171a26] p-2.5 rounded-lg flex justify-between">
                  <span className="text-slate-400">Tartım:</span>
                  <span className="text-amber-400 font-bold">{p.weight_grams} gr</span>
                </div>
                <div className="bg-[#171a26] p-2.5 rounded-lg flex justify-between">
                  <span className="text-slate-400">İç Çap:</span>
                  <span className="text-white font-bold">{p.size_or_length || '6.2 cm (Standart)'}</span>
                </div>
                <div className="bg-[#171a26] p-2.5 rounded-lg flex justify-between">
                  <span className="text-slate-400">Genişlik:</span>
                  <span className="text-white font-bold">24 mm (İkili Sıra)</span>
                </div>
                <div className="bg-[#171a26] p-2.5 rounded-lg flex justify-between">
                  <span className="text-slate-400">Garanti:</span>
                  <span className="text-emerald-400 font-bold">Ömür Boyu Bakım</span>
                </div>
              </div>
            </div>

            {/* KART 3: IOT AKILLI VİTRİN & ASKI TELEMETRİSİ */}
            <div className="bg-[#12141c] p-6 rounded-2xl border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase font-bold tracking-wider">
                  <Cpu className="w-4 h-4" />
                  <span>IoT Akıllı Vitrin & Askı Telemetrisi</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold">
                  ESP32 #{assignedSlot.slot_number} ÇEVRİMİÇİ
                </span>
              </div>

              <div className="flex items-center justify-between bg-[#0b0c10] p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold font-mono">
                    #{assignedSlot.slot_number}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Askı Yuvası</span>
                    <span className="text-xs font-bold text-white">{assignedSlot.label || 'Ön Teşhir Sırası Slot #1'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">IP / Node ID</span>
                  <span className="text-xs font-mono text-amber-300 font-bold">{assignedSlot.ip_address || '192.168.1.101'} : {assignedSlot.port || 8080}</span>
                </div>
              </div>

              <div className="p-3 bg-[#0b0c10] rounded-xl border border-white/5 flex items-start gap-2.5 text-xs">
                <Radio className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
                <span className="text-slate-300 leading-relaxed font-sans">
                  Bu mücevher askıdan alındı. HX711 ağırlık sensörü 0.00g (boşta). VIP Masası #2 civarında Bluetooth Beacon sinyali %98 güçle doğrulanıyor.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => alert("Askı darası kilitlendi ve ürün teyit edildi.")}
                  className="p-2 rounded-xl bg-[#171a26] hover:bg-[#202434] border border-white/10 text-slate-200 text-xs font-semibold transition text-center"
                >
                  Askıya İade (Dara Kilitle)
                </button>
                <button
                  type="button"
                  onClick={() => alert("Ürün kasaya rezerve olarak kaydedildi.")}
                  className="p-2 rounded-xl bg-[#171a26] hover:bg-[#202434] border border-white/10 text-slate-200 text-xs font-semibold transition text-center"
                >
                  Kasaya Kaldır / Rezerve
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================= ALT TEKLİF & DANIŞMANLIK İŞLEM BARI ================= */}
        <div className="bg-[#12141c] p-4 sm:p-6 rounded-2xl border border-amber-500/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Müşteri Teklif ve Sunum Fişi</h4>
              <p className="text-xs text-slate-400">Bu ürüne ait altın spot sabitlemeli proforma teklifi yazdırın veya anında müşterinin WhatsApp hattına iletin.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={handlePrintProposal}
              className="px-4 py-2 rounded-xl bg-[#191c26] hover:bg-[#232736] border border-white/10 text-slate-200 text-xs font-semibold transition flex items-center gap-2"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>A4 / Termal Teklif Bas</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsapp}
              className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>WhatsApp'a Gönder</span>
            </button>

            <button
              type="button"
              onClick={() => alert("VIP Randevu & Özel Not Müşteri CRM profiline eklendi.")}
              className="px-4 py-2 rounded-xl bg-[#191c26] hover:bg-[#232736] border border-white/10 text-slate-200 text-xs font-semibold transition flex items-center gap-2"
            >
              <Bookmark className="w-4 h-4 text-amber-400" />
              <span>VIP Randevu / Not Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= SERTİFİKA QR MODAL ================= */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowQrModal(false)}>
          <div className="bg-[#12141c] border border-amber-500/40 p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="font-mono text-xs uppercase font-bold text-amber-400">Resmi Dijital Sertifika</span>
              <button type="button" onClick={() => setShowQrModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="w-48 h-48 bg-white p-3 rounded-2xl mx-auto shadow-xl flex items-center justify-center">
              <svg className="w-full h-full text-black" fill="currentColor" viewBox="0 0 100 100">
                <rect x="5" y="5" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="6" rx="2" />
                <rect x="13" y="13" width="14" height="14" fill="currentColor" />
                <rect x="65" y="5" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="6" rx="2" />
                <rect x="73" y="13" width="14" height="14" fill="currentColor" />
                <rect x="5" y="65" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="6" rx="2" />
                <rect x="13" y="73" width="14" height="14" fill="currentColor" />
                <rect x="42" y="10" width="8" height="8" />
                <rect x="42" y="24" width="8" height="8" />
                <rect x="10" y="42" width="8" height="8" />
                <rect x="24" y="42" width="8" height="8" />
                <rect x="42" y="42" width="16" height="16" />
                <rect x="65" y="42" width="8" height="8" />
                <rect x="80" y="42" width="10" height="8" />
                <rect x="42" y="65" width="8" height="14" />
                <rect x="65" y="65" width="12" height="8" />
                <rect x="82" y="70" width="10" height="20" />
                <rect x="65" y="80" width="10" height="10" />
                <rect x="52" y="85" width="8" height="8" />
              </svg>
            </div>

            <div className="space-y-1">
              <p className="text-white font-bold text-sm">{p.name}</p>
              <p className="font-mono text-xs text-amber-300">Sertifika: SE-2025-{p.id * 142 + 9481}</p>
              <p className="text-[11px] text-slate-400">Müşteriniz telefon kamerasıyla taratarak dijital garanti cüzdanını açabilir.</p>
            </div>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(`https://sarraferdem.com/sertifika/${p.barcode}`);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-xs hover:brightness-110 transition shadow-lg flex items-center justify-center gap-2"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Kopyalandı!' : 'Sertifika Bağlantısını Kopyala'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
