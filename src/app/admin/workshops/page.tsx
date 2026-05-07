"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";

interface Workshop {
  id: string;
  name: string;
  location: string;
  startDateTime: string;
  endDateTime: string;
  active: boolean;
  _count: {
    guests: number;
    inventory: number;
  };
}

export default function AdminWorkshopsPage() {
  const router = useRouter();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    startDateTime: "",
    endDateTime: "",
    description: "",
  });

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  async function fetchWorkshops() {
    try {
      const res = await fetch("/api/admin/workshops");
      if (res.ok) {
        const data = await res.json();
        setWorkshops(data.workshops);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWorkshops();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const res = await fetch("/api/admin/workshops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setFormData({ name: "", location: "", startDateTime: "", endDateTime: "", description: "" });
        fetchWorkshops();
      }
    } catch { /* ignore */ } finally {
      setCreateLoading(false);
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const filteredWorkshops = workshops.filter((workshop) => {
    const matchesSearch = workshop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workshop.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && workshop.active) ||
      (statusFilter === "inactive" && !workshop.active);

    const workshopStart = new Date(workshop.startDateTime);
    const matchesStartDate = !startDateFilter || workshopStart >= new Date(startDateFilter);
    const matchesEndDate = !endDateFilter || workshopStart <= new Date(endDateFilter);

    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-5 w-5 border-2 border-foreground border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workshops & Events</h1>
          <p className="text-muted text-xs uppercase tracking-[0.3em] mt-2 font-bold opacity-60">Event Scheduling & Inventory Control</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-8 py-2.5 rounded-xl bg-foreground text-background text-xs font-bold hover:opacity-90 transition-all shadow-lg"
        >
          SCHEDULE WORKSHOP
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-3xl p-6 mb-12 flex flex-col lg:flex-row gap-6 shadow-sm">
        <div className="flex-1 relative group">
          <input
            type="text"
            placeholder="Search by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-secondary border border-transparent focus:border-foreground/10 focus:bg-card outline-none transition-all font-bold text-sm"
          />
          <svg className="absolute left-4 top-4 text-muted" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
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

          <div className="h-8 w-[1px] bg-border mx-2 hidden lg:block" />

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
            onClick={() => { setSearchQuery(""); setStatusFilter("active"); setStartDateFilter(""); setEndDateFilter(""); }}
            className="p-2 text-muted hover:text-destructive transition-colors"
            title="Reset Filters"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkshops.map((workshop) => {
          const startDate = new Date(workshop.startDateTime);
          const isUpcoming = startDate > new Date();

          return (
            <div
              key={workshop.id}
              onClick={() => router.push(`/admin/workshops/${workshop.id}`)}
              className="group bg-card border border-border rounded-3xl p-8 hover:border-foreground/30 transition-all cursor-pointer shadow-sm hover:shadow-xl flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-6">
                <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${isUpcoming ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-muted text-muted-foreground border border-border"}`}>
                  {isUpcoming ? "Upcoming" : "Past Event"}
                </div>
                {!workshop.active && <span className="text-[9px] font-bold text-destructive uppercase">Inactive</span>}
              </div>

              <h3 className="text-xl font-bold mb-2 group-hover:underline transition-all">{workshop.name}</h3>
              <p className="text-xs text-muted-foreground mb-8 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                {workshop.location}
              </p>

              <div className="mt-auto space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border/50">
                  <div className="text-center flex-1 border-r border-border/50">
                    <span className="block text-lg font-bold">{workshop._count.inventory}</span>
                    <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Items</span>
                  </div>
                  <div className="text-center flex-1">
                    <span className="block text-lg font-bold">{workshop._count.guests}</span>
                    <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Guests</span>
                  </div>
                </div>

                <div className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2 pt-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                  {formatDate(workshop.startDateTime)}
                </div>
              </div>
            </div>
          );
        })}

        {filteredWorkshops.length === 0 && (
          <div className="col-span-full py-32 text-center border-2 border-dashed border-border rounded-3xl">
            <p className="text-xs font-bold text-muted uppercase tracking-[0.2em]">No workshops match your filters</p>
          </div>
        )}
      </div>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Schedule New Workshop" maxWidth="2xl">
        <form onSubmit={handleCreate} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold mb-1.5 text-muted uppercase tracking-widest">Workshop Name</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-1 focus:ring-foreground" placeholder="e.g. Bridal Masterclass" />
            </div>
            <div>
              <label className="block text-[10px] font-bold mb-1.5 text-muted uppercase tracking-widest">Location / Venue</label>
              <input type="text" required value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-1 focus:ring-foreground" placeholder="e.g. Hilton Ballroom A" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold mb-1.5 text-muted uppercase tracking-widest">Start Date & Time</label>
                <input type="datetime-local" required value={formData.startDateTime} onChange={(e) => setFormData({ ...formData, startDateTime: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-1 focus:ring-foreground" />
              </div>
              <div>
                <label className="block text-[10px] font-bold mb-1.5 text-muted uppercase tracking-widest">End Date & Time</label>
                <input type="datetime-local" required value={formData.endDateTime} onChange={(e) => setFormData({ ...formData, endDateTime: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-1 focus:ring-foreground" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold mb-1.5 text-muted uppercase tracking-widest">Description (Internal Notes)</label>
              <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-1 focus:ring-foreground resize-none" placeholder="Target audience, special requirements..." />
            </div>
          </div>
          <button type="submit" disabled={createLoading} className="w-full py-4 rounded-xl bg-foreground text-background text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg">
            {createLoading ? "SCHEDULING..." : "CREATE WORKSHOP"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
