"use client";

import React, { useEffect } from "react";

type Props = {
  open: boolean;
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
};

export default function Toast({ open, message, type = "info", onClose }: Props) {
  useEffect(() => {
    if (open) {
      const t = setTimeout(onClose, 2500);
      return () => clearTimeout(t);
    }
  }, [open, onClose]);

  if (!open) return null;
  const color =
    type === "success"
      ? "bg-green-600"
      : type === "error"
      ? "bg-red-600"
      : "bg-zinc-700";
  return (
    <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2">
      <div className={`px-6 py-3 rounded-lg shadow-lg text-white font-medium ${color}`}>
        {message}
      </div>
    </div>
  );
}
