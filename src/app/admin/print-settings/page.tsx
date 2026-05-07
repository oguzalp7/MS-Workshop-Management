"use client";

import { useEffect, useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

interface PrintElement {
  id: string;
  type: "qrcode" | "text" | "data" | "workshop_name" | "image" | "workshop_start" | "workshop_end";
  x: number; // in mm
  y: number; // in mm
  fontSize: number; // in pt
  bold: boolean;
  label: string;
  key?: string; // for "data" type
  fontFamily?: string;
  color?: string;
  url?: string; // for "image" type
  width?: number; // in mm
  height?: number; // in mm
}

interface CanvasSettings {
  width: number;
  height: number;
  gridSize: number;
  showGrid: boolean;
  backgroundColor: string;
  backgroundImage: string;
}

interface PrintConfig {
  id: string;
  name: string;
  elements: PrintElement[];
  canvasSettings?: CanvasSettings;
  isDefault: boolean;
}

const GOOGLE_FONTS = [
  { name: "Inter", value: "'Inter', sans-serif" },
  { name: "Outfit", value: "'Outfit', sans-serif" },
  { name: "Roboto", value: "'Roboto', sans-serif" },
  { name: "Courier", value: "'Courier New', Courier, monospace" },
];

export default function PrintStudioPage() {
  const [configs, setConfigs] = useState<PrintConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string>("");
  const [elements, setElements] = useState<PrintElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string>("all");
  const [workshops, setWorkshops] = useState<any[]>([]);

  const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>({
    width: 210,
    height: 297,
    gridSize: 10,
    showGrid: false,
    backgroundColor: "#ffffff",
    backgroundImage: ""
  });
  const [cursorMode, setCursorMode] = useState<"standard" | "plus">("standard");
  const [snapLines, setSnapLines] = useState<{ x?: number, y?: number }>({});
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [isDragging, setIsDragging] = useState(false);
  const [blueprints, setBlueprints] = useState<any[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);

  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;
  const PIXELS_PER_MM = 3.5;

  async function fetchConfigs() {
    try {
      const res = await fetch("/api/admin/print-configs");
      if (res.ok) {
        const data = await res.json();
        setConfigs(data.configs);
        if (data.configs.length > 0) loadConfig(data.configs[0]);
        else loadSampleTemplate();
      }

      const wRes = await fetch("/api/admin/workshops");
      if (wRes.ok) {
        const wData = await wRes.json();
        setWorkshops(wData.workshops || []);
      }

      const bpRes = await fetch("/api/admin/guest-settings");
      if (bpRes.ok) {
        const bpData = await bpRes.json();
        setBlueprints(bpData.configs || []);
      }
    } catch { /* ignore */ }
  }

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedWorkshopId !== "all") params.append("workshopId", selectedWorkshopId);
    fetch(`/api/admin/print-configs?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setConfigs(data.configs || []);
      });
  }, [selectedWorkshopId]);

  useEffect(() => { fetchConfigs(); }, []);

  function loadConfig(config: PrintConfig) {
    setSelectedConfigId(config.id);
    setTemplateName(config.name);
    setElements(config.elements || []);
    if (config.canvasSettings) {
      setCanvasSettings(config.canvasSettings);
    } else {
      setCanvasSettings({ width: 210, height: 297, gridSize: 10, showGrid: false, backgroundColor: "#ffffff", backgroundImage: "" });
    }
  }

  function loadSampleTemplate() {
    const sampleElements: PrintElement[] = [
      { id: "s1", type: "workshop_name", x: 20, y: 20, fontSize: 18, bold: true, label: "Workshop Name", fontFamily: "'Outfit', sans-serif", color: "#000000" },
      { id: "s2", type: "text", x: 20, y: 35, fontSize: 10, bold: false, label: "Welcome, Attendee!", fontFamily: "'Inter', sans-serif", color: "#666666" },
      { id: "s3", type: "data", x: 20, y: 60, fontSize: 32, bold: true, label: "Guest Name", key: "full_name", fontFamily: "'Outfit', sans-serif", color: "#000000" },
      { id: "s4", type: "qrcode", x: 140, y: 20, fontSize: 50, bold: false, label: "QR Magic Link", color: "#000000" }
    ];
    setSelectedConfigId("sample");
    setTemplateName("Standard Event Badge");
    setElements(sampleElements);
    setCanvasSettings({ width: 210, height: 297, gridSize: 10, showGrid: false, backgroundColor: "#ffffff", backgroundImage: "" });
  }

  function createNewConfig() {
    setSelectedConfigId("new");
    setTemplateName(`Template ${configs.length + 1}`);
    setElements([]);
    setSelectedElementId(null);
    setCanvasSettings({ width: 210, height: 297, gridSize: 10, showGrid: false, backgroundColor: "#ffffff", backgroundImage: "" });
  }

  function addElement(type: PrintElement["type"], label: string, key?: string) {
    const newEl: PrintElement = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: 30,
      y: 40 + (elements.length * 15),
      fontSize: type === "qrcode" ? 40 : 14,
      bold: type === "workshop_name",
      label,
      key: key || (type === "text" ? "" : undefined),
      fontFamily: "'Inter', sans-serif",
      color: "#000000",
      url: type === "image" ? "https://placehold.co/400x200/EEE/31343C?text=Your+Logo" : undefined,
      width: type === "image" ? 40 : undefined,
      height: type === "image" ? 20 : undefined
    };
    setElements([...elements, newEl]);
    setSelectedElementId(newEl.id);
  }

  function handlePointerDown(e: React.PointerEvent, id: string) {
    e.stopPropagation();
    setSelectedElementId(id);
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    let x = (e.clientX - rect.left) / PIXELS_PER_MM;
    let y = (e.clientY - rect.top) / PIXELS_PER_MM;

    setMousePos({ x, y });

    if (!isDragging || !selectedElementId) return;

    let snapX: number | undefined;
    let snapY: number | undefined;

    if (canvasSettings.showGrid) {
      const g = canvasSettings.gridSize || 10;
      const nearestX = Math.round(x / g) * g;
      const nearestY = Math.round(y / g) * g;
      if (Math.abs(x - nearestX) < 2) { x = nearestX; snapX = nearestX; }
      if (Math.abs(y - nearestY) < 2) { y = nearestY; snapY = nearestY; }
    }

    elements.forEach(el => {
      if (el.id === selectedElementId) return;
      if (Math.abs(x - el.x) < 2) { x = el.x; snapX = el.x; }
      if (Math.abs(y - el.y) < 2) { y = el.y; snapY = el.y; }
    });

    setSnapLines({ x: snapX, y: snapY });

    setElements(prev => prev.map(el => el.id === selectedElementId ? { ...el, x: Math.max(0, Math.min(canvasSettings.width - 10, x)), y: Math.max(0, Math.min(canvasSettings.height - 10, y)) } : el));
  }

  function handlePointerUp(e: React.PointerEvent) {
    setIsDragging(false);
    setSnapLines({});
    if (selectedElementId) (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }

  async function saveConfig() {
    if (!templateName) { alert("Template Name is required"); return; }
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/print-configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          elements,
          canvasSettings,
          workshopId: selectedWorkshopId !== "all" ? selectedWorkshopId : null,
          isDefault: true
        }),
      });
      if (res.ok) {
        alert("Template successfully synced!");
        fetchConfigs();
      } else {
        const err = await res.json();
        alert(`Error: ${err.details || err.error}`);
      }
    } catch { alert("Network error"); } finally { setIsSaving(false); }
  }

  const selectedEl = elements.find(el => el.id === selectedElementId);

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="w-85 border-r border-border bg-card flex flex-col shadow-xl z-10">
        <div className="p-6 border-b border-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Logistics Assets</h2>
          </div>

          <select
            value={selectedWorkshopId}
            onChange={(e) => setSelectedWorkshopId(e.target.value)}
            className="w-full bg-secondary border border-border px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest"
          >
            <option value="all">Global Templates</option>
            {workshops.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>

          <select
            value={selectedConfigId}
            onChange={(e) => {
              if (e.target.value === "sample") loadSampleTemplate();
              else if (e.target.value === "new") createNewConfig();
              else {
                const c = configs.find(conf => conf.id === e.target.value);
                if (c) loadConfig(c);
              }
            }}
            className="w-full bg-secondary border border-border px-4 py-3 rounded-xl text-xs font-bold"
          >
            <option value="sample">Standard Event Badge (Sample)</option>
            {configs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            <option value="new">+ Create New Template</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2">Components</h3>
            <div className="grid grid-cols-1 gap-2">
              <button onClick={() => addElement("qrcode", "Magic QR Code")} className="w-full py-4 px-4 rounded-xl bg-secondary/50 hover:bg-secondary text-[10px] font-bold uppercase text-left border border-border/10 flex items-center justify-between">QR Magic Link <span className="text-muted">⊕</span></button>
              <button onClick={() => addElement("image", "Logo / Image")} className="w-full py-4 px-4 rounded-xl bg-secondary/50 hover:bg-secondary text-[10px] font-bold uppercase text-left border border-border/10 flex items-center justify-between text-blue-600">Company Logo <span className="text-blue-400">⊕</span></button>
              <button onClick={() => addElement("workshop_name", "Automated Title")} className="w-full py-4 px-4 rounded-xl bg-secondary/50 hover:bg-secondary text-[10px] font-bold uppercase text-left border border-border/10 flex items-center justify-between">Event Name <span className="text-muted">⊕</span></button>
              <button onClick={() => addElement("workshop_start", "Event Start")} className="w-full py-4 px-4 rounded-xl bg-secondary/50 hover:bg-secondary text-[10px] font-bold uppercase text-left border border-border/10 flex items-center justify-between">Start Date/Time <span className="text-muted">⊕</span></button>
              <button onClick={() => addElement("text", "New Custom Label")} className="w-full py-4 px-4 rounded-xl bg-secondary/50 hover:bg-secondary text-[10px] font-bold uppercase text-left border border-border/10 flex items-center justify-between">Static Text <span className="text-muted">⊕</span></button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2">Guest Bindings</h3>
            <div className="mb-4">
              <label className="text-[9px] font-black text-muted uppercase block mb-1.5">Source Blueprint</label>
              <select
                value={selectedBlueprintId}
                onChange={(e) => setSelectedBlueprintId(e.target.value)}
                className="w-full bg-secondary border border-border px-3 py-2 rounded-lg text-[10px] font-bold"
              >
                <option value="">-- All Unique Fields --</option>
                {blueprints.map(bp => <option key={bp.id} value={bp.id}>{bp.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button onClick={() => addElement("data", "Full Name", "full_name")} className="w-full py-4 px-4 rounded-xl bg-blue-500/[0.03] border border-blue-500/10 text-blue-600 text-[10px] font-bold uppercase text-left flex items-center justify-between hover:bg-blue-500/5 transition-all">Bound: Full Name <span className="opacity-40">⊕</span></button>
              {(selectedBlueprintId
                ? blueprints.find(bp => bp.id === selectedBlueprintId)?.fields || []
                : blueprints.flatMap(bp => bp.fields || []).filter((f, index, self) => index === self.findIndex(t => t.key === f.key))
              ).map((field: any) => (
                <button
                  key={field.key}
                  onClick={() => addElement("data", field.label, field.key)}
                  className="w-full py-4 px-4 rounded-xl bg-blue-500/[0.01] border border-blue-500/5 text-blue-500/70 text-[10px] font-bold uppercase text-left flex items-center justify-between hover:bg-blue-500/5 transition-all"
                >
                  Bound: {field.label} <span className="opacity-20">⊕</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border bg-card">
          <div className="mb-4">
            <label className="text-[9px] font-black text-muted uppercase block mb-1.5">Template Filename</label>
            <input
              type="text" value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full bg-secondary border border-border px-4 py-3 rounded-xl text-xs font-bold"
            />
          </div>
          <button onClick={saveConfig} disabled={isSaving} className="w-full py-4 rounded-2xl bg-foreground text-background text-xs font-black uppercase tracking-widest shadow-2xl hover:opacity-90 active:scale-95 transition-all">
            {isSaving ? "Synchronizing..." : "Commit Template"}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        className="flex-1 bg-secondary/30 overflow-auto p-12 flex justify-center custom-scrollbar"
        onPointerDown={() => setSelectedElementId(null)}
      >
        <div
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            width: `${canvasSettings.width * PIXELS_PER_MM}px`,
            height: `${canvasSettings.height * PIXELS_PER_MM}px`,
            backgroundColor: canvasSettings.backgroundColor,
            backgroundImage: canvasSettings.backgroundImage ? `url(${canvasSettings.backgroundImage})` : 'none',
            backgroundSize: "cover",
            color: "black",
            cursor: cursorMode === "plus" ? "crosshair" : "default"
          }}
          className="shadow-[0_40px_100px_rgba(0,0,0,0.15)] relative border border-border overflow-hidden select-none"
        >
          {canvasSettings.showGrid && (
            <div
              style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)`,
                backgroundSize: `${canvasSettings.gridSize * PIXELS_PER_MM}px ${canvasSettings.gridSize * PIXELS_PER_MM}px`
              }}
            />
          )}

          {elements.map((el) => (
            <div
              key={el.id}
              onPointerDown={(e) => handlePointerDown(e, el.id)}
              style={{
                position: "absolute",
                left: `${el.x * PIXELS_PER_MM}px`,
                top: `${el.y * PIXELS_PER_MM}px`,
                fontSize: `${el.fontSize}pt`,
                fontWeight: el.bold ? "900" : "400",
                fontFamily: el.fontFamily || "'Inter', sans-serif",
                color: el.color || "black",
                cursor: isDragging && selectedElementId === el.id ? "grabbing" : (cursorMode === "plus" ? "crosshair" : "grab"),
                outline: selectedElementId === el.id ? "2px solid #3b82f6" : "1px dashed transparent",
                outlineOffset: "4px",
                padding: "4px",
                lineHeight: "1",
                width: el.width ? `${el.width * PIXELS_PER_MM}px` : "auto",
                height: el.height ? `${el.height * PIXELS_PER_MM}px` : "auto",
              }}
            >
              {el.type === "qrcode" ? (
                <div className="bg-white p-2 border border-border/5 shadow-sm w-full h-full flex items-center justify-center">
                  <QRCodeSVG value="https://workshop.app/g/preview" size={el.fontSize * 2} bgColor="#ffffff" fgColor={el.color || "#000000"} />
                </div>
              ) : el.type === "image" ? (
                <img
                  src={el.url}
                  alt="Logo"
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  className="pointer-events-none"
                />
              ) : (
                <span>{el.type === "data" ? `{{${el.key}}}` : el.type === "workshop_start" ? "2026-05-03 10:00" : el.label}</span>
              )}
            </div>
          ))}

          {snapLines.x !== undefined && (
            <div style={{ position: 'absolute', left: `${snapLines.x * PIXELS_PER_MM}px`, top: 0, bottom: 0, width: '1px', backgroundColor: '#3b82f6', pointerEvents: 'none', zIndex: 50 }} />
          )}
          {snapLines.y !== undefined && (
            <div style={{ position: 'absolute', top: `${snapLines.y * PIXELS_PER_MM}px`, left: 0, right: 0, height: '1px', backgroundColor: '#3b82f6', pointerEvents: 'none', zIndex: 50 }} />
          )}

          {cursorMode === "plus" && (
            <div style={{ position: 'absolute', left: mousePos.x * PIXELS_PER_MM + 15, top: mousePos.y * PIXELS_PER_MM + 15, backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', padding: '2px 4px', fontSize: '10px', pointerEvents: 'none', borderRadius: '4px', zIndex: 60 }}>
              {mousePos.x.toFixed(1)}, {mousePos.y.toFixed(1)} mm
            </div>
          )}
        </div>
      </div>

      {/* Property Editor */}
      <div className="w-80 border-l border-border bg-card p-8 space-y-12 overflow-y-auto">
        {selectedEl ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-black tracking-tight">Component Settings</h3>
            <div className="space-y-8">
              {selectedEl.type === 'image' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Image URL</label>
                  <input
                    type="text" value={selectedEl.url || ""}
                    onChange={(e) => setElements(prev => prev.map(el => el.id === selectedElementId ? { ...el, url: e.target.value } : el))}
                    className="w-full bg-secondary border border-border px-4 py-3 rounded-xl text-sm font-bold"
                  />
                </div>
              )}

              {selectedEl.type !== 'image' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                    {selectedEl.type === 'data' ? "Database Field Key" : "Display Content"}
                  </label>
                  <input
                    type="text" value={selectedEl.type === 'data' ? selectedEl.key : selectedEl.label}
                    onChange={(e) => setElements(prev => prev.map(el => el.id === selectedElementId ? (selectedEl.type === 'data' ? { ...el, key: e.target.value } : { ...el, label: e.target.value }) : el))}
                    className="w-full bg-secondary border border-border px-4 py-3 rounded-xl text-sm font-bold"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase">X (mm)</label>
                  <input type="number" value={Math.round(selectedEl.x)} onChange={(e) => setElements(prev => prev.map(el => el.id === selectedElementId ? { ...el, x: parseInt(e.target.value) || 0 } : el))} className="w-full bg-secondary border border-border px-3 py-2 rounded-lg text-xs font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase">Y (mm)</label>
                  <input type="number" value={Math.round(selectedEl.y)} onChange={(e) => setElements(prev => prev.map(el => el.id === selectedElementId ? { ...el, y: parseInt(e.target.value) || 0 } : el))} className="w-full bg-secondary border border-border px-3 py-2 rounded-lg text-xs font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase">Width (mm)</label>
                  <input type="number" value={selectedEl.width || ''} onChange={(e) => setElements(prev => prev.map(el => el.id === selectedElementId ? { ...el, width: parseInt(e.target.value) } : el))} className="w-full bg-secondary border border-border px-3 py-2 rounded-lg text-xs font-bold" placeholder="Auto" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase">Height (mm)</label>
                  <input type="number" value={selectedEl.height || ''} onChange={(e) => setElements(prev => prev.map(el => el.id === selectedElementId ? { ...el, height: parseInt(e.target.value) } : el))} className="w-full bg-secondary border border-border px-3 py-2 rounded-lg text-xs font-bold" placeholder="Auto" />
                </div>
              </div>

              {selectedEl.type !== 'image' && selectedEl.type !== 'qrcode' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest">Typography Style</label>
                  <select
                    value={selectedEl.fontFamily || "'Inter', sans-serif"}
                    onChange={(e) => setElements(prev => prev.map(el => el.id === selectedElementId ? { ...el, fontFamily: e.target.value } : el))}
                    className="w-full bg-secondary border border-border px-3 py-2 rounded-xl text-xs font-bold"
                  >
                    {GOOGLE_FONTS.map(f => <option key={f.name} value={f.value}>{f.name}</option>)}
                  </select>
                </div>
              )}

              {selectedEl.type !== 'image' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase">Color</label>
                  <input type="color" value={selectedEl.color || "#000000"} onChange={(e) => setElements(prev => prev.map(el => el.id === selectedElementId ? { ...el, color: e.target.value } : el))} className="w-full h-10 p-1 bg-secondary rounded" />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest flex justify-between">
                  Scale / Font Size
                  <input type="number" value={selectedEl.fontSize} onChange={(e) => setElements(prev => prev.map(el => el.id === selectedElementId ? { ...el, fontSize: parseInt(e.target.value) || 6 } : el))} className="w-12 bg-secondary text-right px-1 text-xs border border-border rounded" />
                </label>
                <input
                  type="range" min="6" max="200" value={selectedEl.fontSize}
                  onChange={(e) => setElements(prev => prev.map(el => el.id === selectedElementId ? { ...el, fontSize: parseInt(e.target.value) } : el))}
                  className="w-full accent-foreground"
                />
              </div>

              <div className="pt-10">
                <button
                  onClick={() => { setElements(prev => prev.filter(el => el.id !== selectedElementId)); setSelectedElementId(null); }}
                  className="w-full py-4 rounded-2xl bg-destructive/5 text-destructive text-[9px] font-black uppercase tracking-widest hover:bg-destructive hover:text-white transition-all"
                >
                  Delete Component
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-black tracking-tight">Canvas Settings</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase">Width (mm)</label>
                  <input type="number" value={canvasSettings.width} onChange={e => setCanvasSettings({ ...canvasSettings, width: parseInt(e.target.value) || 210 })} className="w-full bg-secondary border border-border px-3 py-2 rounded-lg text-xs font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase">Height (mm)</label>
                  <input type="number" value={canvasSettings.height} onChange={e => setCanvasSettings({ ...canvasSettings, height: parseInt(e.target.value) || 297 })} className="w-full bg-secondary border border-border px-3 py-2 rounded-lg text-xs font-bold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase">Grid Size (mm)</label>
                  <input type="number" value={canvasSettings.gridSize} onChange={e => setCanvasSettings({ ...canvasSettings, gridSize: parseInt(e.target.value) || 10 })} className="w-full bg-secondary border border-border px-3 py-2 rounded-lg text-xs font-bold" />
                </div>
                <div className="space-y-2 flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer text-[10px] font-black text-muted uppercase">
                    <input type="checkbox" checked={canvasSettings.showGrid} onChange={e => setCanvasSettings({ ...canvasSettings, showGrid: e.target.checked })} className="accent-foreground w-4 h-4" />
                    Show Grid
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase">Background Color</label>
                <input type="color" value={canvasSettings.backgroundColor} onChange={e => setCanvasSettings({ ...canvasSettings, backgroundColor: e.target.value })} className="w-full h-10 p-1 bg-secondary rounded border border-border" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase">Background Image URL</label>
                <input type="text" value={canvasSettings.backgroundImage} onChange={e => setCanvasSettings({ ...canvasSettings, backgroundImage: e.target.value })} className="w-full bg-secondary border border-border px-3 py-2 rounded-lg text-xs font-bold" placeholder="https://..." />
              </div>

              <div className="pt-6 border-t border-border">
                <label className="text-[10px] font-black text-muted uppercase mb-3 block">Cursor Mode</label>
                <div className="flex gap-2">
                  <button onClick={() => setCursorMode("standard")} className={`flex-1 py-3 rounded-lg ${cursorMode === 'standard' ? 'bg-foreground text-background' : 'bg-secondary'} text-xs font-bold transition-all`}>Standard</button>
                  <button onClick={() => setCursorMode("plus")} className={`flex-1 py-3 rounded-lg ${cursorMode === 'plus' ? 'bg-foreground text-background' : 'bg-secondary'} text-xs font-bold transition-all`}>Plus (Coord)</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
