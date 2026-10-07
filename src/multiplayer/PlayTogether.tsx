import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GameFooter, GameNav } from '../components/GameShell'
import { BrowseCardGrid, GameCardPreview } from '../components/GameCardGrid'
import { useScaledCard } from '../hooks/useCardScale'
import { DARE_DECK, TRUTH_DECK } from '../TruthOrDareGame'
import { IntroCard as SpicyIntroCard, SpicyCard } from '../SpicyStartersGame'
import { IveDoneItScreen, NHIECard } from '../NeverHaveIEverGame'
import type { Player as LocalPlayer } from '../components/PlayerSetup'
import { LNTCard } from '../LateNightTalksGame'
import { DTCCard } from '../DinnerTableGame'
import { IcebreakerCard } from '../IcebreakerGame'
import { ECCard } from '../EverydayConversationsGame'
import { ReconnectCard } from '../LetsReconnectGame'
import { RedFlagGreenFlagCard, VoteButtons } from '../RedFlagGreenFlagGame'
import { CharadesCard } from '../CharadesGame'
import TruthOrDareGame from '../TruthOrDareGame'
import SpicyStartersGame from '../SpicyStartersGame'
import NeverHaveIEverGame from '../NeverHaveIEverGame'
import LateNightTalksGame from '../LateNightTalksGame'
import DinnerTableGame from '../DinnerTableGame'
import IcebreakerGame from '../IcebreakerGame'
import EverydayConversationsGame from '../EverydayConversationsGame'
import LetsReconnectGame from '../LetsReconnectGame'
import RedFlagGreenFlagGame from '../RedFlagGreenFlagGame'
import CharadesGame from '../CharadesGame'
import WNRSGame from '../WNRSGame'
import PutAFingerDownGame from '../PutAFingerDownGame'
import TakeASipGame from '../TakeASipGame'
import SipOrSpillGame from '../SipOrSpillGame'
import LaughYouAreOutGame from '../LaughYouAreOutGame'
import DoOrDrinkGame from '../DoOrDrinkGame'
import TwoTruthsBluffGame from '../TwoTruthsBluffGame'
import MostLikelyToGame from '../MostLikelyToGame'
import ChooseYourSideGame from '../ChooseYourSideGame'
import WhoSaidThatGame from '../WhoSaidThatGame'
import { claimHost, clearRematchRequests, createRoom, endRoom, getCharadesPrompt, getRoom, joinRoom, leaveRoom, requestRematch, setCharadesDeck, setSessionValue, startMultiGame, touchRoom } from './roomApi'
import { ensureAnonymousUser, multiplayerConfigured, supabase } from './supabase'
import { MULTIPLAYER_GAMES } from './gameConfig'
import type { MultiplayerAnswer, MultiplayerGameId, MultiplayerPlayer, MultiplayerRoom, PromptType } from './types'
import { SharedSessionProvider } from './SessionStateContext'

const PLAYER_COLORS = ['#dc2827', '#9b59b6', '#27ae60', '#e67e22', '#3498db', '#e91e63']
const HEART_GAME = 'https://res.cloudinary.com/oluwatosin17/image/upload/decked/game-assets/heart-filled.svg'

function Panel({ children, narrow = false }: { children: React.ReactNode; narrow?: boolean }) {
  return (
    <div className="screen-enter multiplayer-panel" style={{
      width: narrow ? 'min(420px, calc(100vw - 32px))' : 'min(560px, calc(100vw - 32px))',
      borderRadius: '20px', padding: '24px', boxSizing: 'border-box',
      background: '#070708', border: '1px dashed rgba(255, 255, 255, 0.10)',
      boxShadow: '0 24px 80px rgba(0,0,0,0.38)',
    }}>{children}</div>
  )
}

const headingStyle: React.CSSProperties = { fontFamily: "'Anton SC', sans-serif", color: '#fff', fontSize: '34px', fontWeight: 400, margin: 0, textAlign: 'center' }
const bodyStyle: React.CSSProperties = { fontFamily: "'Satoshi', sans-serif", color: 'rgba(255,255,255,0.58)', fontSize: '15px', lineHeight: 1.45, margin: 0, textAlign: 'center' }
const inputStyle: React.CSSProperties = { width: '100%', height: '52px', padding: '0 16px', boxSizing: 'border-box', borderRadius: '12px', border: '1px dashed rgba(255, 255, 255, 0.10)', background: '#070708', color: '#fff', outline: 'none', fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '16px' }

