'use client';

/**
 * Cute Pug Helper Animation
 * Shows during loading/thinking states (file parsing, skill running).
 * Pure SVG + CSS animations — no external dependencies.
 */

interface PugLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PugLoader({ message, size = 'md' }: PugLoaderProps) {
  const dimensions = {
    sm: { w: 80, h: 80 },
    md: { w: 120, h: 120 },
    lg: { w: 160, h: 160 },
  }[size];

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-6">
      <div className="pug-container" style={{ width: dimensions.w, height: dimensions.h }}>
        {/* Thinking bubbles */}
        <div className="pug-think-bubbles">
          <span className="pug-bubble pug-bubble-1" />
          <span className="pug-bubble pug-bubble-2" />
          <span className="pug-bubble pug-bubble-3" />
        </div>

        {/* Pug SVG */}
        <svg
          viewBox="0 0 120 120"
          className="pug-svg"
          style={{ width: '100%', height: '100%' }}
        >
          {/* Shadow */}
          <ellipse cx="60" cy="108" rx="32" ry="5" fill="currentColor" opacity="0.08" className="pug-shadow" />

          {/* Tail */}
          <path
            d="M88 78 Q98 68 96 58 Q95 52 90 55 Q92 62 87 68"
            fill="#c89968"
            stroke="#a67c4a"
            strokeWidth="1.5"
            strokeLinejoin="round"
            className="pug-tail"
          />

          {/* Body */}
          <ellipse cx="60" cy="78" rx="30" ry="24" fill="#d4a574" stroke="#a67c4a" strokeWidth="1.5" className="pug-body" />

          {/* Belly */}
          <ellipse cx="60" cy="84" rx="22" ry="16" fill="#f0d9b5" opacity="0.7" />

          {/* Front legs */}
          <rect x="44" y="88" width="8" height="18" rx="4" fill="#c89968" stroke="#a67c4a" strokeWidth="1" />
          <rect x="68" y="88" width="8" height="18" rx="4" fill="#c89968" stroke="#a67c4a" strokeWidth="1" />
          {/* Paws */}
          <ellipse cx="48" cy="106" rx="6" ry="3" fill="#a67c4a" />
          <ellipse cx="72" cy="106" rx="6" ry="3" fill="#a67c4a" />

          {/* Head */}
          <circle cx="60" cy="48" r="28" fill="#d4a574" stroke="#a67c4a" strokeWidth="1.5" className="pug-head" />

          {/* Ears */}
          <path d="M36 35 Q30 20 38 18 Q46 22 44 36 Z" fill="#5a3a1a" stroke="#3a2510" strokeWidth="1" className="pug-ear-left" />
          <path d="M84 35 Q90 20 82 18 Q74 22 76 36 Z" fill="#5a3a1a" stroke="#3a2510" strokeWidth="1" className="pug-ear-right" />

          {/* Face mask (wrinkles) */}
          <path d="M42 42 Q60 36 78 42 Q76 54 60 56 Q44 54 42 42 Z" fill="#c89968" opacity="0.5" />

          {/* Eyes */}
          <ellipse cx="48" cy="44" rx="5" ry="5.5" fill="#1a1a1a" className="pug-eye-left" />
          <ellipse cx="72" cy="44" rx="5" ry="5.5" fill="#1a1a1a" className="pug-eye-right" />
          {/* Eye highlights */}
          <circle cx="50" cy="42" r="1.5" fill="#ffffff" />
          <circle cx="74" cy="42" r="1.5" fill="#ffffff" />

          {/* Nose */}
          <path d="M55 52 Q60 49 65 52 Q63 56 60 57 Q57 56 55 52 Z" fill="#1a1a1a" />

          {/* Mouth */}
          <path d="M60 57 Q58 62 54 62 M60 57 Q62 62 66 62" fill="none" stroke="#3a2510" strokeWidth="1.5" strokeLinecap="round" />

          {/* Tongue (peeking out) */}
          <path d="M58 62 Q60 66 62 62" fill="#ff6b9d" opacity="0.8" className="pug-tongue" />

          {/* Blush */}
          <circle cx="40" cy="52" r="4" fill="#ff8fa3" opacity="0.3" />
          <circle cx="80" cy="52" r="4" fill="#ff8fa3" opacity="0.3" />
        </svg>
      </div>

      {message && (
        <div className="text-sm text-muted-foreground animate-pulse font-medium">
          {message}
        </div>
      )}
    </div>
  );
}
