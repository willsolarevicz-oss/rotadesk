import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import type { AppTabsParamList } from '../types/navigation'
import HomeScreen from '../screens/HomeScreen'
import ScannerScreen from '../screens/ScannerScreen'
import HistoryScreen from '../screens/HistoryScreen'

const Tab = createBottomTabNavigator<AppTabsParamList>()

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#94a3b8',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          title: 'Escanear',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="scan-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: 'Histórico',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}
