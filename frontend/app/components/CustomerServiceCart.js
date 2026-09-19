'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Minus,
  ShoppingBag,
  Send,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  TrendingUp,
  DollarSign,
  Scale,
  Coins,
  Calendar,
  Bell,
  Bookmark,
  X,
  ArrowRight,
  Percent,
  Calculator,
  Activity,
  BarChart3,
  Eye,
  Heart,
  ThumbsDown,
  HelpCircle,
  Flame
} from 'lucide-react';

export default function CustomerServiceCart({
  currentUser,
  apiBase,
  token,
  products = [],
  liveRates,
  onRefresh
}) {
  const effectiveApiBase = apiBase || (typeof window !== 'undefined' ? (window.location.hostname === 'localhost' ? 'http://localhost:8000' : window.location.origin) : '');

  // Sepet State
  const [activeCart, setActiveCart] = useState(null);
  const [cartHistory, setCartHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [actionError, setActionError] = useState('');

  // Ürün Ekleme
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [cartQuantity, setCartQuantity] = useState(1);
  const [customerReaction, setCustomerReaction] = useState('');

  // Müşteri Bilgileri
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerWish, setCustomerWish] = useState('');
  const [cartNotes, setCartNotes] = useState('');

  // Hatırlatıcı
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderNote, setReminderNote] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');

  // Talep
  const [showDemandModal, setShowDemandModal] = useState(false);
  const [demandModel, setDemandModel] = useState('');
  const [demandCategory, setDemandCategory] = useState('Bilezik');
  const [demandPurity, setDemandPurity] = useState('22K');
  const [demandBudget, setDemandBudget] = useState('');
  const [demandUrgent, setDemandUrgent] = useState(false);

  // Satışa Dönüştürme
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Kredi Kartı');
  const [saleItems, setSaleItems] = useState([]);
  const [converting, setConverting] = useState(false);

  // Sepet Analitik
  const [cartMetrics, setCartMetrics] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Aktif Sepeti Çek
  const fetchActiveCart = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${effectiveApiBase}/api/v1/cart/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveCart(data);
        if (data) {
          setCustomerName(data.customer_name || '');
          setCustomerPhone(data.customer_phone || '');
          setCustomerEmail(data.customer_email || '');
          setCustomerWish(data.customer_wish || '');
          setCartNotes(data.notes || '');
        }
      }
    } catch (e) {
      console.error("Aktif sepet hatası", e);
    }
  };

  // Sepet Geçmişi
  const fetchCartHistory = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${effectiveApiBase}/api/v1/cart?limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setCartHistory(await res.json());
    } catch (e) {}
  };

  // Sepet Analitiği
  const fetchCartMetrics = async () => {
    if (!token || currentUser?.role !== 'ADMIN') return;
    try {
      const res = await fetch(`${effectiveApiBase}/api/v1/cart/analytics/metrics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setCartMetrics(await res.json());
    } catch (e) {}
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchActiveCart(), fetchCartHistory()]).finally(() => setLoading(false));
  }, [token]);

  // Sepet Oluştur
  const handleCreateCart = async () => {
    if (!token) return;
    setActionError('');
    try {
      const res = await fetch(`${effectiveApiBase}/api/v1/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customer_name: customerName || undefined,
          customer_phone: customerPhone || undefined,
          customer_email: customerEmail || undefined,
          customer_wish: customerWish || undefined,
          notes: cartNotes || undefined
        })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveCart(data);
        setActionMsg('✅ Yeni sepet oluşturuldu!');
        setTimeout(() => setActionMsg(''), 3000);
      } else {
        const err = await res.json();
        setActionError(err.detail || 'Sepet oluşturma hatası');
      }
    } catch (e) {
      setActionError('Sunucu hatası: ' + e.message);
    }
  };

  // Sepete Ürün Ekle
  const handleAddToCart = async () => {
    if (!token || !activeCart || !selectedProduct) return;
    setActionError('');
    try {
      const res = await fetch(`${effectiveApiBase}/api/v1/cart/${activeCart.id}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          variant_id: selectedVariant?.id || null,
          quantity: cartQuantity,
          discount_amount: 0,
          customer_reaction: customerReaction || null,
          inspection_seconds: 0
        })
      });
      if (res.ok) {
        await fetchActiveCart();
        setShowAddProduct(false);
        setSelectedProduct(null);
        setSelectedVariant(null);
        setCartQuantity(1);
        setCustomerReaction('');
        setActionMsg(`✅ ${selectedProduct.name} sepete eklendi!`);
        setTimeout(() => setActionMsg(''), 3000);
      } else {
        const err = await res.json();
        setActionError(err.detail || 'Ürün ekleme hatası');
      }
    } catch (e) {
      setActionError('Sunucu hatası: ' + e.message);
    }
  };

  // Sepetten Ürün Çıkar
  const handleRemoveItem = async (itemId) => {
    if (!token || !activeCart) return;
    try {
      const res = await fetch(`${effectiveApiBase}/api/v1/cart/${activeCart.id}/items/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchActiveCart();
        setActionMsg('✅ Ürün sepetten çıkarıldı.');
        setTimeout(() => setActionMsg(''), 3000);
      }
    } catch (e) {}
  };

  // Sepeti Güncelle
  const handleUpdateCart = async () => {
    if (!token || !activeCart) return;
    try {
      await fetch(`${effectiveApiBase}/api/v1/cart/${activeCart.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          customer_wish: customerWish,
          notes: cartNotes
        })
      });
      await fetchActiveCart();
    } catch (e) {}
  };

  // Sepeti Satışa Dönüştür
  const handleConvertToSale = async () => {
    if (!token || !activeCart) return;
    setConverting(true);
    setActionError('');
    try {
      const res = await fetch(`${effectiveApiBase}/api/v1/cart/${activeCart.id}/convert-to-sale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          payment_method: paymentMethod,
          item_ids: saleItems.length > 0 ? saleItems : null
        })
      });
      if (res.ok) {
        const data = await res.json();
        setActionMsg(`✅ ${data.sales?.length || 0} ürün satıldı! Toplam: ${data.total_revenue?.toLocaleString('tr-TR')} ₺`);
        setShowSaleModal(false);
        await fetchActiveCart();
        await fetchCartHistory();
        setTimeout(() => setActionMsg(''), 5000);
      } else {
        const err = await res.json();
        setActionError(err.detail || 'Satış hatası');
      }
    } catch (e) {
      setActionError('Sunucu hatası: ' + e.message);
    } finally {
      setConverting(false);
    }
  };

  // Sepeti Kapat
  const handleCloseCart = async () => {
    if (!token || !activeCart) return;
    if (!confirm('Sepeti kapatmak istediğinize emin misiniz?')) return;
    try {
      await fetch(`${effectiveApiBase}/api/v1/cart/${activeCart.id}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'CLOSED' })
      });
      setActiveCart(null);
      setActionMsg('✅ Sepet kapatıldı.');
      fetchCartHistory();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (e) {}
  };

  // Hatırlatıcı Oluştur
  const handleCreateReminder = async () => {
    if (!token || !reminderTitle || !reminderDate) {
      setActionError('Başlık ve tarih zorunludur.');
      return;
    }
    try {
      const reminderDateTime = `${reminderDate}T${reminderTime || '09:00'}:00`;
      const res = await fetch(`${effectiveApiBase}/api/v1/cart/reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cart_id: activeCart?.id || null,
          customer_name: customerName || undefined,
          customer_phone: customerPhone || undefined,
          title: reminderTitle,
          note: reminderNote || undefined,
          reminder_date: reminderDateTime
        })
      });
      if (res.ok) {
        setShowReminderModal(false);
        setReminderTitle('');
        setReminderNote('');
        setActionMsg('🔔 Hatırlatıcı oluşturuldu!');
        setTimeout(() => setActionMsg(''), 3000);
      } else {
        const err = await res.json();
        setActionError(err.detail || 'Hatırlatıcı hatası');
      }
    } catch (e) {
      setActionError('Sunucu hatası');
    }
  };

  // Talep Kaydet
  const handleCreateDemand = async () => {
    if (!token || !demandModel) {
      setActionError('Model adı zorunludur.');
      return;
    }
    try {
      const res = await fetch(`${effectiveApiBase}/api/v1/cart/demands`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cart_id: activeCart?.id || null,
          customer_name: customerName || undefined,
          customer_phone: customerPhone || undefined,
          requested_model: demandModel,
          category: demandCategory,
          purity: demandPurity,
          approx_budget: demandBudget ? parseFloat(demandBudget) : undefined,
          is_urgent: demandUrgent
        })
      });
      if (res.ok) {
        setShowDemandModal(false);
        setDemandModel('');
        setActionMsg('📝 Talep kaydedildi!');
        setTimeout(() => setActionMsg(''), 3000);
      } else {
        const err = await res.json();
        setActionError(err.detail || 'Talep hatası');
      }
    } catch (e) {
      setActionError('Sunucu hatası');
    }
  };

  // Filtrelenmiş ürünler
  const filteredProducts = useMemo(() => {
    if (!productSearch) return products;
    const q = productSearch.toLowerCase();
    return products.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.barcode?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  // Sepet süresi
  const cartDuration = useMemo(() => {
    if (!activeCart?.started_at) return '0 dk';
    const start = new Date(activeCart.started_at);
    const diff = (Date.now() - start.getTime()) / 60000;
    return `${Math.round(diff)} dk`;
  }, [activeCart]);

  // Has altın kuru
  const hasRate = liveRates?.rates?.HAS_ALTIN?.sell || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
        <span className="ml-3 text-slate-400 text-sm">Sepet yükleniyor...</span>
      </div>
    );
  }

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
      <div className="bg-gradient-to-r from-[#12141c] via-[#1a1d2c] to-[#12141c] p-4 lg:p-6 rounded-2xl border border-amber-500/40 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block mr-1.5"></span>
                MÜŞTERİ HİZMET & SEPET SİSTEMİ
              </div>
              <h2 className="font-cinzel text-lg lg:text-2xl font-bold text-white mt-1">
                {activeCart ? `🛒 SEPET #${activeCart.cart_code}` : 'MÜŞTERİ SEPETİ'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeCart
                  ? `${activeCart.items?.length || 0} ürün • ${cartDuration} • ${activeCart.total_payable_amount?.toLocaleString('tr-TR')} ₺`
                  : 'Henüz aktif sepet yok. Yeni sepet açarak müşteri hizmetine başlayın.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={() => { setShowAnalytics(!showAnalytics); if (!showAnalytics) fetchCartMetrics(); }}
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  showAnalytics ? 'bg-amber-500 text-slate-950' : 'bg-[#1e202b] text-slate-300 hover:text-white border border-[#242938]'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Analitik
              </button>
            )}
            {!activeCart && (
              <button
                onClick={handleCreateCart}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs flex items-center gap-2 transition active:scale-95 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Yeni Sepet Aç
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SEPET ANALİTİĞİ (Admin) */}
      {showAnalytics && cartMetrics && (
        <div className="bg-[#12141c] border border-amber-500/30 rounded-2xl p-4">
          <h3 className="font-cinzel text-sm font-bold text-white flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            SEPET ANALİTİĞİ
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-[#0e1017] border border-[#242938]">
              <div className="text-slate-400">Aktif Sepet</div>
              <div className="text-lg font-bold text-white">{cartMetrics.total_active_carts}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0e1017] border border-[#242938]">
              <div className="text-slate-400">Dönüşüm</div>
              <div className="text-lg font-bold text-emerald-400">%{cartMetrics.conversion_rate}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0e1017] border border-[#242938]">
              <div className="text-slate-400">Ort. Sepet</div>
              <div className="text-lg font-bold text-amber-400">{cartMetrics.average_cart_value?.toLocaleString('tr-TR')} ₺</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0e1017] border border-[#242938]">
              <div className="text-slate-400">Ort. Süre</div>
              <div className="text-lg font-bold text-white">{cartMetrics.average_service_minutes} dk</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0e1017] border border-[#242938]">
              <div className="text-slate-400">Hatırlatıcı</div>
              <div className="text-lg font-bold text-sky-400">{cartMetrics.active_reminders_today}</div>
            </div>
          </div>

          {/* En çok sepete eklenen */}
          {cartMetrics.most_added_products?.length > 0 && (
            <div className="mt-3">
              <div className="text-[11px] text-slate-400 font-semibold mb-1">🔥 En Popüler Sepet Ürünleri</div>
              <div className="flex flex-wrap gap-1.5">
                {cartMetrics.most_added_products.slice(0, 5).map((p, i) => (
                  <span key={i} className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px]">
                    {p.product_name} ({p.count}x)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Kaçırılan fırsatlar */}
          {cartMetrics.missed_opportunities?.length > 0 && (
            <div className="mt-2">
              <div className="text-[11px] text-rose-400 font-semibold mb-1">❌ Kaçırılan Fırsatlar (Sepete Eklendi Ama Satılmadı)</div>
              <div className="flex flex-wrap gap-1.5">
                {cartMetrics.missed_opportunities.slice(0, 5).map((m, i) => (
                  <span key={i} className="px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px]">
                    {m.product_name} ({m.count}x - {m.potential_revenue?.toLocaleString('tr-TR')} ₺)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ANA İÇERİK: Aktif Sepet vs Geçmiş */}
      {activeCart ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SOL: Müşteri Bilgileri & İşlemler */}
          <div className="lg:col-span-1 space-y-4">
            {/* Müşteri Kartı */}
            <div className="luxury-card p-4 border-amber-500/30">
              <h3 className="font-cinzel text-sm font-bold text-white flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-amber-400" />
                MÜŞTERİ BİLGİLERİ
              </h3>
              <div className="space-y-2">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  onBlur={handleUpdateCart}
                  placeholder="Müşteri Adı"
                  className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  onBlur={handleUpdateCart}
                  placeholder="Telefon"
                  className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  onBlur={handleUpdateCart}
                  placeholder="E-posta"
                  className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <textarea
                  value={customerWish}
                  onChange={(e) => setCustomerWish(e.target.value)}
                  onBlur={handleUpdateCart}
                  placeholder="Müşteri İsteği / Özel Not..."
                  rows={2}
                  className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>
            </div>

            {/* Hızlı İşlemler */}
            <div className="luxury-card p-4 border-amber-500/30">
              <h3 className="font-cinzel text-sm font-bold text-white flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                HIZLI İŞLEMLER
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ürün Ekle
                </button>
                <button
                  onClick={() => setShowSaleModal(true)}
                  disabled={!activeCart.items?.length}
                  className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Sepeti Satışa Dönüştür
                </button>
                <button
                  onClick={() => setShowReminderModal(true)}
                  className="w-full py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Bell className="w-3.5 h-3.5" />
                  Hatırlatıcı Oluştur
                </button>
                <button
                  onClick={() => setShowDemandModal(true)}
                  className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  Talep / Eksik Model Kaydet
                </button>
                <button
                  onClick={handleCloseCart}
                  className="w-full py-2 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <X className="w-3.5 h-3.5" />
                  Sepeti Kapat
                </button>
              </div>
            </div>

            {/* Canlı Kur Bilgisi */}
            <div className="luxury-card p-4 border-amber-500/30">
              <div className="flex items-center justify-between">
                <div className="text-[11px] text-slate-400">Has Altın (995)</div>
                <div className="text-sm font-bold text-amber-400 font-mono">
                  {hasRate ? `${hasRate.toLocaleString('tr-TR')} ₺` : 'Yükleniyor...'}
                </div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <div className="text-[11px] text-slate-400">Sepet Süresi</div>
                <div className="text-sm font-bold text-white font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  {cartDuration}
                </div>
              </div>
            </div>
          </div>

          {/* SAĞ: Sepet İçeriği */}
          <div className="lg:col-span-2 space-y-3">
            <div className="luxury-card p-4 border-amber-500/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-cinzel text-sm font-bold text-white flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-amber-400" />
                  SEPET İÇERİĞİ ({activeCart.items?.length || 0} Ürün)
                </h3>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">Toplam</div>
                  <div className="text-lg font-bold text-amber-400 font-mono">
                    {activeCart.total_payable_amount?.toLocaleString('tr-TR')} ₺
                  </div>
                </div>
              </div>

              {(!activeCart.items || activeCart.items.length === 0) ? (
                <div className="text-center p-8 bg-[#0e1017] rounded-xl border border-[#242938]">
                  <ShoppingCart className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                  <p className="text-slate-400 text-xs">Sepet boş. "Ürün Ekle" butonuna tıklayarak ürün ekleyin.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeCart.items.map((item) => (
                    <div key={item.id} className={`p-3 rounded-xl border transition ${
                      item.is_sold
                        ? 'bg-emerald-950/30 border-emerald-500/40'
                        : 'bg-[#0e1017] border-[#242938] hover:border-amber-500/40'
                    }`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white truncate">{item.product_name}</span>
                            {item.is_sold && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">SATILDI</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {item.purity} • {item.weight_grams}g • {item.quantity} adet
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-white font-mono">{item.line_total?.toLocaleString('tr-TR')} ₺</span>
                            {item.discount_amount > 0 && (
                              <span className="text-[10px] text-rose-400">-%{item.discount_amount}</span>
                            )}
                            {item.customer_reaction && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                item.customer_reaction === 'BEGENDI' ? 'bg-emerald-500/20 text-emerald-300' :
                                item.customer_reaction === 'FIYAT_YUKSEK' ? 'bg-rose-500/20 text-rose-300' :
                                'bg-slate-500/20 text-slate-300'
                              }`}>
                                {item.customer_reaction === 'BEGENDI' ? '👍 Beğendi' :
                                 item.customer_reaction === 'FIYAT_YUKSEK' ? '💰 Fiyat Yüksek' :
                                 item.customer_reaction === 'KARARSIZ' ? '🤔 Kararsız' :
                                 item.customer_reaction === 'BEGENMEDI' ? '👎 Beğenmedi' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                        {!item.is_sold && (
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sepet Özeti */}
              {activeCart.items?.length > 0 && (
                <div className="mt-3 p-3 rounded-xl bg-[#0e1017] border border-[#242938] text-xs space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>KDV Hariç Toplam</span>
                    <span>{activeCart.total_gross_amount?.toLocaleString('tr-TR')} ₺</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>KDV (%20 İşçilik)</span>
                    <span>{activeCart.total_vat_amount?.toLocaleString('tr-TR')} ₺</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Altın KDV İstisnası</span>
                    <span className="text-emerald-400">{activeCart.total_vat_exempt_amount?.toLocaleString('tr-TR')} ₺</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-amber-400 border-t border-[#242938] pt-1 mt-1">
                    <span>Ödenecek Toplam</span>
                    <span>{activeCart.total_payable_amount?.toLocaleString('tr-TR')} ₺</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Geçmiş Sepetler */
        <div className="space-y-3">
          <h3 className="font-cinzel text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            GEÇMİŞ SEPETLER
          </h3>
          {cartHistory.length === 0 ? (
            <div className="text-center p-12 bg-[#12141c] rounded-xl border border-[#242938]">
              <ShoppingCart className="w-12 h-12 mx-auto text-slate-600 mb-2" />
              <p className="text-slate-400 text-sm">Henüz sepet kaydı bulunmuyor.</p>
              <p className="text-slate-500 text-xs mt-1">Yeni bir sepet açarak müşteri hizmetine başlayın.</p>
            </div>
          ) : (
            cartHistory.map((cart) => (
              <div key={cart.id} className="bg-[#12141c] border border-[#242938] rounded-xl p-3.5 hover:border-amber-500/30 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{cart.cart_code}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          cart.status === 'CONVERTED' ? 'bg-emerald-500/20 text-emerald-300' :
                          cart.status === 'ABANDONED' ? 'bg-rose-500/20 text-rose-300' :
                          'bg-slate-500/20 text-slate-300'
                        }`}>
                          {cart.status === 'CONVERTED' ? 'SATILDI' : cart.status === 'ABANDONED' ? 'TERK' : 'KAPALI'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5">
                        {cart.customer_name || 'Müşteri'} • {cart.user_name}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                        <span>{cart.items?.length || 0} ürün</span>
                        <span className="font-bold text-amber-400">{cart.total_payable_amount?.toLocaleString('tr-TR')} ₺</span>
                        <span>{cart.duration_minutes} dk</span>
                        <span>{new Date(cart.created_at).toLocaleDateString('tr-TR')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ================= MODAL: Ürün Ekle ================= */}
      {showAddProduct && (
        <div className="modal-overlay" onClick={() => setShowAddProduct(false)}>
          <div className="modal-content max-w-lg border-amber-500/50 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#242938] mb-4">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <h3 className="font-cinzel text-base font-bold text-white">Sepete Ürün Ekle</h3>
              </div>
              <button onClick={() => setShowAddProduct(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Ürün adı veya barkod ile ara..."
                  className="w-full bg-[#0e1017] border border-[#242938] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5">
                {filteredProducts.filter(p => p.status === 'Vitrinde' || p.status === 'AVAILABLE').map((p) => (
                  <div
                    key={p.id}
                    onClick={() => { setSelectedProduct(p); setSelectedVariant(null); }}
                    className={`p-2.5 rounded-lg border cursor-pointer transition text-xs ${
                      selectedProduct?.id === p.id
                        ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                        : 'bg-[#0e1017] border-[#242938] text-slate-300 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{p.name}</span>
                      <span className="font-mono text-amber-400">{p.price?.toLocaleString('tr-TR')} ₺</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {p.category} • {p.purity} • {p.weight_grams}g • {p.barcode}
                    </div>
                    {/* Varyantlar */}
                    {p.variants?.length > 0 && selectedProduct?.id === p.id && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {p.variants.map(v => (
                          <button
                            key={v.id}
                            onClick={(e) => { e.stopPropagation(); setSelectedVariant(v); }}
                            className={`px-2 py-0.5 rounded text-[10px] border transition ${
                              selectedVariant?.id === v.id
                                ? 'bg-amber-500/30 border-amber-500 text-amber-200'
                                : 'bg-[#1a1d2c] border-[#242938] text-slate-400 hover:border-amber-500'
                            }`}
                          >
                            {v.color} • {v.weight_grams}g
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {selectedProduct && (
                <div className="p-3 rounded-xl bg-[#0e1017] border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCartQuantity(Math.max(1, cartQuantity - 1))}
                      className="p-1 rounded bg-[#1a1d2c] border border-[#242938] text-slate-300"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-bold text-white font-mono w-8 text-center">{cartQuantity}</span>
                    <button
                      onClick={() => setCartQuantity(cartQuantity + 1)}
                      className="p-1 rounded bg-[#1a1d2c] border border-[#242938] text-slate-300"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <span className="text-[10px] text-slate-400 ml-2">Adet</span>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Müşteri Tepkisi</label>
                    <div className="flex gap-1.5">
                      {[
                        { key: 'BEGENDI', label: '👍 Beğendi', color: 'emerald' },
                        { key: 'KARARSIZ', label: '🤔 Kararsız', color: 'amber' },
                        { key: 'FIYAT_YUKSEK', label: '💰 Fiyat Yüksek', color: 'rose' },
                        { key: 'BEGENMEDI', label: '👎 Beğenmedi', color: 'slate' },
                      ].map(opt => (
                        <button
                          key={opt.key}
                          onClick={() => setCustomerReaction(opt.key === customerReaction ? '' : opt.key)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                            customerReaction === opt.key
                              ? `bg-${opt.color}-500/30 border-${opt.color}-500 text-${opt.color}-300`
                              : 'bg-[#1a1d2c] border-[#242938] text-slate-400'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Sepete Ekle
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: Satışa Dönüştür ================= */}
      {showSaleModal && (
        <div className="modal-overlay" onClick={() => setShowSaleModal(false)}>
          <div className="modal-content max-w-md border-emerald-500/50 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#242938] mb-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                <h3 className="font-cinzel text-base font-bold text-white">Sepeti Satışa Dönüştür</h3>
              </div>
              <button onClick={() => setShowSaleModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Ödeme Yöntemi</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Kredi Kartı">Kredi Kartı</option>
                  <option value="Nakit">Nakit</option>
                  <option value="Havale/EFT">Havale/EFT</option>
                  <option value="Takas">Takas</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Satılacak Ürünler</label>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {activeCart.items?.filter(i => !i.is_sold).map(item => (
                    <label key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-[#0e1017] border border-[#242938] cursor-pointer hover:border-emerald-500/40">
                      <input
                        type="checkbox"
                        checked={saleItems.length === 0 || saleItems.includes(item.id)}
                        onChange={() => {
                          setSaleItems(prev =>
                            prev.includes(item.id)
                              ? prev.filter(id => id !== item.id)
                              : [...prev, item.id]
                          );
                        }}
                        className="accent-emerald-500"
                      />
                      <span className="text-xs text-white flex-1">{item.product_name}</span>
                      <span className="text-xs font-mono text-amber-400">{item.line_total?.toLocaleString('tr-TR')} ₺</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0e1017] border border-[#242938] text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Toplam Satış</span>
                  <span className="text-lg font-bold text-amber-400 font-mono">
                    {activeCart.total_payable_amount?.toLocaleString('tr-TR')} ₺
                  </span>
                </div>
              </div>

              <button
                onClick={handleConvertToSale}
                disabled={converting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-lg disabled:opacity-50"
              >
                {converting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ShoppingBag className="w-4 h-4" />
                )}
                {converting ? 'Satış yapılıyor...' : 'Satışı Tamamla & Fiş Kes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: Hatırlatıcı ================= */}
      {showReminderModal && (
        <div className="modal-overlay" onClick={() => setShowReminderModal(false)}>
          <div className="modal-content max-w-md border-sky-500/50 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#242938] mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-sky-400" />
                <h3 className="font-cinzel text-base font-bold text-white">Hatırlatıcı Oluştur</h3>
              </div>
              <button onClick={() => setShowReminderModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={reminderTitle}
                onChange={(e) => setReminderTitle(e.target.value)}
                placeholder="Hatırlatma Başlığı *"
                className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              <textarea
                value={reminderNote}
                onChange={(e) => setReminderNote(e.target.value)}
                placeholder="Not (opsiyonel)"
                rows={2}
                className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Tarih *</label>
                  <input
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Saat</label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
              <button
                onClick={handleCreateReminder}
                className="w-full py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Bell className="w-3.5 h-3.5" />
                Hatırlatıcı Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: Talep ================= */}
      {showDemandModal && (
        <div className="modal-overlay" onClick={() => setShowDemandModal(false)}>
          <div className="modal-content max-w-md border-purple-500/50 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#242938] mb-4">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-purple-400" />
                <h3 className="font-cinzel text-base font-bold text-white">Müşteri Talebi Kaydet</h3>
              </div>
              <button onClick={() => setShowDemandModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={demandModel}
                onChange={(e) => setDemandModel(e.target.value)}
                placeholder="Model Adı (örn: 14K Baget Taşlı Kelepçe Bilezik) *"
                className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={demandCategory}
                  onChange={(e) => setDemandCategory(e.target.value)}
                  className="bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Bilezik">Bilezik</option>
                  <option value="Yüzük">Yüzük</option>
                  <option value="Kolye">Kolye</option>
                  <option value="Küpe">Küpe</option>
                  <option value="Set">Set</option>
                  <option value="Ziynet">Ziynet</option>
                  <option value="Külçe">Külçe</option>
                </select>
                <select
                  value={demandPurity}
                  onChange={(e) => setDemandPurity(e.target.value)}
                  className="bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="24K">24K Has</option>
                  <option value="22K">22K</option>
                  <option value="18K">18K</option>
                  <option value="14K">14K</option>
                </select>
              </div>
              <input
                type="number"
                value={demandBudget}
                onChange={(e) => setDemandBudget(e.target.value)}
                placeholder="Tahmini Bütçe (₺)"
                className="w-full bg-[#0e1017] border border-[#242938] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={demandUrgent}
                  onChange={(e) => setDemandUrgent(e.target.checked)}
                  className="accent-purple-500"
                />
                Acil / Öncelikli Talep
              </label>
              <button
                onClick={handleCreateDemand}
                className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Bookmark className="w-3.5 h-3.5" />
                Talebi Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}