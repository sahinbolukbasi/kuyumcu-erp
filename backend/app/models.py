import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(128), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), default="STAFF") # ADMIN, MANAGER, STAFF
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True) # Atandığı Mağaza/Şube
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    branch = relationship("Branch", back_populates="users", foreign_keys=[branch_id])
    sales = relationship("Sale", back_populates="seller", foreign_keys="Sale.user_id")
    logs = relationship("SystemLog", back_populates="user")
    sessions = relationship("ServiceSession", back_populates="staff")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False, index=True)
    phone = Column(String(30), nullable=True, index=True)
    email = Column(String(100), nullable=True, index=True)
    id_number = Column(String(20), nullable=True) # TC No / Vergi No
    customer_type = Column(String(30), default="Bireysel") # Bireysel, VIP, Toptan
    address = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    total_spent = Column(Float, default=0.0)
    total_items = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    sales = relationship("Sale", back_populates="customer_rel")
    reservations = relationship("CustomerReservation", back_populates="customer")
    interests = relationship("CustomerInterest", back_populates="customer")


class Branch(Base):
    __tablename__ = "branches"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False) # Kapalıçarşı Merkez, Nişantaşı Şube, vb.
    branch_code = Column(String(30), default="BR-01", index=True) # Şube Kodu
    region = Column(String(50), default="Marmara") # Bölge
    city = Column(String(50), default="İstanbul")
    address = Column(String(200), nullable=True)
    phone = Column(String(30), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    users = relationship("User", back_populates="branch", foreign_keys="User.branch_id")
    products = relationship("Product", back_populates="branch")
    sales = relationship("Sale", back_populates="branch")
    slots = relationship("RackSlot", back_populates="branch")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    barcode = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    category = Column(String(50), default="Yüzük") # Yüzük, Kolye, Bilezik, Küpe, Ziynet, Külçe, Set
    purity = Column(String(20), default="22K") # 14K, 18K, 22K, 24K (Has)
    weight_grams = Column(Float, nullable=False)
    labor_cost = Column(Float, default=0.0)
    cost_price = Column(Float, default=0.0) # Alış / Atölye Maliyeti (Kâr hesabı için)
    price = Column(Float, nullable=False)
    image_url = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String(30), default="Vitrinde") # Vitrinde, Zimmette, Kasada, Satıldı
    min_stock_alert = Column(Integer, default=2) # Kritik stok eşiği
    cross_sell_category = Column(String(50), nullable=True) # Örn: Bilezik satılırken önerilecek Küpe/Yüzük
    
    # Altın & Maden Detayları
    gold_color = Column(String(30), default="Sarı Altın") # Sarı Altın, Beyaz Altın, Rose Altın, Çift Renk
    milyem = Column(Integer, default=916) # 585, 750, 916, 995, 999.9
    size_or_length = Column(String(30), nullable=True) # 14 Numara, 45 cm, 18-20 cm vb.
    stock_quantity = Column(Integer, default=1)
    
    # İşçilik & Tasarım
    craftsmanship_type = Column(String(50), default="El İşçiliği") # El İşçiliği, Trabzon Hasırı, Telkari, Lazer Kesim, Döküm, Mikromıhlama
    surface_finish = Column(String(50), default="Parlak") # Parlak, Kum Saten, Mat, Oksitli
    workshop_origin = Column(String(100), default="Kapalıçarşı Geleneksel Usta Ekolü") # Atölye / Menşei
    allow_engraving = Column(Boolean, default=True) # Gravür / İsim Yazma Uygunluğu

    # Değerli Taş / Pırlanta 4C Standartları
    has_stones = Column(Boolean, default=False)
    gemstone_type = Column(String(50), nullable=True) # Pırlanta, Safir, Zümrüt, Yakut, Yarı Değerli
    diamond_carat = Column(Float, nullable=True) # Karat (örn: 0.50 ct)
    diamond_color = Column(String(10), nullable=True) # D, E, F, G, H, I, J
    diamond_clarity = Column(String(10), nullable=True) # FL, IF, VVS1, VVS2, VS1, VS2, SI1, SI2
    diamond_cut = Column(String(20), nullable=True) # Excellent, Very Good, Good, Fair
    stone_shape = Column(String(30), nullable=True) # Yuvarlak (Brillant), Baget, Prenses, Zümrüt, Damla, Oval
    stone_certificate = Column(String(50), nullable=True) # GIA, HRD, IGI, Golden Guard Garanti Belgesi
    certificate_no = Column(String(50), nullable=True) # Sertifika No (örn: GIA-21940182)

    # Medya & Bakım
    additional_images_json = Column(Text, nullable=True) # Ek görseller JSON dizisi
    care_instructions = Column(Text, default="Parfüm ve kimyasallardan uzak tutunuz. Ilık sabunlu su ve yumuşak mikrofiber bezle temizleyiniz. Her yıl mağazamızda ücretsiz cila ve taş tırnak kontrolü yaptırabilirsiniz.")
    
    # Şube
    branch_id = Column(Integer, ForeignKey("branches.id"), default=1)

    # Hangi askıda/tablada asılı? (Bir askıda birden fazla ürün olabilir)
    slot_id = Column(Integer, ForeignKey("rack_slots.id"), nullable=True)
    
    # Kimin zimmetinde / masasında denetiliyor?
    custody_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    custody_started_at = Column(DateTime, nullable=True)

    view_count = Column(Integer, default=0)
    total_inspection_seconds = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    branch = relationship("Branch", back_populates="products")
    slot = relationship("RackSlot", back_populates="products")
    sales = relationship("Sale", back_populates="product")
    inspections = relationship("InspectionLog", back_populates="product")
    custody_user = relationship("User", foreign_keys=[custody_user_id])
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    color = Column(String(50), default="Sarı Altın") # Sarı Altın, Beyaz Altın, Rose Altın, Çift Renk
    size_or_length = Column(String(50), default="Standart") # 14 No, 16 No, 45 cm, 18-20 cm vb.
    variant_barcode = Column(String(60), unique=True, index=True, nullable=True)
    weight_grams = Column(Float, nullable=False)
    additional_labor = Column(Float, default=0.0) # Ek işçilik bedeli
    stock_quantity = Column(Integer, default=1)
    image_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    product = relationship("Product", back_populates="variants")
    reservations = relationship("CustomerReservation", back_populates="variant")


