// Distância em km entre dois pontos (fórmula de Haversine).
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// Ordena do mais perto pro mais longe a partir da origem.
// Itens sem coordenada vão pro fim. Sem origem, mantém a ordem.
export function sortByProximity<
  T extends { latitude: number | null; longitude: number | null }
>(items: T[], origin: { latitude: number; longitude: number } | null): T[] {
  if (!origin) return items
  return items
    .map((it) => ({
      it,
      d:
        it.latitude != null && it.longitude != null
          ? haversineKm(origin.latitude, origin.longitude, it.latitude, it.longitude)
          : Infinity,
    }))
    .sort((a, b) => a.d - b.d)
    .map((x) => x.it)
}
