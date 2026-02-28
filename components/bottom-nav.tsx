"use client";

import { Users, MapPin, Camera, Settings } from "lucide-react";

const tabs = [
  { icon: Users, label: "People", active: true },
  { icon: MapPin, label: "Places", active: false },
  { icon: Camera, label: "Photos", active: false },
  { icon: Settings, label: "Settings", active: false },
];

export default function BottomNav() {
  return (
    <nav className="flex items-center justify-around border-t border-[#e0e0e8] bg-white/90 px-2 pb-1 pt-2 backdrop-blur-sm">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.label}
            className="flex flex-col items-center gap-0.5 px-3 py-1"
          >
            <Icon
              size={20}
              className={
                tab.active
                  ? "text-[#1a1a2e]"
                  : "text-[#94a3b8]"
              }
              strokeWidth={tab.active ? 2.2 : 1.5}
            />
            <span
              className={`text-[10px] font-medium ${
                tab.active ? "text-[#1a1a2e]" : "text-[#94a3b8]"
              }`}
            >
              {tab.label}
            </span>
            {tab.active && (
              <span className="mt-0.5 h-1 w-1 rounded-full bg-[#1a1a2e]" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
