import { useState, useRef, useEffect, useCallback } from 'react'
import SharedPlayerSetup, { type Player } from './components/PlayerSetup'
import SharedDeckSize from './components/DeckSize'
import SharedCustomCards from './components/CustomCards'
import { useScaledCard } from './hooks/useCardScale'
import { GameNav, GameFooter } from './components/GameShell'
import { shuffle, getShuffledDeck } from './utils/deckShuffle'

const RFGF_FRONT = '/icons/rfgf-front.svg'
const RFGF_BACK  = '/icons/rfgf-back.svg'

const VOTE_RED_ICON = '/icons/vote-red-flag.svg'
const VOTE_GREEN_ICON = '/icons/vote-green-flag.svg'
const VOTE_DEPENDS_ICON = '/icons/vote-depends.svg'

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
type CardVoteRecord = { scenario: string; votes: Vote[] }

function getVoteIcon(vote: VoteType): string {
  if (vote === 'red') return VOTE_RED_ICON
  if (vote === 'green') return VOTE_GREEN_ICON
  return VOTE_DEPENDS_ICON
}

function getVoteColor(vote: VoteType): string {
  if (vote === 'red') return '#dc2827'
  if (vote === 'green') return '#27ae60'
  return '#626262'
}

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

/* ─── Vote Buttons (horizontal row with SVG icons) ─── */
function VoteButtons({ onVote }: { onVote: (v: VoteType) => void }) {
  const [selectedVote, setSelectedVote] = useState<VoteType | null>(null)

  const handleVote = (v: VoteType) => {
    if (selectedVote) return
    setSelectedVote(v)
    setTimeout(() => {
      onVote(v)
      setSelectedVote(null)
    }, 500)
  }

  const btnBase: React.CSSProperties = {
    flex: 1,
    background: '#18181b',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '14px 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    cursor: 'pointer',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Staatliches', sans-serif",
    fontSize: '13px',
    color: '#fff',
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
  }

  const getSelectedStyle = (v: VoteType): React.CSSProperties => {
    if (selectedVote !== v) return {}
    const color = getVoteColor(v)
    return {
      transform: 'scale(1.1)',
      boxShadow: `0 0 24px ${color}66`,
      borderColor: color,
    }
  }

  return (
    <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '365px', position: 'relative', zIndex: 2 }}>
      <button
        className="game-btn"
        onClick={() => handleVote('red')}
        style={{ ...btnBase, ...getSelectedStyle('red') }}
      >
        <img src={VOTE_RED_ICON} alt="" style={{ width: '24px', height: '24px' }} />
        <span style={labelStyle}>RED FLAG</span>
      </button>
      <button
        className="game-btn"
        onClick={() => handleVote('depends')}
        style={{ ...btnBase, ...getSelectedStyle('depends') }}
      >
        <img src={VOTE_DEPENDS_ICON} alt="" style={{ width: '24px', height: '24px' }} />
        <span style={labelStyle}>DEPENDS</span>
      </button>
      <button
        className="game-btn"
        onClick={() => handleVote('green')}
        style={{ ...btnBase, ...getSelectedStyle('green') }}
      >
        <img src={VOTE_GREEN_ICON} alt="" style={{ width: '24px', height: '24px' }} />
        <span style={labelStyle}>GREEN FLAG</span>
      </button>
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

  const summaryCardStyle: React.CSSProperties = {
    flex: 1,
    background: '#18181b',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  }

  const summaryLabelStyle: React.CSSProperties = {
    fontFamily: "'Staatliches', sans-serif",
    fontSize: '11px',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  }

  const summaryCountStyle: React.CSSProperties = {
    fontFamily: "'Anton SC', sans-serif",
    fontWeight: 400,
    fontSize: '14px',
    color: '#fff',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '365px', position: 'relative', zIndex: 2, alignItems: 'center' }}>
      <h3 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '24px', color: '#fff', margin: 0, textTransform: 'uppercase' }}>
        RESULTS
      </h3>

      {/* Summary row */}
      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
        <div style={summaryCardStyle}>
          <img src={VOTE_RED_ICON} alt="" style={{ width: '24px', height: '24px' }} />
          <span style={summaryLabelStyle}>RED FLAG</span>
          <span style={summaryCountStyle}>{redCount} VOTE{redCount !== 1 ? 'S' : ''}</span>
        </div>
        <div style={summaryCardStyle}>
          <img src={VOTE_DEPENDS_ICON} alt="" style={{ width: '24px', height: '24px' }} />
          <span style={summaryLabelStyle}>DEPENDS</span>
          <span style={summaryCountStyle}>{dependsCount} VOTE{dependsCount !== 1 ? 'S' : ''}</span>
        </div>
        <div style={summaryCardStyle}>
          <img src={VOTE_GREEN_ICON} alt="" style={{ width: '24px', height: '24px' }} />
          <span style={summaryLabelStyle}>GREEN FLAG</span>
          <span style={summaryCountStyle}>{greenCount} VOTE{greenCount !== 1 ? 'S' : ''}</span>
        </div>
      </div>

      {/* Player vote breakdown */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {votes.map((v, i) => {
          const player = players[v.playerIndex]
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: '#18181b', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px', padding: '12px',
            }}>
              <div className="avatar-circle" style={{ width: '28px', height: '28px', borderRadius: '50%', background: player.color, flexShrink: 0, boxShadow: '0 0 0 2.5px #fff' }} />
              <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '15px', color: '#fff', textTransform: 'uppercase', flex: 1 }}>
                {player.name}
              </span>
              <img src={getVoteIcon(v.vote)} alt={v.vote} style={{ width: '20px', height: '20px' }} />
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
          letterSpacing: '0.05em', marginTop: '8px', cursor: 'pointer',
          width: '100%', maxWidth: '200px',
        }}
      >
        NEXT
      </button>
    </div>
  )
}

