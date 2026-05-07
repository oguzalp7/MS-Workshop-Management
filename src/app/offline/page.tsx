"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary text-muted mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" x2="23" y1="1" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" x2="12.01" y1="20" y2="20"/>
          </svg>
        </div>
        <h1 className="text-xl font-semibold mb-2">You&apos;re Offline</h1>
        <p className="text-muted text-sm mb-6">
          Please check your internet connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
