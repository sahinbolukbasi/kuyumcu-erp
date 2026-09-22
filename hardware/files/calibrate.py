# ==============================================================================
# 💎 HX711 Kalibrasyon Yardımcısı
# ==============================================================================
# Bu betiği Thonny/ampy ile PANO ÇALIŞTIRIN (main.py yerine, tek seferlik).
#
# ADIMLAR:
#   1) Terazinin üzerinde HİÇBİR ŞEY YOKKEN betiği başlatın.
#   2) "Dara tamamlandı" mesajından sonra, ağırlığını TAM OLARAK bildiğiniz
#      bir nesneyi (örn. 500g'lık bir tartı ağırlığı, 1kg şeker paketi vb.)
#      teraziye koyun.
#   3) Sorulan yere o nesnenin GRAM cinsinden ağırlığını girin.
#   4) Çıkan CALIBRATION_FACTOR değerini config.py'deki
#      CALIBRATION_FACTOR satırına yapıştırın.
# ==============================================================================

import time
from hx711 import HX711
import config

print("=" * 60)
print("⚖️  HX711 KALİBRASYON ARACI")
print("=" * 60)

hx = HX711(dout_pin=config.HX711_DOUT_PIN, sck_pin=config.HX711_SCK_PIN)

print("\n1) Teraziyi BOŞALTIN (üzerinde hiçbir şey olmasın).")
input("   Hazır olduğunuzda ENTER'a basın...")

hx.set_scale(1.0)  # Ham değerleri görmek için kalibrasyonsuz bırak
hx.tare(times=20)
print(f"✅ Dara tamam. Ofset = {hx.OFFSET:.0f}")

print("\n2) Şimdi ağırlığını bildiğiniz bir nesneyi teraziye koyun.")
input("   Nesneyi koyduktan sonra ENTER'a basın...")

raw_value = hx.get_value(times=25)  # Dara düşülmüş ham değer
print(f"📟 Ham değer (dara düşülmüş): {raw_value:.0f}")

known_weight_str = input("\n3) Bu nesnenin GRAM cinsinden ağırlığını girin (örn. 1000): ")
try:
    known_weight_g = float(known_weight_str)
except ValueError:
    known_weight_g = config.KNOWN_CALIBRATION_WEIGHT_G
    print(f"⚠️ Geçersiz giriş, varsayılan {known_weight_g}g kullanılıyor.")

if known_weight_g <= 0:
    print("❌ Ağırlık 0'dan büyük olmalı. Betiği tekrar çalıştırın.")
else:
    calibration_factor = raw_value / known_weight_g
    print("\n" + "=" * 60)
    print(f"✅ BULUNAN KALİBRASYON KATSAYISI: {calibration_factor:.4f}")
    print("=" * 60)
    print("\nBu değeri config.py dosyasında şu satıra yazın:")
    print(f"    CALIBRATION_FACTOR = {calibration_factor:.4f}")
    print("\nDoğrulamak için: nesneyi terazide bırakıp aşağıdaki değerin")
    print("nesnenin gerçek ağırlığına yakın çıkıp çıkmadığını kontrol edin:")

    hx.set_scale(calibration_factor)
    hx.OFFSET = 0  # zaten dara düşülmüş ham değer kullandık, tekrar tare gerek
    test_val = raw_value / calibration_factor
    print(f"👉 Test sonucu: {test_val:.1f} g (gerçek: {known_weight_g:.1f} g olmalı)")
