import datetime
from typing import Optional, List, Dict, Any, Literal
from decimal import Decimal
from pydantic import BaseModel, Field

# --- User & Auth Schemas ---
class UserLogin(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=256)

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: str = "STAFF" # ADMIN, MANAGER, STAFF
    branch_id: Optional[int] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None # ADMIN, MANAGER, STAFF
    branch_id: Optional[int] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserOut(BaseModel):
    id: int
    username: str
    full_name: str
    role: str
    branch_id: Optional[int] = None
    tenant_id: Optional[int] = None
    branch_name: Optional[str] = None
    is_active: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class TenantModuleSettingsOut(BaseModel):
    tenant_id: int
    modules: Dict[str, bool]
    updated_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True


class TenantModuleSettingsUpdate(BaseModel):
    modules: Dict[str, bool]

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# --- Product Variant Schemas ---
class ProductVariantBase(BaseModel):
    color: str = "Sarı Altın" # Sarı Altın, Beyaz Altın, Rose Altın, Çift Renk
    size_or_length: str = "Standart" # 14 No, 16 No, 45 cm, 18-20 cm
    variant_barcode: Optional[str] = None
    weight_grams: float
    additional_labor: float = 0.0
    stock_quantity: int = 1
    image_url: Optional[str] = None

class ProductVariantCreate(ProductVariantBase):
    pass

class ProductVariantOut(ProductVariantBase):
    id: int
    product_id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Customer Reservation (Kapora & Ayırma) Schemas ---
class CustomerReservationCreate(BaseModel):
    customer_id: int
    product_id: int
    variant_id: Optional[int] = None
    deposit_amount: float = 0.0
    total_agreed_price: float = 0.0
    reserved_until: datetime.datetime
    notes: Optional[str] = None

class CustomerReservationOut(BaseModel):
    id: int
    reservation_code: str
    customer_id: int
    customer_name: Optional[str] = None
    product_id: int
    product_name: Optional[str] = None
    variant_id: Optional[int] = None
    branch_id: int
    deposit_amount: float
    total_agreed_price: float
    reserved_until: datetime.datetime
    notes: Optional[str] = None
    status: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Official Jewelry Certificate Schema ---
class JewelryCertificateOut(BaseModel):
    certificate_no: str
    issue_date: str
    store_name: str
    store_address: Optional[str] = None
    product_name: str
    category: str
    purity: str
    weight_grams: float
    milyem: int
    gold_color: str
    craftsmanship_type: str
    has_stones: bool
    diamond_carat: Optional[float] = None
    diamond_color: Optional[str] = None
    diamond_clarity: Optional[str] = None
    diamond_cut: Optional[str] = None
    stone_shape: Optional[str] = None
    gemstone_type: Optional[str] = None
    qr_code_data: str
    guarantee_terms: str
    approved_by: str

# --- Product Schemas ---
class ProductBase(BaseModel):
    barcode: str
    name: str
    category: str = "Yüzük"
    purity: str = "22K"
    weight_grams: float
    labor_cost: float = 0.0
    cost_price: Optional[float] = 0.0 # Maliyet / Alış Fiyatı
    price: float
    image_url: Optional[str] = None
    description: Optional[str] = None
    status: str = "Vitrinde"
    min_stock_alert: Optional[int] = 2
    branch_id: Optional[int] = 1
    cross_sell_category: Optional[str] = None

    # Altın & Maden Detayları
    gold_color: Optional[str] = "Sarı Altın"
    milyem: Optional[int] = 916
    size_or_length: Optional[str] = None
    stock_quantity: Optional[int] = 1

    # İşçilik & Tasarım Detayları
    craftsmanship_type: Optional[str] = "El İşçiliği"
    surface_finish: Optional[str] = "Parlak"
    workshop_origin: Optional[str] = "Kapalıçarşı Geleneksel Usta Ekolü"
    allow_engraving: Optional[bool] = True

    # Pırlanta & Taş 4C Standartları
    has_stones: Optional[bool] = False
    gemstone_type: Optional[str] = None
    diamond_carat: Optional[float] = None
    diamond_color: Optional[str] = None
    diamond_clarity: Optional[str] = None
    diamond_cut: Optional[str] = None
    stone_shape: Optional[str] = None
    stone_certificate: Optional[str] = None
    certificate_no: Optional[str] = None

    # Medya & Bakım
    additional_images_json: Optional[str] = None
    care_instructions: Optional[str] = "Parfüm ve kimyasallardan uzak tutunuz. Ilık sabunlu su ve yumuşak mikrofiber bezle temizleyiniz. Her yıl mağazamızda ücretsiz cila ve taş tırnak kontrolü yaptırabilirsiniz."

class ProductCreate(ProductBase):
    slot_id: Optional[int] = None
    variants: Optional[List[ProductVariantCreate]] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    purity: Optional[str] = None
    weight_grams: Optional[float] = None
    labor_cost: Optional[float] = None
    cost_price: Optional[float] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    slot_id: Optional[int] = None
    branch_id: Optional[int] = None
    cross_sell_category: Optional[str] = None
    gold_color: Optional[str] = None
    milyem: Optional[int] = None
    size_or_length: Optional[str] = None
    craftsmanship_type: Optional[str] = None
    surface_finish: Optional[str] = None
    has_stones: Optional[bool] = None
    diamond_carat: Optional[float] = None
    diamond_color: Optional[str] = None
    diamond_clarity: Optional[str] = None
    diamond_cut: Optional[str] = None
    stone_shape: Optional[str] = None
    stone_certificate: Optional[str] = None
    certificate_no: Optional[str] = None
    additional_images_json: Optional[str] = None
    care_instructions: Optional[str] = None

