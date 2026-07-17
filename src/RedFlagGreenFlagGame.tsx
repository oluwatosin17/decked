import { useState, useRef, useEffect, useCallback } from 'react'
import SharedPlayerSetup, { type Player } from './components/PlayerSetup'
import SharedDeckSize from './components/DeckSize'
import { useScaledCard } from './hooks/useCardScale'
import { GameNav, GameFooter } from './components/GameShell'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const RFGF_FRONT = '/icons/rfgf-front.svg'
const RFGF_BACK  = '/icons/rfgf-back.svg'

const PLAYER_COLORS = ['#dc2827','#9b59b6','#27ae60','#e67e22','#3498db','#e91e63','#f39c12','#1abc9c']

/* ─── Scenario prompts ─── */
const SCENARIOS: string[] = [
  "They still text their ex every week",
  "They always remember your birthday",
  "They check your phone while you're asleep",
  "They cook dinner for you after a long day",
  "They post everything about your relationship on social media",
  "They never introduce you to their friends",
  "They communicate when they'll be unavailable instead of disappearing",
  "They laugh at their own jokes",
  "They remember small details about things you've told them",
  "They get jealous when you hang out with friends",
  "They always take your side in an argument even when you're wrong",
  "They go through your DMs when you leave your phone unlocked",
  "They plan surprise dates without being asked",
  "They never apologize after a fight",
  "They hype you up in front of their friends",
  "They keep score of who paid for what",
  "They put their phone face down whenever you're around",
  "They ask how your day was and actually listen",
  "They cancel plans with you last minute but post on social media",
  "They support your goals even when it doesn't benefit them",
  "They compare you to their ex",
  "They hold your hand in public without hesitation",
  "They make fun of your interests in front of others",
  "They text back within minutes even when they're busy",
  "They refuse to meet your family after months of dating",
  "They remember your coffee order",
  "They flirt with other people right in front of you",
  "They write you handwritten notes or letters",
  "They gaslight you into thinking you're overreacting",
  "They encourage you to spend time with your own friends",
  "They only reach out when they need something",
  "They defend you when someone talks behind your back",
  "They love-bomb you with gifts but avoid real conversations",
  "They tell you when something you did hurt them instead of shutting down",
  "They follow and like their ex's every post",
  "They make you feel safe enough to cry in front of them",
  "They dismiss your feelings as being too sensitive",
  "They share your embarrassing stories at parties",
  "They always want to know your location",
  "They give you space when you need it without guilt-tripping you",
  "They take forever to text back but are always on their phone around you",
  "They split chores without being asked",
  "They make you feel like you have to earn their affection",
  "They celebrate your wins like they're their own",
  "They refuse to compromise on anything",
  "They introduce you as their partner proudly",
  "They keep secrets about their past relationships",
  "They genuinely get along with your friends",
  "They never make time for date nights",
  "They bring you food when you're stressed without you asking",
]

type VoteType = 'red' | 'depends' | 'green'
type Vote = { playerIndex: number; vote: VoteType }

