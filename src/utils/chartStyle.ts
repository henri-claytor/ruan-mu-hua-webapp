/**
 * Shared Recharts style constants for consistent chart appearance
 * across all pages. Always import from here — no inline style objects.
 */

export const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#FFFFFF',
    border: '1px solid #C6C6C8',
    borderRadius: 8,
    fontSize: 12,
    color: '#1C1C1E',
  },
  labelStyle: { color: '#6C6C70', fontWeight: 600 },
  itemStyle: { color: '#1C1C1E' },
}

export const AXIS_TICK_STYLE = {
  fontSize: 10,
  fill: '#AEAEB2',
}

export const CHART_COLORS = {
  p5: '#DC2626',     // red-600
  p50: '#2563EB',    // blue-600
  p95: '#16A34A',    // green-700
  var95: '#D97706',  // amber-600
  var99: '#DC2626',  // red-600
  hurst: '#2563EB',  // blue-600
  bar: '#93C5FD',    // blue-300
  grid: '#F0F0F0',
  positive: '#16A34A',
  negative: '#DC2626',
  refLine: '#D1D5DB',
}
