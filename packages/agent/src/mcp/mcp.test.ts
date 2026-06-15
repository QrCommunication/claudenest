/**
 * Tests for the ClaudeNest MCP server.
 *
 * Covers:
 * - Environment gate (exit 1 on missing required vars) via child_process
 * - Tool description length constraint (≤ 100 chars) on all 13 registered tools
 * - Core tool behaviour with fetch mocked (success / 4xx / timeout paths)
 * - context_query content truncation at 500 characters
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { registerTools, parseAbilities } from "./tools.js";
import type { McpEnv } from "./api.js";

const execFileAsync = promisify(execFile);

// ─── Test helpers ─────────────────────────────────────────────────────────────

const REQUIRED_ENV_VARS = [
  "CLAUDENEST_API_URL",
  "CLAUDENEST_TOKEN",
  "CLAUDENEST_PROJECT_ID",
  "CLAUDENEST_INSTANCE_ID",
] as const;

/** Minimal valid env for all tool tests. */
function makeEnv(overrides: Partial<McpEnv> = {}): McpEnv {
  return {
    apiUrl: "https://claudenest.test",
    token: "tok-test",
    projectId: "proj-1111-2222-3333",
    instanceId: "inst-aaaa-bbbb-cccc",
    ...overrides,
  };
}

// Shape of an entry in server._registeredTools (SDK internal, plain object keyed by name)
interface RegisteredTool {
  description?: string;
  handler: (args: Record<string, unknown>, extra: unknown) => Promise<unknown>;
  enabled?: boolean;
}

/**
 * Create a fresh McpServer and register all tools.
 * Returns the server and a helper to invoke a named tool.
 */
function setupServer(env: McpEnv, abilities?: Set<string>): {
  server: McpServer;
  invoke: (name: string, args: Record<string, unknown>) => Promise<{ content: Array<{ type: string; text: string }>; isError?: true }>;
} {
  const server = new McpServer({ name: "test", version: "0.0.1" });
  registerTools(server, env, abilities ?? new Set());

  // Access tool handlers via the internal registry.
  // The SDK stores tools in server._registeredTools (plain object, NOT a Map).
  const invoke = async (name: string, args: Record<string, unknown>) => {
    // @ts-expect-error — accessing private SDK internals for testing
    const registry = server._registeredTools as Record<string, RegisteredTool> | undefined;
    const entry = registry?.[name];
    if (!entry) throw new Error(`Tool "${name}" not found in registry`);
    return entry.handler(args, {}) as Promise<{ content: Array<{ type: string; text: string }>; isError?: true }>;
  };

  return { server, invoke };
}

/** Helper: get registered tool names for a given set of abilities. */
function toolNames(abilities?: Set<string>): Set<string> {
  const server = new McpServer({ name: "test", version: "0.0.1" });
  registerTools(server, makeEnv(), abilities ?? new Set());
  // @ts-expect-error — accessing private SDK internals for testing
  const registry = server._registeredTools as Record<string, unknown> | undefined;
  return new Set(Object.keys(registry ?? {}));
}

// ─── Mock fetch builder ───────────────────────────────────────────────────────

type MockResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

function mockFetchOnce(response: MockResponse): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValueOnce(response),
  );
}

function mockFetchTimeout(): void {
  // Use mockRejectedValue (not Once) so every call including retries fails,
  // allowing the TimeoutError to reach apiRequest's catch handler.
  vi.stubGlobal(
    "fetch",
    vi.fn().mockRejectedValue(
      Object.assign(new Error("Request timed out"), { name: "TimeoutError" }),
    ),
  );
}

function makeSuccessResponse(data: unknown): MockResponse {
  return {
    ok: true,
    status: 200,
    json: async () => ({ success: true, data, meta: {} }),
  };
}

function make4xxResponse(status: number, code: string, message: string): MockResponse {
  return {
    ok: false,
    status,
    json: async () => ({
      success: false,
      error: { code, message },
    }),
  };
}

// ─── Environment gate ─────────────────────────────────────────────────────────

// Ces tests spawnent l'artefact COMPILÉ — skip si le build n'a pas encore tourné
// (fresh clone / CI avant le step Build).
const distMcpEntry = fileURLToPath(new URL("../../dist/mcp/index.js", import.meta.url));

