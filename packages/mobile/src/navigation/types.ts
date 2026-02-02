/**
 * Navigation Types
 */

import type { NavigatorScreenParams } from '@react-navigation/native';

// Root Stack
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Auth Stack
export type AuthStackParamList = {
  Onboarding: undefined;
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
  PairMachine: undefined;
};

// Sessions Stack
export type SessionsStackParamList = {
  SessionsList: { machineId?: string };
  Session: { sessionId: string };
  NewSession: { machineId: string };
};

// Projects Stack
export type ProjectsStackParamList = {
  ProjectsList: undefined;
  ProjectDetail: { projectId: string };
  Tasks: { projectId: string };
  Context: { projectId: string };
  Locks: { projectId: string };
};

// Settings Stack
export type SettingsStackParamList = {
  SettingsMain: undefined;
  Skills: { machineId: string };
  MCPServers: { machineId: string };
  Commands: { machineId: string };
  About: undefined;
};

// Helper type for screen props
export type ScreenProps<T extends keyof RootStackParamList> = {
  navigation: import('@react-navigation/native').NavigationProp<RootStackParamList, T>;
  route: import('@react-navigation/native').RouteProp<RootStackParamList, T>;
};
