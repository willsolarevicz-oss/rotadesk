import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, shadow } from '../theme'

// Caixa de entrega que abre a tampa quando a senha fica visível
// e fecha quando volta a ficar oculta.
export default function SecretBox({ open }: { open: boolean }) {
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(anim, {
      toValue: open ? 1 : 0,
      friction: 6,
      tension: 70,
      useNativeDriver: true,
    }).start()
  }, [open, anim])

  const lidRotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-118deg'],
  })
  const eyeOpacity = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  })
  const eyeScale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  })

  return (
    <View style={styles.wrap}>
      {/* corpo da caixa */}
      <View style={styles.body}>
        <View style={styles.tape} />
      </View>

      {/* olho que aparece de dentro quando abre */}
      <Animated.View
        style={[styles.eyeWrap, { opacity: eyeOpacity }]}
        pointerEvents="none"
      >
        <Animated.View style={[styles.eyeCircle, { transform: [{ scale: eyeScale }] }]}>
          <Ionicons name="eye" size={24} color="#fff" />
        </Animated.View>
      </Animated.View>

      {/* tampa que gira para abrir */}
      <View style={styles.lidWrap} pointerEvents="none">
        <Animated.View
          style={[
            styles.lid,
            { transform: [{ perspective: 700 }, { rotateX: lidRotate }] },
          ]}
        >
          <View style={styles.lidStripe} />
        </Animated.View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { width: 120, height: 112 },
  body: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignSelf: 'center',
    width: 100,
    height: 80,
    marginHorizontal: 'auto',
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    overflow: 'hidden',
    ...shadow.card,
  },
  tape: {
    width: 16,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  eyeWrap: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  eyeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lidWrap: {
    position: 'absolute',
    top: 4,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  lid: {
    width: 106,
    height: 48,
    backgroundColor: '#6366f1',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    transformOrigin: 'top',
    ...shadow.soft,
  },
  lidStripe: {
    width: 24,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
})
