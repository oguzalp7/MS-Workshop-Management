"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface PriceTier {
  id: string;
  name: string;
  surchargePercentage: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string | null;
  media: { id: string, url: string, type: string }[];
  availableQuantity: number;
  reservedCount: number;
  tieredPrices: { id: string, priceTierId: string, price: number }[];
}

export default function CatalogPage() {
  const params = useParams();
  const guestId = params.id as string;
  const [products, setProducts] = useState<Product[]>([]);
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Hepsi");
  const [searchQuery, setSearchQuery] = useState("");

  async function fetchCatalog() {
    try {
      const res = await fetch("/api/guest/catalog");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
        setPriceTiers(data.priceTiers);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCatalog();
  }, []);

  const [visibleCount, setVisibleCount] = useState(12);

  const categories = ["Hepsi", ...Array.from(new Set(products.map(p => p.category))).filter(Boolean) as string[]];

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === "Hepsi" || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  async function addToCart(e: React.MouseEvent, productId: string) {
    e.preventDefault();
    e.stopPropagation();
    setAddingToCart(productId);
    try {
      const res = await fetch("/api/guest/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      if (res.ok) {
        setTimeout(() => setAddingToCart(null), 500);
      }
    } catch {
      setAddingToCart(null);
    }
  }

  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500) {
        setVisibleCount(prev => prev + 12);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-10 w-full rounded-full bg-secondary/30 animate-pulse mb-8" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-80 rounded-[2.5rem] bg-secondary/30 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-6 py-8 space-y-8 pb-32 relative">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black tracking-tight">Katalog</h2>
          <span className="text-[10px] font-bold text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full uppercase tracking-widest">{filteredProducts.length} ürün</span>
        </div>

        {/* Search Box */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-blue-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </div>
          <input
            type="text"
            placeholder="Ürün ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-secondary/50 border-2 border-transparent focus:border-blue-600/20 focus:bg-card px-14 py-4 rounded-[2rem] text-sm font-bold outline-none transition-all placeholder:text-muted/60"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute inset-y-0 right-5 flex items-center text-muted hover:text-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          )}
        </div>

        {/* Sticky Category Navigation */}
        <div className="sticky top-4 z-40 bg-background/80 backdrop-blur-xl -mx-6 px-6 py-4 flex items-center gap-3 overflow-x-auto no-scrollbar border-b border-border/10 shadow-sm shadow-black/5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${selectedCategory === cat ? "bg-foreground text-background border-foreground shadow-xl shadow-foreground/10 scale-105" : "bg-secondary/50 text-muted-foreground border-transparent hover:border-border"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Floating Go To Top Button */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-24 right-6 w-14 h-14 rounded-full bg-foreground text-background shadow-2xl flex items-center justify-center z-50 transition-all duration-500 transform ${showScrollTop ? "translate-y-0 opacity-100 scale-100" : "translate-y-20 opacity-0 scale-50 pointer-events-none"}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
      </button>

      <div className="grid grid-cols-1 gap-8">
        {visibleProducts.map((product) => (
          <div key={product.id} className="group relative bg-card border border-border/50 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700">
            {/* Product Image Area with Slider */}
            <div className="aspect-[4/5] bg-secondary/10 relative overflow-hidden">
              <div className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar">
                {product.media && product.media.length > 0 ? (
                  product.media.map((m, idx) => (
                    <div key={m.id || idx} className="w-full h-full shrink-0 snap-center relative">
                      {m.type === "video" ? (
                        <video
                          src={m.url}
                          className="w-full h-full object-cover"
                          autoPlay muted loop playsInline
                        />
                      ) : (
                        <img
                          src={m.url}
                          className="w-full h-full object-cover"
                          alt={`${product.name} ${idx + 1}`}
                        />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl opacity-10 bg-secondary/20">📦</div>
                )}
              </div>

              <div className="absolute top-6 left-6 flex flex-col gap-2">
                {product.category && (
                  <span className="bg-background/90 backdrop-blur-xl px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest text-foreground shadow-2xl border border-border/10">
                    {product.category}
                  </span>
                )}
                {product.availableQuantity <= 5 && product.availableQuantity > 0 && (
                  <span className="bg-orange-500 text-white px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl">
                    Son Adetler
                  </span>
                )}
              </div>

              {/* Multiple Price Tiers Floating Badge */}
              <div className="absolute bottom-6 right-6 flex flex-col gap-2 items-end">
                {priceTiers.map(tier => {
                  const tierPrice = product.tieredPrices.find(tp => tp.priceTierId === tier.id)?.price ?? product.price;
                  return (
                    <div key={tier.id} className="bg-foreground text-background px-4 py-2 rounded-xl shadow-2xl flex flex-col items-end min-w-[110px] backdrop-blur-md bg-opacity-90">
                      <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-60">{tier.name}</span>
                      <p className="text-sm font-black">₺{tierPrice.toFixed(2)}</p>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Slide Indicator (only if multiple media) */}
              {product.media.length > 1 && (
                <div className="absolute top-1/2 right-4 -translate-y-1/2 animate-bounce flex flex-col items-center gap-1 opacity-40 pointer-events-none">
                  <div className="w-1 h-8 rounded-full bg-white/50" />
                  <span className="text-[8px] font-black uppercase text-white tracking-widest [writing-mode:vertical-lr]">Kaydır</span>
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="p-8 space-y-6">
              <Link href={`/workshop/product/${product.id}`} className="block group/link">
                <h3 className="text-2xl font-black tracking-tight group-hover/link:text-blue-600 transition-colors flex items-center gap-2">
                  {product.name}
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-3 leading-relaxed font-medium">{product.description}</p>
              </Link>

              <div className="pt-4 flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-muted uppercase tracking-[0.2em]">Envanter Durumu</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-black ${product.availableQuantity > 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {product.availableQuantity > 0 ? `${product.availableQuantity - product.reservedCount} adet mevcut` : "Tükendi"}
                    </span>
                    {product.reservedCount > 0 && (
                      <span className="text-[9px] font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                        {product.reservedCount} rezerve
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => addToCart(e, product.id)}
                  disabled={addingToCart === product.id || product.availableQuantity <= 0}
                  className={`flex-1 max-w-[160px] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${addingToCart === product.id ? 'bg-green-500 text-white' : product.availableQuantity > 0 ? 'bg-foreground text-background hover:shadow-2xl hover:shadow-foreground/20' : 'bg-secondary text-muted cursor-not-allowed'}`}
                >
                  {addingToCart === product.id ? "EKLENDİ ✓" : product.availableQuantity > 0 ? "SEPETE EKLE" : "TÜKENDİ"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="py-32 text-center">
          <div className="text-4xl mb-4 opacity-20">🔍</div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Aradığınız kriterlere uygun ürün bulunamadı {searchQuery ? `("${searchQuery}")` : ""}</p>
          <button onClick={() => { setSelectedCategory("Hepsi"); setSearchQuery(""); }} className="mt-4 text-xs font-bold text-blue-600 uppercase tracking-widest underline underline-offset-8">Kataloğu Sıfırla</button>
        </div>
      )}
    </div>
  );
}
