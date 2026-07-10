import { useState, useCallback } from 'react'
import SharedPlayerSetup, { type Player } from './components/PlayerSetup'
import SharedDeckSize from './components/DeckSize'
import SharedCustomCards from './components/CustomCards'
import SharedGetReady from './components/GetReady'
import { GameNav, GameFooter } from './components/GameShell'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* ─── Cloudinary assets ─── */
const CDN = 'https://res.cloudinary.com/oluwatosin17/image/upload/decked/game-assets'

type Relationship = 'partner' | 'friends' | 'family' | 'colleagues' | 'group' | 'random'
type Journey = 'full' | 'warm-up' | 'connect' | 'reflect'
type Stage = 'warm-up' | 'connect' | 'reflect'

const RELATIONSHIP_OPTIONS: { id: Relationship; label: string; icon: string }[] = [
  { id: 'partner',    label: 'Partner',    icon: '/icons/couples.svg' },
  { id: 'friends',    label: 'Friends',    icon: '/icons/friends.svg' },
  { id: 'family',     label: 'Family',     icon: '/icons/family.svg' },
  { id: 'colleagues', label: 'Colleagues', icon: `${CDN}/colleague.svg` },
  { id: 'group',      label: 'Group',      icon: `${CDN}/group.svg` },
  { id: 'random',     label: 'Random',     icon: '/icons/random.svg' },
]

