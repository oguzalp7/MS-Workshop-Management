"use client";

import { useState } from "react";

interface BatchInputProps {
  onAdd: (names: string[]) => void;
  placeholder: string;
  label: string;
}

export function BatchInput({ onAdd, placeholder, label }: BatchInputProps) {
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  function handleAdd() {
    const lines = input
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    if (lines.length > 0) {
      onAdd(lines);
      setInput("");
      setIsOpen(false);
    }
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="text-[10px] font-bold text-muted hover:text-foreground underline decoration-dotted underline-offset-4 transition-colors"
      >
        + ADD MULTIPLE {label.toUpperCase()}
      </button>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-dashed border-border bg-secondary/20 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Multiple {label} (one per line)</span>
        <button onClick={() => setIsOpen(false)} className="text-muted hover:text-destructive text-xs">Cancel</button>
      </div>
      <textarea
        autoFocus
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full h-32 p-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-1 focus:ring-foreground resize-none"
        placeholder={placeholder}
      />
      <div className="flex justify-end mt-3">
        <button 
          onClick={handleAdd}
          disabled={!input.trim()}
          className="px-4 py-2 rounded-lg bg-foreground text-background text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all"
        >
          ADD {input.split("\n").filter(l => l.trim()).length} ITEMS
        </button>
      </div>
    </div>
  );
}
