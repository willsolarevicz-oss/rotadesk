import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../services/supabase'
import { colors, spacing, radius, shadow, brandGradient } from '../theme'
import FadeInView from '../components/FadeInView'
import GradientButton from '../components/GradientButton'

type Step = 'email' | 'otp'

export default function LoginScreen() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSendOtp() {
    setError('')
    if (!email.trim()) {
      setError('Digite seu e-mail')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setStep('otp')
    }
  }

  async function handleVerifyOtp() {
    setError('')
    setLoading(true)
    // Tenta como login por e-mail; se falhar, tenta como confirmação de cadastro
    let { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: 'email',
    })
    if (error) {
      const retry = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp.trim(),
        type: 'signup',
      })
      error = retry.error
    }
    setLoading(false)
    if (error) {
      setError(error.message)
    }
    // Em caso de sucesso: o RootNavigator redireciona via onAuthStateChange
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <FadeInView style={styles.inner}>
        <LinearGradient
          colors={brandGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logo}
        >
          <Ionicons name="cube" size={38} color="#fff" />
        </LinearGradient>

        <Text style={styles.title}>Rotadesk</Text>
        <Text style={styles.subtitle}>
          {step === 'email'
            ? 'Entre para gerenciar suas entregas'
            : `Código enviado para ${email}`}
        </Text>

        <View style={styles.card}>
          {step === 'email' ? (
            <>
              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={20} color={colors.textFaint} />
                <TextInput
                  style={styles.input}
                  placeholder="seu@email.com"
                  placeholderTextColor={colors.textFaint}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <GradientButton
                title="Enviar código"
                loading={loading}
                onPress={handleSendOtp}
                style={{ marginTop: spacing.md }}
              />
            </>
          ) : (
            <>
              <View style={styles.inputRow}>
                <Ionicons name="keypad-outline" size={20} color={colors.textFaint} />
                <TextInput
                  style={styles.input}
                  placeholder="Código de 8 dígitos"
                  placeholderTextColor={colors.textFaint}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={8}
                  autoFocus
                />
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <GradientButton
                title="Entrar"
                loading={loading}
                onPress={handleVerifyOtp}
                style={{ marginTop: spacing.md }}
              />
              <TouchableOpacity
                onPress={() => {
                  setStep('email')
                  setError('')
                }}
              >
                <Text style={styles.back}>← Voltar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </FadeInView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  inner: { alignItems: 'center' },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.lg,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadow.card,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: '#f8fafc',
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: colors.text },
  error: { color: colors.failed, marginTop: spacing.sm },
  back: {
    textAlign: 'center',
    marginTop: spacing.lg,
    color: colors.textMuted,
    fontWeight: '600',
  },
})
