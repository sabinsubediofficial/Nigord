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
