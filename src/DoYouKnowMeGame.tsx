import { useMemo, useRef, useState } from 'react'
import { track } from './analytics'
import { CompletionFeedbackLink, GameFooter, GameNav } from './components/GameShell'
import PlayerSetup, { type Player } from './components/PlayerSetup'
import DeckSize from './components/DeckSize'
import { KNOW_ME_CATEGORIES, promptsFor, shuffledPrompts, type KnowMeCategory, type KnowMeMode, type KnowMePrompt, type KnowMeRelationship } from './content/doYouKnowMe'

type Phase = 'mode'|'relationship'|'categories'|'players'|'rounds'|'custom'|'handoff'|'answer'|'reveal'|'results'
type Answer = { playerIndex: number; optionIndex: number }
const GAME_ID = 'do-you-know-me' as const
const modes: Array<{ id: KnowMeMode; title: string; copy: string }> = [
  { id: 'read-me', title: 'READ ME', copy: 'One player answers about themselves. Everyone else predicts their answer.' },
  { id: 'match-me', title: 'MATCH ME', copy: 'Everyone answers the same question. Matching answers score together.' },
]
const relationships: Array<{ id: KnowMeRelationship; label: string; icon: string }> = [
  { id: 'couple', label: 'Couple', icon: '/icons/couples.svg' },
  { id: 'friends', label: 'Friends', icon: '/icons/friends.svg' },
  { id: 'family', label: 'Family', icon: '/icons/family.svg' },
  { id: 'new-connections', label: 'New Connections', icon: '/icons/first-date-conv.svg' },
  { id: 'mixed-group', label: 'Mixed Group', icon: '/icons/group.svg' },
]
const categoryArtwork: Record<KnowMeCategory,string> = {
  personality: '/icons/reflect.svg',
  everyday: '/icons/everyday.svg',
  food: '/icons/charades-food.svg',
  opinions: '/icons/deep.svg',
  entertainment: '/icons/charades-movies.svg',
  future: '/icons/full-journey.svg',
  'nigerian-life': '/icons/charades-countries.svg',
  'wild-cards': '/icons/random.svg',
}
const shell: React.CSSProperties = { width:'min(620px,calc(100vw - 32px))',display:'grid',justifyItems:'center',gap:20,textAlign:'center' }
const title: React.CSSProperties = { margin:0,color:'#fff',font:"400 clamp(38px,9vw,56px)/1.02 'Anton SC',sans-serif",textTransform:'uppercase' }
const copy: React.CSSProperties = { margin:0,color:'rgba(255,255,255,.62)',font:"15px/1.48 'Satoshi',sans-serif" }
const primary: React.CSSProperties = { border:0,borderRadius:999,padding:'13px 26px',background:'#dc2827',color:'#fff',font:"16px/1 'Staatliches',sans-serif",letterSpacing:'.05em',cursor:'pointer' }
const secondary: React.CSSProperties = { ...primary,background:'transparent',border:'1px solid #fff' }