class ProductOut(ProductBase):
    id: int
    slot_id: Optional[int] = None
    location_label: Optional[str] = None
    custody_user_id: Optional[int] = None
    custody_started_at: Optional[datetime.datetime] = None
    view_count: int
    total_inspection_seconds: int
    variants: List[ProductVariantOut] = []
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

class InstallmentPlan(BaseModel):
    installment_count: int
    monthly_amount: float
    total_amount: float
    description: str

class ProductDetailPresentationOut(BaseModel):
    product: ProductOut
    has_gold_grams: float
    current_gold_rate: float
    has_gold_value_tl: float
    labor_cost_tl: float
    stone_value_tl: float
    total_price_tl: float
    vat_exempt_amount: float
    calculated_vat: float
    installment_plans: List[InstallmentPlan]
    qr_share_url: str
    cross_sell_recommendations: List[ProductOut] = []

# --- RackSlot & IoT Device Schemas ---
class RackSlotBase(BaseModel):
    slot_number: int
    label: str
    slot_type: str = "Askı" # Askı, Tabla, Tepsi, Kasa Bölmesi
    group_name: str = "Ana Vitrin" # Ana Vitrin, Yüzük Tablası A, Bilezik Standı, Çelik Kasa
    device_id: str
    ip_address: str = "192.168.1.100"
    port: int = 80
    is_online: bool = True
    is_active: bool = True
    expected_weight: float = 0.0
    current_weight: float = 0.0
    tolerance_grams: float = 0.20
    status: str = "EMPTY"
    is_inspection_authorized: bool = False
    branch_id: Optional[int] = 1

class RackSlotOut(RackSlotBase):
    id: int
    product_id: Optional[int] = None
    products: List[ProductOut] = []
    last_ping: Optional[datetime.datetime] = None
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

class SlotAssignRequest(BaseModel):
    product_id: int
    action: str = "ADD" # ADD veya REMOVE
    quantity: Optional[int] = Field(default=None, ge=1, le=100000) # Kaç adet atanacak veya çıkarılacak

class SlotCreateRequest(BaseModel):
    slot_number: int
    label: str
    slot_type: str = "Askı"
    group_name: str = "Ana Vitrin"
    device_id: str
    ip_address: str = "192.168.1.100"
    port: int = 80
    tolerance_grams: float = 0.20

class SlotDeviceConfigUpdate(BaseModel):
    label: Optional[str] = None
    slot_type: Optional[str] = None
    group_name: Optional[str] = None
    device_id: Optional[str] = None
    ip_address: Optional[str] = None
    port: Optional[int] = None
    tolerance_grams: Optional[float] = None
    is_active: Optional[bool] = None
    is_online: Optional[bool] = None

class SetAuthorizedInspectionRequest(BaseModel):
    authorized: bool = True

# --- Akıllı Ağırlık Eşleme & Zimmet Schemas ---
class LiftCandidate(BaseModel):
    product_id: int
    product_name: str
    barcode: str
    purity: str
    weight_grams: float
    price: float
    image_url: Optional[str] = None
    diff_grams: float
    confidence_score: int # 0 - 100
    estimated_quantity: int = 1
    total_calculated_weight: float = 0.0
    stock_available: int = 1
    matched_variants_desc: Optional[str] = None
    variant_ids: List[int] = []
    has_variants: bool = False
    average_grams_per_unit: float = 0.0

class IdentifyLiftResponse(BaseModel):
    slot_number: int
    slot_id: int
    weight_lost: float
    candidates: List[LiftCandidate] = []

class CustodyTakeRequest(BaseModel):
    product_id: int
    slot_id: int
    quantity: Optional[int] = 1 # Kaç adet alınacak (Varsayılan 1)
    user_id: Optional[int] = None
    variant_ids: Optional[List[int]] = None
    actual_grams: Optional[float] = None

class CustodyReturnRequest(BaseModel):
    product_id: int
    user_id: Optional[int] = None

# --- IoT Telemetry Schema ---
class TelemetryPayload(BaseModel):
    device_id: str
    slot_number: int
    weight_grams: float

# --- Security Alert Schemas ---
class SecurityAlertOut(BaseModel):
    id: int
    slot_id: int
    product_id: Optional[int] = None
    alert_type: str
    message: str
    weight_lost: float
    is_resolved: bool
    resolved_by: Optional[str] = None
    created_at: datetime.datetime
    resolved_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

# --- CRM & Customer Schemas ---
class CustomerBase(BaseModel):
    full_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    id_number: Optional[str] = None
    customer_type: str = "Bireysel"
    address: Optional[str] = None
    notes: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    id_number: Optional[str] = None
    customer_type: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

class CustomerOut(CustomerBase):
    id: int
    total_spent: float
    total_items: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Sale Schemas ---
class SaleCreate(BaseModel):
    product_id: int
    customer_id: Optional[int] = None
    customer_name: Optional[str] = "Müşteri"
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    payment_method: Optional[str] = "Kredi Kartı"
    discount_amount: Optional[float] = Field(default=0, ge=0, allow_inf_nan=False)
    gold_rate_at_sale: Optional[float] = 3045.0
    user_id: Optional[int] = None
    sold_by_name: Optional[str] = None
    branch_id: Optional[int] = 1
    # İki Kişi Kuralı (100.000 TL üzeri)
    is_two_man_approved: Optional[bool] = False
    second_approver_id: Optional[int] = None
    second_approver_name: Optional[str] = None
    # MASAK Kimlik Kaydı
    masak_id_number: Optional[str] = None
    masak_occupation: Optional[str] = None
    masak_address: Optional[str] = None

