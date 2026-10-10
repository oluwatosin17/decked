import { useCallback, useEffect, useMemo, useState } from 'react'
import { GAME_NAMES, type GameId } from '../gameRegistry'
import { getContentCatalog, getContentCounts, getContentHistory, publishContent, saveContentItem, setContentArchived, type ContentCategoryCount, type ContentItem } from './api'
import { groupContentCounts } from './contentGroups'
import { LoadingState, PageHeader, StatePanel } from './Primitives'

type Role = 'viewer' | 'editor' | 'admin'
type LoadState = 'loading' | 'ready' | 'error'
const PAGE_SIZE = 100

export default function ContentPage({ role }: { role: Role }) {
  const canEdit = role === 'editor' || role === 'admin'
  const [counts,setCounts]=useState<ContentCategoryCount[]>([])
  const [items,setItems]=useState<ContentItem[]>([])
  const [total,setTotal]=useState(0)
  const [gameId,setGameId]=useState('')
  const [categoryId,setCategoryId]=useState('')
  const [status,setStatus]=useState('')
  const [query,setQuery]=useState('')
  const [offset,setOffset]=useState(0)
  const [state,setState]=useState<LoadState>('loading')
  const [message,setMessage]=useState('')
  const [editing,setEditing]=useState<ContentItem|null>(null)
  const [duplicating,setDuplicating]=useState<ContentItem|null>(null)
  const [creating,setCreating]=useState(false)

  const load=useCallback(async()=>{setState('loading');setMessage('');try{const [countResult,catalog]=await Promise.all([getContentCounts(),getContentCatalog({gameId,categoryId,status,query,limit:PAGE_SIZE,offset})]);setCounts(countResult.games);setItems(catalog.rows);setTotal(catalog.total);setState('ready')}catch{setState('error')}},[gameId,categoryId,status,query,offset])
  useEffect(()=>{void load()},[load])
  const categories=useMemo(()=>counts.filter(row=>!gameId||row.game_id===gameId),[counts,gameId])
  const gameGroups=useMemo(()=>groupContentCounts(counts),[counts])
  const selectedCounts=useMemo(()=>counts.filter(row=>(!gameId||row.game_id===gameId)&&(!categoryId||row.category_id===categoryId)),[counts,gameId,categoryId])
  const published=selectedCounts.reduce((sum,row)=>sum+Number(row.published_count),0)
  const drafts=selectedCounts.reduce((sum,row)=>sum+Number(row.draft_count),0)
  const archived=selectedCounts.reduce((sum,row)=>sum+Number(row.archived_count),0)
  const shortCategories=selectedCounts.filter(row=>Number(row.published_count)<Number(row.target_count))

  const cardsOpen=Boolean(gameId&&categoryId)
  const categoriesOpen=Boolean(gameId&&!categoryId)
  const resetFilters=()=>{setGameId('');setCategoryId('');setStatus('');setQuery('');setOffset(0)}
  const openGame=(nextGameId:string)=>{const gameCategories=counts.filter(row=>row.game_id===nextGameId);setGameId(nextGameId);setCategoryId(gameCategories.length===1?gameCategories[0].category_id:'');setStatus('');setQuery('');setOffset(0)}
  const openCollection=(nextCategoryId:string)=>{setCategoryId(nextCategoryId);setStatus('');setQuery('');setOffset(0)}
  const closeGame=()=>{setGameId('');setCategoryId('');setStatus('');setQuery('');setOffset(0)}
  const closeCollection=()=>{setCategoryId('');setStatus('');setQuery('');setOffset(0)}
  const archive=async(item:ContentItem)=>{setMessage('');try{await setContentArchived(item.id,item.lifecycle_status!=='archived',item.current_version);setMessage(item.lifecycle_status==='archived'?'Card restored.':'Card archived.');await load()}catch{setMessage('The card changed or the update was rejected. Refresh and try again.')}}
  const publish=async()=>{if(!gameId)return;setMessage('');try{const result=await publishContent(gameId);setMessage(`Published ${result.item_count.toLocaleString()} cards in release ${result.release_id.slice(0,8)}.`);await load()}catch{setMessage('Publishing failed validation. The live release was not changed.')}}

  return <>
    <PageHeader eyebrow="CONTENT OPERATIONS" title="Content" description="Audit, author, preview, and publish Decked’s managed card library. Bundled cards remain available as the gameplay fallback."/>
    {gameId?<section className="cc-content-breadcrumb" aria-label="Content collection navigation"><button className="cc-text-button" onClick={closeGame}>All games</button><span aria-hidden="true">/</span>{cardsOpen?<button className="cc-text-button" onClick={closeCollection}>{GAME_NAMES[gameId as GameId]??gameId}</button>:<strong>{GAME_NAMES[gameId as GameId]??gameId}</strong>}{cardsOpen?<><span aria-hidden="true">/</span><strong>{categories.find(row=>row.category_id===categoryId)?.label??categoryId}</strong></>:null}</section>:null}
    {cardsOpen?<section className="cc-content-toolbar" aria-label="Content filters">
      <label>Game<select value={gameId} onChange={event=>{setGameId(event.target.value);setCategoryId('');setOffset(0)}}><option value="">All games</option>{Object.entries(GAME_NAMES).filter(([id])=>id!=='two-truths-bluff').map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
      <label>Category<select value={categoryId} onChange={event=>{setCategoryId(event.target.value);setOffset(0)}}><option value="">All categories</option>{categories.map(row=><option key={`${row.game_id}:${row.category_id}`} value={row.category_id}>{row.category_id}</option>)}</select></label>
      <label>Status<select value={status} onChange={event=>{setStatus(event.target.value);setOffset(0)}}><option value="">All states</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select></label>
      <label className="cc-content-search">Search<input value={query} onChange={event=>{setQuery(event.target.value);setOffset(0)}} placeholder="Search card text"/></label>
      <button className="cc-button cc-button-secondary" onClick={resetFilters}>Reset</button>
    </section>:null}
    <div className="cc-kpi-grid cc-content-kpis"><article className="cc-kpi"><span>Published memberships</span><strong>{published.toLocaleString()}</strong><small>Enabled and in a published version</small></article><article className="cc-kpi"><span>Draft memberships</span><strong>{drafts.toLocaleString()}</strong><small>Awaiting a release</small></article><article className="cc-kpi"><span>Archived memberships</span><strong>{archived.toLocaleString()}</strong><small>Recoverable, not delivered</small></article><article className="cc-kpi"><span>Below target</span><strong>{shortCategories.length.toLocaleString()}</strong><small>Categories below their 300-card target</small></article></div>
    {shortCategories.length?<div className="cc-warning"><strong>Readiness warning</strong><span>{shortCategories.slice(0,6).map(row=>`${row.game_id}/${row.category_id} (${row.published_count}/${row.target_count})`).join(' · ')}{shortCategories.length>6?' · …':''}</span></div>:null}
    <div className="cc-toolbar"><span>{cardsOpen?`${total.toLocaleString()} matching cards`:categoriesOpen?`${categories.length.toLocaleString()} collections`:`${gameGroups.length.toLocaleString()} games`}</span><div className="cc-content-actions">{canEdit?<button className="cc-button cc-button-secondary" onClick={()=>setCreating(true)}>New card</button>:null}{canEdit&&cardsOpen?<button className="cc-button" onClick={()=>void publish()}>Publish {GAME_NAMES[gameId as GameId]}</button>:null}</div></div>
    {message?<div className="cc-inline-success" role="status">{message}</div>:null}
    {state==='loading'?<LoadingState/>:state==='error'?<StatePanel title="Content unavailable" action={<button className="cc-button" onClick={()=>void load()}>Try again</button>}><p>The staff-only content query failed. No gameplay content was changed.</p></StatePanel>:!gameId?<section className="cc-content-game-grid" aria-label="Games with managed content">{gameGroups.map(group=><button className="cc-content-game-card" key={group.gameId} onClick={()=>openGame(group.gameId)}><span>GAME</span><h2>{GAME_NAMES[group.gameId as GameId]??group.gameId}</h2><div><strong>{group.categories.length}</strong><small>{group.categories.length===1?' collection':' collections'}</small></div><div><strong>{group.publishedCount.toLocaleString()}</strong><small> published cards</small></div><p>Open game content →</p></button>)}</section>:categoriesOpen?<section className="cc-content-game-group" aria-label={`${GAME_NAMES[gameId as GameId]??gameId} collections`}><header><div><span>CHOOSE A CATEGORY OR DECK</span><h2>{GAME_NAMES[gameId as GameId]??gameId}</h2></div><strong>{published.toLocaleString()}<small> published</small></strong></header><div className="cc-content-category-grid">{categories.map(category=><button key={category.category_id} onClick={()=>openCollection(category.category_id)}><span><strong>{category.label}</strong><small>{category.category_id}</small></span><span className="cc-content-category-count"><strong>{Number(category.published_count).toLocaleString()}</strong><small>of {Number(category.target_count).toLocaleString()}</small></span><span className={Number(category.published_count)>=Number(category.target_count)?'cc-content-ready':'cc-content-short'}>{Number(category.published_count)>=Number(category.target_count)?'Ready':`${Number(category.target_count)-Number(category.published_count)} short`}</span></button>)}</div></section>:items.length===0?<StatePanel title="No matching cards"><p>Adjust the filters or create a card if your role allows it.</p></StatePanel>:<section className="cc-panel"><div className="cc-table-wrap"><table className="cc-table cc-content-table"><thead><tr><th>Card</th><th>Game</th><th>Categories</th><th>State</th><th>Version</th><th>Source</th><th>Actions</th></tr></thead><tbody>{items.map(item=><tr key={item.id}><td><button className="cc-game-link" onClick={()=>setEditing(item)}>{item.body}</button>{item.item_kind==='choice'?<small>{String(item.metadata.option_a??'')} / {String(item.metadata.option_b??'')}</small>:null}</td><td>{GAME_NAMES[item.game_id as GameId]??item.game_id}</td><td>{item.categories.map(category=>category.category_id).join(', ')}</td><td>{item.lifecycle_status==='archived'?'archived':item.editorial_status}</td><td>{item.current_version}</td><td>{item.source.replace('_',' ')}</td><td>{canEdit?<div className="cc-row-actions"><button className="cc-text-button" onClick={()=>setDuplicating(item)}>Duplicate</button><button className="cc-text-button" onClick={()=>void archive(item)}>{item.lifecycle_status==='archived'?'Restore':'Archive'}</button></div>:'View only'}</td></tr>)}</tbody></table></div></section>}
    {cardsOpen?<div className="cc-pagination"><button className="cc-button cc-button-secondary" disabled={offset===0} onClick={()=>setOffset(value=>Math.max(0,value-PAGE_SIZE))}>Previous</button><span>{total?`${offset+1}–${Math.min(offset+PAGE_SIZE,total)} of ${total}`:'0 results'}</span><button className="cc-button cc-button-secondary" disabled={offset+PAGE_SIZE>=total} onClick={()=>setOffset(value=>value+PAGE_SIZE)}>Next</button></div>:null}
    {editing||creating||duplicating?<ContentEditor item={editing??duplicating} forceNew={Boolean(duplicating)} canEdit={canEdit} counts={counts} initialGameId={gameId} onClose={()=>{setEditing(null);setCreating(false);setDuplicating(null)}} onSaved={async()=>{setEditing(null);setCreating(false);setDuplicating(null);setMessage('Draft saved. Publish the game when it is ready.');await load()}}/>:null}
  </>
}

function ContentEditor({item,forceNew,canEdit,counts,initialGameId,onClose,onSaved}:{item:ContentItem|null;forceNew:boolean;canEdit:boolean;counts:ContentCategoryCount[];initialGameId:string;onClose:()=>void;onSaved:()=>Promise<void>}){
  const [gameId,setGameId]=useState(item?.game_id??initialGameId)
  const [kind,setKind]=useState<ContentItem['item_kind']>(item?.item_kind??'prompt')
  const [body,setBody]=useState(item?.body??'')
  const [categoryIds,setCategoryIds]=useState<string[]>(item?.categories.map(category=>category.category_id)??[])
  const [optionA,setOptionA]=useState(String(item?.metadata.option_a??''))
  const [optionB,setOptionB]=useState(String(item?.metadata.option_b??''))
  const [note,setNote]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [history,setHistory]=useState<Array<{version:number;status:string;created_at:string;change_note:string|null;body:string}>>([])
  useEffect(()=>{if(!item||forceNew)return;let active=true;void getContentHistory(item.id).then(result=>{if(active)setHistory(result.rows)}).catch(()=>{if(active)setHistory([])});return()=>{active=false}},[item,forceNew])
  const available=counts.filter(row=>row.game_id===gameId)
  const save=async()=>{if(!canEdit)return;setBusy(true);setError('');try{await saveContentItem({itemId:forceNew?undefined:item?.id,gameId,itemKind:kind,body:kind==='choice'&&optionA&&optionB?`${optionA} OR ${optionB}`:body,metadata:kind==='choice'?{option_a:optionA,option_b:optionB}:{},categoryIds,expectedVersion:forceNew?undefined:item?.current_version,changeNote:note});await onSaved()}catch{setError('Save failed. Check required fields, categories, permissions, or refresh a stale card.');setBusy(false)}}
  return <div className="cc-content-modal" role="dialog" aria-modal="true" aria-labelledby="content-editor-title"><section><header><div><span>{forceNew?'DUPLICATE CARD':item?'EDIT CARD':'NEW CARD'}</span><h2 id="content-editor-title">{item&&!forceNew?'Create a new draft version':'Add managed content'}</h2></div><button className="cc-dialog-close" aria-label="Close editor" onClick={onClose}>×</button></header><div className="cc-content-form"><label>Game<select disabled={Boolean(item)||!canEdit} value={gameId} onChange={event=>{setGameId(event.target.value);setCategoryIds([])}}><option value="">Select a game</option>{Object.entries(GAME_NAMES).filter(([id])=>id!=='two-truths-bluff').map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><label>Card type<select disabled={!canEdit} value={kind} onChange={event=>setKind(event.target.value as ContentItem['item_kind'])}><option value="prompt">Prompt</option><option value="challenge">Challenge</option><option value="scenario">Scenario</option><option value="choice">Choice</option></select></label>{kind==='choice'?<div className="cc-choice-fields"><label>Option A<input disabled={!canEdit} value={optionA} onChange={event=>setOptionA(event.target.value)}/></label><label>Option B<input disabled={!canEdit} value={optionB} onChange={event=>setOptionB(event.target.value)}/></label></div>:<label>Card text<textarea disabled={!canEdit} value={body} maxLength={1000} onChange={event=>setBody(event.target.value)}/><small>{body.length}/1000 characters</small></label>}<fieldset><legend>Categories</legend>{available.map(category=><label key={category.category_id}><input type="checkbox" disabled={!canEdit} checked={categoryIds.includes(category.category_id)} onChange={()=>setCategoryIds(current=>current.includes(category.category_id)?current.filter(id=>id!==category.category_id):[...current,category.category_id])}/>{category.category_id} <small>{category.published_count}/{category.target_count}</small></label>)}</fieldset>{canEdit?<label>Change note<input value={note} maxLength={500} onChange={event=>setNote(event.target.value)} placeholder="What changed and why?"/></label>:null}{history.length?<details className="cc-content-history"><summary>Version history ({history.length})</summary>{history.map(version=><article key={version.version}><strong>v{version.version} · {version.status}</strong><span>{new Date(version.created_at).toLocaleString()}</span><p>{version.body}</p>{version.change_note?<small>{version.change_note}</small>:null}</article>)}</details>:null}{error?<div className="cc-inline-error" role="alert">{error}</div>:null}</div><footer><button className="cc-button cc-button-secondary" onClick={onClose}>Cancel</button>{canEdit?<button className="cc-button" disabled={busy||!gameId||categoryIds.length===0||(kind==='choice'?!optionA.trim()||!optionB.trim():!body.trim())} onClick={()=>void save()}>{busy?'Saving…':'Save draft'}</button>:null}</footer></section></div>
}
