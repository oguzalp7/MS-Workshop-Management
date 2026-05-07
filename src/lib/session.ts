const SESSION_COOKIE_NAME = "workshop_session_token";
const STORAGE_KEY = "ms_workshop_session";

export const SessionManager = {
  /**
   * Retrieves the session token from Cookie or LocalStorage backup
   */
  getToken: () => {
    // 1. Try Cookie (Client-side)
    if (typeof document !== "undefined") {
      const match = document.cookie.match(new RegExp('(^| )' + SESSION_COOKIE_NAME + '=([^;]+)'));
      if (match) return match[2];
    }

    // 2. Try LocalStorage backup if in browser
    if (typeof window !== "undefined") {
      const token = localStorage.getItem(STORAGE_KEY);
      // If found in Storage but not Cookie, sync it back to Cookie
      if (token) {
        document.cookie = `${SESSION_COOKIE_NAME}=${token}; Max-Age=${30 * 24 * 60 * 60}; Path=/; SameSite=Lax`;
        return token;
      }
    }
    return undefined;
  },

  /**
   * Saves the token to both Cookie and LocalStorage
   */
  setToken: (token: string) => {
    if (typeof document !== "undefined") {
      document.cookie = `${SESSION_COOKIE_NAME}=${token}; Max-Age=${30 * 24 * 60 * 60}; Path=/; SameSite=Lax`;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, token);
    }
  },

  /**
   * Clears session from all storage
   */
  clearSession: () => {
    if (typeof document !== "undefined") {
      document.cookie = `${SESSION_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
};
