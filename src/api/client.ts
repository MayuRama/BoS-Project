/**
 * API Client — BoS FX Platform
 *
 * UI auth and API auth are kept completely separate:
 *  - UI login  : sets localStorage flags (cb_logged_in / dealer_logged_in) — accepts any credentials
 *  - API auth  : uses dedicated portal service accounts to obtain JWTs automatically
 *                CB portal   → fxdesk  / admin123  (FXInterventionDesk role)
 *                Dealer portal → D002_admin / dealer123 (DealerAdmin role, dealerId: D002)
 *
 * Tokens are cached per portal under separate keys (cb_api_token / dealer_api_token).
 * On 401, the cached token is cleared and a fresh one is fetched automatically.
 */

const BASE_URL = 'http://localhost:3001/api';

const SERVICE_ACCOUNTS = {
  cb:     { username: 'fxdesk',     password: 'admin123',  tokenKey: 'cb_api_token' },
  dealer: { username: 'D002_admin', password: 'dealer123', tokenKey: 'dealer_api_token' },
} as const;

type Portal = keyof typeof SERVICE_ACCOUNTS;

const getPortal = (): Portal | null => {
  if (window.location.pathname.startsWith('/centralbank-portal')) return 'cb';
  if (window.location.pathname.startsWith('/dealer-portal'))      return 'dealer';
  return null;
};

const clearToken = () => {
  const portal = getPortal();
  if (portal) localStorage.removeItem(SERVICE_ACCOUNTS[portal].tokenKey);
};

/** Fetch a fresh service token and cache it. Returns null if backend is offline. */
const fetchServiceToken = async (portal: Portal): Promise<string | null> => {
  const { username, password, tokenKey } = SERVICE_ACCOUNTS[portal];
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem(tokenKey, data.accessToken);
      return data.accessToken;
    }
  } catch {
    // backend offline — callers will proceed without a token (read-only routes still work)
  }
  return null;
};

/** Returns a valid service token for the current portal, fetching one if needed. */
const ensureToken = async (): Promise<string | null> => {
  const portal = getPortal();
  if (!portal) return null;
  const cached = localStorage.getItem(SERVICE_ACCOUNTS[portal].tokenKey);
  if (cached) return cached;
  return fetchServiceToken(portal);
};

const headers = (token: string | null, json = true): Record<string, string> => {
  const h: Record<string, string> = {};
  if (json) h['Content-Type'] = 'application/json';
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
};

const handleError = async (res: Response): Promise<never> => {
  if (res.status === 401) clearToken(); // expired — next call will re-fetch
  const body = await res.json().catch(() => ({ error: res.statusText }));
  throw new Error(body.error || `Request failed (${res.status})`);
};

export const api = {
  async get<T>(path: string): Promise<T> {
    const token = await ensureToken();
    const res = await fetch(`${BASE_URL}${path}`, { headers: headers(token, false) });
    if (!res.ok) return handleError(res);
    return res.json();
  },

  async post<T>(path: string, body: unknown): Promise<T> {
    const token = await ensureToken();
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST', headers: headers(token), body: JSON.stringify(body),
    });
    if (!res.ok) return handleError(res);
    return res.json();
  },

  async put<T>(path: string, body: unknown): Promise<T> {
    const token = await ensureToken();
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PUT', headers: headers(token), body: JSON.stringify(body),
    });
    if (!res.ok) return handleError(res);
    return res.json();
  },

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const token = await ensureToken();
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PATCH', headers: headers(token),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) return handleError(res);
    return res.json();
  },

  async delete<T>(path: string): Promise<T> {
    const token = await ensureToken();
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE', headers: headers(token, false),
    });
    if (!res.ok) return handleError(res);
    return res.json();
  },

  /** Pre-warm the service token for this portal (call on app load). */
  async warmup(): Promise<void> {
    const portal = getPortal();
    if (portal && !localStorage.getItem(SERVICE_ACCOUNTS[portal].tokenKey)) {
      await fetchServiceToken(portal);
    }
  },

  /** Clear the cached service token (called on logout). */
  clearToken,
};
