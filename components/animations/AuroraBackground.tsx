"use client"

export function AuroraBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Base dark background */}
      <div className="absolute inset-0 bg-[#080C14]" />

      {/* Gold aurora - top left */}
      <div
        className="absolute top-[-10%] left-[10%] w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(255,215,0,0.12) 0%, rgba(255,140,0,0.04) 50%, transparent 70%)",
          filter: "blur(60px)",
          animation: "float 14s ease-in-out infinite",
        }}
      />

      {/* Cyan aurora - top right */}
      <div
        className="absolute top-[5%] right-[-5%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(0,212,255,0.09) 0%, rgba(0,100,200,0.03) 50%, transparent 70%)",
          filter: "blur(70px)",
          animation: "float 18s ease-in-out infinite reverse",
        }}
      />

      {/* Purple aurora - bottom left */}
      <div
        className="absolute bottom-[-5%] left-[-5%] w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, rgba(80,40,200,0.03) 50%, transparent 70%)",
          filter: "blur(90px)",
          animation: "float 12s ease-in-out infinite 1s",
        }}
      />

      {/* Red-purple center blob - drifting */}
      <div
        className="absolute top-[40%] left-[40%] w-[900px] h-[900px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(255,59,59,0.04) 0%, rgba(139,92,246,0.04) 50%, transparent 70%)",
          filter: "blur(100px)",
          animation: "aurora 22s ease infinite",
          backgroundSize: "200% 200%",
        }}
      />

      {/* Pink accent blob */}
      <div
        className="absolute top-[60%] right-[10%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%)",
          filter: "blur(60px)",
          animation: "float 16s ease-in-out infinite 3s",
        }}
      />

      {/* Subtle dot grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(255,215,0,0.8) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Vignette edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 35%, rgba(8, 12, 20, 0.7) 100%)",
        }}
      />

      {/* Top edge fade */}
      <div
        className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, rgba(8,12,20,0.6) 0%, transparent 100%)",
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  )
}
