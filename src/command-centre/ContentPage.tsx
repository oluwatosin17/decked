import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GAME_NAMES, type GameId } from '../gameRegistry'
import { getAllContentCatalog, getContentCatalog, getContentCounts, getContentHistory, importContentJson, publishContent, saveContentItem, setContentArchived, type ContentCategoryCount, type ContentItem } from './api'
import { groupContentCounts } from './contentGroups'
import { contentMetadataForSave } from './contentMetadata'
import { buildContentJsonDocument, contentJsonFilename, downloadContentJson, MAX_CONTENT_JSON_BYTES, parseContentJson, type ContentJsonDocument } from './contentJson'
import { LoadingState, PageHeader, StatePanel } from './Primitives'
import { spellingContentErrors, spellingContentPreview } from '../content/spellingManaged'
import { spellingAudioId } from '../content/spellingAudio'

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
  const [importPreview,setImportPreview]=useState<{fileName:string;document:ContentJsonDocument;spelling?:ReturnType<typeof spellingContentPreview>}|null>(null)
  const [importBusy,setImportBusy]=useState(false)
  const [importError,setImportError]=useState('')
  const fileInputRef=useRef<HTMLInputElement>(null)

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
  const publish=async()=>{if(!gameId)return;setMessage('');try{if(gameId==='spelling-bee'){const active=(await getAllContentCatalog({gameId})).filter(item=>item.lifecycle_status==='active');const preview=spellingContentPreview(active.map(item=>({item_kind:item.item_kind,body:item.body,metadata:item.metadata,category_ids:item.categories.filter(category=>category.enabled).map(category=>category.category_id)})),[]);const missingAudio=active.filter(item=>!spellingAudioId(item.body)).length;if(!active.length||preview.errors.length||preview.needsReview||missingAudio){setMessage(`Spelling Bee release held: ${preview.needsReview} words need review, ${missingAudio} need pronunciation audio, and ${preview.errors.length} have validation issues.`);return}}const result=await publishContent(gameId);setMessage(`Published ${result.item_count.toLocaleString()} cards in release ${result.release_id.slice(0,8)}.`);await load()}catch{setMessage('Publishing failed validation. The live release was not changed.')}}
  const downloadJson=async()=>{if(!gameId)return;setMessage('Generating JSON download…');try{const exportItems=await getAllContentCatalog({gameId,categoryId,status,query});if(exportItems.length===0){setMessage('There are no matching cards to download.');return}const document=buildContentJsonDocument(gameId,categoryId,exportItems);downloadContentJson(contentJsonFilename(gameId,categoryId),document);setMessage(`Downloaded ${exportItems.length.toLocaleString()} cards as JSON.`)}catch{setMessage('JSON download failed. Refresh and try again.')}}
  const chooseJsonFile=async(file:File|undefined)=>{if(!file)return;setImportError('');if(file.size>MAX_CONTENT_JSON_BYTES){setMessage('JSON upload is larger than 5 MB.');return}try{const document=parseContentJson(await file.text(),gameId||undefined);const spelling=document.game_id==='spelling-bee'?spellingContentPreview(document.items,await getAllContentCatalog({gameId:'spelling-bee'})):undefined;setImportPreview({fileName:file.name,document,spelling});setMessage('')}catch(error){setMessage(error instanceof Error?error.message:'The JSON file could not be read.')}finally{if(fileInputRef.current)fileInputRef.current.value=''}}
  const runImport=async()=>{if(!importPreview||importPreview.spelling?.errors.length)return;setImportBusy(true);setImportError('');try{const result=await importContentJson(importPreview.document);setImportPreview(null);setMessage(`Imported ${result.item_count.toLocaleString()} cards as drafts: ${result.created_count.toLocaleString()} created, ${result.updated_count.toLocaleString()} updated, ${result.unchanged_count.toLocaleString()} unchanged. ${result.game_id==='spelling-bee'?'Review each word and add pronunciation audio before publishing.':`Publish ${GAME_NAMES[result.game_id as GameId]??result.game_id} when you want players to receive them.`}`);await load()}catch{setImportError('Import failed validation. Nothing was changed. Check card IDs, categories, duplicate text, and your permissions.')}finally{setImportBusy(false)}}

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
    <div className="cc-toolbar"><span>{cardsOpen?`${total.toLocaleString()} matching cards`:categoriesOpen?`${categories.length.toLocaleString()} collections`:`${gameGroups.length.toLocaleString()} games`}</span><div className="cc-content-actions">{gameId?<button className="cc-button cc-button-secondary" onClick={()=>void downloadJson()}>Download JSON</button>:null}{canEdit&&gameId?<><input ref={fileInputRef} className="cc-visually-hidden" type="file" accept="application/json,.json" aria-label="Upload content JSON" onChange={event=>void chooseJsonFile(event.target.files?.[0])}/><button className="cc-button cc-button-secondary" onClick={()=>fileInputRef.current?.click()}>Upload JSON</button></>:null}{canEdit?<button className="cc-button cc-button-secondary" onClick={()=>setCreating(true)}>New card</button>:null}{canEdit&&gameId?<button className="cc-button" onClick={()=>void publish()}>Publish {GAME_NAMES[gameId as GameId]}</button>:null}</div></div>
    {message?<div className="cc-inline-success" role="status">{message}</div>:null}
    {state==='loading'?<LoadingState/>:state==='error'?<StatePanel title="Content unavailable" action={<button className="cc-button" onClick={()=>void load()}>Try again</button>}><p>The staff-only content query failed. No gameplay content was changed.</p></StatePanel>:!gameId?<section className="cc-content-game-grid" aria-label="Games with managed content">{gameGroups.map(group=><button className="cc-content-game-card" key={group.gameId} onClick={()=>openGame(group.gameId)}><span>GAME</span><h2>{GAME_NAMES[group.gameId as GameId]??group.gameId}</h2><div><strong>{group.categories.length}</strong><small>{group.categories.length===1?' collection':' collections'}</small></div><div><strong>{group.publishedCount.toLocaleString()}</strong><small> published cards</small></div><p>Open game content →</p></button>)}</section>:categoriesOpen?<section className="cc-content-game-group" aria-label={`${GAME_NAMES[gameId as GameId]??gameId} collections`}><header><div><span>CHOOSE A CATEGORY OR DECK</span><h2>{GAME_NAMES[gameId as GameId]??gameId}</h2></div><strong>{published.toLocaleString()}<small> published</small></strong></header><div className="cc-content-category-grid">{categories.map(category=><button key={category.category_id} onClick={()=>openCollection(category.category_id)}><span><strong>{category.label}</strong><small>{category.category_id}</small></span><span className="cc-content-category-count"><strong>{Number(category.published_count).toLocaleString()}</strong><small>of {Number(category.target_count).toLocaleString()}</small></span><span className={Number(category.published_count)>=Number(category.target_count)?'cc-content-ready':'cc-content-short'}>{Number(category.published_count)>=Number(category.target_count)?'Ready':`${Number(category.target_count)-Number(category.published_count)} short`}</span></button>)}</div></section>:items.length===0?<StatePanel title="No matching cards"><p>Adjust the filters or create a card if your role allows it.</p></StatePanel>:<section className="cc-panel"><div className="cc-table-wrap"><table className="cc-table cc-content-table"><thead><tr><th>Card</th><th>Game</th><th>Categories</th><th>State</th><th>Version</th><th>Source</th><th>Actions</th></tr></thead><tbody>{items.map(item=><tr key={item.id}><td><button className="cc-game-link" onClick={()=>setEditing(item)}>{item.body}</button>{item.item_kind==='choice'?<small>{String(item.metadata.option_a??'')} / {String(item.metadata.option_b??'')}</small>:null}</td><td>{GAME_NAMES[item.game_id as GameId]??item.game_id}</td><td>{item.categories.map(category=>category.category_id).join(', ')}</td><td>{item.lifecycle_status==='archived'?'archived':item.editorial_status}</td><td>{item.current_version}</td><td>{item.source.replace('_',' ')}</td><td>{canEdit?<div className="cc-row-actions"><button className="cc-text-button" onClick={()=>setDuplicating(item)}>Duplicate</button><button className="cc-text-button" onClick={()=>void archive(item)}>{item.lifecycle_status==='archived'?'Restore':'Archive'}</button></div>:'View only'}</td></tr>)}</tbody></table></div></section>}
    {cardsOpen?<div className="cc-pagination"><button className="cc-button cc-button-secondary" disabled={offset===0} onClick={()=>setOffset(value=>Math.max(0,value-PAGE_SIZE))}>Previous</button><span>{total?`${offset+1}–${Math.min(offset+PAGE_SIZE,total)} of ${total}`:'0 results'}</span><button className="cc-button cc-button-secondary" disabled={offset+PAGE_SIZE>=total} onClick={()=>setOffset(value=>value+PAGE_SIZE)}>Next</button></div>:null}
    {editing||creating||duplicating?<ContentEditor item={editing??duplicating} forceNew={Boolean(duplicating)} canEdit={canEdit} counts={counts} initialGameId={gameId} onClose={()=>{setEditing(null);setCreating(false);setDuplicating(null)}} onSaved={async()=>{setEditing(null);setCreating(false);setDuplicating(null);setMessage('Draft saved. Publish the game when it is ready.');await load()}}/>:null}
    {importPreview?<ContentImportDialog fileName={importPreview.fileName} document={importPreview.document} spelling={importPreview.spelling} busy={importBusy} error={importError} onCancel={()=>{if(!importBusy)setImportPreview(null)}} onImport={()=>void runImport()}/>:null}
  </>
}

