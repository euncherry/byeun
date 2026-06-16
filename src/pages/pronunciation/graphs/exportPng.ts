// 각 그래프를 고해상도 PNG로 내보내기.
// 화면 캔버스는 보통 1~2배(DPR)라 저해상도일 수 있어, 내보낼 때만
// 오프스크린에서 큰 사이즈로 다시 렌더링한 뒤 추출한다. (무손실 PNG)
import WaveSurfer from 'wavesurfer.js'
import Spectrogram from 'wavesurfer.js/dist/plugins/spectrogram.esm.js'
import { ROSEUS_COLORMAP } from './roseus'
import { detectPitch } from './pitch'
import { DEFAULT_COLORS, withAlpha } from './colors'
import type { GraphColors } from './colors'

export type GraphKind = 'waveform' | 'pitch' | 'spectrogram'

// ⚠️ 비율(PX_PER_SEC : GRAPH_HEIGHT)은 앱 src/features/pronunciation/utils/graphLayout.ts와
//    반드시 일치해야 함 — 앱이 PNG 종횡비로 px/초를 역산한다. RENDER는 선명도용 배율(종횡비 불변).
const PX_PER_SEC = 220
const GRAPH_HEIGHT = 100
const RENDER = 2
const PXPS = PX_PER_SEC * RENDER // minPxPerSec — 그래프 폭 = duration × 이 값
const EXPORT_HEIGHT = GRAPH_HEIGHT * RENDER // 그래프 높이(px)
const HOST_WIDTH = 8000 // 오프스크린 호스트 폭 — 긴 클립도 단일 캔버스로 export
// 배경은 투명(PNG 알파)으로 둠. 다크 배경이 필요하면 아래에서 ctx 로 칠하면 됩니다.
// (스펙트로그램은 컬러맵이 전 픽셀을 채우는 불투명 이미지라 투명이 적용되지 않음)

function makeHost(): HTMLDivElement {
  const host = document.createElement('div')
  host.style.cssText =
    'position:fixed;left:-100000px;top:0;pointer-events:none;opacity:0;width:' +
    HOST_WIDTH +
    'px;'
  document.body.appendChild(host)
  return host
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function onceReady(ws: WaveSurfer): Promise<void> {
  return new Promise((resolve, reject) => {
    ws.on('ready', () => resolve())
    ws.on('error', (e) => reject(e instanceof Error ? e : new Error(String(e))))
  })
}

function frame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
      resolve()
    }, 'image/png')
  })
}

// 피치 곡선을 고해상도 캔버스에 그림 (drawPitchContour 의 스케일 버전)
function drawPitchHiRes(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frequencies: (number | null)[],
  baseFrequency: number,
  upColor = '#a8cce0',
  downColor = '#d4a574',
) {
  if (!baseFrequency || baseFrequency <= 0) return
  const n = frequencies.length || 1
  const sx = width / n
  // 점 두께(세로) + 길이(가로). 길이를 점 간격(sx)만큼 빼서 점들이 끊기지 않고
  // 이어진 선처럼 보이게 한다. 더 길게 원하면 DOT_LEN_MULT를 키우면 됨.
  const DOT_LEN_MULT = 1.6 // 점 가로 길이 배수 (간격 대비)
  const dotThickness = Math.max(2, Math.round(width / 600))
  const dotLength = Math.max(dotThickness, Math.ceil(sx * DOT_LEN_MULT))
  let prevY = 0
  frequencies.forEach((f, i) => {
    if (!f) return
    const y = Math.round(height - (f / (baseFrequency * 2)) * height)
    ctx.fillStyle = y > prevY ? downColor : upColor
    ctx.fillRect(Math.round(i * sx), y, dotLength, dotThickness)
    prevY = y
  })
}

