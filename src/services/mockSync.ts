import { Note } from "../hooks/useNotes";

export type SyncAction = {
	actionId: string;
	type: "CREATE" | "UPDATE" | "DELETE";
	payload: Note;
	timestamp: number;
};

export async function syncAction<A extends SyncAction>(action: A): Promise<void> {
	// simulate latency
	await new Promise((r) => setTimeout(r, 400));
	// fail when offline
	if (typeof navigator !== "undefined" && !navigator.onLine) {
		throw new Error("Offline");
	}
	// simulate occasional transient failure (small chance)
	if (Math.random() < 0.06) throw new Error("Transient sync error");
	// otherwise succeed (mock)
	return;
}
