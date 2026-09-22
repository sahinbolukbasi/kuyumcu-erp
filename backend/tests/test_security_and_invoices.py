import datetime
import json
import unittest
from io import BytesIO
from fastapi import FastAPI, Depends
from fastapi.testclient import TestClient
from pypdf import PdfReader
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from backend.app import auth, models
from backend.app.database import Base, get_db
from backend.app.routers import auth as users, invoices, products, crm, branches, cart, module_settings
from backend.app.invoice_math import calculate
from backend.app.security_middleware import SecurityMiddleware


class SecurityInvoiceTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.password = 'Long-unique-test-password!'
        cls.password_hash = auth.hash_password(cls.password)

    def setUp(self):
        self.engine = create_engine('sqlite://',connect_args={'check_same_thread':False},poolclass=StaticPool)
        Base.metadata.create_all(self.engine)
        self.sessions = sessionmaker(bind=self.engine)
        app=FastAPI();app.add_middleware(SecurityMiddleware)
        app.include_router(users.router)
        for router in [invoices.router, products.router,crm.router,branches.router,cart.router,module_settings.router]:
            app.include_router(router,dependencies=[Depends(auth.require_current_user)])
        def database():
            with self.sessions() as db: yield db
        app.dependency_overrides[get_db]=database
        self.app=app
        self.a=TestClient(app);self.b=TestClient(app)
        self.ids=[]
        with self.sessions() as db:
            for index in (1,2):
                tenant=models.TenantCompany(company_code=f'T{index}',company_name=f'Firma {index}',owner_name='Yetkili',contact_phone='123',contact_email='a@example.com',city='İstanbul')
                db.add(tenant);db.flush()
                branch=models.Branch(name=f'Mağaza {index}',tenant_id=tenant.id);db.add(branch);db.flush()
                user=models.User(username=f'user{index}',password_hash=self.password_hash,full_name=f'Kullanıcı {index}',role='ADMIN',tenant_id=tenant.id,branch_id=branch.id)
                db.add(user);db.flush()
                product=models.Product(tenant_id=tenant.id,branch_id=branch.id,barcode=f'P{index}',name=f'Ürün {index}',weight_grams=5,price=1200,purity='22K',category='Bilezik')
                db.add(product);db.flush()
                sale=models.Sale(tenant_id=tenant.id,branch_id=branch.id,user_id=user.id,product_id=product.id,product_name=product.name,category='Bilezik',purity='22K',weight_grams=5,sale_price=1200,customer_name='Ayşe Şahin',invoice_no=f'S{index}')
                db.add(sale);db.flush()
                db.add(models.CompanyProfile(tenant_id=tenant.id,company_title=f'Şirket {index}',tax_office='Şişli',tax_number='1234567890',address='İstanbul Şişli Mahallesi No 1',phone='123',email='s@example.com'))
                db.add(models.Customer(tenant_id=tenant.id,full_name=f'Müşteri {index}'))
                self.ids.append(dict(tenant=tenant.id,branch=branch.id,user=user.id,product=product.id,sale=sale.id))
            db.commit()
        for client,index in [(self.a,1),(self.b,2)]:
            res=client.post('/api/v1/auth/login',json={'username':f'user{index}','password':self.password})
            self.assertEqual(res.status_code,200,res.text)
            client.headers.update({'X-CSRF-Token':client.cookies['gg_csrf'],'X-Tenant-ID':str(index)})

    def tearDown(self):
        self.a.close();self.b.close();self.engine.dispose()

    def draft_payload(self,index=0):
        return dict(sale_id=self.ids[index]['sale'],customer_title='Ayşe Şahin',customer_address='İstanbul Kadıköy Mahallesi No 2',tax_treatment='GOLD_SPECIAL',metal_base='600.00',tax_basis_note='Has miktar ve tarihli külçe altın fiyatı - test verisi',recipient_registry='UNKNOWN')

    def test_anonymous_invalid_tokens_and_tenant_context(self):
        anonymous=TestClient(self.app)
        for path in ['/api/v1/products','/api/v1/crm/customers','/api/v1/invoices/company-profile','/api/v1/branches']:
            self.assertEqual(anonymous.get(path).status_code,401,path)
            self.assertEqual(anonymous.get(path,headers={'Authorization':'Bearer MASTER_SESSION_ROOT'}).status_code,401)
        self.assertEqual(self.a.get('/api/v1/auth/me',headers={'X-Tenant-ID':'2'}).status_code,409)
        self.assertIn('no-store',self.a.get('/api/v1/auth/me').headers['cache-control'])

    def test_csrf_origin_logout_and_cookie_flags(self):
        self.assertEqual(self.a.post('/api/v1/auth/logout',headers={'X-CSRF-Token':'bad'}).status_code,403)
        self.assertEqual(self.a.post('/api/v1/auth/logout',headers={'Origin':'https://evil.example'}).status_code,403)
        old=dict(self.a.cookies)
        self.assertEqual(self.a.post('/api/v1/auth/logout').status_code,200)
        self.a.cookies.update(old)
        self.assertEqual(self.a.get('/api/v1/auth/me').status_code,401)
        response=self.b.post('/api/v1/auth/login',json={'username':'user2','password':self.password})
        cookie=response.headers.get_list('set-cookie')[0]
        self.assertIn('HttpOnly',cookie);self.assertIn('SameSite=strict',cookie);self.assertNotIn('Domain=',cookie)
        self.assertEqual(response.json()['access_token'],'cookie-session')

    def test_lists_profiles_foreign_ids_and_writes(self):
        self.assertEqual([r['name'] for r in self.a.get('/api/v1/products').json()],['Ürün 1'])
        self.assertEqual([r['full_name'] for r in self.a.get('/api/v1/crm/customers').json()],['Müşteri 1'])
        self.assertEqual(self.a.get('/api/v1/invoices/company-profile').json()['company_title'],'Şirket 1')
        self.assertEqual(self.b.get('/api/v1/invoices/company-profile').json()['company_title'],'Şirket 2')
        response=self.a.put(f"/api/v1/auth/users/{self.ids[0]['user']}",json={'branch_id':self.ids[1]['branch']})
        self.assertEqual(response.status_code,422,response.text)
        response=self.a.post('/api/v1/invoices/e-archive',json=self.draft_payload(1))
        self.assertEqual(response.status_code,404,response.text)
        response=self.a.put(f"/api/v1/auth/users/{self.ids[1]['user']}",json={'full_name':'Attack'})
        self.assertEqual(response.status_code,404,response.text)

    def test_decimal_math_and_no_tax_estimation(self):
        totals=calculate('1200','GOLD_SPECIAL','600')
        self.assertEqual(totals['taxable'],'500.00');self.assertEqual(totals['vat'],'100.00');self.assertEqual(totals['payable'],'1200.00')
        self.assertEqual(calculate('1200','STANDARD')['vat'],'200.00')
        self.assertEqual(calculate('1200','BULLION_EXEMPT')['vat'],'0.00')
        payload=self.draft_payload();payload.pop('metal_base')
        self.assertEqual(self.a.post('/api/v1/invoices/e-archive',json=payload).status_code,422)

    def test_snapshot_pdf_duplicate_cancellation_and_isolation(self):
        response=self.a.post('/api/v1/invoices/e-archive',json=self.draft_payload())
        self.assertEqual(response.status_code,200,response.text)
        data=response.json();invoice_id=data['id']
        self.assertEqual(data['total_payable_amount'],1200)
        self.assertEqual(self.a.post('/api/v1/invoices/e-archive',json=self.draft_payload()).status_code,409)
        self.assertEqual(self.b.get(f'/api/v1/invoices/e-archive/{invoice_id}/pdf').status_code,404)
        self.a.put('/api/v1/invoices/company-profile',json={'company_title':'Değişen Unvan'})
        pdf=self.a.get(f'/api/v1/invoices/e-archive/{invoice_id}/pdf')
        self.assertEqual(pdf.status_code,200,pdf.text[:100] if pdf.status_code!=200 else '')
        self.assertTrue(pdf.content.startswith(b'%PDF-'))
        text=''.join(page.extract_text() for page in PdfReader(BytesIO(pdf.content)).pages)
        self.assertIn('Şirket 1',text);self.assertNotIn('Değişen Unvan',text);self.assertIn('Ayşe Şahin',text);self.assertIn('MALİ BELGE DEĞİLDİR',text)
        self.assertEqual(self.a.put(f'/api/v1/invoices/e-archive/{invoice_id}/status',json={'status':'SENT'}).status_code,409)
        self.assertEqual(self.a.get(f'/api/v1/invoices/e-archive/{invoice_id}/xml').status_code,409)
        self.assertEqual(self.a.put(f'/api/v1/invoices/e-archive/{invoice_id}/status',json={'status':'CANCELED'}).status_code,200)
        self.assertEqual(self.a.post('/api/v1/invoices/e-archive',json=self.draft_payload()).status_code,200)

    def test_scope_column_aggregates_and_bulk_update(self):
        with self.sessions() as db:
            db.info['tenant_id']=self.ids[0]['tenant']
            self.assertEqual(db.query(models.Product).count(),1)
            self.assertEqual(db.execute(select(models.Product.name)).scalars().all(),['Ürün 1'])
            db.query(models.Product).update({'name':'Only first'})
            db.commit()
        self.assertEqual(self.b.get('/api/v1/products').json()[0]['name'],'Ürün 2')
