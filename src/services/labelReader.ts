import { supabase } from './supabase'

// Dados que a IA tenta extrair da foto da etiqueta.
export interface LabelData {
  recipient_name: string
  cep: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  phone: string
}

// Envia a foto (base64) para a edge function read-label, que chama o Claude.
// Retorna os campos extraídos, ou null se algo falhar (a tela segue manual).
export async function readLabel(
  imageBase64: string
): Promise<Partial<LabelData> | null> {
  try {
    const { data, error } = await supabase.functions.invoke('read-label', {
      body: { image_base64: imageBase64, media_type: 'image/jpeg' },
    })
    if (error) return null
    if (!data || (data as { error?: string }).error) return null
    return data as Partial<LabelData>
  } catch {
    return null
  }
}
