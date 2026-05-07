"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";

interface FormField {
  id: string;
  key: string; // The "variable name" used in formulas
  label: string;
  type: "text" | "number" | "email" | "select" | "formula" | "date" | "time" | "checkbox";

  required: boolean;
  isIdentity?: boolean;
  options?: string[];

  formula?: string;
}

interface FormConfig {
  id?: string;
  name: string;
  fields: FormField[];
  active: boolean;
}

export default function GuestSettingsPage() {
  const [configs, setConfigs] = useState<FormConfig[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<FormConfig | null>(null);
  const [formName, setFormName] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);

  const [fields, setFields] = useState<FormField[]>([]);

  async function fetchConfigs() {
    try {
      const res = await fetch("/api/admin/guest-settings");
      if (res.ok) {
        const data = await res.json();
        setConfigs(data.configs);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchConfigs();
  }, []);

  const addField = () => {
    const newField: FormField = { 
      id: Math.random().toString(36).substr(2, 9), 
      key: `field_${fields.length + 1}`,
      label: "New Field", 
      type: "text", 
      required: false 
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => {
      if (f.id === id) {
        const updated = { ...f, ...updates };
        // Auto-generate key if label changed and key hasn't been manually edited? 
        // For now, let's just keep them separate for manual control.
        return updated;
      }
      return f;
    }));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  async function saveBlueprint() {
    if (!formName.trim()) return;
    setSaveLoading(true);
    try {
      const res = await fetch("/api/admin/guest-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingConfig?.id,
          name: formName,
          fields
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        fetchConfigs();
      }
    } catch { /* ignore */ } finally {
      setSaveLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto pb-12 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Guest Registration Studio</h1>
          <p className="text-muted text-xs uppercase tracking-[0.3em] mt-2 font-bold opacity-60">Dynamic Form Builder & Logic</p>
        </div>
        <button
          onClick={() => {
            setEditingConfig(null);
            setFormName("");
            setFields([{ id: "f1", key: "full_name", label: "Full Name", type: "text", required: true }]);
            setShowCreateModal(true);
          }}
          className="px-8 py-2.5 rounded-xl bg-foreground text-background text-xs font-bold hover:opacity-90 transition-all shadow-lg"
        >
          CREATE NEW FORM
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
           <h2 className="text-[10px] font-bold text-muted uppercase tracking-widest px-2">Published Blueprints</h2>
           <div className="space-y-4">
              {configs.map(config => (
                <div key={config.id} className="p-6 bg-card border border-border rounded-3xl hover:border-foreground/30 transition-all group flex items-center justify-between">
                   <div>
                      <h3 className="font-bold">{config.name}</h3>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">{(config.fields as any).length} Active Fields</p>
                   </div>
                   <button 
                     onClick={() => {
                       setEditingConfig(config);
                       setFormName(config.name);
                       setFields(config.fields as any);
                       setShowCreateModal(true);
                     }}
                     className="px-4 py-2 rounded-xl bg-secondary text-[10px] font-bold uppercase hover:bg-secondary/80 transition-all"
                   >
                      Manage
                   </button>
                </div>
              ))}
              {loading && <div className="py-20 text-center animate-pulse text-[10px] font-bold text-muted uppercase">Syncing with Registry...</div>}
           </div>
        </div>

        <div className="bg-secondary/20 border border-border rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-6">
           <div className="w-16 h-16 rounded-full bg-foreground text-background flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
           </div>
           <div>
              <h2 className="text-xl font-bold">The Mapping Rule</h2>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-2 leading-relaxed">
                 Every field has a <b>Key</b> (e.g. <code className="bg-secondary px-1 py-0.5 rounded text-foreground">age</code>). Use these keys in brackets within your formulas to perform automatic calculations.
              </p>
           </div>
           <div className="p-6 bg-card border border-border rounded-2xl w-full text-left">
              <h4 className="text-[9px] font-bold text-muted uppercase tracking-widest mb-3">Formula Syntax</h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                 Example: <code className="bg-secondary px-1 py-0.5 rounded text-foreground font-mono">[score] * 1.25</code><br/>
                 Calculations are evaluated instantly as guests fill out their forms.
              </p>
           </div>
        </div>
      </div>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title={editingConfig ? "Edit Form Blueprint" : "Design Registration Form"} maxWidth="5xl">
        <div className="flex flex-col h-full bg-background/50 backdrop-blur-md">
          <div className="flex-1 overflow-y-auto p-12 space-y-8">
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Blueprint Name</label>
                <input 
                  type="text" 
                  value={formName || ""}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Masterclass Enrollment" 
                  className="w-full bg-card border border-border px-6 py-4 rounded-2xl text-lg font-bold focus:outline-none" 
                />
             </div>

             <div className="space-y-4 pt-8">
                <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center justify-between">
                   Fields & Calculation Logic 
                   <button onClick={addField} className="text-foreground hover:underline">+ ADD FIELD</button>
                </h3>
                
                <div className="space-y-4">
                   {fields.map((field, index) => (
                     <div key={field.id} className="bg-card border border-border p-8 rounded-3xl shadow-sm border-l-4 border-l-foreground/10">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-end">
                           <div className="md:col-span-1">
                              <label className="text-[8px] font-bold text-muted uppercase tracking-widest block mb-1">Mapping Key</label>
                              <input 
                                value={field.key || ""} 
                                onChange={e => updateField(field.id, { key: e.target.value.toLowerCase().replace(/ /g, "_") })} 
                                placeholder="e.g. base_score"
                                className="w-full bg-secondary border border-border px-3 py-2 rounded-xl text-[10px] font-mono text-foreground/80" 
                              />
                           </div>
                           <div className="md:col-span-2">
                              <label className="text-[8px] font-bold text-muted uppercase tracking-widest block mb-1">Display Label</label>
                              <input 
                                value={field.label || ""} 
                                onChange={e => updateField(field.id, { label: e.target.value })} 
                                className="w-full bg-secondary border border-border px-3 py-2 rounded-xl text-xs font-bold" 
                              />
                           </div>
                           <div className="md:col-span-1">
                              <label className="text-[8px] font-bold text-muted uppercase tracking-widest block mb-1">Type</label>
                              <select value={field.type || "text"} onChange={e => updateField(field.id, { type: e.target.value as any })} className="w-full bg-secondary border border-border px-3 py-2 rounded-xl text-xs font-bold">
                                 <option value="text">Short Text</option>
                                 <option value="number">Number</option>
                                 <option value="email">Email</option>
                                 <option value="date">Date Picker</option>
                                 <option value="time">Time Picker</option>
                                 <option value="checkbox">Checkbox (Yes/No)</option>
                                 <option value="select">Dropdown</option>
                                 <option value="formula">Calculation</option>

                              </select>
                           </div>
                           <div className="md:col-span-1">
                              <label className="text-[8px] font-bold text-muted uppercase tracking-widest block mb-1">Mandatory</label>
                              <button 
                                onClick={() => updateField(field.id, { required: !field.required })}
                                className={`w-full py-2 rounded-xl text-[10px] font-bold border transition-all ${field.required ? "bg-foreground text-background border-foreground" : "bg-transparent text-muted border-border"}`}
                              >
                                 {field.required ? "YES" : "NO"}
                              </button>
                           </div>
                           <div className="md:col-span-1">
                              <label className="text-[8px] font-bold text-muted uppercase tracking-widest block mb-1">Identity Field</label>
                              <button 
                                onClick={() => updateField(field.id, { isIdentity: !field.isIdentity })}
                                title="Use this for clustering/deduplication"
                                className={`w-full py-2 rounded-xl text-[10px] font-bold border transition-all ${field.isIdentity ? "bg-blue-500 text-white border-blue-500" : "bg-transparent text-muted border-border"}`}
                              >
                                 {field.isIdentity ? "IDENTITY" : "REGULAR"}
                              </button>
                           </div>
                           <div className="md:col-span-1 flex items-center justify-end">

                              <button onClick={() => removeField(field.id)} className="p-2 text-muted hover:text-destructive transition-colors">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                              </button>
                           </div>
                        </div>
                        {field.type === "formula" && (
                          <div className="mt-6 pt-6 border-t border-border/50 bg-secondary/20 p-4 rounded-2xl">
                             <div className="flex items-center justify-between mb-2">
                                <label className="text-[8px] font-bold text-muted uppercase tracking-widest block">Calculation Logic</label>
                                <span className="text-[8px] font-bold text-foreground opacity-40">Use [key] syntax</span>
                             </div>
                             <input 
                               value={field.formula || ""} 
                               onChange={e => updateField(field.id, { formula: e.target.value })} 
                               placeholder="e.g. ([base_score] + [bonus]) * 1.5" 
                               className="w-full bg-card border border-border px-4 py-3 rounded-xl text-sm font-mono placeholder:opacity-30" 
                             />
                          </div>
                        )}
                     </div>
                   ))}
                </div>
             </div>

          </div>

          <div className="p-12 border-t border-border bg-card shrink-0 flex items-center justify-between">
             <button onClick={() => setShowCreateModal(false)} className="px-8 py-3 text-xs font-bold text-muted hover:text-foreground transition-all">DISCARD CHANGES</button>
             <button 
               onClick={saveBlueprint}
               disabled={saveLoading}
               className="px-12 py-4 rounded-2xl bg-foreground text-background text-sm font-bold hover:opacity-90 shadow-2xl transition-all"
             >
                {saveLoading ? "PUBLISHING..." : "PUBLISH BLUEPRINT"}
             </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
