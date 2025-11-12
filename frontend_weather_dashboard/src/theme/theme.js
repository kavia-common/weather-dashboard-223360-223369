//
// Ocean Professional Theme configuration
//

// PUBLIC_INTERFACE
export const theme = {
  /** Ocean Professional theme token palette */
  colors: {
    primary: '#2563EB',
    secondary: '#F59E0B',
    error: '#EF4444',
    background: '#f9fafb',
    surface: '#ffffff',
    text: '#111827',
    textMuted: 'rgba(17, 24, 39, 0.7)',
    border: 'rgba(17, 24, 39, 0.1)',
  },
  /** Gradient utility classes hint */
  gradient: {
    from: 'rgba(59,130,246,0.08)', // blue-500/10
    to: '#FAFAFA', // gray-50
  },
  /** Common radius and shadow tokens */
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    full: '9999px',
  },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.04)',
    md: '0 4px 12px rgba(0,0,0,0.08)',
    lg: '0 10px 24px rgba(0,0,0,0.12)',
    inset: 'inset 0 1px 0 rgba(255,255,255,0.4)',
  },
};

// PUBLIC_INTERFACE
export function getCssVars() {
  /** Returns CSS variables object for inline styles if needed */
  const { colors } = theme;
  return {
    '--color-primary': colors.primary,
    '--color-secondary': colors.secondary,
    '--color-error': colors.error,
    '--color-bg': colors.background,
    '--color-surface': colors.surface,
    '--color-text': colors.text,
    '--color-text-muted': colors.textMuted,
    '--color-border': colors.border,
  };
}
