"use client";

import { useEffect, useState, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { QRCodeSVG } from "qrcode.react";

interface Product { id: string; name: string; price: number; media: any[]; }
interface WorkshopStock { id: string; productId: string; quantity: number; product: Product; }
interface FormField { id: string; key: string; label: string; type: string; required: boolean; isIdentity?: boolean; }
interface FormConfig { id: string; name: string; fields: FormField[]; }
interface Guest { id: string; profileData: any; checkInStatus: boolean; active: boolean; createdAt: string; }
interface Workshop { id: string; name: string; location: string; description: string; startDateTime: string; endDateTime: string; active: boolean; formConfigId: string | null; formConfig: FormConfig | null; inventory: WorkshopStock[]; guests: Guest[]; }
interface Stats {
  totalGuests: number;
  openCarts: number;
  totalProducts: number;
  totalRevenue: number;
}
interface Notification {
  id: string;
  message: string;
  type: string;
  createdAt: string;
}
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
  guest: { 
    profileData: any;
    workshop: { name: string };
  };
  items: CartItem[];
}
type Tab = "details" | "inventory" | "guests" | "metrics" | "notifications" | "orders";

export default function WorkshopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("inventory");

  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifMessage, setNotifMessage] = useState("");
  const [notifType, setNotifType] = useState("info");

  const [orders, setOrders] = useState<Cart[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [activeOrderStatusTab, setActiveOrderStatusTab] = useState("ORDERED");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Orders Filter States
  const [ordersSearchQuery, setOrdersSearchQuery] = useState("");
  const [ordersStatusFilter, setOrdersStatusFilter] = useState<"all" | "active" | "inactive">("active");
  const [ordersStartDateFilter, setOrdersStartDateFilter] = useState("");
  const [ordersEndDateFilter, setOrdersEndDateFilter] = useState("");

  const [allConfigs, setAllConfigs] = useState<FormConfig[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [draftStock, setDraftStock] = useState<Record<string, number>>({});
  const [saveStockLoading, setSaveStockLoading] = useState(false);

  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestsLoading, setGuestsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const [sortKey, setSortKey] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [showEditGuestModal, setShowEditGuestModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [showBatchGuestModal, setShowBatchGuestModal] = useState(false);
  const [newGuestData, setNewGuestData] = useState<Record<string, any>>({});
  const [batchGuests, setBatchGuests] = useState<Record<string, any>[]>([{}]);
  const [guestOpLoading, setGuestOpLoading] = useState(false);

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [detailsForm, setDetailsForm] = useState({ name: "", location: "", startDateTime: "", endDateTime: "", description: "", formConfigId: "" });
  const [saveDetailsLoading, setSaveDetailsLoading] = useState(false);

  async function fetchWorkshop() {
    try {
      const res = await fetch(`/api/admin/workshops/${id}?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setWorkshop(data.workshop);
        setDetailsForm({
          name: data.workshop.name,
          location: data.workshop.location,
          startDateTime: data.workshop.startDateTime.slice(0, 16),
          endDateTime: data.workshop.endDateTime.slice(0, 16),
          description: data.workshop.description || "",
          formConfigId: data.workshop.formConfigId || ""
        });
        if (data.workshop.formConfig?.fields?.[0] && !searchKey) {
          setSearchKey(data.workshop.formConfig.fields[0].key);
        }
        if (visibleColumns.length === 0 && data.workshop.formConfig?.fields) {
          setVisibleColumns(data.workshop.formConfig.fields.slice(0, 3).map((f: any) => f.key));
        }
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  async function fetchAllConfigs() {
    try {
      const res = await fetch("/api/admin/guest-settings");
      if (res.ok) {
        const data = await res.json();
        setAllConfigs(data.configs);
      }
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchWorkshop();
    fetchAllConfigs();
  }, [id]);

  useEffect(() => {
    if (activeTab === "inventory" && allProducts.length === 0) fetchProducts();
    if (activeTab === "guests") fetchGuests();
    if (activeTab === "metrics") fetchStats();
    if (activeTab === "notifications") fetchNotifications();
    if (activeTab === "orders") {
      fetchOrders();
      const interval = setInterval(fetchOrders, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab, ordersSearchQuery, ordersStatusFilter, ordersStartDateFilter, ordersEndDateFilter]);

  async function fetchOrders() {
    setOrdersLoading(true);
    try {
      const params = new URLSearchParams({
        workshopId: id,
        search: ordersSearchQuery,
        status: ordersStatusFilter,
        startDate: ordersStartDateFilter,
        endDate: ordersEndDateFilter
      });
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
      }
    } catch { /* ignore */ } finally { setOrdersLoading(false); }
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) fetchOrders();
    } catch { /* ignore */ } finally { setUpdatingOrderId(null); }
  }

  async function fetchStats() {
    setStatsLoading(true);
    try {
      const res = await fetch(`/api/admin/workshops/${id}/stats`);
      if (res.ok) setStats((await res.json()).stats);
    } catch { /* ignore */ } finally { setStatsLoading(false); }
  }

  async function fetchNotifications() {
    setNotifLoading(true);
    try {
      const res = await fetch(`/api/admin/dashboard/notifications?workshopId=${id}`);
      if (res.ok) setNotifications((await res.json()).notifications);
    } catch { /* ignore */ } finally { setNotifLoading(false); }
  }

  async function createNotification() {
    if (!notifMessage) return;
    const res = await fetch("/api/admin/dashboard/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: notifMessage, type: notifType, workshopId: id })
    });
    if (res.ok) {
      setNotifMessage("");
      fetchNotifications();
    }
  }

  async function deleteNotification(notifId: string) {
    const res = await fetch("/api/admin/dashboard/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: notifId })
    });
    if (res.ok) fetchNotifications();
  }

  async function fetchProducts() {
    try {
      const res = await fetch("/api/admin/products");
      if (res.ok) {
        const data = await res.json();
        setAllProducts(data.products);
      }
    } catch { /* ignore */ }
  }

  async function fetchGuests() {
    setGuestsLoading(true);
    try {
      const url = `/api/admin/workshops/${id}/guests?q=${searchQuery}&key=${searchKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setGuests(data.guests);
      }
    } catch { /* ignore */ } finally { setGuestsLoading(false); }
  }

  useEffect(() => {
    if (activeTab !== "guests") return;
    const timer = setTimeout(() => { fetchGuests(); }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchKey]);

  // FIXED SORTING LOGIC: Handle Numbers correctly
  const sortedGuests = useMemo(() => {
    return [...guests].sort((a, b) => {
      let valA, valB;
      if (sortKey === "createdAt") { valA = new Date(a.createdAt).getTime(); valB = new Date(b.createdAt).getTime(); }
      else { valA = a.profileData[sortKey]; valB = b.profileData[sortKey]; }

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      // Detect field type from blueprint for correct sorting
      const field = workshop?.formConfig?.fields.find(f => f.key === sortKey);
      const isNumeric = field?.type === 'number' || field?.type === 'formula';

      if (isNumeric) {
        const numA = parseFloat(valA) || 0;
        const numB = parseFloat(valB) || 0;
        return sortOrder === "asc" ? numA - numB : numB - numA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortOrder === "asc" ? -1 : 1;
      if (strA > strB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [guests, sortKey, sortOrder, workshop]);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortOrder("asc"); }
  };

  async function toggleCheckIn(e: React.MouseEvent, guestId: string, currentStatus: boolean) {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/admin/workshops/${id}/guests/${guestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkInStatus: !currentStatus }),
      });
      if (res.ok) fetchGuests();
    } catch { /* ignore */ }
  }

  async function deleteGuest(e: React.MouseEvent, guestId: string) {
    e.stopPropagation();
    if (!confirm("Permanently delete registration?")) return;
    try {
      const res = await fetch(`/api/admin/workshops/${id}/guests/${guestId}`, { method: "DELETE" });
      if (res.ok) fetchGuests();
    } catch { /* ignore */ }
  }

  async function addManualGuest() {
    setGuestOpLoading(true);
    try {
      const res = await fetch(`/api/admin/workshops/${id}/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileData: newGuestData }),
      });
      if (res.ok) { setShowAddGuestModal(false); setNewGuestData({}); fetchGuests(); }
    } catch { /* ignore */ } finally { setGuestOpLoading(false); }
  }

  async function updateGuest() {
    if (!editingGuest) return;
    setGuestOpLoading(true);
    try {
      const res = await fetch(`/api/admin/workshops/${id}/guests/${editingGuest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileData: newGuestData }),
      });
      if (res.ok) { setShowEditGuestModal(false); setEditingGuest(null); setNewGuestData({}); fetchGuests(); }
    } catch { /* ignore */ } finally { setGuestOpLoading(false); }
  }

  async function addBatchGuests() {
    setGuestOpLoading(true);
    try {
      await Promise.all(batchGuests.map(g =>
        fetch(`/api/admin/workshops/${id}/guests`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profileData: g }),
        })
      ));
      setShowBatchGuestModal(false); setBatchGuests([{}]); fetchGuests();
    } catch { /* ignore */ } finally { setGuestOpLoading(false); }
  }

  const [globalInitQty, setGlobalInitQty] = useState<number>(0);

  async function saveStock() {
    setSaveStockLoading(true);
    try {
      const updates = Object.entries(draftStock).map(([productId, quantity]) => ({ productId, quantity }));
      const res = await fetch(`/api/admin/workshops/${id}/stock`, { 
        method: "PATCH", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ updates }), 
      });
      if (res.ok) { 
        alert("Stoklar başarıyla güncellendi.");
        await fetchWorkshop(); 
        setDraftStock({}); 
      } else {
        alert("Stoklar güncellenirken bir hata oluştu.");
      }
    } catch (error) {
      console.error(error);
      alert("Sunucuya ulaşılamadı.");
    } finally { setSaveStockLoading(false); }
  }

  async function initializeAllStock() {
    if (!confirm(`Tüm ürünlerin stok miktarını ${globalInitQty} olarak güncellemek istediğinize emin misiniz?`)) return;
    try {
      const res = await fetch(`/api/admin/workshops/${id}/stock/initialize`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initialQuantity: globalInitQty })
      });
      if (res.ok) {
        alert("Stoklar başarıyla tanımlandı.");
        fetchWorkshop();
      } else {
        const err = await res.json();
        alert(`Hata: ${err.error || "İşlem başarısız"}`);
      }
    } catch (error) {
      console.error(error);
      alert("Sunucuya ulaşılamadı.");
    }
  }

  async function saveDetails() {
    setSaveDetailsLoading(true);
    try {
      const res = await fetch(`/api/admin/workshops/${id}`, { 
        method: "PATCH", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(detailsForm), 
      });
      if (res.ok) { 
        await fetchWorkshop(); 
        setIsEditingDetails(false); 
      }
    } catch { /* ignore */ } finally { setSaveDetailsLoading(false); }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-5 w-5 border-2 border-foreground border-t-transparent rounded-full" /></div>;
  if (!workshop) return null;

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4">
      <div className="mb-12">
        <button onClick={() => router.push("/admin/workshops")} className="text-[10px] font-bold text-muted hover:text-foreground mb-4 uppercase tracking-[0.2em] flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>GERİ DÖN</button>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div><h1 className="text-4xl font-bold tracking-tight">{workshop.name}</h1><p className="text-xs font-bold text-muted uppercase tracking-[0.3em] mt-2 opacity-60">{workshop.location}</p></div>
          <div className="flex bg-secondary/50 p-1 rounded-2xl border border-border">
            {[
              { id: "inventory", label: "ENVANTER" },
              { id: "guests", label: "KATILIMCILAR" },
              { id: "orders", label: "SİPARİŞLER" },
              { id: "metrics", label: "METRİKLER" },
              { id: "notifications", label: "DUYURULAR" },
              { id: "details", label: "DETAYLAR" }
            ].map(t => (
              <button 
                key={t.id} 
                onClick={() => setActiveTab(t.id as Tab)} 
                className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted hover:text-foreground"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Entry Hub QR Code (Quick Access for Guests) */}
      <div className="mb-8 p-8 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center gap-8 shadow-xl">
         <div className="bg-white p-3 rounded-2xl shrink-0">
            <QRCodeSVG 
               value={process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== "undefined" ? window.location.origin : "")} 
               size={80} 
            />
         </div>
         <div className="space-y-2">
            <h3 className="text-white font-bold">Giriş QR Kodu (Uygulama Yükleme)</h3>
            <p className="text-zinc-500 text-xs">Misafirlerin uygulamayı yüklemesi için bu kodu taratması yeterlidir. Ardından uygulama içerisinden profillerini taratabilirler.</p>
            <div className="text-[10px] font-mono text-zinc-400 bg-black/30 p-2 rounded-lg">{process.env.NEXT_PUBLIC_BASE_URL || "/"}</div>
         </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === "inventory" && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 bg-card border border-border rounded-3xl">
              <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight">Stok Orkestrasyonu</h2>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Atölye fiziksel envanterini buradan yönetin</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 bg-secondary/50 p-2 rounded-2xl border border-border">
                  <span className="text-[10px] font-black text-muted uppercase tracking-widest pl-2">Başlangıç:</span>
                  <input 
                    type="number" 
                    value={globalInitQty}
                    onChange={(e) => setGlobalInitQty(parseInt(e.target.value) || 0)}
                    className="w-16 bg-card border border-border rounded-xl px-2 py-2 text-xs font-black text-center focus:outline-none"
                  />
                  <button 
                    onClick={initializeAllStock}
                    className="px-6 py-2 rounded-xl bg-foreground text-background text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
                  >
                    Tüm Ürünleri Tanımla
                  </button>
                </div>
                <div className="w-[1px] h-8 bg-border" />
                <button 
                  onClick={saveStock} 
                  disabled={saveStockLoading || Object.keys(draftStock).length === 0} 
                  className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl transition-all ${Object.keys(draftStock).length > 0 ? 'bg-blue-600 text-white animate-pulse' : 'bg-secondary text-muted cursor-not-allowed'}`}
                >
                  {saveStockLoading ? "EŞİTLENİYOR..." : "STOKLARI KAYDET"}
                </button>
              </div>
            </div>
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-secondary/30"><th className="px-8 py-5 text-[9px] font-bold uppercase tracking-widest text-muted">Ürün</th><th className="px-8 py-5 text-[9px] font-bold uppercase tracking-widest text-muted text-right">Fiyat</th><th className="px-8 py-5 text-[9px] font-bold uppercase tracking-widest text-muted text-center">Atölye Stoğu</th></tr></thead>
                <tbody className="divide-y divide-border">{allProducts.map((p) => {
                  const currentStock = workshop.inventory.find(i => i.productId === p.id)?.quantity || 0;
                  const draftQty = draftStock[p.id] !== undefined ? draftStock[p.id] : currentStock;
                  const isChanged = draftStock[p.id] !== undefined && draftStock[p.id] !== currentStock;
                  return (<tr key={p.id} className="hover:bg-secondary/10 transition-colors"><td className="px-8 py-5"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-lg bg-muted overflow-hidden border border-border/50">{p.media?.[0] && <img src={p.media[0].url} className="w-full h-full object-cover" alt="" />}</div><span className="font-bold text-sm">{p.name}</span></div></td><td className="px-8 py-5 text-right font-bold text-sm text-muted-foreground">₺{p.price.toFixed(2)}</td><td className="px-8 py-5"><div className="flex items-center justify-center gap-4"><button onClick={() => setDraftStock({ ...draftStock, [p.id]: Math.max(0, draftQty - 1) })} className="p-1.5 rounded-lg hover:bg-secondary"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /></svg></button><input type="number" value={draftQty} onChange={(e) => setDraftStock({ ...draftStock, [p.id]: parseInt(e.target.value) || 0 })} className={`w-20 px-2 py-2 rounded-xl bg-secondary border border-transparent text-center text-sm font-bold transition-all ${isChanged ? "text-foreground" : "text-muted-foreground"}`} /><button onClick={() => setDraftStock({ ...draftStock, [p.id]: draftQty + 1 })} className="p-1.5 rounded-lg hover:bg-secondary"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg></button></div></td></tr>);
                })}</tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "details" && (
          <div className="space-y-8">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6 bg-card border border-border rounded-[2.5rem] p-10 shadow-sm">
                   <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold tracking-tight">Eğitim Bilgileri</h2>
                      <button 
                        onClick={() => setIsEditingDetails(!isEditingDetails)}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isEditingDetails ? 'bg-foreground text-background' : 'bg-secondary text-muted hover:text-foreground'}`}
                      >
                        {isEditingDetails ? 'Düzenlemeyi Kapat' : 'Düzenle'}
                      </button>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted uppercase tracking-widest">Eğitim Adı</label>
                        <input 
                          disabled={!isEditingDetails}
                          value={detailsForm.name}
                          onChange={(e) => setDetailsForm({...detailsForm, name: e.target.value})}
                          className="w-full bg-secondary/30 disabled:bg-transparent border border-border/50 px-5 py-4 rounded-2xl text-sm font-bold transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted uppercase tracking-widest">Konum</label>
                        <input 
                          disabled={!isEditingDetails}
                          value={detailsForm.location}
                          onChange={(e) => setDetailsForm({...detailsForm, location: e.target.value})}
                          className="w-full bg-secondary/30 disabled:bg-transparent border border-border/50 px-5 py-4 rounded-2xl text-sm font-bold transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted uppercase tracking-widest">Başlangıç</label>
                        <input 
                          type="datetime-local"
                          disabled={!isEditingDetails}
                          value={detailsForm.startDateTime}
                          onChange={(e) => setDetailsForm({...detailsForm, startDateTime: e.target.value})}
                          className="w-full bg-secondary/30 disabled:bg-transparent border border-border/50 px-5 py-4 rounded-2xl text-sm font-bold transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted uppercase tracking-widest">Bitiş</label>
                        <input 
                          type="datetime-local"
                          disabled={!isEditingDetails}
                          value={detailsForm.endDateTime}
                          onChange={(e) => setDetailsForm({...detailsForm, endDateTime: e.target.value})}
                          className="w-full bg-secondary/30 disabled:bg-transparent border border-border/50 px-5 py-4 rounded-2xl text-sm font-bold transition-all"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-muted uppercase tracking-widest">Kayıt Taslağı (Blueprint)</label>
                        <select
                          disabled={!isEditingDetails}
                          value={detailsForm.formConfigId}
                          onChange={(e) => setDetailsForm({...detailsForm, formConfigId: e.target.value})}
                          className="w-full bg-secondary/30 disabled:bg-transparent border border-border/50 px-5 py-4 rounded-2xl text-sm font-bold transition-all appearance-none"
                        >
                          <option value="">Seçilmedi</option>
                          {allConfigs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-muted uppercase tracking-widest">Açıklama</label>
                        <textarea 
                          disabled={!isEditingDetails}
                          value={detailsForm.description}
                          onChange={(e) => setDetailsForm({...detailsForm, description: e.target.value})}
                          rows={4}
                          className="w-full bg-secondary/30 disabled:bg-transparent border border-border/50 px-5 py-4 rounded-2xl text-sm font-bold transition-all resize-none"
                        />
                      </div>
                   </div>

                   {isEditingDetails && (
                      <div className="pt-6 border-t border-border mt-8">
                         <button 
                          onClick={saveDetails}
                          disabled={saveDetailsLoading}
                          className="w-full py-4 rounded-2xl bg-foreground text-background text-xs font-black uppercase tracking-widest shadow-xl hover:opacity-90 transition-all"
                         >
                           {saveDetailsLoading ? "KAYDEDİLİYOR..." : "DEĞİŞİKLİKLERİ KAYDET"}
                         </button>
                      </div>
                   )}
                </div>

                <div className="space-y-8">
                   {/* Status Card */}
                   <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm space-y-6">
                      <h3 className="text-[10px] font-black text-muted uppercase tracking-widest">Eğitim Durumu</h3>
                      <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-2xl border border-border/50">
                         <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${workshop.active ? 'bg-green-500 animate-pulse' : 'bg-destructive'}`} />
                            <span className="text-xs font-bold">{workshop.active ? 'Aktif' : 'Askıda'}</span>
                         </div>
                         <button 
                          onClick={async () => {
                            const res = await fetch(`/api/admin/workshops/${id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ active: !workshop.active })
                            });
                            if (res.ok) fetchWorkshop();
                          }}
                          className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${workshop.active ? 'bg-destructive/10 text-destructive hover:bg-destructive hover:text-white' : 'bg-green-500 text-white'}`}
                         >
                           {workshop.active ? 'Durdur' : 'Aktifleştir'}
                         </button>
                      </div>
                   </div>

                   {/* Danger Zone */}
                   <div className="bg-destructive/5 border border-destructive/20 rounded-[2.5rem] p-8 space-y-6">
                      <h3 className="text-[10px] font-black text-destructive uppercase tracking-widest">Tehlikeli Alan</h3>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">Bu eğitim ve tüm kayıtlı katılımcı verileri kalıcı olarak silinecektir. Bu işlem geri alınamaz.</p>
                      <button 
                        onClick={async () => {
                          if (!confirm("Bu eğitimi ve tüm verilerini kalıcı olarak silmek istediğinizden emin misiniz?")) return;
                          const res = await fetch(`/api/admin/workshops/${id}`, { method: "DELETE" });
                          if (res.ok) router.push("/admin/workshops");
                        }}
                        className="w-full py-4 rounded-2xl bg-destructive text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-destructive/20 hover:opacity-90 transition-all"
                      >
                        Eğitimi Kalıcı Olarak Sil
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* ─── GUESTS TAB (FIXED SORT & SEARCH) ────────────────────── */}
        {activeTab === "guests" && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 bg-card border border-border rounded-3xl">
              <div className="flex-1 max-w-xl flex items-center gap-4">
                <div className="relative group flex-1">
                  <input type="text" placeholder={`Search by ${workshop.formConfig?.fields.find(f => f.key === searchKey)?.label || 'key'}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-secondary border border-border text-sm font-bold focus:outline-none" /><svg className="absolute left-4 top-4 text-muted" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                </div>
                {/* RESTORED SEARCH TARGET DROPDOWN */}
                <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-xl border border-border shrink-0">
                  <span className="text-[10px] font-bold text-muted uppercase">Target:</span>
                  <select value={searchKey} onChange={(e) => setSearchKey(e.target.value)} className="bg-card text-[10px] font-bold uppercase focus:outline-none">
                    {workshop.formConfig?.fields.filter(f => f.type !== 'formula').map(f => (<option key={f.key} value={f.key}>{f.label}</option>))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative"><button onClick={() => setShowColumnPicker(!showColumnPicker)} className="px-4 py-2.5 rounded-xl border border-border text-[10px] font-bold uppercase hover:bg-secondary">Columns</button>
                  {showColumnPicker && (<div className="absolute right-0 top-12 w-64 bg-card border border-border rounded-2xl shadow-2xl z-50 p-6 space-y-4"><h4 className="text-[10px] font-bold text-muted uppercase">Visible Fields</h4><div className="space-y-2 max-h-48 overflow-y-auto">{workshop.formConfig?.fields.map(f => (<label key={f.key} className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={visibleColumns.includes(f.key)} onChange={() => { if (visibleColumns.includes(f.key)) setVisibleColumns(visibleColumns.filter(c => c !== f.key)); else setVisibleColumns([...visibleColumns, f.key]); }} className="rounded border-border text-foreground" /><span className="text-xs font-bold">{f.label}</span></label>))}</div></div>)}
                </div>
                <button onClick={() => { setNewGuestData({}); setShowAddGuestModal(true); }} className="px-6 py-3 rounded-xl bg-foreground text-background text-[10px] font-bold uppercase">+ Add</button>
                <button onClick={() => { setBatchGuests([{}]); setShowBatchGuestModal(true); }} className="px-6 py-3 rounded-xl bg-secondary text-foreground text-[10px] font-bold uppercase tracking-widest">+ Batch</button>
                <button onClick={() => window.open(`/admin/workshops/${id}/print`, '_blank')} className="px-6 py-3 rounded-xl bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                   Print All
                </button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-secondary/30">
                      <th onClick={() => toggleSort("createdAt")} className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted cursor-pointer hover:text-foreground transition-colors">
                        Protocol {sortKey === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      {workshop.formConfig?.fields.filter(f => visibleColumns.includes(f.key)).map(f => (
                        <th key={f.key} onClick={() => toggleSort(f.key)} className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted cursor-pointer hover:text-foreground transition-colors">
                          {f.label} {sortKey === f.key && (sortOrder === "asc" ? "↑" : "↓")}
                        </th>
                      ))}
                      <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted text-right">Administrative Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {sortedGuests.map(guest => (
                      <tr 
                        key={guest.id} 
                        onClick={() => router.push(`/admin/guests/${guest.id}`)} 
                        className={`group cursor-pointer transition-all duration-300 ${guest.checkInStatus ? "bg-green-500/[0.02] hover:bg-green-500/[0.05]" : "hover:bg-secondary/10"}`}
                      >
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black transition-all group-hover:scale-110 ${guest.checkInStatus ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "bg-secondary text-muted"}`}>
                              {guest.checkInStatus ? "✓" : guest.profileData.full_name?.charAt(0) || "?"}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase tracking-widest">{guest.checkInStatus ? "Authorized" : "Pending"}</span>
                              <span className="text-[9px] font-mono text-muted-foreground opacity-60">#{guest.id.split('-')[0]}</span>
                            </div>
                          </div>
                        </td>
                        {workshop.formConfig?.fields.filter(f => visibleColumns.includes(f.key)).map(f => (
                          <td key={f.key} className="px-10 py-6">
                            <div className="flex flex-col">
                               <span className="text-sm font-bold text-foreground/90">{guest.profileData[f.key] || "—"}</span>
                               <span className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground/40">{f.label}</span>
                            </div>
                          </td>
                        ))}
                        <td className="px-10 py-6 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                            <button 
                              onClick={(e) => { e.stopPropagation(); window.open(`/admin/workshops/${id}/print?guestId=${guest.id}`, '_blank'); }} 
                              className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all shadow-sm" 
                              title="Print Paperwork"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                            </button>
                            <button 
                              onClick={(e) => toggleCheckIn(e, guest.id, guest.checkInStatus)} 
                              className={`h-10 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${guest.checkInStatus ? "bg-white text-green-600 border-2 border-green-500/20" : "bg-foreground text-background"}`}
                            >
                              {guest.checkInStatus ? "Revoke" : "Check-In"}
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setEditingGuest(guest); setNewGuestData(guest.profileData); setShowEditGuestModal(true); }} 
                              className="w-10 h-10 rounded-xl bg-secondary text-muted flex items-center justify-center hover:text-foreground transition-all" 
                              title="Modify Registry"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </button>
                            <button 
                              onClick={(e) => deleteGuest(e, guest.id)} 
                              className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-white transition-all shadow-sm shadow-destructive/10" 
                              title="Terminate Record"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── METRICS TAB ────────────────────── */}
        {activeTab === "metrics" && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Toplam Katılımcı", value: stats?.totalGuests, desc: "Kayıtlı misafirler", color: "text-foreground" },
                { label: "Açık Sepetler", value: stats?.openCarts, desc: "Ödeme bekleyen", color: "text-orange-500" },
                { label: "Envanter Çeşitliliği", value: stats?.totalProducts, desc: "Atölyedeki ürünler", color: "text-foreground" },
                { label: "Atölye Cirosu", value: `₺${stats?.totalRevenue.toFixed(2)}`, desc: "Tamamlanan satışlar", color: "text-blue-600" },
              ].map((card) => (
                <div key={card.label} className="bg-card border border-border/40 rounded-[2rem] p-8 shadow-sm space-y-4 hover:border-foreground/10 transition-all">
                  <p className="text-[10px] font-black text-muted uppercase tracking-widest">{card.label}</p>
                  <p className={`text-4xl font-black tracking-tighter ${card.color}`}>{card.value ?? "—"}</p>
                  <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">{card.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-card border border-border rounded-[2.5rem] p-10">
               <h3 className="text-xl font-bold tracking-tight mb-8">Atölye Performans Özeti</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  <div className="space-y-2">
                     <p className="text-[9px] font-black text-muted uppercase tracking-widest">Doluluk Oranı</p>
                     <p className="text-2xl font-bold">100%</p>
                     <p className="text-[10px] text-muted-foreground">Kapasiteye göre (statik)</p>
                  </div>
                  <div className="space-y-2">
                     <p className="text-[9px] font-black text-muted uppercase tracking-widest">Ort. Harcama</p>
                     <p className="text-2xl font-bold">₺{stats && stats.totalGuests > 0 ? (stats.totalRevenue / stats.totalGuests).toFixed(2) : "0.00"}</p>
                     <p className="text-[10px] text-muted-foreground">Katılımcı başına ciro</p>
                  </div>
                  <div className="space-y-2">
                     <p className="text-[9px] font-black text-muted uppercase tracking-widest">İşlem Hacmi</p>
                     <p className="text-2xl font-bold">{stats?.openCarts || 0} Aktif</p>
                     <p className="text-[10px] text-muted-foreground">Bekleyen sipariş sayısı</p>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* ─── NOTIFICATIONS TAB ────────────────────── */}
        {/* ─── ORDERS TAB ────────────────────── */}
        {activeTab === "orders" && (
          <div className="space-y-8">
            <div className="bg-card border border-border rounded-3xl p-6 flex flex-col lg:flex-row gap-6 shadow-sm">
               <div className="flex-1 relative group">
                  <input 
                    type="text" 
                    placeholder="Siparişlerde ara (isim, ürün)..." 
                    value={ordersSearchQuery}
                    onChange={(e) => setOrdersSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl bg-secondary border border-transparent focus:border-foreground/10 focus:bg-card outline-none transition-all font-bold text-sm"
                  />
                  <svg className="absolute left-4 top-3.5 text-muted" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
               </div>
               
               <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-2xl border border-border">
                    {[
                      { id: "ORDERED", label: "YENİ" },
                      { id: "PREPARING", label: "HAZIRLANIYOR" },
                      { id: "READY", label: "HAZIR" },
                      { id: "PAID", label: "TAMAMLANDI" }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveOrderStatusTab(tab.id)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeOrderStatusTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted hover:text-foreground"}`}
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
                  
                  <button 
                    onClick={() => { setOrdersSearchQuery(""); setOrdersStatusFilter("active"); setOrdersStartDateFilter(""); setOrdersEndDateFilter(""); }}
                    className="p-2 text-muted hover:text-destructive transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                  </button>
               </div>
            </div>

            {ordersLoading && orders.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin h-5 w-5 border-2 border-foreground border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {orders.filter(o => o.status === activeOrderStatusTab).map(order => (
                  <div key={order.id} className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm flex flex-col hover:border-foreground/10 transition-all">
                    <div className="p-6 border-b border-border bg-secondary/10 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-tighter text-muted">#{order.id.split('-')[0]}</span>
                        <h3 className="text-sm font-black mt-1">{order.guest.profileData.full_name || "İsimsiz Katılımcı"}</h3>
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
                      {activeOrderStatusTab === "ORDERED" && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, "PREPARING")}
                          disabled={updatingOrderId === order.id}
                          className="w-full py-3 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
                        >
                          {updatingOrderId === order.id ? "İŞLENİYOR..." : "HAZIRLAMAYA BAŞLA"}
                        </button>
                      )}
                      {activeOrderStatusTab === "PREPARING" && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, "READY")}
                          disabled={updatingOrderId === order.id}
                          className="w-full py-3 rounded-xl bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all"
                        >
                          {updatingOrderId === order.id ? "İŞLENİYOR..." : "HAZIR OLARAK İŞARETLE"}
                        </button>
                      )}
                      {activeOrderStatusTab === "READY" && (
                        <button 
                          onClick={() => updateOrderStatus(order.id, "PAID")}
                          disabled={updatingOrderId === order.id}
                          className="w-full py-3 rounded-xl bg-green-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all"
                        >
                          {updatingOrderId === order.id ? "İŞLENİYOR..." : "TESLİM ET VE ÖDEME AL"}
                        </button>
                      )}
                      {activeOrderStatusTab === "PAID" && (
                        <div className="py-2 text-center">
                          <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">✓ TAMAMLANDI</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {orders.filter(o => o.status === activeOrderStatusTab).length === 0 && (
                  <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-[2rem]">
                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Bu aşamada sipariş bulunmuyor</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {activeTab === "notifications" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
            <div className="xl:col-span-1 space-y-8">
               <div className="space-y-2">
                  <h2 className="text-xl font-bold tracking-tight">Duyuru Merkezi</h2>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Sadece bu atölyenin katılımcılarına mesaj gönder</p>
               </div>
               
               <div className="bg-card border border-border/40 rounded-[2.5rem] p-8 shadow-sm space-y-6">
                  <div className="space-y-4">
                     <textarea 
                      value={notifMessage}
                      onChange={(e) => setNotifMessage(e.target.value)}
                      placeholder="Duyuru mesajınızı yazın..."
                      className="w-full px-5 py-4 rounded-2xl bg-secondary/50 border-2 border-transparent focus:border-foreground/10 focus:bg-card outline-none transition-all font-bold text-sm min-h-[120px] resize-none"
                     />
                     <div className="flex gap-2">
                        {["info", "warning", "success"].map((t) => (
                          <button 
                            key={t}
                            onClick={() => setNotifType(t)}
                            className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2 ${notifType === t ? 'bg-foreground text-background border-foreground' : 'bg-secondary/30 text-muted border-transparent hover:border-border'}`}
                          >
                            {t}
                          </button>
                        ))}
                     </div>
                  </div>
                  <button 
                    onClick={createNotification}
                    className="w-full py-4 rounded-2xl bg-foreground text-background font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    Yayınla
                  </button>
               </div>
            </div>

            <div className="xl:col-span-2 space-y-8">
               <div className="space-y-2">
                  <h2 className="text-xl font-bold tracking-tight">Atölye Duyuruları</h2>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Bu atölye için yayınlanan mesajlar</p>
               </div>

               <div className="space-y-4">
                  {notifications.map((n) => (
                    <div key={n.id} className="bg-card border border-border/40 rounded-[2rem] p-6 flex items-start justify-between gap-6 group hover:shadow-md transition-all">
                       <div className="flex gap-6">
                          <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.type === 'warning' ? 'bg-orange-500 animate-pulse' : n.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`} />
                          <div className="space-y-1">
                             <p className="text-sm font-bold text-foreground/90">{n.message}</p>
                             <p className="text-[9px] font-black text-muted uppercase tracking-widest">{new Date(n.createdAt).toLocaleString('tr-TR')}</p>
                          </div>
                       </div>
                       <button 
                        onClick={() => deleteNotification(n.id)}
                        className="p-2 rounded-full hover:bg-destructive/10 text-muted hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                       </button>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="py-20 text-center bg-secondary/20 rounded-[2rem] border border-dashed border-border">
                       <p className="text-[9px] font-black text-muted uppercase tracking-widest italic">Bu atölye için yayınlanmış duyuru bulunmuyor</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showAddGuestModal || showEditGuestModal} onClose={() => { setShowAddGuestModal(false); setShowEditGuestModal(false); setEditingGuest(null); }} title={editingGuest ? "Katılımcı Güncelle" : "Yeni Katılımcı Kaydı"} maxWidth="2xl"><div className="p-12 space-y-8"><div className="space-y-6">{workshop.formConfig?.fields.filter(f => f.type !== 'formula').map(field => (<div key={field.id} className="space-y-2"><label className="text-[10px] font-bold text-muted uppercase tracking-widest">{field.label}</label>{field.type === 'checkbox' ? (<button onClick={() => setNewGuestData({ ...newGuestData, [field.key]: !newGuestData[field.key] })} className={`w-full py-4 rounded-xl text-xs font-bold border ${newGuestData[field.key] ? "bg-foreground text-background" : "bg-secondary text-muted"}`}>{newGuestData[field.key] ? "EVET" : "HAYIR"}</button>) : (<input type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'time' ? 'time' : 'text'} value={newGuestData[field.key] || ""} onChange={e => setNewGuestData({ ...newGuestData, [field.key]: e.target.value })} className="w-full bg-secondary border border-border px-4 py-3 rounded-xl text-sm font-bold" />)}</div>))}</div><div className="flex items-center gap-4 pt-8"><button onClick={() => { setShowAddGuestModal(false); setShowEditGuestModal(false); }} className="flex-1 py-4 text-xs font-bold text-muted">İPTAL</button><button onClick={editingGuest ? updateGuest : addManualGuest} disabled={guestOpLoading} className="flex-1 py-4 rounded-xl bg-foreground text-background text-xs font-bold">{guestOpLoading ? "KAYDEDİLİYOR..." : (editingGuest ? "GÜNCELLE" : "KAYDET")}</button></div></div></Modal>
      <Modal isOpen={showBatchGuestModal} onClose={() => setShowBatchGuestModal(false)} title="Toplu Kayıt Merkezi" maxWidth="4xl"><div className="p-12 space-y-8 max-h-[60vh] overflow-y-auto">{batchGuests.map((guest, gIdx) => (<div key={gIdx} className="p-8 rounded-3xl border border-border bg-card/50 space-y-6"><div className="flex justify-between"><h4 className="text-[10px] font-bold text-muted uppercase">Katılımcı #{gIdx + 1}</h4><button onClick={() => setBatchGuests(batchGuests.filter((_, i) => i !== gIdx))} className="text-destructive text-[10px] font-bold">SİL</button></div><div className="grid grid-cols-2 gap-6">{workshop.formConfig?.fields.filter(f => f.type !== 'formula').map(field => (<div key={field.id} className="space-y-1.5"><label className="text-[9px] font-bold text-muted uppercase">{field.label}</label>{field.type === 'checkbox' ? (<button onClick={() => { const copy = [...batchGuests]; copy[gIdx] = { ...copy[gIdx], [field.key]: !copy[gIdx][field.key] }; setBatchGuests(copy); }} className={`w-full py-2.5 rounded-xl text-[10px] font-bold border ${guest[field.key] ? "bg-foreground text-background" : "bg-secondary text-muted"}`}>{guest[field.key] ? "EVET" : "HAYIR"}</button>) : (<input type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'time' ? 'time' : 'text'} value={guest[field.key] || ""} onChange={e => { const copy = [...batchGuests]; copy[gIdx] = { ...copy[gIdx], [field.key]: e.target.value }; setBatchGuests(copy); }} className="w-full bg-secondary border border-border px-3 py-2 rounded-xl text-xs font-bold" />)}</div>))}</div></div>))}<button onClick={() => setBatchGuests([...batchGuests, {}])} className="w-full py-4 rounded-2xl border-2 border-dashed border-border text-muted text-[10px] font-bold uppercase tracking-widest">+ Yeni Satır Ekle</button></div><div className="p-12 border-t border-border flex items-center justify-between"><button onClick={() => setShowBatchGuestModal(false)} className="text-xs font-bold text-muted">İPTAL</button><button onClick={addBatchGuests} disabled={guestOpLoading} className="px-12 py-4 rounded-2xl bg-foreground text-background text-sm font-bold shadow-xl">{guestOpLoading ? "KAYDEDİLİYOR..." : `${batchGuests.length} KATILIMCIYI KAYDET`}</button></div></Modal>
    </div>
  );
}
