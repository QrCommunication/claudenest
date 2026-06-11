/**
 * TerminalKeyBar
 * On-screen special-key toolbar for the mobile terminal: Esc, Tab, arrows,
 * navigation keys and the common Ctrl combos — plus sticky Ctrl/Alt toggles
 * that modify the next key (arrows on this bar, and the next soft-keyboard
 * letter via the WebView's custom key handler).
 *
 * All keys emit raw byte sequences sent straight to the PTY.
 */
import React, { memo, useCallback } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, borderRadius, typography } from "@/theme";

type Mod = "ctrl" | "alt";

interface Props {
  onSend: (data: string) => void;
  ctrlActive: boolean;
  altActive: boolean;
  onToggleModifier: (mod: Mod) => void;
  /**
   * When the soft keyboard is open the bar sits flush on top of it, so the
   * bottom safe-area inset must collapse (the keyboard covers that zone).
   */
  keyboardVisible?: boolean;
}

// Base escape sequences (no modifier).
const ESC = "\x1b";
const SEQ = {
  esc: ESC,
  tab: "\t",
  up: `${ESC}[A`,
  down: `${ESC}[B`,
  right: `${ESC}[C`,
  left: `${ESC}[D`,
  home: `${ESC}[H`,
  end: `${ESC}[F`,
  pgup: `${ESC}[5~`,
  pgdn: `${ESC}[6~`,
  del: `${ESC}[3~`,
};

// CSI modifier codes: Ctrl=5, Alt=3 (xterm "1;Nx" form for arrows/nav).
function modifyArrow(
  base: "A" | "B" | "C" | "D" | "H" | "F",
  mod: Mod,
): string {
  const code = mod === "ctrl" ? 5 : 3;
  return `${ESC}[1;${code}${base}`;
}

const CTRL_COMBOS: { label: string; data: string }[] = [
  { label: "^C", data: "\x03" },
  { label: "^D", data: "\x04" },
  { label: "^Z", data: "\x1a" },
  { label: "^L", data: "\x0c" },
  { label: "^R", data: "\x12" },
  { label: "^A", data: "\x01" },
  { label: "^E", data: "\x05" },
  { label: "^K", data: "\x0b" },
  { label: "^U", data: "\x15" },
  { label: "^W", data: "\x17" },
];

