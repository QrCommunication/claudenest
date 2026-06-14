/**
 * Projects Navigator
 * Handles multi-agent project screens
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { ProjectsStackParamList } from "./types";
import { colors } from "@/theme";

// Screens
import { ProjectsListScreen } from "@/screens/multiagent/ProjectsListScreen";
import { NewProjectScreen } from "@/screens/multiagent/NewProjectScreen";
import { ProjectScreen } from "@/screens/multiagent/ProjectScreen";
import { TasksScreen } from "@/screens/multiagent/TasksScreen";
import { ContextScreen } from "@/screens/multiagent/ContextScreen";
import { LocksScreen } from "@/screens/multiagent/LocksScreen";
import { PlanningScreen } from "@/screens/multiagent/PlanningScreen";
import { PlanningChatScreen } from "@/screens/multiagent/PlanningChatScreen";
import { OrchestrationScreen } from "@/screens/multiagent/OrchestrationScreen";
import { GitScreen } from "@/screens/multiagent/GitScreen";
import { AuditScreen } from "@/screens/multiagent/AuditScreen";
import { SprintDetailScreen } from "@/screens/multiagent/SprintDetailScreen";

const Stack = createNativeStackNavigator<ProjectsStackParamList>();

export const ProjectsNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background.dark2,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          fontWeight: "600",
        },
        contentStyle: {
          backgroundColor: colors.background.dark2,
        },
      }}
    >
      <Stack.Screen
        name="ProjectsList"
        component={ProjectsListScreen}
        options={{ title: "Projects" }}
      />
      <Stack.Screen
        name="NewProject"
        component={NewProjectScreen}
        options={{ title: "New Project" }}
      />
      <Stack.Screen
        name="ProjectDetail"
        component={ProjectScreen}
        options={{ title: "Project" }}
      />
      <Stack.Screen
        name="Tasks"
        component={TasksScreen}
        options={{ title: "Tasks" }}
      />
      <Stack.Screen
        name="Context"
        component={ContextScreen}
        options={{ title: "Context" }}
      />
      <Stack.Screen
        name="Locks"
        component={LocksScreen}
        options={{ title: "File Locks" }}
      />
      <Stack.Screen
        name="Planning"
        component={PlanningScreen}
        options={{ title: "Planning" }}
      />
      <Stack.Screen
        name="PlanningChat"
        component={PlanningChatScreen}
        options={{ title: "Planning Assistant" }}
      />
      <Stack.Screen
        name="Orchestration"
        component={OrchestrationScreen}
        options={{ title: "Orchestration" }}
      />
      <Stack.Screen
        name="Git"
        component={GitScreen}
        options={{ title: "Git & Pull Requests" }}
      />
      <Stack.Screen
        name="Audit"
        component={AuditScreen}
        options={{ title: "Audit Trail" }}
      />
      <Stack.Screen
        name="SprintDetail"
        component={SprintDetailScreen}
        options={{ title: "Sprint" }}
      />
    </Stack.Navigator>
  );
};
