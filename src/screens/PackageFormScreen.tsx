import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../types/navigation'
import { geocodeAddress } from '../services/geocoding'
import { createPackage } from '../services/packages'

type Props = NativeStackScreenProps<AppStackParamList, 'PackageForm'>

export default function PackageFormScreen({ route, navigation }: Props) {
  const { trackingCode } = route.params

  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [address, setAddress] = useState('')
  const [complement, setComplement] = useState('')
  const [routeName, setRouteName] = useState('')
  const [notes, setNotes] = useState('')
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(
    null
  )
  const [geocoding, setGeocoding] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleGeocode() {
    if (!address.trim()) {
      Alert.alert('Digite o endereço primeiro')
      return
    }
    setGeocoding(true)
    const result = await geocodeAddress(address)
    setGeocoding(false)
    if (result) {
      setCoords(result)
      Alert.alert('Endereço localizado ✅', 'O pacote será mostrado no mapa.')
    } else {
      Alert.alert(
        'Não encontrado',
        'Não foi possível localizar o endereço. Você ainda pode salvar e ajustar depois.'
      )
    }
  }

  async function handleSave() {
    if (!recipientName.trim() || !address.trim()) {
      Alert.alert('Preencha pelo menos o nome e o endereço')
      return
    }
    setSaving(true)
    try {
      const pkg = await createPackage({
        tracking_code: trackingCode,
        recipient_name: recipientName.trim(),
        recipient_phone: recipientPhone.trim(),
        address: address.trim(),
        complement: complement.trim(),
        route: routeName.trim(),
        notes: notes.trim(),
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
      })
      navigation.replace('PackageDetail', { packageId: pkg.id })
    } catch (e) {
      Alert.alert('Erro ao salvar', (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.codeLabel}>Código do pacote</Text>
      <Text style={styles.code}>{trackingCode}</Text>

      <Field label="Nome do destinatário *">
        <TextInput
          style={styles.input}
          value={recipientName}
          onChangeText={setRecipientName}
          placeholder="Ex: Maria Silva"
        />
      </Field>

      <Field label="Telefone (WhatsApp)">
        <TextInput
          style={styles.input}
          value={recipientPhone}
          onChangeText={setRecipientPhone}
          placeholder="(11) 99999-9999"
          keyboardType="phone-pad"
        />
      </Field>

      <Field label="Endereço *">
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={(t) => {
            setAddress(t)
            setCoords(null)
          }}
          placeholder="Rua, número, bairro, cidade"
          multiline
        />
      </Field>

      <TouchableOpacity
        style={styles.geoButton}
        onPress={handleGeocode}
        disabled={geocoding}
      >
        {geocoding ? (
          <ActivityIndicator color="#3b82f6" />
        ) : (
          <Text style={styles.geoButtonText}>
            {coords ? '📍 Endereço localizado' : '🔍 Buscar no mapa'}
          </Text>
        )}
      </TouchableOpacity>

      <Field label="Complemento / referência">
        <TextInput
          style={styles.input}
          value={complement}
          onChangeText={setComplement}
          placeholder="Apto, bloco, ponto de referência"
        />
      </Field>

      <Field label="Rota">
        <TextInput
          style={styles.input}
          value={routeName}
          onChangeText={setRouteName}
          placeholder="Ex: Zona Sul / Manhã"
        />
      </Field>

      <Field label="Observações">
        <TextInput
          style={styles.input}
          value={notes}
          onChangeText={setNotes}
          placeholder="Ex: deixar na portaria"
          multiline
        />
      </Field>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Salvar pacote</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 48 },
  codeLabel: { fontSize: 12, color: '#64748b' },
  code: { fontSize: 18, fontWeight: '700', marginBottom: 16, color: '#0f172a' },
  field: { marginBottom: 14 },
  label: { fontSize: 13, color: '#334155', marginBottom: 6, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  geoButton: {
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  geoButtonText: { color: '#3b82f6', fontWeight: '600' },
  saveButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})
