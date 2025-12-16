"use client";
import { useEffect, useRef, useState } from "react";
import NoteCard from "../components/NoteCard";
import NoteModal from "../components/NoteModal";
import ConfirmDialog from "../components/ConfirmDialog";
import SyncStatus from "../components/SyncStatus";
import Toast from "../components/Toast";
import useNotes, { Note } from "../hooks/useNotes";
import useSyncQueue from "../hooks/useSyncQueue";
import { motion, AnimatePresence } from "framer-motion";
type SyncAction = { actionId: string; type: string; payload?: any; timestamp?: number; };
import { generateId } from "../utils/id";

export default function Home() {
  // notes via hook
  const { notes, create, update, remove, togglePin, markSynced, markError } = useNotes();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; type?: "success" | "error" | "info" }>({ open: false, message: "" });
  const [filter, setFilter] = useState<"all" | "pinned" | "recent">("all");

  // sync queue hook (now includes failedQueue + retry helpers)
  const { enqueueAction, syncStatus, failedQueue, retryFailed, clearFailed } = useSyncQueue({
    onSynced: (action) => {
      const id = action.payload?.id;
      if (id) markSynced(id);
    },
    onError: (action) => {
      const id = action.payload?.id;
      if (id) markError(id);
    },
  });
  // show/hide failed panel
  const [showFailed, setShowFailed] = useState(false);

  // NEW: online/offline detection
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // NEW: prevent concurrent processing
  const processingRef = useRef(false);

  // Ref to always have latest notes value for handlePin
  const notesRef = useRef<Note[]>(notes);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  // 1. Add loading state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Add a small delay so skeletons are visible and animate
    const timeout = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timeout);
  }, [notes]);

  // 2. Skeleton loader component
  function NoteSkeleton() {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.3 }}
        className="animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800 p-4 h-48 flex flex-col gap-3"
      >
        <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3 mb-2" />
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full mb-1" />
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-5/6 mb-1" />
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2" />
        <div className="flex gap-2 mt-auto">
          <div className="h-6 w-16 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
          <div className="h-6 w-10 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
        </div>
      </motion.div>
    );
  }

  // 2️⃣ Add/Edit Note
  const handleSaveNote = (data: { title: string; content: string; tags: string[]; pinned?: boolean }) => {
    if (editNote) {
      update(editNote.id, { title: data.title, content: data.content, tags: data.tags, pinned: data.pinned });
      const updatedNote = notesRef.current.find((n) => n.id === editNote.id) || null;
      if (updatedNote) {
          enqueueAction({ actionId: generateId(), type: "UPDATE", payload: updatedNote, timestamp: Date.now() } as any);
        }
      setToast({ open: true, message: "Note updated.", type: "success" });
    } else {
      const newNote = create({ title: data.title, content: data.content, tags: data.tags, pinned: data.pinned });
        enqueueAction({ actionId: generateId(), type: "CREATE", payload: newNote, timestamp: Date.now() } as any);
        setToast({ open: true, message: "Note added.", type: "success" });
    }
    setModalOpen(false);
    setEditNote(null);
  };

  // 4️⃣ Edit Note
  const handleEdit = (note: Note) => {
    setEditNote(note);
    setModalOpen(true);
  };

  // 5️⃣ Delete Note
  const handleDelete = () => {
    if (!noteToDelete) return;
    remove(noteToDelete.id);
    enqueueAction({ actionId: generateId(), type: "DELETE", payload: noteToDelete, timestamp: Date.now() } as any);
    setNoteToDelete(null);
    setToast({ open: true, message: "Note deleted.", type: "success" });
  };

  // 6️⃣ Pin/Unpin Note (fixed: pending only when offline)
  const handlePin = (id: string) => {
    togglePin(id);
    const updatedNote = notesRef.current.find((n) => n.id === id) || null;
    if (updatedNote) {
      enqueueAction({ actionId: generateId(), type: "UPDATE", payload: updatedNote, timestamp: Date.now() } as any);
    }
  };

  // 7️⃣ Search & Filter
  let filteredNotes = notes.filter((n) => {
    const q = search.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  if (filter === "pinned") {
    filteredNotes = filteredNotes.filter((n) => n.pinned);
  }
  if (filter === "recent") {
    filteredNotes = [...filteredNotes].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  // TEMP UX fix: avoid immediate reorder to prevent pointer-shift illusion.
  // Use direct filteredNotes; you can implement animated/grouped reorder later.
  let sortedNotes = filteredNotes;
  if (filter === "all") {
    // Pinned notes first (maintain oldest-first within pinned), then non-pinned oldest-first
    const pinned = filteredNotes
      .filter((n) => n.pinned)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const rest = filteredNotes
      .filter((n) => !n.pinned)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    sortedNotes = [...pinned, ...rest];
  } else if (filter === "recent") {
    // keep existing recent behavior (updatedAt desc)
    sortedNotes = [...filteredNotes].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  // view-only modal state
  const [viewNote, setViewNote] = useState<Note | null>(null);

  return (
    <div
      className="flex min-h-screen flex-col font-sans"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      {/* Header */}
      <header
        className="w-full px-1 sm:px-6 py-2 sm:py-5 flex flex-wrap items-center justify-between backdrop-blur-sm"
        style={{
          background: "linear-gradient(90deg, rgba(255,244,230,0.95), rgba(255,250,240,0.95))",
          borderBottom: "1px solid rgba(34,20,6,0.12)",
          boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.45)",
        }}
      >
        <div className="flex items-center gap-1 sm:gap-4 ml-1 sm:ml-4 md:ml-8 min-w-0">
          <div
            className="flex items-center justify-center w-7 h-7 sm:w-11 sm:h-11 rounded-lg text-white font-semibold shadow-sm"
            style={{ background: "linear-gradient(135deg, #f59e0b, #ef7a1a)" }}
          >
            <span className="text-xs sm:text-base">P</span>
          </div>
          <div className="flex flex-col leading-tight min-w-0">
            <h1 className="text-xs sm:text-lg md:text-2xl font-semibold text-black dark:text-zinc-50 truncate">Polash · PocketNotes</h1>
            <p className="text-[9px] sm:text-xs md:text-sm text-zinc-500 dark:text-zinc-400 truncate">Offline‑first • Fast • Reliable</p>
          </div>
        </div>

        {/* Center stats: total notes, pinned count, online status */}
        <div className="hidden sm:flex items-center gap-3 min-w-0">
          <div className="px-3 py-1 rounded-full bg-white/70 dark:bg-zinc-800/60 border border-black/4 text-sm">
            {Array.isArray(notes) ? notes.length : 0} notes
          </div>
          <div className="px-3 py-1 rounded-full bg-white/70 dark:bg-zinc-800/60 border border-black/4 text-sm">
            {((notes ?? []) as Note[]).filter((n) => n.pinned).length} pinned
          </div>
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${isOnline ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}
          >
            <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-600" : "bg-yellow-400"}`} />
            {isOnline ? "Online" : "Offline"}
          </div>
          {/* failed syncs pill */}
          {failedQueue && failedQueue.length > 0 && (
            <button
              onClick={() => setShowFailed((s) => !s)}
              className="px-3 py-1 rounded-full bg-red-50 text-red-700 text-sm border border-red-100"
              aria-label="Show failed syncs"
              title="Failed syncs"
            >
              🔴 {failedQueue.length} failed
            </button>
          )}
        </div>

        {/* For xs screens, show stats in a compact row */}
        <div className="flex sm:hidden items-center gap-1 mt-1 min-w-0">
          <div
            className="px-2 py-0.5 rounded-full bg-white/70 dark:bg-zinc-800/60 border border-black/4 text-[10px] truncate"
            title={`${Array.isArray(notes) ? notes.length : 0} notes`}
          >
            {Array.isArray(notes) ? notes.length : 0} notes
          </div>
          <div
            className="px-2 py-0.5 rounded-full bg-white/70 dark:bg-zinc-800/60 border border-black/4 text-[10px] truncate"
            title={`${((notes ?? []) as Note[]).filter((n) => n.pinned).length} pinned`}
          >
            {((notes ?? []) as Note[]).filter((n) => n.pinned).length} pinned
          </div>
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${isOnline ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}
            title={isOnline ? "Online" : "Offline"}
          >
            <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-600" : "bg-yellow-400"}`} />
            {isOnline ? "Online" : "Offline"}
          </div>
          {failedQueue && failedQueue.length > 0 && (
            <button
              onClick={() => setShowFailed((s) => !s)}
              className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] border border-red-100"
              aria-label="Show failed syncs"
              title={`${failedQueue.length} failed`}
            >
              🔴 {failedQueue.length} failed
            </button>
          )}
        </div>

        {/* Sync status indicator */}
        <div className="flex items-center gap-2 sm:gap-4 mr-1 sm:mr-4 md:mr-8">
          <SyncStatus status={syncStatus} />
        </div>
      </header>

      {/* Failed Syncs Panel */}
      {showFailed && failedQueue && failedQueue.length > 0 && (
        <div className="w-full max-w-4xl mx-auto mt-3 px-4">
          <div className="card-surface p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Failed sync actions ({failedQueue.length})</div>
                <div className="flex gap-2">
                <button onClick={() => failedQueue.forEach((f) => retryFailed(f.actionId))} className="btn-pill">Retry all</button>
                <button onClick={() => clearFailed()} className="btn-pill">Clear all</button>
              </div>
            </div>
            <div className="grid gap-2">
              {failedQueue.map((f) => (
                <div key={f.actionId} className="flex items-center justify-between p-2 rounded-md bg-white/60">
                  <div className="text-sm truncate">{(f as any).type} — {(f as any).payload?.title ?? (f as any).payload?.id}</div>
                  <div className="flex gap-2">
                    <button onClick={() => retryFailed(f.actionId)} className="icon-chip" aria-label="Retry">↻</button>
                    <button onClick={() => clearFailed(f.actionId)} className="icon-chip" aria-label="Clear">✖</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full max-w-100 sm:max-w-4xl mx-auto px-0.5 sm:px-4 py-2 sm:py-8 flex flex-col">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-8">
          <div className="flex justify-center w-full sm:w-96 min-w-0">
            <div className="w-full max-w-full sm:max-w-2xl bg-white rounded-full shadow-md border border-gray-300 flex items-center focus-within:ring-2 focus-within:ring-blue-500 transition px-1 sm:px-2 min-w-0">
              <span className="pl-1 sm:pl-3 text-gray-500 text-base sm:text-lg">🔍</span>
              <input
                type="text"
                placeholder="Search title, description or tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-base rounded-full outline-none border-none bg-transparent text-gray-900 dark:text-zinc-50 min-w-0"
                style={{ minWidth: 0 }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="pr-1 sm:pr-3 text-gray-400 hover:text-red-500 text-lg sm:text-xl"
                  aria-label="Clear search"
                >
                  ✖
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-1 sm:gap-3 items-center">
            <button
              className={`h-8 sm:h-12 px-2 sm:px-5 rounded-2xl text-[10px] sm:text-sm font-semibold flex items-center justify-center ${filter === "all" ? "bg-indigo-600 text-white shadow-md" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"}`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button
              className={`h-8 sm:h-12 px-2 sm:px-5 rounded-2xl text-[10px] sm:text-sm font-semibold flex items-center justify-center ${filter === "pinned" ? "bg-indigo-600 text-white shadow-md" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"}`}
              onClick={() => setFilter("pinned")}
            >
              Pinned
            </button>
            <button
              className={`h-8 sm:h-12 px-2 sm:px-5 rounded-2xl text-[10px] sm:text-sm font-semibold flex items-center justify-center ${filter === "recent" ? "bg-indigo-600 text-white shadow-md" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"}`}
              onClick={() => setFilter("recent")}
            >
              Recent
            </button>
          </div>
        </div>

        {/* Notes List */}
        <section
          role="list"
          className="mt-2 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-6 justify-items-center"
        >
          {loading ? (
            // Remove AnimatePresence here, just render skeletons
            [...Array(6)].map((_, i) => (
              <motion.div key={i} className="w-full max-w-87.5">
                <NoteSkeleton />
              </motion.div>
            ))
          ) : sortedNotes.length === 0 ? (
            <div className="col-span-full text-center text-zinc-400 py-16">
              No notes yet. Click the <b>+</b> button to add your first note!
            </div>
          ) : (
            <AnimatePresence>
              {sortedNotes.map((note) => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  className="h-60 w-full max-w-87.5 mx-auto"
                >
                  <NoteCard
                    note={note}
                    onEdit={() => handleEdit(note)}
                    onPin={() => handlePin(note.id)}
                    onDelete={() => setNoteToDelete(note)}
                    onOpen={() => setViewNote(note)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </section>
      </main>

      {/* Add Note Floating Button */}
      <button
        className="fixed bottom-2 right-2 sm:bottom-8 sm:right-8 z-50 flex items-center justify-center w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-linear-to-br from-indigo-600 to-sky-500 text-white text-xl sm:text-3xl shadow-2xl hover:scale-105 transform transition"
        aria-label="Add Note"
        onClick={() => {
          setEditNote(null);
          setModalOpen(true);
        }}
      >
        +
      </button>

      {/* Add/Edit Note Modal */}
      <NoteModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditNote(null);
        }}
        onSave={handleSaveNote}
        initialData={
          editNote
            ? { title: editNote.title, content: editNote.content, tags: editNote.tags, pinned: editNote.pinned }
            : undefined
        }
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!noteToDelete}
        message="Are you sure you want to delete this note?"
        onConfirm={handleDelete}
        onCancel={() => setNoteToDelete(null)}
      />

      {/* Toast Notification */}
      <Toast
        open={toast.open}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, open: false })}
      />

      {/* Read-only Note View Modal */}
      {viewNote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="view-note-title"
          onClick={() => setViewNote(null)}
          onKeyDown={(e) => { if (e.key === "Escape") setViewNote(null); }}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-xl p-6 w-full max-w-md shadow-lg"
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
          >
            <h2 id="view-note-title" className="text-xl font-bold mb-2 text-gray-900 dark:text-zinc-50 truncate">
              {viewNote.title || "Untitled"}
            </h2>
            <div className="text-xs text-zinc-400 mb-4">{new Date(viewNote.createdAt).toLocaleString()}</div>

            <div className="mb-4">
              <textarea
                readOnly
                value={viewNote.content || ""}
                className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none min-h-32 resize-vertical"
              />
            </div>

            <div className="flex items-center gap-3 mb-4">
              {viewNote.tags?.map((t) => (
                <span key={t} className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full">{t}</span>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setViewNote(null)} className="px-4 py-2 rounded bg-zinc-200 dark:bg-zinc-700 text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
