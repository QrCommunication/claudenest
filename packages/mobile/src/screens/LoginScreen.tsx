/**
 * LoginScreen — Email + mot de passe
 * Inscription et gestion de compte = web uniquement
 */

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ScrollView,
  Linking,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/authStore";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://claudenest.io";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const passwordRef = useRef<TextInput>(null);

  // MFA step (shown in place of the credentials form when a challenge is pending)
  const [mfaCode, setMfaCode] = useState("");
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);

  const [resendCooldown, setResendCooldown] = useState(0);

  const {
    loginWithPassword,
    verifyMfa,
    resendMfaCode,
    cancelMfa,
    mfaPending,
    isLoading,
    error,
    clearError,
  } = useAuthStore();

  // Reset the code entry whenever the MFA step opens or closes.
  useEffect(() => {
    setMfaCode("");
    setUseRecoveryCode(false);
    setResendCooldown(0);
  }, [mfaPending]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Track keyboard height so the submit button stays reachable even when the
  // OS uses "pan" softwareKeyboardLayoutMode (KeyboardAvoidingView alone is
  // unreliable on Android in pan mode — we reserve scrollable space instead).
  useEffect(() => {
    const showEvt =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const onShow = Keyboard.addListener(showEvt, (e) =>
      setKeyboardHeight(e.endCoordinates?.height ?? 0),
    );
    const onHide = Keyboard.addListener(hideEvt, () => setKeyboardHeight(0));
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    clearError();
    try {
      await loginWithPassword(email.trim().toLowerCase(), password);
    } catch {
      // Error is set in the store
    }
  };

  const mfaCodeValid = useRecoveryCode
    ? mfaCode.trim().length > 0
    : mfaCode.trim().length === 6;

  const handleVerifyMfa = async () => {
    if (!mfaCodeValid || isLoading) return;
    clearError();
    try {
      await verifyMfa(mfaCode.trim());
    } catch {
      // Error is set in the store; if the mfa_token died (expired /
      // invalidated after 5 failures) the store also cleared mfaPending,
      // which brings the user back to the credentials form.
      setMfaCode("");
    }
  };

  const handleCancelMfa = () => {
    setPassword("");
    cancelMfa();
  };

  const toggleRecoveryCode = () => {
    setMfaCode("");
    clearError();
    setUseRecoveryCode((v) => !v);
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || isLoading) return;
    clearError();
    try {
      await resendMfaCode();
      setResendCooldown(30);
    } catch {
      // Error is set in the store; if the mfa_token died the store also
      // cleared mfaPending, bringing the user back to the credentials form.
    }
  };

  const openRegister = () => {
    Linking.openURL(`${API_URL}/register`);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-bg1"
    >
      <StatusBar style="light" />

      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow justify-center px-6 py-16"
        contentContainerStyle={{
          paddingBottom: keyboardHeight > 0 ? keyboardHeight + 24 : 0,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Brand ── */}
        <View className="items-center mb-12">
          <View className="w-20 h-20 rounded-2xl bg-primary items-center justify-center mb-5">
            <MaterialIcons name="terminal" size={40} color="white" />
          </View>
          <Text className="text-white text-3xl font-bold tracking-tight">
            ClaudeNest
          </Text>
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

        {/* ── MFA step ── */}
        {mfaPending ? (
          <View className="gap-y-4">
            <View className="items-center mb-2">
              <View className="w-14 h-14 rounded-2xl bg-bg2 border border-bg4 items-center justify-center mb-4">
                <MaterialIcons
                  name={
                    mfaPending.method === "totp"
                      ? "phonelink-lock"
                      : "mark-email-read"
                  }
                  size={28}
                  color="#a855f7"
                />
              </View>
              <Text className="text-white text-lg font-semibold text-center">
                Vérification en deux étapes
              </Text>
              <Text className="text-text-secondary text-sm mt-2 text-center">
                {useRecoveryCode
                  ? "Saisissez l'un de vos codes de récupération."
                  : mfaPending.method === "totp"
                    ? "Code de votre application d'authentification"
                    : "Code envoyé par email"}
              </Text>
            </View>

            {/* Code input */}
            <View>
              <Text className="text-text-secondary text-sm font-medium mb-2">
                {useRecoveryCode ? "Code de récupération" : "Code à 6 chiffres"}
              </Text>
              <View className="flex-row items-center bg-bg2 border border-bg4 rounded-xl">
                <View className="pl-4">
                  <MaterialIcons name="pin" size={20} color="#64748b" />
                </View>
                <TextInput
                  className={
                    useRecoveryCode
                      ? "flex-1 px-3 py-3.5 text-white text-base"
                      : "flex-1 px-3 py-3.5 text-white text-xl tracking-[8px] text-center"
                  }
                  placeholder={
                    useRecoveryCode ? "Votre code de récupération" : "000000"
                  }
                  placeholderTextColor="#64748b"
                  value={mfaCode}
                  onChangeText={setMfaCode}
                  keyboardType={useRecoveryCode ? "default" : "number-pad"}
                  maxLength={useRecoveryCode ? undefined : 6}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  returnKeyType="done"
                  textContentType="oneTimeCode"
                  autoComplete="one-time-code"
                  onSubmitEditing={handleVerifyMfa}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Verify */}
            <Pressable
              className="mt-2 rounded-xl py-4 items-center bg-primary"
              onPress={handleVerifyMfa}
              disabled={isLoading || !mfaCodeValid}
              style={({ pressed }) => ({
                opacity: pressed || isLoading || !mfaCodeValid ? 0.7 : 1,
              })}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Vérifier
                </Text>
              )}
            </Pressable>

            {/* Resend (email method) + recovery code toggle + cancel */}
            <View className="items-center gap-y-3 mt-2">
              {mfaPending.method === "email" && !useRecoveryCode ? (
                <Pressable
                  onPress={handleResendCode}
                  hitSlop={8}
                  disabled={isLoading || resendCooldown > 0}
                >
                  <Text
                    className={
                      resendCooldown > 0
                        ? "text-text-secondary text-sm"
                        : "text-primary text-sm"
                    }
                  >
                    {resendCooldown > 0
                      ? `Renvoyer le code (${resendCooldown}s)`
                      : "Renvoyer le code"}
                  </Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={toggleRecoveryCode}
                hitSlop={8}
                disabled={isLoading}
              >
                <Text className="text-primary text-sm">
                  {useRecoveryCode
                    ? "Utiliser un code à 6 chiffres"
                    : "Utiliser un code de récupération"}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleCancelMfa}
                hitSlop={8}
                disabled={isLoading}
              >
                <Text className="text-text-secondary text-sm">Annuler</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          /* ── Form ── */
          <View className="gap-y-4">
            {/* Email */}
            <View>
              <Text className="text-text-secondary text-sm font-medium mb-2">
                Email
              </Text>
              <View className="flex-row items-center bg-bg2 border border-bg4 rounded-xl">
                <View className="pl-4">
                  <MaterialIcons name="email" size={20} color="#64748b" />
                </View>
                <TextInput
                  className="flex-1 px-3 py-3.5 text-white text-base"
                  placeholder="vous@example.com"
                  placeholderTextColor="#64748b"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  returnKeyType="next"
                  textContentType="emailAddress"
                  autoComplete="email"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password */}
            <View>
              <Text className="text-text-secondary text-sm font-medium mb-2">
                Mot de passe
              </Text>
              <View className="flex-row items-center bg-bg2 border border-bg4 rounded-xl">
                <View className="pl-4">
                  <MaterialIcons name="lock" size={20} color="#64748b" />
                </View>
                <TextInput
                  ref={passwordRef}
                  className="flex-1 px-3 py-3.5 text-white text-base"
                  placeholder="Votre mot de passe"
                  placeholderTextColor="#64748b"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  textContentType="password"
                  autoComplete="password"
                  editable={!isLoading}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  className="px-4 py-3.5"
                  hitSlop={8}
                >
                  <MaterialIcons
                    name={showPassword ? "visibility-off" : "visibility"}
                    size={22}
                    color="#64748b"
                  />
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
                <Text className="text-white font-semibold text-base">
                  Se connecter
                </Text>
              )}
            </Pressable>
          </View>
        )}

        {/* ── Footer ── */}
        <View className="mt-10 items-center gap-y-3">
          {!mfaPending ? (
            <Pressable onPress={openRegister} hitSlop={8}>
              <Text className="text-primary text-sm">
                Pas de compte ? Inscrivez-vous sur le web
              </Text>
            </Pressable>
          ) : null}
          <Text className="text-muted text-xs text-center">
            ClaudeNest — Remote Claude Code Orchestration
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
