"use client";

import React, { useEffect, useState } from "react";

type NoteModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (data: { title: string; content: string; tags: string[]; pinned?: boolean }) => void;
  initialData?: { title: string; content: string; tags: string[]; pinned?: boolean };
};

export default function NoteModal({ open, onClose, onSave, initialData }: NoteModalProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [tags, setTags] = useState(initialData?.tags?.join(", ") || "");
  const [pinned, setPinned] = useState(initialData?.pinned || false);

  useEffect(() => {
    if (open) {
      setTitle(initialData?.title || "");
      setContent(initialData?.content || "");
      setTags(initialData?.tags?.join(", ") || "");
      setPinned(initialData?.pinned || false);
    }
  }, [open, initialData]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 w-full max-w-md shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">{initialData ? "Edit Note" : "Add Note"}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            onSave({
              title: title.trim(),
              content: content.trim(),
              tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
              pinned,
            });
          }}
        >
          <label className="block mb-3">
            <span className="text-sm text-zinc-700 dark:text-zinc-200">Title</span>
            <input
              placeholder="Title"
              className="mt-1 w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none"
              aria-required="true"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label className="block mb-3">
            <span className="text-sm text-zinc-700 dark:text-zinc-200">Description</span>
            <textarea
              placeholder="Write your note..."
              className="mt-1 w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none min-h-25 resize-vertical"
              aria-required="true"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </label>
          <label className="block mb-4">
            <span className="text-sm text-zinc-700 dark:text-zinc-200">Tags (comma separated)</span>
            <input
              placeholder="tag1, tag2"
              className="mt-1 w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-black dark:text-zinc-50 focus:outline-none"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-3 mb-4">
            <input
              className="w-4 h-4"
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-200">Keep this note (pin)</span>
          </label>
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" className="px-4 py-2 rounded bg-zinc-200 dark:bg-zinc-700 text-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded text-sm text-white bg-blue-600 hover:bg-blue-700">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
