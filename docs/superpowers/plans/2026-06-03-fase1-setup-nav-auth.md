# Rotadesk Fase 1 — Setup + Navegação + Autenticação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar o projeto Expo com React Navigation (AuthStack + AppTabs) e autenticação OTP via telefone usando Supabase, com sessão persistente entre aberturas do app.

**Architecture:** `App.tsx` monta `NavigationContainer` + `RootNavigator`. `RootNavigator` escuta a sessão Supabase via `onAuthStateChange` e renderiza `AuthStack` (sem sessão) ou `AppTabs` (com sessão) — sem `navigation.navigate()` manual para redirecionar. `LoginScreen` gerencia o fluxo OTP de dois passos. `HomeScreen` é um placeholder funcional com logout.

**Tech Stack:** React Native + Expo SDK (TypeScript, blank-typescript), React Navigation v6 (`native-stack` + `bottom-tabs`), Supabase JS v2, `@react-native-async-storage/async-storage`, `react-native-url-polyfill`

---

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `App.tsx` | Entry point — `NavigationContainer` + `RootNavigator` |
| `src/navigation/RootNavigator.tsx` | Escuta sessão Supabase, decide entre AuthStack e AppTabs |
| `src/navigation/AuthStack.tsx` | Native stack com LoginScreen |
| `src/navigation/AppTabs.tsx` | Bottom tabs: Home (ativo) + Scanner/Histórico (placeholders) |
| `src/screens/LoginScreen.tsx` | Fluxo OTP: telefone → código SMS |
| `src/screens/HomeScreen.tsx` | Stats zerados + CTA + botão Sair |
| `src/services/supabase.ts` | Cliente Supabase com AsyncStorage |
| `src/types/navigation.ts` | `AuthStackParamList`, `AppTabsParamList` |
| `src/utils/phone.ts` | `formatPhone()` — normaliza para E.164 |
| `__tests__/phone.test.ts` | Testes de `formatPhone` |
| `__tests__/LoginScreen.test.tsx` | Testes de fluxo OTP e transição de passos |
| `.env` | Credenciais Supabase (nunca commitado) |
| `.env.example` | Template de variáveis |

---

## Task 1: Inicializar projeto Expo

**Files:**
- Create: `package.json`, `tsconfig.json`, `app.json`, `babel.config.js`, `App.tsx`, `.gitignore`

- [ ] **Step 1: Inicializar projeto no diretório existente**

No terminal, dentro de `C:\Users\wills\OneDrive\Documentos\rotadesk`:

```bash
npx create-expo-app@latest . --template blank-typescript
```

Quando perguntado se quer criar no diretório existente, confirme com `y`.

- [ ] **Step 2: Verificar que o projeto sobe**

```bash
npx expo start
```

Esperado: QR code aparece no terminal. Escaneie com o app **Expo Go** no celular. Deve aparecer "Open up App.tsx to start working on your app!".

Feche o servidor com `Ctrl+C` após confirmar.

- [ ] **Step 3: Commit do scaffold**

```bash
git add app.json babel.config.js tsconfig.json package.json package-lock.json App.tsx .gitignore assets/
git commit -m "chore: inicializar projeto Expo blank-typescript"
```

---

## Task 2: Instalar dependências

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Instalar React Navigation**

```bash
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context
```

- [ ] **Step 2: Instalar Supabase e dependências**

```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
```

- [ ] **Step 3: Instalar dependências de teste**

```bash
npm install --save-dev @testing-library/react-native @testing-library/jest-native
```

- [ ] **Step 4: Verificar que o projeto ainda sobe**

```bash
npx expo start
```

Esperado: QR code aparece sem erros no terminal. Feche com `Ctrl+C`.

- [ ] **Step 5: Commit das dependências**

```bash
git add package.json package-lock.json
git commit -m "chore: instalar react-navigation, supabase e dependências de teste"
```

---

## Task 3: Configurar Supabase

**Files:**
- Create: `.env`, `.env.example`, `src/services/supabase.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Obter credenciais do Supabase**

1. Acesse [supabase.com](https://supabase.com) → seu projeto rotadesk
2. Vá em **Project Settings → API**
3. Copie **Project URL** e **anon public key**

- [ ] **Step 2: Criar `.env`**

Crie o arquivo `.env` na raiz do projeto (nunca commitar este arquivo):

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Substitua pelos valores reais do seu projeto.

- [ ] **Step 3: Criar `.env.example`**

```
EXPO_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