function PrimaryButton({ children, onClick, disabled = false }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button className="font-staatliches game-btn" onClick={onClick} disabled={disabled} style={{ height: '48px', padding: '0 22px', borderRadius: '999px', border: 0, background: disabled ? '#555' : '#e8292d', color: '#fff', fontSize: '16px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}>{children}</button>
}

function Entry({ onCreate, onJoin, busy, error }: {
  onCreate: (name: string, gameId: MultiplayerGameId) => void; onJoin: (code: string, name: string) => void; busy: boolean; error: string
}) {
  const inviteCode = new URL(window.location.href).searchParams.get('code')?.trim().toUpperCase() ?? ''
  const openedFromInvite = inviteCode.length === 6
  const [mode, setMode] = useState<'game' | 'actions' | 'create' | 'join'>(() => openedFromInvite ? 'join' : 'game')
  const [gameId, setGameId] = useState<MultiplayerGameId>('truth-or-dare')
  const [name, setName] = useState('')
  const [code, setCode] = useState(inviteCode)

  const selectGame = (id: MultiplayerGameId) => { setGameId(id); setMode('actions') }
  if (mode === 'game') return <div className="screen-enter browse-content" style={{ width: 'min(1320px, calc(100vw - 32px))' }}>
    <BrowseCardGrid
      filter="all"
      onPlayTruthOrDare={() => selectGame('truth-or-dare')}
      onPlaySpicyStarters={() => selectGame('spicy-starters')}
      onPlayLateNightTalks={() => selectGame('late-night-talks')}
      onPlayDinnerTable={() => selectGame('dinner-table')}
      onPlayNeverHaveIEver={() => selectGame('never-have-i-ever')}
      onPlayCharades={() => selectGame('charades')}
      onPlayReconnect={() => selectGame('reconnect')}
      onPlayEveryday={() => selectGame('everyday-conversation')}
      onPlayIcebreaker={() => selectGame('icebreaker')}
      onPlayRedFlagGreenFlag={() => selectGame('red-flag-green-flag')}
      onPlayWNRS={() => selectGame('strangers')}
      onPlayFingerDown={() => selectGame('finger-down')}
      onPlayTakeASip={() => selectGame('take-a-sip')}
      onPlaySipOrSpill={() => selectGame('sip-or-spill')}
      onPlayYouLaugh={() => selectGame('you-laugh')}
      onPlayDoOrDrink={() => selectGame('do-or-drink')}
      onPlayTwoTruthsBluff={() => selectGame('two-truths-bluff')}
      onPlayMostLikelyTo={() => selectGame('most-likely-to')}
      onPlayChooseYourSide={() => selectGame('choose-your-side')}
      onPlayWhoSaidThat={() => selectGame('who-said-that')}
    />
  </div>

  return <Panel narrow>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', alignItems: 'stretch' }}>
      {mode === 'actions' ? <>
        <h1 className="visually-hidden">{MULTIPLAYER_GAMES[gameId].name}</h1>
        <GameCardPreview gameId={gameId} />
        <PrimaryButton onClick={() => setMode('create')}>CREATE A GAME</PrimaryButton>
        <button className="font-staatliches game-btn" onClick={() => setMode('join')} style={{ height: '48px', borderRadius: '999px', border: '1px solid #fff', background: 'transparent', color: '#fff', fontSize: '16px', cursor: 'pointer' }}>JOIN A GAME</button>
        <button onClick={() => setMode('game')} style={{ background: 'none', border: 0, color: 'rgba(255,255,255,0.55)', fontFamily: "'Satoshi', sans-serif", cursor: 'pointer' }}>Go back</button>
      </> : <>
        <input autoFocus aria-label="Your display name" style={inputStyle} value={name} onChange={event => setName(event.target.value)} maxLength={24} placeholder="Your name" />
        {mode === 'join' && <input aria-label="Room code" style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '0.16em' }} value={code} onChange={event => setCode(event.target.value.toUpperCase())} maxLength={6} placeholder="ROOM CODE" />}
        {error && <p role="alert" style={{ ...bodyStyle, color: '#ff7c82' }}>{error}</p>}
        <PrimaryButton disabled={busy || !name.trim() || (mode === 'join' && code.trim().length !== 6)} onClick={() => mode === 'create' ? onCreate(name, gameId) : onJoin(code, name)}>{busy ? 'CONNECTING…' : mode === 'create' ? 'CREATE ROOM' : 'JOIN ROOM'}</PrimaryButton>
        <button onClick={() => setMode(openedFromInvite ? 'game' : 'actions')} style={{ background: 'none', border: 0, color: 'rgba(255,255,255,0.55)', fontFamily: "'Satoshi', sans-serif", cursor: 'pointer' }}>Go back</button>
      </>}
    </div>
  </Panel>
}