describe.skipIf(!existsSync(distMcpEntry))("Environment gate (index.ts)", () => {
  it("exits 1 with stderr message when all required vars are missing", async () => {
    // Spawn the compiled entry (dist/mcp/index.js) with no CLAUDENEST_* env vars.
    // We strip all CLAUDENEST_* vars to ensure a clean test.
    const env = Object.fromEntries(
      Object.entries(process.env).filter(([k]) => !k.startsWith("CLAUDENEST_")),
    );

    // The process must exit before the 5s timeout
    const result = await execFileAsync(
      process.execPath,
      ["dist/mcp/index.js"],
      {
        cwd: new URL("../..", import.meta.url).pathname,
        env,
        timeout: 5000,
      },
    ).catch((err: NodeJS.ErrnoException & { code?: number; stderr?: string }) => err);

    // execFile rejects on non-zero exit — we expect exit code 1
    expect(result).toHaveProperty("code", 1);
    // The stderr message must mention the missing variables
    const stderr = (result as NodeJS.ErrnoException & { stderr?: string }).stderr ?? "";
    expect(stderr).toContain("Missing required environment variables");
    for (const v of REQUIRED_ENV_VARS) {
      expect(stderr).toContain(v);
    }
  });

  it("exits 1 even when only one required var is missing", async () => {
    const env = Object.fromEntries(
      Object.entries(process.env).filter(([k]) => !k.startsWith("CLAUDENEST_")),
    );
    // Provide 3 of the 4 required vars
    env["CLAUDENEST_API_URL"] = "https://x.test";
    env["CLAUDENEST_TOKEN"] = "tok";
    env["CLAUDENEST_PROJECT_ID"] = "proj-id";
    // CLAUDENEST_INSTANCE_ID is intentionally missing

    const result = await execFileAsync(
      process.execPath,
      ["dist/mcp/index.js"],
      {
        cwd: new URL("../..", import.meta.url).pathname,
        env,
        timeout: 5000,
      },
    ).catch((err: NodeJS.ErrnoException & { stderr?: string }) => err);

    expect(result).toHaveProperty("code", 1);
    const stderr = (result as NodeJS.ErrnoException & { stderr?: string }).stderr ?? "";
    expect(stderr).toContain("CLAUDENEST_INSTANCE_ID");
  });
});

// ─── parseAbilities ──────────────────────────────────────────────────────────

describe("parseAbilities", () => {
  it("returns empty Set for undefined", () => {
    expect(parseAbilities(undefined).size).toBe(0);
  });

  it("returns empty Set for empty string", () => {
    expect(parseAbilities("").size).toBe(0);
  });

  it("parses single ability", () => {
    const s = parseAbilities("planning");
    expect(s.has("planning")).toBe(true);
    expect(s.size).toBe(1);
  });

  it("parses comma-separated abilities", () => {
    const s = parseAbilities("multiagent,planning");
    expect(s.has("multiagent")).toBe(true);
    expect(s.has("planning")).toBe(true);
    expect(s.size).toBe(2);
  });

  it("trims whitespace and lowercases", () => {
    const s = parseAbilities("  Planning , MULTIAGENT ");
    expect(s.has("planning")).toBe(true);
    expect(s.has("multiagent")).toBe(true);
  });
});

// ─── Ability gating ───────────────────────────────────────────────────────────

const PLANNING_TOOLS = [
  "epic_create",
  "task_create",
  "task_update",
  "task_decompose",
  "sprint_create",
  "sprint_assign",
  "execution_start",
  "backlog_stats",
] as const;

