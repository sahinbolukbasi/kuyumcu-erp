# 💎 Canlı AWS Dağıtım ve Yeni Nesil Kuyumculuk ERP Sistemi (v1.5.0)

Kuyumculuk ERP ve IoT Akıllı Vitrin Güvenlik Sistemi; **Çoklu Mağaza Seçimi ("Tümü / Konsolide" ve Tekil Şubeler), 3 Kademeli Hiyerarşik Rol Sistemi (Admin, Mağaza Müdürü, Satış Danışmanı)** ve **5 Ana Modül (Envanter/Has Takip, Müşteri/Çapraz Satış, İleri Güvenlik/Gece Modu, Yönetim/ERP Entegrasyonu, MASAK/Yasal Uyum)** ile AWS üzerinde canlıdadır.

- **Canlı Web Yönetim Paneli (Ana ERP):** [http://63.181.78.45:3000](http://63.181.78.45:3000)
- **3 Özel Ekran Terminali (Satış Tableti, Yönetici, TV Monitör):** [http://63.181.78.45:3000/terminals](http://63.181.78.45:3000/terminals)
- **FastAPI Canlı Swagger API Dokümantasyonu:** [http://63.181.78.45:8000/docs](http://63.181.78.45:8000/docs)
- **Canlı IoT WebSocket URL:** `ws://63.181.78.45:8000/ws/live`

---

## 🏬 Çoklu Mağaza Seçimi ("Tümü" Konsolide & Şube Bazlı)
- **Logo Altında Mağaza Seçimi:** Menünün sol üstünde, logonun hemen altında yer alan dinamik mağaza dropdown'ı.
- **🏢 TÜMÜ (Tüm Şirket / Konsolide Genel Merkez):** Seçildiğinde şirketin tüm şubelerinin toplam cirosu (85.300 ₺), toplam has altın gramı (133.24 gr), toplam sermaye değeri (405.776 ₺) ve tüm vitrin slotları konsolide olarak gelir.
- **🏬 Tekil Mağazalar:** `Kapalıçarşı Merkez Mağaza`, `Nişantaşı VIP Showroom`, `Bağdat Caddesi Şube` seçildiğinde yalnızca o mağazaya ait vitrin terazileri, ürünler, satışlar ve çalışanlar listelenir.

---

## 👥 3 Kademeli Hiyerarşik Rol Sistemi (RBAC)

### 1. 👑 Admin (Şirket Sahibi / GM)
- **Giriş:** `admin` / `admin123`
- **Yetki Alanı:** Tüm mağazalara ve konsolide genel merkeze tam yetkili. Mağaza dropdown'ından serbestçe "Tümü" veya istediği şubeyi seçebilir.
- **"👥 Personel & Mağaza Yetkileri" Ekranı:** Hangi personelin hangi mağazada çalışacağına ve sistem yetki rolüne (Admin / Mağaza Müdürü / Satış Personeli) tek tıkla karar verir ve anında kaydeder.

### 2. 🏬 Mağaza Müdürü (Manager)
- **Giriş:** `selim_mudur` / `123456`
- **Çalıştığı Mağaza:** `Nişantaşı VIP Showroom`
- **Yetki Alanı:** Mağaza seçicisi kendi mağazasına kilitlidir (🔒 rozetli). Yalnızca kendi mağazasının vitrin terazilerini, cirosunu ve müşterilerini görür.
- **"👥 Mağaza Ekibim" Ekranı:** Sadece kendi mağazası altındaki personelleri görür, performanslarını takip eder ve kendi mağazasına yeni kasiyer ekleyebilir.

### 3. 👤 Satış Danışmanı / Kullanıcı (Staff)
- **Giriş:** `ahmet_kasiyer` / `123456` (Kapalıçarşı) veya `ayse_kasiyer` / `123456` (Nişantaşı)
- **Yetki Alanı:** Mağaza seçicisi kendi şubesine kilitlidir. Yalnızca temel operasyonları (Vitrin ürün arama/tartım, Masamdaki Ürünler/Zimmet, Satış Yapma, Kendi Satışlarım ve Müşteri CRM) görür. Maliyet analizleri ve yönetim sekmeleri gizlenir.

---

## 🚀 Yeni Entegre Edilen 5 Ana Kuyumculuk Modülü

### 1. 💰 Envanter & Stok Yönetimi
- **Ayar/Has Bazlı Sermaye Raporu:** 14K (0.585), 18K (0.750), 22K (0.916), 24K (1.000) ayar bazlı brüt gramaj, net has altın miktarı, anlık kurla güncellenen TL, USD ve EUR toplam sermaye değeri.
- **Otomatik Kritik Stok & Tedarikçi WhatsApp Siparişi:** Stok adedi kritik seviyeye (≤2) düşen modeller için tek tıkla toptancı/atölye sipariş metni oluşturma.
- **Barkod / RFID Hızlı Vitrin Sayım Modu:** El terminali / RFID okuyucu ile vitrindeki tüm ürünleri okutup sistemle anlık mutabakat (Eşleşen, Eksik, Vitrinde Olmayan Fazla).
- **Ürün Yaşam Döngüsü & Durgun Stok Analitiği:** Kaç gündür vitrinde beklediği, kaç kez müşteriye denettirilip satılmadığı ve yapay zeka strateji önerisi (kampanya, atölyeye iade, teşhir yeri değiştirme).

### 2. 💎 Satış & Müşteri Deneyimi
- **Müşteri İlgi ve Deneme Analizi:** Sık kaldırılan ama satılmayan ürünlerin tespit edilmesi (fiyat/tasarım engeli sinyali).
- **Akıllı Çapraz Satış (Cross-Sell Engine):** POS satış ekranında sepetteki parçaya göre takım kolye, küpe veya bilezik önerisi sunma.
- **Dijital Fiyat Etiketi (ESL / E-Paper):** Anlık altın kuru değişiminde tek tıkla tüm vitrindeki e-kağıt dijital etiketlerin fiyatını kablosuz güncelleme simülatörü.

### 3. 🛡️ Güvenlik Ek Katmanları
- **Mesai Dışı Gece Soygun Koruma Modu:** Mağaza kapalıyken veya gece modundayken vitrinden 0.01 gr dahi eksilme olursa doğrudan `CRITICAL_BURGLARY_ALARM` tetikleme ve kırmızı acil uyarı flaşı.
- **İki Kişi Kuralı (Dual Authorization):** 100.000 TL ve üzeri yüksek tutarlı takı satışlarında ikinci bir yetkili/şef şifre onayı olmadan satışın tamamlanmasını engelleme.
- **Sahte Altın / Ağırlık Sapması Algılama:** Denenen veya incelenen ürün vitrine geri konduğunda ağırlık toleransı (>0.25 gr) dışına çıkarsa otomatik sahte/ikame ürün uyarısı.
- **Gizli Panik Butonu:** Sessiz soygun/tehdit alarmı tetikleme, merkez paneline ve günlüğe acil müdahale çağrısı gönderme.

### 4. 📊 Yönetim, Çoklu Şube & Muhasebe/ERP
- **Saatlik Mağaza Müşteri Yoğunluk Isı Haritası:** 09:00 - 20:00 arası saatlik ziyaretçi ve satış temposu grafiği.
- **Gerçek Zamanlı Kâr Marjı Analitiği:** Alış/maliyet fiyatı + işçilik ile satış fiyatı kıyaslaması ve net kâr marjı yüzdesi.
- **Çoklu Şube Yönetimi & Güvenli Stok Transferi:** Kapalıçarşı Merkez, Nişantaşı VIP ve Bağdat Caddesi şubeleri arasında irsaliyeli değerli stok transferi.
- **Logo Tiger & Netsis ERP Entegrasyonu:** Tek tıkla Logo XML ve Netsis JSON formatında satış ve cari fiş aktarımı.

### 5. ⚖️ Uyum & Yasal Süreçler (Türkiye Kuyumculuk Mevzuatı)
- **5549 Sayılı Kanun MASAK Kimlik Kayıt Defteri:** 85.000 TL ve üzeri nakit/kart işlemlerinde zorunlu TCKN, Pasaport, meslek ve unvan kayıt takibi.
- **Resmi Hesap Pusulası & Darphane Damgası (KDV 17/4-g):** 3065 Sayılı KDV Kanunu Madde 17/4-g uyarınca Has Altın Bedeli KDV'den muaf, işçilik tutarı %20 KDV'li, A4 formatında yazdırılabilir fatura yerine geçen resmi kuyumculuk hesap pusulası.
