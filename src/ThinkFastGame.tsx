import { useEffect, useRef, useState } from 'react'
import { track } from './analytics'
import { CompletionFeedbackLink, GameFooter, GameNav } from './components/GameShell'
import ThinkFastPromptCard from './components/ThinkFastPromptCard'
import DeckSize from './components/DeckSize'
import PlayerSetup, { type Player } from './components/PlayerSetup'
import { haptic } from './haptics'
import { shuffledThinkFastPrompts } from './content/thinkFast'
import { TimerControl } from './CharadesGame'

type Phase = 'players' | 'rounds' | 'custom' | 'timer' | 'handoff' | 'prompt' | 'judge' | 'steal' | 'results'
const GAME_ID = 'think-fast' as const
const primary: React.CSSProperties = { border:0,borderRadius:999,padding:'14px 27px',background:'#dc2827',color:'#fff',font:"16px/1 'Staatliches',sans-serif",letterSpacing:'.04em',cursor:'pointer' }
const secondary: React.CSSProperties = { ...primary,background:'transparent',border:'1px solid rgba(255,255,255,.8)' }

export default function ThinkFastGame({ onClose }: { onClose: () => void }) {
  const [phase,setPhase]=useState<Phase>('players')
  const [players,setPlayers]=useState<Player[]>([])
  const [roundsPerPlayer,setRoundsPerPlayer]=useState(3)
  const [custom,setCustom]=useState<string[]>([])
  const [turnSeconds,setTurnSeconds]=useState(7)
  const [deck,setDeck]=useState<string[]>([])
  const [round,setRound]=useState(0)
  const [scores,setScores]=useState<number[]>([])
  const [seconds,setSeconds]=useState(7)
  const [paused,setPaused]=useState(false)
  const startedAt=useRef(0)
  const totalRounds=players.length*roundsPerPlayer
  const activeIndex=players.length?round%players.length:0

  useEffect(()=>{
    if(phase!=='prompt')return
    setSeconds(turnSeconds)
    setPaused(false)
  },[phase,round,turnSeconds])

  useEffect(()=>{
    if(phase!=='prompt'||paused)return
    const interval=window.setInterval(()=>setSeconds(value=>{
      if(value<=1){window.clearInterval(interval);haptic('medium');setPhase('judge');return 0}
      if(value<=4)haptic('light')
      return value-1
    }),1000)
    return()=>window.clearInterval(interval)
  },[phase,paused])

  const begin=(prompts=custom)=>{
    const cleaned=prompts.map(item=>item.trim()).filter(Boolean).slice(0,totalRounds)
    const builtIn=shuffledThinkFastPrompts().slice(0,Math.max(0,totalRounds-cleaned.length))
    setCustom(cleaned);setDeck([...cleaned,...builtIn]);setScores(players.map(()=>0));setRound(0);setPhase('handoff');startedAt.current=Date.now()
    track('deck_configured',{game_id:GAME_ID,requested_card_count:totalRounds,actual_card_count:cleaned.length+builtIn.length,built_in_card_count:builtIn.length,custom_card_count:cleaned.length})
    track('game_started',{game_id:GAME_ID,play_mode:'pass_and_play',starting_step:'handoff',configured_card_count:totalRounds,player_count:players.length})
  }
  const finishRound=(winnerIndex?:number,points=0)=>{
    if(winnerIndex!==undefined)setScores(current=>current.map((score,index)=>score+(index===winnerIndex?points:0)))
    if(round+1>=deck.length){
      track('game_completed',{game_id:GAME_ID,play_mode:'pass_and_play',completion_reason:'rounds_finished',cards_presented:deck.length,cards_skipped:0,rounds_completed:deck.length,duration_seconds:Math.floor((Date.now()-startedAt.current)/1000),player_count:players.length})
      haptic('celebrate');setPhase('results')
    }else{setRound(value=>value+1);setPhase('handoff')}
  }

  if(phase==='players')return <Frame onClose={onClose}><PlayerSetup minPlayers={2} maxPlayers={12} initialPlayers={players} skipLabel="BROWSE GAMES" onSkip={onClose} onNext={value=>{setPlayers(value);setPhase('rounds')}} /></Frame>
  if(phase==='rounds')return <Frame onClose={onClose}><DeckSize title="ROUNDS PER PLAYER" description="Everyone gets the same number of chances in the hot seat." inputLabel="Rounds per player" min={1} max={10} initialValue={roundsPerPlayer} nextLabel="NEXT" onBack={()=>setPhase('players')} onNext={value=>{setRoundsPerPlayer(value);setPhase('custom')}} /></Frame>
  if(phase==='custom')return <Frame onClose={onClose}><CustomPrompts max={totalRounds} initial={custom} onBack={items=>{setCustom(items);setPhase('rounds')}} onNext={items=>{setCustom(items);setPhase('timer')}}/></Frame>
  if(phase==='timer')return <Frame onClose={onClose}><TimerSetup value={turnSeconds} onBack={()=>setPhase('custom')} onStart={value=>{setTurnSeconds(value);begin()}}/></Frame>

  const active=players[activeIndex]
  let content:React.ReactNode
  if(phase==='handoff')content=<><p className="tf-kicker">ROUND {round+1} OF {deck.length}</p><h1>PASS TO {active?.name}</h1><div className="tf-player"><i style={{background:active?.color}}/>{active?.name}</div><p className="tf-copy">When the prompt appears, say three valid answers before time runs out.</p><button style={primary} data-sound="card.flip" onClick={()=>{haptic('medium');setPhase('prompt')}}>I’M READY</button></>
  else if(phase==='prompt')content=<><p className="tf-kicker">{active?.name} — THINK FAST</p><ThinkFastPromptCard prompt={deck[round]}/><TimerControl timeLeft={seconds} roundLength={turnSeconds} paused={paused} urgentAt={Math.min(3,turnSeconds)} cancelLabel="END" onTogglePause={()=>setPaused(value=>!value)} onCancel={()=>{haptic('medium');setPhase('judge')}}/><p className="tf-copy">Say all three answers out loud.</p></>
  else if(phase==='judge')content=<><p className="tf-kicker">TIME’S UP</p><h1>DID {active?.name} GET ALL THREE?</h1><div className="tf-actions"><button style={secondary} onClick={()=>{haptic('light');setPhase('steal')}}>MISSED IT</button><button style={primary} onClick={()=>{haptic('success');finishRound(activeIndex,2)}}>GOT IT · +2</button></div></>
  else if(phase==='steal')content=<><p className="tf-kicker">STEAL FOR +1</p><h1>WHO CALLED IT FIRST?</h1><p className="tf-copy">Anyone except {active?.name} can say the three answers. Pick the first correct player.</p><div className="tf-steal-grid">{players.map((player,index)=>index===activeIndex?null:<button key={`${player.name}-${index}`} onClick={()=>{haptic('success');finishRound(index,1)}}><i style={{background:player.color}}/>{player.name}<b>+1</b></button>)}</div><button className="tf-link" onClick={()=>finishRound()}>Nobody got it</button></>
  else {const ranked=players.map((player,index)=>({player,index,score:scores[index]??0})).sort((a,b)=>b.score-a.score);const top=ranked[0]?.score??0;const winners=ranked.filter(item=>item.score===top);content=<><img className="tf-trophy" src="/icons/trophy.svg" alt=""/><p className="tf-kicker">GAME COMPLETE</p><h1>{winners.length>1?'TOO FAST TO CALL':`${winners[0]?.player.name} WINS`}</h1><p className="tf-copy">{winners.length>1?`${winners.map(item=>item.player.name).join(' & ')} finish level on ${top} points.`:`Quick thinking. Even quicker answers.`}</p><div className="tf-scores">{ranked.map((item,place)=><div className={place===0?'winner':''} key={`${item.index}-${item.player.name}`}><b>#{place+1}</b><i style={{background:item.player.color}}/><span>{item.player.name}</span><strong>{item.score} PTS</strong></div>)}</div><div className="tf-actions"><button style={secondary} onClick={onClose}>BROWSE GAMES</button><button style={primary} onClick={()=>begin()}>PLAY AGAIN</button></div><CompletionFeedbackLink gameId={GAME_ID}/></>}
  return <Frame onClose={onClose}><main className="tf-main"><section className="tf-shell">{content}</section></main></Frame>
}

function CustomPrompts({max,initial,onBack,onNext}:{max:number;initial:string[];onBack:(items:string[])=>void;onNext:(items:string[])=>void}){
  const [items,setItems]=useState(initial.length?initial:[''])
  const valid=items.map(item=>item.trim()).filter(Boolean)
  return <main className="tf-main"><section className="tf-shell tf-custom-screen"><p className="tf-kicker">OPTIONAL</p><h1>CREATE PROMPTS</h1><p className="tf-copy">Your prompts play first. We’ll fill any rounds left.</p><div className="tf-custom">{items.map((item,index)=><div key={index}><span>{index+1}</span><input value={item} onChange={event=>setItems(current=>current.map((value,i)=>i===index?event.target.value:value))} placeholder="e.g. Name 3 songs everyone knows"/><button aria-label={`Remove prompt ${index+1}`} onClick={()=>setItems(current=>current.filter((_,i)=>i!==index))}>×</button></div>)}</div>{items.length<max?<button className="tf-add" onClick={()=>setItems(current=>[...current,''])}>+ ADD PROMPT</button>:null}<div className="tf-actions"><button style={secondary} onClick={()=>onBack(valid)}>GO BACK</button><button style={primary} onClick={()=>onNext(valid)}>{valid.length?'CONTINUE':'SKIP'}</button></div></section></main>
}
function TimerSetup({value,onBack,onStart}:{value:number;onBack:()=>void;onStart:(seconds:number)=>void}){
  const [seconds,setSeconds]=useState(value)
  return <main className="tf-main"><section className="tf-shell tf-timer-setup"><p className="tf-kicker">ANSWER TIME</p><h1>SET THE TIMER</h1><p className="tf-copy">Choose how long each player gets to name all three.</p><div className="tf-time-options">{[5,7,10,15].map(option=><button key={option} className={seconds===option?'selected':''} onClick={()=>setSeconds(option)}><b>{option}</b><span>SECONDS</span></button>)}</div><label className="tf-time-input"><span>Custom time</span><input aria-label="Seconds per turn" type="number" min={3} max={60} value={seconds} onChange={event=>setSeconds(Math.max(3,Math.min(60,Number(event.target.value)||3)))}/><small>seconds</small></label><div className="tf-actions"><button style={secondary} onClick={onBack}>GO BACK</button><button style={primary} onClick={()=>onStart(seconds)}>START GAME</button></div></section></main>
}
function Frame({onClose,children}:{onClose:()=>void;children:React.ReactNode}){return <div className="game-fullscreen"><GameNav onBack={onClose} gameId={GAME_ID}/>{children}<GameFooter/><Styles/></div>}
function Styles(){return <style>{`.tf-main{flex:1;display:grid;place-items:center;padding:36px 16px 72px}.tf-shell{width:min(620px,calc(100vw - 32px));display:flex;flex-direction:column;align-items:center;gap:19px;text-align:center}.tf-shell h1{margin:0;max-width:18ch;color:#fff;font:400 clamp(38px,9vw,58px)/1 'Anton SC',sans-serif;text-transform:uppercase}.tf-kicker{margin:0;color:#ff8a1f;font:15px 'Staatliches',sans-serif;letter-spacing:.14em}.tf-copy{margin:0;max-width:48ch;color:rgba(255,255,255,.66);font:15px/1.5 'Satoshi',sans-serif}.tf-player{display:flex;align-items:center;gap:10px;color:#fff;font:28px 'Anton SC',sans-serif;text-transform:uppercase}.tf-player i,.tf-steal-grid i,.tf-scores i{width:32px;height:32px;border:2px solid #fff;border-radius:50%}.tf-shell>.charades-timer-control{width:min(350px,calc(100vw - 42px));margin-top:-2px}.tf-actions{width:100%;display:flex;gap:10px}.tf-actions button{flex:1}.tf-steal-grid,.tf-scores,.tf-custom{width:100%;display:grid;gap:9px}.tf-steal-grid{grid-template-columns:1fr 1fr}.tf-steal-grid button,.tf-scores>div,.tf-custom>div{min-height:58px;display:flex;align-items:center;gap:10px;padding:10px 14px;border:1px solid rgba(255,255,255,.13);border-radius:13px;background:#070708;color:#fff;box-sizing:border-box}.tf-steal-grid button{font:19px 'Anton SC',sans-serif;text-transform:uppercase;cursor:pointer}.tf-steal-grid b,.tf-scores strong{margin-left:auto;color:#ff8a1f;font:18px 'Staatliches',sans-serif}.tf-link,.tf-add{border:0;background:none;color:rgba(255,255,255,.62);font:15px 'Staatliches',sans-serif;text-decoration:underline;cursor:pointer}.tf-trophy{width:68px;height:68px}.tf-scores>div.winner{background:rgba(255,138,31,.13)}.tf-scores>div>b{width:28px;color:rgba(255,255,255,.42);font:20px 'Anton SC',sans-serif}.tf-scores span{font:18px 'Anton SC',sans-serif;text-transform:uppercase}.tf-custom-screen{gap:13px}.tf-custom-screen h1{font-size:clamp(32px,7vw,46px)}.tf-custom{max-height:38vh;overflow:auto}.tf-custom>div span{width:24px;color:#ff8a1f;font:17px 'Staatliches',sans-serif}.tf-custom input{min-width:0;flex:1;padding:10px;border:0;background:transparent;color:#fff;font:15px 'Satoshi',sans-serif;outline:none}.tf-custom button{border:0;background:none;color:rgba(255,255,255,.5);font-size:22px;cursor:pointer}.tf-time-options{width:100%;display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.tf-time-options button{min-height:76px;border:1px solid rgba(255,255,255,.16);border-radius:13px;background:#070708;color:#fff;cursor:pointer}.tf-time-options button.selected{border:2px solid #ff8a1f;background:rgba(255,138,31,.12)}.tf-time-options b,.tf-time-options span{display:block}.tf-time-options b{font:32px 'Anton SC',sans-serif}.tf-time-options span{margin-top:3px;color:rgba(255,255,255,.55);font:11px 'Staatliches',sans-serif;letter-spacing:.08em}.tf-time-input{width:100%;min-height:58px;box-sizing:border-box;display:flex;align-items:center;gap:10px;padding:9px 13px;border:1px solid rgba(255,255,255,.13);border-radius:13px;background:#070708;color:#fff;text-align:left}.tf-time-input>span{flex:1;font:15px 'Satoshi',sans-serif}.tf-time-input input{width:64px;padding:7px;border:1px solid rgba(255,255,255,.18);border-radius:8px;background:#1a1a1d;color:#fff;font:23px 'Anton SC',sans-serif;text-align:center}.tf-time-input small{color:rgba(255,255,255,.55);font:12px 'Satoshi',sans-serif}@media(max-width:560px){.tf-main{padding:20px 16px 64px}.tf-shell{gap:14px}.tf-custom-screen{gap:10px}.tf-custom-screen h1{font-size:34px}.tf-custom>div{min-height:52px;padding:6px 10px}.tf-time-options{grid-template-columns:1fr 1fr}.tf-steal-grid{grid-template-columns:1fr}.tf-actions{flex-direction:column-reverse}.tf-shell>.charades-timer-control{width:min(310px,calc(100vw - 32px))}}`}</style>}
