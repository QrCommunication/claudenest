/**
 * LoginScreen — Authentification email + mot de passe
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/stores/authStore';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { loginWithPassword, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    clearError();
    try {
      await loginWithPassword(email.trim().toLowerCase(), password);
    } catch {
      // Error is set in the store
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-bg1"
    >
      <StatusBar style="light" backgroundColor="#0f0f1a" />

      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow justify-center px-6 py-16"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Brand ── */}
        <View className="items-center mb-12">
          <View className="w-20 h-20 rounded-2xl bg-primary items-center justify-center mb-5">
            <Text style={{ color: 'white', fontSize: 36, fontWeight: 'bold' }}>{'<'}</Text>
          </View>
          <Text className="text-white text-3xl font-bold tracking-tight">ClaudeNest</Text>
          <Text className="text-text-secondary text-sm mt-2">
            Remote Claude Code Control
          </Text>
        </View>

        {/* ── Error banner ── */}
        {error ? (
          <View className="bg-danger/10 border border-danger/30 rounded-xl p-3.5 mb-5">
            <Text className="text-danger text-sm">{error}</Text>
          </View>
        ) : null}

        {/* ── Form ── */}
        <View className="gap-y-4">
          {/* Email */}
          <View>
            <Text className="text-text-secondary text-sm font-medium mb-2">Email</Text>
            <TextInput
              className="bg-bg2 border border-bg4 rounded-xl px-4 py-3.5 text-white text-base"
              placeholder="vous@example.com"
              placeholderTextColor="#64748b"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              returnKeyType="next"
              textContentType="emailAddress"
            />
          </View>

          {/* Password */}
          <View>
            <Text className="text-text-secondary text-sm font-medium mb-2">
              Mot de passe
            </Text>
            <View className="flex-row items-center bg-bg2 border border-bg4 rounded-xl">
              <TextInput
                className="flex-1 px-4 py-3.5 text-white text-base"
                placeholder="••••••••"
                placeholderTextColor="#64748b"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                textContentType="password"
              />
              <Pressable
                onPress={() => setShowPassword(v => !v)}
                className="px-4 py-3.5"
                hitSlop={8}
              >
                <Text style={{ fontSize: 18 }}>
                  {showPassword ? '🙈' : '👁️'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Submit */}
          <Pressable
            className="mt-2 rounded-xl py-4 items-center bg-primary"
            onPress={handleLogin}
            disabled={isLoading || !email || !password}
            style={({ pressed }) => ({
              opacity: pressed || isLoading || !email || !password ? 0.7 : 1,
            })}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">Se connecter</Text>
            )}
          </Pressable>
        </View>

        {/* ── Footer ── */}
        <Text className="text-muted text-xs text-center mt-10">
          ClaudeNest — Remote Claude Code Orchestration
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
