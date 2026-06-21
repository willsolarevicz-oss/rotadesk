import React, { useRef } from 'react'
import {
  Animated,
  Pressable,
  ViewStyle,
  StyleProp,
  GestureResponderEvent,
} from 'react-native'

// Botão/cartão que "afunda" levemente ao toque (micro-interação).
export default function PressableScale({
  children,
  onPress,
  style,
  disabled,
}: {
  children: React.ReactNode
  onPress?: (e: GestureResponderEvent) => void
  style?: StyleProp<ViewStyle>
  disabled?: boolean
}) {
  const scale = useRef(new Animated.Value(1)).current
  const animate = (toValue: number) =>
    Animated.spring(scale, {
      toValue,
      friction: 7,
      useNativeDriver: true,
    }).start()

  // O próprio Pressable é o elemento estilizado e animado, para que
  // flex/alinhamento passados em `style` funcionem dentro de linhas.
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => animate(0.96)}
      onPressOut={() => animate(1)}
      disabled={disabled}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  )
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)
