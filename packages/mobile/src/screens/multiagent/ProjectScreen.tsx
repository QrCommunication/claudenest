/**
 * ProjectScreen
 * Detailed view of a multi-agent project with scrollable horizontal tabs.
 * Tabs: Overview, Tasks, Planning (Epics+Sprints merged — web parity),
 * Context, Locks, Orchestration, Assistant (planning chat).
 */

import React, {
  useEffect,
  useCallback,
  useState,
  useMemo,
  useRef,
  memo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import { showAlert, showPrompt } from "@/services/dialog";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
type IconName = React.ComponentProps<typeof MaterialIcons>["name"];
const Icon = MaterialIcons;

import { colors, spacing, borderRadius, typography } from "@/theme";
import { useProjectsStore } from "@/stores/projectsStore";
import { useEpicsStore } from "@/stores/epicsStore";
import { useSprintsStore } from "@/stores/sprintsStore";
import {
  Card,
  CardHeader,
  CardContent,
  LoadingSpinner,
} from "@/components/common";
import { InstanceCard, TokenBudgetPanel } from "@/components/multiagent";
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import type { ProjectsStackParamList } from "@/navigation/types";
import type { SharedProject, ClaudeInstance } from "@/types";

type Props = NativeStackScreenProps<ProjectsStackParamList, "ProjectDetail">;

// ---------------------------------------------------------------------------
// Tab configuration
// ---------------------------------------------------------------------------

type TabKey =
  | "overview"
  | "tasks"
  | "planning"
  | "context"
  | "locks"
  | "git"
  | "audit"
  | "health"
  | "tokens"
  | "orchestration"
  | "assistant";

interface TabConfig {
  key: TabKey;
  label: string;
  icon: IconName;
}

const TABS: TabConfig[] = [
  { key: "overview", label: "Overview", icon: "dashboard" },
  { key: "tasks", label: "Tasks", icon: "assignment" },
  // Merged Epics + Sprints (web parity — segmented control on the screen).
  { key: "planning", label: "Planning", icon: "event-note" },
  { key: "context", label: "Context", icon: "description" },
  { key: "locks", label: "Locks", icon: "lock" },
  { key: "git", label: "Git", icon: "merge-type" },
  { key: "audit", label: "Audit", icon: "history" },
  { key: "health", label: "Health", icon: "monitor-heart" },
  { key: "tokens", label: "Tokens", icon: "toll" },
  { key: "orchestration", label: "Orchestration", icon: "account-tree" },
  { key: "assistant", label: "Assistant", icon: "chat" },
];

// ---------------------------------------------------------------------------
// TokenProgressBar
// ---------------------------------------------------------------------------

interface TokenProgressBarProps {
  used: number;
  max: number;
}

const TokenProgressBar = memo(function TokenProgressBar({
  used,
  max,
}: TokenProgressBarProps) {
  const ratio = max > 0 ? Math.min(used / max, 1) : 0;
  const pct = Math.round(ratio * 100);
  const fillColor =
    ratio > 0.85
      ? colors.semantic.error
      : ratio > 0.6
        ? colors.semantic.warning
        : colors.primary.purple;

  return (
    <View style={progressStyles.container}>
      <View style={progressStyles.header}>
        <Text style={progressStyles.label}>Token Usage</Text>
        <Text style={progressStyles.value}>
          {pct}% · {(used / 1000).toFixed(1)}k / {(max / 1000).toFixed(0)}k
        </Text>
      </View>
      <View style={progressStyles.track}>
        <View
          style={[
            progressStyles.fill,
            { width: `${pct}%`, backgroundColor: fillColor },
          ]}
        />
      </View>
    </View>
  );
});

const progressStyles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.dark3,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "600",
  },
  value: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
    fontWeight: "500",
  },
  track: {
    height: 4,
    backgroundColor: colors.background.dark4,
    borderRadius: borderRadius.full,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: borderRadius.full,
  },
});

// ---------------------------------------------------------------------------
// TabBar
// ---------------------------------------------------------------------------

interface TabBarProps {
  activeTab: TabKey;
  badges: Partial<Record<TabKey, number>>;
  onSelect: (tab: TabKey) => void;
}

