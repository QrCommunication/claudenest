/**
 * ClaudeNest MCP tool definitions.
 * All outputs are compact TEXT, never verbose JSON dumps.
 * All descriptions ≤ 100 chars.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { McpEnv, Task, Epic, Sprint } from "./api.js";
import {
  taskList,
  taskClaimNext,
  taskClaim,
  taskRelease,
  taskComplete,
  lockAcquire,
  lockRelease,
  lockCheck,
  contextQuery,
  contextAdd,
  contextSet,
  broadcastMessage,
  instanceHeartbeat,
  projectShow,
  epicCreate,
  taskCreate,
  taskUpdate,
  sprintCreate,
  planningContext,
  orchestratorStart,
  submitMasterPlan,
} from "./api.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Short 8-char ID prefix for compact output. */
function id8(id: string): string {
  return id.slice(0, 8);
}

/** Truncate a string to `max` characters. */
function trunc(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

/** Format a task as a compact single line. Full id so it can be passed
 *  straight to task_claim / task_update / task_complete without lookup. */
function fmtTaskLine(t: Task): string {
  const files = t.files && t.files.length > 0 ? ` — ${t.files.slice(0, 3).join(", ")}` : "";
  return `${t.id} [${t.status}/${t.priority}] ${t.title}${files}`;
}

/** Format a task with full detail (for claim/next). */
function fmtTaskDetail(t: Task): string {
  const lines: string[] = [
    `Task: ${t.id}`,
    `Title: ${t.title}`,
    `Status: ${t.status} | Priority: ${t.priority}`,
  ];
  if (t.description) lines.push(`Description: ${trunc(t.description, 300)}`);
  if (t.files && t.files.length > 0) lines.push(`Files: ${t.files.join(", ")}`);
  if (t.labels && t.labels.length > 0) lines.push(`Labels: ${t.labels.join(", ")}`);
  if (t.story_points != null) lines.push(`Story points: ${t.story_points}`);
  if (t.dependencies && t.dependencies.length > 0) {
    lines.push(`Dependencies: ${t.dependencies.join(", ")}`);
  }
  if (t.blocked_by) lines.push(`Blocked by: ${t.blocked_by}`);
  if (t.due_date) lines.push(`Due: ${t.due_date}`);
  return lines.join("\n");
}

/** Wrap a fetch result as an MCP tool response. */
function toolOk(text: string): { content: [{ type: "text"; text: string }] } {
  return { content: [{ type: "text" as const, text }] };
}

function toolErr(
  text: string,
): { content: [{ type: "text"; text: string }]; isError: true } {
  return { content: [{ type: "text" as const, text }], isError: true as const };
}

// ─── Tool registration ───────────────────────────────────────────────────────

/**
 * Parse CLAUDENEST_ABILITIES CSV string into a Set of ability names.
 * e.g. "multiagent,planning" → Set { "multiagent", "planning" }
 */
export function parseAbilities(raw: string | undefined): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Register all core tools (unconditional) and optionally planning tools.
 * @param abilities - Set of enabled abilities. Pass `parseAbilities(process.env.CLAUDENEST_ABILITIES)`.
 */
export function registerTools(
  server: McpServer,
  env: McpEnv,
  abilities: Set<string> = new Set(),
): void {
  // ── task_list ────────────────────────────────────────────────────────────
  server.tool(
    "task_list",
    "List project tasks. Optional filter: pending|in_progress|blocked|review|done",
    { status: z.string().optional() },
    async ({ status }) => {
      const res = await taskList(env, status);
      if (!res.ok) return toolErr(`Failed to list tasks: ${res.error}`);
      if (res.data.length === 0) return toolOk("No tasks found.");
      const lines = res.data.map(fmtTaskLine);
      return toolOk(`${res.data.length} task(s):\n${lines.join("\n")}`);
    },
  );

  // ── task_claim_next ──────────────────────────────────────────────────────
  server.tool(
    "task_claim_next",
    "Atomically claim the next available task for this instance.",
    {},
    async () => {
      const res = await taskClaimNext(env);
      if (!res.ok) return toolErr(`Failed to claim next task: ${res.error}`);
      if (!res.data) return toolOk("No task available.");
      return toolOk(`Claimed task:\n${fmtTaskDetail(res.data)}`);
    },
  );

  // ── task_claim ───────────────────────────────────────────────────────────
  server.tool(
    "task_claim",
    "Claim a specific task by ID for this instance.",
    { task_id: z.string().min(1) },
    async ({ task_id }) => {
      const res = await taskClaim(env, task_id);
      if (!res.ok) return toolErr(`Cannot claim task: ${res.error}`);
      return toolOk(`Claimed:\n${fmtTaskDetail(res.data)}`);
    },
  );

  // ── task_complete ────────────────────────────────────────────────────────
  server.tool(
    "task_complete",
    "Mark a claimed task as done with a summary (min 30 chars).",
    {
      task_id: z.string().min(1),
      summary: z.string().min(30),
      files_modified: z.array(z.string()).optional(),
    },
    async ({ task_id, summary, files_modified }) => {
      const res = await taskComplete(env, task_id, summary, files_modified ?? []);
      if (!res.ok) return toolErr(`Cannot complete task: ${res.error}`);
      return toolOk(
        `Task completed: ${id8(res.data.id)} — ${res.data.title}`,
      );
    },
  );

  // ── task_release ─────────────────────────────────────────────────────────
  server.tool(
    "task_release",
    "Release a claimed task back to the pool.",
    {
      task_id: z.string().min(1),
      reason: z.string().optional(),
    },
    async ({ task_id, reason }) => {
      const res = await taskRelease(env, task_id, reason);
      if (!res.ok) return toolErr(`Cannot release task: ${res.error}`);
      return toolOk(
        `Task released: ${id8(res.data.id)} — ${res.data.title} [${res.data.status}]`,
      );
    },
  );

  // ── lock_acquire ─────────────────────────────────────────────────────────
  server.tool(
    "lock_acquire",
    "Acquire an exclusive file lock. Returns conflict owner on 409.",
    {
      path: z.string().min(1),
      reason: z.string().optional(),
    },
    async ({ path, reason }) => {
      const res = await lockAcquire(env, path, reason);
      if (!res.ok) return toolErr(`Lock conflict: ${res.error}`);
      return toolOk(`Lock acquired: ${path}`);
    },
  );

  // ── lock_release ─────────────────────────────────────────────────────────
  server.tool(
    "lock_release",
    "Release a file lock held by this instance.",
    { path: z.string().min(1) },
    async ({ path }) => {
      const res = await lockRelease(env, path);
      if (!res.ok) return toolErr(`Cannot release lock: ${res.error}`);
      return toolOk(`Lock released: ${path}`);
    },
  );

  // ── lock_check ───────────────────────────────────────────────────────────
  server.tool(
    "lock_check",
    "Check lock status for one or more file paths.",
    { paths: z.array(z.string().min(1)).min(1) },
    async ({ paths }) => {
      const results: string[] = [];
      for (const path of paths) {
        const res = await lockCheck(env, path);
        if (!res.ok) {
          results.push(`${path}: error — ${res.error}`);
        } else if (res.data.is_locked) {
          results.push(`${path}: LOCKED by ${res.data.locked_by}`);
        } else {
          results.push(`${path}: free`);
        }
      }
      return toolOk(results.join("\n"));
    },
  );

  // ── context_query ────────────────────────────────────────────────────────
  server.tool(
    "context_query",
    "Search shared project context using semantic or text similarity.",
    {
      query: z.string().min(1),
      limit: z.number().int().min(1).max(20).optional(),
    },
    async ({ query, limit }) => {
      const res = await contextQuery(env, query, limit ?? 5);
      if (!res.ok) return toolErr(`Context query failed: ${res.error}`);
      if (res.data.length === 0) return toolOk("No context found.");
      const lines = res.data.map((c, i) => {
        const score = c.similarity != null ? ` (${(c.similarity * 100).toFixed(0)}%)` : "";
        return `[${i + 1}] [${c.type}]${score} ${trunc(c.content, 500)}`;
      });
      return toolOk(`${res.data.length} result(s):\n\n${lines.join("\n\n")}`);
    },
  );

  // ── context_add ──────────────────────────────────────────────────────────
  server.tool(
    "context_add",
    "Add a context chunk to the shared project knowledge base.",
    {
      content: z.string().min(1),
      type: z
        .enum([
          "task_completion",
          "context_update",
          "file_change",
          "decision",
          "summary",
          "broadcast",
        ])
        .optional(),
      files: z.array(z.string()).optional(),
      importance: z.number().min(0).max(1).optional(),
    },
    async ({ content, type, files, importance }) => {
      const res = await contextAdd(
        env,
        content,
        type ?? "context_update",
        files ?? [],
        importance ?? 0.5,
      );
      if (!res.ok) return toolErr(`Cannot add context: ${res.error}`);
      return toolOk(`Context added: ${id8(res.data.id)} [${res.data.type}]`);
    },
  );

  // ── project_context_set ──────────────────────────────────────────────────
  server.tool(
    "project_context_set",
    "Set this project's onboarding context (summary, architecture, conventions, current_focus).",
    {
      summary: z.string().optional(),
      architecture: z.string().optional(),
      conventions: z.string().optional(),
      current_focus: z.string().optional(),
    },
    async ({ summary, architecture, conventions, current_focus }) => {
      const fields: {
        summary?: string;
        architecture?: string;
        conventions?: string;
        current_focus?: string;
      } = {};
      if (summary !== undefined) fields.summary = summary;
      if (architecture !== undefined) fields.architecture = architecture;
      if (conventions !== undefined) fields.conventions = conventions;
      if (current_focus !== undefined) fields.current_focus = current_focus;

      if (Object.keys(fields).length === 0) {
        return toolErr("project_context_set: provide at least one field");
      }

      const res = await contextSet(env, fields);
      if (!res.ok) return toolErr(`Cannot set context: ${res.error}`);
      return toolOk(`Project context updated: ${Object.keys(fields).join(", ")}`);
    },
  );

  // ── broadcast_message ────────────────────────────────────────────────────
  server.tool(
    "broadcast_message",
    "Broadcast a message to all instances on this project.",
    {
      message: z.string().min(1),
      type: z.enum(["info", "warning", "error", "status"]).optional(),
    },
    async ({ message, type }) => {
      const res = await broadcastMessage(env, message, type ?? "info");
      if (!res.ok) return toolErr(`Broadcast failed: ${res.error}`);
      return toolOk(`Message broadcast: [${type ?? "info"}] ${trunc(message, 80)}`);
    },
  );

  // ── instance_status ──────────────────────────────────────────────────────
  server.tool(
    "instance_status",
    "Update this instance's status via heartbeat (idle|busy|active).",
    { status: z.enum(["idle", "busy", "active"]) },
    async ({ status }) => {
      const res = await instanceHeartbeat(env, status);
      if (!res.ok) return toolErr(`Heartbeat failed: ${res.error}`);
      return toolOk(`Status updated: ${status}`);
    },
  );

  // ── project_info ─────────────────────────────────────────────────────────
  server.tool(
    "project_info",
    "Get project summary, conventions, focus, and token usage.",
    {},
    async () => {
      const res = await projectShow(env);
      if (!res.ok) return toolErr(`Cannot fetch project info: ${res.error}`);
      const p = res.data;
      const lines: string[] = [
        `Project: ${p.name}`,
        `Path: ${p.project_path}`,
      ];
      if (p.summary) lines.push(`\nSummary:\n${trunc(p.summary, 400)}`);
      if (p.current_focus) lines.push(`\nCurrent focus:\n${trunc(p.current_focus, 300)}`);
      if (p.conventions) lines.push(`\nConventions:\n${trunc(p.conventions, 300)}`);
      if (p.recent_changes) lines.push(`\nRecent changes:\n${trunc(p.recent_changes, 300)}`);
      if (p.total_tokens != null && p.max_tokens != null) {
        const pct = ((p.total_tokens / p.max_tokens) * 100).toFixed(1);
        lines.push(`\nTokens: ${p.total_tokens.toLocaleString()} / ${p.max_tokens.toLocaleString()} (${pct}%)`);
      }
      return toolOk(lines.join("\n"));
    },
  );

  // ── Conditionally register planning tools ────────────────────────────────
  if (abilities.has("planning")) {
    registerPlanningTools(server, env);
  }

  // ── Conditionally register the decomposition tool ────────────────────────
  if (abilities.has("decompose")) {
    registerDecomposeTools(server, env);
  }
}

// ─── Decomposition tool registration (gated) ────────────────────────────────

/**
 * Register `submit_master_plan` — only when `decompose` ∈ abilities.
 *
 * This is how a decomposition session returns its result. The session runs
 * INTERACTIVELY on the user's subscription (no `claude -p`): it analyses the
 * PRD, produces a master plan, and calls this tool with the full plan. The
 * server validates + stores it, broadcasts `decompose:result`, and ends the
 * session. The whole stdout-JSON-parsing path is gone.
 */
function registerDecomposeTools(server: McpServer, env: McpEnv): void {
  const taskSchema = z.object({
    title: z.string().min(1).max(255),
    description: z.string().default(""),
    priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
    files: z.array(z.string()).default([]),
    estimated_tokens: z.number().int().positive().optional(),
    depends_on: z.array(z.string()).default([]),
  });

  const waveSchema = z.object({
    id: z.number().int().nonnegative(),
    name: z.string().min(1),
    description: z.string().default(""),
    tasks: z.array(taskSchema).min(1),
  });

  server.tool(
    "submit_master_plan",
    "Submit the decomposed master plan for this project. Call this ONCE when the " +
      "plan is complete: pass the full plan (version=1, prd_summary, and waves, " +
      "each wave with at least one task). The server creates the sprints and tasks " +
      "and finishes the decomposition. Do NOT edit project files.",
    {
      version: z.literal(1),
      prd_summary: z.string().default(""),
      waves: z.array(waveSchema).min(1),
    },
    async ({ version, prd_summary, waves }) => {
      const res = await submitMasterPlan(env, { version, prd_summary, waves });
      if (!res.ok) return toolErr(`Cannot submit master plan: ${res.error}`);
      const taskCount = waves.reduce((n, w) => n + w.tasks.length, 0);
      return toolOk(
        `Master plan submitted: ${waves.length} wave(s), ${taskCount} task(s). ` +
          `Decomposition complete — you can stop now.`,
      );
    },
  );
}

// ─── Planning tool registration (gated) ─────────────────────────────────────

/**
 * Register the 7 planning tools — only when `planning` ∈ abilities.
 * Saves context for workers that don't need multi-agent planning.
 */
function registerPlanningTools(server: McpServer, env: McpEnv): void {
  // ── epic_create ──────────────────────────────────────────────────────────
  server.tool(
    "epic_create",
    "Create an epic (feature group). color=#hex ≤7, priority=low|medium|high|critical.",
    {
      title: z.string().min(1).max(255),
      description: z.string().optional(),
      color: z.string().max(7).optional(),
      icon: z.string().max(50).optional(),
      priority: z.enum(["low", "medium", "high", "critical"]).optional(),
    },
    async ({ title, description, color, icon, priority }) => {
      const res = await epicCreate(env, {
        title,
        description,
        color,
        icon,
        priority,
      });
      if (!res.ok) return toolErr(`Cannot create epic: ${res.error}`);
      const e = res.data as Epic;
      return toolOk(`Epic created: ${e.id} — ${e.title} [${e.status}/${e.priority}]`);
    },
  );

  // ── task_create ──────────────────────────────────────────────────────────
  server.tool(
    "task_create",
    "Create a task in the project backlog. Optionally link to epic, sprint, parent.",
    {
      title: z.string().min(1).max(255),
      description: z.string().optional(),
      priority: z.enum(["low", "medium", "high", "critical"]).optional(),
      story_points: z.number().int().min(1).max(100).optional(),
      epic_id: z.string().uuid().optional(),
      sprint_id: z.string().uuid().optional(),
      files: z.array(z.string()).optional(),
      dependencies: z.array(z.string().uuid()).optional(),
    },
    async ({ title, description, priority, story_points, epic_id, sprint_id, files, dependencies }) => {
      const res = await taskCreate(env, {
        title,
        description,
        priority,
        story_points,
        epic_id,
        sprint_id,
        files,
        dependencies,
      });
      if (!res.ok) return toolErr(`Cannot create task: ${res.error}`);
      return toolOk(`Task created: ${id8(res.data.id)} — ${res.data.title} [${res.data.status}]`);
    },
  );

  // ── task_update ──────────────────────────────────────────────────────────
  server.tool(
    "task_update",
    "Update task fields: title, description, priority, story_points, epic, sprint, status.",
    {
      task_id: z.string().uuid(),
      title: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      priority: z.enum(["low", "medium", "high", "critical"]).optional(),
      story_points: z.number().int().min(1).max(100).optional(),
      epic_id: z.string().uuid().optional(),
      sprint_id: z.string().uuid().optional(),
      status: z
        .enum(["backlog", "pending", "in_progress", "blocked", "review", "done"])
        .optional(),
    },
    async ({ task_id, title, description, priority, story_points, epic_id, sprint_id, status }) => {
      const res = await taskUpdate(env, task_id, {
        title,
        description,
        priority,
        story_points,
        epic_id,
        sprint_id,
        status,
      });
      if (!res.ok) return toolErr(`Cannot update task: ${res.error}`);
      return toolOk(`Task updated: ${id8(res.data.id)} — ${res.data.title} [${res.data.status}]`);
    },
  );

  // ── task_decompose ────────────────────────────────────────────────────────
  server.tool(
    "task_decompose",
    "Decompose a parent task into subtasks. Returns IDs of all created subtasks.",
    {
      parent_task_id: z.string().uuid(),
      subtasks: z.array(
        z.object({
          title: z.string().min(1).max(255),
          description: z.string().optional(),
          story_points: z.number().int().min(1).max(100).optional(),
          files: z.array(z.string()).optional(),
        }),
      ).min(1),
    },
    async ({ parent_task_id, subtasks }) => {
      const created: string[] = [];
      const errors: string[] = [];

      for (const sub of subtasks) {
        const res = await taskCreate(env, {
          title: sub.title,
          description: sub.description,
          story_points: sub.story_points,
          files: sub.files,
          parent_id: parent_task_id,
        });
        if (res.ok) {
          created.push(`${id8(res.data.id)} — ${res.data.title}`);
        } else {
          errors.push(`"${sub.title}": ${res.error}`);
        }
      }

      const lines: string[] = [`Subtasks of ${parent_task_id.slice(0, 8)}:`];
      lines.push(...created.map((s) => `  + ${s}`));
      if (errors.length > 0) {
        lines.push(`\nErrors (${errors.length}):`);
        lines.push(...errors.map((e) => `  ! ${e}`));
      }
      const hasCreated = created.length > 0;
      const result = toolOk(lines.join("\n"));
      if (!hasCreated) return toolErr(`No subtasks created. Errors:\n${errors.join("\n")}`);
      return result;
    },
  );

  // ── sprint_create ────────────────────────────────────────────────────────
  server.tool(
    "sprint_create",
    "Create a sprint with dates and optional capacity in story points.",
    {
      name: z.string().min(1).max(255),
      goal: z.string().optional(),
      start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
      end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
      capacity: z.number().int().min(1).optional(),
    },
    async ({ name, goal, start_date, end_date, capacity }) => {
      const res = await sprintCreate(env, {
        name,
        goal,
        start_date,
        end_date,
        capacity,
      });
      if (!res.ok) return toolErr(`Cannot create sprint: ${res.error}`);
      const s = res.data as Sprint;
      const cap = s.capacity != null ? ` cap:${s.capacity}pts` : "";
      return toolOk(`Sprint created: ${s.id} — ${s.name} [${s.start_date} → ${s.end_date}]${cap}`);
    },
  );

  // ── sprint_assign ────────────────────────────────────────────────────────
  server.tool(
    "sprint_assign",
    "Assign one or more tasks to a sprint (loops PATCH per task).",
    {
      sprint_id: z.string().uuid(),
      task_ids: z.array(z.string().uuid()).min(1),
    },
    async ({ sprint_id, task_ids }) => {
      const ok: string[] = [];
      const errors: string[] = [];

      for (const task_id of task_ids) {
        const res = await taskUpdate(env, task_id, { sprint_id });
        if (res.ok) {
          ok.push(id8(task_id));
        } else {
          errors.push(`${id8(task_id)}: ${res.error}`);
        }
      }

      const lines: string[] = [
        `Assigned ${ok.length}/${task_ids.length} task(s) to sprint ${sprint_id.slice(0, 8)}`,
      ];
      if (ok.length > 0) lines.push(`  ✓ ${ok.join(", ")}`);
      if (errors.length > 0) {
        lines.push(`\nFailed (${errors.length}):`);
        lines.push(...errors.map((e) => `  ! ${e}`));
      }
      const result = toolOk(lines.join("\n"));
      if (ok.length === 0) return toolErr(lines.join("\n"));
      return result;
    },
  );

  // ── execution_start ──────────────────────────────────────────────────────
  server.tool(
    "execution_start",
    "Launch execution: spawn workers that claim & complete pending tasks. max_workers 1-10.",
    {
      max_workers: z.number().int().min(1).max(10).optional(),
      permission_mode: z
        .enum(["default", "plan", "acceptEdits", "bypassPermissions"])
        .optional(),
    },
    async ({ max_workers, permission_mode }) => {
      const res = await orchestratorStart(env, { max_workers, permission_mode });
      if (!res.ok) return toolErr(`Cannot launch execution: ${res.error}`);
      const d = res.data;
      const workers = Array.isArray(d.workers) ? d.workers.length : 0;
      return toolOk(
        `Execution launched: ${workers} worker(s) spawned, ${d.pendingTasks} pending task(s) queued. Workers will claim and complete tasks autonomously.`,
      );
    },
  );

  // ── backlog_stats ────────────────────────────────────────────────────────
  server.tool(
    "backlog_stats",
    "Return backlog stats: task counts by status, story points, epics, sprints.",
    {},
    async () => {
      const res = await planningContext(env);
      if (!res.ok) return toolErr(`Cannot fetch planning context: ${res.error}`);
      const ctx = res.data;
      const s = ctx.stats;

      const lines: string[] = ["=== Backlog Stats ==="];

      // Task counts
      const total = s["total_tasks"] ?? ctx.tasks.length;
      lines.push(`Tasks: ${total}`);
      if (s["pending"] != null) lines.push(`  pending:     ${s["pending"]}`);
      if (s["in_progress"] != null) lines.push(`  in_progress: ${s["in_progress"]}`);
      if (s["review"] != null) lines.push(`  review:      ${s["review"]}`);
      if (s["done"] != null) lines.push(`  done:        ${s["done"]}`);
      if (s["backlog"] != null) lines.push(`  backlog:     ${s["backlog"]}`);

      // Story points
      if (s["total_story_points"] != null) {
        const done = s["completed_story_points"] ?? 0;
        lines.push(`Story points: ${done}/${s["total_story_points"]} completed`);
      }

      // Epics summary
      lines.push(`\nEpics: ${ctx.epics.length}`);
      for (const e of ctx.epics.slice(0, 10)) {
        lines.push(`  ${id8(e.id)} [${e.status}] ${trunc(e.title, 50)}`);
      }
      if (ctx.epics.length > 10) lines.push(`  … and ${ctx.epics.length - 10} more`);

      // Sprints summary
      lines.push(`\nSprints: ${ctx.sprints.length}`);
      for (const sp of ctx.sprints) {
        const cap = sp.capacity != null ? ` (cap:${sp.capacity})` : "";
        const vel = sp.velocity != null ? ` vel:${sp.velocity}` : "";
        lines.push(`  ${id8(sp.id)} [${sp.status}] ${trunc(sp.name, 40)}${cap}${vel}`);
      }

      return toolOk(lines.join("\n"));
    },
  );
}
