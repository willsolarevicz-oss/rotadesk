import { useEffect, useState, useCallback } from 'react'
import { AppState } from 'react-native'
import * as Network from 'expo-network'

// Diz se o aparelho está online. Checa ao montar, quando o app volta
// pro primeiro plano e a cada 8s. Em caso de dúvida, assume online.
export function useOnline(): boolean {
  const [online, setOnline] = useState(true)

  const check = useCallback(async () => {
    try {
      const state = await Network.getNetworkStateAsync()
      setOnline(Boolean(state.isConnected) && state.isInternetReachable !== false)
    } catch {
      setOnline(true)
    }
  }, [])

  useEffect(() => {
    check()
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') check()
    })
    const id = setInterval(check, 8000)
    return () => {
      sub.remove()
      clearInterval(id)
    }
  }, [check])

  return online
}
