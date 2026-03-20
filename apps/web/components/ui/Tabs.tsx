"use client";

import { ReactNode } from "react";

export type TabItem<T extends string> = {
  key: T;
  label: string;
  count?: number;
};

export function Tabs<T extends string>({
  items,
  active,
  onChange,
}: {
  items: TabItem<T>[];
  active: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition ${
            active === item.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
          type="button"
        >
          <span>{item.label}</span>
          {typeof item.count === "number" ? <span className="text-xs text-slate-500">{item.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
