/**
 * TokenBudgetPanel
 * Token cost + budget for a shared project (web parity:
 * components/multiagent/TokenBudgetPanel.vue). Presentational: it renders the
 * TokenBudget snapshot and a refresh affordance — fetching is owned by the
 * caller (projectsStore.fetchTokenBudget) so the panel stays testable and
 * reusable.
 */

import React, { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { borderRadius, colors, spacing, typography } from "@/theme";
import type { TokenBudget } from "@/types";

interface TokenBudgetPanelProps {
  budget: TokenBudget | null;
  isLoading: boolean;
  error?: boolean;
  onRefresh: () => void;
}

function formatTokens(value: number): string {
  return `${value.toLocaleString()} tokens`;
}

function formatCost(value: number, currency: string): string {
  const prefix = currency === "USD" ? "$" : "";
  return `${prefix}${value.toFixed(4)}${prefix ? "" : ` ${currency}`}`;
}

export const TokenBudgetPanel = memo(function TokenBudgetPanel({
  budget,
  isLoading,
  error = false,
  onRefresh,
}: TokenBudgetPanelProps) {
  // Empty when the project has no recorded usage yet (both the project-level
  // counter and the session-derived total are zero).
  const isEmpty =
    !!budget && budget.tokens.used === 0 && budget.tokens.session_total === 0;

  const percent = budget ? Math.min(100, budget.tokens.percent) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Token budget</Text>
        <TouchableOpacity
          onPress={onRefresh}
          disabled={isLoading}
          style={styles.refresh}
          accessibilityRole="button"
          accessibilityLabel="Refresh token budget"
        >
          <Icon
            name="refresh"
            size={18}
            color={isLoading ? colors.text.muted : colors.accent.purple}
          />
        </TouchableOpacity>
      </View>

      {/* First fetch keeps prior data on subsequent refreshes. */}
      {isLoading && !budget ? (
        <Text style={styles.muted}>Loading…</Text>
      ) : error ? (
        <Text style={styles.error}>Failed to load token budget.</Text>
      ) : isEmpty ? (
        <Text style={styles.muted}>No token usage recorded yet.</Text>
      ) : budget ? (
        <>
          {/* Estimated cost */}
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Estimated cost</Text>
            <Text style={styles.costValue}>
              {formatCost(budget.cost.estimated_usd, budget.cost.currency)}
            </Text>
          </View>

          {/* Usage against the project budget */}
          <View style={styles.usage}>
            <View style={styles.usageHead}>
              <Text style={styles.usageLabel}>Used</Text>
              <Text style={styles.usageFigures}>
                {formatTokens(budget.tokens.used)}
                {budget.tokens.max
                  ? ` / ${formatTokens(budget.tokens.max)}`
                  : " · unlimited"}
              </Text>
            </View>
            {budget.tokens.max ? (
              <View style={styles.bar}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${percent}%` },
                    budget.tokens.limit_reached && styles.barFillReached,
                  ]}
                />
              </View>
            ) : null}
            <View style={styles.usageFoot}>
              {budget.tokens.max ? (
                <Text style={styles.mutedSmall}>
                  {budget.tokens.percent}% used
                </Text>
              ) : (
                <View />
              )}
              {budget.tokens.limit_reached ? (
                <Text style={styles.limitReached}>Limit reached</Text>
              ) : null}
            </View>
          </View>

          {/* Input / output split + sessions */}
          <View style={styles.grid}>
            <Stat label="Input" value={formatTokens(budget.tokens.input)} />
            <Stat label="Output" value={formatTokens(budget.tokens.output)} />
            <Stat
              label="Session total"
              value={formatTokens(budget.tokens.session_total)}
            />
            <Stat label="Sessions" value={`${budget.sessions_count}`} />
          </View>

          <Text style={styles.pricing}>
            Pricing model:{" "}
            <Text style={styles.code}>{budget.cost.pricing_model}</Text>
          </Text>
        </>
      ) : null}
    </View>
  );
});

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
  },
  refresh: { padding: spacing.xs },
  muted: { ...typography.bodySmall, color: colors.text.muted },
  mutedSmall: { ...typography.caption, color: colors.text.muted },
  error: { ...typography.bodySmall, color: colors.status.error },

  costRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  costLabel: { ...typography.bodySmall, color: colors.text.secondary },
  costValue: {
    ...typography.body,
    fontWeight: "700",
    color: colors.accent.cyan,
    fontVariant: ["tabular-nums"],
  },

  usage: { gap: spacing.xs },
  usageHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  usageLabel: { ...typography.bodySmall, color: colors.text.secondary },
  usageFigures: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontVariant: ["tabular-nums"],
  },
  bar: {
    height: 6,
    backgroundColor: colors.bg.input,
    borderRadius: borderRadius.full,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: colors.accent.purple,
    borderRadius: borderRadius.full,
  },
  barFillReached: { backgroundColor: colors.status.error },
  usageFoot: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  limitReached: { ...typography.caption, color: colors.status.error },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  stat: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: colors.bg.input,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: 2,
  },
  statLabel: { ...typography.caption, color: colors.text.muted },
  statValue: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontVariant: ["tabular-nums"],
  },

  pricing: { ...typography.caption, color: colors.text.muted },
  code: { color: colors.text.secondary, fontFamily: "SpaceMono_400Regular" },
});
