import { SessionOptions } from "iron-session";

export interface SessionData {
  adminId: string;
  username: string;
  name: string;
  isLoggedIn: boolean;
}

export const defaultSession: SessionData = {
  adminId: "",
  username: "",
  name: "",
  isLoggedIn: false,
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "complex-password-for-session-must-be-32-chars-long",
  cookieName: "workshop-admin-session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24, // 24 hours
  },
};

// ─── Guest Session Configuration ──────────────────────────────────
export interface GuestSessionData {
  guestId: string;
  workshopId: string;
  isLoggedIn: boolean;
}

export const defaultGuestSession: GuestSessionData = {
  guestId: "",
  workshopId: "",
  isLoggedIn: false,
};

export const guestSessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "complex-password-for-session-must-be-32-chars-long",
  cookieName: "workshop-guest-session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 12, // 12 hours (sessions expire faster for guests)
  },
};
