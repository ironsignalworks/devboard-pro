// Default to empty string so requests to "/api" go through Vite dev server proxy in development.
// Set VITE_API_URL when you need to target a different backend (e.g. production build).
const API = import.meta.env.VITE_API_URL || ''

export const call = async (path: string, opts: RequestInit = {}) => {
  const url = API + path
  const token = localStorage.getItem('token')
  const headers: any = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`

  console.log('[api] request]', opts.method || 'GET', url)

  try {
    const res = await fetch(url, { ...opts, headers })
    if (res.status === 204) return null
    const text = await res.text()
    try { return JSON.parse(text) } catch { return text }
  } catch (err: any) {
    console.error('[api] network error', err && err.message ? err.message : err)
    return { __error: true, message: err?.message || 'Network error' }
  }
}

export default call
