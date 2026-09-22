# 💎 Golden Guard — Kuyumculuk ERP & IoT Akıllı Vitrin Sistemi
## Kapsamlı Sistem Tanıtım Dökümanı

> **Golden Guard**, kuyumcu ve sarraf işletmeleri için geliştirilmiş, uçtan uca entegre bir **ERP (Kurumsal Kaynak Planlama)** ve **IoT (Nesnelerin İnterneti) Akıllı Vitrin Güvenlik** sistemidir. Geleneksel kuyumculuk operasyonlarını dijitalleştirir, vitrin güvenliğini gerçek zamanlı sensörlerle korur ve işletme sahibine her an her yerden tam kontrol imkânı sunar.

---

## 📋 İçindekiler

1. [Sistem Mimarisi & Teknolojik Altyapı](#1-sistem-mimarisi--teknolojik-altyapı)
2. [Çözüm Sunulan Temel Alanlar](#2-çözüm-sunulan-temel-alanlar)
3. [Modül Detayları](#3-modül-detayları)
   - [3.1. IoT Akıllı Vitrin & Güvenlik Sistemi](#31-iot-akıllı-vitrin--güvenlik-sistemi)
   - [3.2. Çoklu Şube & RBAC Yetki Yönetimi](#32-çoklu-şube--rbac-yetki-yönetimi)
   - [3.3. Ürün & Envanter Yönetimi](#33-ürün--envanter-yönetimi)
   - [3.4. Satış & Kasa İşlemleri](#34-satış--kasa-işlemleri)
   - [3.5. Has Altın Sermaye Takibi](#35-has-altın-sermaye-takibi)
   - [3.6. Canlı Altın & Döviz Kurları](#36-canlı-altın--döviz-kurları)
   - [3.7. Müşteri CRM & Sadakat](#37-müşteri-crm--sadakat)
   - [3.8. Altın Satın Alma & Hurda Kasa](#38-altın-satın-alma--hurda-kasa)
   - [3.9. Finansal Raporlama & Gün Sonu](#39-finansal-raporlama--gün-sonu)
   - [3.10. MASAK Uyumluluğu & Yasal Mevzuat](#310-masak-uyumluluğu--yasal-mevzuat)
   - [3.11. Sistem Denetim Günlüğü (Audit Trail)](#311-sistem-denetim-günlüğü-audit-trail)
   - [3.12. SaaS & Çoklu Firma (Multi-Tenant) Yönetimi](#312-saas--çoklu-firma-multi-tenant-yönetimi)
   - [3.13. Özel Ekran Terminalleri](#313-özel-ekran-terminalleri)
4. [Donanım Entegrasyonu](#4-donanım-entegrasyonu)
5. [Kullanıcı Rolleri & Yetki Matrisi](#5-kullanıcı-rolleri--yetki-matrisi)
6. [Canlı Sistem Bilgileri](#6-canlı-sistem-bilgileri)

---

## 1. Sistem Mimarisi & Teknolojik Altyapı

```
┌─────────────────────────────────────────────────────────────┐
│                    KULLANICI KATMANI                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Web ERP     │  │  Terminal    │  │  TV / Vitrin     │   │
│  │  (Next.js)   │  │  Ekranları   │  │  Canlı Pano      │   │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘   │
├─────────┼──────────────────┼───────────────────┼─────────────┤
│         └──────────────────┼───────────────────┘             │
│                    ┌───────┴────────┐                        │
│                    │   WebSocket    │                        │
│                    │  (Canlı İletişim)                       │
│                    └───────┬────────┘                        │
│                            │                                 │
│                    ┌───────┴────────┐                        │
│                    │   FastAPI      │                        │
│                    │   Backend      │                        │
│                    │   (Python)     │                        │
│                    └───────┬────────┘                        │
│                            │                                 │
│                    ┌───────┴────────┐                        │
│                    │   SQLite DB    │                        │
│                    │  (PostgreSQL   │                        │
│                    │   Hazır)       │                        │
│                    └────────────────┘                        │
├─────────────────────────────────────────────────────────────┤
│                    DONANIM KATMANI                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Raspberry Pi │  │  ESP32 /     │  │  HX711 Load Cell │   │
│  │ Pico W       │  │  ESP8266     │  │  Hassas Terazi   │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 🏗️ Teknoloji Yığını

| Katman | Teknoloji | Açıklama |
|--------|-----------|----------|
| **Frontend** | Next.js (React) | Modern, lüks tasarımlı web arayüzü |
| **Backend** | Python FastAPI | Yüksek performanslı, asenkron REST API |
| **Veritabanı** | SQLite (→PostgreSQL) | Şu an SQLite, ölçeklenme için PostgreSQL hazır |
| **Gerçek Zamanlı** | WebSocket | IoT sensör verileri ve anlık bildirimler |
| **Kimlik Doğrulama** | JWT (JSON Web Token) | Güvenli token bazlı oturum yönetimi |
| **Konumlandırma** | Docker | Tek komutla AWS/any cloud dağıtımı |
| **IoT Donanım** | Raspberry Pi Pico W / ESP32 | HX711 Load Cell + Wi-Fi mikrodenetleyici |
| **Canlı Kur Servisi** | Truncgil Finans + TCMB | Çok katmanlı güvenilir piyasa verisi |

### 🚀 Dağıtım Altyapısı
- **AWS Frankfurt** (`63.181.78.45`) üzerinde Docker container ile çalışır
- **Docker Compose** ile backend + frontend tek komutla ayağa kalkar
- **Nginx** ters proxy ile güvenlik katmanı
- Minimum **1 GB RAM, 1 vCPU** ile çalışabilir (t4g.micro uyumlu)

---

## 2. Çözüm Sunulan Temel Alanlar

| # | Alan | Sorun | Çözüm |
|---|------|-------|-------|
| 1 | **Vitrin Güvenliği** | Kuyumcu vitrinindeki ürünlerin çalınması, yetkisiz kaldırılması | IoT sensörlerle gerçek zamanlı ağırlık takibi, anlık alarm |
| 2 | **Envanter Yönetimi** | Ürünlerin nerede olduğunu bilmeme (vitrin/kasa/zimmet) | Dijital ürün kartı, slot bazlı konum takibi |
| 3 | **Sermaye Takibi** | Has altın sermayesinin ayar bazında takip edilememesi | Otomatik has gramajı hesaplama, anlık sermaye değeri |
| 4 | **Personel Yönetimi** | Personelin ne sattığı, hangi müşteriyle ilgilendiği bilinmemesi | RBAC roller, satış karnesi, müşteri seans takibi |
| 5 | **Çoklu Şube** | Şubeler arası konsolide veri alamama | Tümü/Tekil mağaza seçimi, şube bazlı raporlama |
| 6 | **Müşteri CRM** | Müşteri bilgilerinin dağınık olması, sadakat yönetimi | CRM modülü, satın alma geçmişi, sertifika e-postası |
| 7 | **Fiyat Hesaplama** | Anlık altın kuru olmadan doğru fiyat verememe | Canlı piyasa entegrasyonu, otomatik fiyat hesaplama |
| 8 | **Yasal Uyumluluk** | MASAK bildirim yükümlülüğü, resmi hesap pusulası | Otomatik MASAK kaydı, Darphane standartlarında pusula |
| 9 | **Gün Sonu Raporu** | Gün sonu kasa sayımında zaman kaybı | Tek tıkla PDF/A4 gün sonu raporu |
| 10 | **Hurda Altın Yönetimi** | Müşteriden altın alımında sahte/ayar kontrolü | Ayar bazlı has hesaplama, CRM entegrasyonu |
| 11 | **SaaS Çoklu Firma** | Birden çok kuyumcu firmasını tek platformda yönetememe | Multi-tenant yapı, lisans yönetimi, otomatik yedekleme |

---

## 3. Modül Detayları

### 3.1. IoT Akıllı Vitrin & Güvenlik Sistemi

**🔑 Ana Özellikler:**
- Her vitrin askısında/tablasında **HX711 Load Cell** hassas terazi sensörü
- **Raspberry Pi Pico W / ESP32** ile Wi-Fi üzerinden sürekli veri akışı
- **±0.1 gram hassasiyet** ile ağırlık değişimlerini algılama
- **WebSocket** ile anlık olarak tüm ekranlara bildirim

**🛡️ Güvenlik Katmanları:**
| Güvenlik Özelliği | Açıklama |
|-------------------|----------|
| **Hırsızlık Alarmı** | Askıdan ürün kaldırıldığında anlık alarm (+ sesli/sessiz) |
| **Cihaz Kopma İkazı** | IoT cihazının bağlantısı 15 saniye kesilirse kritik alarm |
| **Gece Koruma Modu** | Mağaza kapalıyken tüm hareketler yüksek öncelikli alarm |
| **Sessiz Panik Butonu** | Soygun anında tek tuşla gizli alarm |
| **Yetkili İnceleme Modu** | Personel müşteriye ürün gösterirken alarmı susturma |
| **Kalibrasyon Yönetimi** | Sensör tolerans ve dara ayarları |
| **Çift Kişi Kuralı** | Yüksek değerli işlemlerde iki yetkili zorunluluğu |

**📊 Vitrin Talep Analitiği:**
- Her ürünün kaç kere askıdan kaldırıldığı (view_count)
- Toplam kaç dakika incelendiği (inspection_seconds)
- **Yüksek İlgi / Düşük Satış** → Kampanya önerisi
- **Hızlı Satılan / Popüler** → Vitrinde ön plana çıkar
- **Düşük İlgi** → Daha aydınlık konuma taşıma tavsiyesi

**🔌 Donanım Bileşenleri:**
```
Raspberry Pi Pico W / ESP32
    ├── HX711 24-bit ADC (Analog-Dijital Çevirici)
    │   └── Load Cell (100g - 500g hassas sensör)
    ├── Dahili LED (Durum göstergesi)
    ├── Fiziksel Buton (GP14 - Debounce korumalı)
    └── Wi-Fi (2.4 GHz)
        ├── Heartbeat (5 sn'de bir canlılık sinyali)
        ├── Alarm bildirimi (HTTP POST)
        └── Gömülü Web Sunucusu (Teşhis paneli)
```

---

### 3.2. Çoklu Şube & RBAC Yetki Yönetimi

**🏬 3 Kademeli Hiyerarşik Rol Sistemi:**

```
                    ┌─────────────────────────┐
                    │  👑 ADMIN (Patron)       │
                    │  Tüm şirket konsolide    │
                    │  Tüm şubelere tam erişim │
                    │  Personel atama, silme   │
                    │  Kâr marjlarına erişim   │
                    └───────────┬─────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                  │
   ┌──────────┴──────────┐     │     ┌────────────┴───────────┐
   │  🏬 MAĞAZA MÜDÜRÜ   │     │     │  👤 SATIŞ DANIŞMANI    │
   │  Kendi şubesine     │     │     │  Kendi satışları       │
   │  kilitli            │     │     │  Temel vitrin işlemleri│
   │  Ekibini görür      │     │     │  Kâr marjı görmez      │
   │  Yeni personel açar │     │     │  Diğer personeli görmez│
   └──────────────────────┘     │     └────────────────────────┘
                                │
                    ┌───────────┴─────────────┐
                    │  🔒 Mağaza Seçici        │
                    │  Admin: Tümü/Tekil       │
                    │  Müdür/Personel: Kilitli  │
                    └─────────────────────────┘
```

**🌆 Şube Yapısı:**
| Şube | Şehir | Özellik |
|------|-------|---------|
| Kapalıçarşı Merkez Mağaza | İstanbul | Ana merkez, en yüksek hacim |
| Nişantaşı VIP Showroom | İstanbul | VIP müşteri, lüks segment |
| Bağdat Caddesi Şube | İstanbul | Perakende, cadde mağazası |

---

### 3.3. Ürün & Envanter Yönetimi

**💎 Ürün Kartı Detayları:**
| Alan | Detay |
|------|-------|
| **Kimlik** | Barkod, İsim, Kategori, Açıklama |
| **Maden & Ayar** | Saflık (14K/18K/22K/24K), Milyem, Renk (Sarı/Beyaz/Rose/Çift) |
| **Ağırlık & Boyut** | Gramaj, Numara/Boy, En (mm) |
| **İşçilik & Tasarım** | İşçilik türü (El işçiliği/Trabzon Hasırı/Telkari/Lazer), Yüzey kaplama, Atölye menşei |
| **4C Pırlanta Standartları** | Karat, Renk (D→J), Berraklık (FL→SI2), Kesim, Sertifika (GIA/HRD/IGI) |
| **Fiyatlandırma** | Satış fiyatı, Maliyet, İşçilik bedeli, İskonto |
| **Konum** | Hangi şube, hangi slot/askı, kimin zimmetinde |
| **Varyantlar** | Farklı renk/boy/gramaj seçenekleri |
| **Medya** | Ana görsel, ek görseller, 360° galeri |

**📦 Envanter Durumları:**
- **Vitrinde** → Askıda/tablada sergileniyor
- **Zimmette** → Personel müşteriye gösteriyor
- **Kasada** → Güvenli kasa/çelik kasa
- **Satıldı** → İşlem tamamlanmış

**⚠️ Kritik Stok Uyarısı:**
- Minimum stok eşiği tanımlama
- Kritik seviye altındaki ürünler için otomatik sipariş taslağı
- Toptancıya gönderilmek üzere hazır sipariş özeti

---

### 3.4. Satış & Kasa İşlemleri

**🧾 Satış Süreci:**
1. Müşteri karşılama → Seans başlatma (kronometre)
2. Ürünü askıdan kaldırma → IoT sensörü algılar
3. Müşteriye denetme (Yetkili İnceleme Modu)
4. Satış onayı → Fiş kesme
5. E-posta ile sertifika gönderme
6. Seans bitirme → İşlem süresi kaydı

**📄 Fiş & Belge Özellikleri:**
- Otomatik fiş numarası (SE-20260919-XXXX)
- Barkod ve ürün detayları
- KDV ayrıştırması (İşçilik üzerinden %20 KDV)
- MASAK bildirim sınırı kontrolü (85.000 TL)
- Altın renkli A4/PDF çıktı
- Teslim eden/alan imza ve kaşe alanları

**🔍 Gelişmiş Filtreleme:**
- Zaman: Bugün, Bu Hafta, Bu Ay, Bu Yıl, Tüm Zamanlar
- Personel: Tek tek veya tüm personel
- Kategori: Bilezik, Yüzük, Kolye, Küpe, Set
- Arama: Fiş No, Ürün Adı, Barkod, Müşteri Adı

---

### 3.5. Has Altın Sermaye Takibi

**📊 Sermaye Raporu:**
- Ayar bazında (24K/22K/18K/14K) has altın gramajı
- Toplam sermaye değeri (TL, USD, EUR)
- Vitrin vs Kasa dağılımı
- Anlık altın kuru ile otomatik değerleme

**📈 Örnek Rapor:**
| Ayar | Parça | Brüt (gr) | Has (gr) | Değer (₺) |
|------|-------|-----------|----------|-----------|
| 24K (Has) | 12 | 245.50 | 245.50 | 746.720 |
| 22K (Bilezik) | 48 | 892.30 | 817.35 | 2.486.540 |
| 18K (Pırlantalı) | 24 | 186.40 | 139.80 | 425.280 |
| 14K (Fantezi) | 8 | 52.60 | 30.77 | 93.620 |
| **Toplam** | **92** | **1.376,80** | **1.233,42** | **3.752.160** |

---

### 3.6. Canlı Altın & Döviz Kurları

**🔄 Çok Katmanlı Veri Motoru:**
1. **Truncgil Finans v4/v3** → Kapalıçarşı & Serbest Piyasa anlık veri
2. **TCMB XML** → Merkez Bankası resmi kurları (doğrulama)
3. **Matematik Motoru** → Eksik verileri Darphane standartlarıyla türetme

**📊 Takip Edilen Varlıklar:**
| Varlık | Tür | Güncelleme |
|--------|-----|------------|
| Has Altın (995) | Gram Altın | 15 saniye |
| 22K Bilezik | Gram Altın | 15 saniye |
| 18K Mücevher | Gram Altın | 15 saniye |
| 14K Takı | Gram Altın | 15 saniye |
| Çeyrek / Yarım / Tam / Ata | Ziynet | 15 saniye |
| ONS Altın (XAU/USD) | Uluslararası | 15 saniye |
| USD/TRY | Döviz | 15 saniye |
| EUR/TRY | Döviz | 15 saniye |
| GBP/TRY | Döviz | 15 saniye |
| Gümüş (999) | Gram | 15 saniye |

**📈 Zaman Serisi Grafiği:**
- 24 Saat, 7 Gün, 1 Ay, 1 Yıl
- İnteraktif SVG grafik (gold-glow efektli)
- Hover ile noktasal fiyat ve zaman etiketi
- En yüksek/en düşük seviyeler ve günlük getiri

---

### 3.7. Müşteri CRM & Sadakat

**👥 Müşteri Yönetimi:**
- İsim, Telefon, E-posta, TC/Vergi No
- Sınıflandırma: VIP, Bireysel, Toptan
- Özel müşteri notları
- Gelişmiş arama (isim, telefon, e-posta, TC)

**📜 Müşteri Kartı & Satın Alma Geçmişi:**
- Müşterinin tüm zamanlardaki alışverişleri
- Ürün adı, ayar, gramaj, tarih, tutar
- Toplam harcama ve toplam gramaj
- Satın alan personel bilgisi

**📧 Sertifika & E-Fatura E-Postası:**
- Satış anında veya sonradan sertifika gönderme
- Kişiye özel garanti belgesi şablonu
- Fatura dökümü e-posta ile otomatik iletilir
- API: `/api/v1/crm/send-certificate-email`

**📦 Müşteri Rezervasyon (Kapora):**
- Ürün ayırma, kapora alma
- Rezervasyon kodu, vade tarihi
- ACTIVE/COMPLETED/CANCELLED durum takibi

---

### 3.8. Altın Satın Alma & Hurda Kasa

**🪙 Müşteriden Altın Alım Süreci:**
1. Müşteri bilgileri alınır (CRM entegrasyonu)
2. Ayar tespiti (24K/22K/18K/14K/9K)
3. Milyem oranı ile has altın hesaplama
4. Canlı kur üzerinden güncel alış fiyatı
5. Ödeme yöntemi seçimi (Nakit/Kart/EFT)
6. Alım fişi/gider pusulası oluşturma
7. Saklama konumu belirleme

**📋 Alım Türleri:**
| Kategori | Açıklama |
|----------|----------|
| Hurda Altın | Kırık/dökük altınlar |
| Ziynet Altın | Çeyrek, Yarım, Tam, Ata |
| Külçe Altın | 24K gram külçe |
| Mücevher | İkinci el bilezik, yüzük vb. |

---

### 3.9. Finansal Raporlama & Gün Sonu

**📊 Gün Sonu Kasa Raporu:**
- Toplam satış adedi ve cirosu
- Satılan toplam gramaj
- Kategori bazında satış dağılımı
- Personel bazında satış karnesi
- En çok görüntülenen ürünler
- Aktif alarm durumu
- Net altın bakiyesi (alınan - satılan)
- Net nakit akışı

**📄 PDF/A4 Çıktı:**
- Sarraf Erdem antetli
- Tarih ve saat damgalı
- Tüm ürün satış listesi
- Toplam ciro ve gramaj
- Teslim eden/alan imza ve kaşe alanları
- Tek tıkla yazdırma

**📈 Personel Karşılaştırma Grafiği:**
- Altın renkli ilerleme çubukları
- Adet, gram ve TL bazında performans
- Rol bazlı görüntüleme

---

### 3.10. MASAK Uyumluluğu & Yasal Mevzuat

**⚖️ Yasal Uyumluluk Özellikleri:**

| Özellik | Açıklama |
|---------|----------|
| **MASAK Kimlik Tespiti** | 85.000 TL üzeri işlemlerde otomatik bildirim |
| **TCKN Doğrulama** | 11 haneli TC kimlik numarası kontrolü |
| **Risk Durumu** | UYGUN / BİLDİRİM GEREKLİ otomatik sınıflandırma |
| **Denetim Defteri** | Tüm MASAK kayıtları kronolojik sıralı |
| **KDV İstisnası** | 3065 sayılı Kanun Madde 17/4-g uyumu |
| **Resmi Hesap Pusulası** | Darphane damgası, KDV ayrıştırması |
| **Gider Pusulası** | Altın alımlarında resmi belge |

---

### 3.11. Sistem Denetim Günlüğü (Audit Trail)

**📋 Kayıt Altına Alınan Olaylar:**
| Olay Türü | Seviye | Modül |
|-----------|--------|-------|
| Kullanıcı girişi | INFO | AUTH |
| Satış işlemi | INFO | SALES |
| Fiş kesimi | INFO | SALES |
| Ağırlık eksilmesi | WARNING | IOT |
| Güvenlik alarmı | SECURITY | IOT_SECURITY |
| Cihaz kalibrasyonu | INFO | IOT |
| Ürün ekleme/düzenleme | INFO | PRODUCTS |
| MASAK kaydı | INFO | LEGAL |
| IoT bağlantı kesilmesi | CRITICAL | IOT_SECURITY |
| Gece modu değişimi | WARNING | SECURITY |

**🔍 Filtreleme:**
- Seviye: INFO, WARNING, SECURITY, ERROR, CRITICAL
- Modül: SALES, IOT, SECURITY, AUTH, CRM, LEGAL, BACKUP
- Serbest metin arama

---

### 3.12. SaaS & Çoklu Firma (Multi-Tenant) Yönetimi

**🏢 Master HQ (SuperAdmin) Özellikleri:**
- Yeni firma kurulumu ve lisans atama
- Otomatik lisans anahtarı üretimi
- Firma bazında kullanım metrikleri
- Kârlılık analizi (gelir - maliyet)
- Otomatik veritabanı yedekleme (ZIP + SHA256)
- Yedek dosyalarının listelenmesi ve indirilmesi

**📊 Firma Metrikleri:**
| Metrik | Açıklama |
|--------|----------|
| Aktif çevrimiçi kullanıcı | Anlık online personel sayısı |
| Günlük API isteği | Sistem kullanım yoğunluğu |
| Depolama kullanımı | Veritabanı + dosya boyutu |
| Tahmini sunucu maliyeti | AWS/Docker maliyeti (USD/TRY) |
| Net SaaS kârı | Abonelik - maliyet |
| Kâr marjı yüzdesi | % olarak kârlılık |

**💾 Otomatik Yedekleme:**
- Periyodik ve manuel yedekleme
- ZIP arşivi + SHA256 checksum
- Yedek meta bilgisi (tarih, tür, versiyon)
- Veritabanı kayıt defteri

---

### 3.13. Özel Ekran Terminalleri

**🖥️ 3 Ekran Terminal Sistemi (`/terminals`):**

| Ekran | Kullanıcı | Amaç |
|-------|-----------|------|
| **1. POS Satış Tableti** | Satış Danışmanı | Ürün arama, tartım, satış, müşteri yönetimi |
| **2. Yönetici Ekranı** | Mağaza Müdürü | Sermaye takibi, personel yönetimi, kritik stok |
| **3. Canlı TV Panosu** | Tüm Mağaza | Anlık ciro, sermaye, popüler ürünler, güvenlik durumu |

**📺 TV Panosu Döngüsü:**
- Slayt 1: Genel ciro & sermaye göstergeleri
- Slayt 2: Çok denen ürünler & güvenlik durumu
- Otomatik döngü, canlı veri akışı

---

## 4. Donanım Entegrasyonu

### Raspberry Pi Pico W Donanım Yazılımı

**Özellikler:**
- MicroPython ile gömülü yazılım (v2.1.0-Enterprise)
- Çift yönlü iletişim (ERP'ye alarm + heartbeat)
- Gömülü web sunucusu (teşhis paneli)
- REST API: `/api/status`, `/api/ping`, `/api/trigger`
- Donanım buton kesmesi (GP14 debounced)
- Akıllı durum LED'i (Wi-Fi arama, kalp atışı, alarm flaşı)

**Bağlantı Protokolü:**
```
Pico W → Wi-Fi → FastAPI Backend → WebSocket → Frontend
   ↑                                            ↓
   └──────────── Heartbeat (5 sn) ──────────────┘
```

**Donanım Pin Şeması:**
```
GP14 → Buton (Dahili Pull-Up, 250ms Debounce)
LED  → Dahili LED (Durum Göstergesi)
HX711 → SCK/DT (Load Cell ADC)
```

---

## 5. Kullanıcı Rolleri & Yetki Matrisi

| Özellik | 👑 Admin | 🏬 Müdür | 👤 Personel |
|----------|----------|----------|------------|
| Tüm şirket konsolide görüntüleme | ✅ | ❌ | ❌ |
| Şube bazlı veri görüntüleme | ✅ (Tümü/Seçmeli) | ✅ (Kendi şubesi) | ✅ (Kendi şubesi) |
| Ürün ekleme/düzenleme/silme | ✅ | ❌ | ❌ |
| Satış yapma | ✅ | ✅ | ✅ |
| Kâr marjı görme | ✅ | ❌ | ❌ |
| Personel yönetimi (rol/şube atama) | ✅ | ❌ | ❌ |
| Kendi satışlarını görme | ✅ | ✅ | ✅ |
| Tüm personel satışlarını görme | ✅ | ✅ (Kendi ekibi) | ❌ |
| Gün sonu raporu | ✅ | ❌ | ❌ |
| MASAK kaydı görüntüleme | ✅ | ❌ | ❌ |
| Güvenlik ayarları | ✅ | ❌ | ❌ |
| Alarm sıfırlama | ✅ | ✅ | ❌ |
| Müşteri CRM | ✅ | ✅ | ✅ |
| Altın satın alma | ✅ | ✅ | ✅ |
| SaaS yönetimi (Master HQ) | ✅ (Master Key) | ❌ | ❌ |

---

## 6. Canlı Sistem Bilgileri

| Bileşen | URL |
|---------|-----|
| **Web ERP Paneli** | [http://63.181.78.45:3000](http://63.181.78.45:3000) |
| **Terminal Ekranları** | [http://63.181.78.45:3000/terminals](http://63.181.78.45:3000/terminals) |
| **Master HQ (SaaS)** | [http://63.181.78.45:3000/master-hq](http://63.181.78.45:3000/master-hq) |
| **FastAPI Swagger** | [http://63.181.78.45:8000/docs](http://63.181.78.45:8000/docs) |
| **WebSocket** | `ws://63.181.78.45:8000/ws/live` |

**Test Hesapları:**
| Rol | Kullanıcı | Şifre |
|-----|-----------|-------|
| 👑 Admin | `admin` | `admin123` |
| 🏬 Mağaza Müdürü | `selim_mudur` | `123456` |
| 👤 Satış Personeli | `ahmet_kasiyer` | `123456` |
| 👤 Satış Personeli | `ayse_kasiyer` | `123456` |

---

## 🎯 Özet: Golden Guard Size Ne Kazandırır?

| Başlık | Kazanım |
|--------|---------|
| **🔒 Vitrin Güvenliği** | Hırsızlık anında anlık alarm, 7/24 koruma |
| **📊 Tam Görünürlük** | Tüm şubelerin anlık cirosu, sermayesi, personel performansı |
| **⚡ Operasyonel Hız** | Tek tıkla satış, PDF rapor, sertifika e-postası |
| **📋 Yasal Uyum** | MASAK, KDV, Darphane standartlarına tam uyum |
| **💰 Kârlılık** | Anlık kâr marjı takibi, maliyet kontrolü |
| **👥 Personel Yönetimi** | Rol bazlı erişim, satış karnesi, performans analizi |
| **🌐 Her Yerden Erişim** | Bulut tabanlı, cep telefonu/tablet uyumlu |
| **🔧 Düşük Maliyet** | 1 GB RAM sunucuda çalışır, aylık ~$5-6 işletim maliyeti |
| **📈 Müşteri Sadakati** | CRM, sertifika, satın alma geçmişi, e-posta bildirimleri |
| **🏢 SaaS Altyapısı** | Çoklu firma yönetimi, lisanslama, otomatik yedek |

---

> 💡 *Golden Guard, geleneksel kuyumculuğun asırlık birikimini modern teknolojiyle birleştirerek, sarraflar ve kuyumcular için dijital dönüşümün anahtarını sunar.*

**Hazırlanma Tarihi:** Eylül 2026
**Sistem Versiyonu:** 2.4.0 Multi-Tenant