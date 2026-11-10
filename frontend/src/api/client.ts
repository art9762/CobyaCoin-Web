const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000";

export function getToken(): string | null {
  return localStorage.getItem("cobya:token");
}

const unauthorizedListeners = new Set<() => void>();

export function onUnauthorized(listener: () => void): () => void {
  unauthorizedListeners.add(listener);
  return () => { unauthorizedListeners.delete(listener); };
}

export function setToken(t: string | null): void {
  if (t) localStorage.setItem("cobya:token", t);
  else localStorage.removeItem("cobya:token");
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  const t = getToken();
  if (t) headers.Authorization = `Bearer ${t}`;

  const resp = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!resp.ok) {
    let detail = resp.statusText;
    try {
      const body = await resp.json();
      detail = body.detail ?? JSON.stringify(body);
    } catch {
      // ignore
    }
    // An old request must not invalidate a replacement login.
    if (resp.status === 401 && t && getToken() === t) {
      setToken(null);
      unauthorizedListeners.forEach((listener) => listener());
    }
    throw new ApiError(resp.status, String(detail));
  }
  if (resp.status === 204) return undefined as T;
  return (await resp.json()) as T;
}

export const wsUrl = (): string => {
  const t = getToken();
  const proto = BASE.startsWith("https") ? "wss" : "ws";
  const host = BASE.replace(/^https?:\/\//, "");
  return `${proto}://${host}/ws${t ? `?token=${encodeURIComponent(t)}` : ""}`;
};
