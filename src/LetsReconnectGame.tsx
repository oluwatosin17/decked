import { useState, useCallback } from 'react'
import SharedPlayerSetup, { type Player } from './components/PlayerSetup'
import { useScaledCard } from './hooks/useCardScale'
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
const RECONNECT_BG = `${CDN}/reconnect-card-bg.svg`

type Relationship = 'partner' | 'friends' | 'family' | 'colleagues' | 'group' | 'random'
type Depth = 'light' | 'meaningful' | 'deep'

const RELATIONSHIP_OPTIONS: { id: Relationship; label: string; icon: string }[] = [
  { id: 'partner',    label: 'Partner',    icon: '/icons/couples.svg' },
  { id: 'friends',    label: 'Friends',    icon: '/icons/friends.svg' },
  { id: 'family',     label: 'Family',     icon: '/icons/family.svg' },
  { id: 'colleagues', label: 'Colleagues', icon: `${CDN}/colleague.svg` },
  { id: 'group',      label: 'Group',      icon: `${CDN}/group.svg` },
  { id: 'random',     label: 'Random',     icon: '/icons/random.svg' },
]

const DEPTH_OPTIONS: { id: Depth; label: string; icon: string }[] = [
  { id: 'light',      label: 'Light',      icon: `${CDN}/light.svg` },
  { id: 'meaningful', label: 'Meaningful', icon: `${CDN}/meaningful.svg` },
  { id: 'deep',       label: 'Deep',       icon: `${CDN}/deep.svg` },
]

