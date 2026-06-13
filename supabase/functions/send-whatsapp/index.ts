import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ZAPI_INSTANCE_ID = Deno.env.get('ZAPI_INSTANCE_ID') ?? ''
const ZAPI_TOKEN = Deno.env.get('ZAPI_TOKEN') ?? ''
const ZAPI_CLIENT_TOKEN = Deno.env.get('ZAPI_CLIENT_TOKEN') ?? ''

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { phone, message } = await req.json()

  if (!phone || !message) {
    return new Response(JSON.stringify({ error: 'phone e message são obrigatórios' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const digits = phone.replace(/\D/g, '')
  const formatted = digits.startsWith('55') ? digits : `55${digits}`

  const url = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/send-text`

  console.log('Enviando para:', formatted)
  console.log('URL:', url)

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (ZAPI_CLIENT_TOKEN) headers['Client-Token'] = ZAPI_CLIENT_TOKEN

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      phone: formatted,
      message,
    }),
  })

  const data = await response.json()
  console.log('Z-API status:', response.status)
  console.log('Z-API response:', JSON.stringify(data))

  return new Response(JSON.stringify(data), {
    status: response.ok ? 200 : 500,
    headers: { 'Content-Type': 'application/json' },
  })
})
