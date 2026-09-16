'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Scale, 
  Eye, 
  ShoppingBag, 
  TrendingUp, 
  TrendingDown,
  Layers, 
  Plus, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Cpu, 
  Radio, 
  Store,
  DollarSign,
  Search,
  Sparkles,
  User,
  Users,
  Lock,
  LogOut,
  Network,
  Settings,
  CreditCard,
  Calendar,
  Check,
  Tv,
  Maximize2,
  LineChart,
  FileText,
  Printer,
  Mail,
  History,
  UserCheck,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Sparkle,
  Phone,
  Clock,
  Award,
  ChevronRight,
  RefreshCw,
  Send,
  Briefcase,
  Timer,
  FileQuestion,
  HelpCircle,
  CheckSquare,
  Building2,
  Moon,
  Sun,
  Siren,
  ScanBarcode,
  FileCheck2,
  BadgeAlert,
  Fingerprint,
  Share2,
  FileSpreadsheet,
  Layers3,
  Coins,
  QrCode,
  ShoppingCart,
  Menu,
  X
} from 'lucide-react';

let API_BASE = 'http://127.0.0.1:8000';
let WS_URL = 'ws://127.0.0.1:8000/ws/live';

if (typeof window !== 'undefined') {
  API_BASE = `${window.location.protocol}//${window.location.hostname}:8000`;
  const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  WS_URL = `${wsProto}//${window.location.hostname}:8000/ws/live`;
} else if (process.env.NEXT_PUBLIC_API_URL) {
  API_BASE = process.env.NEXT_PUBLIC_API_URL;
  WS_URL = API_BASE.replace(/^http/, 'ws') + '/ws/live';
}

const LOGO_URL = "https://lh3.googleusercontent.com/aida/AEtjO1WCeH2IVcJ8zZXzrDPBpbgtKAmrFcniorEBhxneqoPS8PpWu36N03VlH_cgKs9vxBqpjNw21iZTtNLJab-Ier61ZKGNl92BqMMUyIGl0YQ0IOqN_sh7KbYNHzkj-dAkuPss9VjJRxC2Z0B0XBg1dXCSn_OrlhPptqWywioro1Zlvdd7oF0aPN0JiSz_YAjelxBFp8kxPuZaAQqcz2Gy5XWjQIqP8QdjDpLVgn7nsNMIg4_3ptG2OEt_DYif";
const AVATAR_URL = "https://lh3.googleusercontent.com/aida/AEtjO1X5ENWDAwqjQcDLGOxCpBbsU9U36mMOKyDw7Wr1Wa3WhwZua1L0Jnqvoy4YuEo1J45snoktfR4i5y2oGbo3j8oXc0uHRVvRPKqKxnDSOAWnogIahVXej3DHSPyEK1Z1ijhHtr02qtQQina5msdhr5QXD8Qgkq_PJTykkF1mjKadY-omCVlRqMrospDID33vEpJyB46LEXDsGWhptLtE7uhpvNaUhKtmUCtjytwkgLakMCwvhyBXmlenfuP7";

