"use client"

export function AuroraBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-background" />

      <div
        className="absolute top-[-8%] left-[8%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(79,70,229,0.14) 0%, rgba(79,70,229,0.05) 50%, transparent 70%)",
          filter: "blur(56px)",
          animation: "float 16s ease-in-out infinite",
        }}
      />

      <div
        className="absolute top-[0%] right-[-3%] w-[520px] h-[520px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(8,145,178,0.12) 0%, rgba(8,145,178,0.04) 50%, transparent 70%)",
          filter: "blur(64px)",
          animation: "float 20s ease-in-out infinite reverse",
        }}
      />

      <div
        className="absolute bottom-[-2%] left-[-2%] w-[640px] h-[640px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, rgba(124,58,237,0.03) 50%, transparent 70%)",
          filter: "blur(72px)",
          animation: "float 14s ease-in-out infinite 1s",
        }}
      />

      <div
        className="absolute top-[40%] left-1/2 w-[700px] h-[700px] -translate-x-1/2 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(129,140,248,0.1) 0%, rgba(236,72,153,0.04) 45%, transparent 70%)",
          filter: "blur(88px)",
          animation: "aurora 24s ease infinite",
          backgroundSize: "200% 200%",
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.14] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(99, 102, 241, 0.35) 1px, transparent 1px)`,
          backgroundSize: "36px 36px",
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.5) 0%, transparent 55%)",
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  )
}