const QUESTIONS: Record<Relationship, Record<Depth, string[]>> = {
  partner: {
    light: [
      "What's a small thing I do that always makes you smile?",
      "What's your favourite way to spend a lazy Sunday together?",
      "What song reminds you of us?",
      "What's the funniest thing that's happened between us?",
      "What's one thing you'd love us to try together?",
      "What's the best meal we've ever shared?",
      "What's your favourite memory from our first few months together?",
      "What's one thing about me that surprised you when we first met?",
      "What's the most fun date we've been on?",
      "What's a little tradition you'd love us to start?",
      "What's a compliment you've been meaning to give me?",
      "What's one place you'd love us to visit someday?",
      "What's your favourite thing about coming home to each other?",
      "What hobby would you want us to pick up together?",
      "What's a movie or show that reminds you of us?",
    ],
    meaningful: [
      "What's something I've done that made you feel truly loved?",
      "How has our relationship changed you as a person?",
      "What's something you wish we talked about more?",
      "What does feeling safe with someone mean to you?",
      "What's a moment when you were really proud of us?",
      "What does partnership mean to you in everyday life?",
      "What's something you've learned about love from being with me?",
      "How do you know when I need support, even if I don't say it?",
      "What's a challenge we've overcome that made us stronger?",
      "What's something you admire about the way I handle difficult situations?",
      "When do you feel most connected to me?",
      "What's a dream you haven't shared with me yet?",
      "What's the most important thing you need from me?",
      "How has your idea of love changed since we've been together?",
      "What's a moment you knew you could trust me completely?",
    ],
    deep: [
      "What's something you've been afraid to tell me because you didn't want to hurt me?",
      "What's the hardest thing about being in a long-term relationship?",
      "What part of yourself do you feel like you hide from me?",
      "If we could start over knowing what we know now, what would you do differently?",
      "What's your biggest fear about our future together?",
      "What does unconditional love look like to you, and have you ever felt it?",
      "What's a wound from your past that still affects how you love me?",
      "When was the last time you felt truly alone, even with me around?",
      "What do you think is the hardest truth about relationships that nobody talks about?",
      "What's the one thing you'd never want to change about us?",
      "What would you do if you felt we were growing apart?",
      "What's the most vulnerable you've ever been with me?",
      "What are you still healing from that affects our relationship?",
      "What does forgiveness mean to you in the context of us?",
      "If you could ask me one question and be guaranteed an honest answer, what would it be?",
    ],
  },
  friends: {
    light: [
      "What's the funniest memory you have of us?",
      "What's something I do that always makes you laugh?",
      "If we had a band, what would it be called?",
      "What's one thing you'd never do alone but would do with me?",
      "What's the best trip or adventure we've had together?",
      "What's a song that reminds you of our friendship?",
      "What's the most random thing we've bonded over?",
      "What would our friendship look like as a TV show?",
      "What's the best advice I've ever given you?",
      "What's a skill you have that I'll never have?",
      "What's the weirdest thing we've done together?",
      "If we could go on any trip right now, where would you choose?",
      "What's one thing that never gets old between us?",
      "What's your favourite inside joke we share?",
      "What's something you've always wanted to tell me but never found the right moment?",
    ],
    meaningful: [
      "What does our friendship mean to you in a way you've never said?",
      "When have I shown up for you in a way that really mattered?",
      "What's something you've learned about yourself through our friendship?",
      "What's a difficult time in your life when I made a difference?",
      "How do you think we've both changed since we first became friends?",
      "What's something I don't know about you that you'd like to share?",
      "What quality of mine do you value most?",
      "When did you first realise we'd be close friends?",
      "What's something you're going through that you haven't talked about?",
      "What does loyalty in a friendship mean to you?",
      "How do you think we handle disagreements?",
      "What's a way I've inspired you without realising it?",
      "What's one thing you wish more people knew about you?",
      "What does a strong friendship look like to you?",
      "What's a promise you'd want us to make to each other?",
    ],
    deep: [
      "What's the loneliest you've ever felt, and did I know about it?",
      "What's something you've forgiven me for that I may not know about?",
      "What's a fear you carry that you rarely share with anyone?",
      "What part of yourself do you feel like you hide, even around me?",
      "What does it feel like when a friendship fades, and have you ever felt it happening with us?",
      "What's a truth about yourself you've only recently accepted?",
      "What would you want me to know if something happened to you tomorrow?",
      "How has loss or grief shaped the way you love your friends?",
      "What's the hardest conversation you've ever had to have with someone you care about?",
      "What's a belief about friendship you've had to let go of?",
      "What do you think is the most important thing in any relationship?",
      "What's a boundary you've learned to set that was hard for you?",
      "What's something you're still healing from?",
      "When do you feel most understood by me?",
      "What's the most honest thing you've never said to me?",
    ],
  },
  family: {
    light: [
      "What's your favourite family tradition?",
      "What's the funniest thing that's happened at a family gathering?",
      "What's a family recipe that means a lot to you?",
      "What's a childhood memory that always makes you smile?",
      "If our family had a motto, what would it be?",
      "What's the best holiday or trip we've had as a family?",
      "What's a game or activity we used to do together that you miss?",
      "What's something about our family that makes you proud?",
      "What's a song that reminds you of family?",
      "What's the most ridiculous family argument we've ever had?",
      "What's one thing each person in our family is known for?",
      "What's a talent or quirk that runs in our family?",
      "What would you choose for a family activity day?",
      "What's the best gift you've ever received from a family member?",
      "What's a family story that gets told at every gathering?",
    ],
    meaningful: [
      "What's something a family member has done for you that you'll never forget?",
      "How has our family shaped the person you are today?",
      "What's a value you learned from your family that you carry with you?",
      "What's something you wish we talked about more openly as a family?",
      "Who in our family has influenced you the most, and how?",
      "What does home mean to you beyond the physical place?",
      "What's a family memory that changed the way you see the world?",
      "What's one thing you'd want to pass on to the next generation?",
      "What's a moment you felt truly supported by your family?",
      "How do you show love to your family, and how do you like to receive it?",
      "What's something you appreciate about our family that you didn't understand as a child?",
      "What family tradition would you want to keep alive no matter what?",
      "What's a challenge our family has faced that brought us closer?",
      "What role do you play in our family, and how do you feel about it?",
      "What does unconditional love look like in a family?",
    ],
    deep: [
      "What's something you wish you could say to a family member but haven't?",
      "What's a family pattern or dynamic that you want to break?",
      "What's the hardest thing about being part of this family?",
      "What's a family secret or unspoken truth that affects you?",
      "How has your relationship with your parents shaped how you love others?",
      "What's a wound from your childhood that you're still healing from?",
      "What does forgiveness mean to you within family?",
      "What's something you need from your family that you're not getting?",
      "What would you change about how you were raised?",
      "What's a loss within our family that still affects you deeply?",
      "When have you felt most misunderstood by your family?",
      "What are you most afraid of when it comes to family?",
      "What does it mean to truly know someone in your family?",
      "What's a conversation you've been avoiding with a family member?",
      "If you could heal one thing in our family, what would it be?",
    ],
  },
  colleagues: {
    light: [
      "What's the funniest thing that's happened at work?",
      "If you could swap roles with anyone at work for a day, who would it be?",
      "What's your go-to order at the office café?",
      "What was your first impression of this team?",
      "What's the most random thing on your desk right now?",
      "What would be your dream work project?",
      "What's a hidden talent you have that nobody at work knows about?",
      "If our team had a theme song, what would it be?",
      "What's the best work perk you've ever had?",
      "What's a fun fact about you that would surprise your colleagues?",
      "What's your favourite thing about our team culture?",
      "If you could add one thing to the office, what would it be?",
      "What's the best team lunch or outing we've had?",
      "What's a job you had before this one that was completely different?",
      "What's one thing you wish was different about how we work?",
    ],
    meaningful: [
      "What's the most rewarding project you've worked on here?",
      "How has this job shaped who you are outside of work?",
      "What's something you've learned from a colleague that stuck with you?",
      "What does good leadership look like to you?",
      "What's a professional challenge that helped you grow?",
      "What do you wish more people understood about your role?",
      "What motivates you beyond the pay cheque?",
      "What's the best piece of career advice you've ever received?",
      "How do you define success for yourself?",
      "What's something you're proud of at work that nobody noticed?",
      "What kind of support do you need most from your team?",
      "What's a work achievement that means more to you than people realise?",
      "How do you recharge after a tough work week?",
      "What's one thing you'd change about how teams communicate?",
      "What does meaningful work look like to you?",
    ],
    deep: [
      "What's the hardest decision you've had to make at work?",
      "Have you ever felt like you couldn't be yourself at work? Why?",
      "What's a professional failure that taught you the most?",
      "How do you handle pressure when nobody's watching?",
      "What's something about the work culture that needs to change?",
      "When have you felt most valued at work, and when have you felt invisible?",
      "What's a professional boundary you've had to learn the hard way?",
      "What do you think holds people back from being honest at work?",
      "What would you do if you had complete freedom in your career?",
      "What's a truth about your industry that nobody likes to talk about?",
      "What does integrity at work mean to you?",
      "How do you deal with imposter syndrome?",
      "What's the biggest sacrifice you've made for your career?",
      "What do you want your professional legacy to be?",
      "What would it take for you to feel truly fulfilled at work?",
    ],
  },
  group: {
    light: [
      "What's the most unexpected thing about you that nobody here knows?",
      "If you could have any superpower, what would it be and why?",
      "What's your go-to karaoke song?",
      "What's the last thing that made you genuinely laugh out loud?",
      "If you could live in any era, which would you choose?",
      "What's your comfort food when you've had a rough day?",
      "What's the most interesting place you've ever been?",
      "If you could learn any skill overnight, what would you pick?",
      "What's a TV show you could rewatch forever?",
      "What's the best spontaneous decision you've ever made?",
      "What's one thing on your bucket list?",
      "What's the weirdest food combination you secretly enjoy?",
      "If you could have dinner with anyone, living or dead, who?",
      "What's a hobby you've picked up recently?",
      "What's the most useless talent you have?",
    ],
    meaningful: [
      "What's a belief you hold that most people disagree with?",
      "What's the most important lesson life has taught you?",
      "Who has had the biggest influence on who you are today?",
      "What does success mean to you personally?",
      "What's something you're proud of that others might not notice?",
      "What's a question you wish people would ask you more often?",
      "What value or principle do you refuse to compromise on?",
      "What's a mistake that turned out to be a blessing?",
      "What does being a good person mean to you?",
      "What's something you've changed your mind about as you've grown?",
      "What does vulnerability look like to you?",
      "What's a habit or practice that genuinely changed your life?",
      "What do you think the world needs more of right now?",
      "What's a moment that changed the way you see yourself?",
      "How do you define a meaningful relationship?",
    ],
    deep: [
      "What's the hardest thing you've ever had to accept about yourself?",
      "What does loneliness feel like to you?",
      "What's a fear you've never told anyone about?",
      "What's the most honest thing you could say right now?",
      "What do you think people misunderstand most about you?",
      "What's a moment in your life you wish you could go back and change?",
      "What do you struggle with that nobody sees?",
      "What's a truth you've been running from?",
      "What does healing look like for you?",
      "If you could be completely honest with one person, who and what?",
      "What keeps you up at night?",
      "What's the most important conversation you've never had?",
      "What would you tell your younger self about pain?",
      "What are you most afraid of losing?",
      "What do you want people to remember about you?",
    ],
  },
  random: {
    light: [
      "What's the best compliment you've ever received?",
      "What's the strangest thing you've ever Googled?",
      "If you could only eat one cuisine for the rest of your life, what would it be?",
      "What's a conspiracy theory you find weirdly compelling?",
      "What's the most overrated thing in popular culture right now?",
      "If you had to teach a class on anything, what would it be?",
      "What's the best random act of kindness you've witnessed?",
      "What's a movie that always makes you cry?",
      "What's the most interesting Wikipedia rabbit hole you've gone down?",
      "What are you irrationally afraid of?",
      "What's the best piece of advice a stranger has given you?",
      "What's a word you always misspell?",
      "What's the most adventurous thing you've done?",
      "If you had to pick a different career, what would it be?",
      "What's a hill you'll die on that nobody cares about?",
    ],
    meaningful: [
      "What does happiness actually look like in your everyday life?",
      "What's a relationship that shaped you in ways you didn't expect?",
      "What do you wish you'd been told earlier in life?",
      "What's a moment of clarity you've had recently?",
      "What are you most grateful for that you rarely acknowledge?",
      "What does growing up mean to you?",
      "What's a quality in others that you deeply respect?",
      "What's the most challenging thing you're navigating right now?",
      "What's an assumption people make about you that's wrong?",
      "What would you tell yourself a year from now?",
      "How do you measure whether you're living well?",
      "What's a conversation that changed your perspective?",
      "What do you need more of in your life?",
      "What has experience taught you that you couldn't learn from a book?",
      "What's a memory that still gives you chills?",
    ],
    deep: [
      "What's the most important thing you've learned about yourself?",
      "What do you carry from your past that still weighs on you?",
      "What's a truth you only realised through pain?",
      "What does it mean to truly know yourself?",
      "What's a part of yourself you've had to let go of?",
      "What's the difference between being alive and truly living?",
      "What would it take for you to feel at peace?",
      "What do you think happens when we die?",
      "What's the most important thing in life that most people overlook?",
      "What's a question you're afraid to know the answer to?",
      "What does freedom mean to you, honestly?",
      "What have you forgiven yourself for?",
      "What's a sacrifice you've made that nobody knows about?",
      "What would your life look like if fear didn't exist?",
      "What do you want your life to stand for?",
    ],
  },
}

