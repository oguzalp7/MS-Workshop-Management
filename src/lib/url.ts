/**
 * Utility to get the base URL of the application.
 * It prioritizes the actual request/window origin but falls back to 
 * NEXT_PUBLIC_BASE_URL if it detects a local/internal address.
 */
export function getBaseUrl(request?: Request) {
  // 1. Client-side logic
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    // If we're on a local address, try to use the environment variable fallback
    if (origin.includes("localhost") || origin.includes("0.0.0.0") || origin.includes("127.0.0.1")) {
      return process.env.NEXT_PUBLIC_BASE_URL || origin;
    }
    return origin;
  }

  // 2. Server-side logic (Route Handlers)
  if (request) {
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
    const proto = request.headers.get("x-forwarded-proto") || "http";
    
    // Detect internal/local addresses
    if (
      host.includes("localhost") || 
      host.includes("0.0.0.0") || 
      host.includes("nextjs") || 
      host.includes("127.0.0.1")
    ) {
      return process.env.NEXT_PUBLIC_BASE_URL || `${proto}://${host}`;
    }
    
    return `${proto}://${host}`;
  }

  // 3. Absolute Fallback
  return process.env.NEXT_PUBLIC_BASE_URL || "";
}
