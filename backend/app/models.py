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
    tenant_id = Column(Integer, ForeignKey("tenant_companies.id"), nullable=True, default=1) # Ait olduğu Firma (Tenant)
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
    gold_purchases = relationship("GoldPurchase", back_populates="customer_rel")


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
    tenant_id = Column(Integer, ForeignKey("tenant_companies.id"), default=1)
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
    
    # Şube & Firma İzolasyonu (Tenant)
    branch_id = Column(Integer, ForeignKey("branches.id"), default=1)
    tenant_id = Column(Integer, ForeignKey("tenant_companies.id"), default=1)

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


class IoTDevice(Base):
    """IoT Fiziksel Cihaz - Pico W / ESP32 / ESP8266 vitrin sensör cihazı"""
    __tablename__ = "iot_devices"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(50), unique=True, index=True, nullable=False)  # PICO_VITRIN_01
    device_type = Column(String(30), default="PICO_W")  # PICO_W, ESP32, ESP8266, CUSTOM
    mac_address = Column(String(30), unique=True, index=True, nullable=True)  # Donanım MAC
    firmware_version = Column(String(30), default="2.1.0-Enterprise")

    # Kimlik Bilgileri
    label = Column(String(100), nullable=False, default="Vitrin Cihazı")
    branch_id = Column(Integer, ForeignKey("branches.id"), default=1)
    location_desc = Column(String(200), nullable=True)  # Fiziksel konum

    # Bağlantı
    ip_address = Column(String(50), default="192.168.1.100")
    port = Column(Integer, default=80)
    wifi_ssid = Column(String(50), nullable=True)
    wifi_rssi = Column(Integer, default=-60)

    # Durum
    is_online = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    status = Column(String(30), default="INACTIVE")  # ACTIVE, INACTIVE, MAINTENANCE
    last_ping = Column(DateTime, nullable=True)
    battery_level = Column(Integer, nullable=True)  # Pil seviyesi (0-100)

    # Güvenlik
    auth_token = Column(String(128), nullable=True)  # Cihaz eşleştirme token'ı
    paired_at = Column(DateTime, nullable=True)  # Eşleştirme tarihi
    paired_by = Column(String(100), nullable=True)  # Kim eşleştirdi

    # İstatistik
    total_heartbeats = Column(Integer, default=0)
    total_alarms = Column(Integer, default=0)
    last_alarm_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    branch = relationship("Branch", foreign_keys=[branch_id])
    slots = relationship("RackSlot", back_populates="iot_device_rel", foreign_keys="RackSlot.iot_device_id")


class RackSlot(Base):
    __tablename__ = "rack_slots"

    id = Column(Integer, primary_key=True, index=True)
    slot_number = Column(Integer, unique=True, index=True, nullable=False)
    label = Column(String(100), default="Askı")
    slot_type = Column(String(50), default="Askı") # Askı, Tabla, Tepsi, Kasa Bölmesi
    group_name = Column(String(100), default="Ana Vitrin") # Ana Vitrin, Yüzük Tablası A, Bilezik Standı, Çelik Kasa
    location_code = Column(String(50), nullable=True) # Örn: NTS-TBL02-ASK04
    device_id = Column(String(50), default="DEVICE_01")
    iot_device_id = Column(Integer, ForeignKey("iot_devices.id"), nullable=True)  # Bağlı IoT cihazı
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
    iot_device_rel = relationship("IoTDevice", back_populates="slots", foreign_keys=[iot_device_id])
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

    # Şube & Firma İzolasyonu (Tenant)
    branch_id = Column(Integer, ForeignKey("branches.id"), default=1)
    tenant_id = Column(Integer, ForeignKey("tenant_companies.id"), default=1)

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


