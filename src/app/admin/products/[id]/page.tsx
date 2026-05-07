"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

interface ProductMedia {
  url: string;
  type: "image" | "video";
}

interface ProductPrice {
  id: string;
  priceTierId: string;
  price: number;
  priceTier: { id: string, name: string, surchargePercentage: number };
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  active: boolean;
  media: ProductMedia[];
  categories: { id: string, name: string }[];
  tieredPrices: ProductPrice[];
}

function FloatingInput({ label, type = "text", value, onBlur, placeholder, ...props }: any) {
  const [val, setVal] = useState(value);
  useEffect(() => setVal(value), [value]);

  return (
    <div className="relative group">
      <input 
        type={type}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => onBlur(val)}
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

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [allCategories, setAllCategories] = useState<{ id: string, name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [newMediaType, setNewMediaType] = useState<"image" | "video">("image");

  async function fetchData() {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch(`/api/admin/products/${id}`),
        fetch("/api/admin/categories")
      ]);
      if (pRes.ok) {
        const pData = await pRes.json();
        setProduct(pData.product);
      } else {
        router.push("/admin/products");
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        setAllCategories(cData.categories);
      }
    } catch {
      router.push("/admin/products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [id]);

  async function handleUpdate(updates: any) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setProduct(data.product);
      }
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  }

  const toggleCategory = async (catId: string) => {
    const isConnected = product?.categories.some(c => c.id === catId);
    if (isConnected) {
      await handleUpdate({ disconnectCategory: catId });
    } else {
      await handleUpdate({ connectCategory: catId });
    }
  };

  async function addMedia() {
    if (!newMediaUrl.trim() || !product) return;
    const updatedMedia = [...product.media, { url: newMediaUrl.trim(), type: newMediaType }];
    await handleUpdate({ media: updatedMedia });
    setNewMediaUrl("");
  }

  async function removeMedia(index: number) {
    if (!product) return;
    const updatedMedia = product.media.filter((_, i) => i !== index);
    await handleUpdate({ media: updatedMedia });
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="animate-spin h-8 w-8 border-4 border-foreground border-t-transparent rounded-full" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted animate-pulse">Synchronizing Studio</p>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="max-w-7xl mx-auto pb-32 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
        <div className="space-y-4">
          <button onClick={() => router.push("/admin/products")} className="group text-[10px] font-black text-muted hover:text-foreground uppercase tracking-[0.3em] flex items-center gap-3 transition-all">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </div>
            Catalog Overview
          </button>
          <div>
            <h1 className="text-5xl font-black tracking-tighter mb-2">{product.name}</h1>
            <div className="flex items-center gap-4">
               <p className="text-muted text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Product Profile • {id.split("-")[0]}</p>
               <div className={`w-2 h-2 rounded-full ${saving ? "bg-green-500 animate-pulse" : "bg-border"}`} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleUpdate({ active: !product.active })}
            className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 ${product.active ? "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500 hover:text-white" : "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500 hover:text-white"}`}
          >
            {product.active ? "STATUS: ACTIVE" : "STATUS: INACTIVE"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-1 space-y-12">
          {/* Identity Section */}
          <section className="space-y-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 border-b border-border pb-4">Identity & Context</h2>
            <div className="space-y-6">
              <FloatingInput label="Display Name" value={product.name} onBlur={(v: string) => handleUpdate({ name: v })} />
              <div className="relative group">
                <textarea 
                  placeholder=" "
                  defaultValue={product.description}
                  onBlur={(e) => handleUpdate({ description: e.target.value })}
                  className="peer w-full px-5 py-4 rounded-2xl bg-secondary/50 border-2 border-transparent focus:border-foreground/10 focus:bg-card outline-none transition-all font-bold text-sm pt-8 min-h-[140px] resize-none"
                />
                <label className="absolute left-5 top-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-xs peer-placeholder-shown:tracking-widest peer-focus:top-3 peer-focus:text-[9px] peer-focus:tracking-[0.2em] pointer-events-none">
                  Description
                </label>
              </div>
            </div>
          </section>

          {/* Pricing Section */}
          <section className="space-y-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 border-b border-border pb-4">Revenue Model</h2>
            <div className="space-y-6">
               <FloatingInput label="Base Catalog Price ($)" type="number" step="0.01" value={product.price} onBlur={(v: string) => handleUpdate({ price: parseFloat(v) })} />
               
               <div className="grid grid-cols-1 gap-4 pt-4">
                  <h3 className="text-[8px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                     Tier Overrides
                  </h3>
                  {product.tieredPrices.map((tp) => (
                    <FloatingInput 
                      key={tp.id}
                      label={`${tp.priceTier.name} Override ($)`} 
                      type="number" 
                      step="0.01" 
                      value={tp.price} 
                      onBlur={(v: string) => handleUpdate({ tieredPrices: { [tp.priceTierId]: v } })} 
                      placeholder={`${(product.price * (1 + tp.priceTier.surchargePercentage/100)).toFixed(2)} (Current)`}
                    />
                  ))}
               </div>
            </div>
          </section>

          {/* Classification */}
          <section className="space-y-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 border-b border-border pb-4">Classification</h2>
            <div className="flex flex-wrap gap-2">
              {allCategories.map((cat) => {
                const isActive = product.categories.some(c => c.id === cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2 ${isActive ? "bg-foreground text-background border-foreground shadow-xl" : "bg-secondary/50 text-muted-foreground border-transparent hover:border-border"}`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column: Media Gallery */}
        <div className="lg:col-span-2 space-y-12">
          <section className="p-10 rounded-[3rem] bg-card border border-border shadow-2xl space-y-10">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted">Media Assets Studio</h2>
              <span className="text-[8px] font-black bg-secondary px-3 py-1 rounded-full uppercase tracking-widest text-muted-foreground">Count: {product.media.length}</span>
            </div>

            {/* Media Add Form */}
            <div className="p-8 rounded-[2rem] bg-secondary/30 border border-border/50 flex flex-col xl:flex-row gap-6 items-end">
              <div className="flex-1 w-full">
                <FloatingInput label="Asset URL (Image/Video)" value={newMediaUrl} onBlur={setNewMediaUrl} />
              </div>
              <div className="w-full xl:w-40">
                <div className="relative">
                  <select 
                    value={newMediaType}
                    onChange={(e) => setNewMediaType(e.target.value as any)}
                    className="w-full h-[60px] pt-4 rounded-2xl bg-card border-2 border-transparent text-[10px] font-black uppercase outline-none px-5 appearance-none"
                  >
                    <option value="image">Still Image</option>
                    <option value="video">Motion Video</option>
                  </select>
                  <label className="absolute left-5 top-2.5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Type</label>
                </div>
              </div>
              <button 
                onClick={addMedia}
                className="w-full xl:w-auto px-10 h-[60px] rounded-2xl bg-foreground text-background text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 active:scale-95 transition-all shadow-xl"
              >
                Ingest Asset
              </button>
            </div>

            {/* Media Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {product.media.map((item, index) => (
                <div key={index} className="group relative aspect-video rounded-[2rem] bg-secondary overflow-hidden border border-border/50 shadow-lg hover:shadow-2xl transition-all duration-500">
                  {item.type === "video" ? (
                    <video src={item.url} className="w-full h-full object-cover" autoPlay muted loop />
                  ) : (
                    <img src={item.url} alt="" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center gap-4 backdrop-blur-sm">
                    <button 
                      onClick={() => removeMedia(index)}
                      className="w-14 h-14 rounded-full bg-destructive text-white flex items-center justify-center hover:scale-110 transition-all shadow-2xl"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                  <div className="absolute top-6 left-6 px-4 py-2 rounded-xl bg-black/40 backdrop-blur-xl text-[10px] font-black text-white uppercase tracking-widest border border-white/10">
                    {item.type}
                  </div>
                </div>
              ))}
              {product.media.length === 0 && (
                <div className="col-span-full py-24 text-center border-2 border-dashed border-border/30 rounded-[2rem]">
                  <p className="text-[10px] font-black text-muted uppercase tracking-[0.4em]">No media assets indexed</p>
                </div>
              )}
            </div>
          </section>

          {/* Risk Zone */}
          <section className="p-10 rounded-[2rem] bg-destructive/[0.03] border border-destructive/10 flex items-center justify-between gap-8">
            <div className="space-y-2">
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-destructive">Termination Protocol</h3>
               <p className="text-xs text-muted-foreground font-medium max-w-md">Once a product is purged, all historical data and workshop bindings will be lost. Use deactivation for general inventory rotations.</p>
            </div>
            <button className="px-8 py-4 rounded-2xl bg-destructive text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-destructive/20">
              PURGE PRODUCT
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
