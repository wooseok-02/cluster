"use client";

import { STATUS_CONFIG } from "@/lib/mock-data";

export default function StatusLegend() {
  const statuses = Object.entries(STATUS_CONFIG) as [
    keyof typeof STATUS_CONFIG,
    (typeof STATUS_CONFIG)[keyof typeof STATUS_CONFIG]
  ][];

  return (
    <div className="flex items-center justify-center gap-4">
      {statuses.map(([key, config]) => (
        <div key={key} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: config.color }}
          />
          <span
            className="text-xs font-medium"
            style={{ color: config.color }}
          >
            {config.label}
          </span>
        </div>
      ))}
    </div>
  );
}
