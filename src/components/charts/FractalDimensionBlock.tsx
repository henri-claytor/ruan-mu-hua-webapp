import type { MultiScaleHurstResult, HurstResult } from '../../lib/hurst'
import {
  hurstToFractalDimension,
  classifyFractalDimension,
  fractalRegimeLabel,
  type FractalRegime,
} from '../../lib/fractalDimension'

interface Props {
  hurst: MultiScaleHurstResult
}

const CHIP_STYLE: Record<FractalRegime, string> = {
  'strong-trend':        'bg-red-50 text-red-700',
  'mild-trend':          'bg-amber-50 text-amber-700',
  'random':              'bg-elevated text-dim',
  'mild-mean-revert':    'bg-amber-50 text-amber-700',
  'strong-mean-revert':  'bg-green-50 text-green-700',
}

interface ScaleDCardProps {
  label: string
  windowDesc: string
  scale: HurstResult
}

function ScaleDCard({ label, windowDesc, scale }: ScaleDCardProps) {
  const d = hurstToFractalDimension(scale.h)
  const valid = Number.isFinite(d)

  return (
    <div className="bg-card2 border border-base rounded-lg px-[18px] py-4 hover:border-[rgba(154,122,46,0.28)] transition-colors">
      <p className="text-[10.5px] text-dim tracking-[1.5px]">{label}</p>
      <p className="text-[10.5px] text-[#9a8a70] mb-3">{windowDesc}</p>
      {valid ? (
        <>
          <p className="text-[10.5px] text-dim tracking-[1px] mb-1">D 值</p>
          <p className="font-serif text-[24px] font-bold leading-none num text-main">
            {d.toFixed(3)}
          </p>
          <span
            className={`inline-block mt-2 text-[10.5px] px-2 py-0.5 rounded-full font-semibold ${
              CHIP_STYLE[classifyFractalDimension(d)]
            }`}
          >
            {fractalRegimeLabel(classifyFractalDimension(d))}
          </span>
        </>
      ) : (
        <p className="text-small text-faint">資料不足</p>
      )}
    </div>
  )
}

export default function FractalDimensionBlock({ hurst }: Props) {
  return (
    <div className="bg-surface rounded-2xl border border-base p-6 space-y-4">
      <div>
        <h2 className="font-serif text-h2 font-bold text-main tracking-wide">技術指標</h2>
        <p className="text-caption text-faint mt-0.5">
          分形維度 D（Fractal Dimension）— 量化價格序列的「粗糙度」，D = 2 − H · 越接近 1 越平滑、越接近 2 越鋸齒
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ScaleDCard label="短期" windowDesc="60 日窗口" scale={hurst.short} />
        <ScaleDCard label="中期" windowDesc="120 日窗口" scale={hurst.medium} />
        <ScaleDCard label="長期" windowDesc="240 日窗口" scale={hurst.long} />
      </div>
    </div>
  )
}
