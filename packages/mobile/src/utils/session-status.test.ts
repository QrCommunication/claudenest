import {
  isLiveSession,
  sessionLabel,
  sessionStatusColor,
} from "./sessionStatus";
import type { Session, SessionStatus } from "@/types";

function makeSession(over: Partial<Session> = {}): Session {
  return {
    id: "11112222-3333-4444-5555-666677778888",
    machine_id: "m1",
    user_id: "u1",
    mode: "interactive",
    project_path: null,
    initial_prompt: null,
    status: "running",
    pid: null,
    exit_code: null,
    pty_size: { cols: 80, rows: 24 },
    total_tokens: null,
    total_cost: null,
    shared_project_id: null,
    orchestrated: false,
    started_at: null,
    completed_at: null,
    created_at: "2026-06-14T00:00:00Z",
    updated_at: "2026-06-14T00:00:00Z",
    ...over,
  };
}

describe("isLiveSession", () => {
  it.each<[SessionStatus, boolean]>([
    ["created", true],
    ["starting", true],
    ["running", true],
    ["waiting_input", true],
    ["completed", false],
    ["error", false],
    ["terminated", false],
  ])("status %s → live=%s", (status, expected) => {
    expect(isLiveSession(makeSession({ status }))).toBe(expected);
  });
});

describe("sessionStatusColor", () => {
  it("maps every status to a usable color token", () => {
    const statuses: SessionStatus[] = [
      "created",
      "starting",
      "running",
      "waiting_input",
      "completed",
      "error",
      "terminated",
    ];
    for (const s of statuses) {
      expect(sessionStatusColor(s)).toMatch(/^#|rgb/);
    }
  });

  it("distinguishes running vs waiting_input vs error", () => {
    expect(sessionStatusColor("running")).not.toBe(
      sessionStatusColor("waiting_input"),
    );
    expect(sessionStatusColor("error")).not.toBe(sessionStatusColor("running"));
  });
});

describe("sessionLabel", () => {
  it("uses the project basename when present", () => {
    expect(
      sessionLabel(makeSession({ project_path: "/home/dev/claudenest" })),
    ).toBe("claudenest");
  });

  it("ignores trailing slashes", () => {
    expect(sessionLabel(makeSession({ project_path: "/home/dev/app/" }))).toBe(
      "app",
    );
  });

  it("falls back to a short id when no path", () => {
    expect(sessionLabel(makeSession({ project_path: null }))).toBe("sh-1111");
  });
});
