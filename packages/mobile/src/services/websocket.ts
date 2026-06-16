/**
 * WebSocket Client Service — Laravel Reverb (Pusher protocol)
 *
 * The ClaudeNest server broadcasts realtime events over Laravel Reverb, NOT
 * socket.io. This client uses laravel-echo + pusher-js to subscribe to the
 * private channels (sessions.{id}, machines.{id}, projects.{id}) and re-emits
 * the events through a small internal emitter so the stores keep their existing
 * `websocket.on('session:output', cb)` API.
 *
 * Outbound actions (session input/resize, project broadcast) are sent over the
 * REST API — Reverb is receive-only for clients.
 */

import Echo from "laravel-echo";
import * as PusherModule from "pusher-js";
import { api } from "./api";

// The pusher-js React Native build (dist/react-native/pusher.js) exposes the
// client as a NAMED export `Pusher` (`module.exports.Pusher = ...`) while the
// bundled type definitions declare a default export. Resolve the actual
// constructor at runtime so Echo's internal `new Pusher(...)` doesn't throw
// "Object cannot be used as a constructor".
const Pusher =
  (PusherModule as unknown as { Pusher?: unknown; default?: unknown }).Pusher ??
  (PusherModule as unknown as { default?: unknown }).default ??
  PusherModule;

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://claudenest.io";
// Reverb defaults to the production client endpoint. The app key is a PUBLIC
// client key (exposed in every client bundle by design, like the web app) —
// not a secret. Overridable via EXPO_PUBLIC_REVERB_* for other environments.
const REVERB_KEY =
  process.env.EXPO_PUBLIC_REVERB_APP_KEY || "ba5e8c79e195359afbe9bea81384770a";
const REVERB_HOST = process.env.EXPO_PUBLIC_REVERB_HOST || "claudenest.io";
const REVERB_PORT = Number(process.env.EXPO_PUBLIC_REVERB_PORT || 443);
const REVERB_SCHEME = process.env.EXPO_PUBLIC_REVERB_SCHEME || "https";

type EventCallback = (payload: unknown) => void;
type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

/** Generic payload coming from a Reverb broadcast (snake_case from PHP). */
interface ReverbPayload {
  session_id?: string;
  machine_id?: string;
  project_id?: string;
  data?: string;
  status?: string;
  chunk_id?: string;
  exit_code?: number;
  [key: string]: unknown;
}

class WebSocketService {
  private echo: Echo<"reverb"> | null = null;
  private token: string | null = null;
  private eventListeners: Map<string, Set<EventCallback>> = new Map();
  private subscribedChannels: Set<string> = new Set();

  public isConnected = false;
  public connectionState: ConnectionState = "disconnected";

  // ==================== CONNECTION ====================

  /**
   * Initialize the Reverb connection with the user's Sanctum token.
   * No-op (with a clear warning) if Reverb is not configured.
   */
  connect(token: string): void {
    if (this.echo) {
      return;
    }
    if (!REVERB_KEY) {
      console.warn(
        "[WebSocket] Reverb not configured (EXPO_PUBLIC_REVERB_APP_KEY missing) — realtime disabled",
      );
      return;
    }

    this.token = token;
    this.connectionState = "connecting";

    this.echo = new Echo({
      broadcaster: "reverb",
      // Pass the Pusher class explicitly: React Native has no `window.Pusher`.
      Pusher,
      key: REVERB_KEY,
      wsHost: REVERB_HOST,
      wsPort: REVERB_PORT,
      wssPort: REVERB_PORT,
      forceTLS: REVERB_SCHEME === "https",
      enabledTransports: ["ws", "wss"],
      authEndpoint: `${API_URL}/broadcasting/auth`,
      bearerToken: token,
      // `Pusher` and `bearerToken` are valid runtime options for the Reverb
      // connector but are not part of laravel-echo's exported option types.
    } as unknown as ConstructorParameters<typeof Echo>[0]);

    this.bindConnectionState();
  }

