# Command Centre privacy, security, and retention

## Data inventory

| Store | Data | Identifiers | Browser access | Retention |
|---|---|---|---|---|
| `analytics_events` | Validated navigation, gameplay, multiplayer, and reliability facts | Browser analytics/session UUIDs; trusted Supabase user UUID | Write-only through bounded ingestion RPC; no table reads | 13 months proposed; owner approval and scheduled deletion remain required |
| `analytics_game_sessions` | Lifecycle timestamps, counts, game/mode dimensions | Game-session UUID; optional analytics UUID; opaque room reference | None | 13 months proposed with raw facts |
| `analytics_room_facts` | Durable room counts and lifecycle timestamps | Opaque analytics room reference | None | 13 months proposed; operational room codes and names are never copied |
| `analytics_room_links` | Temporary operational-room to opaque-reference mapping | Operational room UUID and opaque room UUID | None | Deleted when the room ends; stale rows require operational cleanup |
| Daily/funnel/session-health aggregates | Content-free metric totals and restricted distinct-identity membership | Analytics or session UUID only where distinct counting requires it | Staff aggregate RPCs only; identity-bearing rows are never returned | Aggregate totals indefinite pending approval; identity-bearing helper rows 13 months proposed |
| `analytics_user_first_seen` | First observed UTC date | Analytics UUID | None | Delete with the analytics identity; otherwise 13 months after last activity proposed |
| `analytics_ingest_rate_limits` | Rolling ingestion count | Supabase user UUID | None | Delete after 24 hours of inactivity |
| `command_centre_staff` | Explicit admin/viewer assignment | Supabase staff user UUID | Access-check RPC only | Account lifetime plus 90 days after removal, subject to employment/security policy |
| `command_centre_audit_log` | Staff access, exports, role changes, and deletion evidence | Staff UUID internally; hashed label in viewer | Admin-only redacted RPC | 25 months |

No analytics store may contain display names, public room codes, prompt/question text, player answers, custom-card content, email addresses, phone numbers, passwords, access tokens, or service-role credentials. Coarse acquisition and reliability dimensions are stable allowlisted labels, not arbitrary text.

## Trust boundaries

- Vite bundles only `VITE_` configuration. The Supabase publishable key is public by design; a service-role or secret key must never use a `VITE_` name.
- Browser roles have no direct table privileges on analytics, aggregates, staff authorization, rate limits, or audit records. RLS is enabled without browser policies.
- Anonymous-auth players may call only the bounded ingestion RPC. Staff read/export RPCs recheck active, non-anonymous staff membership inside fixed-`search_path` security-definer functions.
- Viewer accounts cannot assign roles, access audit rows, or run identity deletion. Administrator mutations use audited RPCs and request-ID deduplication.
- Operational room codes, display names, secrets, and player content stay in gameplay tables and are not copied into durable analytics facts.

## Analytics identity deletion

Use a non-production verification first, then execute as an active Command Centre administrator:

```sql
select public.decked_delete_analytics_identity(
  '00000000-0000-4000-8000-000000000000'::uuid,
  true,
  gen_random_uuid()
);
```

Review the returned counts and affected UTC range. Preserve one request UUID, obtain the required privacy approval, then rerun with `p_dry_run = false`. The procedure deletes directly linked raw events, game sessions, daily active rows, first-seen state, and session-health rows. It records only a hashed identity reference and deletion counts in the audit log.

Content-free aggregates and funnel totals contain no recoverable identity, but their historical counts can still include the deleted installation. Rebuild the returned affected range in chunks of at most 32 UTC days with `decked_refresh_analytics_aggregates`, then run `decked_reconcile_analytics_day` for each affected day. If strict statistical erasure is not required, document why aggregates were retained.

The procedure does not delete the Supabase Auth user or gameplay records. A request concerning an authenticated account requires a separate approved Auth/gameplay deletion workflow keyed by the Supabase user UUID.

## Verification

Run against a disposable, fully migrated database:

```sh
supabase db reset
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/command_centre_security_hardening.sql
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm security:bundle
```

The SQL suite attempts horizontal and vertical escalation with anonymous, viewer, and administrator identities. It verifies RLS and grants, self-assignment denial, admin-RPC denial, unsafe event rejection, dry-run behavior, deletion, and audit redaction.

## Rollback and incident response

To disable the new deletion capability immediately, revoke execute on `decked_delete_analytics_identity(uuid,boolean,uuid)` from `authenticated`. To roll back event hardening, remove `analytics_events_validate_insert`, restore the prior `decked_analytics_properties_are_safe` definition, and retain existing data for investigation. Do not restore permissive validation during an active ingestion incident.

Deletion is irreversible without a verified backup. A rollback migration must never re-create deleted identity rows from ordinary application logs. If a service-role credential is ever found in a browser artifact, rotate it immediately, invalidate affected sessions where applicable, preserve the artifact hash, and review database audit logs before redeploying.

## Remaining risks

- **Medium:** Retention periods beyond raw events and audit logs still require legal/product approval and a scheduled, monitored cleanup job.
- **Medium:** Browser analytics identities are client-generated and can be reset or fabricated; they are suitable for product measurement, not identity proof.
- **Low:** Aggregate totals can retain the statistical contribution of a deleted identity until the affected dates are rebuilt.
- **Low:** Publishable Supabase keys and user access tokens necessarily appear in browser traffic; authorization therefore depends on RLS and RPC checks, not key secrecy.