class SaleOut(BaseModel):
    id: int
    invoice_no: Optional[str] = None
    product_id: Optional[int] = None
    product_name: str
    barcode: Optional[str] = None
    category: str
    purity: str
    weight_grams: float
    sale_price: float
    cost_price: Optional[float] = 0.0
    profit_amount: Optional[float] = 0.0
    profit_margin_percent: Optional[float] = 0.0
    gold_rate_at_sale: Optional[float] = 3045.0
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    payment_method: str
    slot_id: Optional[int] = None
    user_id: Optional[int] = None
    sold_by_name: Optional[str] = "Yetkili Personel"
    branch_id: Optional[int] = 1
    is_two_man_approved: bool = False
    second_approver_name: Optional[str] = None
    masak_id_number: Optional[str] = None
    masak_form_printed: bool = False
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# ================= ALTIN SATIN ALMA (HURDA / ZİYNET ALIM) ŞEMALARI =================
class GoldPurchaseCreate(BaseModel):
    category: str = "Hurda Altın" # Ziynet / Çeyrek-Ata, 22K Bilezik, 14K/18K Hurda, 24K Has Külçe vb.
    item_description: str
    purity: str = "22K" # 24K, 22K, 18K, 14K vb.
    weight_grams: float
    pure_rate_ratio: Optional[float] = None
    pure_gold_grams: Optional[float] = None
    unit_price_per_gram: float
    total_amount_paid: Optional[float] = None
    currency: Optional[str] = "TRY"
    payment_method: Optional[str] = "Nakit (Kasa Çıkışı)"
    customer_name: Optional[str] = "Müşteri"
    customer_tc: Optional[str] = None
    customer_phone: Optional[str] = None
    storage_location: Optional[str] = "Hurda / Çıkma Kasası"
    notes: Optional[str] = None
    branch_id: Optional[int] = 1


class GoldPurchaseOut(BaseModel):
    id: int
    receipt_no: Optional[str] = None
    category: str
    item_description: str
    purity: str
    weight_grams: float
    pure_rate_ratio: float
    pure_gold_grams: float
    unit_price_per_gram: float
    total_amount_paid: float
    currency: str
    payment_method: str
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_tc: Optional[str] = None
    customer_phone: Optional[str] = None
    user_id: Optional[int] = None
    buyer_name: Optional[str] = "Yetkili Personel"
    branch_id: Optional[int] = 1
    storage_location: Optional[str] = "Hurda / Çıkma Kasası"
    notes: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class StaffPurchaseSummary(BaseModel):
    user_id: Optional[int] = None
    username: Optional[str] = None
    full_name: str
    role: Optional[str] = "STAFF"
    total_purchases_count: int = 0
    total_weight_grams: float = 0.0
    total_pure_gold_grams: float = 0.0
    total_amount_paid: float = 0.0


class GoldComparisonSummary(BaseModel):
    time_range: str # today, week, month, year, all
    
    # Satılan Altın Verileri
    sales_count: int = 0
    sales_total_weight_grams: float = 0.0
    sales_total_pure_gold_grams: float = 0.0
    sales_total_revenue: float = 0.0
    
    # Satın Alınan Altın Verileri
    purchases_count: int = 0
    purchases_total_weight_grams: float = 0.0
    purchases_total_pure_gold_grams: float = 0.0
    purchases_total_amount_paid: float = 0.0
    
    # Net Denge / Pozisyon
    net_weight_grams_balance: float = 0.0 # Satın Alınan - Satılan (Pozitif ise kasaya net altın girdi, negatif ise dükkandan net altın çıktı)
    net_pure_gold_grams_balance: float = 0.0 # Net Has Altın Değişimi
    net_cash_flow: float = 0.0 # Satış Geliri - Satın Alma Harcaması (Net Kasa Girişi)
    
    # Personel Bazlı Karşılaştırmalı Liste
    staff_breakdown: List[dict] = []

# --- System Audit Log Schemas ---
class SystemLogCreate(BaseModel):
    level: str = "INFO"
    module: str = "SYSTEM"
    message: str
    details_json: Optional[str] = None
    ip_address: Optional[str] = None
    user_id: Optional[int] = None
    user_name: Optional[str] = None

class SystemLogOut(BaseModel):
    id: int
    level: str
    module: str
    message: str
    details_json: Optional[str] = None
    ip_address: Optional[str] = None
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Service Session & Lost Demand Schemas ---
class ServiceSessionStart(BaseModel):
    customer_name: Optional[str] = "Müşteri"
    user_id: Optional[int] = None

class ServiceSessionEnd(BaseModel):
    session_id: Optional[int] = None
    user_id: Optional[int] = None
    customer_name: Optional[str] = None
    duration_minutes: Optional[float] = 0.0
    sale_made: bool = False
    missing_model_notes: Optional[str] = None # Aranan ama bulunamayan model
    notes: Optional[str] = None

class ServiceSessionOut(BaseModel):
    id: int
    user_id: int
    customer_name: str
    started_at: datetime.datetime
    ended_at: Optional[datetime.datetime] = None
    duration_minutes: float
    sale_made: bool
    missing_model_notes: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class LostDemandNoteCreate(BaseModel):
    requested_model: str
    category: str = "Bilezik"
    purity: str = "22K"
    approx_budget: Optional[float] = None
    notes: Optional[str] = None

class LostDemandNoteOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    requested_model: str
    category: str
    purity: str
    approx_budget: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Analytics Schemas ---
