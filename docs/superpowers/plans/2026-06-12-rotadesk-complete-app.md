# Rotadesk — Plano de Implementação (App Completo)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar o Rotadesk completo e funcional — scanner de código de barras, cadastro de pacotes, geocoding + mapa, status de entrega, histórico, aviso por WhatsApp, backend Supabase com RLS, testes, README e git organizado.

**Architecture:** App Expo/React Native com navegação aninhada (Auth Stack → App Stack contendo Tabs + telas de Form/Detail). Lógica pura (geocoding, stats, mensagens, URLs) isolada em `src/utils` e `src/services`, testada com jest. Backend no Supabase (Postgres + RLS + edge function existente). Telas com módulos nativos (câmera, mapa) verificadas manualmente.

**Tech Stack:** Expo SDK 54.0.35, React Native 0.81, TypeScript, React Navigation 7, Supabase JS, expo-camera (barcode), react-native-maps, Google Geocoding API, Jest.

> **Nota de versão:** o projeto roda Expo SDK **54** (não v56). As APIs abaixo foram confirmadas na doc v54: `expo-camera` usa `CameraView` + `useCameraPermissions` + `onBarcodeScanned` (resultado `{ type, data }`); `react-native-maps` via `npx expo install` com chave Google no `app.json`.

> **Provider do mapa:** usamos o provider **padrão** (Google no Android, Apple no iOS) para funcionar em Expo Go nas duas plataformas. A chave Google no `app.json` é necessária para builds standalone Android e para o Geocoding. O botão "Navegar" sempre abre o Google Maps via deep link.

---

## Estrutura de arquivos

**Criar:**
- `src/types/package.ts` — tipos `Package`, `PackageStatus`, `PackageInput`
- `src/utils/stats.ts` — `computeStats`
- `src/utils/messages.ts` — `buildWhatsAppMessage`
- `src/utils/maps.ts` — `buildNavigationUrl`
- `src/services/packages.ts` — CRUD de pacotes (Supabase)
- `src/services/geocoding.ts` — `geocodeAddress` (Google)
- `src/services/notifications.ts` — `sendWhatsApp`
- `src/screens/ScannerScreen.tsx`
- `src/screens/PackageFormScreen.tsx`
- `src/screens/PackageDetailScreen.tsx`
- `src/screens/HistoryScreen.tsx`
- `src/navigation/AppNavigator.tsx` — native stack (Tabs + Form + Detail)
- `supabase/migrations/20260612000000_create_packages.sql`
- `src/utils/stats.test.ts`, `src/utils/messages.test.ts`, `src/utils/maps.test.ts`, `src/utils/phone.test.ts`, `src/services/geocoding.test.ts`
- `.gitignore`
- `README.md` (sobrescreve o existente)

**Modificar:**
- `src/types/navigation.ts` — adicionar `AppStackParamList`
- `src/navigation/RootNavigator.tsx` — usar `AppNavigator`
- `src/navigation/AppTabs.tsx` — telas reais (Home, Scanner, History)
- `src/screens/HomeScreen.tsx` — dados reais
- `app.json` — config de câmera + chave Google Maps
- `.env.example` — adicionar `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`

---

## Task 1: Dependências e configuração do projeto

**Files:**
- Modify: `package.json` (via expo install)
- Modify: `app.json`
- Modify: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Instalar as dependências nativas**

Run:
```bash
npx expo install expo-camera react-native-maps
```
Expected: `package.json` ganha `expo-camera` e `react-native-maps` nas versões compatíveis com o SDK 54; instala sem erro.

- [ ] **Step 2: Configurar `app.json`** (permissão de câmera + chave Google Maps)

Substituir o conteúdo de `app.json` por:

```json
{
  "expo": {
    "name": "rotadesk",
    "slug": "rotadesk",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "ios": {
      "supportsTablet": true,
      "infoPlist": {
        "NSCameraUsageDescription": "O Rotadesk usa a câmera para escanear o código de barras dos pacotes."
      },
      "config": {
        "googleMapsApiKey": "COLE_SUA_CHAVE_GOOGLE_MAPS"
      }
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/android-icon-foreground.png",
        "backgroundImage": "./assets/android-icon-background.png",
        "monochromeImage": "./assets/android-icon-monochrome.png"
      },
      "predictiveBackGestureEnabled": false,
      "permissions": ["CAMERA"],
      "config": {
        "googleMaps": {
          "apiKey": "COLE_SUA_CHAVE_GOOGLE_MAPS"
        }
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "O Rotadesk usa a câmera para escanear o código de barras dos pacotes."
        }
      ]
    ]
  }
}
```

- [ ] **Step 3: Atualizar `.env.example`**

Substituir o conteúdo por:

```
EXPO_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=<google-maps-api-key>
```

- [ ] **Step 4: Criar `.gitignore`**

