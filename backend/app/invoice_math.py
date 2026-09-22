"""TRY amounts use decimal arithmetic; sale prices are VAT-inclusive."""
from decimal import Decimal, ROUND_HALF_UP
from fastapi import HTTPException

CENT = Decimal('0.01')

def money(value):
    number = Decimal(str(value))
    if not number.is_finite() or number < 0:
        raise HTTPException(422, 'Tutar sonlu ve sıfırdan büyük/eşit olmalıdır.')
    return number.quantize(CENT, rounding=ROUND_HALF_UP)


def calculate(gross, treatment, metal_base=None):
    gross = money(gross)
    if gross <= 0:
        raise HTTPException(422, 'Satış tutarı sıfırdan büyük olmalıdır.')
    if treatment == 'GOLD_SPECIAL':
        if metal_base is None:
            raise HTTPException(422, 'Özel matrah için belgeli külçe altın bedeli zorunludur; işçilik tahmin edilmez.')
        excluded = money(metal_base)
        if excluded > gross:
            raise HTTPException(422, 'Külçe altın bedeli satış tutarını aşamaz.')
        taxable = ((gross - excluded) / Decimal('1.20')).quantize(CENT, rounding=ROUND_HALF_UP)
        vat = gross - excluded - taxable
        reason = '3065 sayılı KDV Kanunu 23/e - Altın ziynet eşyası / sikke altın özel matrahı'
        rate = Decimal('20')
    elif treatment == 'BULLION_EXEMPT':
        taxable, vat, excluded, rate = Decimal('0.00'), Decimal('0.00'), gross, Decimal('0')
        reason = '3065 sayılı KDV Kanunu 17/4-g - Külçe altın / külçe gümüş teslimi'
    elif treatment == 'STANDARD':
        excluded = Decimal('0.00')
        taxable = (gross / Decimal('1.20')).quantize(CENT, rounding=ROUND_HALF_UP)
        vat, rate = gross - taxable, Decimal('20')
        reason = 'Genel oran - %20 KDV'
    else:
        raise HTTPException(422, 'Vergi uygulamasını açıkça seçiniz.')
    return {key: str(value) for key, value in dict(payable=gross, net=gross-vat, taxable=taxable,
        excluded=excluded, vat=vat, rate=rate).items()} | {'reason': reason, 'treatment': treatment}
