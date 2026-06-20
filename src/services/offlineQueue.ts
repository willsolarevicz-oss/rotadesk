import AsyncStorage from '@react-native-async-storage/async-storage'
import { updatePackageStatus } from './packages'
import type { PackageStatus } from '../types/package'

const KEY = 'rotadesk.queue.status'

export type QueuedStatus = { id: string; status: PackageStatus }

export async function getQueue(): Promise<QueuedStatus[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as QueuedStatus[]) : []
  } catch {
    return []
  }
}

async function setQueue(queue: QueuedStatus[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(queue))
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(KEY)
}

// Guarda uma mudança de status pra sincronizar depois.
// Só mantém a última mudança de cada pacote.
export async function enqueueStatus(
  id: string,
  status: PackageStatus
): Promise<void> {
  const queue = (await getQueue()).filter((q) => q.id !== id)
  queue.push({ id, status })
  await setQueue(queue)
}

// Reenvia a fila pro servidor, na ordem. Para na primeira falha
// (provavelmente ainda sem rede) e guarda o que sobrou.
// Devolve quantos itens sincronizou.
export async function flushQueue(): Promise<number> {
  const queue = await getQueue()
  if (queue.length === 0) return 0

  let i = 0
  for (; i < queue.length; i++) {
    try {
      await updatePackageStatus(queue[i].id, queue[i].status)
    } catch {
      break
    }
  }
  await setQueue(queue.slice(i))
  return i
}
