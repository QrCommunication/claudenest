/**
 * Native panel registry — maps an appId to its native Claude OS panel.
 *
 * Kept separate from appRegistry to avoid an import cycle: panels import
 * `resolveRoute` from appRegistry, so appRegistry must not import panels. The
 * window host (FloatingWindow/AppHost) consults this map first; apps without a
 * native panel fall back to the legacy screen bridge (ScreenWindowAdapter).
 */

import React, { type ReactNode } from "react";
import { ProjectPanel } from "./ProjectPanel";
import { SettingsPanel } from "./SettingsPanel";
import { MachineDetailPanel } from "./MachineDetailPanel";

export const NATIVE_PANELS: Record<
  string,
  (params: Record<string, unknown>) => ReactNode
> = {
  project: (p) => <ProjectPanel projectId={String(p.projectId ?? "")} />,
  settings: () => <SettingsPanel />,
  machine: (p) => <MachineDetailPanel machineId={String(p.machineId ?? "")} />,
};