- [ ] **Step 4: Garantir que `.env` está no `.gitignore`**

Abra `.gitignore` e verifique se há uma linha `.env`. Se não houver, adicione:

```
.env
```

- [ ] **Step 5: Criar `src/services/supabase.ts`**

```typescript
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

- [ ] **Step 6: Habilitar Phone Auth no Supabase**

1. No painel Supabase → **Authentication → Providers**
2. Ative **Phone** (precisa de Twilio ou MessageBird para SMS real)
3. Para desenvolvimento sem SMS, anote: Supabase permite um OTP fixo `123456` quando "SMS Provider" não está configurado (modo test)

- [ ] **Step 7: Commit**

```bash
git add .env.example .gitignore src/services/supabase.ts
git commit -m "feat: configurar cliente Supabase com AsyncStorage"
```

---

## Task 4: Utilitário de telefone + teste

**Files:**
- Create: `src/utils/phone.ts`, `__tests__/phone.test.ts`

- [ ] **Step 1: Escrever o teste**

Crie `__tests__/phone.test.ts`:

```typescript
import { formatPhone } from '../src/utils/phone'

describe('formatPhone', () => {
  it('adiciona +55 quando não tem prefixo', () => {
    expect(formatPhone('11999999999')).toBe('+5511999999999')
  })

  it('remove caracteres não numéricos antes de adicionar +55', () => {
    expect(formatPhone('(11) 99999-9999')).toBe('+5511999999999')
  })

  it('mantém o + quando já está no formato E.164', () => {
    expect(formatPhone('+5511999999999')).toBe('+5511999999999')
  })

  it('não duplica +55 se o usuário digitar', () => {
    expect(formatPhone('+55 (11) 99999-9999')).toBe('+5511999999999')
  })
})
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

```bash
npx jest __tests__/phone.test.ts --no-coverage
```

Esperado: FAIL — `Cannot find module '../src/utils/phone'`

- [ ] **Step 3: Criar `src/utils/phone.ts`**

```typescript
export function formatPhone(phone: string): string {
  if (phone.startsWith('+')) {
    return '+' + phone.replace(/\D/g, '')
  }
  return '+55' + phone.replace(/\D/g, '')
}
```

- [ ] **Step 4: Rodar o teste para confirmar que passa**

```bash
npx jest __tests__/phone.test.ts --no-coverage
```

Esperado: PASS — 4 testes passando

- [ ] **Step 5: Commit**

```bash
git add src/utils/phone.ts __tests__/phone.test.ts
git commit -m "feat: utilitário formatPhone com testes"
```

---

## Task 5: Tipos de navegação

**Files:**
- Create: `src/types/navigation.ts`

- [ ] **Step 1: Criar `src/types/navigation.ts`**

```typescript
export type AuthStackParamList = {
  Login: undefined
}

export type AppTabsParamList = {
  Home: undefined
  Scanner: undefined
  History: undefined
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/navigation.ts
git commit -m "feat: tipos de navegação AuthStack e AppTabs"
```

---

## Task 6: AuthStack

**Files:**
- Create: `src/navigation/AuthStack.tsx`

> `LoginScreen` ainda não existe — o TypeScript vai reclamar. Isso é esperado; será resolvido na Task 10. Expo roda normalmente apesar dos erros de tipo.

- [ ] **Step 1: Criar `src/navigation/AuthStack.tsx`**

```typescript
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { AuthStackParamList } from '../types/navigation'
import LoginScreen from '../screens/LoginScreen'

const Stack = createNativeStackNavigator<AuthStackParamList>()

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/navigation/AuthStack.tsx
git commit -m "feat: AuthStack com LoginScreen"
```

---

## Task 7: AppTabs

**Files:**
- Create: `src/navigation/AppTabs.tsx`

> `HomeScreen` ainda não existe — o TypeScript vai reclamar. Será resolvido na Task 11. Expo roda normalmente apesar dos erros de tipo.

- [ ] **Step 1: Criar `src/navigation/AppTabs.tsx`**

