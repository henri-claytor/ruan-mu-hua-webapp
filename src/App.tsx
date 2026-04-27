import { BrowserRouter, Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import HomePage from './pages/HomePage'
import IndividualPage from './pages/IndividualPage'
import PortfolioPage from './pages/PortfolioPage'
import HurstPage from './pages/HurstPage'
import ComparePage from './pages/ComparePage'

function App() {
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
              <Route path="/hurst" element={<HurstPage />} />
              <Route path="/compare" element={<ComparePage />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
