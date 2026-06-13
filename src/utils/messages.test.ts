import { buildWhatsAppMessage } from './messages'

describe('buildWhatsAppMessage', () => {
  it('monta mensagem de "a caminho" com o nome', () => {
    expect(buildWhatsAppMessage('Maria', 'on_the_way')).toBe(
      'Olá Maria! Seu pacote está a caminho e chega em breve. 🚚📦'
    )
  })

  it('monta mensagem de "entregue"', () => {
    expect(buildWhatsAppMessage('João', 'delivered')).toBe(
      'Olá João! Seu pacote foi entregue. Obrigado! ✅📦'
    )
  })

  it('usa saudação genérica quando não há nome', () => {
    expect(buildWhatsAppMessage('', 'on_the_way')).toBe(
      'Olá! Seu pacote está a caminho e chega em breve. 🚚📦'
    )
  })
})
