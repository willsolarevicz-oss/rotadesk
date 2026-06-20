import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { CompositeNavigationProp } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { AppTabsParamList, AppStackParamList } from '../types/navigation'
import type { Package } from '../types/package'
import { listPackages } from '../services/packages'
import { getCachedPackages } from '../services/offlineCache'
import { optimizeRoute, type Located } from '../services/routing'
import { buildNavigationUrl } from '../utils/maps'
import { useOnline } from '../hooks/useOnline'
import { colors, spacing, radius, shadow, brandGradient } from '../theme'
import FadeInView from '../components/FadeInView'
import PressableScale from '../components/PressableScale'

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabsParamList, 'Route'>,
  NativeStackNavigationProp<AppStackParamList>
>

type LocatedPackage = Package & { latitude: number; longitude: number }

export default function RouteScreen() {
  const navigation = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const online = useOnline()
  const [stops, setStops] = useState<LocatedPackage[]>([])
  const [unlocated, setUnlocated] = useState<Package[]>([])
  const [origin, setOrigin] = useState<Located | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      let all: Package[]
      try {
        all = await listPackages('pending')
      } catch {
        all = (await getCachedPackages()).filter((p) => p.status === 'pending')
      }

      const located = all.filter(
        (p): p is LocatedPackage => p.latitude != null && p.longitude != null
      )
      setUnlocated(all.filter((p) => p.latitude == null || p.longitude == null))

      const start = await resolveOrigin(located)
      setOrigin(start)

      if (start && located.length > 1) {
        setStops(await optimizeRoute(start, located))
      } else {
        setStops(located)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  function openFullRoute() {
    if (stops.length === 0) return
    const dest = stops[stops.length - 1]
    const mid = stops.slice(0, -1)
    let url = 'https://www.google.com/maps/dir/?api=1'
    if (origin) url += `&origin=${origin.latitude},${origin.longitude}`
    url += `&destination=${dest.latitude},${dest.longitude}`
    if (mid.length > 0) {
      url +=
        '&waypoints=' +
        mid.map((s) => `${s.latitude},${s.longitude}`).join('|')
    }
    Linking.openURL(url)
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={brandGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.title}>Minha rota</Text>
        <Text style={styles.subtitle}>
          {stops.length > 0
            ? `${stops.length} parada${stops.length > 1 ? 's' : ''} na melhor ordem`
            : 'Sem paradas para hoje'}
        </Text>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary} />
      ) : stops.length === 0 ? (
        <FadeInView style={styles.empty}>
          <Ionicons name="map-outline" size={56} color={colors.textFaint} />
          <Text style={styles.emptyTitle}>Nenhuma parada localizada</Text>
          <Text style={styles.emptySub}>
            Cadastre pacotes com endereço localizado no mapa para montar a rota.
          </Text>
        </FadeInView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {!online ? (
            <View style={styles.offlineBanner}>
              <Ionicons name="cloud-offline" size={15} color="#92400e" />
              <Text style={styles.offlineText}>
                Sem internet: ordem aproximada por distância em linha reta.
              </Text>
            </View>
          ) : null}

          <PressableScale style={styles.fullRouteBtn} onPress={openFullRoute}>
            <Ionicons name="navigate" size={18} color="#fff" />
            <Text style={styles.fullRouteText}>Abrir rota no Google Maps</Text>
          </PressableScale>

          {stops.map((stop, index) => (
            <FadeInView key={stop.id} delay={index * 50}>
              <View style={styles.stopRow}>
                <View style={styles.timeline}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{index + 1}</Text>
                  </View>
                  {index < stops.length - 1 ? (
                    <View style={styles.line} />
                  ) : null}
                </View>

                <PressableScale
                  style={styles.card}
                  onPress={() =>
                    navigation.navigate('PackageDetail', { packageId: stop.id })
                  }
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name} numberOfLines={1}>
                      {stop.recipient_name || 'Sem nome'}
                    </Text>
                    <Text style={styles.addr} numberOfLines={2}>
                      {stop.address || 'Sem endereço'}
                    </Text>
                  </View>
                  <PressableScale
                    style={styles.navBtn}
                    onPress={() =>
                      Linking.openURL(
                        buildNavigationUrl(stop.latitude, stop.longitude)
                      )
                    }
                  >
                    <Ionicons name="navigate" size={18} color={colors.primary} />
                  </PressableScale>
                </PressableScale>
              </View>
            </FadeInView>
          ))}

          {unlocated.length > 0 ? (
            <View style={styles.unlocatedBox}>
              <Text style={styles.unlocatedTitle}>
                Sem localização ({unlocated.length})
              </Text>
              <Text style={styles.unlocatedSub}>
                Estes pacotes não entram na rota até terem o endereço localizado
                no mapa.
              </Text>
              {unlocated.map((p) => (
                <PressableScale
                  key={p.id}
                  style={styles.unlocatedItem}
                  onPress={() =>
                    navigation.navigate('PackageDetail', { packageId: p.id })
                  }
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={16}
                    color={colors.pending}
                  />
                  <Text style={styles.unlocatedName} numberOfLines={1}>
                    {p.recipient_name || 'Sem nome'}
                  </Text>
                </PressableScale>
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  )
}

// Origem da rota: GPS do entregador; se não der, usa a 1ª parada localizada.
async function resolveOrigin(
  located: LocatedPackage[]
): Promise<Located | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status === 'granted') {
      const pos = await Location.getCurrentPositionAsync({})
      return { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
    }
  } catch {
    // ignora; cai pro fallback
  }
  return located[0]
    ? { latitude: located[0].latitude, longitude: located[0].longitude }
    : null
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  list: { padding: spacing.lg },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef3c7',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  offlineText: { flex: 1, fontSize: 12, color: '#92400e', fontWeight: '600' },
  fullRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 13,
    marginBottom: spacing.lg,
  },
  fullRouteText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  stopRow: { flexDirection: 'row', gap: spacing.md },
  timeline: { alignItems: 'center', width: 32 },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 2 },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
    ...shadow.soft,
  },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  addr: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlocatedBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    ...shadow.soft,
  },
  unlocatedTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  unlocatedSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  unlocatedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  unlocatedName: { flex: 1, fontSize: 14, color: colors.text },
})
