import { useState, useRef, useCallback, useEffect, type CSSProperties } from 'react'
import { useScaledCard } from './hooks/useCardScale'
import { GameNav, GameFooter, PlayAgainLabel } from './components/GameShell'
import MatureContentGate from './components/MatureContentGate'
import { shuffle, getShuffledDeck } from './utils/deckShuffle'
import { CONVERSATION_SUPPLEMENT, withMinimumContent } from './content/supplemental'
import { useGameStep, usePersistentGameState } from './hooks/usePersistentGameState'
import { useMultiplayerSession } from './multiplayer/SessionStateContext'

/* ─── Asset URLs ─── */
const SPICY_INTRO_BG   = 'https://res.cloudinary.com/oluwatosin17/image/upload/decked/game-assets/spicy-talks.svg'
const SPICY_CARD_BG    = 'https://res.cloudinary.com/oluwatosin17/image/upload/decked/game-assets/spicy-talks.svg'
const SPICY_FRONT_SVG  = '/icons/spicy-front-figma.svg'
const SPICY_FRONT_COVER = '/icons/spicy-front-cover.svg'
const SPICY_BACK_SVG   = '/icons/spicy-back.svg'
const SOCIAL_TIKTOK    = '/icons/social-tiktok.svg'
const SOCIAL_INSTAGRAM = '/icons/social-instagram.svg'
const SOCIAL_WHATSAPP  = '/icons/social-whatsapp.svg'

/* Hand-authored (no hosting needed — can never 404) */
function ChiliGlyph({ style }: { style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={style}>
      <path d="M8 3.5c1.2-1 2.4-1.4 3.2-.6.6.6.4 1.6-.3 2.6 2.8-.2 5 1 5.9 3.2 1.2 2.9-.1 6.7-2.9 9.5-2.9 2.9-6.6 4-9.3 2.7A5.6 5.6 0 0 1 2 15.8c0-3.3 2-6.8 5-9.3.3-1.1.4-2.1 1-3z" fill="#E63946" />
      <path d="M8 3.5c1.2-1 2.4-1.4 3.2-.6.6.6.4 1.6-.3 2.6" stroke="#5B8C3E" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  )
}

type Player = { name: string; color: string; userId?: string }
const PLAYER_COLORS = ['#dc2827','#9b59b6','#27ae60','#e67e22','#3498db','#e91e63','#f39c12','#1abc9c']

/* ─── Questions by spice level ─── */
const MILD_QUESTIONS = [
  "What's one thing someone can do that instantly makes them more attractive to you?",
  "When was the last time someone gave you butterflies — and what did they do?",
  "What's a physical feature you always notice first when you're attracted to someone?",
  "Do you believe in love at first sight, or does attraction always build over time?",
  "What's the flirtiest thing someone has ever said to you?",
  "What's a small gesture that makes you feel desired?",
  "If you could describe your ideal kiss in three words, what would they be?",
  "What's your love language, and does your partner know it?",
  "What song always puts you in a romantic mood?",
  "What type of touch from your partner makes you melt?",
  "What's the most attractive confidence move someone has pulled on you?",
  "Do you prefer being chased or doing the chasing in the early stages?",
  "What's a compliment that would make you blush no matter who said it?",
  "What's the best first date you've ever been on, and what made it electric?",
  "If your partner looked at you a certain way across the room, what look would stop you in your tracks?",
  "What's a romantic cliche you secretly love?",
  "Do you think tension or comfort is more important for chemistry?",
  "What does someone's voice sound like when it's attractive to you?",
  "What's the most charming way someone has ever asked for your number?",
  "If you could set the scene for a perfect flirty evening, what would it look like?",
  "What’s your biggest “I’m into you” body language tell?", "Who’s your celebrity crush and why do they get you?", "What’s the most attractive thing someone can do with eye contact?", "What’s your ideal first-date vibe: cozy, chaotic, or classy?", "What’s a green flag that instantly makes you want to flirt harder?", "What’s your most dangerous compliment to receive?", "What’s the sexiest scent someone could wear on a date?", "What’s your go-to move when you’re trying to look unattainable?", "What’s the funniest way you’ve been hit on?", "What’s your “I’d do shots with you” energy?", "What’s your favorite type of teasing—verbal, playful, or sweet?", "What’s the hottest thing someone said to you that wasn’t explicit?", "When do you usually know you want a second date?", "What’s the most suspiciously charming thing your crush does?", "What’s a tiny detail that makes you instantly interested?", "What’s your favorite way to be asked out?", "What’s your worst habit when you’re nervous around someone cute?", "What’s the fastest way to turn you from “maybe” to “yeah”?", "What’s a date that made you feel stupidly confident?", "What’s the most flattering way to call you “dangerous”?", "What’s your favorite kind of banter?", "What’s your “I’d absolutely text you back” rule?", "What’s a red-flag-but-hot situation you’d avoid?", "What’s the sexiest way to ask, “Can I steal you?”", "What’s the most obvious sign someone’s flirting with you?", "What’s your favorite way to break the touch barrier?", "What’s the best pick-up line that actually worked?", "What’s your dream kissing setup: crowded bar, quiet porch, or car?", "What’s a weirdly attractive habit someone has?", "What’s your comfort-zone love language in dating?", "What’s the most annoying thing that makes you instantly more into them?", "What’s the sweetest thing you’ve confessed to a crush?", "What’s your “give me one more look” moment?", "What’s the hottest compliment you’ve ever heard in person?", "What’s your favorite texting tone: teasing, sweet, or spicy?", "What’s your ideal “accidental” late-night hang?", "What’s your weakness: confidence, softness, or humor?", "What’s the most romantic thing you’ve done impulsively?", "What’s your signature move when you’re trying to impress?", "What’s a wardrobe detail that always gets you?", "What’s your favorite kind of date flirt: slow burn or chaos?", "What’s the most fun way someone made plans with you?", "What’s your “instantly obsessed” first-impression?", "What’s the best way to compliment someone’s style?", "What’s the hottest thing about your dating type?", "What’s your ideal “come closer” line?", "What’s your favorite kind of attention: public, private, or both?", "What’s the most tempting dare you’d say yes to?", "What’s a confession you’d whisper but never text?", "What’s your favorite kind of “good luck” before a date?", "What’s the sexiest posture someone can have?", "What’s the most dangerous thing about your smile?", "What’s your favorite “almost kissed” story?", "What’s the first thing you notice after the eyes?", "What’s your go-to “I’m into you” look?", "Who’s your type in one sentence?", "What’s your favorite kind of compliment: specific or bold?", "What’s the most flattering thing someone can say while laughing?", "What’s a moment you thought, “Oh… we’re doing this”?", "What’s your favorite way to be asked for a second date?", "What’s the most romantic date snack?", "What’s your favorite flirty nickname you’ve been called?", "What’s the best compliment you ever gave someone?", "What’s your “I might be down” vibe?", "What’s a harmless dare you’d actually do on a date?", "What’s the sexiest way to say “you’re trouble”?", "What’s your favorite type of hand-holding?", "What’s your ideal “goodnight” message?", "What’s the cutest way to flirt without being obvious?", "What’s the most unexpected thing that turned you on?", "What’s your favorite date location: rooftop, couch, or sidewalk?", "What’s your most “I shouldn’t, but I want” attraction moment?", "What’s the most playful way to test chemistry?", "What’s your favorite compliment about your vibe?", "What’s the most charming way to say you want them?", "What’s your ideal “accidentally” bump into me plan?", "What’s a first-date question that always works?", "What’s the hottest compliment you’ve ever ignored (for reasons)?", "What’s your favorite kind of touch: shoulder, waist, hand, or back?", "What’s your “green flag” for flirting: consistency or boldness?", "What’s a sexy habit you wish you did more?", "What’s the best thing someone did to make you feel chosen?", "What’s the most attractive laugh you’ve ever heard?", "What’s your ideal “let’s leave together” moment?", "What’s your favorite “you up?” invitation style?", "What’s a text you wish you got more often?", "What’s your favorite way to tease someone’s ego (gently)?", "What’s your most wholesome-but-sexy date memory?", "What’s the best way to win you over fast?", "What’s your favorite kind of compliment under the radar?", "What’s the most romantic thing someone has done for you?", "What’s your “I’d let you be bold” energy?", "What’s a look someone gives that ruins your focus?", "What’s your ideal first kiss setting?", "What’s the most attractive thing about someone’s confidence?", "What’s your favorite “accidental” compliment tactic?", "What’s the sweetest flirty confession you’ve made?", "What’s your favorite way to say “I want you” without saying it?", "What’s a song that instantly makes you feel flirty?", "What’s your most fun “we should do this again” line?",
]

