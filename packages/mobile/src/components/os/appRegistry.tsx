/**
 * App registry — the declarative catalog of "Claude OS" apps.
 *
 * Each feature of the app is an AppDefinition: an icon + metadata + the content
 * to render in a floating window. Today every app renders an existing screen
 * through the ScreenWindowAdapter (navigation replaced by the windowApi bus);
 * native OS panels can later set `render` to replace a screen in place without
 * touching the rest of the system.
 *
 * `resolveRoute` is the bridge the adapter uses to turn a legacy
 * navigation.navigate("RouteName", params) call into an openApp() on the store.
 */

import type { ComponentType, ReactNode } from "react";
import type { OpenAppInput, WindowAccent } from "@/stores/windowManagerStore";

import { MachinesListScreen } from "@/screens/machines/MachinesListScreen";
import { MachineDetailScreen } from "@/screens/machines/MachineDetailScreen";
import { ClaudeSessionsScreen } from "@/screens/machines/ClaudeSessionsScreen";
import { PairMachineScreen } from "@/screens/machines/PairMachineScreen";
import { SessionsListScreen } from "@/screens/sessions/SessionsListScreen";
import { SessionScreen } from "@/screens/sessions/SessionScreen";
import { NewSessionScreen } from "@/screens/sessions/NewSessionScreen";
import { ProjectsListScreen } from "@/screens/multiagent/ProjectsListScreen";
import { ProjectScreen } from "@/screens/multiagent/ProjectScreen";
import { NewProjectScreen } from "@/screens/multiagent/NewProjectScreen";
import { TasksScreen } from "@/screens/multiagent/TasksScreen";
import { ContextScreen } from "@/screens/multiagent/ContextScreen";
import { LocksScreen } from "@/screens/multiagent/LocksScreen";
import { PlanningScreen } from "@/screens/multiagent/PlanningScreen";
import { PlanningChatScreen } from "@/screens/multiagent/PlanningChatScreen";
import { OrchestrationScreen } from "@/screens/multiagent/OrchestrationScreen";
import { GitScreen } from "@/screens/multiagent/GitScreen";
import { AuditScreen } from "@/screens/multiagent/AuditScreen";
import { RunnerHealthScreen } from "@/screens/multiagent/RunnerHealthScreen";
import { SprintDetailScreen } from "@/screens/multiagent/SprintDetailScreen";
import { DecomposeEpicScreen } from "@/screens/multiagent/DecomposeEpicScreen";
import { SettingsScreen } from "@/screens/settings/SettingsScreen";
import { CredentialsScreen } from "@/screens/settings/CredentialsScreen";
import { AboutScreen } from "@/screens/settings/AboutScreen";
import { SkillsScreen } from "@/screens/config/SkillsScreen";
import { SkillDetailScreen } from "@/screens/config/SkillDetailScreen";
import { MCPServersScreen } from "@/screens/config/MCPServersScreen";
import { MCPToolsScreen } from "@/screens/config/MCPToolsScreen";
import { CommandsScreen } from "@/screens/config/CommandsScreen";

export type AppCategory = "infra" | "project" | "system";

/**
 * Legacy screens declare heterogeneous navigation/route prop types. The window
 * adapter injects shimmed props at the boundary, so the prop contract is erased
 * here on purpose (documented seam).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ScreenComponent = ComponentType<any>;

export interface AppDefinition {
  /** Stable app id, used as the window's appId. */
  id: string;
  /** React Navigation route name this app maps to (for the navigation bridge). */
  route: string;
  title: string;
  /** MaterialIcons glyph name. */
  icon: string;
  accent: WindowAccent;
  category: AppCategory;
  defaultSize: { w: number; h: number };
  /** Shown in the launcher / dock (true only for apps needing no params). */
  launchable: boolean;
  /** Re-opening focuses the single existing window instead of duplicating. */
  singleInstance: boolean;
  /** Legacy screen rendered via ScreenWindowAdapter (navigation → windowApi). */
  screen?: ScreenComponent;
  /** Native OS panel (takes precedence over `screen` when set). */
  render?: (params: Record<string, unknown>) => ReactNode;
  /** Derive a multi-instance key from params (e.g. projectId). */
  instanceKeyOf?: (params: Record<string, unknown>) => string | undefined;
  /** Dynamic window title from params. */
  titleOf?: (params: Record<string, unknown>) => string | undefined;
}

const byKey =
  (key: string) =>
  (p: Record<string, unknown>): string | undefined =>
    p[key] != null ? String(p[key]) : undefined;

const byKeys =
  (...keys: string[]) =>
  (p: Record<string, unknown>): string | undefined =>
    keys.every((k) => p[k] != null)
      ? keys.map((k) => String(p[k])).join(":")
      : undefined;

const MD = { w: 760, h: 560 };
const LG = { w: 920, h: 640 };
const SM = { w: 560, h: 480 };

