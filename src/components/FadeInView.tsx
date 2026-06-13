import React, { useEffect, useRef } from 'react'
import { Animated, ViewStyle, StyleProp } from 'react-native'

// Entrada animada: fade + leve deslize pra cima. `delay` permite efeito escalonado.
export default function FadeInView({
  children,
  delay = 0,
  offset = 14,
  style,
}: {
  children: React.ReactNode
  delay?: number
  offset?: number
  style?: StyleProp<ViewStyle>
}) {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(offset)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start()
  }, [opacity, translateY, delay])

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  )
}
