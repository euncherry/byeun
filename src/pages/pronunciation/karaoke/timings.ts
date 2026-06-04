// 게임(D:\04_game\last\src\features\pronunciation)의 가라오케 타이밍 형식/로직 이식.
export type SyllableTiming = { syllable: string; start: number; end: number }

// 게임 karaokeTimings.ts 와 동일: 평문 입력 시 글자당 0.15초 균등 분배
const DURATION_PER_CHAR = 0.15

export function generateAutoTimings(text: string): SyllableTiming[] {
  return Array.from(text).map((ch, i) => ({
    syllable: ch,
    start: i * DURATION_PER_CHAR,
    end: (i + 1) * DURATION_PER_CHAR,
  }))
}

// 총 길이(초) = 마지막 음절의 end (게임 estimateTotalDuration 와 동일)
export function totalDuration(timings: SyllableTiming[]): number {
  return timings.length ? Math.max(...timings.map((t) => t.end)) : 0
}

/**
 * 입력 파싱:
 *  - JSON 배열 [{syllable,start,end}, ...]  → 그대로 사용
 *  - JSON 객체 {lines:{...}}                → 첫 라인 배열 사용 (게임 karaoke.json 통째로 붙여넣어도 OK)
 *  - 평문 문장                              → 0.15초/글자 자동 타이밍
 */
export function parseInput(raw: string): SyllableTiming[] {
  const trimmed = raw.trim()
  if (!trimmed) return []

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    const data: unknown = JSON.parse(trimmed)
    let arr: unknown = null
    if (Array.isArray(data)) arr = data
    else if (data && typeof data === 'object' && 'lines' in data) {
      const lines = (data as { lines: Record<string, unknown> }).lines
      arr = Object.values(lines)[0]
    }
    if (!Array.isArray(arr)) throw new Error('타이밍 배열을 찾을 수 없습니다.')

    const timings = arr
      .map((d) => {
        const o = d as { syllable?: unknown; start?: unknown; end?: unknown }
        return {
          syllable: String(o.syllable ?? ''),
          start: Number(o.start),
          end: Number(o.end),
        }
      })
      .filter((t) => Number.isFinite(t.start) && Number.isFinite(t.end))

    if (!timings.length) throw new Error('유효한 음절 타이밍이 없습니다.')
    return timings
  }

  // 평문 문장 → 자동 타이밍
  return generateAutoTimings(trimmed)
}

// 기본 seed (사용자 제공 예시: "관상학적으로 눈 처진 사람들이 착하다고 하더라고요.")
export const DEFAULT_TIMINGS: SyllableTiming[] = [
  { syllable: '관', start: 0, end: 0.236 },
  { syllable: '상', start: 0.236, end: 0.467 },
  { syllable: '학', start: 0.467, end: 0.698 },
  { syllable: '적', start: 0.698, end: 0.928 },
  { syllable: '으', start: 0.928, end: 1.132 },
  { syllable: '로', start: 1.132, end: 1.333 },
  { syllable: ' ', start: 1.333, end: 1.39 },
  { syllable: '눈', start: 1.39, end: 1.612 },
  { syllable: ' ', start: 1.612, end: 1.668 },
  { syllable: '처', start: 1.668, end: 1.89 },
  { syllable: '진', start: 1.89, end: 2.113 },
  { syllable: ' ', start: 2.113, end: 2.169 },
  { syllable: '사', start: 2.169, end: 2.287 },
  { syllable: '람', start: 2.287, end: 2.401 },
  { syllable: '들', start: 2.401, end: 2.515 },
  { syllable: '이', start: 2.515, end: 2.609 },
  { syllable: ' ', start: 2.609, end: 2.665 },
  { syllable: '착', start: 2.665, end: 2.827 },
  { syllable: '하', start: 2.827, end: 2.984 },
  { syllable: '다', start: 2.984, end: 3.141 },
  { syllable: '고', start: 3.141, end: 3.285 },
  { syllable: ' ', start: 3.285, end: 3.341 },
  { syllable: '하', start: 3.341, end: 3.461 },
  { syllable: '더', start: 3.461, end: 3.578 },
  { syllable: '라', start: 3.578, end: 3.686 },
  { syllable: '고', start: 3.686, end: 3.794 },
  { syllable: '요', start: 3.794, end: 3.901 },
  { syllable: '.', start: 3.901, end: 4.03 },
]
