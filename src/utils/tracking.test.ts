import { isTrackingCode } from './tracking'

describe('isTrackingCode', () => {
  it('aceita código de rastreio numérico (Mercado Livre/logística)', () => {
    expect(isTrackingCode('888002107047285')).toBe(true)
  })

  it('aceita código no padrão Correios', () => {
    expect(isTrackingCode('BR123456789BR')).toBe(true)
  })

  it('rejeita JSON vindo de QR', () => {
    expect(
      isTrackingCode('{"id":"47295231945","t":"lm","tn":"888002107047285"}')
    ).toBe(false)
  })

  it('rejeita leitura curta demais', () => {
    expect(isTrackingCode('12345')).toBe(false)
  })

  it('rejeita vazio ou só espaços', () => {
    expect(isTrackingCode('   ')).toBe(false)
  })
})
