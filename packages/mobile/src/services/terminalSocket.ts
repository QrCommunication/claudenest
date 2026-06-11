/**
 * TerminalSocket
 * Direct, low-latency terminal I/O over the dedicated AgentServe WebSocket
 * (`/ws/terminal`) — the same fast path the web dashboard uses. Input and
 * resize go straight to the agent with no HTTP/Redis round-trip (the REST
 * `/sessions/{id}/input` path added ~hundreds of ms PER keystroke). Output is
 * pushed back over the same socket.
 *
 * Wire protocol (JSON frames):
 *   client → server: { type: "input", data }   { type: "resize", cols, rows }
 *   server → client: { type: "output", data }  { type: "status", status }
 */
import { useAuthStore } from "@/stores/authStore";

// Nginx proxies /ws/terminal to AgentServe on the SAME host that serves the
// SPA/REST API (the web client connects to `window.location.host/ws/terminal`,
// i.e. the apex). The agent gateway /ws/agent lives elsewhere — do NOT reuse
// the api subdomain here.
const TERMINAL_WS_URL =
  process.env.EXPO_PUBLIC_TERMINAL_WS_URL || "wss://claudenest.io/ws/terminal";

interface Handlers {
  onOutput: (data: string) => void;
  onStatus?: (status: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export class TerminalSocket {
  private ws: WebSocket | null = null;
  private readonly sessionId: string;
  private readonly handlers: Handlers;
  private closed = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private readonly sendQueue: string[] = [];

  constructor(sessionId: string, handlers: Handlers) {
    this.sessionId = sessionId;
    this.handlers = handlers;
  }

  connect(): void {
    if (this.closed) return;
    const token = useAuthStore.getState().accessToken;
    if (!token) {
      this.scheduleReconnect();
      return;
    }

    const url = `${TERMINAL_WS_URL}?token=${encodeURIComponent(
      token,
    )}&session=${encodeURIComponent(this.sessionId)}`;

    try {
      this.ws = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      // Flush anything buffered while connecting.
      while (this.sendQueue.length && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(this.sendQueue.shift()!);
      }
      this.handlers.onConnect?.();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(String(event.data));
        if (msg.type === "output" && typeof msg.data === "string") {
          this.handlers.onOutput(msg.data);
        } else if (msg.type === "status" && typeof msg.status === "string") {
          this.handlers.onStatus?.(msg.status);
        }
      } catch {
        /* ignore malformed frames */
      }
    };

    this.ws.onerror = () => {
      // onclose will follow and handle reconnection.
    };

    this.ws.onclose = () => {
      this.handlers.onDisconnect?.();
      this.ws = null;
      if (!this.closed) this.scheduleReconnect();
    };
  }

  sendInput(data: string): void {
    this.send({ type: "input", data });
  }

  sendResize(cols: number, rows: number): void {
    this.send({ type: "resize", cols, rows });
  }

  close(): void {
    this.closed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    try {
      this.ws?.close();
    } catch {
      /* ignore */
    }
    this.ws = null;
  }

  private send(obj: Record<string, unknown>): void {
    const frame = JSON.stringify(obj);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(frame);
    } else {
      // Buffer until (re)connected so the first keystrokes aren't dropped.
      this.sendQueue.push(frame);
      if (this.sendQueue.length > 200) this.sendQueue.shift();
    }
  }

  private scheduleReconnect(): void {
    if (this.closed || this.reconnectTimer) return;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 10000);
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
}
