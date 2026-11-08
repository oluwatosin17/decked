# Read My Lips media follow-up — 30 October 2026 (Lagos)

## Reported problem and intended mechanics

The speaker could see their own camera, but the other phone could not see the speaker and the speaker could not hear the guesser. The intended flow is: speaker mouths the prompt without sending voice; the active guesser watches the speaker, hears optional headphone music, and speaks guesses; the speaker hears those guesses and scores them. Spectators do not receive the video stream.

## Changes

- WebRTC signaling now starts only after the active speaker and guesser have enabled their local camera or microphone. This prevents a peer connection from being negotiated without its media track.
- The offer path now prevents duplicate simultaneous offers, retains early ICE candidates, and uses both Cloudflare and Google public STUN servers.
- Incoming audio is attached even when a browser omits `event.streams[0]`. The speaker gets a clear audio status and a tap-to-play control for phones that block autoplay.
- The guesser can start and stop an original instrumental loop generated locally with Web Audio. No music service or media file is used. The speaker's microphone remains off; the guesser's microphone uses echo cancellation and noise suppression.
- Spectators see an explanation instead of an empty video frame. Failed connections show a Retry Video action and network guidance.

## Verification

Typecheck and 33 focused tests passed. A four-player game on the local build and another on the deployed site both reached the final 1–1 result. In mobile-sized Chrome contexts with fake camera and microphone devices, the active guesser's video element reached `readyState 4` with a video track; the speaker's audio element reached `readyState 4`, had one audio track, and was playing. The headphone-music control started and stopped. No JavaScript or RPC errors appeared in the live run. Deployed Cloudflare version: `caf4c995-e767-4e47-b96b-c2a744aae23b`.

## Free-only constraint and remaining limit

No TURN relay was deployed or used. A TURN key created during investigation was deleted before any credential was issued; Cloudflare's TURN key list then showed zero keys. Cloudflare's STUN service is free, but direct peer connections can still fail between some networks. Cloudflare TURN would be free for the first 1,000 GB shared Realtime egress each month and billable afterward at $0.05/GB, so it was excluded under the user's free-only requirement. The live Chrome run uses isolated contexts on one machine and does not verify two physical phones on separate networks. A real-device check is still required to confirm the reported failure is resolved on the user's devices.
