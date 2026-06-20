import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { CompositeNavigationProp } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { AppTabsParamList, AppStackParamList } from '../types/navigation'
import type { Package, PackageStatus } from '../types/package'
import { listPackages } from '../services/packages'
import { getCachedPackages } from '../services/offlineCache'
import { useOnline } from '../hooks/useOnline'
import { colors, spacing, radius, shadow, statusMeta } from '../theme'
import FadeInView from '../components/FadeInView'
import PressableScale from '../components/PressableScale'

type IoniconName = keyof typeof Ionicons.glyphMap

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

export default function HistoryScreen() {
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const [filter, setFilter] = useState<Filter>('all')
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)

  const online = useOnline()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setPackages(await listPackages(filter))
    } catch {
      const cached = await getCachedPackages()
      setPackages(
        filter === 'all' ? cached : cached.filter((p) => p.status === filter)
      )
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
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Histórico</Text>
      </View>

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <PressableScale
            key={f.key}
            style={[styles.chip, filter === f.key && styles.chipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[styles.chipText, filter === f.key && styles.chipTextActive]}
            >
              {f.label}
            </Text>
          </PressableScale>
        ))}
      </View>

      {!online ? (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={15} color="#92400e" />
          <Text style={styles.offlineText}>Sem internet. Mostrando dados salvos.</Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <FlatList
          data={packages}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            packages.length === 0 ? styles.emptyWrap : styles.list
          }
          ListEmptyComponent={
            <FadeInView style={{ alignItems: 'center' }}>
              <Ionicons name="file-tray-outline" size={52} color={colors.textFaint} />
              <Text style={styles.empty}>Nenhum pacote nesta categoria.</Text>
            </FadeInView>
          }
          renderItem={({ item, index }) => {
            const meta = statusMeta[item.status]
            return (
              <FadeInView delay={index * 50}>
                <PressableScale
                  style={styles.item}
                  onPress={() =>
                    navigation.navigate('PackageDetail', { packageId: item.id })
                  }
                >
                  <View style={[styles.statusIcon, { backgroundColor: meta.soft }]}>
                    <Ionicons
                      name={meta.icon as IoniconName}
                      size={18}
                      color={meta.color}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.recipient_name || 'Sem nome'}
                    </Text>
                    <Text style={styles.itemAddr} numberOfLines={1}>
                      {item.address || 'Sem endereço'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
                </PressableScale>
              </FadeInView>
            )
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  filters: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    ...shadow.soft,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef3c7',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  offlineText: { flex: 1, fontSize: 12, color: '#92400e', fontWeight: '600' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  emptyWrap: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: colors.textFaint, marginTop: 10 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadow.soft,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: { fontSize: 15, fontWeight: '700', color: colors.text },
  itemAddr: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
})