class StaffPerformance(BaseModel):
    user_id: Optional[int]
    username: str
    full_name: str
    role: str
    total_sales_count: int
    total_revenue: float
    total_grams_sold: float
    total_customers_served: int = 0
    avg_service_minutes: float = 0.0

class DailySummary(BaseModel):
    total_sales_count: int
    total_sales_revenue: float
    total_gold_grams_sold: float
    total_products_in_showcase: int
    total_products_in_vault: int
    total_inspections_today: int
    active_alerts_count: int
    category_sales_breakdown: dict
    most_viewed_products: List[dict]
    staff_performances: List[StaffPerformance] = []
    # Alınan Altın & Net Denge
    total_gold_purchased_count: Optional[int] = 0
    total_gold_purchased_grams: Optional[float] = 0.0
    total_gold_purchased_pure_grams: Optional[float] = 0.0
    total_gold_purchased_paid: Optional[float] = 0.0
    net_gold_balance_grams: Optional[float] = 0.0
    net_cash_flow: Optional[float] = 0.0


# --- Şube & Stok Transfer Şemaları ---
class BranchOut(BaseModel):
    id: int
    name: str
    branch_code: Optional[str] = "BR-01"
    region: Optional[str] = "Marmara"
    city: str
    address: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class BranchCreate(BaseModel):
    name: str
    branch_code: Optional[str] = "BR-01"
    region: Optional[str] = "Marmara"
    city: Optional[str] = "İstanbul"
    address: Optional[str] = None
    phone: Optional[str] = None

class BranchUpdate(BaseModel):
    name: Optional[str] = None
    branch_code: Optional[str] = None
    region: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None

class BranchOverviewOut(BaseModel):
    branch_id: Optional[int]
    branch_name: str
    total_sales_count: int
    total_sales_amount: float
    total_products_count: int
    total_has_grams: float
    total_capital_tl: float
    staff_count: int
    active_alerts_count: int

class StockTransferRequest(BaseModel):
    product_id: int
    target_branch_id: int
    notes: Optional[str] = None


# --- Ayar & Has Bazlı Sermaye Raporu Şemaları ---
class PurityCapitalDetail(BaseModel):
    purity: str # 14K, 18K, 22K, 24K
    purity_factor: float # 0.585, 0.750, 0.916, 1.000
    piece_count: int
    gross_weight_grams: float
    has_gold_grams: float
    capital_value_tl: float

class CapitalReportOut(BaseModel):
    gold_rate_has: float # Güncel Has Altın Fiyatı (TL/g)
    usd_try_rate: float
    eur_try_rate: float
    total_piece_count: int
    total_gross_grams: float
    total_has_grams: float
    total_capital_tl: float
    total_capital_usd: float
    total_capital_eur: float
    purity_breakdown: List[PurityCapitalDetail]
    showcase_capital_tl: float
    vault_capital_tl: float


# --- Kritik Stok & Tedarikçi Sipariş Önerisi ---
class CriticalStockItem(BaseModel):
    product_id: int
    name: str
    category: str
    purity: str
    barcode: str
    current_stock: int
    min_stock_alert: int
    suggested_order_qty: int
    supplier_note: str

class SupplierOrderDraftOut(BaseModel):
    generated_at: str
    total_items_to_order: int
    suggested_products: List[CriticalStockItem]
    whatsapp_draft_text: str


# --- Durgun Stok Raporu ---
class StagnantStockItem(BaseModel):
    product_id: int
    barcode: str
    name: str
    category: str
    purity: str
    weight_grams: float
    price: float
    days_in_showcase: int
    view_count: int
    total_inspection_seconds: int
    stagnant_score: str # KRİTİK DURGUN, ORTA, NORMAL
    recommendation: str # "Vitrin ön sırasına taşı", "İşçilik indirimi uygula", "Eritme / Hurdaya ayır"


# --- Barkod / RFID Hızlı Sayım ve Mutabakat Şemaları ---
class StockCountItemOut(BaseModel):
    id: int
    barcode: str
    product_name: Optional[str] = None
    category: Optional[str] = None
    weight_grams: float
    expected_slot: Optional[str] = None
    status: str # MATCHED, MISSING, SURPLUS
    scanned_at: datetime.datetime

    class Config:
        from_attributes = True

class StockAuditCreate(BaseModel):
    title: Optional[str] = "Aylık Vitrin Sayımı"
    branch_id: Optional[int] = 1
    notes: Optional[str] = None

class StockAuditScanRequest(BaseModel):
    barcode: str

class StockAuditOut(BaseModel):
    id: int
    title: str
    branch_id: int
    conducted_by_name: str
    status: str
    matched_count: int
    missing_count: int
    surplus_count: int
    created_at: datetime.datetime
    completed_at: Optional[datetime.datetime] = None
    notes: Optional[str] = None
    items: List[StockCountItemOut] = []

    class Config:
        from_attributes = True


# --- Güvenlik Konfigürasyonu, Panik & Biyometrik Log Şemaları ---
class SecurityConfigOut(BaseModel):
    night_mode_active: bool
    night_mode_auto: bool
    two_man_rule_enabled: bool
    two_man_threshold: float
    fake_weight_tolerance_grams: float
    silent_panic_active: bool
    last_panic_triggered_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class SecurityConfigUpdate(BaseModel):
    night_mode_active: Optional[bool] = None
    night_mode_auto: Optional[bool] = None
    two_man_rule_enabled: Optional[bool] = None
    two_man_threshold: Optional[float] = None
    fake_weight_tolerance_grams: Optional[float] = None

