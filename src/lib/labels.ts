/**
 * UI 指標白話命名集中表
 *
 * 全站使用者面對的字串從此匯入；內部 type / 函式 / 變數名稱不動。
 */

export const METRIC_LABELS = {
  // 期望報酬類
  evAnnual:      '年化期望報酬率',
  evAnnualShort: '年化報酬率',
  evMonthly:     '月平均報酬率',
  evDaily:       '日平均報酬率',

  // 績效比率
  payoffRatio:   '損益比',
  profitFactor:  '獲利因子',
  winRate:       '勝率',
  lossRate:      '敗率',
  avgGain:       'Avg Gain',
  avgLoss:       'Avg Loss',

  // 趨勢
  hurstH:        '趨勢強度 H',
  hurst:         '趨勢強度',
  fractalD:      '分形維度 D',

  // 風險
  var95:         '95% 下行虧損',
  var99:         '99% 下行虧損',

  // 蒙地卡羅情境
  mcP5:          '悲觀情境',
  mcP50:         '中位情境',
  mcP95:         '樂觀情境',

  // 績效卡
  totalPnl:      '總實現損益',
  totalInvested: '總投入',
  overallReturn: '整體報酬率',
  annualized:    '年化',
  avgHolding:    '平均持有天數',
  avgWinPct:     '勝場均報酬',
  avgLossPct:    '敗場均虧損',
  nTrades:       '總筆數',
} as const

export type MetricLabelKey = keyof typeof METRIC_LABELS
