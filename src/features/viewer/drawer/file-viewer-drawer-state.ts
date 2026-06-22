import { publicConfig } from "@/config/public-env";

const drawerStateStoragePrefix = `${publicConfig.appStorageNamespace}.file-viewer-drawer.`;

export interface DrawerStateSnapshot {
  readonly anchorCollapsed: boolean;
  readonly full: boolean;
  readonly height: number;
}

const drawerStateSnapshots = new Map<string, DrawerStateSnapshot>();

/**
 * @param value - Unknown parsed storage value.
 * @returns A valid persisted drawer state snapshot, when the value matches the expected shape.
 */
function drawerStateSnapshot(value: unknown): DrawerStateSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const snapshot = value as Partial<DrawerStateSnapshot>;

  return typeof snapshot.anchorCollapsed === "boolean" &&
    typeof snapshot.full === "boolean" &&
    typeof snapshot.height === "number" &&
    Number.isFinite(snapshot.height)
    ? {
        anchorCollapsed: snapshot.anchorCollapsed,
        full: snapshot.full,
        height: snapshot.height,
      }
    : null;
}

/**
 * @param stateKey - Stable drawer state key.
 * @returns Session storage key for persisted drawer state.
 */
function drawerStateStorageKey(stateKey: string): string {
  return `${drawerStateStoragePrefix}${stateKey}`;
}

/**
 * @param stateKey - Stable drawer state key.
 * @returns The latest persisted drawer state, when available.
 */
export function readDrawerStateSnapshot(stateKey: string): DrawerStateSnapshot | undefined {
  const memorySnapshot = drawerStateSnapshots.get(stateKey);
  if (memorySnapshot) {
    return memorySnapshot;
  }

  try {
    const storedSnapshot = drawerStateSnapshot(
      JSON.parse(window.sessionStorage.getItem(drawerStateStorageKey(stateKey)) ?? "null"),
    );

    if (storedSnapshot) {
      drawerStateSnapshots.set(stateKey, storedSnapshot);
      return storedSnapshot;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

/**
 * @param stateKey - Stable drawer state key.
 * @param snapshot - Drawer state to persist.
 */
export function writeDrawerStateSnapshot(stateKey: string, snapshot: DrawerStateSnapshot): void {
  drawerStateSnapshots.set(stateKey, snapshot);

  try {
    window.sessionStorage.setItem(drawerStateStorageKey(stateKey), JSON.stringify(snapshot));
  } catch {
    // Drawer state is progressive enhancement; in-memory state still works for the current session.
  }
}
