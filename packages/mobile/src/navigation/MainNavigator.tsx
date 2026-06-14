/**
 * Main Navigator
 * Adaptive primary navigation: a bottom tab bar on phones, a left navigation
 * rail on tablet/desktop (the "Claude OS" desktop shell). Driven by
 * `useResponsiveLayout` + the bottom-tabs v7 `tabBarPosition` API, which lays
 * out the screens beside the rail (no manual inset juggling).
 */

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { MainTabParamList } from "./types";
import { colors } from "@/theme";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

// Navigators
import { MachinesNavigator } from "./MachinesNavigator";
import { SessionsNavigator } from "./SessionsNavigator";
import { ProjectsNavigator } from "./ProjectsNavigator";
import { SettingsNavigator } from "./SettingsNavigator";

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainNavigator: React.FC = () => {
  const { isExpanded } = useResponsiveLayout();
  const insets = useSafeAreaInsets();

  const tabBarStyle = isExpanded
    ? {
        width: 108,
        backgroundColor: colors.bg.secondary,
        borderRightColor: colors.border.strong,
        borderRightWidth: 1,
        borderTopWidth: 0,
        paddingTop: insets.top + 16,
        elevation: 0 as const,
      }
    : {
        backgroundColor: colors.bg.secondary,
        borderTopColor: colors.border.strong,
        borderTopWidth: 1,
        paddingBottom: 10,
        paddingTop: 10,
        height: 66,
        elevation: 0 as const,
      };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarPosition: isExpanded ? "left" : "bottom",
        tabBarStyle,
        tabBarActiveTintColor: colors.accent.purple,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.3,
        },
        tabBarItemStyle: isExpanded
          ? { paddingVertical: 12 }
          : { paddingTop: 2 },
      }}
    >
      <Tab.Screen
        name="MachinesTab"
        component={MachinesNavigator}
        options={{
          tabBarLabel: "Machines",
          tabBarIcon: ({ color, size }) => (
            <Icon name="computer" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="SessionsTab"
        component={SessionsNavigator}
        options={{
          tabBarLabel: "Sessions",
          tabBarIcon: ({ color, size }) => (
            <Icon name="terminal" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProjectsTab"
        component={ProjectsNavigator}
        options={{
          tabBarLabel: "Projects",
          tabBarIcon: ({ color, size }) => (
            <Icon name="folder-shared" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsNavigator}
        options={{
          tabBarLabel: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Icon name="settings" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
