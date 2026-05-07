"use client";

import { useState, useEffect } from "react";
import { Icons } from "./Icons";
import { subscribeToPush } from "./ServiceWorkerRegistrar";

export function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<"idle" | "requesting" | "success" | "error">("idle");

  useEffect(() => {
    // Check if permission is already granted or denied
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        // Only show if we are in standalone mode (PWA) to avoid annoying browser users
        const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
        if (isStandalone) {
          setShow(true);
        }
      }
    }
  }, []);

  const handleEnable = async () => {
    setStatus("requesting");
    try {
      await subscribeToPush();
      setStatus("success");
      setTimeout(() => setShow(false), 2000);
    } catch (err) {
      console.error("Push subscription error:", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 z-[100] animate-in fade-in slide-in-from-bottom-10 duration-500">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl shadow-black/50 flex flex-col md:flex-row items-center gap-6">
        <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center shrink-0">
          <Icons.StatusInfo className="w-8 h-8 text-blue-500" />
        </div>
        
        <div className="flex-1 text-center md:text-left space-y-1">
          <h3 className="text-white font-bold text-lg">Bildirimleri Etkinleştir</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Siparişleriniz hazır olduğunda veya ödeme onaylandığında anında haberdar olun.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => setShow(false)}
            className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-zinc-800 text-zinc-400 text-xs font-bold uppercase hover:bg-zinc-700 transition-all"
          >
            Daha Sonra
          </button>
          <button 
            onClick={handleEnable}
            disabled={status === "requesting" || status === "success"}
            className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${
              status === "success" ? "bg-green-600 text-white" : 
              status === "error" ? "bg-destructive text-white" : 
              "bg-white text-black hover:bg-zinc-200"
            }`}
          >
            {status === "requesting" ? "İşleniyor..." : 
             status === "success" ? "Hazır! ✓" : 
             status === "error" ? "Hata! ✕" : 
             "İzin Ver"}
          </button>
        </div>
      </div>
    </div>
  );
}
