export default function AuLogo({ size = 52, className = '' }) {
  return (
    <div
      className={`au-logo-badge ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 4px 10px rgba(217, 155, 38, 0.35))' }}
      >
        <defs>
          <linearGradient id="auGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffd875" />
            <stop offset="45%" stopColor="#d99b26" />
            <stop offset="100%" stopColor="#9a650d" />
          </linearGradient>
          <linearGradient id="auBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="60%" stopColor="#0f1f42" />
            <stop offset="100%" stopColor="#081024" />
          </linearGradient>
          <linearGradient id="auRimGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffe699" />
            <stop offset="100%" stopColor="#b37c15" />
          </linearGradient>
        </defs>

        {/* Outer Shield with subtle gold rim */}
        <path
          d="M50 6 L82 17 C82 52 69 77 50 94 C31 77 18 52 18 17 L50 6 Z"
          fill="url(#auBlueGrad)"
          stroke="url(#auRimGrad)"
          strokeWidth="3"
        />

        {/* Inner Shield border */}
        <path
          d="M50 13 L76 22 C76 50 64 71 50 86 C36 71 24 50 24 22 L50 13 Z"
          fill="none"
          stroke="url(#auGoldGrad)"
          strokeWidth="1.2"
          strokeDasharray="2 2"
          opacity="0.75"
        />

        {/* Academic Laurel branch left */}
        <path
          d="M32 36 C30 38 29 42 31 44 C33 46 36 44 36 41 C33 46 31 52 34 56 C37 57 40 54 39 51 C37 57 37 63 41 66 C43 65 44 61 42 59"
          fill="none"
          stroke="url(#auGoldGrad)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Academic Laurel branch right */}
        <path
          d="M68 36 C70 38 71 42 69 44 C67 46 64 44 64 41 C67 46 69 52 66 56 C63 57 60 54 61 51 C63 57 63 63 59 66 C57 65 56 61 58 59"
          fill="none"
          stroke="url(#auGoldGrad)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Torch / Flame at top */}
        <path
          d="M50 21 C52 26 56 29 53 34 C51 32 50 30 50 30 C50 30 49 32 47 34 C44 29 48 26 50 21 Z"
          fill="url(#auGoldGrad)"
        />

        {/* Open Book of Knowledge */}
        <path
          d="M42 38 L50 41 L58 38 C59 38 60 39 60 40 L60 44 C60 45 59 46 58 46 L50 48 L42 46 C41 46 40 45 40 44 L40 40 C40 39 41 38 42 38 Z"
          fill="url(#auGoldGrad)"
        />

        {/* "AU" Stately Monogram Typography */}
        <text
          x="50"
          y="68"
          textAnchor="middle"
          fill="url(#auGoldGrad)"
          fontFamily="'Cinzel', 'Playfair Display', 'Times New Roman', serif"
          fontWeight="900"
          fontSize="23"
          letterSpacing="1.5"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}
        >
          AU
        </text>

        {/* Foundation Star */}
        <polygon
          points="50,73 51.5,76 55,76 52,78 53.2,81.5 50,79.5 46.8,81.5 48,78 45,76 48.5,76"
          fill="url(#auGoldGrad)"
          opacity="0.9"
        />
      </svg>
    </div>
  )
}