const TabBar = memo(function TabBar({
  activeTab,
  badges,
  onSelect,
}: TabBarProps) {
  const indicatorX = useRef(new Animated.Value(0)).current;
  const tabWidths = useRef<Record<string, number>>({});
  const tabOffsets = useRef<Record<string, number>>({});

  const handleTabLayout = useCallback(
    (key: string, x: number, width: number) => {
      tabWidths.current[key] = width;
      tabOffsets.current[key] = x;
    },
    [],
  );

  return (
    <View style={tabStyles.wrapper} accessibilityRole="tablist">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tabStyles.container}
        bounces={false}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const badge = badges[tab.key];
          return (
            <TouchableOpacity
              key={tab.key}
              style={[tabStyles.tab, isActive && tabStyles.tabActive]}
              onPress={() => onSelect(tab.key)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={
                badge !== undefined && badge > 0
                  ? `${tab.label}, ${badge}`
                  : tab.label
              }
              onLayout={(e) =>
                handleTabLayout(
                  tab.key,
                  e.nativeEvent.layout.x,
                  e.nativeEvent.layout.width,
                )
              }
            >
              <Icon
                name={tab.icon}
                size={16}
                color={isActive ? colors.primary.purple : colors.text.muted}
              />
              <Text
                style={[tabStyles.label, isActive && tabStyles.labelActive]}
              >
                {tab.label}
              </Text>
              {badge !== undefined && badge > 0 && (
                <View
                  style={[tabStyles.badge, isActive && tabStyles.badgeActive]}
                >
                  <Text
                    style={[
                      tabStyles.badgeText,
                      isActive && tabStyles.badgeTextActive,
                    ]}
                  >
                    {badge > 99 ? "99+" : badge}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {/* Bottom border */}
      <View style={tabStyles.border} />
    </View>
  );
});

const tabStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background.dark3,
  },
  container: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.base,
  },
  tabActive: {
    backgroundColor: "rgba(168,85,247,0.15)",
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: "500",
    color: colors.text.muted,
  },
  labelActive: {
    color: colors.primary.purple,
    fontWeight: "600",
  },
  badge: {
    minWidth: 16,
    height: 16,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.dark4,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeActive: {
    backgroundColor: "rgba(168,85,247,0.3)",
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.text.muted,
  },
  badgeTextActive: {
    color: colors.primary.purple,
  },
  border: {
    height: 1,
    backgroundColor: colors.border.subtle,
  },
});

// ---------------------------------------------------------------------------
// Overview tab content
// ---------------------------------------------------------------------------

interface OverviewTabProps {
  project: SharedProject | undefined;
  instances: ClaudeInstance[];
  projectId: string;
  onBroadcast: () => void;
  isBroadcasting: boolean;
}

const OverviewTab = memo(function OverviewTab({
  project,
  instances,
  onBroadcast,
  isBroadcasting,
}: OverviewTabProps) {
  if (!project) return null;

  return (
    <ScrollView contentContainerStyle={overviewStyles.container}>
      {/* Project info card */}
      <Card style={overviewStyles.infoCard}>
        <View style={overviewStyles.infoRow}>
          <View style={overviewStyles.iconBox}>
            <Icon
              name="folder-shared"
              size={28}
              color={colors.primary.purple}
            />
          </View>
          <View style={overviewStyles.infoText}>
            <Text style={overviewStyles.name}>{project.name}</Text>
            <Text style={overviewStyles.path} numberOfLines={1}>
              {project.projectPath}
            </Text>
          </View>
        </View>
      </Card>

      {/* Broadcast action */}
      <TouchableOpacity
        style={[
          overviewStyles.broadcastButton,
          isBroadcasting && overviewStyles.broadcastButtonDisabled,
        ]}
        onPress={onBroadcast}
        disabled={isBroadcasting}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel="Broadcast to all instances"
        accessibilityState={{ disabled: isBroadcasting, busy: isBroadcasting }}
      >
        <Icon
          name="campaign"
          size={20}
          color={isBroadcasting ? colors.text.muted : colors.semantic.success}
        />
        <Text
          style={[
            overviewStyles.broadcastText,
            isBroadcasting && { color: colors.text.muted },
          ]}
        >
          {isBroadcasting ? "Broadcasting..." : "Broadcast to all instances"}
        </Text>
      </TouchableOpacity>

      {/* Summary */}
      {project.summary ? (
        <Card style={overviewStyles.sectionCard}>
          <CardHeader title="Summary" />
          <CardContent>
            <Text style={overviewStyles.bodyText}>{project.summary}</Text>
          </CardContent>
        </Card>
      ) : null}

      {/* Current focus */}
      {project.currentFocus ? (
        <Card style={overviewStyles.sectionCard}>
          <CardHeader title="Current Focus" />
          <CardContent>
            <Text style={overviewStyles.bodyText}>{project.currentFocus}</Text>
          </CardContent>
        </Card>
      ) : null}

      {/* Architecture */}
      {project.architecture ? (
        <Card style={overviewStyles.sectionCard}>
          <CardHeader title="Architecture" />
          <CardContent>
            <Text style={overviewStyles.bodyText}>{project.architecture}</Text>
          </CardContent>
        </Card>
      ) : null}

      {/* Active instances */}
      <Card style={overviewStyles.sectionCard}>
        <CardHeader
          title="Active Instances"
          rightContent={
            <Text style={overviewStyles.instanceCount}>{instances.length}</Text>
          }
        />
        {instances.length > 0 ? (
          instances.map((inst) => (
            <InstanceCard key={inst.id} instance={inst} />
          ))
        ) : (
          <CardContent>
            <Text style={overviewStyles.emptyText}>No active instances</Text>
          </CardContent>
        )}
      </Card>
    </ScrollView>
  );
});

