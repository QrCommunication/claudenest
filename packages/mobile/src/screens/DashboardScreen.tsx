/**
 * DashboardScreen
 * Aggregated stats and activity overview for the authenticated user.
 */

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  RefreshControl,
  Animated,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/theme';
import { useAuthStore } from '@/stores/authStore';
import { machinesApi, sessionsApi, projectsApi, api } from '@/services/api';
import { useFadeIn } from '@/utils/animations';
import { StatusDot } from '@/components/common/StatusDot';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import type { Session, ActivityLog, ActivityType, Machine } from '@/types';

// ==================== TYPES ====================

interface DashboardStats {
  machines: { total: number; online: number };
  sessions: { active: number; total_today: number };
  projects: { total: number; active: number };
  tasks: { pending: number; in_progress: number; done_today: number };
  tokens: { total: number; today: number };
  cost: { total: number; today: number };
  locks: { active: number };
  context_chunks: { total: number };
  activity_24h: number;
  sparklines: {
    activity_7d: number[];
    sessions_7d: number[];
    tokens_7d: number[];
  };
}

// ==================== SUB-COMPONENTS ====================

interface StatCardProps {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  value: number | string;
  accent?: string;
  sublabel?: string;
  pulse?: boolean;
}

const StatCard = memo(function StatCard({
  icon,
  label,
  value,
  accent = colors.primary.purple,
  sublabel,
  pulse = false,
}: StatCardProps) {
  const fadeStyle = useFadeIn();

  return (
    <Animated.View style={[styles.statCard, fadeStyle]}>
      <View style={styles.statCardInner}>
        <View style={[styles.statIconWrap, { backgroundColor: accent + '18' }]}>
          <Icon name={icon} size={18} color={accent} />
        </View>
        <View style={styles.statContent}>
          <View style={styles.statValueRow}>
            <Text style={[styles.statValue, { color: accent }]}>
              {value}
            </Text>
            {pulse && (
              <StatusDot status="online" size={8} pulse />
            )}
          </View>
          <Text style={styles.statLabel}>{label}</Text>
          {sublabel ? <Text style={styles.statSublabel}>{sublabel}</Text> : null}
        </View>
      </View>
    </Animated.View>
  );
});

interface SessionItemProps {
  session: Session;
}

const SessionItem = memo(function SessionItem({ session }: SessionItemProps) {
  const statusColor =
    session.status === 'running'
      ? colors.semantic.success
      : session.status === 'waiting_input'
      ? colors.primary.cyan
      : colors.text.muted;

  const formatPath = (path: string | null) => {
    if (!path) return 'No path';
    const parts = path.split('/');
    return parts[parts.length - 1] || path;
  };

  return (
    <View style={styles.sessionItem}>
      <StatusDot
        status={session.status === 'running' ? 'online' : 'connecting'}
        size={8}
        pulse={session.status === 'running'}
      />
      <View style={styles.sessionItemContent}>
        <Text style={styles.sessionItemPath} numberOfLines={1}>
          {formatPath(session.projectPath)}
        </Text>
        <Text style={[styles.sessionItemStatus, { color: statusColor }]}>
          {session.status.replace('_', ' ')}
        </Text>
      </View>
      <Text style={styles.sessionItemMode}>{session.mode}</Text>
    </View>
  );
});

interface ActivityItemProps {
  activity: ActivityLog;
  isLast: boolean;
}

const ACTIVITY_ICONS: Record<ActivityType, React.ComponentProps<typeof Icon>['name']> = {
  task_claimed: 'assignment-ind',
  task_completed: 'check-circle',
  context_updated: 'auto-awesome',
  file_locked: 'lock',
  file_unlocked: 'lock-open',
  broadcast: 'campaign',
  conflict: 'warning',
  instance_connected: 'link',
  instance_disconnected: 'link-off',
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  task_claimed: colors.primary.indigo,
  task_completed: colors.semantic.success,
  context_updated: colors.primary.cyan,
  file_locked: colors.semantic.warning,
  file_unlocked: colors.semantic.info,
  broadcast: colors.primary.purple,
  conflict: colors.semantic.error,
  instance_connected: colors.semantic.success,
  instance_disconnected: colors.text.muted,
};

