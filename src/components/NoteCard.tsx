import React from "react";
import { motion } from "framer-motion";
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
    <motion.article
      className="card-surface p-4 rounded-lg shadow-sm flex flex-col gap-3"
      whileHover={{
        scale: 1.03,
        boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
        transition: { type: "spring", stiffness: 300, damping: 20 },
      }}
    >
      {/* header: left = dot + small pinned placeholder; right = action buttons */}
      <div
        className="flex items-center justify-between rounded-md px-2 py-1 mb-2"
        style={{
          background: "linear-gradient(90deg, rgba(255,244,230,0.95), rgba(255,250,240,0.95))",
          borderBottom: "1px solid rgba(34,20,6,0.12)",
          boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.45)",
        }}
      >
        {/* Left: Pinned indicator and title */}
        <div className="flex items-center gap-2">
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

        {/* Right: Action buttons as text */}
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="text-xs px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
            aria-label="Edit"
          >
            Edit
          </button>
          <button
            onClick={onPin}
            className="text-xs px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
            aria-label={note.pinned ? "Unpin" : "Pin"}
          >
            {note.pinned ? "Unpin" : "Pin"}
          </button>
          <button
            onClick={onDelete}
            className="text-xs px-2 py-1 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-600 transition"
            aria-label="Delete"
          >
            Delete
          </button>
        </div>
      </div>

      {/* main content: title, description, created/updated */}
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-50 truncate">{note.title || "Untitled"}</h3>

        <div
          className="text-sm text-zinc-600 dark:text-zinc-300 mt-2 line-clamp-3 min-h-[3.6em] flex-1 cursor-pointer"
          onClick={onOpen}
          tabIndex={0}
          role="button"
          aria-label={`View note: ${note.title}`}
          onKeyPress={e => { if (e.key === 'Enter') onOpen?.(); }}
          style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {note.content}
        </div>

        <div className="mt-2 text-xs text-zinc-400">
          <div>Created: {formatDate(note.createdAt)}</div>
          <div className="text-xs text-zinc-400 mt-1 min-h-[1.25em]">
            {note.updatedAt !== note.createdAt
              ? <>Updated: {formatDate(note.updatedAt)}</>
              : <span>&nbsp;</span> /* empty placeholder to reserve space */
            }
          </div>
        </div>
      </div>
    </motion.article>
  );
}