const QUESTIONS: Record<Relationship, Record<Stage, string[]>> = {
  partner: {
    'warm-up': [
      "What was your first impression of me?",
      "What's one thing about me you noticed before we even talked?",
      "What do you think I thought of you the first time we met?",
      "What's something about my appearance that you found attractive early on?",
      "What did you think my personality would be like before you knew me?",
      "What's something you remember about our first conversation?",
      "What's one thing about me that surprised you when we first started getting to know each other?",
      "How would you describe me to a friend who's never met me?",
      "What made you want to keep talking to me after we first met?",
      "What's something I do that you noticed on our first date?",
    ],
    connect: [
      "What's something you've always wanted to ask me but haven't?",
      "What's the most meaningful thing I've ever said to you?",
      "When have you felt most loved by me?",
      "What's something about our relationship that you're most proud of?",
      "What's a fear you have about us that you've never shared?",
      "What's a moment with me that changed you?",
      "When do you feel most emotionally connected to me?",
      "What's something I do that makes you feel safe?",
      "What's the hardest thing about loving me?",
      "What do you need from me that you haven't asked for?",
    ],
    reflect: [
      "What has our relationship taught you about yourself?",
      "How have I changed since you first knew me?",
      "What do you think is the most important thing we've built together?",
      "If you could relive one moment from our relationship, which one?",
      "What would you tell someone about what real love looks like, based on us?",
      "What's one thing you want to promise me going forward?",
      "How has loving me changed the way you see love?",
      "What do you think we need more of in our relationship?",
      "What's the most honest thing you could say to me right now?",
      "What do you want our future to look like?",
    ],
  },
  friends: {
    'warm-up': [
      "What was your first impression of me?",
      "What do you think I'm like when you're not around?",
      "What do you think my biggest strength is?",
      "How would you describe me to someone who doesn't know me?",
      "What's something you remember from the first time we hung out?",
      "What do you think most people get wrong about me?",
      "What did you think when you first heard my name?",
      "What's one word you'd use to describe our friendship?",
      "What's an outfit I've worn that you still remember?",
      "What's a habit of mine that you've noticed?",
    ],
    connect: [
      "What's something you've never told me?",
      "When have you felt most supported by me?",
      "What's a moment in our friendship that really mattered to you?",
      "What's something about me that you admire?",
      "What do you think I'm afraid of that I don't talk about?",
      "When have you felt closest to me?",
      "What's a conversation we've had that stuck with you?",
      "What do you wish I knew about you?",
      "What's something I've done that hurt you but you never said?",
      "What does our friendship give you that others don't?",
    ],
    reflect: [
      "How has our friendship changed you as a person?",
      "What do you think our friendship will look like in ten years?",
      "What's the most important thing you've learned from me?",
      "If you could go back and tell yourself something before we met, what?",
      "What's one thing you'd never want to change about our friendship?",
      "What's a promise you'd want to make to each other?",
      "What have we been through together that made us stronger?",
      "What do you think makes our friendship work?",
      "What's the most honest thing you could say to me right now?",
      "What do you want me to know that I might not?",
    ],
  },
  family: {
    'warm-up': [
      "What's a memory of us that always makes you smile?",
      "What do you think people notice first about our family?",
      "What's a quirk of mine that only family would know?",
      "How would you describe our family dynamic to a stranger?",
      "What's a childhood memory of us that you treasure?",
      "What's something about me you didn't appreciate until you were older?",
      "What's a family tradition you secretly love the most?",
      "What do you think is my best quality?",
      "What's something I did as a child that you still remember?",
      "What role do you think I play in our family?",
    ],
    connect: [
      "What's something you wish I understood about you?",
      "When have you felt most proud of me?",
      "What's a conversation we should have had but never did?",
      "What's something I've done that really meant a lot to you?",
      "What do you think our family needs more of?",
      "What's a time you felt let down by our family?",
      "What's something you're grateful I taught you?",
      "When do you feel most connected to me?",
      "What's a family pattern you'd like us to break?",
      "What's something you carry from our family that shapes who you are?",
    ],
    reflect: [
      "What has being part of this family taught you about love?",
      "What do you want our family legacy to be?",
      "How have we grown as a family over the years?",
      "What would you change about how we communicate?",
      "What's one thing you want me to always remember?",
      "What's the most honest thing you could say to me right now?",
      "What do you think holds our family together?",
      "What do you want for our family's future?",
      "What have you forgiven that was hard?",
      "What's a truth about our family that nobody talks about but should?",
    ],
  },
  colleagues: {
    'warm-up': [
      "What was your first impression of me at work?",
      "What do you think my working style is?",
      "What's something about me that surprised you professionally?",
      "How would you describe my role to someone outside?",
      "What do you think I'm most passionate about at work?",
      "What's a professional strength of mine you've noticed?",
      "What's one thing you remember from our first meeting?",
      "What do you think I value most in my career?",
      "What's something I bring to the team that others might not see?",
      "How would you describe me as a collaborator?",
    ],
    connect: [
      "What's the best piece of professional advice you'd give me?",
      "What do you think I'm most insecure about at work?",
      "What's a moment at work where I really impressed you?",
      "What do you wish was different about how we work together?",
      "What's something I've taught you without realising?",
      "When do you think I do my best work?",
      "What's a challenge I've handled that you respect?",
      "What do you think I should know about how I come across?",
      "What's something about the work culture you wish you could change?",
      "What motivates you that most colleagues wouldn't guess?",
    ],
    reflect: [
      "What has working together taught you about collaboration?",
      "How do you think our professional relationship has evolved?",
      "What's the most valuable thing you've learned from this team?",
      "What would you want our working relationship to look like going forward?",
      "What's one professional truth you've learned the hard way?",
      "What does meaningful work really mean to you?",
      "If you could redesign how teams work, what would you change?",
      "What's one thing you want people to remember about working with you?",
      "What's the most honest feedback you could give me right now?",
      "What do you think makes a great professional partnership?",
    ],
  },
  group: {
    'warm-up': [
      "What's one thing you think everyone here would agree on about you?",
      "What do you think your first impression was on most people here?",
      "What's something about you that surprises people when they learn it?",
      "How would you describe yourself in three words?",
      "What do you think is your most obvious trait?",
      "What's something people assume about you that's actually wrong?",
      "What's a talent of yours that nobody here has seen?",
      "What do you think makes you a good friend?",
      "What's a random fact about you that always gets a reaction?",
      "What's something you notice about people that others miss?",
    ],
    connect: [
      "What's something you're going through that nobody here knows about?",
      "What's a meaningful compliment you've received that you still think about?",
      "When was the last time you felt truly understood by someone?",
      "What's one thing you wish you could tell everyone in this room?",
      "What do you think people in this room don't know about each other?",
      "What's a fear you carry that you rarely share?",
      "When have you felt most vulnerable around others?",
      "What's something you've been avoiding saying?",
      "What do you need from the people around you right now?",
      "What's a truth about yourself you've only recently accepted?",
    ],
    reflect: [
      "What has tonight's conversation taught you about someone here?",
      "What do you think we all have in common that nobody would expect?",
      "What's the most important thing about human connection?",
      "What do you want to be remembered for by the people in this room?",
      "What's one thing you're taking away from this experience?",
      "How has this conversation changed how you see someone here?",
      "What's a question you wish someone would ask you?",
      "What's the most honest thing you could say right now?",
      "What do you think the world needs more of?",
      "What do you want to say to someone here that you haven't yet?",
    ],
  },
  random: {
    'warm-up': [],
    connect: [],
    reflect: [],
  },
}

