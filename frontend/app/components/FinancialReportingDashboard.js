'use client';

import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Coins, 
  ShoppingBag, 
  Calendar, 
  FileText, 
  Printer, 
  Download, 
  Search, 
  Filter, 
  CheckCircle2, 
  Award, 
  Users, 
  User,
  Clock, 
  Save, 
  Percent,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Scale,
  Activity,
  ShieldAlert
} from 'lucide-react';

export default function FinancialReportingDashboard({
  salesList = [],
  purchasesList = [],
  analytics = {},
  dailyReportsArchive = [],
  currentUser,
  onSaveDailyReport,
  onPrintReport,
  onFastSelectSaleForEmail,
  capitalReport,
  criticalStock,
  products = [],
  customers = [],
  systemLogs = [],
  alerts = [],
  branches = [],
  onOpenNewSale
}) {
  // Seçili Dönem Filtresi: 'TODAY' (Gün Sonu) | 'WEEK' (Haftalık) | 'MONTH' (Aylık) | 'YEAR' (Yıllık) | 'ALL' (Tümü)
  const [timeframe, setTimeframe] = useState('TODAY');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [savingReport, setSavingReport] = useState(false);
  const [visibleWidgets, setVisibleWidgets] = useState({
    sales: true,
    inventory: true,
    customers: true,
    invoices: true,
    system: true,
    branches: true
  });

  // Tarih Filtreleme Mantığı
  const filteredSales = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const safeSales = Array.isArray(salesList) ? salesList : [];
    return safeSales.filter(s => {
      const saleDate = s.created_at ? new Date(s.created_at) : new Date();

      // Zaman Filtresi
      if (timeframe === 'TODAY' && saleDate < startOfToday) return false;
      if (timeframe === 'WEEK' && saleDate < startOfWeek) return false;
      if (timeframe === 'MONTH' && saleDate < startOfMonth) return false;
      if (timeframe === 'YEAR' && saleDate < startOfYear) return false;

      // Kategori Filtresi
      if (categoryFilter !== 'ALL' && s.category !== categoryFilter) return false;

      // Arama
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = (s.product_name || '').toLowerCase().includes(q);
        const matchCust = (s.customer_name || '').toLowerCase().includes(q);
        const matchStaff = (s.sold_by_name || '').toLowerCase().includes(q);
        const matchInv = (s.invoice_no || '').toLowerCase().includes(q);
        if (!matchName && !matchCust && !matchStaff && !matchInv) return false;
      }

      return true;
    });
  }, [salesList, timeframe, categoryFilter, searchQuery]);

  // Finansal KPI Özetleri
  const summary = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalGrams = 0;
    const catMap = {};
    const paymentMap = {};
    const staffMap = {};

    filteredSales.forEach(s => {
      const price = parseFloat(s.sale_price) || 0;
      const cost = parseFloat(s.cost_price) || (price * 0.82);
      const grams = parseFloat(s.weight_grams) || 0;

      totalRevenue += price;
      totalCost += cost;
      totalGrams += grams;

      // Kategori Dağılımı
      const cat = s.category || 'Diğer';
      catMap[cat] = (catMap[cat] || 0) + price;

      // Ödeme Yöntemi
      const pay = s.payment_method || 'Kredi Kartı';
      paymentMap[pay] = (paymentMap[pay] || 0) + price;

      // Personel Satışları
      const staff = s.sold_by_name || 'Yetkili Personel';
      if (!staffMap[staff]) {
        staffMap[staff] = { count: 0, revenue: 0, grams: 0 };
      }
      staffMap[staff].count += 1;
      staffMap[staff].revenue += price;
      staffMap[staff].grams += grams;
    });

    const netProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

    return {
      count: filteredSales.length,
      totalRevenue,
      totalCost,
      netProfit,
      profitMargin,
      totalGrams,
      catMap,
      paymentMap,
      staffMap
    };
  }, [filteredSales]);

  // Satın Alınan Altınların Dönem Filtresi ve Toplamları
  const purchaseMetrics = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const safePurchases = Array.isArray(purchasesList) ? purchasesList : [];
    const filtered = safePurchases.filter(p => {
      const pDate = p.created_at ? new Date(p.created_at) : new Date();
      if (timeframe === 'TODAY' && pDate < startOfToday) return false;
      if (timeframe === 'WEEK' && pDate < startOfWeek) return false;
      if (timeframe === 'MONTH' && pDate < startOfMonth) return false;
      if (timeframe === 'YEAR' && pDate < startOfYear) return false;
      return true;
    });

    let weight = 0;
    let pure = 0;
    let paid = 0;
    const staffPurchasesMap = {};

    filtered.forEach(p => {
      const w = parseFloat(p.weight_grams) || 0;
      const pu = parseFloat(p.pure_gold_grams) || 0;
      const amt = parseFloat(p.total_amount_paid) || 0;

      weight += w;
      pure += pu;
      paid += amt;

      const staff = p.buyer_name || 'Yetkili Personel';
      if (!staffPurchasesMap[staff]) {
        staffPurchasesMap[staff] = { count: 0, weight: 0, pure: 0, paid: 0 };
      }
      staffPurchasesMap[staff].count += 1;
      staffPurchasesMap[staff].weight += w;
      staffPurchasesMap[staff].pure += pu;
      staffPurchasesMap[staff].paid += amt;
    });

    return {
      count: filtered.length,
      totalWeightGrams: weight,
      totalPureGoldGrams: pure,
      totalAmountPaid: paid,
      staffPurchasesMap
    };
  }, [purchasesList, timeframe]);

  // GÜN SONU KARŞILAŞTIRMA (ALINAN vs SATILAN ALTIN)
  const comparison = useMemo(() => {
    const soldGrams = summary.totalGrams;
    const purchasedGrams = purchaseMetrics.totalWeightGrams;
    const netWeightBalance = purchasedGrams - soldGrams; // Pozitif ise kasaya net altın girdi

    const salesRev = summary.totalRevenue;
    const purchasesPaid = purchaseMetrics.totalAmountPaid;
    const netCashFlow = salesRev - purchasesPaid; // Satış Geliri - Alım Ödemesi

    // Personel karşılaştırması
    const allStaffNames = Array.from(new Set([
      ...Object.keys(summary.staffMap || {}),
      ...Object.keys(purchaseMetrics.staffPurchasesMap || {})
    ]));

    const staffComparison = allStaffNames.map(name => {
      const s = summary.staffMap[name] || { count: 0, grams: 0, revenue: 0 };
      const p = purchaseMetrics.staffPurchasesMap[name] || { count: 0, weight: 0, pure: 0, paid: 0 };
      return {
        name,
        salesCount: s.count,
        salesGrams: s.grams.toFixed(2),
        salesRevenue: s.revenue,
        purchasesCount: p.count,
        purchasesGrams: p.weight.toFixed(2),
        purchasesPaid: p.paid,
        netGrams: (p.weight - s.grams).toFixed(2),
        netCash: s.revenue - p.paid
      };
    });

    return {
      soldGrams: soldGrams.toFixed(2),
      salesRevenue: salesRev,
      purchasedGrams: purchasedGrams.toFixed(2),
      purchasesPaid,
      netWeightBalance: netWeightBalance.toFixed(2),
      netCashFlow,
      staffComparison
    };
  }, [summary, purchaseMetrics]);

  const widgetMetrics = useMemo(() => {
    const statusCounts = products.reduce((counts, product) => {
      const status = product.status || 'Stokta';
      counts[status] = (counts[status] || 0) + (product.stock_quantity || 1);
      return counts;
    }, {});
    const logCounts = systemLogs.reduce((counts, log) => {
      const level = log.level || 'INFO';
      counts[level] = (counts[level] || 0) + 1;
      return counts;
    }, {});
    const invoiceCount = salesList.filter(sale => sale.invoice_no).length;
    const activeCustomers = customers.filter(customer => customer.is_active !== false).length;
    const branchStock = branches.map(branch => ({
      name: branch.name,
      count: products.filter(product => product.branch_id === branch.id).reduce((total, product) => total + (product.stock_quantity || 1), 0)
    }));
    const salesByDay = filteredSales.reduce((days, sale) => {
      const key = sale.created_at ? new Date(sale.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }) : 'Bugün';
      days[key] = (days[key] || 0) + (parseFloat(sale.sale_price) || 0);
      return days;
    }, {});

    return { statusCounts, logCounts, invoiceCount, activeCustomers, branchStock, salesByDay };
  }, [products, systemLogs, salesList, customers, branches, filteredSales]);

  const toggleWidget = (widgetKey) => {
    setVisibleWidgets(prev => ({ ...prev, [widgetKey]: !prev[widgetKey] }));
  };

  // Zaman başlığı etiketi
  const timeframeLabels = {
    TODAY: 'Bugün (Gün Sonu)',
    WEEK: 'Bu Hafta (Haftalık)',
    MONTH: 'Bu Ay (Aylık)',
    YEAR: 'Bu Yıl (Yıllık)',
    ALL: 'Tüm Zamanlar (Genel)'
  };

  const handleSaveClick = async () => {
    setSavingReport(true);
    try {
      await onSaveDailyReport({
        report_date: new Date().toISOString().split('T')[0],
        total_revenue: summary.totalRevenue,
        total_gold_grams_sold: summary.totalGrams,
        total_sales_count: summary.count,
        total_cost: summary.totalCost,
        net_profit: summary.netProfit,
        notes: `${currentUser?.full_name || 'Yetkili'} tarafından ${timeframeLabels[timeframe]} raporu kalıcı arşive kaydedildi.`
      });
    } finally {
      setSavingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ÜST BAŞLIK VE DÖNEM SEÇİCİ */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#141826] via-[#1a2035] to-[#141826] border border-amber-500/40 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-cinzel text-lg lg:text-xl font-bold text-white tracking-wide flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-amber-400" />
              <span>SATIŞ, CİRO &amp; FİNANSAL RAPORLAMA DASHBOARD</span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Günlük, haftalık, aylık ve yıllık satış trendleri, kâr marjları ve personel performans analizleri
          </p>
        </div>

        {/* DÖNEM SEKMELERİ (GÜN SONU / HAFTALIK / AYLIK / YILLIK) */}
        <div className="flex items-center gap-1.5 bg-[#0e1017] p-1.5 rounded-xl border border-[#2b334a] overflow-x-auto">
          <button
            onClick={() => setTimeframe('TODAY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              timeframe === 'TODAY'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Bugün (Gün Sonu)</span>
          </button>

          <button
            onClick={() => setTimeframe('WEEK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              timeframe === 'WEEK'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Bu Hafta</span>
          </button>

          <button
            onClick={() => setTimeframe('MONTH')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              timeframe === 'MONTH'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Bu Ay</span>
          </button>

          <button
            onClick={() => setTimeframe('YEAR')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              timeframe === 'YEAR'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Bu Yıl</span>
          </button>

          <button
            onClick={() => setTimeframe('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              timeframe === 'ALL'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Tümü</span>
          </button>
        </div>
      </div>

      {/* AKSİYON BUTONLARI: Z-RAPORU KAYDET & YAZDIR */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-[#12141c] p-3.5 rounded-xl border border-[#242938]">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Aktif Dönem:</span>
          <strong className="text-amber-400 font-bold font-mono">{timeframeLabels[timeframe]}</strong>
          <span className="text-slate-500">({summary.count} İşlem Kayıtlı)</span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenNewSale && (
            <button
              type="button"
              onClick={onOpenNewSale}
              className="btn-gold text-xs py-1.5 px-3 flex items-center gap-1.5 font-bold"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Yeni POS Satışı</span>
            </button>
          )}
          <button
            onClick={onPrintReport}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 border-slate-700 text-slate-300 hover:text-white"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Raporu Yazdır / PDF</span>
          </button>

          <button
            onClick={handleSaveClick}
            disabled={savingReport}
            className="btn-gold text-xs py-1.5 px-3.5 flex items-center gap-1.5 font-bold"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingReport ? 'Kaydediliyor...' : '💾 Dönem / Z-Raporunu Kaydet'}</span>
          </button>
        </div>
      </div>

      {/* TEK SAYFALIK YÖNETİCİ WIDGET KONTROLÜ */}
      <div className="bg-[#12141c] border border-indigo-500/30 rounded-xl p-3.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs font-bold text-white">Analiz Widget'ları</div>
            <div className="text-[11px] text-slate-400 mt-0.5">İhtiyacınız olmayan panelleri gizleyin, rapor görünümünü sade tutun.</div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              ['sales', 'Satış'],
              ['inventory', 'Stok'],
              ['customers', 'Müşteri'],
              ['invoices', 'Fatura'],
              ['system', 'Sistem'],
              ['branches', 'Şube']
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleWidget(key)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${visibleWidgets[key] ? 'bg-amber-500/15 text-amber-300 border-amber-500/40' : 'bg-slate-900 text-slate-500 border-slate-700'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* GENEL DURUM WIDGET'LARI */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleWidgets.sales && (
          <div className="p-4 rounded-xl bg-[#12141c] border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-2"><Activity className="w-4 h-4 text-amber-400" /> Satış Trendi</h3>
              <span className="text-[10px] text-slate-500">{timeframeLabels[timeframe]}</span>
            </div>
            <div className="flex items-end gap-1 h-24">
              {Object.entries(widgetMetrics.salesByDay).slice(-14).map(([day, amount]) => {
                const maxAmount = Math.max(...Object.values(widgetMetrics.salesByDay), 1);
                return (
                  <div key={day} className="flex-1 h-full flex flex-col justify-end items-center gap-1" title={`${day}: ${amount.toLocaleString('tr-TR')} ₺`}>
                    <div className="w-full bg-gradient-to-t from-amber-600 to-yellow-300 rounded-t" style={{ height: `${Math.max(6, (amount / maxAmount) * 100)}%` }} />
                    <span className="text-[8px] text-slate-500 rotate-45">{day}</span>
                  </div>
                );
              })}
              {Object.keys(widgetMetrics.salesByDay).length === 0 && <span className="text-xs text-slate-500 m-auto">Seçilen dönemde satış yok.</span>}
            </div>
          </div>
        )}

        {visibleWidgets.inventory && (
          <div className="p-4 rounded-xl bg-[#12141c] border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-2"><Coins className="w-4 h-4 text-emerald-400" /> Stok & Sermaye</h3>
              <span className="text-lg font-bold text-amber-400">{Number(capitalReport?.total_capital_tl || 0).toLocaleString('tr-TR')} ₺</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#0e1017] rounded-lg p-2"><span className="text-slate-500 block">Toplam Ürün</span><strong className="text-white">{products.length}</strong></div>
              <div className="bg-[#0e1017] rounded-lg p-2"><span className="text-slate-500 block">Kritik Stok</span><strong className="text-rose-300">{criticalStock?.suggested_products?.length || 0}</strong></div>
              <div className="bg-[#0e1017] rounded-lg p-2"><span className="text-slate-500 block">Has Altın</span><strong className="text-amber-300">{Number(capitalReport?.total_has_grams || 0).toFixed(2)} gr</strong></div>
              <div className="bg-[#0e1017] rounded-lg p-2"><span className="text-slate-500 block">Kasa Rezervi</span><strong className="text-sky-300">{Number(capitalReport?.vault_capital_tl || 0).toLocaleString('tr-TR')} ₺</strong></div>
            </div>
          </div>
        )}

        {visibleWidgets.customers && (
          <div className="p-4 rounded-xl bg-[#12141c] border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between"><h3 className="text-xs font-bold text-white flex items-center gap-2"><Users className="w-4 h-4 text-cyan-400" /> Anlık Müşteri</h3><span className="text-[10px] text-emerald-400">CRM canlı</span></div>
            <div className="text-3xl font-bold text-cyan-300">{widgetMetrics.activeCustomers}</div>
            <div className="text-xs text-slate-400">Aktif müşteri kaydı</div>
            <div className="text-xs text-slate-300 border-t border-[#242938] pt-2">Bu dönem işlem gören müşteri: <strong className="text-white">{new Set(filteredSales.map(sale => sale.customer_name).filter(Boolean)).size}</strong></div>
          </div>
        )}

        {visibleWidgets.invoices && (
          <div className="p-4 rounded-xl bg-[#12141c] border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between"><h3 className="text-xs font-bold text-white flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-400" /> Fatura Raporu</h3><span className="text-[10px] text-slate-500">e-Fatura / e-Arşiv</span></div>
            <div className="text-3xl font-bold text-indigo-300">{widgetMetrics.invoiceCount}</div>
            <div className="text-xs text-slate-400">Fatura numarası oluşmuş satış</div>
            <div className="text-xs text-slate-300 border-t border-[#242938] pt-2">Toplam işlem: <strong className="text-white">{salesList.length}</strong></div>
          </div>
        )}

        {visibleWidgets.system && (
          <div className="p-4 rounded-xl bg-[#12141c] border border-rose-500/30 space-y-3">
            <div className="flex items-center justify-between"><h3 className="text-xs font-bold text-white flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-rose-400" /> Sistem Takibi</h3><span className="text-[10px] text-slate-500">Son kayıtlar</span></div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div><strong className="text-white block text-lg">{systemLogs.length}</strong><span className="text-slate-500">Log</span></div>
              <div><strong className="text-rose-300 block text-lg">{alerts.length}</strong><span className="text-slate-500">Alarm</span></div>
              <div><strong className="text-emerald-300 block text-lg">{widgetMetrics.logCounts.INFO || 0}</strong><span className="text-slate-500">Bilgi</span></div>
            </div>
          </div>
        )}

        {visibleWidgets.branches && (
          <div className="p-4 rounded-xl bg-[#12141c] border border-sky-500/30 space-y-3">
            <div className="flex items-center justify-between"><h3 className="text-xs font-bold text-white flex items-center gap-2"><BarChart3 className="w-4 h-4 text-sky-400" /> Şube Stokları</h3><span className="text-[10px] text-slate-500">{branches.length} şube</span></div>
            <div className="space-y-2">
              {widgetMetrics.branchStock.slice(0, 5).map(branch => {
                const maxStock = Math.max(...widgetMetrics.branchStock.map(item => item.count), 1);
                return <div key={branch.name}><div className="flex justify-between text-[11px] text-slate-300"><span>{branch.name}</span><strong>{branch.count}</strong></div><div className="h-1.5 bg-[#0e1017] rounded-full mt-1"><div className="h-full bg-sky-400 rounded-full" style={{ width: `${Math.max(4, (branch.count / maxStock) * 100)}%` }} /></div></div>;
              })}
            </div>
          </div>
        )}
      </div>

      {/* 5 TEMEL FİNANSAL KPI KARTI */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Toplam Ciro */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#181c2b] to-[#12141c] border border-amber-500/40 shadow-lg">
          <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between">
            <span>Toplam Ciro</span>
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-display text-white mt-2">
            {summary.totalRevenue.toLocaleString('tr-TR')} ₺
          </div>
          <div className="text-[10px] text-amber-300/80 font-mono mt-0.5">
            {timeframeLabels[timeframe]}
          </div>
        </div>

        {/* Satış Adedi */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#181c2b] to-[#12141c] border border-indigo-500/40 shadow-lg">
          <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between">
            <span>Satış Adedi</span>
            <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white mt-2">
            {summary.count} Adet
          </div>
          <div className="text-[10px] text-indigo-300/80 font-mono mt-0.5">
            Tamamlanan Fişler
          </div>
        </div>

        {/* Satılan Has Gramaj */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#181c2b] to-[#12141c] border border-yellow-500/40 shadow-lg">
          <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between">
            <span>Satılan Altın</span>
            <Coins className="w-3.5 h-3.5 text-yellow-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-2">
            {summary.totalGrams.toFixed(2)} gr
          </div>
          <div className="text-[10px] text-yellow-300/80 font-mono mt-0.5">
            Toplam Metal Ağırlığı
          </div>
        </div>

        {/* Net Kâr */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#181c2b] to-[#12141c] border border-emerald-500/40 shadow-lg">
          <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between">
            <span>Net Kâr</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-display text-emerald-400 mt-2">
            +{summary.netProfit.toLocaleString('tr-TR')} ₺
          </div>
          <div className="text-[10px] text-emerald-300/80 font-mono mt-0.5">
            Maliyet Düşüldükten Sonra
          </div>
        </div>

        {/* Kâr Marjı */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#181c2b] to-[#12141c] border border-cyan-500/40 shadow-lg col-span-2 md:col-span-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between">
            <span>Kâr Marjı</span>
            <Percent className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-2">
            %{summary.profitMargin.toFixed(1)}
          </div>
          <div className="text-[10px] text-cyan-300/80 font-mono mt-0.5">
            Ortalama Brüt Verim
          </div>
        </div>
      </div>

      {/* ================= GÜN SONU / DÖNEMSEL ALTIN & KASA DENGESİ (ALINAN vs. SATILAN) ================= */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#12141c] via-[#191d2c] to-[#12141c] border border-amber-500/40 shadow-2xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#262c3e] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>GÜN SONU ALTIN &amp; KASA DENGESİ (ALINAN vs. SATILAN ALTIN)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                  {timeframeLabels[timeframe]}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Dükkandan satılan altın ile müşteriden satın alınan (hurda/ziynet) altının gramaj, nakit ve personel dengesi.
              </p>
            </div>
          </div>
        </div>

        {/* 3 KOLONLU KARŞILAŞTIRMA KARTLARI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          
          {/* 1. SATILAN ALTIN (ÇIKIŞ) */}
          <div className="p-4 rounded-xl bg-[#151926] border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-400">
              <span className="flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-amber-400" />
                DÜKKANDAN SATILAN ALTIN
              </span>
              <span className="text-[10px] text-slate-400">{summary.count} Satış</span>
            </div>
            <div className="text-2xl font-bold font-display text-white">
              {comparison.soldGrams} <span className="text-sm font-mono text-amber-400 font-normal">gr</span>
            </div>
            <div className="pt-2 border-t border-[#22293d] flex items-center justify-between text-xs">
              <span className="text-slate-400">Satış Cirosu:</span>
              <span className="font-mono font-bold text-white">{summary.totalRevenue.toLocaleString('tr-TR')} ₺</span>
            </div>
          </div>

          {/* 2. SATIN ALINAN ALTIN (GİRİŞ) */}
          <div className="p-4 rounded-xl bg-[#151926] border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
              <span className="flex items-center gap-1.5">
                <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                MÜŞTERİDEN ALINAN ALTIN
              </span>
              <span className="text-[10px] text-slate-400">{purchaseMetrics.count} Alım</span>
            </div>
            <div className="text-2xl font-bold font-display text-white">
              {comparison.purchasedGrams} <span className="text-sm font-mono text-emerald-400 font-normal">gr</span>
            </div>
            <div className="pt-2 border-t border-[#22293d] flex items-center justify-between text-xs">
              <span className="text-slate-400">Kasadan Ödenen:</span>
              <span className="font-mono font-bold text-rose-400">{purchaseMetrics.totalAmountPaid.toLocaleString('tr-TR')} ₺</span>
            </div>
          </div>

          {/* 3. NET POZİSYON & NAKİT AKIŞI */}
          <div className="p-4 rounded-xl bg-[#151926] border border-blue-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-blue-400">
              <span className="flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-blue-400" />
                NET FİZİKİ &amp; KASA DENGESİ
              </span>
              <span className="text-[10px] text-slate-400">Net Pozisyon</span>
            </div>
            <div className="text-2xl font-bold font-display text-white flex items-baseline gap-1">
              <span className={parseFloat(comparison.netWeightBalance) >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                {parseFloat(comparison.netWeightBalance) >= 0 ? `+${comparison.netWeightBalance}` : comparison.netWeightBalance}
              </span>
              <span className="text-sm font-mono text-slate-300 font-normal">gr</span>
              <span className="text-[10px] text-slate-400 ml-1 font-sans">
                {parseFloat(comparison.netWeightBalance) >= 0 ? '(Kasaya Net Giriş)' : '(Dükkandan Net Çıkış)'}
              </span>
            </div>
            <div className="pt-2 border-t border-[#22293d] flex items-center justify-between text-xs">
              <span className="text-slate-400">Net Kasa Nakit Akışı:</span>
              <span className={`font-mono font-bold ${comparison.netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {comparison.netCashFlow >= 0 ? `+${comparison.netCashFlow.toLocaleString('tr-TR')}` : comparison.netCashFlow.toLocaleString('tr-TR')} ₺
              </span>
            </div>
          </div>

        </div>

        {/* PERSONEL KARŞILAŞTIRMA LİSTESİ */}
        {comparison.staffComparison.length > 0 && (
          <div className="pt-2">
            <div className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Personel Bazında Alım ve Satış Karşılaştırması (Kim Ne Sattı? Kim Ne Aldı?)</span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-[#242938]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#10131c] text-slate-400 text-[10px] uppercase border-b border-[#242938]">
                    <th className="py-2.5 px-3">Personel</th>
                    <th className="py-2.5 px-3 text-right">Satış (Adet / Gram)</th>
                    <th className="py-2.5 px-3 text-right">Satış Cirosu</th>
                    <th className="py-2.5 px-3 text-right">Alım (Adet / Gram)</th>
                    <th className="py-2.5 px-3 text-right">Alım Gideri</th>
                    <th className="py-2.5 px-3 text-right">Net Gram Katkısı</th>
                    <th className="py-2.5 px-3 text-right">Net Nakit Katkısı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2330]">
                  {comparison.staffComparison.map((st, i) => (
                    <tr key={i} className="hover:bg-[#181c28]">
                      <td className="py-2.5 px-3 font-semibold text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-amber-400" />
                        <span>{st.name}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        {st.salesCount} işlem ({st.salesGrams} gr)
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                        {st.salesRevenue.toLocaleString('tr-TR')} ₺
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        {st.purchasesCount} işlem ({st.purchasesGrams} gr)
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                        {st.purchasesPaid.toLocaleString('tr-TR')} ₺
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                        <span className={parseFloat(st.netGrams) >= 0 ? 'text-emerald-400' : 'text-slate-300'}>
                          {parseFloat(st.netGrams) >= 0 ? `+${st.netGrams}` : st.netGrams} gr
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        <span className={st.netCash >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {st.netCash >= 0 ? `+${st.netCash.toLocaleString('tr-TR')}` : st.netCash.toLocaleString('tr-TR')} ₺
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* GRAFİK DAĞILIMLARI (KATEGORİLER & ÖDEME YÖNTEMLERİ) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kategori Dağılımı Bar Grafiği */}
        <div className="p-5 rounded-2xl bg-[#12141c] border border-[#242938] space-y-3">
          <div className="flex items-center justify-between border-b border-[#242938] pb-2">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-amber-400" />
              <span>Ürün Kategorisi Ciro Dağılımı</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Tutar ve Oran</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {Object.keys(summary.catMap).length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">Bu dönemde kategori verisi yok.</div>
            ) : (
              Object.entries(summary.catMap).map(([cat, amt]) => {
                const pct = summary.totalRevenue > 0 ? ((amt / summary.totalRevenue) * 100).toFixed(1) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-200">{cat}</span>
                      <span className="font-mono text-amber-400 font-bold">
                        {amt.toLocaleString('tr-TR')} ₺ <span className="text-slate-400 text-[10px]">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#181c28] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500" 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Ödeme Yöntemleri Dağılımı */}
        <div className="p-5 rounded-2xl bg-[#12141c] border border-[#242938] space-y-3">
          <div className="flex items-center justify-between border-b border-[#242938] pb-2">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Ödeme Kanalları &amp; Kasa Dağılımı</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Nakit / Kart / Havale</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {Object.keys(summary.paymentMap).length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">Bu dönemde ödeme verisi yok.</div>
            ) : (
              Object.entries(summary.paymentMap).map(([method, amt]) => {
                const pct = summary.totalRevenue > 0 ? ((amt / summary.totalRevenue) * 100).toFixed(1) : 0;
                return (
                  <div key={method} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-200">{method}</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {amt.toLocaleString('tr-TR')} ₺ <span className="text-slate-400 text-[10px]">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#181c28] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500" 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* PERSONEL SATIŞ KARNESİ */}
      <div className="p-5 rounded-2xl bg-[#12141c] border border-[#242938] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-white">DÖNEMLİK PERSONEL PERFORMANS ANALİZİ</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Kim ne sattı karnesi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#181b26] text-slate-400 text-[10px] font-mono uppercase">
              <tr>
                <th className="p-2.5">Satış Danışmanı</th>
                <th className="p-2.5 text-center">Satış Adedi</th>
                <th className="p-2.5 text-center">Satılan Altın (gr)</th>
                <th className="p-2.5 text-right">Üretilen Ciro (₺)</th>
                <th className="p-2.5 text-right">Ciro Payı (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222736]">
              {Object.keys(summary.staffMap).length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-500">Personel satış verisi bulunmuyor.</td>
                </tr>
              ) : (
                Object.entries(summary.staffMap).map(([staff, data]) => {
                  const share = summary.totalRevenue > 0 ? ((data.revenue / summary.totalRevenue) * 100).toFixed(1) : 0;
                  return (
                    <tr key={staff} className="hover:bg-[#161a26] transition">
                      <td className="p-2.5 font-bold text-white flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-400" />
                        <span>{staff}</span>
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-slate-200">{data.count}</td>
                      <td className="p-2.5 text-center font-mono text-amber-400">{data.grams.toFixed(2)} gr</td>
                      <td className="p-2.5 text-right font-mono font-bold text-white">{data.revenue.toLocaleString('tr-TR')} ₺</td>
                      <td className="p-2.5 text-right font-mono text-emerald-400 font-bold">%{share}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAYLI SATIŞ FİŞLERİ TABLOSU */}
      <div className="p-5 rounded-2xl bg-[#12141c] border border-[#242938] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-white">DÖNEM İÇİ SATIŞ FİŞLERİ &amp; İŞLEM LİSTESİ</h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Kategori Filtresi */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#0e1017] border border-[#282f42] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
            >
              <option value="ALL">Tüm Kategoriler</option>
              <option value="Bilezik">Bilezik</option>
              <option value="Yüzük">Yüzük</option>
              <option value="Kolye">Kolye</option>
              <option value="Küpe">Küpe</option>
              <option value="Set">Set</option>
              <option value="Külçe / Has">Külçe / Has</option>
            </select>

            {/* Arama Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ürün, müşteri veya fiş ara..."
                className="bg-[#0e1017] border border-[#282f42] rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#181b26] text-slate-400 text-[10px] font-mono uppercase">
              <tr>
                <th className="p-2.5">Fiş / Fatura No</th>
                <th className="p-2.5">Mücevher</th>
                <th className="p-2.5">Ayar / Gram</th>
                <th className="p-2.5">Müşteri</th>
                <th className="p-2.5">Satış Danışmanı</th>
                <th className="p-2.5">Ödeme</th>
                <th className="p-2.5 text-right">Tutar (₺)</th>
                <th className="p-2.5 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222736]">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">
                    Seçilen filtre kriterlerine uygun satış bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredSales.map(s => (
                  <tr key={s.id} className="hover:bg-[#161a26] transition">
                    <td className="p-2.5 font-mono text-amber-400 font-bold">{s.invoice_no || `SE-${s.id}`}</td>
                    <td className="p-2.5 font-bold text-white">{s.product_name}</td>
                    <td className="p-2.5 font-mono text-slate-300">{s.purity} • {s.weight_grams} gr</td>
                    <td className="p-2.5 text-slate-200">{s.customer_name || 'Müşteri'}</td>
                    <td className="p-2.5 text-slate-300">{s.sold_by_name || 'Yetkili Personel'}</td>
                    <td className="p-2.5 font-mono text-slate-400">{s.payment_method || 'Kredi Kartı'}</td>
                    <td className="p-2.5 text-right font-display font-bold text-white">
                      {(parseFloat(s.sale_price) || 0).toLocaleString('tr-TR')} ₺
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => onFastSelectSaleForEmail && onFastSelectSaleForEmail(s)}
                        className="text-[11px] text-amber-400 hover:text-amber-300 underline font-semibold"
                      >
                        Sertifika
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* KALICI GÜN SONU / Z-RAPORU ARŞİVİ */}
      {dailyReportsArchive && dailyReportsArchive.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#12141c] border border-[#242938] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              <span>GEÇMİŞ Z-RAPORLARI &amp; KALICI GÜN SONU ARŞİVİ</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Veritabanında Arşivlenmiş Gün Sonları</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#181b26] text-slate-400 text-[10px] font-mono uppercase">
                <tr>
                  <th className="p-2.5">Kapanış Tarihi</th>
                  <th className="p-2.5">Toplam Ciro (₺)</th>
                  <th className="p-2.5">Satılan Has (gr)</th>
                  <th className="p-2.5">İşlem Adedi</th>
                  <th className="p-2.5">Net Kâr (₺)</th>
                  <th className="p-2.5">Kapatan Yetkili</th>
                  <th className="p-2.5">Açıklama / Not</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222736]">
                {dailyReportsArchive.map(rep => (
                  <tr key={rep.id} className="hover:bg-[#161a26] transition">
                    <td className="p-2.5 font-mono text-amber-400 font-bold">{rep.report_date}</td>
                    <td className="p-2.5 font-bold font-display text-white">{(rep.total_revenue || 0).toLocaleString('tr-TR')} ₺</td>
                    <td className="p-2.5 font-mono text-slate-300">{(rep.total_gold_grams_sold || 0).toFixed(2)} gr</td>
                    <td className="p-2.5 font-mono text-center text-slate-200">{rep.total_sales_count || 0}</td>
                    <td className="p-2.5 font-display font-bold text-emerald-400">+{(rep.net_profit || 0).toLocaleString('tr-TR')} ₺</td>
                    <td className="p-2.5 text-slate-300">{rep.closed_by_name || 'Yetkili'}</td>
                    <td className="p-2.5 text-slate-400 text-[11px] max-w-[200px] truncate">{rep.notes || 'Normal Kapanış'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
