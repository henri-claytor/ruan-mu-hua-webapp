import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Trade } from '../lib/trade'

interface TradeStore {
  trades: Trade[]
  addTrade: (trade: Trade) => void
  updateTrade: (id: string, patch: Partial<Trade>) => void
  removeTrade: (id: string) => void
  importTrades: (newTrades: Trade[]) => void
  clearAll: () => void
}

/**
 * 交易紀錄本機儲存。
 * 隱私：完全不上傳雲端，僅在使用者瀏覽器 localStorage。
 */
export const useTradeStore = create<TradeStore>()(
  persist(
    (set) => ({
      trades: [],

      addTrade: (trade) =>
        set((state) => ({ trades: [...state.trades, trade] })),

      updateTrade: (id, patch) =>
        set((state) => ({
          trades: state.trades.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      removeTrade: (id) =>
        set((state) => ({ trades: state.trades.filter((t) => t.id !== id) })),

      importTrades: (newTrades) =>
        set((state) => ({ trades: [...state.trades, ...newTrades] })),

      clearAll: () => set({ trades: [] }),
    }),
    {
      name: 'rmh-trades-v1',
      version: 1,
    },
  ),
)