export const TerminalKeyBar: React.FC<Props> = memo(function TerminalKeyBar({
  onSend,
  ctrlActive,
  altActive,
  onToggleModifier,
  keyboardVisible = false,
}) {
  const insets = useSafeAreaInsets();
  const anyMod = ctrlActive || altActive;

  // Send an arrow/nav key, applying an armed Ctrl/Alt modifier if present, then
  // clearing the modifier (sticky-once behaviour).
  const sendArrow = useCallback(
    (base: "A" | "B" | "C" | "D" | "H" | "F", plain: string) => {
      if (ctrlActive) onSend(modifyArrow(base, "ctrl"));
      else if (altActive) onSend(modifyArrow(base, "alt"));
      else onSend(plain);
      if (ctrlActive) onToggleModifier("ctrl");
      if (altActive) onToggleModifier("alt");
    },
    [ctrlActive, altActive, onSend, onToggleModifier],
  );

  const sendPlain = useCallback(
    (data: string) => {
      // Alt prefixes ESC; Ctrl on non-letter keys is a no-op so we just send.
      onSend(altActive ? ESC + data : data);
      if (altActive) onToggleModifier("alt");
      if (ctrlActive) onToggleModifier("ctrl");
    },
    [altActive, ctrlActive, onSend, onToggleModifier],
  );

  return (
    <View
      style={[
        styles.wrap,
        { paddingBottom: keyboardVisible ? 0 : insets.bottom },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        keyboardShouldPersistTaps="always"
      >
        {/* Sticky modifiers */}
        <ModKey
          label="Ctrl"
          active={ctrlActive}
          onPress={() => onToggleModifier("ctrl")}
        />
        <ModKey
          label="Alt"
          active={altActive}
          onPress={() => onToggleModifier("alt")}
        />

        <Sep />

        <Key label="Esc" onPress={() => sendPlain(SEQ.esc)} />
        <Key label="Tab" onPress={() => sendPlain(SEQ.tab)} />

        <Sep />

        {/* Arrows */}
        <IconKey
          icon="keyboard-arrow-left"
          highlight={anyMod}
          onPress={() => sendArrow("D", SEQ.left)}
        />
        <IconKey
          icon="keyboard-arrow-up"
          highlight={anyMod}
          onPress={() => sendArrow("A", SEQ.up)}
        />
        <IconKey
          icon="keyboard-arrow-down"
          highlight={anyMod}
          onPress={() => sendArrow("B", SEQ.down)}
        />
        <IconKey
          icon="keyboard-arrow-right"
          highlight={anyMod}
          onPress={() => sendArrow("C", SEQ.right)}
        />

        <Sep />

        <Key label="Home" onPress={() => sendArrow("H", SEQ.home)} />
        <Key label="End" onPress={() => sendArrow("F", SEQ.end)} />
        <Key label="PgUp" onPress={() => sendPlain(SEQ.pgup)} />
        <Key label="PgDn" onPress={() => sendPlain(SEQ.pgdn)} />
        <Key label="Del" onPress={() => sendPlain(SEQ.del)} />

        <Sep />

        {/* Quick Ctrl combos */}
        {CTRL_COMBOS.map((c) => (
          <Key
            key={c.label}
            label={c.label}
            mono
            onPress={() => onSend(c.data)}
          />
        ))}
      </ScrollView>
    </View>
  );
});

// ── Sub-components ──

const Key: React.FC<{
  label: string;
  onPress: () => void;
  mono?: boolean;
}> = memo(function Key({ label, onPress, mono }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
      hitSlop={4}
    >
      <Text style={[styles.keyLabel, mono && styles.keyMono]}>{label}</Text>
    </Pressable>
  );
});

const IconKey: React.FC<{
  icon: React.ComponentProps<typeof Icon>["name"];
  onPress: () => void;
  highlight?: boolean;
}> = memo(function IconKey({ icon, onPress, highlight }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        styles.iconKey,
        pressed && styles.keyPressed,
      ]}
      hitSlop={4}
    >
      <Icon
        name={icon}
        size={20}
        color={highlight ? colors.accent.cyan : colors.text.primary}
      />
    </Pressable>
  );
});

const ModKey: React.FC<{
  label: string;
  active: boolean;
  onPress: () => void;
}> = memo(function ModKey({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        styles.modKey,
        active && styles.modKeyActive,
        pressed && styles.keyPressed,
      ]}
      hitSlop={4}
    >
      <Text style={[styles.keyLabel, active && styles.modKeyLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
});

const Sep: React.FC = () => <View style={styles.sep} />;

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bg.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  row: {
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  } as object,
  key: {
    minWidth: 40,
    height: 38,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: "center",
    justifyContent: "center",
  },
  iconKey: {
    minWidth: 44,
    paddingHorizontal: spacing.sm,
  },
  keyPressed: {
    backgroundColor: colors.bg.hover,
    borderColor: colors.border.strong,
  },
  keyLabel: {
    fontSize: typography.size.sm,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
  },
  keyMono: {
    fontFamily: typography.fontFamily.mono,
  },
  modKey: {
    borderColor: colors.border.strong,
  },
  modKeyActive: {
    backgroundColor: colors.accent.purple,
    borderColor: colors.accent.purple,
  },
  modKeyLabelActive: {
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.bold,
  },
  sep: {
    width: 1,
    height: 22,
    backgroundColor: colors.border.default,
    marginHorizontal: spacing.xs,
  },
});
