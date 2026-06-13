import type { PackageStatus } from '../types/package'

export interface PackageStats {
  pending: number
  delivered: number
  failed: number
}

export function computeStats(
  packages: { status: PackageStatus }[]
): PackageStats {
  return packages.reduce(
    (acc, pkg) => {
      acc[pkg.status] += 1
      return acc
    },
    { pending: 0, delivered: 0, failed: 0 } as PackageStats
  )
}