describe("Ability gating — planning tools", () => {
  it("planning tools are ABSENT when abilities is empty", () => {
    const names = toolNames(new Set());
    for (const tool of PLANNING_TOOLS) {
      expect(names.has(tool), `Expected "${tool}" to be absent without planning ability`).toBe(false);
    }
  });

  it("core tools are present even without planning ability", () => {
    const names = toolNames(new Set());
    expect(names.has("task_list")).toBe(true);
    expect(names.has("lock_acquire")).toBe(true);
    expect(names.has("context_query")).toBe(true);
    expect(names.has("project_info")).toBe(true);
  });

  it("planning tools are PRESENT when abilities includes 'planning'", () => {
    const names = toolNames(new Set(["planning"]));
    for (const tool of PLANNING_TOOLS) {
      expect(names.has(tool), `Expected "${tool}" to be present with planning ability`).toBe(true);
    }
  });

  it("planning tools are present with mixed abilities (multiagent,planning)", () => {
    const names = toolNames(parseAbilities("multiagent,planning"));
    for (const tool of PLANNING_TOOLS) {
      expect(names.has(tool)).toBe(true);
    }
  });

  it("total registered tools = 14 without planning", () => {
    expect(toolNames(new Set()).size).toBe(14);
  });

  it("total registered tools = 22 with planning", () => {
    expect(toolNames(new Set(["planning"])).size).toBe(22);
  });
});

// ─── Tool descriptions ────────────────────────────────────────────────────────

describe("Tool descriptions — max 100 chars", () => {
  it("all registered tool descriptions (core) are ≤ 100 characters", () => {
    const env = makeEnv();
    const server = new McpServer({ name: "test", version: "0.0.1" });
    registerTools(server, env, new Set());

    // @ts-expect-error — accessing private SDK internals for testing
    const tools = server._registeredTools as Record<string, { description?: string }> | undefined;

    const entries = Object.entries(tools ?? {});
    expect(entries.length).toBeGreaterThanOrEqual(13);

    for (const [name, entry] of entries) {
      const desc = entry.description ?? "";
      expect(desc.length, `Tool "${name}" description too long (${desc.length} chars)`).toBeLessThanOrEqual(100);
    }
  });

  it("all planning tool descriptions are ≤ 100 characters", () => {
    const env = makeEnv();
    const server = new McpServer({ name: "test", version: "0.0.1" });
    registerTools(server, env, new Set(["planning"]));

    // @ts-expect-error — accessing private SDK internals for testing
    const tools = server._registeredTools as Record<string, { description?: string }> | undefined;

    const entries = Object.entries(tools ?? {});
    expect(entries.length).toBeGreaterThanOrEqual(20);

    for (const [name, entry] of entries) {
      const desc = entry.description ?? "";
      expect(desc.length, `Tool "${name}" description too long (${desc.length} chars)`).toBeLessThanOrEqual(100);
    }
  });
});

// ─── task_list ────────────────────────────────────────────────────────────────

describe("task_list tool", () => {
  let invoke: ReturnType<typeof setupServer>["invoke"];

  beforeEach(() => {
    ({ invoke } = setupServer(makeEnv()));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns compact lines on success", async () => {
    mockFetchOnce(
      makeSuccessResponse([
        {
          id: "aabbccdd-1111-2222-3333-444455556666",
          title: "Implement OAuth",
          status: "pending",
          priority: "high",
          files: ["src/auth.ts"],
        },
      ]),
    );

    const result = await invoke("task_list", {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0]?.text).toContain("aabbccdd"); // id8 prefix
    expect(result.content[0]?.text).toContain("[pending/high]");
    expect(result.content[0]?.text).toContain("Implement OAuth");
  });

  it("returns 'No tasks found.' when data is empty", async () => {
    mockFetchOnce(makeSuccessResponse([]));

    const result = await invoke("task_list", {});
    expect(result.content[0]?.text).toBe("No tasks found.");
  });

  it("returns isError on 5xx", async () => {
    // Both the original fetch + 1 retry return 500
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ success: false, error: { code: "SERVER_ERROR", message: "Internal server error" } }),
      }),
    );

    const result = await invoke("task_list", {});
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain("Failed to list tasks");
  });
});

// ─── task_claim ───────────────────────────────────────────────────────────────

describe("task_claim tool", () => {
  let invoke: ReturnType<typeof setupServer>["invoke"];

  beforeEach(() => {
    ({ invoke } = setupServer(makeEnv()));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns task detail on success", async () => {
    mockFetchOnce(
      makeSuccessResponse({
        id: "task-uuid-1111-2222",
        title: "Fix login bug",
        status: "in_progress",
        priority: "critical",
        description: "The OAuth flow fails on Safari.",
      }),
    );

    const result = await invoke("task_claim", { task_id: "task-uuid-1111-2222" });
    expect(result.isError).toBeUndefined();
    expect(result.content[0]?.text).toContain("task-uuid-1111-2222");
    expect(result.content[0]?.text).toContain("Fix login bug");
    expect(result.content[0]?.text).toContain("in_progress");
  });

  it("returns isError on 409 (already claimed)", async () => {
    mockFetchOnce(make4xxResponse(409, "TASK_CONFLICT", "Task is already claimed by another instance"));

    const result = await invoke("task_claim", { task_id: "task-uuid-1111-2222" });
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain("TASK_CONFLICT");
  });
});

