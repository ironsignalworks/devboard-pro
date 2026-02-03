import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res: any = await loginUser({ email, password })
      if (res && (res as any).__error) {
        setError(res.message || 'Network error')
      } else if (res?.user) {
        login(res.user)
        navigate('/', { replace: true })
      } else if (res?.requiresVerification) {
        setError('Please verify your email before logging in.')
      } else {
        setError(res?.message || 'Login failed')
      }
    } catch (err: any) {
      console.error('Login exception', err)
      setError(err?.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl mb-4">Login</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1" htmlFor="email">Email</label>
          <input id="email" name="email" value={email} onChange={e=>setEmail(e.target.value)} className="border p-2 w-full" />
        </div>
        <div>
          <label className="block mb-1" htmlFor="password">Password</label>
          <input id="password" name="password" value={password} onChange={e=>setPassword(e.target.value)} type="password" className="border p-2 w-full" />
        </div>
        <button className="bg-primary text-white px-4 py-2 rounded" type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>
      {error && <div className="mt-4 text-red-600">{error}</div>}
    </div>
  )
}
