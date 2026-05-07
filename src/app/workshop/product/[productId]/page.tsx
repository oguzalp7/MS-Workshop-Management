"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

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
   tieredPrices: { id: string, priceTierId: string, price: number }[];
}

export default function ProductDetailPage() {
   const params = useParams();
   const router = useRouter();
   const productId = params.productId as string;

   const [product, setProduct] = useState<Product | null>(null);
   const [priceTiers, setPriceTiers] = useState<PriceTier[]>([]);
   const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
   const [loading, setLoading] = useState(true);
   const [addingToCart, setAddingToCart] = useState(false);
   const [activeMediaIdx, setActiveMediaIdx] = useState(0);

   async function fetchData() {
      try {
         const res = await fetch("/api/guest/catalog");
         if (res.ok) {
            const data = await res.json();
            const found = data.products.find((p: Product) => p.id === productId);
            setProduct(found || null);
            setPriceTiers(data.priceTiers || []);
            if (data.priceTiers?.length > 0) {
               setSelectedTierId(data.priceTiers[0].id);
            }
         }
      } catch { /* ignore */ } finally {
         setLoading(false);
      }
   }

   useEffect(() => {
      if (productId) fetchData();
   }, [productId]);

   const getPrice = () => {
      if (!product || !selectedTierId) return product?.price || 0;
      const tierPrice = product.tieredPrices.find(tp => tp.priceTierId === selectedTierId);
      return tierPrice ? tierPrice.price : product.price;
   };

   async function addToCart() {
      if (!product) return;
      setAddingToCart(true);
      try {
         const res = await fetch("/api/guest/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: product.id, quantity: 1 }),
         });
         if (res.ok) {
            setTimeout(() => setAddingToCart(false), 800);
         }
      } catch {
         setAddingToCart(false);
      }
   }

   if (loading) return (
      <div className="p-12 animate-pulse space-y-8">
         <div className="aspect-[4/5] rounded-[3rem] bg-secondary/30" />
         <div className="h-8 w-3/4 bg-secondary/30 rounded-full" />
         <div className="h-32 w-full bg-secondary/30 rounded-[2rem]" />
      </div>
   );
   
   if (!product) return (
      <div className="p-20 text-center">
         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted mb-8">Asset Not Found</p>
         <button onClick={() => router.back()} className="px-10 py-4 bg-foreground text-background font-black uppercase text-[10px] rounded-2xl tracking-widest shadow-2xl">Return to Catalog</button>
      </div>
   );

   return (
      <div className="pb-32">
         {/* Hero Media Section */}
         <div className="relative group">
            <div className="aspect-[4/5] bg-secondary/10 overflow-hidden relative">
               <div className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar" onScroll={(e) => {
                  const el = e.currentTarget;
                  const idx = Math.round(el.scrollLeft / el.offsetWidth);
                  setActiveMediaIdx(idx);
               }}>
                  {product.media && product.media.length > 0 ? (
                     product.media.map((m) => (
                        <div key={m.id} className="w-full h-full shrink-0 snap-center">
                           {m.type === "video" ? (
                              <video
                                 src={m.url}
                                 className="w-full h-full object-cover"
                                 autoPlay muted loop playsInline
                              />
                           ) : (
                              <img src={m.url} className="w-full h-full object-cover" alt={product.name} />
                           )}
                        </div>
                     ))
                  ) : (
                     <div className="w-full h-full flex items-center justify-center text-6xl opacity-10">📦</div>
                  )}
               </div>

               {/* Back Button Overlay */}
               <button
                  onClick={() => router.back()}
                  className="absolute top-8 left-8 w-12 h-12 rounded-2xl bg-background/80 backdrop-blur-xl border border-border/20 flex items-center justify-center shadow-2xl active:scale-90 transition-all z-20"
               >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
               </button>

               {/* Indicators */}
               {product.media.length > 1 && (
                  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2 p-2.5 bg-black/20 backdrop-blur-2xl rounded-full border border-white/10 z-20">
                     {product.media.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${activeMediaIdx === i ? "bg-white w-8" : "bg-white/40 w-1.5"}`} />
                     ))}
                  </div>
               )}
            </div>
         </div>

         {/* Detailed Info Section */}
         <div className="px-8 pt-10 space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <span className="bg-foreground text-background px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-foreground/10">{product.category || "General"}</span>
                  {product.availableQuantity <= 5 && <span className="bg-orange-500 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20">Limited Edition</span>}
               </div>
               <h1 className="text-4xl font-black tracking-tighter leading-none">{product.name}</h1>
            </div>

            <div className="flex flex-wrap gap-4">
               {priceTiers.map(tier => {
                  const tierPrice = product.tieredPrices.find(tp => tp.priceTierId === tier.id)?.price ?? product.price;
                  return (
                     <div key={tier.id} className="flex-1 min-w-[140px] bg-secondary/30 p-6 rounded-[2rem] border border-border/20 flex flex-col gap-1 transition-all hover:bg-secondary/50">
                        <span className="text-[9px] font-black text-muted uppercase tracking-widest">{tier.name}</span>
                        <p className="text-2xl font-black">${tierPrice.toFixed(2)}</p>
                     </div>
                  );
               })}
               <div className="flex-1 min-w-[140px] bg-secondary/30 p-6 rounded-[2rem] border border-border/20 flex flex-col gap-1">
                  <span className="text-[9px] font-black text-muted uppercase tracking-widest">Inventory</span>
                  <p className={`text-2xl font-black ${product.availableQuantity > 0 ? "text-green-600" : "text-destructive"}`}>
                     {product.availableQuantity > 0 ? `${product.availableQuantity} units` : "Sold Out"}
                  </p>
               </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-[xs] font-black uppercase tracking-[0.3em] text-muted">Description</h3>
               <p className="text-base text-muted-foreground leading-relaxed font-medium">
                  {product.description || "No detailed description available for this item."}
               </p>
            </div>


            <div className="pt-8 border-t border-border/50">
               <div className="p-8 rounded-[2.5rem] bg-foreground text-background shadow-2xl shadow-foreground/20 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-1">
                     <p className="text-lg font-black tracking-tight">Add to your workshop session</p>
                     <p className="text-[10px] uppercase font-bold opacity-60">Instant inventory decrement upon checkout</p>
                  </div>
                  <button
                     onClick={addToCart}
                     disabled={addingToCart || product.availableQuantity <= 0}
                     className={`w-full md:w-auto px-12 py-5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${addingToCart ? "bg-green-500 text-white" : "bg-gray-500 text-foreground hover:bg-secondary"}`}
                  >
                     {addingToCart ? "ADDED TO SESSION ✓" : product.availableQuantity > 0 ? "ADD TO CART" : "OUT OF STOCK"}
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
}
