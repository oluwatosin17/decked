import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'
import type { ReactNode } from 'react'

type LegalKind = 'privacy' | 'terms' | 'cookies'

interface Props {
  kind: LegalKind
  onHome: () => void
  onBrowse: () => void
  onGuides: () => void
  onAbout: () => void
}

const updated = '10 October 2026'

export default function LegalPage({ kind, onHome, onBrowse, onGuides, onAbout }: Props) {
  return (
    <main className="legal-page">
      <SiteHeader onHome={onHome} onBrowse={onBrowse} onGuides={onGuides} onAbout={onAbout} />
      <article className="guide-shell legal-document screen-enter">
        {kind === 'privacy' ? <PrivacyPolicy /> : kind === 'terms' ? <Terms /> : <CookiePolicy />}
      </article>
      <SiteFooter onGuides={onGuides} />
    </main>
  )
}

function Intro({ title, children }: { title: string; children: ReactNode }) {
  return <header className="legal-intro"><h1 className="font-anton">{title}</h1><p>{children}</p><span>Last updated: {updated}</span></header>
}

function PrivacyPolicy() {
  return <>
    <Intro title="Privacy Policy">This policy explains what Decked collects, why we use it, where it is stored, and the choices available to you.</Intro>
    <section><h2>Who is responsible for your data</h2><p>Decked is the controller of personal data described in this policy. Questions and privacy requests can be sent to <a href="mailto:hello@usedecked.com">hello@usedecked.com</a>.</p></section>
    <section><h2>Information we process</h2><ul>
      <li><strong>On-device game data.</strong> Player names, game settings, progress, custom cards, and sound preferences may be saved in your browser so a local game can work or resume. This information normally stays on your device.</li>
      <li><strong>Play Together data.</strong> If you create or join a multiplayer room, we process the display name you choose, an anonymous account identifier, room membership, game choices, votes or permitted game responses, connection status, and room activity.</li>
      <li><strong>Usage and diagnostics.</strong> When analytics is enabled, we process random identifiers, pages and games viewed, game setup and completion events, coarse device class, performance measurements, referring domain and campaign parameters, error categories, and multiplayer lifecycle events. Decked analytics is designed not to collect display names, room codes, custom-card text, prompt text, free-form answers, email addresses, or precise location.</li>
      <li><strong>Messages.</strong> If you email us, we receive your email address and the contents of your message.</li>
      <li><strong>Technical records.</strong> Hosting and infrastructure providers may process IP addresses, request metadata, timestamps, and security logs when delivering and protecting the service.</li>
    </ul></section>
    <section><h2>Why we use this information</h2><p>We use data to provide and synchronise games, remember requested settings, maintain room security, answer messages, diagnose faults, measure whether features work, prevent abuse, and comply with legal obligations. Our legal bases, where required, are performance of the service you request, our legitimate interests in operating and improving Decked, consent where the law requires it, and compliance with law. We do not sell personal data or use it for targeted advertising.</p></section>
    <section><h2>Sharing and international processing</h2><p>We use trusted service providers to host and operate Decked, including our hosting, database, multiplayer, and email services. Some providers may process information outside your country. Where required, we use appropriate safeguards to protect that information.</p></section>
    <section><h2>How long we keep data</h2><p>Local game data remains in your browser until it is replaced or you clear site data. Multiplayer rooms are designed to expire after 24 hours and may end earlier when the host closes them. Analytics event records are intended to be retained for no more than 13 months, while de-identified aggregate statistics may be retained longer. Support messages and necessary security records are kept only for as long as reasonably needed for their purpose, legal obligations, or disputes.</p></section>
    <section><h2>Your choices and rights</h2><p>Depending on your location, you may ask for access, correction, deletion, restriction, portability, or an explanation of how your data is used; object to certain processing; or withdraw consent. You may clear Decked’s browser storage through your browser settings. Send requests to <a href="mailto:hello@usedecked.com">hello@usedecked.com</a>. We may need to verify a request. You may also complain to the Nigeria Data Protection Commission or your local data protection authority.</p></section>
    <section><h2>Children</h2><p>Decked is a general-audience service and is not directed to children under 13. Do not submit personal information for a child under 13. Games marked for adults or involving alcohol are only for adults who meet the legal age in their location. Contact us if you believe a child has provided personal data.</p></section>
    <section><h2>Security and changes</h2><p>We use technical and organisational safeguards intended to protect data, but no online service is completely secure. We may update this policy when Decked or the law changes. Material changes will be given appropriate notice and the updated date will appear above.</p></section>
  </>
}

