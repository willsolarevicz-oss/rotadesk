# Rotadesk

Aplicativo mobile para entregadores organizarem as entregas do dia. O entregador
faz login por e-mail, escaneia o código de barras de cada pacote, cadastra os
dados de entrega (com leitura automática da etiqueta por IA e preenchimento de
endereço por CEP), visualiza o destino no mapa, navega até o local e marca cada
entrega como concluída ou não entregue, podendo ainda avisar o destinatário por
WhatsApp.

## Funcionalidades

- Login por e-mail com código de verificação (Supabase Auth)
- Scanner de código de barras pela câmera, com digitação manual como alternativa
- Leitura da etiqueta por IA (opcional): foto da etiqueta preenche nome e endereço
- Preenchimento de endereço pelo CEP (ViaCEP)
- Geocoding gratuito do endereço (OpenStreetMap/Nominatim; Google opcional) e mapa com marcador
- Botão de navegação que abre o Google Maps
- Edição e exclusão de pacotes
- Rota otimizada automática (OSRM): aba Rota com a sequência das paradas (Parada 1, 2, 3...)
- Ordenação rápida dos pendentes por proximidade na tela inicial (GPS)
- Baixa de entrega: entregue ou não entregue, com data e hora
- Foto de comprovação de entrega (Supabase Storage)
- Modo offline: lista salva localmente e baixas sincronizadas ao reconectar
- Aviso ao destinatário por WhatsApp (Z-API)
- Tela inicial com estatísticas do dia e lista de pendentes
- Histórico com filtros por status

## Stack

- Aplicativo: Expo SDK 54, React Native 0.81, TypeScript
- Navegação: React Navigation 7
- Backend: Supabase (Auth, PostgreSQL com RLS, Edge Functions em Deno)
- Scanner: expo-camera
- Leitura de etiqueta: Claude Haiku (visão), via Edge Function
- Endereço: ViaCEP (CEP) e geocoding via OpenStreetMap/Nominatim (Google opcional)
- Roteirização: OSRM (Open Source Routing Machine, servidor público)
- Mapa: react-native-maps
- Localização: expo-location
- Comprovante: expo-image-picker e Supabase Storage
- Offline: AsyncStorage e expo-network
- WhatsApp: Edge Function `send-whatsapp` (Z-API)
- Interface: expo-linear-gradient, @expo/vector-icons, API Animated
- Testes: Jest

## Pré-requisitos

- Node 18 ou superior
- Conta no [Supabase](https://supabase.com)
- Chave da Google Maps API com Maps SDK (Android/iOS) e Geocoding API ativados
- Aplicativo Expo Go no celular, ou um development build
- Opcional: conta na Anthropic (leitura por IA) e na Z-API (WhatsApp)

## Como rodar

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# edite o .env com:
#   EXPO_PUBLIC_SUPABASE_URL
#   EXPO_PUBLIC_SUPABASE_ANON_KEY
#   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY

# 3. Iniciar
npm start
```

Leia o QR code com o Expo Go. Para builds standalone (Android), inclua a chave do
Google Maps também no `app.json` (`android.config.googleMaps.apiKey`).

## Banco de dados

Aplique as migrations no projeto Supabase com `npx supabase db push`, ou cole o
conteúdo dos arquivos em `supabase/migrations/` no SQL Editor do dashboard, na
ordem:

1. `20260612000000_create_packages.sql` — tabela `packages` com RLS
2. `20260620000000_proof_photo.sql` — coluna `photo_url`, bucket de Storage
   `proofs` e policies da foto de comprovação

A tabela `packages` usa RLS: cada entregador acessa apenas os próprios pacotes.

### Tabela `packages`

| Coluna | Tipo | Descrição |
|---|---|---|
| id | uuid | Identificador único |
| user_id | uuid | Dono do registro (entregador) |
| tracking_code | text | Código lido do código de barras |
| recipient_name | text | Nome do destinatário |
| recipient_phone | text | Telefone do destinatário |
| address | text | Endereço |
| complement | text | Complemento |
| route | text | Rota |
| latitude / longitude | float8 | Coordenadas |
| status | text | pending / delivered / failed |
| notes | text | Observações |
| photo_url | text | URL da foto de comprovação |
| created_at / delivered_at | timestamptz | Datas |

## Autenticação por e-mail

O login usa código de verificação enviado por e-mail (sem gateway de SMS). No
dashboard do Supabase, em Authentication, Providers, mantenha o provedor Email
habilitado. Para o usuário receber o código (em vez de um link), edite o template
em Authentication, Email Templates, Magic Link, incluindo o token:

```
Seu código de acesso é: {{ .Token }}
```

## Leitura de etiqueta por IA (opcional)

Ao escanear, o aplicativo tira uma foto da etiqueta e usa o Claude Haiku para
extrair nome e endereço. É opcional: sem a função no ar, o cadastro segue manual
com preenchimento por CEP. Para ativar, crie uma chave em
[console.anthropic.com](https://console.anthropic.com) (defina um limite de gasto;
o custo é de centavos por foto), configure o secret e faça o deploy da função:

```bash
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
npx supabase functions deploy read-label
```

A chave fica no servidor (secret do Supabase), nunca no aplicativo.

## WhatsApp (opcional)

A função `supabase/functions/send-whatsapp` usa a Z-API. Configure os secrets e
faça o deploy:

```bash
npx supabase secrets set ZAPI_INSTANCE_ID=... ZAPI_TOKEN=... ZAPI_CLIENT_TOKEN=...
npx supabase functions deploy send-whatsapp
```

## Testes

```bash
npm test
```

Cobrem a lógica pura: formatação de telefone, geocoding, busca de CEP, contagem
de estatísticas, mensagens de WhatsApp e URL de navegação. A verificação de tipos
roda com `npx tsc --noEmit`.

## Estrutura

```
src/
  navigation/   RootNavigator, AuthStack, AppNavigator, AppTabs
  screens/      Login, Home, Scanner, PackageForm, PackageDetail, History
  services/     supabase, packages, geocoding, cep, labelReader, notifications
  components/   GradientButton, PressableScale, FadeInView
  utils/        phone, stats, messages, maps
  types/        navigation, package
  theme.ts      design system (cores, espaçamentos, sombras)
supabase/
  functions/    read-label, send-whatsapp (Edge Functions, Deno)
  migrations/   create_packages.sql
```

## Roadmap

- Sincronização offline também para novos pacotes escaneados
- Agrupamento de pacotes por rota
- Painel web administrativo

## Licença

MIT
