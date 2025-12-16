import type { SyncAction } from "../hooks/useSyncQueue";

export const syncService = {
  sync: async (actions: SyncAction[]) => {
    // Implement mock sync logic (e.g., with MSW or JSON Server)
    return true;
  },
};