export const APP_DEFINITIONS: AppDefinition[] = [
  // ── Infra ───────────────────────────────────────────────────────────────
  {
    id: "machines",
    route: "MachinesList",
    title: "Machines",
    icon: "computer",
    accent: "cyan",
    category: "infra",
    defaultSize: MD,
    launchable: true,
    singleInstance: true,
    screen: MachinesListScreen,
  },
  {
    id: "machine",
    route: "MachineDetail",
    title: "Machine",
    icon: "developer-board",
    accent: "cyan",
    category: "infra",
    defaultSize: MD,
    launchable: false,
    singleInstance: false,
    screen: MachineDetailScreen,
    instanceKeyOf: byKey("machineId"),
  },
  {
    id: "claude-sessions",
    route: "ClaudeSessions",
    title: "Claude Sessions",
    icon: "smart-toy",
    accent: "purple",
    category: "infra",
    defaultSize: MD,
    launchable: false,
    singleInstance: false,
    screen: ClaudeSessionsScreen,
    instanceKeyOf: byKey("machineId"),
  },
  {
    id: "pair-machine",
    route: "PairMachine",
    title: "Pair Machine",
    icon: "add-link",
    accent: "cyan",
    category: "infra",
    defaultSize: SM,
    launchable: true,
    singleInstance: true,
    screen: PairMachineScreen,
  },
  {
    id: "sessions",
    route: "SessionsList",
    title: "Sessions",
    icon: "terminal",
    accent: "purple",
    category: "infra",
    defaultSize: MD,
    launchable: true,
    singleInstance: true,
    screen: SessionsListScreen,
  },
  {
    id: "session",
    route: "Session",
    title: "Terminal",
    icon: "terminal",
    accent: "purple",
    category: "infra",
    defaultSize: LG,
    launchable: false,
    singleInstance: false,
    screen: SessionScreen,
    instanceKeyOf: byKey("sessionId"),
  },
  {
    id: "new-session",
    route: "NewSession",
    title: "New Session",
    icon: "add",
    accent: "purple",
    category: "infra",
    defaultSize: SM,
    launchable: false,
    singleInstance: false,
    screen: NewSessionScreen,
    instanceKeyOf: byKey("machineId"),
  },

  // ── Project ─────────────────────────────────────────────────────────────
  {
    id: "projects",
    route: "ProjectsList",
    title: "Projects",
    icon: "folder-shared",
    accent: "purple",
    category: "project",
    defaultSize: LG,
    launchable: true,
    singleInstance: true,
    screen: ProjectsListScreen,
  },
  {
    id: "project",
    route: "ProjectDetail",
    title: "Project",
    icon: "folder",
    accent: "purple",
    category: "project",
    defaultSize: MD,
    launchable: false,
    singleInstance: false,
    screen: ProjectScreen,
    instanceKeyOf: byKey("projectId"),
  },
  {
    id: "new-project",
    route: "NewProject",
    title: "New Project",
    icon: "create-new-folder",
    accent: "purple",
    category: "project",
    defaultSize: SM,
    launchable: true,
    singleInstance: true,
    screen: NewProjectScreen,
  },
  {
    id: "tasks",
    route: "Tasks",
    title: "Tasks",
    icon: "checklist",
    accent: "cyan",
    category: "project",
    defaultSize: MD,
    launchable: false,
    singleInstance: false,
    screen: TasksScreen,
    instanceKeyOf: byKey("projectId"),
  },
  {
    id: "context",
    route: "Context",
    title: "Context",
    icon: "memory",
    accent: "cyan",
    category: "project",
    defaultSize: MD,
    launchable: false,
    singleInstance: false,
    screen: ContextScreen,
    instanceKeyOf: byKey("projectId"),
  },
  {
    id: "locks",
    route: "Locks",
    title: "File Locks",
    icon: "lock",
    accent: "cyan",
    category: "project",
    defaultSize: MD,
    launchable: false,
    singleInstance: false,
    screen: LocksScreen,
    instanceKeyOf: byKey("projectId"),
  },
  {
    id: "planning",
    route: "Planning",
    title: "Planning",
    icon: "view-kanban",
    accent: "purple",
    category: "project",
    defaultSize: LG,
    launchable: false,
    singleInstance: false,
    screen: PlanningScreen,
    instanceKeyOf: byKey("projectId"),
  },
  {
    id: "planning-chat",
    route: "PlanningChat",
    title: "Planning Assistant",
    icon: "forum",
    accent: "purple",
    category: "project",
    defaultSize: MD,
    launchable: false,
    singleInstance: false,
    screen: PlanningChatScreen,
    instanceKeyOf: byKey("projectId"),
  },
  {
    id: "orchestration",
    route: "Orchestration",
    title: "Orchestration",
    icon: "hub",
    accent: "cyan",
    category: "project",
    defaultSize: MD,
    launchable: false,
    singleInstance: false,
    screen: OrchestrationScreen,
    instanceKeyOf: byKey("projectId"),
  },
  {
    id: "git",
    route: "Git",
    title: "Git & PRs",
    icon: "merge-type",
    accent: "cyan",
    category: "project",
    defaultSize: MD,
    launchable: false,
    singleInstance: false,
    screen: GitScreen,
    instanceKeyOf: byKey("projectId"),
  },
  {
    id: "audit",
    route: "Audit",
    title: "Audit Trail",
    icon: "history",
    accent: "cyan",
    category: "project",
    defaultSize: MD,
    launchable: false,
    singleInstance: false,
    screen: AuditScreen,
    instanceKeyOf: byKey("projectId"),
  },
  {
    id: "runner",
    route: "RunnerHealth",
    title: "Health",
    icon: "monitor-heart",
    accent: "cyan",
    category: "project",
    defaultSize: MD,
    launchable: false,
    singleInstance: false,
    screen: RunnerHealthScreen,
    instanceKeyOf: byKey("projectId"),
  },
  {
    id: "sprint",
    route: "SprintDetail",
    title: "Sprint",
    icon: "directions-run",
    accent: "purple",
    category: "project",
    defaultSize: MD,
    launchable: false,
    singleInstance: false,
    screen: SprintDetailScreen,
    instanceKeyOf: byKey("sprintId"),
  },
  {
    id: "decompose",
    route: "DecomposeEpic",
    title: "Decompose PRD",
    icon: "auto-awesome",
    accent: "purple",
    category: "project",
    defaultSize: MD,
    launchable: false,
    singleInstance: false,
    screen: DecomposeEpicScreen,
    instanceKeyOf: byKey("projectId"),
  },

  // ── System ──────────────────────────────────────────────────────────────
  {
    id: "settings",
    route: "SettingsMain",
    title: "Settings",
    icon: "settings",
    accent: "cyan",
    category: "system",
    defaultSize: MD,
    launchable: true,
    singleInstance: true,
    screen: SettingsScreen,
  },
  {
    id: "credentials",
    route: "Credentials",
    title: "Credentials",
    icon: "vpn-key",
    accent: "cyan",
    category: "system",
    defaultSize: MD,
    launchable: true,
    singleInstance: true,
    screen: CredentialsScreen,
  },
  {
    id: "about",
    route: "About",
    title: "About",
    icon: "info",
    accent: "purple",
    category: "system",
    defaultSize: SM,
    launchable: true,
    singleInstance: true,
    screen: AboutScreen,
  },
  {
    id: "skills",
    route: "Skills",
    title: "Skills",
    icon: "extension",
    accent: "cyan",
    category: "system",
    defaultSize: MD,
    launchable: false,
    singleInstance: false,
    screen: SkillsScreen,
    instanceKeyOf: byKey("machineId"),
  },
  {
    id: "skill",
    route: "SkillDetail",
    title: "Skill",
    icon: "extension",
    accent: "cyan",
    category: "system",
    defaultSize: MD,
    launchable: false,
    singleInstance: false,
    screen: SkillDetailScreen,
    instanceKeyOf: byKeys("machineId", "skillPath"),
  },
  {
    id: "mcp",
    route: "MCPServers",
    title: "MCP Servers",
    icon: "dns",
    accent: "cyan",
    category: "system",
    defaultSize: MD,
    launchable: false,
    singleInstance: false,
    screen: MCPServersScreen,
    instanceKeyOf: byKey("machineId"),
  },
  {
    id: "mcp-tools",
    route: "MCPTools",
    title: "MCP Tools",
    icon: "build",
    accent: "cyan",
    category: "system",
    defaultSize: MD,
    launchable: false,
    singleInstance: false,
    screen: MCPToolsScreen,
    instanceKeyOf: byKeys("machineId", "serverName"),
    titleOf: byKey("serverName"),
  },
  {
    id: "commands",
    route: "Commands",
    title: "Commands",
    icon: "code",
    accent: "cyan",
    category: "system",
    defaultSize: MD,
    launchable: false,
    singleInstance: false,
    screen: CommandsScreen,
    instanceKeyOf: byKey("machineId"),
  },
];

export const APP_BY_ID: Record<string, AppDefinition> = Object.fromEntries(
  APP_DEFINITIONS.map((d) => [d.id, d]),
);

export const APP_BY_ROUTE: Record<string, AppDefinition> = Object.fromEntries(
  APP_DEFINITIONS.map((d) => [d.route, d]),
);

export const LAUNCHER_APPS: AppDefinition[] = APP_DEFINITIONS.filter(
  (d) => d.launchable,
);

export function getApp(id: string): AppDefinition | undefined {
  return APP_BY_ID[id];
}

/** Turn a legacy navigation.navigate(route, params) into an openApp() input. */
export function resolveRoute(
  routeName: string,
  params?: Record<string, unknown>,
): OpenAppInput | null {
  const def = APP_BY_ROUTE[routeName];
  if (!def) return null;
  const p = params ?? {};
  return {
    appId: def.id,
    instanceKey: def.instanceKeyOf?.(p),
    title: def.titleOf?.(p) ?? def.title,
    icon: def.icon,
    accent: def.accent,
    singleInstance: def.singleInstance,
    size: def.defaultSize,
    params: p,
  };
}
