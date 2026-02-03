import { describe, test, expect, beforeAll } from 'vitest'
import request from 'supertest'
import express from 'express'
import authRoutes from '../src/routes/auth.js'

let app

beforeAll(() => {
  app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)
})

describe('Auth routes (basic)', ()=>{
  test('POST /api/auth/login without body returns 400', async ()=>{
    const res = await request(app).post('/api/auth/login').send({})
    expect(res.status).toBe(400)
  })

  test('POST /api/auth/register without fields returns 400', async ()=>{
    const res = await request(app).post('/api/auth/register').send({})
    expect(res.status).toBe(400)
  })
})
