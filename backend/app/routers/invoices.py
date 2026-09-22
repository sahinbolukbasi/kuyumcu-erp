"""Tenant-owned invoice drafts and immutable PDF snapshots; external issuance deferred."""
import base64
import datetime
import json
import uuid
from io import BytesIO
from zoneinfo import ZoneInfo
from PIL import Image, UnidentifiedImageError
from fastapi import APIRouter, Depends, HTTPException, Query, Body, UploadFile, File
from fastapi.responses import Response
from sqlalchemy import update
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from ..database import get_db
from .. import models, schemas, auth
from ..invoice_math import calculate
from ..invoice_pdf import render_pdf

router = APIRouter(prefix='/api/v1/invoices', tags=['Fatura taslakları'], dependencies=[Depends(auth.require_current_user)])


def get_or_create_company_profile(db, tenant_id=None):
    tenant_id = tenant_id or db.info.get('tenant_id')
    if not tenant_id:
        raise HTTPException(401, 'Firma oturumu gerekli.')
    profile = db.query(models.CompanyProfile).filter(models.CompanyProfile.tenant_id == tenant_id).first()
    if not profile:
        profile = models.CompanyProfile(tenant_id=tenant_id)
        db.add(profile); db.flush()
    return profile


@router.get('/company-profile', response_model=schemas.CompanyProfileOut)
def get_company_profile(db: Session = Depends(get_db)):
    profile = get_or_create_company_profile(db)
    db.commit(); db.refresh(profile)
    return profile


@router.put('/company-profile', response_model=schemas.CompanyProfileOut)
def update_company_profile(profile_in: schemas.CompanyProfileUpdate, admin=Depends(auth.require_admin), db: Session = Depends(get_db)):
    profile = get_or_create_company_profile(db, admin.tenant_id)
    for key, value in profile_in.model_dump(exclude_unset=True).items():
        if key in {'integrator_api_key','integrator_api_secret','integrator_password','integrator_username','integrator_api_url'} and value:
            raise HTTPException(422, 'Entegratör bağlantısı henüz etkin değil; gizli bilgiler kaydedilmez.')
        if key == 'default_currency' and value != 'TRY':
            raise HTTPException(422, 'Bu sürüm yalnızca TRY taslaklarını destekler.')
        if key in {'company_title','tax_office','tax_number','address','phone','email'} and value is None:
            raise HTTPException(422, 'Firma bilgileri null olamaz.')
        setattr(profile, key, value.strip() if isinstance(value, str) else value)
    db.add(models.SystemLog(module='INVOICE', level='INFO', message='Firma fatura profili güncellendi.', user_id=admin.id, user_name=admin.full_name))
    db.commit();db.refresh(profile)
    return profile


@router.post('/company-profile/logo', response_model=schemas.LogoUploadResponse)
async def upload_company_logo(file: UploadFile = File(...), admin=Depends(auth.require_admin), db: Session = Depends(get_db)):
    content = await file.read(2*1024*1024+1)
    if len(content) > 2*1024*1024:
        raise HTTPException(413, 'Logo en fazla 2 MB olabilir.')
    try:
        image = Image.open(BytesIO(content))
        if image.format not in {'PNG','JPEG','WEBP'} or image.width*image.height > 4_000_000:
            raise ValueError()
        image.load()
        clean = BytesIO();image.convert('RGB').save(clean, format='PNG')
    except (UnidentifiedImageError, ValueError, OSError, Image.DecompressionBombError):
        raise HTTPException(422, 'Geçerli PNG, JPEG veya WebP yükleyiniz (en fazla 4 megapiksel).')
    profile = get_or_create_company_profile(db, admin.tenant_id)
    profile.logo_base64 = base64.b64encode(clean.getvalue()).decode()
    profile.logo_mime_type = 'image/png';db.commit()
    return {'success':True,'message':'Logo kaydedildi.','logo_base64':profile.logo_base64,'logo_mime_type':'image/png'}


