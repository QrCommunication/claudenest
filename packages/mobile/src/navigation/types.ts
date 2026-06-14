/**
 * Navigation Types
 */

import type { NavigatorScreenParams } from "@react-navigation/native";

// Root Stack
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
};

// Main Tabs
export type MainTabParamList = {
  MachinesTab: NavigatorScreenParams<MachinesStackParamList>;
  SessionsTab: NavigatorScreenParams<SessionsStackParamList>;
  ProjectsTab: NavigatorScreenParams<ProjectsStackParamList>;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
};

// Machines Stack
export type MachinesStackParamList = {
  MachinesList: undefined;
  MachineDetail: { machineId: string };
  ClaudeSessions: { machineId: string };
  PairMachine: undefined;
};

// Sessions Stack
export type SessionsStackParamList = {
  SessionsList: { machineId?: string };
  Session: { sessionId: string };
  NewSession: { machineId: string };
};

// Planning screen segments (merged Epics + Sprints view — web parity)
export type PlanningSegment = "epics" | "sprints";

// Projects Stack
export type ProjectsStackParamList = {
  ProjectsList: undefined;
  ProjectDetail: { projectId: string };
  NewProject: undefined;
  Tasks: { projectId: string };
  Context: { projectId: string };
  Locks: { projectId: string };
  // Replaces the former separate Epics / Sprints routes.
  Planning: { projectId: string; segment?: PlanningSegment };
  PlanningChat: { projectId: string };
  Orchestration: { projectId: string };
  Git: { projectId: string };
  Audit: { projectId: string };
  RunnerHealth: { projectId: string };
  SprintDetail: { sprintId: string };
  DecomposeEpic: { projectId: string };
};

// Settings Stack
export type SettingsStackParamList = {
  SettingsMain: undefined;
  Skills: { machineId: string };
  SkillDetail: { machineId: string; skillPath: string };
  MCPServers: { machineId: string };
  MCPTools: { machineId: string; serverName: string };
  Commands: { machineId: string };
  Credentials: undefined;
  About: undefined;
};

// Helper type for screen props
export type ScreenProps<T extends keyof RootStackParamList> = {
  navigation: import("@react-navigation/native").NavigationProp<
    RootStackParamList,
    T
  >;
  route: import("@react-navigation/native").RouteProp<RootStackParamList, T>;
};
