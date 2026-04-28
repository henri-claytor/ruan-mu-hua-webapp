interface IconProps { className?: string; size?: number }

const base = (size: number) => ({
  width: size, height: size, viewBox: '0 0 24 24',
  fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
})

export const Icon = {
  Home: ({ className = '', size = 18 }: IconProps) => (
    <svg {...base(size)} className={className}>
      <path d="M3 12 12 4l9 8M5 10v10h14V10" />
    </svg>
  ),
  BarChart: ({ className = '', size = 18 }: IconProps) => (
    <svg {...base(size)} className={className}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Folder: ({ className = '', size = 18 }: IconProps) => (
    <svg {...base(size)} className={className}>
      <path d="M3 7h6l2 3h10v9H3V7z" />
    </svg>
  ),
  Scale: ({ className = '', size = 18 }: IconProps) => (
    <svg {...base(size)} className={className}>
      <path d="M12 3v18M3 8h18M5 8l3 8h-6l3-8zM19 8l3 8h-6l3-8z" />
    </svg>
  ),
  Trophy: ({ className = '', size = 16 }: IconProps) => (
    <svg {...base(size)} className={className}>
      <path d="M8 21h8M12 17v4M7 4h10v8a5 5 0 0 1-10 0V4z" />
      <path d="M17 5h2a2 2 0 0 1 2 2v2a3 3 0 0 1-3 3M7 5H5a2 2 0 0 0-2 2v2a3 3 0 0 0 3 3" />
    </svg>
  ),
  Check: ({ className = '', size = 16 }: IconProps) => (
    <svg {...base(size)} className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Alert: ({ className = '', size = 16 }: IconProps) => (
    <svg {...base(size)} className={className}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </svg>
  ),
  Ban: ({ className = '', size = 16 }: IconProps) => (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  ),
  Wave: ({ className = '', size = 18 }: IconProps) => (
    <svg {...base(size)} className={className}>
      <path d="M3 12 Q 7 6, 11 12 T 19 12" />
    </svg>
  ),
}
