export function Mark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="16" fill="#123B5D" />
      <rect x="5" y="5" width="54" height="54" rx="13" fill="none" stroke="#C9A227" strokeWidth="1.6" />
      <text
        x="32"
        y="40"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="22"
        fontWeight="700"
        fill="#C9A227"
      >
        KS
      </text>
    </svg>
  );
}

export function Wordmark({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <span className="flex items-center gap-2 sm:gap-3">
      <Mark size={42} className={compact ? "h-8 w-8 sm:h-[42px] sm:w-[42px]" : undefined} />
      <span className="leading-tight">
        <span className={`block font-display text-lg ${light ? "text-ivory" : "text-navy"}`}>KSEI</span>
        <span
          className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${compact ? "hidden sm:block" : "block"} ${light ? "text-gold-soft" : "text-gold-deep"}`}
        >
          Learn. Lead. Empower.
        </span>
      </span>
    </span>
  );
}
