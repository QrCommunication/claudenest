/**
 * Push notifications service (Expo Push)
 *
 * Registers the device Expo push token with the server (POST /push-tokens)
 * and routes notification taps to the matching session screen. The server
 * pushes through exp.host on every SessionNotification with
 * `data: { session_id, project_id, type }` and prunes DeviceNotRegistered
 * tokens itself, so client-side cleanup is best-effort only.
 *
 * Every entry point is fail-safe by design: push registration must never
 * crash the boot or block login/logout (simulators, Expo Go, missing EAS
 * project, denied permission, offline server… all degrade silently).
 */
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { api } from "@/services/api";
import { navigationRef, navigateToSession } from "@/navigation/navigationRef";
// Static import is cycle-free: authStore reaches this module through a
// dynamic import() inside logout(), never at module load time.
import { useAuthStore } from "@/stores/authStore";

const PUSH_TOKEN_STORAGE_KEY = "claudenest-push-token";
const ANDROID_CHANNEL_ID = "default";
/** Cold-start navigation: poll until the nav tree + auth state are ready. */
const NAV_RETRY_DELAY_MS = 500;
const NAV_MAX_RETRIES = 20;

/**
 * Foreground behavior: suppress the system alert entirely — the in-app
 * <NotificationBanner/> (fed by the `session:notification` websocket event)
 * already covers the foreground case; showing both would duplicate.
 * Background/killed delivery is handled by the OS and is not affected.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function debugLog(message: string, ...args: unknown[]): void {
  if (__DEV__) {
    console.warn(`[Push] ${message}`, ...args);
  }
}

/** EAS project id from app config — required by getExpoPushTokenAsync. */
function getEasProjectId(): string | null {
  const eas = Constants.expoConfig?.extra?.eas as
    | { projectId?: unknown }
    | undefined;
  const projectId = eas?.projectId;
  return typeof projectId === "string" && projectId.length > 0
    ? projectId
    : null;
}

let registrationInFlight = false;

/**
 * Register this device for push notifications and upsert the token
 * server-side. Fire-and-forget: never throws, never blocks.
 */
export async function registerForPush(): Promise<void> {
  if (registrationInFlight) return;
  registrationInFlight = true;
  try {
    // Push tokens can only be issued on physical hardware.
    if (!Device.isDevice) {
      debugLog("registration skipped: not a physical device");
      return;
    }

    const projectId = getEasProjectId();
    if (!projectId) {
      debugLog("registration skipped: no EAS projectId in app config");
      return;
    }

    // Android 8+ requires a channel before any notification can display.
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: "Default",
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const current = await Notifications.getPermissionsAsync();
    let granted = current.status === "granted";
    if (!granted) {
      const requested = await Notifications.requestPermissionsAsync();
      granted = requested.status === "granted";
    }
    if (!granted) {
      debugLog("registration skipped: permission not granted");
      return;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    const platform =
      Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : null;

    await api.post("/push-tokens", {
      token,
      platform,
      device_info: {
        model_name: Device.modelName,
        os_version: Device.osVersion,
      },
    });

    // Remember the token locally so logout can DELETE it server-side.
    await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
  } catch (err) {
    debugLog("registration failed", err);
  } finally {
    registrationInFlight = false;
  }
}

/**
 * Best-effort server-side token removal. Must be called while the user is
 * still authenticated (the DELETE endpoint requires the bearer token).
 * Never throws — the server prunes DeviceNotRegistered tokens anyway.
 */
export async function unregisterPush(): Promise<void> {
  let token: string | null = null;
  try {
    token = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
  } catch {
    return;
  }
  if (!token) return;

  try {
    await api.delete("/push-tokens", { data: { token } });
  } catch {
    // Non-blocking — logout proceeds regardless.
  }
  try {
    await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
  } catch {
    // Local purge failure is harmless: the next register overwrites it.
  }
}

/** Tap responses already routed (cold start + listener can both deliver). */
const handledResponses = new Set<string>();

function extractSessionId(
  response: Notifications.NotificationResponse,
): string | null {
  const data = response.notification.request.content.data as
    | Record<string, unknown>
    | null
    | undefined;
  const sessionId = data?.session_id;
  return typeof sessionId === "string" && sessionId.length > 0
    ? sessionId
    : null;
}

/**
 * On a cold start the navigation tree (and the persisted auth state) is not
 * ready when the tap response is delivered — retry briefly before giving up.
 */
function navigateWhenReady(sessionId: string, attempt: number): void {
  const isAuthenticated = useAuthStore.getState().isAuthenticated === true;
  if (isAuthenticated && navigationRef.isReady()) {
    navigateToSession(sessionId);
    return;
  }
  if (attempt >= NAV_MAX_RETRIES) return;
  setTimeout(
    () => navigateWhenReady(sessionId, attempt + 1),
    NAV_RETRY_DELAY_MS,
  );
}

function handleNotificationTap(
  response: Notifications.NotificationResponse,
): void {
  const key = `${response.notification.request.identifier}:${response.notification.date}`;
  if (handledResponses.has(key)) return;
  handledResponses.add(key);

  const sessionId = extractSessionId(response);
  if (!sessionId) return;
  navigateWhenReady(sessionId, 0);
}

/**
 * Attach the notification tap listener (app-wide, mount once in App.tsx)
 * and replay the cold-start response if the app was launched by a tap.
 * Returns the cleanup function.
 */
export function attachNotificationListeners(): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    handleNotificationTap,
  );

  Notifications.getLastNotificationResponseAsync()
    .then((response) => {
      if (response) handleNotificationTap(response);
    })
    .catch(() => {
      // Worst case the cold-start tap is ignored — never fatal.
    });

  return () => subscription.remove();
}
