import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

/**
 * ui-spec `.sbadge` — gold border + pulse dot + 文字
 */
export default function StatusBadge({ children, className = '' }: Props) {
  return (
    <div className={`sbadge ${className}`}>
      <div className="sdot" />
      <span>{children}</span>
    </div>
  )
}