/* ─── Screen: Get Ready ─── */
function GetReady({ player, onReady }: { player: Player; onReady: () => void }) {
  useEffect(() => {
    const id = setTimeout(onReady, 2400)
    return () => clearTimeout(id)
  }, [onReady])

  return (
    <div className="screen-enter" onClick={onReady} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center', lineHeight: '45px', textTransform: 'uppercase' }}>
          Get ready...
        </h2>

        <div className="stagger-item" style={{ background: '#18181b', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', padding: '12px', gap: '12px' }}>
          <div className="avatar-circle" style={{ width: '32px', height: '32px', borderRadius: '50%', background: player.color, flexShrink: 0, boxShadow: '0 0 0 2.5px #fff' }} />
          <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', lineHeight: 'normal', whiteSpace: 'nowrap' }}>
            {player.name.toUpperCase()}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
          <span className="get-ready-dot" />
          <span className="get-ready-dot" />
          <span className="get-ready-dot" />
        </div>
      </div>
    </div>
  )
}

/* ─── Vote Buttons ─── */
function VoteButtons({ onVote }: { onVote: (v: VoteType) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '365px', position: 'relative', zIndex: 2 }}>
      <button
        className="game-btn"
        onClick={() => onVote('red')}
        style={{
          width: '100%', background: '#dc2827', border: 'none', borderRadius: '12px',
          padding: '16px', fontFamily: "'Anton SC', sans-serif", fontSize: '18px',
          color: '#fff', cursor: 'pointer', textAlign: 'center',
          boxShadow: '0 4px 16px rgba(220,40,39,0.3)',
        }}
      >
        🚩 RED FLAG
      </button>
      <button
        className="game-btn"
        onClick={() => onVote('depends')}
        style={{
          width: '100%', background: '#626262', border: 'none', borderRadius: '12px',
          padding: '16px', fontFamily: "'Anton SC', sans-serif", fontSize: '18px',
          color: '#fff', cursor: 'pointer', textAlign: 'center',
          boxShadow: '0 4px 16px rgba(98,98,98,0.3)',
        }}
      >
        🤷 DEPENDS
      </button>
      <button
        className="game-btn"
        onClick={() => onVote('green')}
        style={{
          width: '100%', background: '#27ae60', border: 'none', borderRadius: '12px',
          padding: '16px', fontFamily: "'Anton SC', sans-serif", fontSize: '18px',
          color: '#fff', cursor: 'pointer', textAlign: 'center',
          boxShadow: '0 4px 16px rgba(39,174,96,0.3)',
        }}
      >
        🟢 GREEN FLAG
      </button>
    </div>
  )
}

/* ─── Vote Results Bar ─── */
function ResultBar({ label, count, total, color, emoji, delay }: {
  label: string; count: number; total: number; color: string; emoji: string; delay: number
}) {
  const [width, setWidth] = useState(0)
  const pct = total > 0 ? Math.round((count / total) * 100) : 0

  useEffect(() => {
    const id = setTimeout(() => setWidth(pct), delay)
    return () => clearTimeout(id)
  }, [pct, delay])

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '14px', color: '#fff' }}>
          {emoji} {label}
        </span>
        <span style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
          {count} vote{count !== 1 ? 's' : ''} ({pct}%)
        </span>
      </div>
      <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{
          width: `${width}%`,
          height: '100%',
          background: color,
          borderRadius: '6px',
          transition: 'width 0.6s ease-out',
        }} />
      </div>
    </div>
  )
}

/* ─── Vote Results Screen ─── */
function VoteResults({ votes, players, onNext }: {
  votes: Vote[]
  players: Player[]
  onNext: () => void
}) {
  const redCount = votes.filter(v => v.vote === 'red').length
  const dependsCount = votes.filter(v => v.vote === 'depends').length
  const greenCount = votes.filter(v => v.vote === 'green').length
  const total = votes.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '365px', position: 'relative', zIndex: 2, alignItems: 'center' }}>
      <h3 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '24px', color: '#fff', margin: 0, textTransform: 'uppercase' }}>
        RESULTS
      </h3>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <ResultBar label="RED FLAG" count={redCount} total={total} color="#dc2827" emoji="🚩" delay={100} />
        <ResultBar label="DEPENDS" count={dependsCount} total={total} color="#626262" emoji="🤷" delay={250} />
        <ResultBar label="GREEN FLAG" count={greenCount} total={total} color="#27ae60" emoji="🟢" delay={400} />
      </div>

      {/* Individual votes */}
      <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '4px' }}>
        {votes.map((v, i) => {
          const player = players[v.playerIndex]
          const voteColor = v.vote === 'red' ? '#dc2827' : v.vote === 'green' ? '#27ae60' : '#626262'
          const voteEmoji = v.vote === 'red' ? '🚩' : v.vote === 'green' ? '🟢' : '🤷'
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '6px 10px',
              border: `1px solid ${voteColor}33`,
            }}>
              <div className="avatar-circle" style={{ width: '20px', height: '20px', background: player.color, boxShadow: '0 0 0 2.5px #fff' }} />
              <span style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '12px', color: '#fff' }}>
                {player.name}
              </span>
              <span style={{ fontSize: '14px' }}>{voteEmoji}</span>
            </div>
          )
        })}
      </div>

      <button
        className="game-btn-primary"
        onClick={onNext}
        style={{
          background: '#dc2827', border: 'none', borderRadius: '999px',
          padding: '12px 32px', fontFamily: "'Staatliches', sans-serif",
          fontSize: '16px', color: '#fff', textAlign: 'center',
          letterSpacing: '0.05em', marginTop: '8px',
        }}
      >
        NEXT
      </button>
    </div>
  )
}

