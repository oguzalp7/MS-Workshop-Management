"use client";

import { useEffect, useState } from "react";

interface Setting {
  key: string;
  value: any;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSetting = async (key: string, value: any) => {
    setSaving(key);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value })
      });
      if (res.ok) {
        await fetchSettings();
      }
    } catch (e) { console.error(e); }
    finally { setSaving(null); }
  };

  const getSetting = (key: string) => settings.find(s => s.key === key)?.value;

  const NOTIF_TEMPLATES = [
    { key: "notif_ready_title", label: "Sipariş Hazır Başlığı", default: "🎁 Siparişiniz Hazır!" },
    { key: "notif_ready_body", label: "Sipariş Hazır Mesajı", default: "Siparişiniz hazırlandı. Teslim almak için standımıza bekliyoruz. 💖" },
    { key: "notif_paid_title", label: "Ödeme Tamamlandı Başlığı", default: "✨ Güle Güle Kullanın!" },
    { key: "notif_paid_body", label: "Ödeme Tamamlandı Mesajı", default: "Ödemeniz alındı, siparişiniz teslim edildi. Bizi tercih ettiğiniz için teşekkür ederiz! ❣️" },
    { key: "notif_welcome_title", label: "Hoşgeldin Mesajı Başlığı", default: "Workshop Duyurusu" },
    { key: "notif_welcome_body", label: "Hoşgeldin Mesajı İçeriği", default: "Hoş geldiniz! Bugün harika bir eğitim bizi bekliyor. 🎨" },
  ];

  if (loading) return <div className="p-12 flex items-center justify-center"><div className="animate-spin h-5 w-5 border-2 border-foreground border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-4xl space-y-12">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Ayarlar</h1>
        <p className="text-muted text-xs uppercase tracking-[0.3em] font-black opacity-60">Sistem ve Bildirim Yapılandırması</p>
      </div>

      <div className="grid gap-12">
        <section className="space-y-6">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-600"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
             </div>
             <div>
                <h2 className="text-lg font-bold">Bildirim Şablonları</h2>
                <p className="text-xs text-muted-foreground">Otomatik gönderilen mesajların içeriğini düzenleyin</p>
             </div>
          </div>

          <div className="grid gap-4">
            {NOTIF_TEMPLATES.map((tmpl) => (
              <div key={tmpl.key} className="bg-card border border-border/40 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted">{tmpl.label}</label>
                  {saving === tmpl.key && <span className="text-[10px] font-bold text-blue-600 animate-pulse">Kaydediliyor...</span>}
                </div>
                <input 
                  type="text"
                  defaultValue={getSetting(tmpl.key) || tmpl.default}
                  onBlur={(e) => {
                    const val = e.target.value;
                    if (val !== (getSetting(tmpl.key) || tmpl.default)) {
                      updateSetting(tmpl.key, val);
                    }
                  }}
                  className="w-full bg-secondary/30 border-2 border-transparent focus:border-foreground/10 focus:bg-card px-5 py-3 rounded-2xl text-sm font-bold outline-none transition-all"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="p-8 rounded-[2.5rem] bg-secondary/20 border border-dashed border-border text-center">
           <p className="text-xs font-bold text-muted mb-2">Gelişmiş Ayarlar</p>
           <p className="text-[10px] uppercase tracking-widest opacity-40">Yakında daha fazla seçenek eklenecek</p>
        </section>
      </div>
    </div>
  );
}
