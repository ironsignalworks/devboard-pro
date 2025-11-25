import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as apiLogin } from '../api/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('demo@devboard.local')
  const [password, setPassword] = useState('password123')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await apiLogin(email, password)
    if (res?.token) {
      localStorage.setItem('token', res.token)
      navigate('/')
    } else {
      alert(res?.message || 'Login failed')
    }
  }

  return (
    <div className="p-6">
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className="space-y-2">
        <div>
          <label>Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} className="border p-2" />
        </div>
        <div>
          <label>Password</label>
          <input value={password} onChange={e=>setPassword(e.target.value)} className="border p-2" />
        </div>
        <button className="bg-primary text-white px-4 py-2 rounded" type="submit">Login</button>
      </form>
    </div>
  )
}
