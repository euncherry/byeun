import type { GraphColors } from './graphs/colors'
import { DEFAULT_COLORS } from './graphs/colors'

type Field = { key: keyof GraphColors; label: string; group: string }

const FIELDS: Field[] = [
  { group: '파형 곡선', key: 'waveformWave', label: '파형' },
  { group: '파형 곡선', key: 'waveformProgress', label: '진행' },
  { group: '음정 곡선', key: 'pitchUp', label: '상승' },
  { group: '음정 곡선', key: 'pitchDown', label: '하강' },
  { group: '음정 곡선', key: 'pitchBgWave', label: '배경 파형' },
  { group: '음정 곡선', key: 'pitchBgProgress', label: '배경 진행' },
]

const GROUPS = ['파형 곡선', '음정 곡선']

export function ColorEditor({
  colors,
  setColors,
}: {
  colors: GraphColors
  setColors: (c: GraphColors) => void
}) {
  return (
    <div className="color-editor">
      {GROUPS.map((group) => (
        <div className="color-group" key={group}>
          <span className="color-group-title">{group}</span>
          <div className="color-swatches">
            {FIELDS.filter((f) => f.group === group).map((f) => (
              <label className="color-field" key={f.key}>
                <input
                  type="color"
                  value={colors[f.key]}
                  onChange={(e) => setColors({ ...colors, [f.key]: e.target.value })}
                />
                <span>{f.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
      <button className="kara-btn ghost color-reset" onClick={() => setColors(DEFAULT_COLORS)}>
        ↺ 기본값
      </button>
    </div>
  )
}