@router.delete('/company-profile/logo', response_model=schemas.LogoUploadResponse)
def delete_logo(admin=Depends(auth.require_admin), db: Session = Depends(get_db)):
    profile = get_or_create_company_profile(db, admin.tenant_id)
    profile.logo_base64 = None; profile.logo_mime_type = None; db.commit()
    return {'success':True,'message':'Logo silindi.'}


def model_for(kind):
    if kind == 'e-invoice': return models.EInvoice
    if kind == 'e-archive': return models.EArchiveInvoice
    raise HTTPException(404, 'Belge türü bulunamadı.')


def find_invoice(db, kind, invoice_id):
    model = model_for(kind)
    row = db.query(model).filter(model.id == invoice_id).first()
    if not row: raise HTTPException(404, 'Fatura taslağı bulunamadı.')
    return row


def create_draft(data, kind, admin, db):
    sale = db.query(models.Sale).filter(models.Sale.id == data.sale_id).first()
    if not sale: raise HTTPException(404, 'Satış bulunamadı.')
    profile = get_or_create_company_profile(db, admin.tenant_id)
    if any(not getattr(profile,key,'').strip() for key in ['company_title','tax_office','tax_number','address']):
        raise HTTPException(422, 'Firma unvanı, vergi dairesi, VKN/TCKN ve adresini tamamlayınız.')
    if not profile.tax_number.isdigit() or len(profile.tax_number) not in (10,11):
        raise HTTPException(422, 'Satıcı VKN 10, TCKN 11 rakam olmalıdır.')
    if profile.default_currency != 'TRY': raise HTTPException(422, 'Yalnız TRY desteklenir.')
    if data.recipient_registry == 'REGISTERED' and kind != 'e-invoice':
        raise HTTPException(422, 'e-Fatura kayıtlı alıcı için e-Fatura türünü seçiniz.')
    if data.recipient_registry == 'NOT_REGISTERED' and kind == 'e-invoice':
        raise HTTPException(422, 'e-Fatura kayıtlı olmayan alıcı için e-Arşiv türünü seçiniz.')
    buyer_tax = data.customer_tax_number or data.customer_id_number or ''
    if kind == 'e-invoice' and not buyer_tax:
        raise HTTPException(422, 'e-Fatura taslağı için alıcı VKN/TCKN gereklidir.')
    buyer_title = (data.customer_title or data.customer_name or sale.customer_name or '').strip()
    if not buyer_title or buyer_title == 'Müşteri': raise HTTPException(422, 'Alıcı adını / unvanını giriniz.')
    for model in (models.EInvoice, models.EArchiveInvoice):
        if db.query(model).filter(model.sale_id == sale.id, model.status != 'CANCELED').first():
            raise HTTPException(409, 'Bu satış için zaten bir fatura taslağı var.')
    totals = calculate(sale.sale_price, data.tax_treatment, data.metal_base)
    now = datetime.datetime.now(ZoneInfo('Europe/Istanbul'))
    try:
        sequence = db.query(models.InvoiceSequence).filter(models.InvoiceSequence.year == now.year).first()
        if not sequence:
            sequence = models.InvoiceSequence(tenant_id=admin.tenant_id, year=now.year, value=0)
            db.add(sequence); db.flush()
        db.execute(update(models.InvoiceSequence).where(models.InvoiceSequence.id == sequence.id).values(value=models.InvoiceSequence.value+1))
        db.refresh(sequence)
        # This is explicitly an internal draft reference, not a GİB invoice number.
        number = f'TAS-{admin.tenant_id}-{now.year}-{sequence.value:09d}'
        uid = str(uuid.uuid4())
        snapshot = {'number':number,'uuid':uid,'date':now.strftime('%d.%m.%Y %H:%M:%S %z'),
            'delivery_date':sale.created_at.strftime('%d.%m.%Y') if sale.created_at else '',
            'sale_reference':sale.invoice_no or str(sale.id),
            'document_type':'e-Fatura' if kind=='e-invoice' else 'e-Arşiv', 'recipient_registry':data.recipient_registry,
            'supplier':{'title':profile.company_title,'tax_number':profile.tax_number,'tax_office':profile.tax_office,
                'address':profile.address,'phone':profile.phone,'email':profile.email,'mersis':profile.mersis_no,'registry':profile.trade_registry_no},
            'buyer':{'title':buyer_title,'tax_number':buyer_tax,'tax_office':data.customer_tax_office or '',
                'address':data.customer_address,'phone':data.customer_phone or sale.customer_phone or '',
                'email':data.customer_email or sale.customer_email or ''},
            'items':[{'name':f'{sale.product_name} ({sale.purity}, {sale.weight_grams} g)', 'quantity':'1','unit':'ADET',
                'unit_price':totals['payable'],**totals}], 'totals':totals, 'tax_basis_note':data.tax_basis_note,'notes':data.notes or ''}
        values = dict(tenant_id=admin.tenant_id, invoice_number=number, invoice_uuid=uid, sale_id=sale.id,
            sale_invoice_no=sale.invoice_no, supplier_title=profile.company_title, supplier_tax_office=profile.tax_office,
            supplier_tax_number=profile.tax_number, currency='TRY', total_gross_amount=float(totals['net']),
            total_vat_amount=float(totals['vat']), total_vat_exempt_amount=float(totals['excluded']),
            total_payable_amount=float(totals['payable']), status='DRAFT', snapshot_json=json.dumps(snapshot,ensure_ascii=False),
            notes=data.notes, invoice_date=now.replace(tzinfo=None))
        if kind == 'e-invoice':
            values.update(customer_title=buyer_title, customer_tax_number=buyer_tax, customer_address=data.customer_address,
                supplier_address=profile.address, customer_tax_office=data.customer_tax_office, customer_email=snapshot['buyer']['email'], profile_id='DRAFT')
        else: values.update(customer_name=buyer_title, customer_id_number=buyer_tax, customer_email=snapshot['buyer']['email'],customer_phone=snapshot['buyer']['phone'])
        row = model_for(kind)(**values);db.add(row);db.flush()
        db.add(models.InvoiceSaleClaim(sale_id=sale.id, tenant_id=admin.tenant_id, invoice_type=kind, invoice_id=row.id))
        db.add(models.InvoiceItem(tenant_id=admin.tenant_id,invoice_type='EINVOICE' if kind=='e-invoice' else 'EARCHIVE',invoice_id=row.id,
            item_name=snapshot['items'][0]['name'],quantity=1,unit_price=float(totals['net']),line_total=float(totals['net']),
            vat_rate=float(totals['rate']),vat_amount=float(totals['vat']),is_vat_exempt=data.tax_treatment=='BULLION_EXEMPT'))
        db.add(models.SystemLog(module='INVOICE',level='INFO',message=f'Fatura taslağı oluşturuldu: {number}',user_id=admin.id,user_name=admin.full_name))
        db.commit();db.refresh(row)
        return row
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, 'Aynı satış / sıra için eşzamanlı işlem var. Listeyi yenileyiniz.')


