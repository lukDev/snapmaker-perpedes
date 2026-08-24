import type { ReactNode } from "react";
import KeyPanel from "./components/KeyPanel.tsx";

export default function App(): ReactNode {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="fixed top-0 left-0 right-0 z-10 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-6 shadow-sm">
        <img src="/icon_detail.svg" alt="" className="h-14 w-14" />
        <span className="text-lg font-semibold tracking-wide text-slate-700">
          Snapmaker Per Pedes
        </span>
      </header>
      <div className="flex min-h-screen items-center justify-center pt-16">
        <KeyPanel />
      </div>
    </div>
  );
}
