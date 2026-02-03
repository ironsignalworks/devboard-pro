import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }){
  const { user, loading, authError, clearAuthError } = useAuth() as any
  if (loading) return <div className="p-6">Loading...</div>
  if (authError) {
    return (
      <div className="p-6 text-red-600">
        Authentication error: {authError}. Please <a href="#" onClick={() => { clearAuthError(); localStorage.removeItem('user'); window.location.href = '/login' }}>login</a> again.
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