export async function exportGraphPng(
  kind: GraphKind,
  audioUrl: string,
  colors: GraphColors = DEFAULT_COLORS,
): Promise<void> {
  const host = makeHost()
  let ws: WaveSurfer | undefined
  try {
    const out = document.createElement('canvas')
    const ctx = out.getContext('2d')
    if (!ctx) return

    if (kind === 'waveform') {
      ws = WaveSurfer.create({
        container: host,
        height: EXPORT_HEIGHT,
        sampleRate: 8000,
        minPxPerSec: PXPS,
        fillParent: false,
        waveColor: colors.waveformWave,
        progressColor: colors.waveformWave,
        cursorColor: 'rgba(0, 0, 0, 0)',
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        interact: false,
        normalize: true,
        url: audioUrl,
      })
      await onceReady(ws)
      const urls = (await ws.exportImage('image/png', 1, 'dataURL')) as string[]
      const img = await loadImage(urls[0])
      out.width = img.naturalWidth
      out.height = img.naturalHeight
      ctx.drawImage(img, 0, 0)
      await downloadCanvas(out, 'waveform.png')
    } else if (kind === 'pitch') {
      ws = WaveSurfer.create({
        container: host,
        height: EXPORT_HEIGHT,
        sampleRate: 8000,
        minPxPerSec: PXPS,
        fillParent: false,
        waveColor: withAlpha(colors.pitchBgWave, 0.3),
        progressColor: withAlpha(colors.pitchBgWave, 0.3),
        cursorColor: 'rgba(0, 0, 0, 0)',
        interact: false,
        normalize: true,
        url: audioUrl,
      })
      await onceReady(ws)
      const buffer = ws.getDecodedData()
      const urls = (await ws.exportImage('image/png', 1, 'dataURL')) as string[]
      const img = await loadImage(urls[0])
      out.width = img.naturalWidth
      out.height = img.naturalHeight
      ctx.drawImage(img, 0, 0) // 흐린 배경 파형
      if (buffer) {
        const { frequencies, baseFrequency } = detectPitch(buffer)
        drawPitchHiRes(
          ctx,
          out.width,
          out.height,
          frequencies,
          baseFrequency,
          colors.pitchUp,
          colors.pitchDown,
        )
      }
      await downloadCanvas(out, 'pitch.png')
    } else {
      // spectrogram
      const specHost = document.createElement('div')
      host.appendChild(specHost)
      const spec = Spectrogram.create({
        container: specHost,
        fftSamples: 512,
        height: EXPORT_HEIGHT,
        windowFunc: 'hann',
        scale: 'mel',
        colorMap: ROSEUS_COLORMAP,
        gainDB: 25,
        rangeDB: 80,
        frequencyMin: 0,
        frequencyMax: 4000,
        labels: false,
      })
      ws = WaveSurfer.create({
        container: host,
        height: 1,
        sampleRate: 8000,
        minPxPerSec: PXPS,
        fillParent: false,
        waveColor: 'rgba(0, 0, 0, 0)',
        progressColor: 'rgba(0, 0, 0, 0)',
        cursorColor: 'rgba(0, 0, 0, 0)',
        interact: false,
        url: audioUrl,
        plugins: [spec],
      })
      await onceReady(ws)
      // 스펙트로그램 플러그인 렌더 완료 대기
      await new Promise<void>((resolve) => {
        let done = false
        const finish = () => {
          if (!done) {
            done = true
            resolve()
          }
        }
        spec.on('ready', finish)
        setTimeout(finish, 5000)
      })
      await frame()
      const canvases = (
        Array.from(specHost.querySelectorAll('canvas')) as HTMLCanvasElement[]
      ).filter((c) => c.width > 0 && c.height > 0)
      const w = canvases.length ? Math.max(...canvases.map((c) => c.width)) : HOST_WIDTH
      const h = canvases.length ? Math.max(...canvases.map((c) => c.height)) : EXPORT_HEIGHT
      out.width = w
      out.height = h
      for (const c of canvases) ctx.drawImage(c, 0, 0)
      await downloadCanvas(out, 'spectrogram.png')
    }
  } finally {
    try {
      ws?.destroy()
    } catch {
      /* ignore */
    }
    host.remove()
  }
}
