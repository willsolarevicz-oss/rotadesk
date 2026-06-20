jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {}
  return {
    __esModule: true,
    default: {
      getItem: (k: string) => Promise.resolve(store[k] ?? null),
      setItem: (k: string, v: string) => {
        store[k] = v
        return Promise.resolve()
      },
      removeItem: (k: string) => {
        delete store[k]
        return Promise.resolve()
      },
    },
  }
})

jest.mock('./packages', () => ({ updatePackageStatus: jest.fn() }))

import { updatePackageStatus } from './packages'
import {
  enqueueStatus,
  getQueue,
  clearQueue,
  flushQueue,
} from './offlineQueue'

const mockUpdate = updatePackageStatus as jest.Mock

beforeEach(async () => {
  mockUpdate.mockReset()
  await clearQueue()
})

describe('offlineQueue', () => {
  it('guarda mudanças de status na fila', async () => {
    await enqueueStatus('a', 'delivered')
    const q = await getQueue()
    expect(q).toEqual([{ id: 'a', status: 'delivered' }])
  })

  it('mantém só a última mudança por pacote', async () => {
    await enqueueStatus('a', 'delivered')
    await enqueueStatus('a', 'failed')
    const q = await getQueue()
    expect(q).toEqual([{ id: 'a', status: 'failed' }])
  })

  it('sincroniza tudo quando online e limpa a fila', async () => {
    mockUpdate.mockResolvedValue({} as never)
    await enqueueStatus('a', 'delivered')
    await enqueueStatus('b', 'failed')
    const done = await flushQueue()
    expect(done).toBe(2)
    expect(mockUpdate).toHaveBeenCalledTimes(2)
    expect(await getQueue()).toEqual([])
  })

  it('para na primeira falha e mantém o que sobrou', async () => {
    mockUpdate
      .mockResolvedValueOnce({} as never)
      .mockRejectedValueOnce(new Error('sem rede'))
    await enqueueStatus('a', 'delivered')
    await enqueueStatus('b', 'failed')
    const done = await flushQueue()
    expect(done).toBe(1)
    expect(await getQueue()).toEqual([{ id: 'b', status: 'failed' }])
  })
})
