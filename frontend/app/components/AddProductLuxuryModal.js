'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Plus, 
  Scale, 
  Award, 
  Layers, 
  Camera, 
  Radio, 
  DollarSign, 
  Check, 
  X, 
  HelpCircle,
  Gem,
  Cpu,
  Feather
} from 'lucide-react';

export default function AddProductLuxuryModal({
  isOpen,
  onClose,
  onSubmit,
  slots = [],
  branches = []
}) {
  const [activeTab, setActiveTab] = useState('identity'); // identity, metal, craft, price, 4c, gallery, iot

  // Form State
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    category: 'Bilezik',
    branch_id: 1,

    // Maden & Ayar
    purity: '22K',
    milyem: 916,
    gold_color: 'Sarı Altın',
    weight_grams: '',
    size_or_length: '6.2 cm (Standart)',
    width_mm: '24 mm (İkili Sıra)',

    // Zanaatkâr & Künye
    craftsmanship_type: 'Trabzon Hasırı (El Örgüsü)',
    craftsmanship_hours: '42 Saat',
    wire_thickness: '0.28 mm',
    clasp_type: 'Çift Emniyetli Patentli Kilit',
    surface_finish: 'Parlak Cila & Saten',
    workshop_origin: 'Sarraf Erdem Özel Zanaatkâr Atölyesi No:04 · Kapalıçarşı Darphane Tescilli',
    description: '',

    // Fiyat
    price: '',
    labor_cost: '0',
    cost_price: '',
    discount_pct: '12.8',

    // 4C Taş
    has_stones: false,
    gemstone_type: 'Pırlanta',
    diamond_carat: '',
    diamond_color: 'G',
    diamond_clarity: 'VS1',
    diamond_cut: 'Excellent',
    stone_shape: 'Yuvarlak (Brillant)',
    certificate_no: '',

    // Görsel Galerisi
    image_url: '',
    image_lock_url: '',
    image_mesh_url: '',
    image_model_url: '',

    // IoT
    slot_id: ''
  });

  if (!isOpen) return null;

  // Hızlı 22K Trabzon Hasırı Şablonu Doldurucu
  const handleApplyTrabzonPreset = () => {
    const rnd = Math.floor(100 + Math.random() * 900);
    setFormData({
      barcode: `KYM-2025-${rnd}`,
      name: 'Trabzon Hasırı Çift Sıra Zarafet Kelepçe Bilezik',
      category: 'Bilezik',
      branch_id: 1,

      purity: '22K',
      milyem: 916,
      gold_color: 'Sarı Altın',
      weight_grams: '28.60',
      size_or_length: '6.2 cm (Standart)',
      width_mm: '24 mm (İkili Sıra)',

      craftsmanship_type: 'Trabzon Hasırı (El Örgüsü)',
      craftsmanship_hours: '42 Saat',
      wire_thickness: '0.28 mm',
      clasp_type: 'Çift Emniyetli Patentli Kilit',
      surface_finish: 'Parlak Cila & Saten',
      workshop_origin: 'Sarraf Erdem Özel Zanaatkâr Atölyesi No:04 · Kapalıçarşı Darphane Tescilli',
      description: 'Bu eser, Trabzon’un asırlık telkâri ve hasır örme zanaatkârları tarafından 0.28 mikron saf altın tellerin cımbız ve mengene kullanılmaksızın sadece parmak uçlarıyla ilmek ilmek örülmesiyle 42 saatlik saf el emeğiyle tamamlanmıştır. Bileziğin patentli kilit tablasında Sarraf Erdem zanaatkâr mühürü ve T.C. Darphane 916 ayar damgası yer almaktadır.',

      price: '86500',
      labor_cost: '0',
      cost_price: '74000',
      discount_pct: '12.8',

      has_stones: false,
      gemstone_type: 'Pırlanta',
      diamond_carat: '',
      diamond_color: 'G',
      diamond_clarity: 'VS1',
      diamond_cut: 'Excellent',
      stone_shape: 'Yuvarlak (Brillant)',
      certificate_no: '',

      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB16_iwXd6omm192OHmXn8HAcpmTfpReAh_T4gybuJLBho44zIWo9hDj96syd13by1giNIoAjrKiprHHEgIQlPoNDztoLKFvvBzvzMp_2mNcm1sU6MX1prmlDys3KNyG7pGq4hJacOomz0Xc4LVVHkcvKX9p1TA0wWE9cPakszcS5xUD50NDFyrujKYZ2qYzSJcWFQgDowTHyOhDVzczC5xEAQgUOhUG0-t0_76Zota1eYdqnvHp3Scyg',
      image_lock_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAe4q15N90CFnlI9YArPWFIr8qO3_dJipcOtaqvr9y5zOUsHXZJvsVvtuFyg0qrowzKBp6N-QpBRJXMUpivMtriOYBajD-3Y-48gAz-cgTYdh53aMHWvmb25ONgRyQ2ji0MAi0LTY5hsb49II1ge3d9eW8XN6D-n3Qk1BCbvMPSu06LLfDHNwpbL8AHstF1KxS-twnCjBU15aFQSZFh0Zw1acf0vyJKH6vT889ZCGdFFMFsB9vrU_X6dA',
      image_mesh_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBC6Vh7je2JqguD1DkZDHZpKk3y1OK0-NLT5jTuNhITBix-r3vx5hZ90gySLH4XtmOcKqPc7qYDSB0NJZ0HSmUgJuve2wEpqvQSCnYhHDl0vgTXTrj2BmjeVqcwR0xsfms1hOEDCAwfCEf1ayX7rrXesLrI9C7lWgqMbAj_EQPU94ro0VqYKM1Dxkyytu0LBLAruMeitND8QMu5R9L9k_Mxa1QCo1ZXJKN9EcYe0JHdIv2OWZyFD1cj6Q',
      image_model_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChnqjirm7ZTXgUOr0AefHe0pBtupuQxu9gCRpNTK4nf5AtK4h3MT2yduBufAXCbQWFJjZKOum7hmji3K69FDuI5gAiJdKYUiB-ZHY5oFVZqpSXFuQR8qQx_6RiKyu2IbUMlGJ1zMuc2mcorf_ydkWpdOm56BR6tN3A_j7vM_9ajN05oi8KOhDjq_FgsQeCIAPt0WGjz7M8Jg4Sb6MSbrsYw_1Q3ST8Ii9VgyJQa3N5Dt_qpC3hVQTF_g',

      slot_id: slots.length > 0 ? String(slots[0].id) : '1'
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Galeri görsellerini JSON formatında hazırla
    const additionalList = [];
    if (formData.image_lock_url) {
      additionalList.push({ title: 'Kilit Detayı', desc: formData.clasp_type || 'Patentli Kilit', url: formData.image_lock_url });
    }
    if (formData.image_mesh_url) {
      additionalList.push({ title: 'Hasır Örgü', desc: '0.28mm Mikro Doku', url: formData.image_mesh_url });
    }
    if (formData.image_model_url) {
      additionalList.push({ title: 'Bilek Prova', desc: 'Salon Çekimi', url: formData.image_model_url });
    }

    const payload = {
      ...formData,
      milyem: parseInt(formData.milyem || 916),
      weight_grams: parseFloat(formData.weight_grams),
      price: parseFloat(formData.price),
      labor_cost: parseFloat(formData.labor_cost || 0),
      cost_price: parseFloat(formData.cost_price || 0),
      slot_id: formData.slot_id ? parseInt(formData.slot_id) : null,
      diamond_carat: (formData.has_stones && formData.diamond_carat) ? parseFloat(formData.diamond_carat) : null,
      additional_images_json: additionalList.length > 0 ? JSON.stringify(additionalList) : null
    };

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto" onClick={onClose}>
      <div 
        className="bg-[#0e1017] border border-amber-500/40 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col overflow-hidden my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Başlığı */}
        <div className="bg-[#141622] border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-display text-white tracking-wide">
                SARRAF ERDEM — YENİ MÜCEVHER KAYIT & KÜNYE OLUŞTURMA
              </h2>
              <p className="text-[11px] font-mono text-amber-300">
                Sunum vitrini, 4C pırlanta standardı ve IoT tartım yuvası ile tam entegre
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyTrabzonPreset}
              className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold transition flex items-center gap-1.5 shadow"
              title="Stitch'teki 22K Trabzon Hasırı şablonunu anında yükler"
            >
              <Feather className="w-3.5 h-3.5" />
              <span>Örnek 22K Hasır Doldur</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sekmeler */}
        <div className="flex items-center gap-1 px-6 pt-3 bg-[#11131c] border-b border-white/10 overflow-x-auto text-xs font-mono">
          {[
            { id: 'identity', label: '1. Kimlik & Kategori', icon: Award },
            { id: 'metal', label: '2. Maden & Ayar', icon: Scale },
            { id: 'craft', label: '3. Zanaat & Künye', icon: Feather },
            { id: 'price', label: '4. Fiyatlandırma', icon: DollarSign },
            { id: '4c', label: '5. 4C Değerli Taş', icon: Gem },
            { id: 'gallery', label: '6. Çok Açılı Galeri', icon: Camera },
            { id: 'iot', label: '7. IoT Tartım Yuvası', icon: Cpu },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-semibold transition whitespace-nowrap ${active ? 'border-amber-400 text-amber-300 bg-amber-500/10 rounded-t-lg' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Alanları */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* SEKME 1: KİMLİK & KATEGORİ */}
          {activeTab === 'identity' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Barkod / RFID Seri No *</label>
                  <input
                    type="text"
                    required
                    placeholder="KYM-2025-001"
                    value={formData.barcode}
                    onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full bg-[#181a26] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#181a26] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Bilezik">Bilezik & Kelepçe</option>
                    <option value="Yüzük">Yüzük & Alyans</option>
                    <option value="Kolye">Kolye & Gerdanlık</option>
                    <option value="Küpe">Küpe</option>
                    <option value="Set">Takım / Set</option>
                    <option value="Ziynet">Ziynet / Yatırımlık</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Bulunduğu Şube</label>
                  <select
                    value={formData.branch_id}
                    onChange={e => setFormData({ ...formData, branch_id: parseInt(e.target.value) })}
                    className="w-full bg-[#181a26] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:border-amber-400 focus:outline-none"
                  >
                    {branches.length > 0 ? (
                      branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
                      ))
                    ) : (
                      <>
                        <option value={1}>Kapalıçarşı Ana Mağaza</option>
                        <option value={2}>Nişantaşı VIP Şube</option>
                        <option value={3}>Bağdat Caddesi Şube</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Model / Mücevher Tam Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="22 Ayar Trabzon Hasırı Çift Sıra Zarafet Kelepçe Bilezik"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#181a26] border border-white/10 text-white rounded-xl p-2.5 text-xs font-semibold focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Zanaatkâr Atölyesi / Menşei</label>
                <input
                  type="text"
                  placeholder="Sarraf Erdem Özel Zanaatkâr Atölyesi No:04 · Kapalıçarşı Darphane Tescilli"
                  value={formData.workshop_origin}
                  onChange={e => setFormData({ ...formData, workshop_origin: e.target.value })}
                  className="w-full bg-[#181a26] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* SEKME 2: MADEN, AYAR & AĞIRLIK */}
          {activeTab === 'metal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Ayar (Karat)</label>
                  <select
                    value={formData.purity}
                    onChange={e => {
                      const p = e.target.value;
                      const m = p === '24K' ? 1000 : (p === '22K' ? 916 : (p === '18K' ? 750 : (p === '14K' ? 585 : 333)));
                      setFormData({ ...formData, purity: p, milyem: m });
                    }}
                    className="w-full bg-[#181a26] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:border-amber-400 focus:outline-none"
                  >
                    <option value="24K">24K (Has Altın .999)</option>
                    <option value="22K">22K (.916 Milyem)</option>
                    <option value="18K">18K (.750 Milyem)</option>
                    <option value="14K">14K (.585 Milyem)</option>
                    <option value="8K">8K (.333 Milyem)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Milyem Değeri (‰)</label>
                  <input
                    type="number"
                    value={formData.milyem}
                    onChange={e => setFormData({ ...formData, milyem: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#181a26] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Maden Rengi</label>
                  <select
                    value={formData.gold_color}
                    onChange={e => setFormData({ ...formData, gold_color: e.target.value })}
                    className="w-full bg-[#181a26] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Sarı Altın">Sarı Altın</option>
                    <option value="Beyaz Altın">Beyaz Altın (Rodyumlu)</option>
                    <option value="Rose Altın">Rose / Pembe Altın</option>
                    <option value="Çift Renk">Çift Renk (Kombin)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Net Tartım (gr) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="28.60"
                    value={formData.weight_grams}
                    onChange={e => setFormData({ ...formData, weight_grams: e.target.value })}
                    className="w-full bg-[#181a26] border border-white/10 text-white rounded-xl p-2.5 text-xs font-bold text-amber-400 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Bileklik İç Çapı / Ölçü</label>
                  <input
                    type="text"
                    placeholder="6.2 cm (Standart)"
                    value={formData.size_or_length}
                    onChange={e => setFormData({ ...formData, size_or_length: e.target.value })}
                    className="w-full bg-[#181a26] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Genişlik (En)</label>
                  <input
                    type="text"
                    placeholder="24 mm (İkili Sıra)"
                    value={formData.width_mm}
                    onChange={e => setFormData({ ...formData, width_mm: e.target.value })}
                    className="w-full bg-[#181a26] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SEKME 3: ZANAATKÂR & KÜNYE */}
          {activeTab === 'craft' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">İşçilik Türü</label>
                  <select
                    value={formData.craftsmanship_type}
                    onChange={e => setFormData({ ...formData, craftsmanship_type: e.target.value })}
                    className="w-full bg-[#181a26] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Trabzon Hasırı (El Örgüsü)">Trabzon Hasırı (El Örgüsü)</option>
                    <option value="Telkâri & Filigran">Telkâri & Filigran</option>
                    <option value="Usta El İşçiliği">Usta El İşçiliği</option>
                    <option value="Döküm & Mikromıhlama">Döküm & Mikromıhlama</option>
                    <option value="Lazer Kesim & Tel Çekme">Lazer Kesim & Tel Çekme</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">İşçilik Süresi</label>
                  <input
                    type="text"
                    placeholder="42 Saat"
                    value={formData.craftsmanship_hours}
                    onChange={e => setFormData({ ...formData, craftsmanship_hours: e.target.value })}
                    className="w-full bg-[#181a26] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Tel Kalınlığı</label>
                  <input
                    type="text"
                    placeholder="0.28 mm"
                    value={formData.wire_thickness}
                    onChange={e => setFormData({ ...formData, wire_thickness: e.target.value })}
                    className="w-full bg-[#181a26] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Kilit / Güvenlik Tipi</label>
                  <input
                    type="text"
                    placeholder="Çift Emniyetli Patentli Kilit"
                    value={formData.clasp_type}
                    onChange={e => setFormData({ ...formData, clasp_type: e.target.value })}
                    className="w-full bg-[#181a26] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Yüzey İşlemi / Cila</label>
                  <select
                    value={formData.surface_finish}
                    onChange={e => setFormData({ ...formData, surface_finish: e.target.value })}
                    className="w-full bg-[#181a26] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Parlak Cila & Saten">Parlak Cila & Saten</option>
                    <option value="Ayna Parlak">Ayna Parlak</option>
                    <option value="Kum Saten (Mat)">Kum Saten (Mat)</option>
                    <option value="Oksitli / Antik Eskitme">Oksitli / Antik Eskitme</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Zanaatkâr Hikayesi & Müşteri Sunum Notu</label>
                <textarea
                  rows="3"
                  placeholder="Bu eser, Trabzon’un asırlık telkâri ve hasır örme zanaatkârları tarafından..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#181a26] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* SEKME 4: FİYATLANDIRMA & İNDİRİM */}
          {activeTab === 'price' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Satış Fiyatı (₺) *</label>
                  <input
                    type="number"
                    step="1"
                    required
                    placeholder="86500"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-[#181a26] border border-white/10 text-white rounded-xl p-2.5 text-base font-bold text-amber-400 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Alış / Atölye Ham Maliyeti (₺)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="74000"
                    value={formData.cost_price}
                    onChange={e => setFormData({ ...formData, cost_price: e.target.value })}
                    className="w-full bg-[#181a26] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">Sabit İşçilik Bedeli (₺)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="0"
                    value={formData.labor_cost}
                    onChange={e => setFormData({ ...formData, labor_cost: e.target.value })}
                    className="w-full bg-[#181a26] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1">VIP Peşin İndirim Oranı (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="12.8"
                    value={formData.discount_pct}
                    onChange={e => setFormData({ ...formData, discount_pct: e.target.value })}
                    className="w-full bg-[#181a26] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SEKME 5: 4C PIRLANTA & DEĞERLİ TAŞ */}
          {activeTab === '4c' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#181a26] rounded-xl border border-white/10 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_stones}
                    onChange={e => setFormData({ ...formData, has_stones: e.target.checked })}
                    className="accent-amber-400 w-4 h-4 rounded"
                  />
                  <span className="text-xs font-bold text-white">Bu parçada Pırlanta veya Değerli Taş Var mı?</span>
                </label>
                {formData.has_stones && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                    4C Standardı Aktif
                  </span>
                )}
              </div>

              {formData.has_stones && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">Taş Türü</label>
                      <select
                        value={formData.gemstone_type}
                        onChange={e => setFormData({ ...formData, gemstone_type: e.target.value })}
                        className="w-full bg-[#181a26] border border-white/10 text-white rounded-lg p-2 text-xs"
                      >
                        <option value="Pırlanta">Pırlanta</option>
                        <option value="Safir">Doğal Safir</option>
                        <option value="Zümrüt">Zümrüt</option>
                        <option value="Yakut">Yakut</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">Karat (ct)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.50"
                        value={formData.diamond_carat}
                        onChange={e => setFormData({ ...formData, diamond_carat: e.target.value })}
                        className="w-full bg-[#181a26] border border-white/10 text-white rounded-lg p-2 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">Renk (Color)</label>
                      <select
                        value={formData.diamond_color}
                        onChange={e => setFormData({ ...formData, diamond_color: e.target.value })}
                        className="w-full bg-[#181a26] border border-white/10 text-white rounded-lg p-2 text-xs"
                      >
                        <option value="D">D (Ekstra Beyaz)</option>
                        <option value="E">E</option>
                        <option value="F">F</option>
                        <option value="G">G (Top Wesselton)</option>
                        <option value="H">H (Wesselton)</option>
                        <option value="I-J">I-J</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">Berraklık</label>
                      <select
                        value={formData.diamond_clarity}
                        onChange={e => setFormData({ ...formData, diamond_clarity: e.target.value })}
                        className="w-full bg-[#181a26] border border-white/10 text-white rounded-lg p-2 text-xs"
                      >
                        <option value="FL/IF">FL / IF</option>
                        <option value="VVS1">VVS1</option>
                        <option value="VVS2">VVS2</option>
                        <option value="VS1">VS1</option>
                        <option value="VS2">VS2</option>
                        <option value="SI1">SI1</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">Kesim (Cut)</label>
                      <select
                        value={formData.diamond_cut}
                        onChange={e => setFormData({ ...formData, diamond_cut: e.target.value })}
                        className="w-full bg-[#181a26] border border-white/10 text-white rounded-lg p-2 text-xs"
                      >
                        <option value="Excellent">Excellent</option>
                        <option value="Very Good">Very Good</option>
                        <option value="Good">Good</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">Taş Şekli</label>
                      <select
                        value={formData.stone_shape}
                        onChange={e => setFormData({ ...formData, stone_shape: e.target.value })}
                        className="w-full bg-[#181a26] border border-white/10 text-white rounded-lg p-2 text-xs"
                      >
                        <option value="Yuvarlak (Brillant)">Yuvarlak (Brillant)</option>
                        <option value="Baget">Baget</option>
                        <option value="Prenses">Prenses</option>
                        <option value="Damla">Damla</option>
                        <option value="Zümrüt Kesim">Zümrüt Kesim</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">Sertifika No</label>
                      <input
                        type="text"
                        placeholder="HRD-2025-..."
                        value={formData.certificate_no}
                        onChange={e => setFormData({ ...formData, certificate_no: e.target.value })}
                        className="w-full bg-[#181a26] border border-white/10 text-white rounded-lg p-2 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SEKME 6: ÇOK AÇILI GALERİ */}
          {activeTab === 'gallery' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Müşteri sunum ekranındaki 5 farklı açı için görsel bağlantılarını giriniz.
              </p>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">1. Ön Teşhir (Ana Görsel URL) *</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formData.image_url}
                  onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full bg-[#181a26] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">2. Kilit Detayı (Yakın Çekim URL)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formData.image_lock_url}
                  onChange={e => setFormData({ ...formData, image_lock_url: e.target.value })}
                  className="w-full bg-[#181a26] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">3. Hasır Örgü / Mikro Doku URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formData.image_mesh_url}
                  onChange={e => setFormData({ ...formData, image_mesh_url: e.target.value })}
                  className="w-full bg-[#181a26] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">4. Bilek Prova / Salon Manken Çekimi URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formData.image_model_url}
                  onChange={e => setFormData({ ...formData, image_model_url: e.target.value })}
                  className="w-full bg-[#181a26] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* SEKME 7: IOT TARTIM YUVASI */}
          {activeTab === 'iot' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#141622] rounded-xl border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase">
                  <Cpu className="w-4 h-4" />
                  <span>ESP32 Tartım Hücresi (HX711) Eşleştirme</span>
                </div>
                <p className="text-xs text-slate-300">
                  Bu mücevheri fiziksel bir vitrin askısına veya tabla yuvasına eşlerseniz, müşteri ürünü eline aldığında sunum ekranı saniyesinde otomatik açılır.
                </p>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">Asılacak Vitrin Askısı / Tabla Yuvası</label>
                <select
                  value={formData.slot_id}
                  onChange={e => setFormData({ ...formData, slot_id: e.target.value })}
                  className="w-full bg-[#181a26] border border-white/10 text-white rounded-xl p-3 text-xs focus:border-amber-400 focus:outline-none"
                >
                  <option value="">-- Askıya Takma (Kasada veya Serbest Kalsın) --</option>
                  {slots.map(s => (
                    <option key={s.id} value={s.id}>
                      #{s.slot_number} — {s.label} ({s.group_name}) • {s.slot_type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Kaydet & Kapat Butonları */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition"
            >
              Vazgeç
            </button>

            <button
              type="submit"
              className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#aa820a] text-black font-bold text-xs hover:brightness-110 transition shadow-xl flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Mücevheri Vitrine & IoT Envanterine Kaydet</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
