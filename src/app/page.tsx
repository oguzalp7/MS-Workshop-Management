"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/Icons";
import { Scanner } from "@/components/Scanner";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [isStandalone, setIsStandalone] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect standalone mode
    const standalone = (typeof window !== "undefined") && (
      window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as any).standalone
      || document.referrer.includes("android-app://")
    );

    setIsStandalone(standalone);

    // Detect iOS
    const ios = (typeof navigator !== "undefined") && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);
  }, []);

  const handleScanSuccess = (decodedText: string) => {
    // Basic validation: ensure it's a magic link from our domain or at least contains /g/
    if (decodedText.includes("/g/")) {
      window.location.href = decodedText;
    } else {
      alert("Geçersiz QR Kod. Lütfen size özel hazırlanan QR kodu taratın.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans">
      {/* Header / Logo */}
      <header className="p-8 flex justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl shadow-white/10">
            <Icons.Shopping className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-[0.3em] mt-4">Workshop POS</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-8 pb-20 max-w-lg mx-auto w-full">
        {!showScanner ? (
          <div className="w-full space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold tracking-tight">Hoş Geldiniz</h2>
              <p className="text-zinc-400 text-lg leading-relaxed">
                Alışverişe başlamak ve bildirimlerinizi takip etmek için uygulamamızı kullanın.
              </p>
            </div>

            {isStandalone ? (
              /* Standalone Mode: Ready to Scan */
              <div className="space-y-6">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-10 text-center space-y-6">
                  <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto">
                    <Icons.Camera className="w-10 h-10 text-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold">Profilinizi Tanımlayın</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                      Size özel hazırlanan QR kodu kameranıza göstererek profilinize giriş yapın.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowScanner(true)}
                    className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95"
                  >
                    Kamerayı Aç
                  </button>
                </div>
              </div>
            ) : (
              /* Browser Mode: Install Instructions */
              <div className="space-y-8">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8 space-y-8">
                  <div className="flex items-center gap-4 border-b border-zinc-800 pb-6">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center shrink-0">
                      <Icons.StatusInfo className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-bold">Önce Uygulamayı Yükleyin</h3>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Tam deneyim için gereklidir</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {isIOS ? (
                      <div className="space-y-6">
                        <div className="flex items-start gap-4">
                          <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
                          <p className="text-sm text-zinc-300">Tarayıcınızın altındaki <span className="inline-block bg-zinc-800 px-2 py-0.5 rounded text-white italic">Paylaş (Kutu ve ok)</span> ikonuna dokunun.</p>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
                          <p className="text-sm text-zinc-300">Açılan menüde <span className="font-bold text-white italic">"Ana Ekrana Ekle"</span> seçeneğini bulun ve seçin.</p>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</div>
                          <p className="text-sm text-zinc-300">Ana ekranınıza gelen logoya dokunarak uygulamayı açın.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-start gap-4">
                          <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
                          <p className="text-sm text-zinc-300">Tarayıcı menüsündeki üç noktaya dokunun.</p>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
                          <p className="text-sm text-zinc-300"><span className="font-bold text-white">"Uygulamayı Yükle"</span> veya <span className="font-bold text-white">"Ana Ekrana Ekle"</span> butonuna basın.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em]">Uygulamayı yükledikten sonra bildirim alabilirsiniz.</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Scanner UI */
          <div className="w-full space-y-8 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">QR Kod Taratın</h2>
              <button
                onClick={() => setShowScanner(false)}
                className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white"
              >
                <Icons.Trash className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <div className="overflow-hidden rounded-[2.5rem] border-2 border-blue-600 shadow-2xl shadow-blue-500/20">
              <Scanner onScanSuccess={handleScanSuccess} />
            </div>
            <p className="text-center text-xs text-zinc-500 leading-relaxed px-10">
              Lütfen size verilen karttaki QR kodu bu alana gösterin.
            </p>
          </div>
        )}

        <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.4em]"></p>
      </main>

      {/* Footer Info */}
      <footer className="p-8 text-center border-t border-zinc-900">
        <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.4em]" onClick={() => router.push("/admin")}>Powered by La Vittoria AI</p>
      </footer>
    </div>
  );
}
