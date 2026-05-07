"use client";

import { useEffect, useState } from "react";

interface Stats {
  activeWorkshops: number;
  totalGuests: number;
  openCarts: number;
  totalProducts: number;
  totalRevenue: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    try {
      const res = await fetch("/api/admin/dashboard/stats");
      if (res.ok) setStats((await res.json()).stats);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="p-12 flex items-center justify-center"><div className="animate-spin h-5 w-5 border-2 border-foreground border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Panel</h1>
        <p className="text-muted text-xs uppercase tracking-[0.3em] font-black opacity-60">Eğitim Yönetim ve Operasyon Merkezi</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {[
          { label: "Aktif Eğitimler", value: stats?.activeWorkshops, desc: "Şu an devam eden", color: "text-blue-600" },
          { label: "Toplam Katılımcı", value: stats?.totalGuests, desc: "Tüm etkinlikler", color: "text-foreground" },
          { label: "Açık Sepetler", value: stats?.openCarts, desc: "Ödeme bekleyen", color: "text-orange-500" },
          { label: "Ürün Sayısı", value: stats?.totalProducts, desc: "Katalogdaki toplam", color: "text-foreground" },
          { label: "Toplam Ciro", value: `₺${stats?.totalRevenue.toFixed(2)}`, desc: "Tamamlanan satışlar", color: "text-green-600" },
        ].map((card) => (
          <div key={card.label} className="bg-card border border-border/40 rounded-[2rem] p-8 shadow-sm space-y-4 hover:border-foreground/10 transition-all">
            <p className="text-[10px] font-black text-muted uppercase tracking-widest">{card.label}</p>
            <p className={`text-4xl font-black tracking-tighter ${card.color}`}>{card.value ?? "—"}</p>
            <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">{card.desc}</p>
          </div>
        ))}
      </div>

    </div>
  );
}
