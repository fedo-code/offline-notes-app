import React from "react";

export default function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-zinc-200 dark:bg-zinc-800 rounded-lg h-32 w-full" />
      ))}
    </div>
  );
}