class PanicTriggerRequest(BaseModel):
    trigger_source: Optional[str] = "Personel Gizli Ayak Butonu"
    details: Optional[str] = "Gizli sessiz alarm tetiklendi! Güvenlik ve emniyet birimlerine bildirim iletiliyor."

class WeightAnomalyCheckRequest(BaseModel):
    product_id: int
    returned_weight_grams: float

class SecurityEventLogOut(BaseModel):
    id: int
    event_type: str
    severity: str
    title: str
    details: Optional[str] = None
    slot_number: Optional[int] = None
    user_name: Optional[str] = None
    is_resolved: bool
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# --- Çoklu Doğrulama (İki Kişi Kuralı) Şemaları ---
class TwoManApprovalRequest(BaseModel):
    approver_username: str
    approver_password: str
    sale_amount: float
    product_name: str


# --- MASAK & Türkiye Yasal Uyum Şemaları ---
class MasakRecordCreate(BaseModel):
    sale_id: int
    customer_name: str
    id_number: str
    document_type: str = "TCKN"
    birth_year: Optional[int] = None
    nationality: str = "T.C."
    phone: Optional[str] = None
    address: Optional[str] = None
    occupation: Optional[str] = None
    transaction_amount: float
    gold_weight_grams: float

class MasakRecordOut(BaseModel):
    id: int
    sale_id: int
    customer_name: str
    id_number: str
    document_type: str
    birth_year: Optional[int] = None
    nationality: str
    phone: Optional[str] = None
    address: Optional[str] = None
    occupation: Optional[str] = None
    transaction_amount: float
    gold_weight_grams: float
    risk_status: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class OfficialReceiptPusulaOut(BaseModel):
    invoice_no: str
    date_str: str
    customer_name: str
    customer_id_number: Optional[str] = None
    product_name: str
    category: str
    purity: str # Örn: 22 Ayar (916/1000)
    darphane_hallmark: str # "Darphane ve Damga Matbaası Resmi Ayar Standartlarına Uygundur"
    weight_grams: float
    pure_has_gold_grams: float # Has altın karşılığı
    gold_rate: float # Satış anındaki has altın kuru
    gold_base_value: float # Has altın bedeli (KDV'den istisna tutar)
    labor_cost: float # İşçilik bedeli
    labor_kdv_amount: float # İşçilik KDV tutarı (%20)
    total_price: float # Genel toplam
    payment_method: str
    seller_name: str
    masak_required: bool
    masak_declaration: str


# --- Çapraz Satış Önerisi Şeması ---
class CrossSellItemOut(BaseModel):
    product_id: int
    name: str
    category: str
    purity: str
    weight_grams: float
    price: float
    image_url: Optional[str] = None
    relation_reason: str # "Trabzon Hasırı Bilezik ile Kombin Yüzük", "Aynı Takım Set Parçası"


# --- Muhasebe / ERP Dışa Aktarma (Logo & Netsis) Şeması ---
class LogoNetsisExportOut(BaseModel):
    export_format: str # LOGO_XML, NETSIS_JSON, EXCEL_CSV
    generated_at: str
    total_sales_count: int
    total_amount: float
    raw_content: str


# --- PRD Modül 7: Müşteri İlgi, Deneme & Beğeni Şemaları ---
class CustomerInterestCreate(BaseModel):
    customer_id: int
    product_id: int
    action_type: str = "SHOWN"  # SHOWN, LIKED, FAVORITE
    notes: Optional[str] = None

class CustomerInterestOut(BaseModel):
    id: int
    customer_id: int
    customer_name: Optional[str] = None
    product_id: int
    product_name: Optional[str] = None
    category: Optional[str] = None
    purity: Optional[str] = None
    weight_grams: Optional[float] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    action_type: str
    notes: Optional[str] = None
    created_at: datetime.datetime
    class Config:
        from_attributes = True


class DailyReportCreate(BaseModel):
    report_date: Optional[str] = None
    branch_id: Optional[int] = None
    branch_name: Optional[str] = "Konsolide Tüm Şirket"
    total_revenue: float = 0.0
    total_gold_grams_sold: float = 0.0
    total_sales_count: int = 0
    total_cost: float = 0.0
    net_profit: float = 0.0
    sales_summary_json: Optional[str] = None
    notes: Optional[str] = None

class DailyReportOut(BaseModel):
    id: int
    report_date: str
    branch_id: Optional[int] = None
    branch_name: Optional[str] = None
    total_revenue: float
    total_gold_grams_sold: float
    total_sales_count: int
    total_cost: float
    net_profit: float
    closed_by_user_id: Optional[int] = None
    closed_by_name: Optional[str] = None
    sales_summary_json: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# =========================================================================
# MULTI-TENANT SAAS, LİSANS, FİRMA YÖNETİMİ & MALİYET ŞEMALARI
# =========================================================================

class TenantCompanyCreate(BaseModel):
    company_name: str
    owner_name: str
    contact_phone: str
    contact_email: str
    city: Optional[str] = "İstanbul"
    tax_id: Optional[str] = None
    
    # Lisans Paketi
    plan_type: Optional[str] = "YEARLY" # MONTHLY, YEARLY, TRIAL, ENTERPRISE
    billing_cycle: Optional[str] = "YEARLY" # MONTHLY, YEARLY
    subscription_fee: Optional[float] = 48000.0
    currency: Optional[str] = "TRY"
    duration_months: Optional[int] = 12
    
    # Kullanıcı & Sistem Sınırlandırma Kotaları
    max_admin_count: Optional[int] = 2
    max_staff_count: Optional[int] = 5
    max_branches_count: Optional[int] = 2
    max_showcase_slots: Optional[int] = 100
    
    # İlk Müşteri Admin Hesabı (Sistemi Kullanacak İlk Yönetici)
    admin_username: str
    admin_password: str = Field(min_length=12, max_length=256)
    admin_full_name: str


