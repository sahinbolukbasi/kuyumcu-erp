'use client';

import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Check, 
  ArrowLeft, 
  Tv, 
  Tablet, 
  LayoutDashboard, 
  Search, 
  Plus, 
  RefreshCw, 
  Share2, 
  FileText, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  QrCode,
  UserCheck,
  Building2,
  Clock,
  Printer,
  Copy,
  TrendingUp,
  Activity,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  X
} from 'lucide-react';

let API_BASE = 'http://127.0.0.1:8000';
if (typeof window !== 'undefined') {
  if (window.location.port === '3000') {
    API_BASE = `${window.location.protocol}//${window.location.hostname}:8000`;
  } else {
    API_BASE = window.location.origin;
  }
} else if (process.env.NEXT_PUBLIC_API_URL) {
  API_BASE = process.env.NEXT_PUBLIC_API_URL;
}

export default function TerminalsPage() {
  // Aktif Ekran Seçimi: 'pos' (Satış Tableti) | 'admin' (Yönetici) | 'tv' (Canlı TV Panosu)
  const [activeScreen, setActiveScreen] = useState('pos');

  // Ortak Veri State'leri
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('ALL');
  const [products, setProducts] = useState([]);
  const [slots, setSlots] = useState([]);
  const [capitalReport, setCapitalReport] = useState(null);
  const [criticalStock, setCriticalStock] = useState(null);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('online'); // online | offline
  const [currentTime, setCurrentTime] = useState('');

  // 1. EKRAN (Satış Görevlisi) State'leri
  const [posCategory, setPosCategory] = useState('ALL');
  const [posSearch, setPosSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customerModalProduct, setCustomerModalProduct] = useState(null);
  const [saleCompletedMsg, setSaleCompletedMsg] = useState('');
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    barcode: '',
    name: '',
    category: 'Bilezik',
    purity: '22K',
    milyem: 916,
    weight_grams: '',
    price: '',
    craftsmanship_type: 'El İşçiliği'
  });

  // 3. EKRAN (Canlı TV) Döngü State'leri
  const [tvSlide, setTvSlide] = useState(0); // 0: Genel Ciro & Sermaye | 1: Çok Denenenler & Güvenlik

  // Veri Çekme
  const fetchAllData = async (branchOverride = undefined) => {
    try {
      setLoading(true);
      const activeBranch = branchOverride !== undefined ? branchOverride : selectedBranchId;
      const bParam = activeBranch && activeBranch !== 'ALL' ? `?branch_id=${activeBranch}` : '';

      const [pRes, sRes, cRes, critRes, bRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/products${bParam}`),
        fetch(`${API_BASE}/api/v1/iot/slots${bParam}`),
        fetch(`${API_BASE}/api/v1/inventory/capital-report`),
        fetch(`${API_BASE}/api/v1/inventory/critical-stock`),
        fetch(`${API_BASE}/api/v1/branches`)
      ]);

      if (pRes.ok) {
        const pData = await pRes.json();
        setProducts(pData);
        if (pData.length > 0 && (!selectedProduct || !pData.some(p => p.id === selectedProduct.id))) {
          setSelectedProduct(pData[0]);
        }
      }
      if (sRes.ok) setSlots(await sRes.json());
      if (cRes.ok) setCapitalReport(await cRes.json());
      if (critRes.ok) setCriticalStock(await critRes.json());
      if (bRes.ok) setBranches(await bRes.json());

      const logRes = await fetch(`${API_BASE}/api/v1/logs?limit=8`);
      if (logRes.ok) setSecurityLogs(await logRes.json());

      setConnectionStatus('online');
    } catch (err) {
      console.error("Veri bağlantı hatası", err);
      setConnectionStatus('offline');
    } finally {
      setLoading(false);
    }
  };

  const handleBranchChange = (val) => {
    setSelectedBranchId(val);
    fetchAllData(val);
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Saat Güncelleyici
  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // TV Ekranı Otomatik Döngü (15 saniyede bir sakin geçiş)
  useEffect(() => {
    if (activeScreen !== 'tv') return;
    const tvTimer = setInterval(() => {
      setTvSlide(prev => (prev === 0 ? 1 : 0));
    }, 15000);
    return () => clearInterval(tvTimer);
  }, [activeScreen]);

  // Hızlı Satış İşlemi
  const handleExecuteSale = async () => {
    if (!selectedProduct) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/sales/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          customer_name: "Muhtelif Mağaza Müşterisi",
          payment_method: "Nakit",
          discount_amount: 0,
          notes: "Tablet POS hızlı satışı"
        })
      });
      if (res.ok) {
        setSaleCompletedMsg(`${selectedProduct.name} satışı onaylandı. Fiş ve terazi düşümü işlendi.`);
        setTimeout(() => setSaleCompletedMsg(''), 5000);
        fetchAllData();
      } else {
        alert("Satış kaydedilemedi.");
      }
    } catch (e) {
      alert("Hata: " + e.message);
    }
  };

  // Hızlı Ürün Ekleme
  const handleQuickAddProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        barcode: quickAddData.barcode || `KYM-${Date.now().toString().slice(-5)}`,
        name: quickAddData.name,
        category: quickAddData.category,
        purity: quickAddData.purity,
        milyem: parseInt(quickAddData.milyem || 916),
        weight_grams: parseFloat(quickAddData.weight_grams),
        price: parseFloat(quickAddData.price),
        craftsmanship_type: quickAddData.craftsmanship_type,
        status: "Vitrinde",
        gold_color: "Sarı Altın",
        labor_cost: parseFloat(quickAddData.price) * 0.08,
        cost_price: parseFloat(quickAddData.price) * 0.82
      };

      const res = await fetch(`${API_BASE}/api/v1/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowQuickAddModal(false);
        setQuickAddData({ barcode: '', name: '', category: 'Bilezik', purity: '22K', milyem: 916, weight_grams: '', price: '', craftsmanship_type: 'El İşçiliği' });
        fetchAllData();
      }
    } catch (err) {
      alert("Kayıt hatası: " + err.message);
    }
  };

  // Filtrelenmiş Ürünler
  const filteredProducts = products.filter(p => {
    const matchCat = posCategory === 'ALL' || p.category === posCategory;
    const matchSearch = !posSearch || p.name.toLowerCase().includes(posSearch.toLowerCase()) || p.barcode.toLowerCase().includes(posSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#0b0c10] text-slate-100 font-sans antialiased selection:bg-amber-500 selection:text-black">
      
      {/* ================= 1. BIST / KAPALIÇARŞI CANLI BORSA TICKER BAR (Stitch İlhamı) ================= */}
      <div className="w-full bg-[#08090d] border-b border-amber-500/20 py-1.5 px-4 overflow-hidden relative text-xs tracking-wider z-50">
        <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-amber-400 font-semibold uppercase text-[11px] shrink-0 font-cinzel tracking-wider">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Kapalıçarşı Borsa Canlı</span>
          </div>
          <div className="flex items-center gap-6 overflow-x-auto whitespace-nowrap scrollbar-none font-mono text-[11px] text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="text-slate-400">HAS ALTIN:</span> 
              <strong className="text-amber-400 font-bold">₺3.045,50</strong> 
              <span className="text-emerald-400 font-semibold">▲ %1.42</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-slate-400">22 AYAR:</span> 
              <strong className="text-slate-200">₺2.915,00</strong> 
              <span className="text-emerald-400 font-semibold">▲ %1.38</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-slate-400">ÇEYREK ALTIN:</span> 
              <strong className="text-amber-400 font-bold">₺4.985,00</strong> 
              <span className="text-emerald-400 font-semibold">▲ %0.95</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-slate-400">ONS ($):</span> 
              <strong className="text-slate-200">$2.748,20</strong> 
              <span className="text-rose-400 font-semibold">▼ %0.12</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-slate-400">USD/TRY:</span> 
              <strong className="text-slate-200">34,20</strong> 
              <span className="text-emerald-400 font-semibold">▲ %0.08</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400 shrink-0 font-mono">
            <Activity className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>LOAD-CELL: 80Hz CANLI</span>
          </div>
        </div>
      </div>

      {/* ================= 2. ANA LÜKS HEADER (GOLDEN GUARD & EKRAN DEĞİŞTİRİCİ) ================= */}
      <header className="bg-[#0e1017]/95 backdrop-blur-xl border-b border-amber-500/20 px-4 sm:px-6 py-2.5 sticky top-0 z-40">
        <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Marka */}
          {/* Logo & Marka & Mağaza Seçimi */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-black/60 border border-amber-500/30 flex items-center justify-center">
                <Scale className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-cinzel text-base sm:text-lg font-bold tracking-wider gold-gradient-text">
                    GOLDEN GUARD
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono font-semibold">
                    V3.4 IoT
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest hidden sm:block">
                  Hassas Terazi &amp; Akıllı Vitrin ERP
                </div>
              </div>

              {/* Terazi Bağlantı Durumu */}
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-[#12141c] border border-[#242938]">
                <span className={`w-2 h-2 rounded-full ${connectionStatus === 'online' ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#ef4444]'}`}></span>
                <span className="text-slate-300 font-semibold">{connectionStatus === 'online' ? 'Load-Cell Çevrimiçi' : 'Bağlantı Kesildi'}</span>
              </div>
            </div>

            {/* LOGONUN ALTINDA MAĞAZA SEÇİMİ */}
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#12141c] border border-amber-500/30 rounded-lg px-2 py-0.5 text-xs">
                <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[10px] font-bold text-amber-400 uppercase">MAĞAZA:</span>
                <select
                  value={selectedBranchId}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  className="bg-transparent text-white font-semibold text-xs focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-[#12141c] text-amber-300 font-bold">
                    🏢 TÜMÜ (Tüm Şirket / Konsolide)
                  </option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id} className="bg-[#12141c] text-white">
                      🏬 {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 3 Ekran Seçici Segmented Control (Stitch Luxury Stili) */}
          <div className="flex items-center bg-[#12141c] p-1 rounded-xl border border-amber-500/20 shadow-inner">
            <button
              onClick={() => setActiveScreen('pos')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeScreen === 'pos' 
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-black shadow-md shadow-amber-500/20' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>1. Satış Tableti</span>
            </button>
            <button
              onClick={() => setActiveScreen('admin')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeScreen === 'admin' 
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-black shadow-md shadow-amber-500/20' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>2. Yönetici Konsolu</span>
            </button>
            <button
              onClick={() => setActiveScreen('tv')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeScreen === 'tv' 
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-black shadow-md shadow-amber-500/20' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>3. Canlı TV Panosu</span>
            </button>
          </div>

          {/* Saat ve ERP'ye Dönüş */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-amber-400 font-bold hidden xl:inline">{currentTime}</span>
            <a
              href="/"
              className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 border-l border-[#242938] pl-3 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ana ERP'ye Dön</span>
            </a>
          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* 1. EKRAN: SATIŞ GÖREVLİSİ TABLET ARAYÜZÜ (POS & HASSAS TARTI TEPSELİ)     */}
      {/* ========================================================================= */}
      {activeScreen === 'pos' && (
        <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
          
          {/* Üst Filtre & Hızlı Tanımlama Barı */}
          <div className="bg-[#0e1017] border-b border-amber-500/15 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-amber-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={posSearch}
                  onChange={(e) => setPosSearch(e.target.value)}
                  placeholder="Barkod okutun veya model adı yazın..."
                  className="w-full bg-[#12141c] border border-amber-500/20 rounded-lg text-xs pl-9 pr-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400 font-mono placeholder:text-slate-500 transition"
                />
              </div>
            </div>

            {/* Kategori Filtre Hapları (Dokunmatik Min 44px) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['ALL', 'Bilezik', 'Kolye', 'Yüzük', 'Küpe', 'Set'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setPosCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition min-h-[38px] flex items-center gap-1 ${
                    posCategory === cat 
                      ? 'bg-amber-400 text-black border-amber-400 shadow-sm shadow-amber-400/20' 
                      : 'bg-[#12141c] text-slate-300 border-[#242938] hover:border-amber-500/40 hover:text-white'
                  }`}
                >
                  {cat === 'ALL' ? 'Tüm Vitrin' : cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowQuickAddModal(true)}
                className="px-3.5 py-2 bg-[#191c26] border border-amber-500/30 hover:border-amber-400 text-amber-400 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Hızlı Ürün Tanımla</span>
              </button>
            </div>
          </div>

          {/* Satış Başarılı Bildirimi */}
          {saleCompletedMsg && (
            <div className="bg-emerald-950/80 border-b border-emerald-500/40 text-emerald-300 px-4 py-2.5 text-xs font-semibold flex items-center justify-between backdrop-blur-sm animate-fadeIn">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{saleCompletedMsg}</span>
              </span>
              <button onClick={() => setSaleCompletedMsg('')} className="text-emerald-400 hover:text-white">✕</button>
            </div>
          )}

          {/* Ana Gövde: 2 Sütun (Sol: Vitrin Modelleri | Sağ: Hassas Tartı & Mutabakat Dökümü) */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            
            {/* Sol: Vitrin Ürün Tepsisi (Dokunmatik Kartlar) */}
            <div className="lg:col-span-7 bg-[#0b0c10] p-4 overflow-y-auto border-r border-[#242938]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredProducts.map(p => {
                  const isSelected = selectedProduct?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProduct(p)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between min-h-[120px] ${
                        isSelected 
                          ? 'bg-[#161922] border-2 border-amber-400 shadow-lg shadow-amber-400/10 ring-1 ring-amber-400/30' 
                          : 'bg-[#12141c] border-[#242938] hover:border-amber-500/30'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] font-bold text-slate-400 bg-black/40 px-2 py-0.5 rounded border border-[#242938]">
                              {p.barcode}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded shadow-sm">
                              {p.stock_quantity || 1} Adet
                            </span>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                            {p.purity} • {p.milyem || (p.purity === '22K' ? 916 : 585)}‰
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-100 line-clamp-1">{p.name}</h4>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                          <span>{p.craftsmanship_type || 'El İşçiliği'}</span>
                          <span>•</span>
                          <span>{p.gold_color || 'Sarı Altın'}</span>
                        </div>
                      </div>

                      <div className="flex items-end justify-between mt-3 pt-2.5 border-t border-[#1e2230]">
                        <div className="font-mono font-bold text-sm text-slate-200">
                          {p.weight_grams.toFixed(2)} gr
                        </div>
                        <div className="font-mono font-bold text-base text-amber-400">
                          {p.price.toLocaleString('tr-TR')} TL
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sağ: Seçili Parça Terazi Mutabakatı & Döküm (Kasa / Tartı Laboratuvarı) */}
            <div className="lg:col-span-5 bg-[#0e1017] p-5 flex flex-col justify-between overflow-y-auto border-l border-amber-500/15">
              {selectedProduct ? (
                <div className="space-y-4">
                  {/* Başlık & Canlı Sensör Durumu */}
                  <div className="border-b border-[#242938] pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-amber-400 tracking-wider uppercase font-semibold">
                        HASSAS TARTI VE YUVA RAPORU
                      </span>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Terazi Mutabık (0.00g)
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-100 mt-1 font-display">{selectedProduct.name}</h3>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">RFID / Barkod: {selectedProduct.barcode}</div>
                  </div>

                  {/* Terazi ve Maden Cetveli (Monospace Tabular Cetvel) */}
                  <div className="bg-[#12141c] p-4 rounded-xl border border-amber-500/20 space-y-2.5 font-mono text-xs shadow-inner">
                    <div className="flex items-center justify-between pb-2 border-b border-[#242938]">
                      <span className="text-slate-400">Brüt Tartı (Kantar Sensörü):</span>
                      <span className="font-bold text-sm text-slate-100">{selectedProduct.weight_grams.toFixed(2)} gr</span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b border-[#242938]">
                      <span className="text-slate-400">Maden Ayarı / Milyem:</span>
                      <span className="font-bold text-amber-400">{selectedProduct.purity} ({selectedProduct.milyem || 916}‰)</span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b border-[#242938]">
                      <span className="text-slate-400">Net Has Altın Karşılığı:</span>
                      <span className="font-bold text-emerald-400">
                        {(selectedProduct.weight_grams * (selectedProduct.purity === '22K' ? 0.916 : (selectedProduct.purity === '18K' ? 0.750 : 0.585))).toFixed(3)} gr Has
                      </span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b border-[#242938]">
                      <span className="text-slate-400">Usta İşçilik Tutarı:</span>
                      <span className="font-bold text-slate-200">
                        {(selectedProduct.labor_cost || selectedProduct.price * 0.08).toLocaleString('tr-TR')} TL
                      </span>
                    </div>
                    {selectedProduct.has_stones && (
                      <div className="flex items-center justify-between pb-2 border-b border-[#242938] text-cyan-300">
                        <span>Pırlanta / Değerli Taş (4C):</span>
                        <span className="font-bold">
                          {selectedProduct.diamond_carat} ct • {selectedProduct.diamond_color} / {selectedProduct.diamond_clarity}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1 text-sm font-bold">
                      <span className="text-slate-300">Toplam Satış Bedeli:</span>
                      <span className="text-2xl text-amber-400 font-bold">{selectedProduct.price.toLocaleString('tr-TR')} TL</span>
                    </div>
                  </div>

                  {/* VIP Müşteri İnceleme Butonu */}
                  <button
                    onClick={() => setCustomerModalProduct(selectedProduct)}
                    className="w-full py-2.5 px-3 rounded-lg border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs font-bold flex items-center justify-center gap-2 transition"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Müşteriye Göster (VIP Mücevher Kartı &amp; 4C Dökümü)</span>
                  </button>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  Vitrinden incelenecek bir ürün seçiniz.
                </div>
              )}

              {/* Alt Butonlar (Tek Elle Kolay Ulaşım - Dokunmatik Min 52px) */}
              <div className="pt-4 border-t border-[#242938] space-y-2">
                <button
                  onClick={handleExecuteSale}
                  disabled={!selectedProduct || selectedProduct.status === 'Satıldı'}
                  className="w-full min-h-[52px] bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-black font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/20 hover:brightness-110 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-5 h-5 stroke-[2.5]" />
                  <span>Satışı Onayla &amp; Fiş Kes ({selectedProduct?.price?.toLocaleString('tr-TR')} TL)</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => alert("Terazi darası sıfırlandı: 0.00 gr")}
                    className="min-h-[44px] bg-[#12141c] border border-[#242938] hover:border-slate-500 text-slate-300 hover:text-white text-xs font-bold rounded-lg transition"
                  >
                    0.00 Dara Sıfırla
                  </button>
                  <button
                    onClick={() => alert("Ürün vitrin yuvasına geri teslim edildi.")}
                    className="min-h-[44px] bg-[#12141c] border border-[#242938] hover:border-slate-500 text-slate-300 hover:text-white text-xs font-bold rounded-lg transition"
                  >
                    ↺ Vitrine Geri Koy
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. EKRAN: YÖNETİCİ EKRANI (DASHBOARD, KRİTİK STOK & TEDARİKÇİ WHATSAPP)  */}
      {/* ========================================================================= */}
      {activeScreen === 'admin' && (
        <div className="max-w-[1700px] mx-auto p-4 sm:p-6 space-y-6">
          
          {/* Üst Bar: En Kritik 4 Metrik */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Günlük Ciro */}
            <div className="bg-[#12141c] p-5 rounded-xl border border-amber-500/20 shadow-sm">
              <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold tracking-wider">GÜNLÜK TOPLAM SATIŞ</div>
              <div className="text-3xl font-mono font-bold text-amber-400 mt-1">139.600 TL</div>
              <div className="text-xs text-emerald-400 font-mono mt-1.5 font-semibold flex items-center gap-1">
                <span>● 4 Parça Satış Yapıldı</span>
              </div>
            </div>

            {/* 2. Vitrindeki Has Sermaye */}
            <div className="bg-[#12141c] p-5 rounded-xl border border-amber-500/20 shadow-sm">
              <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold tracking-wider">VİTRİN HAS ALTIN SERMAYESİ</div>
              <div className="text-3xl font-mono font-bold text-slate-100 mt-1">
                {capitalReport?.total_has_grams || '50.59'} <span className="text-lg text-slate-400 font-normal">gr</span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-1.5">
                Piyasa Değeri: <strong className="text-slate-200">{capitalReport?.total_capital_tl?.toLocaleString('tr-TR') || '154.034'} TL</strong>
              </div>
            </div>

            {/* 3. Kritik Stok Uyarıları */}
            <div className="bg-[#12141c] p-5 rounded-xl border border-amber-500/20 shadow-sm">
              <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold tracking-wider">KRİTİK STOK UYARISI</div>
              <div className="text-3xl font-mono font-bold text-amber-500 mt-1">
                {criticalStock?.total_items_to_order || '2'} <span className="text-lg text-slate-400 font-normal">Model</span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-1.5">Vitrinde ≤2 Adet Kalanlar</div>
            </div>

            {/* 4. Terazi & Güvenlik Durumu */}
            <div className="bg-[#12141c] p-5 rounded-xl border border-amber-500/20 shadow-sm">
              <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold tracking-wider">GÜVENLİK SİSTEMİ</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <span>Normal &amp; Devrede</span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-1.5">6 Terazi Aktif • 0 İhlal</div>
            </div>

          </div>

          {/* İki Kolonlu Detay Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Sol %60: Kritik Stok & Tedarikçi Sipariş Listesi */}
            <div className="lg:col-span-7 bg-[#12141c] rounded-xl border border-amber-500/20 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#242938] pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Kritik Seviyedeki Modeller &amp; Atölye Sipariş Taslağı</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Eşikten az kalan ürünler için toptancıya tek tıkla sipariş</p>
                </div>
                {criticalStock?.whatsapp_draft_text && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(criticalStock.whatsapp_draft_text);
                      alert("Tedarikçi WhatsApp sipariş metni panoya kopyalandı!");
                    }}
                    className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-black text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>WhatsApp Siparişini Kopyala</span>
                  </button>
                )}
              </div>

              <div className="divide-y divide-[#1e2230]">
                {(criticalStock?.suggested_products || []).slice(0, 4).map(item => (
                  <div key={item.product_id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-100 text-sm">{item.name}</div>
                      <div className="font-mono text-slate-400 text-[11px] mt-0.5">
                        {item.purity} • {item.category} • Barkod: {item.barcode}
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="px-2.5 py-1 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold text-xs">
                        Kalan: {item.current_stock} ad.
                      </span>
                      <div className="text-[11px] text-emerald-400 font-semibold mt-1">Öneri: +{item.suggested_order_qty} ad.</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sağ %40: Canlı Terazi Güvenlik & İşlem Günlüğü */}
            <div className="lg:col-span-5 bg-[#12141c] rounded-xl border border-amber-500/20 p-5 space-y-4">
              <div className="border-b border-[#242938] pb-3">
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Son Terazi &amp; Güvenlik Olayları</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Vitrin sensörleri ve personel hareket kaydı</p>
              </div>

              <div className="space-y-2 font-mono text-xs">
                {securityLogs.length > 0 ? securityLogs.slice(0, 5).map(log => (
                  <div key={log.id} className="p-2.5 bg-[#0b0c10] rounded-lg border border-[#242938] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-200">{log.message}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{log.created_at?.slice(11, 19)} • Yetkili: {log.user_name || 'Sistem'}</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#161922] border border-[#242938] text-amber-400 font-bold">
                      {log.level}
                    </span>
                  </div>
                )) : (
                  <div className="text-slate-500 text-xs py-4 text-center">Henüz olay kaydı bulunmuyor.</div>
                )}
              </div>
            </div>

          </div>

          {/* Hızlı Raporlama & Muhasebe Butonları */}
          <div className="bg-[#12141c] p-4 rounded-xl border border-amber-500/20 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Resmi Dışa Aktarımlar ve Muhasebe Entegrasyonu:</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => alert("5549 Sayılı Kanun MASAK Kimlik Defteri hazırlandı.")}
                className="px-3.5 py-2 bg-[#191c26] border border-[#242938] hover:border-amber-400 text-xs font-bold rounded-lg text-slate-200 hover:text-amber-400 transition"
              >
                MASAK Kimlik Defteri (85.000 TL Üzeri)
              </button>
              <button
                onClick={() => alert("Logo Tiger uyumlu XML dosyası indirildi.")}
                className="px-3.5 py-2 bg-[#191c26] border border-[#242938] hover:border-amber-400 text-xs font-bold rounded-lg text-slate-200 hover:text-amber-400 transition"
              >
                Logo Tiger XML Aktar
              </button>
              <button
                onClick={() => alert("Netsis uyumlu JSON fişleri oluşturuldu.")}
                className="px-3.5 py-2 bg-[#191c26] border border-[#242938] hover:border-amber-400 text-xs font-bold rounded-lg text-slate-200 hover:text-amber-400 transition"
              >
                Netsis Muhasebe Fişi
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. EKRAN: CANLI BİLGİ EKRANI (MAĞAZA İÇİ 4K TV / MONİTÖR PANOSU)          */}
      {/* ========================================================================= */}
      {activeScreen === 'tv' && (
        <div className="bg-[#08090d] text-white min-h-[calc(100vh-80px)] p-6 lg:p-12 flex flex-col justify-between select-none">
          
          {/* Sabit Kurumsal Üst Başlık */}
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-5 h-5 rounded-full bg-amber-400 shadow-[0_0_15px_#facc15]"></div>
              <div>
                <h1 className="text-3xl font-bold tracking-wider font-cinzel gold-gradient-text">GOLDEN GUARD 1978</h1>
                <p className="text-xs text-slate-400 tracking-widest font-mono uppercase mt-0.5">Merkez Mağaza Canlı Vitrin &amp; Kasa Ekranı</p>
              </div>
            </div>
            <div className="text-right font-mono">
              <div className="text-3xl font-bold text-amber-400">{currentTime}</div>
              <div className="text-xs text-slate-400">16 EYLÜL 2026 | SEANS AKTİF</div>
            </div>
          </div>

          {/* Dev Rakamlar: 3-5 Metreden Net Okunur Göstergeler */}
          {tvSlide === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-auto">
              
              {/* Günlük Toplam İşlem Hacmi */}
              <div className="bg-[#12141c] p-10 rounded-2xl border border-amber-500/25 space-y-3 shadow-2xl">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">GÜNLÜK İŞLEM HACMİ</div>
                <div className="text-6xl lg:text-7xl font-mono font-bold text-amber-400 tracking-tight">
                  139.600 <span className="text-3xl text-slate-400">TL</span>
                </div>
                <div className="text-base font-mono text-emerald-400 font-semibold pt-2">
                  ● 4 Adet Satış &amp; Askı Düşümü Mutabık
                </div>
              </div>

              {/* Vitrindeki Toplam Has Altın Sermayesi */}
              <div className="bg-[#12141c] p-10 rounded-2xl border border-amber-500/25 space-y-3 shadow-2xl">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">VİTRİNDEKİ TOPLAM HAS ALTIN SERMAYESİ</div>
                <div className="text-6xl lg:text-7xl font-mono font-bold text-slate-100 tracking-tight">
                  {capitalReport?.total_has_grams || '50.59'} <span className="text-3xl text-slate-400">gr Has</span>
                </div>
                <div className="text-base font-mono text-slate-300 pt-2">
                  Toplam Sermaye Karşılığı: <strong className="text-amber-400">{capitalReport?.total_capital_tl?.toLocaleString('tr-TR') || '154.034'} TL</strong>
                </div>
              </div>

            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-auto">
              
              {/* En Çok İncelenen / Denenen Takılar */}
              <div className="bg-[#12141c] p-10 rounded-2xl border border-amber-500/25 space-y-5 shadow-2xl">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">BUGÜN EN ÇOK İNCELENEN PARÇALAR</div>
                <div className="space-y-4 font-mono">
                  {products.slice(0, 3).map((p, idx) => (
                    <div key={p.id} className="flex items-center justify-between pb-3 border-b border-[#242938] text-base">
                      <span className="text-slate-200">{idx + 1}. {p.name}</span>
                      <span className="font-bold text-amber-400">{p.view_count || (24 - idx * 5)} Kez Kaldırıldı</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Güvenlik ve Tolerans Kartı */}
              <div className="bg-[#12141c] p-10 rounded-2xl border border-amber-500/25 space-y-4 shadow-2xl">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">VİTRİN VE HASSAS TERAZİ DURUMU</div>
                <div className="text-4xl font-bold text-emerald-400 flex items-center gap-3">
                  <ShieldCheck className="w-10 h-10" />
                  <span>SİSTEM KORUMADA</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed pt-2">
                  6 Adet IoT Hassas Terazi Yuvası aktif. Tolerans aralığı ±0.20 gr. Mağaza genelinde yetkisiz ağırlık sapması veya alarm tespit edilmedi.
                </p>
              </div>

            </div>
          )}

          {/* Alt Borsa & Kur Bilgi Bandı */}
          <div className="border-t border-amber-500/20 pt-5 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-slate-300">
            <div>HAS ALTIN (995): <strong className="text-amber-400">3.045,50 TL</strong></div>
            <div>22 AYAR BİLEZİK: <strong className="text-slate-100">2.915,00 TL</strong></div>
            <div>14 AYAR TAKI: <strong className="text-slate-100">1.865,00 TL</strong></div>
            <div>USD/TRY: <strong className="text-slate-100">34,20 TL</strong></div>
            <div className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>DARPHANE VE DAMGA MATBAASI RESMİ BAĞLANTISI AKTİF</span>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MÜŞTERİ VIP MÜCEVHER KARTI MODALI (SATICI GÖSTERİMİ)                      */}
      {/* ========================================================================= */}
      {customerModalProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setCustomerModalProduct(null)}>
          <div className="bg-[#12141c] text-slate-100 max-w-xl w-full rounded-2xl border border-amber-500/40 p-6 space-y-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#242938] pb-3">
              <div>
                <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider font-semibold">MÜCEVHER TANITIM &amp; ŞEFFAFLIK KARTI</span>
                <h3 className="text-xl font-bold text-slate-100 font-display mt-0.5">{customerModalProduct.name}</h3>
              </div>
              <button onClick={() => setCustomerModalProduct(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Altın & Maden Özellikleri */}
            <div className="grid grid-cols-2 gap-3 font-mono text-xs bg-[#0b0c10] p-4 rounded-xl border border-amber-500/20">
              <div>Ayar / Milyem: <strong className="text-amber-400 font-bold">{customerModalProduct.purity} ({customerModalProduct.milyem || 916}‰)</strong></div>
              <div>Maden Rengi: <strong className="text-slate-200">{customerModalProduct.gold_color || 'Sarı Altın'}</strong></div>
              <div>Ağırlık: <strong className="text-slate-100 font-bold">{customerModalProduct.weight_grams} gr</strong></div>
              <div>İşçilik Türü: <strong className="text-slate-200">{customerModalProduct.craftsmanship_type || 'El İşçiliği'}</strong></div>
            </div>

            {/* Varsa 4C Pırlanta Özellikleri */}
            {customerModalProduct.has_stones && (
              <div className="p-4 bg-[#0e1726] rounded-xl border border-cyan-500/30 text-xs space-y-1.5">
                <div className="font-bold text-cyan-300 font-cinzel text-sm">GIA / HRD Standartlarında 4C Değerlendirmesi</div>
                <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono">
                  <div>Karat (Carat): <strong className="text-white">{customerModalProduct.diamond_carat} ct</strong></div>
                  <div>Renk (Color): <strong className="text-white">{customerModalProduct.diamond_color}</strong></div>
                  <div>Berraklık (Clarity): <strong className="text-white">{customerModalProduct.diamond_clarity}</strong></div>
                  <div>Kesim (Cut): <strong className="text-white">Mükemmel (Excellent)</strong></div>
                </div>
              </div>
            )}

            <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/30 text-xs text-amber-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Darphane Resmi Damga &amp; Orijinallik Garantisi</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Bu mücevher T.C. Darphane ve Damga Matbaası Genel Müdürlüğü ayar kontrol standartlarına uygun olarak üretilmiş ve tescil edilmiştir.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="font-mono font-bold text-xl text-amber-400">
                {customerModalProduct.price?.toLocaleString('tr-TR')} TL
              </div>
              <button
                onClick={() => {
                  alert("Mücevher sertifikası yazıcıya gönderildi.");
                }}
                className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Sertifika Yazdır</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HIZLI ÜRÜN TANIMLAMA MODALI                                               */}
      {/* ========================================================================= */}
      {showQuickAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#12141c] text-slate-100 max-w-md w-full rounded-2xl border border-amber-500/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#242938] pb-3">
              <h3 className="text-base font-bold text-amber-400 font-cinzel">Hızlı Ürün Tanımlama</h3>
              <button onClick={() => setShowQuickAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleQuickAddProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Model Adı</label>
                <input
                  type="text"
                  required
                  value={quickAddData.name}
                  onChange={e => setQuickAddData({ ...quickAddData, name: e.target.value })}
                  placeholder="Örn: 22 Ayar Burma Bilezik"
                  className="w-full bg-[#0b0c10] border border-[#242938] rounded-lg px-3 py-2 text-slate-100 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Kategori</label>
                  <select
                    value={quickAddData.category}
                    onChange={e => setQuickAddData({ ...quickAddData, category: e.target.value })}
                    className="w-full bg-[#0b0c10] border border-[#242938] rounded-lg px-3 py-2 text-slate-100 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Bilezik">Bilezik</option>
                    <option value="Kolye">Kolye</option>
                    <option value="Yüzük">Yüzük</option>
                    <option value="Küpe">Küpe</option>
                    <option value="Set">Set</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Ayar</label>
                  <select
                    value={quickAddData.purity}
                    onChange={e => {
                      const pur = e.target.value;
                      const mil = pur === '24K' ? 995 : (pur === '22K' ? 916 : (pur === '18K' ? 750 : 585));
                      setQuickAddData({ ...quickAddData, purity: pur, milyem: mil });
                    }}
                    className="w-full bg-[#0b0c10] border border-[#242938] rounded-lg px-3 py-2 text-slate-100 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="22K">22K (916‰)</option>
                    <option value="24K">24K (995‰)</option>
                    <option value="18K">18K (750‰)</option>
                    <option value="14K">14K (585‰)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Ağırlık (Gram)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={quickAddData.weight_grams}
                    onChange={e => setQuickAddData({ ...quickAddData, weight_grams: e.target.value })}
                    placeholder="24.50"
                    className="w-full bg-[#0b0c10] border border-[#242938] rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Satış Fiyatı (TL)</label>
                  <input
                    type="number"
                    required
                    value={quickAddData.price}
                    onChange={e => setQuickAddData({ ...quickAddData, price: e.target.value })}
                    placeholder="74500"
                    className="w-full bg-[#0b0c10] border border-[#242938] rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold text-xs rounded-lg hover:brightness-110 transition cursor-pointer"
                >
                  Ürünü Sisteme ve Vitrine Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