class CustomerReservation(Base):
    __tablename__ = "customer_reservations"

    id = Column(Integer, primary_key=True, index=True)
    reservation_code = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), default=1)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    deposit_amount = Column(Float, default=0.0)
    total_agreed_price = Column(Float, default=0.0)
    reserved_until = Column(DateTime, nullable=False)
    notes = Column(Text, nullable=True)
    status = Column(String(30), default="ACTIVE") # ACTIVE, COMPLETED, CANCELLED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    customer = relationship("Customer", back_populates="reservations")
    product = relationship("Product")
    variant = relationship("ProductVariant", back_populates="reservations")
    branch = relationship("Branch")
    staff = relationship("User")


class RackSlot(Base):
    __tablename__ = "rack_slots"

    id = Column(Integer, primary_key=True, index=True)
    slot_number = Column(Integer, unique=True, index=True, nullable=False)
    label = Column(String(100), default="Askı")
    slot_type = Column(String(50), default="Askı") # Askı, Tabla, Tepsi, Kasa Bölmesi
    group_name = Column(String(100), default="Ana Vitrin") # Ana Vitrin, Yüzük Tablası A, Bilezik Standı, Çelik Kasa
    location_code = Column(String(50), nullable=True) # Örn: NTS-TBL02-ASK04
    device_id = Column(String(50), default="DEVICE_01")
    ip_address = Column(String(50), default="192.168.1.100")
    port = Column(Integer, default=80)
    is_online = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True) # Cihaz aktif / devre dışı
    last_ping = Column(DateTime, nullable=True)
    expected_weight = Column(Float, default=0.0)
    current_weight = Column(Float, default=0.0)
    tolerance_grams = Column(Float, default=0.20)
    status = Column(String(30), default="EMPTY") # EMPTY, NORMAL, INSPECTION, ALERT
    is_inspection_authorized = Column(Boolean, default=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), default=1)
    last_lifted_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    branch = relationship("Branch", back_populates="slots")
    # Bir askıda birden fazla ürün ilişkisi
    products = relationship("Product", back_populates="slot")
    alerts = relationship("SecurityAlert", back_populates="slot")