@router.post('/e-invoice', response_model=schemas.EInvoiceOut)
def create_e_invoice(invoice_in: schemas.EInvoiceCreate, admin=Depends(auth.require_admin), db: Session = Depends(get_db)):
    return create_draft(invoice_in, 'e-invoice', admin, db)

@router.post('/e-archive', response_model=schemas.EArchiveInvoiceOut)
def create_e_archive_invoice(invoice_in: schemas.EArchiveInvoiceCreate, admin=Depends(auth.require_admin), db: Session = Depends(get_db)):
    return create_draft(invoice_in, 'e-archive', admin, db)

@router.post('/from-sale/{sale_id}')
def create_invoice_from_sale(sale_id:int, payload:schemas.InvoiceFromSale, admin=Depends(auth.require_admin), db:Session=Depends(get_db)):
    payload.sale_id = sale_id
    kind = 'e-invoice' if payload.invoice_type=='einvoice' else 'e-archive'
    row = create_draft(payload,kind,admin,db)
    schema = schemas.EInvoiceOut if kind=='e-invoice' else schemas.EArchiveInvoiceOut
    return {'type':kind,'invoice':schema.model_validate(row).model_dump()}

@router.get('', response_model=schemas.InvoiceListOut)
def list_invoices(status: str = None, search: str = None, skip:int=Query(0,ge=0),limit:int=Query(100,ge=1,le=200),db:Session=Depends(get_db)):
    results=[]
    for model, name in [(models.EInvoice,models.EInvoice.customer_title),(models.EArchiveInvoice,models.EArchiveInvoice.customer_name)]:
        query=db.query(model)
        if status: query=query.filter(model.status==status)
        if search: query=query.filter(model.invoice_number.ilike(f'%{search}%') | name.ilike(f'%{search}%'))
        results.append(query.order_by(model.created_at.desc()).offset(skip).limit(limit).all())
    return {'e_invoices':results[0],'e_archive_invoices':results[1]}

