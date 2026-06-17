import React, { useState, useRef, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as ImageManipulator from 'expo-image-manipulator'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { AppStackParamList, PackagePrefill } from '../types/navigation'
import { readLabel } from '../services/labelReader'
import { lookupCep } from '../services/cep'
import { colors, spacing, radius } from '../theme'
import PressableScale from '../components/PressableScale'
import GradientButton from '../components/GradientButton'

type Nav = NativeStackNavigationProp<AppStackParamList>

export default function ScannerScreen() {
  const navigation = useNavigation<Nav>()
  const cameraRef = useRef<CameraView>(null)
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const [reading, setReading] = useState(false)
  const [failedRead, setFailedRead] = useState(false)
  const [lastCode, setLastCode] = useState('')
  const [manual, setManual] = useState(false)
  const [code, setCode] = useState('')

  async function handleScanned(result: { type: string; data: string }) {
    if (scanned || reading || failedRead) return
    setScanned(true)
    setReading(true)
    setLastCode(result.data)

    let data: Partial<{
      recipient_name: string
      cep: string
      street: string
      number: string
      complement: string
      neighborhood: string
      city: string
      state: string
      phone: string
    }> | null = null

    try {
      // pequena pausa pra a câmera focar antes da foto
      await new Promise((r) => setTimeout(r, 400))
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.6 })
      if (photo?.uri) {
        const shrunk = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 1100 } }],
          { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        )
        if (shrunk.base64) {
          data = await readLabel(shrunk.base64)
          // cruza com o ViaCEP: rua/bairro/cidade do CEP são mais confiáveis que o OCR
          if (data?.cep) {
            const cepInfo = await lookupCep(data.cep)
            if (cepInfo) {
              data.street = cepInfo.street || data.street
              data.neighborhood = cepInfo.neighborhood || data.neighborhood
              data.city = cepInfo.city || data.city
              data.state = cepInfo.state || data.state
            }
          }
        }
      }
    } catch {
      // ignora: trata como leitura falha abaixo
    }
    setReading(false)

    // considera "leu" se veio nome OU rua OU CEP
    const goodRead = !!(
      data &&
      (data.recipient_name?.trim() || data.street?.trim() || data.cep?.trim())
    )

    if (goodRead) {
      const prefill: PackagePrefill = {
        recipient_name: data!.recipient_name,
        recipient_phone: data!.phone,
        cep: data!.cep,
        street: data!.street,
        number: data!.number,
        complement: data!.complement,
        neighborhood: data!.neighborhood,
        city: data!.city,
        state: data!.state,
      }
      navigation.navigate('PackageForm', { trackingCode: result.data, prefill })
      setTimeout(() => setScanned(false), 1500)
    } else {
      // não conseguiu ler o endereço: avisa e deixa reenquadrar
      setFailedRead(true)
    }
  }

  function retry() {
    setFailedRead(false)
    setScanned(false)
  }

  function continueWithoutRead() {
    navigation.navigate('PackageForm', { trackingCode: lastCode })
    setFailedRead(false)
    setScanned(false)
  }

  const goToManual = useCallback(() => {
    if (!code.trim()) {
      Alert.alert('Informe o código do pacote')
      return
    }
    navigation.navigate('PackageForm', { trackingCode: code.trim() })
    setCode('')
  }, [code, navigation])

  if (!permission) {
    return <View style={styles.fill} />
  }

  if (!permission.granted && !manual) {
    return (
      <View style={styles.center}>
        <View style={styles.permIcon}>
          <Ionicons name="camera-outline" size={40} color={colors.primary} />
        </View>
        <Text style={styles.permTitle}>Acesso à câmera</Text>
        <Text style={styles.permText}>
          Precisamos da câmera para escanear o código de barras dos pacotes.
        </Text>
        <GradientButton
          title="Permitir câmera"
          onPress={requestPermission}
          style={{ alignSelf: 'stretch', marginTop: spacing.lg }}
        />
        <PressableScale onPress={() => setManual(true)} style={{ padding: 12 }}>
          <Text style={styles.link}>Digitar código manualmente</Text>
        </PressableScale>
      </View>
    )
  }

  if (manual) {
    return (
      <View style={styles.center}>
        <View style={styles.permIcon}>
          <Ionicons name="keypad-outline" size={38} color={colors.primary} />
        </View>
        <Text style={styles.permTitle}>Digitar código</Text>
        <View style={styles.inputRow}>
          <Ionicons name="barcode-outline" size={20} color={colors.textFaint} />
          <TextInput
            style={styles.input}
            placeholder="Código de rastreio"
            placeholderTextColor={colors.textFaint}
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            autoFocus
          />
        </View>
        <GradientButton
          title="Continuar"
          onPress={goToManual}
          style={{ alignSelf: 'stretch', marginTop: spacing.md }}
        />
        <PressableScale onPress={() => setManual(false)} style={{ padding: 12 }}>
          <Text style={styles.link}>Voltar para a câmera</Text>
        </PressableScale>
      </View>
    )
  }

  return (
    <View style={styles.fill}>
      <StatusBar style="light" />
      <CameraView
        ref={cameraRef}
        style={styles.fill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: [
            'qr',
            'ean13',
            'ean8',
            'code128',
            'code39',
            'code93',
            'codabar',
            'upc_e',
            'pdf417',
            'datamatrix',
            'aztec',
            'itf14',
          ],
        }}
        onBarcodeScanned={handleScanned}
      />
      <View style={styles.overlay}>
        <View style={styles.frame}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
        <Text style={styles.overlayText}>
          Deixe a etiqueta inteira no quadro (código + endereço)
        </Text>
        <PressableScale
          style={styles.manualButton}
          onPress={() => setManual(true)}
        >
          <Ionicons name="create-outline" size={18} color={colors.text} />
          <Text style={styles.manualButtonText}>Digitar código</Text>
        </PressableScale>
      </View>

      {reading ? (
        <View style={styles.dimOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.bigText}>Lendo etiqueta...</Text>
        </View>
      ) : null}

      {failedRead ? (
        <View style={styles.dimOverlay}>
          <Ionicons name="scan-outline" size={52} color="#fff" />
          <Text style={styles.bigText}>Não consegui ler o endereço</Text>
          <Text style={styles.failHint}>
            Afaste o celular e deixe a etiqueta INTEIRA no quadro (nome +
            endereço), com boa luz e firme.
          </Text>
          <PressableScale style={styles.retryBtn} onPress={retry}>
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.retryText}>Tentar de novo</Text>
          </PressableScale>
          <PressableScale onPress={continueWithoutRead} style={{ padding: 10 }}>
            <Text style={styles.failLink}>Continuar sem preencher</Text>
          </PressableScale>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.bg,
  },
  permIcon: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  permTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  permText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    color: colors.textMuted,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    marginTop: spacing.lg,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: colors.text },
  link: { color: colors.textMuted, fontWeight: '600' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  frame: { width: 270, height: 180 },
  corner: { position: 'absolute', width: 34, height: 34, borderColor: '#fff' },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 14 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 14 },
  bl: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 14,
  },
  br: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 14,
  },
  overlayText: {
    color: '#fff',
    marginTop: spacing.xl,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  manualButtonText: { color: colors.text, fontWeight: '700' },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  bigText: { color: '#fff', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  failHint: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  failLink: { color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
})
