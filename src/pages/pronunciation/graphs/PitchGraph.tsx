import { useEffect, useRef } from 'react'
import { GraphCard, useWaveSurfer } from './common'
import type { GraphProps } from './common'
import { detectPitch, drawPitchContour } from './pitch'
import { exportGraphPng } from './exportPng'
import { withAlpha } from './colors'
import type { GraphColors } from './colors'

// 배경 파형 + 피치 곡선 오버레이. 색상은 props 로 받아 런타임 편집.
export default function PitchGraph({
  audioUrl,
  label,
  colors,
}: GraphProps & { colors: GraphColors }) {
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const dataRef = useRef<{ frequencies: (number | null)[]; baseFrequency: number } | null>(null)

  const { containerRef, wsRef, playing, status, togglePlay } = useWaveSurfer(
    audioUrl,
    () => ({
      height: 100,
      sampleRate: 8000,
      waveColor: withAlpha(colors.pitchBgWave, 0.3),
      progressColor: withAlpha(colors.pitchBgProgress, 0.5),
      cursorColor: 'rgba(0, 0, 0, 0)',
      interact: false,
      normalize: true,
    }),
    (ws) => {
      const buffer = ws.getDecodedData()
      if (!buffer) return
      const result = detectPitch(buffer)
      dataRef.current = { frequencies: result.frequencies, baseFrequency: result.baseFrequency }
      if (overlayRef.current) {
        drawPitchContour(
          overlayRef.current,
          result.frequencies,
          result.baseFrequency,
          colors.pitchUp,
          colors.pitchDown,
        )
      }
    },
  )

  // 배경 파형 색 변경 반영
  useEffect(() => {
    wsRef.current?.setOptions({
      waveColor: withAlpha(colors.pitchBgWave, 0.3),
      progressColor: withAlpha(colors.pitchBgProgress, 0.5),
    })
  }, [colors.pitchBgWave, colors.pitchBgProgress, wsRef])

  // 피치 곡선 색 변경 시 다시 그림 (재분석 없이)
  useEffect(() => {
    const d = dataRef.current
    if (d && overlayRef.current) {
      drawPitchContour(
        overlayRef.current,
        d.frequencies,
        d.baseFrequency,
        colors.pitchUp,
        colors.pitchDown,
      )
    }
  }, [colors.pitchUp, colors.pitchDown])

  return (
    <GraphCard
      playing={playing}
      status={status}
      onPlayPause={togglePlay}
      onExport={() => exportGraphPng('pitch', audioUrl, colors)}
      label={label}
    >
      <div className="pitch-host">
        <div ref={containerRef} className="ws-host" />
        <canvas ref={overlayRef} className="pitch-overlay" />
      </div>
    </GraphCard>
  )
}
