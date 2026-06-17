/**
 * ShowArchivedToggle — reusable "Actifs / Archivés" switch.
 *
 * Backs the archive parity work across the mobile boards (epics, sprints,
 * tasks, projects). The stores expose a `showArchived: boolean` toggle, so
 * this component keeps a clean boolean API for callers while reusing the
 * accessible pill look of {@link SegmentedControl} (tablist/tab roles, the
 * readable accent-tinted active state, optional count badges).
 *
 * Labels default to French (the project language) but stay overridable so the
 * later i18n pass can feed translated strings without touching consumers.
 */

import React, { useMemo } from "react";
import { SegmentedControl, type SegmentOption } from "./SegmentedControl";

/** Internal segment values — boolean is mapped onto these at the boundary. */
type ArchiveSegment = "active" | "archived";

interface ShowArchivedToggleProps {
  /** Current state: `true` shows the archived view, `false` the active one. */
  value: boolean;
  /** Called with the next boolean state when a segment is tapped. */
  onChange: (showArchived: boolean) => void;
  /** Optional count badge on the active segment. */
  activeCount?: number;
  /** Optional count badge on the archived segment. */
  archivedCount?: number;
  /** Label for the active segment (default: "Actifs"). */
  activeLabel?: string;
  /** Label for the archived segment (default: "Archivés"). */
  archivedLabel?: string;
  accent?: "purple" | "cyan";
}

export function ShowArchivedToggle({
  value,
  onChange,
  activeCount,
  archivedCount,
  activeLabel = "Actifs",
  archivedLabel = "Archivés",
  accent = "purple",
}: ShowArchivedToggleProps) {
  const options = useMemo<SegmentOption<ArchiveSegment>[]>(
    () => [
      {
        value: "active",
        label: activeLabel,
        icon: "inbox",
        count: activeCount,
      },
      {
        value: "archived",
        label: archivedLabel,
        icon: "archive",
        count: archivedCount,
      },
    ],
    [activeLabel, archivedLabel, activeCount, archivedCount],
  );

  return (
    <SegmentedControl<ArchiveSegment>
      options={options}
      value={value ? "archived" : "active"}
      onChange={(segment) => onChange(segment === "archived")}
      accent={accent}
    />
  );
}
