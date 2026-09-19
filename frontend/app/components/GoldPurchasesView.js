'use client';

import React, { useState, useMemo } from 'react';
import { 
  Scale, 
  Coins, 
  DollarSign, 
  User, 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Printer, 
  Download, 
  FileText, 
  ArrowDownRight, 
  TrendingDown, 
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Clock,
  ShieldCheck,
  Building2
} from 'lucide-react';

export default function GoldPurchasesView({
  purchases = [],
  staffSummary = [],
  currentUser,
  onOpenNewPurchaseModal,
  onRefresh,
  liveRates
}) {
  const [timeframe, setTimeframe] = useState('today'); // today, week, month, year, all
  const [selectedStaffId, setSelectedStaffId] = useState('ALL');
  const [purityFilter, setPurityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPurchaseForPrint, setSelectedPurchaseForPrint] = useState(null);

  // Tarih ve Filtre Mantığı
  const filteredPurchases = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    return purchases.filter(p => {
      const pDate = p.created_at ? new Date(p.created_at) : new Date();

      // Zaman Filtresi
      if (timeframe === 'today' && pDate < startOfToday) return false;
      if (timeframe === 'week' && pDate < startOfWeek) return false;
      if (timeframe === 'month' && pDate < startOfMonth) return false;
      if (timeframe === 'year' && pDate < startOfYear) return false;

      // Personel Filtresi
      if (selectedStaffId !== 'ALL' && p.user_id !== parseInt(selectedStaffId)) return false;

      // Ayar Filtresi
      if (purityFilter !== 'ALL' && p.purity !== purityFilter) return false;

      // Arama
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchReceipt = (p.receipt_no || '').toLowerCase().includes(q);
        const matchDesc = (p.item_description || '').toLowerCase().includes(q);
        const matchCust = (p.customer_name || '').toLowerCase().includes(q);
        const matchTc = (p.customer_tc || '').toLowerCase().includes(q);
        const matchBuyer = (p.buyer_name || '').toLowerCase().includes(q);
        if (!matchReceipt && !matchDesc && !matchCust && !matchTc && !matchBuyer) return false;
      }

      return true;
    });
  }, [purchases, timeframe, selectedStaffId, purityFilter, searchQuery]);

  // KPI Hesaplamaları
  const totals = useMemo(() => {
    let weight = 0;
    let pure = 0;
    let paid = 0;

    filteredPurchases.forEach(p => {
      weight += parseFloat(p.weight_grams) || 0;
      pure += parseFloat(p.pure_gold_grams) || 0;
      paid += parseFloat(p.total_amount_paid) || 0;
    });

    return {
      count: filteredPurchases.length,
      weightGrams: weight.toFixed(2),
      pureGoldGrams: pure.toFixed(3),
      totalPaid: Math.round(paid)
    };
  }, [filteredPurchases]);

  // Yazdırma işlemi
  const handlePrint = (item) => {
    setSelectedPurchaseForPrint(item);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="space-y-6">
      
      {/* ÜST BAŞLIK VE HIZLI ALIM AKSİYONU */}
      <div className="bg-gradient-to-r from-[#12141c] via-[#1a1d2c] to-[#12141c] p-4 lg:p-6 rounded-2xl border border-amber-500/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>MÜŞTERİDEN GERİ ALIM & HURDA KASA YÖNETİMİ</span>
          </div>
          <h2 className="font-cinzel text-lg lg:text-2xl font-bold text-white flex items-center gap-2.5 mt-1">
            <Scale className="w-6 h-6 text-amber-400" />
            ALTIN SATIN ALMA, HURDA TAKİBİ & PERSONEL ALIM RAPORU
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Müşteriden alınan ziynet, burma bilezik ve hurdaları kaydedin, personel alımlarını takip edin ve gün sonu kasasına işleyin.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition"
              title="Yenile"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onOpenNewPurchaseModal}
            className="btn-gold py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg w-full md:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>+ Müşteriden Altın Satın Al (Hurda Girişi)</span>
          </button>
        </div>
      </div>

      {/* KPI METRİK KARTLARI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#12141c] p-4 rounded-xl border border-[#242938] relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Satın Alınan Toplam Altın</span>
            <Scale className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-display font-bold text-white tracking-tight">
            {totals.weightGrams} <span className="text-sm font-mono text-amber-400 font-normal">gr</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-mono font-bold">+{totals.count}</span> adet alım işlemi
          </div>
        </div>

        <div className="bg-[#12141c] p-4 rounded-xl border border-amber-500/30 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Has Altın Karşılığı (995)</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-display font-bold text-amber-400 tracking-tight">
            {totals.pureGoldGrams} <span className="text-sm font-mono text-slate-300 font-normal">Has gr</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Kasaya giren net has altın
          </div>
        </div>

        <div className="bg-[#12141c] p-4 rounded-xl border border-[#242938] relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Kasadan Ödenen Tutar</span>
            <DollarSign className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-display font-bold text-rose-400 tracking-tight">
            {totals.totalPaid.toLocaleString('tr-TR')} <span className="text-sm font-sans font-normal text-slate-400">₺</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Kasa / Banka nakit çıkışı
          </div>
        </div>

        <div className="bg-[#12141c] p-4 rounded-xl border border-[#242938] relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Alım Yapan Personel</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-display font-bold text-white tracking-tight">
            {staffSummary.filter(s => s.total_purchases_count > 0).length} <span className="text-sm font-normal text-slate-400">Kullanıcı</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Personel bazlı takip devrede
          </div>
        </div>
      </div>

      {/* ================= PERSONEL ALIM KARNESİ ("HANGİ KULLANICI NE KADAR ALDI?") ================= */}
      <div className="bg-[#12141c] p-4 lg:p-5 rounded-2xl border border-amber-500/30 shadow-lg space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-white text-sm">PERSONEL ALTIN ALIM KARNESİ (KİM NE KADAR ALDI?)</h3>
          </div>
          <span className="text-xs text-slate-400">
            Personel kartına tıklayarak sadece o personelin alımlarını filtreleyebilirsiniz.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {staffSummary.map((staff, idx) => {
            const isSelected = selectedStaffId === (staff.user_id?.toString() || 'unassigned');
            return (
              <div
                key={staff.user_id || idx}
                onClick={() => setSelectedStaffId(isSelected ? 'ALL' : (staff.user_id?.toString() || 'ALL'))}
                className={`p-3.5 rounded-xl border transition cursor-pointer ${
                  isSelected 
                    ? 'bg-amber-500/15 border-amber-500 shadow-md ring-1 ring-amber-500' 
                    : 'bg-[#181c28] border-[#272e40] hover:border-amber-500/50 hover:bg-[#1e2333]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="font-bold text-white text-xs truncate flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{staff.full_name}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#202638] text-amber-300 font-semibold">
                    {staff.role}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#252b3d] text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Alınan Gram:</span>
                    <span className="font-mono font-bold text-white text-xs">{staff.total_weight_grams} gr</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">Has Karşılığı:</span>
                    <span className="font-mono font-bold text-amber-400 text-xs">{staff.total_pure_gold_grams} Has</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#202638] text-[10px]">
                  <span className="text-slate-400">{staff.total_purchases_count} İşlem</span>
                  <span className="font-mono font-bold text-emerald-400">{staff.total_amount_paid.toLocaleString('tr-TR')} ₺</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FİLTRE VE ARAMA ÇUBUĞU */}
      <div className="bg-[#12141c] p-4 rounded-xl border border-[#242938] flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Zaman Aralığı Butonları */}
        <div className="flex items-center gap-1 bg-[#0e1017] p-1 rounded-xl border border-[#242938]">
          {[
            { id: 'today', label: 'Gün Sonu (Bugün)' },
            { id: 'week', label: 'Bu Hafta' },
            { id: 'month', label: 'Bu Ay' },
            { id: 'year', label: 'Bu Yıl' },
            { id: 'all', label: 'Tüm Zamanlar' }
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTimeframe(t.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                timeframe === t.id
                  ? 'bg-amber-500 text-black shadow font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Personel & Ayar Seçimi */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="bg-[#0e1017] border border-[#242938] text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">Tüm Personeller</option>
            {staffSummary.map(s => (
              <option key={s.user_id || s.username} value={s.user_id?.toString() || 'ALL'}>
                {s.full_name} ({s.total_purchases_count} alım)
              </option>
            ))}
          </select>

          <select
            value={purityFilter}
            onChange={(e) => setPurityFilter(e.target.value)}
            className="bg-[#0e1017] border border-[#242938] text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">Tüm Ayarlar</option>
            <option value="24K">24 Ayar (Has)</option>
            <option value="22K">22 Ayar</option>
            <option value="18K">18 Ayar</option>
            <option value="14K">14 Ayar</option>
          </select>

          {/* Arama Inputu */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Fiş, Müşteri, Personel ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0e1017] border border-[#242938] text-white rounded-lg pl-8 pr-3 py-1.5 w-48 lg:w-56 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      </div>

      {/* SATIN ALINAN ALTINLAR LİSTESİ TABLOSU */}
      <div className="bg-[#12141c] rounded-2xl border border-[#242938] overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#242938] flex items-center justify-between">
          <div className="font-bold text-white text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>SATIN ALINAN ALTINLAR & GİDER PUSULALARI ({filteredPurchases.length} Kayıt)</span>
          </div>
          <span className="text-xs text-slate-400">
            Resmi MASAK & Vergi Usul Kanunu uyumlu alım kayıtları
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#242938] bg-[#161a25] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Fiş No & Tarih</th>
                <th className="py-3 px-4">Satın Alan Personel</th>
                <th className="py-3 px-4">Müşteri (Satıcı)</th>
                <th className="py-3 px-4">Altın Cinsi & Açıklama</th>
                <th className="py-3 px-4">Ayar</th>
                <th className="py-3 px-4 text-right">Tartılan Gram</th>
                <th className="py-3 px-4 text-right">Has Karşılığı</th>
                <th className="py-3 px-4 text-right">Gram Fiyatı</th>
                <th className="py-3 px-4 text-right">Ödenen Tutar</th>
                <th className="py-3 px-4">Ödeme / Konum</th>
                <th className="py-3 px-4 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2330]">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-10 text-slate-500">
                    <Scale className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-50" />
                    Seçilen kriterlere uygun satın alınan altın kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => {
                  const dateStr = p.created_at 
                    ? new Date(p.created_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                    : '-';

                  return (
                    <tr key={p.id} className="hover:bg-[#181c28] transition group">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-amber-400 block">{p.receipt_no || `#${p.id}`}</span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {dateStr}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-white flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-amber-400" />
                          {p.buyer_name || 'Yetkili Personel'}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-200">{p.customer_name || 'Müşteri'}</div>
                        {p.customer_tc && (
                          <div className="text-[10px] text-slate-400 font-mono">TC: {p.customer_tc}</div>
                        )}
                        {p.customer_phone && (
                          <div className="text-[10px] text-slate-400 font-mono">{p.customer_phone}</div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-white max-w-[200px] truncate">{p.item_description}</div>
                        <div className="text-[10px] text-slate-400">{p.category}</div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {p.purity}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-white whitespace-nowrap">
                        {p.weight_grams} gr
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-400 whitespace-nowrap">
                        {p.pure_gold_grams} Has
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-300 whitespace-nowrap">
                        {p.unit_price_per_gram?.toLocaleString('tr-TR')} ₺
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 whitespace-nowrap text-sm">
                        {p.total_amount_paid?.toLocaleString('tr-TR')} ₺
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-[11px] text-slate-300">{p.payment_method}</div>
                        <div className="text-[10px] text-slate-500">{p.storage_location}</div>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handlePrint(p)}
                          className="btn-secondary py-1 px-2.5 text-[11px] flex items-center gap-1 text-slate-300 hover:text-white mx-auto font-medium"
                          title="Gider Pusulası / Fiş Yazdır"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Pusula</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* GİDER PUSULASI YAZDIRMA MODAL / ÖNİZLEME */}
      {selectedPurchaseForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:p-0 print:bg-white">
          <div className="bg-white text-black p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-4 print:shadow-none print:w-full print:max-w-none">
            
            <div className="text-center border-b pb-3">
              <h2 className="text-lg font-bold uppercase tracking-wider">GOLDEN GUARD KUYUMCULUK</h2>
              <p className="text-xs text-gray-500">Kıymetli Maden Satın Alma & Gider Pusulası</p>
              <div className="text-xs font-mono font-bold text-gray-700 mt-1">Fiş No: {selectedPurchaseForPrint.receipt_no}</div>
            </div>

            <div className="text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-600">İşlem Tarihi:</span>
                <span className="font-semibold">{new Date(selectedPurchaseForPrint.created_at).toLocaleString('tr-TR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Satın Alan Personel:</span>
                <span className="font-semibold">{selectedPurchaseForPrint.buyer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Müşteri Adı Soyadı:</span>
                <span className="font-semibold">{selectedPurchaseForPrint.customer_name}</span>
              </div>
              {selectedPurchaseForPrint.customer_tc && (
                <div className="flex justify-between">
                  <span className="text-gray-600">T.C. Kimlik No:</span>
                  <span className="font-semibold font-mono">{selectedPurchaseForPrint.customer_tc}</span>
                </div>
              )}
              {selectedPurchaseForPrint.customer_phone && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Telefon:</span>
                  <span className="font-semibold font-mono">{selectedPurchaseForPrint.customer_phone}</span>
                </div>
              )}
            </div>

            <div className="border-t border-b py-2 space-y-1 text-xs">
              <div className="flex justify-between font-bold">
                <span>{selectedPurchaseForPrint.item_description}</span>
                <span>{selectedPurchaseForPrint.purity}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tartılan Gramaj:</span>
                <span className="font-mono font-bold text-black">{selectedPurchaseForPrint.weight_grams} gr</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Hesaplanan Has Altın:</span>
                <span className="font-mono font-bold text-black">{selectedPurchaseForPrint.pure_gold_grams} Has gr</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Gram Alış Birim Fiyatı:</span>
                <span className="font-mono">{selectedPurchaseForPrint.unit_price_per_gram?.toLocaleString('tr-TR')} ₺</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm font-bold pt-1">
              <span>MÜŞTERİYE ÖDENEN:</span>
              <span className="text-base text-emerald-700 font-mono">
                {selectedPurchaseForPrint.total_amount_paid?.toLocaleString('tr-TR')} ₺
              </span>
            </div>

            <div className="text-[10px] text-gray-500 text-center pt-2">
              Yukarıda dökümü yapılan altın/ziynet eşyayı dilediğim rızamla teslim ederek bedelini nakden/hesaben eksiksiz teslim aldım.
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 text-center text-xs border-t">
              <div>
                <span className="block font-semibold">Teslim Eden (Müşteri)</span>
                <span className="text-[10px] text-gray-400 mt-6 block">İmza</span>
              </div>
              <div>
                <span className="block font-semibold">Teslim Alan (Kuyumcu)</span>
                <span className="text-[10px] text-gray-400 mt-6 block">İmza / Kaşe</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 print:hidden">
              <button
                type="button"
                onClick={() => setSelectedPurchaseForPrint(null)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold"
              >
                Kapat
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-1.5 rounded-lg bg-black text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Yazdır</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
