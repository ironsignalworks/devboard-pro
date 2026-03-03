// Default to empty string so requests to "/api" go through Vite dev server proxy in development.
// Set VITE_API_URL when you need to target a different backend (e.g. production build).
const API = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
const REQUEST_TIMEOUT_MS = 10000

const parseResponse = async (res: Response) => {
  if (res.status === 204) return null
  const text = await res.text()
  try { return JSON.parse(text) } catch { return text }
}

export const call = async (path: string, opts: RequestInit = {}, allowRetry = true) => {
  const url = API + path
  const headers: any = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  console.log('[api] request]', opts.method || 'GET', url)

  try {
    const res = await fetch(url, { ...opts, headers, credentials: 'include', signal: controller.signal })
    if (res.status === 401 && allowRetry) {
      const refreshRes = await fetch(API + '/api/auth/refresh', { method: 'POST', credentials: 'include', signal: controller.signal })
      if (refreshRes.ok) {
        return call(path, opts, false)
      }
    }
    const payload: any = await parseResponse(res)
    if (!res.ok) {
      if (payload && typeof payload === 'object') {
        return { __error: true, status: res.status, ...payload }
      }
      return { __error: true, status: res.status, message: String(payload || `Request failed (${res.status})`) }
    }
    return payload
  } catch (err: any) {
    const isTimeout = err?.name === 'AbortError'
    const message = isTimeout ? 'Request timed out' : (err?.message || 'Network error')
    console.error('[api] network error', message)
    return { __error: true, message }
  } finally {
    clearTimeout(timeoutId)
  }
}

export default call
