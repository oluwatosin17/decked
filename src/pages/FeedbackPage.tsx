import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import CheckRegular from '@mingcute/react/core-regular/check'
import CloseRegular from '@mingcute/react/core-regular/close'
import DownSmallRegular from '@mingcute/react/core-regular/down-small'
import PicRegular from '@mingcute/react/core-regular/pic'
import Upload2Regular from '@mingcute/react/core-regular/upload-2'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import { GAME_REGISTRY } from '../gameRegistry'
import { FEEDBACK_ISSUES, FEEDBACK_TYPES, submitFeedback, type FeedbackIssue, type FeedbackType } from '../feedback'

const RATINGS = [
  { value: 1, label: 'Very poor' },
  { value: 2, label: 'Poor' },
  { value: 3, label: 'Okay' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Great' },
] as const

const GAMES = [{ id: '', name: 'Not about a specific game' }, ...GAME_REGISTRY]
type Props = { onHome: () => void; onBrowse: () => void; onGuides: () => void; onAbout: () => void }

function DesignDropdown({ value, options, onChange, label }: { value: string; options: ReadonlyArray<{ id: string; name?: string; label?: string }>; onChange: (value: string) => void; label: string }) {
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const current = options.find(option => option.id === value)
  return <details className="feedback-dropdown" ref={detailsRef}>
    <summary aria-label={label}><span>{current?.name ?? current?.label}</span><DownSmallRegular size={20} aria-hidden="true" /></summary>
    <div role="listbox" aria-label={label}>{options.map(option => <button type="button" role="option" aria-selected={option.id === value} key={option.id} onClick={() => { onChange(option.id); detailsRef.current?.removeAttribute('open') }}><span>{option.name ?? option.label}</span>{option.id === value ? <CheckRegular size={17} aria-hidden="true" /> : null}</button>)}</div>
  </details>
}

export default function FeedbackPage(props: Props) {
  const params = useMemo(() => new URLSearchParams(window.location.search), [])
  const messageRef = useRef<HTMLTextAreaElement>(null)
  const [type, setType] = useState<FeedbackType>('idea')
  const [issues, setIssues] = useState<FeedbackIssue[]>([])
  const [gameId, setGameId] = useState(params.get('game') ?? '')
  const [rating, setRating] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [website, setWebsite] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const source = ['header', 'footer', 'game_menu', 'game_complete', 'feedback_page'].includes(params.get('source') ?? '') ? params.get('source') as string : 'feedback_page'
  const playMode = ['pass_and_play', 'play_together'].includes(params.get('mode') ?? '') ? params.get('mode') as string : ''
  const selectedIssueText = issues.length ? `${issues.length} selected` : 'Select all that apply'

  const toggleIssue = (issue: FeedbackIssue) => setIssues(current => current.includes(issue) ? current.filter(item => item !== issue) : [...current, issue])
  const chooseScreenshot = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    event.target.value = ''
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return setError('Please attach a PNG, JPG, or WebP image.')
    if (file.size > 5 * 1024 * 1024) return setError('The screenshot must be smaller than 5 MB.')
    setError('')
    setScreenshot(file)
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (message.trim().length < 3) {
      setError('Please tell us a little more before sending.')
      messageRef.current?.focus()
      return
    }
    setState('sending')
    setError('')
    setNotice('')
    try {
      const result = await submitFeedback({ type, issues, gameId, rating, message, email, source, pagePath: params.get('from') ?? window.location.pathname, playMode, website, screenshot })
      if (screenshot && !result.screenshotAttached) setNotice('Your feedback was sent, but the screenshot could not be attached.')
      setState('sent')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'We could not send your feedback. Please try again.')
      setState('error')
    }
  }

  return <main className="feedback-page">
    <SiteHeader active="feedback" {...props} />
    <article className="feedback-shell screen-enter">
      <header className="guide-hero feedback-hero">
        <p>HELP US MAKE DECKED BETTER</p>
        <h1 className="font-anton">TELL US WHAT YOU THINK</h1>
        <span>Share an idea, report a problem, or tell us what could feel better. Your feedback helps us improve the games for everyone.</span>
      </header>
      {state === 'sent' ? <section className="feedback-success"><strong>THANK YOU</strong><h2>Your feedback is with us.</h2><p>{notice || 'You can get back to the games whenever you’re ready.'}</p><button onClick={props.onBrowse}>BROWSE GAMES</button></section> : <form onSubmit={submit} noValidate>
        <label>What is this about?<DesignDropdown label="What is this about?" value={type} options={FEEDBACK_TYPES} onChange={value => setType(value as FeedbackType)} /></label>
        <fieldset><legend>What happened? <small>Select all that apply</small></legend><details className="feedback-multiselect"><summary><span>{selectedIssueText}</span><DownSmallRegular size={20} aria-hidden="true" /></summary><div>{FEEDBACK_ISSUES.map(item => <label key={item.id}><input type="checkbox" checked={issues.includes(item.id)} onChange={() => toggleIssue(item.id)} /><span className="feedback-check" aria-hidden="true">{issues.includes(item.id) ? <CheckRegular size={15} /> : null}</span><span>{item.label}</span></label>)}</div></details></fieldset>
        <label>Game <small>Optional</small><DesignDropdown label="Game" value={gameId} options={GAMES} onChange={setGameId} /></label>
        <fieldset><legend>How was your experience? <small>Optional</small></legend><div className="feedback-rating" role="radiogroup" aria-label="Experience rating">{RATINGS.map(item => <button type="button" role="radio" aria-checked={rating === item.value} className={rating === item.value ? 'selected' : ''} onClick={() => setRating(item.value)} key={item.value}>{item.label}</button>)}</div></fieldset>
        <label>Tell us more <small>Required</small><textarea ref={messageRef} required minLength={3} maxLength={2000} value={message} onChange={event => { setMessage(event.target.value); if (error) setError('') }} placeholder="What happened? What did you expect, and what would make it better?" /><small>{message.length}/2000</small></label>
        <fieldset><legend>Attach a screenshot <small>Optional · PNG, JPG or WebP · max 5 MB</small></legend>{screenshot ? <div className="feedback-file"><PicRegular size={22} aria-hidden="true" /><span><strong>{screenshot.name}</strong><small>{(screenshot.size / 1024 / 1024).toFixed(1)} MB</small></span><button type="button" aria-label="Remove screenshot" onClick={() => setScreenshot(null)}><CloseRegular size={19} /></button></div> : <label className="feedback-upload"><Upload2Regular size={22} aria-hidden="true" /><span><strong>Choose a screenshot</strong><small>This can help us understand visual or gameplay issues.</small></span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseScreenshot} /></label>}</fieldset>
        <label>Email <em>Optional — only if you want a reply</em><input type="email" maxLength={254} value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /></label>
        <label className="feedback-honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={website} onChange={event => setWebsite(event.target.value)} /></label>
        {error ? <p className="feedback-error" role="alert">{error}</p> : null}
        <button type="submit" className="feedback-submit" disabled={state === 'sending'}>{state === 'sending' ? 'SENDING…' : 'SEND FEEDBACK'}</button>
        <p className="feedback-privacy">Please do not include passwords, room codes, private answers, or other sensitive information.</p>
      </form>}
    </article>
    <SiteFooter onGuides={props.onGuides} />
  </main>
}
