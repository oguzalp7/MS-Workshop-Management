"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Html5QrcodeScanner } from "html5-qrcode";
import Link from "next/link";
import { Icons } from "@/components/Icons";

interface CartItem {
  id: string;
  quantity: number;
  product: { name: string, price: number };
}

interface Cart {
  id: string;
  status: string;
  totalAmount: number;
  items: CartItem[];
  priceTier?: { name: string };
  createdAt: string;
}

interface LookupResult {
  carts: Cart[];
  totalAmount: number;
  guestName: string;
  token: string;
}

export default function WorkshopScannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: workshopId } = React.use(params);
  const router = useRouter();
  
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const isLocked = useRef(false);
  const lastLookupTime = useRef(0);
  const lastToken = useRef<string | null>(null);

  const onScanSuccess = async (decodedText: string) => {
    if (isLocked.current || loading || processing) return;
    
    isLocked.current = true;
    setLastScanned(decodedText);
    
    // Stop scanner immediately
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
        scannerRef.current = null;
      } catch (e) { console.error(e); }
    }
    
    setScanning(false);
    lookupToken(decodedText);
  };

  const onScanFailure = () => {
    // Silently ignore
  };

  useEffect(() => {
    if (scanning && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      
      scanner.render(onScanSuccess, onScanFailure);
      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [scanning]);

  async function lookupToken(token: string) {
    const now = Date.now();
    // Throttle only if it's the same token within 3 seconds
    if (token === lastToken.current && now - lastLookupTime.current < 3000) return;
    
    lastLookupTime.current = now;
    lastToken.current = token;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/workshops/${workshopId}/lookup?token=${token}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Aktif sipariş bulunamadı.");
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
      // Wait 3 seconds before allowing a retry of the same code
      setTimeout(() => {
        isLocked.current = false;
        setScanning(true);
        setLastScanned(null);
      }, 3000);
    } finally {
      setLoading(false);
    }
  }

  async function completePayment() {
    if (!result || processing) return;
    
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/workshops/${workshopId}/bulk-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: result.token })
      });
      
      if (res.ok) {
        // Success! Go back to workshop details
        router.push(`/admin/workshops/${workshopId}?success=payment`);
      } else {
        const data = await res.json();
        throw new Error(data.error || "Ödeme işlemi başarısız oldu.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 max-w-4xl mx-auto space-y-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link href={`/admin/workshops/${workshopId}`} className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 hover:text-foreground transition-all">
             {Icons.StatusInfo && <Icons.StatusInfo className="w-3 h-3 rotate-180" />}
             Atölye Detaylarına Dön
          </Link>
          <h1 className="text-3xl font-black tracking-tight uppercase">Ödeme Terminali</h1>
        </div>
        <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center">
           {Icons.Shopping && <Icons.Shopping className="w-6 h-6 text-blue-600" />}
        </div>
      </div>

      {/* Main Interface */}
      <div className="grid grid-cols-1 gap-8">
        {scanning ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-card border-4 border-dashed border-border rounded-[3rem] overflow-hidden p-8 flex flex-col items-center gap-8">
              <div id="reader" className="w-full max-w-sm overflow-hidden rounded-3xl border-4 border-foreground shadow-2xl" />
              <div className="text-center space-y-2">
                <p className="font-bold text-sm">QR Kodunu Taratın</p>
                <p className="text-xs text-muted-foreground">Misafirin "Ödeme" sekmesindeki kodu kameraya yaklaştırın.</p>
              </div>
            </div>
            
            {error && (
              <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-300">
                 <div className="w-10 h-10 bg-destructive/20 rounded-xl flex items-center justify-center shrink-0">
                    {Icons.StatusInfo && <Icons.StatusInfo className="w-5 h-5 text-destructive" />}
                 </div>
                 <p className="text-sm font-bold text-destructive">{error}</p>
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-6">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold animate-pulse">Siparişler Sorgulanıyor...</p>
          </div>
        ) : result && (
          <div className="space-y-8 animate-in zoom-in-95 duration-500">
             {/* Guest Identity Card */}
             <div className="bg-blue-600 p-8 rounded-[3rem] text-white shadow-2xl shadow-blue-600/20 flex items-center justify-between">
                <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Aktif Müşteri</p>
                   <h2 className="text-2xl font-black uppercase">{result.guestName}</h2>
                   {result.carts[0]?.guest?.shortCode && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-white text-blue-600 text-[10px] font-black rounded-lg uppercase tracking-widest">
                         {result.carts[0].guest.shortCode}
                      </span>
                   )}
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Bekleyen Sipariş</p>
                   <p className="text-2xl font-black">{result.carts.length} Adet</p>
                </div>
             </div>

             {/* Carts Breakdown */}
             <div className="space-y-4">
                {result.carts.map((cart) => (
                  <div key={cart.id} className="bg-card border border-border rounded-3xl p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-border pb-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-muted uppercase tracking-widest block">Sipariş #{cart.id.split('-')[0]}</span>
                        {cart.priceTier && (
                          <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1">
                             <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                             {cart.priceTier.name}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-600/10 px-3 py-1 rounded-full">{cart.status}</span>
                    </div>
                    <div className="space-y-3">
                      {cart.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                           <span className="font-bold"><span className="text-blue-600">{item.quantity}x</span> {item.product.name}</span>
                           <span className="text-muted-foreground">₺{(item.product.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 flex justify-between items-center border-t border-border border-dashed">
                       <span className="font-bold text-xs uppercase text-muted">Ara Toplam</span>
                       <span className="font-black text-lg">₺{cart.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
             </div>

             {/* Final Action */}
             <div className="sticky bottom-8 p-8 bg-background border-4 border-foreground rounded-[3.5rem] shadow-2xl space-y-6">
                <div className="flex justify-between items-center">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-muted uppercase tracking-widest">Toplam Ödenecek</p>
                      <p className="text-4xl font-black tracking-tighter text-blue-600">₺{result.totalAmount.toFixed(2)}</p>
                   </div>
                   <button 
                     onClick={() => { setResult(null); isLocked.current = false; setScanning(true); }}
                     className="px-6 py-3 rounded-2xl bg-secondary text-[10px] font-black uppercase tracking-widest hover:bg-secondary/80 transition-all"
                   >
                     İPTAL
                   </button>
                </div>
                
                <button
                  onClick={completePayment}
                  disabled={processing}
                  className="w-full py-6 rounded-[2rem] bg-foreground text-background text-xs font-black uppercase tracking-[0.3em] shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
                >
                  {processing ? "İŞLENİYOR..." : "ÖDEMEYİ ONAYLA VE TAMAMLA"}
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