function ContentImportDialog({fileName,document,spelling,busy,error,onCancel,onImport}:{fileName:string;document:ContentJsonDocument;spelling?:ReturnType<typeof spellingContentPreview>;busy:boolean;error:string;onCancel:()=>void;onImport:()=>void}){
  const archived=document.items.filter(item=>item.lifecycle_status==='archived').length
  const categories=new Set(document.items.flatMap(item=>item.category_ids)).size
  return <div className="cc-content-modal" role="dialog" aria-modal="true" aria-labelledby="content-import-title"><section><header><div><span>JSON IMPORT</span><h2 id="content-import-title">Review content upload</h2></div><button className="cc-dialog-close" aria-label="Close import review" disabled={busy} onClick={onCancel}>×</button></header><div className="cc-content-form"><p><strong>{fileName}</strong></p><dl className="cc-import-summary"><div><dt>Game</dt><dd>{GAME_NAMES[document.game_id as GameId]??document.game_id}</dd></div><div><dt>Cards</dt><dd>{document.items.length.toLocaleString()}</dd></div><div><dt>Categories</dt><dd>{categories.toLocaleString()}</dd></div><div><dt>Archived</dt><dd>{archived.toLocaleString()}</dd></div></dl>{spelling?<div className="cc-warning"><strong>Spelling Bee preview</strong><span>Easy {spelling.levels[1]} · Medium {spelling.levels[2]} · Hard {spelling.levels[3]} · {spelling.needsReview} need editorial review · {spelling.bundledCount} match bundled words · {spelling.existingCount} conflict with existing CMS IDs.</span></div>:null}{spelling?.errors.length?<div className="cc-inline-error" role="alert"><strong>{spelling.errors.length} validation issues block import.</strong><ul>{spelling.errors.slice(0,10).map(issue=><li key={issue}>{issue}</li>)}</ul></div>:null}<div className="cc-warning"><strong>Safe draft import</strong><span>The upload is validated and saved atomically. It will not change the live game until you use Publish.</span></div>{error?<div className="cc-inline-error" role="alert">{error}</div>:null}</div><footer><button className="cc-button cc-button-secondary" disabled={busy} onClick={onCancel}>Cancel</button><button className="cc-button" disabled={busy||Boolean(spelling?.errors.length)} onClick={onImport}>{busy?'Importing…':`Import ${document.items.length.toLocaleString()} cards`}</button></footer></section></div>
}

