"use client";

// v2 - Fixed Image Constructor Conflict
import { useState } from "react";

interface ProfileIdentityModalProps {
  isOpen: boolean;
  settings: { logo: string; title: string; body: string } | null;
  formFields: any[];
  onSuccess: () => void;
  onDismiss: () => void;
}

export default function ProfileIdentityModal({ isOpen, settings, formFields, onSuccess, onDismiss }: ProfileIdentityModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const logo = settings?.logo || "https://www.sglam.co/idea/qj/01/themes/selftpl_67f8b306e318e/assets/uploads/logo.png";
  const title = settings?.title || "S'Glam E-Katalog'a Hoş Geldiniz!";
  const body = settings?.body || "Size daha iyi hizmet verebilmek ve siparişlerinizi isminizle hazırlayabilmek için adınızı paylaşır mısınız?";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validate mandatory fields
    const missingFields = formFields.filter(f => f.required && !formData[f.key]);
    if (missingFields.length > 0) {
      setError(`${missingFields[0].label} alanı zorunludur.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/guest/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileData: formData }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || "Bir hata oluştu.");
      }
    } catch (err) {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 overflow-y-auto py-12 bg-background/40 backdrop-blur-3xl">
      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-card border border-border/50 rounded-[3rem] shadow-2xl p-10 space-y-8 animate-in zoom-in-95 slide-in-from-bottom-10 duration-700 delay-300">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
            <img src={logo} alt="S'Glam Logo" className="w-100 h-100 object-contain" />
          </div>
          <h2 className="text-3xl font-black tracking-tight">{title}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed px-2">
            {body}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {formFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-4">
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                </label>
                {field.type === "select" ? (
                  <select
                    value={formData[field.key] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    className="w-full bg-secondary/50 border-2 border-transparent focus:border-blue-600/20 focus:bg-card px-8 py-5 rounded-[2rem] text-sm font-bold outline-none transition-all appearance-none"
                    required={field.required}
                  >
                    <option value="">Seçiniz...</option>
                    {field.options?.map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === "checkbox" ? (
                  <label className="flex items-center gap-4 bg-secondary/50 px-8 py-5 rounded-[2rem] cursor-pointer hover:bg-secondary transition-all">
                    <input
                      type="checkbox"
                      checked={!!formData[field.key]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.checked })}
                      className="w-5 h-5 rounded-lg border-2 border-border"
                    />
                    <span className="text-sm font-bold">{field.label}</span>
                  </label>
                ) : (
                  <input
                    type={field.type === "email" ? "email" : field.type === "number" ? "number" : "text"}
                    value={formData[field.key] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    placeholder={`${field.label} giriniz...`}
                    className="w-full bg-secondary/50 border-2 border-transparent focus:border-blue-600/20 focus:bg-card px-8 py-5 rounded-[2rem] text-sm font-bold outline-none transition-all placeholder:text-muted/40"
                    required={field.required}
                  />
                )}
              </div>
            ))}
          </div>

          {error && (
            <p className="text-[10px] font-bold text-destructive text-center uppercase tracking-widest">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-foreground text-background py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "KAYDEDİLİYOR..." : "DEVAM ET"}
          </button>
        </form>

        {/* The "Barely Visible" Escape Hatch */}
        <div className="text-center">
          <button
            onClick={onDismiss}
            className="text-[9px] font-black text-muted/30 uppercase tracking-[0.3em] hover:text-muted/60 transition-colors py-2"
          >
            Anonim olarak devam et
          </button>
        </div>
      </div>
    </div>
  );
}
