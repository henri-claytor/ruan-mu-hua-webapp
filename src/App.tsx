import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import NavBar from './components/NavBar'
import HomePage from './pages/HomePage'
import IndividualPage from './pages/IndividualPage'
import PortfolioPage from './pages/PortfolioPage'
import ComparePage from './pages/ComparePage'
import PerformancePage from './pages/PerformancePage'
import { useAppStore } from './store/useAppStore'
import { fetchStockList } from './lib/api'

function App() {
  const setStockList = useAppStore((s) => s.setStockList)

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

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-app">
        <NavBar />
        {/* Desktop: offset left by 200px for sidebar; Mobile: offset bottom for tab bar */}
        <main className="md:ml-[200px] pb-20 md:pb-0">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/individual" element={<IndividualPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/performance" element={<PerformancePage />} />
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