const overviewStyles = StyleSheet.create({
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  infoCard: {},
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: "rgba(168,85,247,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  infoText: {
    flex: 1,
  },
  name: {
    fontSize: typography.size.xl,
    fontWeight: "700",
    color: colors.text.primary,
  },
  path: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  broadcastButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(34,197,94,0.1)",
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.3)",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  broadcastButtonDisabled: {
    opacity: 0.5,
  },
  broadcastText: {
    fontSize: typography.size.base,
    fontWeight: "600",
    color: colors.semantic.success,
  },
  sectionCard: {},
  bodyText: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  instanceCount: {
    fontSize: typography.size.md,
    fontWeight: "600",
    color: colors.primary.purple,
  },
  emptyText: {
    fontSize: typography.size.base,
    color: colors.text.muted,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
});

// ---------------------------------------------------------------------------
// PlaceholderTab — for tabs that navigate to a dedicated screen
// ---------------------------------------------------------------------------

interface PlaceholderTabProps {
  icon: IconName;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

const PlaceholderTab = memo(function PlaceholderTab({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: PlaceholderTabProps) {
  return (
    <View style={placeholderStyles.container}>
      <Icon
        name={icon}
        size={48}
        color={colors.primary.purple}
        style={{ opacity: 0.6 }}
      />
      <Text style={placeholderStyles.title}>{title}</Text>
      <Text style={placeholderStyles.description}>{description}</Text>
      <TouchableOpacity
        style={placeholderStyles.button}
        onPress={onAction}
        activeOpacity={0.8}
      >
        <Text style={placeholderStyles.buttonText}>{actionLabel}</Text>
      </TouchableOpacity>
    </View>
  );
});

const placeholderStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: "700",
    color: colors.text.primary,
    textAlign: "center",
  },
  description: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
  button: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: "rgba(168,85,247,0.15)",
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary.purple,
    marginTop: spacing.sm,
  },
  buttonText: {
    fontSize: typography.size.base,
    fontWeight: "600",
    color: colors.primary.purple,
  },
});

// ---------------------------------------------------------------------------
// ProjectDetailContent — the project detail body, decoupled from route params
// so it can be embedded in the tablet master-detail split (right pane) as well
// as rendered as a full screen. Sub-tabs still push onto the shared stack.
// ---------------------------------------------------------------------------

interface ProjectDetailContentProps {
  projectId: string;
  // Only `navigate` is needed; typing it this way lets BOTH the ProjectDetail
  // route nav (full screen) and the ProjectsList route nav (tablet split) pass
  // without setParams variance friction.
  navigation: Pick<
    NativeStackNavigationProp<ProjectsStackParamList>,
    "navigate"
  >;
}