// ─── lock_acquire ─────────────────────────────────────────────────────────────

describe("lock_acquire tool", () => {
  let invoke: ReturnType<typeof setupServer>["invoke"];

  beforeEach(() => {
    ({ invoke } = setupServer(makeEnv()));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns confirmation on success", async () => {
    mockFetchOnce(
      makeSuccessResponse({ id: "lock-id", path: "src/auth.ts", locked_by: "inst-aaaa" }),
    );

    const result = await invoke("lock_acquire", { path: "src/auth.ts" });
    expect(result.isError).toBeUndefined();
    expect(result.content[0]?.text).toBe("Lock acquired: src/auth.ts");
  });

  it("returns isError with conflict owner on 409", async () => {
    mockFetchOnce(
      make4xxResponse(409, "LOCK_CONFLICT", "File locked by inst-other"),
    );

    const result = await invoke("lock_acquire", { path: "src/auth.ts" });
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain("LOCK_CONFLICT");
  });

  it("returns isError on timeout", async () => {
    mockFetchTimeout();

    const result = await invoke("lock_acquire", { path: "src/auth.ts" });
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain("timed out");
  });
});

// ─── context_query ────────────────────────────────────────────────────────────

describe("context_query tool", () => {
  let invoke: ReturnType<typeof setupServer>["invoke"];

  beforeEach(() => {
    ({ invoke } = setupServer(makeEnv()));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("truncates chunk content at 500 characters", async () => {
    const longContent = "A".repeat(600);
    mockFetchOnce(
      makeSuccessResponse([
        {
          id: "chunk-1",
          content: longContent,
          type: "summary",
          similarity: 0.92,
          created_at: "2026-01-01T00:00:00Z",
        },
      ]),
    );

    const result = await invoke("context_query", { query: "auth" });
    expect(result.isError).toBeUndefined();
    const text = result.content[0]?.text ?? "";
    // The content should be truncated: 500 chars + "…" = 501 chars total
    // Full content line contains the bracket prefix + score + truncated content
    expect(text).toContain("A".repeat(500) + "…");
    // The original 600 A's should NOT appear
    expect(text).not.toContain("A".repeat(501));
  });

  it("returns 'No context found.' on empty result", async () => {
    mockFetchOnce(makeSuccessResponse([]));

    const result = await invoke("context_query", { query: "auth", limit: 3 });
    expect(result.content[0]?.text).toBe("No context found.");
  });

  it("shows similarity score in output", async () => {
    mockFetchOnce(
      makeSuccessResponse([
        {
          id: "chunk-2",
          content: "OAuth implementation using PKCE",
          type: "decision",
          similarity: 0.87,
          created_at: "2026-01-01T00:00:00Z",
        },
      ]),
    );

    const result = await invoke("context_query", { query: "auth" });
    // Score (0.87 * 100).toFixed(0) = "87"
    expect(result.content[0]?.text).toContain("87%");
    expect(result.content[0]?.text).toContain("[decision]");
  });
});

// ─── broadcast_message ────────────────────────────────────────────────────────

describe("broadcast_message tool", () => {
  let invoke: ReturnType<typeof setupServer>["invoke"];

  beforeEach(() => {
    ({ invoke } = setupServer(makeEnv()));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns confirmation with type and truncated message", async () => {
    mockFetchOnce(makeSuccessResponse({}));

    const result = await invoke("broadcast_message", {
      message: "Deployment complete",
      type: "info",
    });
    expect(result.isError).toBeUndefined();
    expect(result.content[0]?.text).toContain("[info]");
    expect(result.content[0]?.text).toContain("Deployment complete");
  });
});

// ─── Planning: epic_create ────────────────────────────────────────────────────

describe("epic_create tool (planning ability)", () => {
  let invoke: ReturnType<typeof setupServer>["invoke"];

  beforeEach(() => {
    ({ invoke } = setupServer(makeEnv(), new Set(["planning"])));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns compact confirmation on success", async () => {
    mockFetchOnce(
      makeSuccessResponse({
        id: "epic-uuid-0001-0002-0003-000400050006",
        title: "Authentication",
        status: "open",
        priority: "high",
        color: "#a855f7",
        icon: "lock",
      }),
    );

    const result = await invoke("epic_create", {
      title: "Authentication",
      color: "#a855f7",
      priority: "high",
    });
    expect(result.isError).toBeUndefined();
    const text = result.content[0]?.text ?? "";
    expect(text).toContain("Epic created:");
    expect(text).toContain("Authentication");
    expect(text).toContain("[open/high]");
  });

  it("returns isError on 422 validation error (title missing)", async () => {
    mockFetchOnce(
      make4xxResponse(422, "VALIDATION_ERROR", "The title field is required."),
    );

    const result = await invoke("epic_create", { title: "" });
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain("VALIDATION_ERROR");
    expect(result.content[0]?.text).toContain("title field is required");
  });
});

// ─── Planning: task_create ────────────────────────────────────────────────────

describe("task_create tool (planning ability)", () => {
  let invoke: ReturnType<typeof setupServer>["invoke"];

  beforeEach(() => {
    ({ invoke } = setupServer(makeEnv(), new Set(["planning"])));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns compact confirmation on success", async () => {
    mockFetchOnce(
      makeSuccessResponse({
        id: "task-1234-5678-abcd-efgh-ijklmnopqrst",
        title: "Implement JWT refresh",
        status: "pending",
        priority: "high",
        story_points: 5,
      }),
    );

    const result = await invoke("task_create", {
      title: "Implement JWT refresh",
      priority: "high",
      story_points: 5,
    });
    expect(result.isError).toBeUndefined();
    const text = result.content[0]?.text ?? "";
    expect(text).toContain("Task created:");
    expect(text).toContain("Implement JWT refresh");
    expect(text).toContain("[pending]");
  });

  it("returns isError on 422 with readable message", async () => {
    mockFetchOnce(
      make4xxResponse(422, "VALIDATION_ERROR", "The story points must be between 1 and 100."),
    );

    const result = await invoke("task_create", {
      title: "Bad task",
      story_points: 999,
    });
    expect(result.isError).toBe(true);
    const text = result.content[0]?.text ?? "";
    expect(text).toContain("VALIDATION_ERROR");
    expect(text).toContain("story points");
  });
});

// ─── Planning: sprint_create ──────────────────────────────────────────────────

describe("sprint_create tool (planning ability)", () => {
  let invoke: ReturnType<typeof setupServer>["invoke"];

  beforeEach(() => {
    ({ invoke } = setupServer(makeEnv(), new Set(["planning"])));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns compact confirmation on success", async () => {
    mockFetchOnce(
      makeSuccessResponse({
        id: "sprint-aaa-bbb-ccc-ddd",
        name: "Sprint 1",
        status: "planning",
        start_date: "2026-06-16",
        end_date: "2026-06-30",
        capacity: 40,
      }),
    );

    const result = await invoke("sprint_create", {
      name: "Sprint 1",
      start_date: "2026-06-16",
      end_date: "2026-06-30",
      capacity: 40,
    });
    expect(result.isError).toBeUndefined();
    const text = result.content[0]?.text ?? "";
    expect(text).toContain("Sprint created:");
    expect(text).toContain("Sprint 1");
    expect(text).toContain("2026-06-16");
    expect(text).toContain("2026-06-30");
    expect(text).toContain("cap:40");
  });

  it("returns isError on 422 (end_date before start_date)", async () => {
    mockFetchOnce(
      make4xxResponse(422, "VALIDATION_ERROR", "The end date must be a date after or equal to start date."),
    );

    const result = await invoke("sprint_create", {
      name: "Bad sprint",
      start_date: "2026-07-01",
      end_date: "2026-06-01",
    });
    expect(result.isError).toBe(true);
    const text = result.content[0]?.text ?? "";
    expect(text).toContain("VALIDATION_ERROR");
    expect(text).toContain("end date");
  });
});
