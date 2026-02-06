/**
 * ClaudeNest Brand Colors
 * ⚠️ UTILISER UNIQUEMENT CES COULEURS - NE PAS MODIFIER
 */

export const colors = {
  // Primary Brand Colors
  primary: {
    purple: '#a855f7',
    indigo: '#6366f1',
    cyan: '#22d3ee',
  },

  // Backgrounds
  background: {
    dark1: '#0f0f1a',      // Deepest background
    dark2: '#1a1b26',      // Primary background (Main bg)
    dark3: '#24283b',      // Cards, surfaces (Surface)
    dark4: '#3b4261',      // Borders, dividers
    card: '#24283b',
  },

  // Text Colors
  text: {
    primary: '#ffffff',
    secondary: '#a9b1d6',
    muted: '#64748b',
    disabled: '#888888',
  },

  // Semantic Colors
  semantic: {
    success: '#22c55e',
    error: '#ef4444',
    warning: '#fbbf24',
    info: '#22d3ee',
  },

  // Gradients
  gradients: {
    primary: ['#a855f7', '#6366f1'] as const,
    accent: ['#22d3ee', '#a855f7'] as const,
    background: ['#0f0f1a', '#1a1b26', '#24283b'] as const,
  },

  // Terminal-specific colors
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

  // Status colors shorthand
  status: {
    online: '#22c55e',
    offline: '#ef4444',
    connecting: '#fbbf24',
    busy: '#a855f7',
    idle: '#64748b',
  },

  // Border opacity variants
  border: {
    default: 'rgba(59, 66, 97, 0.5)',   // dark4 at 50% - standard borders
    subtle: 'rgba(59, 66, 97, 0.3)',     // dark4 at 30% - dividers, separators
    strong: 'rgba(59, 66, 97, 0.8)',     // dark4 at 80% - emphasized borders
  },

  // Shadow colors
  shadow: {
    default: 'rgba(0, 0, 0, 0.3)',
    strong: 'rgba(0, 0, 0, 0.5)',
  },
} as const;

// Type export
export type Colors = typeof colors;

// Legacy export for compatibility
export const brandColors = {
  primary: '#a855f7',
  background: '#1a1b26',
  surface: '#24283b',
  success: '#22c55e',
  error: '#ef4444',
} as const;
