"""Run: .venv/bin/python -m unittest discover -s backend/tests -v"""
import datetime
import unittest
from fastapi import FastAPI, Depends, HTTPException, Response
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from backend.app import auth, models
from backend.app.database import Base, get_db
from backend.app.routers import tenants, auth as users, module_settings, branches


class MasterHQTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
        Base.metadata.create_all(self.engine)
        self.sessions = sessionmaker(bind=self.engine)
        app = FastAPI()
        for router in (tenants.router, users.router, module_settings.router, branches.router):
            app.include_router(router)
        @app.get('/api/v1/products/test-access')
        def protected(user=Depends(auth.require_current_user)):
            return {'ok': True}
        def database():
            with self.sessions() as db:
                yield db
        app.dependency_overrides[get_db] = database
        self.client = TestClient(app)
        self.master = {}
        with self.sessions() as db:
            tenant = models.TenantCompany(company_code='TEST', company_name='Firma', owner_name='Yetkili', contact_phone='123', contact_email='test@example.com', city='İstanbul')
            db.add(tenant)
            db.flush()
            self.tenant_id = tenant.id
            db.add(models.TenantLicense(tenant_id=tenant.id, license_key='TEST-LIC', end_date=datetime.datetime.utcnow() + datetime.timedelta(days=30)))
            user = models.User(username='test', full_name='Test', password_hash=auth.hash_password('password'), role='ADMIN', tenant_id=tenant.id)
            db.add(user)
            db.commit()
            response = Response()
            member_session = auth.issue_session(db, response, user=user)
            self.member = {'Cookie': response.headers.getlist('set-cookie')[0].split(';')[0], 'X-CSRF-Token': member_session.csrf_token}
            response = Response()
            master_session = auth.issue_session(db, response, master=True)
            self.master = {'Cookie': response.headers.getlist('set-cookie')[0].split(';')[0], 'X-CSRF-Token': master_session.csrf_token}
        self.url = f'/api/v1/saas/tenants/{self.tenant_id}'

    def tearDown(self):
        self.client.close()
        self.engine.dispose()

    def test_edit_company_and_authorization(self):
        payload = dict(company_name='Yeni Firma', owner_name='Yetkili', contact_phone='456', contact_email='new@example.com', city='Ankara', tax_id='123')
        self.assertEqual(self.client.put(self.url, json=payload, headers=self.member).status_code, 401)
        self.assertEqual(self.client.put(self.url, json=payload, headers=self.master).status_code, 200)
        self.assertEqual(self.client.get('/api/v1/saas/tenants', headers=self.master).json()[0]['company_name'], 'Yeni Firma')
        payload['company_name'] = ' '
        self.assertEqual(self.client.put(self.url, json=payload, headers=self.master).status_code, 422)

    def test_suspend_blocks_login_and_existing_session_then_reopen(self):
        self.assertEqual(self.client.post(self.url + '/toggle-status', headers=self.master).status_code, 200)
        self.assertEqual(self.client.get('/api/v1/auth/me', headers=self.member).status_code, 403)
        self.assertEqual(self.client.post('/api/v1/auth/login', json={'username':'test','password':'password'}).status_code, 403)
        self.client.post(self.url + '/toggle-status', headers=self.master)
        self.assertEqual(self.client.get('/api/v1/auth/me', headers=self.member).status_code, 200)

    def test_modules_restrict_and_restore_access(self):
        url = self.url + '/modules'
        self.assertEqual(self.client.put(url, json={'inventory':False}, headers=self.member).status_code, 401)
        self.assertEqual(self.client.put(url, json={'inventory':False}, headers=self.master).status_code, 200)
        self.assertFalse(self.client.get('/api/v1/settings/modules', headers=self.member).json()['modules']['inventory'])
        self.assertEqual(self.client.get('/api/v1/products/test-access', headers=self.member).status_code, 403)
        self.client.put(url, json={'inventory':True}, headers=self.master)
        self.assertEqual(self.client.get('/api/v1/products/test-access', headers=self.member).status_code, 200)

    def test_license_limits_and_status_stay_consistent(self):
        url = self.url + '/license'
        self.assertEqual(self.client.put(url, json={'max_staff_count':-1}, headers=self.master).status_code, 422)
        self.assertEqual(self.client.put(url, json={'max_staff_count':0, 'status':'SUSPENDED', 'extend_months':1}, headers=self.master).status_code, 200)
        tenant = self.client.get('/api/v1/saas/tenants', headers=self.master).json()[0]
        self.assertFalse(tenant['is_active'])
        self.assertEqual(tenant['license']['max_staff_count'], 0)
        self.client.put(url, json={'status':'ACTIVE'}, headers=self.master)
        self.assertEqual(self.client.get('/api/v1/auth/me', headers=self.member).status_code, 200)

    def test_delete_preserves_records_and_prevents_reactivation(self):
        self.assertEqual(self.client.delete(self.url, headers=self.master).status_code, 200)
        self.assertEqual(self.client.get('/api/v1/saas/tenants', headers=self.master).json(), [])
        self.assertEqual(self.client.get('/api/v1/auth/me', headers=self.member).status_code, 403)
        self.assertEqual(self.client.post(self.url+'/toggle-status', headers=self.master).status_code, 404)
        with self.sessions() as db:
            self.assertEqual(db.query(models.TenantCompany).count(), 1)
            self.assertEqual(db.query(models.User).count(), 1)

    def test_zero_quotas_block_new_staff_branches_and_slots(self):
        self.client.put(self.url + '/license', json={'max_staff_count':0, 'max_branches_count':0, 'max_showcase_slots':0}, headers=self.master)
        response = self.client.post('/api/v1/auth/users', headers=self.member, json={'username':'new', 'full_name':'New', 'password':'long-test-password', 'role':'STAFF'})
        self.assertEqual(response.status_code, 400)
        response = self.client.post('/api/v1/branches', headers=self.member, json={'name':'New Branch'})
        self.assertEqual(response.status_code, 403)
        with self.sessions() as db:
            with self.assertRaises(HTTPException) as error:
                auth.ensure_slot_quota(db, self.tenant_id)
            self.assertEqual(error.exception.status_code, 403)

    def test_expired_license_blocks_existing_session(self):
        with self.sessions() as db:
            db.query(models.TenantLicense).first().end_date = datetime.datetime.utcnow() - datetime.timedelta(days=1)
            db.commit()
        self.assertEqual(self.client.get('/api/v1/auth/me', headers=self.member).status_code, 403)
