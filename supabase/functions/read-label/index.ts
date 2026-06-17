import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Lê uma foto de etiqueta de encomenda e extrai os dados do destinatário
// usando o Claude Haiku (visão). A chave da API fica como secret no Supabase.
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? ''
const MODEL = 'claude-haiku-4-5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const SYSTEM = `Você lê etiquetas de encomendas brasileiras e extrai os dados do DESTINATÁRIO (a pessoa que vai RECEBER o pacote, NÃO o remetente).

Responda APENAS com um JSON válido, sem nenhum texto antes ou depois e sem crases, exatamente neste formato:
{"recipient_name":"","cep":"","street":"","number":"","complement":"","neighborhood":"","city":"","state":"","phone":""}

Regras:
- Use string vazia "" para qualquer campo que você não encontre com certeza.
- recipient_name: nome completo do destinatário.
- cep: apenas os 8 dígitos, sem hífen.
- street: SÓ o nome da rua/avenida (sem o número e sem o complemento).
- number: SÓ o número do imóvel na rua (ex.: 245, 1000). Não confunda com o CEP nem com o número do apartamento.
- complement: complemento ou referência, como "Apto 52", "Bloco B", "Casa 2", "Fundos" ou um ponto de referência. Se não houver, "".
- state: a sigla da UF (ex.: SP).
- Leia o endereço com atenção e não troque o nome da rua pelo número.
- Não invente dados. Em caso de dúvida entre remetente e destinatário, prefira o bloco do DESTINATÁRIO.`

function json(obj: unknown, status: number) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Método não permitido' }, 405)
  }
  if (!ANTHROPIC_API_KEY) {
    return json({ error: 'ANTHROPIC_API_KEY não configurada' }, 500)
  }

  const { image_base64, media_type } = await req.json()
  if (!image_base64) {
    return json({ error: 'image_base64 é obrigatório' }, 400)
  }

  const body = {
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: media_type ?? 'image/jpeg',
              data: image_base64,
            },
          },
          {
            type: 'text',
            text: 'Extraia os dados do destinatário desta etiqueta.',
          },
        ],
      },
    ],
  }

  let data: any
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    data = await resp.json()
    if (!resp.ok) {
      return json(
        { error: data?.error?.message ?? 'Erro na API do Claude' },
        500
      )
    }
  } catch (e) {
    return json({ error: 'Falha ao chamar a API: ' + String(e) }, 500)
  }

  // Extrai o texto do primeiro bloco e tenta parsear como JSON
  const textBlock = (data.content ?? []).find(
    (b: any) => b.type === 'text'
  )
  let text: string = textBlock?.text ?? '{}'
  text = text
    .trim()
    .replace(/^```json/i, '')
    .replace(/^```/, '')
    .replace(/```$/, '')
    .trim()

  try {
    const parsed = JSON.parse(text)
    return json(parsed, 200)
  } catch {
    return json({ error: 'Resposta da IA não veio em JSON', raw: text }, 200)
  }
})
