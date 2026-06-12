/**
 * PlanningScreen
 * Merged Epics + Sprints view (web parity: the "Planning" project tab).
 * A lightweight segmented control switches between the two existing boards —
 * no material-top-tabs dependency, just local state.
 */

import React, { memo, useCallback, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type {
  PlanningSegment,
  ProjectsStackParamList,
} from "@/navigation/types";
import { borderRadius, colors, spacing, typography } from "@/theme";
import { useEpicsStore } from "@/stores/epicsStore";
import { useSprintsStore } from "@/stores/sprintsStore";
import { EpicsBoard } from "./EpicsBoard";
import { SprintsBoard } from "./SprintsBoard";

type Props = NativeStackScreenProps<ProjectsStackParamList, "Planning">;

// ==================== SEGMENTED CONTROL ====================

interface SegmentButtonProps {
  label: string;
  icon: React.ComponentProps<typeof Icon>["name"];
  count: number;
  isActive: boolean;
  onPress: () => void;
}

const SegmentButton = memo(function SegmentButton({
  label,
  icon,
  count,
  isActive,
  onPress,
}: SegmentButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.segment, isActive && styles.segmentActive]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
    >
      <Icon
        name={icon}
        size={16}
        color={isActive ? colors.primary.purple : colors.text.muted}
      />
      <Text
        style={[styles.segmentLabel, isActive && styles.segmentLabelActive]}
      >
        {label}
      </Text>
      <View
        style={[styles.segmentCount, isActive && styles.segmentCountActive]}
      >
        <Text
          style={[
            styles.segmentCountText,
            isActive && styles.segmentCountTextActive,
          ]}
        >
          {count > 99 ? "99+" : count}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

// ==================== MAIN SCREEN ====================

export const PlanningScreen: React.FC<Props> = ({ route }) => {
  const { projectId, segment: initialSegment } = route.params;
  const [segment, setSegment] = useState<PlanningSegment>(
    initialSegment ?? "epics",
  );

  const epicsCount = useEpicsStore(
    (s) => s.getEpicsByProject(projectId).length,
  );
  const sprintsCount = useSprintsStore(
    (s) => s.getSprintsByProject(projectId).length,
  );

  const showEpics = useCallback(() => setSegment("epics"), []);
  const showSprints = useCallback(() => setSegment("sprints"), []);

  return (
    <View style={styles.container}>
      <View style={styles.segmentBar} accessibilityRole="tablist">
        <SegmentButton
          label="Epics"
          icon="flag"
          count={epicsCount}
          isActive={segment === "epics"}
          onPress={showEpics}
        />
        <SegmentButton
          label="Sprints"
          icon="loop"
          count={sprintsCount}
          isActive={segment === "sprints"}
          onPress={showSprints}
        />
      </View>

      <View style={styles.content}>
        {segment === "epics" ? (
          <EpicsBoard projectId={projectId} />
        ) : (
          <SprintsBoard projectId={projectId} />
        )}
      </View>
    </View>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark2,
  },
  segmentBar: {
    flexDirection: "row",
    gap: spacing.xs,
    backgroundColor: colors.background.dark3,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.xs,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.base,
  },
  segmentActive: {
    backgroundColor: "rgba(168,85,247,0.15)",
  },
  segmentLabel: {
    fontSize: typography.size.sm,
    fontWeight: "600",
    color: colors.text.muted,
  },
  segmentLabelActive: {
    color: colors.primary.purple,
  },
  segmentCount: {
    minWidth: 18,
    height: 18,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.dark4,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  segmentCountActive: {
    backgroundColor: "rgba(168,85,247,0.3)",
  },
  segmentCountText: {
    fontSize: typography.size.xs,
    fontWeight: "700",
    color: colors.text.muted,
  },
  segmentCountTextActive: {
    color: colors.primary.purple,
  },
  content: {
    flex: 1,
  },
});