function getQuestions(relationship: Relationship, stage: Stage): string[] {
  if (relationship === 'random') {
    const allRels = Object.keys(QUESTIONS).filter(k => k !== 'random') as Relationship[]
    const pool: string[] = []
    for (const r of allRels) pool.push(...QUESTIONS[r][stage])
    return shuffle([...new Set(pool)])
  }
  return shuffle([...QUESTIONS[relationship][stage]])
}

function buildDeck(relationship: Relationship, journey: Journey, deckSize: number, customCards: string[]): { questions: string[]; stageBreaks: { stage: Stage; start: number; end: number }[] } {
  const stages: Stage[] = journey === 'full'
    ? ['warm-up', 'connect', 'reflect']
    : [journey as Stage]

  const aiSlots = Math.max(0, deckSize - customCards.length)
  const perStage = Math.ceil(aiSlots / stages.length)

  const allQuestions = [...customCards]
  const stageBreaks: { stage: Stage; start: number; end: number }[] = []

  let currentIdx = customCards.length
  for (const stage of stages) {
    const stageQ = getQuestions(relationship, stage).slice(0, perStage)
    const start = currentIdx
    allQuestions.push(...stageQ)
    currentIdx += stageQ.length
    stageBreaks.push({ stage, start, end: currentIdx })
  }

  return { questions: allQuestions.slice(0, deckSize), stageBreaks }
}

function getStageName(stage: Stage): string {
  return stage === 'warm-up' ? 'Warm Up' : stage === 'connect' ? 'Connect' : 'Reflect'
}

function getStageForCard(cardIndex: number, stageBreaks: { stage: Stage; start: number; end: number }[]): Stage {
  for (const b of stageBreaks) {
    if (cardIndex >= b.start && cardIndex < b.end) return b.stage
  }
  return stageBreaks[stageBreaks.length - 1]?.stage ?? 'warm-up'
}