/* ─── Session Summary / Game Complete Screen ─── */
function SessionComplete({ players, totalCards, skipCount, allCardVotes, onClose, onPlayAgain }: {
  players: Player[]
  totalCards: number
  skipCount: number
  allCardVotes: CardVoteRecord[]
  onClose: () => void
  onPlayAgain: () => void
}) {
  const totalVotesCast = allCardVotes.reduce((sum, r) => sum + r.votes.length, 0)
  const cardsPlayed = allCardVotes.length

  /* ─── Compute highlights ─── */
  function computeHighlights() {
    if (allCardVotes.length === 0) return null

    let mostControversial: CardVoteRecord | null = null
    let mostControversialScore = -1
    let mostGreen: CardVoteRecord | null = null
    let mostGreenPct = -1
    let mostRed: CardVoteRecord | null = null
    let mostRedPct = -1
    let closestVote: CardVoteRecord | null = null
    let closestMargin = Infinity

    for (const record of allCardVotes) {
      const red = record.votes.filter(v => v.vote === 'red').length
      const green = record.votes.filter(v => v.vote === 'green').length
      const depends = record.votes.filter(v => v.vote === 'depends').length
      const total = record.votes.length
      if (total === 0) continue

      const greenPct = green / total
      const redPct = red / total

      // Controversy: how evenly split between red and green
      const controversyScore = Math.min(red, green) / Math.max(1, Math.max(red, green))
      if (controversyScore > mostControversialScore || (controversyScore === mostControversialScore && red + green > 0)) {
        mostControversialScore = controversyScore
        mostControversial = record
      }

      if (greenPct > mostGreenPct) {
        mostGreenPct = greenPct
        mostGreen = record
      }

      if (redPct > mostRedPct) {
        mostRedPct = redPct
        mostRed = record
      }

      // Closest: smallest margin between top two vote types
      const sorted = [red, green, depends].sort((a, b) => b - a)
      const margin = sorted[0] - sorted[1]
      if (margin < closestMargin) {
        closestMargin = margin
        closestVote = record
      }
    }

    return { mostControversial, mostGreen, mostGreenPct, mostRed, mostRedPct, closestVote, closestMargin }
  }

  function computeStats() {
    let unanimousCount = 0
    let splitCount = 0
    let totalDepends = 0
    let majorityAgreeCount = 0

    for (const record of allCardVotes) {
      const red = record.votes.filter(v => v.vote === 'red').length
      const green = record.votes.filter(v => v.vote === 'green').length
      const depends = record.votes.filter(v => v.vote === 'depends').length
      const total = record.votes.length
      totalDepends += depends

      const maxVotes = Math.max(red, green, depends)
      if (maxVotes === total) unanimousCount++

      const sorted = [red, green, depends].sort((a, b) => b - a)
      const margin = sorted[0] - sorted[1]
      if (margin <= 1 && total > 1) splitCount++

      if (maxVotes > total / 2) majorityAgreeCount++
    }

    const avgAgreement = allCardVotes.length > 0 ? Math.round((majorityAgreeCount / allCardVotes.length) * 100) : 0

    return { unanimousCount, splitCount, totalDepends, avgAgreement }
  }

  function voteBreakdownText(record: CardVoteRecord): string {
    const red = record.votes.filter(v => v.vote === 'red').length
    const green = record.votes.filter(v => v.vote === 'green').length
    const depends = record.votes.filter(v => v.vote === 'depends').length
    const parts: string[] = []
    if (red > 0) parts.push(`${red} Red`)
    if (green > 0) parts.push(`${green} Green`)
    if (depends > 0) parts.push(`${depends} Depends`)
    return parts.join(' / ')
  }

  const highlights = computeHighlights()
  const stats = computeStats()

  const sectionHeadingStyle: React.CSSProperties = {
    fontFamily: "'Staatliches', sans-serif",
    fontSize: '13px',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    margin: 0,
  }

  const highlightCardStyle: React.CSSProperties = {
    background: '#18181b',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '14px 16px',
    width: '100%',
  }

  const highlightLabelStyle: React.CSSProperties = {
    fontFamily: "'Staatliches', sans-serif",
    fontSize: '12px',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    margin: 0,
  }

  const highlightScenarioStyle: React.CSSProperties = {
    fontFamily: "'Inter', sans-serif",
    fontSize: '14px',
    color: '#fff',
    margin: '6px 0 4px',
    lineHeight: 1.4,
    fontStyle: 'italic',
  }

  const highlightBreakdownStyle: React.CSSProperties = {
    fontFamily: "'Satoshi', sans-serif",
    fontSize: '12px',
    color: 'rgba(255,255,255,0.45)',
    margin: 0,
  }

  const statRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  }

  const statLabelStyle: React.CSSProperties = {
    fontFamily: "'Satoshi', sans-serif",
    fontSize: '14px',
    color: 'rgba(255,255,255,0.6)',
  }

  const statValueStyle: React.CSSProperties = {
    fontFamily: "'Anton SC', sans-serif",
    fontWeight: 400,
    fontSize: '18px',
    color: '#fff',
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '40px 20px 60px', overflowY: 'auto', position: 'relative' }}>
      {/* Header */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
        <h2 className="done-heading" style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '40px', color: '#fff', margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
          SESSION COMPLETE
        </h2>
        <p className="done-subtitle" style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '15px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          You've completed this round of Red Flag / Green Flag.
        </p>
      </div>

      {/* Session Summary cards */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '8px', width: '100%', maxWidth: '365px' }}>
        {[
          { count: cardsPlayed, label: 'CARDS PLAYED' },
          { count: players.length, label: 'PLAYERS' },
          { count: totalVotesCast, label: 'VOTES CAST' },
        ].map((stat, i) => (
          <div key={i} className={`done-stat-${i + 1}`} style={{
            flex: 1, background: '#18181b', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px', padding: '16px 8px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '4px',
          }}>
            <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '32px', color: '#fff', lineHeight: 1 }}>{stat.count}</span>
            <span style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textAlign: 'center' }}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Highlights */}
      {highlights && allCardVotes.length > 0 && (
        <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: '365px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={sectionHeadingStyle}>HIGHLIGHTS</p>

          {highlights.mostControversial && (
            <div style={highlightCardStyle}>
              <p style={highlightLabelStyle}>Most Controversial Card</p>
              <p style={highlightScenarioStyle}>"{highlights.mostControversial.scenario}"</p>
              <p style={highlightBreakdownStyle}>{voteBreakdownText(highlights.mostControversial)}</p>
            </div>
          )}

          {highlights.mostGreen && (
            <div style={highlightCardStyle}>
              <p style={highlightLabelStyle}>Most Agreed Green Flag</p>
              <p style={highlightScenarioStyle}>"{highlights.mostGreen.scenario}"</p>
              <p style={highlightBreakdownStyle}>{voteBreakdownText(highlights.mostGreen)} ({Math.round((highlights.mostGreenPct ?? 0) * 100)}% green)</p>
            </div>
          )}

          {highlights.mostRed && (
            <div style={highlightCardStyle}>
              <p style={highlightLabelStyle}>Most Agreed Red Flag</p>
              <p style={highlightScenarioStyle}>"{highlights.mostRed.scenario}"</p>
              <p style={highlightBreakdownStyle}>{voteBreakdownText(highlights.mostRed)} ({Math.round((highlights.mostRedPct ?? 0) * 100)}% red)</p>
            </div>
          )}

          {highlights.closestVote && (
            <div style={highlightCardStyle}>
              <p style={highlightLabelStyle}>Closest Vote</p>
              <p style={highlightScenarioStyle}>"{highlights.closestVote.scenario}"</p>
              <p style={highlightBreakdownStyle}>{voteBreakdownText(highlights.closestVote)} (margin: {highlights.closestMargin})</p>
            </div>
          )}
        </div>
      )}

      {/* Overall Stats */}
      {allCardVotes.length > 0 && (
        <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: '365px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <p style={{ ...sectionHeadingStyle, marginBottom: '8px' }}>OVERALL STATS</p>
          <div style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '4px 16px' }}>
            <div style={statRowStyle}>
              <span style={statLabelStyle}>Average Group Agreement</span>
              <span style={statValueStyle}>{stats.avgAgreement}%</span>
            </div>
            <div style={statRowStyle}>
              <span style={statLabelStyle}>Unanimous Decisions</span>
              <span style={statValueStyle}>{stats.unanimousCount}</span>
            </div>
            <div style={statRowStyle}>
              <span style={statLabelStyle}>Split Decisions</span>
              <span style={statValueStyle}>{stats.splitCount}</span>
            </div>
            <div style={{ ...statRowStyle, borderBottom: 'none' }}>
              <span style={statLabelStyle}>"Depends" Votes</span>
              <span style={statValueStyle}>{stats.totalDepends}</span>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="done-btns" style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '8px', alignItems: 'center', width: '100%', maxWidth: '365px' }}>
        <button className="game-btn" onClick={onClose} style={{
          flex: 1, border: '1px solid #fff', background: 'none', borderRadius: '999px',
          padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px',
          color: '#fff', letterSpacing: '0.05em', boxShadow: '0 10px 24px rgba(0,0,0,0.25)', cursor: 'pointer',
        }}>
          BROWSE GAMES
        </button>
        <button className="game-btn-primary" onClick={onPlayAgain} style={{
          flex: 1, background: '#dc2827', border: 'none', borderRadius: '999px',
          padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px',
          color: '#fff', letterSpacing: '0.05em', cursor: 'pointer',
        }}>
          PLAY AGAIN
        </button>
      </div>
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
  const [allCardVotes, setAllCardVotes] = useState<CardVoteRecord[]>([])
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
      setTimeout(() => {
        setPhase('results')
      }, 500)
    } else {
      setTimeout(() => {
        setVotingPlayerIndex(votingPlayerIndex + 1)
      }, 500)
    }
  }, [votes, votingPlayerIndex, players.length])

  const handleNext = useCallback((skipped = false) => {
    if (skipped) {
      setSkipCount(c => c + 1)
    } else {
      // Record votes for this card
      setAllCardVotes(prev => [...prev, { scenario, votes }])
    }
    const nextCard = cardIndex + 1
    const nextPlayer = (playerIndex + 1) % players.length
    setCardIndex(nextCard)
    setPlayerIndex(nextPlayer)
    setFlipped(false)
    setPhase('card-front')
    setVotes([])
    setVotingPlayerIndex(0)
  }, [cardIndex, playerIndex, players.length, scenario, votes])

  const handlePlayAgain = useCallback(() => {
    setCardIndex(0)
    setPlayerIndex(0)
    setSkipCount(0)
    setFlipped(false)
    setPhase('card-front')
    setVotes([])
    setVotingPlayerIndex(0)
    setAllCardVotes([])
  }, [])

  /* Game Complete */
  if (isDone) {
    return (
      <SessionComplete
        players={players}
        totalCards={totalCards}
        skipCount={skipCount}
        allCardVotes={allCardVotes}
        onClose={onClose}
        onPlayAgain={handlePlayAgain}
      />
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
            style={{ flex: 1, border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', textAlign: 'center', boxShadow: '0 10px 24px rgba(0,0,0,0.25)', letterSpacing: '0.05em', cursor: 'pointer' }}
          >
            SKIP
          </button>
          <button className="game-btn-primary"
            onClick={handleStartVoting}
            style={{ flex: 1, background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', textAlign: 'center', letterSpacing: '0.05em', cursor: 'pointer' }}
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

        {/* Voter heading */}
        <h3 style={{
          fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
          fontSize: '28px', color: '#fff', margin: 0, textTransform: 'uppercase',
          textAlign: 'center', position: 'relative', zIndex: 2,
        }}>
          {votingPlayer.name}'S VOTE
        </h3>

        {/* Progress indicator */}
        <span style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', position: 'relative', zIndex: 2 }}>
          {votingPlayerIndex + 1} of {players.length}
        </span>

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
type Step = 'playerSetup' | 'deckSize' | 'customCards' | 'getReady' | 'game'

export default function RedFlagGreenFlagGame({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>('playerSetup')
  const [players, setPlayers] = useState<Player[]>([])
  const [totalCards, setTotalCards] = useState(0)
  const [playerIndex, setPlayerIndex] = useState(0)
  const [shuffledScenarios, setShuffledScenarios] = useState(() => getShuffledDeck(SCENARIOS, 'red-flag-green-flag'))
  const [customCards, setCustomCards] = useState<string[]>([])

  const currentPlayer = players.length > 0 ? players[playerIndex] : null

  const goToGame = useCallback(() => setStep('game'), [])

  const startGame = (custom: string[]) => {
    setCustomCards(custom)
    const generated = getShuffledDeck(SCENARIOS, 'red-flag-green-flag')
    const allScenarios = shuffle([...custom, ...generated])
    const trimmed = totalCards > 0 ? allScenarios.slice(0, totalCards) : allScenarios
    setShuffledScenarios(trimmed)
    if (totalCards > trimmed.length) setTotalCards(trimmed.length)
    setPlayerIndex(0)
    setStep('getReady')
  }

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
            setStep('customCards')
          }}
        />
      )}

      {step === 'customCards' && (
        <SharedCustomCards
          maxCards={totalCards}
          onBack={() => setStep('deckSize')}
          onNext={startGame}
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
