import React, { createContext, useState, useContext, useEffect } from 'react'
import { login as apiLogin } from '../api/auth'

const AuthContext = createContext<any>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const login = (t: string) => { setToken(t); localStorage.setItem('token', t) }
  const logout = () => { setToken(null); localStorage.removeItem('token') }

  // Dev-only: attempt to auto-login the demo user if no token is present so the app
  // will call /api/auth/me and load demo data during development.
  useEffect(() => {
    let cancelled = false
    const tryDemoLogin = async () => {
      if (token) return
      // Vite exposes import.meta.env.DEV for dev mode
      // Only run auto-login in development to avoid surprising behavior in production
      if (!import.meta.env.DEV) return

      try {
        console.log('[auth] attempting demo auto-login')
        const res: any = await apiLogin('demo@devboard.local', 'password123')
        if (cancelled) return
        if (res?.token) {
          login(res.token)
        } else {
          console.warn('[auth] demo login did not return token', res)
        }
      } catch (err) {
        console.error('[auth] demo auto-login failed', err)
      }
    }
    tryDemoLogin()
    return () => { cancelled = true }
  }, [token])

  return <AuthContext.Provider value={{ token, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
