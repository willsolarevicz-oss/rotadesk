import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { CompositeNavigationProp } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type {
  AppTabsParamList,
  AppStackParamList,
} from '../types/navigation'
import type { Package, PackageStatus } from '../types/package'
import { listPackages } from '../services/packages'

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabsParamList, 'History'>,
  NativeStackNavigationProp<AppStackParamList>
>

type Filter = 'all' | PackageStatus

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'delivered', label: 'Entregues' },
  { key: 'failed', label: 'Falhas' },
]

const STATUS_COLOR: Record<PackageStatus, string> = {
  pending: '#f59e0b',
  delivered: '#22c55e',
  failed: '#ef4444',
}

export default function HistoryScreen() {
  const navigation = useNavigation<Nav>()
  const [filter, setFilter] = useState<Filter>('all')
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setPackages(await listPackages(filter))
    } finally {
      setLoading(false)
    }
  }, [filter])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, filter === f.key && styles.chipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[
                styles.chipText,
                filter === f.key && styles.chipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color="#3b82f6" />
      ) : (
        <FlatList
          data={packages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            packages.length === 0 ? styles.emptyWrap : styles.list
          }
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhum pacote nesta categoria.</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() =>
                navigation.navigate('PackageDetail', { packageId: item.id })
              }
            >
              <View
                style={[
                  styles.dot,
                  { backgroundColor: STATUS_COLOR[item.status] },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>
                  {item.recipient_name || 'Sem nome'}
                </Text>
                <Text style={styles.itemAddress} numberOfLines={1}>
                  {item.address || 'Sem endereço'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  filters: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  chipActive: { backgroundColor: '#3b82f6' },
  chipText: { color: '#475569', fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  list: { padding: 12 },
  emptyWrap: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#94a3b8' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  itemAddress: { fontSize: 13, color: '#64748b', marginTop: 2 },
})
