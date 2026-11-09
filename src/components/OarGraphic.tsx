export function OarGraphic({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 140" className={className} fill="currentColor" aria-hidden="true">
      {/* oar drawn level, then tilted so the blade sits at an angle to the shaft */}
      <g transform="rotate(-18 20 120)" stroke="currentColor">
        {/* handle button */}
        <circle cx="20" cy="120" r="7.5" stroke="none" />
        {/* grip */}
        <path d="M28 120 L62 120" strokeWidth={11} strokeLinecap="round" fill="none" />
        {/* shaft, tapering towards the blade */}
        <path d="M62 117 L196 118.4 L196 121.6 L62 123 Z" stroke="none" />
        {/* sleeve */}
        <path d="M168 120 L200 120" strokeWidth={8.5} strokeLinecap="round" fill="none" />
        {/* Macon blade: narrow throat, long taper, rounded tip */}
        <path d="M200 116 C218 113 234 109 252 107 C266 106.5 278 108 286 112 C292 115 294 119 292 123 C288 128 276 132 260 133 C242 133 222 129 200 124 Z" stroke="none" />
      </g>
    </svg>
  );
}
