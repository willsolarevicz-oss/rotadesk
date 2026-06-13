# Rotadesk — App completo para entregadores

**Data:** 2026-06-12
**Status:** Design aprovado, pronto para plano de implementação

## Visão geral

Rotadesk é um app mobile (Expo / React Native) para entregadores autônomos
organizarem suas entregas do dia. O entregador faz login por telefone (OTP),
**escaneia o código de barras** de cada pacote, cadastra os dados de entrega
(nome do destinatário, telefone, endereço, rota), o app **geocodifica o endereço
e mostra no mapa**, e depois o entregador **marca cada entrega como concluída ou
não**. Opcionalmente, avisa o destinatário por **WhatsApp**.

O objetivo desta entrega é deixar o app **completo e funcional**: scanner +
mapa + CRUD de pacotes + histórico + WhatsApp, com backend Supabase versionado,
testes, README e histórico de git organizado.

## Objetivos

- Login por OTP (telefone) — **já existe**, manter.
- Escanear código de barras de pacotes com a câmera (com fallback de digitação manual).
- Cadastrar pacote: destinatário, telefone, endereço, complemento, rota, observações.
- Geocodificar o endereço (Google Geocoding) e exibir em mapa embutido (Google).
- Botão "Navegar" abrindo o app de mapas nativo (Google Maps/Waze) com a rota.
- Marcar entrega como `entregue` / `não entregue`, com data/hora.
- Avisar o destinatário por WhatsApp (via edge function `send-whatsapp` / Z-API).
- Home com estatísticas reais (pendentes / entregues / falhas) e lista do dia.
- Histórico com filtro por status.
- Backend Supabase: tabela `packages` + RLS + migration versionada.
- Testes (jest) da lógica pura.
- README completo e `.env.example` atualizado.
- Limpeza do repositório (resíduos de Flutter) e `.gitignore` adequado.

## Não-objetivos (YAGNI — ficam para evolução futura)

- Otimização automática de rota (ordem ótima de entrega / TSP). A "rota" é, por
  ora, um campo de texto e os pendentes são ordenados de forma simples.
- Integração com APIs de transportadoras (Correios, Jadlog) para puxar dados do
  pacote automaticamente. O código de barras fornece **apenas o código de rastreio**;
  os demais dados são preenchidos pelo entregador.
- Multi-idioma. O app é **em português**.
- Painel web / área administrativa.
- Foto de comprovação de entrega.

## Stack técnica

| Camada | Tecnologia |
|---|---|
| App | Expo SDK 54, React Native 0.81, TypeScript |
| Navegação | React Navigation 7 (native-stack + bottom-tabs) — já instalado |
| Auth + Backend | Supabase (auth OTP por telefone, Postgres, RLS, edge functions) |
| Scanner | `expo-camera` (`CameraView` com `onBarcodeScanned`) |
| Geocoding | Google Geocoding API (via `fetch`) |
| Mapa | `react-native-maps` (provider Google) |
| Navegação externa | `expo-linking` / `Linking` (deep link para Google Maps) |
| WhatsApp | edge function `send-whatsapp` (Z-API) — já existe |
| Testes | Jest + @testing-library/react-native — já instalado |

> **Nota Expo:** `expo-barcode-scanner` está descontinuado no SDK 54; a leitura
> de código de barras agora é feita pelo `expo-camera`. Antes de codar, conferir
> a documentação versionada do Expo (conforme AGENTS.md) para as APIs exatas de
> `expo-camera` e `react-native-maps` na versão instalada.

## Modelo de dados (Supabase)

Tabela **`public.packages`**:

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK, `default gen_random_uuid()` |
| `user_id` | `uuid` | FK → `auth.users(id)`, `not null` (o entregador) |
| `tracking_code` | `text` | código lido do código de barras |
| `recipient_name` | `text` | nome do destinatário |
| `recipient_phone` | `text` | telefone do destinatário (para WhatsApp), nullable |
| `address` | `text` | endereço completo |
| `complement` | `text` | complemento/referência, nullable |
| `route` | `text` | rota/região, nullable |
| `latitude` | `float8` | coordenada geocodificada, nullable |
| `longitude` | `float8` | coordenada geocodificada, nullable |
| `status` | `text` | `pending` \| `delivered` \| `failed`, default `pending` |
| `notes` | `text` | observações, nullable |
| `created_at` | `timestamptz` | default `now()` |
| `delivered_at` | `timestamptz` | preenchido ao marcar entregue/falha, nullable |

**Índices:** `(user_id, status)` e `(user_id, created_at)` para as consultas da Home/Histórico.

**Constraint:** `status` com `check (status in ('pending','delivered','failed'))`.

**RLS (Row Level Security) habilitada** com políticas:

- `select`: `auth.uid() = user_id`
- `insert`: `auth.uid() = user_id` (with check)
- `update`: `auth.uid() = user_id`
- `delete`: `auth.uid() = user_id`

Tudo entregue como migration em `supabase/migrations/<timestamp>_create_packages.sql`.

## Navegação

```
RootNavigator (já existe — escolhe pela sessão)
├── (sem sessão)  → AuthStack
│                     └── Login ✓
└── (com sessão)  → AppNavigator (native-stack)
                      ├── MainTabs (bottom-tabs)
                      │     ├── Home
                      │     ├── Scanner
                      │     └── History
                      ├── PackageForm   (push, recebe { trackingCode })
                      └── PackageDetail (push, recebe { packageId })
```

Param lists em `src/types/navigation.ts`:

```ts
AppStackParamList = {
  MainTabs: undefined
  PackageForm: { trackingCode: string }
  PackageDetail: { packageId: string }
}
AppTabsParamList = { Home; Scanner; History }
```

## Telas

