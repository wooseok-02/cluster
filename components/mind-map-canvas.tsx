"use client";

import { useEffect, useRef, useState } from "react";
import { type PersonNode, STATUS_CONFIG } from "@/lib/mock-data";

interface MindMapCanvasProps {
  people: PersonNode[];
}

interface NodePosition {
  x: number;
  y: number;
  size: number;
  person: PersonNode;
}

function getNodeSize(count: number, status: string): number {
  const base = status === "best" ? 38 : status === "new" ? 30 : status === "old" ? 24 : 28;
  const extra = Math.min(count * 0.4, 14);
  return base + extra;
}

function calculatePositions(
  people: PersonNode[],
  centerX: number,
  centerY: number
): NodePosition[] {
  const positions: NodePosition[] = [];
  const count = people.length;

  const sorted = [...people].sort((a, b) => {
    const order = { best: 0, new: 1, normal: 2, old: 3 };
    return order[a.status] - order[b.status];
  });

  sorted.forEach((person, i) => {
    const size = getNodeSize(person.count, person.status);
    const ringIndex = i < 4 ? 0 : 1;
    const ringRadius = ringIndex === 0 ? 95 : 155;
    const itemsInRing = ringIndex === 0 ? Math.min(4, count) : count - 4;
    const indexInRing = ringIndex === 0 ? i : i - 4;

    const angleOffset = ringIndex === 0 ? -Math.PI / 4 : 0;
    const angle = angleOffset + (indexInRing / itemsInRing) * 2 * Math.PI;

    const jitterX = (Math.sin(person.id * 7.3) * 8);
    const jitterY = (Math.cos(person.id * 5.1) * 8);

    positions.push({
      x: centerX + Math.cos(angle) * ringRadius + jitterX,
      y: centerY + Math.sin(angle) * ringRadius + jitterY,
      size,
      person,
    });
  });

  return positions;
}

export default function MindMapCanvas({ people }: MindMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const positionsRef = useRef<NodePosition[]>([]);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const centerX = W / 2;
    const centerY = H / 2;

    positionsRef.current = calculatePositions(people, centerX, centerY);

    function draw(time: number) {
      timeRef.current = time;
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      const positions = positionsRef.current;

      // Draw connection lines
      positions.forEach((pos) => {
        const config = STATUS_CONFIG[pos.person.status];
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);

        const midX = (centerX + pos.x) / 2 + Math.sin(time * 0.001 + pos.person.id) * 5;
        const midY = (centerY + pos.y) / 2 + Math.cos(time * 0.001 + pos.person.id) * 5;

        ctx.quadraticCurveTo(midX, midY, pos.x, pos.y);
        ctx.strokeStyle = config.borderColor;
        ctx.lineWidth = pos.person.status === "best" ? 2 : 1;
        ctx.setLineDash(pos.person.status === "old" ? [4, 4] : []);
        ctx.stroke();
        ctx.setLineDash([]);

        // Animated dots on lines
        const dotT = ((time * 0.0008 + pos.person.id * 0.5) % 1);
        const dotX = centerX + (pos.x - centerX) * dotT;
        const dotY = centerY + (pos.y - centerY) * dotT;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = config.color;
        ctx.globalAlpha = 0.6;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Draw center node (ME)
      const centerPulse = Math.sin(time * 0.002) * 3;
      const meRadius = 32;

      // Glow
      const gradient = ctx.createRadialGradient(
        centerX, centerY, meRadius,
        centerX, centerY, meRadius + 18 + centerPulse
      );
      gradient.addColorStop(0, "rgba(26, 26, 46, 0.3)");
      gradient.addColorStop(1, "rgba(26, 26, 46, 0)");
      ctx.beginPath();
      ctx.arc(centerX, centerY, meRadius + 18 + centerPulse, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, meRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#1a1a2e";
      ctx.fill();
      ctx.strokeStyle = "#3b3b5c";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("ME", centerX, centerY);

      // Draw people nodes
      positions.forEach((pos) => {
        const config = STATUS_CONFIG[pos.person.status];
        const floatOffset = Math.sin(time * 0.0015 + pos.person.id * 2) * 4;
        const drawY = pos.y + floatOffset;
        const isHovered = hoveredId === pos.person.id;
        const drawSize = isHovered ? pos.size + 4 : pos.size;

        // Glow
        if (pos.person.status === "best" || pos.person.status === "new") {
          const glow = ctx.createRadialGradient(
            pos.x, drawY, drawSize * 0.5,
            pos.x, drawY, drawSize + 10
          );
          glow.addColorStop(0, config.glowColor);
          glow.addColorStop(1, "rgba(0,0,0,0)");
          ctx.beginPath();
          ctx.arc(pos.x, drawY, drawSize + 10, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(pos.x, drawY, drawSize, 0, Math.PI * 2);
        ctx.fillStyle = config.bgColor;
        ctx.fill();
        ctx.strokeStyle = config.borderColor;
        ctx.lineWidth = isHovered ? 2.5 : 1.5;
        ctx.stroke();

        // Name
        ctx.fillStyle = config.color;
        ctx.font = `${pos.person.status === "best" ? "bold " : ""}${drawSize > 32 ? 13 : 11}px Inter, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(pos.person.name, pos.x, drawY - 4);

        // Count
        ctx.fillStyle = config.color;
        ctx.globalAlpha = 0.7;
        ctx.font = `9px Inter, system-ui, sans-serif`;
        ctx.fillText(`${pos.person.count}x`, pos.x, drawY + 9);
        ctx.globalAlpha = 1;

        // Status badge
        const badgeY = drawY - drawSize - 6;
        ctx.font = "bold 7px Inter, system-ui, sans-serif";
        const badgeW = ctx.measureText(config.label).width + 8;
        const badgeH = 14;

        ctx.beginPath();
        ctx.roundRect(pos.x - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 4);
        ctx.fillStyle = config.color;
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(config.label, pos.x, badgeY);
      });

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(animRef.current);
  }, [people, hoveredId]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const found = positionsRef.current.find((pos) => {
      const floatOffset = Math.sin(timeRef.current * 0.0015 + pos.person.id * 2) * 4;
      const dist = Math.sqrt((x - pos.x) ** 2 + (y - (pos.y + floatOffset)) ** 2);
      return dist < pos.size;
    });

    setHoveredId(found?.person.id ?? null);
  };

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredId(null)}
      style={{ cursor: hoveredId ? "pointer" : "default" }}
    />
  );
}