  private bindConnectionState(): void {
    const connection = (
      this.echo as unknown as {
        connector?: {
          pusher?: {
            connection?: {
              bind: (e: string, cb: (p?: unknown) => void) => void;
            };
          };
        };
      }
    )?.connector?.pusher?.connection;
    if (!connection) return;

    connection.bind("connected", () => {
      this.isConnected = true;
      this.connectionState = "connected";
      this.emit("connection:connected", {});
    });
    connection.bind("disconnected", () => {
      this.isConnected = false;
      this.connectionState = "disconnected";
      this.emit("connection:disconnected", {});
    });
    connection.bind("error", (error?: unknown) => {
      this.connectionState = "error";
      this.emit("connection:error", { error });
    });
  }

  disconnect(): void {
    if (this.echo) {
      this.subscribedChannels.forEach((channel) => {
        try {
          this.echo?.leave(channel);
        } catch {
          // already gone
        }
      });
      this.subscribedChannels.clear();
      try {
        this.echo.disconnect();
      } catch {
        // ignore
      }
      this.echo = null;
    }
    this.isConnected = false;
    this.connectionState = "disconnected";
    this.eventListeners.clear();
  }

  reconnect(token: string): void {
    this.disconnect();
    this.connect(token);
  }

  // ==================== INTERNAL EMITTER ====================

  /** Subscribe to a re-emitted event. Returns an unsubscribe function. */
  on(event: string, callback: EventCallback): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, payload: unknown): void {
    this.eventListeners.get(event)?.forEach((cb) => {
      try {
        cb(payload);
      } catch (err) {
        console.warn(`[WebSocket] listener for "${event}" threw`, err);
      }
    });
  }

  /** Legacy no-op kept for API compatibility (clients cannot push over Reverb). */
  send(): void {
    /* Reverb is receive-only for clients; outbound goes through REST helpers. */
  }

  // ==================== CHANNEL SUBSCRIPTIONS ====================

  private privateChannel(channel: string) {
    if (!this.echo) return null;
    this.subscribedChannels.add(channel);
    return this.echo.private(channel);
  }

  private leaveChannel(channel: string): void {
    if (this.subscribedChannels.has(channel)) {
      try {
        this.echo?.leave(channel);
      } catch {
        // already gone
      }
      this.subscribedChannels.delete(channel);
    }
  }

  /** Live terminal output + notifications for a session (channel `sessions.{id}`). */
  subscribeToSession(sessionId: string): void {
    const channel = this.privateChannel(`sessions.${sessionId}`);
    if (!channel) return;
    channel
      .listen(".session.output", (e: ReverbPayload) =>
        this.emit("session:output", {
          sessionId: e.session_id ?? sessionId,
          data: e.data ?? "",
          chunkId: e.chunk_id,
        }),
      )
      .listen(".session.notification", (e: ReverbPayload) =>
        this.emit("session:notification", {
          ...e,
          session_id: e.session_id ?? sessionId,
        }),
      );
  }

  unsubscribeFromSession(sessionId: string): void {
    this.leaveChannel(`sessions.${sessionId}`);
  }

  /** Session lifecycle + discovery for a machine (channel `machines.{id}`). */
  subscribeToMachine(machineId: string): void {
    const channel = this.privateChannel(`machines.${machineId}`);
    if (!channel) return;
    channel
      .listen(".session.created", (e: ReverbPayload) =>
        this.emit("session:created", e),
      )
      .listen(".session.terminated", (e: ReverbPayload) => {
        this.emit("session:status", {
          sessionId: e.session_id,
          status: e.status ?? "terminated",
        });
        this.emit("session:ended", {
          sessionId: e.session_id,
          exitCode: e.exit_code ?? 0,
        });
      })
      .listen(".claude_sessions.discovered", (e: ReverbPayload) =>
        this.emit("sessions:discovered", { machineId, ...e }),
      )
      .listen(".machine.command", (e: ReverbPayload) =>
        this.emit("machine:status", { machineId, ...e }),
      )
      .listen(".project.archived", (e: ReverbPayload) =>
        this.emit("project:archived", { machineId, ...e }),
      )
      .listen(".project.unarchived", (e: ReverbPayload) =>
        this.emit("project:unarchived", { machineId, ...e }),
      );
  }

  unsubscribeFromMachine(machineId: string): void {
    this.leaveChannel(`machines.${machineId}`);
  }

  /** Multi-agent coordination events for a project (channel `projects.{id}`). */
  subscribeToProject(projectId: string): void {
    const channel = this.privateChannel(`projects.${projectId}`);
    if (!channel) return;
    channel
      .listen(".task.created", (e: ReverbPayload) =>
        this.emit("task:created", e),
      )
      .listen(".task.claimed", (e: ReverbPayload) =>
        this.emit("task:updated", e),
      )
      .listen(".task.completed", (e: ReverbPayload) =>
        this.emit("task:updated", e),
      )
      .listen(".task.released", (e: ReverbPayload) =>
        this.emit("task:updated", e),
      )
      .listen(".file.locked", (e: ReverbPayload) => this.emit("file:locked", e))
      .listen(".file.unlocked", (e: ReverbPayload) =>
        this.emit("file:unlocked", e),
      )
      .listen(".epic.updated", (e: ReverbPayload) =>
        this.emit("epic:updated", e),
      )
      .listen(".epic.decomposition", (e: ReverbPayload) =>
        this.emit("epic:decomposition", e),
      )
      .listen(".sprint.updated", (e: ReverbPayload) =>
        this.emit("sprint:updated", e),
      )
      .listen(".sprint.started", (e: ReverbPayload) =>
        this.emit("sprint:updated", e),
      )
      .listen(".sprint.completed", (e: ReverbPayload) =>
        this.emit("sprint:updated", e),
      )
      .listen(".instance.updated", (e: ReverbPayload) =>
        this.emit("instance:updated", {
          ...e,
          project_id: e.project_id ?? projectId,
        }),
      )
      .listen(".session.notification", (e: ReverbPayload) =>
        this.emit("session:notification", {
          ...e,
          project_id: e.project_id ?? projectId,
        }),
      )
      .listen(".project.broadcast", (e: ReverbPayload) =>
        this.emit("project:broadcast", e),
      );
  }

  unsubscribeFromProject(projectId: string): void {
    this.leaveChannel(`projects.${projectId}`);
  }

  // ==================== OUTBOUND (REST) ====================

  /** Send input to a session's PTY (server relays to the agent). */
  sendSessionInput(sessionId: string, data: string): void {
    api.post(`/sessions/${sessionId}/input`, { data }).catch((err) => {
      console.warn("[WebSocket] sendSessionInput failed", err);
    });
  }

  /** Resize a session's PTY. */
  resizeSession(sessionId: string, cols: number, rows: number): void {
    api.post(`/sessions/${sessionId}/resize`, { cols, rows }).catch((err) => {
      console.warn("[WebSocket] resizeSession failed", err);
    });
  }

  /** Broadcast a message to all instances on a project. */
  broadcastToProject(projectId: string, message: string): void {
    api.post(`/projects/${projectId}/broadcast`, { message }).catch((err) => {
      console.warn("[WebSocket] broadcastToProject failed", err);
    });
  }
}