class GoldPurchase(Base):
    __tablename__ = "gold_purchases"

    id = Column(Integer, primary_key=True, index=True)
    receipt_no = Column(String(50), unique=True, index=True, nullable=True) # Fiş / Gider Pusula No
    category = Column(String(50), nullable=False, default="Hurda Altın") # Ziynet, 22K Bilezik, Hurda, 24K Has Külçe vb.
    item_description = Column(String(200), nullable=False)
    purity = Column(String(20), nullable=False, default="22K") # 24K, 22K, 18K, 14K vb.
    weight_grams = Column(Float, nullable=False) # Tartılan brüt gramaj
    pure_rate_ratio = Column(Float, default=0.916) # Milyem katsayısı
    pure_gold_grams = Column(Float, nullable=False) # Has altın karşılığı (gr)
    unit_price_per_gram = Column(Float, nullable=False) # Gram başına ödenen alış fiyatı
    total_amount_paid = Column(Float, nullable=False) # Kasadan müşteriye ödenen toplam tutar
    currency = Column(String(10), default="TRY")
    payment_method = Column(String(50), default="Nakit (Kasa Çıkışı)") # Nakit, Banka Havalesi/FAST, Takas Mahsubu
    
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    customer_name = Column(String(100), default="Müşteri")
    customer_tc = Column(String(20), nullable=True) # T.C. Kimlik / Pasaport No
    customer_phone = Column(String(30), nullable=True)
    
    # Satın alan personel
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    buyer_name = Column(String(100), default="Yetkili Personel")
    
    # Şube ve Depo
    branch_id = Column(Integer, ForeignKey("branches.id"), default=1)
    storage_location = Column(String(100), default="Hurda / Çıkma Kasası")
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    customer_rel = relationship("Customer", back_populates="gold_purchases")
    buyer = relationship("User", foreign_keys=[user_id])
    branch = relationship("Branch")


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


class DailyReport(Base):
    __tablename__ = "daily_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_date = Column(String(20), index=True) # YYYY-MM-DD
    branch_id = Column(Integer, nullable=True)
    branch_name = Column(String(100), default="Konsolide Tüm Şirket")
    total_revenue = Column(Float, default=0.0)
    total_gold_grams_sold = Column(Float, default=0.0)
    total_sales_count = Column(Integer, default=0)
    total_cost = Column(Float, default=0.0)
    net_profit = Column(Float, default=0.0)
    closed_by_user_id = Column(Integer, nullable=True)
    closed_by_name = Column(String(100), default="Sistem Yöneticisi")
    sales_summary_json = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# =========================================================================
# MULTI-TENANT SAAS, LİSANS, FİRMA YÖNETİMİ & BULUT MALİYET MODELLERİ
# =========================================================================

class TenantCompany(Base):
    """SaaS Abonesi Müşteri Firma (Kuyumcu Mağazası / Şirketi)"""
    __tablename__ = "tenant_companies"

    id = Column(Integer, primary_key=True, index=True)
    company_code = Column(String(30), unique=True, index=True, nullable=False) # örn: GG-TEN-101
    company_name = Column(String(150), nullable=False) # Altınbaşak Kuyumculuk Ltd.
    owner_name = Column(String(100), nullable=False) # Şirket Sahibi / Yetkili
    contact_phone = Column(String(30), nullable=False)
    contact_email = Column(String(100), nullable=False)
    city = Column(String(50), default="İstanbul")
    tax_id = Column(String(50), nullable=True) # Vergi No / Dairesi
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    license = relationship("TenantLicense", back_populates="tenant", uselist=False, cascade="all, delete-orphan")
    backups = relationship("TenantBackupLog", back_populates="tenant", cascade="all, delete-orphan")
    usage_metrics = relationship("TenantUsageMetric", back_populates="tenant", uselist=False, cascade="all, delete-orphan")


