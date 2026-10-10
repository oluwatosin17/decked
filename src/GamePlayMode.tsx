import { GameFooter, GameNav } from './components/GameShell'
import { GameCardPreview } from './components/GameCardGrid'
import { MULTIPLAYER_GAMES } from './multiplayer/gameConfig'
import type { MultiplayerGameId } from './multiplayer/types'
import { track } from './analytics'

interface Props {
  gameId: MultiplayerGameId
  onBack: () => void
  onPassAndPlay: () => void
  onPlayTogether: () => void
}

const optionStyle: React.CSSProperties = {
  minHeight: 112,
  padding: '20px 22px',
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,.10)',
  background: '#070708',
  color: '#fff',
  cursor: 'pointer',
  textAlign: 'left',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: 5,
}

export default function GamePlayMode({ gameId, onBack, onPassAndPlay, onPlayTogether }: Props) {
  const selectPassAndPlay = () => {
    track('play_mode_selected', { game_id: gameId, play_mode: 'pass_and_play' })
    onPassAndPlay()
  }
  const selectPlayTogether = () => {
    track('play_mode_selected', { game_id: gameId, play_mode: 'play_together' })
    onPlayTogether()
  }
  return <div className="game-fullscreen">
    <GameNav onBack={onBack} />
    <main className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '36px 16px 72px' }}>
      <div style={{ width: 'min(520px, 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <GameCardPreview gameId={gameId} />
        <div style={{ textAlign: 'center' }}>
          <h1 className="font-anton" style={{ color: '#fff', fontSize: 34, fontWeight: 400, margin: 0 }}>HOW DO YOU WANT TO PLAY?</h1>
          <p style={{ color: 'rgba(255,255,255,.52)', font: "15px/1.45 'Satoshi', sans-serif", margin: '8px 0 0' }}>{MULTIPLAYER_GAMES[gameId].name}</p>
        </div>
        <div className="play-mode-options" style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button className="game-btn" onClick={selectPassAndPlay} style={optionStyle}>
            <span className="font-anton" style={{ fontSize: 21 }}>PASS &amp; PLAY</span>
            <span style={{ color: 'rgba(255,255,255,.5)', font: "13px/1.4 'Satoshi', sans-serif" }}>Play together on one device.</span>
          </button>
          <button className="game-btn-primary" onClick={selectPlayTogether} style={{ ...optionStyle, background: '#dc2827', borderColor: '#dc2827' }}>
            <span className="font-anton" style={{ fontSize: 21 }}>PLAY TOGETHER</span>
            <span style={{ color: 'rgba(255,255,255,.72)', font: "13px/1.4 'Satoshi', sans-serif" }}>Create or join a room on separate devices.</span>
          </button>
        </div>
      </div>
    </main>
    <GameFooter />
    <style>{`@media(max-width:520px){.play-mode-options{grid-template-columns:1fr!important}}`}</style>
  </div>
}
