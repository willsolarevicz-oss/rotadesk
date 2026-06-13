import { formatPhone } from './phone'

describe('formatPhone', () => {
  it('adiciona +55 e remove não-dígitos', () => {
    expect(formatPhone('(11) 99999-9999')).toBe('+5511999999999')
  })

  it('mantém o + quando já internacional', () => {
    expect(formatPhone('+1 555 123 4567')).toBe('+15551234567')
  })
})