function ContentEditor({item,forceNew,canEdit,counts,initialGameId,onClose,onSaved}:{item:ContentItem|null;forceNew:boolean;canEdit:boolean;counts:ContentCategoryCount[];initialGameId:string;onClose:()=>void;onSaved:()=>Promise<void>}){
  const [gameId,setGameId]=useState(item?.game_id??initialGameId)
  const [kind,setKind]=useState<ContentItem['item_kind']>(item?.item_kind??'prompt')
  const [contentFormat,setContentFormat]=useState(String(item?.metadata.content_format??'Short expression'))
  const [difficulty,setDifficulty]=useState(String(item?.metadata.difficulty??'Medium'))
  const [body,setBody]=useState(item?.body??'')
  const [categoryIds,setCategoryIds]=useState<string[]>(item?.categories.map(category=>category.category_id)??[])
  const [optionA,setOptionA]=useState(String(item?.metadata.option_a??''))
  const [optionB,setOptionB]=useState(String(item?.metadata.option_b??''))
  const [definition,setDefinition]=useState(String(item?.metadata.definition??''))
  const [sentence,setSentence]=useState(String(item?.metadata.sentence??''))
  const [variants,setVariants]=useState(Array.isArray(item?.metadata.variants)?item.metadata.variants.join(', '):'')
  const [reviewStatus,setReviewStatus]=useState(String(item?.metadata.review_status??'needs_review'))
  const [note,setNote]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [history,setHistory]=useState<Array<{version:number;status:string;created_at:string;change_note:string|null;body:string}>>([])
  useEffect(()=>{if(!item||forceNew)return;let active=true;void getContentHistory(item.id).then(result=>{if(active)setHistory(result.rows)}).catch(()=>{if(active)setHistory([])});return()=>{active=false}},[item,forceNew])
  const available=counts.filter(row=>row.game_id===gameId)
  const spellingLevel=Number(categoryIds[0]?.replace('level-',''))
  const spellingMetadata={...item?.metadata,definition:definition.trim(),sentence:sentence.trim(),level:spellingLevel,variants:variants.split(',').map(value=>value.trim()).filter(Boolean),review_status:reviewStatus}
  const spellingErrors=gameId==='spelling-bee'?spellingContentErrors({item_kind:'prompt',body,metadata:spellingMetadata,category_ids:categoryIds}):[]
  const save=async()=>{
    if(!canEdit)return
    if(spellingErrors.length){setError(spellingErrors[0]);return}
    setBusy(true);setError('')
    try{
      const existing=item?.metadata??{}
      await saveContentItem({itemId:forceNew?undefined:item?.id,gameId,itemKind:gameId==='spelling-bee'?'prompt':kind,body:gameId!=='spelling-bee'&&kind==='choice'&&optionA&&optionB?`${optionA} OR ${optionB}`:body,metadata:gameId==='spelling-bee'?spellingMetadata:kind==='choice'?{...existing,option_a:optionA,option_b:optionB}:contentMetadataForSave(existing,gameId,contentFormat,difficulty),categoryIds,expectedVersion:forceNew?undefined:item?.current_version,changeNote:note})
      await onSaved()
    }catch{setError('Save failed. Check required fields, categories, permissions, or refresh a stale card.');setBusy(false)}
  }
  return <div className="cc-content-modal" role="dialog" aria-modal="true" aria-labelledby="content-editor-title"><section>
    <header><div><span>{forceNew?'DUPLICATE CARD':item?'EDIT CARD':'NEW CARD'}</span><h2 id="content-editor-title">{item&&!forceNew?'Create a new draft version':'Add managed content'}</h2></div><button className="cc-dialog-close" aria-label="Close editor" onClick={onClose}>×</button></header>
    <div className="cc-content-form">
      <label>Game<select disabled={Boolean(item)||!canEdit} value={gameId} onChange={event=>{setGameId(event.target.value);setCategoryIds([])}}><option value="">Select a game</option>{Object.entries(GAME_NAMES).filter(([id])=>id!=='two-truths-bluff').map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
      {gameId==='spelling-bee'?<>
        <label>Word<input disabled={!canEdit} value={body} maxLength={32} onChange={event=>setBody(event.target.value)}/></label>
        <label>Definition<textarea disabled={!canEdit} value={definition} maxLength={200} onChange={event=>setDefinition(event.target.value)}/></label>
        <label>Example sentence<textarea disabled={!canEdit} value={sentence} maxLength={200} onChange={event=>setSentence(event.target.value)}/></label>
        <label>Level<select disabled={!canEdit} value={categoryIds[0]??''} onChange={event=>setCategoryIds(event.target.value?[event.target.value]:[])}><option value="">Select a level</option>{available.map(category=><option key={category.category_id} value={category.category_id}>{category.label}</option>)}</select></label>
        <label>Accepted variants<input disabled={!canEdit} value={variants} onChange={event=>setVariants(event.target.value)} placeholder="Separate variants with commas"/></label>
        <label>Editorial review<select disabled={!canEdit} value={reviewStatus} onChange={event=>setReviewStatus(event.target.value)}><option value="needs_review">Needs review</option><option value="approved">Approved</option></select></label>
        <small>{spellingAudioId(body)?'Pronunciation audio available.':'Pronunciation audio is missing; this word cannot enter a playable release yet.'}</small>
        {spellingErrors.length?<div className="cc-inline-error" role="status">{spellingErrors[0]}</div>:null}
      </>:<>
        <label>Card type<select disabled={!canEdit} value={kind} onChange={event=>setKind(event.target.value as ContentItem['item_kind'])}><option value="prompt">Prompt</option><option value="challenge">Challenge</option><option value="scenario">Scenario</option><option value="choice">Choice</option></select></label>
        {gameId==='read-my-lips'&&kind!=='choice'?<div className="cc-choice-fields"><label>Prompt type<select disabled={!canEdit} value={contentFormat} onChange={event=>setContentFormat(event.target.value)}><option>Single word</option><option>Two words</option><option>Short expression</option><option>Full phrase</option></select></label><label>Difficulty<select disabled={!canEdit} value={difficulty} onChange={event=>setDifficulty(event.target.value)}><option>Easy</option><option>Medium</option><option>Hard</option></select></label></div>:null}
        {kind==='choice'?<div className="cc-choice-fields"><label>Option A<input disabled={!canEdit} value={optionA} onChange={event=>setOptionA(event.target.value)}/></label><label>Option B<input disabled={!canEdit} value={optionB} onChange={event=>setOptionB(event.target.value)}/></label></div>:<label>Card text<textarea disabled={!canEdit} value={body} maxLength={1000} onChange={event=>setBody(event.target.value)}/><small>{body.length}/1000 characters</small></label>}
        <fieldset><legend>Categories</legend>{available.map(category=><label key={category.category_id}><input type="checkbox" disabled={!canEdit} checked={categoryIds.includes(category.category_id)} onChange={()=>setCategoryIds(current=>current.includes(category.category_id)?current.filter(id=>id!==category.category_id):[...current,category.category_id])}/>{category.category_id} <small>{category.published_count}/{category.target_count}</small></label>)}</fieldset>
      </>}
      {canEdit?<label>Change note<input value={note} maxLength={500} onChange={event=>setNote(event.target.value)} placeholder="What changed and why?"/></label>:null}
      {history.length?<details className="cc-content-history"><summary>Version history ({history.length})</summary>{history.map(version=><article key={version.version}><strong>v{version.version} · {version.status}</strong><span>{new Date(version.created_at).toLocaleString()}</span><p>{version.body}</p>{version.change_note?<small>{version.change_note}</small>:null}</article>)}</details>:null}
      {error?<div className="cc-inline-error" role="alert">{error}</div>:null}
    </div>
    <footer><button className="cc-button cc-button-secondary" onClick={onClose}>Cancel</button>{canEdit?<button className="cc-button" disabled={busy||!gameId||categoryIds.length===0||(gameId!=='spelling-bee'&&kind==='choice'?!optionA.trim()||!optionB.trim():!body.trim())||spellingErrors.length>0} onClick={()=>void save()}>{busy?'Saving…':'Save draft'}</button>:null}</footer>
  </section></div>
}
