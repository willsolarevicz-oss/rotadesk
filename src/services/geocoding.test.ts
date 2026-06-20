import { geocodeAddress } from './geocoding'

describe('geocodeAddress', () => {
  const originalFetch = global.fetch
  afterEach(() => {
    global.fetch = originalFetch
  })

  it('usa o geocoder gratuito (Nominatim) quando responde', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => [{ lat: '-23.55', lon: '-46.63' }],
    }) as unknown as typeof fetch

    const result = await geocodeAddress('Av. Paulista, 1000, São Paulo')
    expect(result).toEqual({ latitude: -23.55, longitude: -46.63 })
  })

  it('retorna coordenadas quando a API responde OK', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        status: 'OK',
        results: [{ geometry: { location: { lat: -23.56, lng: -46.64 } } }],
      }),
    }) as unknown as typeof fetch

    const result = await geocodeAddress('Av. Paulista, 1000, São Paulo')
    expect(result).toEqual({ latitude: -23.56, longitude: -46.64 })
  })

  it('retorna null quando não há resultados', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ status: 'ZERO_RESULTS', results: [] }),
    }) as unknown as typeof fetch

    const result = await geocodeAddress('endereço inexistente')
    expect(result).toBeNull()
  })

  it('retorna null em caso de erro de rede', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network')) as unknown as typeof fetch
    const result = await geocodeAddress('qualquer')
    expect(result).toBeNull()
  })
})
