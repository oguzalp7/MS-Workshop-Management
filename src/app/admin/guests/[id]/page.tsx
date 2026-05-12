"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { QRCodeSVG } from "qrcode.react";

interface CartItem {
   id: string;
   product: { id: string; name: string; price: number; media: any[] };
   quantity: number;
   priceAtPurchase: number | null;
}

interface Cart {
   id: string;
   status: string;
   items: CartItem[];
   priceTier: { name: string } | null;
   totalAmount: number | null;
   createdAt: string;
}

interface Guest {
   id: string;
   workshopId: string;
   profileData: any;
   checkInStatus: boolean;
   workshop: {
      id: string;
      name: string;
      formConfig: { fields: any[] } | null;
   };
   carts: Cart[];
}

type Tab = "profile" | "shopping";

export default function GuestProfilePage({ params }: { params: Promise<{ id: string }> }) {
   const { id } = use(params);
   const router = useRouter();
   const [guest, setGuest] = useState<Guest | null>(null);
   const [magicLink, setMagicLink] = useState<string | null>(null);
   const [loading, setLoading] = useState(true);
   const [activeTab, setActiveTab] = useState<Tab>("profile");

   const [showEditModal, setShowEditModal] = useState(false);
   const [editData, setEditData] = useState<Record<string, any>>({});
   const [saveLoading, setSaveLoading] = useState(false);

   async function fetchGuest() {
      try {
         const res = await fetch(`/api/admin/guests/${id}`);
         if (res.ok) {
            const data = await res.json();
            setGuest(data.guest);
            setEditData(data.guest.profileData);
            setMagicLink(`${process.env.NEXT_PUBLIC_APP_URL}/g/${data.guest.id}`);
         }
      } catch { /* ignore */ } finally { setLoading(false); }
   }

   useEffect(() => { fetchGuest(); }, [id]);

   async function updateProfile() {
      setSaveLoading(true);
      try {
         // FIXED: Using the specific guest endpoint which triggers the formula engine
         // We also pass the workshopId in the path so the backend knows which blueprint to use
         const res = await fetch(`/api/admin/workshops/${guest?.workshop.id}/guests/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profileData: editData }),
         });
         if (res.ok) { setShowEditModal(false); fetchGuest(); }
      } catch { /* ignore */ } finally { setSaveLoading(false); }
   }

   async function toggleCheckIn() {
      if (!guest) return;
      try {
         const res = await fetch(`/api/admin/workshops/${guest.workshop.id}/guests/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ checkInStatus: !guest.checkInStatus }),
         });
         if (res.ok) fetchGuest();
      } catch { /* ignore */ }
   }

   async function deleteGuest() {
      if (!confirm("ARE YOU ABSOLUTELY SURE? This will permanently delete registration and data.")) return;
      try {
         const res = await fetch(`/api/admin/workshops/${guest?.workshop.id}/guests/${id}`, { method: "DELETE" });
         if (res.ok) router.push(`/admin/workshops/${guest?.workshop.id}`);
      } catch { /* ignore */ }
   }

   if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin h-5 w-5 border-2 border-foreground border-t-transparent rounded-full" /></div>;
   if (!guest) return null;

   const fields = guest.workshop.formConfig?.fields || [];

   return (
      <div className="max-w-6xl mx-auto py-12 px-4">
         <button onClick={() => router.back()} className="text-[10px] font-bold text-muted hover:text-foreground mb-8 uppercase tracking-[0.2em] flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            Back
         </button>

         <div className="flex flex-col md:flex-row items-start justify-between gap-12 mb-12">
            <div className="flex-1">
               <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-4xl font-bold tracking-tight">Attendee Hub</h1>
                  <div className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${guest.checkInStatus ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}>
                     {guest.checkInStatus ? "Checked In" : "Pending"}
                  </div>
                  <button onClick={toggleCheckIn} className={`ml-4 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${guest.checkInStatus ? "bg-secondary text-muted" : "bg-green-500 text-white shadow-lg shadow-green-500/20"}`}>
                     {guest.checkInStatus ? "Revoke Check-In" : "Check-In Guest"}
                  </button>
               </div>

               <p className="text-sm text-muted-foreground italic">Attendee: <span className="text-foreground font-bold not-italic">{guest.profileData.full_name || 'Guest'}</span> • Event: <span className="text-foreground font-bold not-italic">{guest.workshop.name}</span></p>
            </div>
            <div className="flex bg-secondary/50 p-1 rounded-2xl border border-border">
               {(["profile", "shopping"] as Tab[]).map(t => (
                  <button key={t} onClick={() => setActiveTab(t)} className={`px-8 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === t ? "bg-card text-foreground shadow-sm" : "text-muted hover:text-foreground"}`}>{t === 'profile' ? 'Registration' : 'Shopping History'}</button>
               ))}
            </div>
         </div>

         <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ─── PROFILE TAB ────────────────────────────────────────── */}
            {activeTab === "profile" && (
               <div className="space-y-12">
                  {/* Logistics Quick Actions */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                     <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-8 flex flex-col md:flex-row items-center gap-10">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-border/10 shrink-0">
                           <QRCodeSVG value={magicLink || ""} size={120} />
                        </div>
                        <div className="flex-1 space-y-4">
                           <h3 className="text-xs font-bold uppercase tracking-widest text-muted">Logistics & Access</h3>
                           <div className="space-y-2">
                              <p className="text-[10px] font-bold text-muted uppercase">Private Magic Link</p>
                              <div className="flex items-center gap-2 bg-secondary/50 p-3 rounded-xl border border-border group">
                                 <span className="text-[10px] font-mono text-muted-foreground truncate flex-1">{magicLink}</span>
                                 <button onClick={() => { navigator.clipboard.writeText(magicLink || ""); alert('Link Copied!'); }} className="text-[10px] font-bold text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1 rounded-lg transition-all">COPY</button>
                              </div>
                           </div>
                           <p className="text-[10px] text-muted-foreground italic leading-relaxed">This QR code and link grant secure, passwordless access to the attendee's personal dashboard and shopping cart.</p>
                        </div>
                     </div>

                     <div className="bg-blue-600 rounded-3xl p-8 flex flex-col justify-between text-white shadow-xl shadow-blue-500/10">
                        <div className="space-y-2">
                           <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Physical Media</h4>
                           <p className="text-lg font-bold leading-tight">Ready to print badge/registration papers?</p>
                        </div>
                        <button
                           onClick={() => window.open(`/admin/workshops/${guest.workshop.id}/print?guestId=${guest.id}`, '_blank')}
                           className="w-full py-4 mt-6 bg-white text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect width="12" height="8" x="6" y="14" /></svg>
                           Print Registration Badge
                        </button>
                     </div>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-12 space-y-10 relative overflow-hidden">

                     <div className="flex items-center justify-between relative z-10">
                        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-muted">Core Profile Information</h2>
                        <button onClick={() => setShowEditModal(true)} className="px-6 py-2 rounded-xl bg-foreground text-background text-[10px] font-bold uppercase">Modify Profile</button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 relative z-10">
                        {fields.map((f: any) => (
                           <div key={f.key} className="space-y-1.5 pb-4 border-b border-border/30">
                              <label className="text-[10px] font-bold text-muted uppercase tracking-widest">{f.label}</label>
                              <p className="font-bold text-lg text-foreground/90">
                                 {f.type === 'checkbox' ? (guest.profileData[f.key] ? "✓ YES" : "✕ NO") : (guest.profileData[f.key] || "—")}
                              </p>
                           </div>
                        ))}
                     </div>
                     <div className="absolute top-0 right-0 w-64 h-64 bg-foreground/[0.02] rounded-full -mr-32 -mt-32 blur-3xl" />
                  </div>

                  <div className="pt-12 border-t border-border">
                     <h3 className="text-[10px] font-bold text-destructive uppercase tracking-widest mb-4 opacity-50">Danger Zone</h3>
                     <div className="p-8 rounded-3xl border border-destructive/20 bg-destructive/[0.02] flex items-center justify-between">
                        <div className="space-y-1"><p className="text-sm font-bold text-destructive">Remove Attendee Record</p><p className="text-[10px] text-muted-foreground">Permanent deletion of all profile and shopping session data.</p></div>
                        <button onClick={deleteGuest} className="px-6 py-3 rounded-xl bg-destructive text-white text-[10px] font-bold uppercase">Hard Delete</button>
                     </div>
                  </div>
               </div>
            )}

            {/* ─── SHOPPING TAB ───────────────────────────────────────── */}
            {activeTab === "shopping" && (
               <div className="space-y-10">
                  {guest.carts.length === 0 ? (
                     <div className="py-32 text-center bg-card border border-border rounded-3xl border-dashed">
                        <p className="text-xs font-bold text-muted uppercase tracking-widest italic">No shopping sessions recorded for this attendee</p>
                     </div>
                  ) : (
                     <div className="space-y-12">
                        {guest.carts.map((cart, cIdx) => {
                           const displayTotal = cart.totalAmount ?? cart.items.reduce((sum, item) => sum + ((item.priceAtPurchase ?? item.product.price) * item.quantity), 0);
                           return (
                              <div key={cart.id} className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                                 <div className="px-8 py-6 bg-secondary/30 border-b border-border flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                       <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${cart.status === 'CHECKED_OUT' ? "bg-green-500 text-white" : "bg-orange-500 text-white"}`}>{cart.status}</span>
                                       <div className="flex flex-col">
                                          <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Session #{guest.carts.length - cIdx} • {new Date(cart.createdAt).toLocaleString()}</span>
                                          {cart.priceTier && <span className="text-[9px] font-black text-blue-600 uppercase tracking-tighter">Payment: {cart.priceTier.name}</span>}
                                       </div>
                                    </div>
                                    <p className="text-sm font-bold">Total Amount: <span className="text-lg">${displayTotal.toFixed(2)}</span></p>
                                 </div>
                                 <table className="w-full text-left">
                                    <thead>
                                       <tr className="bg-secondary/10">
                                          <th className="px-8 py-4 text-[9px] font-bold uppercase tracking-widest text-muted">Product</th>
                                          <th className="px-8 py-4 text-[9px] font-bold uppercase tracking-widest text-muted text-center">Qty</th>
                                          <th className="px-8 py-4 text-[9px] font-bold uppercase tracking-widest text-muted text-right">Unit Price</th>
                                          <th className="px-8 py-4 text-[9px] font-bold uppercase tracking-widest text-muted text-right">Subtotal</th>
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                       {cart.items.map(item => {
                                          const unitPrice = item.priceAtPurchase ?? item.product.price;
                                          return (
                                             <tr key={item.id} className="hover:bg-secondary/5 transition-colors">
                                                <td className="px-8 py-5">
                                                   <div className="flex items-center gap-4">
                                                      <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden border border-border/50">
                                                         {item.product.media?.[0] && <img src={item.product.media[0].url} className="w-full h-full object-cover" alt="" />}
                                                      </div>
                                                      <span className="font-bold text-sm">{item.product.name}</span>
                                                   </div>
                                                </td>
                                                <td className="px-8 py-5 text-center font-bold text-sm">{item.quantity}</td>
                                                <td className="px-8 py-5 text-right text-muted-foreground text-sm">${unitPrice.toFixed(2)}</td>
                                                <td className="px-8 py-5 text-right font-bold text-sm">${(unitPrice * item.quantity).toFixed(2)}</td>
                                             </tr>
                                          );
                                       })}
                                    </tbody>
                                 </table>
                              </div>
                           );
                        })}
                     </div>
                  )}
               </div>
            )}
         </div>

         {/* Edit Modal */}
         <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Update Registration Data" maxWidth="2xl">
            <div className="p-12 space-y-8">
               <div className="space-y-6">
                  {fields.filter((f: any) => f.type !== 'formula').map((field: any) => (
                     <div key={field.id} className="space-y-2">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest">{field.label}</label>
                        {field.type === 'checkbox' ? (
                           <button onClick={() => setEditData({ ...editData, [field.key]: !editData[field.key] })} className={`w-full py-4 rounded-xl text-xs font-bold border transition-all ${editData[field.key] ? "bg-foreground text-background" : "bg-secondary text-muted"}`}>{editData[field.key] ? "YES" : "NO"}</button>
                        ) : (
                           <input type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'time' ? 'time' : 'text'} value={editData[field.key] || ""} onChange={e => setEditData({ ...editData, [field.key]: e.target.value })} className="w-full bg-secondary border border-border px-4 py-3 rounded-xl text-sm font-bold outline-none" />
                        )}
                     </div>
                  ))}
               </div>
               <div className="flex items-center gap-4 pt-8 border-t border-border">
                  <button onClick={() => setShowEditModal(false)} className="flex-1 py-4 text-xs font-bold text-muted">CANCEL</button>
                  <button onClick={updateProfile} disabled={saveLoading} className="flex-1 py-4 rounded-xl bg-foreground text-background text-xs font-bold">{saveLoading ? "SAVING..." : "SAVE PROFILE"}</button>
               </div>
            </div>
         </Modal>
      </div>
   );
}
