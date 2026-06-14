/**
 * Pure session-status helpers — no React/RN imports, so they're unit-testable
 * in a node environment. Shared by the OS dock (and reusable by session cards).
 */

import { colors } from "@/theme";
import type { Session, SessionStatus } from "@/types";

/** Statuses for which a session is "live" (running or about to run). */
export const LIVE_STATUSES: ReadonlySet<SessionStatus> = new Set([
  "created",
  "starting",
  "running",
  "waiting_input",
]);

export function isLiveSession(s: Session): boolean {
  return LIVE_STATUSES.has(s.status);
}

/** Status-dot color for a session (dock, cards). */
export function sessionStatusColor(status: SessionStatus): string {
  switch (status) {
    case "running":
      return colors.status.online;
    case "waiting_input":
      return colors.status.warning;
    case "starting":
    case "created":
      return colors.status.connecting;
    case "error":
      return colors.status.error;
    default:
      return colors.status.idle;
  }
}

/** Short human label for a session (project basename, else a short id). */
export function sessionLabel(s: Session): string {
  const base = s.project_path?.split("/").filter(Boolean).pop();
  if (base) return base;
  return `sh-${s.id.slice(0, 4)}`;
}
