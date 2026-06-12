// API configuration
// In development (Vite dev server), requests are proxied to localhost:8787 by vite.config.ts
// In production, we call the Cloudflare Worker directly
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'

export const API_BASE = isProduction
  ? 'https://nigord-backend.sabinsubediofficial.workers.dev'
  : ''

/**
 * Wrapper around fetch that prepends the API base URL in production.
 * Use this instead of `fetch('/path', ...)` for all API calls.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${API_BASE}${path}`
  return fetch(url, {
    ...init,
    credentials: 'include',
  })
}
