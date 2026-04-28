/**
 * Shared Recharts style constants for consistent chart appearance
 * across all pages. Always import from here — no inline style objects.
 *
 * Colors are read from CSS variables defined in @theme (index.css) at
 * runtime, so changing a token there instantly updates all charts.
 */

/** Read a CSS variable from :root at runtime; fallback for SSR / tests. */
function token(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

export const TOOLTIP_STYLE = {
  contentStyle: {
    background:   token('--color-surface', '#FFFFFF'),
    border:       `1px solid ${token('--color-base', '#C6C6C8')}`,
    borderRadius: 8,
    fontSize:     12,
    color:        token('--color-main', '#1C1C1E'),
    fontFamily:   token('--font-num', "'JetBrains Mono', monospace"),
    fontVariantNumeric: 'tabular-nums',
  },
  labelStyle: { color: token('--color-dim',  '#6C6C70'), fontWeight: 600 },
  itemStyle:  { color: token('--color-main', '#1C1C1E') },
}

export const AXIS_TICK_STYLE = {
  fontSize: 10,
  fill: token('--color-faint', '#AEAEB2'),
}

export const CHART_COLORS = {
  p5:       token('--color-negative',  '#DC2626'),
  p50:      token('--color-accent',    '#2563EB'),
  p95:      token('--color-positive',  '#16A34A'),
  var95:    token('--color-attention', '#D97706'),
  var99:    token('--color-negative',  '#DC2626'),
  hurst:    token('--color-accent',    '#2563EB'),
  bar:      token('--color-bar',       '#93C5FD'),
  grid:     token('--color-grid',      '#F0F0F0'),
  positive: token('--color-positive',  '#16A34A'),
  negative: token('--color-negative',  '#DC2626'),
  refLine:  token('--color-ref',       '#D1D5DB'),
}
