import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerUser } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res: any = await registerUser({ name, email, password })
    if (res?.user) {
      login(res.user)
      navigate('/')
    } else if (res?.requiresVerification) {
      setMessage(res?.message || 'Check your email for a verification link.')
    } else {
      alert(res?.message || 'Register failed')
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl mb-4">Register</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Name</label>
          <input value={name} onChange={e=>setName(e.target.value)} className="border p-2 w-full" />
        </div>
        <div>
          <label className="block mb-1">Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} className="border p-2 w-full" />
        </div>
        <div>
          <label className="block mb-1">Password</label>
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" className="border p-2 w-full" />
        </div>
        <button className="bg-primary text-white px-4 py-2 rounded" type="submit">Register</button>
      </form>
      {message && <div className="mt-4 text-muted-foreground text-sm">{message}</div>}
    </div>
  )
}
