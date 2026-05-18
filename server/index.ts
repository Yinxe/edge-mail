import { Hono } from 'hono'

type Bindings = Env

const app = new Hono<{ Bindings: Bindings }>()

app.get('/api/', (c) => {
  return c.json({ name: 'Cloudflare' })
})

export default app
