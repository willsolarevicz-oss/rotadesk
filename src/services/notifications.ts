import { supabase } from './supabase'

export async function sendWhatsApp(
  phone: string,
  message: string
): Promise<void> {
  const { error } = await supabase.functions.invoke('send-whatsapp', {
    body: { phone, message },
  })
  if (error) throw error
}
