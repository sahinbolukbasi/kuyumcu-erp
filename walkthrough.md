# 🏆 Sarraf Erdem Showcase ERP & IoT Akıllı Vitrin Sistemi - Güncelleme Raporu

Tüm sistem; kullanıcının talepleri doğrultusunda **üst menüde logo altında mağaza seçimi (Tümü/Konsolide ve Tekil Mağazalar), 3 Kademeli Hiyerarşik Rol Sistemi (Admin, Mağaza Müdürü, Satış Danışmanı)** ve **kişiye özel mağaza verileri, has altın sermaye takibi, canlı vitrin terazileri ve AWS Frankfurt (`63.181.78.45`)** üzerinde başarıyla canlıya alınmıştır.

---

## 🚀 Canlı Sistem Erişim Bilgileri

- **Canlı Web Paneli (Ana ERP):** [http://63.181.78.45:3000](http://63.181.78.45:3000)
- **3 Özel Ekran Terminali (Satış Tableti, Yönetici, TV Monitör):** [http://63.181.78.45:3000/terminals](http://63.181.78.45:3000/terminals)
- **FastAPI Backend (Swagger API):** [http://63.181.78.45:8000/docs](http://63.181.78.45:8000/docs)
- **Canlı WebSocket:** `ws://63.181.78.45:8000/ws/live`

### 🔑 Giriş Hesapları ve 3 Kademeli Rol Ayrımı (RBAC)
| Rol | Kullanıcı Adı | Şifre | Çalıştığı Mağaza | Yetki Kapsamı |
| :--- | :--- | :--- | :--- | :--- |
| **👑 Patron (Admin)** | `admin` | `admin123` | *Tüm Şirket / Genel Merkez* | "Tümü (Konsolide)" veya dilediği şubeyi seçebilir. Personellerin çalıştığı mağazaları ve rollerini atayabilir. Tüm maliyet ve kâr marjlarına tam erişir. |
| **🏬 Mağaza Müdürü** | `selim_mudur` | `123456` | *Nişantaşı VIP Showroom* | Mağaza seçicisi Nişantaşı'na kilitlidir. Kendi vitrin terazilerini, kendi mağaza cirosunu ve "👥 Mağaza Ekibim" sekmesinde sadece kendi altındaki satış ekibini görür. |
| **👤 Satış Personeli 1** | `ahmet_kasiyer` | `123456` | *Kapalıçarşı Merkez* | Mağaza seçicisi Kapalıçarşı'ya kilitlidir. Sadece kendi yaptığı satışları, ilgilendiği müşterileri ve temel vitrin operasyonlarını (arama, tartım, satış) görür. |
| **👤 Satış Personeli 2** | `ayse_kasiyer` | `123456` | *Nişantaşı VIP Showroom* | Mağaza seçicisi Nişantaşı'na kilitlidir. Sadece kendi satışlarını ve temel operasyonları görür. |

---

## 🌟 Eklenen Yeni Özellikler ve Modüller

### 1. 🏬 Üst Menüde Logo Altında Mağaza Seçimi & "TÜMÜ" Konsolide Ekranı
- **Logo Altı Mağaza Dropdown:** Menünün sol üstünde logonun hemen altında yer alan altın yaldızlı mağaza seçici.
- **🏢 TÜMÜ (Tüm Şirket / Konsolide):** Seçildiğinde tüm şirketin toplam cirosu (85.300 ₺), toplam has altın sermayesi (133.24 gr Has), toplam sermaye değeri (405.776 ₺) ve tüm vitrin ürünleri listelenir.
- **🏬 Tekil Mağaza Seçimi:** Kapalıçarşı, Nişantaşı veya Bağdat Caddesi seçildiğinde yalnızca o mağazaya ait IoT terazileri, ürünler, cirolar ve personel listelenir.
- **Rol Bazlı Kilit:** Admin serbestçe tüm şubeleri veya "Tümü"nü seçebilir. Mağaza Müdürü ve Satış Personeli için mağaza seçimi otomatik olarak çalıştıkları şubeye kilitlenir (`🔒 Kendi Şubesi`).

### 2. 👥 Personel & Mağaza Yetki Yönetimi (RBAC Ekranı - Yalnızca Admin)
- Admin paneline eklenen **"👥 Personel & Mağaza Yetkileri"** sekmesi ile tüm çalışanların çalıştığı mağaza (Kapalıçarşı, Nişantaşı, Bağdat Caddesi, Genel Merkez) ve sistem yetki rolü (Admin, Mağaza Müdürü, Satış Personeli) dinamik olarak değiştirilip anında kaydedilebilir.

### 3. 👥 Mağaza Ekibim Ekranı (Mağaza Müdürü)
- Mağaza Müdürü rolündeki kullanıcılar kendi mağazalarının altında çalışan satış danışmanlarını, onların bugünkü satış adetlerini ve cirolarını görüntüler, mağazalarına yeni personel hesabı açabilir.

### 4. 👤 Satış Danışmanı Kısıtlı Temel Operasyon Modu
- Kasiyer / Satış danışmanları şirket sırrı olan kâr marjlarını, genel merkez sermaye raporlarını veya diğer personellerin satışlarını görmez; yalnızca vitrinden ürün alma, tartım yapma, müşteriye denettirme ve kendi satışlarını tamamlama işlemlerini yürütür.

---

## 🌟 Eklenen Yeni Özellikler ve Modüller

### 1. 🔍 Gelişmiş Satış Filtreleme & Personel Karşılaştırmalı Grafik
- **Zaman Filtreleri:** "Bugün", "Bu Hafta", "Bu Ay", "Bu Yıl" ve "Tüm Zamanlar".
- **Kişiye Özel Filtre:** Satış personeli sisteme girdiğinde otomatik olarak yalnızca kendi satışlarını görebilir. Yönetici (Admin) ise tüm personelleri veya tek tek dilediği personeli seçebilir.
- **Kategori & Arama:** Bilezik, Yüzük, Kolye, Küpe, Set veya arama çubuğundan Fiş No, Ürün Adı, Barkod veya Müşteri Adı ile anlık sorgulama.
- **Yönetici Personel Karnesi & Grafik:** Hangi personelin kaç adet ürün sattığı, kaç gram altın cirosu ürettiği ve toplam TL kazancı altın renkli ilerleme çubukları ile görselleştirilmiştir.

### 2. 📈 Canlı Döviz & Altın Finansal Zaman Serisi Grafiği
- **Varlıklar:** Has Altın (995), Çeyrek Ziynet, Ons Altın ($), Dolar (USD/TRY), Euro (EUR/TRY).
- **Zaman Dilimleri:** 24 Saat (1D), 7 Gün (1W), 1 Ay (1M), 1 Yıl (1Y).
- **İnteraktif SVG Grafiği:** Altın parıltılı (`gold-glow`) alan ve çizgi grafiği; fare ile üzerine gelindiğinde (hover) noktasal fiyat ve zaman etiketi sunan tooltip.
- En Yüksek, En Düşük seviyeler ve günlük getiri farkları.

### 3. 📄 Gün Sonu Kasa Raporu & Resmi A4 / PDF Dışa Aktarma
- **Tek Tıkla PDF / Yazdır Butonu:** `window.print()` ile Sarraf Erdem antetli, tarihli, günün tüm detaylı ürün satış listesini, toplam ciroyu, satılan gramajı içeren ve teslim eden/alan imza-kaşe alanlarına sahip A4 formatında resmi kasa raporu çıktısı.
- Tüm satışlar ile gün sonu kasası birleştirilmiştir.

### 4. 👥 Müşteri CRM Modülü & Satın Alma Geçmişi & Sertifika E-Postası
- **Müşteri Veritabanı:** İsim, Telefon, E-posta, VIP / Bireysel / Toptan sınıflandırması ve özel müşteri notları.
- **Müşteri Kartı & Satın Alma Geçmişi:** Müşterinin mağazadan bugüne kadar aldığı tüm altınlar, ayarları, gramajları, tarihleri ve toplam harcaması modal pencerede listelenir.
- **Sertifika ve E-Fatura Fişi E-Postası:** Satış anında veya satış listesindeki "Sertifika" butonuna tıklandığında müşteriye özel garanti belgesi ve fatura dökümü e-posta şablonu ile iletilir (`/api/v1/crm/send-certificate-email`).

### 5. 📋 Sistem Denetim Günlüğü (Audit Trail / Olay Kayıtları)
- Sistemdeki tüm adımlar (Kullanıcı girişi, Satış işlemi, Fiş kesimi, Ağırlık eksilmesi, Güvenlik alarmı, Cihaz kalibrasyonu, Ürün ekleme) saniyesi saniyesine veritabanında `system_logs` tablosuna kaydedilir.
- Seviye (INFO, WARNING, SECURITY, ERROR) ve Modül (SALES, IOT, SECURITY, AUTH, CRM) filtreleriyle denetlenebilir.

### 6. ⚖️ IoT Akıllı Tabla & Vitrin Gruplaması & Talep Analitiği
- **Cihaz Türleri ve Gruplar:** Askılık, Yüzük Tablası, Bilezik Tepsisi, Çelik Kasa. Gruplar: "Ana Vitrin", "Yüzük Tablası 1", "Bilezik Standı", "Çelik Kasa".
- **Vitrin Talep & İlgi Raporu:** Her ürünün vitrinde askıdan/tabladan kaç kere kaldırıldığı, toplam kaç dakika incelendiği ve kaç adet satıldığı analiz edilir:
  - *Yüksek İlgi / Düşük Satış:* Müşterinin ilgilendiği ancak fiyattan çekindiği ürünler için kampanya önerisi.
  - *Hızlı Satılan / Popüler:* Vitrinde ön planda tutulması tavsiye edilen ürünler.
  - *Düşük İlgi:* Vitrinde daha aydınlık bir tablaya taşınması tavsiye edilen ürünler.
