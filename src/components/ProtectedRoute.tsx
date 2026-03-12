import React from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }){
  const { user, loading, authError, clearAuthError } = useAuth()
  if (loading && !user) return <div className="p-6">Loading...</div>
  if (authError) {
    return (
      <div className="p-6 text-red-600">
        Authentication error: {authError}. Please{" "}
        <Link
          to="/login"
          onClick={() => {
            clearAuthError()
            localStorage.removeItem('user')
          }}
          className="underline"
        >
          login
        </Link>{" "}
        again.
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
