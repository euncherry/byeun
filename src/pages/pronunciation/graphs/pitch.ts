// 원본 wavesurfer-viewer.html의 피치 감지/그리기 로직을 그대로 이식.
// AMDF(평균 진폭차 함수) + 경계/에너지 필터 → mode 기반 baseFrequency.

export type PitchProfile = {
  minFrequency: number
  maxFrequency: number
  sensitivity: number
  energyThreshold: number
  boundaryTolerance: number
}

// 원본 기본 프로파일: ADULTS_ONLY (성인만, 60-350Hz)
export const PITCH_PROFILE: PitchProfile = {
  minFrequency: 60,
  maxFrequency: 350,
  sensitivity: 0.008,
  energyThreshold: 0.006,
  boundaryTolerance: 15,
}

// Pitchfinder.frequencies 와 동일한 윈도우/홉 (촘촘한 포인트)
const WINDOW_SIZE = 1024
const HOP_SIZE = 64

// AMDF 피치 감지기 한 프레임 → 주파수(Hz) 또는 null(무음)
function createAMDF(sampleRate: number, cfg: PitchProfile) {
  const minPeriod = Math.floor(sampleRate / cfg.maxFrequency)
  const maxPeriod = Math.floor(sampleRate / cfg.minFrequency)
  return (buf: Float32Array): number | null => {
    const n = buf.length
    let rms = 0
    for (let i = 0; i < n; i++) rms += buf[i] * buf[i]
    rms = Math.sqrt(rms / n)
    if (rms < cfg.sensitivity) return null // 무음

    let minAMDF = Infinity
    let bestPeriod = -1
    for (let period = minPeriod; period < maxPeriod && period < n; period++) {
      let sum = 0
      const count = n - period
      for (let i = 0; i < count; i++) sum += Math.abs(buf[i] - buf[i + period])
      const amdf = sum / count
      if (amdf < minAMDF) {
        minAMDF = amdf
        bestPeriod = period
      }
    }
    if (bestPeriod === -1) return null
    const frequency = sampleRate / bestPeriod
    if (frequency < cfg.minFrequency || frequency > cfg.maxFrequency) return null
    return frequency
  }
}

export type PitchResult = {
  frequencies: (number | null)[]
  baseFrequency: number
  averagePitch: number
  minPitch: number
  maxPitch: number
}

export function detectPitch(buffer: AudioBuffer, cfg: PitchProfile = PITCH_PROFILE): PitchResult {
  const audio = buffer.getChannelData(0)
  const sampleRate = buffer.sampleRate
  const detect = createAMDF(sampleRate, cfg)

  // 프레임별 raw 주파수
  const raw: (number | null)[] = []
  for (let i = 0; i + WINDOW_SIZE < audio.length; i += HOP_SIZE) {
    raw.push(detect(audio.subarray(i, i + WINDOW_SIZE)))
  }

  // 경계값 + 에너지 필터링
  const frequencies = raw.map((freq, index) => {
    if (!freq || freq <= 0) return null
    if (Math.abs(freq - cfg.maxFrequency) < cfg.boundaryTolerance) return null
    if (Math.abs(freq - cfg.minFrequency) < cfg.boundaryTolerance) return null

    const frameStart = index * HOP_SIZE
    const frameEnd = Math.min(frameStart + WINDOW_SIZE, audio.length)
    if (frameStart >= audio.length) return null

    let sumSquares = 0
    let sampleCount = 0
    for (let i = frameStart; i < frameEnd; i++) {
      sumSquares += audio[i] * audio[i]
      sampleCount++
    }
    const rms = sampleCount > 0 ? Math.sqrt(sumSquares / sampleCount) : 0
    if (rms < cfg.energyThreshold) return null

    return freq
  })

  // baseFrequency = 최빈값(mode), 10Hz tolerance
  const frequencyMap: Record<number, number> = {}
  let maxAmount = 0
  let baseFrequency = 0
  for (const frequency of frequencies) {
    if (!frequency || frequency <= 0) continue
    if (frequency === cfg.maxFrequency) continue
    const rounded = Math.round(frequency * 10) / 10
    frequencyMap[rounded] = (frequencyMap[rounded] || 0) + 1
    if (frequencyMap[rounded] > maxAmount) {
      maxAmount = frequencyMap[rounded]
      baseFrequency = rounded
    }
  }

  const valid = frequencies.filter((f): f is number => !!f && f > 0)
  const minPitch = valid.length > 0 ? Math.min(...valid) : 0
  const maxPitch = valid.length > 0 ? Math.max(...valid) : 0

  // 원본과 동일: averagePitch 는 baseFrequency 로 표기
  return { frequencies, baseFrequency, averagePitch: baseFrequency, minPitch, maxPitch }
}

// 오버레이 캔버스에 피치 곡선(점)을 그림 — 상승=accent-blue, 하강=amber.
export function drawPitchContour(
  canvas: HTMLCanvasElement,
  frequencies: (number | null)[],
  baseFrequency: number,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 캔버스 크기 = frequencies 길이 (원본과 동일, 100% 로 늘려 표시)
  canvas.width = Math.max(1, frequencies.length)
  canvas.height = 100
  canvas.style.width = '100%'
  canvas.style.height = '100px'

  const width = canvas.width
  const height = canvas.height
  ctx.clearRect(0, 0, width, height)
  if (!baseFrequency || baseFrequency <= 0) return

  const pitchUpColor = '#a8cce0' // 상승 — accent-blue
  const pitchDownColor = '#d4a574' // 하강 — amber (score-low)
  const pointSize = 2
  let prevY = 0

  frequencies.forEach((frequency, index) => {
    if (!frequency) return
    // baseFrequency * 2 를 최대값으로 한 Y 위치
    const y = Math.round(height - (frequency / (baseFrequency * 2)) * height)
    ctx.fillStyle = y > prevY ? pitchDownColor : pitchUpColor
    ctx.fillRect(index, y, pointSize, pointSize)
    prevY = y
  })
}