class TenantLicenseOut(BaseModel):
    license_key: str
    plan_type: str
    billing_cycle: str
    subscription_fee: float
    currency: str
    status: str
    start_date: datetime.datetime
    end_date: datetime.datetime
    days_remaining: int
    auto_renew: bool
    
    # Kotalar
    max_admin_count: int
    max_staff_count: int
    max_branches_count: int
    max_showcase_slots: int
    storage_limit_mb: int

    class Config:
        from_attributes = True


class TenantCompanyOut(BaseModel):
    id: int
    company_code: str
    company_name: str
    owner_name: str
    contact_phone: str
    contact_email: str
    city: str
    tax_id: Optional[str] = None
    is_active: bool
    created_at: datetime.datetime
    
    # Lisans Bilgileri
    license: Optional[TenantLicenseOut] = None
    
    # Gerçek Kullanım Sayımları
    current_admin_count: int = 1
    current_staff_count: int = 0
    current_branches_count: int = 1
    current_slots_count: int = 0
    active_online_users: int = 1
    
    # Tahmini Bulut Maliyeti
    estimated_server_cost_usd: float = 4.50
    estimated_server_cost_try: float = 185.0
    net_saas_profit_try: float = 3815.0

    class Config:
        from_attributes = True


class TenantCompanyUpdate(BaseModel):
    company_name: str = Field(min_length=1, max_length=150)
    owner_name: str = Field(min_length=1, max_length=100)
    contact_phone: str = Field(min_length=1, max_length=30)
    contact_email: str = Field(min_length=1, max_length=100)
    city: str = Field(min_length=1, max_length=50)
    tax_id: Optional[str] = Field(default=None, max_length=50)


class TenantLicenseUpdate(BaseModel):
    plan_type: Optional[str] = None
    billing_cycle: Optional[str] = None
    subscription_fee: Optional[float] = Field(default=None, ge=0)
    status: Optional[str] = None # ACTIVE, EXPIRED, SUSPENDED
    extend_months: Optional[int] = Field(default=None, ge=0)
    max_admin_count: Optional[int] = Field(default=None, ge=0)
    max_staff_count: Optional[int] = Field(default=None, ge=0)
    max_branches_count: Optional[int] = Field(default=None, ge=0)
    max_showcase_slots: Optional[int] = Field(default=None, ge=0)


class TenantBackupOut(BaseModel):
    id: int
    tenant_id: Optional[int] = None
    backup_type: str
    file_name: str
    file_size_mb: float
    status: str
    notes: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class SystemCostAnalyticsOut(BaseModel):
    total_companies: int
    active_licenses: int
    expired_licenses: int
    suspended_licenses: int
    total_active_online_users: int
    total_monthly_recurring_revenue_try: float # MRR
    total_annual_recurring_revenue_try: float # ARR
    total_cloud_cost_usd: float
    total_cloud_cost_try: float
    net_saas_profit_try: float
    profit_margin_percent: float
    per_user_cloud_cost_try: float
    last_nightly_backup_status: str
    last_nightly_backup_time: Optional[str] = None


# =========================================================================
# e-FATURA & e-ARŞİV ENTEGRASYON ŞEMALARI
# =========================================================================

class CompanyProfileOut(BaseModel):
    id: int
    tenant_id: Optional[int] = 1
    company_title: str
    tax_office: str
    tax_number: str
    mersis_no: Optional[str] = ""
    central_registration_no: Optional[str] = ""
    trade_registry_no: Optional[str] = ""
    address: str
    phone: str
    email: str
    website: Optional[str] = ""
    logo_base64: Optional[str] = None
    logo_mime_type: Optional[str] = "image/png"
    integrator_type: str
    integrator_api_url: Optional[str] = None
    e_invoice_active: bool
    e_archive_active: bool
    sandbox_mode: bool
    default_payment_term_days: int
    default_currency: str
    default_language: str
    invoice_footer_note: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


class CompanyProfileUpdate(BaseModel):
    company_title: Optional[str] = None
    tax_office: Optional[str] = None
    tax_number: Optional[str] = None
    mersis_no: Optional[str] = None
    central_registration_no: Optional[str] = None
    trade_registry_no: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    integrator_type: Optional[str] = None
    integrator_api_url: Optional[str] = None
    integrator_api_key: Optional[str] = None
    integrator_api_secret: Optional[str] = None
    integrator_username: Optional[str] = None
    integrator_password: Optional[str] = None
    e_invoice_active: Optional[bool] = None
    e_archive_active: Optional[bool] = None
    sandbox_mode: Optional[bool] = None
    default_payment_term_days: Optional[int] = None
    default_currency: Optional[str] = None
    default_language: Optional[str] = None
    invoice_footer_note: Optional[str] = None


class LogoUploadResponse(BaseModel):
    success: bool
    message: str
    logo_base64: Optional[str] = None
    logo_mime_type: Optional[str] = None


