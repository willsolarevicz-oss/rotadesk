import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Package } from '../types/package'

const KEY = 'rotadesk.cache.packages'

// Guarda a última lista carregada pra mostrar mesmo sem internet.
export async function cachePackages(list: Package[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // cache é melhor-esforço; ignora falha
  }
}

export async function getCachedPackages(): Promise<Package[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Package[]) : []
  } catch {
    return []
  }
}