// Export singleton instance
export const websocket = new WebSocketService();

// Hook for using WebSocket in components
export const useWebSocket = () => {
  return {
    connect: (token: string) => websocket.connect(token),
    disconnect: () => websocket.disconnect(),
    on: (event: string, callback: EventCallback) =>
      websocket.on(event, callback),
    send: () => websocket.send(),
    isConnected: websocket.isConnected,
    connectionState: websocket.connectionState,
    subscribeToSession: (sessionId: string) =>
      websocket.subscribeToSession(sessionId),
    unsubscribeFromSession: (sessionId: string) =>
      websocket.unsubscribeFromSession(sessionId),
    sendSessionInput: (sessionId: string, data: string) =>
      websocket.sendSessionInput(sessionId, data),
    resizeSession: (sessionId: string, cols: number, rows: number) =>
      websocket.resizeSession(sessionId, cols, rows),
    subscribeToProject: (projectId: string) =>
      websocket.subscribeToProject(projectId),
    unsubscribeFromProject: (projectId: string) =>
      websocket.unsubscribeFromProject(projectId),
    broadcastToProject: (projectId: string, message: string) =>
      websocket.broadcastToProject(projectId, message),
    subscribeToMachine: (machineId: string) =>
      websocket.subscribeToMachine(machineId),
    unsubscribeFromMachine: (machineId: string) =>
      websocket.unsubscribeFromMachine(machineId),
  };
};

export default websocket;
