/**
 * Navigation ref — imperative navigation from outside React components
 * (websocket handlers, in-app notification banners, services…).
 *
 * Import this module directly (not through the navigation barrel) to avoid
 * pulling every navigator/screen into non-UI modules.
 */
import { createNavigationContainerRef } from "@react-navigation/native";
import type { RootStackParamList } from "./types";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** Open the terminal screen for a session (no-op until the tree is ready). */
export function navigateToSession(sessionId: string): void {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate("Main", {
    screen: "SessionsTab",
    params: { screen: "Session", params: { sessionId } },
  });
}
