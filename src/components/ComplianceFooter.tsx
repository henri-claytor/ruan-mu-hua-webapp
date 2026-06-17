import { COMPLIANCE_FOOTER } from '../lib/wording'

/**
 * 合規免責聲明 footer
 *
 * 用於 4 個分析頁底部（結果區末），明確聲明非投資建議。
 */
export default function ComplianceFooter() {
  return (
    <div className="text-caption text-faint border-t border-base pt-3 mt-4 leading-relaxed">
      ⚠ {COMPLIANCE_FOOTER}
    </div>
  )
}
