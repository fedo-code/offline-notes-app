"use client";
import { useCallback } from "react";
import useLocalStorage from "./useLocalStorage";
import { generateId } from "../utils/id";

export type SyncState = "synced" | "pending" | "error";

export type Note = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  updatedAt: string;
  createdAt: string;
  syncStatus: SyncState;
};

type CreatePayload = { title: string; content: string; tags?: string[]; pinned?: boolean };
type UpdatePayload = Partial<Omit<Note, "id" | "createdAt">>;

export default function useNotes() {
  const [notes, setNotes] = useLocalStorage<Note[]>("notes:v1", []);

  const now = () => new Date().toISOString();

  const create = useCallback(
    (payload: CreatePayload) => {
      const online = typeof navigator !== "undefined" ? navigator.onLine : true;
      const status: SyncState = online ? "synced" : "pending";
      const n: Note = {
        id: generateId(),
        title: payload.title || "",
        content: payload.content || "",
        tags: payload.tags || [],
        pinned: !!payload.pinned,
        createdAt: now(),
        updatedAt: now(),
        syncStatus: status,
      };
      setNotes((prev) => [...(prev ?? []), n]);
      return n;
    },
    [setNotes]
  );

  const update = useCallback(
    (id: string, payload: UpdatePayload) => {
      const online = typeof navigator !== "undefined" ? navigator.onLine : true;
      const status: SyncState = online ? "synced" : "pending";
      let updated: Note | null = null;
      setNotes((prev) =>
        (prev ?? []).map((n) => {
          if (n.id !== id) return n;
          const merged: Note = {
            ...n,
            ...payload,
            tags: payload.tags ?? n.tags,
            updatedAt: now(),
            syncStatus: status,
          };
          updated = merged;
          return merged;
        })
      );
      return updated;
    },
    [setNotes]
  );

  const remove = useCallback(
    (id: string) => {
      setNotes((prev) => (prev ?? []).filter((n) => n.id !== id));
    },
    [setNotes]
  );

  const togglePin = useCallback(
    (id: string) => {
      const online = typeof navigator !== "undefined" ? navigator.onLine : true;
      const status: SyncState = online ? "synced" : "pending";
      let updated: Note | null = null;
      setNotes((prev) =>
        (prev ?? []).map((n) => {
          if (n.id !== id) return n;
          const t = { ...n, pinned: !n.pinned, updatedAt: now(), syncStatus: status };
          updated = t;
          return t;
        })
      );
      return updated;
    },
    [setNotes]
  );

  const markSynced = useCallback(
    (id: string) => {
      setNotes((prev) => (prev ?? []).map((n) => (n.id === id ? { ...n, syncStatus: "synced" as SyncState } : n)));
    },
    [setNotes]
  );

  const markError = useCallback(
    (id: string) => {
      setNotes((prev) => (prev ?? []).map((n) => (n.id === id ? { ...n, syncStatus: "error" as SyncState } : n)));
    },
    [setNotes]
  );

  return {
    notes: notes ?? [],
    setNotes,
    create,
    update,
    remove,
    togglePin,
    markSynced,
    markError,
  } as const;
}
