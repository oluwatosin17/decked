# Command Centre acquisition report

The staff-only `/command-centre/acquisition` report attributes an analytics session from its earliest `app_opened` event. An allowlisted `utm_source` takes precedence over `referrer_domain`; when neither is available, the session is reported as Direct.

Sources are normalized to ChatGPT, Google, Bing, Other AI, named social channels, Other social, Shared link, Other referral, Direct, or a sanitized campaign source. Conversion joins remain inside Supabase and connect the attributed session to privacy-safe game identifiers for selection, start, first-card, and completion counts.

The report never returns analytics identity values, full URLs, query strings, ChatGPT conversation text, card text, answers, room codes, or IP addresses. Country filtering uses the existing server-attached two-letter country code. Referrer suppression can cause AI, social, and shared-link sessions to appear as Direct.

## Rollback

Roll the frontend back to the preceding Vercel production deployment, then apply a new forward migration that revokes and drops `decked_command_centre_acquisition(text,date,date,text,text,text,text,text)` and `decked_acquisition_source(text,text)`. Do not edit an already-applied migration.
