export interface Coordinates {
  latitude: number
  longitude: number
}

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''

export async function geocodeAddress(
  address: string
): Promise<Coordinates | null> {
  if (!address.trim()) return null

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
