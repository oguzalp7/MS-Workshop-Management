"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface PriceTier {
  id: string;
  name: string;
}

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    media: any[];
    tieredPrices: { priceTierId: string, price: number }[];
  }
}

interface Cart {
  id: string;
  status: string;
  items: CartItem[];
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([]);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  async function fetchData() {
    try {
      const [cartRes, tiersRes] = await Promise.all([
        fetch("/api/guest/cart"),
        fetch("/api/guest/catalog") // Reusing catalog to get tiers
      ]);

      if (cartRes.ok) {
        const cartData = await cartRes.json();
        setCart(cartData.cart);
      }

      if (tiersRes.ok) {
        const tiersData = await tiersRes.json();
        setPriceTiers(tiersData.priceTiers);
        if (tiersData.priceTiers?.length > 0) {
          setSelectedTierId(tiersData.priceTiers[0].id);
        }
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function updateQty(itemId: string, newQty: number) {
    if (newQty < 1) return;
    try {
      const res = await fetch("/api/guest/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity: newQty }),
      });
      if (res.ok) {
        const data = await res.json();
        setCart(data.cart);
      }
    } catch { /* ignore */ }
  }

  async function handleCheckout() {
    if (!cart || cart.items.length === 0 || !selectedTierId) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/guest/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceTierId: selectedTierId })
      });
      if (res.ok) {
        router.push("/workshop/profile");
      }
    } catch { /* ignore */ } finally {
      setCheckoutLoading(false);
    }
  }

  if (loading) return <div className="p-6 flex items-center justify-center h-[50vh]"><div className="animate-spin h-5 w-5 border-2 border-foreground border-t-transparent rounded-full" /></div>;

  const calculateTotal = () => {
    if (!cart) return 0;
    return cart.items.reduce((sum, item) => {
      const tierPrice = item.product.tieredPrices.find(tp => tp.priceTierId === selectedTierId)?.price ?? item.product.price;
      return sum + (tierPrice * item.quantity);
    }, 0);
  };

  const total = calculateTotal();

  return (
    <div className="px-6 py-12 space-y-12">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Sepetiniz</h2>
        <p className="text-[10px] font-bold text-muted uppercase tracking-[0.3em]">Siparişinizi tamamlamadan önce son kontroller</p>
      </div>

      {!cart || cart.items.length === 0 ? (
        <div className="py-24 text-center space-y-6">
          <div className="text-4xl opacity-20">🛒</div>
          <p className="text-sm font-bold text-muted uppercase tracking-widest italic">Sepetiniz şu an boş</p>
          <button onClick={() => router.push("/workshop/catalog")} className="px-8 py-3 rounded-2xl bg-secondary text-xs font-black uppercase">Kataloğa Göz At</button>
        </div>
      ) : (
        <div className="space-y-12 pb-32">
          <div className="space-y-6">
            {cart.items.map((item) => {
              const itemTierPrice = item.product.tieredPrices.find(tp => tp.priceTierId === selectedTierId)?.price ?? item.product.price;
              return (
                <div key={item.id} className="bg-card border border-border/40 rounded-[2rem] p-6 flex items-center gap-6 shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-secondary/30 overflow-hidden border border-border/50 shrink-0">
                    {item.product.media?.[0] ? (
                      <img src={item.product.media[0].url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl opacity-20">📦</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold truncate leading-tight">{item.product.name}</h3>
                    <p className="text-[10px] font-black text-muted-foreground mt-0.5">₺{itemTierPrice.toFixed(2)} / adet</p>
                  </div>
                  <div className="flex items-center gap-4 bg-secondary/50 p-1 rounded-xl">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-card rounded-lg transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /></svg>
                    </button>
                    <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-card rounded-lg transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment Method Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-foreground text-background flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" /></svg>
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest">Ödeme Tercihi</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {priceTiers.map(tier => (
                <button
                  key={tier.id}
                  onClick={() => setSelectedTierId(tier.id)}
                  className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-2 ${selectedTierId === tier.id ? 'bg-foreground text-background border-foreground shadow-2xl scale-[1.02]' : 'bg-card text-muted-foreground border-transparent hover:border-border'}`}
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{tier.name}</span>
                  <div className={`w-2 h-2 rounded-full ${selectedTierId === tier.id ? 'bg-background' : 'bg-muted'}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-foreground text-background space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Ödenecek Tutar</p>
              <p className="text-3xl font-black">₺{total.toFixed(2)}</p>
            </div>
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading || !selectedTierId}
              className={`w-full py-5 rounded-[1.5rem] text-sm font-black uppercase tracking-widest transition-all relative z-10 ${checkoutLoading ? 'bg-background/20 opacity-50' : 'bg-background text-foreground hover:scale-[1.02] active:scale-[0.98]'}`}
            >
              {checkoutLoading ? "İŞLENİYOR..." : "SİPARİŞİ TAMAMLA"}
            </button>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  );
}