@router.get('/e-invoice/{invoice_id}', response_model=schemas.EInvoiceOut)
def detail_invoice(invoice_id:int,db:Session=Depends(get_db)):
    return find_invoice(db,'e-invoice',invoice_id)

@router.get('/e-archive/{invoice_id}', response_model=schemas.EArchiveInvoiceOut)
def detail_archive(invoice_id:int,db:Session=Depends(get_db)):
    return find_invoice(db,'e-archive',invoice_id)

@router.get('/{invoice_type}/{invoice_id}/pdf')
def download_pdf(invoice_type:str,invoice_id:int,db:Session=Depends(get_db)):
    row=find_invoice(db,invoice_type,invoice_id)
    if not row.snapshot_json:
        raise HTTPException(409,'Eski belgede doğrulanmış hesaplama ve satıcı/alıcı anlık kaydı yok. Önce kayıt incelemesi gerekli.')
    snapshot=json.loads(row.snapshot_json)
    if row.status=='CANCELED': snapshot['notes']='İPTAL EDİLMİŞ TASLAK. '+snapshot.get('notes','')
    return Response(render_pdf(snapshot),media_type='application/pdf',headers={'Content-Disposition':f'attachment; filename="{row.invoice_number}.pdf"','Cache-Control':'no-store'})

@router.get('/{invoice_type}/{invoice_id}/xml')
@router.get('/{invoice_type}/{invoice_id}/html')
def deferred_export(invoice_type:str,invoice_id:int,db:Session=Depends(get_db)):
    find_invoice(db,invoice_type,invoice_id)
    raise HTTPException(409,'XML/GİB aktarımı henüz etkin değil. PDF taslağını kullanınız.')

@router.put('/{invoice_type}/{invoice_id}/status')
def cancel_draft(invoice_type:str,invoice_id:int,status:str=Body(...,embed=True),admin=Depends(auth.require_admin),db:Session=Depends(get_db)):
    row=find_invoice(db,invoice_type,invoice_id)
    if status!='CANCELED' or row.status!='DRAFT':
        raise HTTPException(409,'Yalnızca taslak iptal edilebilir; resmi gönderim / kabul durumu elle atanamaz.')
    row.status='CANCELED'
    db.query(models.InvoiceSaleClaim).filter(models.InvoiceSaleClaim.sale_id==row.sale_id).delete()
    db.add(models.SystemLog(module='INVOICE',level='INFO',message=f'Taslak iptal edildi: {row.invoice_number}',user_id=admin.id,user_name=admin.full_name))
    db.commit()
    return {'status':row.status}

@router.post('/{invoice_type}/{invoice_id}/send-email')
def deferred_email(invoice_type:str,invoice_id:int,admin=Depends(auth.require_admin),db:Session=Depends(get_db)):
    find_invoice(db,invoice_type,invoice_id)
    raise HTTPException(409,'E-posta gönderim hizmeti henüz yapılandırılmadı. Gönderim yapılmadı.')
