export type PackageStatus = 'pending' | 'delivered' | 'failed'

export interface Package {
  id: string
  user_id: string
  tracking_code: string | null
  recipient_name: string | null
  recipient_phone: string | null
  address: string | null
  complement: string | null
  route: string | null
  latitude: number | null
  longitude: number | null
  status: PackageStatus
  notes: string | null
  photo_url: string | null
  created_at: string
  delivered_at: string | null
}

// Campos preenchidos no cadastro (o resto vem do banco/sessão)
export interface PackageInput {
  tracking_code: string
  recipient_name: string
  recipient_phone: string
  address: string
  complement: string
  route: string
  notes: string
  latitude: number | null
  longitude: number | null
}
