// 파형/음정 그래프 색상 설정. 런타임 편집 + localStorage 저장.
export type GraphColors = {
  waveformWave: string // 파형 막대
  waveformProgress: string // 파형 진행/커서
  pitchUp: string // 음정 상승
  pitchDown: string // 음정 하강
  pitchBgWave: string // 음정 배경 파형 (0.3 알파로 적용)
  pitchBgProgress: string // 음정 배경 진행 (0.5 알파로 적용)
}

// 원본 기본값 (게임 톤)
export const DEFAULT_COLORS: GraphColors = {
  waveformWave: '#b5a98f', // rgb(181,169,143)
  waveformProgress: '#a8cce0', // rgb(168,204,224)
  pitchUp: '#a8cce0',
  pitchDown: '#d4a574',
  pitchBgWave: '#b5a98f',
  pitchBgProgress: '#a8cce0',
}

const STORAGE_KEY = 'byeun:graph-colors'

export function loadColors(): GraphColors {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_COLORS
    return { ...DEFAULT_COLORS, ...(JSON.parse(raw) as Partial<GraphColors>) }
  } catch {
    return DEFAULT_COLORS
  }
}

export function saveColors(colors: GraphColors) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors))
  } catch {
    /* localStorage 미지원/차단 — 무시 */
  }
}

// #rrggbb + 알파(0~1) → #rrggbbaa (WaveSurfer/canvas 모두 허용)
export function withAlpha(hex: string, alpha: number): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0')
  return hex + a
}
