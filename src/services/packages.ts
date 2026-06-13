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
