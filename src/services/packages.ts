import { decode } from 'base64-arraybuffer'
import { supabase } from './supabase'
import type { Package, PackageInput, PackageStatus } from '../types/package'

export async function listPackages(
  filter?: PackageStatus | 'all'
): Promise<Package[]> {
  let query = supabase
    .from('packages')
    .select('*')
    .order('created_at', { ascending: false })

  if (filter && filter !== 'all') {
    query = query.eq('status', filter)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Package[]
}

export async function getPackage(id: string): Promise<Package | null> {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data as Package
}

export async function createPackage(input: PackageInput): Promise<Package> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Sessão expirada. Faça login novamente.')

  const { data, error } = await supabase
    .from('packages')
    .insert({ ...input, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return data as Package
}

export async function updatePackage(
  id: string,
  input: PackageInput
): Promise<Package> {
  const { data, error } = await supabase
    .from('packages')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Package
}

export async function deletePackage(id: string): Promise<void> {
  const { error } = await supabase.from('packages').delete().eq('id', id)
  if (error) throw error
}

// Envia a foto (base64) pro Storage e devolve a URL pública.
export async function uploadProofPhoto(
  packageId: string,
  base64: string
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Sessão expirada. Faça login novamente.')

  const path = `${user.id}/${packageId}-${Date.now()}.jpg`
  const { error } = await supabase.storage
    .from('proofs')
    .upload(path, decode(base64), { contentType: 'image/jpeg', upsert: true })
  if (error) throw error

  const { data } = supabase.storage.from('proofs').getPublicUrl(path)
  return data.publicUrl
}

// Marca como entregue já guardando a foto de comprovação.
export async function markDeliveredWithProof(
  id: string,
  photoUrl: string
): Promise<Package> {
  const { data, error } = await supabase
    .from('packages')
    .update({
      status: 'delivered',
      delivered_at: new Date().toISOString(),
      photo_url: photoUrl,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Package
}

export async function updatePackageStatus(
  id: string,
  status: PackageStatus
): Promise<Package> {
  const delivered_at =
    status === 'pending' ? null : new Date().toISOString()

  const { data, error } = await supabase
    .from('packages')
    .update({ status, delivered_at })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Package
}