class SecurityAlert(Base):
    __tablename__ = "security_alerts"

    id = Column(Integer, primary_key=True, index=True)
    slot_id = Column(Integer, ForeignKey("rack_slots.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    alert_type = Column(String(50), default="UNAUTHORIZED_LIFT")
    message = Column(String(255), nullable=False)
    weight_lost = Column(Float, default=0.0)
    is_resolved = Column(Boolean, default=False)
    resolved_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    slot = relationship("RackSlot", back_populates="alerts")


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    invoice_no = Column(String(50), unique=True, index=True, nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    product_name = Column(String(150), nullable=False)
    barcode = Column(String(50), nullable=True)
    category = Column(String(50), nullable=False)
    purity = Column(String(20), nullable=False)
    weight_grams = Column(Float, nullable=False)
    sale_price = Column(Float, nullable=False)
    gold_rate_at_sale = Column(Float, default=3045.0)
    
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    customer_name = Column(String(100), default="Müşteri")
    customer_phone = Column(String(30), nullable=True)
    customer_email = Column(String(100), nullable=True)
    
    payment_method = Column(String(50), default="Kredi Kartı")
    slot_id = Column(Integer, nullable=True)
    
    # Maliyet & Kâr Marjı
    cost_price = Column(Float, default=0.0)
    profit_amount = Column(Float, default=0.0)
    profit_margin_percent = Column(Float, default=0.0)

    # Şube
    branch_id = Column(Integer, ForeignKey("branches.id"), default=1)

    # İki Kişi Kuralı (Yüksek Tutar Çoklu Doğrulama)
    is_two_man_approved = Column(Boolean, default=False)
    second_approver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    second_approver_name = Column(String(100), nullable=True)

    # MASAK Kayıt Durumu
    masak_id_number = Column(String(50), nullable=True)
    masak_form_printed = Column(Boolean, default=False)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    sold_by_name = Column(String(100), default="Yetkili Personel")
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    branch = relationship("Branch", back_populates="sales")
    product = relationship("Product", back_populates="sales")
    seller = relationship("User", foreign_keys=[user_id], back_populates="sales")
    second_approver = relationship("User", foreign_keys=[second_approver_id])
    customer_rel = relationship("Customer", back_populates="sales")
    masak_record = relationship("MasakRecord", back_populates="sale", uselist=False)


class InspectionLog(Base):
    __tablename__ = "inspection_logs"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    slot_id = Column(Integer, nullable=False)
    lifted_at = Column(DateTime, default=datetime.datetime.utcnow)
    returned_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0)
    was_authorized = Column(Boolean, default=True)

    product = relationship("Product", back_populates="inspections")


class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    level = Column(String(20), default="INFO")
    module = Column(String(30), default="SYSTEM")
    message = Column(String(255), nullable=False)
    details_json = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_name = Column(String(100), nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    user = relationship("User", back_populates="logs")


class ServiceSession(Base):
    """Personelin bir müşteriyle ilgilendiği hizmet seansı ve süre takibi"""
    __tablename__ = "service_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    customer_name = Column(String(100), default="Müşteri")
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    duration_minutes = Column(Float, default=0.0)
    sale_made = Column(Boolean, default=False)
    missing_model_notes = Column(Text, nullable=True) # Müşterinin arayıp vitrinde bulamadığı model
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    staff = relationship("User", back_populates="sessions")


class LostDemandNote(Base):
    """Müşterinin sorup mağazada bulunamayan altın modelleri (Karar Destek)"""
    __tablename__ = "lost_demand_notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_name = Column(String(100), nullable=True)
    requested_model = Column(String(150), nullable=False) # Örn: 14K Baget Taşlı Kelepçe Bilezik
    category = Column(String(50), default="Bilezik")
    purity = Column(String(20), default="14K")
    approx_budget = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class StockCountAudit(Base):
    """Barkod / RFID ile Hızlı Sayım ve Sistem Mutabakatı"""
    __tablename__ = "stock_count_audits"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), default="Aylık Vitrin & Kasa Sayımı")
    branch_id = Column(Integer, ForeignKey("branches.id"), default=1)
    conducted_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    conducted_by_name = Column(String(100), default="Yetkili Personel")
    status = Column(String(30), default="IN_PROGRESS") # IN_PROGRESS, COMPLETED
    matched_count = Column(Integer, default=0) # Rafta olan ve eşleşen
    missing_count = Column(Integer, default=0) # Sistemde var ama rafta okutulmayan
    surplus_count = Column(Integer, default=0) # Sistemde bu şubede/rafta yok ama okutulan
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    items = relationship("StockCountItem", back_populates="audit", cascade="all, delete-orphan")


class StockCountItem(Base):
    """Sayım sırasında okutulan tekil ürün kaydı"""
    __tablename__ = "stock_count_items"

    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(Integer, ForeignKey("stock_count_audits.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    barcode = Column(String(50), nullable=False)
    product_name = Column(String(150), nullable=True)
    category = Column(String(50), nullable=True)
    weight_grams = Column(Float, default=0.0)
    expected_slot = Column(String(50), nullable=True)
    status = Column(String(30), default="MATCHED") # MATCHED, MISSING, SURPLUS
    scanned_at = Column(DateTime, default=datetime.datetime.utcnow)

    audit = relationship("StockCountAudit", back_populates="items")


class MasakRecord(Base):
    """Türkiye MASAK Mevzuatı: 85.000 TL Üzeri Altın Alım-Satım Kimlik Kaydı"""
    __tablename__ = "masak_records"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False, unique=True)
    customer_name = Column(String(120), nullable=False)
    id_number = Column(String(30), nullable=False) # TCKN veya Pasaport No
    document_type = Column(String(20), default="TCKN") # TCKN, PASAPORT
    birth_year = Column(Integer, nullable=True)
    nationality = Column(String(50), default="T.C.")
    phone = Column(String(30), nullable=True)
    address = Column(String(250), nullable=True)
    occupation = Column(String(100), nullable=True) # Meslek bilgisi
    transaction_amount = Column(Float, nullable=False) # TL
    gold_weight_grams = Column(Float, nullable=False) # Gram
    risk_status = Column(String(30), default="UYGUN") # UYGUN, BILDIRIM_GEREKLI
    approved_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    sale = relationship("Sale", back_populates="masak_record")


class SecuritySystemConfig(Base):
    """İleri Güvenlik Ayarları (Gece Modu, İki Kişi Eşiği, Sahte Altın Toleransı)"""
    __tablename__ = "security_system_config"

    id = Column(Integer, primary_key=True, index=True)
    night_mode_active = Column(Boolean, default=False) # Gece/Mağaza Kapalı Modu
    night_mode_auto = Column(Boolean, default=True) # Saat 20:00 - 08:30 arası otomatik devreye girme
    two_man_rule_enabled = Column(Boolean, default=True) # Çift personel onay kuralı
    two_man_threshold = Column(Float, default=100000.0) # Onay gerektiren tutar eşiği (TL)
    fake_weight_tolerance_grams = Column(Float, default=0.25) # İkame/sahte altın sapma toleransı
    silent_panic_active = Column(Boolean, default=False) # Sessiz panik alarmı tetiklendi mi
    last_panic_triggered_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class SecurityEventLog(Base):
    """Güvenlik Olayları, Biyometrik Kilit & Panik Günlüğü"""
    __tablename__ = "security_event_logs"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(50), nullable=False) # NIGHT_BURGLARY, PANIC_ALARM, WEIGHT_ANOMALY, BIOMETRIC_ACCESS, PIR_MOTION
    severity = Column(String(20), default="CRITICAL") # CRITICAL, WARNING, INFO
    title = Column(String(150), nullable=False)
    details = Column(Text, nullable=True)
    slot_number = Column(Integer, nullable=True)
    user_name = Column(String(100), nullable=True)
    is_resolved = Column(Boolean, default=False)
    resolved_by = Column(String(100), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class CustomerInterest(Base):
    """PRD Modül 7: Müşteri Ürün İlgi, Deneme ve Beğeni Takibi"""
    __tablename__ = "customer_interests"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), default=1)
    action_type = Column(String(30), default="SHOWN")  # SHOWN, LIKED, FAVORITE
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    customer = relationship("Customer", back_populates="interests")
    product = relationship("Product")
    user = relationship("User")
    branch = relationship("Branch")