class TenantLicense(Base):
    """Firma Lisanslama, Paket Türü, Faturalandırma & Kullanıcı Sınırlandırma Kotaları"""
    __tablename__ = "tenant_licenses"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenant_companies.id"), unique=True, nullable=False)
    license_key = Column(String(100), unique=True, index=True, nullable=False) # GG-LIC-2026-X94B-K82M
    
    plan_type = Column(String(30), default="YEARLY") # MONTHLY, YEARLY, TRIAL, ENTERPRISE
    billing_cycle = Column(String(20), default="YEARLY") # MONTHLY, YEARLY
    subscription_fee = Column(Float, default=48000.0) # Satış bedeli
    currency = Column(String(10), default="TRY")
    
    status = Column(String(20), default="ACTIVE") # ACTIVE, EXPIRED, SUSPENDED, TRIAL
    start_date = Column(DateTime, default=datetime.datetime.utcnow)
    end_date = Column(DateTime, nullable=False)
    auto_renew = Column(Boolean, default=True)
    
    # KULLANICI & SİSTEM KOTA SINIRLANDIRMALARI (LİMİTLER)
    max_admin_count = Column(Integer, default=2) # Maksimum Admin/Yönetici sayısı
    max_staff_count = Column(Integer, default=5) # Maksimum Personel/Kasiyer sayısı
    max_branches_count = Column(Integer, default=2) # Maksimum Şube sayısı
    max_showcase_slots = Column(Integer, default=100) # Maksimum Vitrin Akıllı Askı sayısı
    storage_limit_mb = Column(Integer, default=5000) # Maksimum depolama kotası (MB)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    tenant = relationship("TenantCompany", back_populates="license")


