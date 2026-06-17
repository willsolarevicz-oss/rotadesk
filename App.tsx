import 'react-native-url-polyfill/auto'
import React, { useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import RootNavigator from './src/navigation/RootNavigator'
import AnimatedSplash from './src/components/AnimatedSplash'

export default function App() {
  const [splashDone, setSplashDone] = useState(false)

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <RootNavigator />
        {splashDone ? null : (
          <AnimatedSplash onFinish={() => setSplashDone(true)} />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  )
}