Criar `.gitignore` com:

```gitignore
# Node / Expo
node_modules/
.expo/
dist/
web-build/
*.log
npm-debug.*

# Env
.env
.env.local

# Native
ios/
android/
*.orig.*

# Misc
.DS_Store

# Resíduos de Flutter (não fazem parte deste app Expo)
.dart_tool/
.flutter-plugins-dependencies
.metadata
analysis_options.yaml
pubspec.yaml
pubspec.lock
rotadesk.iml
lib/
windows/
build/
.idea/
```

- [ ] **Step 5: Verificar que o app ainda inicia (typecheck)**

Run:
```bash
npx tsc --noEmit
```
Expected: sem erros (as deps novas trazem tipos próprios).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json app.json .env.example .gitignore
git commit -m "chore: deps de camera/mapa, config Google Maps e gitignore"
```

---

## Task 2: Migration da tabela `packages` (Supabase + RLS)

**Files:**
- Create: `supabase/migrations/20260612000000_create_packages.sql`

- [ ] **Step 1: Criar o arquivo de migration**

Criar `supabase/migrations/20260612000000_create_packages.sql`:

```sql
-- Tabela de pacotes do entregador
create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tracking_code text,
  recipient_name text,
  recipient_phone text,
  address text,
  complement text,
  route text,
  latitude double precision,
  longitude double precision,
  status text not null default 'pending'
    check (status in ('pending', 'delivered', 'failed')),
  notes text,
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);

create index if not exists packages_user_status_idx
  on public.packages (user_id, status);
create index if not exists packages_user_created_idx
  on public.packages (user_id, created_at desc);

-- Row Level Security: cada entregador só acessa seus pacotes
alter table public.packages enable row level security;

create policy "Entregador le seus pacotes"
  on public.packages for select
  using (auth.uid() = user_id);

create policy "Entregador insere seus pacotes"
  on public.packages for insert
  with check (auth.uid() = user_id);

create policy "Entregador atualiza seus pacotes"
  on public.packages for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Entregador apaga seus pacotes"
  on public.packages for delete
  using (auth.uid() = user_id);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260612000000_create_packages.sql
git commit -m "feat: migration da tabela packages com RLS"
```

> **Nota de aplicação (manual, fora do plano de código):** rodar no projeto linkado com
> `npx supabase db push` (requer login no Supabase CLI) **ou** colar o SQL no
> SQL Editor do dashboard. Documentado no README.

---

## Task 3: Tipos (`package.ts` + navigation)

**Files:**
- Create: `src/types/package.ts`
- Modify: `src/types/navigation.ts`

- [ ] **Step 1: Criar `src/types/package.ts`**

```ts
export type PackageStatus = 'pending' | 'delivered' | 'failed'

export interface Package {
  id: string
  user_id: string
  tracking_code: string | null
  recipient_name: string | null
  recipient_phone: string | null
  address: string | null
  complement: string | null
  route: string | null
  latitude: number | null
  longitude: number | null
  status: PackageStatus
  notes: string | null
  created_at: string
  delivered_at: string | null
}

// Campos preenchidos no cadastro (o resto vem do banco/sessão)
export interface PackageInput {
  tracking_code: string
  recipient_name: string
  recipient_phone: string
  address: string
  complement: string
  route: string
  notes: string
  latitude: number | null
  longitude: number | null
}
```

- [ ] **Step 2: Substituir `src/types/navigation.ts`**

```ts
import type { NavigatorScreenParams } from '@react-navigation/native'

export type AuthStackParamList = {
  Login: undefined
}

export type AppTabsParamList = {
  Home: undefined
  Scanner: undefined
  History: undefined
}

export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<AppTabsParamList> | undefined
  PackageForm: { trackingCode: string }
  PackageDetail: { packageId: string }
}
```

- [ ] **Step 3: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros (telas/navegação antigas ainda compilam; tipos novos não quebram nada).

- [ ] **Step 4: Commit**

```bash
git add src/types/package.ts src/types/navigation.ts
git commit -m "feat: tipos de Package e param lists de navegacao"
```

---

## Task 4: Helper `computeStats` (TDD)

**Files:**
- Create: `src/utils/stats.ts`
- Test: `src/utils/stats.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/utils/stats.test.ts`:

```ts
import { computeStats } from './stats'

describe('computeStats', () => {
  it('conta pacotes por status', () => {
    const result = computeStats([
      { status: 'pending' },
      { status: 'pending' },
      { status: 'delivered' },
      { status: 'failed' },
    ])
    expect(result).toEqual({ pending: 2, delivered: 1, failed: 1 })
  })

  it('retorna zeros para lista vazia', () => {
    expect(computeStats([])).toEqual({ pending: 0, delivered: 0, failed: 0 })
  })
})
```

- [ ] **Step 2: Rodar o teste e confirmar a falha**

Run: `npm test -- stats`
Expected: FAIL com "Cannot find module './stats'".

- [ ] **Step 3: Implementar `src/utils/stats.ts`**

```ts
import type { PackageStatus } from '../types/package'

