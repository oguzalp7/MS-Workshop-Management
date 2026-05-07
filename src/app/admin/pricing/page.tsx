"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";

interface PriceTier {
  id: string;
  name: string;
  surchargePercentage: number;
  active: boolean;
  createdAt: string;
}

export default function PricingTiersPage() {
  const [tiers, setTiers] = useState<PriceTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTier, setEditingTier] = useState<Partial<PriceTier> | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [recalcLoading, setRecalcLoading] = useState<string | null>(null);

  async function fetchTiers() {
    try {
      const res = await fetch("/api/admin/price-tiers");
      if (res.ok) {
        const data = await res.json();
        setTiers(data.tiers);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTiers();
  }, []);

  async function handleSave() {
    if (!editingTier?.name) return;
    setModalLoading(true);
    try {
      const method = editingTier.id ? "PATCH" : "POST";
      const res = await fetch("/api/admin/price-tiers", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingTier)
      });
      if (res.ok) {
        setShowModal(false);
        fetchTiers();
      }
    } catch { /* ignore */ } finally {
      setModalLoading(false);
    }
  }

  async function handleRecalculate(tierId: string) {
    setRecalcLoading(tierId);
    try {
      const res = await fetch("/api/admin/price-tiers/recalculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierId })
      });
      if (res.ok) {
        alert("Global recalculation complete!");
      }
    } catch { /* ignore */ } finally {
      setRecalcLoading(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to remove this price tier?")) return;
    try {
      const res = await fetch("/api/admin/price-tiers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, softDeleted: true })
      });
      if (res.ok) fetchTiers();
    } catch { /* ignore */ }
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Price Tiers</h1>
          <p className="text-muted text-xs uppercase tracking-[0.3em] mt-2 font-bold opacity-60">Payment Methods & Dynamic Surcharges</p>
        </div>
        <button 
          onClick={() => { setEditingTier({ name: "", surchargePercentage: 0, active: true }); setShowModal(true); }}
          className="px-8 py-3 rounded-2xl bg-foreground text-background text-xs font-bold hover:opacity-90 transition-all shadow-xl shadow-foreground/10"
        >
          ADD NEW TIER
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <div key={tier.id} className="group relative bg-card border border-border rounded-3xl p-8 hover:shadow-2xl transition-all duration-500 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-foreground/[0.03] rounded-bl-[100%] translate-x-8 -translate-y-8" />
            
            <div className="relative space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold tracking-tight">{tier.name}</h3>
                  <p className="text-[10px] font-black uppercase text-muted tracking-widest mt-1">Payment Channel</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[9px] font-bold ${tier.active ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>
                  {tier.active ? "ACTIVE" : "DISABLED"}
                </div>
              </div>

              <div className="bg-secondary/30 rounded-2xl p-6 border border-border/50">
                <span className="text-[9px] font-black text-muted uppercase tracking-widest block mb-1">Current Surcharge</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black">{tier.surchargePercentage}%</span>
                  <span className="text-xs text-muted-foreground font-medium">on base price</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button 
                  onClick={() => { setEditingTier(tier); setShowModal(true); }}
                  className="flex-1 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleRecalculate(tier.id)}
                  disabled={recalcLoading === tier.id}
                  className="px-4 py-3 rounded-xl bg-foreground text-background hover:opacity-90 disabled:opacity-50 transition-all group/recalc"
                  title="Recalculate all products for this tier"
                >
                  {recalcLoading === tier.id ? (
                    <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover/recalc:rotate-180 transition-transform duration-500"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
                  )}
                </button>
                <button 
                  onClick={() => handleDelete(tier.id)}
                  className="p-3 rounded-xl hover:bg-destructive/10 text-muted hover:text-destructive transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
              </div>
            </div>
          </div>
        ))}

        {tiers.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-3xl">
            <p className="text-muted text-xs uppercase tracking-widest font-bold">No price tiers defined yet</p>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingTier?.id ? "Modify Price Tier" : "Create Price Tier"}>
        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Tier Name</label>
              <input 
                type="text" 
                placeholder="e.g. Cash Payment"
                value={editingTier?.name} 
                onChange={e => setEditingTier({...editingTier, name: e.target.value})}
                className="w-full px-6 py-4 rounded-2xl bg-secondary border border-transparent focus:border-foreground/20 focus:outline-none font-bold transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Surcharge (%)</label>
              <input 
                type="number" 
                step="0.01"
                placeholder="0.00"
                value={editingTier?.surchargePercentage} 
                onChange={e => setEditingTier({...editingTier, surchargePercentage: parseFloat(e.target.value)})}
                className="w-full px-6 py-4 rounded-2xl bg-secondary border border-transparent focus:border-foreground/20 focus:outline-none font-bold transition-all"
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button 
                onClick={() => setEditingTier({...editingTier, active: !editingTier?.active})}
                className={`w-12 h-6 rounded-full transition-all relative ${editingTier?.active ? "bg-green-500" : "bg-muted"}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${editingTier?.active ? "left-7" : "left-1"}`} />
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted">Active Tier</span>
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={modalLoading}
            className="w-full py-4 rounded-2xl bg-foreground text-background font-black text-xs uppercase tracking-widest shadow-xl shadow-foreground/10 hover:opacity-90 transition-all"
          >
            {modalLoading ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