function PlayerList({ players, currentUserId }: { players: MultiplayerPlayer[]; currentUserId: string }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{players.map((player, index) => <div key={player.id} style={{ minHeight: '56px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '12px', background: '#070708', border: '1px dashed rgba(255, 255, 255, 0.10)', borderRadius: '12px', boxSizing: 'border-box' }}>
    <span style={{ width: '34px', height: '34px', borderRadius: '50%', background: player.color || PLAYER_COLORS[index % PLAYER_COLORS.length], border: '2px solid #fff', flexShrink: 0 }} />
    <span className="font-anton" style={{ color: '#fff', fontSize: '17px' }}>{player.display_name}</span>
    <span className="font-staatliches" style={{ color: 'rgba(255,255,255,0.42)', fontSize: '13px', marginLeft: 'auto' }}>{index === 0 ? 'HOST' : player.user_id === currentUserId ? 'YOU' : 'CONNECTED'}</span>
  </div>)}</div>
}

function ExitRoomButton({ isHost, busy, onExit }: { isHost: boolean; busy: boolean; onExit: () => void }) {
  const [confirming, setConfirming] = useState(false)
  if (!confirming) return <button onClick={() => setConfirming(true)} disabled={busy} className="game-btn" style={{ border: 0, background: 'none', color: 'rgba(255,255,255,0.5)', fontFamily: "'Staatliches', sans-serif", fontSize: '14px', cursor: 'pointer' }}>{isHost ? 'END ROOM' : 'LEAVE ROOM'}</button>
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
    <p style={{ ...bodyStyle, fontSize: '13px' }}>{isHost ? 'End this room for everyone?' : 'Leave this room?'}</p>
    <div style={{ display: 'flex', gap: '8px' }}>
      <button onClick={() => setConfirming(false)} className="game-btn" style={{ border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '9px 18px', color: '#fff', fontFamily: "'Staatliches', sans-serif" }}>CANCEL</button>
      <button onClick={onExit} disabled={busy} className="game-btn-primary" style={{ border: 0, background: '#dc2827', borderRadius: '999px', padding: '9px 18px', color: '#fff', fontFamily: "'Staatliches', sans-serif" }}>{isHost ? 'END ROOM' : 'LEAVE'}</button>
    </div>
  </div>
}

function Lobby({ room, players, currentUserId, onStart, onExit, busy, onlineCount }: { room: MultiplayerRoom; players: MultiplayerPlayer[]; currentUserId: string; onStart: () => void; onExit: () => void; busy: boolean; onlineCount: number }) {
  const shareUrl = `${window.location.origin}/play-together?code=${room.code}`
  const isHost = room.host_user_id === currentUserId
  const copyInvite = async () => { await navigator.clipboard.writeText(`Join my DECKED game: ${shareUrl}\nRoom code: ${room.code}`) }
  return <Panel>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <h1 className="visually-hidden">{MULTIPLAYER_GAMES[room.game_id].name}</h1>
        <GameCardPreview gameId={room.game_id} />
        <p style={bodyStyle}>ROOM {room.code} · {onlineCount} online</p>
      </div>
      <button onClick={copyInvite} className="font-staatliches game-btn" style={{ height: '44px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '15px', cursor: 'pointer' }}>COPY INVITE LINK</button>
      <PlayerList players={players} currentUserId={currentUserId} />
      {isHost ? <>
        <PrimaryButton disabled={busy || players.length < 2} onClick={onStart}>{players.length < 2 ? 'WAITING FOR A PLAYER' : 'SET UP GAME'}</PrimaryButton>
      </> : <p style={{ ...bodyStyle, padding: '10px 0' }}>Waiting for the host to start the game…</p>}
      <ExitRoomButton isHost={isHost} busy={busy} onExit={onExit} />
    </div>
  </Panel>
}

function ExistingGameCard({ room, prompt, revealed, canReveal, onReveal }: { room: MultiplayerRoom; prompt: unknown; revealed: boolean; canReveal: boolean; onReveal: () => void }) {
  const text = typeof prompt === 'string' ? prompt : ''
  switch (room.game_id) {
    case 'spicy-starters': return revealed ? <SpicyCard question={text} flipPhase="idle" /> : <SpicyIntroCard firstQuestion="" onTap={canReveal ? onReveal : () => {}} />
    case 'never-have-i-ever': return <NHIECard prompt={text} flipped={revealed} onFlip={canReveal ? onReveal : () => {}} />
    case 'late-night-talks': return <LNTCard question={text} flipped={revealed} onFlip={canReveal ? onReveal : () => {}} />
    case 'dinner-table': return <DTCCard question={text} flipped={revealed} onFlip={canReveal ? onReveal : () => {}} />
    case 'icebreaker': return <IcebreakerCard question={(prompt ?? { category: 'FUN', text: '' }) as { category: 'DEEP' | 'FUN' | 'REFLECTIVE' | 'SOCIAL' | 'CREATIVE'; text: string }} flipped={revealed} onTap={canReveal ? onReveal : () => {}} />
    case 'everyday-conversation': return <ECCard question={text} flipped={revealed} onFlip={canReveal ? onReveal : () => {}} />
    case 'reconnect': return <ReconnectCard question={text} flipped={revealed} onFlip={canReveal ? onReveal : () => {}} />
    case 'red-flag-green-flag': return <RedFlagGreenFlagCard scenario={text} flipped={revealed} onFlip={canReveal ? onReveal : () => {}} />
    case 'charades': return <CharadesCard prompt={text} flipped={revealed} onFlip={canReveal ? onReveal : () => {}} />
  }
}

function MultiGame({ room, players, currentUserId, onReveal, onAnswer, onNext, onNewRoom, onExit, busy }: { room: MultiplayerRoom; players: MultiplayerPlayer[]; currentUserId: string; onReveal: () => void; onAnswer: (answer: MultiplayerAnswer) => void; onNext: () => void; onNewRoom: () => void; onExit: () => void; busy: boolean }) {
  const config = MULTIPLAYER_GAMES[room.game_id]
  const current = players[room.current_player_index % Math.max(players.length, 1)]
  const isTurn = current?.user_id === currentUserId
  const isHost = room.host_user_id === currentUserId
  const revealed = room.game_state?.revealed === true
  const prompt = room.prompt_index == null ? '' : config.deck[room.prompt_index] ?? ''
  const answers = room.game_state?.answers ?? {}
  const myAnswer = answers[currentUserId]
  const allAnswered = Object.keys(answers).length >= players.length
  const canControl = isTurn || isHost

  if (room.status === 'finished') return <div className="screen-enter" style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '22px', padding: '40px 20px', textAlign: 'center' }}>
    <h1 style={headingStyle}>YOU'RE DECKED</h1>
    <p style={bodyStyle}>You played all {room.total_cards} {config.name} cards together.</p>
    {config.kind === 'score' ? <PlayerList players={[...players].sort((a, b) => b.score - a.score)} currentUserId={currentUserId} /> : null}
    <div style={{ display: 'flex', gap: '10px' }}><button className="game-btn" onClick={onExit} style={{ border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 22px', color: '#fff', fontFamily: "'Staatliches', sans-serif" }}>{isHost ? 'END ROOM' : 'LEAVE ROOM'}</button><PrimaryButton onClick={onNewRoom}>PLAY AGAIN</PrimaryButton></div>
  </div>

  return <div className="screen-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '22px', padding: '28px 20px 56px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ width: 28, height: 28, borderRadius: '50%', background: current?.color, border: '2px solid #fff' }} /><span className="font-anton" style={{ color: '#fff', fontSize: '17px' }}>{current?.display_name.toUpperCase()}'S TURN</span></div>
    <ExistingGameCard room={room} prompt={prompt} revealed={revealed} canReveal={!revealed && canControl && !busy} onReveal={onReveal} />
    {revealed && config.kind === 'score' && !myAnswer ? <div style={{ width: '100%', maxWidth: 520 }}><IveDoneItScreen players={[{ name: players.find(player => player.user_id === currentUserId)?.display_name ?? 'You', color: players.find(player => player.user_id === currentUserId)?.color ?? '#dc2827' } satisfies LocalPlayer]} onNext={selected => onAnswer(selected.includes(0) ? 'have' : 'never')} /></div> : null}
    {revealed && config.kind === 'vote' && !myAnswer ? <VoteButtons onVote={vote => onAnswer(vote)} /> : null}
    {revealed && (config.kind === 'score' || config.kind === 'vote') ? <p style={bodyStyle}>{Object.keys(answers).length} of {players.length} answered{allAnswered ? ' · Ready to continue' : ''}</p> : null}
    {revealed && canControl ? <PrimaryButton disabled={busy || ((config.kind === 'score' || config.kind === 'vote') && !allAnswered)} onClick={onNext}>NEXT</PrimaryButton> : null}
    <div className="font-staatliches" style={{ color: 'rgba(255,255,255,.35)', letterSpacing: '.12em' }}>CARD {room.card_index + 1} OF {room.total_cards}</div>
    <ExitRoomButton isHost={isHost} busy={busy} onExit={onExit} />
  </div>
}

function RemoteGame({ room, players, currentUserId, onChoose, onNext, onNewRoom, onExit, busy }: { room: MultiplayerRoom; players: MultiplayerPlayer[]; currentUserId: string; onChoose: (type: PromptType) => void; onNext: () => void; onNewRoom: () => void; onExit: () => void; busy: boolean }) {
  const current = players[room.current_player_index % Math.max(players.length, 1)]
  const isTurn = current?.user_id === currentUserId
  const isHost = room.host_user_id === currentUserId
  const prompt = room.prompt_type === 'truth' ? TRUTH_DECK[room.prompt_index ?? 0] : room.prompt_type === 'dare' ? DARE_DECK[room.prompt_index ?? 0] : null
  const { wrapperStyle: splitWrapperStyle, cardStyle: splitCardStyle } = useScaledCard(454, 457)
  const { wrapperStyle: revealWrapperStyle, cardStyle: revealCardStyle } = useScaledCard(454, 400)

  if (room.status === 'finished') return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px', padding: '40px', textAlign: 'center' }}><h1 style={headingStyle}>YOU'RE DECKED</h1><p style={bodyStyle}>You played all {room.total_cards} Truth or Dare cards together.</p><div style={{ display: 'flex', gap: '8px' }}><button className="game-btn" onClick={onExit} style={{ border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 24px', color: '#fff', fontFamily: "'Staatliches', sans-serif" }}>END ROOM</button><PrimaryButton onClick={onNewRoom}>PLAY AGAIN</PrimaryButton></div></div>

  if (!room.prompt_type) return <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '30px', padding: '40px 40px 60px', position: 'relative' }}>
    <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '28px', height: '28px', borderRadius: '50%', background: current?.color, border: '2px solid rgba(255,255,255,0.2)' }} /><span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.65)' }}>{current?.display_name.toUpperCase()}'S TURN</span></div>
    <div style={splitWrapperStyle}><div className="tod-split-card tod-card-enter game-card" style={{ ...splitCardStyle, position: 'relative', zIndex: 2, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(220,40,39,0.35)' }}>
      <button disabled={!isTurn || busy} aria-label="Choose Truth" className="tod-truth-half" onClick={() => onChoose('truth')} style={{ position: 'absolute', inset: '0 0 auto', height: '228.5px', border: 0, background: '#e9b1ba', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isTurn ? 'pointer' : 'default' }}><span className="tod-half-label" style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '36px', color: '#dd2a25' }}>TRUTH</span></button>
      <button disabled={!isTurn || busy} aria-label="Choose Dare" className="tod-dare-half" onClick={() => onChoose('dare')} style={{ position: 'absolute', inset: 'auto 0 0', height: '228.5px', border: 0, background: '#dd2a25', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isTurn ? 'pointer' : 'default' }}><span className="tod-half-label" style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '36px', color: '#e9b1ba' }}>DARE</span></button>
      <div className="tod-hearts" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', display: 'flex', gap: '5px', zIndex: 3, pointerEvents: 'none' }}><img src={HEART_GAME} alt="" style={{ width: '32px', height: '32px' }} /><img src={HEART_GAME} alt="" style={{ width: '32px', height: '32px', transform: 'scaleY(-1)' }} /></div>
    </div></div>
    {!isTurn ? <p style={bodyStyle}>Waiting for {current?.display_name} to choose Truth or Dare…</p> : null}
    <div className="counter-in" style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em' }}>CARD {room.card_index + 1} OF {room.total_cards}</div>
    <ExitRoomButton isHost={isHost} busy={busy} onExit={onExit} />
  </div>

  const isTruth = room.prompt_type === 'truth'
  const cardBg = isTruth ? '#f7b8bc' : '#dc2827'
  const cardText = isTruth ? '#dc2827' : '#f7b8bc'
  return <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 40px 60px', gap: '24px', position: 'relative' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '28px', height: '28px', borderRadius: '50%', background: current?.color, border: '2px solid rgba(255,255,255,0.2)' }} /><span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.65)' }}>{current?.display_name.toUpperCase()}'S TURN</span></div>
    <div style={revealWrapperStyle}><div className="tod-card-enter game-card" style={{ ...revealCardStyle, position: 'relative', background: cardBg, borderRadius: '20px', minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '52px 48px 44px', gap: '24px', boxShadow: `0 32px 80px ${isTruth ? 'rgba(247,100,100,0.25)' : 'rgba(220,40,39,0.45)'}` }}><div style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '13px', letterSpacing: '0.18em', color: cardText, opacity: 0.65 }}>— {room.prompt_type.toUpperCase()} —</div><p style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '28px', color: cardText, textAlign: 'center', textTransform: 'uppercase', lineHeight: 1.2, margin: 0 }}>{prompt}</p><img src={HEART_GAME} alt="" style={{ width: '36px', height: '36px', opacity: 0.85 }} /></div></div>
    {(isTurn || isHost) ? <button className="game-btn-primary" disabled={busy} onClick={onNext} style={{ width: '196px', background: '#dc2827', border: 0, borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff' }}>NEXT</button> : <p style={bodyStyle}>Waiting for {current?.display_name}…</p>}
    <div className="counter-in" style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em' }}>CARD {room.card_index + 1} OF {room.total_cards}</div>
    <ExitRoomButton isHost={isHost} busy={busy} onExit={onExit} />
  </div>
}

const SESSION_GAME_IDS: Record<MultiplayerGameId, string> = {
  'truth-or-dare': 'truth-or-dare',
  'spicy-starters': 'spicy-starters',
  'never-have-i-ever': 'never-have-i-ever',
  'late-night-talks': 'late-night-talks',
  'dinner-table': 'dinner-table',
  'icebreaker': 'icebreaker',
  'everyday-conversation': 'everyday-conversations',
  'reconnect': 'lets-reconnect',
  'red-flag-green-flag': 'red-flag-green-flag',
  'charades': 'charades',
  'strangers': 'wnrs',
  'finger-down': 'put-a-finger-down',
  'take-a-sip': 'take-a-sip',
  'sip-or-spill': 'sip-or-spill',
  'you-laugh': 'you-laugh',
  'do-or-drink': 'do-or-drink',
  'two-truths-bluff': 'two-truths-bluff',
  'most-likely-to': 'most-likely-to',
  'choose-your-side': 'choose-your-side',
  'who-said-that': 'who-said-that',
}

const INITIAL_STEPS: Record<MultiplayerGameId, string> = {
  'truth-or-dare': 'ageGate',
  'spicy-starters': 'ageGate',
  'never-have-i-ever': 'modeSelect',
  'late-night-talks': 'deckSize',
  'dinner-table': 'deckSize',
  'icebreaker': 'playMode',
  'everyday-conversation': 'theme',
  'reconnect': 'relationship',
  'red-flag-green-flag': 'deckSize',
  'charades': 'teamBuilder',
  'strangers': 'relationship',
  'finger-down': 'categories',
  'take-a-sip': 'categories',
  'sip-or-spill': 'categories',
  'you-laugh': 'roundLength',
  'do-or-drink': 'categories',
  'two-truths-bluff': 'write',
  'most-likely-to': 'categories',
  'choose-your-side': 'categories',
  'who-said-that': 'deckSize',
}

const PLAYER_SETUP_NEXT_STEPS: Record<MultiplayerGameId, string> = {
  'truth-or-dare': 'deckSize',
  'spicy-starters': 'deckSize',
  'never-have-i-ever': 'modeSelect',
  'late-night-talks': 'deckSize',
  'dinner-table': 'deckSize',
  'icebreaker': 'deckSize',
  'everyday-conversation': 'deckSize',
  'reconnect': 'depth',
  'red-flag-green-flag': 'deckSize',
  'charades': 'teamBuilder',
  'strangers': 'journey',
  'finger-down': 'fingers',
  'take-a-sip': 'deckSize',
  'sip-or-spill': 'deckSize',
  'you-laugh': 'roundLength',
  'do-or-drink': 'deckSize',
  'two-truths-bluff': 'write',
  'most-likely-to': 'categories',
  'choose-your-side': 'categories',
  'who-said-that': 'deckSize',
}

const GAMEPLAY_STEPS: Record<MultiplayerGameId, readonly string[]> = {
  'truth-or-dare': ['game'],
  'spicy-starters': ['game'],
  'never-have-i-ever': ['game', 'iveDoneIt', 'pointsGained', 'done'],
  'late-night-talks': ['game'],
  'dinner-table': ['game'],
  'icebreaker': ['game'],
  'everyday-conversation': ['game'],
  'reconnect': ['game'],
  'red-flag-green-flag': ['game'],
  'charades': ['getReady', 'game', 'didTheyGetIt', 'pointsGained', 'done'],
  'strangers': ['game'],
  'finger-down': ['game'],
  'take-a-sip': ['game'],
  'sip-or-spill': ['game'],
  'you-laugh': ['gameplay', 'whoLaughed', 'livesRemaining', 'winner'],
  'do-or-drink': ['game'],
  'two-truths-bluff': ['write', 'guess', 'reveal', 'done'],
  'most-likely-to': ['game', 'vote', 'reveal', 'done'],
  'choose-your-side': ['vote', 'reveal', 'done'],
  'who-said-that': ['answer', 'guess', 'reveal', 'done'],
}

const READY_NEXT_STEPS: Partial<Record<MultiplayerGameId, string>> = {
  'truth-or-dare': 'game',
  'spicy-starters': 'game',
  'never-have-i-ever': 'game',
  'late-night-talks': 'game',
  'dinner-table': 'game',
  'icebreaker': 'game',
  'everyday-conversation': 'game',
  'reconnect': 'game',
  'red-flag-green-flag': 'game',
  'strangers': 'game',
  'finger-down': 'game',
  'take-a-sip': 'game',
  'sip-or-spill': 'game',
  'do-or-drink': 'game',
  'two-truths-bluff': 'write',
  'most-likely-to': 'game',
  'choose-your-side': 'vote',
  'who-said-that': 'answer',
}

const TURN_CONTROLLED_GAMES = new Set<MultiplayerGameId>([
  'spicy-starters', 'late-night-talks', 'dinner-table', 'icebreaker',
  'everyday-conversation', 'reconnect', 'strangers', 'finger-down',
  'take-a-sip', 'sip-or-spill', 'do-or-drink',
])

function GuestSetupWaiting({ room, onClose }: { room: MultiplayerRoom; onClose: () => void }) {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}>
      <GameNav onBack={onClose} />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '36px 16px 72px' }}>
        <Panel narrow>
          <div className="screen-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px', textAlign: 'center' }}>
            <h1 className="visually-hidden">{MULTIPLAYER_GAMES[room.game_id].name}</h1>
            <GameCardPreview gameId={room.game_id} />
            <h2 style={{ ...headingStyle, fontSize: '28px' }}>HOST IS SETTING UP</h2>
            <p style={bodyStyle}>You’re in. The game will start automatically when the host finishes the setup.</p>
            <div aria-label="Waiting" style={{ display: 'flex', gap: '7px', paddingTop: '4px' }}>
              {[0, 1, 2].map(index => <span key={index} className="multiplayer-wait-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2827', animationDelay: `${index * 160}ms` }} />)}
            </div>
          </div>
        </Panel>
      </main>
      <GameFooter />
    </div>
  )
}