class TenantBackupLog(Base):
    """Otomatik Gece & İsteğe Bağlı Veritabanı Yedekleme Kayıtları"""
    __tablename__ = "tenant_backup_logs"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenant_companies.id"), nullable=True)
    backup_type = Column(String(30), default="NIGHTLY_AUTOMATIC") # NIGHTLY_AUTOMATIC, ON_DEMAND
    file_name = Column(String(150), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    file_size_mb = Column(Float, default=0.0)
    file_path = Column(String(255), nullable=False)
    checksum = Column(String(64), nullable=True)
    status = Column(String(20), default="COMPLETED") # COMPLETED, FAILED, IN_PROGRESS
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    tenant = relationship("TenantCompany", back_populates="backups")


class TenantUsageMetric(Base):
    """Sistem Yükü, Anlık Online Kullanıcı & Tahmini AWS Bulut Maliyet Hesaplayıcısı"""
    __tablename__ = "tenant_usage_metrics"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenant_companies.id"), unique=True, nullable=False)
    
    active_online_users = Column(Integer, default=1) # Anlık aktif canlı kullanıcı sayısı
    daily_api_requests = Column(Integer, default=0) # Günlük API istek sayısı
    total_db_records = Column(Integer, default=0) # Toplam ürün + satış + log satırı
    storage_used_mb = Column(Float, default=15.0) # Kullanılan disk alanı (MB)
    
    # BULUT SUNUCU MALİYET HESAPLAMALARI (AWS Lightsail/EC2 + EBS + Traffic)
    estimated_server_cost_usd = Column(Float, default=4.50) # Firma başı tahmini aylık bulut maliyeti ($)
    estimated_server_cost_try = Column(Float, default=185.0) # Firma başı tahmini aylık bulut maliyeti (₺)
    net_saas_profit_try = Column(Float, default=3815.0) # Lisans Geliri - Sunucu Maliyeti (Net Kâr ₺)
    profit_margin_percent = Column(Float, default=95.3) # SaaS Brüt Kâr Marjı (%)
    
    last_ping_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    tenant = relationship("TenantCompany", back_populates="usage_metrics")


# =========================================================================
# e-FATURA & e-ARŞİV ENTEGRASYON MODELLERİ
# =========================================================================

class CompanyProfile(Base):
    """Firma Profili - e-Fatura/e-Arşiv için gerekli şirket bilgileri ve logo"""
    __tablename__ = "company_profiles"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenant_companies.id"), nullable=True, default=1)

    # Firma Bilgileri
    company_title = Column(String(200), nullable=False, default="Golden Guard Sarrafiye & Mücevherat A.Ş.")
    tax_office = Column(String(100), nullable=False, default="İstanbul Vergi Dairesi")
    tax_number = Column(String(20), nullable=False, default="4820194821")
    mersis_no = Column(String(50), nullable=True, default="")
    central_registration_no = Column(String(50), nullable=True, default="")
    trade_registry_no = Column(String(50), nullable=True, default="")

    # İletişim
    address = Column(Text, nullable=False, default="Kapalıçarşı Kalpakçılar Cad. No:42, Fatih / İstanbul")
    phone = Column(String(30), nullable=False, default="0212 522 10 20")
    email = Column(String(100), nullable=False, default="erdem@goldenguard.uk")
    website = Column(String(100), nullable=True, default="")

    # Logo (Base64 olarak saklanır)
    logo_base64 = Column(Text, nullable=True)
    logo_mime_type = Column(String(30), nullable=True, default="image/png")

    # e-Fatura/e-Arşiv Entegratör Ayarları
    integrator_type = Column(String(30), default="MANUAL")  # MANUAL, KOLAYSOFT, LOGO, MIKRO, IZIBIZ
    integrator_api_url = Column(String(255), nullable=True)
    integrator_api_key = Column(String(255), nullable=True)
    integrator_api_secret = Column(String(255), nullable=True)
    integrator_username = Column(String(100), nullable=True)
    integrator_password = Column(String(255), nullable=True)

    e_invoice_active = Column(Boolean, default=True)
    e_archive_active = Column(Boolean, default=True)
    sandbox_mode = Column(Boolean, default=True)

    default_payment_term_days = Column(Integer, default=7)
    default_currency = Column(String(10), default="TRY")
    default_language = Column(String(10), default="TR")

    invoice_footer_note = Column(Text, nullable=True, default="Bu belge Golden Guard ERP sistemi tarafından oluşturulmuştur. 3065 sayılı KDV Kanunu Madde 17/4-g gereği külçe altın ve has altın bedeli KDV'den istisnadır. Yalnızca işçilik bedeli üzerinden %20 KDV hesaplanmıştır.")

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class EInvoice(Base):
    """e-Fatura (UBL-TR) Kayıtları - Tüzel/Vergi No'lu alıcılara kesilen faturalar"""
    __tablename__ = "e_invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_uuid = Column(String(50), unique=True, index=True, nullable=False)
    invoice_number = Column(String(50), unique=True, index=True, nullable=False)
    profile_id = Column(String(20), default="EINVOICE")

    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=True)
    sale_invoice_no = Column(String(50), nullable=True)

    # Gönderen (Satıcı)
    supplier_title = Column(String(200), nullable=False)
    supplier_tax_office = Column(String(100), nullable=False)
    supplier_tax_number = Column(String(20), nullable=False)
    supplier_address = Column(Text, nullable=False)

    # Alıcı
    customer_title = Column(String(200), nullable=False)
    customer_tax_office = Column(String(100), nullable=True)
    customer_tax_number = Column(String(20), nullable=True)
    customer_id_number = Column(String(20), nullable=True)
    customer_address = Column(Text, nullable=True)
    customer_email = Column(String(100), nullable=True)

    invoice_date = Column(DateTime, default=datetime.datetime.utcnow)
    payment_term_days = Column(Integer, default=7)
    currency = Column(String(10), default="TRY")
    currency_rate = Column(Float, default=1.0)

    total_gross_amount = Column(Float, default=0.0)
    total_vat_amount = Column(Float, default=0.0)
    total_vat_exempt_amount = Column(Float, default=0.0)
    total_payable_amount = Column(Float, default=0.0)

    status = Column(String(30), default="DRAFT")  # DRAFT, SENT, ACCEPTED, REJECTED, CANCELED
    integrator_status = Column(String(50), nullable=True)
    integrator_response = Column(Text, nullable=True)

    xml_content = Column(Text, nullable=True)
    pdf_path = Column(String(255), nullable=True)
    html_content = Column(Text, nullable=True)

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    sale = relationship("Sale", foreign_keys=[sale_id])


