"use client";

import { useEffect, useState, FormEvent } from "react";

interface AdminProfile {
  id: string;
  username: string;
  name: string;
  createdAt: string;
}

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({ name: "", password: "", confirmPassword: "" });
  const [message, setMessage] = useState({ type: "", text: "" });

  async function fetchProfile() {
    try {
      const res = await fetch("/api/admin/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setFormData((prev) => ({ ...prev, name: data.name }));
      }
    } catch {
      setMessage({ type: "error", text: "Failed to load profile" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (formData.password && formData.password !== formData.confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          password: formData.password || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Update failed" });
      } else {
        setMessage({ type: "success", text: "Profile updated successfully" });
        setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
        fetchProfile();
        // Trigger a refresh of the layout session info
        window.dispatchEvent(new Event("session-update"));
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-6 w-6 border-2 border-foreground border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">My Profile</h1>
        <p className="text-muted text-sm">Update your personal information and security settings.</p>
      </div>

      {message.text && (
        <div className={`px-4 py-3 mb-6 rounded-lg border text-sm flex items-center gap-3 ${
          message.type === "success" 
            ? "bg-success/10 border-success/20 text-success" 
            : "bg-destructive/10 border-destructive/20 text-destructive"
        }`}>
          {message.type === "success" ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
          )}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="p-6 rounded-xl border border-border bg-card">
          <h2 className="text-sm font-semibold mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Personal Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-muted uppercase tracking-wider">Username</label>
              <input 
                type="text" 
                disabled 
                value={profile?.username || ""} 
                className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-muted-foreground text-sm cursor-not-allowed"
              />
              <p className="mt-1.5 text-xs text-muted-foreground italic">Username cannot be changed.</p>
            </div>
            
            <div>
              <label htmlFor="display-name" className="block text-xs font-medium mb-1.5 text-muted uppercase tracking-wider">Display Name</label>
              <input 
                id="display-name"
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                placeholder="Your full name"
              />
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="p-6 rounded-xl border border-border bg-card">
          <h2 className="text-sm font-semibold mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Security
          </h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-xs font-medium mb-1.5 text-muted uppercase tracking-wider">New Password</label>
              <input 
                id="new-password"
                type="password" 
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                placeholder="Leave blank to keep current password"
              />
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="block text-xs font-medium mb-1.5 text-muted uppercase tracking-wider">Confirm New Password</label>
              <input 
                id="confirm-password"
                type="password" 
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                placeholder="Repeat new password"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button 
            type="submit" 
            disabled={updating}
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
          >
            {updating ? "Saving Changes..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
