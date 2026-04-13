/**
 * ClaudeNest API Endpoints Documentation
 *
 * Last updated: 2026-04-12
 *
 * Organised by category — each file contains one ApiCategory object.
 * This index assembles the full list and re-exports every named symbol
 * so that existing imports of `@/data/api` continue to work.
 */

// ── Types ────────────────────────────────────────────────────────────────────
export type { ApiParam, ApiEndpoint, ApiCategory, ErrorCode } from './types';

// ── Categories ───────────────────────────────────────────────────────────────
export { authCategory } from './auth';
export { machinesCategory } from './machines';
export { sessionsCategory } from './sessions';
export { projectsCategory } from './projects';
export { tasksCategory } from './tasks';
export { contextCategory } from './context';
export { locksCategory } from './locks';
export { skillsCategory } from './skills';
export { mcpCategory } from './mcp';
export { commandsCategory } from './commands';
export { credentialsCategory } from './credentials';
export { epicsCategory } from './epics';
export { sprintsCategory } from './sprints';
export { planningCategory } from './planning';
export { runnerCategory } from './runner';
export { dashboardCategory, healthCategory } from './dashboard';

// ── Error codes ───────────────────────────────────────────────────────────────
export { errorCodes } from './errors';

// ── Assembled array ──────────────────────────────────────────────────────────
import { authCategory } from './auth';
import { machinesCategory } from './machines';
import { sessionsCategory } from './sessions';
import { projectsCategory } from './projects';
import { tasksCategory } from './tasks';
import { contextCategory } from './context';
import { locksCategory } from './locks';
import { skillsCategory } from './skills';
import { mcpCategory } from './mcp';
import { commandsCategory } from './commands';
import { credentialsCategory } from './credentials';
import { epicsCategory } from './epics';
import { sprintsCategory } from './sprints';
import { planningCategory } from './planning';
import { runnerCategory } from './runner';
import { dashboardCategory, healthCategory } from './dashboard';
import type { ApiCategory, ApiEndpoint } from './types';

export const apiCategories: ApiCategory[] = [
  authCategory,
  machinesCategory,
  sessionsCategory,
  projectsCategory,
  tasksCategory,
  contextCategory,
  locksCategory,
  skillsCategory,
  mcpCategory,
  commandsCategory,
  credentialsCategory,
  epicsCategory,
  sprintsCategory,
  planningCategory,
  runnerCategory,
  dashboardCategory,
  healthCategory,
];

// ── Utility helpers ───────────────────────────────────────────────────────────

/** Find a category by its id. */
export const getCategoryById = (id: string): ApiCategory | undefined =>
  apiCategories.find((cat) => cat.id === id);

/** Find an endpoint by path, optionally filtered by HTTP method. */
export const getEndpointByPath = (
  path: string,
  method?: string,
): ApiEndpoint | undefined => {
  for (const category of apiCategories) {
    const endpoint = category.endpoints.find(
      (ep) => ep.path === path && (!method || ep.method === method),
    );
    if (endpoint) return endpoint;
  }
  return undefined;
};

/** Full-text search across paths, descriptions, and HTTP methods. */
export const searchEndpoints = (
  query: string,
): Array<{ category: ApiCategory; endpoint: ApiEndpoint }> => {
  const results: Array<{ category: ApiCategory; endpoint: ApiEndpoint }> = [];
  const lowerQuery = query.toLowerCase();

  for (const category of apiCategories) {
    for (const endpoint of category.endpoints) {
      if (
        endpoint.path.toLowerCase().includes(lowerQuery) ||
        endpoint.description.toLowerCase().includes(lowerQuery) ||
        endpoint.method.toLowerCase().includes(lowerQuery)
      ) {
        results.push({ category, endpoint });
      }
    }
  }

  return results;
};
