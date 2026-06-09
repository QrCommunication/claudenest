/**
 * SkillsScreen
 * Full list of the skills the agent discovered on a machine, with a search box.
 * Fetches every page (the server defaults to 15/page) then filters locally for
 * instant search across name, description, category and tags.
 */

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  RefreshControl,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography } from "@/theme";
import { machinesApi } from "@/services/api";
import type { Skill } from "@/types";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { SettingsStackParamList } from "@/navigation/types";

import { LoadingSpinner, EmptyState, Card } from "@/components/common";

type Props = NativeStackScreenProps<SettingsStackParamList, "Skills">;

const SkillCard: React.FC<{ skill: Skill }> = ({ skill }) => {
  const accent = skill.category_color || colors.accent.purple;
  return (
    <Card style={styles.skillCard}>
      <View style={styles.skillHeader}>
        <View style={[styles.iconWrap, { backgroundColor: accent + "22" }]}>
          <Icon name="auto-awesome" size={20} color={accent} />
        </View>
        <View style={styles.skillInfo}>
          <Text style={styles.skillName} numberOfLines={1}>
            {skill.display_name || skill.name}
          </Text>
          <Text style={styles.skillPath} numberOfLines={1}>
            {skill.path}
          </Text>
        </View>
        {!skill.enabled && (
          <View style={styles.disabledTag}>
            <Text style={styles.disabledText}>OFF</Text>
          </View>
        )}
      </View>

      {skill.description ? (
        <Text style={styles.skillDescription} numberOfLines={3}>
          {skill.description}
        </Text>
      ) : null}

      <View style={styles.skillMeta}>
        {skill.category ? (
          <View style={[styles.metaTag, { borderColor: accent + "55" }]}>
            <Text style={[styles.metaText, { color: accent }]}>
              {skill.category}
            </Text>
          </View>
        ) : null}
        {skill.version ? (
          <View style={styles.metaTag}>
            <Text style={styles.metaText}>v{skill.version}</Text>
          </View>
        ) : null}
      </View>

      {skill.tags.length > 0 && (
        <View style={styles.tags}>
          {skill.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
};

export const SkillsScreen: React.FC<Props> = ({ route }) => {
  const { machineId } = route.params;
  const [skills, setSkills] = useState<Skill[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadSkills = useCallback(async () => {
    try {
      const all = await machinesApi.getAllSkills(machineId);
      setSkills(all);
    } catch {
      // keep whatever we had; empty state covers the first-load failure
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [machineId]);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadSkills();
  }, [loadSkills]);

  // Instant client-side search across the full list.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return skills;
    return skills.filter((s) => {
      const haystack = [
        s.name,
        s.display_name ?? "",
        s.description ?? "",
        s.category ?? "",
        s.path,
        ...s.tags,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [skills, query]);

  const renderItem = useCallback(
    ({ item }: { item: Skill }) => <SkillCard skill={item} />,
    [],
  );

  const keyExtractor = useCallback((item: Skill) => item.id ?? item.path, []);

  if (isLoading) {
    return <LoadingSpinner text="Loading skills..." fullScreen />;
  }

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Icon name="search" size={20} color={colors.text.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search skills..."
          placeholderTextColor={colors.text.muted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <Icon name="close" size={18} color={colors.text.muted} />
          </Pressable>
        )}
      </View>

      <Text style={styles.count}>
        {filtered.length}
        {query ? ` / ${skills.length}` : ""} skill
        {skills.length === 1 ? "" : "s"}
      </Text>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.purple}
            colors={[colors.accent.purple]}
          />
        }
        ListEmptyComponent={
          query ? (
            <EmptyState
              icon="search-off"
              title="No match"
              description={`No skill matches "${query}".`}
            />
          ) : (
            <EmptyState
              icon="auto-awesome"
              title="No skills found"
              description="No Claude Code skills discovered on this machine"
            />
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.bg.input,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.regular,
    paddingVertical: 0,
  },
  count: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  skillCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  skillHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  skillInfo: {
    flex: 1,
  },
  skillName: {
    fontSize: typography.size.md,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text.primary,
  },
  skillPath: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    fontFamily: typography.fontFamily.mono,
    marginTop: 2,
  },
  disabledTag: {
    backgroundColor: colors.bg.hover,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  disabledText: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontFamily.mono,
    color: colors.text.muted,
  },
  skillDescription: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  skillMeta: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
    flexWrap: "wrap",
  },
  metaTag: {
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  metaText: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: colors.accent.purple + "15",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    fontSize: typography.size.xs,
    color: colors.accent.purple,
  },
});
