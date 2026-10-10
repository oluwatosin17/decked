import { useCallback, useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getStaffAccess, observeStaffSession, requestStaffPasswordReset, restoreStaffSession, signInStaff, signOutStaff, updateStaffPassword, type StaffAccess } from './api'
import { COMMAND_CENTRE_SECTIONS, commandCentrePath, sectionFromPath, type CommandCentreSection } from './model'
import { LoadingState, StatePanel } from './Primitives'
import OverviewPage from './OverviewPage'
import GamesPage from './GamesPage'
import FunnelsPage from './FunnelsPage'
import { MultiplayerPage, ReliabilityPage } from './OperationsPages'
import AuditPage from './AuditPage'
import ContentPage from './ContentPage'
import GeographyPage from './GeographyPage'
import AcquisitionPage from './AcquisitionPage'
import PlayPatternsPage from './PlayPatternsPage'
import './command-centre.css'

type AuthState = 'loading' | 'signed_out' | 'checking' | 'authorized' | 'unauthorized' | 'error'
const LABELS: Record<CommandCentreSection, string> = { overview: 'Overview', acquisition: 'Acquisition', games: 'Games', funnels: 'Funnels', multiplayer: 'Multiplayer', geography: 'Geography', 'play-patterns': 'Play Patterns', reliability: 'Reliability', content: 'Content', settings: 'Settings' }

export default function CommandCentre() {
  const [authState, setAuthState] = useState<AuthState>('loading')
  const [access, setAccess] = useState<StaffAccess | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [section, setSection] = useState(() => sectionFromPath(window.location.pathname))
  const [authError, setAuthError] = useState('')
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false)

  const authorize = useCallback(async (candidate: Session | null) => {
    setSession(candidate)
    if (!candidate) { setAuthState('signed_out'); return }
    setAuthState('checking')
    try {
      const result = await getStaffAccess()
      setAccess(result)
      setAuthState(result.authorized ? 'authorized' : 'unauthorized')
    } catch { setAuthError('We could not verify staff access. Please try again.'); setAuthState('error') }
  }, [])

  useEffect(() => {
    let active = true
    void restoreStaffSession().then(value => { if (active) void authorize(value) })
      .catch(() => { if (active) { setAuthError('Session restoration failed.'); setAuthState('error') } })
    const subscription = observeStaffSession((event, value) => {
      if (!active) return
      if (event === 'PASSWORD_RECOVERY') {
        setSession(value)
        setIsRecoveringPassword(true)
        return
      }
      void authorize(value)
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [authorize])

  useEffect(() => {
    const onPopState = () => setSection(sectionFromPath(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = (next: CommandCentreSection) => {
    window.history.pushState({}, '', commandCentrePath(next)); setSection(next); window.scrollTo({ top: 0 })
  }
  const signOut = async () => { try { await signOutStaff() } finally { setAccess(null); setSession(null); setAuthState('signed_out') } }

  if (isRecoveringPassword) return <AuthFrame><UpdatePassword onComplete={() => { setIsRecoveringPassword(false); void authorize(session) }} /></AuthFrame>
  if (authState === 'loading' || authState === 'checking') return <AuthFrame><LoadingState /></AuthFrame>
  if (authState === 'signed_out') return <AuthFrame><SignIn onSuccess={authorize} /></AuthFrame>
  if (authState === 'unauthorized') return <AuthFrame><StatePanel title="Staff access required" action={<button className="cc-button" onClick={signOut}>Use another account</button>}><p>This signed-in account is not provisioned for the Command Centre.</p></StatePanel></AuthFrame>
  if (authState === 'error') return <AuthFrame><StatePanel title="Access check failed" action={<button className="cc-button" onClick={() => void authorize(session)}>Try again</button>}><p>{authError}</p></StatePanel></AuthFrame>

  return <div className="cc-app">
    <aside className="cc-sidebar"><a className="cc-brand" href="/" aria-label="Decked home">DECKED<span>.</span></a><p>COMMAND CENTRE</p><nav aria-label="Command Centre">{COMMAND_CENTRE_SECTIONS.map(item => <button key={item} className={item === section ? 'active' : ''} aria-current={item === section ? 'page' : undefined} onClick={() => navigate(item)}>{LABELS[item]}</button>)}</nav><div className="cc-account"><span>{access?.authorized ? access.role.toUpperCase() : 'STAFF'}</span><button onClick={signOut}>Sign out</button></div></aside>
    <main className="cc-main">{section === 'overview' ? <OverviewPage /> : section === 'acquisition' ? <AcquisitionPage /> : section === 'games' ? <GamesPage /> : section === 'funnels' ? <FunnelsPage /> : section === 'multiplayer' ? <MultiplayerPage /> : section === 'geography' ? <GeographyPage /> : section === 'play-patterns' ? <PlayPatternsPage /> : section === 'reliability' ? <ReliabilityPage /> : section === 'content' ? <ContentPage role={access?.authorized ? access.role : 'viewer'} /> : <AuditPage isAdmin={access?.authorized === true && access.role === 'admin'} />}</main>
  </div>
}

function AuthFrame({ children }: { children: ReactNode }) { return <main className="cc-auth"><a className="cc-brand" href="/">DECKED<span>.</span></a>{children}</main> }

function SignIn({ onSuccess }: { onSuccess: (session: Session | null) => Promise<void> }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [resetSent, setResetSent] = useState(false)
  const submit = async (event: FormEvent) => { event.preventDefault(); setBusy(true); setError(''); try { await onSuccess(await signInStaff(email, password)) } catch { setError('Sign-in failed. Check your staff credentials.'); setBusy(false) } }
  const requestReset = async () => { if (!email) { setError('Enter your staff email first.'); return } setBusy(true); setError(''); try { await requestStaffPasswordReset(email); setResetSent(true) } catch { setError('We could not send the reset link. Please try again.'); } finally { setBusy(false) } }
  return <form className="cc-signin" onSubmit={submit}><p>INTERNAL ANALYTICS</p><h1>Command Centre</h1><span>Sign in with a provisioned staff account.</span><label>Email<input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required /></label><label>Password<input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required /></label>{error ? <div className="cc-inline-error" role="alert">{error}</div> : null}{resetSent ? <div className="cc-inline-success" role="status">Check your email for a new Decked password-reset link.</div> : null}<button className="cc-button" disabled={busy}>{busy ? 'Please wait…' : 'Sign in'}</button><button className="cc-text-button" type="button" disabled={busy} onClick={() => void requestReset()}>Forgot password?</button></form>
}

function UpdatePassword({ onComplete }: { onComplete: () => void }) {
  const [password, setPassword] = useState(''); const [confirmation, setConfirmation] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('')
    if (password.length < 8) { setError('Use at least 8 characters.'); return }
    if (password !== confirmation) { setError('The passwords do not match.'); return }
    setBusy(true)
    try { await updateStaffPassword(password); onComplete() } catch { setError('We could not update your password. Request a new reset link and try again.'); setBusy(false) }
  }
  return <form className="cc-signin" onSubmit={submit}><p>ACCOUNT RECOVERY</p><h1>Update password</h1><span>Choose a new password for your Decked staff account.</span><label>New password<input type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} minLength={8} required /></label><label>Confirm new password<input type="password" autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} minLength={8} required /></label>{error ? <div className="cc-inline-error" role="alert">{error}</div> : null}<button className="cc-button" disabled={busy}>{busy ? 'Updating…' : 'Update password'}</button></form>
}
