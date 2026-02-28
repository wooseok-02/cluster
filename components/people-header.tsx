"use client";

import { Plus, Search } from "lucide-react";

export default function PeopleHeader() {
  return (
    <header className="flex items-center justify-between px-5 pb-2 pt-4">
      <div>
        <h1 className="text-lg font-bold tracking-tight text-[#1a1a2e]">
          People
        </h1>
        <p className="text-xs text-[#8888a0]">Relationship Map</p>
      </div>
      <div className="flex items-center gap-2">
        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0f0f5] transition-colors hover:bg-[#e0e0e8]">
          <Search size={16} className="text-[#4a4a6a]" />
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a1a2e] transition-colors hover:bg-[#2a2a4e]">
          <Plus size={16} className="text-white" />
        </button>
      </div>
    </header>
  );
}
