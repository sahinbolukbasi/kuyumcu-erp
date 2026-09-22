// One authenticated transport for every application API call.
let tenantId = null;
export function setTenantContext(id) {
  tenantId = id == null ? null : String(id);
  if (typeof window !== 'undefined') {
    if (tenantId) sessionStorage.setItem('gg_tenant_context', tenantId);
    else sessionStorage.removeItem('gg_tenant_context');
  }
}
export function clearLegacyStorage() {
  if (typeof window === 'undefined') return;
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('kuyumcu_')) localStorage.removeItem(key);
  }
  sessionStorage.removeItem('gg_master_auth');
}
export async function apiFetch(input, init = {}) {
  const url = new URL(typeof input === 'string' ? input : input.url, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
  const headers = new Headers(init.headers);
  const isMaster = url.pathname.startsWith('/api/v1/saas') || url.pathname.startsWith('/api/v1/master-auth');
  const login = url.pathname.endsWith('/login');
  headers.delete('Authorization'); // No browser-readable bearer credential.
  if (typeof window !== 'undefined') {
    const context = tenantId || sessionStorage.getItem('gg_tenant_context');
    if (!isMaster && !login && context) headers.set('X-Tenant-ID', context);
    const cookieName = isMaster ? 'gg_master_csrf' : 'gg_csrf';
    const csrf = document.cookie.split('; ').find(value => value.startsWith(cookieName + '='));
    if (csrf) headers.set('X-CSRF-Token', decodeURIComponent(csrf.slice(cookieName.length + 1)));
  }
  const response = await globalThis.fetch(input, { ...init, headers, credentials: 'include', cache: 'no-store' });
  if (!isMaster && !login && [401, 409].includes(response.status) && typeof window !== 'undefined') {
    if (response.status === 401 || (await response.clone().json().catch(() => ({}))).detail?.code === 'TENANT_CHANGED') {
      window.dispatchEvent(new Event('gg-session-invalid'));
    }
  }
  return response;
}
