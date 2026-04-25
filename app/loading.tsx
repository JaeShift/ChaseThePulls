export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-accent/5 blur-3xl animate-pulse" />
      </div>

      <div className="text-center relative z-10">
        {/* CTP Logo with layered animation */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-2xl bg-accent/10 blur-lg animate-pulse" />

          {/* Spinning outer border */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: "conic-gradient(from 0deg, #6366F1, #8B5CF6, #FF0080, #EC4899, #00D4FF, #10B981, #6366F1)",
              padding: "2px",
              animation: "spin 2s linear infinite",
            }}
          >
            <div className="w-full h-full rounded-[14px] bg-background" />
          </div>

          {/* Counter-rotating inner ring */}
          <div
            className="absolute inset-2 rounded-xl"
            style={{
              background: "conic-gradient(from 180deg, #00D4FF, #6366F1, #FF3B3B, #00D4FF)",
              padding: "1.5px",
              animation: "spin 3s linear infinite reverse",
            }}
          >
            <div className="w-full h-full rounded-[10px] bg-background" />
          </div>

          {/* Center content */}
          <div className="absolute inset-4 rounded-lg bg-accent/5 flex items-center justify-center">
            <span
              className="font-display font-black text-lg tracking-wider shimmer-text"
              style={{ lineHeight: 1 }}
            >
              CTP
            </span>
          </div>

          {/* Corner sparkles */}
          {[
            { top: "-4px", left: "-4px" },
            { top: "-4px", right: "-4px" },
            { bottom: "-4px", left: "-4px" },
            { bottom: "-4px", right: "-4px" },
          ].map((pos, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-accent"
              style={{
                ...pos,
                boxShadow: "0 0 6px #6366F1",
                animation: `energy-pulse ${1.5 + i * 0.3}s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>

        {/* Loading text */}
        <div className="space-y-2">
          <p className="text-foreground/60 text-xs tracking-[0.3em] uppercase animate-pulse font-display">
            Chase The Pulls
          </p>
          <div className="flex items-center justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1 h-1 rounded-full bg-accent"
                style={{
                  animation: "energy-pulse 1s ease-in-out infinite",
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
