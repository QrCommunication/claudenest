/**
 * DialogHost
 * Renders the in-app dialog queue (see services/dialog) through the design-
 * system Modal. Mounted once at the app root. Replaces native Alert dialogs.
 */
import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Input } from "./Input";
import { colors, spacing, typography } from "@/theme";
import {
  useDialogStore,
  type DialogButton,
  type DialogButtonStyle,
} from "@/services/dialog";

const variantFor = (style?: DialogButtonStyle) =>
  style === "destructive" ? "danger" : style === "cancel" ? "ghost" : "primary";

export const DialogHost: React.FC = () => {
  const item = useDialogStore((s) => s.queue[0]);
  const dismiss = useDialogStore((s) => s.dismiss);
  const [value, setValue] = useState("");

  // Reseed the input whenever a new prompt comes to the front of the queue.
  useEffect(() => {
    setValue(item && item.kind === "prompt" ? item.defaultValue : "");
  }, [item?.id]);

  const resolve = useCallback(
    (button?: DialogButton) => {
      if (!item) return;
      const payload = item.kind === "prompt" ? value : undefined;
      dismiss(item.id);
      button?.onPress?.(payload);
    },
    [item, value, dismiss],
  );

  // Backdrop / hardware-back acts like the cancel button (if any).
  const handleClose = useCallback(() => {
    resolve(item?.buttons.find((b) => b.style === "cancel"));
  }, [item, resolve]);

  if (!item) return null;

  const inRow = item.buttons.length <= 2;

  return (
    <Modal
      visible
      variant="center"
      onClose={handleClose}
      title={item.title}
      hideCloseButton
      footer={
        <View style={[styles.actions, inRow ? styles.row : styles.col]}>
          {item.buttons.map((button, index) => (
            <Button
              key={`${button.text ?? "btn"}-${index}`}
              title={button.text ?? "OK"}
              variant={variantFor(button.style)}
              onPress={() => resolve(button)}
              style={inRow ? styles.grow : undefined}
            />
          ))}
        </View>
      }
    >
      {item.message ? <Text style={styles.message}>{item.message}</Text> : null}
      {item.kind === "prompt" ? (
        <Input
          value={value}
          onChangeText={setValue}
          placeholder={item.placeholder}
          secureTextEntry={item.secure}
          autoFocus
          containerStyle={styles.input}
        />
      ) : null}
    </Modal>
  );
};

const styles = StyleSheet.create({
  message: {
    fontSize: typography.size.md,
    lineHeight: typography.size.md * 1.45,
    color: colors.text.secondary,
  },
  input: {
    marginTop: spacing.md,
  },
  actions: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
  },
  col: {
    flexDirection: "column",
  },
  grow: {
    flex: 1,
  },
});
