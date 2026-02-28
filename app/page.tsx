"use client";

import MindMapCanvas from "@/components/mind-map-canvas";
import StatusLegend from "@/components/status-legend";
import BottomNav from "@/components/bottom-nav";
import PeopleHeader from "@/components/people-header";
import { MOCK_PEOPLE } from "@/lib/mock-data";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5] p-6">
      {/* Figma-style page title */}
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[#8888a0]">
            CLUSTER
          </h2>
          <p className="mt-1 text-xs text-[#b0b0c0]">
            People Tab - Relationship Mind Map
          </p>
        </div>

        {/* Phone Frame */}
        <div className="relative">
          {/* Phone outer shell */}
          <div className="relative h-[812px] w-[375px] overflow-hidden rounded-[44px] border-[8px] border-[#1a1a2e] bg-white shadow-2xl">
            {/* Status bar */}
            <div className="flex items-center justify-between bg-white px-6 pb-1 pt-3">
              <span className="text-xs font-semibold text-[#1a1a2e]">
                9:41
              </span>
              <div className="flex items-center gap-1">
                <div className="flex gap-0.5">
                  <div className="h-2.5 w-[3px] rounded-sm bg-[#1a1a2e]" />
                  <div className="h-2 w-[3px] rounded-sm bg-[#1a1a2e]" />
                  <div className="h-1.5 w-[3px] rounded-sm bg-[#94a3b8]" />
                  <div className="h-1 w-[3px] rounded-sm bg-[#94a3b8]" />
                </div>
                <span className="ml-1 text-xs font-semibold text-[#1a1a2e]">
                  5G
                </span>
                {/* Battery */}
                <div className="ml-1 flex items-center">
                  <div className="relative h-3 w-6 rounded-[3px] border border-[#1a1a2e]">
                    <div className="absolute inset-[1.5px] right-[3px] rounded-[1.5px] bg-[#1a1a2e]" />
                  </div>
                  <div className="h-1.5 w-[1.5px] rounded-r-sm bg-[#1a1a2e]" />
                </div>
              </div>
            </div>

            {/* Dynamic Island */}
            <div className="mx-auto h-[28px] w-[120px] rounded-full bg-[#1a1a2e]" />

            {/* Content Area */}
            <div className="flex h-[calc(100%-110px)] flex-col">
              <PeopleHeader />

              {/* Mind Map Area */}
              <div className="relative flex-1 bg-gradient-to-b from-white to-[#f8f8fc]">
                {/* Decorative circles */}
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#e0e0e8]" />
                  <div className="absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#e8e8f0]" />
                </div>

                <MindMapCanvas people={MOCK_PEOPLE} />
              </div>

              {/* Legend */}
              <div className="border-t border-[#e8e8f0] bg-white/80 px-4 py-2.5 backdrop-blur-sm">
                <StatusLegend />
              </div>

              <BottomNav />
            </div>
          </div>

          {/* Notch reflection */}
          <div className="absolute left-1/2 top-[10px] h-[6px] w-[60px] -translate-x-1/2 rounded-full bg-white/10" />
        </div>

        {/* Design annotations */}
        <div className="grid max-w-[375px] grid-cols-2 gap-3 pt-2">
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-[#22c55e]" />
              <span className="text-xs font-semibold text-[#1a1a2e]">NEW</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#8888a0]">
              Recently added contacts. Small-medium size with green highlight.
            </p>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-[#f59e0b]" />
              <span className="text-xs font-semibold text-[#1a1a2e]">BEST</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#8888a0]">
              Most frequently met. Largest nodes with amber glow effect.
            </p>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-[#6366f1]" />
              <span className="text-xs font-semibold text-[#1a1a2e]">NORMAL</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#8888a0]">
              Regular contacts. Medium size with indigo accent.
            </p>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-[#94a3b8]" />
              <span className="text-xs font-semibold text-[#1a1a2e]">OLD</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#8888a0]">
              Not seen recently. Smaller nodes with dashed connection lines.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
