import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import { Ionicons } from '@expo/vector-icons'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../types/navigation'
import type { Package, PackageStatus } from '../types/package'
import { getPackage, updatePackageStatus } from '../services/packages'
import { sendWhatsApp } from '../services/notifications'
import { buildWhatsAppMessage } from '../utils/messages'
import { buildNavigationUrl } from '../utils/maps'
import { colors, spacing, radius, shadow, statusMeta } from '../theme'
import FadeInView from '../components/FadeInView'
import PressableScale from '../components/PressableScale'
import GradientButton from '../components/GradientButton'

type Props = NativeStackScreenProps<AppStackParamList, 'PackageDetail'>
type IoniconName = keyof typeof Ionicons.glyphMap

export default function PackageDetailScreen({ route }: Props) {
  const { packageId } = route.params
  const [pkg, setPkg] = useState<Package | null>(null)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)

  const load = useCallback(async () => {
    const data = await getPackage(packageId)
    setPkg(data)
    setLoading(false)
  }, [packageId])

  useEffect(() => {
    load()
  }, [load])

  async function changeStatus(status: PackageStatus) {
    setWorking(true)
    try {
      const updated = await updatePackageStatus(packageId, status)
      setPkg(updated)
    } catch (e) {
      Alert.alert('Erro', (e as Error).message)
    } finally {
      setWorking(false)
    }
  }

  async function notify(kind: 'on_the_way' | 'delivered') {
    if (!pkg?.recipient_phone) {
      Alert.alert('Sem telefone', 'Este pacote não tem telefone cadastrado.')
      return
    }
    setWorking(true)
    try {
      await sendWhatsApp(
        pkg.recipient_phone,
        buildWhatsAppMessage(pkg.recipient_name ?? '', kind)
      )
      Alert.alert('Enviado', 'Mensagem enviada no WhatsApp.')
    } catch (e) {
      Alert.alert('Erro ao enviar', (e as Error).message)
    } finally {
      setWorking(false)
    }
  }

  function openNavigation() {
    if (pkg?.latitude != null && pkg?.longitude != null) {
      Linking.openURL(buildNavigationUrl(pkg.latitude, pkg.longitude))
    } else if (pkg?.address) {
      Linking.openURL(
        'https://www.google.com/maps/dir/?api=1&destination=' +
          encodeURIComponent(pkg.address)
      )
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (!pkg) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.textMuted }}>Pacote não encontrado.</Text>
      </View>
    )
  }

  const meta = statusMeta[pkg.status]
  const hasCoords = pkg.latitude != null && pkg.longitude != null

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {hasCoords ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: pkg.latitude as number,
            longitude: pkg.longitude as number,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{
              latitude: pkg.latitude as number,
              longitude: pkg.longitude as number,
            }}
            title={pkg.recipient_name ?? 'Destino'}
            description={pkg.address ?? ''}
          />
        </MapView>
      ) : (
        <View style={[styles.map, styles.noMap]}>
          <Ionicons name="map-outline" size={40} color={colors.textFaint} />
          <Text style={styles.noMapText}>Sem localização no mapa</Text>
        </View>
      )}

      <FadeInView style={styles.body}>
        <View style={[styles.badge, { backgroundColor: meta.soft }]}>
          <Ionicons
            name={meta.icon as IoniconName}
            size={14}
            color={meta.color}
          />
          <Text style={[styles.badgeText, { color: meta.color }]}>
            {meta.label}
          </Text>
        </View>

        <Text style={styles.name}>{pkg.recipient_name || 'Sem nome'}</Text>
        <Text style={styles.address}>{pkg.address || 'Sem endereço'}</Text>

        <View style={styles.infoCard}>
          <InfoRow icon="pricetag-outline" label="Código" value={pkg.tracking_code} />
          <InfoRow icon="home-outline" label="Complemento" value={pkg.complement} />
          <InfoRow icon="map-outline" label="Rota" value={pkg.route} />
          <InfoRow icon="call-outline" label="Telefone" value={pkg.recipient_phone} />
          <InfoRow
            icon="document-text-outline"
            label="Observações"
            value={pkg.notes}
            last
          />
        </View>

        <GradientButton
          title="Navegar até o endereço"
          onPress={openNavigation}
          style={{ marginTop: spacing.lg }}
        />

        {pkg.recipient_phone ? (
          <View style={styles.row}>
            <ActionButton
              flex
              color="#25D366"
              icon="logo-whatsapp"
              label="A caminho"
              onPress={() => notify('on_the_way')}
              disabled={working}
            />
            <ActionButton
              flex
              color="#25D366"
              icon="logo-whatsapp"
              label="Entregue"
              onPress={() => notify('delivered')}
              disabled={working}
            />
          </View>
        ) : null}

        <View style={styles.row}>
          <ActionButton
            flex
            color={colors.delivered}
            icon="checkmark-circle"
            label="Entregue"
            onPress={() => changeStatus('delivered')}
            disabled={working}
          />
          <ActionButton
            flex
            color={colors.failed}
            icon="close-circle"
            label="Não entregue"
            onPress={() => changeStatus('failed')}
            disabled={working}
          />
        </View>

        {pkg.status !== 'pending' ? (
          <PressableScale
            style={styles.reopen}
            onPress={() => changeStatus('pending')}
            disabled={working}
          >
            <Text style={styles.reopenText}>Reabrir como pendente</Text>
          </PressableScale>
        ) : null}
      </FadeInView>
    </ScrollView>
  )
}

function InfoRow({
  icon,
  label,
  value,
  last,
}: {
  icon: IoniconName
  label: string
  value: string | null
  last?: boolean
}) {
  if (!value) return null
  return (
    <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
      <Ionicons name={icon} size={18} color={colors.textMuted} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  )
}

function ActionButton({
  color,
  icon,
  label,
  onPress,
  disabled,
  flex,
}: {
  color: string
  icon: IoniconName
  label: string
  onPress: () => void
  disabled?: boolean
  flex?: boolean
}) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      style={[styles.actionBtn, { backgroundColor: color }, flex && { flex: 1 }]}
    >
      <Ionicons name={icon} size={18} color="#fff" />
      <Text style={styles.actionText}>{label}</Text>
    </PressableScale>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  map: { width: '100%', height: 240 },
  noMap: {
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  noMapText: { color: colors.textMuted },
  body: { padding: spacing.lg },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  badgeText: { fontWeight: '700', fontSize: 12 },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  address: { fontSize: 15, color: colors.textMuted, marginTop: 4 },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    ...shadow.soft,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: { fontSize: 13, color: colors.textMuted, width: 92 },
  infoValue: { fontSize: 14, color: colors.text, flex: 1, fontWeight: '500' },
  row: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  reopen: { alignItems: 'center', marginTop: spacing.lg, padding: 8 },
  reopenText: {
    color: colors.textMuted,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
})
