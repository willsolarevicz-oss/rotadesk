import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import LoginScreen from '../src/screens/LoginScreen'

jest.mock('../src/services/supabase', () => ({
  supabase: {
    auth: {
      signInWithOtp: jest.fn(),
      verifyOtp: jest.fn(),
    },
  },
}))

import { supabase } from '../src/services/supabase'
const mockSignInWithOtp = supabase.auth.signInWithOtp as jest.Mock

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renderiza o input de e-mail no passo 1', () => {
    const { getByPlaceholderText } = render(<LoginScreen />)
    expect(getByPlaceholderText('seu@email.com')).toBeTruthy()
  })

  it('avança para o passo OTP após envio bem-sucedido', async () => {
    mockSignInWithOtp.mockResolvedValueOnce({ error: null })
    const { getByPlaceholderText, getByText } = render(<LoginScreen />)

    fireEvent.changeText(getByPlaceholderText('seu@email.com'), 'teste@email.com')
    fireEvent.press(getByText('Enviar código'))

    await waitFor(() => {
      expect(getByPlaceholderText('Código de 8 dígitos')).toBeTruthy()
    })
  })

  it('exibe erro inline quando signInWithOtp falha', async () => {
    mockSignInWithOtp.mockResolvedValueOnce({
      error: { message: 'E-mail inválido' },
    })
    const { getByPlaceholderText, getByText } = render(<LoginScreen />)

    fireEvent.changeText(getByPlaceholderText('seu@email.com'), 'invalido')
    fireEvent.press(getByText('Enviar código'))

    await waitFor(() => {
      expect(getByText('E-mail inválido')).toBeTruthy()
    })
  })

  it('volta para o passo 1 ao pressionar Voltar', async () => {
    mockSignInWithOtp.mockResolvedValueOnce({ error: null })
    const { getByPlaceholderText, getByText } = render(<LoginScreen />)

    fireEvent.changeText(getByPlaceholderText('seu@email.com'), 'teste@email.com')
    fireEvent.press(getByText('Enviar código'))

    await waitFor(() => getByText('← Voltar'))
    fireEvent.press(getByText('← Voltar'))

    await waitFor(() => {
      expect(getByPlaceholderText('seu@email.com')).toBeTruthy()
    })
  })
})
