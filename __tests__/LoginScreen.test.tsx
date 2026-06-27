import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import LoginScreen from '../src/screens/LoginScreen'

jest.mock('../src/services/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
    },
  },
}))

// a caixa animada usa SVG nativo; nos testes não precisamos do visual
jest.mock('../src/components/SecretBox', () => ({
  __esModule: true,
  default: () => null,
}))

import { supabase } from '../src/services/supabase'
const mockSignIn = supabase.auth.signInWithPassword as jest.Mock
const mockSignUp = supabase.auth.signUp as jest.Mock

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('mostra e-mail e senha no modo entrar', () => {
    const { getByPlaceholderText } = render(<LoginScreen />)
    expect(getByPlaceholderText('seu@email.com')).toBeTruthy()
    expect(getByPlaceholderText('Sua senha')).toBeTruthy()
  })

  it('alterna a visibilidade da senha pelo olho', () => {
    const { getByPlaceholderText, getByTestId } = render(<LoginScreen />)
    const senha = getByPlaceholderText('Sua senha')
    expect(senha.props.secureTextEntry).toBe(true)
    fireEvent.press(getByTestId('toggle-password'))
    expect(senha.props.secureTextEntry).toBe(false)
  })

  it('mostra nome e confirmar senha no modo cadastro', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />)
    fireEvent.press(getByText('Não tem conta? Criar conta'))
    expect(getByPlaceholderText('Seu nome')).toBeTruthy()
    expect(getByPlaceholderText('Confirme a senha')).toBeTruthy()
  })

  it('chama signInWithPassword ao entrar', async () => {
    mockSignIn.mockResolvedValueOnce({ error: null })
    const { getByPlaceholderText, getByText } = render(<LoginScreen />)

    fireEvent.changeText(getByPlaceholderText('seu@email.com'), 'teste@email.com')
    fireEvent.changeText(getByPlaceholderText('Sua senha'), 'segredo123')
    fireEvent.press(getByText('Entrar'))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'teste@email.com',
        password: 'segredo123',
      })
    })
  })

  it('exibe erro traduzido quando o login falha', async () => {
    mockSignIn.mockResolvedValueOnce({
      error: { message: 'Invalid login credentials' },
    })
    const { getByPlaceholderText, getByText } = render(<LoginScreen />)

    fireEvent.changeText(getByPlaceholderText('seu@email.com'), 'teste@email.com')
    fireEvent.changeText(getByPlaceholderText('Sua senha'), 'errada')
    fireEvent.press(getByText('Entrar'))

    await waitFor(() => {
      expect(getByText('E-mail ou senha incorretos')).toBeTruthy()
    })
  })

  it('valida senhas diferentes no cadastro', async () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />)
    fireEvent.press(getByText('Não tem conta? Criar conta'))

    fireEvent.changeText(getByPlaceholderText('Seu nome'), 'Will')
    fireEvent.changeText(getByPlaceholderText('seu@email.com'), 'will@email.com')
    fireEvent.changeText(getByPlaceholderText('Sua senha'), 'segredo123')
    fireEvent.changeText(getByPlaceholderText('Confirme a senha'), 'outra123')
    fireEvent.press(getByText('Criar conta'))

    await waitFor(() => {
      expect(getByText('As senhas não são iguais')).toBeTruthy()
    })
    expect(mockSignUp).not.toHaveBeenCalled()
  })
})