function isTerminalSession(values: Record<string, unknown>) {
  const step = typeof values.step === 'string' ? values.step : ''
  if (step === 'done' || step === 'winner') return true
  const total = typeof values.totalCards === 'number' ? values.totalCards : 0
  const index = typeof values.cardIndex === 'number' ? values.cardIndex
    : typeof values.cardIdx === 'number' ? values.cardIdx
      : typeof values.gameCardIndex === 'number' ? values.gameCardIndex
        : typeof values.challengeIdx === 'number' ? values.challengeIdx
          : typeof values.idx === 'number' ? values.idx
            : 0
  return step === 'game' && total > 0 && index >= total
}

function SharedOriginalGame({ room, currentUserId, onlineIds, onClose }: { room: MultiplayerRoom; currentUserId: string; onlineIds: string[]; onClose: () => void }) {
  const remoteSession = room.game_state?.session ?? {}
  const [values, setValues] = useState<Record<string, unknown>>(remoteSession)
  const valuesRef = useRef(values)
  const turnMutationActorRef = useRef<string | null>(null)
  const [privatePrompt, setPrivatePrompt] = useState<string | null>(null)

  useEffect(() => {
    valuesRef.current = remoteSession
    setValues(remoteSession)
  }, [room.version])

  useEffect(() => {
    if (room.game_id !== 'charades') return
    let active = true
    getCharadesPrompt(room.id)
      .then(prompt => { if (active) setPrivatePrompt(prompt) })
      .catch(error => console.error('Could not load the private Charades prompt', error))
    return () => { active = false }
  }, [room.game_id, room.id, room.version])

  const setValue = useCallback(<T,>(key: string, next: React.SetStateAction<T>) => {
    const terminal = isTerminalSession(valuesRef.current)
    const isHost = room.host_user_id === currentUserId
    if (terminal && isHost && turnMutationActorRef.current !== currentUserId) {
      turnMutationActorRef.current = currentUserId
      queueMicrotask(() => { turnMutationActorRef.current = null })
    }
    const sessionPlayers = Array.isArray(valuesRef.current.players)
      ? valuesRef.current.players as Array<{ userId?: string }>
      : []
    const turnIndex = typeof valuesRef.current.playerIndex === 'number'
      ? valuesRef.current.playerIndex
      : typeof valuesRef.current.gamePlayerIndex === 'number'
        ? valuesRef.current.gamePlayerIndex
        : 0
    const activeUserId = sessionPlayers.length > 0
      ? sessionPlayers[turnIndex % sessionPlayers.length]?.userId
      : undefined
    const currentStep = typeof valuesRef.current.step === 'string' ? valuesRef.current.step : ''
    if (!terminal && TURN_CONTROLLED_GAMES.has(room.game_id) && GAMEPLAY_STEPS[room.game_id].includes(currentStep) && activeUserId) {
      if (turnMutationActorRef.current !== currentUserId && activeUserId !== currentUserId) return
      if (turnMutationActorRef.current !== currentUserId) {
        turnMutationActorRef.current = currentUserId
        queueMicrotask(() => { turnMutationActorRef.current = null })
      }
    }

    const current = valuesRef.current[key] as T
    const requested = typeof next === 'function'
      ? (next as (previous: T) => T)(current)
      : next
    const resolved = key === 'step' && requested === 'playerSetup'
      ? PLAYER_SETUP_NEXT_STEPS[room.game_id] as T
      : key === 'step' && requested === 'getReady' && READY_NEXT_STEPS[room.game_id]
        ? READY_NEXT_STEPS[room.game_id] as T
        : requested
    if (terminal && !isHost) {
      if (key === 'step') void requestRematch(room.id).catch(error => console.error('Could not request a rematch', error))
      return
    }
    const valueToPersist = room.game_id === 'charades' && key === 'deck' && Array.isArray(resolved)
      ? (resolved as unknown[]).map(() => null)
      : resolved
    const updated = { ...valuesRef.current, [key]: valueToPersist }
    valuesRef.current = updated
    setValues(updated)
    if (room.game_id === 'charades' && key === 'deck' && Array.isArray(resolved)) {
      void setCharadesDeck(room.id, resolved as string[])
        .then(() => setSessionValue(room.id, key, valueToPersist))
        .catch(error => console.error('Could not secure the Charades deck', error))
      return
    }
    if (terminal && isHost && key === 'step') {
      void clearRematchRequests(room.id).catch(error => console.error('Could not clear rematch requests', error))
    }
    void setSessionValue(room.id, key, valueToPersist).catch(error => console.error('Could not synchronize game state', error))
  }, [currentUserId, room.host_user_id, room.id, room.game_id])

  const isHost = room.host_user_id === currentUserId
  const currentStep = typeof values.step === 'string' ? values.step : INITIAL_STEPS[room.game_id]
  const terminal = isTerminalSession(values)
  const requestedRematch = room.rematch_requests?.includes(currentUserId) ?? false
  const rematchRequestCount = room.rematch_requests?.length ?? 0
  const shared = useMemo(() => ({
    gameId: SESSION_GAME_IDS[room.game_id], values, setValue,
    currentUserId, hostUserId: room.host_user_id, privatePrompt,
    requestedRematch, rematchRequestCount,
    players: players.map(player => ({ userId: player.user_id, name: player.display_name, color: player.color })),
  }), [room.game_id, room.host_user_id, values, setValue, currentUserId, privatePrompt, requestedRematch, rematchRequestCount, players])
  const hostOnline = onlineIds.includes(room.host_user_id)
  if (!isHost && !GAMEPLAY_STEPS[room.game_id].includes(currentStep)) {
    return <GuestSetupWaiting room={room} onClose={onClose} />
  }

  let game: React.ReactNode
  switch (room.game_id) {
    case 'truth-or-dare': game = <TruthOrDareGame onClose={onClose} />; break
    case 'spicy-starters': game = <SpicyStartersGame onClose={onClose} />; break
    case 'never-have-i-ever': game = <NeverHaveIEverGame onClose={onClose} />; break
    case 'late-night-talks': game = <LateNightTalksGame onClose={onClose} />; break
    case 'dinner-table': game = <DinnerTableGame onClose={onClose} />; break
    case 'icebreaker': game = <IcebreakerGame onClose={onClose} />; break
    case 'everyday-conversation': game = <EverydayConversationsGame onClose={onClose} />; break
    case 'reconnect': game = <LetsReconnectGame onClose={onClose} />; break
    case 'red-flag-green-flag': game = <RedFlagGreenFlagGame onClose={onClose} />; break
    case 'charades': game = <CharadesGame onClose={onClose} />; break
    case 'strangers': game = <WNRSGame onClose={onClose} />; break
    case 'finger-down': game = <PutAFingerDownGame onClose={onClose} />; break
    case 'take-a-sip': game = <TakeASipGame onClose={onClose} />; break
    case 'sip-or-spill': game = <SipOrSpillGame onClose={onClose} />; break
    case 'you-laugh': game = <LaughYouAreOutGame onClose={onClose} />; break
    case 'do-or-drink': game = <DoOrDrinkGame onClose={onClose} />; break
    case 'two-truths-bluff': game = <TwoTruthsBluffGame onClose={onClose} />; break
    case 'most-likely-to': game = <MostLikelyToGame onClose={onClose} />; break
    case 'choose-your-side': game = <ChooseYourSideGame onClose={onClose} />; break
    case 'who-said-that': game = <WhoSaidThatGame onClose={onClose} />; break
  }

  return <SharedSessionProvider value={shared}>
    <div className={terminal && !isHost ? 'multiplayer-terminal-guest' : undefined}>
      {game}
    </div>
    <style>{`.multiplayer-terminal-guest .done-btns .game-btn { display: none !important; }`}</style>
    {terminal ? <div role="status" style={{ position: 'fixed', left: '50%', bottom: '82px', transform: 'translateX(-50%)', zIndex: 20, width: 'min(420px, calc(100vw - 32px))', padding: '12px 16px', borderRadius: '12px', background: '#070708', border: '1px dashed rgba(255,255,255,.16)', color: '#fff', textAlign: 'center', fontFamily: "'Satoshi', sans-serif", fontSize: '13px', boxShadow: '0 16px 40px rgba(0,0,0,.45)' }}>
      {isHost
        ? `${room.rematch_requests?.length ?? 0} player${room.rematch_requests?.length === 1 ? '' : 's'} requested a rematch.`
        : requestedRematch
          ? 'Rematch requested. Waiting for the host.'
          : hostOnline ? 'Only the host can start the next game.' : 'Host disconnected. The room will choose a new host shortly.'}
    </div> : null}
  </SharedSessionProvider>
}

