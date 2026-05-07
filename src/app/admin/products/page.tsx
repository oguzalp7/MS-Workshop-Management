"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";

interface ProductMedia {
  url: string;
  type: "image" | "video";
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  active: boolean;
  media: ProductMedia[];
  categories: { id: string, name: string }[];
  tieredPrices: { priceTierId: string, price: number, priceTier: { name: string } }[];
}

type SortField = "name" | "price" | "active";
type SortOrder = "asc" | "desc";

function FloatingInput({ label, type = "text", value, onChange, placeholder, ...props }: any) {
  return (
    <div className="relative group">
      <input 
        type={type}
        value={value}
        onChange={onChange}
        placeholder=" "
        className="peer w-full px-5 py-4 rounded-2xl bg-secondary/50 border-2 border-transparent focus:border-foreground/10 focus:bg-card outline-none transition-all font-bold text-sm pt-7"
        {...props}
      />
      <label className="absolute left-5 top-2.5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-xs peer-placeholder-shown:tracking-widest peer-focus:top-2.5 peer-focus:text-[9px] peer-focus:tracking-[0.2em] pointer-events-none">
        {label}
      </label>
    </div>
  );
}

function ProductFormInternal({ data, onChange, tiers, categories, onSave, loading, title, hideFooter = false }: any) {
  const [newMedia, setNewMedia] = useState({ url: "", type: "image" });

  const addMedia = () => {
    if (!newMedia.url) return;
    onChange({ ...data, media: [...(data.media || []), newMedia] });
    setNewMedia({ url: "", type: "image" });
  };

  const removeMedia = (idx: number) => {
    onChange({ ...data, media: data.media.filter((_: any, i: number) => i !== idx) });
  };

  const toggleCategory = (catId: string) => {
    const current = data.categories || [];
    const updated = current.includes(catId) 
      ? current.filter((id: string) => id !== catId)
      : [...current, catId];
    onChange({ ...data, categories: updated });
  };

  const updateTierPrice = (tierId: string, val: string) => {
    onChange({ 
      ...data, 
      tieredPrices: { ...(data.tieredPrices || {}), [tierId]: val } 
    });
  };

  return (
    <div className="p-8 space-y-10 max-h-[85vh] overflow-y-auto no-scrollbar">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">{title}</h2>
        {loading && <div className="animate-spin h-4 w-4 border-2 border-foreground border-t-transparent rounded-full" />}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        {/* Basic Info & Pricing */}
        <div className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">TEMEL BİLGİLER</h3>
            <FloatingInput label="Ürün Adı" value={data.name} onChange={(e: any) => onChange({...data, name: e.target.value})} />
            <div className="relative group">
              <textarea 
                placeholder=" "
                value={data.description}
                onChange={(e) => onChange({...data, description: e.target.value})}
                className="peer w-full px-5 py-4 rounded-2xl bg-secondary/50 border-2 border-transparent focus:border-foreground/10 focus:bg-card outline-none transition-all font-bold text-sm pt-8 min-h-[120px] resize-none"
              />
              <label className="absolute left-5 top-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-xs peer-placeholder-shown:tracking-widest peer-focus:top-3 peer-focus:text-[9px] peer-focus:tracking-[0.2em] pointer-events-none">
                Açıklama
              </label>
            </div>
          </section>

          <section className="space-y-4">
             <h3 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">FİYATLANDIRMA</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-full">
                  <FloatingInput label="Standart Taban Fiyat (₺)" type="number" step="0.01" value={data.price} onChange={(e: any) => onChange({...data, price: e.target.value})} />
                </div>
                {tiers.map((tier: any) => (
                  <FloatingInput 
                    key={tier.id}
                    label={`${tier.name} Fiyatı (₺)`} 
                    type="number" 
                    step="0.01" 
                    value={data.tieredPrices?.[tier.id] || ""} 
                    onChange={(e: any) => updateTierPrice(tier.id, e.target.value)}
                    placeholder={`${(data.price * (1 + tier.surchargePercentage/100)).toFixed(2)} (otomatik)`}
                  />
                ))}
             </div>
             <p className="text-[8px] font-bold text-muted uppercase tracking-widest text-center opacity-40 italic">Boş bırakılan alanlar otomatik hesaplanacaktır</p>
          </section>

          <section className="space-y-4">
            <h3 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">SINIFLANDIRMA</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2 ${data.categories?.includes(cat.id) ? "bg-foreground text-background border-foreground shadow-lg" : "bg-secondary/50 text-muted-foreground border-transparent hover:border-border"}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Media Management */}
        <div className="space-y-8">
          <section className="space-y-6">
            <h3 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">MEDYA DOSYALARI ({data.media?.length || 0})</h3>
            
            {/* Media Adder */}
            <div className="p-6 rounded-[2rem] bg-secondary/30 border border-border/50 space-y-4">
               <div className="flex gap-4">
                  <div className="flex-1">
                    <FloatingInput label="Dosya URL" value={newMedia.url} onChange={(e: any) => setNewMedia({...newMedia, url: e.target.value})} />
                  </div>
                  <div className="w-24">
                    <select 
                      value={newMedia.type}
                      onChange={(e) => setNewMedia({...newMedia, type: e.target.value as any})}
                      className="w-full h-full pt-4 rounded-2xl bg-card border-2 border-transparent text-[10px] font-black uppercase outline-none px-4"
                    >
                      <option value="image">GÖRSEL</option>
                      <option value="video">VİDEO</option>
                    </select>
                  </div>
               </div>
               <button 
                onClick={addMedia}
                className="w-full py-3 rounded-xl bg-foreground text-background text-[9px] font-black uppercase tracking-[0.2em] shadow-xl"
               >
                 Galeriye Ekle
               </button>
            </div>

            {/* Media Preview Grid */}
            <div className="grid grid-cols-2 gap-4">
              {data.media?.map((m: any, i: number) => (
                <div key={i} className="group relative aspect-square rounded-2xl bg-secondary/50 overflow-hidden border border-border/50">
                   {m.type === "video" ? (
                      <video src={m.url} className="w-full h-full object-cover" muted />
                   ) : (
                      <img src={m.url} className="w-full h-full object-cover" alt="" />
                   )}
                   <button 
                    onClick={() => removeMedia(i)}
                    className="absolute top-2 right-2 p-2 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                   </button>
                   <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/40 text-[7px] font-black text-white uppercase tracking-tighter">
                     {m.type === 'image' ? 'GÖRSEL' : 'VİDEO'}
                   </div>
                </div>
              ))}
              {(!data.media || data.media.length === 0) && (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-border/30 rounded-2xl">
                   <p className="text-[8px] font-black text-muted uppercase tracking-widest">Dosya bulunmuyor</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {!hideFooter && (
        <div className="pt-8 border-t border-border/50">
          <button 
            onClick={onSave} 
            disabled={loading} 
            className="w-full py-5 rounded-[2rem] bg-foreground text-background font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? "Hazırlanıyor..." : "Ürünü Kaydet"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Creation Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<any>({ name: "", price: 0, description: "", media: [], categories: [], tieredPrices: {} });
  const [createLoading, setCreateLoading] = useState(false);

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchForms, setBatchForms] = useState<any[]>([{ name: "", price: 0, description: "", media: [], categories: [], tieredPrices: {} }]);
  const [batchLoading, setBatchLoading] = useState(false);

  // Sorting & Filtering
  const [filterCategory, setFilterCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Excel-like Batch Edit
  const [isBatchEditing, setIsBatchEditing] = useState(false);
  const [draftProducts, setDraftProducts] = useState<Record<string, any>>({});
  const [saveLoading, setSaveLoading] = useState(false);

  async function fetchData() {
    try {
      const [pRes, cRes, tRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/categories"),
        fetch("/api/admin/price-tiers")
      ]);
      if (pRes.ok) {
        const data = await pRes.json();
        setProducts(data.products);
      }
      if (cRes.ok) {
        const data = await cRes.json();
        setCategories(data.categories);
      }
      if (tRes.ok) {
        const data = await tRes.json();
        setTiers(data.tiers);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const processedProducts = useMemo(() => {
    let result = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === "" || p.categories.some(c => c.id === filterCategory);
      return matchesSearch && matchesCategory;
    });

    result.sort((a, b) => {
      let valA: any = (a as any)[sortField];
      let valB: any = (b as any)[sortField];

      if (draftProducts[a.id]?.[sortField] !== undefined) valA = draftProducts[a.id][sortField];
      if (draftProducts[b.id]?.[sortField] !== undefined) valB = draftProducts[b.id][sortField];

      if (typeof valA === "string") {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === "asc" ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

    return result;
  }, [products, searchQuery, filterCategory, sortField, sortOrder, draftProducts]);

  const updateDraft = (id: string, field: string, value: any) => {
    setDraftProducts(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const updateDraftTier = (productId: string, tierId: string, value: any) => {
    const currentTiers = draftProducts[productId]?.tieredPrices || {};
    updateDraft(productId, "tieredPrices", { ...currentTiers, [tierId]: value });
  };

  async function saveBatchEdits() {
    setSaveLoading(true);
    const updates = Object.entries(draftProducts).map(([id, fields]) => ({
      id,
      ...fields
    }));

    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      if (res.ok) {
        await fetchData();
        setIsBatchEditing(false);
        setDraftProducts({});
      }
    } catch { /* ignore */ } finally {
      setSaveLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto pb-12 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ürün Kataloğu</h1>
          <p className="text-muted text-xs uppercase tracking-[0.3em] mt-2 font-bold opacity-60">Stok Yönetim Merkezi</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {isBatchEditing ? (
            <>
              <button onClick={() => { setIsBatchEditing(false); setDraftProducts({}); }} className="px-6 py-2.5 rounded-xl text-xs font-bold text-muted hover:text-foreground transition-all">İPTAL</button>
              <button onClick={saveBatchEdits} disabled={saveLoading} className="px-8 py-2.5 rounded-xl bg-foreground text-background text-xs font-bold hover:opacity-90 shadow-lg transition-all animate-pulse-subtle">
                {saveLoading ? "KAYDEDİLİYOR..." : "DEĞİŞİKLİKLERİ KAYDET"}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setIsBatchEditing(true)} className="px-6 py-2.5 rounded-xl text-xs font-bold bg-secondary text-foreground hover:bg-secondary/80 transition-all">TOPLU DÜZENLE</button>
              <button onClick={() => setShowBatchModal(true)} className="px-6 py-2.5 rounded-xl text-xs font-bold bg-secondary text-foreground hover:bg-secondary/80 transition-all">TOPLU EKLE</button>
              <button onClick={() => setShowCreateModal(true)} className="px-6 py-2.5 rounded-xl text-xs font-bold bg-foreground text-background hover:opacity-90 transition-all shadow-lg">YENİ ÜRÜN</button>
            </>
          )}
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <input type="text" placeholder="Katalogda ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border focus:outline-none focus:ring-1 focus:ring-foreground transition-all text-sm" />
          <svg className="absolute left-3.5 top-3 text-muted" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-4 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-1 focus:ring-foreground transition-all min-w-[200px] appearance-none">
          <option value="">Tüm Kategoriler</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Products Table */}
      <div className={`bg-card border border-border rounded-2xl overflow-x-auto shadow-sm transition-all ${isBatchEditing ? "ring-2 ring-foreground/10" : ""}`}>
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-secondary/30">
              <th className="px-6 py-4 cursor-pointer hover:bg-secondary/50 transition-colors group" onClick={() => handleSort("name")}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Ürün</span>
                  {sortField === "name" && (sortOrder === "asc" ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m18 15-6-6-6 6"/></svg> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6"/></svg>)}
                </div>
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted">Kategoriler</th>
              <th className="px-6 py-4 text-right">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Taban Fiyat</span>
              </th>
              {tiers.map(tier => (
                <th key={tier.id} className="px-6 py-4 text-right">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600/60">{tier.name}</span>
                </th>
              ))}
              <th className="px-6 py-4 text-center">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Durum</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {processedProducts.map((p) => {
              const firstMedia = p.media && p.media[0];
              const isEdited = draftProducts[p.id] !== undefined;
              const displayPrice = draftProducts[p.id]?.price ?? p.price;
              const displayName = draftProducts[p.id]?.name ?? p.name;
              const displayActive = draftProducts[p.id]?.active ?? p.active;

              return (
                <tr 
                  key={p.id} 
                  onClick={() => !isBatchEditing && router.push(`/admin/products/${p.id}`)}
                  className={`transition-all group ${isBatchEditing ? "bg-card" : "hover:bg-secondary/20 cursor-pointer"} ${isEdited ? "bg-foreground/[0.02]" : ""}`}
                >
                  <td className="px-6 py-4 min-w-[250px]">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden border border-border/50 flex-shrink-0">
                        {firstMedia ? (firstMedia.type === "video" ? <video src={firstMedia.url} className="w-full h-full object-cover" muted /> : <img src={firstMedia.url} alt="" className="w-full h-full object-cover" />) : <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-muted-foreground">?</div>}
                      </div>
                      <div className="flex-1">
                        {isBatchEditing ? (
                          <input 
                            type="text" 
                            value={displayName}
                            onChange={(e) => updateDraft(p.id, "name", e.target.value)}
                            className="w-full px-2 py-1 rounded bg-secondary/50 border border-transparent focus:border-foreground focus:outline-none text-sm font-bold"
                          />
                        ) : (
                          <>
                            <span className="font-bold text-sm block group-hover:underline">{displayName}</span>
                            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight opacity-50">ID: {p.id.split("-")[0]}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {p.categories.map(c => <span key={c.id} className="px-2 py-0.5 rounded-md bg-secondary text-[9px] font-bold text-muted-foreground uppercase">{c.name}</span>)}
                      {p.categories.length === 0 && <span className="text-[9px] text-muted italic">Kategorisiz</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isBatchEditing ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-muted text-[10px] font-bold">₺</span>
                        <input 
                          type="number" 
                          step="0.01"
                          value={displayPrice}
                          onChange={(e) => updateDraft(p.id, "price", parseFloat(e.target.value))}
                          className="w-24 px-2 py-1 rounded bg-secondary/50 border border-transparent focus:border-foreground focus:outline-none text-sm font-bold text-right"
                        />
                      </div>
                    ) : (
                      <span className="font-bold text-sm">₺{Number(displayPrice).toFixed(2)}</span>
                    )}
                  </td>
                  {tiers.map(tier => {
                    const tierPriceObj = p.tieredPrices?.find(tp => tp.priceTierId === tier.id);
                    const currentTierPrice = draftProducts[p.id]?.tieredPrices?.[tier.id] ?? tierPriceObj?.price ?? (displayPrice * (1 + (tier.surchargePercentage / 100)));
                    
                    return (
                      <td key={tier.id} className="px-6 py-4 text-right">
                        {isBatchEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-muted text-[10px] font-bold text-blue-600/40">₺</span>
                            <input 
                              type="number" 
                              step="0.01"
                              value={currentTierPrice}
                              onChange={(e) => updateDraftTier(p.id, tier.id, parseFloat(e.target.value))}
                              className="w-24 px-2 py-1 rounded bg-blue-600/5 border border-transparent focus:border-blue-600/20 focus:outline-none text-sm font-bold text-right text-blue-600"
                            />
                          </div>
                        ) : (
                          <span className="font-black text-sm text-blue-600">₺{Number(currentTierPrice).toFixed(2)}</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-6 py-4 text-center">
                    {isBatchEditing ? (
                      <button 
                        onClick={() => updateDraft(p.id, "active", !displayActive)}
                        className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase transition-all ${displayActive ? "bg-green-500 text-white shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-muted text-muted-foreground"}`}
                      >
                        {displayActive ? "AKTİF" : "PASİF"}
                      </button>
                    ) : (
                      <span className={`inline-block w-2 h-2 rounded-full ${displayActive ? "bg-green-500" : "bg-red-500"} shadow-[0_0_8px_rgba(34,197,94,0.3)]`} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Creation Modals */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Ürün Kaydı" maxWidth="4xl">
        <ProductFormInternal 
          data={createForm} 
          onChange={setCreateForm} 
          tiers={tiers}
          categories={categories}
          onSave={async () => {
            setCreateLoading(true);
            const res = await fetch("/api/admin/products", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(createForm) });
            if (res.ok) { setShowCreateModal(false); setCreateForm({name: "", price: 0, description: "", media: [], categories: [], tieredPrices: {}}); fetchData(); }
            setCreateLoading(false);
          }}
          loading={createLoading}
          title="Ürün Kimliği ve Fiyatlandırma"
        />
      </Modal>

      <Modal isOpen={showBatchModal} onClose={() => setShowBatchModal(false)} title="Toplu Envanter Genişletme" maxWidth="4xl">
         <div className="p-8 space-y-8 max-h-[85vh] overflow-y-auto no-scrollbar">
            <div className="space-y-4">
              {batchForms.map((f, i) => (
                <div key={i} className="relative group p-6 rounded-3xl bg-secondary/20 border border-border/50 hover:border-foreground/10 transition-all">
                  <button onClick={() => setBatchForms(batchForms.filter((_, idx) => idx !== i))} className="absolute top-4 right-4 p-2 text-muted hover:text-destructive transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                  <ProductFormInternal 
                    data={f} 
                    onChange={(updated: any) => {
                      const newForms = [...batchForms];
                      newForms[i] = updated;
                      setBatchForms(newForms);
                    }}
                    tiers={tiers}
                    categories={categories}
                    hideFooter
                    title={`Öğe #${i + 1}`}
                  />
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => setBatchForms([...batchForms, {name: "", price: 0, description: "", media: [], categories: [], tieredPrices: {}}])} 
              className="w-full py-6 border-2 border-dashed border-border/50 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:border-foreground/20 hover:bg-secondary/30 transition-all"
            >
              + Yeni Satır Ekle
            </button>
            
            <div className="pt-8 border-t border-border/50 flex gap-4">
               <button onClick={() => setShowBatchModal(false)} className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground transition-all">Vazgeç</button>
               <button onClick={async () => {
                  setBatchLoading(true);
                  await Promise.all(batchForms.filter(f => f.name).map(f => fetch("/api/admin/products", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(f)})));
                  setShowBatchModal(false); setBatchForms([{name: "", price: 0, description: "", media: [], categories: [], tieredPrices: {}}]); fetchData();
                  setBatchLoading(false);
                }} className="flex-1 py-4 bg-foreground text-background font-black text-xs rounded-2xl shadow-2xl hover:opacity-90 transition-all uppercase tracking-[0.3em]">
                  {batchLoading ? "SENKRONİZE EDİLİYOR..." : `${batchForms.length} Ürünü Kaydet`}
                </button>
            </div>
         </div>
      </Modal>
    </div>
  );
}
