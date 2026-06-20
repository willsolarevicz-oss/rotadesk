import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native'
import * as Location from 'expo-location'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { CompositeNavigationProp } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'
import { listPackages } from '../services/packages'
import { computeStats, type PackageStats } from '../utils/stats'
import { sortByProximity } from '../utils/distance'
import type { Package } from '../types/package'
import type { AppTabsParamList, AppStackParamList } from '../types/navigation'
import { colors, spacing, radius, shadow, brandGradient } from '../theme'
import FadeInView from '../components/FadeInView'
import PressableScale from '../components/PressableScale'
import GradientButton from '../components/GradientButton'

type IoniconName = keyof typeof Ionicons.glyphMap

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabsParamList, 'Home'>,
  NativeStackNavigationProp<AppStackParamList>
>

export default function HomeScreen() {
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const [session, setSession] = useState<Session | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [stats, setStats] = useState<PackageStats>({
    pending: 0,
    delivered: 0,
    failed: 0,
  })
  const [loading, setLoading] = useState(true)
  const [origin, setOrigin] = useState<{ latitude: number; longitude: number } | null>(
    null
  )
  const [nearMode, setNearMode] = useState(false)
  const [locating, setLocating] = useState(false)

  const load = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    setSession(session)
    try {
      const all = await listPackages('all')
      setPackages(all)
      setStats(computeStats(all))
    } catch {
      setPackages([])
      setStats({ pending: 0, delivered: 0, failed: 0 })
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

  async function toggleNear() {
    if (nearMode) {
      setNearMode(false)
      return
    }
    setLocating(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Sem permissão',
          'Permita o acesso à localização para ordenar a rota por proximidade.'
        )
        return
      }
      const pos = await Location.getCurrentPositionAsync({})
      setOrigin({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      })
      setNearMode(true)
    } catch (e) {
      Alert.alert('Erro de localização', (e as Error).message)
    } finally {
      setLocating(false)
    }
  }

  const pending = packages.filter((p) => p.status === 'pending')
  const pendingSorted =
    nearMode && origin ? sortByProximity(pending, origin) : pending
  const displayName = session?.user.email ?? 'Entregador'

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient
        colors={brandGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Olá,</Text>
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>
          </View>
          <PressableScale onPress={handleSignOut} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </PressableScale>
        </View>
      </LinearGradient>

      <FadeInView style={styles.statsWrap}>
        <View style={styles.statsCard}>
          <StatItem
            icon="time"
            color={colors.pending}
            value={stats.pending}
            label="Pendentes"
          />
          <View style={styles.statDivider} />
          <StatItem
            icon="checkmark-circle"
            color={colors.delivered}
            value={stats.delivered}
            label="Entregues"
          />
          <View style={styles.statDivider} />
          <StatItem
            icon="close-circle"
            color={colors.failed}
            value={stats.failed}
            label="Falhas"
          />
        </View>
      </FadeInView>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Pacotes pendentes</Text>
        {pending.length > 1 ? (
          <PressableScale
            style={[styles.nearChip, nearMode && styles.nearChipActive]}
            onPress={toggleNear}
            disabled={locating}
          >
            {locating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons
                  name="navigate"
                  size={14}
                  color={nearMode ? '#fff' : colors.primary}
                />
                <Text style={[styles.nearChipText, nearMode && { color: '#fff' }]}>
                  Mais perto
                </Text>
              </>
            )}
          </PressableScale>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : pending.length === 0 ? (
        <FadeInView style={styles.empty}>
          <Ionicons name="cube-outline" size={56} color={colors.textFaint} />
          <Text style={styles.emptyTitle}>Nenhum pacote pendente</Text>
          <Text style={styles.emptySub}>
            Escaneie os pacotes do dia para gerar sua rota
          </Text>
        </FadeInView>
      ) : (
        <FlatList
          data={pendingSorted}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <FadeInView delay={index * 60}>
              <PressableScale
                style={styles.itemCard}
                onPress={() =>
                  navigation.navigate('PackageDetail', { packageId: item.id })
                }
              >
                <View style={styles.itemIcon}>
                  <Ionicons name="cube" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.recipient_name || 'Sem nome'}
                  </Text>
                  <Text style={styles.itemAddr} numberOfLines={1}>
                    {item.address || 'Sem endereço'}
                  </Text>
                  {item.route ? (
                    <Text style={styles.itemRoute}>{item.route}</Text>
                  ) : null}
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textFaint}
                />
              </PressableScale>
            </FadeInView>
          )}
        />
      )}

      <GradientButton
        title="Escanear Pacotes"
        style={styles.cta}
        onPress={() => navigation.navigate('Scanner')}
      />
    </View>
  )
}

function StatItem({
  icon,
  color,
  value,
  label,
}: {
  icon: IoniconName
  color: string
  value: number
  label: string
}) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 64,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  name: { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 2 },
  logoutBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsWrap: { marginTop: -44, marginHorizontal: spacing.lg },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    ...shadow.card,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 12, color: colors.textMuted },
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  nearChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    minWidth: 96,
    justifyContent: 'center',
  },
  nearChipActive: { backgroundColor: colors.primary },
  nearChipText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 8 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadow.soft,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: { fontSize: 15, fontWeight: '700', color: colors.text },
  itemAddr: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  itemRoute: { fontSize: 12, color: colors.primary, marginTop: 2, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 12 },
  emptySub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 4 },
  cta: { margin: spacing.lg },
})
