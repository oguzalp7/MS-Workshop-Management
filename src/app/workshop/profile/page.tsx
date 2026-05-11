"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";

interface Guest {
  id: string;
  shortCode?: string;
  profileData: any;
  workshop: {
    name: string;
    formConfig: { fields: any[] } | null;
  };
  carts: {
    id: string;
    orderNumber?: string;
    status: string;
    createdAt: string;
    totalAmount: number | null;
    priceTier: { name: string } | null;
    items: {
      quantity: number;
      priceAtPurchase: number | null;
      product: { name: string; price: number }
    }[]
  }[];
}

export default function ProfilePage() {
  const [guest, setGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/guest/profile");
      if (res.ok) {
        const data = await res.json();
        setGuest(data.guest);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  async function handleSaveProfile() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/guest/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileData: editFormData }),
      });
      if (res.ok) {
        setShowEditModal(false);
        fetchProfile();
      } else {
        const data = await res.json();
        setError(data.error || "Güncelleme başarısız oldu.");
      }
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-12 flex items-center justify-center"><div className="animate-spin h-5 w-5 border-2 border-foreground border-t-transparent rounded-full" /></div>;
  if (!guest) return null;

  const fields = guest.workshop.formConfig?.fields || [];

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    OPEN: { label: "AÇIK", color: "bg-blue-100 text-blue-700 border-blue-200" },
    ORDERED: { label: "SİPARİŞ ALINDI", color: "bg-blue-500 text-white border-blue-600" },
    PREPARING: { label: "HAZIRLANIYOR", color: "bg-orange-500 text-white border-orange-600" },
    READY: { label: "TESLİME HAZIR", color: "bg-green-500 text-white border-green-600" },
    PAID: { label: "TAMAMLANDI", color: "bg-gray-500 text-white border-gray-600" },
  };

  return (
    <div className="px-6 py-12 space-y-16 pb-32">
      {/* Personal Info */}
      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Profiliniz</h2>
          <button 
            onClick={() => {
              setEditFormData(guest.profileData || {});
              setError(null);
              setShowEditModal(true);
            }}
            className="px-6 py-2 rounded-xl bg-secondary text-[10px] font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-all"
          >
            DÜZENLE
          </button>
        </div>
        <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] text-center">{guest.workshop.name}</p>

        <div className="bg-card border border-border/40 rounded-[2.5rem] p-10 space-y-8 shadow-sm">
          <div className="grid grid-cols-1 gap-8">
            {fields.map((f: any) => (
              <div key={f.key} className="space-y-1 border-b border-border/30 pb-4 last:border-0 last:pb-0">
                <p className="text-[9px] font-black text-muted uppercase tracking-widest leading-none">{f.label}</p>
                <p className="text-lg font-bold text-foreground/90">
                  {f.type === 'checkbox' ? (guest.profileData[f.key] ? "✓ Evet" : "✕ Hayır") : (guest.profileData[f.key] || "—")}
                </p>
              </div>
            ))}
            {fields.length === 0 && (
              <p className="text-xs font-bold text-muted italic text-center">Profil bilgisi bulunmuyor.</p>
            )}
          </div>
        </div>
      </div>

      {/* Shopping History */}
      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Alışveriş Geçmişi</h2>
          <span className="text-[10px] font-bold text-muted bg-secondary/50 px-3 py-1 rounded-full uppercase tracking-widest">{guest.carts.length} Oturum</span>
        </div>

        <div className="space-y-6">
          {guest.carts.map((cart, idx) => {
            const total = cart.totalAmount ?? cart.items.reduce((sum, i) => sum + ((i.priceAtPurchase ?? i.product.price) * i.quantity), 0);
            const statusInfo = STATUS_LABELS[cart.status] || { label: cart.status, color: "bg-secondary text-muted" };

            return (
              <div key={cart.id} className="bg-card border border-border/40 rounded-[2rem] p-8 space-y-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">OTURUM #{guest.carts.length - idx}</p>
                    <p className="text-xs font-bold">{new Date(cart.createdAt).toLocaleDateString('tr-TR')} • {new Date(cart.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusInfo.color}`}>
                      {statusInfo.label}
                    </div>
                    {cart.priceTier && (
                      <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{cart.priceTier.name}</span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3 pt-2 border-t border-border/30">
                  {cart.items.map((item, iIdx) => {
                    const unitPrice = item.priceAtPurchase ?? item.product.price;
                    const basePrice = item.product.price;
                    const hasDiscount = unitPrice < basePrice;

                    return (
                      <div key={iIdx} className="flex justify-between items-center text-sm">
                        <p className="text-muted-foreground"><span className="font-bold text-foreground">{item.quantity}x</span> {item.product.name}</p>
                        <div className="flex flex-col items-end">
                          {hasDiscount && (
                            <span className="text-[8px] text-muted-foreground line-through">₺{(basePrice * item.quantity).toFixed(2)}</span>
                          )}
                          <p className="font-bold text-[11px] text-foreground">₺{(unitPrice * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-end pt-4 border-t border-border/30">
                  <p className="text-[9px] font-black text-muted uppercase tracking-widest">Toplam Tutar</p>
                  <p className="text-xl font-black text-blue-600">₺{total.toFixed(2)}</p>
                </div>
              </div>
            );
          })}

          {guest.carts.length === 0 && (
            <div className="py-20 text-center bg-secondary/20 rounded-[2rem] border border-dashed border-border">
              <p className="text-xs font-bold text-muted uppercase tracking-widest italic">Henüz alışveriş yapılmadı</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        title="Profilini Güncelle"
      >
        <div className="p-8 space-y-8">
          <div className="space-y-6">
            {fields.map((field: any) => (
              <div key={field.key} className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">{field.label}</label>
                {field.type === "select" ? (
                  <select
                    value={editFormData[field.key] || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, [field.key]: e.target.value })}
                    className="w-full bg-secondary/50 border border-border/50 px-6 py-4 rounded-2xl text-sm font-bold outline-none focus:border-foreground/20"
                  >
                    <option value="">Seçiniz...</option>
                    {field.options?.map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === "checkbox" ? (
                  <label className="flex items-center gap-4 bg-secondary/50 px-6 py-4 rounded-2xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!editFormData[field.key]}
                      onChange={(e) => setEditFormData({ ...editFormData, [field.key]: e.target.checked })}
                      className="w-5 h-5 rounded border-border"
                    />
                    <span className="text-sm font-bold">{field.label}</span>
                  </label>
                ) : (
                  <input
                    type={field.type === "email" ? "email" : field.type === "number" ? "number" : "text"}
                    value={editFormData[field.key] || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, [field.key]: e.target.value })}
                    placeholder={`${field.label} giriniz...`}
                    className="w-full bg-secondary/50 border border-border/50 px-6 py-4 rounded-2xl text-sm font-bold outline-none focus:border-foreground/20"
                  />
                )}
              </div>
            ))}
          </div>

          {error && <p className="text-xs font-bold text-destructive text-center">{error}</p>}

          <div className="flex gap-4">
            <button 
              onClick={() => setShowEditModal(false)}
              className="flex-1 py-4 rounded-2xl bg-secondary text-xs font-bold uppercase tracking-widest"
            >
              İPTAL
            </button>
            <button 
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex-1 py-4 rounded-2xl bg-foreground text-background text-xs font-bold uppercase tracking-widest shadow-xl disabled:opacity-50"
            >
              {saving ? "KAYDEDİLİYOR..." : "GÜNCELLE"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Dev Tools: Session Reset */}
      <div className="pt-12 border-t border-border/30 text-center">
        <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-4 opacity-40">Geliştirici Araçları</p>
        <button 
          onClick={async () => {
            if (confirm("Oturumunuzu sıfırlamak istediğinize emin misiniz? (Sepetiniz ve bilgileriniz silinebilir)")) {
              const res = await fetch("/api/guest/auth/reset", { method: "POST" });
              if (res.ok) window.location.href = "/workshop/catalog";
            }
          }}
          className="px-8 py-3 rounded-2xl bg-destructive/10 text-destructive text-[10px] font-black uppercase tracking-widest hover:bg-destructive hover:text-white transition-all active:scale-95"
        >
          OTURUMU SIFIRLA
        </button>
      </div>
    </div>
  );
}
