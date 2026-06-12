/**
 * Types for discovered Claude sessions (the user's own sessions scanned by
 * the agent, mirrored live and optionally adopted for remote control).
 */

export interface DiscoveredSession {
  id: string;
  machine_id: string;
  session_id: string;
  project_slug: string;
  cwd: string;
  project_name: string;
  transcript_path: string;
  is_live: boolean;
  pid: number | null;
  tty: string | null;
  started_at: string | null;
  last_activity_at: string | null;
  last_activity_human: string | null;
  size_bytes: number;
  last_preview: string | null;
  adopted: boolean;
  agent_session_id: string | null;
}

export interface TranscriptEvent {
  sessionId: string;
  seq: number;
  type: string;
  role?: 'user' | 'assistant' | 'system' | 'tool';
  text?: string;
  timestamp?: string;
}

/** Broadcast payload on `claude-sessions.{sessionId}`. */
export interface TranscriptBroadcast {
  session_id: string;
  events: TranscriptEvent[];
  replace: boolean;
  timestamp: string;
}

/**
 * Broadcast payload on `machines.{machineId}` (event claude_sessions.discovered).
 * Slim signal — the full session list exceeded Reverb's payload limit;
 * consumers refetch via GET /api/machines/{machine}/claude-sessions.
 */
export interface DiscoveredBroadcast {
  machine_id: string;
  count: number;
  timestamp: string;
}
