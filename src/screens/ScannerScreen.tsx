import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../types/navigation'

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
    // libera para novo scan ao voltar
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
    return <View style={styles.container} />
  }

  if (!permission.granted && !manual) {
    return (
      <View style={styles.center}>
        <Text style={styles.info}>
          Precisamos da câmera para escanear os pacotes.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Permitir câmera</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setManual(true)}>
          <Text style={styles.link}>Digitar código manualmente</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (manual) {
    return (
      <View style={styles.center}>
        <Text style={styles.info}>Digite o código do pacote</Text>
        <TextInput
          style={styles.input}
          placeholder="Código de rastreio"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          autoFocus
        />
        <TouchableOpacity style={styles.button} onPress={handleManualSubmit}>
          <Text style={styles.buttonText}>Continuar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setManual(false)}>
          <Text style={styles.link}>Voltar para a câmera</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
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
        <View style={styles.frame} />
        <Text style={styles.overlayText}>
          Aponte para o código de barras do pacote
        </Text>
        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => setManual(true)}
        >
          <Text style={styles.manualButtonText}>Digitar código</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  info: { fontSize: 16, textAlign: 'center', marginBottom: 16, color: '#334155' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    width: 260,
    height: 160,
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  overlayText: {
    color: '#fff',
    marginTop: 24,
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  manualButton: {
    marginTop: 32,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  manualButtonText: { color: '#0f172a', fontWeight: '600' },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { color: '#64748b', marginTop: 16 },
})
