import { BrowserRouter, Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import HomePage from './pages/HomePage'
import IndividualPage from './pages/IndividualPage'
import PortfolioPage from './pages/PortfolioPage'
import HurstPage from './pages/HurstPage'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <main className="max-w-5xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/individual" element={<IndividualPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/hurst" element={<HurstPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
