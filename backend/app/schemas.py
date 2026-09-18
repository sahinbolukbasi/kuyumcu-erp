import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# --- User & Auth Schemas ---
class UserLogin(BaseModel):
    username: str
    password: str

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
    branch_name: Optional[str] = None
    is_active: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

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
    quantity: Optional[int] = None # Kaç adet atanacak veya çıkarılacak

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
    discount_amount: Optional[float] = 0.0
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


