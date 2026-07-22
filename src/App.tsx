import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import NavBar from './components/NavBar'
import HomePage from './pages/HomePage'
import IndividualPage from './pages/IndividualPage'
import PortfolioPage from './pages/PortfolioPage'
import ComparePage from './pages/ComparePage'
import PerformancePage from './pages/PerformancePage'
import ReportsPage from './pages/ReportsPage'
import { useAppStore } from './store/useAppStore'
import { useAuthStore } from './store/useAuthStore'
import { fetchStockList } from './lib/api'

function App() {
  const setStockList = useAppStore((s) => s.setStockList)
  const refreshAuth = useAuthStore((s) => s.refresh)

  // Fetch the full stock list once on app init
  useEffect(() => {
    fetchStockList()
      .then((list) => {
        if (list.length > 0) setStockList(list)
      })
      .catch((err) => {
        console.warn('Failed to fetch stock list:', err)
      })
  }, [setStockList])

  // Restore login state from the session cookie once on app init
  useEffect(() => {
    void refreshAuth()
  }, [refreshAuth])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-app">
        <NavBar />
        {/* Desktop: offset left by 196px for sidebar; Mobile: offset bottom for tab bar */}
        <main className="md:ml-[196px] pb-20 md:pb-0">
          <div className="max-w-[980px] mx-auto px-7 pt-13 pb-25">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/individual" element={<IndividualPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/performance" element={<PerformancePage />} />
              <Route path="/reports" element={<ReportsPage />} />
              {/* /hurst redirects to home — page has been removed */}
              <Route path="/hurst" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
