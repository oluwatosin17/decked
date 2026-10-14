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
import WeJustMetGame from '../WeJustMetGame'
import WhotGame from '../WhotGame'
import ImposterGame from '../ImposterGame'
import MiniMysteryMultiplayerGame from '../MiniMysteryMultiplayerGame'
import DoYouKnowMeMultiplayerGame from '../DoYouKnowMeMultiplayerGame'
import { chooseMiniMysteryVariant, MINI_MYSTERIES } from '../content/miniMystery'
import { KNOW_ME_CATEGORIES, promptsFor, shuffledPrompts, type KnowMeCategory, type KnowMeMode, type KnowMeRelationship } from '../content/doYouKnowMe'
import { claimHost, clearRematchRequests, createRoom, endRoom, getCharadesPrompt, getRoom, getRoomAnalyticsRef, joinRoom, leaveRoom, requestRematch, setCharadesDeck, setSessionValue, startDoYouKnowMeGame, startImposterGame, startMiniMysteryGame, startMultiGame, touchRoom } from './roomApi'
import { track } from '../analytics'
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

function Entry({ onCreate, onJoin, busy, error, initialGameId }: {
  onCreate: (name: string, gameId: MultiplayerGameId) => void; onJoin: (code: string, name: string) => void; busy: boolean; error: string
  initialGameId?: MultiplayerGameId | null
}) {
  const inviteCode = new URL(window.location.href).searchParams.get('code')?.trim().toUpperCase() ?? ''
  const openedFromInvite = inviteCode.length === 6
  const [mode, setMode] = useState<'game' | 'actions' | 'create' | 'join'>(() => openedFromInvite ? 'join' : initialGameId ? 'actions' : 'game')
  const [gameId, setGameId] = useState<MultiplayerGameId>(initialGameId ?? 'truth-or-dare')
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
      onPlayWeJustMet={() => selectGame('we-just-met')}
      onPlayWhot={() => selectGame('whot')}
      onPlayImposter={() => selectGame('imposter')}
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

function Lobby({ room, players, currentUserId, onContinue, onExit, busy, onlineCount }: { room: MultiplayerRoom; players: MultiplayerPlayer[]; currentUserId: string; onContinue: () => void; onExit: () => void; busy: boolean; onlineCount: number }) {
  const shareUrl = `${window.location.origin}/play-together?code=${room.code}`
  const isHost = room.host_user_id === currentUserId
  const minimumPlayers = room.game_id === 'mini-mystery' ? 4 : room.game_id === 'imposter' ? 3 : 2
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
        <PrimaryButton disabled={busy || players.length < minimumPlayers} onClick={onContinue}>{players.length < minimumPlayers ? `WAITING FOR ${minimumPlayers - players.length} MORE` : room.game_id === 'imposter' ? 'DEAL SECRET WORDS' : 'SET UP GAME'}</PrimaryButton>
      </> : <p style={{ ...bodyStyle, padding: '10px 0' }}>Waiting for the host to start the game…</p>}
      <ExitRoomButton isHost={isHost} busy={busy} onExit={onExit} />
    </div>
  </Panel>
}

const setupShell: React.CSSProperties = { width: 'min(940px, calc(100vw - 32px))', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }
const setupKicker: React.CSSProperties = { margin: 0, color: '#ef352f', font: "14px/1 'Staatliches', sans-serif", letterSpacing: '.15em', textTransform: 'uppercase' }
const setupSecondary: React.CSSProperties = { minHeight: 48, padding: '12px 22px', borderRadius: 999, border: '1px solid #fff', background: 'transparent', color: '#fff', font: "16px/1 'Staatliches', sans-serif", cursor: 'pointer' }

function MultiplayerSetupFrame({ gameId, onBack, children }: { gameId: MultiplayerGameId; onBack: () => void; children: React.ReactNode }) {
  return <div className="game-fullscreen"><GameNav onBack={onBack} gameId={gameId} /><main style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '36px 16px 72px' }}>{children}</main><GameFooter /></div>
}

