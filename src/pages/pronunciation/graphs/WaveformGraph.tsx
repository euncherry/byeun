import { useEffect } from 'react'
import { GraphCard, useWaveSurfer } from './common'
import type { GraphProps } from './common'
import { exportGraphPng } from './exportPng'
import type { GraphColors } from './colors'

// 원본 initWaveform 와 동일 + 색상은 props 로 받아 런타임 편집
export default function WaveformGraph({
  audioUrl,
  label,
  colors,
}: GraphProps & { colors: GraphColors }) {
  const { containerRef, wsRef, playing, status, togglePlay } = useWaveSurfer(audioUrl, () => ({
    height: 100,
    sampleRate: 8000,
    waveColor: colors.waveformWave,
    progressColor: colors.waveformProgress,
    cursorColor: colors.waveformProgress,
    barWidth: 2,
    barGap: 1,
    barRadius: 2,
    interact: true,
    normalize: true,
  }))

  // 색상 변경 즉시 반영 (재디코드 없이 setOptions)
  useEffect(() => {
    wsRef.current?.setOptions({
      waveColor: colors.waveformWave,
      progressColor: colors.waveformProgress,
      cursorColor: colors.waveformProgress,
    })
  }, [colors.waveformWave, colors.waveformProgress, wsRef])

  return (
    <GraphCard
      playing={playing}
      status={status}
      onPlayPause={togglePlay}
      onExport={() => exportGraphPng('waveform', audioUrl, colors)}
      label={label}
    >
      <div ref={containerRef} className="ws-host" />
    </GraphCard>
  )
}