const MEDIUM_QUESTIONS = [
  "What’s a text you’ve sent that got you in trouble (in a good way)?", "What’s your biggest “I’d like to see you naked” thought?", "What’s your fantasy date that ends with private time?", "What’s the sexiest thing someone did while flirting (before anything happened)?", "What’s a kink-lite you’re secretly into?", "What’s the most convincing way someone asked to hook up?", "What’s your “no panties in sight” confidence moment?", "What’s a shirt-on/zipper-down kind of detail you notice?", "What’s a bold compliment you wish you’d said first?", "What’s your favorite way to be touched when you’re turned on?", "What’s a scenario where you’d definitely switch from playful to serious?", "What’s the hottest thing about your dating “type”?", "What’s a time you thought, “I might actually be down right now”?", "What’s your go-to dirty line you’d never say sober?", "What’s your most embarrassing flirty nickname?", "What’s a role-play prompt you’d try (consenting adults only)?", "What’s the hottest rumor you’d want about you?", "What’s a “come closer” moment that would absolutely ruin your self-control?", "What’s your favorite kind of slow build?", "What’s a body part you love being complimented?", "What’s the boldest thing you’ve asked for in bed (general is fine)?", "What’s your favorite way someone says “I want you”?", "What’s your rule for hooking up: same night rules, or slow burn?", "What’s the sexiest way to ask for consent?", "What’s your favorite kind of eye contact during getting intimate?", "What’s a seductive compliment you give when you’re trying to escalate?", "What’s a fantasy where you’re the one being chased?", "What’s your “makeout until…” plan with someone new?", "What’s a text you’d send with one goal: meeting later?", "What’s your ideal “bad decision” night?", "What’s a hookup confession you’d only tell in person?", "What’s the most effective way to turn you on via words?", "What’s a lingerie vibe you’d wear if you knew they’d notice?", "What’s the hottest way to say “don’t stop”?", "What’s your favorite position you’ve done (keeping it non-graphic)?", "What’s your least subtle sign you’re enjoying it?", "What’s the funniest reason someone became instantly hotter to you?", "What’s a “hands where I can feel it” moment you love?", "What’s your favorite kind of teasing during foreplay?", "What’s your “I’m into you” dare: one step, no details?", "What’s your dream “no interruptions” private hang?", "What’s the most confident you’ve felt after flirting?", "What’s a body language move that means “keep going”?", "What’s your favorite kind of moody, sexy playlist?", "What’s a role you’d love to be (dominant or submissive)?", "What’s the hottest thing about kissing—slow, messy, or hands-on?", "What’s a specific sentence that makes you weak?", "What’s your favorite “accidental” touch that doesn’t stay accidental?", "What’s the boldest thing you’ve told someone you want again?", "What’s your favorite “let me” request?", "What’s a fantasy involving a public setting (but still private-ish)?", "What’s your favorite kind of “good girl/boy” energy (even if you don’t use the words)?", "What’s your turn-on from a partner’s vibe: confident, sweet, or rough?", "What’s your most “you’re going to regret saying yes” flirt?", "What’s a thing you love to hear during the hookup?", "What’s a spice level you’re curious to try?", "What’s your “I’m not usually like this” hook-up story?", "What’s the hottest way to start something without being explicit?", "What’s your ideal foreplay pace: slow, teasing, or intense fast?", "What’s your favorite compliment that’s borderline too much?", "What’s a boundary you respect—but secretly want more of?", "What’s your favorite way to be guided during sex?", "What’s a text that turns you on instantly (not explicit, but clear)?", "What’s your “can’t focus” moment when someone gets handsy?", "What’s a sexy thing you’d do if you trusted them completely?", "What’s the most irresistible flirty challenge you’ve accepted?", "What’s your favorite kind of “pull me in closer” kiss?", "What’s a thing you’d ask for that would surprise you to say out loud?", "What’s your best “hookup chemistry” sign?", "What’s your favorite way to use dirty talk without being gross?", "What’s the hottest kind of consent check for you?", "What’s the most romantic-but-sexy thing someone has done?", "What’s your ideal “take control” moment?", "What’s a fantasy you’ll only admit when you’re tipsy?", "What’s the sexiest way someone has asked you to stay?", "What’s your favorite kind of aftercare cuddle?", "What’s a “make me feel wanted” line that works every time?", "What’s your turn-on related to smell (like clean, perfume, etc.)?", "What’s a text you’d send right before meeting?", "What’s your favorite kind of praise: verbal, physical, or both?", "What’s your “I’d let you do whatever” vibe?", "What’s the most flirty dare you’ve actually followed through on?", "What’s your ideal “switch” moment in a hookup (dynamic change)?", "What’s your favorite kind of dirty laugh from a partner?", "What’s a sexy scenario you’d want set up at home?", "What’s your favorite kind of anticipation game?", "What’s a compliment about your body you’d never forget?", "What’s a “you’re trouble” moment you’d want repeated?", "What’s the boldest thing you’ve said while kissing?", "What’s your favorite way to be teased with boundaries?", "What’s a kink-adjacent thing you’re curious about?", "What’s your ideal “hands + whisper” vibe?", "What’s the fastest way someone made you lose your mind?", "What’s a hookup confession you’d trust them with?", "What’s your “I’ll behave” lie that never lasts?", "What’s your favorite kind of touch during a slow kiss?", "What’s the hottest way to say “I want more”?", "What’s a scenario where you’d skip flirting and go straight for it?", "What’s your favorite part of making out that leads somewhere?", "What’s your fantasy of being totally picked by someone?",
  "What's something you've always wanted to hear from a partner but never have?",
  "What's the most vulnerable thing you've ever admitted during pillow talk?",
  "Have you ever stayed in a relationship because the physical chemistry was too good to leave?",
  "What's a desire you've only recently discovered about yourself?",
  "What's the most daring thing you've done to impress someone you were attracted to?",
  "Is there something your partner does in the bedroom that you wish they did more often?",
  "What's a past experience that completely changed how you think about intimacy?",
  "What boundary in a relationship took you the longest to learn to set?",
  "Have you ever been so attracted to someone it scared you? What happened?",
  "What's a confession about your romantic past that might surprise your partner?",
  "What's the most intense physical chemistry you've ever felt with someone?",
  "Have you ever done something in a relationship that you'd never admit to your friends?",
  "What's a romantic or intimate experience you wish you could have again?",
  "What's something about your desires that you think your partner still doesn't fully understand?",
  "When was the last time you felt truly wanted — not just loved, but wanted?",
  "What's the biggest sacrifice you've made for physical or emotional intimacy?",
  "Have you ever had a moment where attraction hit you completely out of nowhere?",
  "What's a conversation about intimacy you've been avoiding with your partner?",
  "What's the most honest thing you've ever said to a partner about what you need?",
  "If you could ask your partner one question about your intimate life and get a completely honest answer, what would it be?",
]

