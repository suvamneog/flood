/** Decorative SVG illustration — Assam flood landscape */
export default function FloodIllustration({ className = '' }) {
  return (
    <svg
      viewBox="0 0 560 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#DBEAFE" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#86EFAC" />
          <stop offset="100%" stopColor="#22C55E" stopOpacity="0.7" />
        </linearGradient>
      </defs>

      <rect width="560" height="420" rx="32" fill="url(#sky)" />

      {/* Distant hills */}
      <path
        d="M0 220 C80 180 140 200 200 170 C260 140 300 160 360 150 C420 140 480 160 560 130 V280 H0 Z"
        fill="url(#hill)"
        opacity="0.55"
      />
      <path
        d="M0 250 C100 210 160 230 240 210 C320 190 380 220 460 200 C500 190 530 200 560 185 V300 H0 Z"
        fill="#16A34A"
        opacity="0.35"
      />

      {/* Houses on stilts / bank */}
      <g transform="translate(80,200)">
        <rect x="0" y="20" width="56" height="40" rx="4" fill="#FEF3C7" />
        <polygon points="28,-8 64,20 -8,20" fill="#DC2626" />
        <rect x="20" y="32" width="16" height="20" rx="2" fill="#92400E" />
        <rect x="8" y="60" width="6" height="28" fill="#78716C" />
        <rect x="42" y="60" width="6" height="28" fill="#78716C" />
      </g>

      <g transform="translate(390,185)">
        <rect x="0" y="20" width="48" height="36" rx="4" fill="#FEE2E2" />
        <polygon points="24,-4 56,20 -8,20" fill="#1E40AF" />
        <rect x="16" y="30" width="14" height="18" rx="2" fill="#78350F" />
        <rect x="6" y="56" width="5" height="32" fill="#78716C" />
        <rect x="36" y="56" width="5" height="32" fill="#78716C" />
      </g>

      {/* Water body */}
      <path
        d="M0 280 C90 260 150 290 240 275 C330 260 400 295 480 270 C520 258 545 268 560 260 V420 H0 Z"
        fill="url(#water)"
      />

      {/* Wave lines */}
      <path
        d="M0 310 Q70 295 140 310 T280 310 T420 310 T560 310"
        stroke="#BFDBFE"
        strokeWidth="2"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M0 340 Q70 325 140 340 T280 340 T420 340 T560 340"
        stroke="#93C5FD"
        strokeWidth="2"
        fill="none"
        opacity="0.45"
      />
      <path
        d="M0 370 Q70 355 140 370 T280 370 T420 370 T560 370"
        stroke="#BFDBFE"
        strokeWidth="1.5"
        fill="none"
        opacity="0.35"
      />

      {/* Boat */}
      <g transform="translate(230,300)">
        <ellipse cx="50" cy="28" rx="48" ry="12" fill="#1E3A8A" />
        <path d="M10 28 L20 8 H80 L90 28 Z" fill="#F8FAFC" />
        <rect x="46" y="-18" width="4" height="28" fill="#78716C" />
        <path d="M50 -18 L78 4 H50 Z" fill="#EF4444" />
      </g>

      {/* Sun */}
      <circle cx="460" cy="70" r="28" fill="#FBBF24" opacity="0.9" />
      <circle cx="460" cy="70" r="40" fill="#FBBF24" opacity="0.2" />

      {/* Rain drops */}
      <g stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" opacity="0.5">
        <line x1="120" y1="60" x2="115" y2="78" />
        <line x1="160" y1="40" x2="155" y2="58" />
        <line x1="200" y1="70" x2="195" y2="88" />
        <line x1="280" y1="50" x2="275" y2="68" />
        <line x1="320" y1="80" x2="315" y2="98" />
      </g>
    </svg>
  )
}
