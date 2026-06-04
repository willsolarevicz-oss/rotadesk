import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'

export default function HomeScreen() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    // RootNavigator redireciona para AuthStack via onAuthStateChange
  }

  const displayName = session?.user.phone ?? 'Entregador'

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá,</Text>
          <Text style={styles.name}>{displayName}</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.signOut}>Sair</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Pendentes</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#22c55e' }]}>0</Text>
          <Text style={styles.statLabel}>Entregues</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#f59e0b' }]}>0</Text>
          <Text style={styles.statLabel}>Não entregues</Text>
        </View>
      </View>

      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Nenhum pacote escaneado</Text>
        <Text style={styles.emptySubtitle}>
          Escaneie os pacotes do dia para gerar sua rota
        </Text>
      </View>

      <TouchableOpacity style={styles.ctaButton}>
        <Text style={styles.ctaText}>Escanear Pacotes</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  greeting: { fontSize: 12, color: '#64748b' },
  name: { fontSize: 18, fontWeight: '700' },
  signOut: { fontSize: 14, color: '#64748b' },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  divider: { width: 1, height: 40, backgroundColor: '#e2e8f0' },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: '#64748b', textAlign: 'center' },
  ctaButton: {
    margin: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})
