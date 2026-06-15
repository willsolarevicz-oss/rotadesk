import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../types/navigation'
import { colors, spacing, radius, shadow } from '../theme'
import PressableScale from '../components/PressableScale'
import GradientButton from '../components/GradientButton'

type Nav = NativeStackNavigationProp<AppStackParamList>

export default function ScannerScreen() {
  const navigation = useNavigation<Nav>()
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const [manual, setManual] = useState(false)
  const [code, setCode] = useState('')

  const goToForm = useCallback(
    (trackingCode: string) => {
      navigation.navigate('PackageForm', { trackingCode })
    },
    [navigation]
  )

  function handleScanned(result: { type: string; data: string }) {
    if (scanned) return
    setScanned(true)
    goToForm(result.data)
    setTimeout(() => setScanned(false), 1500)
  }

  function handleManualSubmit() {
    if (!code.trim()) {
      Alert.alert('Informe o código do pacote')
      return
    }
    goToForm(code.trim())
    setCode('')
  }

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
          onPress={handleManualSubmit}
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
          Aponte para o código de barras do pacote
        </Text>
        <PressableScale
          style={styles.manualButton}
          onPress={() => setManual(true)}
        >
          <Ionicons name="create-outline" size={18} color={colors.text} />
          <Text style={styles.manualButtonText}>Digitar código</Text>
        </PressableScale>
      </View>
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
})
