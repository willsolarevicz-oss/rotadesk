import { lookupCep } from './cep'

describe('lookupCep', () => {
  const originalFetch = global.fetch
  afterEach(() => {
    global.fetch = originalFetch
  })

  it('retorna o endereço para um CEP válido', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        logradouro: 'Praça da Sé',
        bairro: 'Sé',
        localidade: 'São Paulo',
        uf: 'SP',
      }),
    }) as unknown as typeof fetch

    const result = await lookupCep('01001-000')
    expect(result).toEqual({
      street: 'Praça da Sé',
      neighborhood: 'Sé',
      city: 'São Paulo',
      state: 'SP',
    })
  })

  it('retorna null quando o CEP não existe (erro do ViaCEP)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ erro: true }),
    }) as unknown as typeof fetch

    expect(await lookupCep('00000-000')).toBeNull()
  })

  it('não chama a rede e retorna null para CEP com tamanho inválido', async () => {
    const fetchMock = jest.fn()
    global.fetch = fetchMock as unknown as typeof fetch

    expect(await lookupCep('123')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('retorna null em caso de erro de rede', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('network')) as unknown as typeof fetch
    expect(await lookupCep('01001-000')).toBeNull()
  })
})
