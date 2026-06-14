/**
 * PlanningScreen
 * Merged Epics + Sprints view (web parity: the "Planning" project tab).
 *
 * Uses the shared OS primitives: a reusable `SegmentedControl` switches between
 * the two boards, and the active board is framed in a `WindowFrame`. On tablet
 * the column is centered and width-capped via `useResponsiveLayout`.
 */

import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type {
  PlanningSegment,
  ProjectsStackParamList,
} from "@/navigation/types";
import { colors, layout, spacing } from "@/theme";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { SegmentedControl, WindowFrame } from "@/components/os";
import { useEpicsStore } from "@/stores/epicsStore";
import { useSprintsStore } from "@/stores/sprintsStore";
import { EpicsBoard } from "./EpicsBoard";
import { SprintsBoard } from "./SprintsBoard";

type Props = NativeStackScreenProps<ProjectsStackParamList, "Planning">;

export const PlanningScreen: React.FC<Props> = ({ route }) => {
  const { projectId, segment: initialSegment } = route.params;
  const [segment, setSegment] = useState<PlanningSegment>(
    initialSegment ?? "epics",
  );
  const { isExpanded } = useResponsiveLayout();

  const epicsCount = useEpicsStore(
    (s) => s.getEpicsByProject(projectId).length,
  );
  const sprintsCount = useSprintsStore(
    (s) => s.getSprintsByProject(projectId).length,
  );

  const options = useMemo(
    () => [
      {
        value: "epics" as const,
        label: "Epics",
        icon: "flag" as const,
        count: epicsCount,
      },
      {
        value: "sprints" as const,
        label: "Sprints",
        icon: "loop" as const,
        count: sprintsCount,
      },
    ],
    [epicsCount, sprintsCount],
  );

  const handleChange = useCallback((v: PlanningSegment) => setSegment(v), []);

  return (
    <View style={styles.container}>
      <View style={[styles.column, isExpanded && styles.columnExpanded]}>
        <SegmentedControl
          options={options}
          value={segment}
          onChange={handleChange}
        />

        <WindowFrame
          title={segment === "epics" ? "epics.board" : "sprints.board"}
          subtitle={`${segment === "epics" ? epicsCount : sprintsCount} items`}
          flush
          style={styles.window}
        >
          {segment === "epics" ? (
            <EpicsBoard projectId={projectId} />
          ) : (
            <SprintsBoard projectId={projectId} />
          )}
        </WindowFrame>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
    alignItems: "center",
  },
  column: {
    flex: 1,
    width: "100%",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  columnExpanded: {
    maxWidth: layout.os.contentMaxWidth,
  },
  window: {
    flex: 1,
    marginBottom: spacing.md,
  },
});
