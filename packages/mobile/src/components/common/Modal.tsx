/**
 * Modal Component
 * Bottom-sheet modal aligned with the "Terminal Premium" design system.
 * - Slides up from the bottom, dims the canvas behind it.
 * - Tap the backdrop (or the close button) to dismiss.
 * - Respects the keyboard and the bottom safe-area inset.
 * - `variant="center"` renders a centered dialog instead of a sheet.
 */

import React, { memo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal as RNModal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  type ViewStyle,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, borderRadius, typography, shadows } from "@/theme";

type ModalVariant = "sheet" | "center";

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  /** Hide the top-right close button (e.g. when dismissal is footer-driven). */
  hideCloseButton?: boolean;
  /** Dismiss when the backdrop is tapped. Defaults to true. */
  dismissOnBackdrop?: boolean;
  variant?: ModalVariant;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Extra style for the modal surface (the visible panel). */
  contentStyle?: ViewStyle;
}

export const Modal = memo(function Modal({
  visible,
  onClose,
  title,
  hideCloseButton = false,
  dismissOnBackdrop = true,
  variant = "sheet",
  children,
  footer,
  contentStyle,
}: ModalProps) {
  const insets = useSafeAreaInsets();

  const handleBackdropPress = useCallback(() => {
    if (dismissOnBackdrop) onClose();
  }, [dismissOnBackdrop, onClose]);

  const isSheet = variant === "sheet";

  return (
    <RNModal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType={isSheet ? "slide" : "fade"}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[
            styles.overlay,
            isSheet ? styles.overlaySheet : styles.overlayCenter,
          ]}
        >
          {/* Backdrop — fills the area behind the surface */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleBackdropPress}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />

          <View
            style={[
              styles.surface,
              isSheet ? styles.surfaceSheet : styles.surfaceCenter,
              isSheet && { paddingBottom: Math.max(insets.bottom, spacing.lg) },
              contentStyle,
            ]}
          >
            {isSheet ? <View style={styles.handle} /> : null}

            {(title || !hideCloseButton) && (
              <View style={styles.header}>
                <Text style={styles.title} numberOfLines={1}>
                  {title}
                </Text>
                {!hideCloseButton && (
                  <Pressable
                    onPress={onClose}
                    hitSlop={8}
                    style={styles.closeButton}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                  >
                    <Icon
                      name="close"
                      size={20}
                      color={colors.text.secondary}
                    />
                  </Pressable>
                )}
              </View>
            )}

            <View style={styles.body}>{children}</View>

            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(6,6,14,0.72)",
  },
  overlaySheet: {
    justifyContent: "flex-end",
  },
  overlayCenter: {
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  surface: {
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.border.strong,
    ...shadows.lg,
  },
  surfaceSheet: {
    width: "100%",
    maxHeight: "88%",
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.sm,
  },
  surfaceCenter: {
    width: "100%",
    maxWidth: 460,
    maxHeight: "85%",
    borderRadius: borderRadius.xl,
    paddingTop: spacing.lg,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.border.default,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  title: {
    flex: 1,
    fontSize: typography.size.lg,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg.input,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
});