export default function PlayTogether({ onClose }: { onClose: () => void }) {
  const [room, setRoom] = useState<MultiplayerRoom | null>(null)
  const [players, setPlayers] = useState<MultiplayerPlayer[]>([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [onlineIds, setOnlineIds] = useState<string[]>([])
  const [presenceReady, setPresenceReady] = useState(false)
  const roomId = room?.id

  const refresh = useCallback(async (id: string) => {
    const bundle = await getRoom(id)
    setRoom(previous => {
      if (previous?.id === bundle.room.id && previous.version > bundle.room.version) return previous
      return bundle.room
    })
    setPlayers(bundle.players)
  }, [])
  const run = async (action: () => Promise<void>) => { setBusy(true); setError(''); try { await action() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Something went wrong.') } finally { setBusy(false) } }

  useEffect(() => {
    if (!multiplayerConfigured) return
    ensureAnonymousUser().then(user => {
      setCurrentUserId(user.id)
      const savedRoom = window.localStorage.getItem('decked:remote-room')
      if (savedRoom) refresh(savedRoom).catch(() => window.localStorage.removeItem('decked:remote-room'))
    }).catch(cause => setError(cause instanceof Error ? cause.message : 'Could not connect.'))
  }, [refresh])

  useEffect(() => {
    if (!roomId || !currentUserId) return
    setPresenceReady(false)
    const changes = supabase.channel(`decked-db:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'decked_rooms', filter: `id=eq.${roomId}` }, payload => {
        if (payload.eventType === 'DELETE') {
          window.localStorage.removeItem('decked:remote-room')
          setRoom(null)
          setPlayers([])
          return
        }
        void refresh(roomId)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'decked_room_players', filter: `room_id=eq.${roomId}` }, () => refresh(roomId))
      .subscribe()
    const presence = supabase.channel(`decked-presence:${roomId}`, { config: { presence: { key: currentUserId } } })
      .on('presence', { event: 'sync' }, () => { setOnlineIds(Object.keys(presence.presenceState())); setPresenceReady(true) })
      .subscribe(status => { if (status === 'SUBSCRIBED') presence.track({ online_at: new Date().toISOString() }) })
    return () => { supabase.removeChannel(changes); supabase.removeChannel(presence) }
  }, [roomId, currentUserId, refresh])

  useEffect(() => {
    if (!roomId || !currentUserId) return
    const touch = () => { void touchRoom(roomId).catch(error => console.error('Could not update room presence', error)) }
    touch()
    const heartbeat = window.setInterval(touch, 20_000)
    return () => window.clearInterval(heartbeat)
  }, [roomId, currentUserId])

  useEffect(() => {
    if (!room || !presenceReady || room.host_user_id === currentUserId || onlineIds.includes(room.host_user_id)) return
    const successor = players
      .filter(player => player.user_id !== room.host_user_id && onlineIds.includes(player.user_id))
      .sort((a, b) => a.position - b.position)[0]
    if (successor?.user_id !== currentUserId) return
    const takeover = window.setTimeout(() => {
      void claimHost(room.id).then(() => refresh(room.id)).catch(error => console.error('Could not transfer host ownership', error))
    }, 65_000)
    return () => window.clearTimeout(takeover)
  }, [currentUserId, onlineIds, players, presenceReady, refresh, room])

  const joinBundle = (bundle: { room: MultiplayerRoom; players: MultiplayerPlayer[] }) => { setRoom(bundle.room); setPlayers(bundle.players); window.localStorage.setItem('decked:remote-room', bundle.room.id); const url = new URL(window.location.href); url.searchParams.set('code', bundle.room.code); window.history.replaceState({}, '', `${url.pathname}${url.search}`) }
  const activeView = useMemo(() => room?.status === 'lobby' ? 'lobby' : 'game', [room?.status])
  const newRoom = () => {
    window.localStorage.removeItem('decked:remote-room')
    const url = new URL(window.location.href)
    url.searchParams.delete('code')
    window.history.replaceState({}, '', `${url.pathname}${url.search}`)
    setRoom(null)
    setPlayers([])
  }
  const exitRoom = () => run(async () => {
    if (!room) return
    if (room.host_user_id === currentUserId) await endRoom(room.id)
    else await leaveRoom(room.id)
    newRoom()
  })

  if (room && room.status !== 'lobby') {
    return <SharedOriginalGame room={room} currentUserId={currentUserId} onlineIds={onlineIds} onClose={exitRoom} />
  }

  return <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}>
    <GameNav onBack={onClose} />
    <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '36px 16px 72px' }}>
      {!multiplayerConfigured ? <Panel narrow><h1 style={headingStyle}>CONNECT SUPABASE</h1><p style={{ ...bodyStyle, marginTop: '14px' }}>Add VITE_SUPABASE_PUBLISHABLE_KEY to enable Play Together.</p></Panel> : !room ? <Entry busy={busy} error={error} onCreate={(name, gameId) => run(async () => joinBundle(await createRoom(name, gameId)))} onJoin={(code, name) => run(async () => joinBundle(await joinRoom(code, name)))} /> : activeView === 'lobby' ? <Lobby room={room} players={players} currentUserId={currentUserId} onlineCount={onlineIds.length} busy={busy} onExit={exitRoom} onStart={() => run(async () => {
        const localPlayers: LocalPlayer[] = players.map((player, index) => ({ name: player.display_name, color: player.color || PLAYER_COLORS[index % PLAYER_COLORS.length], userId: player.user_id }))
        await startMultiGame(room.id, 1, 1)
        await Promise.all([
          setSessionValue(room.id, 'players', localPlayers),
          setSessionValue(room.id, 'step', INITIAL_STEPS[room.game_id]),
        ])
        await refresh(room.id)
      })} /> : null}
    </main>
    <GameFooter />
  </div>
}
