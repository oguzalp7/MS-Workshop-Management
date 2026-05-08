"use client";

import { useEffect, useState } from "react";

interface Guest {
  id: string;
  shortCode?: string;
  profileData: any;
  workshop: {
    name: string;
    formConfig: { fields: any[] } | null;
  };
  carts: {
    id: string;
    orderNumber?: string;
    status: string;
    createdAt: string;
    totalAmount: number | null;
    priceTier: { name: string } | null;
    items: {
      quantity: number;
      priceAtPurchase: number | null;
      product: { name: string; price: number }
    }[]
  }[];
}

export default function ProfilePage() {
  const [guest, setGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/guest/profile");
      if (res.ok) {
        const data = await res.json();
        setGuest(data.guest);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) return <div className="p-12 flex items-center justify-center"><div className="animate-spin h-5 w-5 border-2 border-foreground border-t-transparent rounded-full" /></div>;
  if (!guest) return null;

  const fields = guest.workshop.formConfig?.fields || [];

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    OPEN: { label: "AÇIK", color: "bg-blue-100 text-blue-700 border-blue-200" },
    ORDERED: { label: "SİPARİŞ ALINDI", color: "bg-blue-500 text-white border-blue-600" },
    PREPARING: { label: "HAZIRLANIYOR", color: "bg-orange-500 text-white border-orange-600" },
    READY: { label: "TESLİME HAZIR", color: "bg-green-500 text-white border-green-600" },
    PAID: { label: "TAMAMLANDI", color: "bg-gray-500 text-white border-gray-600" },
  };

  return (
    <div className="px-6 py-12 space-y-16 pb-32">
       {/* Personal Info */}
       <div className="space-y-10">
          <div className="space-y-2 text-center">
             <h2 className="text-3xl font-bold tracking-tight">Profiliniz</h2>
             <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em]">{guest.workshop.name}</p>
          </div>

          <div className="bg-card border border-border/40 rounded-[2.5rem] p-10 space-y-8 shadow-sm">
             <div className="grid grid-cols-1 gap-8">
                {fields.map((f: any) => (
                  <div key={f.key} className="space-y-1 border-b border-border/30 pb-4">
                     <p className="text-[9px] font-black text-muted uppercase tracking-widest leading-none">{f.label}</p>
                     <p className="text-lg font-bold text-foreground/90">
                        {f.type === 'checkbox' ? (guest.profileData[f.key] ? "✓ Evet" : "✕ Hayır") : (guest.profileData[f.key] || "—")}
                     </p>
                  </div>
                ))}
             </div>
          </div>
       </div>

       {/* Shopping History */}
       <div className="space-y-10">
          <div className="flex items-center justify-between">
             <h2 className="text-2xl font-bold tracking-tight">Alışveriş Geçmişi</h2>
             <span className="text-[10px] font-bold text-muted bg-secondary/50 px-3 py-1 rounded-full uppercase tracking-widest">{guest.carts.length} Oturum</span>
          </div>

          <div className="space-y-6">
             {guest.carts.map((cart, idx) => {
                const total = cart.totalAmount ?? cart.items.reduce((sum, i) => sum + ((i.priceAtPurchase ?? i.product.price) * i.quantity), 0);
                const statusInfo = STATUS_LABELS[cart.status] || { label: cart.status, color: "bg-secondary text-muted" };

                return (
                  <div key={cart.id} className="bg-card border border-border/40 rounded-[2rem] p-8 space-y-6 shadow-sm">
                     <div className="flex items-center justify-between">
                        <div>
                           <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">OTURUM #{guest.carts.length - idx}</p>
                           <p className="text-xs font-bold">{new Date(cart.createdAt).toLocaleDateString('tr-TR')} • {new Date(cart.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusInfo.color}`}>
                              {statusInfo.label}
                           </div>
                           {cart.priceTier && (
                             <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{cart.priceTier.name}</span>
                           )}
                        </div>
                     </div>
                     
                     <div className="space-y-3 pt-2 border-t border-border/30">
                        {cart.items.map((item, iIdx) => {
                          const unitPrice = item.priceAtPurchase ?? item.product.price;
                          const basePrice = item.product.price;
                          const hasDiscount = unitPrice < basePrice;

                          return (
                            <div key={iIdx} className="flex justify-between items-center text-sm">
                               <p className="text-muted-foreground"><span className="font-bold text-foreground">{item.quantity}x</span> {item.product.name}</p>
                               <div className="flex flex-col items-end">
                                  {hasDiscount && (
                                    <span className="text-[8px] text-muted-foreground line-through">₺{(basePrice * item.quantity).toFixed(2)}</span>
                                  )}
                                  <p className="font-bold text-[11px] text-foreground">₺{(unitPrice * item.quantity).toFixed(2)}</p>
                               </div>
                            </div>
                          );
                        })}
                     </div>

                     <div className="flex justify-between items-end pt-4 border-t border-border/30">
                        <p className="text-[9px] font-black text-muted uppercase tracking-widest">Toplam Tutar</p>
                        <p className="text-xl font-black text-blue-600">₺{total.toFixed(2)}</p>
                     </div>
                  </div>
                );
             })}

             {guest.carts.length === 0 && (
                <div className="py-20 text-center bg-secondary/20 rounded-[2rem] border border-dashed border-border">
                   <p className="text-xs font-bold text-muted uppercase tracking-widest italic">Henüz alışveriş yapılmadı</p>
                </div>
             )}
          </div>
       </div>
    </div>
  );
}
