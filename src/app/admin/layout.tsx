"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Icons } from "@/components/Icons";

interface SessionUser {
  id: string;
  username: string;
  name: string;
}

const NAV_ITEMS = [
  { label: "Panel", href: "/admin", icon: Icons.Dashboard },
  { label: "Siparişler", href: "/admin/orders", icon: Icons.Orders },
  { label: "Eğitimler", href: "/admin/workshops", icon: Icons.Workshops },
  { label: "Kayıt Taslakları", href: "/admin/guest-settings", icon: Icons.GuestSettings },
  { label: "Yazdırma Merkezi", href: "/admin/print-settings", icon: Icons.Profile },
  { label: "Ürünler", href: "/admin/products", icon: Icons.Products },
  { label: "Kategoriler", href: "/admin/categories", icon: Icons.Categories },
  { label: "Fiyatlandırma", href: "/admin/pricing", icon: Icons.Pricing },
  { label: "Kullanıcılar", href: "/admin/users", icon: Icons.Users },
  { label: "Profil", href: "/admin/profile", icon: Icons.Profile },
  { label: "Ayarlar", href: "/admin/settings", icon: Icons.GuestSettings },
];




export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        if (data.isLoggedIn) setUser(data.user);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!isLoginPage) checkSession();
    window.addEventListener("session-update", checkSession);
    return () => window.removeEventListener("session-update", checkSession);
  }, [isLoginPage, checkSession]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch { /* ignore */ }
  }

  if (isLoginPage) return <>{children}</>;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-card border-r border-border flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-3 px-5 h-16 border-b border-border shrink-0">
          <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center text-sm font-bold">W</div>
          <span className="font-semibold text-sm tracking-tight">Workshop POS</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${isActive ? "bg-secondary text-foreground" : "text-muted hover:text-foreground hover:bg-secondary/50"}`}
                  >
                    <Icon />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-border px-3 py-3 shrink-0">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || "Admin"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.username || "—"}</p>
            </div>
            <button onClick={handleLogout} title="Sign out" className="p-2 rounded-lg text-muted hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-border flex items-center px-4 lg:px-6 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-lg text-muted hover:text-foreground hover:bg-secondary lg:hidden cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
          </button>
          <div className="flex-1" />
          <span className="text-sm text-muted hidden lg:block">{user?.name}</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
