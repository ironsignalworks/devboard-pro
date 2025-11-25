import React, { createContext, useState, useContext } from 'react'

const AuthContext = createContext<any>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const login = (t: string) => { setToken(t); localStorage.setItem('token', t) }
  const logout = () => { setToken(null); localStorage.removeItem('token') }
  return <AuthContext.Provider value={{ token, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
