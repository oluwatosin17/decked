import { useState } from 'react'
import VolumeRegular from '@mingcute/react/core-regular/volume'
import { TimerControl } from '../CharadesGame'
import type { SpellingWord } from '../content/spellingBee'
import { spellingAudioUrl } from '../content/spellingAudio'
import '../read-my-lips.css'
import '../spelling-bee.css'

export default function SpellingWordCard({ word, seconds, remaining, paused = false, onTogglePause, onEndTurn, reader = true, audioUrl, hints }: { word: SpellingWord | null | undefined; seconds: number; remaining: number; paused?: boolean; onTogglePause?: () => void; onEndTurn?: () => void; reader?: boolean; audioUrl?: string | null; hints?: { definition: string; sentence: string } }) {
  const [clue, setClue] = useState<'definition' | 'sentence' | null>(null)
  const [audioError, setAudioError] = useState(false)
  const hearWord = () => {
    const source = audioUrl ?? (word ? spellingAudioUrl(word.word) : null)
    if (!source || typeof window === 'undefined') { setAudioError(true); return }
    try {
      const audio = new Audio(source)
      audio.onerror = () => setAudioError(true)
      void audio.play().catch(() => setAudioError(true))
      setAudioError(false)
    } catch { setAudioError(true) }
  }
  return <article className="rml-prompt-card spelling-turn-card" aria-label={reader ? 'Private word for reader' : 'Spelling turn'}>
    {reader ? <><span>WORD TO SPELL</span><p>{word?.word ?? 'Loading…'}</p></> : <><span>LISTEN & SPELL</span><p>YOU'VE GOT THIS!</p></>}
    <div className="spelling-card-tools"><button type="button" onClick={hearWord} disabled={!audioUrl && !word}><VolumeRegular size={18} aria-hidden="true"/> PLAY WORD</button><button type="button" onClick={() => setClue(clue === 'definition' ? null : 'definition')} disabled={!word && !hints}>DEFINITION</button><button type="button" onClick={() => setClue(clue === 'sentence' ? null : 'sentence')} disabled={!word && !hints}>SENTENCE</button></div>
    {clue && (word || hints) && <small role="status">{clue === 'sentence' ? hints?.sentence ?? word?.sentence.replace(new RegExp(`\\b${word.word}\\b`, 'gi'), '_____') : hints?.definition ?? word?.definition}</small>}{audioError && <small role="alert">Pronunciation unavailable. Try again or ask another player to read the word privately.</small>}
    <div className="spelling-card-timer"><TimerControl timeLeft={remaining} roundLength={seconds} paused={paused} onTogglePause={onTogglePause ?? (() => {})} onCancel={onEndTurn ?? (() => {})} showControls={Boolean(onTogglePause)} cancelLabel="END TURN" /></div>
  </article>
}