export interface PackageStats {
  pending: number
  delivered: number
  failed: number
}

export function computeStats(
  packages: { status: PackageStatus }[]
): PackageStats {
  return packages.reduce(
    (acc, pkg) => {
      acc[pkg.status] += 1
      return acc
    },
    { pending: 0, delivered: 0, failed: 0 } as PackageStats
  )
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npm test -- stats`
Expected: PASS (2 testes).

- [ ] **Step 5: Commit**

```bash
git add src/utils/stats.ts src/utils/stats.test.ts
git commit -m "feat: helper computeStats com testes"
```

---

## Task 5: Helpers `buildWhatsAppMessage`, `buildNavigationUrl` e teste de `formatPhone` (TDD)

**Files:**
- Create: `src/utils/messages.ts`, `src/utils/maps.ts`
- Test: `src/utils/messages.test.ts`, `src/utils/maps.test.ts`, `src/utils/phone.test.ts`

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/utils/messages.test.ts`:

```ts
import { buildWhatsAppMessage } from './messages'

describe('buildWhatsAppMessage', () => {
  it('monta mensagem de "a caminho" com o nome', () => {
    expect(buildWhatsAppMessage('Maria', 'on_the_way')).toBe(
      'Olá Maria! Seu pacote está a caminho e chega em breve. 🚚📦'
    )
  })

  it('monta mensagem de "entregue"', () => {
    expect(buildWhatsAppMessage('João', 'delivered')).toBe(
      'Olá João! Seu pacote foi entregue. Obrigado! ✅📦'
    )
  })

  it('usa saudação genérica quando não há nome', () => {
    expect(buildWhatsAppMessage('', 'on_the_way')).toBe(
      'Olá! Seu pacote está a caminho e chega em breve. 🚚📦'
    )
  })
})
```

Criar `src/utils/maps.test.ts`:

```ts
import { buildNavigationUrl } from './maps'

describe('buildNavigationUrl', () => {
  it('monta URL do Google Maps com coordenadas', () => {
    expect(buildNavigationUrl(-23.55, -46.63)).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=-23.55,-46.63'
    )
  })
})
```

Criar `src/utils/phone.test.ts`:

```ts
import { formatPhone } from './phone'

describe('formatPhone', () => {
  it('adiciona +55 e remove não-dígitos', () => {
    expect(formatPhone('(11) 99999-9999')).toBe('+5511999999999')
  })

  it('mantém o + quando já internacional', () => {
    expect(formatPhone('+1 555 123 4567')).toBe('+15551234567')
  })
})
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `npm test -- messages maps phone`
Expected: FAIL — `messages` e `maps` não existem; `phone` passa (função já existe).

- [ ] **Step 3: Implementar `src/utils/messages.ts`**

```ts
export type WhatsAppMessageKind = 'on_the_way' | 'delivered'

export function buildWhatsAppMessage(
  recipientName: string,
  kind: WhatsAppMessageKind
): string {
  const greeting = recipientName.trim()
    ? `Olá ${recipientName.trim()}!`
    : 'Olá!'

  const body =
    kind === 'on_the_way'
      ? 'Seu pacote está a caminho e chega em breve. 🚚📦'
      : 'Seu pacote foi entregue. Obrigado! ✅📦'

  return `${greeting} ${body}`
}
```

- [ ] **Step 4: Implementar `src/utils/maps.ts`**

```ts
export function buildNavigationUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
}
```

- [ ] **Step 5: Rodar e confirmar que passam**

Run: `npm test -- messages maps phone`
Expected: PASS (todos).

- [ ] **Step 6: Commit**

```bash
git add src/utils/messages.ts src/utils/messages.test.ts src/utils/maps.ts src/utils/maps.test.ts src/utils/phone.test.ts
git commit -m "feat: helpers de mensagem WhatsApp, URL de navegacao e testes"
```

---

## Task 6: Serviço de geocoding (TDD com fetch mockado)

**Files:**
- Create: `src/services/geocoding.ts`
- Test: `src/services/geocoding.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/services/geocoding.test.ts`:

```ts
import { geocodeAddress } from './geocoding'

