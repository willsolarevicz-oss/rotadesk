import { haversineKm, sortByProximity } from './distance'

describe('haversineKm', () => {
  it('mede distância aproximada (São Paulo - Campinas ~ 90 km)', () => {
    const d = haversineKm(-23.55, -46.63, -22.9, -47.06)
    expect(d).toBeGreaterThan(70)
    expect(d).toBeLessThan(110)
  })
})

describe('sortByProximity', () => {
  const origin = { latitude: 0, longitude: 0 }

  it('ordena do mais perto pro mais longe', () => {
    const items = [
      { id: 'far', latitude: 0, longitude: 5 },
      { id: 'near', latitude: 0, longitude: 1 },
    ]
    expect(sortByProximity(items, origin).map((i) => i.id)).toEqual([
      'near',
      'far',
    ])
  })

  it('joga itens sem coordenada pro fim', () => {
    const items = [
      { id: 'sem', latitude: null, longitude: null },
      { id: 'perto', latitude: 0, longitude: 1 },
    ]
    expect(sortByProximity(items, origin).map((i) => i.id)).toEqual([
      'perto',
      'sem',
    ])
  })

  it('sem origem, mantém a ordem', () => {
    const items = [{ id: 'a', latitude: 0, longitude: 1 }]
    expect(sortByProximity(items, null).map((i) => i.id)).toEqual(['a'])
  })
})
