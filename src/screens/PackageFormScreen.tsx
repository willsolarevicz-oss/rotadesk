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
import { lookupCep } from '../services/cep'
import { createPackage } from '../services/packages'

type Props = NativeStackScreenProps<AppStackParamList, 'PackageForm'>

export default function PackageFormScreen({ route, navigation }: Props) {
  const { trackingCode } = route.params

  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [cep, setCep] = useState('')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [uf, setUf] = useState('')
  const [complement, setComplement] = useState('')
  const [routeName, setRouteName] = useState('')
  const [notes, setNotes] = useState('')
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(
    null
  )
  const [cepLoading, setCepLoading] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [saving, setSaving] = useState(false)

  // Monta o endereço completo a partir das partes (rua, número, bairro, cidade - UF)
  function composeAddress(): string {
    const line1 = [street.trim(), number.trim()].filter(Boolean).join(', ')
    const cityState = [city.trim(), uf.trim()].filter(Boolean).join(' - ')
    return [line1, neighborhood.trim(), cityState].filter(Boolean).join(', ')
  }

  async function handleCepChange(text: string) {
    setCep(text)
    setCoords(null)
    const digits = text.replace(/\D/g, '')
    if (digits.length === 8) {
      setCepLoading(true)
      const result = await lookupCep(digits)
      setCepLoading(false)
      if (result) {
        setStreet(result.street)
        setNeighborhood(result.neighborhood)
        setCity(result.city)
        setUf(result.state)
      } else {
        Alert.alert(
          'CEP não encontrado',
          'Confira o CEP ou preencha o endereço manualmente.'
        )
      }
    }
  }

  async function handleGeocode() {
    const fullAddress = composeAddress()
    if (!fullAddress) {
      Alert.alert('Preencha o endereço primeiro')
      return
    }
    setGeocoding(true)
    const result = await geocodeAddress(fullAddress)
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
    const fullAddress = composeAddress()
    if (!recipientName.trim() || !fullAddress) {
      Alert.alert('Preencha pelo menos o nome e o endereço (CEP)')
      return
    }
    setSaving(true)
    try {
      const pkg = await createPackage({
        tracking_code: trackingCode,
        recipient_name: recipientName.trim(),
        recipient_phone: recipientPhone.trim(),
        address: fullAddress,
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

  const locationHint = [neighborhood, [city, uf].filter(Boolean).join(' - ')]
    .filter(Boolean)
    .join(' • ')

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

      <Field label="CEP">
        <View style={styles.cepRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={cep}
            onChangeText={handleCepChange}
            placeholder="00000-000"
            keyboardType="number-pad"
            maxLength={9}
          />
          {cepLoading ? (
            <ActivityIndicator style={{ marginLeft: 10 }} color="#3b82f6" />
          ) : null}
        </View>
        <Text style={styles.cepHelp}>Digite o CEP que o endereço preenche sozinho</Text>
      </Field>

      <Field label="Rua / Logradouro *">
        <TextInput
          style={styles.input}
          value={street}
          onChangeText={(t) => {
            setStreet(t)
            setCoords(null)
          }}
          placeholder="Rua, avenida..."
        />
      </Field>

      <Field label="Número">
        <TextInput
          style={styles.input}
          value={number}
          onChangeText={(t) => {
            setNumber(t)
            setCoords(null)
          }}
          placeholder="Ex: 123"
          keyboardType="number-pad"
        />
      </Field>

      {locationHint ? <Text style={styles.locationHint}>📍 {locationHint}</Text> : null}

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
  cepRow: { flexDirection: 'row', alignItems: 'center' },
  cepHelp: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  locationHint: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 14,
    marginTop: -4,
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