function MiniMysterySetup({ busy, onBack, onStart }: { busy: boolean; onBack: () => void; onStart: (caseId: string, rounds: number) => void }) {
  const [step, setStep] = useState<'case' | 'rounds'>('case')
  const [category, setCategory] = useState('All')
  const [caseId, setCaseId] = useState(MINI_MYSTERIES[0].id)
  const [rounds, setRounds] = useState(3)
  const selectedCase = MINI_MYSTERIES.find(item => item.id === caseId) ?? MINI_MYSTERIES[0]
  const levels = [
    { rounds: 2, label: 'QUICK CASE', detail: 'The same mystery at a faster pace.' },
    { rounds: 3, label: 'CLASSIC CASE', detail: 'A balanced mix of clues and discussion.', recommended: true },
    { rounds: 4, label: 'DEEP CASE', detail: 'More time to question and investigate.' },
  ]
  if (step === 'rounds') return <MultiplayerSetupFrame gameId="mini-mystery" onBack={() => setStep('case')}><section style={{ ...setupShell, width: 'min(660px, calc(100vw - 32px))' }}>
    <p style={setupKicker}>CHOOSE YOUR EXPERIENCE</p><h1 style={headingStyle}>HOW DO YOU WANT TO PLAY?</h1><p style={bodyStyle}>{selectedCase.title} · Choose how many rounds you’d like to investigate.</p>
    <div style={{ width: '100%', display: 'grid', gap: 10 }}>{levels.map(level => <button key={level.rounds} type="button" onClick={() => setRounds(level.rounds)} style={{ padding: 18, display: 'grid', gridTemplateColumns: '52px 1fr auto', alignItems: 'center', gap: 14, textAlign: 'left', borderRadius: 14, border: rounds === level.rounds ? '2px solid #fff' : '1px dashed rgba(255,255,255,.18)', background: rounds === level.rounds ? '#123953' : '#070708', color: '#fff', cursor: 'pointer' }}><strong style={{ font: "400 34px/1 'Anton SC',sans-serif", textAlign: 'center' }}>{level.rounds}</strong><span><b style={{ display: 'block', font: "400 19px/1 'Staatliches',sans-serif", letterSpacing: '.06em' }}>{level.label}</b><small style={{ color: 'rgba(255,255,255,.58)', font: "13px/1.35 'Satoshi',sans-serif" }}>{level.detail}</small></span>{level.recommended ? <em style={{ color: '#ffe800', font: "12px 'Staatliches',sans-serif", fontStyle: 'normal' }}>RECOMMENDED</em> : null}</button>)}</div>
    <div style={{ display: 'flex', gap: 10 }}><button style={setupSecondary} onClick={() => setStep('case')}>GO BACK</button><PrimaryButton disabled={busy} onClick={() => onStart(caseId, rounds)}>{busy ? 'STARTING…' : 'DEAL PRIVATE DOSSIERS'}</PrimaryButton></div>
  </section></MultiplayerSetupFrame>
  return <MultiplayerSetupFrame gameId="mini-mystery" onBack={onBack}><section style={setupShell}>
    <p style={setupKicker}>CHOOSE A CASE</p><h1 style={headingStyle}>MINI MYSTERY</h1>
    <div className="mm-category-row" role="group" aria-label="Mystery category" style={{ width: '100%', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>{['All', ...new Set(MINI_MYSTERIES.map(item => item.category))].map(item => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} className="game-btn" style={{ minHeight: 40, padding: '8px 15px', borderRadius: 999, border: category === item ? '1px solid #fff' : '1px dashed rgba(255,255,255,.2)', background: category === item ? '#dc2827' : '#070708', color: '#fff', font: "15px 'Staatliches',sans-serif", cursor: 'pointer' }}>{item.toUpperCase()}</button>)}</div>
    <div className="mm-case-grid" style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>{MINI_MYSTERIES.filter(item => category === 'All' || item.category === category).map(item => <button key={item.id} className="game-btn" onClick={() => { setCaseId(item.id); setStep('rounds') }} style={{ minHeight: 220, padding: 20, borderRadius: 16, border: '2px solid #f4ead2', background: '#123953', color: '#fff', textAlign: 'left', cursor: 'pointer' }}><span style={{ ...setupKicker, color: '#f4ead2' }}>{item.category}</span><strong style={{ display: 'block', marginTop: 14, font: "400 28px/1.05 'Anton SC',sans-serif" }}>{item.title.toUpperCase()}</strong><span style={{ display: 'block', marginTop: 10, color: 'rgba(255,255,255,.48)', font: "12px/1.3 'Satoshi',sans-serif", textTransform: 'uppercase' }}>{item.setting}</span><span style={{ display: 'block', marginTop: 12, color: 'rgba(255,255,255,.72)', font: "14px/1.4 'Satoshi',sans-serif" }}>{item.incident}</span></button>)}</div>
    <style>{`@media(max-width:720px){.mm-case-grid{grid-template-columns:1fr!important}.mm-category-row{justify-content:flex-start!important;overflow-x:auto;flex-wrap:nowrap!important;padding-bottom:4px}.mm-category-row button{flex:0 0 auto}}`}</style>
  </section></MultiplayerSetupFrame>
}

const knowRelationships: Array<{ id: KnowMeRelationship; label: string }> = [
  { id: 'couple', label: 'Couple' }, { id: 'friends', label: 'Friends' }, { id: 'family', label: 'Family' },
  { id: 'new-connections', label: 'New Connections' }, { id: 'mixed-group', label: 'Mixed Group' },
]

function DoYouKnowMeSetup({ busy, onBack, onStart }: { busy: boolean; onBack: () => void; onStart: (mode: KnowMeMode, relationship: KnowMeRelationship, categories: KnowMeCategory[], rounds: number) => void }) {
  const [step, setStep] = useState<'mode' | 'relationship' | 'categories' | 'rounds'>('mode')
  const [mode, setMode] = useState<KnowMeMode>('read-me')
  const [relationship, setRelationship] = useState<KnowMeRelationship>('friends')
  const [categories, setCategories] = useState<KnowMeCategory[]>(['personality', 'everyday'])
  const [rounds, setRounds] = useState(10)
  const goBack = () => step === 'mode' ? onBack() : setStep(step === 'relationship' ? 'mode' : step === 'categories' ? 'relationship' : 'categories')
  const toggle = (id: KnowMeCategory) => setCategories(current => current.includes(id) ? current.length === 1 ? current : current.filter(item => item !== id) : [...current, id])
  let content: React.ReactNode
  if (step === 'mode') content = <><p style={setupKicker}>HOW SHOULD ANSWERS MATCH?</p><h1 style={headingStyle}>CHOOSE YOUR MODE</h1><div className="multiplayer-setup-grid">{([{ id: 'read-me', label: 'READ ME', detail: 'Predict the spotlight player’s real answer.' }, { id: 'match-me', label: 'MATCH ME', detail: 'Try to choose the same answer as everyone else.' }] as const).map(item => <button key={item.id} className={mode === item.id ? 'selected' : ''} onClick={() => setMode(item.id)}><b>{item.label}</b><span>{item.detail}</span></button>)}</div></>
  else if (step === 'relationship') content = <><p style={setupKicker}>WHO’S PLAYING?</p><h1 style={headingStyle}>CHOOSE YOUR GROUP</h1><div className="multiplayer-setup-grid">{knowRelationships.map(item => <button key={item.id} className={relationship === item.id ? 'selected' : ''} onClick={() => setRelationship(item.id)}><b>{item.label}</b>{relationship === item.id ? <em>✓</em> : null}</button>)}</div></>
  else if (step === 'categories') content = <><p style={setupKicker}>PICK ONE OR MIX A FEW</p><h1 style={headingStyle}>CHOOSE CATEGORIES</h1><div className="multiplayer-setup-grid">{KNOW_ME_CATEGORIES.map(item => <button key={item.id} className={categories.includes(item.id) ? 'selected' : ''} onClick={() => toggle(item.id)}><b>{item.label}</b>{categories.includes(item.id) ? <em>✓</em> : null}</button>)}</div></>
  else content = <><p style={setupKicker}>GAME LENGTH</p><h1 style={headingStyle}>HOW MANY ROUNDS?</h1><p style={bodyStyle}>Everyone will get a chance to answer.</p><input aria-label="Number of rounds" type="number" min={3} max={30} value={rounds} onChange={event => setRounds(Math.max(3, Math.min(30, Number(event.target.value))))} style={{ ...inputStyle, width: 150, textAlign: 'center', fontSize: 28 }} /></>
  return <MultiplayerSetupFrame gameId="do-you-know-me" onBack={goBack}><section style={{ ...setupShell, width: 'min(620px, calc(100vw - 32px))' }}>{content}<div style={{ display: 'flex', gap: 10 }}><button style={setupSecondary} onClick={goBack}>GO BACK</button><PrimaryButton disabled={busy} onClick={() => step === 'mode' ? setStep('relationship') : step === 'relationship' ? setStep('categories') : step === 'categories' ? setStep('rounds') : onStart(mode, relationship, categories, rounds)}>{step === 'rounds' ? busy ? 'STARTING…' : 'START THE QUESTIONS' : 'CONTINUE'}</PrimaryButton></div><style>{`.multiplayer-setup-grid{width:100%;display:grid;grid-template-columns:1fr 1fr;gap:10px}.multiplayer-setup-grid button{position:relative;min-height:78px;padding:14px;border-radius:13px;border:1px dashed rgba(255,255,255,.18);background:#070708;color:#fff;text-align:left;cursor:pointer}.multiplayer-setup-grid button.selected{border:2px solid #fff;background:#47123c}.multiplayer-setup-grid b{display:block;font:20px 'Staatliches',sans-serif}.multiplayer-setup-grid span{display:block;margin-top:5px;color:rgba(255,255,255,.58);font:13px/1.35 'Satoshi',sans-serif}.multiplayer-setup-grid em{position:absolute;right:14px;top:50%;transform:translateY(-50%);font-style:normal}@media(max-width:520px){.multiplayer-setup-grid{grid-template-columns:1fr}}`}</style></section></MultiplayerSetupFrame>
}

function ExistingGameCard({ room, prompt, revealed, canReveal, onReveal }: { room: MultiplayerRoom; prompt: unknown; revealed: boolean; canReveal: boolean; onReveal: () => void }) {
  const text = typeof prompt === 'string' ? prompt : ''
  switch (room.game_id) {
    case 'spicy-starters': return revealed ? <SpicyCard question={text} spiceLevel="medium" flipPhase="idle" /> : <SpicyIntroCard firstQuestion="" spiceLevel="medium" onTap={canReveal ? onReveal : () => {}} />
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
  'we-just-met': 'we-just-met',
  whot: 'whot',
  imposter: 'imposter',
  'mini-mystery': 'mini-mystery',
  'do-you-know-me': 'do-you-know-me',
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
  'we-just-met': 'categories',
  whot: 'rules',
  imposter: 'game',
  'mini-mystery': 'game',
  'do-you-know-me': 'game',
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
  'we-just-met': 'categories',
  whot: 'rules',
  imposter: 'game',
  'mini-mystery': 'game',
  'do-you-know-me': 'game',
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
  'we-just-met': ['game', 'done'],
  whot: ['game'],
  imposter: ['game'],
  'mini-mystery': ['game'],
  'do-you-know-me': ['game'],
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
  'we-just-met': 'game',
  whot: 'game',
  imposter: 'game',
}

const TURN_CONTROLLED_GAMES = new Set<MultiplayerGameId>([
  'spicy-starters', 'late-night-talks', 'dinner-table', 'icebreaker',
  'everyday-conversation', 'reconnect', 'strangers', 'finger-down',
  'take-a-sip', 'sip-or-spill', 'do-or-drink',
  'we-just-met',
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
  const whotState = values.whotState && typeof values.whotState === 'object' ? values.whotState as { winnerId?: unknown } : null
  if (typeof whotState?.winnerId === 'string' && whotState.winnerId) return true
  const total = typeof values.totalCards === 'number' ? values.totalCards : 0
  const index = typeof values.cardIndex === 'number' ? values.cardIndex
    : typeof values.cardIdx === 'number' ? values.cardIdx
      : typeof values.gameCardIndex === 'number' ? values.gameCardIndex
        : typeof values.challengeIdx === 'number' ? values.challengeIdx
          : typeof values.idx === 'number' ? values.idx
            : 0
  return step === 'game' && total > 0 && index >= total
}

function SharedOriginalGame({ room, players, currentUserId, onlineIds, onClose }: { room: MultiplayerRoom; players: MultiplayerPlayer[]; currentUserId: string; onlineIds: string[]; onClose: () => void }) {
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
    case 'we-just-met': game = <WeJustMetGame onClose={onClose} />; break
    case 'whot': game = <WhotGame onClose={onClose} />; break
    case 'imposter': game = null; break
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

export default function PlayTogether({ onClose, initialGameId = null }: { onClose: () => void; initialGameId?: MultiplayerGameId | null }) {
  const [room, setRoom] = useState<MultiplayerRoom | null>(null)
  const [players, setPlayers] = useState<MultiplayerPlayer[]>([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [onlineIds, setOnlineIds] = useState<string[]>([])
  const [presenceReady, setPresenceReady] = useState(false)
  const [setupGameId, setSetupGameId] = useState<MultiplayerGameId | null>(null)
  const analyticsRoomRef = useRef<string | null>(null)
  const roomId = room?.id
  const roomGameId = room?.game_id

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
    analyticsRoomRef.current = null
    if (!roomId) return
    let active = true
    void getRoomAnalyticsRef(roomId).then(value => { if (active) analyticsRoomRef.current = value })
    return () => { active = false }
  }, [roomId])

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
      .subscribe(status => track('realtime_status_changed', {
        channel_type: 'database', status: status.toLowerCase(),
        ...(roomGameId ? { game_id: roomGameId } : {}),
        ...(analyticsRoomRef.current ? { multiplayer_room_ref: analyticsRoomRef.current } : {}),
      }))
    const presence = supabase.channel(`decked-presence:${roomId}`, { config: { presence: { key: currentUserId } } })
      .on('presence', { event: 'sync' }, () => { setOnlineIds(Object.keys(presence.presenceState())); setPresenceReady(true) })
      .subscribe(status => {
        track('realtime_status_changed', {
          channel_type: 'presence', status: status.toLowerCase(),
          ...(roomGameId ? { game_id: roomGameId } : {}),
          ...(analyticsRoomRef.current ? { multiplayer_room_ref: analyticsRoomRef.current } : {}),
        })
        if (status === 'SUBSCRIBED') presence.track({ online_at: new Date().toISOString() })
      })
    return () => { supabase.removeChannel(changes); supabase.removeChannel(presence) }
  }, [roomId, roomGameId, currentUserId, refresh])

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
    setSetupGameId(null)
  }
  const exitRoom = () => run(async () => {
    if (!room) return
    if (room.host_user_id === currentUserId) await endRoom(room.id)
    else await leaveRoom(room.id)
    newRoom()
  })

  if (room && room.status !== 'lobby') {
    if (room.game_id === 'imposter') return <ImposterGame room={room} players={players} currentUserId={currentUserId} onClose={exitRoom} />
    if (room.game_id === 'mini-mystery') return <MiniMysteryMultiplayerGame room={room} players={players} currentUserId={currentUserId} onClose={exitRoom} />
    if (room.game_id === 'do-you-know-me') return <DoYouKnowMeMultiplayerGame room={room} players={players} currentUserId={currentUserId} onClose={exitRoom} />
    return <SharedOriginalGame room={room} players={players} currentUserId={currentUserId} onlineIds={onlineIds} onClose={exitRoom} />
  }

  if (room?.status === 'lobby' && room.host_user_id === currentUserId && setupGameId === 'mini-mystery') {
    return <MiniMysterySetup busy={busy} onBack={() => setSetupGameId(null)} onStart={(caseId, rounds) => run(async () => {
      const selectedCase = chooseMiniMysteryVariant(caseId)
      await startMiniMysteryGame(room.id, selectedCase.id, rounds)
      setSetupGameId(null)
      await refresh(room.id)
    })} />
  }

  if (room?.status === 'lobby' && room.host_user_id === currentUserId && setupGameId === 'do-you-know-me') {
    return <DoYouKnowMeSetup busy={busy} onBack={() => setSetupGameId(null)} onStart={(mode, relationship, categoryIds, rounds) => run(async () => {
      const prompts = shuffledPrompts(promptsFor(relationship, categoryIds)).slice(0, rounds)
      await startDoYouKnowMeGame(room.id, mode, relationship, categoryIds, prompts.map(prompt => prompt.id), rounds)
      setSetupGameId(null)
      await refresh(room.id)
    })} />
  }

  return <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}>
    <GameNav onBack={onClose} />
    <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '36px 16px 72px' }}>
      {!multiplayerConfigured ? <Panel narrow><h1 style={headingStyle}>CONNECT SUPABASE</h1><p style={{ ...bodyStyle, marginTop: '14px' }}>Add VITE_SUPABASE_PUBLISHABLE_KEY to enable Play Together.</p></Panel> : !room ? <Entry initialGameId={initialGameId} busy={busy} error={error} onCreate={(name, gameId) => run(async () => joinBundle(await createRoom(name, gameId)))} onJoin={(code, name) => run(async () => joinBundle(await joinRoom(code, name)))} /> : activeView === 'lobby' ? <Lobby room={room} players={players} currentUserId={currentUserId} onlineCount={onlineIds.length} busy={busy} onExit={exitRoom} onContinue={() => {
        if (room.game_id === 'mini-mystery' || room.game_id === 'do-you-know-me') {
          setSetupGameId(room.game_id)
          return
        }
        void run(async () => {
        if (room.game_id === 'imposter') {
          await startImposterGame(room.id)
          await refresh(room.id)
          return
        }
        const localPlayers: LocalPlayer[] = players.map((player, index) => ({ name: player.display_name, color: player.color || PLAYER_COLORS[index % PLAYER_COLORS.length], userId: player.user_id }))
        await startMultiGame(room.id, 1, 1)
        await Promise.all([
          setSessionValue(room.id, 'players', localPlayers),
          setSessionValue(room.id, 'step', INITIAL_STEPS[room.game_id]),
        ])
        await refresh(room.id)
        })
      }} /> : null}
    </main>
    <GameFooter />
  </div>
}