function Terms() {
  return <>
    <Intro title="Terms of Use">These terms govern access to Decked. By using the service, you agree to them. If you do not agree, do not use Decked.</Intro>
    <section><h2>Using Decked</h2><p>Decked provides browser-based party and conversation games for personal entertainment. You must use the service lawfully and must not interfere with its security, attempt unauthorised access, automate abusive requests, misuse multiplayer rooms, or use Decked to harass, threaten, exploit, or harm another person.</p></section>
    <section><h2>Age and adult games</h2><p>You must be at least 13 to use Decked. If you are under the age of legal majority where you live, use Decked only with permission from a parent or guardian. Adult, intimate, or drinking games are only for people who are legally old enough for that activity. Alcohol is never required. Do not drink and drive, pressure anyone to participate, or treat a game prompt as an instruction to do something unsafe or illegal.</p></section>
    <section><h2>Your responsibility for the group</h2><p>Players may skip any prompt or stop at any time. The room host should choose games appropriate for the group and obtain permission before entering another person’s name or content. Do not submit private, unlawful, infringing, discriminatory, or harmful material. You remain responsible for content you enter and for decisions made while playing.</p></section>
    <section><h2>Multiplayer rooms</h2><p>Room codes are temporary and should be shared only with intended participants. Anyone with a valid code may be able to join. We may end, restrict, or remove rooms to protect the service or users. Internet and realtime services can fail or be delayed, and a room may not be recoverable.</p></section>
    <section><h2>Ownership and permission</h2><p>Decked, its visual design, software, game text, branding, and original content are owned by Decked or its licensors and are protected by applicable intellectual-property laws. We give you a limited, revocable, non-exclusive, non-transferable right to use Decked for personal, non-commercial entertainment. You may not copy, sell, scrape, republish, reverse engineer, or create a competing content library from the service except where law permits.</p></section>
    <section><h2>Availability and changes</h2><p>We may update, add, remove, suspend, or discontinue features. Decked is provided on an “as available” basis. We do not promise uninterrupted operation, that every prompt is suitable for every group, or that the service will always be error-free. Nothing in these terms excludes warranties, remedies, or consumer rights that cannot lawfully be excluded.</p></section>
    <section><h2>Liability</h2><p>To the fullest extent permitted by law, Decked is not responsible for indirect or consequential loss, loss caused by your conduct or another player’s conduct, unsafe use of prompts, alcohol consumption, user-entered content, or events outside our reasonable control. Any limitation applies only to the extent permitted by applicable law and does not limit liability that cannot legally be limited.</p></section>
    <section><h2>Ending access</h2><p>You may stop using Decked at any time. We may suspend access where reasonably necessary to investigate abuse, protect users or infrastructure, or comply with law. Provisions that by their nature should continue, including ownership, lawful liability limits, and dispute provisions, survive termination.</p></section>
    <section><h2>Governing law and changes</h2><p>These terms are governed by the laws of the Federal Republic of Nigeria, without depriving you of mandatory protections available under the law where you live. Courts with lawful jurisdiction may hear disputes. We may update these terms, and continued use after an effective update means you accept the revised terms where permitted by law.</p></section>
    <section><h2>Contact</h2><p>Questions about these terms can be sent to <a href="mailto:hello@usedecked.com">hello@usedecked.com</a>.</p></section>
  </>
}

function CookiePolicy() {
  return <>
    <Intro title="Cookie Policy">Decked uses browser storage and similar technologies. This page explains what they do and how you can control them.</Intro>
    <section><h2>What these technologies are</h2><p>Cookies are small files stored by a website. Decked also uses local storage and anonymous authentication tokens, which serve similar purposes even when they are not technically cookies. This policy covers all of them.</p></section>
    <section><h2>Storage Decked uses</h2><div className="legal-table" role="table" aria-label="Decked browser storage">
      <div className="legal-table-row legal-table-head" role="row"><span>Category</span><span>Purpose</span><span>Typical duration</span></div>
      <div className="legal-table-row" role="row"><strong>Essential multiplayer</strong><span>Anonymous authentication, room membership, security, and realtime gameplay.</span><span>Session-based or until the provider token expires.</span></div>
      <div className="legal-table-row" role="row"><strong>Game progress</strong><span>Player setup, selected decks, game state, custom cards, and resume functionality on this device.</span><span>Until replaced or cleared.</span></div>
      <div className="legal-table-row" role="row"><strong>Preferences</strong><span>Sound settings and other choices you ask Decked to remember.</span><span>Until changed or cleared.</span></div>
      <div className="legal-table-row" role="row"><strong>Analytics</strong><span>Random user and session identifiers, event-delivery queue, and measurement of feature performance when analytics is enabled.</span><span>Session activity resets after 30 minutes; persistent identifiers remain until cleared.</span></div>
      <div className="legal-table-row" role="row"><strong>Security and hosting</strong><span>Delivery, load balancing, fraud prevention, and infrastructure protection where used by our providers.</span><span>Varies by provider and security need.</span></div>
    </div></section>
    <section><h2>No advertising cookies</h2><p>Decked does not currently use advertising cookies, cross-site behavioural advertising, or social-media tracking pixels. The social icons in the footer are images and do not by themselves place social-network cookies.</p></section>
    <section><h2>Your controls</h2><p>You can delete or block cookies and site data in your browser settings. Clearing Decked’s data may remove saved games, preferences, anonymous identifiers, and active multiplayer access. Blocking essential storage can prevent multiplayer or resume features from working. Where applicable law requires consent for non-essential analytics storage, Decked must request that choice before enabling it.</p></section>
    <section><h2>Changes and contact</h2><p>We will update this policy if our storage practices change. For questions, contact <a href="mailto:hello@usedecked.com">hello@usedecked.com</a>.</p></section>
  </>
}
