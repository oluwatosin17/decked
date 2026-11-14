import { useCallback, useEffect, useRef, useState } from 'react'
import { GameNav, GameFooter } from './components/GameShell'
import { TimerControl } from './CharadesGame'
import './read-my-lips.css'
import { supabase } from './multiplayer/supabase'
import type { MultiplayerPlayer, MultiplayerRoom } from './multiplayer/types'
import { canReviewLipsTurn, lipsReviewerTeam, type LipsTurnDecision } from './readMyLipsScoring'
import { lipsTurnRoles } from './readMyLipsTeams'
import { startHeadphoneMusic } from './readMyLipsMusic'
import { acceptCurrentMediaStream } from './multiplayer/mediaLifecycle'

type Signal = { from: string; to: string; turn: number; kind: 'hello' | 'offer' | 'answer' | 'candidate'; sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit }
const directIceServers: RTCIceServer[] = [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }]

function useLipsVideo(roomId: string, turn: number, role: 'speaker' | 'guesser' | 'spectator', myId: string, speakerId: string, memberKey: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState('')
  const [connected, setConnected] = useState(false)
  const [connectionIssue, setConnectionIssue] = useState(false)
  const [audioReady, setAudioReady] = useState(false)
  const [retryToken, setRetryToken] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaGenerationRef = useRef(0)
  const mediaRequestRef = useRef(false)
  const localReady = !!localStream
  const enable = useCallback(async () => {
    if (role === 'spectator' || streamRef.current || mediaRequestRef.current) return
    const generation = mediaGenerationRef.current
    mediaRequestRef.current = true
    try {
      const stream = await navigator.mediaDevices.getUserMedia(role === 'speaker' ? { video: { facingMode: 'user' }, audio: false } : { video: false, audio: { echoCancellation: true, noiseSuppression: true } })
      if (!acceptCurrentMediaStream(stream, generation, mediaGenerationRef.current)) return
      streamRef.current = stream
      setLocalStream(stream)
      setError('')
    } catch { if (generation === mediaGenerationRef.current) setError(role === 'speaker' ? 'Camera access is needed to show your lips.' : 'Microphone access lets your teammate hear your guesses.') }
    finally { if (generation === mediaGenerationRef.current) mediaRequestRef.current = false }
  }, [role])
  useEffect(() => {
    setLocalStream(null)
    setRemoteStream(null)
    setConnected(false)
    setConnectionIssue(false)
    setAudioReady(false)
    return () => {
      mediaGenerationRef.current += 1
      mediaRequestRef.current = false
      streamRef.current?.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }, [turn, role])
  useEffect(() => {
    const members = memberKey ? memberKey.split(',') : []
    if (!roomId || !myId || !members.length || role === 'spectator' || !localStream) return
    let disposed = false
    const peers = new Map<string, RTCPeerConnection>()
    const pendingCandidates = new Map<string, RTCIceCandidateInit[]>()
    const peerStartedAt = new Map<string, number>()
    const offering = new Set<string>()
    const channel = supabase.channel(`decked-lips-video:${roomId}:${turn}`)
    const send = (to: string, kind: Signal['kind'], extras: Partial<Signal> = {}) => channel.send({ type: 'broadcast', event: 'signal', payload: { from: myId, to, turn, kind, ...extras } satisfies Signal })
    const createPeer = (other: string) => {
      const existing = peers.get(other)
      if (existing) return existing
      const peer = new RTCPeerConnection({ iceServers: directIceServers })
      peers.set(other, peer)
      peerStartedAt.set(other, Date.now())
      if (localStream && (role === 'speaker' || (role === 'guesser' && other === speakerId))) localStream.getTracks().forEach(track => peer.addTrack(track, localStream))
      if (role === 'speaker') peer.addTransceiver('audio', { direction: 'recvonly' })
      if (role === 'guesser') peer.addTransceiver('video', { direction: 'recvonly' })
      peer.onicecandidate = event => { if (event.candidate) void send(other, 'candidate', { candidate: event.candidate.toJSON() }) }
      peer.ontrack = event => {
        if (disposed) return
        const stream = event.streams[0] ?? new MediaStream([event.track])
        if (other === speakerId && role !== 'speaker' && event.track.kind === 'video') setRemoteStream(stream)
        if (role === 'speaker' && event.track.kind === 'audio') setRemoteStream(stream)
      }
      peer.onconnectionstatechange = () => { if (!disposed) { const isConnected = [...peers.values()].some(item => item.connectionState === 'connected'); setConnected(isConnected); if (isConnected) setConnectionIssue(false) } }
      return peer
    }
    const applyRemoteDescription = async (other: string, peer: RTCPeerConnection, description: RTCSessionDescriptionInit) => {
      await peer.setRemoteDescription(description)
      const queued = pendingCandidates.get(other) ?? []
      pendingCandidates.delete(other)
      for (const candidate of queued) {
        try { await peer.addIceCandidate(candidate) } catch { /* A stale candidate must not stop session negotiation. */ }
      }
    }
    const offer = async (other: string) => {
      const peer = createPeer(other)
      if (peer.signalingState !== 'stable' || offering.has(other)) return
      offering.add(other)
      try { const description = await peer.createOffer(); await peer.setLocalDescription(description); await send(other, 'offer', { sdp: description }) } catch { /* A later hello retries negotiation. */ }
      finally { offering.delete(other) }
    }
    channel.on('broadcast', { event: 'signal' }, async ({ payload }) => {
      const signal = payload as Signal
      if (disposed || signal.to !== myId || signal.from === myId || signal.turn !== turn || !members.includes(signal.from)) return
      if (signal.kind === 'hello') { if (myId < signal.from && localStream) void offer(signal.from); return }
      const peer = createPeer(signal.from)
      try {
        if (signal.kind === 'offer' && signal.sdp) { await applyRemoteDescription(signal.from, peer, signal.sdp); const answer = await peer.createAnswer(); await peer.setLocalDescription(answer); await send(signal.from, 'answer', { sdp: answer }) }
        else if (signal.kind === 'answer' && signal.sdp && peer.signalingState === 'have-local-offer') await applyRemoteDescription(signal.from, peer, signal.sdp)
        else if (signal.kind === 'candidate' && signal.candidate) {
          if (peer.remoteDescription) await peer.addIceCandidate(signal.candidate)
          else pendingCandidates.set(signal.from, [...(pendingCandidates.get(signal.from) ?? []), signal.candidate])
        }
      } catch { /* Connection may be replaced during a role change. */ }
    }).subscribe(status => { if (status === 'SUBSCRIBED') members.filter(id => id !== myId).forEach(id => { void send(id, 'hello'); if (myId < id && localStream) void offer(id) }) })
    const announce = window.setInterval(() => members.filter(id => id !== myId).forEach(id => {
      const peer = peers.get(id)
      const stalled = !!peer && peer.connectionState !== 'connected' && Date.now() - (peerStartedAt.get(id) ?? Date.now()) > 12000
      if (stalled || peer?.connectionState === 'failed') setConnectionIssue(true)
      if (!peer || peer.connectionState === 'failed' || stalled) {
        peer?.close()
        peers.delete(id)
        peerStartedAt.delete(id)
        pendingCandidates.delete(id)
        void send(id, 'hello')
        if (myId < id && localStream) void offer(id)
      }
    }), 4000)
    return () => { disposed = true; window.clearInterval(announce); peers.forEach(peer => peer.close()); peers.clear(); pendingCandidates.clear(); peerStartedAt.clear(); void supabase.removeChannel(channel) }
  }, [roomId, turn, myId, memberKey, localStream, role, speakerId, retryToken])
  useEffect(() => { const element = videoRef.current; if (element) element.srcObject = role === 'speaker' ? localStream : remoteStream; return () => { if (element) element.srcObject = null } }, [localStream, remoteStream, role])
  useEffect(() => {
    const element = audioRef.current
    if (!element) return
    element.srcObject = role === 'speaker' ? remoteStream : null
    setAudioReady(false)
    let active = true
    if (role === 'speaker' && remoteStream) void element.play().then(() => { if (active) setAudioReady(true) }).catch(() => { if (active) setAudioReady(false) })
    return () => { active = false; element.srcObject = null }
  }, [remoteStream, role])
  const hearGuesses = async () => {
    const element = audioRef.current
    if (!element || !remoteStream) return
    try { await element.play(); setAudioReady(true); setError('') }
    catch { setAudioReady(false); setError('Tap again to hear guesses. Check your phone volume and audio output.') }
  }
  return { enable, localReady, connected, connectionIssue, audioReady, hasGuesserAudio: role === 'speaker' && !!remoteStream, hearGuesses, retry: () => { setConnectionIssue(false); setRetryToken(value => value + 1) }, error, videoRef, audioRef }
}

export default function ReadMyLipsMultiplayerGame({ room, players, currentUserId, onClose }: { room: MultiplayerRoom; players: MultiplayerPlayer[]; currentUserId: string; onClose: () => void }) {
  const state = room.game_state.session ?? {}
  const turn = Number(state.lips_turn ?? 0)
  const teamCount = Number(state.lips_team_count ?? 2)
  const card = Number(state.lips_card ?? 0)
  const phase = String(state.lips_phase ?? 'ready')
  const score = Array.isArray(state.lips_scores) ? state.lips_scores.map(Number) : Array(teamCount).fill(0)
  const roundSeconds = Number(state.lips_round_seconds ?? 60)
  const roundsPerTeam = Number(state.lips_rounds_per_team ?? 4)
  const totalTurns = teamCount * roundsPerTeam
  const turnDecisionCount = Number(state.lips_turn_decision_count ?? 0)
  const teamNames = Array.isArray(state.lips_team_names) ? state.lips_team_names : []
  const teamName = (index: number) => String(teamNames[index] ?? '').trim() || `Team ${index + 1}`
  const { speakerIndex: speakerPosition, guesserIndex: guesserPosition } = lipsTurnRoles(turn, teamCount)
  const playerIds = Array.isArray(state.lips_player_ids) ? state.lips_player_ids.map(String) : []
  const ordered = playerIds.length ? playerIds.map(id => players.find(player => player.user_id === id)).filter((player): player is MultiplayerPlayer => !!player) : [...players].sort((a, b) => a.position - b.position)
  const speaker = ordered[speakerPosition]
  const guesser = ordered[guesserPosition]
  const role = currentUserId === speaker?.user_id ? 'speaker' : currentUserId === guesser?.user_id ? 'guesser' : 'spectator'
  const reviewerTeam = lipsReviewerTeam(turn, teamCount)
  const canReview = canReviewLipsTurn({ currentUserId, playerIds, turn, teamCount })
  const [phrase, setPhrase] = useState<string | null>(null)
  const [turnHistory, setTurnHistory] = useState<LipsTurnDecision[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [musicPlaying, setMusicPlaying] = useState(false)
  const musicStopRef = useRef<(() => void) | null>(null)
  const [now, setNow] = useState(Date.now())
  const endRequested = useRef('')
  const deadline = state.lips_deadline ? Date.parse(String(state.lips_deadline)) : 0
  const remaining = Math.max(0, Math.ceil((deadline - now) / 1000))
  const reviewedPoints = Math.max(0, Number(score[turn % teamCount] ?? 0) - Number(state.lips_turn_start_score ?? 0))
  const memberKey = [speaker?.user_id, guesser?.user_id].filter((id): id is string => !!id).join(',')
  const video = useLipsVideo(room.id, turn, role, currentUserId, speaker?.user_id ?? '', memberKey)
  const stopMusic = useCallback(() => { musicStopRef.current?.(); musicStopRef.current = null; setMusicPlaying(false) }, [])
  useEffect(() => stopMusic, [turn, role, stopMusic])
  useEffect(() => { if (phase === 'between' || phase === 'done') stopMusic() }, [phase, stopMusic])
  const toggleMusic = () => {
    if (musicPlaying) { stopMusic(); return }
    try { musicStopRef.current = startHeadphoneMusic(); setMusicPlaying(true) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not play headphone music.') }
  }
  useEffect(() => { setPhrase(null); if (role !== 'speaker' || phase !== 'playing') return; let active = true; void supabase.rpc('decked_get_lips_prompt', { p_room_id: room.id }).then(({ data, error }) => { if (active && !error) setPhrase(data?.phrase ?? null) }); return () => { active = false } }, [room.id, room.version, role, phase, card])
  useEffect(() => {
    if (phase !== 'between' && phase !== 'done') { setTurnHistory(null); return }
    let active = true
    void supabase.rpc('decked_get_lips_turn_review', { p_room_id: room.id }).then(({ data, error }) => {
      if (!active) return
      if (error || !Array.isArray(data)) { setError('Turn review could not load. Refresh the page and try again.'); return }
      setTurnHistory(data.map(item => ({ phrase: String(item.phrase ?? ''), correct: Boolean(item.correct) })))
    })
    return () => { active = false }
  }, [room.id, room.version, phase, turn])
  useEffect(() => { if (phase !== 'playing') return; const tick = window.setInterval(() => setNow(Date.now()), 250); return () => window.clearInterval(tick) }, [phase])
  const action = useCallback(async (name: 'begin' | 'correct' | 'skip' | 'undo' | 'end' | 'next' | 'toggle_review', reviewIndex?: number) => {
    if (busy) return
    setBusy(true)
    setError('')
    const request = (expectedCard: number) => supabase.rpc('decked_lips_action', { p_room_id: room.id, p_action: name, p_expected_turn: turn, p_expected_card: expectedCard, p_review_index: reviewIndex ?? null })
    let expectedCard = card
    if (name === 'end') {
      const latest = await supabase.from('decked_rooms').select('game_state').eq('id', room.id).single()
      if (latest.error) { setError(latest.error.message); setBusy(false); return }
      const live = latest.data.game_state?.session ?? {}
      if (Number(live.lips_turn) !== turn || live.lips_phase !== 'playing') { setBusy(false); return }
      expectedCard = Number(live.lips_card)
    }
    let { error: actionError } = await request(expectedCard)
    if (name === 'end' && actionError && (actionError.message.includes('Game moved forward') || actionError.message.includes('The turn is not running'))) {
      const latest = await supabase.from('decked_rooms').select('game_state').eq('id', room.id).single()
      if (latest.error) actionError = latest.error
      else {
        const live = latest.data.game_state?.session ?? {}
        if (Number(live.lips_turn) === turn && live.lips_phase === 'playing') {
          const retried = await request(Number(live.lips_card))
          actionError = retried.error
        } else if (live.lips_phase === 'between' || live.lips_phase === 'done' || Number(live.lips_turn) > turn) actionError = null
      }
    }
    if (actionError) setError(actionError.message)
    setBusy(false)
  }, [busy, card, room.id, turn])
  useEffect(() => {
    const key = `${turn}:${deadline}`
    const shouldEnd = role === 'speaker' || (role === 'guesser' && now >= deadline + 5000)
    if (phase === 'playing' && deadline && remaining === 0 && shouldEnd && !busy && endRequested.current !== key) {
      endRequested.current = key
      void action('end')
    }
  }, [phase, deadline, remaining, busy, turn, role, now, action])
  return <div className="game-fullscreen rml-game"><GameNav onBack={onClose} gameId="read-my-lips" /><main className="rml-main"><section className="rml-shell">
    <p className="rml-kicker">{phase === 'done' ? 'FINAL SCORE' : `TURN ${turn + 1} / ${totalTurns}`}</p>
    <h1>{phase === 'done' ? score.filter(value => value === Math.max(...score)).length > 1 ? "IT'S A TIE" : `${teamName(score.indexOf(Math.max(...score))).toUpperCase()} WINS` : 'READ MY LIPS'}</h1>
    {['ready','result','between','done'].includes(phase) && <div className="rml-scoreboard" data-teams={teamCount}>{score.map((value, index) => <div key={index}><span>{teamName(index)}</span><b>{value}</b></div>)}</div>}
    {phase === 'done' ? <><img className="rml-trophy" src="/icons/trophy.svg" alt=""/>{state.lips_exhausted && <p className="rml-copy" role="status">No unused phrases remain, so this game ended early.</p>}</> : <>
      <h2>{speaker?.display_name} MOUTHS</h2><p className="rml-copy">{guesser?.display_name} guesses · You are {role}.</p>
      {role !== 'spectator' && !video.localReady && <button className="rml-primary" onClick={() => void video.enable()}>{role === 'speaker' ? 'ENABLE CAMERA' : 'ENABLE MICROPHONE'}</button>}
      {video.error && <p role="alert" className="rml-copy">{video.error}</p>}
      {role === 'spectator' ? <p className="rml-copy">You’re watching this turn. Only the active guesser receives the speaker’s video.</p> : <video className="rml-video" ref={video.videoRef} autoPlay playsInline muted style={{ transform: role === 'speaker' ? 'scaleX(-1)' : undefined }} />}
      <audio ref={video.audioRef} autoPlay />{role === 'speaker' && <><p className="rml-copy">{video.hasGuesserAudio ? video.audioReady ? 'You can hear the guesser.' : 'Tap below to hear the guesser.' : 'Waiting for the guesser’s microphone.'}</p><button className="rml-secondary" disabled={!video.hasGuesserAudio} onClick={() => void video.hearGuesses()}>{video.audioReady ? 'PLAY GUESSES AUDIO' : 'TAP TO HEAR GUESSES'}</button></>}
      {role === 'guesser' && <><p className="rml-copy">Wear headphones. Watch the speaker’s lips; their voice is never sent to you.</p><button className="rml-secondary" type="button" onClick={toggleMusic}>{musicPlaying ? 'STOP HEADPHONE MUSIC' : 'PLAY HEADPHONE MUSIC'}</button></>}
      {role !== 'spectator' && !video.connected && phase === 'playing' && <p className="rml-copy">Connecting video…</p>}
      {role !== 'spectator' && video.connectionIssue && !video.connected && phase === 'playing' && <><p className="rml-copy" role="alert">The connection is taking longer than expected. Check camera and microphone access, then try the same Wi-Fi or another network.</p><button className="rml-secondary" type="button" onClick={video.retry}>RETRY VIDEO</button></>}
      {phase === 'ready' && (role === 'speaker' ? <button className="rml-primary" disabled={!video.localReady || busy} onClick={() => void action('begin')}>START TURN</button> : <p className="rml-copy">Waiting for {speaker?.display_name}.</p>)}
      {phase === 'playing' && <><TimerControl timeLeft={remaining} roundLength={roundSeconds} paused={false} onTogglePause={() => {}} onCancel={() => {}} showControls={false}/>{role === 'speaker' ? <><article className="rml-prompt-card" aria-label="Private phrase for speaker"><span>MOUTH THIS PHRASE</span><p>{phrase ?? 'Loading…'}</p><b>DECKED</b></article><div className="rml-actions" aria-label="Score this phrase"><button className="rml-secondary" disabled={!phrase || busy || remaining === 0} onClick={() => void action('skip')}>SKIP</button><button className="rml-primary" disabled={!phrase || busy || remaining === 0} onClick={() => void action('correct')}>CORRECT +1</button></div><button className="rml-undo" type="button" disabled={busy || turnDecisionCount <= 0} onClick={() => void action('undo')}>UNDO LAST</button><button className="rml-secondary rml-end-turn" type="button" disabled={busy} onClick={() => void action('end')}>END TURN</button></> : <p className="rml-copy">{speaker?.display_name} is scoring each prompt.</p>}</>}
      {phase === 'between' && <><h2>TURN COMPLETE</h2><p className="rml-copy">{teamName(reviewerTeam)} reviews {teamName(turn % teamCount)}’s turn before the score is confirmed.</p><div className="rml-score-adjust" aria-label={`${reviewedPoints} points scored`}><strong>{reviewedPoints}</strong></div>{turnHistory === null ? <p className="rml-copy">Loading turn review…</p> : turnHistory.length ? <div className="rml-turn-review" aria-label={`${teamName(turn % teamCount)} turn review`}>{turnHistory.map((decision, index) => <div key={`${index}-${decision.phrase}`}><span>{decision.phrase}</span><button type="button" disabled={!canReview || busy} className={decision.correct ? 'is-correct' : 'is-skipped'} onClick={() => void action('toggle_review', index)}>{decision.correct ? 'CORRECT +1' : 'SKIPPED'}</button></div>)}</div> : <p className="rml-copy">No prompts were marked this turn.</p>}{canReview ? <button className="rml-primary" disabled={busy || turnHistory === null} onClick={() => void action('next')}>{turn >= totalTurns - 1 ? 'CONFIRM SCORE & RESULTS' : 'CONFIRM SCORE & NEXT TURN'}</button> : <p className="rml-copy">Waiting for {teamName(reviewerTeam)} to confirm.</p>}</>}
    </>}
    {error && <p role="alert" className="rml-copy">{error}</p>}
  </section></main><GameFooter /></div>
}
