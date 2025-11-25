import call from './client'

export const login = (email: string, password: string) => call('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
export const register = (email: string, password: string, name: string) => call('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) })