const ActivityItem = memo(function ActivityItem({
  activity,
  isLast,
}: ActivityItemProps) {
  const iconName = ACTIVITY_ICONS[activity.type] ?? 'info';
  const iconColor = ACTIVITY_COLORS[activity.type] ?? colors.text.muted;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const humanizeType = (type: ActivityType) =>
    type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <View style={[styles.activityItem, isLast && styles.activityItemLast]}>
      <View style={[styles.activityIconWrap, { backgroundColor: iconColor + '18' }]}>
        <Icon name={iconName} size={14} color={iconColor} />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityType}>{humanizeType(activity.type)}</Text>
        {activity.instanceId ? (
          <Text style={styles.activityMeta} numberOfLines={1}>
            {activity.instanceId.slice(0, 10)}…
          </Text>
        ) : null}
      </View>
      <Text style={styles.activityTime}>{formatTime(activity.createdAt)}</Text>
    </View>
  );
});

// Skeleton placeholder for loading state
const SkeletonCard = memo(function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]} />
  );
});

// ==================== MAIN SCREEN ====================

export const DashboardScreen = memo(function DashboardScreen() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);

    try {
      // Fetch dashboard stats and machines list in parallel
      const [statsRes, machinesRes] = await Promise.all([
        api.get<DashboardStats>('/dashboard/stats'),
        machinesApi.list().catch(() => ({ data: [] as Machine[] })),
      ]);

      const statsData = statsRes.data ?? null;
      setStats(statsData);

      // Fetch sessions from all machines and flatten — non-blocking
      const machines = machinesRes.data ?? [];
      if (machines.length > 0) {
        try {
          const sessionResults = await Promise.all(
            machines.map((m) =>
              sessionsApi.list(m.id).catch(() => ({ data: [] as Session[] }))
            )
          );
          const allSessions = sessionResults.flatMap((r) => r.data ?? []);
          const activeSess = allSessions.filter(
            (s) => s.status === 'running' || s.status === 'waiting_input'
          );
          setActiveSessions(activeSess);

          // Fetch recent activity from the first available project — non-blocking
          if (statsData && statsData.projects.total > 0) {
            try {
              // Use activity from first machine's first project as a proxy
              const projectsRes = await projectsApi.list(machines[0].id);
              const projects = projectsRes.data ?? [];
              if (projects.length > 0) {
                const actRes = await projectsApi.getActivity(projects[0].id, { limit: 5 });
                setRecentActivity(actRes.data ?? []);
              }
            } catch {
              // Activity is non-critical
            }
          }
        } catch {
          // Sessions fetch is non-blocking; stats still shown
        }
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData(true);
  }, [fetchData]);

  const renderSessionItem = useCallback(
    ({ item }: { item: Session }) => <SessionItem session={item} />,
    []
  );

  const keyExtractSession = useCallback((item: Session) => item.id, []);

  const formatNumber = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
    return String(n);
  };

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  if (isLoading && !stats) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ClaudeNest</Text>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.statsGrid}>
            {[1, 2, 3, 4].map((k) => (
              <SkeletonCard key={k} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>ClaudeNest</Text>
          <Text style={styles.headerSub}>
            {user?.name ?? user?.email ?? 'Dashboard'}
          </Text>
        </View>
        <TouchableOpacity activeOpacity={0.75} style={styles.avatarWrap}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary.purple}
            colors={[colors.primary.purple]}
          />
        }
      >
        {/* Error */}
        {error ? (
          <ErrorMessage message={error} onRetry={() => fetchData()} />
        ) : null}

        {/* Stats Grid 2x2 */}
        {stats ? (
          <View style={styles.statsGrid}>
            <StatCard
              icon="computer"
              label="Machines online"
              value={`${stats.machines.online}/${stats.machines.total}`}
              accent={colors.semantic.success}
              pulse={stats.machines.online > 0}
            />
            <StatCard
              icon="terminal"
              label="Active sessions"
              value={stats.sessions.active}
              accent={colors.primary.cyan}
              sublabel={`${stats.sessions.total_today} today`}
              pulse={stats.sessions.active > 0}
            />
            <StatCard
              icon="assignment"
              label="Tasks pending"
              value={stats.tasks.pending}
              accent={colors.semantic.warning}
              sublabel={`${stats.tasks.done_today} done today`}
            />
            <StatCard
              icon="folder-shared"
              label="Projects"
              value={stats.projects.total}
              accent={colors.primary.purple}
              sublabel={`${stats.projects.active} active`}
            />
          </View>
        ) : null}

        {/* Tokens & Cost row */}
        {stats ? (
          <View style={styles.metricsRow}>
            <View style={styles.metricChip}>
              <Icon name="toll" size={14} color={colors.text.muted} />
              <Text style={styles.metricChipText}>
                {formatNumber(stats.tokens.today)} tokens today
              </Text>
            </View>
            <View style={styles.metricChip}>
              <Icon name="attach-money" size={14} color={colors.text.muted} />
              <Text style={styles.metricChipText}>
                ${stats.cost.today.toFixed(2)} today
              </Text>
            </View>
          </View>
        ) : null}

        {/* Active Sessions horizontal list */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Sessions</Text>
            {stats ? (
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{stats.sessions.active}</Text>
              </View>
            ) : null}
          </View>

          {activeSessions.length > 0 ? (
            <FlatList
              data={activeSessions}
              renderItem={renderSessionItem}
              keyExtractor={keyExtractSession}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sessionsListContent}
              ItemSeparatorComponent={() => <View style={{ width: spacing.sm }} />}
            />
          ) : (
            <View style={styles.emptySmall}>
              <Icon name="terminal" size={24} color={colors.text.muted} />
              <Text style={styles.emptySmallText}>No active sessions</Text>
            </View>
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {stats ? (
              <Text style={styles.sectionMeta}>{stats.activity_24h} in 24h</Text>
            ) : null}
          </View>

          <View style={styles.activityList}>
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  isLast={index === recentActivity.length - 1}
                />
              ))
            ) : (
              <View style={styles.emptySmall}>
                <Icon name="timeline" size={24} color={colors.text.muted} />
                <Text style={styles.emptySmallText}>No recent activity</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
});

