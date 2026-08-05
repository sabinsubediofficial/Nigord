// API configuration
// In development (Vite dev server), requests are proxied to localhost:8787 by vite.config.ts
// In production, we call the Cloudflare Worker directly
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'

export const API_BASE = isProduction
  ? 'https://suhhp-backend.sabinsubediofficial.workers.dev'
  : ''

// --- Token helpers (localStorage fallback for Safari ITP) ---
const TOKEN_KEY = 'suhhp_auth_token'

export function saveToken(token: string) {
  try { localStorage.setItem(TOKEN_KEY, token) } catch {}
}

export function getToken(): string | null {
  try { 
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('nigord_auth_token') 
  } catch { 
    return null 
  }
}

export function clearToken() {
  try { 
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('nigord_auth_token')
  } catch {}
}

/**
 * Wrapper around fetch that prepends the API base URL in production.
 * Sends JWT via both cookie (credentials: include) AND Authorization header.
 * Use this instead of `fetch('/path', ...)` for all API calls.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${API_BASE}${path}`
  const token = getToken()
  const headers = new Headers(init?.headers)
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  })
}

/**
 * Resolves local file paths to full URLs if needed (especially for production deployment).
 */
export function getFileUrl(url?: string): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url
  }
  return `${API_BASE}${url}`
}

/**
 * Safely parses naive UTC date strings returned by SQLite/D1 into JavaScript Date objects.
 */
export function parseUTCDate(dateInput: string | Date | null | undefined): Date {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;
  
  let dateStr = String(dateInput).trim();
  // SQLite CURRENT_TIMESTAMP returns strings like "YYYY-MM-DD HH:MM:SS"
  // We need to convert it to ISO-8601 "YYYY-MM-DDTHH:MM:SSZ" format so that
  // the browser parses it as UTC instead of naive local time.
  if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-')) {
    if (dateStr.includes(' ')) {
      dateStr = dateStr.replace(' ', 'T') + 'Z';
    } else if (dateStr.includes('T')) {
      dateStr = dateStr + 'Z';
    } else {
      dateStr = dateStr + 'T00:00:00Z';
    }
  }
  return new Date(dateStr);
}
