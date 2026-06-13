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
