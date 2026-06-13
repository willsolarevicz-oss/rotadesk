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

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => animate(0.96)}
      onPressOut={() => animate(1)}
      disabled={disabled}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  )
}
