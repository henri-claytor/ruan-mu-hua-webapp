import type { ReactNode } from 'react'

interface PanelProps {
  title: string
  sub?: string
  id?: string
  className?: string
  children: ReactNode
  right?: ReactNode
}

/**
 * ui-spec `.panel` component: 標題 serif 15px + 副標 + 內容
 */
export default function Panel({ title, sub, id, className = '', children, right }: PanelProps) {
  return (
    <div id={id} className={`panel ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-1">
        <h2 className="panel-title">{title}</h2>
        {right}
      </div>
      {sub && <p className="panel-sub">{sub}</p>}
      {children}
    </div>
  )
}
