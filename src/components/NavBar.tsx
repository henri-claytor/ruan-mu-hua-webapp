import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: '首頁', exact: true },
  { to: '/individual', label: '個股 EV' },
  { to: '/portfolio', label: '投資組合' },
  { to: '/hurst', label: 'Hurst 指數' },
]

export default function NavBar() {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center h-14 gap-1">
          <span className="font-bold text-gray-900 mr-4 text-sm">
            📊 財商實戰課
          </span>
          {links.map(({ to, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
