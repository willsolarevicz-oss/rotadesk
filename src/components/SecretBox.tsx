import React, { useEffect, useRef } from 'react'
import { Animated } from 'react-native'
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Polygon,
  Line,
  Ellipse,
  Circle,
  G,
} from 'react-native-svg'

const AG = Animated.createAnimatedComponent(G)

// Caixa de papelão isométrica. A tampa (4 abas + fita) fica fechada e,
// quando a senha vira visível, abre revelando um olho lá dentro.
export default function SecretBox({
  open,
  size = 150,
}: {
  open: boolean
  size?: number
}) {
  const anim = useRef(new Animated.Value(open ? 1 : 0)).current

  useEffect(() => {
    Animated.spring(anim, {
      toValue: open ? 1 : 0,
      friction: 7,
      tension: 55,
      useNativeDriver: false,
    }).start()
  }, [open, anim])

  const openOpacity = anim
  const openScale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] })
  const closedOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })
  const closedScale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.16] })
  const eyeOpacity = anim.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [0, 0, 1],
  })
  const eyeScale = anim.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [0.2, 0.2, 1],
  })

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <LinearGradient id="faceL" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#d9b487" />
          <Stop offset="1" stopColor="#bd8b58" />
        </LinearGradient>
        <LinearGradient id="faceR" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#c2935f" />
          <Stop offset="1" stopColor="#9c6a3c" />
        </LinearGradient>
        <LinearGradient id="lid" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#e6c79c" />
          <Stop offset="1" stopColor="#cda673" />
        </LinearGradient>
        <LinearGradient id="lidDark" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#d3ad79" />
          <Stop offset="1" stopColor="#b98e58" />
        </LinearGradient>
        <LinearGradient id="flap" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="#e7c99f" />
          <Stop offset="1" stopColor="#d0a772" />
        </LinearGradient>
        <RadialGradient id="inside" cx="0.5" cy="0.45" r="0.6">
          <Stop offset="0" stopColor="#5a4530" />
          <Stop offset="1" stopColor="#33261a" />
        </RadialGradient>
      </Defs>

      {/* sombra no chão */}
      <Ellipse cx="100" cy="184" rx="50" ry="9" fill="#0f172a" opacity={0.12} />

      {/* corpo da caixa (sempre visível) */}
      <Polygon points="42,95 100,124 100,176 42,147" fill="url(#faceL)" />
      <Polygon points="100,124 158,95 158,147 100,176" fill="url(#faceR)" />
      {/* vinco vertical frontal */}
      <Line x1="100" y1="124" x2="100" y2="176" stroke="#7a5328" strokeWidth="1" opacity={0.35} />

      {/* ---- TAMPA ABERTA: interior + abas + olho ---- */}
      <AG opacity={openOpacity} scale={openScale} originX={100} originY={95}>
        {/* interior escuro */}
        <Polygon points="100,66 158,95 100,124 42,95" fill="url(#inside)" />

        {/* abas abertas (papelão claro com vinco) */}
        <Polygon points="100,66 158,95 172.8,64.4 114.8,35.4" fill="url(#flap)" stroke="#a9783f" strokeWidth="0.8" />
        <Polygon points="158,95 100,124 115.2,154.4 173.2,125.4" fill="url(#flap)" stroke="#a9783f" strokeWidth="0.8" />
        <Polygon points="100,124 42,95 26.8,125.4 84.8,154.4" fill="url(#flap)" stroke="#a9783f" strokeWidth="0.8" />
        <Polygon points="42,95 100,66 84.8,35.6 26.8,64.6" fill="url(#flap)" stroke="#a9783f" strokeWidth="0.8" />
        {/* vincos das abas */}
        <Line x1="129" y1="80.5" x2="143.8" y2="49.9" stroke="#b98e58" strokeWidth="0.8" opacity={0.7} />
        <Line x1="129" y1="109.5" x2="144.2" y2="139.9" stroke="#b98e58" strokeWidth="0.8" opacity={0.7} />
        <Line x1="71" y1="109.5" x2="55.8" y2="139.9" stroke="#b98e58" strokeWidth="0.8" opacity={0.7} />
        <Line x1="71" y1="80.5" x2="55.8" y2="50.1" stroke="#b98e58" strokeWidth="0.8" opacity={0.7} />
      </AG>

      {/* olho dentro da caixa */}
      <AG opacity={eyeOpacity} scale={eyeScale} originX={100} originY={95}>
        <Ellipse cx="100" cy="95" rx="14" ry="9" fill="#f8fafc" />
        <Circle cx="100" cy="95" r="5" fill="#1e293b" />
        <Circle cx="102" cy="92.5" r="1.6" fill="#ffffff" />
      </AG>

      {/* ---- TAMPA FECHADA: 4 abas seladas + fita ---- */}
      <AG opacity={closedOpacity} scale={closedScale} originX={100} originY={95}>
        <Polygon points="100,66 158,95 100,95" fill="url(#lid)" stroke="#a9783f" strokeWidth="0.8" />
        <Polygon points="158,95 100,124 100,95" fill="url(#lidDark)" stroke="#a9783f" strokeWidth="0.8" />
        <Polygon points="100,124 42,95 100,95" fill="url(#lid)" stroke="#a9783f" strokeWidth="0.8" />
        <Polygon points="42,95 100,66 100,95" fill="url(#lidDark)" stroke="#a9783f" strokeWidth="0.8" />
        {/* fita adesiva no vinco central */}
        <Polygon points="100,66 108,86 100,124 92,86" fill="#e8d9bb" opacity={0.92} />
        <Line x1="100" y1="66" x2="100" y2="124" stroke="#caa86f" strokeWidth="0.8" opacity={0.6} />
      </AG>
    </Svg>
  )
}