export default function DoYouKnowMeGame({ onClose }: { onClose: () => void }) {
  const [phase,setPhase]=useState<Phase>('mode')
  const [mode,setMode]=useState<KnowMeMode>('read-me')
  const [relationship,setRelationship]=useState<KnowMeRelationship>('friends')
  const [categories,setCategories]=useState<KnowMeCategory[]>(KNOW_ME_CATEGORIES.map(item=>item.id))
  const [players,setPlayers]=useState<Player[]>([])
  const [roundCount,setRoundCount]=useState(10)
  const [customPrompts,setCustomPrompts]=useState<KnowMePrompt[]>([])
  const [deck,setDeck]=useState<KnowMePrompt[]>([])
  const [round,setRound]=useState(0)
  const [answerIndex,setAnswerIndex]=useState(0)
  const [answers,setAnswers]=useState<Answer[]>([])
  const [scores,setScores]=useState<number[]>([])
  const startedAt=useRef(0)
  const prompt=deck[round]
  const spotlight=players.length ? round%players.length : 0
  const answeringOrder=useMemo(()=>mode==='read-me'?[spotlight,...players.map((_,i)=>i).filter(i=>i!==spotlight)]:players.map((_,i)=>i),[mode,players,spotlight])
  const activePlayerIndex=answeringOrder[answerIndex]??0

  const begin=(count=roundCount,prompts=customPrompts)=>{
    const custom=prompts.slice(0,count)
    const builtIn=shuffledPrompts(promptsFor(relationship,categories)).slice(0,Math.max(0,count-custom.length))
    const nextDeck=[...custom,...builtIn]
    const actual=nextDeck.length
    setRoundCount(actual);setCustomPrompts(prompts);setDeck(nextDeck);setRound(0);setAnswerIndex(0);setAnswers([]);setScores(players.map(()=>0));setPhase('handoff');startedAt.current=Date.now()
    track('deck_configured',{game_id:GAME_ID,requested_card_count:count,actual_card_count:actual,built_in_card_count:builtIn.length,custom_card_count:custom.length,category_ids:categories,mode_ids:[mode,relationship]})
    track('game_started',{game_id:GAME_ID,play_mode:'pass_and_play',starting_step:'handoff',configured_card_count:actual,player_count:players.length})
  }
  const submit=(optionIndex:number)=>{
    const next=[...answers,{playerIndex:activePlayerIndex,optionIndex}]
    setAnswers(next)
    if(answerIndex+1<answeringOrder.length){setAnswerIndex(value=>value+1);setPhase('handoff')}else setPhase('reveal')
  }
  const pointsForRound=()=>{
    const points=players.map(()=>0)
    if(mode==='read-me'){
      const truth=answers.find(item=>item.playerIndex===spotlight)?.optionIndex
      answers.filter(item=>item.playerIndex!==spotlight&&item.optionIndex===truth).forEach(item=>{points[item.playerIndex]=2})
      if(points.every((value,index)=>index===spotlight||value===0))points[spotlight]=2
      if(points.filter((_,index)=>index!==spotlight).every((value)=>value===2))points.forEach((_,index)=>{if(index!==spotlight)points[index]+=1})
    }else{
      const counts=answers.reduce<Record<number,number>>((map,item)=>({...map,[item.optionIndex]:(map[item.optionIndex]??0)+1}),{})
      answers.forEach(item=>{const matches=counts[item.optionIndex]??0;points[item.playerIndex]=matches===players.length?3:matches>=3?2:matches>=2?1:0})
    }
    return points
  }
  const nextRound=()=>{
    const earned=pointsForRound();setScores(current=>current.map((score,index)=>score+earned[index]))
    if(round+1>=roundCount){track('game_completed',{game_id:GAME_ID,play_mode:'pass_and_play',completion_reason:'rounds_finished',cards_presented:roundCount,cards_skipped:0,rounds_completed:roundCount,duration_seconds:Math.floor((Date.now()-startedAt.current)/1000),player_count:players.length});setPhase('results')}
    else{setRound(value=>value+1);setAnswerIndex(0);setAnswers([]);setPhase('handoff')}
  }
  const toggleCategory=(id:KnowMeCategory)=>setCategories(current=>current.includes(id)?current.length===1?current:current.filter(item=>item!==id):[...current,id])

  if(phase==='players')return <Frame onClose={onClose}><PlayerSetup minPlayers={2} maxPlayers={10} initialPlayers={players} skipLabel="GO BACK" onSkip={()=>setPhase('categories')} onNext={value=>{setPlayers(value);track('player_setup_completed',{game_id:GAME_ID,play_mode:'pass_and_play',player_count:value.length});setPhase('rounds')}} /></Frame>
  if(phase==='rounds')return <Frame onClose={onClose}><DeckSize title="HOW MANY ROUNDS?" description={mode==='read-me'?'Everyone will take turns in the spotlight.':'Choose how long you want to match minds.'} inputLabel="Number of rounds" min={3} max={30} initialValue={roundCount} nextLabel="NEXT" onBack={()=>setPhase('players')} onNext={count=>{setRoundCount(count);setPhase('custom')}} /></Frame>
  if(phase==='custom')return <Frame onClose={onClose}><CustomKnowMeQuestions maxQuestions={roundCount} initial={customPrompts} onBack={prompts=>{setCustomPrompts(prompts);setPhase('rounds')}} onStart={prompts=>begin(roundCount,prompts)} /></Frame>

  let content:React.ReactNode
  if(phase==='mode')content=<><p className="dykm-kicker">CHOOSE A MODE</p><h1 style={title}>HOW DO YOU WANT TO PLAY?</h1><div className="dykm-grid">{modes.map(item=><button key={item.id} className={mode===item.id?'selected':''} onClick={()=>setMode(item.id)}><b>{item.title}</b><span>{item.copy}</span></button>)}</div><button style={primary} onClick={()=>setPhase('relationship')}>CONTINUE</button></>
  else if(phase==='relationship')content=<><p className="dykm-kicker">WHO’S PLAYING?</p><h1 style={title}>CHOOSE YOUR GROUP</h1><div className="dykm-grid dykm-relationships">{relationships.map(item=><button key={item.id} className={relationship===item.id?'selected':''} onClick={()=>setRelationship(item.id)}><span className="dykm-relationship-art"><img src={item.icon} alt="" /></span><b>{item.label}</b>{relationship===item.id?<em aria-hidden="true">✓</em>:null}</button>)}</div><Nav back={()=>setPhase('mode')} next={()=>setPhase('categories')} /></>
  else if(phase==='categories')content=<><p className="dykm-kicker">PICK ONE OR MIX A FEW</p><h1 style={title}>CHOOSE CATEGORIES</h1><div className="dykm-grid categories">{KNOW_ME_CATEGORIES.map(item=>{const selected=categories.includes(item.id);return <button key={item.id} className={selected?'selected':''} aria-pressed={selected} onClick={()=>toggleCategory(item.id)}><span className="dykm-category-art"><img src={categoryArtwork[item.id]} alt="" /></span><b>{item.label}</b>{selected?<em aria-label="Selected">✓</em>:null}</button>})}</div><Nav back={()=>setPhase('relationship')} next={()=>setPhase('players')} /></>
  else if(phase==='handoff')content=<><p className="dykm-kicker">ROUND {round+1} OF {roundCount}</p><h1 style={title}>PASS TO {players[activePlayerIndex]?.name}</h1><Person player={players[activePlayerIndex]} /><p style={copy}>Make sure nobody else can see the screen.</p><button style={primary} onClick={()=>setPhase('answer')}>I’M READY</button></>
  else if(phase==='answer')content=<><p className="dykm-kicker">{mode==='read-me'&&activePlayerIndex===spotlight?'YOUR REAL ANSWER':mode==='read-me'?`PREDICT ${players[spotlight].name.toUpperCase()}`:'MATCH THE GROUP'}</p><h1 className="dykm-question">{prompt.question}</h1><div className="dykm-options">{prompt.options.map((option,index)=><button key={option} onClick={()=>submit(index)}>{option}</button>)}</div></>
  else if(phase==='reveal'){
    const earned=pointsForRound();const groups=prompt.options.map((option,optionIndex)=>({option,players:answers.filter(a=>a.optionIndex===optionIndex).map(a=>players[a.playerIndex])})).filter(group=>group.players.length)
    content=<><p className="dykm-kicker">THE REVEAL</p><h1 style={title}>{mode==='read-me'?`${players[spotlight].name} CHOSE…`:'HERE’S THE MATCH'}</h1>{mode==='read-me'?<div className="dykm-answer"><b>{prompt.options[answers.find(a=>a.playerIndex===spotlight)?.optionIndex??0]}</b></div>:null}<div className="dykm-results">{groups.map(group=><div key={group.option}><b>{group.option}</b><span>{group.players.map(player=>player.name).join(' · ')}</span></div>)}</div><div className="dykm-points">{players.map((player,index)=>({player,index})).filter(item=>earned[item.index]>0).map(item=><span key={`${item.index}-${item.player.name}`}>{item.player.name} +{earned[item.index]}</span>)}</div><button style={primary} onClick={nextRound}>{round+1<roundCount?'NEXT ROUND':'FINAL SCORES'}</button></>
  }else{
    const ranked=players.map((player,index)=>({player,score:scores[index],playerIndex:index})).sort((a,b)=>b.score-a.score)
    const topScore=ranked[0]?.score??0
    const winners=ranked.filter(item=>item.score===topScore)
    const resultCopy=winners.length>1?`${winners.map(item=>item.player.name).join(' & ')} tied at the top.`:`${winners[0]?.player.name??'Nobody'} knows the group best.`
    content=<><img className="dykm-trophy" src="/icons/trophy.svg" alt=""/><div><p className="dykm-kicker">GAME COMPLETE</p><h1 style={title}>{winners.length>1?'IT’S A TIE':'YOU KNOW THEM BEST'}</h1><p className="dykm-result-copy">{resultCopy}</p></div><div className="dykm-final-scores"><p>FINAL SCORES</p>{ranked.map((item,index)=><div className={index===0?'winner':''} key={`${item.playerIndex}-${item.player.name}`}><b>#{index+1}</b><i style={{background:item.player.color}}/><span>{item.player.name}</span>{index===0?<img src="/icons/trophy.svg" alt="Winner"/>:null}<strong>{item.score} {item.score===1?'PT':'PTS'}</strong></div>)}</div><div className="dykm-final-actions"><button style={secondary} onClick={onClose}>BROWSE GAMES</button><button style={primary} onClick={()=>begin()}>PLAY AGAIN</button></div><CompletionFeedbackLink gameId={GAME_ID}/></>
  }

  return <Frame onClose={onClose}><main className="dykm-main"><section style={shell}>{content}</section></main><Styles /><RelationshipOverrides /></Frame>
}

function Person({player}:{player:Player}){return <div className="dykm-person"><span style={{background:player.color}} />{player.name}</div>}
function Nav({back,next}:{back:()=>void;next:()=>void}){return <div style={{display:'flex',gap:10}}><button style={secondary} onClick={back}>GO BACK</button><button style={primary} onClick={next}>CONTINUE</button></div>}
function CustomKnowMeQuestions({maxQuestions,initial,onBack,onStart}:{maxQuestions:number;initial:KnowMePrompt[];onBack:(prompts:KnowMePrompt[])=>void;onStart:(prompts:KnowMePrompt[])=>void}){
  const [items,setItems]=useState<KnowMePrompt[]>(initial)
  const add=()=>setItems(current=>current.length>=maxQuestions?current:[...current,{id:`custom-${Date.now()}`,category:'wild-cards',relationships:[],question:'',options:['','','','']}])
  const update=(index:number,patch:Partial<KnowMePrompt>)=>setItems(current=>current.map((item,itemIndex)=>itemIndex===index?{...item,...patch}:item))
  const valid=items.filter(item=>item.question.trim()&&item.options.every(option=>option.trim())).map(item=>({...item,question:item.question.trim(),options:item.options.map(option=>option.trim()) as KnowMePrompt['options']}))
  return <main className="dykm-main"><section style={{...shell,width:'min(720px,calc(100vw - 32px))'}}><p className="dykm-kicker">OPTIONAL</p><h1 style={title}>ADD YOUR OWN QUESTIONS</h1><p style={copy}>Your questions play first. Decked questions automatically fill any rounds left.</p><div className="dykm-custom-list">{items.map((item,index)=><div className="dykm-custom-card" key={item.id}><div className="dykm-custom-head"><b>QUESTION {index+1}</b><button aria-label={`Remove question ${index+1}`} onClick={()=>setItems(current=>current.filter((_,itemIndex)=>itemIndex!==index))}>×</button></div><input aria-label={`Custom question ${index+1}`} value={item.question} onChange={event=>update(index,{question:event.target.value})} placeholder="Type your question"/><div className="dykm-custom-options">{item.options.map((option,optionIndex)=><input key={optionIndex} aria-label={`Question ${index+1} option ${optionIndex+1}`} value={option} onChange={event=>{const options=[...item.options] as KnowMePrompt['options'];options[optionIndex]=event.target.value;update(index,{options})}} placeholder={`Option ${optionIndex+1}`}/>)}</div></div>)}</div>{items.length<maxQuestions?<button className="dykm-add-question" onClick={add}>+ ADD QUESTION</button>:null}<div className="dykm-final-actions"><button style={secondary} onClick={()=>onBack(items)}>GO BACK</button><button style={primary} onClick={()=>onStart(valid)}>{valid.length?'START GAME':'SKIP & START'}</button></div></section></main>
}
function RelationshipOverrides(){return <style>{`
  .dykm-relationships{max-width:560px}
  .dykm-relationships button{min-height:76px;grid-template-columns:38px 1fr auto;gap:11px;padding:10px 14px;border-radius:12px}
  .dykm-relationships .dykm-relationship-art{width:34px;height:34px;background:transparent;box-shadow:none;transform:none}
  .dykm-relationships button:nth-child(even) .dykm-relationship-art{transform:none}
  .dykm-relationships .dykm-relationship-art img{width:32px;height:32px}
  .dykm-relationships b{font-size:18px}
  .dykm-relationships em{width:auto;height:auto;background:transparent;color:#fff;font-size:18px}
  .dykm-grid.categories{max-width:560px;grid-template-columns:1fr 1fr;gap:10px}
  .dykm-grid.categories button{min-height:76px;padding:10px 14px;gap:11px;border-radius:12px}
  .dykm-grid.categories .dykm-category-art{width:34px;height:34px;background:transparent;border-radius:0}
  .dykm-grid.categories .dykm-category-art img{width:32px;height:32px}
  .dykm-grid.categories b{font-size:18px}
  .dykm-grid.categories em{font-size:18px}
  .dykm-trophy{width:68px;height:68px;object-fit:contain}
  .dykm-result-copy{margin:8px 0 0;color:rgba(255,255,255,.58);font:15px/1.45 'Satoshi',sans-serif}
  .dykm-final-scores{width:100%;box-sizing:border-box;padding:14px;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:#070708;display:grid;gap:7px}
  .dykm-final-scores>p{margin:0 0 4px;color:rgba(255,255,255,.42);font:14px 'Staatliches',sans-serif;letter-spacing:.14em}
  .dykm-final-scores>div{min-height:48px;padding:6px 10px;display:flex;align-items:center;gap:10px;border-radius:11px;color:#fff;text-align:left}
  .dykm-final-scores>div.winner{background:rgba(220,40,39,.14)}
  .dykm-final-scores b{width:30px;color:rgba(255,255,255,.34);font:20px 'Anton SC',sans-serif}
  .dykm-final-scores .winner b{color:#ffcf37}
  .dykm-final-scores i{width:28px;height:28px;flex:0 0 auto;border:2px solid rgba(255,255,255,.85);border-radius:50%}
  .dykm-final-scores span{margin:0;color:#fff;font:16px 'Anton SC',sans-serif;text-transform:uppercase}
  .dykm-final-scores img{width:20px;height:20px;margin-left:2px}
  .dykm-final-scores strong{margin-left:auto;color:#ffcf37;font:19px 'Staatliches',sans-serif}
  .dykm-final-actions{width:100%;display:flex;gap:10px}
  .dykm-final-actions button{flex:1}
  .dykm-custom-list{width:100%;max-height:46vh;overflow:auto;display:grid;gap:10px;padding-right:3px}
  .dykm-custom-card{padding:14px;border:1px solid rgba(255,255,255,.14);border-radius:14px;background:#070708;display:grid;gap:9px}
  .dykm-custom-head{display:flex;align-items:center;justify-content:space-between;color:rgba(255,255,255,.52);font:14px 'Staatliches',sans-serif;letter-spacing:.08em}
  .dykm-custom-head button{border:0;background:none;color:rgba(255,255,255,.5);font-size:22px;cursor:pointer}
  .dykm-custom-card input{box-sizing:border-box;width:100%;min-height:44px;padding:10px 12px;border:1px solid rgba(255,255,255,.14);border-radius:9px;background:#111116;color:#fff;font:14px 'Satoshi',sans-serif;outline:none}
  .dykm-custom-card input:focus{border-color:#fff}
  .dykm-custom-options{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .dykm-add-question{min-height:44px;padding:10px 18px;border:1px dashed rgba(255,255,255,.28);border-radius:999px;background:transparent;color:#fff;font:15px 'Staatliches',sans-serif;cursor:pointer}
  @media(max-width:560px){
    .dykm-relationships button{min-height:68px;grid-template-columns:34px 1fr auto}
    .dykm-relationships .dykm-relationship-art{width:30px;height:30px}
    .dykm-relationships .dykm-relationship-art img{width:28px;height:28px}
    .dykm-grid.categories button{min-height:68px;gap:8px;padding:9px 10px}
    .dykm-grid.categories .dykm-category-art{width:30px;height:30px}
    .dykm-grid.categories .dykm-category-art img{width:28px;height:28px}
    .dykm-grid.categories b{font-size:16px}
    .dykm-trophy{width:58px;height:58px}
    .dykm-final-actions{flex-direction:column-reverse}
    .dykm-custom-options{grid-template-columns:1fr}
    .dykm-custom-list{max-height:48vh}
  }
`}</style>}
function Frame({onClose,children}:{onClose:()=>void;children:React.ReactNode}){return <div className="game-fullscreen"><GameNav onBack={onClose} gameId={GAME_ID} />{children}<GameFooter /></div>}
function Styles(){return <style>{`.dykm-main{flex:1;display:grid;place-items:center;padding:36px 16px 72px}.dykm-kicker{margin:0;color:#ffcf37;font:14px/1 'Staatliches',sans-serif;letter-spacing:.14em}.dykm-grid{width:100%;display:grid;grid-template-columns:1fr 1fr;gap:10px}.dykm-grid button,.dykm-options button{position:relative;min-height:92px;padding:16px;border:1px dashed rgba(255,255,255,.18);border-radius:14px;background:#070708;color:#fff;text-align:left;cursor:pointer}.dykm-grid button.selected{border:2px solid #fff;background:rgba(255,255,255,.06)}.dykm-grid b{display:block;font:400 21px/1.1 'Anton SC',sans-serif;text-transform:uppercase}.dykm-grid span{display:block;margin-top:7px;color:rgba(255,255,255,.55);font:13px/1.4 'Satoshi',sans-serif}.dykm-relationships button{min-height:112px;display:grid;grid-template-columns:64px 1fr auto;align-items:center;gap:15px;padding:14px 18px}.dykm-relationships .dykm-relationship-art{width:58px;height:58px;margin:0;display:grid;place-items:center;border-radius:13px;background:#f4ead2;box-shadow:inset 0 0 0 1px rgba(8,41,63,.12);transform:rotate(-2deg)}.dykm-relationships button:nth-child(even) .dykm-relationship-art{transform:rotate(2deg)}.dykm-relationships .dykm-relationship-art img{display:block;width:44px;height:44px;object-fit:contain}.dykm-relationships em{width:24px;height:24px;margin:0;display:grid;place-items:center;border-radius:50%;background:#fff;color:#47123c;font:900 14px 'Satoshi',sans-serif;font-style:normal}.dykm-grid.categories{grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.dykm-grid.categories button{min-height:82px;padding:10px 13px;display:flex;align-items:center;gap:11px}.dykm-grid.categories b{font-size:18px}.dykm-grid.categories .dykm-category-art{width:42px;height:42px;margin:0;display:grid;place-items:center;flex:0 0 auto;border-radius:12px;background:rgba(255,255,255,.08)}.dykm-grid.categories .dykm-category-art img{display:block;width:30px;height:30px;object-fit:contain}.dykm-grid.categories em{margin-left:auto;color:#fff;font:700 20px 'Satoshi',sans-serif;font-style:normal}.dykm-question{margin:0;max-width:18ch;color:#fff;font:400 clamp(30px,7vw,46px)/1.1 'Anton SC',sans-serif;text-transform:uppercase}.dykm-options,.dykm-results,.dykm-leaderboard{width:100%;display:grid;gap:9px}.dykm-options button{min-height:58px;text-align:center;font:700 16px 'Satoshi',sans-serif}.dykm-options button:hover{border-style:solid;border-color:#fff;background:#47123c}.dykm-person{display:flex;align-items:center;gap:12px;padding:13px 18px;border-radius:999px;background:#070708;color:#fff;font:400 20px 'Anton SC',sans-serif;text-transform:uppercase}.dykm-person span{width:32px;height:32px;border-radius:50%;box-shadow:0 0 0 2px #fff}.dykm-answer{width:100%;box-sizing:border-box;padding:26px;border-radius:16px;background:#ffcf37;color:#35152d}.dykm-answer b{font:400 clamp(30px,8vw,48px) 'Anton SC',sans-serif;text-transform:uppercase}.dykm-results>div,.dykm-leaderboard>div{display:flex;align-items:center;gap:12px;min-height:54px;padding:10px 14px;border-radius:12px;background:#070708;color:#fff}.dykm-results b{font:400 18px 'Anton SC',sans-serif}.dykm-results span{margin-left:auto;color:rgba(255,255,255,.62);font:14px 'Satoshi',sans-serif}.dykm-points{display:flex;gap:7px;flex-wrap:wrap;justify-content:center}.dykm-points span{padding:7px 11px;border-radius:999px;background:#1f7a55;color:#fff;font:700 13px 'Satoshi',sans-serif}.dykm-leaderboard b{width:30px;color:#ffcf37;font:20px 'Anton SC',sans-serif}.dykm-leaderboard span{font:700 15px 'Satoshi',sans-serif}.dykm-leaderboard strong{margin-left:auto;font:19px 'Staatliches',sans-serif}@media(max-width:700px){.dykm-grid.categories{grid-template-columns:1fr 1fr}}@media(max-width:560px){.dykm-grid{grid-template-columns:1fr}.dykm-grid button{min-height:74px}.dykm-grid.categories{grid-template-columns:1fr 1fr;gap:8px}.dykm-grid.categories button{min-height:70px;padding:9px}.dykm-grid.categories b{font-size:16px}.dykm-grid.categories .dykm-category-art{width:38px;height:38px}.dykm-grid.categories .dykm-category-art img{width:27px;height:27px}.dykm-relationships button{min-height:88px;grid-template-columns:54px 1fr auto}.dykm-relationships .dykm-relationship-art{width:50px;height:50px}.dykm-relationships .dykm-relationship-art img{width:38px;height:38px}}`}</style>}