export const ProjectDetailContent: React.FC<ProjectDetailContentProps> = ({
  projectId,
  navigation,
}) => {
  const {
    getProjectById,
    fetchProject,
    fetchInstances,
    fetchTasks,
    fetchLocks,
    getProjectInstances,
    getProjectTasks,
    getProjectLocks,
    subscribeToProject,
    broadcast,
    tokenBudget,
    isLoadingTokenBudget,
    fetchTokenBudget,
  } = useProjectsStore();

  const {
    getEpicsByProject,
    fetchEpics,
    subscribeRealtime: subscribeEpicsRealtime,
  } = useEpicsStore();
  const { getSprintsByProject, fetchSprints } = useSprintsStore();

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  // Local error flag for the token-budget panel — kept separate from the
  // store's shared `error` so a failed budget fetch doesn't bleed into other
  // tabs' error surfaces.
  const [tokenBudgetError, setTokenBudgetError] = useState(false);

  // Lazy-load tab data tracking
  const loadedTabs = useRef<Set<TabKey>>(new Set(["overview"]));

  const project = getProjectById(projectId);
  const instances = getProjectInstances(projectId);
  const tasks = getProjectTasks(projectId);
  const locks = getProjectLocks(projectId);
  const epics = getEpicsByProject(projectId);
  const sprints = getSprintsByProject(projectId);

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  useEffect(() => {
    fetchProject(projectId);
    fetchInstances(projectId);
    fetchTasks(projectId);
    fetchLocks(projectId);
    fetchEpics(projectId);
    fetchSprints(projectId);

    const unsubscribe = subscribeToProject(projectId);
    // Live AI decomposition lifecycle (pending → running → completed | failed)
    // on the same project channel — patches the epic board in place.
    const unsubscribeEpics = subscribeEpicsRealtime(projectId);
    return () => {
      unsubscribeEpics();
      unsubscribe();
    };
  }, [projectId]);

  // Refresh the token budget (also used as the panel's onRefresh affordance).
  const handleRefreshTokenBudget = useCallback(() => {
    setTokenBudgetError(false);
    fetchTokenBudget(projectId).catch(() => setTokenBudgetError(true));
  }, [projectId, fetchTokenBudget]);

  // Lazy-load additional data when a tab is selected for the first time
  const handleTabSelect = useCallback(
    (tab: TabKey) => {
      setActiveTab(tab);

      if (loadedTabs.current.has(tab)) return;
      loadedTabs.current.add(tab);

      switch (tab) {
        case "tasks":
          fetchTasks(projectId);
          break;
        case "planning":
          fetchEpics(projectId);
          fetchSprints(projectId);
          break;
        case "locks":
          fetchLocks(projectId);
          break;
        case "tokens":
          handleRefreshTokenBudget();
          break;
        case "context":
          // Context tab navigates to ContextScreen — no inline load needed
          break;
        default:
          break;
      }
    },
    [
      projectId,
      fetchTasks,
      fetchEpics,
      fetchSprints,
      fetchLocks,
      handleRefreshTokenBudget,
    ],
  );

  // ---------------------------------------------------------------------------
  // Broadcast
  // ---------------------------------------------------------------------------

  const handleBroadcast = useCallback(() => {
    showPrompt(
      "Broadcast Message",
      "Send a message to all instances in this project:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          onPress: async (message: string | undefined) => {
            if (message) {
              setIsBroadcasting(true);
              try {
                await broadcast(projectId, message);
                showAlert("Success", "Message broadcasted to all instances");
              } catch {
                showAlert("Error", "Failed to broadcast message");
              } finally {
                setIsBroadcasting(false);
              }
            }
          },
        },
      ],
      "plain-text",
    );
  }, [projectId, broadcast]);

  // ---------------------------------------------------------------------------
  // Badge counts
  // ---------------------------------------------------------------------------

  const badges = useMemo<Partial<Record<TabKey, number>>>(
    () => ({
      tasks: tasks.filter((t) => t.status !== "done").length,
      // Web parity: the Planning tab badge counts epics + sprints.
      planning: epics.length + sprints.length,
      locks: locks.length,
      orchestration: instances.length,
    }),
    [tasks, epics, sprints, locks, instances],
  );

  // ---------------------------------------------------------------------------
  // Tab content
  // ---------------------------------------------------------------------------

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <OverviewTab
            project={project}
            instances={instances}
            projectId={projectId}
            onBroadcast={handleBroadcast}
            isBroadcasting={isBroadcasting}
          />
        );

      case "tasks":
        return (
          <PlaceholderTab
            icon="assignment"
            title="Tasks"
            description={`${tasks.length} task${tasks.length !== 1 ? "s" : ""} in this project`}
            actionLabel="Open Tasks"
            onAction={() => navigation.navigate("Tasks", { projectId })}
          />
        );

      case "planning":
        return (
          <PlaceholderTab
            icon="event-note"
            title="Planning"
            description={`${epics.length} epic${epics.length !== 1 ? "s" : ""} · ${sprints.length} sprint${sprints.length !== 1 ? "s" : ""}`}
            actionLabel="Open Planning"
            onAction={() => navigation.navigate("Planning", { projectId })}
          />
        );

      case "context":
        return (
          <PlaceholderTab
            icon="description"
            title="Context"
            description="RAG-powered shared context for all agents"
            actionLabel="Open Context"
            onAction={() => navigation.navigate("Context", { projectId })}
          />
        );

      case "locks":
        return (
          <PlaceholderTab
            icon="lock"
            title="File Locks"
            description={`${locks.length} active lock${locks.length !== 1 ? "s" : ""}`}
            actionLabel="Open Locks"
            onAction={() => navigation.navigate("Locks", { projectId })}
          />
        );

      case "git":
        return (
          <PlaceholderTab
            icon="merge-type"
            title="Git & Pull Requests"
            description="Worktree status and PR merge for this project"
            actionLabel="Open Git"
            onAction={() => navigation.navigate("Git", { projectId })}
          />
        );

      case "audit":
        return (
          <PlaceholderTab
            icon="history"
            title="Audit Trail"
            description="Read-only history of all project activity"
            actionLabel="Open Audit"
            onAction={() => navigation.navigate("Audit", { projectId })}
          />
        );

      case "health":
        return (
          <PlaceholderTab
            icon="monitor-heart"
            title="Runner Health"
            description="Alerts, task/sprint checks and a one-tap status sweep"
            actionLabel="Open Health"
            onAction={() => navigation.navigate("RunnerHealth", { projectId })}
          />
        );

      case "tokens":
        return (
          <ScrollView contentContainerStyle={styles.tokenScroll}>
            <TokenBudgetPanel
              budget={tokenBudget}
              isLoading={isLoadingTokenBudget}
              error={tokenBudgetError}
              onRefresh={handleRefreshTokenBudget}
            />
          </ScrollView>
        );

      case "orchestration":
        return (
          <PlaceholderTab
            icon="account-tree"
            title="Orchestration"
            description={`${instances.length} active instance${instances.length !== 1 ? "s" : ""}`}
            actionLabel="Open Orchestration"
            onAction={() => navigation.navigate("Orchestration", { projectId })}
          />
        );

      case "assistant":
        return (
          <PlaceholderTab
            icon="chat"
            title="Planning Assistant"
            description="AI-assisted project planning and sprint creation"
            actionLabel="Open Assistant"
            onAction={() => navigation.navigate("PlanningChat", { projectId })}
          />
        );

      default:
        return null;
    }
  };

  // ---------------------------------------------------------------------------
  // Loading guard
  // ---------------------------------------------------------------------------

  if (!project) {
    return <LoadingSpinner text="Loading project..." fullScreen />;
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      {/* Token progress bar */}
      {project.maxTokens > 0 && (
        <TokenProgressBar used={project.totalTokens} max={project.maxTokens} />
      )}

      {/* Tab bar */}
      <TabBar
        activeTab={activeTab}
        badges={badges}
        onSelect={handleTabSelect}
      />

      {/* Tab content */}
      <View style={styles.content}>{renderTabContent()}</View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// ProjectScreen — thin route wrapper (full-screen, phone flow). The detail body
// lives in ProjectDetailContent so the tablet split can reuse it.
// ---------------------------------------------------------------------------

export const ProjectScreen: React.FC<Props> = ({ route, navigation }) => (
  <ProjectDetailContent
    projectId={route.params.projectId}
    navigation={navigation}
  />
);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark2,
  },
  content: {
    flex: 1,
  },
  tokenScroll: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
});
