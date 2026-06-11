/**
 * LaunchSessionScreen — Configurez et lancez une session Claude Code
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { showAlert } from "@/services/dialog";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { sessionsApi } from "@/services/api";
import type { RootStackParamList } from "@/navigation/SimpleNavigator";

type RouteProps = RouteProp<RootStackParamList, "LaunchSession">;
type NavProp = NativeStackNavigationProp<RootStackParamList, "LaunchSession">;

type SessionMode = "interactive" | "headless" | "oneshot";

const SESSION_MODES: {
  value: SessionMode;
  label: string;
  description: string;
}[] = [
  {
    value: "interactive",
    label: "Interactive",
    description: "Session interactive avec terminal en temps réel",
  },
  {
    value: "headless",
    label: "Headless",
    description: "Exécution en arrière-plan, résultats via API",
  },
  {
    value: "oneshot",
    label: "One-shot",
    description: "Exécute un prompt unique et se termine",
  },
];

export function LaunchSessionScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProp>();
  const { machineId, machineName } = route.params;

  const [projectPath, setProjectPath] = useState("");
  const [selectedMode, setSelectedMode] = useState<SessionMode>("interactive");
  const [initialPrompt, setInitialPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLaunch = async () => {
    setIsLoading(true);
    try {
      const response = await sessionsApi.create(machineId, {
        mode: selectedMode,
        project_path: projectPath.trim() || undefined,
        initial_prompt: initialPrompt.trim() || undefined,
        pty_size: { cols: 120, rows: 40 },
      });

      const sessionId = response.data?.id?.slice(0, 8) ?? "…";
      showAlert(
        "✅ Session lancée",
        `Session ${sessionId}… démarrée sur ${machineName}`,
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } catch {
      showAlert(
        "Erreur",
        "Impossible de lancer la session. Vérifiez que la machine est connectée.",
        [{ text: "OK" }],
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-bg1"
      contentContainerClassName="px-5 pt-6 pb-10"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* ── Machine info banner ── */}
      <View className="bg-bg2 border border-bg4 rounded-2xl p-4 mb-6 flex-row items-center gap-x-3">
        <View className="w-10 h-10 rounded-xl bg-primary/20 items-center justify-center">
          <Text style={{ fontSize: 20 }}>🖥️</Text>
        </View>
        <View className="flex-1">
          <Text className="text-muted text-xs mb-0.5">Machine cible</Text>
          <Text
            className="text-white font-semibold text-base"
            numberOfLines={1}
          >
            {machineName}
          </Text>
        </View>
        <View className="bg-success/20 px-2.5 py-1 rounded-lg">
          <Text className="text-success text-xs font-medium">Online</Text>
        </View>
      </View>

      {/* ── Session mode ── */}
      <Text className="text-text-secondary text-sm font-medium mb-3">
        Mode de session
      </Text>
      <View className="gap-y-2 mb-6">
        {SESSION_MODES.map((mode) => {
          const isSelected = selectedMode === mode.value;
          return (
            <TouchableOpacity
              key={mode.value}
              className="rounded-xl p-3.5 border"
              style={{
                backgroundColor: isSelected ? "#a855f720" : "#1a1b26",
                borderColor: isSelected ? "#a855f7" : "#3b4261",
              }}
              onPress={() => setSelectedMode(mode.value)}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center justify-between mb-1">
                <Text
                  className="font-semibold text-sm"
                  style={{ color: isSelected ? "#a855f7" : "white" }}
                >
                  {mode.label}
                </Text>
                {isSelected ? (
                  <View className="w-5 h-5 rounded-full bg-primary items-center justify-center">
                    <Text
                      style={{
                        color: "white",
                        fontSize: 11,
                        fontWeight: "bold",
                      }}
                    >
                      ✓
                    </Text>
                  </View>
                ) : (
                  <View className="w-5 h-5 rounded-full border border-bg4" />
                )}
              </View>
              <Text className="text-muted text-xs">{mode.description}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Project path ── */}
      <Text className="text-text-secondary text-sm font-medium mb-2">
        Dossier du projet{" "}
        <Text className="text-muted text-xs font-normal">(optionnel)</Text>
      </Text>
      <TextInput
        className="bg-bg2 border border-bg4 rounded-xl px-4 py-3.5 text-white text-sm mb-6"
        placeholder="~/projects/mon-projet"
        placeholderTextColor="#64748b"
        value={projectPath}
        onChangeText={setProjectPath}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="next"
      />

      {/* ── Initial prompt (one-shot only) ── */}
      {selectedMode === "oneshot" || selectedMode === "headless" ? (
        <>
          <Text className="text-text-secondary text-sm font-medium mb-2">
            Prompt initial{" "}
            <Text className="text-muted text-xs font-normal">(optionnel)</Text>
          </Text>
          <TextInput
            className="bg-bg2 border border-bg4 rounded-xl px-4 py-3.5 text-white text-sm mb-6"
            placeholder="Ex: Analyse le fichier README.md et résume les points clés"
            placeholderTextColor="#64748b"
            value={initialPrompt}
            onChangeText={setInitialPrompt}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={{ minHeight: 80 }}
          />
        </>
      ) : null}

      {/* ── Launch button ── */}
      <TouchableOpacity
        className="rounded-xl py-4 items-center"
        style={{
          backgroundColor: isLoading ? "#7c3aed" : "#a855f7",
          opacity: isLoading ? 0.8 : 1,
        }}
        onPress={handleLaunch}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <View className="flex-row items-center gap-x-2">
            <ActivityIndicator color="white" size="small" />
            <Text className="text-white font-semibold text-base">
              Lancement…
            </Text>
          </View>
        ) : (
          <Text className="text-white font-semibold text-base">
            🚀 Lancer la session
          </Text>
        )}
      </TouchableOpacity>

      <Text className="text-muted text-xs text-center mt-4">
        La session sera créée sur {machineName} via l'agent ClaudeNest.
      </Text>
    </ScrollView>
  );
}
