import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { CompositeNavigationProp } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'
import { listPackages } from '../services/packages'
import { computeStats, type PackageStats } from '../utils/stats'
import type { Package } from '../types/package'
import type {
  AppTabsParamList,
  AppStackParamList,
} from '../types/navigation'

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabsParamList, 'Home'>,
  NativeStackNavigationProp<AppStackParamList>
>

export default function HomeScreen() {
  const navigation = useNavigation<Nav>()
  const [session, setSession] = useState<Session | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [stats, setStats] = useState<PackageStats>({
    pending: 0,
    delivered: 0,
    failed: 0,
  })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    setSession(session)
    try {
      const all = await listPackages('all')
      setPackages(all)
      setStats(computeStats(all))
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  const pending = packages.filter((p) => p.status === 'pending')
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
          <Text style={styles.statNumber}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pendentes</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#22c55e' }]}>
            {stats.delivered}
          </Text>
          <Text style={styles.statLabel}>Entregues</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#ef4444' }]}>
            {stats.failed}
          </Text>
          <Text style={styles.statLabel}>Não entregues</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color="#3b82f6" />
      ) : pending.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Nenhum pacote pendente</Text>
          <Text style={styles.emptySubtitle}>
            Escaneie os pacotes do dia para gerar sua rota
          </Text>
        </View>
      ) : (
        <FlatList
          data={pending}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() =>
                navigation.navigate('PackageDetail', { packageId: item.id })
              }
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>
                  {item.recipient_name || 'Sem nome'}
                </Text>
                <Text style={styles.itemAddress} numberOfLines={1}>
                  {item.address || 'Sem endereço'}
                </Text>
                {item.route ? (
                  <Text style={styles.itemRoute}>{item.route}</Text>
                ) : null}
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.ctaButton}
        onPress={() => navigation.navigate('Scanner')}
      >
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
  list: { padding: 16 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  itemName: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  itemAddress: { fontSize: 13, color: '#64748b', marginTop: 2 },
  itemRoute: { fontSize: 12, color: '#3b82f6', marginTop: 2 },
  chevron: { fontSize: 24, color: '#cbd5e1' },
  ctaButton: {
    margin: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})