const HOT_QUESTIONS = [
  "What's a fantasy you've replayed in your mind but never told anyone about?",
  "If your partner could read your deepest desires, what would surprise them most?",
  "What's the most intense romantic experience you've ever had?",
  "Is there something you've always wanted to try intimately but felt too nervous to suggest?",
  "What's a secret preference in the bedroom that you've never voiced?",
  "Have you ever been so consumed by desire for someone that you did something completely out of character?",
  "What's the most vulnerable you've ever been during an intimate moment?",
  "If you had zero inhibitions for one night, what would you want to do with your partner?",
  "What's a part of your body you wish your partner paid more attention to?",
  "What's the most honest thing you can say about what truly turns you on?",
  "Have you ever fantasized about someone while being with someone else?",
  "What's a romantic or intimate scenario that lives rent-free in your head?",
  "If your partner asked you to describe exactly how you want to be touched, what would you say?",
  "What's something you've pretended to enjoy intimately that you actually didn't?",
  "What's the riskiest place you've ever wanted to be intimate with someone?",
  "What would your partner be shocked to learn about your private thoughts?",
  "Have you ever felt more emotionally naked than physically naked with someone? What happened?",
  "What's a desire you've outgrown, and what replaced it?",
  "If you could design the perfect intimate evening from start to finish, what would every detail look like?",
  "What's one thing you wish you had the courage to ask for in your relationship right now?",
  "What’s one thing I do in bed that you can’t stop thinking about?", "If we spent an entire day in bed together, what would that look like?", "When you're pleasuring yourself, what helps you reach an orgasm?", "Is there a position or experience you have never had but would be open to trying with me?", "What’s the hottest fantasy you’ve ever had about us?", "If I could read your mind during sex, what do you think would surprise me the most?", "What are some of the most daring and thrilling places you’ve had sex?", "If I could tease you in the perfect way, what would that look like?", "When do you feel most turned on by me?", "What’s  one thing I could do right now to make you completely lose control?", "How did you feel when we had our first kiss?", "How would you describe  our chemistry in three words?", "If I whispered in your ear right now, what would you want me to say?", "What’s your idea of the perfect morning-after breakfast?", "What’s something I do that always puts you in  the mood for more?", "What song makes you think of me every time you hear it?", "What’s the sexiest dream you’ve had about us?", "What’s the best intimacy-related compliment you’ve ever received?", "If I gave you a flirty dare right now, what would you be willing to do?", "If we were alone in a room right now, what’s the first thing you’d want to do to me?", "Is there a new position or move you’ve been dying to try with me?", "If you could get away with any kind of sexual fantasy and not be judged, what would that be?", "What’s a sex toy or accessory you’ve always wanted to enjoy with a partner?", "Where’s a place you’ve always fantasized about having sex?", "If we had no limits for one night—no time constraints, no place off-limits—what would we do?", "If I could make one of your deepest sexual desires come true, what would it be?", "What characters do you think would be fun to play in a role-playing scenario?", "If you could design a fantasy room just for us, what would it look like and how would we spend our time there?", "What’s a fantasy that you like thinking about, but probably wouldn’t do in real life?", "If I could blindfold you and surprise you with something sexy, what would you hope I do?", "When do you feel most  emotionally connected to me, and what strengthens that connection?", "What is an interesting or unexpected need or desire you have about sexual intimacy?", "What’s been your favorite, or most memorable, intimate moment with me?", "What’s something small I do that drives you wild?", "How can I better support your intimate (emotional and/or sexual) needs?", "What’s your ideal frequency for how often you have sex, and how long you prefer each sex session?", "If you could relive one of our most intimate moments and change one thing to make it even hotter, what would it be?", "How can I convey my love/care for you even better while we’re having sex?", "Are there any specific phrases or words that really get you going?", "What’s one thing you wish I knew about your intimate side that you haven’t shared yet?", "What do you look like, and sound like, when sex feels good for you?", "What's something non-sexual that turns you on?", "Do you have a sexual fetish? If so, what is it?", "Have you ever had sex with someone and almost got caught?", "Do you consider yourself a breather, a moaner, or a screamer in bed? Do you like getting spanked during sex?", "Do you prefer me doing long slow thrusts or rapid aggressive pumping? *when you’re choosing which sexual questions to ask your girlfriend, remember that she may give different answers depending on her mood*", "How would you want to be seduced?", "Does dirty talk get you aroused?", "What do you like to be called in bed?", "What is your most favorite position?", "Where is the riskiest place you’ve ever had sex?",
  "What’s the most intense sexual thing you want to do to someone?", "What’s a dirty text you’d absolutely send if you knew they’d reply instantly?", "What’s your favorite type of oral sex technique (general enough to discuss, specific enough to mean it)?", "What’s the hottest place you’ve wanted someone’s hands?", "What’s a sex act you’re curious to try that you haven’t told anyone?", "What’s your favorite way to be commanded in bed?", "What’s the most taboo-seeming fantasy you’re actually into?", "What’s your go-to “make me say yes” line?", "What’s your biggest turn-on: dominant energy, gentle control, or pure chaos?", "What’s the best way you’ve been touched when you couldn’t hold back?", "What’s a kink you’d be obsessed with if you got the chance?", "What’s a specific role-play scenario you want to do (consenting adults only)?", "What’s the hottest moment during sex when you lose control?", "What’s your favorite thing to hear right before you climax?", "What’s your favorite type of penetration and why?", "What’s a position you want to try again and again?", "What’s the most reckless hookup you’d do if it was truly safe?", "What’s your hardest “can’t stop” craving?", "What’s the hottest way someone has used their mouth on you?", "What’s a fantasy involving mutual dirty talk—how does it start?", "What’s your favorite kind of restraint dynamic (consenting, negotiated)?", "What’s the sexiest way to get teased right at the edge?", "What’s your favorite way to be held while things get intense?", "What’s a turn-on that’s a little weird but extremely effective for you?", "What’s your “after midnight” sex mood?", "What’s the most shameless thing you’ve ever asked for?", "What’s a detail you love about a partner’s technique?", "What’s the dirtiest compliment you secretly want?", "What’s your fantasy about being taken from behind (if you’re into that vibe)?", "What’s your favorite kind of eye contact during sex?", "What’s a sex scenario you’d do in the shower?", "What’s your favorite “hands under/around” move?", "What’s the most erotic thing you’ve imagined doing in public?", "What’s your favorite way to be kissed while getting intimate?", "What’s a kink you’d only try with someone you trust completely?", "What’s the hottest way someone has slowed down on purpose?", "What’s the most intense build-up you want to experience?", "What’s your fantasy about someone ruining your self-control with dirty talk?", "What’s the best way to make you beg (what do they say)?", "What’s your favorite kind of grinding or thrusting rhythm?", "What’s the sex act you want to try with a partner who’s confident?", "What’s your favorite part of foreplay that makes you weak?", "What’s your “don’t stop” fantasy—what happens next?", "What’s your favorite kind of teasing with a hand to keep you waiting?", "What’s your wildest make-believe scenario?", "What’s the hottest way to ask for consent when you want it rough?", "What’s your favorite kind of ass/waist attention?", "What’s a specific thing you’d do to someone’s neck/ear that gets you?", "What’s your fantasy of being flipped or controlled?", "What’s the most intense orgasm-related moment you crave?", "What’s your favorite kind of breathy, messy kissing when you’re turned on?", "What’s a sex toy or tool you want to use (and how)?", "What’s your favorite way to be guided toward what you want?", "What’s the dirtiest compliment you’ve ever received?", "What’s your fantasy about being used—how do you want it to feel?", "What’s your ideal “start soft, end savage” plan?", "What’s the hottest thing you’d whisper into someone’s ear?", "What’s your favorite kind of spanking dynamic (negotiated, consensual)?", "What’s your fantasy about someone completely taking over?", "What’s the most erotic sensory detail you love (sound, touch, pace)?", "What’s a thing you’d do if you trusted them with your control?", "What’s your favorite kind of dirty talk: praise, commands, or confessions?", "What’s the most graphic act you’ve fantasized about (keep it within “consenting adult” framing)?", "What’s your favorite way for a partner to touch you during climax?", "What’s your fantasy about being watched (private, consenting)?", "What’s the hottest scenario where you’re both uncontrollably needy?", "What’s your favorite kind of “provoked” teasing?", "What’s a dominance/submission switch you want to try?", "What’s your fantasy involving tying up (only consensual, negotiated)?", "What’s the sexiest way someone can grab you by the waist?", "What’s your biggest turn-on: breath, grip, or pace?", "What’s your fantasy about going slow enough to torture you?", "What’s the hottest way to say “you’re mine” during sex?", "What’s your fantasy about riding someone exactly how you like?", "What’s your favorite kind of partner energy: needy, confident, or wild?", "What’s your most intense “I can’t keep quiet” moment?", "What’s a specific oral technique you want described (consenting, consenting)?", "What’s your fantasy about surprise—with consent—at the bedroom door?", "What’s the dirtiest role-play line you want them to say?", "What’s your fantasy about being framed as the “good girl/boy”?", "What’s your favorite kind of “body worship” (hands, mouth, devotion)?", "What’s the hottest way someone’s hands can guide you?", "What’s your fantasy involving multiple rounds (and the vibe)?", "What’s your favorite after you’re done: cuddles, praise, or more teasing?", "What’s your most shameless sexual secret?", "What’s a thing you want someone to do to you right now?", "What’s your fantasy about being taken while you’re restrained (consensual)?", "What’s your favorite kind of “follow my instructions” sex?", "What’s the hottest way to start a hookup with zero flirting?", "What’s a kink you want to explore privately with one person?", "What’s your fantasy about someone getting hands-on immediately?", "What’s the most erotic thing about being desired in that moment?", "What’s your favorite dirty phrase to hear right before anything starts?", "What’s your fantasy about being kissed all over while hands do the work?", "What’s your most intense “switch” moment—what changes?", "What’s your favorite kind of edging and who should control it?", "What’s your fantasy about someone making you lose control verbally?", "What’s the most explicit thing you’d want them to say during sex?", "What’s the sexiest “promise” you want a partner to make?", "What’s your ultimate fantasy scenario, start to finish?",

]

