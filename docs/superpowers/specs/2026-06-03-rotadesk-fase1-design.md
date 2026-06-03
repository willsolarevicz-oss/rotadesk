# Rotadesk — Fase 1: Setup + Navegação + Autenticação

**Data:** 2026-06-03  
**Status:** Aprovado

---

## Escopo

Fase 1 cobre exclusivamente:
- Criação do projeto Expo (TypeScript, blank template)
- Estrutura de pastas `src/`
- Configuração do React Navigation (AuthStack + AppTabs)
- Integração do cliente Supabase
- `LoginScreen` funcional com OTP via telefone
- `HomeScreen` estrutural (placeholder para Fases 2–4)

Visual (cores, ícones, tipografia) fica para depois das fases funcionais.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Mobile | React Native + Expo SDK (TypeScript, blank-typescript) |
| Auth + DB | Supabase (projeto existente, reutilizado) |
| Auth method | OTP via SMS (Supabase Phone Auth) |
| Navegação | React Navigation v6 |
| Sessão | Persistida via AsyncStorage (`persistSession: true`) |
| Ambiente | Windows + Expo Go (celular físico) |

Backend Node.js/Express/Prisma/Railway adiado para fases posteriores quando houver lógica de rota/entrega que exija processamento server-side.

---

## Estrutura de Pastas

```
rotadesk/
├── src/
│   ├── navigation/
│   │   ├── RootNavigator.tsx   # ouve sessão Supabase, redireciona auth/app
│   │   ├── AuthStack.tsx       # stack de login
│   │   └── AppTabs.tsx         # bottom tabs (Home ativo; Scanner/Histórico placeholder)
│   ├── screens/
│   │   ├── LoginScreen.tsx     # OTP em duas etapas: telefone → código
│   │   └── HomeScreen.tsx      # stats zerados + CTA "Escanear Pacotes"
│   ├── services/
│   │   └── supabase.ts         # cliente Supabase com AsyncStorage
│   └── types/
│       └── navigation.ts       # tipos das rotas (AuthStackParamList, AppTabsParamList)
├── App.tsx                     # entry point — monta NavigationContainer + RootNavigator
├── .env                        # EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
└── package.json
```

---

## Navegação (Opção A aprovada)

```
RootNavigator
├── [sem sessão] → AuthStack
│   └── Login
└── [com sessão] → AppTabs
    ├── Home          (ativo)
    ├── Scanner       (placeholder — habilitado na Fase 2)
    └── Histórico     (placeholder — habilitado na Fase 4)
```

`RootNavigator` escuta `supabase.auth.onAuthStateChange` e troca de stack automaticamente. Não usa `navigation.navigate()` manualmente para redirecionar após login.

---

## Telas

### LoginScreen

Dois passos sequenciais na mesma tela, controlados por estado local:

**Passo 1 — Telefone:**
- Input com prefixo `+55`
- Botão "Enviar código" → chama `supabase.auth.signInWithOtp({ phone })`
- Avança para o passo 2

**Passo 2 — OTP:**
- 6 inputs de 1 dígito (ou um único input com `maxLength={6}`)
- Botão "Entrar" → chama `supabase.auth.verifyOtp({ phone, token, type: 'sms' })`
- Em caso de sucesso: `onAuthStateChange` dispara e o `RootNavigator` redireciona automaticamente
- Botão "Voltar" para corrigir o telefone

**Estados de erro:** mensagem inline abaixo do botão (sem modal/alert).

### HomeScreen

Fase 1: estrutura funcional, dados zerados.

- Header: nome do usuário (de `session.user.phone` ou `user_metadata.name`)
- Card de stats: Pendentes / Entregues / Não entregues (todos `0`)
- Empty state: "Nenhum pacote escaneado"
- Botão "Escanear Pacotes" (presente mas sem ação por enquanto)
- Botão "Sair" → chama `supabase.auth.signOut()` → `RootNavigator` redireciona para Login
- Bottom tabs visíveis (Scanner e Histórico desabilitados/cinza)

---

## Autenticação

- Sessão persiste entre aberturas do app via `AsyncStorage`
- `RootNavigator` verifica sessão atual com `supabase.auth.getSession()` no mount
- Escuta mudanças com `supabase.auth.onAuthStateChange`
- Logout disponível na HomeScreen

---

## Dependências novas

```
@react-navigation/native
@react-navigation/native-stack
@react-navigation/bottom-tabs
react-native-screens
react-native-safe-area-context
@supabase/supabase-js
@react-native-async-storage/async-storage
react-native-url-polyfill
```

---

## Fora de escopo nesta fase

- Visual (cores, ícones, fontes customizadas)
- Scanner de código de barras (Fase 2)
- Google Maps / rota otimizada (Fase 3)
- Fluxo de confirmação de entrega (Fase 4)
- Backend Node.js/Express (adicionado quando necessário)
- Tabelas no banco Supabase (adicionadas conforme as fases exigirem)
