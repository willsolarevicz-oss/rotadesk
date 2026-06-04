export function formatPhone(phone: string): string {
  if (phone.startsWith('+')) {
    return '+' + phone.replace(/\D/g, '')
  }
  return '+55' + phone.replace(/\D/g, '')
}
