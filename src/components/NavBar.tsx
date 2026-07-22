import { NavLink } from 'react-router-dom'
import { Icon } from './icons'
import { useAuthStore, AUTH_BYPASS } from '../store/useAuthStore'
import GoogleLoginButton from './GoogleLoginButton'

const NAV_ITEMS = [
  { to: '/',            Icon: Icon.Home,           label: '首頁',     exact: true  },
  { to: '/individual',  Icon: Icon.BarChart,       label: '個股分析', exact: false },
  { to: '/portfolio',   Icon: Icon.Folder,         label: '投資組合', exact: false },
  { to: '/compare',     Icon: Icon.Scale,          label: '比較分析', exact: false },
  { to: '/performance', Icon: Icon.ClipboardCheck, label: '績效分析', exact: false },
  { to: '/reports',     Icon: Icon.FileText,       label: '報告分享', exact: false },
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
        `flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13.5px] tracking-wide transition-colors select-none ${
          isActive
            ? 'bg-[rgba(201,168,76,0.13)] text-[#c9a84c] font-medium'
            : 'text-[#7a6a50] hover:bg-[rgba(201,168,76,0.07)] hover:text-[#f0e4cc]'
        }`
      }
    >
      <SvgIcon size={16} />
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
            ? 'border-t-[3px] border-[#c9a84c] text-[#c9a84c]'
            : 'border-t-[3px] border-transparent text-[#7a6a50]'
        }`
      }
    >
      <SvgIcon size={20} />
      <span>{label}</span>
    </NavLink>
  )
}

function AuthSection() {
  const { loggedIn, email, logout } = useAuthStore()

  // 開發過渡：統登尚未接，顯示中性標示，不出現登入/登出控制
  if (AUTH_BYPASS) {
    return (
      <div className="px-[22px] py-3 border-t border-[rgba(201,168,76,0.13)]">
        <p className="text-[11px] text-[#7a6a50]">統登使用者（開發預設）</p>
      </div>
    )
  }

  if (loggedIn) {
    return (
      <div className="px-[22px] py-3 border-t border-[rgba(201,168,76,0.13)]">
        <p className="text-[11px] text-[#7a6a50] truncate mb-1.5" title={email ?? ''}>
          {email}
        </p>
        <button
          onClick={() => void logout()}
          className="text-[11px] text-[#9a7a2e] hover:text-[#c9a84c] transition-colors"
        >
          登出
        </button>
      </div>
    )
  }

  return (
    <div className="px-[22px] py-3 border-t border-[rgba(201,168,76,0.13)]">
      <GoogleLoginButton />
    </div>
  )
}

export default function NavBar() {
  return (
    <>
      {/* ── Desktop Sidebar (md+): 196px fixed deep-brown ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-[196px] bg-[#1f1509] z-40 pt-7">
        <div className="px-[22px] pb-7">
          <h2 className="font-serif text-[16px] font-bold text-[#c9a84c] tracking-[1.5px] leading-snug">
            獲利加速輔助系統
          </h2>
          <p className="text-[11px] text-[#7a6a50] mt-[3px]">阮慕驊課程工具</p>
        </div>
        <nav className="flex flex-col gap-0.5 px-3 flex-1 overflow-y-auto pb-4">
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
        </nav>
        <AuthSection />
      </aside>

      {/* ── Mobile Bottom Tab Bar (<md) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1f1509] z-40 flex">
        {NAV_ITEMS.map((item) => (
          <BottomTabLink key={item.to} {...item} />
        ))}
      </nav>
    </>
  )
}
