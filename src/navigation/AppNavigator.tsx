import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { AppStackParamList } from '../types/navigation'
import { colors } from '../theme'
import AppTabs from './AppTabs'
import PackageFormScreen from '../screens/PackageFormScreen'
import PackageDetailScreen from '../screens/PackageDetailScreen'

const Stack = createNativeStackNavigator<AppStackParamList>()

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    >
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
