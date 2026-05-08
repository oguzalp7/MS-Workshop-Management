"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";


export default function CheckoutQRPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/guest/profile");
        if (res.ok) {
          const data = await res.json();
          // Use guest ID if registered, otherwise use session info
          setToken(data.guest?.id || data.sessionToken);
        }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-md mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-blue-600/10 rounded-[2.5rem] flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
            <rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
          </svg>
        </div>
        <h1 className="text-3xl font-black tracking-tight uppercase">Ödeme ve ID</h1>
        <p className="text-zinc-500 text-sm leading-relaxed px-4">
          Siparişinizi onaylatmak veya ödeme yapmak için bu kodu görevliye taratın.
        </p>
      </div>

      <div className="bg-white p-8 rounded-[3rem] shadow-2xl shadow-blue-500/10 flex flex-col items-center gap-6 border-8 border-secondary/50">
        {token ? (
          <>
            <div className="p-4 bg-white border-4 border-zinc-50 rounded-3xl">
              <QRCodeSVG
                value={token}
                size={220}
                level="H"
                includeMargin={false}
              />
            </div>
            <div className="text-center space-y-1">
              <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Müşteri ID</p>
              <p className="font-mono text-xs font-bold text-zinc-400 break-all">{token}</p>
            </div>
          </>
        ) : (
          <div className="py-12 text-center space-y-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive mx-auto">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm font-bold">Oturum bilgisi alınamadı.</p>
          </div>
        )}
      </div>

      <div className="bg-secondary/30 rounded-3xl p-6 border border-border/50">
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Hızlı İşlem</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Bu kod sayesinde sıra beklemeden işleminizi tamamlayabilir ve sipariş durumunuzu anlık olarak takip edebilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