class InvoiceDraftInput(BaseModel):
    sale_id: int = Field(gt=0)
    customer_title: Optional[str] = Field(default=None, max_length=200)
    customer_name: Optional[str] = Field(default=None, max_length=200)
    customer_tax_office: Optional[str] = Field(default=None, max_length=100)
    customer_tax_number: Optional[str] = Field(default=None, pattern=r"^([0-9]{10}|[0-9]{11})?$")
    customer_id_number: Optional[str] = Field(default=None, pattern=r"^([0-9]{10}|[0-9]{11})?$")
    customer_address: str = Field(min_length=5, max_length=1500)
    customer_email: Optional[str] = Field(default=None, max_length=100)
    customer_phone: Optional[str] = Field(default=None, max_length=30)
    recipient_registry: Literal['REGISTERED', 'NOT_REGISTERED', 'UNKNOWN'] = 'UNKNOWN'
    tax_treatment: Literal['STANDARD', 'GOLD_SPECIAL', 'BULLION_EXEMPT']
    metal_base: Optional[Decimal] = Field(default=None, ge=0, max_digits=16, decimal_places=2)
    tax_basis_note: str = Field(min_length=5, max_length=1500)
    notes: Optional[str] = Field(default=None, max_length=2000)
    payment_term_days: Optional[int] = Field(default=None, ge=0, le=365)
    delivery_type: Literal['EMAIL', 'PRINT', 'KEP'] = 'PRINT'


class EInvoiceCreate(InvoiceDraftInput):
    pass


class EArchiveInvoiceCreate(InvoiceDraftInput):
    pass


class InvoiceFromSale(InvoiceDraftInput):
    sale_id: int = 1  # URL is authoritative.
    invoice_type: Literal['einvoice', 'earchive']


class InvoiceItemOut(BaseModel):
    id: int
    line_number: int
    item_name: str
    item_code: Optional[str] = None
    unit_type: str
    quantity: float
    unit_price: float
    vat_rate: float
    vat_amount: float
    is_vat_exempt: bool
    gold_purity: Optional[str] = None
    gold_weight_grams: Optional[float] = None
    gold_labor_cost: float
    line_total: float

    class Config:
        from_attributes = True


class EInvoiceOut(BaseModel):
    snapshot_json: Optional[str] = None
    id: int
    invoice_uuid: str
    invoice_number: str
    profile_id: str
    sale_id: Optional[int] = None
    sale_invoice_no: Optional[str] = None
    supplier_title: str
    supplier_tax_office: str
    supplier_tax_number: str
    customer_title: str
    customer_tax_office: Optional[str] = None
    customer_tax_number: Optional[str] = None
    customer_id_number: Optional[str] = None
    customer_email: Optional[str] = None
    invoice_date: datetime.datetime
    currency: str
    total_gross_amount: float
    total_vat_amount: float
    total_vat_exempt_amount: float
    total_payable_amount: float
    status: str
    integrator_status: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class EArchiveInvoiceOut(BaseModel):
    snapshot_json: Optional[str] = None
    id: int
    invoice_number: str
    invoice_uuid: str
    sale_id: Optional[int] = None
    sale_invoice_no: Optional[str] = None
    customer_name: str
    customer_id_number: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    invoice_date: datetime.datetime
    currency: str
    delivery_type: str
    total_gross_amount: float
    total_vat_amount: float
    total_vat_exempt_amount: float
    total_payable_amount: float
    status: str
    integrator_status: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class InvoiceListOut(BaseModel):
    e_invoices: List[EInvoiceOut] = []
    e_archive_invoices: List[EArchiveInvoiceOut] = []


class InvoiceSendEmailRequest(BaseModel):
    recipient_email: str
    message: Optional[str] = None


# =========================================================================
# MÜŞTERİ SEPETİ & HİZMET SİSTEMİ ŞEMALARI
# =========================================================================

