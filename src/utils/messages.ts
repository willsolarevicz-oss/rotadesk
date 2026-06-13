export type WhatsAppMessageKind = 'on_the_way' | 'delivered'

export function buildWhatsAppMessage(
  recipientName: string,
  kind: WhatsAppMessageKind
): string {
  const greeting = recipientName.trim()
    ? `Olá ${recipientName.trim()}!`
    : 'Olá!'

  const body =
    kind === 'on_the_way'
      ? 'Seu pacote está a caminho e chega em breve. 🚚📦'
      : 'Seu pacote foi entregue. Obrigado! ✅📦'

  return `${greeting} ${body}`
}