/* ─── WNRS Card ─── */
function WNRSCard({ question, stage, flipped, onFlip }: { question: string; stage: Stage; flipped: boolean; onFlip: () => void }) {
  const WNRS_GREEN = '#1a9e47'

  return (
    <div
      onClick={!flipped ? onFlip : undefined}
      style={{ width: '340px', height: '440px', perspective: '1000px', cursor: flipped ? 'default' : 'pointer' }}
    >
      <div style={{
        width: '100%', height: '100%', position: 'relative',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}>
        {/* Front - green card */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          background: WNRS_GREEN, borderRadius: '16px', overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(26,158,71,0.35)',
        }}>
          {/* Top stripes */}
          <div style={{ position: 'absolute', top: '8px', left: 0, right: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ height: '2px', background: 'rgba(255,255,255,0.4)' }} />
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.4)' }} />
          </div>
          {/* Bottom stripes */}
          <div style={{ position: 'absolute', bottom: '8px', left: 0, right: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ height: '2px', background: 'rgba(255,255,255,0.4)' }} />
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.4)' }} />
          </div>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
            <p style={{
              fontFamily: "'Satoshi', sans-serif", fontWeight: 700,
              fontSize: '18px', color: '#fff',
              textAlign: 'center', textTransform: 'uppercase',
              lineHeight: 1.3, margin: 0, letterSpacing: '0.04em',
            }}>
              We're not really strangers
            </p>
          </div>
        </div>
        {/* Back - white card with question */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: '#fff', borderRadius: '16px', overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(26,158,71,0.35)',
        }}>
          {/* Top green band with stripes */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '24px', background: WNRS_GREEN }}>
            <div style={{ position: 'absolute', bottom: '4px', left: 0, right: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <div style={{ height: '1.5px', background: 'rgba(255,255,255,0.5)' }} />
              <div style={{ height: '2.5px', background: 'rgba(255,255,255,0.5)' }} />
            </div>
          </div>
          {/* Bottom green band */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '24px', background: WNRS_GREEN }}>
            <div style={{ position: 'absolute', top: '4px', left: 0, right: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <div style={{ height: '1.5px', background: 'rgba(255,255,255,0.5)' }} />
              <div style={{ height: '2.5px', background: 'rgba(255,255,255,0.5)' }} />
            </div>
          </div>
          {/* Question */}
          <div style={{ position: 'absolute', top: '40px', left: '28px', right: '28px', bottom: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{
              fontFamily: "'Satoshi', sans-serif", fontWeight: 700,
              fontSize: '22px', color: WNRS_GREEN,
              textAlign: 'center', textTransform: 'uppercase',
              lineHeight: 1.3, margin: 0,
            }}>
              {question}
            </p>
          </div>
          {/* Stage label */}
          <div style={{ position: 'absolute', bottom: '32px', left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <span style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 700, fontSize: '8px', color: WNRS_GREEN, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              WE'RE NOT REALLY STRANGERS
            </span>
            <span style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 500, fontSize: '8px', color: WNRS_GREEN, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {getStageName(stage)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Selection Screen ─── */
function SelectionScreen<T extends string>({ title, options, onSelect }: {
  title: string
  options: { id: T; label: string; icon: string }[]
  onSelect: (id: T) => void
}) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [pressed, setPressed] = useState<string | null>(null)

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '40px' }}>
      <div style={{ width: '560px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'center' }}>
        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center' }}>{title}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%' }}>
          {options.map((opt, i) => {
            const isH = hovered === opt.id
            const isP = pressed === opt.id
            return (
              <button key={opt.id}
                onMouseEnter={() => setHovered(opt.id)}
                onMouseLeave={() => { setHovered(null); setPressed(null) }}
                onMouseDown={() => setPressed(opt.id)}
                onMouseUp={() => setPressed(null)}
                onClick={() => setTimeout(() => onSelect(opt.id), 80)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  background: isH ? '#1e1e22' : '#111113',
                  border: '1px solid', borderColor: isH ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                  borderRadius: '12px', padding: '12px', height: '56px', cursor: 'pointer',
                  transform: isP ? 'scale(0.97)' : isH ? 'translateY(-2px)' : 'translateY(0)',
                  boxShadow: isH ? '0 6px 20px rgba(0,0,0,0.35)' : 'none',
                  transition: 'background 0.18s, border-color 0.18s, transform 0.15s, box-shadow 0.18s',
                  animation: `screen-enter 0.4s var(--ease-out) ${0.07 + Math.floor(i / 2) * 0.06}s both`,
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '16px', background: isH ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.18s' }}>
                  <img src={opt.icon} alt={opt.label} style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                </div>
                <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '17px', color: isH ? '#fff' : 'rgba(255,255,255,0.55)', textAlign: 'left', lineHeight: 'normal', whiteSpace: 'nowrap', transition: 'color 0.18s' }}>{opt.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─── Journey Selection ─── */
function JourneySelect({ onSelect }: { onSelect: (j: Journey) => void }) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [pressed, setPressed] = useState<string | null>(null)
  const WNRS_GREEN = '#1a9e47'

  const journeys: { id: Journey; label: string; icon: string; desc: string }[] = [
    { id: 'full', label: 'Full Journey', icon: `${CDN}/full-journey.svg`, desc: 'Warm Up → Connect → Reflect' },
    { id: 'warm-up', label: 'Warm Up', icon: `${CDN}/warm-up.svg`, desc: 'Perception & first impressions' },
    { id: 'connect', label: 'Connect', icon: `${CDN}/connect.svg`, desc: 'Meaningful & personal' },
    { id: 'reflect', label: 'Reflect', icon: `${CDN}/reflect.svg`, desc: 'Reflection on the conversation' },
  ]

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '40px' }}>
      <div style={{ width: '560px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center' }}>
        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center' }}>Choose Your Journey</h2>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {journeys.map((j, i) => {
            const isH = hovered === j.id
            const isP = pressed === j.id
            const isFull = j.id === 'full'
            return (
              <button key={j.id}
                onMouseEnter={() => setHovered(j.id)}
                onMouseLeave={() => { setHovered(null); setPressed(null) }}
                onMouseDown={() => setPressed(j.id)}
                onMouseUp={() => setPressed(null)}
                onClick={() => setTimeout(() => onSelect(j.id), 80)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  background: isH ? '#1e1e22' : '#111113',
                  border: isFull ? `1px solid ${WNRS_GREEN}44` : '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '12px', padding: '14px 16px', cursor: 'pointer',
                  transform: isP ? 'scale(0.97)' : isH ? 'translateY(-2px)' : 'translateY(0)',
                  boxShadow: isH ? '0 6px 20px rgba(0,0,0,0.35)' : 'none',
                  transition: 'background 0.18s, border-color 0.18s, transform 0.15s, box-shadow 0.18s',
                  animation: `screen-enter 0.4s var(--ease-out) ${0.07 + i * 0.06}s both`,
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '18px', background: isH ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <img src={j.icon} alt="" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                  <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '17px', color: isH ? '#fff' : 'rgba(255,255,255,0.55)', transition: 'color 0.18s' }}>
                    {j.label}
                    {isFull && <span style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '11px', color: WNRS_GREEN, marginLeft: '8px', fontWeight: 500 }}>Recommended</span>}
                  </span>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.3 }}>{j.desc}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─── Gameplay ─── */
function GamePlay({ players, cardIndex, totalCards, skipCount, question, stage, deeperConversations, onSkip, onNext, onPlayAgain, onBrowseGames }: {
  players: Player[]; cardIndex: number; totalCards: number; skipCount: number
  question: string; stage: Stage; deeperConversations: number
  onSkip: () => void; onNext: () => void
  onPlayAgain: () => void; onBrowseGames: () => void
}) {
  const [flipped, setFlipped] = useState(false)
  const isDone = totalCards > 0 && cardIndex >= totalCards
  const currentPlayer = players.length > 0 ? players[cardIndex % players.length] : null
  const WNRS_GREEN = '#1a9e47'

  if (isDone) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px', padding: '40px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textAlign: 'center' }}>
          <h2 className="done-heading" style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '48px', color: '#fff', margin: 0, textTransform: 'uppercase' }}>You're Decked</h2>
          <p className="done-subtitle" style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            Thank you for taking the time to connect.
          </p>
        </div>

        <div style={{ background: '#18181b', borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '20px 32px' }}>
          {[
            { count: totalCards, label: 'CARDS' },
            { count: skipCount, label: 'SKIPPED' },
            { count: Math.max(players.length, 1), label: 'PLAYERS' },
          ].map((stat, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.1)', margin: '0 28px' }} />}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '40px', color: '#fff', lineHeight: 1 }}>{stat.count}</span>
                <span style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="done-card" style={{ width: '120px', height: '155px', background: WNRS_GREEN, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(26,158,71,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '6px', left: 0, right: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.4)' }} />
            <div style={{ height: '2px', background: 'rgba(255,255,255,0.4)' }} />
          </div>
          <div style={{ position: 'absolute', bottom: '6px', left: 0, right: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.4)' }} />
            <div style={{ height: '2px', background: 'rgba(255,255,255,0.4)' }} />
          </div>
          <p style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 700, fontSize: '10px', color: '#fff', textAlign: 'center', textTransform: 'uppercase', margin: 0 }}>We're not really strangers</p>
        </div>

        <div className="done-btns" style={{ display: 'flex', gap: '8px' }}>
          <button className="game-btn" onClick={onBrowseGames} style={{ border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em' }}>BROWSE GAMES</button>
          <button className="game-btn-primary" onClick={onPlayAgain} style={{ background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em' }}>PLAY AGAIN</button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '40px', position: 'relative', zIndex: 2 }}>
      {/* Stage indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: WNRS_GREEN }} />
        <span style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '13px', color: WNRS_GREEN, letterSpacing: '0.1em' }}>
          {getStageName(stage).toUpperCase()}
        </span>
      </div>

      {currentPlayer && (
        <div className="player-chip-enter" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: currentPlayer.color, border: '2px solid rgba(255,255,255,0.2)' }} />
          <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '16px', color: 'rgba(255,255,255,0.65)', letterSpacing: '0.04em' }}>
            {currentPlayer.name.toUpperCase()}'S TURN
          </span>
        </div>
      )}

      <WNRSCard question={question} stage={stage} flipped={flipped} onFlip={() => setFlipped(true)} />

      {!flipped ? (
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Tap the card to flip it.</p>
      ) : (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="game-btn" onClick={() => { setFlipped(false); setTimeout(onSkip, 120) }}
            style={{ border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', boxShadow: '0 10px 24px rgba(0,0,0,0.25)' }}>
            SKIP FOR NOW
          </button>
          <button className="game-btn-primary" onClick={() => { setFlipped(false); setTimeout(onNext, 120) }}
            style={{ background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em' }}>
            NEXT CARD
          </button>
        </div>
      )}

      {totalCards > 0 && (
        <div key={cardIndex} className="counter-in" style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em' }}>
          CARD {cardIndex + 1} OF {totalCards}
        </div>
      )}
    </div>
  )
}

/* ─── Root ─── */
type Step = 'relationship' | 'playerSetup' | 'journey' | 'deckSize' | 'customCards' | 'getReady' | 'game'

export default function WNRSGame({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>('relationship')
  const [relationship, setRelationship] = useState<Relationship>('friends')
  const [journey, setJourney] = useState<Journey>('full')
  const [players, setPlayers] = useState<Player[]>([])
  const [totalCards, setTotalCards] = useState(0)
  const [cardIndex, setCardIndex] = useState(0)
  const [playerIndex, setPlayerIndex] = useState(0)
  const [skipCount, setSkipCount] = useState(0)
  const [questions, setQuestions] = useState<string[]>([])
  const [stageBreaks, setStageBreaks] = useState<{ stage: Stage; start: number; end: number }[]>([])
  const [customCards, setCustomCards] = useState<string[]>([])

  const currentPlayer = players.length > 0 ? players[playerIndex % players.length] : null
  const currentQuestion = questions[cardIndex] ?? ''
  const currentStage = getStageForCard(cardIndex, stageBreaks)

  const connectCards = stageBreaks.find(b => b.stage === 'connect')
  const deeperConversations = connectCards ? connectCards.end - connectCards.start : Math.floor(totalCards / 3)

  const handleNext = useCallback(() => {
    const nextCard = cardIndex + 1
    const nextPlayer = players.length > 0 ? (playerIndex + 1) % players.length : 0
    setCardIndex(nextCard)
    setPlayerIndex(nextPlayer)
    if (totalCards > 0 && nextCard >= totalCards) setStep('game')
    else setStep('getReady')
  }, [cardIndex, playerIndex, players.length, totalCards])

  const handleSkip = useCallback(() => {
    setSkipCount(c => c + 1)
    handleNext()
  }, [handleNext])

  const goToGame = useCallback(() => setStep('game'), [])

  const startGame = (custom: string[]) => {
    setCustomCards(custom)
    const { questions: q, stageBreaks: sb } = buildDeck(relationship, journey, totalCards, custom)
    setQuestions(q)
    setStageBreaks(sb)
    if (totalCards > q.length) setTotalCards(q.length)
    setCardIndex(0)
    setPlayerIndex(0)
    setStep('getReady')
  }

  const handlePlayAgain = useCallback(() => {
    const { questions: q, stageBreaks: sb } = buildDeck(relationship, journey, totalCards, customCards)
    setQuestions(q)
    setStageBreaks(sb)
    setCardIndex(0)
    setPlayerIndex(0)
    setSkipCount(0)
    setStep('getReady')
  }, [relationship, journey, totalCards, customCards])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <GameNav onBack={onClose} />

      {step === 'relationship' && (
        <SelectionScreen title="Who Are You With?" options={RELATIONSHIP_OPTIONS} onSelect={id => { setRelationship(id); setStep('playerSetup') }} />
      )}

      {step === 'playerSetup' && (
        <SharedPlayerSetup
          initialPlayers={players}
          skipLabel="SKIP FOR NOW"
          onSkip={() => setStep('journey')}
          onNext={p => { setPlayers(p); setStep('journey') }}
        />
      )}

      {step === 'journey' && <JourneySelect onSelect={j => { setJourney(j); setStep('deckSize') }} />}

      {step === 'deckSize' && (
        <SharedDeckSize onBack={() => setStep('journey')} onNext={n => { setTotalCards(n); setStep('customCards') }} nextLabel="NEXT" />
      )}

      {step === 'customCards' && (
        <SharedCustomCards maxCards={totalCards} onBack={() => setStep('deckSize')} onNext={startGame} />
      )}

      {step === 'getReady' && <SharedGetReady player={currentPlayer} onReady={goToGame} />}

      {step === 'game' && (
        <GamePlay
          players={players} cardIndex={cardIndex} totalCards={totalCards}
          skipCount={skipCount} question={currentQuestion} stage={currentStage}
          deeperConversations={deeperConversations}
          onSkip={handleSkip} onNext={handleNext}
          onPlayAgain={handlePlayAgain} onBrowseGames={onClose}
        />
      )}

      <GameFooter />
    </div>
  )
}
