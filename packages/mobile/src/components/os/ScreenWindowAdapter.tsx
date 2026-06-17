/**
 * ScreenWindowAdapter — renders a legacy (navigation-prop) screen inside a
 * Claude OS window. It builds a fake `navigation` + `route` mapped to the
 * windowApi bus, so screens that call navigation.navigate / goBack / setOptions
 * work unchanged (30/31 screens take navigation as a prop). A WindowErrorBoundary
 * isolates a screen crash to its own window (and surfaces the message) instead of
 * blanking the whole desktop.
 */

import React, { Component, type ReactNode, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/theme";
import { useWindowApi } from "./windowApi";
import { resolveRoute, type ScreenComponent } from "./appRegistry";

interface ScreenWindowAdapterProps {
  screen: ScreenComponent;
  routeName: string;
  params: Record<string, unknown>;
}

export function ScreenWindowAdapter({
  screen: Screen,
  routeName,
  params,
}: ScreenWindowAdapterProps) {
  const windowApi = useWindowApi();

  const navigation = useMemo(() => {
    const open = (name: string, navParams?: Record<string, unknown>) => {
      const input = resolveRoute(name, navParams);
      if (input) windowApi.openApp(input);
    };
    // Typed as any at the call sites: a windowApi-backed shim never matches the
    // full NavigationProp surface, and screens only use a small, stable subset.
    const nav: Record<string, unknown> = {
      navigate: open,
      push: open,
      replace: open,
      goBack: () => windowApi.close(),
      pop: () => windowApi.close(),
      popToTop: () => windowApi.close(),
      setOptions: (opts?: { title?: string }) => {
        if (opts?.title) windowApi.setTitle(opts.title);
      },
      setParams: () => {},
      addListener: () => () => {},
      removeListener: () => {},
      isFocused: () => true,
      canGoBack: () => true,
      dispatch: () => {},
      getId: () => undefined,
      getState: () => ({ routes: [], index: 0 }),
      reset: () => {},
    };
    nav.getParent = () => nav;
    return nav;
  }, [windowApi]);

  const route = useMemo(
    () => ({
      key: `${routeName}-${windowApi.windowId}`,
      name: routeName,
      params,
    }),
    [routeName, params, windowApi.windowId],
  );

  return (
    <WindowErrorBoundary>
      <Screen navigation={navigation as never} route={route as never} />
    </WindowErrorBoundary>
  );
}

class WindowErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.error}>
          <Text style={styles.errorTitle}>This panel hit an error</Text>
          <Text style={styles.errorMessage}>
            {this.state.error.message || String(this.state.error)}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  error: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.sm,
  },
  errorTitle: {
    ...typography.mono,
    fontSize: 13,
    color: colors.status.error,
  },
  errorMessage: {
    ...typography.mono,
    fontSize: 11,
    color: colors.text.muted,
    textAlign: "center",
  },
});
