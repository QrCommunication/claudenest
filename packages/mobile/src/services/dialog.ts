/**
 * In-app dialog service
 * Drop-in replacements for React Native's native `Alert.alert` / `Alert.prompt`
 * that render through the design-system `Modal` instead of the OS chrome, so
 * every confirmation / prompt in the app looks consistent (and themed).
 *
 * The imperative `showAlert` / `showPrompt` keep RN's signature so call sites
 * change by name only. A single <DialogHost/> (mounted at the app root) renders
 * the queue.
 */
import { create } from "zustand";

export type DialogButtonStyle = "default" | "cancel" | "destructive";

export interface DialogButton {
  text?: string;
  /** For prompts, receives the entered text (matches RN Alert.prompt). */
  onPress?: (value?: string) => void;
  style?: DialogButtonStyle;
}

interface BaseDialog {
  id: string;
  title?: string;
  message?: string;
  buttons: DialogButton[];
}

export interface AlertDialog extends BaseDialog {
  kind: "alert";
}

export interface PromptDialog extends BaseDialog {
  kind: "prompt";
  defaultValue: string;
  placeholder?: string;
  secure: boolean;
}

export type DialogItem = AlertDialog | PromptDialog;

interface DialogState {
  queue: DialogItem[];
  present: (item: DialogItem) => void;
  dismiss: (id: string) => void;
}

export const useDialogStore = create<DialogState>((set) => ({
  queue: [],
  present: (item) => set((state) => ({ queue: [...state.queue, item] })),
  dismiss: (id) =>
    set((state) => ({ queue: state.queue.filter((d) => d.id !== id) })),
}));

let seq = 0;
const nextId = (): string => `dlg_${++seq}`;

const DEFAULT_BUTTONS: DialogButton[] = [{ text: "OK", style: "default" }];

/**
 * Replacement for `Alert.alert(title, message?, buttons?)`.
 */
export function showAlert(
  title?: string,
  message?: string,
  buttons?: DialogButton[],
): void {
  useDialogStore.getState().present({
    kind: "alert",
    id: nextId(),
    title,
    message,
    buttons: buttons && buttons.length > 0 ? buttons : DEFAULT_BUTTONS,
  });
}

type PromptType =
  | "default"
  | "plain-text"
  | "secure-text"
  | "login-password"
  | "numeric";

/**
 * Replacement for `Alert.prompt(title, message?, buttons?, type?, default?)`
 * (buttons-array form). The entered text is forwarded to each button's
 * onPress, exactly like RN.
 */
export function showPrompt(
  title?: string,
  message?: string,
  buttons?: DialogButton[],
  type?: PromptType,
  defaultValue?: string,
  placeholder?: string,
): void {
  useDialogStore.getState().present({
    kind: "prompt",
    id: nextId(),
    title,
    message,
    buttons: buttons && buttons.length > 0 ? buttons : DEFAULT_BUTTONS,
    defaultValue: defaultValue ?? "",
    placeholder,
    secure: type === "secure-text" || type === "login-password",
  });
}
