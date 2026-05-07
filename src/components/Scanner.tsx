"use client";

import { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

interface ScannerProps {
  onScanSuccess: (decodedText: string) => void;
}

export function Scanner({ onScanSuccess }: ScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // We use a timeout to ensure the DOM element is ready
    const timer = setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
        },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          scanner.clear();
          onScanSuccess(decodedText);
        },
        (error) => {
          // ignore scan errors
        }
      );

      scannerRef.current = scanner;
    }, 100);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Scanner clear error", err));
      }
      clearTimeout(timer);
    };
  }, [onScanSuccess]);

  return (
    <div className="w-full bg-black min-h-[300px] flex items-center justify-center relative">
      <div id="qr-reader" className="w-full border-none"></div>
      <style jsx global>{`
        #qr-reader {
          border: none !important;
        }
        #qr-reader__scan_region {
           background: black !important;
        }
        #qr-reader img {
          display: none !important;
        }
        #qr-reader__dashboard_section_csr button {
          background: white !important;
          color: black !important;
          border-radius: 12px !important;
          padding: 10px 20px !important;
          font-size: 12px !important;
          font-weight: bold !important;
          text-transform: uppercase !important;
          border: none !important;
          margin: 10px 0 !important;
        }
        #qr-reader__status_span {
           display: none !important;
        }
      `}</style>
    </div>
  );
}
