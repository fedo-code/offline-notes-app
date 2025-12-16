import React from "react";

type Props = {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({ open, message, onConfirm, onCancel }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 w-full max-w-xs shadow-lg" onClick={e => e.stopPropagation()}>
        <div className="mb-4 text-base text-zinc-800 dark:text-zinc-100">{message}</div>
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 rounded bg-zinc-200 dark:bg-zinc-700 text-sm" onClick={onCancel}>
            Cancel
          </button>
          <button className="px-4 py-2 rounded text-sm text-white bg-red-600 hover:bg-red-700" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
