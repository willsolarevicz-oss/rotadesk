import React from 'react'
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import PressableScale from './PressableScale'
import { brandGradient, radius } from '../theme'

// Botão primário com gradiente da marca + animação de toque + estado de loading.
export default function GradientButton({
  title,
  onPress,
  loading,
  disabled,
  style,
}: {
  title: string
  onPress?: () => void
  loading?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}) {
  return (
    <PressableScale onPress={onPress} disabled={disabled || loading} style={style}>
      <LinearGradient
        colors={brandGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.btn}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.text}>{title}</Text>
        )}
      </LinearGradient>
    </PressableScale>
  )
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.lg,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: '#fff', fontWeight: '700', fontSize: 16 },
})
