# Multiplayer and Reliability

The Multiplayer report reads durable, content-free room and multiplayer-session facts. It includes creation, joins, lobby conversion, elapsed-time medians, peak room-size distribution, completion, disconnects, handoffs, Realtime failures, and rematches. Join failures are grouped only by the approved normalized reason.

Room timelines are intentionally redacted. The technical design does not approve exposing room-level histories, and aggregate facts answer the MVP operational questions without returning room codes, participant identities, or privacy-safe room references that could still enable linkage.

The Reliability report groups frontend, RPC, and failed Realtime events using approved stable fingerprints, RPC names/error codes, classes, channel types, and statuses. It returns occurrence counts, affected-session counts, and first/last timestamps. It never returns stack frames, messages, tokens, content, or raw IDs.

Device is joined from the session's `app_opened` event. Browser is available only when a frontend error reports it, so browser filtering disables error-free-session metrics rather than presenting a misleading denominator. `app_version` is the approved release marker.

Both RPCs enforce `decked_is_command_centre_staff('viewer')`. Rollback drops `decked_command_centre_multiplayer_v2` and `decked_command_centre_reliability_v2`; gameplay tables and policies are unchanged.

Privacy/redaction notices, partial-coverage warnings, and freshness status remain visible for successful zero-data responses. Reliability browser and release filters are URL-persisted; a browser-filtered report deliberately returns null error-free-session metrics because browser is not available on every qualifying session.
