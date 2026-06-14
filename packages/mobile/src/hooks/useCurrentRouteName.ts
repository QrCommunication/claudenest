/**
 * useCurrentRouteName — reactive name of the deepest active route.
 *
 * Subscribes to the navigation container's state so overlays (e.g. the OS dock)
 * can react to navigation without prop-drilling. Returns the leaf route name
 * (e.g. "Session" when the terminal is open).
 */

import { useEffect, useState } from "react";
import { navigationRef } from "@/navigation/navigationRef";

export function useCurrentRouteName(): string | undefined {
  const [name, setName] = useState<string | undefined>(undefined);

  useEffect(() => {
    const update = () => {
      if (navigationRef.isReady()) {
        setName(navigationRef.getCurrentRoute()?.name);
      }
    };
    update();
    const unsubscribe = navigationRef.addListener("state", update);
    return unsubscribe;
  }, []);

  return name;
}
