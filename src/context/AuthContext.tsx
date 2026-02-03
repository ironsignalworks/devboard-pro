import React, { createContext, useState, useContext, useEffect } from 'react'
import call from '../api/client'

type AuthContextType = {
  user: any | null
  loading: boolean
  authError: string | null
  login: (user: any) => void
  logout: () => Promise<void>
  clearAuthError: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(() => {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [authError, setAuthError] = useState<string | null>(null)

  const login = (u: any) => {
    setUser(u)
    // ensure loading is false after manual login so ProtectedRoute won't wait
    setLoading(false)
    setAuthError(null)
    localStorage.setItem('user', JSON.stringify(u))
  }
  const logout = async () => {
    try {
      await call('/api/auth/logout', { method: 'POST' })
    } catch (err) {
      console.error('[auth] logout error', err)
    }
    setUser(null)
    localStorage.removeItem('user')
  }

  const clearAuthError = () => setAuthError(null)

  useEffect(() => {
    let cancelled = false
    const validate = async () => {
      try {
        setLoading(true)
        const res = await call('/api/auth/me')
        console.log('[auth] /me response', res)
        if (!cancelled) {
          if (res?.user) {
            setUser(res.user)
            // ensure localStorage user sync
            localStorage.setItem('user', JSON.stringify(res.user))
          } else {
            // invalid token
            logout()
          }
        }
      } catch (err: any) {
        console.error('[auth] /me error', err)
        if (!cancelled) {
          logout()
          setAuthError(err?.message || 'Auth validation failed')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    validate()
    return () => { cancelled = true }
  }, [])

  return <AuthContext.Provider value={{ user, loading, authError, login, logout, clearAuthError }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
