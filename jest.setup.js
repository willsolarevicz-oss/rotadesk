// Mocks de módulos nativos/Expo para os testes de componente.
// O jest não transpila esses pacotes (ESM em node_modules); como os testes
// checam o fluxo e não o visual, basta substituí-los por stubs leves.

// LinearGradient como host component: renderiza os filhos (ex.: texto do botão).
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }))

jest.mock('expo-status-bar', () => ({ StatusBar: () => null }))

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }))
