import { computeStats } from './stats'

describe('computeStats', () => {
  it('conta pacotes por status', () => {
    const result = computeStats([
      { status: 'pending' },
      { status: 'pending' },
      { status: 'delivered' },
      { status: 'failed' },
    ])
    expect(result).toEqual({ pending: 2, delivered: 1, failed: 1 })
  })

  it('retorna zeros para lista vazia', () => {
    expect(computeStats([])).toEqual({ pending: 0, delivered: 0, failed: 0 })
  })
})
