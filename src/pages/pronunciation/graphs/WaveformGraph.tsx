import { GraphCard, useWaveSurfer } from './common'
import type { GraphProps } from './common'

// 원본 initWaveform("waveform-user", "rgb(181,169,143)", "rgb(168,204,224)") 와 동일
export default function WaveformGraph({ audioUrl, onPickFile, label }: GraphProps) {
  const { containerRef, playing, status, togglePlay } = useWaveSurfer(audioUrl, () => ({
    height: 100,
    sampleRate: 8000,
    waveColor: 'rgb(181, 169, 143)',
    progressColor: 'rgb(168, 204, 224)',
    cursorColor: 'rgb(168, 204, 224)',
    barWidth: 2,
    barGap: 1,
    barRadius: 2,
    interact: true,
    normalize: true,
  }))

  return (
    <GraphCard
      playing={playing}
      status={status}
      onPlayPause={togglePlay}
      onPickFile={onPickFile}
      label={label}
    >
      <div ref={containerRef} className="ws-host" />
    </GraphCard>
  )
}
