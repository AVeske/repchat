import React from "react";

type Props = {
  top: React.ReactNode;
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
};

export default function AppLayout({ top, left, center, right }: Props) {
  return (
    <div className="flex h-screen flex-col overflow-hidden text-slate-100">
      <div className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur">
        {top}
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="w-72 border-r border-slate-800/80 bg-slate-950/55 p-3 backdrop-blur">
          <div className="h-full overflow-y-auto">{left}</div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-slate-950/20 p-4">
          {center}
        </main>

        <aside className="w-80 border-l border-slate-800/80 bg-slate-950/55 p-3 backdrop-blur">
          <div className="h-full overflow-y-auto">{right}</div>
        </aside>
      </div>
    </div>
  );
}
