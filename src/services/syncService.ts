import SyncAction from "../hooks/useSyncQueue";

export const syncService = {
  sync: async (actions: any[]) => {
    // Implement mock sync logic (e.g., with MSW or JSON Server)
    return true;
  },
};

export async function syncNote(
  action: any,
  retryCount = 0
): Promise<"synced" | "error"> {
  // Prevent server-side fetch
  if (typeof window === "undefined") {
    return "synced";
  }
  try {
    if (action.type === "CREATE") {
      await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action.payload),
      });
    } else if (action.type === "UPDATE") {
      await fetch(`/api/notes/${action.payload.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action.payload),
      });
    } else if (action.type === "DELETE") {
      await fetch(`/api/notes/${action.payload.id}`, {
        method: "DELETE",
      });
    }
    return "synced";
  } catch (e) {
    if (retryCount < 2) {
      // Retry up to 3 times
      return syncNote(action, retryCount + 1);
    }
    return "error";
  }
}
