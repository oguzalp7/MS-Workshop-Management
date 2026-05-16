"use client";

import { useEffect, useState, use } from "react";
import { QRCodeSVG } from "qrcode.react";

interface PrintElement {
  id: string;
  type: "qrcode" | "text" | "data" | "workshop_name" | "image" | "workshop_start" | "workshop_end";
  x: number;
  y: number;
  fontSize: number;
  bold: boolean;
  label: string;
  key?: string;
  fontFamily?: string;
  color?: string;
  url?: string;
  width?: number;
  height?: number;
}



interface Guest {
  id: string;
  profileData: any;
}

export default function WorkshopPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<{ workshop: any, guests: Guest[], config: any } | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const guestIdFilter = searchParams.get("guestId");

      // 1. Fetch Workshop & Guests
      const wRes = await fetch(`/api/admin/workshops/${id}`);
      const wData = await wRes.json();

      let guests = wData.workshop.guests;
      if (guestIdFilter) {
        guests = guests.filter((g: any) => g.id === guestIdFilter);
      }

      // 2. Fetch Print Template (Workshop specific or default)
      const pRes = await fetch(`/api/admin/print-configs`);
      const pData = await pRes.json();
      
      const templateId = wData.workshop.printConfigId;
      let config = null;
      
      if (templateId) {
        config = pData.configs.find((c: any) => c.id === templateId);
      }
      
      if (!config) {
        config = pData.configs.find((c: any) => c.isDefault) || pData.configs[0];
      }

      setData({
        workshop: wData.workshop,
        guests: guests,
        config: config
      });
      
      // Auto-trigger print after a short delay for QR codes to render
      setTimeout(() => {
        window.print();
      }, 1500);
    } catch (error) { 
      console.error("Print fetch error:", error);
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchData(); }, [id]);

  if (loading) return <div className="p-12 text-center font-bold">Preparing Print Stream...</div>;
  if (!data || !data.config) return <div className="p-12 text-center text-destructive">No print template found. Please design one in the Print Studio.</div>;

  const PIXELS_PER_MM = 3.78; // Standard 96 DPI conversion
  const canvas = data.config.canvasSettings || { width: 210, height: 297 };

  return (
    <div className="print-container">
      <style jsx global>{`
        @media print {
          body { margin: 0; padding: 0; background: white; }
          .no-print { display: none; }
          .page-break { page-break-after: always; }
          @page { size: ${canvas.width}mm ${canvas.height}mm; margin: 0; }
        }
        .print-page {
          width: ${canvas.width}mm;
          height: ${canvas.height}mm;
          position: relative;
          background: white;
          overflow: hidden;
          margin: 0 auto;
          background-color: ${canvas.backgroundColor || "#ffffff"};
          background-image: ${canvas.backgroundImage ? `url(${canvas.backgroundImage})` : 'none'};
          background-size: cover;
        }
        .print-container {
          background: #f0f0f0;
          padding: 20px 0;
        }
        @media print {
          .print-container { padding: 0; background: white; }
        }
      `}</style>

      <div className="no-print fixed top-4 right-4 z-50">
         <button onClick={() => window.print()} className="px-8 py-4 bg-foreground text-background rounded-full font-bold shadow-2xl">RE-TRIGGER PRINT</button>
      </div>

      {data.guests.map((guest, gIdx) => (
        <div key={guest.id} className={`print-page ${gIdx < data.guests.length - 1 ? 'page-break' : ''}`}>
           {data.config.elements.map((el: PrintElement) => {
             let content: any = el.label;
             
             if (el.type === "data") {
               content = guest.profileData[el.key || ""] || guest[el.key as keyof Guest] || "—";
             } else if (el.type === "workshop_name") {
               content = data.workshop.name;
             } else if (el.type === "workshop_start") {
               content = new Date(data.workshop.startDateTime).toLocaleString();
             } else if (el.type === "workshop_end") {
               content = new Date(data.workshop.endDateTime).toLocaleString();
             }

             const origin = typeof window !== "undefined" ? window.location.origin : "";
             const guestUrl = `${origin}/g/${guest.id}`;

             return (
               <div 
                 key={el.id}
                 style={{
                   position: "absolute",
                   left: `${el.x}mm`,
                   top: `${el.y}mm`,
                   fontSize: `${el.fontSize}pt`,
                   fontWeight: el.bold ? "900" : "400",
                   fontFamily: el.fontFamily || "'Inter', sans-serif",
                   color: el.color || "#000000",
                 }}
               >
                  {el.type === "qrcode" ? (
                    <QRCodeSVG 
                      value={guestUrl} 
                      size={el.fontSize * PIXELS_PER_MM} 
                      bgColor="#ffffff"
                      fgColor={el.color || "#000000"}
                    />
                  ) : el.type === "image" ? (
                    <img 
                      src={el.url} 
                      alt="Logo" 
                      style={{ width: `${el.width}mm`, height: `${el.height}mm`, objectFit: "contain" }}
                    />
                  ) : (
                    <span>{content}</span>
                  )}
               </div>
             );
           })}

        </div>
      ))}
    </div>
  );
}
