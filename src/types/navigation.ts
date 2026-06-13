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
