import request from 'supertest'
import express from 'express'
import authRoutes from '../../server/src/routes/auth.js'
import connectDB from '../../server/src/config/db.js'

let app

beforeAll(async () => {
  await connectDB()
  app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)
})

describe('Auth routes', ()=>{
  test('login with invalid credentials returns 400', async ()=>{
    const res = await request(app).post('/api/auth/login').send({ email: 'nope@x', password: 'x' })
    expect(res.status).toBe(400)
  })
})
