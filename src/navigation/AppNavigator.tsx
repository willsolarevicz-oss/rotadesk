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
