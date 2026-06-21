import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../services/supabase'
import { colors, spacing, radius, shadow } from '../theme'
import FadeInView from '../components/FadeInView'
import GradientButton from '../components/GradientButton'
import SecretBox from '../components/SecretBox'

type Mode = 'login' | 'signup'
type IoniconName = keyof typeof Ionicons.glyphMap

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const isSignup = mode === 'signup'

  function clearMessages() {
    setError('')
    setInfo('')
  }

  async function handleLogin() {
    clearMessages()
    if (!email.trim() || !password) {
      setError('Preencha e-mail e senha')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setLoading(false)
    if (error) setError(traduzErro(error.message))
    // sucesso: o RootNavigator redireciona via onAuthStateChange
  }

  async function handleSignup() {
    clearMessages()
    if (!name.trim()) {
      setError('Digite o nome que vai aparecer no app')
      return
    }
    if (!email.trim()) {
      setError('Digite seu e-mail')
      return
    }
    if (password.length < 6) {
      setError('A senha precisa de ao menos 6 caracteres')
      return
    }
    if (password !== confirm) {
      setError('As senhas não são iguais')
      return
    }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim() } },
    })
    setLoading(false)
    if (error) {
      setError(traduzErro(error.message))
      return
    }
    if (!data.session) {
      setInfo('Conta criada! Confirme o e-mail que enviamos e depois entre.')
      setMode('login')
    }
    // se já veio sessão, o RootNavigator redireciona
  }

  function switchMode() {
    setMode(isSignup ? 'login' : 'signup')
    clearMessages()
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FadeInView style={styles.inner}>
          <SecretBox open={showPassword} />

          <Text style={styles.title}>Rotadesk</Text>
          <Text style={styles.subtitle}>
            {isSignup
              ? 'Crie sua conta de entregador'
              : 'Entre para gerenciar suas entregas'}
          </Text>

          <View style={styles.card}>
            {isSignup ? (
              <InputRow
                icon="person-outline"
                placeholder="Seu nome"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            ) : null}

            <InputRow
              icon="mail-outline"
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <PasswordRow
              placeholder="Sua senha"
              value={password}
              onChangeText={setPassword}
              show={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
            />

            {isSignup ? (
              <PasswordRow
                placeholder="Confirme a senha"
                value={confirm}
                onChangeText={setConfirm}
                show={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
              />
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {info ? <Text style={styles.info}>{info}</Text> : null}

            <GradientButton
              title={isSignup ? 'Criar conta' : 'Entrar'}
              loading={loading}
              onPress={isSignup ? handleSignup : handleLogin}
              style={{ marginTop: spacing.md }}
            />

            <TouchableOpacity onPress={switchMode}>
              <Text style={styles.switch}>
                {isSignup
                  ? 'Já tem conta? Entrar'
                  : 'Não tem conta? Criar conta'}
              </Text>
            </TouchableOpacity>
          </View>
        </FadeInView>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function InputRow({
  icon,
  ...rest
}: { icon: IoniconName } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.inputRow}>
      <Ionicons name={icon} size={20} color={colors.textFaint} />
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.textFaint}
        {...rest}
      />
    </View>
  )
}

function PasswordRow({
  placeholder,
  value,
  onChangeText,
  show,
  onToggle,
}: {
  placeholder: string
  value: string
  onChangeText: (t: string) => void
  show: boolean
  onToggle: () => void
}) {
  return (
    <View style={styles.inputRow}>
      <Ionicons name="lock-closed-outline" size={20} color={colors.textFaint} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!show}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity onPress={onToggle} hitSlop={10} testID="toggle-password">
        <Ionicons
          name={show ? 'eye' : 'eye-off'}
          size={20}
          color={colors.textMuted}
        />
      </TouchableOpacity>
    </View>
  )
}

// Mensagens do Supabase chegam em inglês; traduz as mais comuns.
function traduzErro(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos'
  if (m.includes('already registered')) return 'Esse e-mail já tem uma conta'
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar'
  if (m.includes('unable to validate email')) return 'E-mail inválido'
  return message
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  inner: { alignItems: 'center' },
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
    marginBottom: spacing.sm,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: colors.text },
  error: { color: colors.failed, marginTop: spacing.xs },
  info: { color: colors.delivered, marginTop: spacing.xs, fontWeight: '600' },
  switch: {
    textAlign: 'center',
    marginTop: spacing.lg,
    color: colors.primary,
    fontWeight: '700',
  },
})
