/**
 * ClaudeNest Brand Colors
 * Cohérent avec le design system web
 */

export const colors = {
  // Backgrounds (dark theme)
  bg: {
    primary: '#0f0f1a',      // Deepest
    secondary: '#1a1b26',    // Primary surfaces
    card: '#24283b',         // Cards, elevated surfaces
    hover: '#2a2d3e',        // Interactive hover
    input: '#1e1f2e',        // Input backgrounds
  },

  // Brand accents
  accent: {
    purple: '#a855f7',
    indigo: '#6366f1',
    cyan: '#22d3ee',
  },

  // Text
  text: {
    primary: 'rgba(255,255,255,0.92)',
    secondary: 'rgba(255,255,255,0.55)',
    muted: 'rgba(255,255,255,0.3)',
    inverse: '#0f0f1a',
    disabled: 'rgba(255,255,255,0.3)',
  },

  // Status
  status: {
    success: '#22c55e',
    error: '#ef4444',
    warning: '#fbbf24',
    info: '#3b82f6',
    online: '#22c55e',
    offline: '#6b7280',
    connecting: '#fbbf24',
    busy: '#a855f7',
    idle: '#6b7280',
  },

  // Semantic (aliases)
  semantic: {
    success: '#22c55e',
    error: '#ef4444',
    warning: '#fbbf24',
    info: '#3b82f6',
  },

  // Borders
  border: {
    subtle: 'rgba(255,255,255,0.06)',
    default: 'rgba(255,255,255,0.1)',
    strong: 'rgba(255,255,255,0.18)',
    focus: '#a855f7',
  },

  // Gradients
  gradients: {
    primary: ['#a855f7', '#6366f1'] as string[],
    accent: ['#22d3ee', '#a855f7'] as string[],
    background: ['#0f0f1a', '#1a1b26', '#24283b'] as string[],
  },

  // Terminal-specific colors (inchangé)
  terminal: {
    background: '#1a1b26',
    foreground: '#c0caf5',
    cursor: '#22d3ee',
    cursorAccent: '#1a1b26',
    selectionBackground: 'rgba(168, 85, 247, 0.3)',
    black: '#15161e',
    red: '#f7768e',
    green: '#9ece6a',
    yellow: '#e0af68',
    blue: '#7aa2f7',
    magenta: '#bb9af7',
    cyan: '#7dcfff',
    white: '#a9b1d6',
    brightBlack: '#414868',
    brightRed: '#ff899d',
    brightGreen: '#9fe044',
    brightYellow: '#faba4a',
    brightBlue: '#8db0ff',
    brightMagenta: '#c7a9ff',
    brightCyan: '#7ee1ff',
    brightWhite: '#c0caf5',
  },

  // Shadow colors
  shadow: {
    default: 'rgba(0, 0, 0, 0.3)',
    strong: 'rgba(0, 0, 0, 0.5)',
  },

  // Legacy — conservé pour la rétrocompatibilité
  primary: {
    purple: '#a855f7',
    indigo: '#6366f1',
    cyan: '#22d3ee',
  },
  background: {
    dark1: '#0f0f1a',
    dark2: '#1a1b26',
    dark3: '#24283b',
    dark4: '#3b4261',
    card: '#24283b',
  },
} as const;

export type Colors = typeof colors;

// Legacy export for compatibility
export const brandColors = {
  primary: '#a855f7',
  background: '#1a1b26',
  surface: '#24283b',
  success: '#22c55e',
  error: '#ef4444',
} as const;
