import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Stock {
  id: number
  name: string
  rawText: string
  weight: number
}

interface CompareStock {
  name: string
  rawText: string
}

interface AppStore {
  // Individual page
  individualRawText: string
  setIndividualRawText: (v: string) => void
  clearIndividual: () => void

  // Hurst page
  hurstRawText: string
  setHurstRawText: (v: string) => void
  clearHurst: () => void

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

const DEFAULT_STOCKS: Stock[] = [
  { id: 1, name: '股票 A', rawText: '', weight: 50 },
  { id: 2, name: '股票 B', rawText: '', weight: 50 },
]

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // Individual
      individualRawText: '',
      setIndividualRawText: (v) => set({ individualRawText: v }),
      clearIndividual: () => set({ individualRawText: '' }),

      // Hurst
      hurstRawText: '',
      setHurstRawText: (v) => set({ hurstRawText: v }),
      clearHurst: () => set({ hurstRawText: '' }),

      // Portfolio
      stocks: DEFAULT_STOCKS,
      setStocks: (stocks) => set({ stocks }),
      clearPortfolio: () => set({ stocks: DEFAULT_STOCKS }),

      // Compare
      compareA: { name: '股票 A', rawText: '' },
      compareB: { name: '股票 B', rawText: '' },
      setCompareA: (v) => set({ compareA: v }),
      setCompareB: (v) => set({ compareB: v }),
      clearCompare: () => set({
        compareA: { name: '股票 A', rawText: '' },
        compareB: { name: '股票 B', rawText: '' },
      }),
    }),
    {
      name: 'rmh-app-v2',
      // Catch schema version conflicts silently
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('[rmh-app-v2] Failed to rehydrate store, resetting.', error)
          state?.clearIndividual()
          state?.clearHurst()
          state?.clearPortfolio()
          state?.clearCompare()
        }
      },
    }
  )
)