/* ─── Game Play ─── */
type GamePhase = 'card-front' | 'revealed' | 'voting' | 'results'

function GamePlay({ players, totalCards, scenarios, onClose }: {
  players: Player[]
  totalCards: number
  scenarios: string[]
  onClose: () => void
}) {
  const [cardIndex, setCardIndex] = useState(0)
  const [playerIndex, setPlayerIndex] = useState(0)
  const [phase, setPhase] = useState<GamePhase>('card-front')
  const [flipped, setFlipped] = useState(false)
  const [skipCount, setSkipCount] = useState(0)
  const [votes, setVotes] = useState<Vote[]>([])
  const [votingPlayerIndex, setVotingPlayerIndex] = useState(0)
  const { wrapperStyle, cardStyle } = useScaledCard(365, 457)

  const currentPlayer = players[playerIndex % players.length]
  const scenario = scenarios[cardIndex % scenarios.length]
  const isDone = totalCards > 0 && cardIndex >= totalCards

  const handleTapCard = useCallback(() => {
    if (phase === 'card-front' && !flipped) {
      setFlipped(true)
      setTimeout(() => setPhase('revealed'), 800)
    }
  }, [phase, flipped])

  const handleStartVoting = useCallback(() => {
    setVotes([])
    setVotingPlayerIndex(0)
    setPhase('voting')
  }, [])

  const handleVote = useCallback((vote: VoteType) => {
    const newVotes = [...votes, { playerIndex: votingPlayerIndex, vote }]
    setVotes(newVotes)
    if (votingPlayerIndex + 1 >= players.length) {
      setPhase('results')
    } else {
      setVotingPlayerIndex(votingPlayerIndex + 1)
    }
  }, [votes, votingPlayerIndex, players.length])

  const handleNext = useCallback((skipped = false) => {
    if (skipped) setSkipCount(c => c + 1)
    const nextCard = cardIndex + 1
    const nextPlayer = (playerIndex + 1) % players.length
    setCardIndex(nextCard)
    setPlayerIndex(nextPlayer)
    setFlipped(false)
    setPhase('card-front')
    setVotes([])
    setVotingPlayerIndex(0)
  }, [cardIndex, playerIndex, players.length])

  /* Game Complete */
  if (isDone) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '32px', padding: '40px' }}>
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
          <h2 className="done-heading" style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '48px', color: '#fff', margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            You're Decked
          </h2>
          <p className="done-subtitle" style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            You played all {totalCards} Red Flag Green Flag cards
          </p>
        </div>

        {/* Stats card */}
        <div style={{ position: 'relative', zIndex: 2, background: '#18181b', borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '20px 32px', gap: 0 }}>
          {[
            { count: totalCards, label: 'CARDS', cls: 'done-stat-1' },
            { count: skipCount, label: 'SKIPPED', cls: 'done-stat-2' },
          ].map((stat, i) => (
            <div key={i} className={stat.cls} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.1)', margin: '0 28px' }} />}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '40px', color: '#fff', lineHeight: 1 }}>{stat.count}</span>
                <span style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Mini card */}
        <div className="done-card" style={{
          position: 'relative', zIndex: 2,
          width: '120px', height: '150px',
          borderRadius: '12px', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)', flexShrink: 0,
        }}>
          <img src={RFGF_FRONT} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        {/* Buttons */}
        <div className="done-btns" style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="game-btn" onClick={onClose} style={{ border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', boxShadow: '0 10px 24px rgba(0,0,0,0.25)' }}>
            BROWSE GAMES
          </button>
          <button className="game-btn-primary" onClick={() => { setCardIndex(0); setPlayerIndex(0); setSkipCount(0); setFlipped(false); setPhase('card-front'); setVotes([]); setVotingPlayerIndex(0) }} style={{ background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em' }}>
            PLAY AGAIN
          </button>
        </div>
      </div>
    )
  }

  /* Card Front — flip card */
  if (phase === 'card-front') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', padding: '40px 40px 60px', position: 'relative' }}>
        {/* Player chip */}
        <div key={`${currentPlayer.name}-${cardIndex}`} className="player-chip-enter" style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="avatar-circle" style={{ width: '28px', height: '28px', background: currentPlayer.color, boxShadow: '0 0 0 2.5px #fff' }} />
          <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '16px', color: 'rgba(255,255,255,0.65)', letterSpacing: '0.04em' }}>
            {currentPlayer.name.toUpperCase()}'S TURN
          </span>
        </div>

        {/* Flip card */}
        <div style={wrapperStyle}>
          <div
            onClick={handleTapCard}
            className="game-card"
            style={{ ...cardStyle, flexShrink: 0, zIndex: 2, position: 'relative', cursor: 'pointer' }}
          >
            <div className="spicy-flip-container" style={{ width: '365px', height: '457px' }}>
              <div className={`spicy-flip-inner${flipped ? ' flipped' : ''}`} style={{ width: '365px', height: '457px' }}>
                {/* FRONT */}
                <div className="spicy-flip-front" style={{ background: '#000' }}>
                  <img src={RFGF_FRONT} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '40px' }}>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                      Tap to Reveal
                    </p>
                  </div>
                </div>

                {/* BACK — scenario card */}
                <div className="spicy-flip-back" style={{ background: '#fff' }}>
                  <img src={RFGF_BACK} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', padding: '48px 32px',
                  }}>
                    <p style={{
                      fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
                      fontSize: '24px', color: '#1a1a2e', textAlign: 'center',
                      textTransform: 'uppercase', lineHeight: 1.3, margin: 0,
                    }}>
                      {scenario}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card counter */}
        {totalCards > 0 && (
          <div className="counter-in" style={{ position: 'relative', zIndex: 2, fontFamily: "'Staatliches', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em' }}>
            CARD {cardIndex + 1} OF {totalCards}
          </div>
        )}
      </div>
    )
  }

  /* Revealed — show scenario with vote prompt */
  if (phase === 'revealed') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', padding: '40px 20px 60px', position: 'relative', overflowY: 'auto' }}>
        <div key={`${currentPlayer.name}-${cardIndex}`} className="player-chip-enter" style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="avatar-circle" style={{ width: '28px', height: '28px', background: currentPlayer.color, boxShadow: '0 0 0 2.5px #fff' }} />
          <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '16px', color: 'rgba(255,255,255,0.65)', letterSpacing: '0.04em' }}>
            {currentPlayer.name.toUpperCase()}'S TURN
          </span>
        </div>

        {/* Scenario card */}
        <div style={wrapperStyle}>
          <div
            className="game-card"
            style={{
              ...cardStyle, position: 'relative', zIndex: 2,
              borderRadius: '20px', overflow: 'hidden',
              boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
            }}
          >
            <img src={RFGF_BACK} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '48px 32px',
            }}>
              <p style={{
                fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
                fontSize: '24px', color: '#1a1a2e', textAlign: 'center',
                textTransform: 'uppercase', lineHeight: 1.3, margin: 0,
              }}>
                {scenario}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '8px', alignItems: 'center', width: '100%', maxWidth: '365px' }}>
          <button className="game-btn"
            onClick={() => handleNext(true)}
            style={{ flex: 1, border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', textAlign: 'center', boxShadow: '0 10px 24px rgba(0,0,0,0.25)', letterSpacing: '0.05em' }}
          >
            SKIP
          </button>
          <button className="game-btn-primary"
            onClick={handleStartVoting}
            style={{ flex: 1, background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', textAlign: 'center', letterSpacing: '0.05em' }}
          >
            VOTE
          </button>
        </div>

        {totalCards > 0 && (
          <div className="counter-in" style={{ position: 'relative', zIndex: 2, fontFamily: "'Staatliches', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em' }}>
            CARD {cardIndex + 1} OF {totalCards}
          </div>
        )}
      </div>
    )
  }

  /* Voting — each player votes */
  if (phase === 'voting') {
    const votingPlayer = players[votingPlayerIndex]
    return (
      <div className="screen-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', padding: '40px 20px 60px', position: 'relative' }}>
        {/* Scenario reminder */}
        <div style={{ position: 'relative', zIndex: 2, background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px 24px', maxWidth: '365px', width: '100%' }}>
          <p style={{
            fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
            fontSize: '16px', color: 'rgba(255,255,255,0.7)', textAlign: 'center',
            textTransform: 'uppercase', lineHeight: 1.3, margin: 0,
          }}>
            {scenario}
          </p>
        </div>

        {/* Current voter */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div className="avatar-circle" style={{ width: '48px', height: '48px', background: votingPlayer.color, boxShadow: '0 0 0 2.5px #fff' }} />
          <span style={{ fontFamily: "'Anton SC', sans-serif", fontSize: '18px', color: '#fff', textTransform: 'uppercase' }}>
            {votingPlayer.name}'S VOTE
          </span>
          <span style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
            {votingPlayerIndex + 1} of {players.length}
          </span>
        </div>

        <VoteButtons onVote={handleVote} />
      </div>
    )
  }

  /* Results */
  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', padding: '40px 20px 60px', position: 'relative', overflowY: 'auto' }}>
      {/* Scenario reminder */}
      <div style={{ position: 'relative', zIndex: 2, background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px 24px', maxWidth: '365px', width: '100%' }}>
        <p style={{
          fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
          fontSize: '16px', color: 'rgba(255,255,255,0.7)', textAlign: 'center',
          textTransform: 'uppercase', lineHeight: 1.3, margin: 0,
        }}>
          {scenario}
        </p>
      </div>

      <VoteResults
        votes={votes}
        players={players}
        onNext={() => handleNext(false)}
      />

      {totalCards > 0 && (
        <div className="counter-in" style={{ position: 'relative', zIndex: 2, fontFamily: "'Staatliches', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em' }}>
          CARD {cardIndex + 1} OF {totalCards}
        </div>
      )}
    </div>
  )
}

/* ─── Root Component ─── */
type Step = 'playerSetup' | 'deckSize' | 'getReady' | 'game'

export default function RedFlagGreenFlagGame({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>('playerSetup')
  const [players, setPlayers] = useState<Player[]>([])
  const [totalCards, setTotalCards] = useState(0)
  const [playerIndex, setPlayerIndex] = useState(0)
  const [shuffledScenarios, setShuffledScenarios] = useState(() => shuffle(SCENARIOS))

  const currentPlayer = players.length > 0 ? players[playerIndex] : null

  const goToGame = useCallback(() => setStep('game'), [])

  return (
    <div className="game-fullscreen">
      <GameNav onBack={onClose} />

      {step === 'playerSetup' && (
        <SharedPlayerSetup
          initialPlayers={players}
          minPlayers={2}
          skipLabel="GO BACK"
          onSkip={onClose}
          onNext={(p) => { setPlayers(p); setStep('deckSize') }}
        />
      )}

      {step === 'deckSize' && (
        <SharedDeckSize
          onBack={() => setStep('playerSetup')}
          onNext={(n) => {
            setTotalCards(n)
            setPlayerIndex(0)
            setShuffledScenarios(shuffle(SCENARIOS))
            setStep('getReady')
          }}
        />
      )}

      {step === 'getReady' && currentPlayer && (
        <GetReady player={currentPlayer} onReady={goToGame} />
      )}

      {step === 'game' && (
        <GamePlay
          players={players}
          totalCards={totalCards}
          scenarios={shuffledScenarios}
          onClose={onClose}
        />
      )}

      <GameFooter />
    </div>
  )
}
