// Placeholder art. The Art Director will replace these with her own drawings.

export function Inkshade({ size = 160, mood = 'hungry', className = '' }: { size?: number; mood?: 'hungry' | 'hurt' | 'happy'; className?: string }) {
  const eye = mood === 'hurt' ? 'M-6 0 L6 0' : null
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className={className} aria-label="Inkshade">
      <defs>
        <radialGradient id="ink" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#4b3a86" />
          <stop offset="60%" stopColor="#1b1430" />
          <stop offset="100%" stopColor="#0b0814" />
        </radialGradient>
      </defs>
      <path
        d="M100 20 C150 20 175 60 172 105 C170 140 185 160 170 175 C155 188 145 168 130 178 C115 190 105 172 92 182 C78 192 70 172 55 178 C38 184 30 165 36 145 C22 120 25 70 50 45 C65 30 80 20 100 20 Z"
        fill="url(#ink)" stroke="#6b5aa8" strokeWidth="2"
      />
      {/* letters it ate */}
      <text x="60" y="150" fontSize="16" fill="#e9c46a66" fontFamily="Cinzel">a</text>
      <text x="125" y="140" fontSize="14" fill="#e9c46a55" fontFamily="Cinzel">7</text>
      <text x="95" y="165" fontSize="12" fill="#e9c46a44" fontFamily="Cinzel">k</text>
      {[70, 130].map((x) => (
        <g key={x} transform={`translate(${x} 90)`}>
          {eye ? (
            <path d={eye} stroke="#f6dc8f" strokeWidth="5" strokeLinecap="round" />
          ) : (
            <>
              <ellipse rx="16" ry={mood === 'happy' ? 10 : 18} fill="#f6dc8f" />
              <circle cx="3" cy="3" r="8" fill="#120d1f" />
              <circle cx="6" cy="-1" r="3" fill="#fff" />
            </>
          )}
        </g>
      ))}
      <path
        d={mood === 'happy' ? 'M80 125 Q100 145 120 125' : mood === 'hurt' ? 'M82 135 Q100 122 118 135' : 'M78 125 Q100 150 122 125 Q100 135 78 125'}
        fill={mood === 'hungry' ? '#0b0814' : 'none'} stroke="#f6dc8f" strokeWidth="4" strokeLinecap="round"
      />
    </svg>
  )
}

export function CastleSilhouette({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 160" className={className} preserveAspectRatio="xMidYMax meet" aria-hidden>
      <g fill="#0b0814" stroke="#3a2c63" strokeWidth="1">
        <path d="M0 160 V120 L30 110 L60 120 V160 Z" />
        <path d="M50 160 V70 L65 40 L80 70 V160 Z" />
        <path d="M90 160 V95 H150 V160 Z" />
        <path d="M140 160 V50 L160 10 L180 50 V160 Z" />
        <path d="M175 160 V85 H250 V160 Z" />
        <path d="M240 160 V60 L255 30 L270 60 V160 Z" />
        <path d="M265 160 V100 H330 V160 Z" />
        <path d="M320 160 V75 L335 50 L350 75 V160 Z" />
        <path d="M345 160 V125 L400 115 V160 Z" />
      </g>
      <g fill="#e9c46a">
        {[[62, 85], [158, 70], [158, 100], [252, 80], [110, 115], [200, 110], [220, 110], [300, 120], [333, 95]].map(([x, y], i) => (
          <rect key={i} x={x} y={y} width="5" height="8" rx="2" opacity={0.85} />
        ))}
      </g>
    </svg>
  )
}

export function Wand({ colors, className = '' }: { colors: string[]; className?: string }) {
  return (
    <svg viewBox="0 0 120 20" className={className} aria-hidden>
      <defs>
        <linearGradient id={`w${colors[0]}`} x1="0" x2="1">
          <stop offset="0" stopColor={colors[1]} />
          <stop offset="1" stopColor={colors[0]} />
        </linearGradient>
      </defs>
      <path d="M4 12 L112 7 L114 10 L112 13 L4 15 Z" fill={`url(#w${colors[0]})`} stroke="#0006" />
      <rect x="4" y="10" width="26" height="7" rx="3" fill={colors[1]} />
      <circle cx="115" cy="10" r="3" fill="#fff6c9" opacity=".9" />
    </svg>
  )
}