class CartItemCreate(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    quantity: int = Field(default=1, ge=1, le=100000)
    discount_amount: float = Field(default=0, ge=0, allow_inf_nan=False)
    customer_reaction: Optional[str] = None  # BEGENDI, KARARSIZ, BEGENMEDI, FIYAT_YUKSEK
    inspection_seconds: Optional[int] = 0


class CartItemUpdate(BaseModel):
    quantity: Optional[int] = Field(default=None, ge=1, le=100000)
    discount_amount: Optional[float] = None
    customer_reaction: Optional[str] = None
    inspection_seconds: Optional[int] = None


class CartItemOut(BaseModel):
    id: int
    cart_id: int
    product_id: Optional[int] = None
    variant_id: Optional[int] = None
    product_name: str
    barcode: Optional[str] = None
    category: Optional[str] = None
    purity: Optional[str] = None
    weight_grams: float
    quantity: int
    unit_price: float
    labor_cost: float
    vat_rate: float
    vat_amount: float
    is_vat_exempt: bool
    discount_amount: float
    line_total: float
    was_shown_to_customer: bool
    customer_reaction: Optional[str] = None
    inspection_seconds: int
    is_sold: bool
    sale_id: Optional[int] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class CartCreate(BaseModel):
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    service_type: str = "SHOWROOM"
    notes: Optional[str] = None
    customer_wish: Optional[str] = None


class CartUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    notes: Optional[str] = None
    customer_wish: Optional[str] = None
    service_type: Optional[str] = None


class CartOut(BaseModel):
    id: int
    cart_code: str
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    user_id: int
    user_name: Optional[str] = None
    branch_id: int
    session_id: Optional[int] = None
    status: str
    service_type: str
    total_gross_amount: float
    total_vat_amount: float
    total_vat_exempt_amount: float
    total_labor_cost: float
    total_payable_amount: float
    gold_rate_at_cart: float
    notes: Optional[str] = None
    customer_wish: Optional[str] = None
    started_at: datetime.datetime
    closed_at: Optional[datetime.datetime] = None
    duration_minutes: float
    items: List[CartItemOut] = []
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class CartConvertToSale(BaseModel):
    """Sepeti satışa dönüştürme"""
    payment_method: str = "Kredi Kartı"
    item_ids: Optional[List[int]] = None  # Boşsa tümü satılsın


class CartConvertToInvoice(BaseModel):
    """Sepetten fatura kesme"""
    invoice_type: str = "auto"  # auto, einvoice, earchive
    customer_tax_number: Optional[str] = None
    customer_email: Optional[str] = None


# --- Hatırlatıcı Şemaları ---
class ReminderCreate(BaseModel):
    cart_id: Optional[int] = None
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    reminder_type: str = "FOLLOW_UP"
    title: str
    note: Optional[str] = None
    reminder_date: datetime.datetime
    product_id: Optional[int] = None
    product_name: Optional[str] = None


class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    note: Optional[str] = None
    reminder_date: Optional[datetime.datetime] = None
    is_completed: Optional[bool] = None


class ReminderOut(BaseModel):
    id: int
    cart_id: Optional[int] = None
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    user_id: int
    user_name: Optional[str] = None
    reminder_type: str
    title: str
    note: Optional[str] = None
    reminder_date: datetime.datetime
    is_completed: bool
    completed_at: Optional[datetime.datetime] = None
    notified: bool
    product_id: Optional[int] = None
    product_name: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# --- Talep Şemaları ---
class DemandCreate(BaseModel):
    cart_id: Optional[int] = None
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    requested_model: str
    category: str = "Bilezik"
    purity: str = "22K"
    weight_grams: Optional[float] = None
    approx_budget: Optional[float] = None
    is_urgent: bool = False
    notes: Optional[str] = None


class DemandOut(BaseModel):
    id: int
    cart_id: Optional[int] = None
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    branch_id: int
    requested_model: str
    category: str
    purity: str
    weight_grams: Optional[float] = None
    approx_budget: Optional[float] = None
    is_urgent: bool
    status: str
    notes: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# --- Sepet Analitik Şemaları ---
class CartMetricsOut(BaseModel):
    total_active_carts: int
    total_carts_today: int
    total_carts_this_week: int
    total_carts_this_month: int
    conversion_rate: float  # Sepetten satışa dönüşüm %
    average_cart_value: float  # Ortalama sepet tutarı
    average_service_minutes: float  # Ortalama servis süresi
    total_abandoned_carts: int  # Sepet terk
    total_revenue_from_carts: float  # Sepetten gelen ciro
    most_added_products: List[dict] = []  # En çok sepete eklenen ürünler
    staff_cart_performance: List[dict] = []  # Personel bazlı sepet performansı
    top_demanded_models: List[dict] = []  # En çok talep edilen modeller
    active_reminders_today: int  # Bugün yapılacak hatırlatmalar
    missed_opportunities: List[dict] = []  # Sepete eklendi ama satılmadı


class CustomerInterestReport(BaseModel):
    """Müşteri ilgi haritası - Admin Dashboard için"""
    total_customers_served: int
    total_products_shown: int
    total_inspection_minutes: float
    liked_products: List[dict] = []  # Beğenilen ürünler
    price_sensitive_products: List[dict] = []  # Fiyattan çekinilen
    undecided_products: List[dict] = []  # Kararsız kalınan
    top_categories_by_interest: List[dict] = []  # Kategori bazlı ilgi


# =========================================================================
# IoT CİHAZ YÖNETİMİ & ÜRÜN ATAMA ŞEMALARI
# =========================================================================

class IoTDeviceCreate(BaseModel):
    device_id: str
    device_type: str = "PICO_W"
    mac_address: Optional[str] = None
    firmware_version: Optional[str] = "2.1.0-Enterprise"
    label: str
    branch_id: int = 1
    location_desc: Optional[str] = None
    ip_address: Optional[str] = "192.168.1.100"
    port: int = 80
    wifi_ssid: Optional[str] = None


class IoTDeviceUpdate(BaseModel):
    label: Optional[str] = None
    branch_id: Optional[int] = None
    location_desc: Optional[str] = None
    ip_address: Optional[str] = None
    port: Optional[int] = None
    is_active: Optional[bool] = None
    status: Optional[str] = None  # ACTIVE, INACTIVE, MAINTENANCE


class IoTDeviceOut(BaseModel):
    id: int
    device_id: str
    device_type: str
    mac_address: Optional[str] = None
    firmware_version: Optional[str] = None
    label: str
    branch_id: int
    branch_name: Optional[str] = None
    location_desc: Optional[str] = None
    ip_address: str
    port: int
    wifi_ssid: Optional[str] = None
    wifi_rssi: int
    is_online: bool
    is_active: bool
    status: str
    last_ping: Optional[datetime.datetime] = None
    battery_level: Optional[int] = None
    paired_at: Optional[datetime.datetime] = None
    paired_by: Optional[str] = None
    total_heartbeats: int
    total_alarms: int
    last_alarm_at: Optional[datetime.datetime] = None
    slot_count: int = 0  # Bağlı slot/askı sayısı
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class IoTDevicePairResponse(BaseModel):
    success: bool
    message: str
    device_id: str
    auth_token: str
    paired_at: str


class IoTDeviceAssignProduct(BaseModel):
    product_id: int
    slot_id: int  # Hangi slota atanacak
    quantity: int = Field(default=1, ge=1, le=100000)


class IoTDeviceTelemetry(BaseModel):
    device_id: str
    slot_number: int
    weight_grams: float
    battery_level: Optional[int] = None
    wifi_rssi: Optional[int] = None


class IoTDeviceStatsOut(BaseModel):
    total_devices: int
    online_devices: int
    offline_devices: int
    active_alerts: int
    total_products_assigned: int
    devices_by_type: List[dict] = []
    devices_by_branch: List[dict] = []
    recent_telemetry: List[dict] = []
