# ==============================================================================
# 💎 HX711 - ESP8266 MicroPython Sürücüsü (Bit-Bang)
# ==============================================================================
# 20 kg'lık yük hücresi (load cell) ile birlikte çalışacak HX711 amplifikatör
# modülü için düşük seviyeli okuma sınıfı.
#
# Kullanım:
#   from hx711 import HX711
#   hx = HX711(dout_pin=4, sck_pin=5)   # D2 / D1
#   hx.tare()                            # Üzerinde ağırlık yokken çağırın
#   hx.set_scale(CALIBRATION_FACTOR)     # calibrate.py ile bulunan katsayı
#   print(hx.get_units())                # Gram cinsinden ağırlık
# ==============================================================================

import time
from machine import Pin


class HX711:
    def __init__(self, dout_pin, sck_pin, gain=128):
        self.dout = Pin(dout_pin, Pin.IN)
        self.sck = Pin(sck_pin, Pin.OUT)
        self.sck.value(0)

        self.OFFSET = 0
        self.SCALE = 1.0
        self.GAIN_PULSES = 1  # 128 kazanç -> okumadan sonra 1 ekstra darbe
        self.set_gain(gain)

    # -- Kazanç / Kanal Ayarı --------------------------------------------
    def set_gain(self, gain=128):
        if gain == 128:
            self.GAIN_PULSES = 1   # Kanal A, kazanç 128 (en yaygın)
        elif gain == 64:
            self.GAIN_PULSES = 3   # Kanal A, kazanç 64
        elif gain == 32:
            self.GAIN_PULSES = 2   # Kanal B, kazanç 32
        else:
            raise ValueError("Geçersiz kazanç: 128, 64 veya 32 olmalı")
        self.sck.value(0)
        self.read_raw()  # Ayarı uygulamak için bir okuma yap

    # -- Hazır mı? ---------------------------------------------------------
    def is_ready(self):
        return self.dout.value() == 0

    def wait_ready(self, timeout_ms=1000):
        t0 = time.ticks_ms()
        while not self.is_ready():
            if time.ticks_diff(time.ticks_ms(), t0) > timeout_ms:
                raise OSError("HX711 zaman aşımı: sensörden veri gelmiyor (kablo/bağlantı kontrol edin)")
            time.sleep_ms(1)

    # -- Ham 24-bit Okuma ----------------------------------------------------
    def read_raw(self):
        self.wait_ready()
        data = 0

        # Kesme (interrupt) çakışmalarını azaltmak için kritik bölge
        irq_state = machine_disable_irq()
        for _ in range(24):
            self.sck.value(1)
            data = (data << 1) | self.dout.value()
            self.sck.value(0)

        # Sıradaki okuma için kanal/kazanç darbeleri
        for _ in range(self.GAIN_PULSES):
            self.sck.value(1)
            self.sck.value(0)
        machine_enable_irq(irq_state)

        # 24-bit iki'nin tümleyeni (two's complement) -> işaretli tam sayı
        if data & 0x800000:
            data -= 0x1000000
        return data

    def read_average(self, times=10):
        total = 0
        for _ in range(times):
            total += self.read_raw()
            time.sleep_ms(2)
        return total / times

    # -- Dara (Tare) ve Kalibrasyon ------------------------------------------
    def tare(self, times=15):
        """Üzerinde hiçbir ağırlık yokken çağırın (sıfır noktası)."""
        self.OFFSET = self.read_average(times)
        return self.OFFSET

    def set_scale(self, scale):
        """calibrate.py betiği ile bulunan katsayıyı buraya girin."""
        if scale == 0:
            raise ValueError("Kalibrasyon katsayısı 0 olamaz")
        self.SCALE = scale

    def get_value(self, times=5):
        """Dara düşülmüş ham değer (kalibrasyon katsayısız)."""
        return self.read_average(times) - self.OFFSET

    def get_units(self, times=5):
        """Kalibre edilmiş, gram cinsinden ağırlık."""
        return self.get_value(times) / self.SCALE

    # -- Güç Yönetimi --------------------------------------------------------
    def power_down(self):
        self.sck.value(0)
        self.sck.value(1)

    def power_up(self):
        self.sck.value(0)


# machine.disable_irq/enable_irq için küçük yardımcılar
# (Bazı ESP8266 build'lerinde import sırası farklı olabildiği için burada sarmalandı)
try:
    import machine
    def machine_disable_irq():
        return machine.disable_irq()

    def machine_enable_irq(state):
        machine.enable_irq(state)
except Exception:
    def machine_disable_irq():
        return None

    def machine_enable_irq(state):
        pass
