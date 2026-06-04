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
const mockVerifyOtp = supabase.auth.verifyOtp as jest.Mock

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renderiza o input de telefone no passo 1', () => {
    const { getByPlaceholderText } = render(<LoginScreen />)
    expect(getByPlaceholderText('(11) 99999-9999')).toBeTruthy()
  })

  it('avança para o passo OTP após envio bem-sucedido', async () => {
    mockSignInWithOtp.mockResolvedValueOnce({ error: null })
    const { getByPlaceholderText, getByText } = render(<LoginScreen />)

    fireEvent.changeText(getByPlaceholderText('(11) 99999-9999'), '11999999999')
    fireEvent.press(getByText('Enviar código'))

    await waitFor(() => {
      expect(getByPlaceholderText('Código de 6 dígitos')).toBeTruthy()
    })
  })

  it('exibe erro inline quando signInWithOtp falha', async () => {
    mockSignInWithOtp.mockResolvedValueOnce({ error: { message: 'Telefone inválido' } })
    const { getByPlaceholderText, getByText } = render(<LoginScreen />)

    fireEvent.changeText(getByPlaceholderText('(11) 99999-9999'), '123')
    fireEvent.press(getByText('Enviar código'))

    await waitFor(() => {
      expect(getByText('Telefone inválido')).toBeTruthy()
    })
  })

  it('volta para o passo 1 ao pressionar Voltar', async () => {
    mockSignInWithOtp.mockResolvedValueOnce({ error: null })
    const { getByPlaceholderText, getByText } = render(<LoginScreen />)

    fireEvent.changeText(getByPlaceholderText('(11) 99999-9999'), '11999999999')
    fireEvent.press(getByText('Enviar código'))

    await waitFor(() => getByText('← Voltar'))
    fireEvent.press(getByText('← Voltar'))

    await waitFor(() => {
      expect(getByPlaceholderText('(11) 99999-9999')).toBeTruthy()
    })
  })
})