function getQuestions(relationship: Relationship, depth: Depth): string[] {
  if (relationship === 'random') {
    const allRelationships = Object.keys(QUESTIONS) as Relationship[]
    const pool: string[] = []
    for (const r of allRelationships) {
      pool.push(...QUESTIONS[r][depth])
    }
    return shuffle([...new Set(pool)])
  }
  return shuffle([...QUESTIONS[relationship][depth]])
}

/* ─── Reconnect Card ─── */
function ReconnectCard({ question, flipped, onFlip }: { question: string; flipped: boolean; onFlip: () => void }) {
  const { wrapperStyle, cardStyle } = useScaledCard(320, 400)
  return (
    <div style={wrapperStyle}>
    <div
      onClick={!flipped ? onFlip : undefined}
      className="game-card" style={{ ...cardStyle, perspective: '1000px', cursor: flipped ? 'default' : 'pointer' }}
    >
      <div style={{
        width: '100%', height: '100%', position: 'relative',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}>
        {/* Front */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          borderRadius: '16px', overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(210,47,73,0.4)',
        }}>
          <img src={RECONNECT_BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontFamily: "'Luckiest Guy', cursive", fontSize: '32px', color: '#d22f49', textAlign: 'center', lineHeight: 1.15, margin: 0, padding: '20px' }}>
              Let's reconnect
            </p>
          </div>
        </div>
        {/* Back */}
        <div style={{
          position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          borderRadius: '16px', overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(210,47,73,0.4)',
        }}>
          <img src={RECONNECT_BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px' }}>
            <p style={{
              fontFamily: "'Anton SC', sans-serif", fontWeight: 400,
              fontSize: '22px', color: '#d22f49',
              textAlign: 'center', textTransform: 'uppercase',
              lineHeight: 1.25, margin: 0, letterSpacing: '0.02em',
            }}>
              {question}
            </p>
          </div>
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
        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center' }}>
          {title}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: options.length <= 3 ? '1fr' : '1fr 1fr', gap: '10px', width: '100%', maxWidth: '560px' }}>
          {options.map((opt, i) => {
            const isHovered = hovered === opt.id
            const isPressed = pressed === opt.id
            const delay = 0.07 + Math.floor(i / (options.length <= 3 ? 1 : 2)) * 0.06
            return (
              <button
                key={opt.id}
                onMouseEnter={() => setHovered(opt.id)}
                onMouseLeave={() => { setHovered(null); setPressed(null) }}
                onMouseDown={() => setPressed(opt.id)}
                onMouseUp={() => setPressed(null)}
                onClick={() => setTimeout(() => onSelect(opt.id), 80)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  background: isHovered ? '#1e1e22' : '#111113',
                  border: '1px solid', borderColor: isHovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                  borderRadius: '12px', padding: '12px', height: '56px', cursor: 'pointer',
                  transform: isPressed ? 'scale(0.97)' : isHovered ? 'translateY(-2px)' : 'translateY(0)',
                  boxShadow: isHovered ? '0 6px 20px rgba(0,0,0,0.35)' : 'none',
                  transition: 'background 0.18s, border-color 0.18s, transform 0.15s, box-shadow 0.18s',
                  animation: `screen-enter 0.4s var(--ease-out) ${delay}s both`,
                }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: isHovered ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'background 0.18s',
                }}>
                  <img src={opt.icon} alt={opt.label} style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                </div>
                <span style={{
                  fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '17px',
                  color: isHovered ? '#fff' : 'rgba(255,255,255,0.55)',
                  textAlign: 'left', lineHeight: 'normal', whiteSpace: 'nowrap',
                  transition: 'color 0.18s',
                }}>
                  {opt.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─── Gameplay ─── */
function GamePlay({ players, cardIndex, totalCards, skipCount, question, onSkip, onNext, onPlayAgain, onBrowseGames }: {
  players: Player[]; cardIndex: number; totalCards: number; skipCount: number
  question: string; onSkip: () => void; onNext: () => void
  onPlayAgain: () => void; onBrowseGames: () => void
}) {
  const [flipped, setFlipped] = useState(false)
  const isDone = totalCards > 0 && cardIndex >= totalCards

  if (isDone) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px', padding: '40px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textAlign: 'center' }}>
          <h2 className="done-heading" style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '48px', color: '#fff', margin: 0, textTransform: 'uppercase' }}>Reconnected</h2>
          <p className="done-subtitle" style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            You played all {totalCards} reconnection cards
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
        <div className="done-card" style={{ width: '140px', height: '175px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(210,47,73,0.4)', position: 'relative' }}>
          <img src={RECONNECT_BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontFamily: "'Luckiest Guy', cursive", fontSize: '14px', color: '#d22f49', textAlign: 'center', lineHeight: 1.15, margin: 0, padding: '8px' }}>Let's reconnect</p>
          </div>
        </div>
        <div className="done-btns" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="game-btn" onClick={onBrowseGames} style={{ border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em' }}>BROWSE GAMES</button>
          <button className="game-btn-primary" onClick={onPlayAgain} style={{ background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em' }}>PLAY AGAIN</button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px', padding: '40px', position: 'relative', zIndex: 2 }}>
      <ReconnectCard question={question} flipped={flipped} onFlip={() => setFlipped(true)} />
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
            NEXT
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
type Step = 'relationship' | 'playerSetup' | 'depth' | 'deckSize' | 'customCards' | 'getReady' | 'game'

export default function LetsReconnectGame({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>('relationship')
  const [relationship, setRelationship] = useState<Relationship>('friends')
  const [depth, setDepth] = useState<Depth>('meaningful')
  const [players, setPlayers] = useState<Player[]>([])
  const [totalCards, setTotalCards] = useState(0)
  const [cardIndex, setCardIndex] = useState(0)
  const [playerIndex, setPlayerIndex] = useState(0)
  const [skipCount, setSkipCount] = useState(0)
  const [questions, setQuestions] = useState<string[]>([])
  const [customCards, setCustomCards] = useState<string[]>([])

  const currentPlayer = players.length > 0 ? players[playerIndex % players.length] : null
  const currentQuestion = questions[cardIndex % questions.length]

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
    const generated = getQuestions(relationship, depth)
    const allQuestions = shuffle([...custom, ...generated])
    const trimmed = totalCards > 0 ? allQuestions.slice(0, totalCards) : allQuestions
    setQuestions(trimmed)
    if (totalCards > trimmed.length) setTotalCards(trimmed.length)
    setCardIndex(0)
    setPlayerIndex(0)
    setStep('getReady')
  }

  const handlePlayAgain = useCallback(() => {
    const generated = getQuestions(relationship, depth)
    const allQuestions = shuffle([...customCards, ...generated])
    const trimmed = totalCards > 0 ? allQuestions.slice(0, totalCards) : allQuestions
    setQuestions(trimmed)
    setCardIndex(0)
    setPlayerIndex(0)
    setSkipCount(0)
    setStep('getReady')
  }, [relationship, depth, customCards, totalCards])

  return (
    <div className="game-fullscreen">
      <GameNav onBack={onClose} />

      {step === 'relationship' && (
        <SelectionScreen
          title="Choose Relationship"
          options={RELATIONSHIP_OPTIONS}
          onSelect={(id) => { setRelationship(id); setStep('playerSetup') }}
        />
      )}

      {step === 'playerSetup' && (
        <SharedPlayerSetup
          initialPlayers={players}
          skipLabel="SKIP FOR NOW"
          onSkip={() => setStep('depth')}
          onNext={p => { setPlayers(p); setStep('depth') }}
        />
      )}

      {step === 'depth' && (
        <SelectionScreen
          title="Choose Conversation Depth"
          options={DEPTH_OPTIONS}
          onSelect={(id) => { setDepth(id); setStep('deckSize') }}
        />
      )}

      {step === 'deckSize' && (
        <SharedDeckSize
          onBack={() => setStep('depth')}
          onNext={n => { setTotalCards(n); setStep('customCards') }}
          nextLabel="NEXT"
        />
      )}

      {step === 'customCards' && (
        <SharedCustomCards
          maxCards={totalCards}
          onBack={() => setStep('deckSize')}
          onNext={startGame}
        />
      )}

      {step === 'getReady' && (
        <SharedGetReady player={currentPlayer} label="Let's Reconnect" onReady={goToGame} />
      )}

      {step === 'game' && (
        <GamePlay
          players={players} cardIndex={cardIndex} totalCards={totalCards}
          skipCount={skipCount} question={currentQuestion}
          onSkip={handleSkip} onNext={handleNext}
          onPlayAgain={handlePlayAgain} onBrowseGames={onClose}
        />
      )}

      <GameFooter />
    </div>
  )
}
