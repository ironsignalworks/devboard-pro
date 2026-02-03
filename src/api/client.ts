// Default to empty string so requests to "/api" go through Vite dev server proxy in development.
// Set VITE_API_URL when you need to target a different backend (e.g. production build).
const API = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

const parseResponse = async (res: Response) => {
  if (res.status === 204) return null
  const text = await res.text()
  try { return JSON.parse(text) } catch { return text }
}

export const call = async (path: string, opts: RequestInit = {}, allowRetry = true) => {
  const url = API + path
  const headers: any = { 'Content-Type': 'application/json', ...(opts.headers || {}) }

  console.log('[api] request]', opts.method || 'GET', url)

  try {
    const res = await fetch(url, { ...opts, headers, credentials: 'include' })
    if (res.status === 401 && allowRetry) {
      const refreshRes = await fetch(API + '/api/auth/refresh', { method: 'POST', credentials: 'include' })
      if (refreshRes.ok) {
        return call(path, opts, false)
      }
    }
    return parseResponse(res)
  } catch (err: any) {
    console.error('[api] network error', err && err.message ? err.message : err)
    return { __error: true, message: err?.message || 'Network error' }
  }
}

export default call
