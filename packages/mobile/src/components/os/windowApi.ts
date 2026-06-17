/**
 * windowApi — the bus that replaces React Navigation inside the "Claude OS"
 * shell. Each window provides its id via WindowIdProvider; the content reads a
 * scoped WindowApi (open another app, or close/rename/focus its own window)
 * through useWindowApi(). This is what lets a feature render in a floating
 * window without a NavigationContainer.
 */

import { createContext, useContext, useMemo } from "react";
import {
  type OpenAppInput,
  useWindowManagerStore,
} from "@/stores/windowManagerStore";

export interface WindowApi {
  /** The id of the window this content lives in. */
  windowId: string;
  /** Open (or focus) another app as a window. Returns the window id. */
  openApp: (input: OpenAppInput) => string;
  /** Close the current window. */
  close: () => void;
  /** Rename the current window's title (replaces navigation.setOptions title). */
  setTitle: (title: string) => void;
  /** Bring the current window to the front. */
  focus: () => void;
}

const WindowIdContext = createContext<string | null>(null);

export const WindowIdProvider = WindowIdContext.Provider;

/** Read the WindowApi scoped to the current window. Throws if used outside one. */
export function useWindowApi(): WindowApi {
  const windowId = useContext(WindowIdContext);
  const openApp = useWindowManagerStore((s) => s.openApp);
  const closeWindow = useWindowManagerStore((s) => s.closeWindow);
  const updateWindow = useWindowManagerStore((s) => s.updateWindow);
  const focusWindow = useWindowManagerStore((s) => s.focusWindow);

  if (!windowId) {
    throw new Error("useWindowApi must be used within a WindowIdProvider");
  }

  return useMemo<WindowApi>(
    () => ({
      windowId,
      openApp,
      close: () => closeWindow(windowId),
      setTitle: (title) => updateWindow(windowId, { title }),
      focus: () => focusWindow(windowId),
    }),
    [windowId, openApp, closeWindow, updateWindow, focusWindow],
  );
}
