export const AUTH_STORAGE_KEY = "lkmed-auth-session";

export function readStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawSession = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (!rawSession) {
      return null;
    }

    return JSON.parse(rawSession);
  } catch {
    return null;
  }
}

export function writeStoredSession(session) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (!session) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage can be unavailable in restricted browser contexts; auth still works in memory.
  }
}

export function getStoredAccessToken() {
  return readStoredSession()?.accessToken ?? "";
}
