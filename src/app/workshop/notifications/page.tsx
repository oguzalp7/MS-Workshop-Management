"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  read: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/guest/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-secondary/30 rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black tracking-tight">Bildirimler</h2>
        <Link href="/workshop/catalog" className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
        </Link>
      </div>

      <div className="space-y-4">
        {notifications.map(notif => (
          <div 
            key={notif.id} 
            className={`p-6 rounded-[2rem] border transition-all ${notif.type === 'success' ? 'bg-green-500/5 border-green-500/20' : 'bg-card border-border/50 shadow-sm'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-black text-sm uppercase tracking-tight">{notif.title}</h3>
              <span className="text-[8px] font-bold text-muted uppercase">
                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-xs font-medium text-muted-foreground leading-relaxed">{notif.message}</p>
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-border rounded-[2.5rem]">
            <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Henüz bildiriminiz bulunmuyor</p>
          </div>
        )}
      </div>
    </div>
  );
}
