#!/usr/bin/env node
/**
 * ClaudeNest MCP Server — stdio transport.
 * Launched by Claude Code via --mcp-config with CLAUDENEST_* env vars.
 *
 * Required env:
 *   CLAUDENEST_API_URL      — e.g. https://claudenest.io
 *   CLAUDENEST_TOKEN        — Bearer token
 *   CLAUDENEST_PROJECT_ID   — UUID of the SharedProject
 *   CLAUDENEST_INSTANCE_ID  — UUID of the ClaudeInstance
 *
 * Optional env:
 *   CLAUDENEST_SESSION_ID   — current session UUID
 *   CLAUDENEST_PROJECT_PATH — local working directory
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools, parseAbilities } from "./tools.js";
import type { McpEnv } from "./api.js";

// ─── Environment gate ─────────────────────────────────────────────────────────

const REQUIRED_VARS = [
  "CLAUDENEST_API_URL",
  "CLAUDENEST_TOKEN",
  "CLAUDENEST_PROJECT_ID",
  "CLAUDENEST_INSTANCE_ID",
] as const;

function loadEnv(): McpEnv {
  const missing = REQUIRED_VARS.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    process.stderr.write(
      `[claudenest-mcp] Missing required environment variables: ${missing.join(", ")}\n`,
    );
    process.exit(1);
  }

  return {
    apiUrl: process.env["CLAUDENEST_API_URL"]!.replace(/\/$/, ""),
    token: process.env["CLAUDENEST_TOKEN"]!,
    projectId: process.env["CLAUDENEST_PROJECT_ID"]!,
    instanceId: process.env["CLAUDENEST_INSTANCE_ID"]!,
    sessionId: process.env["CLAUDENEST_SESSION_ID"],
    projectPath: process.env["CLAUDENEST_PROJECT_PATH"],
  };
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const env = loadEnv();

  const server = new McpServer({
    name: "claudenest",
    version: "1.0.0",
  });

  const abilities = parseAbilities(process.env["CLAUDENEST_ABILITIES"]);
  registerTools(server, env, abilities);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Graceful disconnect on signals
  const shutdown = async (): Promise<void> => {
    await server.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(`[claudenest-mcp] Fatal: ${msg}\n`);
  process.exit(1);
});
