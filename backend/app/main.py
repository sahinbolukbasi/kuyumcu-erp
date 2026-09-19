import os
import json
import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import asyncio
from .database import engine, Base, SessionLocal
from . import models, iot_service, auth
from .iot_watchdog import run_iot_watchdog
from .routers import products, iot, sales, analytics, auth as auth_router, crm, logs, sessions, inventory, security, legal, branches, rates, purchases, tenants
from . import backup_service

from sqlalchemy import text

def run_sqlite_migrations():
    with engine.connect() as conn:
        for alter_stmt in [
            "ALTER TABLE branches ADD COLUMN branch_code VARCHAR(30) DEFAULT 'BR-01'",
            "ALTER TABLE branches ADD COLUMN region VARCHAR(50) DEFAULT 'Marmara'",
            "ALTER TABLE rack_slots ADD COLUMN location_code VARCHAR(50)",
            "ALTER TABLE rack_slots ADD COLUMN is_active BOOLEAN DEFAULT 1",
            "ALTER TABLE users ADD COLUMN tenant_id INTEGER DEFAULT 1"
        ]:
            try:
                conn.execute(text(alter_stmt))
                conn.commit()
            except Exception:
                pass

run_sqlite_migrations()
Base.metadata.create_all(bind=engine)

def seed_initial_data():
    db = SessionLocal()
    try:
        # -1. İlk Tenant (Firma), Lisans ve Metrikleri kontrol et
        if db.query(models.TenantCompany).count() == 0:
            first_tenant = models.TenantCompany(
                id=1,
                company_code="GG-TEN-101",
                company_name="Golden Guard Sarrafiye & Mücevherat A.Ş.",
                owner_name="Erdem Sarraf",
                contact_phone="0212 522 10 20",
                contact_email="erdem@goldenguard.uk",
                city="İstanbul",
                tax_id="4820194821",
                is_active=True,
                created_at=datetime.datetime.utcnow()
            )
            db.add(first_tenant)
            db.flush()

            first_license = models.TenantLicense(
                tenant_id=first_tenant.id,
                license_key="GG-LIC-2026-HQ88-V99P",
                plan_type="YEARLY",
                billing_cycle="YEARLY",
                subscription_fee=72000.0,
                currency="TRY",
                status="ACTIVE",
                start_date=datetime.datetime.utcnow(),
                end_date=datetime.datetime.utcnow() + datetime.timedelta(days=365),
                auto_renew=True,
                max_admin_count=5,
                max_staff_count=20,
                max_branches_count=5,
                max_showcase_slots=250,
                storage_limit_mb=10000,
                created_at=datetime.datetime.utcnow()
            )
            db.add(first_license)

            first_metric = models.TenantUsageMetric(
                tenant_id=first_tenant.id,
                active_online_users=3,
                daily_api_requests=145,
                total_db_records=85,
                storage_used_mb=28.4,
                estimated_server_cost_usd=6.50,
                estimated_server_cost_try=269.75,
                net_saas_profit_try=5730.25,
                profit_margin_percent=95.5,
                last_ping_at=datetime.datetime.utcnow()
            )
            db.add(first_metric)
            db.commit()

        # 0. Şubeleri kontrol et ve oluştur
        if db.query(models.Branch).count() == 0:
            b1 = models.Branch(id=1, name="Kapalıçarşı Merkez Mağaza", city="İstanbul", address="Kapalıçarşı Kalpakçılar Cad. No:42, Fatih", phone="0212 522 10 20")
            b2 = models.Branch(id=2, name="Nişantaşı VIP Showroom", city="İstanbul", address="Abdi İpekçi Cad. No:18, Şişli", phone="0212 230 40 50")
            b3 = models.Branch(id=3, name="Bağdat Caddesi Şube", city="İstanbul", address="Bağdat Cad. No:312, Kadıköy", phone="0216 385 60 70")
            db.add_all([b1, b2, b3])
            db.commit()

        # 1. Kullanıcıları ve 3 Rolü (ADMIN, MANAGER, STAFF) kontrol et ve oluştur
        if db.query(models.User).count() == 0:
            admin_user = models.User(
                username="admin",
                password_hash=auth.hash_password("admin123"),
                full_name="Erdem Sarraf (Şirket Sahibi / GM)",
                role="ADMIN",
                branch_id=None, # Tüm mağazalara tam yetkili
                is_active=True
            )
            manager_user = models.User(
                username="selim_mudur",
                password_hash=auth.hash_password("123456"),
                full_name="Selim Aktaş (Nişantaşı Müdürü)",
                role="MANAGER",
                branch_id=2, # Nişantaşı VIP Showroom Müdürü
                is_active=True
            )
            staff_1 = models.User(
                username="ahmet_kasiyer",
                password_hash=auth.hash_password("123456"),
                full_name="Ahmet Yılmaz (Kapalıçarşı Satış Danışmanı)",
                role="STAFF",
                branch_id=1, # Kapalıçarşı Merkez
                is_active=True
            )
            staff_2 = models.User(
                username="ayse_kasiyer",
                password_hash=auth.hash_password("123456"),
                full_name="Ayşe Demir (Nişantaşı Satış Danışmanı)",
                role="STAFF",
                branch_id=2, # Nişantaşı VIP Showroom
                is_active=True
            )
            db.add_all([admin_user, manager_user, staff_1, staff_2])
            db.commit()

        admin = db.query(models.User).filter(models.User.username == "admin").first()
        staff_1 = db.query(models.User).filter(models.User.username == "ahmet_kasiyer").first()
        staff_2 = db.query(models.User).filter(models.User.username == "ayse_kasiyer").first()

        # 2. Örnek CRM Müşterileri
        if db.query(models.Customer).count() == 0:
            sample_customers = [
                models.Customer(
                    full_name="Selin Hanım",
                    phone="0532 555 10 20",
                    email="selin.kaya@example.com",
                    id_number="12345678901",
                    customer_type="VIP",
                    address="Nişantaşı, İstanbul",
                    notes="Düğün takıları ve 22 ayar bilezik koleksiyoncusu.",
                    total_spent=9800.0,
                    total_items=1
                ),
                models.Customer(
                    full_name="Murat Bey",
                    phone="0542 444 30 40",
                    email="murat.demirok@example.com",
                    id_number="23456789012",
                    customer_type="Bireysel",
                    address="Kadıköy, İstanbul",
                    notes="Yatırımlık külçe ve çeyrek altın alımı yapar.",
                    total_spent=31200.0,
                    total_items=1
                ),
                models.Customer(
                    full_name="Zeynep Özdemir",
                    phone="0555 888 90 00",
                    email="zeynep.ozdemir@example.com",
                    id_number="34567890123",
                    customer_type="VIP",
                    address="Bebek, İstanbul",
                    notes="Pırlanta ve özel fantezi yüzük tasarımlarını tercih eder.",
                    total_spent=85000.0,
                    total_items=2
                )
            ]
            for c in sample_customers:
                db.add(c)
            db.commit()

        # 3. Şubelere Göre Askı & Tabla Yuvaları Tanımla
        if db.query(models.RackSlot).count() == 0:
            # Kapalıçarşı (branch_id=1): 4 yuva
            kc_slots = [
                models.RackSlot(slot_number=1, label="Bilezik Askısı #1", slot_type="Askı", group_name="Bilezik Vitrini", device_id="LOADCELL_KC_01", ip_address="192.168.1.101", branch_id=1, status="EMPTY"),
                models.RackSlot(slot_number=2, label="Kolye Askısı #2", slot_type="Askı", group_name="Kolye Vitrini", device_id="LOADCELL_KC_02", ip_address="192.168.1.102", branch_id=1, status="EMPTY"),
                models.RackSlot(slot_number=3, label="Yüzük Tablası #1", slot_type="Tabla", group_name="Yüzük Vitrini", device_id="LOADCELL_KC_03", ip_address="192.168.1.103", branch_id=1, status="EMPTY"),
                models.RackSlot(slot_number=4, label="Kasa Gözü #1", slot_type="Kasa Bölmesi", group_name="Çelik Kasa", device_id="LOADCELL_KC_04", ip_address="192.168.1.104", branch_id=1, status="EMPTY"),
            ]
            # Nişantaşı VIP (branch_id=2): 4 yuva
            nis_slots = [
                models.RackSlot(slot_number=5, label="VIP Pırlanta Vitrini #1", slot_type="Tabla", group_name="VIP Pırlanta", device_id="LOADCELL_NIS_01", ip_address="192.168.2.101", branch_id=2, status="EMPTY"),
                models.RackSlot(slot_number=6, label="Zümrüt & Safir Standı #2", slot_type="Tabla", group_name="Renkli Taşlar", device_id="LOADCELL_NIS_02", ip_address="192.168.2.102", branch_id=2, status="EMPTY"),
                models.RackSlot(slot_number=7, label="Özel Tasarım Askı #3", slot_type="Askı", group_name="Tasarım Gerdanlık", device_id="LOADCELL_NIS_03", ip_address="192.168.2.103", branch_id=2, status="EMPTY"),
                models.RackSlot(slot_number=8, label="VIP Çelik Kasa", slot_type="Kasa Bölmesi", group_name="VIP Kasa", device_id="LOADCELL_NIS_04", ip_address="192.168.2.104", branch_id=2, status="EMPTY"),
            ]
            # Bağdat Caddesi (branch_id=3): 2 yuva
            bg_slots = [
                models.RackSlot(slot_number=9, label="Yatırımlık Altın Vitrini #1", slot_type="Tabla", group_name="Yatırım & Külçe", device_id="LOADCELL_BG_01", ip_address="192.168.3.101", branch_id=3, status="EMPTY"),
                models.RackSlot(slot_number=10, label="Modern Altın Askısı #2", slot_type="Askı", group_name="Modern Koleksiyon", device_id="LOADCELL_BG_02", ip_address="192.168.3.102", branch_id=3, status="EMPTY"),
            ]
            for s in kc_slots + nis_slots + bg_slots:
                s.expected_weight = 0.0
                s.current_weight = 0.0
                s.tolerance_grams = 0.20
                s.port = 80
                s.is_online = True
                db.add(s)
            db.commit()

        # 4. Ürünleri kontrol et ve şubelere göre ata
        if db.query(models.Product).count() == 0:
            slots = {s.slot_number: s for s in db.query(models.RackSlot).all()}

            sample_products = [
                # --- KAPALIÇARŞI (branch_id=1) ---
                models.Product(
                    barcode="KYM-2024-001",
                    name="22 Ayar Trabzon Hasırı Altın Bilezik",
                    category="Bilezik",
                    purity="22K",
                    milyem=916,
                    gold_color="Sarı Altın",
                    weight_grams=28.60,
                    labor_cost=1500.0,
                    cost_price=69000.0,
                    price=86500.0,
                    image_url="https://images.unsplash.com/photo-1611591477461-c30d3ca45d90?w=600&auto=format&fit=crop&q=80",
                    description="El işçiliği özel tasarım 22 ayar geleneksel Trabzon hasır bilezik.",
                    craftsmanship_type="Trabzon Hasırı (El Örgüsü)",
                    surface_finish="Parlak & Kum Saten",
                    workshop_origin="Trabzon Hasır Atölyeleri Ekolü",
                    has_stones=False,
                    size_or_length="19 cm Standart Boy",
                    allow_engraving=True,
                    status="Vitrinde",
                    branch_id=1,
                    slot_id=slots[1].id if 1 in slots else None,
                    view_count=24,
                    total_inspection_seconds=360
                ),
                models.Product(
                    barcode="KYM-2024-002",
                    name="22 Ayar Kibrit Çöpü İnce Altın Bilezik",
                    category="Bilezik",
                    purity="22K",
                    milyem=916,
                    gold_color="Sarı Altın",
                    weight_grams=14.20,
                    labor_cost=700.0,
                    cost_price=34000.0,
                    price=42800.0,
                    image_url="https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=600&auto=format&fit=crop&q=80",
                    description="Günlük kullanıma uygun sade 22K kibrit çöpü bilezik.",
                    craftsmanship_type="Lazer Kesim & Tel Çekme",
                    surface_finish="Ayna Parlak",
                    workshop_origin="Kapalıçarşı Kalpakçılar Atölyesi",
                    has_stones=False,
                    size_or_length="6.2 cm Çap",
                    allow_engraving=False,
                    status="Vitrinde",
                    branch_id=1,
                    slot_id=slots[1].id if 1 in slots else None,
                    view_count=18,
                    total_inspection_seconds=240
                ),
                models.Product(
                    barcode="KYM-2024-003",
                    name="14 Ayar Baget Kesim Pırlantalı Altın Kolye",
                    category="Kolye",
                    purity="14K",
                    milyem=585,
                    gold_color="Beyaz Altın",
                    weight_grams=7.85,
                    labor_cost=850.0,
                    cost_price=18500.0,
                    price=24200.0,
                    image_url="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80",
                    description="Modern fasetalı baget pırlantalı şık kolye.",
                    craftsmanship_type="Mikromıhlama & İtalyan Form",
                    surface_finish="Rodyum Kaplama Parlak Beyaz",
                    workshop_origin="İtalyan Zincir & Mücevher Ekolü",
                    has_stones=True,
                    gemstone_type="Pırlanta",
                    diamond_carat=0.45,
                    diamond_color="F",
                    diamond_clarity="VS1",
                    diamond_cut="Very Good",
                    stone_shape="Baget & Yuvarlak",
                    stone_certificate="HRD Antwerp",
                    certificate_no="HRD-2024-884192",
                    size_or_length="45 cm",
                    status="Vitrinde",
                    branch_id=1,
                    slot_id=slots[2].id if 2 in slots else None,
                    view_count=38,
                    total_inspection_seconds=640
                ),

                # --- NİŞANTAŞI VIP SHOWROOM (branch_id=2) ---
                models.Product(
                    barcode="KYM-2024-004",
                    name="18 Ayar Doğal Seylan Safir & Pırlanta Yüzük",
                    category="Yüzük",
                    purity="18K",
                    milyem=750,
                    gold_color="Beyaz & Rose Altın",
                    weight_grams=6.40,
                    labor_cost=1500.0,
                    cost_price=28000.0,
                    price=42500.0,
                    image_url="https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop&q=80",
                    description="Merkezinde 1.20 karat doğal Seylan safiri, etrafında pavé dizim F renk berrak pırlantalar.",
                    craftsmanship_type="Özel Kuyumcu Heykeltıraş Ekolü",
                    surface_finish="Kombin Parlak",
                    workshop_origin="Kapalıçarşı Ermeni Usta Atölyesi",
                    has_stones=True,
                    gemstone_type="Doğal Safir & Pırlanta",
                    diamond_carat=0.35,
                    diamond_color="E",
                    diamond_clarity="VVS2",
                    diamond_cut="Excellent",
                    stone_shape="Oval Safir / Yuvarlak Pırlanta",
                    stone_certificate="GIA (Gemological Institute of America)",
                    certificate_no="GIA-59182301",
                    size_or_length="13 Numara",
                    allow_engraving=True,
                    status="Vitrinde",
                    branch_id=2,
                    slot_id=slots[5].id if 5 in slots else None,
                    view_count=52,
                    total_inspection_seconds=1140
                ),
                models.Product(
                    barcode="KYM-2024-005",
                    name="18 Ayar Damla Zümrüt & Markiz Gerdanlık",
                    category="Set",
                    purity="18K",
                    milyem=750,
                    gold_color="Sarı & Beyaz Altın",
                    weight_grams=34.80,
                    labor_cost=4500.0,
                    cost_price=145000.0,
                    price=210000.0,
                    image_url="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&auto=format&fit=crop&q=80",
                    description="Kolombiya kökenli doğal damla kesim zümrüt ve markiz kesim pırlantalarla bezenmiş el yapımı saray gerdanlığı.",
                    craftsmanship_type="Saray Kuyumculuğu El İşi",
                    surface_finish="Ayna Parlak",
                    workshop_origin="Nişantaşı Özel Tasarım Atölyesi",
                    has_stones=True,
                    gemstone_type="Kolombiya Zümrütü & Pırlanta",
                    diamond_carat=1.85,
                    diamond_color="D-E",
                    diamond_clarity="VVS1",
                    diamond_cut="Excellent",
                    stone_shape="Damla Zümrüt / Markiz Pırlanta",
                    stone_certificate="Gübelin Gem Lab",
                    certificate_no="GUB-882109",
                    size_or_length="42 cm",
                    status="Vitrinde",
                    branch_id=2,
                    slot_id=slots[6].id if 6 in slots else None,
                    view_count=65,
                    total_inspection_seconds=1450
                ),
                models.Product(
                    barcode="KYM-2024-006",
                    name="14 Ayar Tektaş Pırlantalı Zarif Yüzük",
                    category="Yüzük",
                    purity="14K",
                    milyem=585,
                    gold_color="Beyaz Altın",
                    weight_grams=3.40,
                    labor_cost=600.0,
                    cost_price=14000.0,
                    price=22000.0,
                    image_url="https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&auto=format&fit=crop&q=80",
                    description="Klasik 6 tırnaklı, ışığı kusursuz kıran solitaire tektaş pırlanta evlilik teklifi yüzüğü.",
                    craftsmanship_type="Klasik Solitaire Döküm & Mıhlama",
                    surface_finish="Ayna Parlak",
                    workshop_origin="Golden Guard Özel Koleksiyon",
                    has_stones=True,
                    gemstone_type="Pırlanta",
                    diamond_carat=0.30,
                    diamond_color="D",
                    diamond_clarity="VS2",
                    diamond_cut="Excellent",
                    stone_shape="Yuvarlak (Brilliant Cut)",
                    stone_certificate="IGI Uluslararası Sertifika",
                    certificate_no="IGI-90184255",
                    size_or_length="12 Numara",
                    allow_engraving=True,
                    status="Vitrinde",
                    branch_id=2,
                    slot_id=slots[5].id if 5 in slots else None,
                    view_count=41,
                    total_inspection_seconds=620
                ),

                # --- BAĞDAT CADDESİ (branch_id=3) ---
                models.Product(
                    barcode="KYM-2024-007",
                    name="24 Ayar 50 Gram Yatırımlık Külçe Altın (Nadir)",
                    category="Külçe / Yatırım",
                    purity="24K",
                    milyem=995,
                    gold_color="Has Altın",
                    weight_grams=50.00,
                    labor_cost=250.0,
                    cost_price=158000.0,
                    price=162500.0,
                    image_url="https://images.unsplash.com/photo-1610375461246-83df859d849d?w=600&auto=format&fit=crop&q=80",
                    description="Sertifikalı, seri numaralı, blister ambalajında 995.0 saflıkta yatırım altını.",
                    craftsmanship_type="Darphane / Rafineri Baskı",
                    surface_finish="Mat Saten",
                    workshop_origin="Nadir Rafineri",
                    has_stones=False,
                    size_or_length="Standart Külçe Boyutu",
                    status="Vitrinde",
                    branch_id=3,
                    slot_id=slots[9].id if 9 in slots else None,
                    view_count=19,
                    total_inspection_seconds=180
                ),
                models.Product(
                    barcode="KYM-2024-008",
                    name="14 Ayar Dorika Toplu Modern Kelepçe",
                    category="Bilezik",
                    purity="14K",
                    milyem=585,
                    gold_color="Üç Renk (Tricolor)",
                    weight_grams=11.20,
                    labor_cost=900.0,
                    cost_price=24500.0,
                    price=33800.0,
                    image_url="https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=600&auto=format&fit=crop&q=80",
                    description="İtalyan tasarım üç renk dorika toplu modern yaylı kelepçe bilezik.",
                    craftsmanship_type="İtalyan Dorika Dizim",
                    surface_finish="Elmas Kesim Parlak",
                    workshop_origin="Arezzo İtalya İthalatı",
                    has_stones=False,
                    size_or_length="18 cm",
                    status="Vitrinde",
                    branch_id=3,
                    slot_id=slots[10].id if 10 in slots else None,
                    view_count=28,
                    total_inspection_seconds=490
                )
            ]

            for p in sample_products:
                db.add(p)
            db.commit()

            # Slot beklenen ağırlıklarını asılı ürünlerin toplamına ayarla
            for s in db.query(models.RackSlot).all():
                prods = db.query(models.Product).filter(
                    models.Product.slot_id == s.id,
                    models.Product.status == "Vitrinde"
                ).all()
                total_w = sum(p.weight_grams for p in prods)
                s.expected_weight = round(total_w, 2)
                s.current_weight = round(total_w, 2)
                s.status = "NORMAL" if total_w > 0 else "EMPTY"
            db.commit()

            # Örnek Satışlar (Her şubeye satış atayarak ciro verilerini canlandır)
            if db.query(models.Sale).count() == 0:
                p1 = sample_products[1]
                p2 = sample_products[3]
                sale1 = models.Sale(
                    invoice_no="FAT-2024-001",
                    product_id=p1.id,
                    product_name=p1.name,
                    barcode=p1.barcode,
                    category=p1.category,
                    purity=p1.purity,
                    weight_grams=p1.weight_grams,
                    sale_price=42800.0,
                    cost_price=p1.cost_price,
                    profit_amount=42800.0 - (p1.cost_price or 34000.0),
                    branch_id=1,
                    user_id=staff_1.id if staff_1 else 1,
                    sold_by_name=staff_1.full_name if staff_1 else "Ahmet Yılmaz",
                    customer_name="Selin Kaya",
                    customer_phone="0532 555 10 20",
                    payment_method="Nakit + Kredi Kartı",
                    created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=6)
                )
                sale2 = models.Sale(
                    invoice_no="FAT-2024-002",
                    product_id=p2.id,
                    product_name=p2.name,
                    barcode=p2.barcode,
                    category=p2.category,
                    purity=p2.purity,
                    weight_grams=p2.weight_grams,
                    sale_price=42500.0,
                    cost_price=p2.cost_price,
                    profit_amount=42500.0 - (p2.cost_price or 28000.0),
                    branch_id=2,
                    user_id=staff_2.id if staff_2 else 2,
                    sold_by_name=staff_2.full_name if staff_2 else "Ayşe Demir",
                    customer_name="Zeynep Özdemir",
                    customer_phone="0555 888 90 00",
                    payment_method="Havale / EFT",
                    created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=2)
                )
                db.add_all([sale1, sale2])
                db.commit()

        # 5. Örnek Müşteri Hizmet Seansları ve Eksik Model Talepleri
        if db.query(models.ServiceSession).count() == 0:
            sample_sessions = [
                models.ServiceSession(
                    user_id=staff_1.id if staff_1 else 1,
                    customer_name="Selin Hanım",
                    started_at=datetime.datetime.utcnow() - datetime.timedelta(hours=3, minutes=20),
                    ended_at=datetime.datetime.utcnow() - datetime.timedelta(hours=3),
                    duration_minutes=20.0,
                    sale_made=True,
                    notes="Trabzon hasır bilezik denetildi ve satışı tamamlandı."
                ),
                models.ServiceSession(
                    user_id=staff_2.id if staff_2 else 2,
                    customer_name="Meltem Yılmaz",
                    started_at=datetime.datetime.utcnow() - datetime.timedelta(hours=2, minutes=15),
                    ended_at=datetime.datetime.utcnow() - datetime.timedelta(hours=2),
                    duration_minutes=15.0,
                    sale_made=False,
                    missing_model_notes="14 Ayar Baget Kelepçe Bilezik aradı, vitrinde olmadığı için alamadı.",
                    notes="Haftaya yeni modeller geldiğinde telefonla aranacak."
                )
            ]
            for s in sample_sessions:
                db.add(s)

            # Kayıp Talep / Aranan Modeller
            sample_demands = [
                models.LostDemandNote(
                    user_id=staff_2.id if staff_2 else 2,
                    user_name="Ayşe Demir",
                    requested_model="14 Ayar Baget Taşlı Kelepçe Bilezik",
                    category="Bilezik",
                    purity="14K",
                    approx_budget=35000.0,
                    notes="Meltem Hanım istedi, vitrinde bulunamadı. Tedarikçiye sorulmalı."
                ),
                models.LostDemandNote(
                    user_id=staff_1.id if staff_1 else 1,
                    user_name="Ahmet Yılmaz",
                    requested_model="22 Ayar Dorika Toplu Modern Gerdanlık",
                    category="Set",
                    purity="22K",
                    approx_budget=125000.0,
                    notes="Düğün müşterisi sordu, atölye üretimine verilebilir."
                )
            ]
            for d in sample_demands:
                db.add(d)

            db.commit()

        # 6. Örnek Denetim Logları
        if db.query(models.SystemLog).count() == 0:
            sample_logs = [
                models.SystemLog(
                    level="INFO",
                    module="SYSTEM",
                    message="Sistem ve IoT yük hücresi servisi başlatıldı (Port: 8000)",
                    user_name="Sistem Yöneticisi",
                    created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=5)
                ),
                models.SystemLog(
                    level="INFO",
                    module="AUTH",
                    message="Kullanıcı sisteme giriş yaptı: admin (Erdem Sarraf)",
                    user_id=admin.id if admin else None,
                    user_name="Erdem Sarraf",
                    created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=4)
                ),
                models.SystemLog(
                    level="INFO",
                    module="IOT",
                    message="Askı #1'e 2 model asıldı: Trabzon Hasırı (28.6g) + Kibrit Çöpü (14.2g) | Toplam Yük: 42.80g",
                    user_id=admin.id if admin else None,
                    user_name="Erdem Sarraf",
                    created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=3)
                )
            ]
            for l in sample_logs:
                db.add(l)
            db.commit()

        # 7. Güvenlik Konfigürasyonu
        if db.query(models.SecuritySystemConfig).count() == 0:
            sec_cfg = models.SecuritySystemConfig(
                night_mode_active=False,
                night_mode_auto=True,
                two_man_rule_enabled=True,
                two_man_threshold=100000.0,
                fake_weight_tolerance_grams=0.25,
                silent_panic_active=False
            )
            db.add(sec_cfg)
            db.commit()

        # 9. Ürün maliyet fiyatlarını doldur (eğer 0 ise)
        for p in db.query(models.Product).all():
            if not p.cost_price or p.cost_price == 0:
                p.cost_price = round(p.price * 0.82, 2)
            if not p.branch_id:
                p.branch_id = 1
        db.commit()

        # 10. Örnek MASAK Kaydı
        if db.query(models.MasakRecord).count() == 0:
            sample_sale = db.query(models.Sale).first()
            if sample_sale:
                masak_rec = models.MasakRecord(
                    sale_id=sample_sale.id,
                    customer_name=sample_sale.customer_name,
                    id_number="28475930214",
                    document_type="TCKN",
                    birth_year=1984,
                    nationality="T.C.",
                    phone=sample_sale.customer_phone or "0532 555 10 20",
                    address="Nişantaşı, Şişli, İstanbul",
                    occupation="Mimar / Şirket Ortağı",
                    transaction_amount=sample_sale.sale_price,
                    gold_weight_grams=sample_sale.weight_grams,
                    risk_status="UYGUN",
                    approved_by_user_id=1,
                    created_at=datetime.datetime.utcnow() - datetime.timedelta(days=1)
                )
                db.add(masak_rec)
                db.commit()

    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_initial_data()
    watchdog_task = asyncio.create_task(run_iot_watchdog())
    yield
    watchdog_task.cancel()

app = FastAPI(
    title="Golden Guard ERP & IoT Vitrin Güvenlik Sistemi",
    version="1.4.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

app.include_router(auth_router.router)
app.include_router(products.router)
app.include_router(iot.router)
app.include_router(sales.router)
app.include_router(analytics.router)
app.include_router(crm.router)
app.include_router(logs.router)
app.include_router(sessions.router)
app.include_router(inventory.router)
app.include_router(security.router)
app.include_router(legal.router)
app.include_router(branches.router)
app.include_router(rates.router)
app.include_router(purchases.router)
app.include_router(tenants.router)

# Otomatik Gece 03:00 Yedekleme Zamanlayıcısını Başlat
backup_service.run_nightly_backup_scheduler()

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": "Golden Guard IoT ERP API",
        "version": "1.4.0"
    }

@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await iot_service.manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        iot_service.manager.disconnect(websocket)
    except Exception:
        iot_service.manager.disconnect(websocket)
