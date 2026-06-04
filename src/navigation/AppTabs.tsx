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
