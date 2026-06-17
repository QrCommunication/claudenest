/**
 * ClaudeNest Brand Colors — "Terminal Premium" radical redesign.
 * Near-black canvas, electric purple→cyan accents with neon glow, glassy
 * elevated surfaces. Token KEYS are preserved for backward compatibility;
 * only values changed so the new look propagates across every screen.
 */

export const colors = {
  // Backgrounds — deep near-black with a faint violet tint
  bg: {
    primary: "#06060e", // Deepest canvas
    secondary: "#0b0b16", // Primary surfaces
    card: "#121121", // Cards, elevated glass surfaces
    hover: "#1b1a2e", // Interactive hover
    input: "#0e0d1a", // Input backgrounds
  },

  // Brand accents — electric
  accent: {
    purple: "#b073ff",
    indigo: "#7c6bff",
    cyan: "#2ce6ff",
  },

  // Text
  text: {
    primary: "rgba(255,255,255,0.96)",
    secondary: "rgba(232,230,255,0.60)",
    muted: "rgba(232,230,255,0.36)",
    inverse: "#06060e",
    disabled: "rgba(232,230,255,0.28)",
  },

  // Status
  status: {
    success: "#34e5a0",
    error: "#ff5c7c",
    warning: "#ffc24b",
    info: "#5b9dff",
    online: "#34e5a0",
    offline: "#5b6079",
    connecting: "#ffc24b",
    busy: "#b073ff",
    idle: "#5b6079",
  },

  // Semantic (aliases)
  semantic: {
    success: "#34e5a0",
    error: "#ff5c7c",
    warning: "#ffc24b",
    info: "#5b9dff",
  },

  // Borders — hairline, with an accent-tinted strong variant for glow edges
  border: {
    subtle: "rgba(176,115,255,0.08)",
    default: "rgba(255,255,255,0.10)",
    strong: "rgba(176,115,255,0.40)",
    focus: "#b073ff",
  },

  // Gradients
  gradients: {
    primary: ["#b073ff", "#7c6bff"] as string[],
    accent: ["#2ce6ff", "#b073ff"] as string[],
    glow: ["#b073ff", "#2ce6ff"] as string[],
    background: ["#06060e", "#0b0b16", "#121121"] as string[],
  },

  // "Claude OS" shell chrome — semantic tokens for the taskbar/dock, window
  // frames and selectable shell items. Co-located with the dimensional `os`
  // group in `layout.ts` so the whole shell stays coherent from one source.
  // The selected state is an ACCENT-TINTED translucent fill (clearly lighter
  // than the rest surface) plus an accent border + accent foreground, so a
  // picked item is unmistakable and READABLE against the near-black chrome —
  // unlike the old opaque `bg.hover` that was nearly invisible on `bg.card`.
  os: {
    // Bottom taskbar / dock.
    dock: {
      surface: "#121121", // = bg.card
      border: "rgba(176,115,255,0.40)", // = border.strong
      divider: "rgba(255,255,255,0.10)", // = border.default
    },
    // Window-frame chrome (header bar + body).
    window: {
      surface: "#0b0b16", // = bg.secondary (body)
      header: "#121121", // = bg.card
      border: "rgba(255,255,255,0.10)", // = border.default
    },
    // Selectable shell items (dock tiles, tabs, segments). `selected*` are the
    // readable picked-state tokens.
    item: {
      rest: "#0e0d1a", // = bg.input (idle tile)
      restText: "rgba(232,230,255,0.60)", // = text.secondary
      selected: "rgba(176,115,255,0.16)", // legible accent-tinted fill
      selectedBorder: "#b073ff", // = accent.purple
      selectedText: "#b073ff", // = accent.purple
    },
  },

  // Terminal-specific colors (Tokyo-night-ish, kept for the PTY view)
  terminal: {
    background: "#0b0b16",
    foreground: "#c0caf5",
    cursor: "#2ce6ff",
    cursorAccent: "#0b0b16",
    selectionBackground: "rgba(176, 115, 255, 0.3)",
    black: "#15161e",
    red: "#f7768e",
    green: "#9ece6a",
    yellow: "#e0af68",
    blue: "#7aa2f7",
    magenta: "#bb9af7",
    cyan: "#7dcfff",
    white: "#a9b1d6",
    brightBlack: "#414868",
    brightRed: "#ff899d",
    brightGreen: "#9fe044",
    brightYellow: "#faba4a",
    brightBlue: "#8db0ff",
    brightMagenta: "#c7a9ff",
    brightCyan: "#7ee1ff",
    brightWhite: "#c0caf5",
  },

  // Shadow colors
  shadow: {
    default: "rgba(0, 0, 0, 0.45)",
    strong: "rgba(0, 0, 0, 0.6)",
  },

  // Legacy — conservé pour la rétrocompatibilité
  primary: {
    purple: "#b073ff",
    indigo: "#7c6bff",
    cyan: "#2ce6ff",
  },
  background: {
    dark1: "#06060e",
    dark2: "#0b0b16",
    dark3: "#121121",
    dark4: "#211f38",
    card: "#121121",
  },
} as const;

export type Colors = typeof colors;

// Legacy export for compatibility
export const brandColors = {
  primary: "#b073ff",
  background: "#0b0b16",
  surface: "#121121",
  success: "#34e5a0",
  error: "#ff5c7c",
} as const;
