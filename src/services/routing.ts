import { sortByProximity } from '../utils/distance'

export type Located = { latitude: number; longitude: number }

// Servidor público e gratuito do OSRM (Open Source Routing Machine).
const OSRM_URL = 'https://router.project-osrm.org'

// Reordena as paradas pela posição de cada uma no trajeto otimizado.
// tripIndexes[k] = ordem da parada stops[k] no trajeto.
export function orderByTrip<T>(stops: T[], tripIndexes: number[]): T[] {
  return stops
    .map((stop, k) => ({ stop, order: tripIndexes[k] ?? Infinity }))
    .sort((a, b) => a.order - b.order)
    .map((x) => x.stop)
}

// Calcula a melhor ordem de visita saindo da posição do entregador.
// Usa o serviço Trip do OSRM (resolve o caixeiro-viajante). Se o OSRM
// estiver fora do ar ou sem rede, cai pra ordenação por distância em
// linha reta (haversine).
export async function optimizeRoute<T extends Located>(
  origin: Located,
  stops: T[]
): Promise<T[]> {
  if (stops.length <= 1) return stops

  const coords = [origin, ...stops]
    .map((c) => `${c.longitude},${c.latitude}`)
    .join(';')
  const url = `${OSRM_URL}/trip/v1/driving/${coords}?source=first&roundtrip=false`

  try {
    const response = await fetch(url)
    const data = await response.json()
    if (data.code !== 'Ok' || !Array.isArray(data.waypoints)) {
      return sortByProximity(stops, origin)
    }
    // waypoints[0] é a origem; o resto corresponde às paradas, na ordem enviada.
    const tripIndexes = data.waypoints
      .slice(1)
      .map((w: { waypoint_index: number }) => w.waypoint_index)
    return orderByTrip(stops, tripIndexes)
  } catch {
    return sortByProximity(stops, origin)
  }
}
