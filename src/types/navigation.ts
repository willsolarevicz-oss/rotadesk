import type { NavigatorScreenParams } from '@react-navigation/native'

export type AuthStackParamList = {
  Login: undefined
}

export type AppTabsParamList = {
  Home: undefined
  Scanner: undefined
  History: undefined
}

// Dados pré-preenchidos pela leitura da etiqueta (IA), todos opcionais.
export type PackagePrefill = {
  recipient_name?: string
  recipient_phone?: string
  cep?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
}

export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<AppTabsParamList> | undefined
  PackageForm: { trackingCode: string; prefill?: PackagePrefill }
  PackageDetail: { packageId: string }
}