export default function Home() {
  // Auth
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Navigasyon
  const [activeTab, setActiveTab] = useState('vitrin'); 
  // vitrin, custody, sessions_analytics, tv_board, chart_view, sales, daily_report, crm, logs, products, iot_devices, staff_management, simulator

  // Veriler
  const [slots, setSlots] = useState([]);
  const [products, setProducts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [salesList, setSalesList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [staffPerformance, setStaffPerformance] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [demandAnalytics, setDemandAnalytics] = useState([]);
  const [slotGroups, setSlotGroups] = useState([]);
  
  // ZİMMET & HİZMET SEANSI VERİLERİ
  const [myCustodyItems, setMyCustodyItems] = useState([]);
  const [serviceAnalytics, setServiceAnalytics] = useState({ staff_stats: [], missing_models: [] });
  const [activeServiceSession, setActiveServiceSession] = useState(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  
  // AKILLI GRAMAJ EŞLEME SİHİRBAZI MODALI (Askıdan ürün kalkınca çıkar)
  const [liftMatchWizard, setLiftMatchWizard] = useState(null); // { slot_id, slot_number, weight_lost, candidates }

  const [wsConnected, setWsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ================= PRD 11 MODÜL STATE'LERİ =================
  // Modül 2: Tekil Ürün Detay Sayfası & Varyantlar
  const [selectedProductDetail, setSelectedProductDetail] = useState(null);
  const [detailSelectedColor, setDetailSelectedColor] = useState('Sarı Altın');
  const [detailSelectedSize, setDetailSelectedSize] = useState('Standart');
  const [productVariantsList, setProductVariantsList] = useState([]);
  const [showAddVariantModal, setShowAddVariantModal] = useState(false);
  const [newVariantData, setNewVariantData] = useState({ color: 'Beyaz Altın', size_or_length: '16 No', weight_grams: 0, additional_labor: 0, stock_quantity: 1 });

  // Modül 7: Kapora & Ürün Ayırma
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [reservationsList, setReservationsList] = useState([]);
  const [reservationFormData, setReservationFormData] = useState({
    customer_id: '',
    product_id: '',
    deposit_amount: '',
    total_agreed_price: '',
    reserved_until: '',
    notes: ''
  });

  // Modül 7: Resmi Mücevher Garanti Sertifikası
  const [certificateModalData, setCertificateModalData] = useState(null);

  // Modül 1 & 3: Şube Bağlı Fiziksel Konumlar (Kasa/Tabla/Askı)
  const [branchLocationsList, setBranchLocationsList] = useState([]);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [newLocationData, setNewLocationData] = useState({ label: '', slot_type: 'Askı', group_name: 'Ana Vitrin' });

  // Modül 3: Stok & Fiziksel Konum Filtreleri
  const [stockLocationFilterType, setStockLocationFilterType] = useState('ALL'); // ALL, Askı, Tabla, Kasa
  const [stockSearchQuery, setStockSearchQuery] = useState('');

  // Modallar
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [showEditDeviceModal, setShowEditDeviceModal] = useState(false);
  const [selectedSlotForEdit, setSelectedSlotForEdit] = useState(null);
  
  // CRM & E-Posta Modalları
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedSaleForEmail, setSelectedSaleForEmail] = useState(null);
  const [emailSendingStatus, setEmailSendingStatus] = useState('');
  const [customerInterestsList, setCustomerInterestsList] = useState([]);
  const [certificateShareMessage, setCertificateShareMessage] = useState('');
  const [selectedBranchDetailModal, setSelectedBranchDetailModal] = useState(null);

  // Hizmet Seansı Bitirme Modalı
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [endSessionData, setEndSessionData] = useState({
    customer_name: '',
    duration_minutes: 0,
    sale_made: false,
    missing_model_notes: '',
    notes: ''
  });

  // Satış Formu
  const [selectedProductForSale, setSelectedProductForSale] = useState(null);
  const [salePaymentMethod, setSalePaymentMethod] = useState('Kredi Kartı');
  const [saleCustomerId, setSaleCustomerId] = useState('');
  const [saleCustomerName, setSaleCustomerName] = useState('');
  const [saleCustomerPhone, setSaleCustomerPhone] = useState('');
  const [saleCustomerEmail, setSaleCustomerEmail] = useState('');
  const [saleDiscount, setSaleDiscount] = useState(0);

  // Satış Filtreleri
  const [salesTimeRange, setSalesTimeRange] = useState('all');
  const [salesStaffFilter, setSalesStaffFilter] = useState('ALL');
  const [salesCategoryFilter, setSalesCategoryFilter] = useState('ALL');
  const [salesSearchQuery, setSalesSearchQuery] = useState('');

  // IoT Vitrin Filtreleri
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');

  // Audit Log Filtreleri
  const [logLevelFilter, setLogLevelFilter] = useState('ALL');
  const [logModuleFilter, setLogModuleFilter] = useState('ALL');
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // 1. Has & Sermaye Raporu State'leri
  const [capitalReport, setCapitalReport] = useState(null);
  const [criticalStock, setCriticalStock] = useState(null);
  const [stagnantStock, setStagnantStock] = useState([]);
  const [copiedWhatsAppMsg, setCopiedWhatsAppMsg] = useState(false);

  // 2. Barkod & RFID Hızlı Sayım Mutabakat State'leri
  const [auditHistory, setAuditHistory] = useState([]);
  const [activeAudit, setActiveAudit] = useState(null);
  const [auditBarcodeScan, setAuditBarcodeScan] = useState('');
  const [auditFilter, setAuditFilter] = useState('ALL'); // ALL, MATCHED, MISSING, SURPLUS

  // 3. Güvenlik, Gece Modu & Sahte Altın State'leri
  const [securityConfig, setSecurityConfig] = useState(null);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [panicActive, setPanicActive] = useState(false);
  const [testAnomalyWeight, setTestAnomalyWeight] = useState('');
  const [anomalyResult, setAnomalyResult] = useState(null);

  // 4. MASAK & Yasal Uyum & Resmi Pusula State'leri
  const [masakRecords, setMasakRecords] = useState([]);
  const [selectedSalePusula, setSelectedSalePusula] = useState(null);
  const [showPusulaModal, setShowPusulaModal] = useState(false);

  // 5. Çoklu Şube & Konsolide Özet & RBAC State'leri
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(1);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('ALL'); // 'ALL' = Tüm Şirket / Konsolide, veya branch_id (sayı)
  const [branchOverview, setBranchOverview] = useState(null);
  const [userRoleEditMap, setUserRoleEditMap] = useState({}); // { [userId]: { role, branch_id } }
  const [roleUpdateStatus, setRoleUpdateStatus] = useState('');
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [newBranchData, setNewBranchData] = useState({ name: '', city: 'İstanbul', address: '', phone: '' });
  const [hourlyTraffic, setHourlyTraffic] = useState([]);
  const [profitMarginData, setProfitMarginData] = useState(null);
  const [exportModalData, setExportModalData] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferProductId, setTransferProductId] = useState(null);
  const [transferTargetBranchId, setTransferTargetBranchId] = useState(2);

  // Satış Çapraz Öneri & İki Kişi Kuralı & MASAK State'leri
  const [crossSellSuggestions, setCrossSellSuggestions] = useState([]);
  const [twoManRequired, setTwoManRequired] = useState(false);
  const [twoManApproved, setTwoManApproved] = useState(false);
  const [twoManUsername, setTwoManUsername] = useState('admin');
  const [twoManPassword, setTwoManPassword] = useState('');
  const [twoManApproverName, setTwoManApproverName] = useState('');
  const [masakRequired, setMasakRequired] = useState(false);
  const [masakIdNumber, setMasakIdNumber] = useState('');
  const [masakOccupation, setMasakOccupation] = useState('');
  const [masakAddress, setMasakAddress] = useState('');
  const [eslSyncSuccess, setEslSyncSuccess] = useState(false);

  // Finansal Grafik Ekranı State'leri
  const [chartAsset, setChartAsset] = useState('has_altin');
  const [chartTimeframe, setChartTimeframe] = useState('1W');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // VIP Mücevher Müşteri Sunum Ekranı & Toplu Aktarım State'leri
  const [showPresentationModal, setShowPresentationModal] = useState(false);
  const [presentationData, setPresentationData] = useState(null);
  const [presentationLoading, setPresentationLoading] = useState(false);
  const [presentationAngle, setPresentationAngle] = useState(0);
  const [presentationZoom, setPresentationZoom] = useState(false);
  const [presentationActiveTab, setPresentationActiveTab] = useState('overview'); // overview, 4c, pricing, care
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkImportCsvText, setBulkImportCsvText] = useState('');
  const [bulkImportMessage, setBulkImportMessage] = useState('');

  // Form Verileri
  const [newProduct, setNewProduct] = useState({
    barcode: '',
    name: '',
    category: 'Yüzük',
    purity: '22K',
    milyem: 916,
    gold_color: 'Sarı Altın',
    weight_grams: '',
    labor_cost: '',
    cost_price: '',
    price: '',
    image_url: '',
    slot_id: '',
    description: '',
    size_or_length: '',
    craftsmanship_type: 'El İşçiliği',
    surface_finish: 'Parlak',
    workshop_origin: 'Kapalıçarşı Geleneksel Usta Ekolü',
    allow_engraving: true,
    has_stones: false,
    gemstone_type: 'Pırlanta',
    diamond_carat: '',
    diamond_color: 'G',
    diamond_clarity: 'VS1',
    diamond_cut: 'Excellent',
    stone_shape: 'Yuvarlak (Brillant)',
    stone_certificate: 'HRD Antwerp',
    certificate_no: '',
    care_instructions: 'Parfüm ve kimyasallardan uzak tutunuz. Ilık sabunlu su ve yumuşak mikrofiber bezle temizleyiniz.'
  });
  const [newStaff, setNewStaff] = useState({ username: '', password: '', full_name: '', role: 'STAFF', branch_id: 1 });
  const [newCustomer, setNewCustomer] = useState({ full_name: '', phone: '', email: '', id_number: '', customer_type: 'Bireysel', address: '', notes: '' });
  const [newSlotData, setNewSlotData] = useState({ slot_number: '', label: '', slot_type: 'Askı', group_name: 'Ana Vitrin', device_id: '', ip_address: '192.168.1.', port: 80, tolerance_grams: 0.20 });

  // Saat Döngüsü
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString('tr-TR'));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Hizmet Kronometresi (Seans Açıkken Sayar)
  useEffect(() => {
    let interval;
    if (activeServiceSession) {
      interval = setInterval(() => {
        setSessionSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setSessionSeconds(0);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [activeServiceSession]);

  // Ses Çalma Yardımcısı
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Ses hatası:", e);
    }
  };

  // Auth Kontrolü
  useEffect(() => {
    const savedToken = localStorage.getItem('kuyumcu_token');
    const savedUser = localStorage.getItem('kuyumcu_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        if (parsed.role === 'ADMIN') {
          setSelectedBranchFilter('ALL');
        } else {
          const bId = parsed.branch_id || 1;
          setSelectedBranchFilter(bId);
          setSelectedBranchId(bId);
        }
      } catch (e) {
        localStorage.removeItem('kuyumcu_token');
        localStorage.removeItem('kuyumcu_user');
      }
    }
  }, []);

  // Giriş Yapma
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoginError('');
    setAuthLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Giriş yapılamadı');
      }
      const data = await res.json();
      setToken(data.access_token);
      setCurrentUser(data.user);
      localStorage.setItem('kuyumcu_token', data.access_token);
      localStorage.setItem('kuyumcu_user', JSON.stringify(data.user));

      if (data.user.role === 'ADMIN') {
        setSelectedBranchFilter('ALL');
      } else {
        const bId = data.user.branch_id || 1;
        setSelectedBranchFilter(bId);
        setSelectedBranchId(bId);
      }
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Çıkış Yapma
  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('kuyumcu_token');
    localStorage.removeItem('kuyumcu_user');
    setActiveTab('vitrin');
  };

  // ================= API VERİ ÇEKME METOTLARI =================
  const fetchBranchOverview = async (overrideFilter = undefined) => {
    try {
      const activeFilter = overrideFilter !== undefined ? overrideFilter : selectedBranchFilter;
      let url = `${API_BASE}/api/v1/branches/overview`;
      if (activeFilter && activeFilter !== 'ALL') {
        url += `?branch_id=${activeFilter}`;
      }
      const res = await fetch(url);
      if (res.ok) setBranchOverview(await res.json());
    } catch (e) { console.error("Branch overview fetch error", e); }
  };

  const handleBranchFilterChange = (val) => {
    setSelectedBranchFilter(val);
    const bId = val === 'ALL' ? null : parseInt(val);
    if (bId) setSelectedBranchId(bId);
    fetchBranchOverview(val);
    fetchProducts(bId);
    fetchSlots(bId);
    fetchSales(salesTimeRange, bId);
  };

  const fetchSlots = async (overrideBranchId = undefined) => {
    try {
      const activeBranch = overrideBranchId !== undefined
        ? overrideBranchId
        : (selectedBranchFilter === 'ALL' ? null : parseInt(selectedBranchFilter));
      let url = `${API_BASE}/api/v1/iot/slots`;
      const params = new URLSearchParams();
      if (activeBranch) params.append('branch_id', activeBranch);
      if (selectedGroupFilter !== 'ALL') params.append('group_name', selectedGroupFilter);
      if (selectedTypeFilter !== 'ALL') params.append('slot_type', selectedTypeFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) setSlots(await res.json());
    } catch (e) { console.error("Slots fetch error", e); }
  };

  const fetchSlotGroups = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/iot/groups`);
      if (res.ok) setSlotGroups(await res.json());
    } catch (e) { console.error("Groups fetch error", e); }
  };

  // ================= PRD METOTLARI =================
  const fetchReservations = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/crm/reservations`);
      if (res.ok) setReservationsList(await res.json());
    } catch (e) { console.error("Reservations fetch error", e); }
  };

  const fetchBranchLocations = async (bId = selectedBranchId || 1) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/branches/${bId}/locations`);
      if (res.ok) setBranchLocationsList(await res.json());
    } catch (e) { console.error("Branch locations fetch error", e); }
  };

  const openProductDetailModal = async (product) => {
    setSelectedProductDetail(product);
    setDetailSelectedColor(product.gold_color || 'Sarı Altın');
    setDetailSelectedSize(product.size_or_length || 'Standart');
    try {
      const res = await fetch(`${API_BASE}/api/v1/products/${product.id}/variants`);
      if (res.ok) setProductVariantsList(await res.json());
    } catch (e) { console.error("Variants fetch error", e); }
  };

  const handleGenerateCertificate = async (productId) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/products/${productId}/certificate`);
      if (res.ok) {
        const cert = await res.json();
        setCertificateModalData(cert);
      }
    } catch (e) { console.error("Certificate error", e); }
  };

  const handleCreateReservation = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/v1/crm/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          customer_id: parseInt(reservationFormData.customer_id),
          product_id: parseInt(reservationFormData.product_id),
          deposit_amount: parseFloat(reservationFormData.deposit_amount) || 0,
          total_agreed_price: parseFloat(reservationFormData.total_agreed_price) || 0,
          reserved_until: new Date(reservationFormData.reserved_until).toISOString(),
          notes: reservationFormData.notes
        })
      });
      if (res.ok) {
        alert("Kapora ve Ürün Ayırma işlemi başarıyla kaydedildi!");
        setShowReservationModal(false);
        fetchReservations();
        fetchProducts();
      } else {
        const err = await res.json();
        alert("Hata: " + (err.detail || "İşlem kaydedilemedi"));
      }
    } catch (e) { console.error("Reservation save error", e); }
  };

  const handleAddBranchLocation = async (e) => {
    e.preventDefault();
    try {
      const bId = selectedBranchId || 1;
      const url = `${API_BASE}/api/v1/branches/${bId}/locations?label=${encodeURIComponent(newLocationData.label)}&slot_type=${encodeURIComponent(newLocationData.slot_type)}&group_name=${encodeURIComponent(newLocationData.group_name)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        alert("Yeni konum başarıyla oluşturuldu!");
        setShowAddLocationModal(false);
        fetchBranchLocations(bId);
        fetchSlots(bId);
      }
    } catch (e) { console.error("Location add error", e); }
  };

  const handleAddVariant = async (e) => {
    e.preventDefault();
    if (!selectedProductDetail) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/products/${selectedProductDetail.id}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          color: newVariantData.color,
          size_or_length: newVariantData.size_or_length,
          weight_grams: parseFloat(newVariantData.weight_grams) || selectedProductDetail.weight_grams,
          additional_labor: parseFloat(newVariantData.additional_labor) || 0,
          stock_quantity: parseInt(newVariantData.stock_quantity) || 1,
          variant_barcode: newVariantData.variant_barcode || undefined,
          image_url: newVariantData.image_url || undefined
        })
      });
      if (res.ok) {
        alert("Varyant başarıyla eklendi!");
        setShowAddVariantModal(false);
        // Refresh variants
        const vRes = await fetch(`${API_BASE}/api/v1/products/${selectedProductDetail.id}/variants`);
        if (vRes.ok) setProductVariantsList(await vRes.json());
      } else {
        const err = await res.json();
        alert("Varyant ekleme hatası: " + (err.detail || "Eklenemedi"));
      }
    } catch (e) { console.error("Add variant error", e); }
  };

  const handleUpdateReservationStatus = async (reservationId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/crm/reservations/${reservationId}/status?status=${newStatus}`, {
        method: 'PUT',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        alert(`Kapora durumu güncellendi: ${newStatus}`);
        fetchReservations();
      }
    } catch (e) { console.error("Reservation status update error", e); }
  };

  const fetchProducts = async (overrideBranchId = undefined) => {
    try {
      const activeBranch = overrideBranchId !== undefined
        ? overrideBranchId
        : (selectedBranchFilter === 'ALL' ? null : parseInt(selectedBranchFilter));
      let url = `${API_BASE}/api/v1/products`;
      if (activeBranch) {
        url += `?branch_id=${activeBranch}`;
      }
      const res = await fetch(url);
      if (res.ok) setProducts(await res.json());
    } catch (e) { console.error("Products fetch error", e); }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/iot/alerts?unresolved_only=true`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0 && alerts.length < data.length) {
          playAlertSound();
          // En son alarm veren slot için otomatik gramaj eşleme sihirbazını tetikle
          const latestAlert = data[0];
          handleTriggerIdentifyLift(latestAlert.slot_id, latestAlert.weight_lost);
        }
        setAlerts(data);
      }
    } catch (e) { console.error("Alerts fetch error", e); }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/analytics/daily-summary`);
      if (res.ok) setAnalytics(await res.json());
    } catch (e) { console.error("Analytics fetch error", e); }
  };

  const fetchDemandAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/iot/demand-analytics`);
      if (res.ok) setDemandAnalytics(await res.json());
    } catch (e) { console.error("Demand analytics error", e); }
  };

  const fetchSales = async (timeRange = salesTimeRange, overrideBranchId = undefined) => {
    if (!token) return;
    try {
      const activeBranch = overrideBranchId !== undefined
        ? overrideBranchId
        : (selectedBranchFilter === 'ALL' ? null : parseInt(selectedBranchFilter));
      let url = `${API_BASE}/api/v1/sales?time_range=${timeRange}`;
      if (activeBranch) url += `&branch_id=${activeBranch}`;
      if (currentUser?.role === 'ADMIN' && salesStaffFilter !== 'ALL') url += `&user_id=${salesStaffFilter}`;
      if (salesCategoryFilter !== 'ALL') url += `&category=${salesCategoryFilter}`;
      if (salesSearchQuery) url += `&search=${encodeURIComponent(salesSearchQuery)}`;

      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setSalesList(await res.json());
    } catch (e) { console.error("Sales fetch error", e); }
  };

  const fetchStaffPerformance = async () => {
    if (!token || !['ADMIN', 'MANAGER'].includes(currentUser?.role)) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/sales/staff-performance`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setStaffPerformance(await res.json());
    } catch (e) { console.error("Staff perf fetch error", e); }
  };

  const fetchStaffList = async () => {
    if (!token || !['ADMIN', 'MANAGER'].includes(currentUser?.role)) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/users`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setStaffList(data);
        const initialMap = {};
        data.forEach(u => {
          initialMap[u.id] = { role: u.role, branch_id: u.branch_id || '' };
        });
        setUserRoleEditMap(initialMap);
      }
    } catch (e) { console.error("Staff list fetch error", e); }
  };

  const handleUpdateUserRoleAndBranch = async (userId) => {
    const editData = userRoleEditMap[userId];
    if (!editData) return;
    try {
      setRoleUpdateStatus('Kaydediliyor...');
      const payload = {
        role: editData.role,
        branch_id: editData.branch_id ? parseInt(editData.branch_id) : null
      };
      const res = await fetch(`${API_BASE}/api/v1/auth/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updated = await res.json();
        setRoleUpdateStatus(`✅ ${updated.full_name} yetkileri ve mağazası başarıyla güncellendi!`);
        fetchStaffList();
        setTimeout(() => setRoleUpdateStatus(''), 4000);
      } else {
        const err = await res.json();
        setRoleUpdateStatus(`❌ Hata: ${err.detail || 'Güncellenemedi'}`);
      }
    } catch (e) {
      setRoleUpdateStatus('❌ Sunucu bağlantı hatası!');
    }
  };

  const fetchCustomers = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/crm/customers`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setCustomers(await res.json());
    } catch (e) { console.error("Customers fetch error", e); }
  };

  const fetchSystemLogs = async () => {
    if (!token) return;
    try {
      let url = `${API_BASE}/api/v1/logs?limit=80`;
      if (logLevelFilter !== 'ALL') url += `&level=${logLevelFilter}`;
      if (logModuleFilter !== 'ALL') url += `&module=${logModuleFilter}`;
      if (logSearchQuery) url += `&search=${encodeURIComponent(logSearchQuery)}`;

      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setSystemLogs(await res.json());
    } catch (e) { console.error("Logs fetch error", e); }
  };

  // ZİMMET & SEANS VERİLERİNİ ÇEKME
  const fetchMyCustody = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/iot/custody/my-items`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setMyCustodyItems(await res.json());
    } catch (e) { console.error("My custody fetch error", e); }
  };

  const fetchServiceAnalytics = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/sessions/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setServiceAnalytics(await res.json());
    } catch (e) { console.error("Service analytics fetch error", e); }
  };

  // --- YENİ MODÜL FONKSİYONLARI ---

  // 1. Has & Sermaye Raporu
  const fetchCapitalReport = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/inventory/capital-report`);
      if (res.ok) setCapitalReport(await res.json());
    } catch (e) { console.error("Capital report fetch error", e); }
  };

  const fetchCriticalStock = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/inventory/critical-stock`);
      if (res.ok) setCriticalStock(await res.json());
    } catch (e) { console.error("Critical stock fetch error", e); }
  };

  const fetchStagnantStock = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/inventory/stagnant-stock`);
      if (res.ok) setStagnantStock(await res.json());
    } catch (e) { console.error("Stagnant stock fetch error", e); }
  };

  // 2. Barkod / RFID Sayım Mutabakatı
  const fetchAuditHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/inventory/audit/history`);
      if (res.ok) {
        const data = await res.json();
        setAuditHistory(data);
        if (data.length > 0 && !activeAudit) {
          const inProgress = data.find(a => a.status === 'IN_PROGRESS') || data[0];
          setActiveAudit(inProgress);
        }
      }
    } catch (e) { console.error("Audit history fetch error", e); }
  };

  const handleStartAudit = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/inventory/audit/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: `Vitrin Sayımı - ${new Date().toLocaleDateString('tr-TR')}`, branch_id: selectedBranchId })
      });
      if (res.ok) {
        const newA = await res.json();
        setActiveAudit(newA);
        fetchAuditHistory();
      }
    } catch (e) { console.error("Start audit error", e); }
  };

  const handleScanAuditBarcode = async (barcodeToScan) => {
    const code = barcodeToScan || auditBarcodeScan;
    if (!code || !activeAudit) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/inventory/audit/${activeAudit.id}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: code })
      });
      if (res.ok) {
        setAuditBarcodeScan('');
        fetchAuditHistory();
      }
    } catch (e) { console.error("Audit scan error", e); }
  };

  const handleFinishAudit = async () => {
    if (!activeAudit) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/inventory/audit/${activeAudit.id}/finish`, {
        method: 'POST'
      });
      if (res.ok) {
        const finished = await res.json();
        setActiveAudit(finished);
        fetchAuditHistory();
      }
    } catch (e) { console.error("Finish audit error", e); }
  };

  // 3. Güvenlik, Gece Modu & Sahte Altın
  const fetchSecurityConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/security/config`);
      if (res.ok) setSecurityConfig(await res.json());
    } catch (e) { console.error("Security config fetch error", e); }
  };

  const fetchSecurityEvents = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/security/events`);
      if (res.ok) setSecurityEvents(await res.json());
    } catch (e) { console.error("Security events fetch error", e); }
  };

  const handleToggleNightMode = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/security/night-mode/toggle`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchSecurityConfig();
        fetchSecurityEvents();
      }
    } catch (e) { console.error("Toggle night mode error", e); }
  };

  const handleTriggerPanic = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/security/panic-button`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ trigger_source: "Kullanıcı Arayüzü / Panik Butonu" })
      });
      if (res.ok) {
        setPanicActive(true);
        fetchSecurityEvents();
        setTimeout(() => setPanicActive(false), 5000);
      }
    } catch (e) { console.error("Trigger panic error", e); }
  };

  const handleVerifyWeightAnomaly = async (productId, returnWeight) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/security/verify-weight-anomaly`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ product_id: productId, returned_weight_grams: parseFloat(returnWeight) })
      });
      if (res.ok) {
        const result = await res.json();
        setAnomalyResult(result);
        fetchSecurityEvents();
      }
    } catch (e) { console.error("Weight anomaly test error", e); }
  };

  // 4. MASAK & Yasal Uyum & Resmi Pusula
  const fetchMasakRecords = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/legal/masak-records`);
      if (res.ok) setMasakRecords(await res.json());
    } catch (e) { console.error("Masak records fetch error", e); }
  };

  const handleOpenPusulaModal = async (saleId) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/legal/receipt/${saleId}/pusula`);
      if (res.ok) {
        setSelectedSalePusula(await res.json());
        setShowPusulaModal(true);
      }
    } catch (e) { console.error("Pusula fetch error", e); }
  };

  // 5. Çoklu Şube & Muhasebe
  const fetchBranches = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/branches`);
      if (res.ok) setBranches(await res.json());
    } catch (e) { console.error("Branches fetch error", e); }
  };

  const fetchHourlyTraffic = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/branches/analytics/hourly-traffic`);
      if (res.ok) setHourlyTraffic(await res.json());
    } catch (e) { console.error("Hourly traffic fetch error", e); }
  };

  const fetchProfitMargins = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/branches/analytics/profit-margin`);
      if (res.ok) setProfitMarginData(await res.json());
    } catch (e) { console.error("Profit margin fetch error", e); }
  };

  const handleStockTransfer = async (e) => {
    e.preventDefault();
    if (!transferProductId || !transferTargetBranchId) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/branches/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ product_id: transferProductId, target_branch_id: transferTargetBranchId, notes: "Panelden sevk edildi" })
      });
      if (res.ok) {
        setShowTransferModal(false);
        fetchProducts();
        fetchSlots();
      }
    } catch (e) { console.error("Transfer error", e); }
  };

  const handleExportLogoNetsis = async (formatType) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/branches/export/logo-netsis?format_type=${formatType}`);
      if (res.ok) {
        setExportModalData(await res.json());
      }
    } catch (e) { console.error("Export error", e); }
  };

  // VIP Mücevher Müşteri Sunum Ekranı Yükleme
  const handleOpenPresentation = async (productId) => {
    setPresentationLoading(true);
    setShowPresentationModal(true);
    setPresentationAngle(0);
    setPresentationZoom(false);
    setPresentationActiveTab('overview');
    try {
      const res = await fetch(`${API_BASE}/api/v1/products/${productId}/presentation`);
      if (res.ok) {
        const data = await res.json();
        setPresentationData(data);
      } else {
        alert("Ürün sunum detayları yüklenemedi.");
      }
    } catch (err) {
      console.error("Presentation load error", err);
    } finally {
      setPresentationLoading(false);
    }
  };

  // Excel / CSV Toplu Ürün Aktarımı
  const handleBulkCsvImport = async (e) => {
    e.preventDefault();
    if (!bulkImportCsvText) return;
    try {
      const blob = new Blob([bulkImportCsvText], { type: 'text/csv' });
      const formData = new FormData();
      formData.append('file', blob, 'products.csv');

      const res = await fetch(`${API_BASE}/api/v1/products/bulk-csv-import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setBulkImportMessage(data.message || 'Ürünler aktarıldı');
        fetchProducts();
        fetchSlots();
        setTimeout(() => {
          setShowBulkImportModal(false);
          setBulkImportMessage('');
          setBulkImportCsvText('');
        }, 1500);
      } else {
        alert("İçe aktarma hatası oluştu.");
      }
    } catch (err) {
      alert("Hata: " + err.message);
    }
  };

  // Çapraz Satış ve İki Kişi Doğrulaması
  const handleLoadCrossSell = async (productId) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/sales/cross-sell-recommendations/${productId}`);
      if (res.ok) setCrossSellSuggestions(await res.json());
    } catch (e) { console.error("Cross sell fetch error", e); }
  };

  const handleVerifyTwoMan = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/v1/sales/verify-two-man`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approver_username: twoManUsername,
          approver_password: twoManPassword,
          sale_amount: selectedProductForSale?.price || 0,
          product_name: selectedProductForSale?.name || ''
        })
      });
      if (res.ok) {
        const data = await res.json();
        setTwoManApproved(true);
        setTwoManApproverName(data.approver_name);
        alert(`✅ İkinci onay başarıyla verildi: ${data.approver_name}`);
      } else {
        const err = await res.json();
        alert(`❌ Onay Başarısız: ${err.detail || 'Kullanıcı adı veya şifre hatalı'}`);
      }
    } catch (e) { console.error("Two man verify error", e); }
  };

  const handleEslSync = () => {
    setEslSyncSuccess(true);
    setTimeout(() => setEslSyncSuccess(false), 3000);
  };

  // İlk Yükleme
  useEffect(() => {
    fetchSlots();
    fetchSlotGroups();
    fetchProducts();
    fetchAlerts();
    fetchAnalytics();
    fetchDemandAnalytics();
    fetchCapitalReport();
    fetchCriticalStock();
    fetchStagnantStock();
    fetchSecurityConfig();
    fetchBranches();
    fetchBranchOverview();
    fetchReservations();
    fetchBranchLocations();
  }, [selectedGroupFilter, selectedTypeFilter]);

  // Auth Yüklemesi
  useEffect(() => {
    if (token) {
      fetchSales();
      fetchCustomers();
      fetchSystemLogs();
      fetchMyCustody();
      fetchServiceAnalytics();
      fetchAuditHistory();
      fetchSecurityEvents();
      fetchMasakRecords();
      fetchHourlyTraffic();
      fetchProfitMargins();
      fetchBranchOverview();
      if (['ADMIN', 'MANAGER'].includes(currentUser?.role)) {
        fetchStaffPerformance();
        fetchStaffList();
      }
    }
  }, [token, currentUser, salesTimeRange, salesStaffFilter, salesCategoryFilter, salesSearchQuery, logLevelFilter, logModuleFilter, logSearchQuery]);

  // WebSocket Canlı Akış Dinleme
  useEffect(() => {
    let ws;
    const connectWs = () => {
      try {
        ws = new WebSocket(WS_URL);
        ws.onopen = () => setWsConnected(true);
        ws.onclose = () => {
          setWsConnected(false);
          setTimeout(connectWs, 3000);
        };
        ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'WEIGHT_CHANGED') {
              fetchSlots();
              fetchAnalytics();
              // Eğer ağırlık eksilmesi varsa gramaj eşleme sihirbazını aç
              if (data.delta && data.delta > 0.5) {
                handleTriggerIdentifyLift(data.slot_id, data.delta);
              }
            }
            if (data.type === 'SECURITY_ALERT') {
              playAlertSound();
              fetchAlerts();
              fetchSlots();
              fetchSystemLogs();
              if (data.slot_id) {
                handleTriggerIdentifyLift(data.slot_id, data.weight_lost);
              }
            }
            if (data.type === 'CUSTODY_TAKEN' || data.type === 'CUSTODY_RETURNED') {
              fetchSlots();
              fetchMyCustody();
              fetchDemandAnalytics();
              fetchSystemLogs();
            }
            if (data.type === 'PRODUCT_SOLD') {
              fetchProducts();
              fetchSlots();
              fetchSales();
              fetchMyCustody();
              fetchAnalytics();
              fetchDemandAnalytics();
              fetchSystemLogs();
              if (currentUser?.role === 'ADMIN') fetchStaffPerformance();
            }
            if (data.type === 'ALERT_RESOLVED') {
              fetchAlerts();
              fetchSlots();
              fetchSystemLogs();
            }
          } catch (err) {
            console.error("WS Message Error", err);
          }
        };
      } catch (err) {
        setTimeout(connectWs, 3000);
      }
    };
    connectWs();
    return () => { if (ws) ws.close(); };
  }, [token, soundEnabled]);

  // ================= AKILLI GRAMAJ EŞLEME & ZİMMET İŞLEMLERİ =================
  const handleTriggerIdentifyLift = async (slotId, weightLost) => {
    try {
      let url = `${API_BASE}/api/v1/iot/slots/${slotId}/identify-lift`;
      if (weightLost) url += `?weight_lost=${weightLost}`;
      const res = await fetch(url);
      if (res.ok) {
        const wizardData = await res.json();
        setLiftMatchWizard(wizardData);
      }
    } catch (e) {
      console.error("Identify lift error", e);
    }
  };

  // Ürünü Personelin Zimmetine Alma
  const handleTakeIntoCustody = async (productId, slotId) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/iot/custody/take`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ product_id: productId, slot_id: slotId })
      });
      if (res.ok) {
        const data = await res.json();
        setLiftMatchWizard(null);
        fetchMyCustody();
        fetchSlots();
        fetchAlerts();
        fetchSystemLogs();

        // Eğer aktif müşteri seansı yoksa otomatik seans başlat
        if (!activeServiceSession) {
          handleStartServiceSession("Müşteri");
        }
      } else {
        const err = await res.json();
        alert(err.detail || 'Zimmete alınamadı');
      }
    } catch (e) {
      alert("Hata: " + e.message);
    }
  };

  // Ürünü Vitrine Geri Koyma
  const handleReturnToRack = async (productId) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/iot/custody/return-to-rack`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ product_id: productId })
      });
      if (res.ok) {
        fetchMyCustody();
        fetchSlots();
        fetchSystemLogs();
        fetchDemandAnalytics();
      } else {
        const err = await res.json();
        alert(err.detail || 'Vitrine geri konulamadı');
      }
    } catch (e) {
      alert("Hata: " + e.message);
    }
  };

  // Müşteri Seansı Başlatma
  const handleStartServiceSession = async (custName = "Müşteri") => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/sessions/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ customer_name: custName })
      });
      if (res.ok) {
        const session = await res.json();
        setActiveServiceSession(session);
        setSessionSeconds(0);
      }
    } catch (e) { console.error("Start session error", e); }
  };

  // Müşteri Seansını Bitirme & Eksik Model Notu Ekleme
  const handleCompleteEndSession = async (e) => {
    if (e) e.preventDefault();
    if (!token) return;

    try {
      const durationMins = activeServiceSession
        ? parseFloat((sessionSeconds / 60).toFixed(1))
        : parseFloat(endSessionData.duration_minutes || 10);

      const payload = {
        session_id: activeServiceSession?.id,
        customer_name: endSessionData.customer_name || activeServiceSession?.customer_name || 'Müşteri',
        duration_minutes: durationMins,
        sale_made: endSessionData.sale_made,
        missing_model_notes: endSessionData.missing_model_notes || null,
        notes: endSessionData.notes || null
      };

      const res = await fetch(`${API_BASE}/api/v1/sessions/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowEndSessionModal(false);
        setActiveServiceSession(null);
        setSessionSeconds(0);
        setEndSessionData({ customer_name: '', duration_minutes: 0, sale_made: false, missing_model_notes: '', notes: '' });
        fetchServiceAnalytics();
        fetchSystemLogs();
        alert("Müşteri hizmet seansı ve aranan model notu başarıyla kaydedildi!");
      }
    } catch (err) {
      alert("Hata: " + err.message);
    }
  };

  // Yazdırma (PDF Gün Sonu Çıktısı)
  const handlePrintReport = () => {
    window.print();
  };

  // Müşteri Geçmişi Görüntüleme & İlgilenilen Ürünler (PRD Modül 7)
  const handleOpenCustomerHistory = async (customerId) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/crm/customers/${customerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setSelectedCustomerHistory(await res.json());

      const intRes = await fetch(`${API_BASE}/api/v1/crm/customers/${customerId}/interests`);
      if (intRes.ok) setCustomerInterestsList(await intRes.json());
    } catch (e) { console.error("Customer history error", e); }
  };

  const handleRecordInterest = async (productId, customerId, actionType = 'LIKED', notes = '') => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/crm/interests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          product_id: parseInt(productId),
          customer_id: parseInt(customerId),
          action_type: actionType,
          notes: notes
        })
      });
      if (res.ok) {
        alert(actionType === 'LIKED' ? 'Mücevher müşterinin beğeni / istek listesine eklendi!' : 'Müşteriye deneme / gösterim kaydı başarıyla işlendi!');
        if (selectedCustomerHistory && selectedCustomerHistory.customer?.id === customerId) {
          handleOpenCustomerHistory(customerId);
        }
      }
    } catch (e) { console.error("Record interest error", e); }
  };

  const handleShareCertificate = async (channel = 'WHATSAPP') => {
    if (!certificateModalData) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/crm/share-certificate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: channel,
          certificate_no: certificateModalData.certificate_no,
          phone: '0532 999 88 77',
          email: 'musteri@sarraferdem.com'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCertificateShareMessage(`✅ ${data.message}`);
        setTimeout(() => setCertificateShareMessage(''), 5000);
      }
    } catch (e) { console.error("Share certificate error", e); }
  };

  // Müşteriye E-Posta Gönderme
  const handleSendCertificateEmail = async (sale) => {
    if (!token) return;
    setSelectedSaleForEmail(sale);
    setShowEmailModal(true);
    setEmailSendingStatus('');
  };

  const executeSendEmail = async () => {
    if (!selectedSaleForEmail || !token) return;
    setEmailSendingStatus('Gönderiliyor...');
    try {
      const res = await fetch(`${API_BASE}/api/v1/crm/send-certificate-email?sale_id=${selectedSaleForEmail.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setEmailSendingStatus(`✅ Başarılı: ${data.message}`);
        fetchSystemLogs();
      } else {
        setEmailSendingStatus(`❌ Hata: ${data.detail || 'Gönderilemedi'}`);
      }
    } catch (err) {
      setEmailSendingStatus(`❌ Hata: ${err.message}`);
    }
  };

  // Satış Tamamlama
  const handleProcessSale = async (e) => {
    e.preventDefault();
    if (!selectedProductForSale || !token) return;

    try {
      const payload = {
        product_id: selectedProductForSale.id,
        customer_id: saleCustomerId ? parseInt(saleCustomerId) : null,
        customer_name: saleCustomerName || 'Müşteri',
        customer_phone: saleCustomerPhone || null,
        customer_email: saleCustomerEmail || null,
        payment_method: salePaymentMethod,
        discount_amount: parseFloat(saleDiscount || 0),
        gold_rate_at_sale: 3045.0,
        branch_id: selectedBranchId || 1,
        is_two_man_approved: twoManApproved,
        second_approver_name: twoManApproverName || null,
        masak_id_number: masakIdNumber || null,
        masak_occupation: masakOccupation || null,
        masak_address: masakAddress || null
      };

      const res = await fetch(`${API_BASE}/api/v1/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.detail || 'Satış gerçekleştirilemedi');
        return;
      }

      const saleResult = await res.json();
      setShowSaleModal(false);
      setSelectedProductForSale(null);
      setSaleCustomerName('');
      setSaleCustomerPhone('');
      setSaleCustomerEmail('');
      setSaleCustomerId('');
      setSaleDiscount(0);
      setTwoManApproved(false);
      setTwoManPassword('');
      setTwoManApproverName('');
      setMasakIdNumber('');
      setMasakOccupation('');
      setMasakAddress('');

      // Verileri Tazele
      fetchProducts();
      fetchSlots();
      fetchSales();
      fetchMyCustody();
      fetchAnalytics();
      fetchCapitalReport();
      fetchCriticalStock();
      fetchProfitMargins();
      fetchMasakRecords();
      fetchAnalytics();
      fetchDemandAnalytics();
      fetchSystemLogs();
      if (currentUser?.role === 'ADMIN') fetchStaffPerformance();

      // Aktif seansı satıldı olarak işaretleme teklifi
      if (activeServiceSession) {
        setEndSessionData(prev => ({ ...prev, sale_made: true }));
      }

      if (confirm(`Satış başarıyla yapıldı! (Fiş No: ${saleResult.invoice_no})\n\nMüşteriye hemen dijital mücevherat sertifikası e-postası göndermek ister misiniz?`)) {
        handleSendCertificateEmail(saleResult);
      }
    } catch (err) {
      alert("Hata: " + err.message);
    }
  };

  // Askı Kalibre Etme
  const handleCalibrate = async (slotId) => {
    if (!token || currentUser?.role !== 'ADMIN') {
      alert("Sensör kalibrasyonu yalnızca Yönetici (Admin) yetkisindedir.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/v1/iot/slots/${slotId}/calibrate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchSlots();
        fetchSystemLogs();
      }
    } catch (e) { console.error("Calibrate error", e); }
  };

  // İnceleme İzni
  const handleToggleInspection = async (slotId, currentAuth) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/iot/slots/${slotId}/authorize-inspection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorized: !currentAuth })
      });
      if (res.ok) fetchSlots();
    } catch (e) { console.error("Toggle inspection error", e); }
  };

  // Alarm Çözme
  const handleResolveAlert = async (alertId) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/iot/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ resolved_by: currentUser?.full_name || 'Yetkili Personel' })
      });
      if (res.ok) {
        fetchAlerts();
        fetchSlots();
        fetchSystemLogs();
      }
    } catch (e) { console.error("Resolve alert error", e); }
  };

  // Yeni Müşteri
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/crm/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCustomer)
      });
      if (res.ok) {
        setShowAddCustomerModal(false);
        setNewCustomer({ full_name: '', phone: '', email: '', id_number: '', customer_type: 'Bireysel', address: '', notes: '' });
        fetchCustomers();
        fetchSystemLogs();
      }
    } catch (e) { console.error("Create customer error", e); }
  };

  // Yeni Ürün
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!token || currentUser?.role !== 'ADMIN') return;
    try {
      const payload = {
        barcode: newProduct.barcode,
        name: newProduct.name,
        category: newProduct.category,
        purity: newProduct.purity,
        milyem: parseInt(newProduct.milyem || 916),
        gold_color: newProduct.gold_color,
        weight_grams: parseFloat(newProduct.weight_grams),
        labor_cost: parseFloat(newProduct.labor_cost || 0),
        cost_price: parseFloat(newProduct.cost_price || 0),
        price: parseFloat(newProduct.price),
        image_url: newProduct.image_url || null,
        description: newProduct.description || null,
        slot_id: newProduct.slot_id ? parseInt(newProduct.slot_id) : null,
        size_or_length: newProduct.size_or_length || null,
        craftsmanship_type: newProduct.craftsmanship_type,
        surface_finish: newProduct.surface_finish,
        workshop_origin: newProduct.workshop_origin,
        allow_engraving: newProduct.allow_engraving,
        has_stones: newProduct.has_stones,
        gemstone_type: newProduct.has_stones ? newProduct.gemstone_type : null,
        diamond_carat: (newProduct.has_stones && newProduct.diamond_carat) ? parseFloat(newProduct.diamond_carat) : null,
        diamond_color: newProduct.has_stones ? newProduct.diamond_color : null,
        diamond_clarity: newProduct.has_stones ? newProduct.diamond_clarity : null,
        diamond_cut: newProduct.has_stones ? newProduct.diamond_cut : null,
        stone_shape: newProduct.has_stones ? newProduct.stone_shape : null,
        stone_certificate: newProduct.has_stones ? newProduct.stone_certificate : null,
        certificate_no: newProduct.has_stones ? newProduct.certificate_no : null,
        care_instructions: newProduct.care_instructions
      };

      const res = await fetch(`${API_BASE}/api/v1/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowAddProductModal(false);
        setNewProduct({
          barcode: '', name: '', category: 'Yüzük', purity: '22K', milyem: 916, gold_color: 'Sarı Altın',
          weight_grams: '', labor_cost: '', cost_price: '', price: '', image_url: '', slot_id: '',
          description: '', size_or_length: '', craftsmanship_type: 'El İşçiliği', surface_finish: 'Parlak',
          workshop_origin: 'Kapalıçarşı Geleneksel Usta Ekolü', allow_engraving: true, has_stones: false,
          gemstone_type: 'Pırlanta', diamond_carat: '', diamond_color: 'G', diamond_clarity: 'VS1',
          diamond_cut: 'Excellent', stone_shape: 'Yuvarlak (Brillant)', stone_certificate: 'HRD Antwerp',
          certificate_no: '', care_instructions: 'Parfüm ve kimyasallardan uzak tutunuz.'
        });
        fetchProducts();
        fetchSlots();
        fetchDemandAnalytics();
        fetchSystemLogs();
      }
    } catch (e) { alert("Hata: " + e.message); }
  };

  // Yeni Personel Ekleme (Admin veya Şube Müdürü)
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!token || !['ADMIN', 'MANAGER'].includes(currentUser?.role)) return;
    try {
      const payload = {
        ...newStaff,
        branch_id: newStaff.branch_id ? parseInt(newStaff.branch_id) : (currentUser.role === 'MANAGER' ? currentUser.branch_id : null)
      };
      const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowAddStaffModal(false);
        setNewStaff({ username: '', password: '', full_name: '', role: 'STAFF', branch_id: 1 });
        fetchStaffList();
        fetchStaffPerformance();
        fetchSystemLogs();
        fetchBranchOverview();
        alert("Personel hesabı ve mağaza ataması başarıyla tamamlandı!");
      } else {
        const err = await res.json();
        alert(`❌ Hata: ${err.detail || 'Personel eklenemedi'}`);
      }
    } catch (e) { alert("Hata: " + e.message); }
  };
  const handleAddStaff = handleCreateStaff;

  // Yeni Cihaz
  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!token || currentUser?.role !== 'ADMIN') return;
    try {
      const payload = {
        slot_number: parseInt(newSlotData.slot_number),
        label: newSlotData.label,
        slot_type: newSlotData.slot_type,
        group_name: newSlotData.group_name,
        device_id: newSlotData.device_id || `DEVICE_${newSlotData.slot_number}`,
        ip_address: newSlotData.ip_address,
        port: parseInt(newSlotData.port || 80),
        tolerance_grams: parseFloat(newSlotData.tolerance_grams || 0.20)
      };

      const res = await fetch(`${API_BASE}/api/v1/iot/slots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowAddSlotModal(false);
        setNewSlotData({ slot_number: '', label: '', slot_type: 'Askı', group_name: 'Ana Vitrin', device_id: '', ip_address: '192.168.1.', port: 80, tolerance_grams: 0.20 });
        fetchSlots();
        fetchSlotGroups();
        fetchSystemLogs();
      }
    } catch (e) { alert("Hata: " + e.message); }
  };

  // Simülatör (Delta gramaj destekli)
  const runSimulator = async (slotNum, action, deltaGrams = null) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/iot/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_number: slotNum, action, delta_grams: deltaGrams })
      });
      if (res.ok) {
        const data = await res.json();
        fetchSlots();
        fetchAlerts();
        fetchSystemLogs();
        // Eğer izinsiz kaldırma ise akıllı eşleme penceresini aç
        if (action === 'LIFT_UNAUTHORIZED') {
          const slot = slots.find(s => s.slot_number === slotNum);
          if (slot) {
            handleTriggerIdentifyLift(slot.id, data.weight_dropped || deltaGrams || 28.60);
          }
        }
      }
    } catch (e) { console.error("Simulate error", e); }
  };

  // Finansal Grafik Verisi
  const chartData = useMemo(() => {
    const assets = {
      has_altin: { name: 'Has Altın (995)', unit: '₺/g', base: 3045.50, change: '+%0.42' },
      ceyrek: { name: 'Çeyrek Ziynet', unit: '₺/Adet', base: 4980.00, change: '+%0.35' },
      ons: { name: 'Ons Altın', unit: '$/oz', base: 2654.20, change: '-%0.12' },
      usd: { name: 'Amerikan Doları (USD/TRY)', unit: '₺', base: 34.85, change: '+%0.15' },
      eur: { name: 'Euro (EUR/TRY)', unit: '₺', base: 37.90, change: '+%0.08' }
    };

    const count = chartTimeframe === '1D' ? 24 : chartTimeframe === '1W' ? 28 : chartTimeframe === '1M' ? 30 : 52;
    const asset = assets[chartAsset];
    const points = [];
    let currentVal = asset.base * (chartTimeframe === '1Y' ? 0.72 : chartTimeframe === '1M' ? 0.94 : 0.98);
    
    for (let i = 0; i < count; i++) {
      const step = (Math.sin(i / 3) * 0.008 + (Math.random() - 0.48) * 0.012);
      currentVal = currentVal * (1 + step);
      const timeLabel = chartTimeframe === '1D' ? `${i}:00` : `Gün ${i + 1}`;
      points.push({ time: timeLabel, price: parseFloat(currentVal.toFixed(2)) });
    }
    points[points.length - 1].price = asset.base;

    return {
      assetInfo: asset,
      points,
      minPrice: Math.min(...points.map(p => p.price)),
      maxPrice: Math.max(...points.map(p => p.price))
    };
  }, [chartAsset, chartTimeframe]);

  const svgPathData = useMemo(() => {
    if (!chartData.points || chartData.points.length === 0) return { path: '', fillPath: '', coords: [] };
    const width = 800;
    const height = 220;
    const padding = 20;
    const range = (chartData.maxPrice - chartData.minPrice) || 1;

    const coords = chartData.points.map((p, i) => {
      const x = padding + (i / (chartData.points.length - 1)) * (width - padding * 2);
      const y = height - padding - ((p.price - chartData.minPrice) / range) * (height - padding * 2);
      return { x, y, price: p.price, time: p.time };
    });

    const path = coords.reduce((acc, c, i) => (i === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`), '');
    const fillPath = `${path} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`;

    return { path, fillPath, coords };
  }, [chartData]);


  // ================= GİRİŞ YAPILMAMIŞSA LOGIN EKRANI =================
  if (!token || !currentUser) {
    return (
      <div className="min-h-screen bg-[#0b0c10] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-[#12141c] border border-amber-500/30 rounded-2xl p-8 shadow-2xl relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border border-amber-500/40 mb-4 shadow-lg">
              <img src={LOGO_URL} alt="Logo" className="w-14 h-14 object-contain filter drop-shadow" />
            </div>
            <h1 className="font-cinzel text-2xl font-bold tracking-wider gold-gradient-text uppercase">
              SARRAF ERDEM
            </h1>
            <p className="text-xs tracking-widest text-slate-400 uppercase mt-1">
              Akıllı IoT Vitrin & Mücevherat ERP
            </p>
          </div>

          {loginError && (
            <div className="mb-6 p-3 rounded-lg bg-red-950/50 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Kullanıcı Adı
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-amber-500/70 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="admin veya personel"
                  className="w-full bg-[#0e1017] border border-[#242938] focus:border-amber-500 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Şifre
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-amber-500/70 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0e1017] border border-[#242938] focus:border-amber-500 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition"
                />
              </div>
            </div>

            <button type="submit" disabled={authLoading} className="btn-gold w-full py-3 justify-center text-sm font-bold tracking-wide mt-2">
              {authLoading ? 'Giriş Yapılıyor...' : 'Sisteme Güvenli Giriş'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#242938]">
            <p className="text-[11px] text-center text-slate-400 mb-2.5 font-medium">Hızlı Rol Seçimi (Tek Tıkla Giriş):</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setLoginUsername('admin'); setLoginPassword('admin123'); }}
                className="bg-[#191c26] border border-amber-500/40 text-amber-300 p-2 rounded-xl text-center hover:bg-amber-500/10 transition flex flex-col items-center"
              >
                <span className="text-xs font-bold">👑 Patron</span>
                <span className="text-[9px] text-amber-400/80 font-mono mt-0.5">Tüm Şirket</span>
              </button>
              <button
                type="button"
                onClick={() => { setLoginUsername('selim_mudur'); setLoginPassword('123456'); }}
                className="bg-[#191c26] border border-blue-500/40 text-blue-300 p-2 rounded-xl text-center hover:bg-blue-500/10 transition flex flex-col items-center"
              >
                <span className="text-xs font-bold">🏬 Müdür</span>
                <span className="text-[9px] text-blue-400/80 font-mono mt-0.5">Nişantaşı</span>
              </button>
              <button
                type="button"
                onClick={() => { setLoginUsername('ahmet_kasiyer'); setLoginPassword('123456'); }}
                className="bg-[#191c26] border border-emerald-500/40 text-emerald-300 p-2 rounded-xl text-center hover:bg-emerald-500/10 transition flex flex-col items-center"
              >
                <span className="text-xs font-bold">👤 Personel</span>
                <span className="text-[9px] text-emerald-400/80 font-mono mt-0.5">Kapalıçarşı</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Format Dakika/Saniye
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ================= ANA UYGULAMA PANELİ =================
  return (
    <div className="min-h-screen bg-[#0d0e13] text-slate-100 flex selection:bg-amber-500 selection:text-black">
      
      {/* ================= 1. SOL SABİT MENÜ (STITCH LUXURY SIDEBAR w-72) ================= */}
      {/* Mobil Backdrop */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside className={`fixed left-0 top-0 h-full w-72 bg-[#0d0e13] border-r border-[#242938] z-50 flex flex-col justify-between shadow-2xl transition-transform duration-300 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col flex-1 overflow-hidden">
          
          {/* Logo & Başlık Alanı */}
          <div className="p-4 flex items-center justify-between border-b border-[#242938]">
            <div 
              className="flex items-center gap-3 cursor-pointer select-none" 
              onClick={() => { setActiveTab('vitrin'); setIsMobileMenuOpen(false); }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-yellow-600/20 border border-amber-500/40 flex items-center justify-center p-1 shadow-md">
                <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-cinzel text-base font-bold tracking-wider gold-gradient-text uppercase leading-tight">
                  SARRAF ERDEM
                </span>
                <span className="text-[10px] tracking-widest text-slate-400 uppercase font-semibold mt-0.5">
                  Haute Joaillerie &amp; IoT
                </span>
              </div>
            </div>

            {/* Mobilde Menüyü Kapat Butonu */}
            <button 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1a1b21]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ESP32 Mesh Canlı Telemetri Rozeti */}
          <div className="mx-3.5 my-2.5 p-2 bg-[#161822] rounded-lg flex items-center justify-between border border-amber-500/30 shadow-inner">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">ESP32 Mesh Aktif</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">±0.003g · 80Hz</span>
          </div>

          {/* LOGONUN HEMEN ALTINDA: MAĞAZA SEÇİM ALANI (3 Rol ve Konsolide / Şube Filtresi) */}
          <div className="mx-3.5 mb-3 p-2.5 bg-[#141620] rounded-xl border border-amber-500/40 shadow-md">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">MAĞAZA SEÇİMİ:</span>
              </div>
              {currentUser?.role === 'ADMIN' ? (
                <span className="text-[9px] font-mono font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                  👑 Konsolide
                </span>
              ) : (
                <span className="text-[9px] font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                  🔒 {currentUser?.role === 'MANAGER' ? 'Müdür' : 'Personel'}
                </span>
              )}
            </div>

            <select
              value={selectedBranchFilter}
              onChange={(e) => handleBranchFilterChange(e.target.value)}
              disabled={currentUser?.role !== 'ADMIN'}
              className={`w-full bg-[#0a0b0f] border border-[#242938] rounded-lg px-2.5 py-1.5 text-white font-medium text-xs focus:outline-none focus:border-amber-500/60 transition ${
                currentUser?.role !== 'ADMIN' ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
              }`}
            >
              {currentUser?.role === 'ADMIN' && (
                <option value="ALL" className="bg-[#12141c] text-amber-300 font-bold">
                  🏢 TÜMÜ (Tüm Şirket / Konsolide)
                </option>
              )}
              {branches.map(b => (
                <option key={b.id} value={b.id} className="bg-[#12141c] text-white">
                  🏬 {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dikey Menü Navigasyonu (Rol Filtreli) */}
          <nav className="flex-1 overflow-y-auto px-3 space-y-1 scrollbar-thin">
            
            {/* 1. VİTRİN & IOT TELEMETRİSİ (PRD Modül 4 & 5) */}
            <button
              onClick={() => { setActiveTab('vitrin'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all text-left ${
                activeTab === 'vitrin'
                  ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-400 border-l-2 border-amber-400 font-bold shadow-sm'
                  : 'text-slate-300 hover:bg-[#191c26] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Vitrin &amp; IoT Telemetrisi</span>
              </div>
              {alerts.length > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold animate-pulse">
                  {alerts.length} Alarm
                </span>
              )}
            </button>

            {/* 2. MASAMDAKİ ÜRÜNLER (ZİMMET) */}
            <button
              onClick={() => { setActiveTab('custody'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all text-left ${
                activeTab === 'custody'
                  ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-400 border-l-2 border-amber-400 font-bold shadow-sm'
                  : 'text-slate-300 hover:bg-[#191c26] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-4 h-4 text-amber-400" />
                <span>Masamdaki Ürünler</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                myCustodyItems.length > 0 ? 'bg-amber-500 text-slate-950 animate-pulse' : 'bg-slate-800 text-slate-400'
              }`}>
                {myCustodyItems.length}
              </span>
            </button>

            {/* 3. STOK & FİZİKSEL KONUM TAKİBİ (PRD Modül 3) */}
            <button
              onClick={() => { setActiveTab('stock_locations'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all text-left ${
                activeTab === 'stock_locations'
                  ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-400 border-l-2 border-amber-400 font-bold shadow-sm'
                  : 'text-slate-300 hover:bg-[#191c26] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ScanBarcode className="w-4 h-4 text-amber-400" />
                <span>Stok &amp; Fiziksel Konum</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                {products.length} Ürün
              </span>
            </button>

            {/* 4. ÜRÜN & VARYANT KATALOĞU (PRD Modül 2) */}
            <button
              onClick={() => { setActiveTab('products'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all text-left ${
                activeTab === 'products'
                  ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-400 border-l-2 border-amber-400 font-bold shadow-sm'
                  : 'text-slate-300 hover:bg-[#191c26] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Store className="w-4 h-4 text-yellow-500" />
                <span>Ürün &amp; Varyant Kataloğu</span>
              </div>
            </button>

            {/* 5. KASA & HIZLI POS SATIŞ (PRD Modül 6) */}
            <button
              onClick={() => { setActiveTab('sales'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all text-left ${
                activeTab === 'sales'
                  ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-400 border-l-2 border-amber-400 font-bold shadow-sm'
                  : 'text-slate-300 hover:bg-[#191c26] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>{currentUser?.role === 'STAFF' ? 'Satışlarım & Fişler' : 'Kasa & POS Satış'}</span>
              </div>
            </button>

            {/* 6. MÜŞTERİ CRM, KAPORA & SERTİFİKA (PRD Modül 7) */}
            <button
              onClick={() => { setActiveTab('crm'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all text-left ${
                activeTab === 'crm'
                  ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-400 border-l-2 border-amber-400 font-bold shadow-sm'
                  : 'text-slate-300 hover:bg-[#191c26] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Müşteri CRM &amp; Kapora</span>
              </div>
              {reservationsList.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  {reservationsList.length} Kapora
                </span>
              )}
            </button>

            {/* 7. MAĞAZA YÖNETİMİ & ŞUBELER (PRD Modül 1 - ADMİN) */}
            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={() => { setActiveTab('management_hub'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all text-left ${
                  activeTab === 'management_hub'
                    ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-400 border-l-2 border-amber-400 font-bold shadow-sm'
                    : 'text-slate-300 hover:bg-[#191c26] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>Mağaza Yönetimi &amp; Şubeler</span>
                </div>
              </button>
            )}

            {/* 8. PERSONEL & MAĞAZA YETKİLERİ (PRD Modül 11 - YALNIZCA ADMİN) */}
            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={() => { setActiveTab('staff_roles'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all text-left border ${
                  activeTab === 'staff_roles'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Personel &amp; Yetkiler (RBAC)</span>
                </div>
                <span className="text-[10px] font-mono bg-amber-400/20 text-amber-300 px-1 rounded">Admin</span>
              </button>
            )}

            {/* MAĞAZA EKİBİM (YALNIZCA MÜDÜR) */}
            {currentUser?.role === 'MANAGER' && (
              <button
                onClick={() => { setActiveTab('staff_team'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all text-left border ${
                  activeTab === 'staff_team'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md'
                    : 'bg-blue-500/10 text-blue-300 border-blue-500/30 hover:bg-blue-500/20'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>Mağaza Ekibim</span>
                </div>
                <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-1 rounded">Müdür</span>
              </button>
            )}

            {/* 9. RAPORLAMA, KÂR-ZARAR & HAS SERMAYE (PRD Modül 8 - ADMİN & MÜDÜR) */}
            {['ADMIN', 'MANAGER'].includes(currentUser?.role) && (
              <button
                onClick={() => { setActiveTab('capital_inventory'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all text-left ${
                  activeTab === 'capital_inventory'
                    ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-400 border-l-2 border-amber-400 font-bold shadow-sm'
                    : 'text-slate-300 hover:bg-[#191c26] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>Has Sermaye &amp; Kâr Raporu</span>
                </div>
              </button>
            )}

            {/* GÜN SONU KASA (PDF) (ADMİN & MÜDÜR) */}
            {['ADMIN', 'MANAGER'].includes(currentUser?.role) && (
              <button
                onClick={() => { setActiveTab('daily_report'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all text-left ${
                  activeTab === 'daily_report'
                    ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-400 border-l-2 border-amber-400 font-bold shadow-sm'
                    : 'text-slate-300 hover:bg-[#191c26] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-sky-400" />
                  <span>Gün Sonu Kasa Raporu</span>
                </div>
                <span className="text-[9px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">PDF</span>
              </button>
            )}

            {/* 11. DONANIM SİMÜLATÖRÜ (Tüm Roller) */}
            <button
              onClick={() => { setActiveTab('simulator'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all text-left ${
                activeTab === 'simulator'
                  ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-400 border-l-2 border-amber-400 font-bold shadow-sm'
                  : 'text-slate-300 hover:bg-[#191c26] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Donanım Simülatörü</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            </button>

          </nav>

          {/* Alt Sabit Kısım: Gece VIP Modu + Kullanıcı Profil Kartı */}
          <div className="p-3 border-t border-[#242938] flex flex-col gap-2 bg-[#0d0e13]">
            
            {/* Gece VIP / Normal Mesai Modu Butonu */}
            <div className="bg-[#141620] p-1 rounded-lg flex items-center justify-between border border-[#242938]">
              <button
                onClick={handleToggleNightMode}
                className={`flex-1 py-1 px-2 rounded text-[11px] font-bold flex items-center justify-center gap-1.5 transition ${
                  securityConfig?.night_mode_active
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                    : 'bg-[#1e202b] text-amber-400 shadow-sm'
                }`}
                title="Gece / Mesai Dışı Soygun Koruma Modu"
              >
                <Moon className="w-3.5 h-3.5 text-amber-400" />
                <span>{securityConfig?.night_mode_active ? 'Gece Kilitli' : 'Gece VIP'}</span>
              </button>
              <button
                onClick={() => securityConfig?.night_mode_active && handleToggleNightMode()}
                className={`flex-1 py-1 px-2 rounded text-[11px] font-medium flex items-center justify-center gap-1.5 transition ${
                  !securityConfig?.night_mode_active ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-slate-400" />
                <span>Mesai Açık</span>
              </button>
            </div>

            {/* Kullanıcı Profil Kutusu */}
            <div className="p-2.5 bg-[#161822] rounded-xl flex items-center justify-between border border-[#242938] shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <img 
                  src={AVATAR_URL} 
                  alt="Kullanıcı" 
                  className="w-8 h-8 rounded-full object-cover border border-amber-500/40 shrink-0" 
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-white truncate">
                    {currentUser?.full_name || 'Sarraf Görevlisi'}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    {currentUser?.role === 'ADMIN' ? '👑 Mağaza Sahibi' : currentUser?.role === 'MANAGER' ? '🏬 Mağaza Müdürü' : '👤 Satış Danışmanı'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Siren Sustur / Panik */}
                <button
                  onClick={handleTriggerPanic}
                  className={`p-1.5 rounded-lg transition ${
                    panicActive ? 'bg-rose-600 text-white animate-bounce' : 'text-rose-400 hover:bg-rose-500/20'
                  }`}
                  title="Gizli Panik Butonu (Sessiz Alarm)"
                >
                  <Siren className="w-4 h-4" />
                </button>

                {/* Çıkış */}
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                  title="Çıkış Yap"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

        </div>
      </aside>

      {/* ================= 2. SAĞ İÇERİK ALANI (lg:pl-72) ================= */}
      <div className="lg:pl-72 flex flex-col min-h-screen w-full">

        {/* 1. ÜST KAPALIÇARŞI CANLI BORSA TICKER */}
        <div className="no-print bg-[#08090d] border-b border-[#242938] h-9 overflow-hidden flex items-center px-4 relative z-30 text-[11px]">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wider pr-4 border-r border-[#242938] shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span>KAPALIÇARŞI BORSA:</span>
          </div>
          <div className="overflow-hidden whitespace-nowrap w-full">
            <div className="inline-flex gap-8 animate-marquee pl-4 text-slate-300">
              <span className="inline-flex items-center gap-1">
                🪙 <b>Has Altın:</b> <span className="font-semibold text-white">₺3.746,50</span> <span className="text-slate-400">/</span> <span className="font-semibold text-amber-400">₺3.788,20</span> <span className="text-emerald-400 text-[10px]">%+0.42 ▲</span>
              </span>
              <span className="inline-flex items-center gap-1">
                🪙 <b>22 Ayar:</b> <span className="font-semibold text-white">₺3.432,00</span> <span className="text-slate-400">/</span> <span className="font-semibold text-amber-400">₺3.564,80</span> <span className="text-emerald-400 text-[10px]">%+0.28 ▲</span>
              </span>
              <span className="inline-flex items-center gap-1">
                🪙 <b>Çeyrek:</b> <span className="font-semibold text-white">₺6.095,00</span> <span className="text-slate-400">/</span> <span className="font-semibold text-amber-400">₺6.195,00</span> <span className="text-emerald-400 text-[10px]">%+0.35 ▲</span>
              </span>
              <span className="inline-flex items-center gap-1">
                🌎 <b>ONS Altın:</b> <span className="font-semibold text-amber-400">$3.044,20</span> <span className="text-rose-400 text-[10px]">%-0.12 ▼</span>
              </span>
              <span className="inline-flex items-center gap-1">
                💵 <b>USD/TRY:</b> <span className="font-semibold text-white">34,85 ₺</span> <span className="text-emerald-400 text-[10px]">%+0.15 ▲</span>
              </span>
            </div>
          </div>
        </div>

        {/* 2. STICKY MODERN HEADER */}
        <header className="no-print bg-[#0d0e13]/90 backdrop-blur-xl border-b border-[#242938] h-16 px-4 lg:px-6 sticky top-0 z-40 flex items-center justify-between shadow-sm">
          
          {/* Sol: Hamburger Butonu (Mobil) & Aktif Sekme Başlığı */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-[#161822] text-amber-400 border border-[#242938] hover:bg-[#1f2230]"
              title="Menüyü Aç"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">
                SARRAF ERDEM VİTRİN ERP
              </span>
              <h1 className="text-base lg:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                {activeTab === 'vitrin' && 'Canlı Vitrin & Askı Güvenliği'}
                {activeTab === 'custody' && 'Masamdaki Ürünler (Zimmet)'}
                {activeTab === 'sales' && (currentUser?.role === 'STAFF' ? 'Satışlarım & Fişler' : 'Kasa & Hızlı POS Satış')}
                {activeTab === 'stock_locations' && 'Stok & Fiziksel Konum Takibi (Kasa / Tabla / Askı)'}
                {activeTab === 'crm' && 'Müşteri CRM, Kapora & Sertifika'}
                {activeTab === 'staff_roles' && 'Personel & Mağaza Yetkileri (RBAC)'}
                {activeTab === 'staff_team' && 'Mağaza Ekibim'}
                {activeTab === 'sessions_analytics' && 'Hizmet Seans Analizi & Eksik Modeller'}
                {activeTab === 'daily_report' && 'Gün Sonu Kasa Raporu (PDF)'}
                {activeTab === 'capital_inventory' && 'Has Altın & Sermaye Raporu'}
                {activeTab === 'security_center' && 'Güvenlik & Sahte Altın'}
                {activeTab === 'tv_board' && 'Canlı Kur TV Panosu'}
                {activeTab === 'chart_view' && 'Döviz & Altın Grafiği'}
                {activeTab === 'stock_audit' && 'Hızlı Sayım & Barkod Mutabakat'}
                {activeTab === 'masak_legal' && 'MASAK & Resmi Gider Pusulası'}
                {activeTab === 'management_hub' && 'Şubeler & Logo ERP Entegrasyonu'}
                {activeTab === 'iot_devices' && 'IoT Sensör & IP Dağıtımı'}
                {activeTab === 'logs' && 'Sistem & Güvenlik Kayıtları'}
                {activeTab === 'products' && 'Ürün Kataloğu & Barkodlar'}
                {activeTab === 'simulator' && 'Donanım Test Simülatörü'}
              </h1>
            </div>
          </div>

          {/* Sağ: Hızlı Aksiyonlar */}
          <div className="flex items-center gap-2 lg:gap-3">
            
            {/* AKTİF HİZMET SEANSI & KRONOMETRE */}
            {activeServiceSession ? (
              <div className="flex items-center gap-2 bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-1 rounded-lg text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span className="font-semibold text-emerald-300 hidden sm:inline">
                  {activeServiceSession.customer_name}:
                </span>
                <strong className="font-mono text-emerald-400">{formatTimer(sessionSeconds)}</strong>
                <button
                  onClick={() => {
                    setEndSessionData(prev => ({ ...prev, customer_name: activeServiceSession.customer_name, duration_minutes: (sessionSeconds / 60).toFixed(1) }));
                    setShowEndSessionModal(true);
                  }}
                  className="ml-1 px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition"
                >
                  Bitir
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleStartServiceSession("Yeni Müşteri")}
                className="btn-secondary text-xs py-1.5 px-2.5 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hidden sm:flex items-center gap-1.5"
                title="Yeni bir müşteriyle ilgilenmeye başla"
              >
                <Timer className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">Müşteri Seansı</span>
              </button>
            )}

            {/* HIZLI KASA / POS BUTONU */}
            <button
              onClick={() => {
                if (activeTab !== 'sales') setActiveTab('sales');
                setShowDirectSaleModal(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 hover:brightness-110 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5 active:scale-95"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hızlı POS Satış</span>
            </button>

            {/* SİREN SUSTUR / TEST */}
            <button
              onClick={handleTriggerPanic}
              className="px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 border border-rose-500/30 text-xs font-bold transition flex items-center gap-1 active:scale-95"
              title="Siren Sustur / Alarm Test"
            >
              <Siren className="w-3.5 h-3.5 animate-pulse text-rose-400" />
              <span className="hidden md:inline">Siren Kontrol</span>
            </button>

            {/* SES AÇ/KAPA */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg bg-[#161822] text-slate-300 hover:text-white border border-[#242938]"
              title={soundEnabled ? 'Alarm Sesini Kapat' : 'Alarm Sesini Aç'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* TV KUR PANOSU */}
            <button
              onClick={() => setActiveTab('tv_board')}
              className="p-1.5 rounded-lg bg-[#161822] text-amber-400 hover:text-amber-300 border border-amber-500/30"
              title="Tam Ekran TV Yayını"
            >
              <Tv className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* 3. ALARM BANNER */}
        {alerts.length > 0 && (
          <div className="no-print alert-banner-blink px-5 py-2.5 text-white flex items-center justify-between shadow-xl z-30">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-white animate-bounce shrink-0" />
              <div className="text-xs font-bold">
                DİKKAT: {alerts.length} ADET İZİNSİZ VİTRİN HAREKETİ / AĞIRLIK EKSİLMESİ ALGILANDI!
              </div>
            </div>
            <div className="flex items-center gap-2">
              {alerts.slice(0, 2).map((a) => (
                <button
                  key={a.id}
                  onClick={() => handleTriggerIdentifyLift(a.slot_id, a.weight_lost)}
                  className="bg-white text-rose-900 hover:bg-rose-100 text-[11px] font-bold py-1 px-2.5 rounded shadow transition"
                >
                  #{a.slot_id} Ürünü Eşle &amp; Zimmete Al
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. ANA İÇERİK ALANI */}
        <main className="flex-1 p-4 lg:p-6 w-full max-w-[1600px] mx-auto">

        {/* ================= SEKME 1: VİTRİN & ÇOKLU ASKI YÖNETİMİ ================= */}
        {activeTab === 'vitrin' && (
          <div className="space-y-6">
            
            {/* KONSOLİDE ŞİRKET VEYA MAĞAZA ÖZET ŞERİDİ */}
            <div className="bg-gradient-to-r from-[#12141c] via-[#161a24] to-[#12141c] border border-amber-500/30 rounded-2xl p-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242938] pb-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <Building2 className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold">
                      {selectedBranchFilter === 'ALL' ? '🏢 KONSOLİDE GENEL MERKEZ GÖRÜNÜMÜ' : '🏬 MAĞAZA ÖZEL GÖRÜNÜMÜ'}
                    </div>
                    <h2 className="font-cinzel text-base font-bold text-white tracking-wide">
                      {branchOverview?.branch_name || (selectedBranchFilter === 'ALL' ? 'Tüm Şirket (Konsolide Genel Merkez)' : 'Mağaza')}
                    </h2>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedBranchFilter === 'ALL' ? (
                    <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full font-mono font-bold">
                      🏢 Tüm Şirket Konsolide Raporu
                    </span>
                  ) : (
                    <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/40 px-3 py-1 rounded-full font-mono font-bold">
                      🏬 Tekil Mağaza Verileri
                    </span>
                  )}
                  {currentUser?.role === 'ADMIN' && (
                    <button
                      onClick={() => setActiveTab('staff_roles')}
                      className="text-xs btn-secondary py-1 px-3 border-amber-500/40 text-amber-400 hover:bg-amber-500/10 font-bold flex items-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Personel & Yetkiler</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-[#191c26] p-3 rounded-xl border border-[#242938]">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Toplam Ciro</div>
                  <div className="text-lg font-bold text-white font-mono mt-1">
                    {(branchOverview?.total_sales_amount || 0).toLocaleString('tr-TR')} ₺
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">
                    {branchOverview?.total_sales_count || 0} adet satış tamamlandı
                  </div>
                </div>

                <div className="bg-[#191c26] p-3 rounded-xl border border-[#242938]">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Has Altın Stoğu</div>
                  <div className="text-lg font-bold text-amber-400 font-mono mt-1">
                    {(branchOverview?.total_has_grams || 0).toFixed(2)} gr
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">995.0 saf has karşılığı</div>
                </div>

                <div className="bg-[#191c26] p-3 rounded-xl border border-[#242938]">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Toplam Sermaye Değeri</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
                    {(branchOverview?.total_capital_tl || 0).toLocaleString('tr-TR')} ₺
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Canlı has kur ile değerlendi</div>
                </div>

                <div className="bg-[#191c26] p-3 rounded-xl border border-[#242938]">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Vitrindeki Ürün</div>
                  <div className="text-lg font-bold text-white font-mono mt-1">
                    {branchOverview?.total_products_count || 0} Adet
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Aktif askı/tablalarda</div>
                </div>

                <div className="bg-[#191c26] p-3 rounded-xl border border-[#242938]">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Kayıtlı Personel</div>
                  <div className="text-lg font-bold text-amber-300 font-mono mt-1">
                    {branchOverview?.staff_count || 0} Kişi
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {selectedBranchFilter === 'ALL' ? 'Tüm Şirket Ekibi' : 'Şube Personeli'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* STITCH: Donanım Test Konsolu ve Hızlı Simülasyon Şeridi */}
            <div className="p-2.5 rounded-xl bg-[#161822] border border-[#242938] flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2 text-slate-300">
                <Cpu className="w-4 h-4 text-amber-400" />
                <span className="text-xs uppercase tracking-wider font-bold text-amber-400">Donanım Test Konsolu:</span>
                <span className="text-xs text-slate-400 font-mono hidden md:inline">ESP32 Mesh Load-Cell Hızlı Tetikleyiciler</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => runSimulator(slots[0]?.slot_number || 1, 'LIFT_UNAUTHORIZED', 28.60)}
                  className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 transition text-xs font-semibold flex items-center gap-1.5 active:scale-95"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Hırsızlık Alarmı (-28.60g)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const firstProd = slots.flatMap(s => s.products || []).find(p => p.status === 'Vitrinde');
                    if (firstProd) {
                      handleInitiateCustomerTrial(firstProd);
                    } else {
                      setActiveTab('custody');
                    }
                  }}
                  className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition text-xs font-semibold flex items-center gap-1.5 active:scale-95"
                >
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Yetkili İnceleme / Sunum</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    slots.forEach(s => runSimulator(s.slot_number, 'TARE'));
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 hover:text-amber-400 hover:bg-slate-700 border border-slate-700 transition text-xs font-semibold flex items-center gap-1.5 active:scale-95"
                >
                  <Scale className="w-3.5 h-3.5 text-slate-300" />
                  <span>Sensör Kalibrasyon (Dara 0.00g)</span>
                </button>
              </div>
            </div>

            {/* Grup ve Tip Filtresi */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#12141c] p-3 rounded-xl border border-[#242938]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5" />
                  Vitrin / Bölüm:
                </span>
                <button
                  onClick={() => setSelectedGroupFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                    selectedGroupFilter === 'ALL' ? 'bg-amber-500 text-black' : 'bg-[#191c26] text-slate-300 hover:text-white'
                  }`}
                >
                  Tümü
                </button>
                {slotGroups.map(grp => (
                  <button
                    key={grp}
                    onClick={() => setSelectedGroupFilter(grp)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                      selectedGroupFilter === grp ? 'bg-amber-500 text-black' : 'bg-[#191c26] text-slate-300 hover:text-white'
                    }`}
                  >
                    {grp}
                  </button>
                ))}
              </div>

              <div className="text-xs text-slate-400">
                💡 <em>Bir askıda birden fazla bilezik/model asılı olabilir; kaldırıldığında gramaj eşleme devreye girer.</em>
              </div>
            </div>

            {/* Askı / Tabla Kartları (Çoklu Ürün Destekli) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {slots.map((slot) => {
                const isAlert = slot.status === 'ALERT';
                const activeProds = (slot.products || []).filter(p => p.status === 'Vitrinde');
                const custodyProds = (slot.products || []).filter(p => p.status === 'Zimmette');

                return (
                  <div
                    key={slot.id}
                    className={`luxury-card p-4 relative overflow-hidden flex flex-col justify-between ${
                      isAlert ? 'alert-card-pulse' : ''
                    }`}
                  >
                    <div>
                      {/* Kart Başlığı */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold font-mono uppercase">
                            #{slot.slot_number} {slot.slot_type || 'Askı'}
                          </span>
                          <span className="text-xs font-semibold text-slate-300">{slot.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{slot.group_name || 'Ana Vitrin'}</span>
                      </div>

                      {/* Asılı Modeller Listesi */}
                      <div className="my-2 space-y-2">
                        {activeProds.length > 0 ? (
                          activeProds.map(prod => (
                            <div key={prod.id} className="flex items-center justify-between p-2 bg-[#0e1017] rounded-lg border border-[#242938]">
                              <div className="flex items-center gap-2 min-w-0">
                                {prod.image_url ? (
                                  <img src={prod.image_url} alt={prod.name} className="w-9 h-9 object-cover rounded border border-[#242938]" />
                                ) : (
                                  <div className="w-9 h-9 rounded bg-amber-500/10 flex items-center justify-center text-amber-400">
                                    <Sparkles className="w-4 h-4" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-white truncate">{prod.name}</div>
                                  <div className="text-[10px] text-amber-400 font-mono">
                                    {prod.purity} • {prod.weight_grams} gr
                                  </div>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-xs font-display font-bold text-white">{prod.price.toLocaleString('tr-TR')} ₺</div>
                                <button
                                  onClick={() => handleTakeIntoCustody(prod.id, slot.id)}
                                  className="text-[10px] text-amber-400 hover:text-amber-300 underline font-semibold"
                                  title="Müşteriye denetmek için masaya al"
                                >
                                  Masaya Al ➔
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-4 text-center text-slate-500 text-xs bg-[#0e1017]/40 rounded border border-dashed border-[#242938]">
                            Bu askıda şu an asılı ürün yok.
                          </div>
                        )}

                        {/* Masada Denetlenen Ürünler (Zimmet) */}
                        {custodyProds.length > 0 && (
                          <div className="p-2 rounded bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-300">
                            <strong>Müşteri Masasında:</strong>
                            {custodyProds.map(cp => (
                              <div key={cp.id} className="flex items-center justify-between mt-1">
                                <span>• {cp.name} ({cp.weight_grams} gr)</span>
                                <span className="text-[10px] text-slate-400">Denetiliyor</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Toplam Yük ve Sensör Göstergesi */}
                      <div className="grid grid-cols-2 gap-2 my-2 p-2 bg-[#191c26]/60 rounded-lg border border-[#242938]">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase">Toplam Beklenen</div>
                          <div className="font-mono text-sm font-bold text-slate-200">{slot.expected_weight.toFixed(2)} gr</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase">Anlık Sensör</div>
                          <div className={`font-mono text-sm font-bold ${isAlert ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {slot.current_weight.toFixed(2)} gr
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Alt İşlemler */}
                    <div className="pt-2 border-t border-[#242938] flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleInspection(slot.id, slot.is_inspection_authorized)}
                          className={`text-[11px] px-2 py-1 rounded font-semibold transition ${
                            slot.is_inspection_authorized ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-[#191c26] text-slate-400 hover:text-white'
                          }`}
                        >
                          {slot.is_inspection_authorized ? '✓ İzinli' : 'İnceleme İzni'}
                        </button>
                        {currentUser.role === 'ADMIN' && (
                          <button
                            onClick={() => handleCalibrate(slot.id)}
                            className="text-[11px] px-1.5 py-1 bg-[#191c26] text-slate-400 hover:text-amber-400 rounded transition"
                            title="Dara Al"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {isAlert && (
                        <button
                          onClick={() => handleTriggerIdentifyLift(slot.id)}
                          className="btn-danger text-xs py-1 px-2.5 font-bold"
                        >
                          Eksileni Eşle
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= SEKME 2: MASAMDAKİ ÜRÜNLER (ZİMMET & HİZMET SEANSI) ================= */}
        {activeTab === 'custody' && (
          <div className="space-y-6">
            
            {/* Üst Bilgi Barı */}
            <div className="bg-[#12141c] p-4 rounded-xl border border-amber-500/40 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-cinzel text-lg font-bold text-white">MASAMDAKİ MÜCEVHERLER & HİZMET SEANSI</h2>
                  <p className="text-xs text-slate-400">
                    Müşteriye denetmek üzere vitrinden aldığınız zimmetli ürünler. Satış yapabilir veya vitrine iade edebilirsiniz.
                  </p>
                </div>
              </div>

              {/* Seans Kronometresi ve Bitir Butonu */}
              <div className="flex items-center gap-3">
                {activeServiceSession ? (
                  <div className="flex items-center gap-2 bg-[#0e1017] p-2 rounded-lg border border-[#242938]">
                    <Clock className="w-4 h-4 text-emerald-400 animate-spin" />
                    <span className="text-xs font-mono font-bold text-white">
                      Hizmet Süresi: <strong className="text-emerald-400">{formatTimer(sessionSeconds)}</strong>
                    </span>
                    <button
                      onClick={() => {
                        setEndSessionData(prev => ({ ...prev, customer_name: activeServiceSession.customer_name, duration_minutes: (sessionSeconds / 60).toFixed(1) }));
                        setShowEndSessionModal(true);
                      }}
                      className="btn-gold text-xs py-1 px-3"
                    >
                      Hizmeti Tamamla & Not Düş
                    </button>
                  </div>
                ) : (
                  <button onClick={() => handleStartServiceSession("Müşteri")} className="btn-secondary text-xs py-2 px-3 text-emerald-400 border-emerald-500/40">
                    <Timer className="w-4 h-4" />
                    <span>Müşteri Hizmet Seansı Başlat</span>
                  </button>
                )}
              </div>
            </div>

            {/* Masadaki Ürünler Listesi */}
            {myCustodyItems.length === 0 ? (
              <div className="luxury-card p-12 text-center text-slate-500">
                <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <h3 className="text-base font-bold text-slate-300">Şu anda masanızda zimmetli ürün bulunmuyor.</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Vitrin askısından bir bilezik veya takı aldığınızda akıllı gramaj eşleme ile otomatik olarak masanıza eklenecektir.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {myCustodyItems.map(item => (
                  <div key={item.id} className="luxury-card p-4 border-amber-500/40 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold font-mono">
                          {item.purity} • {item.category}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold">● Masada Denetiliyor</span>
                      </div>

                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-40 object-cover rounded-lg mb-3 border border-[#242938]" />
                      ) : (
                        <div className="w-full h-40 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 mb-3">
                          <Sparkles className="w-8 h-8" />
                        </div>
                      )}

                      <h3 className="font-bold text-sm text-white">{item.name}</h3>
                      <div className="text-xs text-slate-400 font-mono mt-1">
                        Ağırlık: <strong className="text-white">{item.weight_grams} gr</strong>
                      </div>
                      <div className="text-lg font-bold font-display text-amber-400 mt-1">
                        {item.price.toLocaleString('tr-TR')} ₺
                      </div>
                    </div>

                    {/* Masadaki Ürün Aksiyonları: Satış Yap veya Vitrine İade Et */}
                    <div className="pt-3 border-t border-[#242938] grid grid-cols-2 gap-2 mt-3">
                      <button
                        onClick={() => {
                          setSelectedProductForSale(item);
                          setShowSaleModal(true);
                        }}
                        className="btn-gold justify-center text-xs py-1.5"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Satışını Yap</span>
                      </button>
                      <button
                        onClick={() => handleReturnToRack(item.id)}
                        className="btn-secondary justify-center text-xs py-1.5 text-slate-300 hover:text-white"
                        title="Ürünü vitrindeki askısına geri koy"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Vitrine Geri Koy</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ================= SEKME 3: HİZMET SÜRELERİ & EKSİK MODEL RAPORU ================= */}
        {activeTab === 'sessions_analytics' && (
          <div className="space-y-6">
            
            {/* Personel Hizmet Metrikleri */}
            <div className="luxury-card p-5 border-amber-500/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <Timer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-cinzel text-base font-bold text-white">PERSONEL MÜŞTERİ HİZMET SÜRELERİ</h3>
                    <p className="text-xs text-slate-400">Kasiyer ve danışmanların müşteri ilgilenme dakikaları ve satışa dönüşüm oranları</p>
                  </div>
                </div>
                <button onClick={fetchServiceAnalytics} className="btn-secondary text-xs py-1 px-3">
                  <RefreshCw className="w-3 h-3" />
                  Yenile
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {serviceAnalytics.staff_stats.map(st => (
                  <div key={st.user_id} className="bg-[#191c26] p-4 rounded-xl border border-[#242938]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-sm text-white">{st.full_name}</div>
                      <span className="text-[10px] text-amber-400 font-mono">@{st.username}</span>
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Hizmet Verilen Müşteri:</span>
                        <strong className="font-mono text-white">{st.total_customers_served} Kişi</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Toplam Hizmet Süresi:</span>
                        <strong className="font-mono text-white">{st.total_service_minutes} Dakika</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Ortalama Müşteri Başı:</span>
                        <strong className="font-mono text-amber-400">{st.avg_service_minutes} Dk</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Satışa Dönen Seans:</span>
                        <strong className="font-mono text-emerald-400">{st.sales_conversion_count} Satış</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Müşterilerin İsteyip Bulamadığı Modeller (Karar Destek / Stok Açığı) */}
            <div className="luxury-card p-5 border-amber-500/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                    <FileQuestion className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-cinzel text-base font-bold text-white">MAĞAZADA BULUNAMAYAN / TALEP EDİLEN MODELLER</h3>
                    <p className="text-xs text-slate-400">
                      Müşterilerin sorup vitrinde bulamadığı modeller. İmalat ve sipariş kararları için doğrudan rehber niteliğindedir.
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#191c26] text-slate-400 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="p-3">Tarih</th>
                      <th className="p-3">Talep Edilen Model</th>
                      <th className="p-3">Kategori / Ayar</th>
                      <th className="p-3">Müşteri Notu & Detay</th>
                      <th className="p-3">Kaydeden Danışman</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#242938]">
                    {serviceAnalytics.missing_models.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-6 text-center text-slate-500">
                          Henüz kaydedilmiş eksik model talebi yok.
                        </td>
                      </tr>
                    ) : (
                      serviceAnalytics.missing_models.map(mm => (
                        <tr key={mm.id} className="hover:bg-[#191c26]/50 transition">
                          <td className="p-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">{mm.created_at}</td>
                          <td className="p-3 font-bold text-amber-300">{mm.requested_model}</td>
                          <td className="p-3 font-mono text-slate-300">{mm.purity} • {mm.category}</td>
                          <td className="p-3 text-slate-300 italic">{mm.notes || '—'}</td>
                          <td className="p-3 text-white font-semibold">{mm.user_name}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ================= SEKME 4: SATIŞLAR & PERFORMANS ================= */}
        {activeTab === 'sales' && (
          <div className="space-y-6">
            
            {/* Filtre Barı */}
            <div className="bg-[#12141c] p-4 rounded-xl border border-[#242938] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 bg-[#0e1017] p-1 rounded-lg border border-[#242938]">
                  {[
                    { id: 'today', label: 'Bugün' },
                    { id: 'week', label: 'Bu Hafta' },
                    { id: 'month', label: 'Bu Ay' },
                    { id: 'year', label: 'Bu Yıl' },
                    { id: 'all', label: 'Tüm Zamanlar' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setSalesTimeRange(tab.id)}
                      className={`px-3 py-1 rounded text-xs font-semibold transition ${
                        salesTimeRange === tab.id ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {currentUser.role === 'ADMIN' ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400 font-medium">Personel:</span>
                    <select
                      value={salesStaffFilter}
                      onChange={(e) => setSalesStaffFilter(e.target.value)}
                      className="bg-[#191c26] border border-[#242938] text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none"
                    >
                      <option value="ALL">Tüm Personeller</option>
                      {staffList.map(s => (
                        <option key={s.id} value={s.id}>{s.full_name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-lg font-semibold">
                    👤 Kendi Satışlarınız ({currentUser.full_name})
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 font-medium">Kategori:</span>
                  <select
                    value={salesCategoryFilter}
                    onChange={(e) => setSalesCategoryFilter(e.target.value)}
                    className="bg-[#191c26] border border-[#242938] text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none"
                  >
                    <option value="ALL">Tüm Kategoriler</option>
                    <option value="Bilezik">Bilezik</option>
                    <option value="Yüzük">Yüzük</option>
                    <option value="Kolye">Kolye</option>
                    <option value="Küpe">Küpe</option>
                    <option value="Set">Set</option>
                  </select>
                </div>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Ürün adı, barkod, müşteri adı veya fiş no ile arayın..."
                  value={salesSearchQuery}
                  onChange={(e) => setSalesSearchQuery(e.target.value)}
                  className="w-full bg-[#0e1017] border border-[#242938] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Satışlar Tablosu */}
            <div className="luxury-card overflow-hidden">
              <div className="p-4 border-b border-[#242938] flex items-center justify-between">
                <h3 className="font-cinzel text-sm font-bold text-white">SATIŞ DÖKÜMÜ ({salesList.length} İşlem)</h3>
                <span className="text-xs text-amber-400 font-mono font-bold">
                  Toplam Ciro: {salesList.reduce((acc, s) => acc + s.sale_price, 0).toLocaleString('tr-TR')} ₺
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#191c26] text-slate-400 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="p-3">Fiş No</th>
                      <th className="p-3">Tarih</th>
                      <th className="p-3">Ürün</th>
                      <th className="p-3">Ayar / Gram</th>
                      <th className="p-3">Müşteri</th>
                      <th className="p-3">Satıcı</th>
                      <th className="p-3">Ödeme</th>
                      <th className="p-3 text-right">Tutar</th>
                      <th className="p-3 text-center">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#242938]">
                    {salesList.map(s => (
                      <tr key={s.id} className="hover:bg-[#191c26]/50 transition">
                        <td className="p-3 font-mono font-bold text-amber-400">{s.invoice_no || `SE-${s.id}`}</td>
                        <td className="p-3 text-slate-400 font-mono text-[11px]">{new Date(s.created_at).toLocaleString('tr-TR')}</td>
                        <td className="p-3 font-bold text-white">{s.product_name}</td>
                        <td className="p-3 font-mono text-slate-300">{s.purity} • {s.weight_grams} gr</td>
                        <td className="p-3 text-slate-300">{s.customer_name}</td>
                        <td className="p-3 text-slate-200">{s.sold_by_name}</td>
                        <td className="p-3">{s.payment_method}</td>
                        <td className="p-3 text-right font-bold font-display text-white">{s.sale_price.toLocaleString('tr-TR')} ₺</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleSendCertificateEmail(s)}
                            className="text-[11px] px-2 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded hover:bg-amber-500/20 transition flex items-center gap-1 mx-auto"
                          >
                            <Mail className="w-3 h-3" />
                            <span>Sertifika</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= SEKME: STOK & FİZİKSEL KONUM TAKİBİ (PRD MODÜL 3 & 4) ================= */}
        {activeTab === 'stock_locations' && (
          <div className="space-y-6">
            {/* ÜST BAŞLIK & KONTROL PANELİ */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-[#12141c] via-[#161a26] to-[#12141c] p-4 lg:p-5 rounded-2xl border border-amber-500/30 shadow-xl">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                  <span>PRD MODÜL 3 & 4</span>
                  <span>•</span>
                  <span>CANLI ENVANTER MATRİSİ</span>
                </div>
                <h2 className="font-cinzel text-lg lg:text-xl font-bold text-white flex items-center gap-2 mt-0.5">
                  <MapPin className="w-5 h-5 text-amber-400" />
                  STOK & FİZİKSEL KONUM TAKİBİ (KASA / TABLA / ASKI)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Her ürünün fiziksel adresini (Hangi Mağaza, Kasa mı, Tabla mı, Askı mı) anlık izleyin.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER') && (
                  <button
                    onClick={() => setShowAddLocationModal(true)}
                    className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
                  >
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>Yeni Konum Tanımla (Kasa/Tabla/Askı)</span>
                  </button>
                )}
                {currentUser?.role === 'ADMIN' && (
                  <button
                    onClick={() => setShowAddProductModal(true)}
                    className="btn-gold text-xs py-2 px-4 flex items-center gap-1.5 shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Yeni Ürün / Stok Ekle</span>
                  </button>
                )}
              </div>
            </div>

            {/* HIZLI KONUM VE STOK METRİKLERİ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <div className="bg-[#12141c] border border-[#242938] p-4 rounded-xl">
                <span className="text-[11px] text-slate-400 font-medium">Toplam Kayıtlı Mücevher</span>
                <div className="text-xl lg:text-2xl font-bold font-mono text-white mt-1">
                  {products.length} <span className="text-xs font-normal text-slate-500">Adet</span>
                </div>
              </div>

              <div className="bg-[#12141c] border border-[#242938] p-4 rounded-xl">
                <span className="text-[11px] text-amber-400/90 font-medium">Toplam Vitrin Ağırlığı</span>
                <div className="text-xl lg:text-2xl font-bold font-mono text-amber-400 mt-1">
                  {products.reduce((acc, p) => acc + (p.weight_grams || 0), 0).toFixed(2)} <span className="text-xs font-normal text-slate-400">Gram</span>
                </div>
              </div>

              <div className="bg-[#12141c] border border-[#242938] p-4 rounded-xl">
                <span className="text-[11px] text-emerald-400/90 font-medium">Vitrin & Teşhirde</span>
                <div className="text-xl lg:text-2xl font-bold font-mono text-emerald-400 mt-1">
                  {products.filter(p => p.status === 'Vitrinde' || p.status === 'AVAILABLE').length} <span className="text-xs font-normal text-slate-500">Adet</span>
                </div>
              </div>

              <div className="bg-[#12141c] border border-[#242938] p-4 rounded-xl">
                <span className="text-[11px] text-blue-400/90 font-medium">Kasadaki Ürünler</span>
                <div className="text-xl lg:text-2xl font-bold font-mono text-blue-400 mt-1">
                  {products.filter(p => p.location_type === 'Kasa' || p.slot_id === null).length} <span className="text-xs font-normal text-slate-500">Adet</span>
                </div>
              </div>
            </div>

            {/* FİLTRELEME & ARAMA ÇUBUĞU */}
            <div className="bg-[#12141c] border border-[#242938] p-4 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Konum Tipi Sekmeleri */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {[
                  { id: 'ALL', label: 'Tüm Konumlar' },
                  { id: 'Askı', label: '📍 Askılar' },
                  { id: 'Tabla', label: '🏷️ Tablalar' },
                  { id: 'Kasa', label: '🔐 Kasalar' }
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => setStockLocationFilterType(type.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                      stockLocationFilterType === type.id
                        ? 'bg-amber-500 text-slate-950 font-bold shadow'
                        : 'bg-[#181b26] text-slate-400 hover:text-white hover:bg-[#202534]'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {/* Arama Kutusu */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ürün adı, barkod, RFID veya konum etiketi ara..."
                  value={stockSearchQuery}
                  onChange={(e) => setStockSearchQuery(e.target.value)}
                  className="w-full bg-[#181b26] border border-[#2a3042] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* ÜRÜN & KONUM LİSTESİ */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products
                .filter(p => {
                  if (stockLocationFilterType !== 'ALL') {
                    if (stockLocationFilterType === 'Kasa' && p.location_type !== 'Kasa' && p.slot_id !== null) return false;
                    if (stockLocationFilterType === 'Askı' && p.slot_type !== 'Askı') return false;
                    if (stockLocationFilterType === 'Tabla' && p.slot_type !== 'Tabla') return false;
                  }
                  if (stockSearchQuery) {
                    const q = stockSearchQuery.toLowerCase();
                    const matchName = p.name?.toLowerCase().includes(q);
                    const matchBarcode = p.barcode?.toLowerCase().includes(q);
                    const matchLocation = (p.location_label || '').toLowerCase().includes(q);
                    const matchBranch = (p.branch_name || '').toLowerCase().includes(q);
                    return matchName || matchBarcode || matchLocation || matchBranch;
                  }
                  return true;
                })
                .map(product => {
                  const calculatedPrice = (product.weight_grams * (marketData?.altin_gram || 3100)) + (product.labor_cost || 0);
                  const locationTag = product.location_label || 
                    (product.slot_id ? `${product.branch_name || 'Şube'} – Tabla #${Math.ceil(product.slot_id / 4)} – Askı #${product.slot_id}` : `${product.branch_name || 'Şube'} – 🔐 Ana Çelik Kasa`);

                  return (
                    <div
                      key={product.id}
                      className="bg-gradient-to-b from-[#161822] to-[#10121a] border border-[#242938] hover:border-amber-500/50 rounded-2xl p-4.5 flex flex-col justify-between transition duration-200 group shadow-lg"
                    >
                      <div>
                        {/* Üst Bilgi Barı */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {product.purity} • {product.weight_grams}g
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            product.status === 'Vitrinde' || product.status === 'AVAILABLE'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : product.status === 'Satıldı'
                              ? 'bg-slate-700/50 text-slate-400'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            ● {product.status}
                          </span>
                        </div>

                        {/* Fiziksel Konum Rozeti (Zorunlu) */}
                        <div className="bg-[#0b0d13] border border-amber-500/40 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Zorunlu Fiziksel Konum:</div>
                            <div className="text-xs font-bold text-amber-300 truncate font-mono">
                              {locationTag}
                            </div>
                          </div>
                        </div>

                        {/* Görsel ve İsim */}
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            onClick={() => openProductDetailModal(product)}
                            className="w-16 h-16 rounded-xl bg-[#0d0f17] border border-[#262c3e] overflow-hidden flex items-center justify-center shrink-0 cursor-pointer group-hover:border-amber-500/40 transition"
                          >
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Sparkles className="w-6 h-6 text-amber-400/50" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                              {product.category} • {product.gold_color || 'Sarı Altın'}
                            </span>
                            <h3
                              onClick={() => openProductDetailModal(product)}
                              className="font-bold text-sm text-white truncate cursor-pointer hover:text-amber-300 transition"
                            >
                              {product.name}
                            </h3>
                            <div className="text-xs font-mono text-slate-400 mt-0.5">
                              Barkod: {product.barcode || `SE-${product.id}`}
                            </div>
                          </div>
                        </div>

                        {/* Fiyat ve Hesaplama */}
                        <div className="bg-[#0e1017] p-2.5 rounded-lg border border-[#1e2332] flex items-center justify-between mb-3">
                          <span className="text-[11px] text-slate-400">Anlık Canlı Değer:</span>
                          <span className="text-sm font-bold font-mono text-amber-400">
                            {calculatedPrice.toLocaleString('tr-TR')} ₺
                          </span>
                        </div>
                      </div>

                      {/* Aksiyon Butonları */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#202534]">
                        <button
                          onClick={() => openProductDetailModal(product)}
                          className="btn-secondary text-[11px] py-1.5 px-2 flex items-center justify-center gap-1 border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                          title="Ürün Detay & Renk/Boy Varyantları"
                        >
                          <Layers className="w-3.5 h-3.5 text-amber-400" />
                          <span>Varyant & Detay</span>
                        </button>

                        <button
                          onClick={() => handleGenerateCertificate(product.id)}
                          className="btn-secondary text-[11px] py-1.5 px-2 flex items-center justify-center gap-1 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10"
                          title="Resmi Garanti Sertifikası Yazdır"
                        >
                          <Award className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Sertifika QR</span>
                        </button>

                        <button
                          onClick={() => {
                            setReservationFormData(prev => ({
                              ...prev,
                              product_id: product.id,
                              total_agreed_price: calculatedPrice
                            }));
                            setShowReservationModal(true);
                          }}
                          className="btn-secondary text-[11px] py-1.5 px-2 flex items-center justify-center gap-1 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
                          title="Müşteriye Ayır ve Kapora Al"
                        >
                          <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Kapora / Ayır</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedProductForSale(product);
                            setShowSaleModal(true);
                          }}
                          className="btn-gold text-[11px] py-1.5 px-2 flex items-center justify-center gap-1 font-bold"
                          title="Doğrudan POS Satışa Gönder"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>POS Satış</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ================= SEKME 5: GÜN SONU KASA (PDF RAPOR) ================= */}
        {activeTab === 'daily_report' && (
          <div className="space-y-6">
            <div className="no-print flex items-center justify-between bg-[#12141c] p-4 rounded-xl border border-[#242938]">
              <div>
                <h2 className="font-cinzel text-lg font-bold text-white">GÜN SONU KASA & MAĞAZA RAPORU</h2>
                <p className="text-xs text-slate-400">Resmi onaylı, kaşeli A4 formatında döküm alın ve PDF olarak kaydedin.</p>
              </div>
              <button onClick={handlePrintReport} className="btn-gold py-2 px-4 text-xs">
                <Printer className="w-4 h-4" />
                <span>📄 PDF Olarak Kaydet / Yazdır</span>
              </button>
            </div>

            <div id="printable-report" className="luxury-card p-6 border-amber-500/30 space-y-6">
              <div className="flex items-center justify-between border-b pb-4 border-[#242938]">
                <div className="flex items-center gap-3">
                  <img src={LOGO_URL} alt="Logo" className="w-12 h-12 object-contain" />
                  <div>
                    <h1 className="font-cinzel text-xl font-bold tracking-wider gold-gradient-text">SARRAF ERDEM MÜCEVHERAT</h1>
                    <p className="text-xs text-slate-400">Kapalıçarşı No: 42 Fatih / İstanbul • Tel: (0212) 522 00 00</p>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-mono font-bold text-amber-400">GÜN SONU RAPORU</div>
                  <div className="text-slate-400 font-mono">Tarih: {new Date().toLocaleDateString('tr-TR')}</div>
                  <div className="text-slate-500 font-mono">Raporlayan: {currentUser.full_name}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#191c26] p-3 rounded-lg border border-[#242938]">
                  <div className="text-[10px] text-slate-400 uppercase">Toplam Ciro</div>
                  <div className="text-lg font-bold font-display text-white mt-1">
                    {(analytics?.total_sales_revenue || 0).toLocaleString('tr-TR')} ₺
                  </div>
                </div>
                <div className="bg-[#191c26] p-3 rounded-lg border border-[#242938]">
                  <div className="text-[10px] text-slate-400 uppercase">Satılan Altın</div>
                  <div className="text-lg font-bold font-mono text-amber-400 mt-1">
                    {(analytics?.total_gold_grams_sold || 0).toFixed(2)} gr
                  </div>
                </div>
                <div className="bg-[#191c26] p-3 rounded-lg border border-[#242938]">
                  <div className="text-[10px] text-slate-400 uppercase">Satış Adedi</div>
                  <div className="text-lg font-bold font-mono text-white mt-1">
                    {analytics?.total_sales_count || 0} Adet
                  </div>
                </div>
                <div className="bg-[#191c26] p-3 rounded-lg border border-[#242938]">
                  <div className="text-[10px] text-slate-400 uppercase">Vitrindeki Ürün</div>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                    {analytics?.total_products_in_showcase || 0} Adet
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-cinzel text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Satışı Yapılan Ürünler Listesi
                </h3>
                <table className="w-full text-xs text-left border border-[#242938]">
                  <thead className="bg-[#191c26] text-slate-400 text-[10px] font-mono">
                    <tr>
                      <th className="p-2 border-b border-[#242938]">Fiş No</th>
                      <th className="p-2 border-b border-[#242938]">Ürün Adı</th>
                      <th className="p-2 border-b border-[#242938]">Ayar / Gram</th>
                      <th className="p-2 border-b border-[#242938]">Müşteri</th>
                      <th className="p-2 border-b border-[#242938]">Personel</th>
                      <th className="p-2 border-b border-[#242938] text-right">Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#242938]">
                    {salesList.map(s => (
                      <tr key={s.id}>
                        <td className="p-2 font-mono text-amber-400">{s.invoice_no || `SE-${s.id}`}</td>
                        <td className="p-2 font-bold text-white">{s.product_name}</td>
                        <td className="p-2 font-mono text-slate-300">{s.purity} • {s.weight_grams} gr</td>
                        <td className="p-2 text-slate-300">{s.customer_name}</td>
                        <td className="p-2 text-slate-300">{s.sold_by_name}</td>
                        <td className="p-2 text-right font-display font-bold text-white">{s.sale_price.toLocaleString('tr-TR')} ₺</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs text-slate-400">
                <div className="border-t border-dashed border-[#242938] pt-2">
                  <div>Teslim Eden (Satış Danışmanı)</div>
                  <div className="font-bold text-white mt-1">{currentUser.full_name}</div>
                </div>
                <div className="border-t border-dashed border-[#242938] pt-2">
                  <div>Teslim Alan (Mağaza Müdürü)</div>
                  <div className="font-bold text-white mt-1">Erdem Sarraf</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= SEKME 6: DÖVİZ & ALTIN CANLI GRAFİĞİ ================= */}
        {activeTab === 'chart_view' && (
          <div className="space-y-6">
            <div className="bg-[#12141c] p-4 rounded-xl border border-[#242938] flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'has_altin', label: '🪙 Has Altın (995)' },
                  { id: 'ceyrek', label: '🪙 Çeyrek Altın' },
                  { id: 'ons', label: '🌎 Ons Altın ($)' },
                  { id: 'usd', label: '💵 USD / TRY' },
                  { id: 'eur', label: '💶 EUR / TRY' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setChartAsset(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      chartAsset === item.id ? 'bg-amber-500 text-black shadow' : 'bg-[#191c26] text-slate-300 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-[#0e1017] p-1 rounded-lg border border-[#242938] text-xs">
                {['1D', '1W', '1M', '1Y'].map(tf => (
                  <button
                    key={tf}
                    onClick={() => setChartTimeframe(tf)}
                    className={`px-2.5 py-1 rounded font-bold transition ${
                      chartTimeframe === tf ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            <div className="luxury-card p-6 border-amber-500/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-cinzel text-xl font-bold text-white flex items-center gap-2">
                    <span>{chartData.assetInfo.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                      {chartData.assetInfo.change}
                    </span>
                  </h2>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold font-display text-amber-400">
                    {hoveredPoint ? hoveredPoint.price.toLocaleString('tr-TR') : chartData.assetInfo.base.toLocaleString('tr-TR')} {chartData.assetInfo.unit}
                  </div>
                </div>
              </div>

              <div className="chart-container relative flex items-center justify-center">
                <svg viewBox="0 0 800 220" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="goldGradientFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d4af37" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#d4af37" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <line x1="0" y1="40" x2="800" y2="40" className="chart-grid-line" />
                  <line x1="0" y1="110" x2="800" y2="110" className="chart-grid-line" />
                  <line x1="0" y1="180" x2="800" y2="180" className="chart-grid-line" />
                  <path d={svgPathData.fillPath} className="chart-area" />
                  <path d={svgPathData.path} className="chart-line" />
                  {svgPathData.coords.map((c, idx) => (
                    <circle
                      key={idx}
                      cx={c.x}
                      cy={c.y}
                      r={hoveredPoint?.time === c.time ? 6 : 3}
                      className="fill-amber-400 cursor-pointer hover:fill-white transition-all"
                      onMouseEnter={() => setHoveredPoint(c)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  ))}
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* ================= SEKME 7: MÜŞTERİ CRM ================= */}
        {activeTab === 'crm' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-[#12141c] p-4 rounded-xl border border-[#242938]">
              <div>
                <h2 className="font-cinzel text-lg font-bold text-white">MÜŞTERİ CRM & SATIN ALMA GEÇMİŞİ</h2>
                <p className="text-xs text-slate-400">Müşteri sadakati, tercihleri ve satın alma dökümleri</p>
              </div>
              <button onClick={() => setShowAddCustomerModal(true)} className="btn-gold text-xs py-2 px-3.5">
                <Plus className="w-4 h-4" />
                <span>Yeni Müşteri Ekle</span>
              </button>
            </div>

            {/* AYRILAN ÜRÜNLER & ALINAN KAPORALAR BÖLÜMÜ (PRD MODÜL 7) */}
            <div className="bg-[#12141c] border border-[#242938] rounded-xl p-4 lg:p-5">
              <div className="flex items-center justify-between mb-4 border-b border-[#242938] pb-3">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="font-bold text-sm text-white">MÜŞTERİYE AYRILAN ÜRÜNLER & KAPORA TAKİBİ</h3>
                    <p className="text-[11px] text-slate-400">Kapora alınmış veya vitrinden ayrılmış ürünler ve opsiyon süreleri</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setReservationFormData({
                      customer_id: customers[0]?.id || '',
                      product_id: products[0]?.id || '',
                      deposit_amount: '',
                      total_agreed_price: '',
                      reserved_until: '',
                      notes: ''
                    });
                    setShowReservationModal(true);
                  }}
                  className="btn-secondary text-xs py-1.5 px-3 border-amber-500/40 text-amber-300 hover:bg-amber-500/10 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yeni Kapora / Ayırma Kaydet</span>
                </button>
              </div>

              {reservationsList.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs bg-[#0c0e14] rounded-lg border border-dashed border-[#242938]">
                  Şu anda aktif veya bekleyen ürün ayırma / kapora kaydı bulunmuyor.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#181b26] text-slate-400 uppercase text-[10px] font-mono">
                      <tr>
                        <th className="p-3">Rezervasyon No</th>
                        <th className="p-3">Müşteri</th>
                        <th className="p-3">Mücevher</th>
                        <th className="p-3">Kapora (₺)</th>
                        <th className="p-3">Kalan Bakiye (₺)</th>
                        <th className="p-3">Opsiyon Bitiş</th>
                        <th className="p-3">Durum</th>
                        <th className="p-3 text-right">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#202534]">
                      {reservationsList.map(r => {
                        const remaining = (r.total_agreed_price || 0) - (r.deposit_amount || 0);
                        return (
                          <tr key={r.id} className="hover:bg-[#161924] transition">
                            <td className="p-3 font-mono text-amber-300 font-bold">{r.reservation_code}</td>
                            <td className="p-3 font-bold text-white">{r.customer_name || `Müşteri #${r.customer_id}`}</td>
                            <td className="p-3 text-slate-300">{r.product_name || `Ürün #${r.product_id}`}</td>
                            <td className="p-3 font-mono font-bold text-emerald-400">
                              {(r.deposit_amount || 0).toLocaleString('tr-TR')} ₺
                            </td>
                            <td className="p-3 font-mono text-amber-400">
                              {remaining > 0 ? `${remaining.toLocaleString('tr-TR')} ₺` : 'Tamamı Ödendi'}
                            </td>
                            <td className="p-3 font-mono text-slate-400">
                              {r.reserved_until ? new Date(r.reserved_until).toLocaleDateString('tr-TR') : '-'}
                            </td>
                            <td className="p-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                r.status === 'ACTIVE'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : r.status === 'COMPLETED'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              }`}>
                                {r.status === 'ACTIVE' ? 'Aktif Opsiyon' : r.status === 'COMPLETED' ? 'Satışa Dönüştü' : 'İptal Edildi'}
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-1.5">
                              {r.status === 'ACTIVE' && (
                                <>
                                  <button
                                    onClick={() => handleUpdateReservationStatus(r.id, 'COMPLETED')}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[10px] transition"
                                    title="Satış Tamamlandı"
                                  >
                                    Satışa Dönüştür
                                  </button>
                                  <button
                                    onClick={() => handleUpdateReservationStatus(r.id, 'CANCELLED')}
                                    className="px-2 py-1 bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white rounded font-bold text-[10px] transition"
                                    title="İptal Et"
                                  >
                                    İptal
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customers.map(c => (
                <div key={c.id} className="luxury-card p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase font-mono bg-amber-500/20 text-amber-300">
                        {c.customer_type}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">#{c.id}</span>
                    </div>
                    <h3 className="font-bold text-sm text-white">{c.full_name}</h3>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-amber-500/70" />
                      <span>{c.phone || 'Telefon Kayıtsız'}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#242938] mt-4 flex items-center justify-between">
                    <div className="text-xs font-bold font-display text-amber-400">
                      {c.total_spent.toLocaleString('tr-TR')} ₺ ({c.total_items} Parça)
                    </div>
                    <button onClick={() => handleOpenCustomerHistory(c.id)} className="btn-secondary text-[11px] py-1 px-2.5">
                      <span>Geçmiş</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= SEKME 8: SİSTEM DENETİM GÜNLÜĞÜ (AUDIT LOGS) ================= */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            <div className="bg-[#12141c] p-4 rounded-xl border border-[#242938] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-bold uppercase">Seviye:</span>
                {['ALL', 'INFO', 'WARNING', 'SECURITY', 'ERROR'].map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setLogLevelFilter(lvl)}
                    className={`px-2.5 py-1 rounded font-semibold text-xs transition ${
                      logLevelFilter === lvl ? 'bg-amber-500 text-black' : 'bg-[#191c26] text-slate-300 hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
              <button onClick={fetchSystemLogs} className="btn-secondary text-xs py-1 px-3">
                <RefreshCw className="w-3 h-3" />
                Yenile
              </button>
            </div>

            <div className="luxury-card overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#191c26] text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3">Zaman</th>
                    <th className="p-3">Seviye</th>
                    <th className="p-3">Modül</th>
                    <th className="p-3">İşlem Detayı</th>
                    <th className="p-3">Kullanıcı</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#242938]">
                  {systemLogs.map(lg => (
                    <tr key={lg.id} className="hover:bg-[#191c26]/50 transition">
                      <td className="p-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(lg.created_at).toLocaleString('tr-TR')}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          lg.level === 'SECURITY' || lg.level === 'ERROR' ? 'bg-rose-950/60 text-rose-400' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {lg.level}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-amber-400 font-bold">{lg.module}</td>
                      <td className="p-3 text-white font-medium">{lg.message}</td>
                      <td className="p-3 text-slate-300">{lg.user_name || 'Sistem'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= SEKME 9: TV EKRANI ================= */}
        {activeTab === 'tv_board' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-[#12141c] p-4 rounded-xl border border-amber-500/40">
              <div className="flex items-center gap-3">
                <Tv className="w-6 h-6 text-amber-400" />
                <h2 className="font-cinzel text-lg font-bold text-white">4K VİTRİN & TV CANLI KUR TAKİP EKRANI</h2>
              </div>
              <button
                onClick={() => {
                  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
                  else document.exitFullscreen();
                }}
                className="btn-gold text-xs py-2 px-3"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Tam Ekran Modu (F11)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: 'HAS ALTIN (995)', purity: '24K Saf Altın', buy: '3.045,50', sell: '3.058,00', change: '+%0.42' },
                { name: '22 AYAR BİLEZİK', purity: '22K Geleneksel', buy: '2.890,00', sell: '2.915,00', change: '+%0.28' },
                { name: '14 AYAR TAKI ALTINI', purity: '14K Fantezi', buy: '1.820,00', sell: '1.865,00', change: '+%0.18' },
                { name: 'ÇEYREK ZİYNET', purity: 'Eski / Yeni', buy: '4.980,00', sell: '5.035,00', change: '+%0.35' },
                { name: 'YARIM ALTIN', purity: 'Darphane', buy: '9.960,00', sell: '10.070,00', change: '+%0.30' },
                { name: 'ATA LİRA', purity: 'Cumhuriyet', buy: '20.450,00', sell: '20.680,00', change: '+%0.40' }
              ].map(card => (
                <div key={card.name} className="luxury-card p-6 border-amber-500/30 text-center">
                  <div className="text-xs font-mono text-amber-400 font-bold uppercase mb-1">{card.purity}</div>
                  <h3 className="font-cinzel text-xl font-bold text-white mb-4">{card.name}</h3>
                  <div className="grid grid-cols-2 gap-4 my-2 py-3 bg-[#0e1017] rounded-xl border border-[#242938]">
                    <div>
                      <div className="text-[11px] text-slate-400 uppercase">ALIŞ (₺)</div>
                      <div className="font-display text-2xl font-bold text-white mt-1">{card.buy}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-amber-400 uppercase">SATIŞ (₺)</div>
                      <div className="font-display text-2xl font-bold text-amber-400 mt-1">{card.sell}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= SEKME 10: ALTIN ENVANTERİ ================= */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#12141c] p-4 rounded-xl border border-[#242938]">
              <div>
                <h2 className="font-cinzel text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  ALTIN & MÜCEVHER VİTRİN KOLEKSİYONU
                </h2>
                <p className="text-xs text-slate-400">Müşteriye özel lüks sunum yapabilir, 4C pırlanta ve altın hikayesini gösterebilirsiniz.</p>
              </div>
              <div className="flex items-center gap-2">
                {currentUser.role === 'ADMIN' && (
                  <>
                    <button
                      onClick={() => setShowBulkImportModal(true)}
                      className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Excel/CSV Toplu İçe Aktar</span>
                    </button>
                    <button onClick={() => setShowAddProductModal(true)} className="btn-gold text-xs py-2 px-3.5 flex items-center gap-1.5">
                      <Plus className="w-4 h-4" />
                      <span>Yeni Mücevher Ekle</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map(p => (
                <div key={p.id} className="luxury-card overflow-hidden flex flex-col justify-between border border-[#242938] hover:border-amber-500/50 transition duration-300">
                  <div>
                    <div className="relative cursor-pointer" onClick={() => handleOpenPresentation(p.id)}>
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-48 object-cover group-hover:scale-105 transition duration-500" />
                      ) : (
                        <div className="w-full h-48 bg-amber-500/10 flex items-center justify-center text-amber-400">
                          <Sparkles className="w-10 h-10" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-amber-300 font-mono font-bold border border-amber-500/30">
                          {p.purity} • {p.milyem || (p.purity === '22K' ? 916 : 585)}‰
                        </span>
                        {p.has_stones && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950/80 backdrop-blur-sm text-indigo-300 font-bold border border-indigo-500/40">
                            💎 {p.diamond_carat ? `${p.diamond_carat} ct` : 'Taşlı'} {p.diamond_color || ''}
                          </span>
                        )}
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm font-bold text-emerald-400 border border-emerald-500/30">
                          ● {p.status}
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{p.category} • {p.gold_color || 'Sarı Altın'}</div>
                      <h3 className="font-bold text-sm text-white mt-0.5 line-clamp-1 hover:text-amber-300 cursor-pointer" onClick={() => handleOpenPresentation(p.id)}>
                        {p.name}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono mt-1">
                        <span>{p.weight_grams} gr</span>
                        <span className="text-[11px] text-slate-300 italic">{p.craftsmanship_type || 'El İşçiliği'}</span>
                      </div>
                      <div className="text-base font-display font-bold text-amber-400 mt-2.5">
                        {p.price.toLocaleString('tr-TR')} ₺
                      </div>
                    </div>
                  </div>

                  <div className="p-3 border-t border-[#242938] bg-[#0c0e14] flex items-center justify-between gap-1 text-xs">
                    <button
                      onClick={() => handleOpenPresentation(p.id)}
                      className="btn-secondary text-[11px] py-1 px-2 flex-1 justify-center border-amber-500/30 hover:border-amber-400 text-amber-300"
                    >
                      👁️ Müşteriye Sun
                    </button>
                    {p.status !== 'Satıldı' && (
                      <button
                        onClick={() => { setSelectedProductForSale(p); setShowSaleModal(true); }}
                        className="btn-gold text-[11px] py-1 px-3"
                      >
                        Satış
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= SEKME 11: IOT TABLA & IP YAPILANDIRMA ================= */}
        {activeTab === 'iot_devices' && currentUser.role === 'ADMIN' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-[#12141c] p-4 rounded-xl border border-[#242938]">
              <h2 className="font-cinzel text-lg font-bold text-white">IOT TABLA & IP YAPILANDIRMASI</h2>
              <button onClick={() => setShowAddSlotModal(true)} className="btn-gold text-xs py-2 px-3.5">
                <Plus className="w-4 h-4" />
                <span>Yeni Cihaz Tanımla</span>
              </button>
            </div>

            <div className="luxury-card overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#191c26] text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3">Yuva No</th>
                    <th className="p-3">Etiket & Grup</th>
                    <th className="p-3">Tür</th>
                    <th className="p-3">IP Adresi</th>
                    <th className="p-3">Asılı Modeller</th>
                    <th className="p-3">Toplam Yük</th>
                    <th className="p-3 text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#242938]">
                  {slots.map(s => (
                    <tr key={s.id} className="hover:bg-[#191c26]/50 transition">
                      <td className="p-3 font-mono font-bold text-amber-400">#{s.slot_number}</td>
                      <td className="p-3 font-bold text-white">{s.label} ({s.group_name})</td>
                      <td className="p-3 font-mono text-slate-300">{s.slot_type}</td>
                      <td className="p-3 font-mono text-emerald-400 font-bold">{s.ip_address}</td>
                      <td className="p-3 text-slate-300">
                        {(s.products || []).length > 0 ? (
                          <span className="font-semibold text-white">{(s.products || []).length} Model Asılı</span>
                        ) : (
                          <span className="text-slate-500 italic">Boş</span>
                        )}
                      </td>
                      <td className="p-3 font-mono font-bold text-amber-400">{s.expected_weight} gr</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => { setSelectedSlotForEdit(s); setShowEditDeviceModal(true); }}
                          className="btn-secondary text-[11px] py-1 px-2.5"
                        >
                          Düzenle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= SEKME 12: SİMÜLATÖR (DELTA GRAMAJ TESTLİ) ================= */}
        {activeTab === 'simulator' && (
          <div className="space-y-6">
            <div className="bg-[#12141c] p-4 rounded-xl border border-[#242938]">
              <h2 className="font-cinzel text-lg font-bold text-white">IOT YÜK HÜCRESİ VE ÇOKLU ASKI SİMÜLATÖRÜ</h2>
              <p className="text-xs text-slate-400">
                Askıdan belirli bir gramajdaki bileziği kaldırıp akıllı gramaj eşleme ve alarm sihirbazını test edin
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {slots.map(s => (
                <div key={s.id} className="luxury-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-sm text-white">#{s.slot_number} {s.label}</div>
                    <span className="text-xs font-mono text-amber-400 font-bold">{s.current_weight.toFixed(2)} gr</span>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono">
                    Asılı: {(s.products || []).map(p => `${p.name.slice(0, 15)}.. (${p.weight_grams}g)`).join(' + ') || 'Yok'}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => runSimulator(s.slot_number, 'LIFT_UNAUTHORIZED', 28.60)}
                      className="btn-danger justify-center text-[11px] py-1.5"
                    >
                      🚨 28.60g Bilezik Kaldır
                    </button>
                    <button
                      onClick={() => runSimulator(s.slot_number, 'LIFT_UNAUTHORIZED', 14.20)}
                      className="btn-danger justify-center text-[11px] py-1.5"
                    >
                      🚨 14.20g Bilezik Kaldır
                    </button>
                    <button
                      onClick={() => runSimulator(s.slot_number, 'RETURN_PRODUCT')}
                      className="btn-secondary justify-center text-[11px] py-1.5"
                    >
                      ↺ Askıya Geri Koy
                    </button>
                    <button
                      onClick={() => runSimulator(s.slot_number, 'TARE')}
                      className="btn-secondary justify-center text-[11px] py-1.5"
                    >
                      0.00 Dara
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= SEKME: HAS & SERMAYE RAPORU & KRİTİK STOK ================= */}
        {activeTab === 'capital_inventory' && (
          <div className="space-y-6">
            {/* Üst Başlık & ESL Güncelleme */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#12141c] p-4 rounded-xl border border-[#242938]">
              <div>
                <h2 className="font-cinzel text-lg font-bold text-white flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-400" />
                  AYAR/HAS BAZLI SERMAYE & KRİTİK STOK YÖNETİMİ
                </h2>
                <p className="text-xs text-slate-400">
                  Vitrindeki ve kasadaki altınların ayar bazında has karşılığı, sermaye değeri ve tedarik sipariş önerileri
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleEslSync}
                  className={`btn-secondary text-xs py-1.5 px-3 border-amber-500/40 text-amber-300 font-bold transition flex items-center gap-1.5 ${
                    eslSyncSuccess ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400' : 'hover:bg-amber-500/10'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${eslSyncSuccess ? 'animate-spin' : ''}`} />
                  <span>{eslSyncSuccess ? '✓ Vitrin Etiketleri Senkronize Edildi!' : '📡 Dijital Fiyat Etiketlerini Güncelle (ESL)'}</span>
                </button>
                <button onClick={fetchCapitalReport} className="btn-secondary text-xs py-1.5 px-3">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Yenile</span>
                </button>
              </div>
            </div>

            {/* Sermaye Özet Kartları */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="luxury-card p-4">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Toplam Has Altın (24K)</div>
                <div className="text-2xl font-display font-bold text-amber-400 mt-1">
                  {capitalReport ? `${capitalReport.total_has_grams.toLocaleString('tr-TR')} gr` : '...'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Brüt Toplam: {capitalReport?.total_gross_grams} gr ({capitalReport?.total_piece_count} Parça)
                </div>
              </div>

              <div className="luxury-card p-4">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Toplam Sermaye Değeri</div>
                <div className="text-2xl font-display font-bold text-white mt-1">
                  {capitalReport ? `${capitalReport.total_capital_tl.toLocaleString('tr-TR')} ₺` : '...'}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                  ${capitalReport?.total_capital_usd.toLocaleString('tr-TR')} • €{capitalReport?.total_capital_eur.toLocaleString('tr-TR')}
                </div>
              </div>

              <div className="luxury-card p-4">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Vitrin Sermaye Dağılımı</div>
                <div className="text-2xl font-display font-bold text-amber-300 mt-1">
                  {capitalReport ? `${capitalReport.showcase_capital_tl.toLocaleString('tr-TR')} ₺` : '...'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Vitrinde Açık Sergilenen Kıymet
                </div>
              </div>

              <div className="luxury-card p-4">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Çelik Kasa Rezervi</div>
                <div className="text-2xl font-display font-bold text-slate-200 mt-1">
                  {capitalReport ? `${capitalReport.vault_capital_tl.toLocaleString('tr-TR')} ₺` : '...'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Kasada Kilitli Depolanan Kıymet
                </div>
              </div>
            </div>

            {/* Ayar Bazlı Has Raporu Tablosu */}
            <div className="luxury-card p-5">
              <h3 className="font-cinzel text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-400" />
                AYAR BAZINDA DETAYLI HAS ALTIN & MİLYEM DÖKÜMÜ
              </h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>AYAR GRUBU</th>
                      <th>MİLYEM / KATSAYI</th>
                      <th>ADET</th>
                      <th>BRÜT GRAM</th>
                      <th>SAF HAS ALTIN (g)</th>
                      <th>SERMAYE DEĞERİ (₺)</th>
                      <th>PAY (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {capitalReport?.purity_breakdown?.map((item, idx) => {
                      const share = capitalReport.total_capital_tl > 0 ? ((item.capital_value_tl / capitalReport.total_capital_tl) * 100).toFixed(1) : 0;
                      return (
                        <tr key={idx} className="hover:bg-[#191c26]/60 transition">
                          <td className="font-bold text-white">{item.purity}</td>
                          <td className="font-mono text-amber-400">{item.purity_factor.toFixed(3)}</td>
                          <td className="font-mono text-slate-300">{item.piece_count} ad.</td>
                          <td className="font-mono text-white">{item.gross_weight_grams.toFixed(2)} gr</td>
                          <td className="font-mono font-bold text-amber-400">{item.has_gold_grams.toFixed(2)} gr</td>
                          <td className="font-display font-bold text-white">{item.capital_value_tl.toLocaleString('tr-TR')} ₺</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-[#242938] rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${share}%` }} />
                              </div>
                              <span className="font-mono text-[10px] text-slate-400">%{share}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Kritik Stok & Toptancı WhatsApp Sipariş Taslağı */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="luxury-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <h3 className="font-cinzel text-sm font-bold text-white">KRİTİK STOK UYARISI ({criticalStock?.suggested_products?.length || 0})</h3>
                  </div>
                  <span className="text-[11px] bg-rose-950/60 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded font-mono">
                    Eşik: ≤ 2 Adet
                  </span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {criticalStock?.suggested_products?.map(p => (
                    <div key={p.product_id} className="p-3 bg-[#0e1017] rounded-lg border border-[#242938] flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white">{p.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{p.purity} {p.category} • Barkod: {p.barcode}</div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono font-bold">Kalan: {p.current_stock}</span>
                        <div className="text-[10px] text-amber-400 mt-1">Önerilen Sipariş: +{p.suggested_order_qty} ad.</div>
                      </div>
                    </div>
                  ))}
                  {(!criticalStock?.suggested_products || criticalStock.suggested_products.length === 0) && (
                    <div className="text-center py-6 text-slate-500 text-xs">Tüm ürün stok seviyeleri güvenli eşik üzerinde.</div>
                  )}
                </div>
              </div>

              {/* WhatsApp Sipariş Metni */}
              <div className="luxury-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-cinzel text-sm font-bold text-white flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-emerald-400" />
                    TOPTANCIYA SİPARİŞ METNİ (WHATSAPP)
                  </h3>
                  <button
                    onClick={() => {
                      if (criticalStock?.whatsapp_draft_text) {
                        navigator.clipboard.writeText(criticalStock.whatsapp_draft_text);
                        setCopiedWhatsAppMsg(true);
                        setTimeout(() => setCopiedWhatsAppMsg(false), 2500);
                      }
                    }}
                    className="btn-secondary text-[11px] py-1 px-2.5 border-emerald-500/40 text-emerald-300 font-bold"
                  >
                    {copiedWhatsAppMsg ? '✓ Kopyalandı!' : 'Metni Kopyala'}
                  </button>
                </div>

                <div className="p-3 bg-[#08090d] rounded-lg border border-emerald-500/30 font-mono text-[11px] text-emerald-300 whitespace-pre-wrap max-h-56 overflow-y-auto">
                  {criticalStock?.whatsapp_draft_text || 'Sipariş taslağı hazırlanıyor...'}
                </div>
                <p className="text-[10px] text-slate-400">
                  Bu metni tek tıkla kopyalayıp atölye ustanıza veya Kapalıçarşı toptancınıza WhatsApp üzerinden doğrudan iletebilirsiniz.
                </p>
              </div>
            </div>

            {/* Durgun Stok Raporu */}
            <div className="luxury-card p-5">
              <h3 className="font-cinzel text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                ÜRÜN YAŞAM DÖNGÜSÜ & DURGUN STOK ANALİZİ (STRATEJİK ÖNERİLER)
              </h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ÜRÜN</th>
                      <th>KATEGORİ</th>
                      <th>FİYAT</th>
                      <th>VİTRİNDE GEÇEN SÜRE</th>
                      <th>DENENME SAYISI</th>
                      <th>DURGUNLUK SKORU</th>
                      <th>ÖNERİLEN STRATEJİ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stagnantStock.map(p => (
                      <tr key={p.product_id} className="hover:bg-[#191c26]/60 transition">
                        <td className="font-bold text-white">{p.name}</td>
                        <td className="text-slate-300">{p.purity} {p.category}</td>
                        <td className="font-display font-bold text-white">{p.price.toLocaleString('tr-TR')} ₺</td>
                        <td className="font-mono text-slate-300">{p.days_in_showcase} Gün</td>
                        <td className="font-mono text-amber-400">{p.view_count} Kez ({Math.round(p.total_inspection_seconds / 60)} dk)</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            p.stagnant_score === 'KRİTİK DURGUN' ? 'bg-rose-950/60 text-rose-400 border border-rose-500/40' :
                            p.stagnant_score === 'ORTA DURGUN' ? 'bg-amber-950/60 text-amber-400 border border-amber-500/40' :
                            'bg-emerald-950/60 text-emerald-400'
                          }`}>
                            {p.stagnant_score}
                          </span>
                        </td>
                        <td className="text-xs text-slate-300 font-semibold">{p.recommendation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= SEKME: BARKOD / RFID HIZLI SAYIM & MUTABAKAT ================= */}
        {activeTab === 'stock_audit' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#12141c] p-4 rounded-xl border border-[#242938]">
              <div>
                <h2 className="font-cinzel text-lg font-bold text-white flex items-center gap-2">
                  <ScanBarcode className="w-5 h-5 text-sky-400" />
                  BARKOD / RFID İLE HIZLI VİTRİN SAYIMI & MUTABAKAT
                </h2>
                <p className="text-xs text-slate-400">
                  El terminali veya barkod okuyucuyla vitrin raflarını seri okutup sistemle anlık mutabakat yapın
                </p>
              </div>
              <button
                onClick={handleStartAudit}
                className="btn-gold text-xs py-2 px-4 flex items-center gap-2 font-bold"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Sayım Oturumu Başlat</span>
              </button>
            </div>

            {activeAudit ? (
              <div className="space-y-6">
                {/* Sayım Durumu ve Özet Sayaçlar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="luxury-card p-4">
                    <div className="text-[11px] text-slate-400 font-semibold">Aktif Sayım</div>
                    <div className="text-base font-bold text-white mt-1">{activeAudit.title}</div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded mt-2 inline-block bg-sky-950/60 text-sky-400 border border-sky-500/40">
                      {activeAudit.status === 'IN_PROGRESS' ? '● SAYIM DEVAM EDİYOR' : '✓ TAMAMLANDI'}
                    </span>
                  </div>

                  <div className="luxury-card p-4 border-emerald-500/40 bg-emerald-950/10">
                    <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Uyuşan / Rafta Doğrulanan
                    </div>
                    <div className="text-3xl font-display font-bold text-emerald-400 mt-1">{activeAudit.matched_count}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Sistem ve vitrinde teyit edildi</div>
                  </div>

                  <div className="luxury-card p-4 border-rose-500/40 bg-rose-950/10">
                    <div className="text-[11px] text-rose-400 font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Eksik Ürünler
                    </div>
                    <div className="text-3xl font-display font-bold text-rose-400 mt-1">{activeAudit.missing_count}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Sistemde vitrinde var, rafta yok</div>
                  </div>

                  <div className="luxury-card p-4 border-amber-500/40 bg-amber-950/10">
                    <div className="text-[11px] text-amber-400 font-semibold flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4" /> Fazla / Yersiz Parçalar
                    </div>
                    <div className="text-3xl font-display font-bold text-amber-400 mt-1">{activeAudit.surplus_count}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Bu vitrinde kayıtlı değil ama okutuldu</div>
                  </div>
                </div>

                {/* Barkod Okuma Girişi & Hızlı Test Tuşları */}
                <div className="luxury-card p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1">
                      <ScanBarcode className="w-5 h-5 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={auditBarcodeScan}
                        onChange={(e) => setAuditBarcodeScan(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleScanAuditBarcode(); }}
                        placeholder="El terminaliyle barkod okutun veya barkod no yazıp Enter'a basın (Örn: KYM-2024-001)..."
                        className="w-full bg-[#0e1017] border border-[#242938] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>
                    <button
                      onClick={() => handleScanAuditBarcode()}
                      className="btn-gold px-5 py-2.5 font-bold text-xs shrink-0"
                    >
                      Barkodu Tara
                    </button>
                    <button
                      onClick={handleFinishAudit}
                      className="btn-danger px-5 py-2.5 font-bold text-xs shrink-0"
                    >
                      Sayımı Bitir & Mutabakatı Kapat
                    </button>
                  </div>

                  {/* Hızlı Test Çubuğu */}
                  <div className="flex items-center gap-2 text-xs flex-wrap pt-2 border-t border-[#242938]">
                    <span className="text-slate-400 text-[11px]">Hızlı Simülasyon (Barkod Seç):</span>
                    {products.slice(0, 5).map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleScanAuditBarcode(p.barcode)}
                        className="btn-secondary text-[11px] py-1 px-2 font-mono hover:border-sky-500"
                      >
                        +{p.barcode} ({p.name.slice(0, 12)}..)
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sayım Sonuç Tablosu */}
                <div className="luxury-card p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-cinzel text-sm font-bold text-white flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4 text-sky-400" />
                      SAYILAN ÜRÜNLER VE MUTABAKAT LİSTESİ ({activeAudit.items?.length || 0})
                    </h3>
                    <div className="flex items-center gap-1">
                      {['ALL', 'MATCHED', 'MISSING', 'SURPLUS'].map(f => (
                        <button
                          key={f}
                          onClick={() => setAuditFilter(f)}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                            auditFilter === f ? 'bg-sky-600 text-white' : 'bg-[#191c26] text-slate-400 hover:text-white'
                          }`}
                        >
                          {f === 'ALL' ? 'Tümü' : f === 'MATCHED' ? 'Eşleşenler' : f === 'MISSING' ? 'Eksikler' : 'Fazlalar'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>BARKOD</th>
                          <th>ÜRÜN ADI</th>
                          <th>KATEGORİ</th>
                          <th>GRAMAJ</th>
                          <th>BEKLENEN KONUM</th>
                          <th>DURUM</th>
                          <th>OKUMA ZAMANI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(activeAudit.items || [])
                          .filter(it => auditFilter === 'ALL' || it.status === auditFilter)
                          .map(it => (
                            <tr key={it.id} className="hover:bg-[#191c26]/60 transition">
                              <td className="font-mono font-bold text-white">{it.barcode}</td>
                              <td className="text-white font-semibold">{it.product_name}</td>
                              <td className="text-slate-300">{it.category}</td>
                              <td className="font-mono text-amber-400">{it.weight_grams} gr</td>
                              <td className="text-slate-400 font-mono text-xs">{it.expected_slot}</td>
                              <td>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                  it.status === 'MATCHED' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40' :
                                  it.status === 'MISSING' ? 'bg-rose-950/60 text-rose-400 border border-rose-500/40' :
                                  'bg-amber-950/60 text-amber-400 border border-amber-500/40'
                                }`}>
                                  {it.status === 'MATCHED' ? '✓ EŞLEŞTİ' : it.status === 'MISSING' ? '✗ EKSİK' : '? FAZLA / YERSİZ'}
                                </span>
                              </td>
                              <td className="text-slate-400 font-mono text-[11px]">
                                {new Date(it.scanned_at).toLocaleTimeString('tr-TR')}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="luxury-card p-12 text-center space-y-3">
                <ScanBarcode className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="font-cinzel text-base font-bold text-white">Aktif Sayım Oturumu Bulunmuyor</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Vitrindeki ürünleri saymak ve sistemdeki kayıtlarla otomatik mutabakat sağlamak için yukarıdaki butondan yeni sayım başlatın.
                </p>
                <button onClick={handleStartAudit} className="btn-gold text-xs py-2 px-4 inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Sayımı Başlat
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================= SEKME: GÜVENLİK, GECE KORUMA & SAHTE ALTIN ================= */}
        {activeTab === 'security_center' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#12141c] p-4 rounded-xl border border-[#242938]">
              <div>
                <h2 className="font-cinzel text-lg font-bold text-white flex items-center gap-2">
                  <BadgeAlert className="w-5 h-5 text-rose-400" />
                  İLERİ GÜVENLİK MERKEZİ & SAHTE ALTIN / İKAME KALKANI
                </h2>
                <p className="text-xs text-slate-400">
                  Mesai dışı gece soygun koruması, çift personel onay kuralı, panik alarmı ve sahte altın ağırlık sapması algılama
                </p>
              </div>
              <button
                onClick={handleTriggerPanic}
                className="btn-danger text-xs py-2 px-4 font-bold flex items-center gap-2 animate-pulse"
              >
                <Siren className="w-4 h-4" />
                <span>🚨 Sessiz Panik Butonunu Tetikle</span>
              </button>
            </div>

            {/* Güvenlik Ayar & Durum Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="luxury-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Moon className="w-4 h-4 text-indigo-400" />
                    GECE / SOYGUN KORUMA
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    securityConfig?.night_mode_active ? 'bg-rose-950/80 text-rose-400 border border-rose-500' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {securityConfig?.night_mode_active ? 'AKTİF (KİLİTLİ)' : 'MESAI MODU'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Mesai saatleri dışında (20:00 - 08:30) vitrinden 1 gram dahi eksilirse veya PIR hareket algılanırsa direkt en üst öncelikli soygun alarmı verir.
                </p>
                <button
                  onClick={handleToggleNightMode}
                  className="btn-secondary w-full text-xs py-2 justify-center font-bold"
                >
                  {securityConfig?.night_mode_active ? 'Mesai Moduna Geç (Kilidi Aç)' : '🌙 Gece Modunu Devreye Al'}
                </button>
              </div>

              <div className="luxury-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    İKİ KİŞİ KURALI (ONAY)
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-950/60 text-amber-400 border border-amber-500/40">
                    Eşik: ≥ 100.000 ₺
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  100.000 TL ve üzeri takı satışlarında güvenlik ve dolandırıcılığı önlemek için 2. bir personelin veya yöneticinin şifre onayı istenir.
                </p>
                <div className="text-[11px] font-mono text-emerald-400 bg-[#0e1017] p-2 rounded border border-[#242938]">
                  ✓ Çift personel doğrulama mekanizması devrede.
                </div>
              </div>

              <div className="luxury-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Scale className="w-4 h-4 text-sky-400" />
                    SAHTE ALTIN TOLERANSI
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-sky-950/60 text-sky-400 border border-sky-500/40">
                    ±0.25 gr Sapma
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Vitrine geri konulan ürünün ağırlığı referans değerinden 0.25 gramdan fazla saparsa sistem anında "İkame / Sahte Altın Şüphesi" alarmı verir.
                </p>
                <div className="text-[11px] font-mono text-sky-300 bg-[#0e1017] p-2 rounded border border-[#242938]">
                  Yüksek hassasiyetli yük hücresi tolerans filtresi aktif.
                </div>
              </div>
            </div>

            {/* Sahte Ürün / Ağırlık Sapması Test Simülatörü */}
            <div className="luxury-card p-5 space-y-4">
              <h3 className="font-cinzel text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                SAHTE ALTIN & AĞIRLIK SAPMASI DOĞRULAMA TEST SİMÜLATÖRÜ
              </h3>
              <p className="text-xs text-slate-400">
                Müşteriye denetilen bir ürünün vitrine geri konulduğunda gramajının değişip değişmediğini test edin:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Test Ürünü</label>
                  <select
                    id="anomalyProductSelect"
                    className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                  >
                    {products.slice(0, 6).map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Ref: {p.weight_grams} gr)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Geri Konulan Ağırlık (gr)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Örn: 27.80 (Orijinal: 28.60)"
                    value={testAnomalyWeight}
                    onChange={(e) => setTestAnomalyWeight(e.target.value)}
                    className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none font-mono"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      const sel = document.getElementById('anomalyProductSelect');
                      const pId = sel ? parseInt(sel.value) : products[0]?.id;
                      handleVerifyWeightAnomaly(pId, testAnomalyWeight || '27.80');
                    }}
                    className="btn-danger w-full py-2 justify-center text-xs font-bold"
                  >
                    Sapmayı Doğrula & Test Et
                  </button>
                </div>
              </div>

              {anomalyResult && (
                <div className={`p-3 rounded-lg border text-xs font-mono flex items-center justify-between ${
                  anomalyResult.is_anomaly ? 'bg-rose-950/60 border-rose-500 text-rose-300' : 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                }`}>
                  <div>
                    <strong className="block text-sm">{anomalyResult.status}</strong>
                    <span>{anomalyResult.message} (Fark: ±{anomalyResult.difference_grams} gr)</span>
                  </div>
                  {anomalyResult.is_anomaly && <span className="animate-ping text-xl">🚨</span>}
                </div>
              )}
            </div>

            {/* Güvenlik Olayları & Kilit Günlüğü */}
            <div className="luxury-card p-5 space-y-4">
              <h3 className="font-cinzel text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-rose-400" />
                GÜVENLİK OLAYLARI & BİYOMETRİK KİLİT GÜNLÜĞÜ
              </h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>OLAY TİPİ</th>
                      <th>SEVİYE</th>
                      <th>BAŞLIK</th>
                      <th>DETAYLAR</th>
                      <th>KULLANICI / SENSÖR</th>
                      <th>DURUM</th>
                      <th>ZAMAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {securityEvents.map(ev => (
                      <tr key={ev.id} className="hover:bg-[#191c26]/60 transition">
                        <td className="font-mono text-xs font-bold text-white">{ev.event_type}</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            ev.severity === 'CRITICAL' ? 'bg-rose-950/80 text-rose-400 border border-rose-500/40 animate-pulse' :
                            ev.severity === 'WARNING' ? 'bg-amber-950/80 text-amber-400 border border-amber-500/40' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {ev.severity}
                          </span>
                        </td>
                        <td className="font-semibold text-white">{ev.title}</td>
                        <td className="text-xs text-slate-300 max-w-xs truncate">{ev.details}</td>
                        <td className="text-slate-400 font-mono text-xs">{ev.user_name || 'Otomatik Sensör'}</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            ev.is_resolved ? 'bg-emerald-950/60 text-emerald-400' : 'bg-rose-950/60 text-rose-400 animate-bounce'
                          }`}>
                            {ev.is_resolved ? '✓ ÇÖZÜLDÜ' : '● AKTİF ALARM'}
                          </span>
                        </td>
                        <td className="text-slate-400 font-mono text-[11px]">
                          {new Date(ev.created_at).toLocaleTimeString('tr-TR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= SEKME: MASAK & YASAL UYUM & RESMİ PUSULA ================= */}
        {activeTab === 'masak_legal' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#12141c] p-4 rounded-xl border border-[#242938]">
              <div>
                <h2 className="font-cinzel text-lg font-bold text-white flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-emerald-400" />
                  MASAK YASAL UYUM & RESMİ DARPHANE HESAP PUSULASI
                </h2>
                <p className="text-xs text-slate-400">
                  5549 Sayılı Kanun gereği 85.000 TL üzeri altın işlemlerinde kimlik tespit kaydı ve Darphane damgalı resmi hesap pusulası dökümü
                </p>
              </div>
              <button onClick={fetchMasakRecords} className="btn-secondary text-xs py-1.5 px-3">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Yenile</span>
              </button>
            </div>

            {/* MASAK Bilgilendirme Bannerı */}
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-slate-300 space-y-1">
              <div className="font-bold text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                T.C. Hazine ve Maliye Bakanlığı MASAK Mevzuatı Uyarı Notu:
              </div>
              <p>
                Kuyumculuk işletmelerinde nakit olarak gerçekleştirilen 85.000 TL ve üzeri altın ve kıymetli maden alım-satımlarında müşterinin T.C. Kimlik / Pasaport numarası, doğum yılı ve meslek bilgisi alınarak sistemde en az 8 yıl süreyle saklanması kanuni zorunluluktur.
              </p>
            </div>

            {/* MASAK Kayıt Defteri Tablosu */}
            <div className="luxury-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-cinzel text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  MASAK KİMLİK TESPİT VE BEYAN KAYIT DEFTERİ ({masakRecords.length})
                </h3>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>SATIŞ ID</th>
                      <th>MÜŞTERİ AD SOYAD</th>
                      <th>BELGE TİPİ / NO</th>
                      <th>MESLEK</th>
                      <th>İŞLEM TUTARI</th>
                      <th>ALTIN GRAMI</th>
                      <th>RİSK DURUMU</th>
                      <th>TARİH</th>
                      <th>İŞLEM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {masakRecords.map(m => (
                      <tr key={m.id} className="hover:bg-[#191c26]/60 transition">
                        <td className="font-mono text-amber-400">#{m.sale_id}</td>
                        <td className="font-bold text-white">{m.customer_name}</td>
                        <td className="font-mono text-slate-300">{m.document_type}: {m.id_number}</td>
                        <td className="text-slate-300">{m.occupation || 'Belirtilmedi'}</td>
                        <td className="font-display font-bold text-white">{m.transaction_amount.toLocaleString('tr-TR')} ₺</td>
                        <td className="font-mono text-amber-400">{m.gold_weight_grams} gr</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            m.risk_status === 'UYGUN' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40' : 'bg-rose-950/60 text-rose-400'
                          }`}>
                            {m.risk_status}
                          </span>
                        </td>
                        <td className="font-mono text-slate-400 text-xs">
                          {new Date(m.created_at).toLocaleDateString('tr-TR')}
                        </td>
                        <td>
                          <button
                            onClick={() => handleOpenPusulaModal(m.sale_id)}
                            className="btn-secondary text-[10px] py-1 px-2 text-amber-300 font-bold"
                          >
                            📄 Resmi Pusula
                          </button>
                        </td>
                      </tr>
                    ))}
                    {masakRecords.length === 0 && (
                      <tr>
                        <td colSpan="9" className="text-center py-6 text-slate-500 text-xs">Kayıtlı MASAK işlemi bulunmuyor.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Hızlı Pusula Sorgulama */}
            <div className="luxury-card p-5 space-y-3">
              <h3 className="font-cinzel text-sm font-bold text-white">HERHANGİ BİR SATIŞ İÇİN RESMİ HESAP PUSULASI ÇIKAR</h3>
              <p className="text-xs text-slate-400">Son satışlardan dilediğiniz birini seçerek darphane damgalı resmi pusulayı görüntüleyin:</p>
              <div className="flex items-center gap-2 flex-wrap">
                {sales.slice(0, 5).map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleOpenPusulaModal(s.id)}
                    className="btn-secondary text-xs py-1.5 px-3 font-mono text-amber-300 hover:border-amber-400"
                  >
                    Fiş #{s.invoice_no || s.id} ({s.customer_name} - {s.sale_price.toLocaleString('tr-TR')} ₺)
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= SEKME: YÖNETİM, ÇOKLU ŞUBE & LOGO/NETSIS ERP ================= */}
        {activeTab === 'management_hub' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#12141c] p-4 rounded-xl border border-[#242938]">
              <div>
                <h2 className="font-cinzel text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                  ÇOKLU ŞUBE YÖNETİMİ, GERÇEK ZAMANLI KÂR MARJI & LOGO ERP
                </h2>
                <p className="text-xs text-slate-400">
                  Şubeler arası stok transferi, saatlik mağaza yoğunluk ısı haritası ve Logo Tiger / Netsis muhasebe entegrasyonu
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportLogoNetsis('LOGO_XML')}
                  className="btn-secondary text-xs py-1.5 px-3 border-indigo-500/40 text-indigo-300 font-bold"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Logo Tiger XML</span>
                </button>
                <button
                  onClick={() => handleExportLogoNetsis('NETSIS_JSON')}
                  className="btn-secondary text-xs py-1.5 px-3 border-amber-500/40 text-amber-300 font-bold"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Netsis JSON</span>
                </button>
              </div>
            </div>

            {/* Kâr Marjı ve Finansal Sağlık Kartları */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="luxury-card p-4">
                <div className="text-[11px] text-slate-400 font-semibold">Toplam Satış Cirosu</div>
                <div className="text-2xl font-display font-bold text-white mt-1">
                  {profitMarginData ? `${profitMarginData.total_revenue.toLocaleString('tr-TR')} ₺` : '...'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">Tüm şubeler toplam hasılatı</div>
              </div>

              <div className="luxury-card p-4">
                <div className="text-[11px] text-slate-400 font-semibold">Toplam Alış / Altın Maliyeti</div>
                <div className="text-2xl font-display font-bold text-slate-300 mt-1">
                  {profitMarginData ? `${profitMarginData.total_cost.toLocaleString('tr-TR')} ₺` : '...'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">Hammadde has + işçilik bedeli</div>
              </div>

              <div className="luxury-card p-4 border-emerald-500/40 bg-emerald-950/10">
                <div className="text-[11px] text-emerald-400 font-semibold">Net Brüt Kâr</div>
                <div className="text-2xl font-display font-bold text-emerald-400 mt-1">
                  {profitMarginData ? `${profitMarginData.net_profit.toLocaleString('tr-TR')} ₺` : '...'}
                </div>
                <div className="text-[10px] text-emerald-300 font-mono mt-0.5">Reel kazanç</div>
              </div>

              <div className="luxury-card p-4 border-amber-500/40 bg-amber-950/10">
                <div className="text-[11px] text-amber-400 font-semibold">Ortalama Kâr Marjı</div>
                <div className="text-2xl font-display font-bold text-amber-400 mt-1">
                  {profitMarginData ? `%${profitMarginData.overall_margin_percent}` : '...'}
                </div>
                <div className="text-[10px] text-amber-300 font-mono mt-0.5">Kuyumcu kâr rasyosu</div>
              </div>
            </div>

            {/* Saatlik Müşteri & Satış Yoğunluk Isı Haritası */}
            <div className="luxury-card p-5 space-y-4">
              <h3 className="font-cinzel text-sm font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                GÜN İÇİ SAATLİK MAĞAZA TRAFİĞİ & YOĞUNLUK ISI HARİTASI (HEATMAP)
              </h3>
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                {hourlyTraffic.map(h => (
                  <div key={h.hour} className="text-center p-2 rounded-lg bg-[#0e1017] border border-[#242938]">
                    <div className="text-[10px] font-mono text-slate-400">{h.hour}</div>
                    <div className="text-sm font-bold text-amber-400 my-1">{h.traffic_count}</div>
                    <div className="w-full h-1.5 bg-[#242938] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          h.intensity === 'Yüksek' ? 'bg-rose-500' : h.intensity === 'Orta' ? 'bg-amber-500' : 'bg-sky-500'
                        }`}
                        style={{ width: `${Math.min(100, h.traffic_count * 7)}%` }}
                      />
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1">{h.sales_count} Satış</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Şubeler Listesi & Stok Transferi */}
            <div className="luxury-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-cinzel text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  MAĞAZA ŞUBELERİ & LOKASYONLAR ({branches.length})
                </h3>
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="btn-gold text-xs py-1.5 px-3 font-bold"
                >
                  ⇄ Şubeler Arası Stok Transferi Yap
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {branches.map(b => {
                  const branchProducts = products.filter(p => p.branch_id === b.id);
                  const branchGrams = branchProducts.reduce((acc, p) => acc + (p.weight_grams || 0), 0);
                  const branchDevices = slots.filter(s => s.branch_id === b.id);

                  return (
                    <div key={b.id} className="p-4 bg-gradient-to-b from-[#141722] to-[#0e1017] rounded-xl border border-[#242938] hover:border-amber-500/40 transition duration-200 flex flex-col justify-between space-y-3 shadow-lg">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                            {b.branch_code || `BR-${b.id}`} • {b.region || 'Bölge'}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Aktif
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-base mt-2">{b.name}</h4>
                        <div className="text-xs text-slate-400 font-mono mt-1">📍 {b.address}</div>
                        <div className="text-xs text-amber-400/90 font-mono mt-0.5">📞 {b.phone || 'Kayıtsız'}</div>

                        {/* Metrikler */}
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#202534] text-xs font-mono">
                          <div className="bg-[#090a10] p-2 rounded border border-[#1e2230]">
                            <span className="text-[10px] text-slate-400 block">Kayıtlı Stok:</span>
                            <strong className="text-white text-sm">{branchProducts.length} Adet</strong>
                            <span className="text-[10px] text-amber-400 block">{branchGrams.toFixed(1)} gr</span>
                          </div>
                          <div className="bg-[#090a10] p-2 rounded border border-[#1e2230]">
                            <span className="text-[10px] text-slate-400 block">IoT Cihazları:</span>
                            <strong className="text-white text-sm">{branchDevices.length} Tabla/Askı</strong>
                            <span className="text-[10px] text-emerald-400 block">Çevrimiçi</span>
                          </div>
                        </div>
                      </div>

                      {/* Aksiyonlar */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#202534]">
                        <button
                          onClick={() => setSelectedBranchDetailModal(b)}
                          className="btn-secondary text-[11px] py-1.5 px-2 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Mağaza Kartı</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBranchId(b.id);
                            setShowAddLocationModal(true);
                          }}
                          className="btn-gold text-[11px] py-1.5 px-2 flex items-center justify-center gap-1 font-bold"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Konum Tanımla</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= SEKME: 👥 PERSONEL & MAĞAZA YETKİLERİ (RBAC - YALNIZCA ADMİN) ================= */}
        {activeTab === 'staff_roles' && currentUser?.role === 'ADMIN' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#12141c] p-4 rounded-xl border border-amber-500/30 shadow-lg">
              <div>
                <h2 className="font-cinzel text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  PERSONEL & MAĞAZA YETKİ YÖNETİMİ (RBAC)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Çalışanların hangi mağazada görev yapacağına ve sistem yetki seviyesine (Admin, Mağaza Müdürü, Satış Personeli) buradan karar verin.
                </p>
              </div>
              <button
                onClick={() => setShowAddStaffModal(true)}
                className="btn-gold text-xs py-2 px-3 font-bold flex items-center gap-1.5 shadow"
              >
                <UserCheck className="w-4 h-4" />
                <span>+ Yeni Personel Tanımla</span>
              </button>
            </div>

            {roleUpdateStatus && (
              <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                roleUpdateStatus.includes('✅') ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300' : 'bg-amber-950/60 border border-amber-500/50 text-amber-300'
              }`}>
                <span>{roleUpdateStatus}</span>
              </div>
            )}

            {/* 3 Rol Bilgilendirme Kutuları */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-[#191c26] border border-amber-500/30 rounded-xl">
                <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
                  <span>👑 Admin (Şirket Sahibi / GM)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Tüm şubelerin konsolide cirosuna, mağaza atamalarına, kâr marjlarına ve tüm sistem ayarlarına tam erişir.
                </p>
              </div>
              <div className="p-3 bg-[#191c26] border border-blue-500/30 rounded-xl">
                <div className="flex items-center gap-1.5 font-bold text-blue-300 text-xs">
                  <span>🏬 Mağaza Müdürü (Manager)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Yalnızca kendi mağazasına kilitlidir. Kendi vitrin terazilerini, kendi mağaza cirosunu ve altındaki satış personellerini denetler.
                </p>
              </div>
              <div className="p-3 bg-[#191c26] border border-emerald-500/30 rounded-xl">
                <div className="flex items-center gap-1.5 font-bold text-emerald-300 text-xs">
                  <span>👤 Satış Danışmanı (Staff)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Kendi mağazasında sadece temel işlemleri (vitrin ürün arama, müşteriye denetme, kendi satışları ve müşteri kaydı) görür.
                </p>
              </div>
            </div>

            {/* Personel Yetki & Mağaza Atama Tablosu */}
            <div className="luxury-card overflow-hidden">
              <div className="p-4 border-b border-[#242938] flex items-center justify-between">
                <h3 className="font-cinzel text-sm font-bold text-white">
                  KAYITLI KULLANICILAR VE GÖREV DAĞILIMI ({staffList.length} Kullanıcı)
                </h3>
                <span className="text-xs text-slate-400">Admin yetkisiyle anında güncelleyin</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#191c26] text-slate-400 text-[10px] font-mono uppercase">
                    <tr>
                      <th className="p-3">Personel / Kullanıcı</th>
                      <th className="p-3">Sistem Rolü (Yetki Kademesi)</th>
                      <th className="p-3">Atandığı Çalışma Mağazası</th>
                      <th className="p-3">Durum</th>
                      <th className="p-3 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#242938]">
                    {staffList.map((u) => {
                      const editState = userRoleEditMap[u.id] || { role: u.role, branch_id: u.branch_id || '' };
                      return (
                        <tr key={u.id} className="hover:bg-amber-500/5 transition">
                          <td className="p-3">
                            <div className="font-bold text-white text-sm">{u.full_name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">@{u.username}</div>
                          </td>
                          <td className="p-3">
                            <select
                              value={editState.role}
                              onChange={(e) => {
                                const newRole = e.target.value;
                                setUserRoleEditMap(prev => ({
                                  ...prev,
                                  [u.id]: { ...prev[u.id], role: newRole }
                                }));
                              }}
                              className="bg-[#0e1017] border border-[#242938] text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:border-amber-500 focus:outline-none"
                            >
                              <option value="ADMIN">👑 Admin (Şirket Sahibi / GM)</option>
                              <option value="MANAGER">🏬 Mağaza Müdürü</option>
                              <option value="STAFF">👤 Satış Danışmanı (Personel)</option>
                            </select>
                          </td>
                          <td className="p-3">
                            <select
                              value={editState.branch_id}
                              onChange={(e) => {
                                const newBranch = e.target.value;
                                setUserRoleEditMap(prev => ({
                                  ...prev,
                                  [u.id]: { ...prev[u.id], branch_id: newBranch }
                                }));
                              }}
                              className="bg-[#0e1017] border border-[#242938] text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:border-amber-500 focus:outline-none"
                            >
                              <option value="">🏢 Genel Merkez (Tüm Mağazalar / Merkez Ofis)</option>
                              {branches.map(b => (
                                <option key={b.id} value={b.id}>🏬 {b.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3">
                            <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-mono">
                              Aktif Hesap
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleUpdateUserRoleAndBranch(u.id)}
                              className="btn-gold text-xs py-1 px-3 font-bold shadow hover:scale-105 transition"
                            >
                              💾 Yetkileri Kaydet
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= SEKME: 👥 MAĞAZA EKİBİM (MAĞAZA MÜDÜRÜ GÖRÜNÜMÜ) ================= */}
        {activeTab === 'staff_team' && currentUser?.role === 'MANAGER' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#12141c] p-4 rounded-xl border border-blue-500/30 shadow-lg">
              <div>
                <h2 className="font-cinzel text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  MAĞAZA EKİBİM & PERSONEL PERFORMANSI ({currentUser.branch_name || 'Şubem'})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mağazanızda çalışan satış danışmanları ve onların güncel satış performanslarını inceleyebilirsiniz.
                </p>
              </div>
              <button
                onClick={() => {
                  setNewStaff(prev => ({ ...prev, role: 'STAFF', branch_id: currentUser.branch_id }));
                  setShowAddStaffModal(true);
                }}
                className="btn-gold text-xs py-2 px-3 font-bold flex items-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                <span>+ Mağazama Satış Personeli Ekle</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staffList
                .filter(u => u.branch_id === currentUser.branch_id && u.role === 'STAFF')
                .map(staff => {
                  const staffSales = salesList.filter(s => s.user_id === staff.id);
                  const staffRevenue = staffSales.reduce((acc, s) => acc + s.sale_price, 0);

                  return (
                    <div key={staff.id} className="luxury-card p-4 space-y-3 border-blue-500/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 font-bold">
                          👤
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white">{staff.full_name}</div>
                          <div className="text-xs text-slate-400 font-mono">@{staff.username} • Satış Danışmanı</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#242938]">
                        <div className="bg-[#0e1017] p-2 rounded-lg text-center">
                          <div className="text-[10px] text-slate-400 uppercase">Satış Adedi</div>
                          <div className="text-base font-bold text-white mt-0.5">{staffSales.length} Adet</div>
                        </div>
                        <div className="bg-[#0e1017] p-2 rounded-lg text-center">
                          <div className="text-[10px] text-slate-400 uppercase">Toplam Ciro</div>
                          <div className="text-base font-bold text-amber-400 mt-0.5 font-mono">
                            {staffRevenue.toLocaleString('tr-TR')} ₺
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              {staffList.filter(u => u.branch_id === currentUser.branch_id && u.role === 'STAFF').length === 0 && (
                <div className="col-span-full text-center p-8 bg-[#12141c] rounded-xl border border-[#242938] text-slate-400 text-xs">
                  Mağazanıza henüz atanmış satış danışmanı bulunmuyor. Yukarıdaki butondan yeni personel ekleyebilirsiniz.
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* ================= MODAL 1: AKILLI GRAMAJ EŞLEME & ZİMMETE ALMA SİHİRBAZI ================= */}
      {liftMatchWizard && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg border-rose-500/50 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#242938] mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500 animate-bounce" />
                <h3 className="font-cinzel text-base font-bold text-white">
                  ASKI #{liftMatchWizard.slot_number}'DEN AĞIRLIK EKSİLDİ!
                </h3>
              </div>
              <button onClick={() => setLiftMatchWizard(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-xs mb-4">
              <div className="flex items-center justify-between font-mono">
                <span>Eksilen Ağırlık:</span>
                <strong className="text-rose-300 text-sm">{liftMatchWizard.weight_lost} gr</strong>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                Lütfen müşteriye denetmek üzere askıdan aldığınız bileziği / modeli seçin. Seçtiğinizde ürün zimmetinize geçecek ve alarm susturulacaktır.
              </p>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {liftMatchWizard.candidates.map(candidate => (
                <div
                  key={candidate.product_id}
                  onClick={() => handleTakeIntoCustody(candidate.product_id, liftMatchWizard.slot_id)}
                  className="p-3 bg-[#191c26] hover:bg-amber-500/10 border border-[#242938] hover:border-amber-500 rounded-xl cursor-pointer transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {candidate.image_url ? (
                      <img src={candidate.image_url} alt={candidate.product_name} className="w-12 h-12 object-cover rounded-lg border border-[#242938]" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 font-bold">
                        🪙
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-xs text-white">{candidate.product_name}</div>
                      <div className="text-[11px] text-amber-400 font-mono mt-0.5">
                        {candidate.purity} • {candidate.weight_grams} gr (Fark: ±{candidate.diff_grams}g)
                      </div>
                      <div className="text-xs font-bold font-display text-white mt-1">
                        {candidate.price.toLocaleString('tr-TR')} ₺
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      candidate.confidence_score >= 80 ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                    }`}>
                      %{candidate.confidence_score} Uyum
                    </span>
                    <button className="btn-gold text-[10px] py-1 px-2.5 mt-2 block ml-auto">
                      Zimmetime Al ➔
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: HİZMET SEANSI BİTİRME & EKSİK MODEL NOTU ================= */}
      {showEndSessionModal && (
        <div className="modal-overlay" onClick={() => setShowEndSessionModal(false)}>
          <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#242938] mb-4">
              <h3 className="font-cinzel text-base font-bold text-white flex items-center gap-2">
                <Timer className="w-5 h-5 text-amber-400" />
                MÜŞTERİ HİZMETİNİ TAMAMLA
              </h3>
              <button onClick={() => setShowEndSessionModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCompleteEndSession} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Müşteri Adı</label>
                  <input
                    type="text"
                    value={endSessionData.customer_name}
                    onChange={e => setEndSessionData({ ...endSessionData, customer_name: e.target.value })}
                    placeholder="Müşteri Adı"
                    className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Hizmet Süresi (Dk)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={endSessionData.duration_minutes}
                    onChange={e => setEndSessionData({ ...endSessionData, duration_minutes: parseFloat(e.target.value) })}
                    className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Satış Gerçekleşti mi?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEndSessionData({ ...endSessionData, sale_made: true })}
                    className={`py-2 rounded font-bold text-xs transition border ${
                      endSessionData.sale_made ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-[#0e1017] text-slate-400 border-[#242938]'
                    }`}
                  >
                    ✅ Evet, Satış Yapıldı
                  </button>
                  <button
                    type="button"
                    onClick={() => setEndSessionData({ ...endSessionData, sale_made: false })}
                    className={`py-2 rounded font-bold text-xs transition border ${
                      !endSessionData.sale_made ? 'bg-amber-600 text-white border-amber-400' : 'bg-[#0e1017] text-slate-400 border-[#242938]'
                    }`}
                  >
                    ❌ Hayır, Sadece Baktı
                  </button>
                </div>
              </div>

              {/* EKSİK MODEL / BULUNAMAYAN TALEP NOTU */}
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <FileQuestion className="w-4 h-4" />
                  <span>Müşteri Hangi Modeli Aradı Ama Bulamadı?</span>
                </div>
                <input
                  type="text"
                  value={endSessionData.missing_model_notes}
                  onChange={e => setEndSessionData({ ...endSessionData, missing_model_notes: e.target.value })}
                  placeholder="Örn: 14K Baget Taşlı Kelepçe Bilezik sordu, vitrinde yoktu."
                  className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none placeholder-slate-500"
                />
                <p className="text-[10px] text-slate-400">
                  Bu not yöneticinin sipariş ve stok açıklarını görmesini sağlar.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Genel Görüşme Notları</label>
                <textarea
                  rows="2"
                  value={endSessionData.notes}
                  onChange={e => setEndSessionData({ ...endSessionData, notes: e.target.value })}
                  placeholder="Müşteri hafta sonu tekrar gelecek vb."
                  className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                />
              </div>

              <button type="submit" className="btn-gold w-full py-2.5 justify-center font-bold text-xs mt-2">
                Hizmet Seansını Kaydet ve Kapat
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= DİĞER MODALLAR (SATIŞ, CRM, SERTİFİKA VB.) ================= */}
      {/* Satış Modalı */}
      {showSaleModal && selectedProductForSale && (
        <div className="modal-overlay" onClick={() => setShowSaleModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#242938] mb-4">
              <h3 className="font-cinzel text-base font-bold text-white">SATIŞ İŞLEMİ & ASKI DÜŞÜMÜ</h3>
              <button onClick={() => setShowSaleModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleProcessSale} className="space-y-4 text-xs max-h-[80vh] overflow-y-auto pr-1">
              <div className="p-3 bg-[#0e1017] rounded-lg border border-[#242938] flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-sm">{selectedProductForSale.name}</div>
                  <div className="text-amber-400 font-mono mt-0.5">{selectedProductForSale.purity} • {selectedProductForSale.weight_grams} gr</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400 text-[10px]">Etiket Fiyatı</div>
                  <div className="text-base font-display font-bold text-white">{selectedProductForSale.price.toLocaleString('tr-TR')} ₺</div>
                </div>
              </div>

              {/* Çapraz Satış Önerileri (Cross-sell Engine) */}
              {crossSellSuggestions && crossSellSuggestions.length > 0 && (
                <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/30">
                  <div className="flex items-center gap-1.5 text-indigo-300 font-semibold mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Çapraz Satış / Birlikte Tercih Edilen Parçalar:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {crossSellSuggestions.map(rec => (
                      <div key={rec.id} className="p-2 bg-[#12141c] rounded border border-[#242938] flex items-center justify-between hover:border-amber-500/40 transition">
                        <div>
                          <div className="font-semibold text-white text-[11px] truncate max-w-[130px]">{rec.name}</div>
                          <div className="text-amber-400 font-mono text-[10px]">{rec.purity} • {rec.weight_grams} gr</div>
                        </div>
                        <span className="text-[11px] font-bold text-slate-200">+{rec.price.toLocaleString('tr-TR')} ₺</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Müşteri Seçin (CRM):</label>
                <select
                  value={saleCustomerId}
                  onChange={(e) => {
                    setSaleCustomerId(e.target.value);
                    const found = customers.find(c => c.id === parseInt(e.target.value));
                    if (found) {
                      setSaleCustomerName(found.full_name);
                      setSaleCustomerPhone(found.phone || '');
                      setSaleCustomerEmail(found.email || '');
                    }
                  }}
                  className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none mb-2"
                >
                  <option value="">-- Yeni Müşteri / Hızlı Satış --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name} ({c.customer_type} - {c.phone})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Müşteri Ad Soyad</label>
                  <input
                    type="text"
                    required
                    value={saleCustomerName}
                    onChange={(e) => setSaleCustomerName(e.target.value)}
                    placeholder="Ad Soyad"
                    className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Telefon</label>
                  <input
                    type="text"
                    value={saleCustomerPhone}
                    onChange={(e) => setSaleCustomerPhone(e.target.value)}
                    placeholder="0532..."
                    className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ödeme Yöntemi</label>
                  <select
                    value={salePaymentMethod}
                    onChange={(e) => setSalePaymentMethod(e.target.value)}
                    className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                  >
                    <option value="Kredi Kartı">Kredi Kartı</option>
                    <option value="Nakit">Nakit (TL)</option>
                    <option value="Havale/EFT">Havale / EFT</option>
                    <option value="Altın Takas">Eski Altın Takası</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">İskonto (₺)</label>
                  <input
                    type="number"
                    value={saleDiscount}
                    onChange={(e) => setSaleDiscount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* MASAK Yasal Uyumluluk (≥ 85.000 TL) */}
              {(selectedProductForSale.price - (parseFloat(saleDiscount) || 0)) >= 85000 && (
                <div className="p-3 bg-red-950/30 rounded-lg border border-red-500/40 space-y-2">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                    <Scale className="w-4 h-4 text-red-400" />
                    <span>5549 Sayılı Kanun MASAK Kimlik Tespiti (85.000 ₺ Üzeri)</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">Mevzuat gereği 85.000 ₺ ve üzeri altın alımlarında kimlik bilgisi tutulması mecburidir.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-0.5 text-[11px]">T.C. Kimlik / Pasaport No *</label>
                      <input
                        type="text"
                        required
                        value={masakIdNumber}
                        onChange={(e) => setMasakIdNumber(e.target.value)}
                        placeholder="11 Haneli TCKN veya Pasaport"
                        className="w-full bg-[#0e1017] border border-red-500/50 text-white rounded p-2 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-0.5 text-[11px]">Meslek / Ticaret Unvanı</label>
                      <input
                        type="text"
                        value={masakOccupation}
                        onChange={(e) => setMasakOccupation(e.target.value)}
                        placeholder="Örn: Avukat, Tüccar, Mühendis"
                        className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* İki Kişi Kuralı (≥ 100.000 TL Dual Auth) */}
              {(selectedProductForSale.price - (parseFloat(saleDiscount) || 0)) >= 100000 && (
                <div className="p-3 bg-amber-950/30 rounded-lg border border-amber-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      <span>İki Kişi Kuralı Güvenlik Onayı (≥ 100.000 ₺)</span>
                    </div>
                    {twoManApproved ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                        ✓ 2. Yetkili Onayladı
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px] font-bold border border-red-500/40">
                        Onay Bekleniyor
                      </span>
                    )}
                  </div>
                  {!twoManApproved ? (
                    <div className="grid grid-cols-3 gap-2 items-end pt-1">
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-0.5">2. Yetkili / Şef</label>
                        <input
                          type="text"
                          value={twoManApproverName}
                          onChange={(e) => setTwoManApproverName(e.target.value)}
                          placeholder="Yönetici Adı"
                          className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-0.5">Güvenlik PIN'i</label>
                        <input
                          type="password"
                          value={twoManApproverPin}
                          onChange={(e) => setTwoManApproverPin(e.target.value)}
                          placeholder="••••"
                          className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-1.5 text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyTwoMan}
                        className="btn-gold py-1.5 px-3 justify-center text-xs font-bold"
                      >
                        Yetkilendir
                      </button>
                    </div>
                  ) : (
                    <div className="text-emerald-400 text-[11px]">
                      Onaylayan Şef/Yönetici: <strong>{twoManApproverName}</strong>
                    </div>
                  )}
                </div>
              )}

              <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30 flex items-center justify-between">
                <span className="font-semibold text-amber-300">Ödenecek Tutar:</span>
                <span className="text-base font-bold font-display text-white">
                  {Math.max(0, selectedProductForSale.price - (parseFloat(saleDiscount) || 0)).toLocaleString('tr-TR')} ₺
                </span>
              </div>

              <button
                type="submit"
                disabled={(selectedProductForSale.price - (parseFloat(saleDiscount) || 0)) >= 100000 && !twoManApproved}
                className="btn-gold w-full py-2.5 justify-center font-bold text-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Satışı Onayla & Askıdan Düş
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sertifika E-Posta Modalı */}
      {showEmailModal && selectedSaleForEmail && (
        <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#242938] mb-4">
              <h3 className="font-cinzel text-base font-bold text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400" />
                MÜCEVHER SERTİFİKASI & E-POSTA
              </h3>
              <button onClick={() => setShowEmailModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-4 bg-[#08090d] rounded-xl border border-amber-500/30 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b pb-2 border-[#242938]">
                <span className="font-cinzel text-amber-400 font-bold">SARRAF ERDEM GARANTİ BELGESİ</span>
                <span className="font-mono text-slate-400">{selectedSaleForEmail.invoice_no || `SE-${selectedSaleForEmail.id}`}</span>
              </div>
              <p className="text-slate-300">
                Sayın <strong>{selectedSaleForEmail.customer_name}</strong>, satın aldığınız ürün bilgileri:
              </p>
              <div className="bg-[#12141c] p-3 rounded-lg border border-[#242938] space-y-1 font-mono text-[11px]">
                <div>• Ürün Adı: <strong className="text-white">{selectedSaleForEmail.product_name}</strong></div>
                <div>• Maden / Ayar: <strong className="text-amber-400">{selectedSaleForEmail.purity}</strong></div>
                <div>• Gramaj: <strong className="text-white">{selectedSaleForEmail.weight_grams} gr</strong></div>
                <div>• Tutar: <strong className="text-white">{selectedSaleForEmail.sale_price.toLocaleString('tr-TR')} ₺</strong></div>
              </div>
            </div>

            {emailSendingStatus && (
              <div className="p-2.5 rounded bg-[#191c26] text-xs font-mono text-center text-amber-300 border border-amber-500/30 mt-3">
                {emailSendingStatus}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-4">
              <button onClick={() => setShowEmailModal(false)} className="btn-secondary text-xs py-1.5 px-3">Kapat</button>
              <button onClick={executeSendEmail} className="btn-gold text-xs py-1.5 px-4">
                <Send className="w-3.5 h-3.5" />
                <span>E-Postayı Gönder</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Müşteri Ekle Modalı */}
      {showAddCustomerModal && (
        <div className="modal-overlay" onClick={() => setShowAddCustomerModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#242938] mb-4">
              <h3 className="font-cinzel text-base font-bold text-white">YENİ MÜŞTERİ KAYDI</h3>
              <button onClick={() => setShowAddCustomerModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Müşteri Ad Soyad</label>
                <input
                  type="text"
                  required
                  value={newCustomer.full_name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, full_name: e.target.value })}
                  placeholder="Ad Soyad"
                  className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Telefon</label>
                  <input
                    type="text"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    placeholder="0532..."
                    className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Müşteri Tipi</label>
                  <select
                    value={newCustomer.customer_type}
                    onChange={(e) => setNewCustomer({ ...newCustomer, customer_type: e.target.value })}
                    className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                  >
                    <option value="Bireysel">Bireysel</option>
                    <option value="VIP">VIP Müşteri</option>
                    <option value="Toptan">Toptan</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-gold w-full py-2.5 justify-center font-bold text-xs mt-2">
                Müşteriyi Kaydet
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Müşteri Geçmişi Modalı */}
      {selectedCustomerHistory && (
        <div className="modal-overlay" onClick={() => setSelectedCustomerHistory(null)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#242938] mb-4">
              <div>
                <h3 className="font-cinzel text-base font-bold text-white">
                  {selectedCustomerHistory.customer.full_name} - Satın Alma Geçmişi
                </h3>
                <p className="text-xs text-slate-400">
                  Toplam {selectedCustomerHistory.total_gold_grams} gr altın alındı • {selectedCustomerHistory.customer.total_spent.toLocaleString('tr-TR')} ₺
                </p>
              </div>
              <button onClick={() => setSelectedCustomerHistory(null)} className="text-slate-400 hover:text-white text-lg">✕</button>
            </div>

            {/* İlgilendiği & Beğendiği Ürünler (PRD Modül 7) */}
            {customerInterestsList && customerInterestsList.length > 0 && (
              <div className="mb-4 bg-[#12141c] p-3 rounded-xl border border-amber-500/30">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-2">
                  <span>❤️ Müşterinin İlgilendiği & Beğendiği Ürünler ({customerInterestsList.length}):</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                  {customerInterestsList.map(ci => (
                    <div key={ci.id} className="bg-[#181b26] p-2 rounded-lg border border-[#242938] text-xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white truncate max-w-[150px]">{ci.product_name}</div>
                        <div className="text-[10px] text-amber-300 font-mono">{ci.purity} • {ci.weight_grams}g • {ci.price ? `${ci.price.toLocaleString('tr-TR')} ₺` : ''}</div>
                        {ci.notes && <div className="text-[9px] text-slate-400 italic">"{ci.notes}"</div>}
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {ci.action_type === 'LIKED' ? '❤️ Beğendi' : '👁️ Denendi'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wide">Geçmiş Satın Alma Dökümleri:</div>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {selectedCustomerHistory.sales_history.map(sh => (
                <div key={sh.id} className="bg-[#191c26] p-3 rounded-lg border border-[#242938] flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">{sh.product_name}</div>
                    <div className="text-[11px] text-amber-400 font-mono">
                      {sh.purity} • {sh.weight_grams} gr • Fiş: {sh.invoice_no}
                    </div>
                    <div className="text-[10px] text-slate-500">{sh.created_at} • Satıcı: {sh.sold_by_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-display text-white">{sh.sale_price.toLocaleString('tr-TR')} ₺</div>
                  </div>
                </div>
              ))}
              {selectedCustomerHistory.sales_history.length === 0 && (
                <div className="text-center py-4 text-slate-500 text-xs">Kayıtlı geçmiş satış bulunmuyor.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Yeni Personel Tanımlama Modalı (Mağaza ve Rol Seçimiyle) */}
      {showAddStaffModal && (
        <div className="modal-overlay" onClick={() => setShowAddStaffModal(false)}>
          <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#242938] mb-4">
              <h3 className="font-cinzel text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                YENİ PERSONEL / ÇALIŞAN KAYDI
              </h3>
              <button onClick={() => setShowAddStaffModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Adı Soyadı</label>
                <input
                  type="text"
                  required
                  value={newStaff.full_name}
                  onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })}
                  placeholder="Örn: Caner Bolat"
                  className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kullanıcı Adı</label>
                  <input
                    type="text"
                    required
                    value={newStaff.username}
                    onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                    placeholder="caner_kasiyer"
                    className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Giriş Şifresi</label>
                  <input
                    type="password"
                    required
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Sistem Yetki Rolü</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  disabled={currentUser?.role !== 'ADMIN'}
                  className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                >
                  {currentUser?.role === 'ADMIN' && (
                    <>
                      <option value="ADMIN">👑 Admin (Şirket Sahibi / GM)</option>
                      <option value="MANAGER">🏬 Mağaza Müdürü</option>
                    </>
                  )}
                  <option value="STAFF">👤 Satış Danışmanı (Kasiyer / Personel)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Görev Yapacağı Mağaza</label>
                <select
                  value={newStaff.branch_id || ''}
                  onChange={(e) => setNewStaff({ ...newStaff, branch_id: e.target.value ? parseInt(e.target.value) : null })}
                  disabled={currentUser?.role !== 'ADMIN'}
                  className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                >
                  {currentUser?.role === 'ADMIN' && (
                    <option value="">🏢 Genel Merkez (Tüm Mağazalar)</option>
                  )}
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>🏬 {b.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#242938]">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="btn-gold text-xs py-1.5 px-4 font-bold"
                >
                  Personeli Sisteme Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Yeni Ürün Modalı */}
      {showAddProductModal && (
        <div className="modal-overlay" onClick={() => setShowAddProductModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#242938] mb-4">
              <h3 className="font-cinzel text-base font-bold text-white">YENİ ALTIN ÜRÜN EKLE</h3>
              <button onClick={() => setShowAddProductModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs max-h-[80vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Barkod / RFID</label>
                  <input
                    type="text"
                    required
                    value={newProduct.barcode}
                    onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                    placeholder="KYM-2024-..."
                    className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kategori</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                  >
                    <option value="Yüzük">Yüzük</option>
                    <option value="Bilezik">Bilezik</option>
                    <option value="Kolye">Kolye</option>
                    <option value="Küpe">Küpe</option>
                    <option value="Set">Set</option>
                    <option value="Ziynet">Ziynet / Yatırımlık</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Model / Ürün Adı</label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="22 Ayar Trabzon Hasırı Bilezik"
                  className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                />
              </div>

              {/* Altın & Maden Özellikleri */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ayar</label>
                  <select
                    value={newProduct.purity}
                    onChange={(e) => {
                      const p = e.target.value;
                      const m = p === '24K' ? 1000 : (p === '22K' ? 916 : (p === '18K' ? 750 : 585));
                      setNewProduct({ ...newProduct, purity: p, milyem: m });
                    }}
                    className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                  >
                    <option value="24K">24K (Has)</option>
                    <option value="22K">22K</option>
                    <option value="18K">18K</option>
                    <option value="14K">14K</option>
                    <option value="8K">8K</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Maden Rengi</label>
                  <select
                    value={newProduct.gold_color}
                    onChange={(e) => setNewProduct({ ...newProduct, gold_color: e.target.value })}
                    className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                  >
                    <option value="Sarı Altın">Sarı Altın</option>
                    <option value="Beyaz Altın">Beyaz Altın</option>
                    <option value="Rose Altın">Rose (Pembe) Altın</option>
                    <option value="Çift Renk">Çift Renk (Kombin)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ağırlık (gr)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProduct.weight_grams}
                    onChange={(e) => setNewProduct({ ...newProduct, weight_grams: e.target.value })}
                    placeholder="15.50"
                    className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Fiyat & Maliyet */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Satış Fiyatı (₺)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="45000"
                    className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">İşçilik Bedeli (₺)</label>
                  <input
                    type="number"
                    step="1"
                    value={newProduct.labor_cost}
                    onChange={(e) => setNewProduct({ ...newProduct, labor_cost: e.target.value })}
                    placeholder="1200"
                    className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Alış Maliyeti (₺)</label>
                  <input
                    type="number"
                    step="1"
                    value={newProduct.cost_price}
                    onChange={(e) => setNewProduct({ ...newProduct, cost_price: e.target.value })}
                    placeholder="36000"
                    className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* İşçilik Detayları */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">İşçilik Türü</label>
                  <select
                    value={newProduct.craftsmanship_type}
                    onChange={(e) => setNewProduct({ ...newProduct, craftsmanship_type: e.target.value })}
                    className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                  >
                    <option value="El İşçiliği">El İşçiliği</option>
                    <option value="Trabzon Hasırı (El Örgüsü)">Trabzon Hasırı</option>
                    <option value="Telkari & Filigran">Telkari & Filigran</option>
                    <option value="Lazer Kesim & Tel Çekme">Lazer Kesim</option>
                    <option value="Döküm & Mikromıhlama">Döküm & Mikromıhlama</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Yüzey İşlemi</label>
                  <select
                    value={newProduct.surface_finish}
                    onChange={(e) => setNewProduct({ ...newProduct, surface_finish: e.target.value })}
                    className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                  >
                    <option value="Parlak">Parlak (Ayna Cila)</option>
                    <option value="Kum Saten">Kum Saten (Mat)</option>
                    <option value="Kombin (Parlak & Mat)">Kombin (Parlak & Mat)</option>
                    <option value="Oksitli / Eskitme">Oksitli / Eskitme</option>
                  </select>
                </div>
              </div>

              {/* Değerli Taş / Pırlanta Toggle & 4C Alanları */}
              <div className="p-3 bg-[#0a0c10] rounded-lg border border-[#242938] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newProduct.has_stones}
                      onChange={(e) => setNewProduct({ ...newProduct, has_stones: e.target.checked })}
                      className="rounded text-amber-500"
                    />
                    <span>Üründe Pırlanta / Değerli Taş Var mı? (4C Standardı)</span>
                  </label>
                  {newProduct.has_stones && (
                    <span className="text-[10px] text-amber-400 font-mono">4C Sertifikalı</span>
                  )}
                </div>

                {newProduct.has_stones && (
                  <div className="pt-2 border-t border-[#1e2330] space-y-2">
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-0.5">Taş Türü</label>
                        <select
                          value={newProduct.gemstone_type}
                          onChange={(e) => setNewProduct({ ...newProduct, gemstone_type: e.target.value })}
                          className="w-full bg-[#12141c] border border-[#242938] text-white rounded p-1.5 text-xs"
                        >
                          <option value="Pırlanta">Pırlanta</option>
                          <option value="Doğal Safir">Doğal Safir</option>
                          <option value="Zümrüt">Zümrüt</option>
                          <option value="Yakut">Yakut</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-0.5">Karat (ct)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newProduct.diamond_carat}
                          onChange={(e) => setNewProduct({ ...newProduct, diamond_carat: e.target.value })}
                          placeholder="0.50"
                          className="w-full bg-[#12141c] border border-[#242938] text-white rounded p-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-0.5">Renk (Color)</label>
                        <select
                          value={newProduct.diamond_color}
                          onChange={(e) => setNewProduct({ ...newProduct, diamond_color: e.target.value })}
                          className="w-full bg-[#12141c] border border-[#242938] text-white rounded p-1.5 text-xs"
                        >
                          <option value="D">D (Ekstra Beyaz)</option>
                          <option value="E">E (Ekstra Beyaz)</option>
                          <option value="F">F (Nadir Beyaz)</option>
                          <option value="G">G (Top Wesselton)</option>
                          <option value="H">H (Wesselton)</option>
                          <option value="I-J">I-J (Hafif Renkli)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-0.5">Berraklık</label>
                        <select
                          value={newProduct.diamond_clarity}
                          onChange={(e) => setNewProduct({ ...newProduct, diamond_clarity: e.target.value })}
                          className="w-full bg-[#12141c] border border-[#242938] text-white rounded p-1.5 text-xs"
                        >
                          <option value="FL/IF">FL / IF (Kusursuz)</option>
                          <option value="VVS1">VVS1</option>
                          <option value="VVS2">VVS2</option>
                          <option value="VS1">VS1</option>
                          <option value="VS2">VS2</option>
                          <option value="SI1">SI1</option>
                          <option value="SI2">SI2</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-0.5">Kesim (Cut)</label>
                        <select
                          value={newProduct.diamond_cut}
                          onChange={(e) => setNewProduct({ ...newProduct, diamond_cut: e.target.value })}
                          className="w-full bg-[#12141c] border border-[#242938] text-white rounded p-1.5 text-xs"
                        >
                          <option value="Excellent">Excellent (Mükemmel)</option>
                          <option value="Very Good">Very Good (Çok İyi)</option>
                          <option value="Good">Good (İyi)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-0.5">Taş Şekli</label>
                        <select
                          value={newProduct.stone_shape}
                          onChange={(e) => setNewProduct({ ...newProduct, stone_shape: e.target.value })}
                          className="w-full bg-[#12141c] border border-[#242938] text-white rounded p-1.5 text-xs"
                        >
                          <option value="Yuvarlak (Brillant)">Yuvarlak (Brillant)</option>
                          <option value="Baget">Baget</option>
                          <option value="Prenses">Prenses</option>
                          <option value="Zümrüt Kesim">Zümrüt Kesim</option>
                          <option value="Damla">Damla</option>
                          <option value="Oval">Oval</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[10px] mb-0.5">Sertifika & No</label>
                        <input
                          type="text"
                          value={newProduct.certificate_no}
                          onChange={(e) => setNewProduct({ ...newProduct, certificate_no: e.target.value })}
                          placeholder="HRD-2024-..."
                          className="w-full bg-[#12141c] border border-[#242938] text-white rounded p-1.5 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Fotoğraf URL</label>
                  <input
                    type="text"
                    value={newProduct.image_url}
                    onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Asılacak Askı / Tabla</label>
                  <select
                    value={newProduct.slot_id}
                    onChange={(e) => setNewProduct({ ...newProduct, slot_id: e.target.value })}
                    className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                  >
                    <option value="">-- Askıya Takma (Kasada Kalsın) --</option>
                  {slots.map(s => (
                    <option key={s.id} value={s.id}>#{s.slot_number} - {s.label} ({s.group_name})</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="btn-gold w-full py-2.5 justify-center font-bold text-xs mt-2">
                Ürünü Kaydet
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Yeni Cihaz / Tabla Modalı */}
      {showAddSlotModal && (
        <div className="modal-overlay" onClick={() => setShowAddSlotModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#242938] mb-4">
              <h3 className="font-cinzel text-base font-bold text-white">YENİ IOT ASKI / TABLA TANIMLA</h3>
              <button onClick={() => setShowAddSlotModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateSlot} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Yuva No</label>
                  <input
                    type="number"
                    required
                    value={newSlotData.slot_number}
                    onChange={(e) => setNewSlotData({ ...newSlotData, slot_number: e.target.value })}
                    placeholder="7"
                    className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cihaz Türü</label>
                  <select
                    value={newSlotData.slot_type}
                    onChange={(e) => setNewSlotData({ ...newSlotData, slot_type: e.target.value })}
                    className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                  >
                    <option value="Askı">Askılık</option>
                    <option value="Tabla">Yüzük Tablası</option>
                    <option value="Tepsi">Bilezik Tepsisi</option>
                    <option value="Kasa Bölmesi">Kasa Bölmesi</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Etiket</label>
                  <input
                    type="text"
                    required
                    value={newSlotData.label}
                    onChange={(e) => setNewSlotData({ ...newSlotData, label: e.target.value })}
                    placeholder="Vitrin Askı #7"
                    className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Bölüm / Grup</label>
                  <input
                    type="text"
                    required
                    value={newSlotData.group_name}
                    onChange={(e) => setNewSlotData({ ...newSlotData, group_name: e.target.value })}
                    placeholder="Ana Vitrin, Yüzük Tablası vb."
                    className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">IP Adresi</label>
                  <input
                    type="text"
                    required
                    value={newSlotData.ip_address}
                    onChange={(e) => setNewSlotData({ ...newSlotData, ip_address: e.target.value })}
                    placeholder="192.168.1.107"
                    className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tolerans (gr)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newSlotData.tolerance_grams}
                    onChange={(e) => setNewSlotData({ ...newSlotData, tolerance_grams: e.target.value })}
                    placeholder="0.20"
                    className="w-full bg-[#0e1017] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <button type="submit" className="btn-gold w-full py-2.5 justify-center font-bold text-xs mt-2">
                Cihazı Ekle
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= RESMİ HESAP PUSULASI & DARPHANE AYAR DAMGASI MODALI ================= */}
      {showPusulaModal && selectedSaleForPusula && (
        <div className="modal-overlay" onClick={() => setShowPusulaModal(false)}>
          <div className="modal-content max-w-2xl bg-[#0a0c10] border border-amber-500/40 text-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#242938] mb-4">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-cinzel text-base font-bold text-white tracking-wider">RESMİ HESAP PUSULASI & AYAR DAMGASI</h3>
              </div>
              <button onClick={() => setShowPusulaModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* A4 Baskı Uyumlu Pusula Şablonu */}
            <div id="printable-pusula" className="p-5 bg-[#0f121a] rounded-xl border border-amber-500/30 font-mono text-xs space-y-4">
              <div className="flex justify-between items-start border-b border-dashed border-amber-500/40 pb-3">
                <div>
                  <div className="font-cinzel font-bold text-base text-amber-400 tracking-wider">SARRAF ERDEM KUYUMCULUK</div>
                  <div className="text-[10px] text-slate-400">Kapalıçarşı Kalpakçılar Cad. No: 42 Fatih / İSTANBUL</div>
                  <div className="text-[10px] text-slate-400">Vergi Dairesi: Beyazıt | VKN: 7480192841 | Mersis: 0748019284100001</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">Darphane ve Damga Matbaası Yetki No: TR-34-IST-8849</div>
                </div>
                <div className="text-right">
                  <div className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 text-xs inline-block">
                    HESAP PUSULASI
                  </div>
                  <div className="text-slate-400 text-[11px] mt-1 font-bold">No: {selectedSaleForPusula.invoice_no || `SE-${selectedSaleForPusula.id}`}</div>
                  <div className="text-slate-400 text-[10px]">Tarih: {selectedSaleForPusula.date || new Date().toLocaleString('tr-TR')}</div>
                </div>
              </div>

              {/* Müşteri & Personel Bilgisi */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-[#08090d] rounded-lg border border-[#242938]">
                <div>
                  <div className="text-amber-400/80 font-bold text-[10px] uppercase mb-1">Müşteri / Alıcı</div>
                  <div className="text-white font-bold">{selectedSaleForPusula.customer_name || 'Muhtelif Müşteri'}</div>
                  {selectedSaleForPusula.masak_id_number && (
                    <div className="text-slate-300 text-[11px]">TCKN / Pasaport: <span className="font-bold text-amber-300">{selectedSaleForPusula.masak_id_number}</span></div>
                  )}
                  {selectedSaleForPusula.customer_phone && (
                    <div className="text-slate-400 text-[11px]">Tel: {selectedSaleForPusula.customer_phone}</div>
                  )}
                </div>
                <div>
                  <div className="text-amber-400/80 font-bold text-[10px] uppercase mb-1">İşlem & Satıcı Bilgisi</div>
                  <div className="text-slate-300">Satıcı Personel: <span className="text-white font-semibold">{selectedSaleForPusula.seller_name || 'Kuyumcu Satış'}</span></div>
                  <div className="text-slate-300">Şube: <span className="text-white font-semibold">Kapalıçarşı Ana Mağaza</span></div>
                  <div className="text-slate-300">Ödeme: <span className="text-emerald-400 font-semibold">{selectedSaleForPusula.payment_method || 'Nakit'}</span></div>
                </div>
              </div>

              {/* Kalemler Tablosu */}
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-[#242938] text-slate-400 text-left">
                    <th className="pb-1.5 font-semibold">Ürün Adı</th>
                    <th className="pb-1.5 font-semibold">Ayar / Milyem</th>
                    <th className="pb-1.5 font-semibold text-right">Brüt (gr)</th>
                    <th className="pb-1.5 font-semibold text-right">Has (gr)</th>
                    <th className="pb-1.5 font-semibold text-right">Has Tutarı (₺)</th>
                    <th className="pb-1.5 font-semibold text-right">İşçilik + KDV (₺)</th>
                    <th className="pb-1.5 font-semibold text-right">Toplam (₺)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2330]">
                  <tr>
                    <td className="py-2 text-white font-semibold">{selectedSaleForPusula.product_name}</td>
                    <td className="py-2 text-amber-400">{selectedSaleForPusula.purity}</td>
                    <td className="py-2 text-right text-slate-200">{selectedSaleForPusula.weight_grams} gr</td>
                    <td className="py-2 text-right text-amber-300 font-bold">
                      {selectedSaleForPusula.has_grams ? selectedSaleForPusula.has_grams.toFixed(3) : (selectedSaleForPusula.weight_grams * 0.916).toFixed(3)} gr
                    </td>
                    <td className="py-2 text-right text-slate-300">
                      {selectedSaleForPusula.has_amount ? selectedSaleForPusula.has_amount.toLocaleString('tr-TR') : Math.round(selectedSaleForPusula.sale_price * 0.92).toLocaleString('tr-TR')} ₺
                    </td>
                    <td className="py-2 text-right text-slate-300">
                      {selectedSaleForPusula.labor_cost_with_vat ? selectedSaleForPusula.labor_cost_with_vat.toLocaleString('tr-TR') : Math.round(selectedSaleForPusula.sale_price * 0.08).toLocaleString('tr-TR')} ₺
                    </td>
                    <td className="py-2 text-right text-white font-bold">
                      {selectedSaleForPusula.sale_price.toLocaleString('tr-TR')} ₺
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Yasal KDV İstisna Ayrımı (3065 S.K. Madde 17/4-g) */}
              <div className="p-3 bg-[#08090d] rounded-lg border border-emerald-500/30 grid grid-cols-2 gap-3 text-[11px]">
                <div className="space-y-1 text-slate-400">
                  <div>• Has Altın Bedeli: <strong className="text-white">{selectedSaleForPusula.has_amount ? selectedSaleForPusula.has_amount.toLocaleString('tr-TR') : Math.round(selectedSaleForPusula.sale_price * 0.92).toLocaleString('tr-TR')} ₺</strong> (KDV'den Müstesna)</div>
                  <div>• İşçilik Matrahı: <strong className="text-white">{Math.round((selectedSaleForPusula.labor_cost_with_vat || selectedSaleForPusula.sale_price * 0.08) / 1.20).toLocaleString('tr-TR')} ₺</strong></div>
                  <div>• Hesaplanan KDV (%20): <strong className="text-amber-400">{Math.round((selectedSaleForPusula.labor_cost_with_vat || selectedSaleForPusula.sale_price * 0.08) - (selectedSaleForPusula.labor_cost_with_vat || selectedSaleForPusula.sale_price * 0.08) / 1.20).toLocaleString('tr-TR')} ₺</strong></div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-slate-400">İskonto: 0,00 ₺</div>
                  <div className="text-sm font-bold text-amber-400">
                    Genel Toplam: {selectedSaleForPusula.sale_price.toLocaleString('tr-TR')} ₺
                  </div>
                  {selectedSaleForPusula.is_two_man_approved && (
                    <div className="text-[10px] text-emerald-400">✓ 2. Yetkili Onaylı Satış ({selectedSaleForPusula.second_approver_name || 'Şef Onay'})</div>
                  )}
                </div>
              </div>

              {/* Resmi Açıklama & Damga Metni */}
              <div className="text-[9px] text-slate-500 leading-tight border-t border-[#1e2330] pt-2">
                * İşbu belge 213 Sayılı Vergi Usul Kanunu Genel Tebliği ve 3065 Sayılı KDV Kanununun 17/4-g bendi gereğince fatura yerine geçen resmi kuyumculuk hesap pusulasıdır. Has altın teslimleri KDV istisnasına tabi olup yalnızca işçilik tutarı üzerinden KDV hesaplanmıştır. Darphane ayar damgası orijinal kontrolü yapılmıştır.
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <span className="text-[11px] text-slate-400 font-mono">Resmi Belge Kodu: TR-{selectedSaleForPusula.id}-DARPHANE</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowPusulaModal(false)} className="btn-secondary text-xs py-2 px-4">
                  Kapat
                </button>
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="btn-gold text-xs py-2 px-4 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Yazdır / PDF Olarak Kaydet</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ŞUBELER ARASI STOK TRANSFER MODALI ================= */}
      {showTransferModal && (
        <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div className="modal-content max-w-lg bg-[#0d1017] border border-[#242938] text-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#242938] mb-4">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-cinzel text-base font-bold text-white">ŞUBELER ARASI GÜVENLİ STOK TRANSFERİ</h3>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleStockTransfer} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kaynak Şube (Çıkış)</label>
                  <select
                    value={transferFromBranch}
                    onChange={(e) => setTransferFromBranch(e.target.value)}
                    className="w-full bg-[#08090d] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Hedef Şube (Giriş)</label>
                  <select
                    value={transferToBranch}
                    onChange={(e) => setTransferToBranch(e.target.value)}
                    className="w-full bg-[#08090d] border border-amber-500/40 text-white rounded p-2 text-xs focus:outline-none"
                  >
                    {branches.filter(b => b.id.toString() !== transferFromBranch.toString()).map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Transfer Edilecek Ürün</label>
                <select
                  value={transferProductId}
                  onChange={(e) => setTransferProductId(e.target.value)}
                  className="w-full bg-[#08090d] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                >
                  <option value="">-- Ürün Seçin --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.purity} - {p.weight_grams} gr) - Stok: {p.stock_quantity || 1} adet
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Transfer Adedi</label>
                  <input
                    type="number"
                    min="1"
                    value={transferQuantity}
                    onChange={(e) => setTransferQuantity(e.target.value)}
                    placeholder="1"
                    className="w-full bg-[#08090d] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Taşıma / Güvenlik Türü</label>
                  <select className="w-full bg-[#08090d] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none">
                    <option value="Zırhlı Kurye">Zırhlı Güvenlik Kuryesi</option>
                    <option value="Yetkili Personel">Yetkili Mağaza Personeli</option>
                    <option value="Sigortalı Değerli Kargo">Sigortalı Değerli Kargo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Transfer Açıklaması / İrsaliye Notu</label>
                <textarea
                  rows={2}
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="Vitrin takviyesi ve sergi amaçlı şube transferi..."
                  className="w-full bg-[#08090d] border border-[#242938] text-white rounded p-2 text-xs focus:outline-none"
                />
              </div>

              <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30 text-slate-300 text-[11px] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Şubeler arası transfer anında irsaliye kaydı oluşturulur ve sistem günlüğüne kaydedilir.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowTransferModal(false)} className="btn-secondary text-xs py-2 px-4">
                  İptal
                </button>
                <button type="submit" className="btn-gold text-xs py-2 px-4 font-bold">
                  Transfer İrsaliyesini Onayla & Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= VIP MÜCEVHER MÜŞTERİ SUNUM EKRANI (SHOWCASE STORY / TABLET MODU) ================= */}
      {showPresentationModal && presentationData && (
        <div className="modal-overlay" onClick={() => setShowPresentationModal(false)}>
          <div className="modal-content max-w-5xl bg-[#090b10] border-2 border-amber-500/50 text-slate-200 shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            {/* Üst Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-amber-500/30 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-widest">
                    SARRAF ERDEM • VIP SHOWROOM SUNUM MODU
                  </div>
                  <h2 className="font-cinzel text-xl font-bold text-white tracking-wide">
                    {presentationData.product.name}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold">
                  {presentationData.product.barcode}
                </span>
                <button onClick={() => setShowPresentationModal(false)} className="text-slate-400 hover:text-white text-xl p-1">✕</button>
              </div>
            </div>

            {/* İki Kolonlu Sunum Düzeni */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Sol Kolon: Fotoğraf & 360 Döner Açı & Büyüteç */}
              <div className="lg:col-span-5 space-y-4">
                <div className="relative bg-[#10131d] rounded-2xl border border-[#242938] overflow-hidden flex items-center justify-center min-h-[340px] group">
                  {presentationData.product.image_url ? (
                    <img
                      src={presentationData.product.image_url}
                      alt={presentationData.product.name}
                      style={{
                        transform: `rotate(${presentationAngle}deg) ${presentationZoom ? 'scale(1.4)' : 'scale(1)'}`,
                        transition: 'transform 0.3s ease'
                      }}
                      className="max-h-[320px] object-contain p-4 cursor-pointer"
                      onClick={() => setPresentationZoom(!presentationZoom)}
                    />
                  ) : (
                    <div className="text-center p-8 text-amber-400/60">
                      <Sparkles className="w-16 h-16 mx-auto mb-2" />
                      <span className="text-xs">Görsel Yüklenmedi</span>
                    </div>
                  )}

                  {/* Sol Rozetler */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur text-amber-300 font-mono text-xs font-bold border border-amber-500/40">
                      {presentationData.product.purity} • {presentationData.product.milyem || 916}‰
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur text-slate-200 text-xs font-semibold border border-slate-700">
                      {presentationData.product.gold_color || 'Sarı Altın'}
                    </span>
                  </div>

                  {/* Sağ Büyüteç Butonu */}
                  <button
                    onClick={() => setPresentationZoom(!presentationZoom)}
                    className="absolute bottom-3 right-3 px-2.5 py-1.5 rounded-lg bg-black/80 text-white text-xs border border-white/20 hover:border-amber-400 flex items-center gap-1"
                  >
                    <span>{presentationZoom ? 'Normale Dön' : '🔍 Yakınlaştır'}</span>
                  </button>
                </div>

                {/* 360 Döner Açı Kontrolü */}
                <div className="p-3 bg-[#10131d] rounded-xl border border-[#242938] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      <span>360° Döner Açı İnceleme</span>
                    </span>
                    <span className="font-mono text-amber-400 font-bold">{presentationAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="15"
                    value={presentationAngle}
                    onChange={(e) => setPresentationAngle(parseInt(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* QR Kod ile Müşteri Cep Telefonuna Aktarma */}
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-amber-400" />
                      <span>Mobil Paylaşım & Kaydetme</span>
                    </div>
                    <div className="text-[10px] text-slate-300">
                      Müşteri telefon kamerasıyla okutup ürünü kaydedebilir.
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://sarraferdem.com/urun/${presentationData.product.barcode}`);
                      alert("Mücevher detay linki panoya kopyalandı! WhatsApp ile gönderebilirsiniz.");
                    }}
                    className="btn-gold text-[10px] py-1 px-2.5"
                  >
                    Bağlantıyı Kopyala
                  </button>
                </div>
              </div>

              {/* Sağ Kolon: Sekmeli Detay & Fiyatlandırma Paneli */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                {/* Sunum Sekmeleri */}
                <div className="flex items-center gap-1 border-b border-[#242938] pb-2 text-xs">
                  <button
                    onClick={() => setPresentationActiveTab('overview')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${presentationActiveTab === 'overview' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'}`}
                  >
                    💎 Genel & Hikaye
                  </button>
                  {presentationData.product.has_stones && (
                    <button
                      onClick={() => setPresentationActiveTab('4c')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition ${presentationActiveTab === '4c' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'}`}
                    >
                      ✨ 4C Pırlanta Standardı
                    </button>
                  )}
                  <button
                    onClick={() => setPresentationActiveTab('pricing')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${presentationActiveTab === 'pricing' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'}`}
                  >
                    💰 Şeffaf Fiyat Dökümü
                  </button>
                  <button
                    onClick={() => setPresentationActiveTab('care')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${presentationActiveTab === 'care' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'}`}
                  >
                    🛡️ Bakım & Garanti
                  </button>
                </div>

                {/* Sekme 1: Genel & Hikaye */}
                {presentationActiveTab === 'overview' && (
                  <div className="space-y-3 text-xs">
                    <p className="text-slate-300 leading-relaxed bg-[#10131d] p-3 rounded-xl border border-[#242938]">
                      {presentationData.product.description || "Sarraf Erdem özel koleksiyonundan usta kuyumcu işçiliğiyle üretilmiş eşsiz mücevher parçası."}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-[#10131d] rounded-xl border border-[#242938] space-y-1">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Maden & Saflık</div>
                        <div className="text-white font-bold text-sm">{presentationData.product.purity} ({presentationData.product.milyem || 916} Milyem)</div>
                        <div className="text-amber-400 font-mono">{presentationData.product.gold_color || 'Sarı Altın'}</div>
                        <div className="text-slate-400 text-[11px] mt-1">Brüt Ağırlık: <strong className="text-white">{presentationData.product.weight_grams} gr</strong></div>
                        <div className="text-emerald-400 text-[11px]">Net Has Altın: <strong>{presentationData.has_gold_grams} gr</strong></div>
                      </div>

                      <div className="p-3 bg-[#10131d] rounded-xl border border-[#242938] space-y-1">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">İşçilik & Sanat Ekolü</div>
                        <div className="text-white font-bold text-sm">{presentationData.product.craftsmanship_type || 'El İşçiliği'}</div>
                        <div className="text-slate-300">{presentationData.product.surface_finish || 'Parlak Cila'}</div>
                        <div className="text-slate-400 text-[11px] mt-1">Menşei: {presentationData.product.workshop_origin || 'Kapalıçarşı Atölyesi'}</div>
                        <div className="text-indigo-300 text-[11px]">Ölçü/Beden: {presentationData.product.size_or_length || 'Standart Ölçü'}</div>
                      </div>
                    </div>

                    <div className="p-3 bg-[#10131d] rounded-xl border border-[#242938] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-400" />
                        <div>
                          <div className="font-bold text-white">Darphane ve Damga Matbaası Tescilli</div>
                          <div className="text-[10px] text-slate-400">Resmi ayar damgası ve mikroskopik lazer mühür kontrolü yapılmıştır.</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/40">
                        ✓ Orijinal Tescil
                      </span>
                    </div>
                  </div>
                )}

                {/* Sekme 2: 4C Pırlanta Standardı */}
                {presentationActiveTab === '4c' && presentationData.product.has_stones && (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-4 gap-2">
                      <div className="p-3 bg-[#10131d] rounded-xl border border-indigo-500/40 text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Carat (Ağırlık)</div>
                        <div className="font-display text-xl font-bold text-white mt-1">
                          {presentationData.product.diamond_carat ? `${presentationData.product.diamond_carat} ct` : '0.45 ct'}
                        </div>
                        <div className="text-[10px] text-indigo-300 font-mono mt-0.5">Hassas Taş</div>
                      </div>

                      <div className="p-3 bg-[#10131d] rounded-xl border border-indigo-500/40 text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Color (Renk)</div>
                        <div className="font-display text-xl font-bold text-amber-400 mt-1">
                          {presentationData.product.diamond_color || 'F'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">Ekstra Beyaz</div>
                      </div>

                      <div className="p-3 bg-[#10131d] rounded-xl border border-indigo-500/40 text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Clarity (Berraklık)</div>
                        <div className="font-display text-xl font-bold text-emerald-400 mt-1">
                          {presentationData.product.diamond_clarity || 'VS1'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">Çok Küçük Lekeli</div>
                      </div>

                      <div className="p-3 bg-[#10131d] rounded-xl border border-indigo-500/40 text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Cut (Kesim)</div>
                        <div className="font-display text-base font-bold text-white mt-1 line-clamp-1">
                          {presentationData.product.diamond_cut || 'Excellent'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">Maksimum Parlaklık</div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-[#10131d] rounded-xl border border-[#242938] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">Taş Kesim Şekli:</span>
                        <span className="text-amber-300 font-semibold">{presentationData.product.stone_shape || 'Yuvarlak (Brillant Cut)'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">Uluslararası Sertifika:</span>
                        <span className="text-white font-mono bg-[#191c26] px-2 py-0.5 rounded border border-[#242938]">
                          {presentationData.product.stone_certificate || 'HRD Antwerp / GIA'}
                        </span>
                      </div>
                      {presentationData.product.certificate_no && (
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">Sertifika Takip No:</span>
                          <span className="text-emerald-400 font-mono font-bold">{presentationData.product.certificate_no}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sekme 3: Şeffaf Fiyatlandırma Dökümü */}
                {presentationActiveTab === 'pricing' && (
                  <div className="space-y-3 text-xs">
                    <div className="p-4 bg-[#10131d] rounded-xl border border-amber-500/30 space-y-2">
                      <div className="flex items-center justify-between border-b border-[#242938] pb-2">
                        <span className="text-slate-400">Has Altın Bedeli ({presentationData.has_gold_grams} gr × {presentationData.current_gold_rate.toLocaleString('tr-TR')} ₺):</span>
                        <span className="font-mono text-white font-bold">{presentationData.has_gold_value_tl.toLocaleString('tr-TR')} ₺</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-[#242938] pb-2">
                        <span className="text-slate-400">Usta İşçilik & Tasarım Bedeli:</span>
                        <span className="font-mono text-white font-bold">{presentationData.labor_cost_tl.toLocaleString('tr-TR')} ₺</span>
                      </div>
                      {presentationData.stone_value_tl > 0 && (
                        <div className="flex items-center justify-between border-b border-[#242938] pb-2">
                          <span className="text-slate-400">Değerli Taş & Pırlanta Bedeli:</span>
                          <span className="font-mono text-indigo-300 font-bold">{presentationData.stone_value_tl.toLocaleString('tr-TR')} ₺</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-sm font-bold text-amber-400">Genel Toplam Tutar:</span>
                        <span className="text-xl font-display font-bold text-white">
                          {presentationData.total_price_tl.toLocaleString('tr-TR')} ₺
                        </span>
                      </div>
                      <div className="text-[10px] text-emerald-400/90 pt-1">
                        * KDV Kanunu 17/4-g uyarınca has altın bedeli KDV'den muaftır.
                      </div>
                    </div>

                    {/* Taksit Seçenekleri */}
                    <div className="grid grid-cols-4 gap-2">
                      {presentationData.installment_plans.map(plan => (
                        <div key={plan.installment_count} className="p-2.5 bg-[#10131d] rounded-lg border border-[#242938] text-center">
                          <div className="text-[10px] text-slate-400 font-bold">{plan.installment_count === 1 ? 'Tek Çekim' : `${plan.installment_count} Taksit`}</div>
                          <div className="font-bold text-white text-xs mt-1">{plan.monthly_amount.toLocaleString('tr-TR')} ₺/ay</div>
                          <div className="text-[9px] text-slate-500 mt-0.5">{plan.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sekme 4: Bakım & Garanti */}
                {presentationActiveTab === 'care' && (
                  <div className="space-y-3 text-xs">
                    <div className="p-4 bg-[#10131d] rounded-xl border border-[#242938] space-y-2">
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span>Mücevher Bakım & Kullanım Talimatı</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        {presentationData.product.care_instructions || "Parfüm, çamaşır suyu ve kimyasallardan uzak tutunuz. Ilık sabunlu su ve yumuşak mikrofiber bezle temizleyiniz."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-[#10131d] rounded-xl border border-[#242938] space-y-1">
                        <div className="font-bold text-white">Ömür Boyu Ücretsiz Bakım</div>
                        <div className="text-slate-400 text-[11px]">Yılda 1 kez ücretsiz profesyonel ultrasonik yıkama ve cila hizmeti.</div>
                      </div>
                      <div className="p-3 bg-[#10131d] rounded-xl border border-[#242938] space-y-1">
                        <div className="font-bold text-white">Ölçü & Gravür Garantisi</div>
                        <div className="text-slate-400 text-[11px]">İlk 6 ay içinde ücretsiz yüzük boyu ayarı ve lazer isim gravürü.</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Alt Aksiyon Butonları */}
                <div className="pt-4 border-t border-[#242938] flex items-center justify-between gap-3">
                  <button
                    onClick={() => setShowPresentationModal(false)}
                    className="btn-secondary text-xs py-2.5 px-4"
                  >
                    Kapat
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowPresentationModal(false);
                        setSelectedProductForSale(presentationData.product);
                        setShowSaleModal(true);
                      }}
                      className="btn-gold text-xs py-2.5 px-5 font-bold flex items-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Bu Ürünün Satışını Başlat</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= EXCEL / CSV TOPLU ÜRÜN İÇE AKTARMA MODALI ================= */}
      {showBulkImportModal && (
        <div className="modal-overlay" onClick={() => setShowBulkImportModal(false)}>
          <div className="modal-content max-w-lg bg-[#0d1017] border border-indigo-500/40 text-slate-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#242938] mb-4">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-cinzel text-base font-bold text-white">EXCEL / CSV TOPLU ÜRÜN İÇE AKTARMA</h3>
              </div>
              <button onClick={() => setShowBulkImportModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleBulkCsvImport} className="space-y-3 text-xs">
              <p className="text-slate-300">
                Atölye veya toptancıdan gelen ürün listenizi CSV formatında yapıştırarak tek seferde yüzlerce ürünü sisteme ekleyebilirsiniz.
              </p>

              <div className="flex items-center justify-between">
                <label className="text-slate-400 text-[11px] font-semibold">CSV Formatı: Barkod, Ürün Adı, Kategori, Ayar, Gram, Fiyat</label>
                <button
                  type="button"
                  onClick={() => {
                    setBulkImportCsvText(
                      `barcode,name,category,purity,weight,price\n` +
                      `KYM-2024-050,22 Ayar Samanyolu Bilezik,Bilezik,22K,20.50,62000\n` +
                      `KYM-2024-051,14 Ayar Baget Kolye,Kolye,14K,6.20,18500\n` +
                      `KYM-2024-052,18 Ayar Safir Yüzük,Yüzük,18K,5.10,24000`
                    );
                  }}
                  className="text-[10px] text-amber-400 underline hover:text-amber-300"
                >
                  Örnek Şablonu Doldur
                </button>
              </div>

              <textarea
                rows={6}
                required
                value={bulkImportCsvText}
                onChange={(e) => setBulkImportCsvText(e.target.value)}
                placeholder="KYM-2024-050,22 Ayar Samanyolu Bilezik,Bilezik,22K,20.50,62000&#10;..."
                className="w-full bg-[#08090d] border border-[#242938] text-white rounded p-2.5 text-xs font-mono focus:outline-none focus:border-indigo-500"
              />

              {bulkImportMessage && (
                <div className="p-2.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold text-center border border-emerald-500/40">
                  {bulkImportMessage}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowBulkImportModal(false)} className="btn-secondary text-xs py-2 px-4">
                  İptal
                </button>
                <button type="submit" className="btn-gold text-xs py-2 px-5 font-bold">
                  Ürünleri Sisteme Aktar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODÜL 2 & 3: TEKİL ÜRÜN DETAY SAYFASI & VARYANT SEÇİCİ MODALI ================= */}
      {selectedProductDetail && (
        <div className="modal-overlay" onClick={() => setSelectedProductDetail(null)}>
          <div className="modal-content max-w-3xl bg-[#0f1118] border border-amber-500/40 rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#242938] pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">
                    PRD MODÜL 2 • TEKİL ÜRÜN & VARYANT MERKEZİ
                  </div>
                  <h2 className="text-lg font-bold font-cinzel text-white">{selectedProductDetail.name}</h2>
                </div>
              </div>
              <button onClick={() => setSelectedProductDetail(null)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sol: Görsel & Konum */}
              <div className="space-y-4">
                <div className="w-full h-64 rounded-2xl bg-[#0a0b10] border border-[#262c3e] overflow-hidden flex items-center justify-center relative">
                  {selectedProductDetail.image_url ? (
                    <img src={selectedProductDetail.image_url} alt={selectedProductDetail.name} className="w-full h-full object-cover" />
                  ) : (
                    <Sparkles className="w-16 h-16 text-amber-400/40" />
                  )}
                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono font-bold text-amber-300 border border-amber-500/40">
                    {selectedProductDetail.purity} • {selectedProductDetail.weight_grams} gr
                  </div>
                </div>

                {/* Fiziksel Konum Kartı */}
                <div className="bg-[#141722] border border-amber-500/30 rounded-xl p-3.5 flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-amber-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block">
                      Fiziksel Konum Adresi:
                    </span>
                    <span className="text-xs font-bold text-amber-300 font-mono">
                      {selectedProductDetail.location_label || `${selectedProductDetail.branch_name || 'Mağaza'} – Tabla / Askı Takipte`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sağ: Varyant Matrisi & Dinamik Fiyat */}
              <div className="space-y-4 flex flex-col justify-between">
                <div>
                  {/* Renk Seçici */}
                  <div className="mb-3">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                      Altın Rengi Varyantı:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Sarı Altın', 'Beyaz Altın', 'Rose Altın'].map(color => (
                        <button
                          key={color}
                          onClick={() => setDetailSelectedColor(color)}
                          className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                            detailSelectedColor === color
                              ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400'
                              : 'bg-[#181b26] text-slate-400 hover:text-white border border-[#262c3e]'
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${color === 'Sarı Altın' ? 'bg-amber-400' : color === 'Beyaz Altın' ? 'bg-slate-200' : 'bg-rose-400'}`} />
                          <span>{color}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Boy / Ölçü Seçici */}
                  <div className="mb-3">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                      Ölçü / Boy Seçenekleri:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Standart', '14 No', '16 No', '18 No', '20 No', '45 cm', '50 cm'].map(size => (
                        <button
                          key={size}
                          onClick={() => setDetailSelectedSize(size)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            detailSelectedSize === size
                              ? 'bg-amber-500 text-slate-950 font-mono shadow'
                              : 'bg-[#181b26] text-slate-400 hover:text-white border border-[#262c3e] font-mono'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Kayıtlı Varyantlar Matrisi */}
                  {productVariantsList.length > 0 && (
                    <div className="mb-3 bg-[#0d0f17] border border-[#222736] p-3 rounded-xl">
                      <div className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-1.5">
                        Kayıtlı Varyant Matrisi ({productVariantsList.length}):
                      </div>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {productVariantsList.map(v => (
                          <div key={v.id} className="text-xs flex items-center justify-between text-slate-300 bg-[#161822] px-2 py-1 rounded">
                            <span className="font-mono text-amber-300 font-bold">{v.color} - {v.size_or_length}</span>
                            <span className="text-[10px] text-slate-400 font-mono">Ek İşçilik: +{v.additional_labor} ₺</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dinamik Fiyat Göstergesi */}
                  {(() => {
                    const goldRate = marketData?.altin_gram || 3100;
                    const baseWeight = selectedProductDetail.weight_grams || 0;
                    const baseLabor = selectedProductDetail.labor_cost || 0;
                    const matchedVariant = productVariantsList.find(v => v.color === detailSelectedColor && v.size_or_length === detailSelectedSize);
                    const addLabor = matchedVariant ? matchedVariant.additional_labor : 0;
                    const liveCalculated = (baseWeight * goldRate) + baseLabor + addLabor;

                    return (
                      <div className="bg-gradient-to-r from-[#171a26] to-[#12141c] border border-amber-500/40 rounded-xl p-3.5 space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                          <span>Formül: ({baseWeight}g × {goldRate.toLocaleString('tr-TR')} ₺) + İşçilik ({baseLabor + addLabor} ₺)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300">Dinamik Güncel Satış Fiyatı:</span>
                          <span className="text-xl font-bold font-mono text-amber-400">
                            {liveCalculated.toLocaleString('tr-TR')} ₺
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Aksiyon Butonları */}
                <div className="space-y-2 pt-2 border-t border-[#242938]">
                  {/* PRD Modül 7: Müşteriye Gösterildi / Beğenildi Takibi */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        const custId = customers[0]?.id || 1;
                        handleRecordInterest(selectedProductDetail.id, custId, 'SHOWN', `${detailSelectedColor}, ${detailSelectedSize} denendi`);
                      }}
                      className="btn-secondary text-[11px] py-1.5 px-2.5 border-slate-700 text-slate-300 hover:text-white flex items-center justify-center gap-1"
                      title="Müşteriye Gösterildi Olarak Kaydet"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>Gösterildi / Denendi</span>
                    </button>
                    <button
                      onClick={() => {
                        const custId = customers[0]?.id || 1;
                        handleRecordInterest(selectedProductDetail.id, custId, 'LIKED', `${detailSelectedColor}, ${detailSelectedSize} beğenildi`);
                      }}
                      className="btn-secondary text-[11px] py-1.5 px-2.5 border-rose-500/40 text-rose-300 hover:bg-rose-500/10 flex items-center justify-center gap-1"
                      title="Müşteri Beğendi (İstek Listesi)"
                    >
                      <span className="text-rose-400">❤️</span>
                      <span>Beğenildi Olarak Ekle</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleGenerateCertificate(selectedProductDetail.id)}
                      className="btn-secondary text-xs py-2 px-3 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 flex items-center justify-center gap-1.5"
                    >
                      <Award className="w-4 h-4 text-indigo-400" />
                      <span>Resmi Sertifika QR</span>
                    </button>

                    <button
                      onClick={() => {
                        const calculated = (selectedProductDetail.weight_grams * (marketData?.altin_gram || 3100)) + (selectedProductDetail.labor_cost || 0);
                        setReservationFormData({
                          customer_id: customers[0]?.id || '',
                          product_id: selectedProductDetail.id,
                          deposit_amount: '',
                          total_agreed_price: calculated,
                          reserved_until: '',
                          notes: `${detailSelectedColor}, ${detailSelectedSize}`
                        });
                        setSelectedProductDetail(null);
                        setShowReservationModal(true);
                      }}
                      className="btn-secondary text-xs py-2 px-3 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 flex items-center justify-center gap-1.5"
                    >
                      <Bookmark className="w-4 h-4 text-emerald-400" />
                      <span>Müşteriye Ayır / Kapora</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {(currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER') && (
                      <button
                        onClick={() => setShowAddVariantModal(true)}
                        className="btn-secondary text-xs py-2 px-3 flex-1 flex items-center justify-center gap-1 border-amber-500/40 text-amber-300"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Yeni Varyant Tanımla</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const prod = selectedProductDetail;
                        setSelectedProductDetail(null);
                        setSelectedProductForSale(prod);
                        setShowSaleModal(true);
                      }}
                      className="btn-gold text-xs py-2 px-4 flex-1 flex items-center justify-center gap-1.5 font-bold"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Satışa Gönder (POS)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODÜL 7: RESMİ MÜCEVHER GARANTİ & MENŞEİ SERTİFİKASI MODALI ================= */}
      {certificateModalData && (
        <div className="modal-overlay" onClick={() => setCertificateModalData(null)}>
          <div className="modal-content max-w-xl bg-gradient-to-b from-[#0e1017] via-[#0b0c10] to-[#0e1017] border-2 border-amber-500/60 rounded-3xl p-6 lg:p-8 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            {/* Altın Köşe Varak Süslemeleri */}
            <div className="absolute top-2 left-2 text-amber-500/40 text-xs font-serif">✦</div>
            <div className="absolute top-2 right-2 text-amber-500/40 text-xs font-serif">✦</div>
            <div className="absolute bottom-2 left-2 text-amber-500/40 text-xs font-serif">✦</div>
            <div className="absolute bottom-2 right-2 text-amber-500/40 text-xs font-serif">✦</div>

            {/* Üst Başlık */}
            <div className="text-center border-b border-amber-500/30 pb-4 mb-4">
              <span className="text-[10px] tracking-[0.3em] font-mono text-amber-400 font-bold uppercase block">
                T.C. KUYUMCULUK & DARPHANE STANDARTLARINDA
              </span>
              <h2 className="font-cinzel text-xl lg:text-2xl font-bold text-amber-300 tracking-wider mt-1">
                SARRAF ERDEM
              </h2>
              <p className="text-xs text-slate-300 tracking-widest font-serif italic mt-0.5">
                Resmi Mücevher & Altın Orijinallik Garanti Sertifikası
              </p>
              <div className="inline-block mt-2 px-3 py-1 bg-amber-500/10 border border-amber-500/40 rounded-full font-mono text-xs text-amber-400 font-bold">
                Sertifika No: {certificateModalData.certificate_no}
              </div>
            </div>

            {/* Gövde: QR Kod & Detaylar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-6">
              {/* Karekod */}
              <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-inner">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(certificateModalData.qr_code_data)}`}
                  alt="Sertifika QR"
                  className="w-32 h-32"
                />
                <span className="text-[9px] font-mono text-slate-800 font-bold mt-1.5">DOĞRULAMA KODU</span>
              </div>

              {/* Teknik Özellikler */}
              <div className="sm:col-span-2 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#242938]">
                  <span className="text-slate-400">Ürün Tanımı:</span>
                  <span className="font-bold text-white text-right">{certificateModalData.product_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#242938]">
                  <span className="text-slate-400">Model / Barkod:</span>
                  <span className="font-mono text-amber-300">{certificateModalData.barcode}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#242938]">
                  <span className="text-slate-400">Ayar & Milyem:</span>
                  <span className="font-bold text-amber-400 font-mono">{certificateModalData.purity} ({certificateModalData.milyem}‰)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#242938]">
                  <span className="text-slate-400">Net Gramaj:</span>
                  <span className="font-bold text-white font-mono">{certificateModalData.weight_grams} Gram</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#242938]">
                  <span className="text-slate-400">Taş & Pırlanta:</span>
                  <span className="text-indigo-300 font-bold">{certificateModalData.gem_details}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#242938]">
                  <span className="text-slate-400">Tanzim Eden Mağaza:</span>
                  <span className="text-slate-200">{certificateModalData.issuer_store}</span>
                </div>
              </div>
            </div>

            {/* Alt Mühür & İmzalar */}
            <div className="border-t border-amber-500/30 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-serif">
              <div>
                <div>Düzenleme Tarihi:</div>
                <div className="font-mono text-slate-300 font-bold">{new Date(certificateModalData.issue_date).toLocaleString('tr-TR')}</div>
              </div>
              <div className="text-right">
                <div className="text-amber-400 font-bold">SARRAF ERDEM GÜVENCESİ</div>
                <div className="text-slate-500 italic">Mühür & Dijital İmza</div>
              </div>
            </div>

            {/* PRD Modül 7: Dijital Sertifika Paylaşım Bildirimi */}
            {certificateShareMessage && (
              <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
                {certificateShareMessage}
              </div>
            )}

            {/* Butonlar */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-[#242938] pt-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleShareCertificate('WHATSAPP')}
                  className="px-3 py-2 rounded-lg bg-emerald-700/40 hover:bg-emerald-600/60 border border-emerald-500/50 text-emerald-300 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <span>📲 WhatsApp ile Gönder</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleShareCertificate('EMAIL')}
                  className="px-3 py-2 rounded-lg bg-blue-700/40 hover:bg-blue-600/60 border border-blue-500/50 text-blue-300 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <span>✉️ E-Posta Gönder</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCertificateModalData(null)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Kapat
                </button>
                <button
                  onClick={() => window.print()}
                  className="btn-gold text-xs py-2 px-5 font-bold flex items-center gap-1.5 shadow-lg"
                >
                  <Printer className="w-4 h-4" />
                  <span>🖨️ Sertifikayı Yazdır / PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODÜL 7: MÜŞTERİYE AYIR & KAPORA AL MODALI ================= */}
      {showReservationModal && (
        <div className="modal-overlay" onClick={() => setShowReservationModal(false)}>
          <div className="modal-content max-w-md bg-[#12141c] border border-amber-500/40 rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#242938] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">MÜŞTERİYE AYIR & KAPORA AL</h3>
              </div>
              <button onClick={() => setShowReservationModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateReservation} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Müşteri Seçimi:</label>
                <select
                  value={reservationFormData.customer_id}
                  onChange={(e) => setReservationFormData({ ...reservationFormData, customer_id: e.target.value })}
                  required
                  className="w-full bg-[#181b26] border border-[#2a3042] rounded-lg p-2 text-xs text-white"
                >
                  <option value="">-- Müşteri Seçin --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name} ({c.phone || 'Kayıtsız'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Ayrılacak Mücevher:</label>
                <select
                  value={reservationFormData.product_id}
                  onChange={(e) => setReservationFormData({ ...reservationFormData, product_id: e.target.value })}
                  required
                  className="w-full bg-[#181b26] border border-[#2a3042] rounded-lg p-2 text-xs text-white"
                >
                  <option value="">-- Ürün Seçin --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.purity} • {p.weight_grams}g)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">Alınan Kapora (₺):</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Örn: 2500"
                    value={reservationFormData.deposit_amount}
                    onChange={(e) => setReservationFormData({ ...reservationFormData, deposit_amount: e.target.value })}
                    required
                    className="w-full bg-[#181b26] border border-[#2a3042] rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">Toplam Anlaşılan (₺):</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Örn: 15000"
                    value={reservationFormData.total_agreed_price}
                    onChange={(e) => setReservationFormData({ ...reservationFormData, total_agreed_price: e.target.value })}
                    required
                    className="w-full bg-[#181b26] border border-[#2a3042] rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Opsiyon Bitiş Tarihi:</label>
                <input
                  type="date"
                  value={reservationFormData.reserved_until}
                  onChange={(e) => setReservationFormData({ ...reservationFormData, reserved_until: e.target.value })}
                  required
                  className="w-full bg-[#181b26] border border-[#2a3042] rounded-lg p-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Özel Müşteri Notları (Ölçü vb.):</label>
                <textarea
                  rows="2"
                  placeholder="Örn: Yüzük boyutu 14 numaraya küçültülecek, cumartesi teslim."
                  value={reservationFormData.notes}
                  onChange={(e) => setReservationFormData({ ...reservationFormData, notes: e.target.value })}
                  className="w-full bg-[#181b26] border border-[#2a3042] rounded-lg p-2 text-xs text-white placeholder-slate-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#242938]">
                <button
                  type="button"
                  onClick={() => setShowReservationModal(false)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn-gold text-xs py-2 px-5 font-bold"
                >
                  Kaporayı Kaydet & Ayır
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODÜL 1 & 3: MAĞAZAYA YENİ KONUM (KASA/TABLA/ASKI) TANIMLA MODALI ================= */}
      {showAddLocationModal && (
        <div className="modal-overlay" onClick={() => setShowAddLocationModal(false)}>
          <div className="modal-content max-w-md bg-[#12141c] border border-amber-500/40 rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#242938] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">MAĞAZAYA YENİ FİZİKSEL KONUM TANIMLA</h3>
              </div>
              <button onClick={() => setShowAddLocationModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddBranchLocation} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Konum Tipi:</label>
                <select
                  value={newLocationData.slot_type}
                  onChange={(e) => setNewLocationData({ ...newLocationData, slot_type: e.target.value })}
                  className="w-full bg-[#181b26] border border-[#2a3042] rounded-lg p-2 text-xs text-white"
                >
                  <option value="Askı">📍 Askı (Akıllı IoT Sensörlü)</option>
                  <option value="Tabla">🏷️ Tabla (Çoklu Yüzük / Bilezik Tablası)</option>
                  <option value="Kasa">🔐 Kasa (Çelik Güvenli Alan)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Konum Etiketi / Adı:</label>
                <input
                  type="text"
                  placeholder="Örn: Askı #8, VIP Tabla 2, Arka Çelik Kasa"
                  value={newLocationData.label}
                  onChange={(e) => setNewLocationData({ ...newLocationData, label: e.target.value })}
                  required
                  className="w-full bg-[#181b26] border border-[#2a3042] rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Vitrin / Reyon Grubu:</label>
                <input
                  type="text"
                  placeholder="Örn: Ana Vitrin, VIP Salonu, Kasa Dairesi"
                  value={newLocationData.group_name}
                  onChange={(e) => setNewLocationData({ ...newLocationData, group_name: e.target.value })}
                  className="w-full bg-[#181b26] border border-[#2a3042] rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#242938]">
                <button
                  type="button"
                  onClick={() => setShowAddLocationModal(false)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn-gold text-xs py-2 px-5 font-bold"
                >
                  Konumu Tanımla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODÜL 2: YENİ RENK / BOY VARYANTI EKLEME MODALI ================= */}
      {showAddVariantModal && selectedProductDetail && (
        <div className="modal-overlay" onClick={() => setShowAddVariantModal(false)}>
          <div className="modal-content max-w-md bg-[#12141c] border border-amber-500/40 rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#242938] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">YENİ VARYANT EKLE ({selectedProductDetail.name})</h3>
              </div>
              <button onClick={() => setShowAddVariantModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddVariant} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">Altın Rengi:</label>
                  <select
                    value={newVariantData.color}
                    onChange={(e) => setNewVariantData({ ...newVariantData, color: e.target.value })}
                    className="w-full bg-[#181b26] border border-[#2a3042] rounded-lg p-2 text-xs text-white"
                  >
                    <option value="Sarı Altın">Sarı Altın</option>
                    <option value="Beyaz Altın">Beyaz Altın</option>
                    <option value="Rose Altın">Rose Altın</option>
                    <option value="Yeşil Altın">Yeşil Altın</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">Boy / Ölçü:</label>
                  <input
                    type="text"
                    placeholder="Örn: 14 No, 45 cm"
                    value={newVariantData.size_or_length}
                    onChange={(e) => setNewVariantData({ ...newVariantData, size_or_length: e.target.value })}
                    required
                    className="w-full bg-[#181b26] border border-[#2a3042] rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">Ek İşçilik Bedeli (₺):</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Örn: 500"
                    value={newVariantData.additional_labor}
                    onChange={(e) => setNewVariantData({ ...newVariantData, additional_labor: e.target.value })}
                    className="w-full bg-[#181b26] border border-[#2a3042] rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">Stok Adedi:</label>
                  <input
                    type="number"
                    min="1"
                    value={newVariantData.stock_quantity}
                    onChange={(e) => setNewVariantData({ ...newVariantData, stock_quantity: e.target.value })}
                    className="w-full bg-[#181b26] border border-[#2a3042] rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">Varyanta Özel Barkod / RFID:</label>
                <input
                  type="text"
                  placeholder="Boş bırakılırsa otomatik üretilir"
                  value={newVariantData.variant_barcode || ''}
                  onChange={(e) => setNewVariantData({ ...newVariantData, variant_barcode: e.target.value })}
                  className="w-full bg-[#181b26] border border-[#2a3042] rounded-lg p-2 text-xs text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#242938]">
                <button
                  type="button"
                  onClick={() => setShowAddVariantModal(false)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn-gold text-xs py-2 px-5 font-bold"
                >
                  Varyantı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= PRD MODÜL 1: MAĞAZA KARTI (DETAY) MODALI ================= */}
      {selectedBranchDetailModal && (
        <div className="modal-overlay" onClick={() => setSelectedBranchDetailModal(null)}>
          <div className="modal-content max-w-2xl bg-[#0f1118] border border-amber-500/40 rounded-3xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#242938] pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-amber-400 font-bold tracking-widest block">
                    PRD MODÜL 1 • MAĞAZA KARTI (DETAY)
                  </span>
                  <h3 className="font-cinzel text-lg font-bold text-white">{selectedBranchDetailModal.name}</h3>
                </div>
              </div>
              <button onClick={() => setSelectedBranchDetailModal(null)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>

            <div className="space-y-4">
              {/* Künye Bilgileri */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#141722] p-3 rounded-xl border border-[#222736]">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Şube Kodu:</span>
                  <strong className="text-white text-sm font-mono">{selectedBranchDetailModal.branch_code || `BR-${selectedBranchDetailModal.id}`}</strong>
                </div>
                <div className="bg-[#141722] p-3 rounded-xl border border-[#222736]">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Bölge:</span>
                  <strong className="text-amber-300 text-sm">{selectedBranchDetailModal.region || 'Marmara'}</strong>
                </div>
                <div className="bg-[#141722] p-3 rounded-xl border border-[#222736]">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Kayıtlı Stok:</span>
                  <strong className="text-white text-sm font-mono">
                    {products.filter(p => p.branch_id === selectedBranchDetailModal.id).length} Parça
                  </strong>
                </div>
                <div className="bg-[#141722] p-3 rounded-xl border border-[#222736]">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Aktif Cihazlar:</span>
                  <strong className="text-emerald-400 text-sm font-mono">
                    {slots.filter(s => s.branch_id === selectedBranchDetailModal.id).length} Tabla/Askı
                  </strong>
                </div>
              </div>

              {/* Adres & İletişim */}
              <div className="bg-[#141722] p-3.5 rounded-xl border border-[#222736] text-xs space-y-1">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-slate-400 font-semibold">📍 Adres:</span>
                  <span>{selectedBranchDetailModal.address}</span>
                </div>
                <div className="flex items-center gap-2 text-amber-300 font-mono">
                  <span className="text-slate-400 font-semibold">📞 İletişim:</span>
                  <span>{selectedBranchDetailModal.phone || 'Telefon Kaydı Yok'}</span>
                </div>
              </div>

              {/* Bu Mağazaya Bağlı Konum Tanımları (Kasa / Tabla / Askı) */}
              <div className="bg-[#141722] p-4 rounded-xl border border-[#222736]">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-white uppercase tracking-wide">
                    Mağazaya Bağlı Fiziksel Konumlar:
                  </span>
                  <button
                    onClick={() => {
                      setSelectedBranchId(selectedBranchDetailModal.id);
                      setShowAddLocationModal(true);
                    }}
                    className="text-[10px] text-amber-400 hover:underline font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Yeni Konum Ekle</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto">
                  {slots.filter(s => s.branch_id === selectedBranchDetailModal.id).map(slot => (
                    <div key={slot.id} className="bg-[#0e1017] p-2 rounded-lg border border-[#202534] text-xs">
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-amber-300 font-bold">{slot.slot_type}: {slot.label}</span>
                        <span className="text-[9px] text-emerald-400">● Aktif</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{slot.group_name}</div>
                    </div>
                  ))}
                  {slots.filter(s => s.branch_id === selectedBranchDetailModal.id).length === 0 && (
                    <div className="col-span-3 text-center py-3 text-slate-500 text-xs">
                      Bu mağazada henüz fiziksel konum tanımlanmamış.
                    </div>
                  )}
                </div>
              </div>

              {/* Yönlendirme ve Aksiyon Butonları */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#242938]">
                <button
                  onClick={() => {
                    const bId = selectedBranchDetailModal.id;
                    setSelectedBranchDetailModal(null);
                    setSelectedBranchFilter(bId.toString());
                    setActiveTab('vitrin');
                  }}
                  className="btn-secondary text-xs py-2 px-3 border-amber-500/40 text-amber-300 flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4" />
                  <span>Mağaza Canlı Vitrinine Git</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedBranchId(selectedBranchDetailModal.id);
                      setSelectedBranchDetailModal(null);
                      setShowAddProductModal(true);
                    }}
                    className="btn-gold text-xs py-2 px-4 font-bold flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Bu Mağazaya Ürün / Stok Ekle</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