```typescript
import React from 'react'
import { View, Text } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { AppTabsParamList } from '../types/navigation'
import HomeScreen from '../screens/HomeScreen'

const Tab = createBottomTabNavigator<AppTabsParamList>()

function PlaceholderScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Em breve</Text>
    </View>
  )
}

export default function AppTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Início' }}
      />
      <Tab.Screen
        name="Scanner"
        component={PlaceholderScreen}
        options={{ title: 'Scanner' }}
      />
      <Tab.Screen
        name="History"
        component={PlaceholderScreen}
        options={{ title: 'Histórico' }}
      />
    </Tab.Navigator>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/navigation/AppTabs.tsx
git commit -m "feat: AppTabs com Home e placeholders Scanner/Histórico"
```

---

## Task 8: RootNavigator

**Files:**
- Create: `src/navigation/RootNavigator.tsx`

- [ ] **Step 1: Criar `src/navigation/RootNavigator.tsx`**

```typescript
import React, { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'
import AuthStack from './AuthStack'
import AppTabs from './AppTabs'

export default function RootNavigator() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return null

  return session ? <AppTabs /> : <AuthStack />
}
```

- [ ] **Step 2: Commit**

```bash
git add src/navigation/RootNavigator.tsx
git commit -m "feat: RootNavigator com session listener Supabase"
```

---

## Task 9: Atualizar App.tsx

**Files:**
- Modify: `App.tsx`

- [ ] **Step 1: Substituir conteúdo de `App.tsx`**

```typescript
import 'react-native-url-polyfill/auto'
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import RootNavigator from './src/navigation/RootNavigator'

export default function App() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add App.tsx
git commit -m "feat: App.tsx com NavigationContainer e RootNavigator"
```

---

## Task 10: LoginScreen

**Files:**
- Create: `src/screens/LoginScreen.tsx`, `__tests__/LoginScreen.test.tsx`

- [ ] **Step 1: Escrever os testes**

Crie `__tests__/LoginScreen.test.tsx`:

```typescript
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import LoginScreen from '../src/screens/LoginScreen'

jest.mock('../src/services/supabase', () => ({
  supabase: {
    auth: {
      signInWithOtp: jest.fn(),
      verifyOtp: jest.fn(),
    },
  },
}))

import { supabase } from '../src/services/supabase'
const mockSignInWithOtp = supabase.auth.signInWithOtp as jest.Mock
const mockVerifyOtp = supabase.auth.verifyOtp as jest.Mock

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renderiza o input de telefone no passo 1', () => {
    const { getByPlaceholderText } = render(<LoginScreen />)
    expect(getByPlaceholderText('(11) 99999-9999')).toBeTruthy()
  })

  it('avança para o passo OTP após envio bem-sucedido', async () => {
    mockSignInWithOtp.mockResolvedValueOnce({ error: null })
    const { getByPlaceholderText, getByText } = render(<LoginScreen />)

    fireEvent.changeText(getByPlaceholderText('(11) 99999-9999'), '11999999999')
    fireEvent.press(getByText('Enviar código'))

    await waitFor(() => {
      expect(getByPlaceholderText('Código de 6 dígitos')).toBeTruthy()
    })
  })

  it('exibe erro inline quando signInWithOtp falha', async () => {
    mockSignInWithOtp.mockResolvedValueOnce({ error: { message: 'Telefone inválido' } })
    const { getByPlaceholderText, getByText } = render(<LoginScreen />)

    fireEvent.changeText(getByPlaceholderText('(11) 99999-9999'), '123')
    fireEvent.press(getByText('Enviar código'))

    await waitFor(() => {
      expect(getByText('Telefone inválido')).toBeTruthy()
    })
  })

  it('volta para o passo 1 ao pressionar Voltar', async () => {
    mockSignInWithOtp.mockResolvedValueOnce({ error: null })
    const { getByPlaceholderText, getByText } = render(<LoginScreen />)

    fireEvent.changeText(getByPlaceholderText('(11) 99999-9999'), '11999999999')
    fireEvent.press(getByText('Enviar código'))

    await waitFor(() => getByText('← Voltar'))
    fireEvent.press(getByText('← Voltar'))

    await waitFor(() => {
      expect(getByPlaceholderText('(11) 99999-9999')).toBeTruthy()
    })
  })
})
```

- [ ] **Step 2: Rodar os testes para confirmar que falham**

```bash
npx jest __tests__/LoginScreen.test.tsx --no-coverage
```

Esperado: FAIL — `Cannot find module '../src/screens/LoginScreen'`

- [ ] **Step 3: Criar `src/screens/LoginScreen.tsx`**

