import React from "react";

type Props = {
  status: "synced" | "pending" | "error";
};

export default function SyncStatus({ status }: Props) {
  let color = "text-green-600";
  let icon = "🟢";
  let label = "Synced";
  if (status === "pending") {
    color = "text-yellow-500";
    icon = "🟡";
    label = "Syncing…";
  }
  if (status === "error") {
    color = "text-red-600";
    icon = "🔴";
    label = "Sync Error";
  }
  return (
    <span
      className={`flex items-center gap-1 font-medium ${color}`}
      title={label}
      aria-live="polite"
    >
      <span aria-hidden="true">{icon}</span>
      <span className="text-xs">{label}</span>
    </span>
  );
}