| Tela | Estado | Responsabilidade |
|---|---|---|
| **Login** | ✓ existe | OTP por telefone (manter) |
| **Home** | reformular | Carrega pacotes do dia (on focus), calcula stats reais, lista pendentes, botão "Escanear Pacotes" → aba Scanner |
| **Scanner** | nova | `CameraView` lê o código → navega para `PackageForm`. Botão "Digitar código manualmente" (fallback). Trata permissão de câmera negada. |
| **PackageForm** | nova | Form: destinatário, telefone, endereço, complemento, rota, obs. Botão "Buscar no mapa" geocodifica → preview de coordenadas. Salva no Supabase → `replace` para `PackageDetail`. |
| **PackageDetail** | nova | Dados do pacote + **mapa embutido** com marcador + botão "Navegar" (deep link) + "Avisar no WhatsApp" + "Marcar entregue" / "Não entregue". |
| **History** | nova | Lista de pacotes, filtro por status (todos/pendentes/entregues/falhas). Toca no item → `PackageDetail`. |

## Camada de serviços (`src/services/`)

- `supabase.ts` — cliente Supabase (✓ existe).
- `packages.ts` — `listPackages(filter?)`, `getPackage(id)`, `createPackage(input)`,
  `updatePackageStatus(id, status)`. Encapsula as queries e o RLS implícito.
- `geocoding.ts` — `geocodeAddress(address): Promise<{ latitude, longitude } | null>`
  usando a Google Geocoding API. Monta a URL, faz `fetch`, parseia `results[0].geometry.location`.
- `notifications.ts` — `sendWhatsApp(phone, message)` via
  `supabase.functions.invoke('send-whatsapp', { body: { phone, message } })`.
- Helpers puros (testáveis):
  - `computeStats(packages)` → `{ pending, delivered, failed }`.
  - `buildWhatsAppMessage(pkg, kind)` → texto do aviso ("a caminho"/"entregue").
  - `buildNavigationUrl(lat, lng)` → URL do Google Maps para o deep link.

## Fluxo principal

```
Home → [Escanear Pacotes] → aba Scanner
  → câmera lê código de barras (ou digita manual)
  → PackageForm: preenche nome/telefone/endereço/rota
  → [Buscar no mapa] geocodifica endereço → lat/lng
  → [Salvar] insere em packages (status=pending)
  → PackageDetail: mostra mapa + marcador
       ├── [Navegar] abre Google Maps nativo
       ├── [Avisar no WhatsApp] envia mensagem ao destinatário
       └── [Entregue]/[Não entregue] atualiza status + delivered_at
  → volta para Home (stats e lista atualizam on focus)
```

## Integrações externas e configuração

**Variáveis de ambiente (app — `.env`, prefixo `EXPO_PUBLIC_`):**

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=...   # usado no Geocoding e no render do mapa
```

**Secrets da edge function (Supabase, não vão no app):**

```
ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_CLIENT_TOKEN
```

**app.json:** adicionar o plugin/config do `react-native-maps` com a chave do
Google Maps para Android (e iOS), além das permissões de câmera do `expo-camera`
(`NSCameraUsageDescription` / Android `CAMERA`).

> **Mapa e build:** o `react-native-maps` com provider Google pode exigir um
> **development build** (`npx expo run:android` / `eas build`) em vez do Expo Go
> para renderizar com a chave própria. O README documenta isso. Funcionalidades
> sem mapa (scanner, cadastro, WhatsApp, status) funcionam normalmente em Expo Go.

## Estratégia de testes

Foco em **lógica pura** (sem módulos nativos), rodando no jest já configurado:

- `formatPhone` (utils/phone) — formatação +55.
- `geocoding` — montagem da URL e parsing da resposta (com `fetch` mockado).
- `computeStats` — contagem por status.
- `buildWhatsAppMessage` / `buildNavigationUrl` — strings determinísticas.

Componentes com câmera/mapa não são testados por unidade (dependem de nativo);
ficam cobertos por verificação manual documentada no README.

## Limpeza do repositório

- Adicionar/atualizar `.gitignore` para Expo/React Native, cobrindo: `node_modules/`,
  `.env`, `.expo/`, `dist/`, `build/`, e os **resíduos de Flutter** presentes
  (`lib/`, `pubspec.yaml`, `pubspec.lock`, `.dart_tool/`, `.flutter-plugins-dependencies`,
  `.metadata`, `analysis_options.yaml`, `rotadesk.iml`, `windows/`, `.idea/`).
- Recomendar ao usuário a remoção física desses resíduos (não fazem parte do app Expo).
  A remoção será confirmada antes de apagar qualquer arquivo.

## Entregáveis

1. App funcional: scanner + cadastro + mapa + status + histórico + WhatsApp.
2. Frontend estilizado e coeso (paleta azul `#3b82f6` / slate já iniciada).
3. Backend: migration `packages` + RLS; edge function `send-whatsapp` mantida.
4. Testes jest da lógica pura, todos passando.
5. `README.md` completo: descrição, features, stack, pré-requisitos, setup
   (Supabase, Google key, Z-API), como rodar (Expo Go vs dev build), estrutura
   de pastas, banco de dados, testes, roadmap.
6. `.env.example` atualizado com as três variáveis.
7. `.gitignore` adequado; repositório limpo.
8. Histórico de git organizado: **um commit por feature**, mensagens descritivas
   em português seguindo o padrão atual (`feat: ...`).

## O que o usuário precisará fornecer/configurar (documentado no README)

- Chave da Google Maps API (Maps SDK Android/iOS + Geocoding API ativados).
- Credenciais Z-API (instância, token, client-token) para o WhatsApp.
- Rodar a migration no projeto Supabase linkado e configurar o provedor de SMS
  do OTP (caso ainda não esteja).
