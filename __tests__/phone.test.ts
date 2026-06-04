import { formatPhone } from '../src/utils/phone'

describe('formatPhone', () => {
  it('adiciona +55 quando não tem prefixo', () => {
    expect(formatPhone('11999999999')).toBe('+5511999999999')
  })

  it('remove caracteres não numéricos antes de adicionar +55', () => {
    expect(formatPhone('(11) 99999-9999')).toBe('+5511999999999')
  })

  it('mantém o + quando já está no formato E.164', () => {
    expect(formatPhone('+5511999999999')).toBe('+5511999999999')
  })

  it('não duplica +55 se o usuário digitar', () => {
    expect(formatPhone('+55 (11) 99999-9999')).toBe('+5511999999999')
  })
})
