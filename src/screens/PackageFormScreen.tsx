import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../types/navigation'
import { geocodeAddress } from '../services/geocoding'
import { lookupCep } from '../services/cep'
import { createPackage } from '../services/packages'
import { colors, spacing, radius, shadow } from '../theme'
import FadeInView from '../components/FadeInView'
import PressableScale from '../components/PressableScale'
import GradientButton from '../components/GradientButton'

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
      Alert.alert('Endereço localizado', 'O pacote será mostrado no mapa.')
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
      <FadeInView>
        <View style={styles.codeCard}>
          <View style={styles.codeIcon}>
            <Ionicons name="barcode-outline" size={22} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.codeLabel}>Código do pacote</Text>
            <Text style={styles.code}>{trackingCode}</Text>
          </View>
        </View>

        <Field label="Nome do destinatário *">
          <TextInput
            style={styles.input}
            value={recipientName}
            onChangeText={setRecipientName}
            placeholder="Ex: Maria Silva"
            placeholderTextColor={colors.textFaint}
          />
        </Field>

        <Field label="Telefone (WhatsApp)">
          <TextInput
            style={styles.input}
            value={recipientPhone}
            onChangeText={setRecipientPhone}
            placeholder="(11) 99999-9999"
            placeholderTextColor={colors.textFaint}
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
              placeholderTextColor={colors.textFaint}
              keyboardType="number-pad"
              maxLength={9}
            />
            {cepLoading ? (
              <ActivityIndicator style={{ marginLeft: 10 }} color={colors.primary} />
            ) : null}
          </View>
          <Text style={styles.help}>Digite o CEP que o endereço preenche sozinho</Text>
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
            placeholderTextColor={colors.textFaint}
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
            placeholderTextColor={colors.textFaint}
            keyboardType="number-pad"
          />
        </Field>

        {locationHint ? (
          <View style={styles.hintRow}>
            <Ionicons name="location" size={15} color={colors.primary} />
            <Text style={styles.hintText}>{locationHint}</Text>
          </View>
        ) : null}

        <PressableScale
          style={[styles.geoButton, coords && styles.geoButtonOk]}
          onPress={handleGeocode}
          disabled={geocoding}
        >
          {geocoding ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Ionicons
                name={coords ? 'checkmark-circle' : 'search'}
                size={18}
                color={coords ? colors.delivered : colors.primary}
              />
              <Text
                style={[styles.geoText, coords && { color: colors.delivered }]}
              >
                {coords ? 'Endereço localizado' : 'Buscar no mapa'}
              </Text>
            </>
          )}
        </PressableScale>

        <Field label="Complemento / referência">
          <TextInput
            style={styles.input}
            value={complement}
            onChangeText={setComplement}
            placeholder="Apto, bloco, ponto de referência"
            placeholderTextColor={colors.textFaint}
          />
        </Field>

        <Field label="Rota">
          <TextInput
            style={styles.input}
            value={routeName}
            onChangeText={setRouteName}
            placeholder="Ex: Zona Sul / Manhã"
            placeholderTextColor={colors.textFaint}
          />
        </Field>

        <Field label="Observações">
          <TextInput
            style={styles.input}
            value={notes}
            onChangeText={setNotes}
            placeholder="Ex: deixar na portaria"
            placeholderTextColor={colors.textFaint}
            multiline
          />
        </Field>

        <GradientButton
          title="Salvar pacote"
          loading={saving}
          onPress={handleSave}
          style={{ marginTop: spacing.md }}
        />
      </FadeInView>
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
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 48 },
  codeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.soft,
  },
  codeIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeLabel: { fontSize: 12, color: colors.textMuted },
  code: { fontSize: 17, fontWeight: '800', color: colors.text },
  field: { marginBottom: spacing.md },
  label: {
    fontSize: 13,
    color: colors.text,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 13,
    fontSize: 15,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  cepRow: { flexDirection: 'row', alignItems: 'center' },
  help: { fontSize: 12, color: colors.textFaint, marginTop: 4 },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: spacing.md,
    marginTop: -2,
  },
  hintText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  geoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 13,
    marginBottom: spacing.md,
  },
  geoButtonOk: { borderColor: colors.delivered, backgroundColor: '#f0fdf4' },
  geoText: { color: colors.primary, fontWeight: '700' },
})