// ==================== STYLES ====================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.dark1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerTitle: {
    fontSize: typography.size['2xl'],
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  avatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary.purple + '30',
    borderWidth: 1,
    borderColor: colors.primary.purple + '60',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: colors.primary.purple,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.md,
  },
  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statCard: {
    width: '47.5%',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: spacing.md,
  },
  statCardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.base,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  statContent: {
    flex: 1,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontSize: typography.size['2xl'],
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    lineHeight: 30,
  },
  statLabel: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  statSublabel: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    marginTop: 1,
  },
  // Metrics row
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.base,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  metricChipText: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
    fontVariant: ['tabular-nums'],
  },
  // Sections
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.size.base,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  sectionBadge: {
    backgroundColor: colors.primary.purple + '25',
    borderRadius: borderRadius.full,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  sectionBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: '700',
    color: colors.primary.purple,
  },
  sectionMeta: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
  },
  // Sessions horizontal list
  sessionsListContent: {
    paddingHorizontal: spacing.md,
  },
  sessionItem: {
    width: 180,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sessionItemContent: {
    flex: 1,
  },
  sessionItemPath: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: colors.text.primary,
  },
  sessionItemStatus: {
    fontSize: typography.size.xs,
    marginTop: 2,
  },
  sessionItemMode: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    backgroundColor: colors.background.dark1,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  // Activity list
  activityList: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  activityItemLast: {
    borderBottomWidth: 0,
  },
  activityIconWrap: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityType: {
    fontSize: typography.size.sm,
    fontWeight: '500',
    color: colors.text.primary,
  },
  activityMeta: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    marginTop: 1,
    fontFamily: typography.fontFamily.mono,
  },
  activityTime: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    fontVariant: ['tabular-nums'],
  },
  // Empty states
  emptySmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  emptySmallText: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
  },
  // Skeleton
  skeletonCard: {
    width: '47.5%',
    height: 80,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
  },
  bottomPad: {
    height: spacing.xl,
  },
});
