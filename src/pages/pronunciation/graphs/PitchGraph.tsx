import { useRef } from 'react'
import { GraphCard, useWaveSurfer } from './common'
import type { GraphProps } from './common'
import { detectPitch, drawPitchContour } from './pitch'
import { exportGraphPng } from './exportPng'

// 원본 initPitchWaveform + processPitch(drawPitchContour) 와 동일:
// 배경 파형(cream-muted 0.3 / accent-blue 0.5) 위에 피치 곡선 오버레이.
export default function PitchGraph({ audioUrl, label }: GraphProps) {
  const overlayRef = useRef<HTMLCanvasElement>(null)

  const { containerRef, playing, status, togglePlay } = useWaveSurfer(
    audioUrl,
    () => ({
      height: 100,
      sampleRate: 8000,
      waveColor: 'rgba(181, 169, 143, 0.3)',
      progressColor: 'rgba(168, 204, 224, 0.5)',
      cursorColor: 'rgba(0, 0, 0, 0)',
      interact: false,
      normalize: true,
    }),
    (ws) => {
      const buffer = ws.getDecodedData()
      const canvas = overlayRef.current
      if (!buffer || !canvas) return
      const result = detectPitch(buffer)
      drawPitchContour(canvas, result.frequencies, result.baseFrequency)
    },
  )

  return (
    <GraphCard
      playing={playing}
      status={status}
      onPlayPause={togglePlay}
      onExport={() => exportGraphPng('pitch', audioUrl)}
      label={label}
    >
      <div className="pitch-host">
        <div ref={containerRef} className="ws-host" />
        <canvas ref={overlayRef} className="pitch-overlay" />
      </div>
    </GraphCard>
  )
}