describe('geocodeAddress', () => {
  const originalFetch = global.fetch
  afterEach(() => {
    global.fetch = originalFetch
  })

  it('retorna coordenadas quando a API responde OK', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        status: 'OK',
        results: [{ geometry: { location: { lat: -23.56, lng: -46.64 } } }],
      }),
    }) as unknown as typeof fetch

    const result = await geocodeAddress('Av. Paulista, 1000, São Paulo')
    expect(result).toEqual({ latitude: -23.56, longitude: -46.64 })
  })

  it('retorna null quando não há resultados', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ status: 'ZERO_RESULTS', results: [] }),
    }) as unknown as typeof fetch

    const result = await geocodeAddress('endereço inexistente')
    expect(result).toBeNull()
  })

  it('retorna null em caso de erro de rede', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network')) as unknown as typeof fetch
    const result = await geocodeAddress('qualquer')
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `npm test -- geocoding`
Expected: FAIL com "Cannot find module './geocoding'".

- [ ] **Step 3: Implementar `src/services/geocoding.ts`**

```ts
export interface Coordinates {
  latitude: number
  longitude: number
}

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''

export async function geocodeAddress(
  address: string
): Promise<Coordinates | null> {
  if (!address.trim()) return null

  const url =
    'https://maps.googleapis.com/maps/api/geocode/json' +
    `?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`

  try {
    const response = await fetch(url)
    const data = await response.json()
    if (data.status !== 'OK' || !data.results?.length) return null
    const { lat, lng } = data.results[0].geometry.location
    return { latitude: lat, longitude: lng }
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Rodar e confirmar que passam**

Run: `npm test -- geocoding`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add src/services/geocoding.ts src/services/geocoding.test.ts
git commit -m "feat: servico de geocoding via Google com testes"
```

---

## Task 7: Serviços de pacotes e notificações (Supabase)

**Files:**
- Create: `src/services/packages.ts`, `src/services/notifications.ts`

- [ ] **Step 1: Criar `src/services/packages.ts`**

```ts
import { supabase } from './supabase'
import type { Package, PackageInput, PackageStatus } from '../types/package'

export async function listPackages(
  filter?: PackageStatus | 'all'
): Promise<Package[]> {
  let query = supabase
    .from('packages')
    .select('*')
    .order('created_at', { ascending: false })

  if (filter && filter !== 'all') {
    query = query.eq('status', filter)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Package[]
}

export async function getPackage(id: string): Promise<Package | null> {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data as Package
}

export async function createPackage(input: PackageInput): Promise<Package> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Sessão expirada. Faça login novamente.')

  const { data, error } = await supabase
    .from('packages')
    .insert({ ...input, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  return data as Package
}

export async function updatePackageStatus(
  id: string,
  status: PackageStatus
): Promise<Package> {
  const delivered_at =
    status === 'pending' ? null : new Date().toISOString()

  const { data, error } = await supabase
    .from('packages')
    .update({ status, delivered_at })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Package
}
```

- [ ] **Step 2: Criar `src/services/notifications.ts`**

```ts
import { supabase } from './supabase'

export async function sendWhatsApp(
  phone: string,
  message: string
): Promise<void> {
  const { error } = await supabase.functions.invoke('send-whatsapp', {
    body: { phone, message },
  })
  if (error) throw error
}
```

- [ ] **Step 3: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/services/packages.ts src/services/notifications.ts
git commit -m "feat: servicos de CRUD de pacotes e envio de WhatsApp"
```

---

## Task 8: ScannerScreen

**Files:**
- Create: `src/screens/ScannerScreen.tsx`

- [ ] **Step 1: Criar `src/screens/ScannerScreen.tsx`**

```tsx
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
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/screens/ScannerScreen.tsx
git commit -m "feat: ScannerScreen com camera e fallback manual"
```

---

## Task 9: PackageFormScreen

**Files:**
- Create: `src/screens/PackageFormScreen.tsx`

- [ ] **Step 1: Criar `src/screens/PackageFormScreen.tsx`**

```tsx
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
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/screens/PackageFormScreen.tsx
git commit -m "feat: PackageFormScreen com geocoding e salvar"
```

---

## Task 10: PackageDetailScreen

**Files:**
- Create: `src/screens/PackageDetailScreen.tsx`

- [ ] **Step 1: Criar `src/screens/PackageDetailScreen.tsx`**

```tsx
import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../types/navigation'
import type { Package, PackageStatus } from '../types/package'
import { getPackage, updatePackageStatus } from '../services/packages'
import { sendWhatsApp } from '../services/notifications'
import { buildWhatsAppMessage } from '../utils/messages'
import { buildNavigationUrl } from '../utils/maps'

type Props = NativeStackScreenProps<AppStackParamList, 'PackageDetail'>

const STATUS_LABEL: Record<PackageStatus, string> = {
  pending: 'Pendente',
  delivered: 'Entregue',
  failed: 'Não entregue',
}
const STATUS_COLOR: Record<PackageStatus, string> = {
  pending: '#f59e0b',
  delivered: '#22c55e',
  failed: '#ef4444',
}

export default function PackageDetailScreen({ route }: Props) {
  const { packageId } = route.params
  const [pkg, setPkg] = useState<Package | null>(null)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)

  const load = useCallback(async () => {
    const data = await getPackage(packageId)
    setPkg(data)
    setLoading(false)
  }, [packageId])

  useEffect(() => {
    load()
  }, [load])

  async function changeStatus(status: PackageStatus) {
    setWorking(true)
    try {
      const updated = await updatePackageStatus(packageId, status)
      setPkg(updated)
    } catch (e) {
      Alert.alert('Erro', (e as Error).message)
    } finally {
      setWorking(false)
    }
  }

  async function notify(kind: 'on_the_way' | 'delivered') {
    if (!pkg?.recipient_phone) {
      Alert.alert('Sem telefone', 'Este pacote não tem telefone cadastrado.')
      return
    }
    setWorking(true)
    try {
      await sendWhatsApp(
        pkg.recipient_phone,
        buildWhatsAppMessage(pkg.recipient_name ?? '', kind)
      )
      Alert.alert('Enviado ✅', 'Mensagem enviada no WhatsApp.')
    } catch (e) {
      Alert.alert('Erro ao enviar', (e as Error).message)
    } finally {
      setWorking(false)
    }
  }

  function openNavigation() {
    if (pkg?.latitude != null && pkg?.longitude != null) {
      Linking.openURL(buildNavigationUrl(pkg.latitude, pkg.longitude))
    } else if (pkg?.address) {
      Linking.openURL(
        'https://www.google.com/maps/dir/?api=1&destination=' +
          encodeURIComponent(pkg.address)
      )
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  if (!pkg) {
    return (
      <View style={styles.center}>
        <Text>Pacote não encontrado.</Text>
      </View>
    )
  }

  const hasCoords = pkg.latitude != null && pkg.longitude != null

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      {hasCoords ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: pkg.latitude as number,
            longitude: pkg.longitude as number,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{
              latitude: pkg.latitude as number,
              longitude: pkg.longitude as number,
            }}
            title={pkg.recipient_name ?? 'Destino'}
            description={pkg.address ?? ''}
          />
        </MapView>
      ) : (
        <View style={[styles.map, styles.noMap]}>
          <Text style={styles.noMapText}>Sem localização no mapa</Text>
        </View>
      )}

      <View style={styles.body}>
        <View
          style={[styles.badge, { backgroundColor: STATUS_COLOR[pkg.status] }]}
        >
          <Text style={styles.badgeText}>{STATUS_LABEL[pkg.status]}</Text>
        </View>

        <Text style={styles.name}>{pkg.recipient_name || 'Sem nome'}</Text>
        <Text style={styles.address}>{pkg.address}</Text>
        {pkg.complement ? (
          <Text style={styles.meta}>Complemento: {pkg.complement}</Text>
        ) : null}
        {pkg.route ? <Text style={styles.meta}>Rota: {pkg.route}</Text> : null}
        <Text style={styles.meta}>Código: {pkg.tracking_code}</Text>
        {pkg.notes ? <Text style={styles.meta}>Obs: {pkg.notes}</Text> : null}

        <TouchableOpacity style={styles.navButton} onPress={openNavigation}>
          <Text style={styles.navButtonText}>🧭 Navegar até o endereço</Text>
        </TouchableOpacity>

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.smallButton, styles.whatsapp]}
            onPress={() => notify('on_the_way')}
            disabled={working}
          >
            <Text style={styles.smallButtonText}>Avisar: a caminho</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.smallButton, styles.whatsapp]}
            onPress={() => notify('delivered')}
            disabled={working}
          >
            <Text style={styles.smallButtonText}>Avisar: entregue</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.statusButton, { backgroundColor: '#22c55e' }]}
            onPress={() => changeStatus('delivered')}
            disabled={working}
          >
            <Text style={styles.statusButtonText}>✓ Entregue</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusButton, { backgroundColor: '#ef4444' }]}
            onPress={() => changeStatus('failed')}
            disabled={working}
          >
            <Text style={styles.statusButtonText}>✗ Não entregue</Text>
          </TouchableOpacity>
        </View>

        {pkg.status !== 'pending' ? (
          <TouchableOpacity
            style={styles.reopen}
            onPress={() => changeStatus('pending')}
            disabled={working}
          >
            <Text style={styles.reopenText}>Reabrir como pendente</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map: { width: '100%', height: 240 },
  noMap: {
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMapText: { color: '#64748b' },
  body: { padding: 16 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  name: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  address: { fontSize: 15, color: '#334155', marginTop: 4 },
  meta: { fontSize: 13, color: '#64748b', marginTop: 4 },
  navButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  navButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  row: { flexDirection: 'row', gap: 10, marginTop: 12 },
  smallButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  whatsapp: { backgroundColor: '#25D366' },
  smallButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  statusButton: {
    flex: 1,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  statusButtonText: { color: '#fff', fontWeight: '700' },
  reopen: { alignItems: 'center', marginTop: 16 },
  reopenText: { color: '#64748b', textDecorationLine: 'underline' },
})
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/screens/PackageDetailScreen.tsx
git commit -m "feat: PackageDetailScreen com mapa, navegar, WhatsApp e status"
```

---

## Task 11: HistoryScreen

**Files:**
- Create: `src/screens/HistoryScreen.tsx`

- [ ] **Step 1: Criar `src/screens/HistoryScreen.tsx`**

```tsx
import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { CompositeNavigationProp } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type {
  AppTabsParamList,
  AppStackParamList,
} from '../types/navigation'
import type { Package, PackageStatus } from '../types/package'
import { listPackages } from '../services/packages'

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabsParamList, 'History'>,
  NativeStackNavigationProp<AppStackParamList>
>

type Filter = 'all' | PackageStatus

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'delivered', label: 'Entregues' },
  { key: 'failed', label: 'Falhas' },
]

const STATUS_COLOR: Record<PackageStatus, string> = {
  pending: '#f59e0b',
  delivered: '#22c55e',
  failed: '#ef4444',
}

export default function HistoryScreen() {
  const navigation = useNavigation<Nav>()
  const [filter, setFilter] = useState<Filter>('all')
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setPackages(await listPackages(filter))
    } finally {
      setLoading(false)
    }
  }, [filter])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, filter === f.key && styles.chipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[
                styles.chipText,
                filter === f.key && styles.chipTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color="#3b82f6" />
      ) : (
        <FlatList
          data={packages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            packages.length === 0 ? styles.emptyWrap : styles.list
          }
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhum pacote nesta categoria.</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() =>
                navigation.navigate('PackageDetail', { packageId: item.id })
              }
            >
              <View
                style={[
                  styles.dot,
                  { backgroundColor: STATUS_COLOR[item.status] },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>
                  {item.recipient_name || 'Sem nome'}
                </Text>
                <Text style={styles.itemAddress} numberOfLines={1}>
                  {item.address || 'Sem endereço'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  filters: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  chipActive: { backgroundColor: '#3b82f6' },
  chipText: { color: '#475569', fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  list: { padding: 12 },
  emptyWrap: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#94a3b8' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  itemAddress: { fontSize: 13, color: '#64748b', marginTop: 2 },
})
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/screens/HistoryScreen.tsx
git commit -m "feat: HistoryScreen com filtros por status"
```

---

## Task 12: HomeScreen com dados reais

**Files:**
- Modify: `src/screens/HomeScreen.tsx`

- [ ] **Step 1: Substituir `src/screens/HomeScreen.tsx`**

```tsx
import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { CompositeNavigationProp } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'
import { listPackages } from '../services/packages'
import { computeStats, type PackageStats } from '../utils/stats'
import type { Package } from '../types/package'
import type {
  AppTabsParamList,
  AppStackParamList,
} from '../types/navigation'

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabsParamList, 'Home'>,
  NativeStackNavigationProp<AppStackParamList>
>

export default function HomeScreen() {
  const navigation = useNavigation<Nav>()
  const [session, setSession] = useState<Session | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [stats, setStats] = useState<PackageStats>({
    pending: 0,
    delivered: 0,
    failed: 0,
  })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    setSession(session)
    try {
      const all = await listPackages('all')
      setPackages(all)
      setStats(computeStats(all))
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  const pending = packages.filter((p) => p.status === 'pending')
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
          <Text style={styles.statNumber}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pendentes</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#22c55e' }]}>
            {stats.delivered}
          </Text>
          <Text style={styles.statLabel}>Entregues</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#ef4444' }]}>
            {stats.failed}
          </Text>
          <Text style={styles.statLabel}>Não entregues</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color="#3b82f6" />
      ) : pending.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Nenhum pacote pendente</Text>
          <Text style={styles.emptySubtitle}>
            Escaneie os pacotes do dia para gerar sua rota
          </Text>
        </View>
      ) : (
        <FlatList
          data={pending}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() =>
                navigation.navigate('PackageDetail', { packageId: item.id })
              }
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>
                  {item.recipient_name || 'Sem nome'}
                </Text>
                <Text style={styles.itemAddress} numberOfLines={1}>
                  {item.address || 'Sem endereço'}
                </Text>
                {item.route ? (
                  <Text style={styles.itemRoute}>{item.route}</Text>
                ) : null}
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.ctaButton}
        onPress={() => navigation.navigate('Scanner')}
      >
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
  list: { padding: 16 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  itemName: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  itemAddress: { fontSize: 13, color: '#64748b', marginTop: 2 },
  itemRoute: { fontSize: 12, color: '#3b82f6', marginTop: 2 },
  chevron: { fontSize: 24, color: '#cbd5e1' },
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

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/screens/HomeScreen.tsx
git commit -m "feat: HomeScreen com stats reais e lista de pendentes"
```

---

## Task 13: Wiring da navegação (AppNavigator + Tabs + Root)

**Files:**
- Create: `src/navigation/AppNavigator.tsx`
- Modify: `src/navigation/AppTabs.tsx`
- Modify: `src/navigation/RootNavigator.tsx`

- [ ] **Step 1: Substituir `src/navigation/AppTabs.tsx`** (telas reais)

```tsx
import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import type { AppTabsParamList } from '../types/navigation'
import HomeScreen from '../screens/HomeScreen'
import ScannerScreen from '../screens/ScannerScreen'
import HistoryScreen from '../screens/HistoryScreen'

const Tab = createBottomTabNavigator<AppTabsParamList>()

export default function AppTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Início' }}
      />
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{ title: 'Escanear' }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: 'Histórico' }}
      />
    </Tab.Navigator>
  )
}
```

- [ ] **Step 2: Criar `src/navigation/AppNavigator.tsx`**

```tsx
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../types/navigation'
import AppTabs from './AppTabs'
import PackageFormScreen from '../screens/PackageFormScreen'
import PackageDetailScreen from '../screens/PackageDetailScreen'