```typescript
import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { supabase } from '../services/supabase'
import { formatPhone } from '../utils/phone'

type Step = 'phone' | 'otp'

export default function LoginScreen() {
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSendOtp() {
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      phone: formatPhone(phone),
    })
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
    const { error } = await supabase.auth.verifyOtp({
      phone: formatPhone(phone),
      token: otp,
      type: 'sms',
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    }
    // Sucesso: RootNavigator redireciona via onAuthStateChange automaticamente
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rotadesk</Text>

      {step === 'phone' ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="(11) 99999-9999"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoFocus
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity
            style={styles.button}
            onPress={handleSendOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Enviar código</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Código de 6 dígitos"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity
            style={styles.button}
            onPress={handleVerifyOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setStep('phone')
              setError('')
            }}
          >
            <Text style={styles.back}>← Voltar</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  error: { color: '#ef4444', marginBottom: 8 },
  back: { textAlign: 'center', marginTop: 16, color: '#64748b' },
})
```

- [ ] **Step 4: Rodar os testes para confirmar que passam**

```bash
npx jest __tests__/LoginScreen.test.tsx --no-coverage
```

Esperado: PASS — 4 testes passando

- [ ] **Step 5: Commit**

```bash
git add src/screens/LoginScreen.tsx __tests__/LoginScreen.test.tsx
git commit -m "feat: LoginScreen com fluxo OTP de dois passos"
```

---

## Task 11: HomeScreen

**Files:**
- Create: `src/screens/HomeScreen.tsx`

- [ ] **Step 1: Criar `src/screens/HomeScreen.tsx`**

```typescript
import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'

export default function HomeScreen() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    // RootNavigator redireciona para AuthStack via onAuthStateChange
  }

  const displayName = session?.user.phone ?? 'Entregador'

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá,</Text>
          <Text style={styles.name}>{displayName}</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.signOut}>Sair</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Pendentes</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#22c55e' }]}>0</Text>
          <Text style={styles.statLabel}>Entregues</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#f59e0b' }]}>0</Text>
          <Text style={styles.statLabel}>Não entregues</Text>
        </View>
      </View>

      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Nenhum pacote escaneado</Text>
        <Text style={styles.emptySubtitle}>
          Escaneie os pacotes do dia para gerar sua rota
        </Text>
      </View>

      <TouchableOpacity style={styles.ctaButton}>
        <Text style={styles.ctaText}>Escanear Pacotes</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  greeting: { fontSize: 12, color: '#64748b' },
  name: { fontSize: 18, fontWeight: '700' },
  signOut: { fontSize: 14, color: '#64748b' },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  divider: { width: 1, height: 40, backgroundColor: '#e2e8f0' },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: '#64748b', textAlign: 'center' },
  ctaButton: {
    margin: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/HomeScreen.tsx
git commit -m "feat: HomeScreen com stats, empty state e logout"
```

---

## Task 12: Verificação no dispositivo

- [ ] **Step 1: Rodar todos os testes**

```bash
npx jest --no-coverage
```

Esperado: PASS — todos os testes passando (phone + LoginScreen)

- [ ] **Step 2: Subir o app**

```bash
npx expo start
```

- [ ] **Step 3: Testar fluxo de login no Expo Go**

1. Abra o **Expo Go** no celular e escaneie o QR code
2. Deve aparecer a **LoginScreen** (sem sessão ativa)
3. Digite seu número de telefone
4. Pressione "Enviar código"
5. Se Twilio não estiver configurado, use OTP `123456` (modo test do Supabase)
6. Digite o código e pressione "Entrar"
7. Deve redirecionar para a **HomeScreen** com o número do telefone no header
8. Pressione "Sair" — deve voltar para **LoginScreen**
9. Feche e reabra o Expo Go — deve ir direto para a **HomeScreen** (sessão persistida)

- [ ] **Step 4: Push para o GitHub**

```bash
git push origin main
```

---

## Checklist de cobertura

| Requisito do spec | Task |
|------------------|------|
| Projeto Expo TypeScript | Task 1 |
| Estrutura `src/` | Tasks 3–11 |
| React Navigation AuthStack + AppTabs | Tasks 6, 7, 8, 9 |
| Cliente Supabase com AsyncStorage | Task 3 |
| LoginScreen OTP dois passos | Task 10 |
| HomeScreen funcional com logout | Task 11 |
| Sessão persistente | Task 3 (persistSession: true) + Task 12 step 3 item 9 |
| Tabs Scanner/Histórico desabilitados | Task 7 (PlaceholderScreen) |
