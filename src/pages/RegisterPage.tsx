import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { register as apiRegister } from '../api/auth'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await apiRegister(email, password, name)
    if (res?.token) {
      localStorage.setItem('token', res.token)
      navigate('/')
    } else {
      alert(res?.message || 'Register failed')
    }
  }

  return (
    <div className="p-6">
      <h2>Register</h2>
      <form onSubmit={handleSubmit} className="space-y-2">
        <div>
          <label>Name</label>
          <input value={name} onChange={e=>setName(e.target.value)} className="border p-2" />
        </div>
        <div>
          <label>Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} className="border p-2" />
        </div>
        <div>
          <label>Password</label>
          <input value={password} onChange={e=>setPassword(e.target.value)} className="border p-2" />
        </div>
        <button className="bg-primary text-white px-4 py-2 rounded" type="submit">Register</button>
      </form>
    </div>
  )
}
