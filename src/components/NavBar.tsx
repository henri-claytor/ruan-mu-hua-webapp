import { NavLink } from 'react-router-dom'
import { Icon } from './icons'

const NAV_ITEMS = [
  { to: '/',           Icon: Icon.Home,     label: '首頁',     exact: true  },
  { to: '/individual', Icon: Icon.BarChart, label: '個股分析', exact: false },
  { to: '/portfolio',  Icon: Icon.Folder,   label: '投資組合', exact: false },
  { to: '/compare',    Icon: Icon.Scale,    label: '比較分析', exact: false },
] as const

interface NavItemProps {
  to: string
  Icon: typeof Icon.Home
  label: string
  exact: boolean
}

function SidebarLink({ to, Icon: SvgIcon, label, exact }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg text-body font-medium transition-colors ${
          isActive
            ? 'border-l-[3px] border-blue-500 bg-blue-50 text-blue-700 pl-[13px]'
            : 'text-dim hover:text-main hover:bg-elevated'
        }`
      }
    >
      <SvgIcon size={18} />
      <span>{label}</span>
    </NavLink>
  )
}

function BottomTabLink({ to, Icon: SvgIcon, label, exact }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 py-2 px-1 flex-1 text-caption font-medium transition-colors ${
          isActive
            ? 'border-t-[3px] border-blue-500 text-blue-600'
            : 'border-t-[3px] border-transparent text-faint'
        }`
      }
    >
      <SvgIcon size={20} />
      <span>{label}</span>
    </NavLink>
  )
}

export default function NavBar() {
  return (
    <>
      {/* ── Desktop Sidebar (md+) ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-[200px] bg-surface border-r border-base z-40">
        <div className="px-4 py-5 border-b border-base">
          <p className="text-h1 font-bold text-main">財商實戰課</p>
          <p className="text-caption text-faint mt-0.5">阮慕驊課程工具</p>
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
        </nav>
      </aside>

      {/* ── Mobile Bottom Tab Bar (<md) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-base z-40 flex">
        {NAV_ITEMS.map((item) => (
          <BottomTabLink key={item.to} {...item} />
        ))}
      </nav>
    </>
  )
}
