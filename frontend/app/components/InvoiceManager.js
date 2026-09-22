'use client';
import React, { useEffect, useState } from 'react';
import { apiFetch as fetch } from '../lib/api';
import { Download, Plus, RefreshCw, X } from 'lucide-react';

const initialForm = { sale_id:'', invoice_type:'earchive', recipient_registry:'UNKNOWN', customer_title:'', customer_tax_number:'', customer_tax_office:'', customer_address:'', customer_email:'', tax_treatment:'', metal_base:'', tax_basis_note:'', notes:'' };
async function checked(response) {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(typeof body.detail === 'string' ? body.detail : 'Bilgileri kontrol ediniz; işlem tamamlanamadı.');
  }
  return response;
}
export default function InvoiceManager({ apiBase, token, currentUser }) {
  const [invoices,setInvoices] = useState([]);
  const [sales,setSales] = useState([]);
  const [form,setForm] = useState(initialForm);
  const [open,setOpen] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [message,setMessage] = useState('');
  const [search,setSearch] = useState('');
  const admin = currentUser?.role === 'ADMIN';
  const load = async () => {
    setError('');
    try {
      const response = await checked(await fetch(`${apiBase}/api/v1/invoices?limit=200`));
      const data = await response.json();
      setInvoices([...data.e_invoices.map(i=>({...i,kind:'e-invoice'})),...data.e_archive_invoices.map(i=>({...i,kind:'e-archive'}))].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)));
    } catch(e) {setError(e.message);}
  };
  useEffect(()=>{if(token) load();},[token,apiBase]);
  const create = async () => {
    setError('');setMessage('');
    try {
      const response = await checked(await fetch(`${apiBase}/api/v1/sales?limit=200`));
      setSales(await response.json());setForm(initialForm);setOpen(true);
    } catch(e) {setError(e.message);}
  };
  const change = (key,value) => setForm(previous=>({...previous,[key]:value}));
  const save = async event => {
    event.preventDefault();setBusy(true);setError('');
    try {
      const payload = {...form,sale_id:Number(form.sale_id),metal_base:form.tax_treatment==='GOLD_SPECIAL'?form.metal_base:null};
      await checked(await fetch(`${apiBase}/api/v1/invoices/from-sale/${form.sale_id}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}));
      setOpen(false);setMessage('Taslak kaydedildi. PDF indirilebilir; resmi fatura henüz düzenlenmedi.');await load();
    } catch(e) {setError(e.message);} finally {setBusy(false);}
  };
  const download = async invoice => {
    setError('');
    try {
      const response = await checked(await fetch(`${apiBase}/api/v1/invoices/${invoice.kind}/${invoice.id}/pdf`));
      const url = URL.createObjectURL(await response.blob());
      const a=document.createElement('a');a.href=url;a.download=`${invoice.invoice_number}.pdf`;a.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
    } catch(e) {setError(e.message);}
  };
  const cancel = async invoice => {
    if (!confirm(`${invoice.invoice_number} taslağı iptal edilsin mi?`)) return;
    setBusy(true);
    try {await checked(await fetch(`${apiBase}/api/v1/invoices/${invoice.kind}/${invoice.id}/status`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'CANCELED'})}));await load();}
    catch(e){setError(e.message);}finally{setBusy(false);}
  };
  const inputClass='w-full mt-1 p-2 bg-[#0c0e15] border border-slate-700 rounded-lg text-white';
  const matching=invoices.filter(i=>`${i.invoice_number} ${i.customer_title || i.customer_name}`.toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr')));
  return <section className="space-y-4">
    <div className="flex flex-wrap justify-between items-center gap-3"><div><h2 className="text-xl text-white font-bold">Fatura Taslakları & PDF</h2><p className="text-sm text-slate-400">Satış kaydından, belgeye özel hesaplama ve firma bilgileriyle taslak hazırlayın.</p></div>
      <div className="flex gap-2"><button className="btn-secondary" onClick={load} title="Yenile"><RefreshCw size={16}/></button>{admin&&<button className="btn-gold flex items-center gap-2" onClick={create}><Plus size={16}/>Taslak Oluştur</button>}</div>
    </div>
    <p className="p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-200 text-sm">Bu sürüm PDF taslağı üretir. PDF mali belge değildir. Resmi e-Fatura/e-Arşiv düzenleme işlemi GİB veya yetkili entegratörde tamamlanmalıdır. XML aktarımı henüz etkin değildir.</p>
    {error&&<p role="alert" className="text-rose-300">{error}</p>}{message&&<p role="status" className="text-emerald-300">{message}</p>}
    <input aria-label="Fatura ara" className={inputClass} placeholder="Taslak numarası veya alıcı ara" value={search} onChange={e=>setSearch(e.target.value)}/>
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-slate-400"><tr>{['Taslak No','Alıcı','Tarih','Tutar (TRY)','Durum','İşlemler'].map(h=><th key={h} className="p-3 text-left">{h}</th>)}</tr></thead>
      <tbody>{matching.map(i=><tr key={`${i.kind}-${i.id}`} className="border-t border-slate-800"><td className="p-3">{i.invoice_number}</td><td className="p-3">{i.customer_title||i.customer_name}</td><td className="p-3">{new Date(i.invoice_date).toLocaleDateString('tr-TR')}</td><td className="p-3">{i.total_payable_amount.toLocaleString('tr-TR',{minimumFractionDigits:2})}</td><td className="p-3">{i.status==='DRAFT'?'Taslak':i.status==='CANCELED'?'İptal':'Eski kayıt - inceleme gerekli'}</td><td className="p-3"><div className="flex gap-2"><button className="btn-secondary flex gap-1 items-center" onClick={()=>download(i)}><Download size={15}/>PDF</button>{admin&&i.status==='DRAFT'&&<button disabled={busy} onClick={()=>cancel(i)} className="btn-secondary text-rose-300">İptal Et</button>}</div></td></tr>)}</tbody>
    </table>{!matching.length&&<p className="p-6 text-center text-slate-400">Kayıt bulunamadı.</p>}</div>
    {open&&<div className="fixed inset-0 z-50 bg-black/80 p-4 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Fatura taslağı oluştur">
      <form onSubmit={save} className="w-full max-w-3xl max-h-[90vh] overflow-auto bg-[#12151f] rounded-2xl border border-slate-700 p-5 space-y-4">
        <div className="flex justify-between"><h3 className="font-bold text-lg">Fatura Taslağı Oluştur</h3><button type="button" aria-label="Kapat" disabled={busy} onClick={()=>setOpen(false)}><X/></button></div>
        {error&&<p role="alert" className="text-rose-300">{error}</p>}
        <label className="block text-sm">Satış<select required className={inputClass} value={form.sale_id} onChange={e=>{const sale=sales.find(s=>s.id===Number(e.target.value));setForm(p=>({...p,sale_id:e.target.value,customer_title:sale?.customer_name==='Müşteri'?'':sale?.customer_name||'',customer_email:sale?.customer_email||''}));}}><option value="">Satış seçiniz</option>{sales.map(s=><option key={s.id} value={s.id}>{s.invoice_no||s.id} - {s.product_name} - {s.sale_price} TRY</option>)}</select></label>
        <div className="grid md:grid-cols-2 gap-3">
          <label className="text-sm">Planlanan belge<select className={inputClass} value={form.invoice_type} onChange={e=>change('invoice_type',e.target.value)}><option value="earchive">e-Arşiv</option><option value="einvoice">e-Fatura</option></select></label>
          <label className="text-sm">Alıcının e-Fatura kaydı<select className={inputClass} value={form.recipient_registry} onChange={e=>change('recipient_registry',e.target.value)}><option value="UNKNOWN">Henüz doğrulanmadı (taslak)</option><option value="REGISTERED">Kayıtlı - kontrol edildi</option><option value="NOT_REGISTERED">Kayıtlı değil - kontrol edildi</option></select></label>
          {[['customer_title','Alıcı adı / unvanı',true],['customer_tax_number','VKN / TCKN',form.invoice_type==='einvoice'],['customer_tax_office','Alıcı vergi dairesi',false],['customer_email','Alıcı e-posta',false]].map(([key,label,required])=><label key={key} className="text-sm">{label}<input className={inputClass} required={required} type={key==='customer_email'?'email':'text'} value={form[key]} onChange={e=>change(key,e.target.value)}/></label>)}
        </div>
        <label className="block text-sm">Alıcı adresi<textarea required minLength={5} maxLength={1500} className={inputClass} value={form.customer_address} onChange={e=>change('customer_address',e.target.value)}/></label>
        <label className="block text-sm">Vergi uygulaması<select required className={inputClass} value={form.tax_treatment} onChange={e=>change('tax_treatment',e.target.value)}><option value="">Uygulamayı seçiniz</option><option value="GOLD_SPECIAL">Altın ziynet / sikke - KDV 23/e özel matrah</option><option value="BULLION_EXEMPT">Külçe altın / gümüş - KDV 17/4-g istisna</option><option value="STANDARD">Genel oran - %20 KDV</option></select></label>
        {form.tax_treatment==='GOLD_SPECIAL'&&<label className="block text-sm">Matrah dışındaki külçe altın bedeli (TRY)<input className={inputClass} type="number" min="0" step="0.01" required value={form.metal_base} onChange={e=>change('metal_base',e.target.value)}/></label>}
        <label className="block text-sm">Vergi / matrah dayanağı<textarea required minLength={5} maxLength={1500} placeholder="Ürün niteliği, has miktar, kullanılan külçe altın fiyatı ve tarih/kaynak gibi hesaplama dayanağı" className={inputClass} value={form.tax_basis_note} onChange={e=>change('tax_basis_note',e.target.value)}/></label>
        <p className="text-xs text-slate-400">Satış tutarı KDV dahil kabul edilir. Vergi tutarı bunun içinden ayrıştırılır. VKN bulunması tek başına e-Fatura kaydı anlamına gelmez.</p>
        <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" disabled={busy} onClick={()=>setOpen(false)}>Vazgeç</button><button type="submit" disabled={busy} className="btn-gold">{busy?'Kaydediliyor...':'Taslağı Kaydet'}</button></div>
      </form>
    </div>}
  </section>;
}
