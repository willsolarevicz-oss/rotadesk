import { buildNavigationUrl } from './maps'

describe('buildNavigationUrl', () => {
  it('monta URL do Google Maps com coordenadas', () => {
    expect(buildNavigationUrl(-23.55, -46.63)).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=-23.55,-46.63'
    )
  })
})
