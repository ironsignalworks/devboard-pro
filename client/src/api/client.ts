const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export const call = async (path: string, opts: RequestInit = {}) => {
  const token = localStorage.getItem('token')
  const headers: any = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(API + path, { ...opts, headers })
  if (res.status === 204) return null
  try { return await res.json() } catch { return null }
}

export default call
