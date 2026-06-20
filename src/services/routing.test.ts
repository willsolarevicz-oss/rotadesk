import { orderByTrip, optimizeRoute } from './routing'

type Stop = { id: string; latitude: number; longitude: number }

describe('orderByTrip', () => {
  it('reordena as paradas pela ordem do trajeto', () => {
    const stops: Stop[] = [
      { id: 'a', latitude: 0, longitude: 2 },
      { id: 'b', latitude: 0, longitude: 1 },
    ]
    // a é a 2ª parada do trajeto, b é a 1ª
    const ordered = orderByTrip(stops, [2, 1])
    expect(ordered.map((s) => s.id)).toEqual(['b', 'a'])
  })
})

describe('optimizeRoute', () => {
  const origin = { latitude: 0, longitude: 0 }
  const originalFetch = global.fetch
  afterEach(() => {
    global.fetch = originalFetch
  })

  it('devolve a lista sem mexer quando há 1 parada ou menos', async () => {
    const stops: Stop[] = [{ id: 'a', latitude: 0, longitude: 1 }]
    expect(await optimizeRoute(origin, stops)).toEqual(stops)
  })

  it('usa a ordem ótima do OSRM', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        code: 'Ok',
        waypoints: [
          { waypoint_index: 0 }, // origem
          { waypoint_index: 2 }, // parada a
          { waypoint_index: 1 }, // parada b
        ],
      }),
    }) as unknown as typeof fetch

    const stops: Stop[] = [
      { id: 'a', latitude: 0, longitude: 9 },
      { id: 'b', latitude: 0, longitude: 1 },
    ]
    const ordered = await optimizeRoute(origin, stops)
    expect(ordered.map((s) => s.id)).toEqual(['b', 'a'])
  })

  it('cai pra proximidade em linha reta quando o OSRM falha', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('sem rede')) as unknown as typeof fetch

    const stops: Stop[] = [
      { id: 'longe', latitude: 0, longitude: 9 },
      { id: 'perto', latitude: 0, longitude: 1 },
    ]
    const ordered = await optimizeRoute(origin, stops)
    expect(ordered.map((s) => s.id)).toEqual(['perto', 'longe'])
  })
})
