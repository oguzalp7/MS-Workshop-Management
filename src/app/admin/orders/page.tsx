"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/Icons";

interface CartItem {
  id: string;
  quantity: number;
  product: { name: string; media: any };
  priceAtPurchase: number;
}

interface Cart {
  id: string;
  status: string;
  totalAmount: number;
  orderedAt: string;
  workshop?: { name: string };
  guest?: { 
    profileData: any;
    workshop?: { name: string };
    shortCode?: string | null;
  } | null;
  items: CartItem[];
}

const STATUS_TABS = [
  { id: "ORDERED", label: "YENİ", color: "blue" },
  { id: "PREPARING", label: "HAZIRLANIYOR", color: "orange" },
  { id: "READY", label: "TESLİME HAZIR", color: "green" },
  { id: "PAID", label: "TAMAMLANDI", color: "gray" }
];

const STATUS_LABELS: Record<string, string> = {
  ORDERED: "Sipariş Alındı",
  PREPARING: "Hazırlanıyor",
  READY: "Teslime Hazır",
  PAID: "Ödendi"
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Cart[]>([]);
  const [activeTab, setActiveTab] = useState("ORDERED");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [selectedWorkshopId, setSelectedWorkshopId] = useState("");

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  async function fetchOrders() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        workshopId: selectedWorkshopId,
        search: searchQuery,
        status: statusFilter,
        startDate: startDateFilter,
        endDate: endDateFilter
      });
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchWorkshops() {
    try {
      const res = await fetch("/api/admin/workshops");
      if (res.ok) {
        const data = await res.json();
        setWorkshops(data.workshops);
      }
    } catch (error) { console.error(error); }
  }

  useEffect(() => {
    fetchWorkshops();
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [selectedWorkshopId, searchQuery, statusFilter, startDateFilter, endDateFilter]);

  const filteredWorkshops = workshops.filter((w) => {
    const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && w.active) ||
      (statusFilter === "inactive" && !w.active);

    const workshopStart = new Date(w.startDateTime);
    const matchesStartDate = !startDateFilter || workshopStart >= new Date(startDateFilter);
    const matchesEndDate = !endDateFilter || workshopStart <= new Date(endDateFilter);

    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
  });

  async function updateStatus(id: string, newStatus: string) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredOrders = orders.filter(o => o.status === activeTab);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 flex-1">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Sipariş Yönetimi</h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] mt-2 opacity-60 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              LOJİSTİK VE TESLİMAT MERKEZİ
            </p>
          </div>

          <div className="flex bg-secondary/50 p-1 rounded-2xl border border-border">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted hover:text-foreground"}`}
              >
                {tab.label}
                {orders.filter(o => o.status === tab.id).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[8px] flex items-center justify-center rounded-full border-2 border-background">
                    {orders.filter(o => o.status === tab.id).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Advanced Filters */}
      <div className="bg-card border border-border rounded-3xl p-6 mb-8 flex flex-col lg:flex-row gap-6 shadow-sm">
        <div className="flex-1 relative group">
          <svg className="absolute left-4 top-4 text-muted" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          <input
            type="text"
            placeholder="Search by guest, product, or event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-secondary border border-transparent focus:border-foreground/10 focus:bg-card outline-none transition-all font-bold text-sm"
          />

        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-secondary p-1 rounded-xl border border-border/50">
            {(["all", "active", "inactive"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-card text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Atölye:</span>
            <select
              value={selectedWorkshopId}
              onChange={(e) => setSelectedWorkshopId(e.target.value)}
              className="bg-secondary border border-border/50 rounded-lg px-4 py-2 text-[10px] font-bold uppercase tracking-widest focus:outline-none"
            >
              <option value="">TÜMÜ ({filteredWorkshops.length})</option>
              {filteredWorkshops.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">From:</span>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="bg-secondary border border-border/50 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-foreground/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">To:</span>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="bg-secondary border border-border/50 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-foreground/20"
            />
          </div>

          <button
            onClick={() => { setSearchQuery(""); setStatusFilter("active"); setStartDateFilter(""); setEndDateFilter(""); setSelectedWorkshopId(""); }}
            className="p-2 text-muted hover:text-destructive transition-colors"
            title="Reset All"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
          </button>
        </div>
      </div>

      {loading && orders.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-5 w-5 border-2 border-foreground border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm flex flex-col">
              <div className="p-6 border-b border-border bg-secondary/10 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-tighter text-muted">#{order.id.split('-')[0]}</span>
                  <h3 className="text-sm font-black mt-1 flex flex-wrap items-center gap-2">
                    <span>{order.guest ? (order.guest.profileData?.full_name || "İsimsiz Katılımcı") : "Anonim Misafir"}</span>
                    {order.guest?.shortCode && (
                      <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black rounded-md uppercase tracking-widest">
                        {order.guest.shortCode}
                      </span>
                    )}
                  </h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                    {order.workshop?.name || (order.guest?.workshop?.name)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-blue-600">₺{order.totalAmount?.toFixed(2)}</p>
                  <p className="text-[8px] font-bold text-muted uppercase mt-1">
                    {new Date(order.orderedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="p-6 flex-1 space-y-4">
                {order.items.map(item => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-[10px] font-bold">
                      {item.quantity}x
                    </div>
                    <span className="text-xs font-bold flex-1 line-clamp-1">{item.product.name}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-secondary/5 mt-auto border-t border-border/50">
                {activeTab === "ORDERED" && (
                  <button
                    onClick={() => updateStatus(order.id, "PREPARING")}
                    disabled={updatingId === order.id}
                    className="w-full py-3 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
                  >
                    {updatingId === order.id ? "İŞLENİYOR..." : "HAZIRLAMAYA BAŞLA"}
                  </button>
                )}
                {activeTab === "PREPARING" && (
                  <button
                    onClick={() => updateStatus(order.id, "READY")}
                    disabled={updatingId === order.id}
                    className="w-full py-3 rounded-xl bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all"
                  >
                    {updatingId === order.id ? "İŞLENİYOR..." : "HAZIR OLARAK İŞARETLE"}
                  </button>
                )}
                {activeTab === "READY" && (
                  <button
                    onClick={() => updateStatus(order.id, "PAID")}
                    disabled={updatingId === order.id}
                    className="w-full py-3 rounded-xl bg-green-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all"
                  >
                    {updatingId === order.id ? "İŞLENİYOR..." : "TESLİM ET VE ÖDEME AL"}
                  </button>
                )}
                {activeTab === "PAID" && (
                  <div className="py-2 text-center">
                    <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">✓ TAMAMLANDI</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {filteredOrders.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-[2rem]">
              <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Bu aşamada sipariş bulunmuyor</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
