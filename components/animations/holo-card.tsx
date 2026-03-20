"use client";

import { useRef, MouseEvent } from "react";
import { cn } from "@/lib/utils";

interface HoloCardProps {
  children: React.ReactNode;
  className?: string;
}

export function HoloCard({ children, className }: HoloCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

    // Holographic shimmer position
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    card.style.setProperty("--holo-x", `${xPercent}%`);
    card.style.setProperty("--holo-y", `${yPercent}%`);
    card.style.setProperty("--holo-opacity", "0.15");
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    card.style.setProperty("--holo-opacity", "0");
  };

  return (
    <div
      ref={cardRef}
      className={cn("relative transition-transform duration-200 ease-out", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={
        {
          "--holo-x": "50%",
          "--holo-y": "50%",
          "--holo-opacity": "0",
        } as React.CSSProperties
      }
    >
      {children}
      {/* Holographic overlay */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none z-10"
        style={{
          background: `radial-gradient(circle at var(--holo-x) var(--holo-y), rgba(255,215,0,0.2) 0%, rgba(0,212,255,0.1) 30%, rgba(139,92,246,0.08) 60%, transparent 70%)`,
          opacity: "var(--holo-opacity)" as unknown as number,
          transition: "opacity 0.3s ease",
          mixBlendMode: "overlay",
        }}
      />
    </div>
  );
}


