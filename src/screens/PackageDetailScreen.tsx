import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../types/navigation'
import type { Package, PackageStatus } from '../types/package'
import { getPackage, updatePackageStatus } from '../services/packages'
import { sendWhatsApp } from '../services/notifications'
import { buildWhatsAppMessage } from '../utils/messages'
import { buildNavigationUrl } from '../utils/maps'

type Props = NativeStackScreenProps<AppStackParamList, 'PackageDetail'>

const STATUS_LABEL: Record<PackageStatus, string> = {
  pending: 'Pendente',
  delivered: 'Entregue',
  failed: 'Não entregue',
}
const STATUS_COLOR: Record<PackageStatus, string> = {
  pending: '#f59e0b',
  delivered: '#22c55e',
  failed: '#ef4444',
}

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
      Alert.alert('Enviado ✅', 'Mensagem enviada no WhatsApp.')
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
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  if (!pkg) {
    return (
      <View style={styles.center}>
        <Text>Pacote não encontrado.</Text>
      </View>
    )
  }

  const hasCoords = pkg.latitude != null && pkg.longitude != null

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
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
          <Text style={styles.noMapText}>Sem localização no mapa</Text>
        </View>
      )}

      <View style={styles.body}>
        <View
          style={[styles.badge, { backgroundColor: STATUS_COLOR[pkg.status] }]}
        >
          <Text style={styles.badgeText}>{STATUS_LABEL[pkg.status]}</Text>
        </View>

        <Text style={styles.name}>{pkg.recipient_name || 'Sem nome'}</Text>
        <Text style={styles.address}>{pkg.address}</Text>
        {pkg.complement ? (
          <Text style={styles.meta}>Complemento: {pkg.complement}</Text>
        ) : null}
        {pkg.route ? <Text style={styles.meta}>Rota: {pkg.route}</Text> : null}
        <Text style={styles.meta}>Código: {pkg.tracking_code}</Text>
        {pkg.notes ? <Text style={styles.meta}>Obs: {pkg.notes}</Text> : null}

        <TouchableOpacity style={styles.navButton} onPress={openNavigation}>
          <Text style={styles.navButtonText}>🧭 Navegar até o endereço</Text>
        </TouchableOpacity>

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.smallButton, styles.whatsapp]}
            onPress={() => notify('on_the_way')}
            disabled={working}
          >
            <Text style={styles.smallButtonText}>Avisar: a caminho</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.smallButton, styles.whatsapp]}
            onPress={() => notify('delivered')}
            disabled={working}
          >
            <Text style={styles.smallButtonText}>Avisar: entregue</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.statusButton, { backgroundColor: '#22c55e' }]}
            onPress={() => changeStatus('delivered')}
            disabled={working}
          >
            <Text style={styles.statusButtonText}>✓ Entregue</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusButton, { backgroundColor: '#ef4444' }]}
            onPress={() => changeStatus('failed')}
            disabled={working}
          >
            <Text style={styles.statusButtonText}>✗ Não entregue</Text>
          </TouchableOpacity>
        </View>

        {pkg.status !== 'pending' ? (
          <TouchableOpacity
            style={styles.reopen}
            onPress={() => changeStatus('pending')}
            disabled={working}
          >
            <Text style={styles.reopenText}>Reabrir como pendente</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map: { width: '100%', height: 240 },
  noMap: {
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMapText: { color: '#64748b' },
  body: { padding: 16 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  name: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  address: { fontSize: 15, color: '#334155', marginTop: 4 },
  meta: { fontSize: 13, color: '#64748b', marginTop: 4 },
  navButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  navButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  row: { flexDirection: 'row', gap: 10, marginTop: 12 },
  smallButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  whatsapp: { backgroundColor: '#25D366' },
  smallButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  statusButton: {
    flex: 1,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  statusButtonText: { color: '#fff', fontWeight: '700' },
  reopen: { alignItems: 'center', marginTop: 16 },
  reopenText: { color: '#64748b', textDecorationLine: 'underline' },
})
