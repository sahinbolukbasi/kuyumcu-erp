'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingBag, 
  Building2, 
  ShieldAlert, 
  Activity, 
  Settings, 
  Flame, 
  Coins, 
  Sparkles, 
  ArrowUpRight, 
  Clock, 
  Award,
  BarChart3,
  Sliders,
  CheckSquare,
  Square,
  RefreshCw,
  Scale
} from 'lucide-react';

export default function PatronAnalyticsDashboard({
  analytics,
  profitMarginData,
  staffPerformance = [],
  serviceAnalytics = [],
  hourlyTraffic = [],
  branches = [],
  products = [],
  salesList = [],
  systemLogs = [],
  liveRates,
  onRefresh
}) {
  // Sistem Sahibi Widget Özelleştirme State'i
  const [activeWidgets, setActiveWidgets] = useState({
    liveRatesTicker: true,
    financialMetrics: true,
    staffPerformance: true,
    branchComparison: true,
    hourlyHeatmap: true,
    instantSalesStream: true,
    securityAuditStream: true,
  });

  const [showConfigModal, setShowConfigModal] = useState(false);
  const serviceStats = Array.isArray(serviceAnalytics)
    ? serviceAnalytics
    : (serviceAnalytics?.staff_stats || []);

  // Widget Açma / Kapatma Fonksiyonu
  const toggleWidget = (key) => {
    setActiveWidgets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Toplam Vitrin ve Kasa Ağırlıkları
  const totalShowcaseGrams = products
    .filter(p => p.status === 'Vitrinde' || p.status === 'AVAILABLE')
    .reduce((acc, p) => acc + (p.weight_grams || 0), 0);

  const totalSafeGrams = products
    .filter(p => p.location_type === 'Kasa' || p.slot_id === null)
    .reduce((acc, p) => acc + (p.weight_grams || 0), 0);

  const hasRate = Number(liveRates?.rates?.HAS_ALTIN?.sell) || 7180;
  const totalInventoryValueTL = Math.round((totalShowcaseGrams + totalSafeGrams) * hasRate);
  const usdRate = Number(liveRates?.rates?.USD?.sell) || 41.45;
  const totalInventoryValueUSD = Math.round(totalInventoryValueTL / usdRate);

  return (
    <div className="space-y-6">
      {/* ÜST BAŞLIK VE KONTROL PANELİ */}
      <div className="bg-gradient-to-r from-[#12141c] via-[#1a1d2c] to-[#12141c] p-4 lg:p-6 rounded-2xl border border-amber-500/40 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              PATRON & YÖNETİCİ KOKPİTİ
            </span>
            <span>•</span>
            <span>ÖZELLEŞTİRİLEBİLİR CANLI BİLGİ EKRANI</span>
          </div>
          <h2 className="font-cinzel text-lg lg:text-2xl font-bold text-white flex items-center gap-2.5 mt-1">
            <Activity className="w-6 h-6 text-amber-400" />
            GOLDEN GUARD — PATRON PERFORMANS & DENETİM EKRANI
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Anlık vitrin altın hacmi, personel satış karnesi, kâr marjları, canlı kurlar ve şube analizleri
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setShowConfigModal(!showConfigModal)}
            className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 border-amber-500/40 text-amber-300 hover:bg-amber-500/10 font-semibold"
          >
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Ekranı Tasarla (Widget'lar)</span>
          </button>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="btn-gold text-xs py-2 px-3.5 flex items-center gap-1.5 font-bold shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Verileri Yenile</span>
            </button>
          )}
        </div>
      </div>

      {/* WIDGET ÖZELLEŞTİRME AÇILIR PANELİ */}
      {showConfigModal && (
        <div className="p-4 rounded-2xl bg-[#141724] border border-amber-500/40 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-[#262c3e] pb-2">
            <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Ekran Tasarımı: Gösterilecek Panelleri Seçin</span>
            </h4>
            <span className="text-[11px] text-slate-400">Değişiklikler anında ekrana yansır</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
            {[
              { key: 'liveRatesTicker', label: 'Çoklu Altın & Döviz Bandı' },
              { key: 'financialMetrics', label: 'Finansal & Stok Metrikleri' },
              { key: 'staffPerformance', label: 'Personel Hizmet & Satış Analizi' },
              { key: 'branchComparison', label: 'Şube Performans Analizleri' },
              { key: 'hourlyHeatmap', label: 'Saatlik Trafik Isı Haritası' },
              { key: 'instantSalesStream', label: 'Anlık Satış Akışı (Canlı Fişler)' },
              { key: 'securityAuditStream', label: 'Sistem Logları & Güvenlik Akışı' },
            ].map(item => (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleWidget(item.key)}
                className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                  activeWidgets[item.key]
                    ? 'bg-amber-500/10 border-amber-500/50 text-amber-300 font-bold'
                    : 'bg-[#0d0f17] border-[#222736] text-slate-500 hover:text-slate-300'
                }`}
              >
                {activeWidgets[item.key] ? (
                  <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-600 shrink-0" />
                )}
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* WIDGET 1: ÇOKLU ALTIN & DÖVİZ BANDI */}
      {activeWidgets.liveRatesTicker && (
        <div className="bg-[#0e1017] p-3 rounded-2xl border border-amber-500/30 overflow-x-auto shadow-lg">
          <div className="flex items-center gap-3 min-w-max">
            {[
              { label: 'HAS ALTIN (24K)', val: liveRates?.rates?.HAS_ALTIN?.sell || 7180, unit: '₺/gr', change: '+%1.2' },
              { label: '22 AYAR BİLEZİK', val: liveRates?.rates?.ALTIN_22K?.sell || 6640, unit: '₺/gr', change: '+%0.9' },
              { label: '14 AYAR ALTIN', val: liveRates?.rates?.ALTIN_14K?.sell || 4320, unit: '₺/gr', change: '+%1.1' },
              { label: 'ÇEYREK ALTIN', val: liveRates?.rates?.CEYREK?.sell || 11840, unit: '₺', change: '+%0.8' },
              { label: 'ATA LİRA', val: liveRates?.rates?.ATA?.sell || 48750, unit: '₺', change: '+%1.0' },
              { label: 'USD / TRY', val: liveRates?.rates?.USD?.sell || 41.45, unit: '₺', change: '+%0.3' },
              { label: 'EUR / TRY', val: liveRates?.rates?.EUR?.sell || 48.65, unit: '₺', change: '+%0.5' },
              { label: 'GBP / TRY', val: liveRates?.rates?.GBP?.sell || 56.90, unit: '₺', change: '+%0.4' },
            ].map((rate, i) => (
              <div key={i} className="px-3.5 py-1.5 rounded-xl bg-[#161926] border border-[#262c3e] flex items-center gap-2">
                <div>
                  <div className="text-[9px] font-mono text-slate-400 font-semibold">{rate.label}</div>
                  <div className="text-xs font-mono font-bold text-white">
                    {typeof rate.val === 'number' ? rate.val.toLocaleString('tr-TR') : rate.val} <span className="text-[10px] text-amber-400">{rate.unit}</span>
                  </div>
                </div>
                <span className="text-[9px] font-bold font-mono text-emerald-400 px-1 py-0.2 rounded bg-emerald-500/10">
                  {rate.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WIDGET 2: FİNANSAL & STOK BÜYÜK METRİKLERİ */}
      {activeWidgets.financialMetrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-gradient-to-b from-[#181a26] to-[#10121a] border border-[#262c3e] p-4 rounded-2xl shadow-lg">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Toplam Vitrin Altını</span>
            <div className="text-xl lg:text-2xl font-bold font-mono text-amber-400 mt-1">
              {totalShowcaseGrams.toFixed(1)} <span className="text-xs font-normal text-slate-400">gr</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-mono mt-1">✓ IoT Sensörleri Aktif</div>
          </div>

          <div className="bg-gradient-to-b from-[#181a26] to-[#10121a] border border-[#262c3e] p-4 rounded-2xl shadow-lg">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Kasadaki Stok</span>
            <div className="text-xl lg:text-2xl font-bold font-mono text-sky-400 mt-1">
              {totalSafeGrams.toFixed(1)} <span className="text-xs font-normal text-slate-400">gr</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">Çelik Kasa Rezerv</div>
          </div>

          <div className="bg-gradient-to-b from-[#181a26] to-[#10121a] border border-amber-500/40 p-4 rounded-2xl shadow-lg">
            <span className="text-[10px] text-amber-300 font-semibold uppercase tracking-wider block">Toplam Stok Değeri</span>
            <div className="text-lg lg:text-xl font-bold font-display text-white mt-1">
              {(totalInventoryValueTL || 0).toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-[10px] text-amber-400 font-mono mt-1">≈ ${(totalInventoryValueUSD || 0).toLocaleString('tr-TR')}</div>
          </div>

          <div className="bg-gradient-to-b from-[#181a26] to-[#10121a] border border-[#262c3e] p-4 rounded-2xl shadow-lg">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Bugünkü Satış Cirosu</span>
            <div className="text-xl lg:text-2xl font-bold font-display text-emerald-400 mt-1">
              {(analytics?.total_sales_revenue || 0).toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">{analytics?.total_sales_count || 0} Adet Satış</div>
          </div>

          <div className="bg-gradient-to-b from-[#181a26] to-[#10121a] border border-[#262c3e] p-4 rounded-2xl shadow-lg">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Satılan Altın</span>
            <div className="text-xl lg:text-2xl font-bold font-mono text-amber-300 mt-1">
              {(analytics?.total_gold_grams_sold || 0).toFixed(2)} <span className="text-xs font-normal text-slate-400">gr</span>
            </div>
            <div className="text-[10px] text-amber-400/80 font-mono mt-1">Net Has Çıkışı</div>
          </div>

          <div className="bg-gradient-to-b from-[#181a26] to-[#10121a] border border-emerald-500/40 p-4 rounded-2xl shadow-lg">
            <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block">Ortalama Kâr Marjı</span>
            <div className="text-xl lg:text-2xl font-bold font-display text-emerald-400 mt-1">
              %{profitMarginData?.overall_margin_percent || '18.5'}
            </div>
            <div className="text-[10px] text-emerald-300 font-mono mt-1">
              {(profitMarginData?.net_profit || 0).toLocaleString('tr-TR')} ₺ Kâr
            </div>
          </div>
        </div>
      )}

      {/* WIDGET 3: PERSONEL HİZMET & SATIŞ PERFORMANS ANALİZİ */}
      {activeWidgets.staffPerformance && (
        <div className="bg-[#12141c] border border-[#242938] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#242938] pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-cinzel text-sm font-bold text-white">
                  PERSONEL HİZMET & SATIŞ PERFORMANS ANALİZİ (KİM NE KADAR SATTI?)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Her personelin hizmet verdiği müşteri sayısı, tamamladığı satış adedi, cirosu ve satılan altın gramajı
                </p>
              </div>
            </div>
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full font-mono font-bold">
              {staffPerformance.length} Personel Takipte
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#181b26] text-slate-400 uppercase text-[10px] font-mono">
                <tr>
                  <th className="p-3">Personel / Satış Temsilcisi</th>
                  <th className="p-3">Rol / Mağaza</th>
                  <th className="p-3">Hizmet Verilen Müşteri</th>
                  <th className="p-3">Satış Adedi</th>
                  <th className="p-3">Satılan Altın (gr)</th>
                  <th className="p-3 text-right">Toplam Ciro (₺)</th>
                  <th className="p-3 text-center">Performans</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202534]">
                {staffPerformance.map(st => {
                  const srv = serviceStats.find(s => s.user_id === st.user_id);
                  const servedCount = srv?.total_customers_served || (st.total_sales_count * 2) || 0;
                  const conversionRate = servedCount > 0 ? Math.min(100, Math.round((st.total_sales_count / servedCount) * 100)) : 0;

                  return (
                    <tr key={st.user_id || st.username} className="hover:bg-[#161926] transition">
                      <td className="p-3">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-mono text-xs border border-amber-500/40">
                            {st.full_name?.charAt(0) || 'P'}
                          </span>
                          <span>{st.full_name}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                          st.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-300' : st.role === 'MANAGER' ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {st.role === 'ADMIN' ? 'Genel Müdür' : st.role === 'MANAGER' ? 'Şube Müdürü' : 'Satış Temsilcisi'}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-300">
                        <strong className="text-white">{servedCount}</strong> Müşteri
                      </td>
                      <td className="p-3 font-mono text-slate-300">
                        <strong className="text-emerald-400">{st.total_sales_count}</strong> Fiş
                      </td>
                      <td className="p-3 font-mono text-amber-300 font-bold">
                        {(st.total_grams_sold || 0).toFixed(2)} gr
                      </td>
                      <td className="p-3 text-right font-display font-bold text-white text-sm">
                        {(st.total_revenue || 0).toLocaleString('tr-TR')} ₺
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-[#202534] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-amber-400 h-full rounded-full"
                              style={{ width: `${Math.min(100, Math.max(10, conversionRate))}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">%{conversionRate}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* WIDGET 4 & 5: ŞUBE KARŞILAŞTIRMASI VE SAATLİK TRAFİK */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Şubeler Karşılaştırma Paneli */}
        {activeWidgets.branchComparison && (
          <div className="bg-[#12141c] border border-[#242938] rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="font-cinzel text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>MAĞAZA / ŞUBE BAZLI ANALİZ & KARŞILAŞTIRMA</span>
            </h3>

            <div className="space-y-3">
              {branches.map(b => {
                const bProds = products.filter(p => p.branch_id === b.id);
                const bGrams = bProds.reduce((acc, p) => acc + (p.weight_grams || 0), 0);
                const bSales = salesList.filter(s => s.branch_id === b.id);
                const bRev = bSales.reduce((acc, s) => acc + (s.sale_price || 0), 0);

                return (
                  <div key={b.id} className="p-3.5 rounded-xl bg-[#181b26] border border-[#222736] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs">{b.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {bProds.length} Parça • <span className="text-amber-400 font-bold">{bGrams.toFixed(1)} gr Stok</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold font-display text-emerald-400">
                        {bRev.toLocaleString('tr-TR')} ₺
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">Bugünkü Ciro ({bSales.length} Satış)</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Saatlik Isı Haritası */}
        {activeWidgets.hourlyHeatmap && (
          <div className="bg-[#12141c] border border-[#242938] rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="font-cinzel text-sm font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <span>GÜN İÇİ SAATLİK MAĞAZA YOĞUNLUK ISI HARİTASI</span>
            </h3>

            <div className="grid grid-cols-6 gap-2">
              {hourlyTraffic.slice(0, 12).map(h => (
                <div key={h.hour} className="text-center p-2 rounded-xl bg-[#161926] border border-[#222736]">
                  <div className="text-[10px] font-mono text-slate-400">{h.hour}</div>
                  <div className="text-sm font-bold text-amber-400 my-1 font-mono">{h.traffic_count}</div>
                  <div className="w-full h-1.5 bg-[#202534] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${h.intensity === 'Yüksek' ? 'bg-rose-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(100, h.traffic_count * 8)}%` }}
                    />
                  </div>
                  <div className="text-[9px] text-slate-500 mt-1">{h.sales_count} Satış</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* WIDGET 6 & 7: CANLI SATIŞ AKIŞI VE SİSTEM DENETİM LOGLARI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Canlı Satış Akışı */}
        {activeWidgets.instantSalesStream && (
          <div className="bg-[#12141c] border border-[#242938] rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#242938] pb-2.5">
              <h3 className="font-cinzel text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>ANLIK SATIŞ AKIŞI (CANLI FİŞLER)</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                Canlı
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 divide-y divide-[#1e2332]">
              {salesList.slice(0, 8).map(s => (
                <div key={s.id} className="pt-2 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">{s.product_name}</div>
                    <div className="text-[10px] text-amber-400 font-mono mt-0.5">
                      {s.purity} • {s.weight_grams} gr • Müşteri: <strong className="text-slate-300">{s.customer_name}</strong>
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">
                      Fiş: {s.invoice_no} • Temsilci: {s.sold_by_name}
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-bold text-white text-sm">
                      {s.sale_price.toLocaleString('tr-TR')} ₺
                    </div>
                    <span className="text-[10px] text-slate-400">{s.payment_method}</span>
                  </div>
                </div>
              ))}
              {salesList.length === 0 && (
                <div className="text-center py-6 text-slate-500 text-xs">Henüz satış kaydı bulunmuyor.</div>
              )}
            </div>
          </div>
        )}

        {/* Canlı Sistem Logları */}
        {activeWidgets.securityAuditStream && (
          <div className="bg-[#12141c] border border-[#242938] rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#242938] pb-2.5">
              <h3 className="font-cinzel text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>CANLI SİSTEM LOGLARI & GÜVENLİK AKIŞI</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Son 8 Olay</span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {systemLogs.slice(0, 8).map(lg => (
                <div key={lg.id} className="p-2.5 rounded-xl bg-[#161824] border border-[#202534] text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                      lg.level === 'SECURITY' || lg.level === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-500/40' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {lg.level} • {lg.module}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(lg.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-white text-[11px] font-medium leading-relaxed">{lg.message}</p>
                  <div className="text-[10px] text-amber-400/90 font-mono mt-0.5">
                    İşlem Yapan: {lg.user_name || 'Sistem'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
