// Default to empty string so requests to "/api" go through Vite dev server proxy in development.
// Set VITE_API_URL when you need to target a different backend (e.g. production build).
const API = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
const REQUEST_TIMEOUT_MS = 10000

const parseResponse = async (res: Response): Promise<unknown> => {
  if (res.status === 204) return null
  const text = await res.text()
  try { return JSON.parse(text) } catch { return text }
}

const readCookie = (name: string) => {
  if (typeof document === 'undefined') return ''
  const parts = document.cookie.split(';').map((part) => part.trim())
  for (const part of parts) {
    if (part.startsWith(`${name}=`)) {
      return decodeURIComponent(part.slice(name.length + 1))
    }
  }
  return ''
}

export type ApiError = { __error: true; message?: string; status?: number };
export type ApiResult<T = unknown> = T | ApiError;

export const call = async <T = unknown>(
  path: string,
  opts: RequestInit = {},
  allowRetry = true
): Promise<ApiResult<T>> => {
  const url = API + path
  const method = String(opts.method || 'GET').toUpperCase()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> | undefined),
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrf = readCookie('csrfToken')
    if (csrf) headers['x-csrf-token'] = csrf
  }
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  console.log('[api] request]', opts.method || 'GET', url)

  try {
    const res = await fetch(url, { ...opts, headers, credentials: 'include', signal: controller.signal })
    if (res.status === 401 && allowRetry) {
      const refreshHeaders: Record<string, string> = {}
      const csrf = readCookie('csrfToken')
      if (csrf) refreshHeaders['x-csrf-token'] = csrf
      const refreshRes = await fetch(API + '/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        signal: controller.signal,
        headers: refreshHeaders,
      })
      if (refreshRes.ok) {
        return call(path, opts, false)
      }
    }
    const payload = await parseResponse(res)
    if (!res.ok) {
      if (payload && typeof payload === 'object' && payload !== null) {
        return { __error: true, status: res.status, ...(payload as Record<string, unknown>) }
      }
      return { __error: true, status: res.status, message: String(payload || `Request failed (${res.status})`) }
    }
    return payload as T
  } catch (err) {
    const error = err as { name?: string; message?: string }
    const isTimeout = error?.name === 'AbortError'
    const message = isTimeout ? 'Request timed out' : (error?.message || 'Network error')
    console.error('[api] network error', message)
    return { __error: true, message }
  } finally {
    clearTimeout(timeoutId)
  }
}

export const isApiError = (
  value: unknown
): value is ApiError =>
  Boolean(
    value &&
      typeof value === "object" &&
      "__error" in value &&
      (value as { __error?: boolean }).__error === true
  )

export const ensureOk = <T = unknown>(value: ApiResult<T>) => {
  if (isApiError(value)) {
    throw new Error(value.message || "Request failed")
  }
  return value as T
}

export default call
