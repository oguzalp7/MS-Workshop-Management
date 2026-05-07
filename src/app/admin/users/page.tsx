"use client";

import { useEffect, useState, FormEvent } from "react";

interface Admin {
  id: string;
  username: string;
  name: string;
  active: boolean;
  createdAt: string;
  createdById: string;
}

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "", name: "" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  async function fetchAdmins() {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.admins);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAdmins(); }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error); return; }
      setFormData({ username: "", password: "", name: "" });
      setShowForm(false);
      fetchAdmins();
    } catch { setFormError("Network error"); } finally { setFormLoading(false); }
  }

  async function toggleActive(admin: Admin) {
    try {
      await fetch(`/api/admin/users/${admin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !admin.active }),
      });
      fetchAdmins();
    } catch { /* ignore */ }
  }

  async function handleDelete(admin: Admin) {
    if (!confirm(`Deactivate "${admin.username}"?`)) return;
    try {
      await fetch(`/api/admin/users/${admin.id}`, { method: "DELETE" });
      fetchAdmins();
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-6 w-6 border-2 border-foreground border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight mb-1">Admin Users</h1>
          <p className="text-muted text-sm">{admins.length} user(s) total</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          {showForm ? "Cancel" : "+ New Admin"}
        </button>
      </div>

      {/* ─── Create Form ─────────────────────────────────────── */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 p-5 rounded-xl border border-border bg-card">
          <h2 className="text-sm font-semibold mb-4">Create New Admin</h2>
          {formError && (
            <div className="px-4 py-2 mb-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {formError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label htmlFor="new-name" className="block text-xs font-medium mb-1 text-muted">Name</label>
              <input id="new-name" type="text" required value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="new-username" className="block text-xs font-medium mb-1 text-muted">Username</label>
              <input id="new-username" type="text" required value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="new-password" className="block text-xs font-medium mb-1 text-muted">Password</label>
              <input id="new-password" type="password" required value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <button type="submit" disabled={formLoading}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer">
            {formLoading ? "Creating..." : "Create Admin"}
          </button>
        </form>
      )}

      {/* ─── Users Table ─────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Username</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Created</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-5 py-3 font-medium">{admin.name}</td>
                  <td className="px-5 py-3 text-muted">{admin.username}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${admin.active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${admin.active ? "bg-success" : "bg-destructive"}`} />
                      {admin.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => toggleActive(admin)} title={admin.active ? "Deactivate" : "Activate"}
                        className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-secondary transition-colors cursor-pointer">
                        {admin.active ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" x2="23" y1="1" y2="23"/></svg>
                        )}
                      </button>
                      <button onClick={() => handleDelete(admin)} title="Deactivate"
                        className="p-1.5 rounded-lg text-muted hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">No admin users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
