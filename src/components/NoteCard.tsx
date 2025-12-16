import React from "react";
import { Note } from "../hooks/useNotes";

type Props = {
  note: Note;
  onEdit?: () => void;
  onPin?: () => void;
  onDelete?: () => void;
  onOpen?: () => void;
};

export default function NoteCard({ note, onEdit, onPin, onDelete, onOpen }: Props) {
  // dot color based solely on note.syncStatus (one-line rule)
  const syncColor =
    note.syncStatus === "synced" ? "bg-green-600" : note.syncStatus === "pending" ? "bg-yellow-500" : "bg-red-600";
  const dotClass = `${syncColor} w-3 h-3 rounded-full ring-1 ring-white dark:ring-zinc-900 shadow-sm ${
    note.syncStatus === "pending" ? "animate-pulse" : ""
  }`;

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.toLocaleDateString()} · ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <article
      className="card-surface p-4 rounded-lg shadow-sm flex flex-col gap-3 cursor-pointer"
      onClick={() => onOpen?.()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen?.();
        }
      }}
    >
      {/* header: left = dot + small pinned placeholder; right = action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 flex items-center" onClick={(e) => e.stopPropagation()} tabIndex={-1} role="img" aria-label={`Sync status: ${note.syncStatus}`}>
            <div
              className={dotClass}
              title={`Sync: ${note.syncStatus}`}
            />
          </div>
          <div
            className="w-6 h-6 flex items-center justify-center text-sm cursor-default"
            title={note.pinned ? "Pinned" : ""}
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
            aria-hidden={!note.pinned}
          >
            {/* pinned placeholder; shows icon only when pinned */}
            {note.pinned ? <span className="text-yellow-600">📌</span> : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            aria-label="Edit note"
            title="Edit"
            className="w-9 h-9 flex items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition"
          >
            ✏️
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPin?.();
            }}
            aria-label={note.pinned ? "Unpin note" : "Pin note"}
            aria-pressed={note.pinned}
            title={note.pinned ? "Unpin" : "Pin"}
            className="w-9 h-9 flex items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition"
          >
            📍
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            aria-label="Delete note"
            title="Delete"
            className="w-9 h-9 flex items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-900 text-red-600 dark:text-red-400 transition"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* main content: title, description, created/updated */}
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-50 truncate">{note.title || "Untitled"}</h3>

        <p
          className="text-xs text-zinc-500 dark:text-zinc-400 mt-2"
          style={{
            maxHeight: "5.2rem",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
            whiteSpace: "normal",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
        >
          {(note.content || "").length > 140 ? (note.content || "").slice(0, 140).trimEnd() + "…" : note.content || ""}
        </p>

        <div className="mt-2 text-xs text-zinc-400">
          <div>Created: {formatDate(note.createdAt)}</div>
          {note.updatedAt && note.updatedAt !== note.createdAt && (
            <div>Updated: {formatDate(note.updatedAt)}</div>
          )}
        </div>
      </div>
    </article>
  );
}
