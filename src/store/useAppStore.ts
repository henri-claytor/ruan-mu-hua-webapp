import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Shared types ──────────────────────────────────────────────────────────────

export interface StockItem {
  code: string
  name: string
}

export interface Stock {
  id: number
  code: string
  name: string
  monthlyReturns: number[]
  dailyReturns: number[]
  weight: number
}

export interface CompareStock {
  stockCode: string
  name: string
  monthlyReturns: number[]
  dailyReturns: number[]
}

// ── Store interface ───────────────────────────────────────────────────────────

interface AppStore {
  // Global stock list (fetched once on app init)
  stockList: StockItem[]
  setStockList: (list: StockItem[]) => void

  // Individual analysis page
  individualStockCode: string
  setIndividualStockCode: (code: string) => void
  clearIndividual: () => void

  // Portfolio page
  stocks: Stock[]
  setStocks: (stocks: Stock[]) => void
  clearPortfolio: () => void

  // Compare page
  compareA: CompareStock
  compareB: CompareStock
  setCompareA: (v: CompareStock) => void
  setCompareB: (v: CompareStock) => void
  clearCompare: () => void
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_STOCKS: Stock[] = [
  { id: 1, code: '', name: '股票 A', monthlyReturns: [], dailyReturns: [], weight: 50 },
  { id: 2, code: '', name: '股票 B', monthlyReturns: [], dailyReturns: [], weight: 50 },
]

const DEFAULT_COMPARE_STOCK: CompareStock = {
  stockCode: '',
  name: '',
  monthlyReturns: [],
  dailyReturns: [],
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // Stock list
      stockList: [],
      setStockList: (list) => set({ stockList: list }),

      // Individual
      individualStockCode: '',
      setIndividualStockCode: (code) => set({ individualStockCode: code }),
      clearIndividual: () => set({ individualStockCode: '' }),

      // Portfolio
      stocks: DEFAULT_STOCKS,
      setStocks: (stocks) => set({ stocks }),
      clearPortfolio: () => set({ stocks: DEFAULT_STOCKS }),

      // Compare
      compareA: { ...DEFAULT_COMPARE_STOCK },
      compareB: { ...DEFAULT_COMPARE_STOCK },
      setCompareA: (v) => set({ compareA: v }),
      setCompareB: (v) => set({ compareB: v }),
      clearCompare: () =>
        set({
          compareA: { ...DEFAULT_COMPARE_STOCK },
          compareB: { ...DEFAULT_COMPARE_STOCK },
        }),
    }),
    {
      name: 'rmh-app-v3',
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('[rmh-app-v3] Failed to rehydrate store, resetting.', error)
          state?.clearIndividual()
          state?.clearPortfolio()
          state?.clearCompare()
        }
      },
    }
  )
)
