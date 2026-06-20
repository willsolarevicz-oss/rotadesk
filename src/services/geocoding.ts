export interface Coordinates {
  latitude: number
  longitude: number
}

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''

// Geocoder gratuito (OpenStreetMap / Nominatim). Sem chave.
// Política de uso: 1 req/s e User-Agent identificável.
async function geocodeNominatim(address: string): Promise<Coordinates | null> {
  const url =
    'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=' +
    encodeURIComponent(address)
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Rotadesk/1.0 (app de entregas)',
        'Accept-Language': 'pt-BR',
      },
    })
    const data = await response.json()
    if (!Array.isArray(data) || data.length === 0) return null
    const latitude = parseFloat(data[0].lat)
    const longitude = parseFloat(data[0].lon)
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null
    return { latitude, longitude }
  } catch {
    return null
  }
}

// Geocoder do Google (opcional, só quando há chave configurada).
async function geocodeGoogle(address: string): Promise<Coordinates | null> {
  const url =
    'https://maps.googleapis.com/maps/api/geocode/json' +
    `?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`
  try {
    const response = await fetch(url)
    const data = await response.json()
    if (data.status !== 'OK' || !data.results?.length) return null
    const { lat, lng } = data.results[0].geometry.location
    return { latitude: lat, longitude: lng }
  } catch {
    return null
  }
}

// Transforma endereço em coordenadas. Tenta o gratuito primeiro;
// cai pro Google só se houver chave e o gratuito falhar.
export async function geocodeAddress(
  address: string
): Promise<Coordinates | null> {
  if (!address.trim()) return null

  const free = await geocodeNominatim(address)
  if (free) return free

  return geocodeGoogle(address)
}
