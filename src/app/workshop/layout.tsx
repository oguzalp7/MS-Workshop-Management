"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationPrompt } from "@/components/NotificationPrompt";

export default function WorkshopLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [notificationCount, setNotificationCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  // Sync cart count and notifications
  useEffect(() => {
    async function fetchStatus() {
      try {
        const [cartRes, notifRes] = await Promise.all([
          fetch("/api/guest/cart"),
          fetch("/api/guest/notifications/unread-count")
        ]);

        if (cartRes.ok) {
          const data = await cartRes.json();
          const count = data.cart?.items.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0;
          setCartCount(count);
        }

        if (notifRes.ok) {
          const data = await notifRes.json();
          setNotificationCount(data.count || 0);
        }
      } catch { /* ignore */ }
    }
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <NotificationPrompt />
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] leading-tight">Live Event</p>
          <h1 className="text-lg font-bold tracking-tight">Workshop Store</h1>
        </div>
        <Link href="/workshop/notifications" className="relative w-10 h-10 rounded-full bg-secondary/50 border border-border flex items-center justify-center text-xs shadow-inner transition-all active:scale-90">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
          {notificationCount > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-background animate-bounce">
              {notificationCount}
            </div>
          )}
        </Link>
      </header>

      <main className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {children}
      </main>

      {/* MOBILE BOTTOM HUB NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-8 pt-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-md mx-auto bg-card/90 backdrop-blur-2xl border border-border/50 rounded-[2.5rem] shadow-2xl p-2 flex items-center justify-between relative overflow-hidden">
          <Link href="/workshop/catalog" className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all rounded-[2rem] ${pathname === '/workshop/catalog' ? 'bg-foreground text-background shadow-lg' : 'text-muted-foreground'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            <span className="text-[9px] font-bold uppercase tracking-widest">Katalog</span>
          </Link>

          <Link href="/workshop/cart" className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all rounded-[2rem] relative ${pathname === '/workshop/cart' ? 'bg-foreground text-background shadow-lg' : 'text-muted-foreground'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.1-5.38a1 1 0 0 0-1-1.21H5.14" /></svg>
            <span className="text-[9px] font-bold uppercase tracking-widest">Sepet</span>
            {cartCount > 0 && (
              <div className={`absolute top-2 right-1/4 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${pathname === '/workshop/cart' ? 'bg-background text-foreground' : 'bg-foreground text-background'}`}>
                {cartCount}
              </div>
            )}
          </Link>

          <Link href="/workshop/profile" className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all rounded-[2rem] ${pathname === '/workshop/profile' ? 'bg-foreground text-background shadow-lg' : 'text-muted-foreground'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            <span className="text-[9px] font-bold uppercase tracking-widest">Profil</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