class EArchiveInvoice(Base):
    """e-Arşiv Fatura Kayıtları - Bireysel (TC No'lu) alıcılara kesilen faturalar"""
    __tablename__ = "e_archive_invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, index=True, nullable=False)
    invoice_uuid = Column(String(50), unique=True, index=True, nullable=False)

    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=True)
    sale_invoice_no = Column(String(50), nullable=True)

    supplier_title = Column(String(200), nullable=False)
    supplier_tax_office = Column(String(100), nullable=False)
    supplier_tax_number = Column(String(20), nullable=False)

    customer_name = Column(String(120), nullable=False)
    customer_id_number = Column(String(20), nullable=True)
    customer_email = Column(String(100), nullable=True)
    customer_phone = Column(String(30), nullable=True)

    invoice_date = Column(DateTime, default=datetime.datetime.utcnow)
    currency = Column(String(10), default="TRY")
    delivery_type = Column(String(30), default="EMAIL")  # EMAIL, PRINT, KEP

    total_gross_amount = Column(Float, default=0.0)
    total_vat_amount = Column(Float, default=0.0)
    total_vat_exempt_amount = Column(Float, default=0.0)
    total_payable_amount = Column(Float, default=0.0)

    status = Column(String(30), default="DRAFT")  # DRAFT, SENT, PRINTED, CANCELED
    integrator_status = Column(String(50), nullable=True)

    xml_content = Column(Text, nullable=True)
    pdf_path = Column(String(255), nullable=True)
    html_content = Column(Text, nullable=True)

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    sale = relationship("Sale", foreign_keys=[sale_id])


class InvoiceItem(Base):
    """Fatura Kalemleri - Hem e-Fatura hem e-Arşiv için ortak kalem tablosu"""
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_type = Column(String(20), nullable=False)  # EINVOICE, EARCHIVE
    invoice_id = Column(Integer, nullable=False)

    line_number = Column(Integer, default=1)
    item_name = Column(String(200), nullable=False)
    item_code = Column(String(50), nullable=True)
    unit_type = Column(String(20), default="ADET")  # ADET, GRAM, KG, M2
    quantity = Column(Float, default=1.0)
    unit_price = Column(Float, default=0.0)

    vat_rate = Column(Float, default=20.0)
    vat_amount = Column(Float, default=0.0)
    is_vat_exempt = Column(Boolean, default=False)

    # Altın Detayları
    gold_purity = Column(String(20), nullable=True)
    gold_weight_grams = Column(Float, nullable=True)
    gold_labor_cost = Column(Float, default=0.0)

    line_total = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# =========================================================================
# MÜŞTERİ SEPETİ & HİZMET SİSTEMİ
# =========================================================================

class CustomerCart(Base):
    """Müşteri Sepeti - Satış danışmanı müşteri için ürünleri sepete ekler"""
    __tablename__ = "customer_carts"

    id = Column(Integer, primary_key=True, index=True)
    cart_code = Column(String(30), unique=True, index=True, nullable=False)  # SEP-20260919-XXXX

    # İlişkiler
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    customer_name = Column(String(120), nullable=True)
    customer_phone = Column(String(30), nullable=True)
    customer_email = Column(String(100), nullable=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Satış danışmanı
    user_name = Column(String(100), nullable=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), default=1)
    tenant_id = Column(Integer, ForeignKey("tenant_companies.id"), default=1)

    # Servis Seansı (opsiyonel)
    session_id = Column(Integer, ForeignKey("service_sessions.id"), nullable=True)

    # Sepet Durumu
    status = Column(String(30), default="ACTIVE")  # ACTIVE, CONVERTED, ABANDONED, CLOSED
    service_type = Column(String(30), default="SHOWROOM")  # SHOWROOM, CONSULTATION, REPAIR, RESERVATION

    # Maliyet (Canlı kur ile hesaplanır)
    total_gross_amount = Column(Float, default=0.0)  # Ürün toplamı (KDV hariç)
    total_vat_amount = Column(Float, default=0.0)
    total_vat_exempt_amount = Column(Float, default=0.0)  # Altın KDV istisnası
    total_labor_cost = Column(Float, default=0.0)  # Toplam işçilik
    total_payable_amount = Column(Float, default=0.0)  # Ödenecek toplam
    gold_rate_at_cart = Column(Float, default=0.0)  # Sepet anındaki has altın kuru

    # Müşteri Notu
    notes = Column(Text, nullable=True)
    customer_wish = Column(Text, nullable=True)  # Müşterinin özel isteği

    # Zaman
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)
    duration_minutes = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # İlişkiler
    customer = relationship("Customer", foreign_keys=[customer_id])
    staff = relationship("User", foreign_keys=[user_id])
    branch = relationship("Branch", foreign_keys=[branch_id])
    session = relationship("ServiceSession", foreign_keys=[session_id])
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")
    reminders = relationship("CustomerReminder", back_populates="cart", cascade="all, delete-orphan")


