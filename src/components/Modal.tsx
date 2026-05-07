"use client";

import { useState, ReactNode, createContext, useContext } from "react";

interface ModalContextType {
  isMaximized: boolean;
}

const ModalContext = createContext<ModalContextType>({ isMaximized: false });

export const useModalContext = () => useContext(ModalContext);

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
}

const MAX_WIDTH_MAP = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  full: "max-w-full",
};

export function Modal({ isOpen, onClose, title, children, maxWidth = "2xl" }: ModalProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  if (!isOpen) return null;

  const widthClass = isMaximized 
    ? "w-[96vw] h-[96vh] rounded-2xl" 
    : `${MAX_WIDTH_MAP[maxWidth]} w-full max-h-[90vh] rounded-3xl`;

  return (
    <ModalContext.Provider value={{ isMaximized }}>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/60 backdrop-blur-md animate-in fade-in duration-300">
        <div 
          className={`
            bg-card border border-border shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)]
            flex flex-col transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
            ${widthClass}
          `}
        >
          {/* Modal Header */}
          <div className="px-8 py-6 border-b border-border flex items-center justify-between shrink-0">
            <h2 className={`font-bold tracking-tight transition-all duration-300 ${isMaximized ? "text-3xl" : "text-xl"}`}>{title}</h2>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-2.5 rounded-xl hover:bg-secondary text-muted hover:text-foreground transition-all active:scale-95"
                title={isMaximized ? "Restore" : "Maximize"}
              >
                {isMaximized ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v5H3"/><path d="M21 8h-5V3"/><path d="M3 16h5v5"/><path d="M16 21v-5h5"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 3 6 6"/><path d="M9 21l-6-6"/><path d="M21 3v6h-6"/><path d="M3 21v-6h6"/></svg>
                )}
              </button>
              <button 
                onClick={onClose} 
                className="p-2.5 rounded-xl hover:bg-destructive/10 text-muted hover:text-destructive transition-all active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </ModalContext.Provider>
  );
}
