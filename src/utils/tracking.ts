// Valida se uma leitura de código de barras parece um código de rastreio
// de verdade, e não JSON vindo de um QR ou lixo de leitura.
export function isTrackingCode(value: string): boolean {
  const v = value.trim()
  if (v.length < 6) return false
  // QR de logística costuma trazer JSON, com chaves/colchetes/aspas
  if (/[{}\[\]"]/.test(v)) return false
  // precisa sobrar uma sequência alfanumérica decente após tirar separadores
  if (!/[A-Za-z0-9]{6,}/.test(v.replace(/[\s\-.]/g, ''))) return false
  return true
}