class CartItem(Base):
    """Sepet Kalemi - Sepete eklenen her bir ürün"""
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("customer_carts.id"), nullable=False)

    # Ürün Bilgisi
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)
    product_name = Column(String(150), nullable=False)
    barcode = Column(String(50), nullable=True)
    category = Column(String(50), nullable=True)
    purity = Column(String(20), nullable=True)
    weight_grams = Column(Float, default=0.0)

    # Miktar & Fiyat
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, default=0.0)  # Birim fiyat (canlı kur bazlı)
    labor_cost = Column(Float, default=0.0)  # İşçilik
    vat_rate = Column(Float, default=20.0)
    vat_amount = Column(Float, default=0.0)
    is_vat_exempt = Column(Boolean, default=False)
    discount_amount = Column(Float, default=0.0)
    line_total = Column(Float, default=0.0)

    # Müşteri Etkileşimi
    was_shown_to_customer = Column(Boolean, default=True)  # Müşteriye gösterildi mi?
    customer_reaction = Column(String(50), nullable=True)  # BEGENDI, KARARSIZ, BEGENMEDI, FIYAT_YUKSEK
    inspection_seconds = Column(Integer, default=0)  # Kaç saniye incelendi

    # Durum
    is_sold = Column(Boolean, default=False)  # Satıldı mı?
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=True)  # Hangi satışa ait

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    cart = relationship("CustomerCart", back_populates="items")
    product = relationship("Product", foreign_keys=[product_id])
    variant = relationship("ProductVariant", foreign_keys=[variant_id])
    sale = relationship("Sale", foreign_keys=[sale_id])


class CustomerReminder(Base):
    """Müşteri Hatırlatıcı - Satış danışmanının müşteri için hatırlatma oluşturması"""
    __tablename__ = "customer_reminders"

    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("customer_carts.id"), nullable=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    customer_name = Column(String(120), nullable=True)
    customer_phone = Column(String(30), nullable=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Hatırlatmayı oluşturan
    user_name = Column(String(100), nullable=True)

    # Hatırlatma Detayı
    reminder_type = Column(String(30), default="FOLLOW_UP")  # FOLLOW_UP, PRICE_CHECK, STOCK_ARRIVAL, CALL_BACK
    title = Column(String(200), nullable=False)
    note = Column(Text, nullable=True)

    # Tarih
    reminder_date = Column(DateTime, nullable=False)  # Hatırlatma zamanı
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    notified = Column(Boolean, default=False)  # Bildirim gönderildi mi?

    # İlişkili ürün
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    product_name = Column(String(150), nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    cart = relationship("CustomerCart", back_populates="reminders")
    customer = relationship("Customer", foreign_keys=[customer_id])
    staff = relationship("User", foreign_keys=[user_id])
    product = relationship("Product", foreign_keys=[product_id])


class CustomerDemand(Base):
    """Müşteri Talebi - Mağazada bulunamayan / özel istenen modeller"""
    __tablename__ = "customer_demands"

    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("customer_carts.id"), nullable=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    customer_name = Column(String(120), nullable=True)
    customer_phone = Column(String(30), nullable=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_name = Column(String(100), nullable=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), default=1)

    # Talep Detayı
    requested_model = Column(String(200), nullable=False)  # Örn: 14K Baget Taşlı Kelepçe Bilezik
    category = Column(String(50), default="Bilezik")
    purity = Column(String(20), default="22K")
    weight_grams = Column(Float, nullable=True)
    approx_budget = Column(Float, nullable=True)  # Tahmini bütçe
    is_urgent = Column(Boolean, default=False)  # Acil mi?

    # Durum
    status = Column(String(30), default="PENDING")  # PENDING, FOUND, ORDERED, CANCELLED
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    cart = relationship("CustomerCart", foreign_keys=[cart_id])
    customer = relationship("Customer", foreign_keys=[customer_id])
    staff = relationship("User", foreign_keys=[user_id])
    branch = relationship("Branch", foreign_keys=[branch_id])