const Stack = createNativeStackNavigator<AppStackParamList>()

export default function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        component={AppTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PackageForm"
        component={PackageFormScreen}
        options={{ title: 'Cadastrar pacote' }}
      />
      <Stack.Screen
        name="PackageDetail"
        component={PackageDetailScreen}
        options={{ title: 'Detalhes do pacote' }}
      />
    </Stack.Navigator>
  )
}
```

- [ ] **Step 3: Substituir `src/navigation/RootNavigator.tsx`** (usar AppNavigator)

```tsx
import React, { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'
import AuthStack from './AuthStack'
import AppNavigator from './AppNavigator'

export default function RootNavigator() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session)
        setLoading(false)
      })
      .catch(() => {
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

  return session ? <AppNavigator /> : <AuthStack />
}
```

- [ ] **Step 4: Verificar typecheck e testes**

Run: `npx tsc --noEmit && npm test`
Expected: sem erros de tipo; todos os testes passam.

- [ ] **Step 5: Commit**

```bash
git add src/navigation/AppNavigator.tsx src/navigation/AppTabs.tsx src/navigation/RootNavigator.tsx
git commit -m "feat: wiring de navegacao com stack de pacotes"
```

---

## Task 14: README completo

**Files:**
- Create/overwrite: `README.md`

- [ ] **Step 1: Sobrescrever `README.md`**

````markdown
# 📦 Rotadesk

App mobile para **entregadores** organizarem suas entregas do dia. O entregador
faz login por telefone, **escaneia o código de barras** de cada pacote, cadastra
os dados de entrega, vê o endereço **no mapa**, navega até o destino e marca cada
entrega como concluída — podendo ainda **avisar o destinatário por WhatsApp**.

## ✨ Funcionalidades

- 🔐 Login por telefone com código OTP (Supabase Auth)
- 📷 Scanner de código de barras (câmera) com fallback de digitação manual
- 📝 Cadastro de pacote: destinatário, telefone, endereço, complemento, rota, observações
- 🗺️ Geocoding do endereço (Google) + mapa embutido com marcador
- 🧭 Botão "Navegar" que abre o Google Maps
- ✅ Marcar entrega como entregue / não entregue
- 💬 Aviso ao destinatário via WhatsApp (Z-API)
- 📊 Home com estatísticas do dia e lista de pendentes
- 🕓 Histórico com filtros por status

## 🧱 Stack

- **App:** Expo SDK 54, React Native 0.81, TypeScript
- **Navegação:** React Navigation 7
- **Backend:** Supabase (Auth, Postgres + RLS, Edge Functions)
- **Scanner:** expo-camera
- **Mapa:** react-native-maps + Google Geocoding API
- **WhatsApp:** Edge Function `send-whatsapp` (Z-API)
- **Testes:** Jest

## ✅ Pré-requisitos

- Node 18+
- Conta no [Supabase](https://supabase.com) (projeto já linkado: `wpngyexzekruzmukcljo`)
- Chave da **Google Maps API** com *Maps SDK (Android/iOS)* e *Geocoding API* ativados
- (Opcional, para WhatsApp) conta na **Z-API**
- App **Expo Go** no celular (ou um *development build*)

## 🚀 Como rodar

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# edite .env com suas chaves:
#   EXPO_PUBLIC_SUPABASE_URL
#   EXPO_PUBLIC_SUPABASE_ANON_KEY
#   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY

# 3. Iniciar
npm start
```

Leia o QR code com o **Expo Go**. Para builds standalone (Android), cole a chave
do Google Maps também no `app.json` (`android.config.googleMaps.apiKey`).

> **Mapa:** em Expo Go o mapa usa Google no Android e Apple no iOS. Para o mapa
> Google em build standalone iOS/Android, a chave no `app.json` é obrigatória.

## 🗄️ Banco de dados

Aplique a migration no projeto Supabase:

```bash
npx supabase db push
```

…ou cole o conteúdo de `supabase/migrations/20260612000000_create_packages.sql`
no **SQL Editor** do dashboard. A tabela `packages` usa **RLS**: cada entregador
só enxerga os próprios pacotes.

### Tabela `packages`

| Coluna | Tipo | Descrição |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | dono (entregador) |
| tracking_code | text | código do código de barras |
| recipient_name | text | destinatário |
| recipient_phone | text | telefone (WhatsApp) |
| address | text | endereço |
| complement | text | complemento |
| route | text | rota |
| latitude / longitude | float8 | coordenadas |
| status | text | pending / delivered / failed |
| notes | text | observações |
| created_at / delivered_at | timestamptz | datas |

## 💬 WhatsApp (Edge Function)

A função `supabase/functions/send-whatsapp` usa a Z-API. Configure os secrets:

```bash
npx supabase secrets set ZAPI_INSTANCE_ID=... ZAPI_TOKEN=... ZAPI_CLIENT_TOKEN=...
npx supabase functions deploy send-whatsapp
```

## 🔐 Autenticação (OTP)

No dashboard do Supabase, habilite o provedor **Phone** em *Authentication →
Providers* e configure um gateway de SMS (ex: Twilio). Sem isso, o envio de OTP
não funciona.

## 🧪 Testes

```bash
npm test
```

Cobrem a lógica pura: formatação de telefone, geocoding (fetch mockado),
contagem de stats, mensagens de WhatsApp e URL de navegação.

## 📁 Estrutura

```
src/
├── navigation/   RootNavigator, AuthStack, AppNavigator, AppTabs
├── screens/      Login, Home, Scanner, PackageForm, PackageDetail, History
├── services/     supabase, packages, geocoding, notifications
├── utils/        phone, stats, messages, maps
└── types/        navigation, package
supabase/
├── functions/    send-whatsapp (Edge Function)
└── migrations/   create_packages.sql
```

## 🗺️ Roadmap

- Otimização automática da ordem de entrega (rota ótima)
- Foto de comprovação de entrega
- Integração com APIs de transportadoras
- Painel web administrativo

## 📄 Licença

MIT
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README completo do Rotadesk"
```

---

## Task 15: Verificação final

**Files:** nenhum (validação)

- [ ] **Step 1: Rodar typecheck e todos os testes**

Run: `npx tsc --noEmit && npm test`
Expected: zero erros de tipo; todos os testes passam.

- [ ] **Step 2: Subir o app e validar manualmente (smoke test)**

Run: `npm start`

Checklist manual (Expo Go ou dev build):
- [ ] Login por OTP entra no app
- [ ] Aba "Escanear" abre a câmera (ou pede permissão) e lê um código
- [ ] Form salva o pacote; "Buscar no mapa" acha coordenadas
- [ ] Detalhe mostra o mapa com marcador; "Navegar" abre o Google Maps
- [ ] "Entregue/Não entregue" muda o status e volta refletido na Home
- [ ] "Avisar no WhatsApp" envia (se Z-API configurada)
- [ ] Histórico filtra por status

- [ ] **Step 3: (Opcional) Limpeza dos resíduos de Flutter**

Confirmar com o usuário antes de apagar. Esses arquivos já estão no `.gitignore`
e não fazem parte do app Expo:
`lib/`, `windows/`, `build/`, `.dart_tool/`, `pubspec.yaml`, `pubspec.lock`,
`.flutter-plugins-dependencies`, `.metadata`, `analysis_options.yaml`, `rotadesk.iml`.

---

## Self-Review (cobertura da spec)

- ✅ Login OTP — mantido (Task 13 preserva AuthStack/Login)
- ✅ Scanner com câmera + fallback manual — Task 8
- ✅ Cadastro de pacote (todos os campos) — Task 9
- ✅ Geocoding Google — Task 6 + uso na Task 9
- ✅ Mapa embutido + Navegar — Task 10
- ✅ Status entregue/não entregue + delivered_at — Task 7 (service) + Task 10 (UI)
- ✅ WhatsApp — Task 7 (service) + Task 10 (UI), function já existe
- ✅ Home stats reais + lista — Task 12
- ✅ Histórico com filtro — Task 11
- ✅ Migration packages + RLS — Task 2
- ✅ Testes (phone, geocoding, stats, messages, maps) — Tasks 4, 5, 6
- ✅ README completo — Task 14
- ✅ `.env.example` + `.gitignore` + config — Task 1
- ✅ Limpeza Flutter — Task 1 (gitignore) + Task 15 (remoção opcional)
- ✅ Git: um commit por feature — todas as tasks
