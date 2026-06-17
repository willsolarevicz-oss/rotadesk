import React, { useState, useRef, useEffect, useCallback } from 'react'
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
import { useNavigation, useIsFocused } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { AppStackParamList, PackagePrefill } from '../types/navigation'
import { readLabel } from '../services/labelReader'
import { lookupCep } from '../services/cep'
import { colors, spacing, radius } from '../theme'
import PressableScale from '../components/PressableScale'
import GradientButton from '../components/GradientButton'

type Nav = NativeStackNavigationProp<AppStackParamList>
// code: lendo o código de barras | address: capturando o endereço |
// reading: IA processando | failed: não leu
type Phase = 'code' | 'address' | 'reading' | 'failed'

export default function ScannerScreen() {
  const navigation = useNavigation<Nav>()
  const isFocused = useIsFocused()
  const cameraRef = useRef<CameraView>(null)
  const lastCodeRef = useRef('')
  const capturingRef = useRef(false)
  const [permission, requestPermission] = useCameraPermissions()
  const [phase, setPhase] = useState<Phase>('code')
  const [manual, setManual] = useState(false)
  const [code, setCode] = useState('')

  // ao voltar pra tela, recomeça da etapa 1
  useEffect(() => {
    if (isFocused) {
      setPhase('code')
      capturingRef.current = false
    }
  }, [isFocused])

  // etapa 1: detectou o código de barras -> pula pra etapa 2 (endereço)
  function handleScanned(result: { type: string; data: string }) {
    if (phase !== 'code' || !isFocused) return
    lastCodeRef.current = result.data
    setPhase('address')
  }

  // etapa 2: tira a foto do endereço e manda pra IA
  const capture = useCallback(async () => {
    if (capturingRef.current) return
    capturingRef.current = true
    setPhase('reading')

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
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.6 })
      if (photo?.uri) {
        const shrunk = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 1500 } }],
          { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        )
        if (shrunk.base64) {
          data = await readLabel(shrunk.base64)
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
      // ignora: trata como falha abaixo
    }
    capturingRef.current = false

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
      navigation.navigate('PackageForm', {
        trackingCode: lastCodeRef.current,
        prefill,
      })
      setPhase('code')
    } else {
      setPhase('failed')
    }
  }, [navigation])

  // captura automática alguns segundos depois de entrar na etapa 2
  useEffect(() => {
    if (phase !== 'address') return
    const t = setTimeout(() => capture(), 3500)
    return () => clearTimeout(t)
  }, [phase, capture])

  function continueWithoutRead() {
    navigation.navigate('PackageForm', { trackingCode: lastCodeRef.current })
    setPhase('code')
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

  const frameColor = phase === 'address' ? colors.delivered : '#fff'

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

      {phase === 'code' || phase === 'address' ? (
        <View style={styles.overlay}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>
              {phase === 'code' ? 'Etapa 1 de 2' : 'Etapa 2 de 2'}
            </Text>
          </View>

          <View style={[styles.frame]}>
            <View style={[styles.corner, styles.tl, { borderColor: frameColor }]} />
            <View style={[styles.corner, styles.tr, { borderColor: frameColor }]} />
            <View style={[styles.corner, styles.bl, { borderColor: frameColor }]} />
            <View style={[styles.corner, styles.br, { borderColor: frameColor }]} />
          </View>

          {phase === 'code' ? (
            <>
              <Text style={styles.overlayTitle}>Aponte no código de barras</Text>
              <Text style={styles.overlaySub}>
                Assim que ler o código, vamos para o endereço
              </Text>
              <PressableScale
                style={styles.manualButton}
                onPress={() => setManual(true)}
              >
                <Ionicons name="create-outline" size={18} color={colors.text} />
                <Text style={styles.manualButtonText}>Digitar código</Text>
              </PressableScale>
            </>
          ) : (
            <>
              <Text style={styles.overlayTitle}>
                Agora o nome e o endereço
              </Text>
              <Text style={styles.overlaySub}>
                Aproxime e enquadre só o bloco do destinatário
              </Text>
              <PressableScale style={styles.captureButton} onPress={capture}>
                <Ionicons name="camera" size={20} color="#fff" />
                <Text style={styles.captureText}>Capturar etiqueta</Text>
              </PressableScale>
              <Text style={styles.autoHint}>ou aguarde a captura automática</Text>
            </>
          )}
        </View>
      ) : null}

      {phase === 'reading' ? (
        <View style={styles.dimOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.bigText}>Lendo as informações...</Text>
          <Text style={styles.subText}>Extraindo nome e endereço</Text>
        </View>
      ) : null}

      {phase === 'failed' ? (
        <View style={styles.dimOverlay}>
          <Ionicons name="scan-outline" size={52} color="#fff" />
          <Text style={styles.bigText}>Não consegui ler o endereço</Text>
          <Text style={styles.subText}>
            Aproxime mais do bloco do nome e endereço, com boa luz e firme.
          </Text>
          <PressableScale
            style={styles.retryBtn}
            onPress={() => setPhase('address')}
          >
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
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  stepBadge: {
    position: 'absolute',
    top: 60,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  stepBadgeText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  frame: { width: 280, height: 180 },
  corner: { position: 'absolute', width: 34, height: 34 },
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
  overlayTitle: {
    color: '#fff',
    marginTop: spacing.xl,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  overlaySub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
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
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  captureText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  autoHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: spacing.sm,
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  bigText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  subText: {
    color: 'rgba(255,255,255,0.8)',
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
    marginTop: spacing.md,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  failLink: { color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
})