export const SPICY_QUESTION_BANKS = {
  mild: withMinimumContent(MILD_QUESTIONS, CONVERSATION_SUPPLEMENT, 150),
  medium: withMinimumContent(MEDIUM_QUESTIONS, CONVERSATION_SUPPLEMENT, 150),
  hot: withMinimumContent(HOT_QUESTIONS, CONVERSATION_SUPPLEMENT, 150),
} as const


/* ═══════════════════════════════════════════════════════
   SCREEN 1 — Age Gate
   ═══════════════════════════════════════════════════════ */
function AgeGate({ onBack, onConfirm }: { onBack: () => void; onConfirm: () => void }) {
  return <MatureContentGate gameName="Spicy Starters" onBack={onBack} onConfirm={onConfirm} />
}

/* ═══════════════════════════════════════════════════════
   SCREEN 2 — How Spicy Do You Like It
   ═══════════════════════════════════════════════════════ */
export type SpiceLevel = 'mild' | 'medium' | 'hot'

function ChiliIcon() {
  return (
    <img src="/icons/how-spicy.svg" alt="" style={{ width: '32px', height: '32px', flexShrink: 0 }} />
  )
}

function HowSpicy({ onSelect }: { onSelect: (level: SpiceLevel) => void }) {
  const [selected, setSelected] = useState<SpiceLevel | null>(null)

  const options: { level: SpiceLevel; label: string; count: number }[] = [
    { level: 'mild', label: 'MILD', count: 1 },
    { level: 'medium', label: 'MEDIUM', count: 2 },
    { level: 'hot', label: 'HOT', count: 3 },
  ]

  const handleSelect = (level: SpiceLevel) => {
    setSelected(level)
    setTimeout(() => onSelect(level), 200)
  }

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '40px' }}>
      <div style={{ width: '600px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center' }}>

        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center', lineHeight: '45px', textTransform: 'uppercase' }}>
          HOW SPICY DO YOU LIKE IT
        </h2>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {options.map(({ level, label, count }) => {
            const isSelected = selected === level
            return (
              <button
                key={level}
                onClick={() => handleSelect(level)}
                className={`spicy-option stagger-item${isSelected ? ' selected' : ''}`}
                style={{
                  background: isSelected ? '#1e1e22' : '#070708',
                  border: '1px solid transparent',
                  borderRadius: '12px', height: '56px',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px', cursor: 'pointer', width: '100%',
                }}
              >
                {Array.from({ length: count }, (_, i) => <ChiliIcon key={i} />)}
                <span style={{
                  fontFamily: "'Anton SC', sans-serif", fontSize: '18px',
                  color: isSelected ? '#fff' : 'rgba(255,255,255,0.5)',
                  lineHeight: 'normal', transition: 'color 0.15s',
                }}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SCREEN 3 — Who's Playing?
   ═══════════════════════════════════════════════════════ */
function PlayerSetup({ players, setPlayers, onBack, onNext, onSkip }: {
  players: Player[]
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>
  onBack: () => void
  onNext: () => void
  onSkip?: () => void
}) {
  const [input, setInput] = useState('')
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const editRef = useRef<HTMLInputElement>(null)

  const nextColor = PLAYER_COLORS[players.length % PLAYER_COLORS.length]
  const hasInput = input.trim().length > 0

  const addPlayer = () => {
    const name = input.trim()
    if (!name) return
    setPlayers(prev => [...prev, { name, color: PLAYER_COLORS[prev.length % PLAYER_COLORS.length] }])
    setInput('')
    inputRef.current?.focus()
  }

  const commitEdit = () => {
    const name = editValue.trim()
    if (name && editingIdx !== null)
      setPlayers(prev => prev.map((p, i) => i === editingIdx ? { ...p, name } : p))
    setEditingIdx(null)
  }

  return (
    <div className="screen-enter screen-enter-setup" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '40px' }}>
      <div className="setup-container" style={{ width: '600px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '50px', alignItems: 'center' }}>

        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center', lineHeight: '45px' }}>
          Who's playing?
        </h2>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {players.map((p, i) => (
            <div key={i} className="stagger-item setup-card-row" style={{ background: '#070708', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                <div className="avatar-circle" style={{ width: '32px', height: '32px', background: p.color, boxShadow: '0 0 0 2.5px #ffffff' }} />
                {editingIdx === i ? (
                  <input ref={editRef} value={editValue} onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingIdx(null) }}
                    onBlur={commitEdit}
                    style={{ background: 'none', border: 'none', outline: 'none', fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', flex: 1 }}
                    autoFocus
                  />
                ) : (
                  <span onClick={() => { setEditingIdx(i); setEditValue(p.name); setTimeout(() => editRef.current?.select(), 0) }}
                    style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', cursor: 'text', flex: 1 }}>
                    {p.name}
                  </span>
                )}
              </div>
              <button onClick={() => setPlayers(prev => prev.filter((_, j) => j !== i))}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '0 4px' }} aria-label="Remove">
                ×
              </button>
            </div>
          ))}

          <div className="setup-card-row" style={{ background: '#070708', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'text' }}
            onClick={() => inputRef.current?.focus()}>
            <button className="circle-control" onClick={e => { e.stopPropagation(); addPlayer() }}
              style={{ background: hasInput ? nextColor : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', maxWidth: '32px', maxHeight: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: hasInput ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: hasInput ? '16px' : '20px', lineHeight: 1, transition: 'background 0.15s', boxShadow: hasInput ? '0 0 0 2.5px #ffffff' : 'none' }}>
              {hasInput ? '✓' : '+'}
            </button>
            <input ref={inputRef} value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addPlayer() }}
              placeholder="Add a player..."
              style={{ background: 'none', border: 'none', outline: 'none', fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', flex: 1 }}
            />
            {hasInput && (
              <button onClick={e => { e.stopPropagation(); addPlayer() }}
                style={{ background: 'none', border: 'none', fontFamily: "'Staatliches', sans-serif", fontSize: '14px', color: nextColor, cursor: 'pointer', whiteSpace: 'nowrap', padding: 0, letterSpacing: '0.05em' }}>
                TAP TO ADD →
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '402px' }}>
          <button className="game-btn" onClick={onSkip ?? onBack} style={{ flex: 1, border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', textAlign: 'center', boxShadow: '0 10px 24px rgba(0,0,0,0.25)' }}>
            SKIP FOR NOW
          </button>
          <button className="game-btn-primary" onClick={onNext} style={{ flex: 1, background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', textAlign: 'center' }}>
            NEXT
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SCREEN 4 — Deck Size
   ═══════════════════════════════════════════════════════ */
function DeckSize({ onBack, onStart }: { onBack: () => void; onStart: (n: number) => void }) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const parsed = parseInt(value, 10)
  const valid = !isNaN(parsed) && parsed > 0 && parsed <= 200

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '40px' }}>
      <div style={{ width: '600px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '50px', alignItems: 'center' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', width: '100%' }}>
          <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center', lineHeight: '45px' }}>
            DECK SIZE
          </h2>
          <p style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0, textAlign: 'center' }}>
            How many cards do you want to play?
          </p>

          <div className="setup-card-row" style={{ background: '#070708', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'text', width: '100%', marginTop: '16px', boxSizing: 'border-box' }}
            onClick={() => inputRef.current?.focus()}>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '18px', lineHeight: 1 }}>#</span>
            </div>
            <input ref={inputRef} type="number" min={1} max={200} value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="Enter number"
              style={{ background: 'none', border: 'none', outline: 'none', fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', flex: 1 }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '292px' }}>
          <button className="game-btn" onClick={() => setTimeout(onBack, 100)} style={{ flex: 1, border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', textAlign: 'center', boxShadow: '0 10px 24px rgba(0,0,0,0.25)' }}>
            GO BACK
          </button>
          <button className={valid ? 'game-btn-primary' : ''} onClick={() => valid && setTimeout(() => onStart(parsed), 100)}
            style={{ flex: 1, background: valid ? '#dc2827' : '#626262', border: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: valid ? '#fff' : '#a0a0a0', cursor: valid ? 'pointer' : 'not-allowed', textAlign: 'center', transition: 'background 0.2s' }}>
            START THE GAME
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SCREEN 5 — Get Ready
   ═══════════════════════════════════════════════════════ */
function GetReady({ player, onReady }: { player: Player | null; onReady: () => void }) {
  const stableOnReady = useCallback(onReady, [onReady])

  useEffect(() => {
    const id = setTimeout(stableOnReady, 2400)
    return () => clearTimeout(id)
  }, [stableOnReady])

  return (
    <button className="screen-enter get-ready-screen" onClick={onReady} aria-label="Start game now" style={{ width: '100%', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer', border: 0, background: 'transparent' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center', lineHeight: '45px', textTransform: 'uppercase' }}>
          Get ready...
        </h2>
        {player && (
          <div className="stagger-item" style={{ background: '#070708', border: '1px dashed rgba(255, 255, 255, 0.10)', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', padding: '12px', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: player.color, flexShrink: 0 }} />
            <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', lineHeight: 'normal', whiteSpace: 'nowrap' }}>
              {player.name.toUpperCase()}
            </span>
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
          <span className="get-ready-dot" />
          <span className="get-ready-dot" />
          <span className="get-ready-dot" />
        </div>
      </div>
    </button>
  )
}

/* ═══════════════════════════════════════════════════════
   SCREEN 6 — Intro Card (real 3D flip)
   ═══════════════════════════════════════════════════════ */
export function IntroCard({ onTap, firstQuestion }: { onTap: () => void; firstQuestion: string }) {
  const [flipped, setFlipped] = useState(false)
  const { wrapperStyle, cardStyle } = useScaledCard(326, 409)

  const handleTap = () => {
    if (flipped) return
    setFlipped(true)
    setTimeout(onTap, 800) // navigate after flip completes (matches 0.75s CSS)
  }

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '30px', position: 'relative', padding: '40px' }}>
      {/* Hover wrapper provides lift + shadow; flip container provides perspective */}
      <div style={wrapperStyle}>
      <div
        onClick={handleTap}
        className="intro-card-hover-wrap game-card"
        style={{ ...cardStyle, flexShrink: 0, zIndex: 2, position: 'relative' }}
      >
        <div className="spicy-flip-container" style={{ width: '326px', height: '409px' }}>
        <div className={`spicy-flip-inner${flipped ? ' flipped' : ''}`} style={{ width: '326px', height: '409px' }}>

          {/* ── FRONT: spicy starters cover (SVG) ── */}
          <div className="spicy-flip-front">
            <img src={SPICY_FRONT_SVG} alt="Spicy Starters — conversation cards to share" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          {/* ── BACK: first question card (SVG bg + text overlay) ── */}
          <div className="spicy-flip-back">
            <img src={SPICY_BACK_SVG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px' }}>
              <p style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '29.7px', color: '#ab1229', textAlign: 'center', lineHeight: 'normal', margin: 0, padding: '0 16px' }}>
                {firstQuestion.toUpperCase()}
              </p>
            </div>
          </div>

        </div>
        </div> {/* spicy-flip-container */}
      </div> {/* intro-card-hover-wrap */}
      </div> {/* scaled wrapper */}

      <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: '16px', color: flipped ? 'transparent' : 'rgba(255,255,255,0.5)', margin: 0, position: 'relative', zIndex: 2, transition: 'color 0.3s' }}>
        Tap the card to flip it.
      </p>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SCREEN 7 — Game Cards
   ═══════════════════════════════════════════════════════ */
export type FlipPhase = 'idle' | 'out' | 'in'

export function SpicyCard({ question, flipPhase }: { question: string; flipPhase: FlipPhase }) {
  const { wrapperStyle, cardStyle } = useScaledCard(365, 457)
  const cls = flipPhase === 'out' ? 'game-card-flip-out'
            : flipPhase === 'in'  ? 'game-card-flip-in'
            : ''
  return (
    <div style={wrapperStyle}>
    <div className={`${cls} game-card`} style={{
      ...cardStyle, borderRadius: '12px', overflow: 'hidden',
      position: 'relative', flexShrink: 0, zIndex: 2,
      boxShadow: '0 32px 80px rgba(171,18,41,0.35)',
    }}>
      <img src={SPICY_BACK_SVG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px' }}>
        <p style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '29.7px', color: '#ab1229', textAlign: 'center', lineHeight: 'normal', margin: 0, padding: '0 16px' }}>
          {question.toUpperCase()}
        </p>
      </div>
    </div>
    </div>
  )
}

function GameScreen({ questions, players, totalCards, cardIndex, playerIndex, skipCount, onAdvance, onClose, onPlayAgain }: {
  questions: string[]
  players: Player[]
  totalCards: number
  cardIndex: number
  playerIndex: number
  skipCount: number
  onAdvance: (skipped: boolean) => void
  onClose: () => void
  onPlayAgain: () => void
}) {
  const multiplayer = useMultiplayerSession()
  const [flipPhase, setFlipPhase] = useState<FlipPhase>('idle')
  const [displayIdx, setDisplayIdx] = useState(cardIndex)

  const flippingRef = useRef(false)

  // The room's card index is authoritative. This also animates card changes
  // initiated on another player's device instead of keeping a local deck.
  useEffect(() => {
    if (cardIndex === displayIdx || flippingRef.current) return
    flippingRef.current = true
    setFlipPhase('out')
    const swapTimer = window.setTimeout(() => {
      setDisplayIdx(cardIndex)
      setFlipPhase('in')
      window.setTimeout(() => {
        setFlipPhase('idle')
        flippingRef.current = false
      }, 300)
    }, 180)
    return () => window.clearTimeout(swapTimer)
  }, [cardIndex, displayIdx])

  const currentPlayer = players.length > 0 ? players[playerIndex] : null
  const canAdvance = !multiplayer || !currentPlayer?.userId || currentPlayer.userId === multiplayer.currentUserId

  const advance = useCallback((skipped = false) => {
    if (!canAdvance) return
    if (flippingRef.current) return
    flippingRef.current = true

    // Phase 1 — flip out
    setFlipPhase('out')

    setTimeout(() => {
      // Mid-flip: update content (card is edge-on, invisible)
      onAdvance(skipped)
      setDisplayIdx(cardIndex + 1)

      // Phase 2 — flip in
      setFlipPhase('in')

      setTimeout(() => {
        setFlipPhase('idle')
        flippingRef.current = false
      }, 300)
    }, 180)
  }, [canAdvance, cardIndex, onAdvance])

  const isDone = totalCards > 0 && cardIndex >= totalCards
  const question = questions[displayIdx]

  if (isDone) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px', padding: '40px' }}>
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
          <h2 className="done-heading" style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '48px', color: '#fff', margin: 0, textTransform: 'uppercase' }}>
            YOU'RE DECKED
          </h2>
          <p className="done-subtitle" style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            You played all {totalCards} spicy starters cards
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 2, background: '#070708', border: '1px dashed rgba(255, 255, 255, 0.10)', borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '20px 32px', gap: 0 }}>
          {[
            { count: totalCards,      label: 'CARDS',   cls: 'done-stat-1' },
            { count: skipCount,       label: 'SKIPPED', cls: 'done-stat-2' },
            { count: players.length,  label: 'PLAYERS', cls: 'done-stat-3' },
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

        <div className="done-card spicy-done-card" style={{ position: 'relative', zIndex: 2, width: '160px', height: '200px', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(183,0,18,0.4)', flexShrink: 0 }}>
          <img src={SPICY_FRONT_SVG} alt="Spicy Starters — conversation cards to share" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <div className="done-btns" style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '8px' }}>
          <button className="game-btn" onClick={onClose} style={{ border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', boxShadow: '0 10px 24px rgba(0,0,0,0.25)' }}>
            BROWSE GAMES
          </button>
          <button className="game-btn-primary" onClick={onPlayAgain} style={{ background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em' }}><PlayAgainLabel /></button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', position: 'relative', padding: '40px 40px 60px' }}>

      {currentPlayer && (
        <div key={currentPlayer.name} className="player-chip-enter" style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: currentPlayer.color, flexShrink: 0, border: '2px solid rgba(255,255,255,0.25)', boxShadow: `0 0 0 3px ${currentPlayer.color}33` }} />
          <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '16px', color: 'rgba(255,255,255,0.65)', letterSpacing: '0.04em' }}>
            {currentPlayer.name.toUpperCase()}'S TURN
          </span>
        </div>
      )}

      {/* Game card with 3D flip */}
      <SpicyCard question={question} flipPhase={flipPhase} />

      {totalCards > 0 && (
        <p key={`counter-${cardIndex}`} className="counter-in" style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', margin: 0, zIndex: 2 }}>
          CARD {cardIndex + 1} OF {totalCards}
        </p>
      )}

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <button className="game-btn" disabled={!canAdvance} onClick={() => advance(true)} style={{ border: `1px solid ${canAdvance ? '#fff' : 'rgba(255,255,255,.2)'}`, background: 'none', borderRadius: '999px', padding: '12px 18px', width: '160px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: canAdvance ? '#fff' : 'rgba(255,255,255,.35)', textAlign: 'center', boxShadow: '0 10px 24px rgba(0,0,0,0.25)', letterSpacing: '0.05em', cursor: canAdvance ? 'pointer' : 'not-allowed' }}>
          SKIP FOR NOW
        </button>
        <button className={canAdvance ? 'game-btn-primary' : ''} disabled={!canAdvance} onClick={() => advance(false)} style={{ background: canAdvance ? '#dc2827' : '#2a2a2a', border: 'none', borderRadius: '999px', padding: '12px 18px', width: '160px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: canAdvance ? '#fff' : 'rgba(255,255,255,.35)', textAlign: 'center', letterSpacing: '0.05em', cursor: canAdvance ? 'pointer' : 'not-allowed' }}>
          {canAdvance ? 'NEXT' : `WAITING FOR ${currentPlayer?.name.toUpperCase() ?? 'PLAYER'}`}
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   ROOT COMPONENT
   ═══════════════════════════════════════════════════════ */
type Step = 'ageGate' | 'howSpicy' | 'playerSetup' | 'deckSize' | 'getReady' | 'intro' | 'game'
const STEPS: readonly Step[] = ['ageGate', 'howSpicy', 'playerSetup', 'deckSize', 'getReady', 'intro', 'game']

export default function SpicyStartersGame({ onClose }: { onClose: () => void }) {
  const [step, setStep]           = useGameStep<Step>('spicy-starters', 'ageGate', STEPS)
  const [spiceLevel, setSpiceLevel] = usePersistentGameState<SpiceLevel>('spicy-starters', 'spiceLevel', 'medium')
  const [players, setPlayers]     = usePersistentGameState<Player[]>('spicy-starters', 'players', [])
  const [totalCards, setTotalCards] = usePersistentGameState('spicy-starters', 'totalCards', 0)
  const [cardIndex, setCardIndex] = usePersistentGameState('spicy-starters', 'cardIndex', 0)
  const [playerIndex, setPlayerIndex] = usePersistentGameState('spicy-starters', 'playerIndex', 0)
  const [skipCount, setSkipCount] = usePersistentGameState('spicy-starters', 'skipCount', 0)
  const [questions, setQuestions] = usePersistentGameState<string[]>('spicy-starters', 'questions', () => getShuffledDeck(SPICY_QUESTION_BANKS.medium, 'spicy-starters'))

  const currentPlayer = players.length > 0 ? players[playerIndex] : null

  const goToGame = useCallback(() => setStep('game'), [])

  const handleSelectSpice = (level: SpiceLevel) => {
    setSpiceLevel(level)
    const bank = SPICY_QUESTION_BANKS[level]
    setQuestions(getShuffledDeck(bank, 'spicy-starters'))
    setStep('playerSetup')
  }

  const handleStart = (n: number) => {
    setTotalCards(n)
    setCardIndex(0)
    setPlayerIndex(0)
    setPlayers(prev => shuffle([...prev])) // shuffle player order each game
    setStep('getReady')
  }

  const handleGetReadyDone = useCallback(() => {
    setStep('intro')
  }, [])

  const handlePlayAgain = useCallback(() => {
    setCardIndex(0)
    setPlayerIndex(0)
    setTotalCards(0)
    setSkipCount(0)
    setStep('howSpicy')
  }, [setCardIndex, setPlayerIndex, setSkipCount, setStep, setTotalCards])

  const handleAdvance = useCallback((skipped: boolean) => {
    if (skipped) setSkipCount(count => count + 1)
    setCardIndex(index => index + 1)
    setPlayerIndex(index => players.length > 0 ? (index + 1) % players.length : 0)
  }, [players.length, setCardIndex, setPlayerIndex, setSkipCount])

  return (
    <div className="game-fullscreen">
      <GameNav onBack={onClose} gameId="spicy-starters" />

      {step === 'ageGate' && (
        <AgeGate onBack={onClose} onConfirm={() => setStep('howSpicy')} />
      )}

      {step === 'howSpicy' && (
        <HowSpicy onSelect={handleSelectSpice} />
      )}

      {step === 'playerSetup' && (
        <PlayerSetup
          players={players} setPlayers={setPlayers}
          onBack={() => setStep('howSpicy')}
          onNext={() => setStep('deckSize')}
          onSkip={() => { setPlayers([]); setStep('deckSize') }}
        />
      )}

      {step === 'deckSize' && (
        <DeckSize onBack={() => setStep('playerSetup')} onStart={handleStart} />
      )}

      {step === 'getReady' && (
        <GetReady player={currentPlayer} onReady={handleGetReadyDone} />
      )}

      {step === 'intro' && (
        <IntroCard onTap={goToGame} firstQuestion={questions[0] ?? ''} />
      )}

      {step === 'game' && (
        <GameScreen
          questions={questions}
          players={players}
          totalCards={totalCards}
          cardIndex={cardIndex}
          playerIndex={playerIndex}
          skipCount={skipCount}
          onAdvance={handleAdvance}
          onClose={onClose}
          onPlayAgain={handlePlayAgain}
        />
      )}

      <GameFooter />
    </div>
  )
}
