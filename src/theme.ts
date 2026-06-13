// Design system do Rotadesk — tokens de cor, espaçamento, raio, sombra e status.

export const colors = {
  primary: '#4f46e5', // indigo-600
  primaryDark: '#4338ca',
  primaryLight: '#6366f1',
  accent: '#3b82f6', // blue-500

  bg: '#f1f5f9', // slate-100
  surface: '#ffffff',

  text: '#0f172a', // slate-900
  textMuted: '#64748b', // slate-500
  textFaint: '#94a3b8', // slate-400
  border: '#e2e8f0', // slate-200

  pending: '#f59e0b',
  delivered: '#22c55e',
  failed: '#ef4444',
  pendingSoft: '#fef3c7',
  deliveredSoft: '#dcfce7',
  failedSoft: '#fee2e2',

  white: '#ffffff',
}

// Gradiente principal da marca (índigo -> azul)
export const brandGradient = ['#4f46e5', '#3b82f6'] as const

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 }

export const shadow = {
  card: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  soft: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
}

export const statusMeta = {
  pending: {
    label: 'Pendente',
    color: colors.pending,
    soft: colors.pendingSoft,
    icon: 'time',
  },
  delivered: {
    label: 'Entregue',
    color: colors.delivered,
    soft: colors.deliveredSoft,
    icon: 'checkmark-circle',
  },
  failed: {
    label: 'Não entregue',
    color: colors.failed,
    soft: colors.failedSoft,
    icon: 'close-circle',
  },
} as const
