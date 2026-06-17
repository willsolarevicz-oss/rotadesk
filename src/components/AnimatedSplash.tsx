import React, { useEffect, useRef } from 'react'
import { StyleSheet, Animated, Easing } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { colors, brandGradient, shadow } from '../theme'

// Tela de abertura: a caixa fica parada e o pino dá um pulinho girando
// no próprio eixo (igual um peão). Depois some e revela o app.
export default function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const spin = useRef(new Animated.Value(0)).current
  const hop = useRef(new Animated.Value(0)).current
  const fade = useRef(new Animated.Value(1)).current
  const word = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(spin, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(hop, {
            toValue: 1,
            duration: 360,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(hop, {
            toValue: 0,
            duration: 520,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(word, {
          toValue: 1,
          duration: 600,
          delay: 550,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(350),
      Animated.timing(fade, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => onFinish())
  }, [spin, hop, fade, word, onFinish])

  const rotateY = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1080deg'],
  })
  const translateY = hop.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -16],
  })

  return (
    <Animated.View style={[styles.fill, { opacity: fade }]} pointerEvents="none">
      <LinearGradient
        colors={brandGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tile}
      >
        <Animated.View
          style={{
            transform: [{ perspective: 800 }, { translateY }, { rotateY }],
          }}
        >
          <Ionicons name="location" size={62} color="#fff" />
        </Animated.View>
      </LinearGradient>
      <Animated.Text style={[styles.word, { opacity: word }]}>
        Rotadesk
      </Animated.Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  tile: {
    width: 120,
    height: 120,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadow.card,
  },
  word: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.5,
  },
})
