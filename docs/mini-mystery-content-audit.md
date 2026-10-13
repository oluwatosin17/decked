# Mini Mystery collection audit

Audit date: 12 October 2026

## Scope

This pass now covers all 22 cases, all 176 roles, every public story, secret, private clue, round objective, public-evidence beat, accusation path, and final reveal. It also validates every supported game length (2, 3, and 4 rounds) in both pass-and-play and multiplayer.

## Design principles applied

- The central answer must be recoverable by deduction, not by guessing which character sounds suspicious.
- Public evidence must establish method, opportunity, and a culprit-specific link even when a smaller player count leaves some roles out.
- Private knowledge should create conversation: players compare times, challenge claims, reveal evidence, and decide when to disclose compromising information.
- Suspicious facts that are not part of the solution must be resolved explicitly in the reveal.
- Each round must advance the case rather than repeat flavour text.
- The ending must answer four questions: what happened, how it happened, why it happened, and how the evidence proves it.

These principles reflect the strongest patterns in established deduction games: constrained deduction in Clue, staged social information and bluffing in Blood on the Clocktower, and layered evidence with optional support in Hunt A Killer.

## Issues found

1. **Short games could be unfair.** Cases contained three public evidence items while players could choose two rounds. A two-round game could therefore end before decisive evidence appeared.
2. **Long games repeated evidence.** Four-round games cycled back to an earlier clue, weakening the final escalation.
3. **Reveals did not show the proof chain.** They named the culprit and plan but did not consistently explain why each major clue mattered.
4. **Red herrings remained unresolved.** Innocent characters' suspicious secrets could feel like loose ends rather than fair misdirection.
5. **One culprit objective set was too passive.** Chef Rocco Vale's prompts focused on dismissing and hiding information instead of actively steering the conversation.
6. **Content completeness was not mechanically enforced.** Missing proof, unresolved distractions, weak role objectives, or round-count regressions could enter a future case without failing a test.

## Improvements made

- Added a fourth, case-specific public evidence beat to every mystery.
- Added a three-step culprit proof chain to every case.
- Added two explicit red-herring resolutions to every case.
- Added structured `what`, `how`, and `why` reveal content to every case.
- Added adaptive evidence delivery:
  - 2 rounds: two clues per round.
  - 3 rounds: one clue in rounds 1 and 2, two clues in round 3.
  - 4 rounds: one clue per round.
- Updated pass-and-play and multiplayer results to present the event, method, motive, proof, and resolved red herrings.
- Reworked Rocco's objectives so the guilty player must argue, blame, and persuade rather than simply conceal.
- Added automated collection audits for role uniqueness, guilty-role count, active objectives, reveal completeness, proof attribution, and evidence distribution.

## Case-by-case review

| Case | Distinct investigative spine | Culprit proof now closes on | Red herrings resolved |
|---|---|---|---|
| The Phone That Could Ruin Everyone | Initial theft overtaken by a second digital scheme | Morgan's tracked bag, deleted recording and upload revision | Jordan's affair; Riley's cloud purchase |
| The Vanished Crypto Wallet | Missing hardware disguises a recovery-tool transfer | Blair's sedative, prototype and default threshold | Eli's unauthorized tool; Nadia's seed photograph |
| The Engagement Ring That Came Back | Party theft exposes a six-month-old diamond swap | Helena's bag key, planted ring and original sale | Lena's confrontation; Mia's affair |
| The Deepfake Confession | Real settlement facts embedded in a synthetic confession | Celeste's laptop, launch replacement and prepared response | Marcus's promotion; Adrian's real settlement |
| Cancelled at Midnight | Genuine messages recombined into a false scandal | Sasha's backup access, edit signature and early apology | Jamie's screenshots; Alex's affair |
| The Final Interview | Whistleblowing evidence converted into candidate sabotage | Rowan's tablet, server access and promised hire | Graham's hidden warning; Eli's résumé lie |
| The Guest Who Never Checked Out | Voluntary smart-home escape followed by confinement | Cameron's control tablet, vacant unit and corridor video | Dani's assistance; Harper's stolen card |
| Last Seen at 2:17 AM | Scheduled departure messages extended after confinement | Quinn's laptop, phone possession and missing payments | Parker's fake rideshare; Jordan's relationship |
| She Went Live After She Vanished | Prerecorded protest hijacked through fake live inserts | Devon's voice samples, moderation control and ownership transfer | Teni's escape help; Iris's legal warning |
| The Smart Home Lockdown | Synthetic voice and hidden override target the wrong guest | Nolan's service key, override and smoke routing | Mara's seating change; Marcus's construction shortcut |
| The Wrong Person Drank It | Two independent drink schemes collide | Cameron's message, glass movement and medication knowledge | Rina's unused prank; Blake's harmless concentrate |
| The Crash That Was Already Online | Staged breakdown transformed into a real collision | Sloane's payment, navigation change and insurance motive | Kai's original plan; Nico's early post |
| The Bride Who Never Reached the Altar | Genuine escape plan overtaken by confinement | Adaeze's blood, spliced message and spa-room access | Groom's second family; stolen bracelet |
| The Bishop's Final Announcement | Non-fatal collapse used to suppress succession | Daniel's clinic access, Bible movement and audit motive | Associate pastor's ambition; medication change |
| The ₦45 Million Harvest Offering | A spectacular theft of money that never existed | Funke's advance paperwork and historic withdrawals | Counter's petty theft; damaged offering bag |
| The Reunion Broadcast | A historic cover-up followed by a present detention | Jacobs's payments, key access and store-room recording | False identity; former head girl's statement |
| The Reading of the Will | A genuine hidden heir inside a forged inheritance | Chuka's template, land payment and substituted draft | DNA shock; scheduled voice note |
| The Cooperative Payout | Gradual identity fraud staged as one robbery | Bisi's recovery number, device and drugged flask | Chairwoman's borrowing; Sikiru's debts |
| The Last Bus to Enugu | A protected investigator hidden during a planned interception | Ikechukwu's planted cash, route diversion and message | Uche's concealment; Adaobi's undeclared cash |
| The Groom's Second Ring | Wrong person drinks a cup meant to delay a land signing | Dele's purchase, instructions and land-sale motive | Heirloom ring; company insurance |
| The Senator's Empty Coffin | Witness-protection plan exploited for financial theft | Evelyn's order, removed weights and account access | False certificate; political opposition |
| The Missing Afrobeats Star | Voluntary protest transformed into fake kidnapping | Lola's pursuit, altered video and insurance amendment | Label dispute; creative director's escape help |

The authoritative wording for every clue, role, objective, and reveal remains in `src/content/miniMystery.ts`; this table is a review map rather than a replacement for the playable copy.

## Simulation and validation

The automated simulation covers:

- 22 cases × 3 supported lengths = **66 complete evidence-delivery paths**.
- **176 roles**, each with a distinct public story, secret, clue, and three round objectives.
- **528 role objectives**, with at least two interaction-oriented objectives per role.
- Exactly one guilty role in every case.
- Four unique public evidence items delivered exactly once at every game length.
- Three culprit-linked proof statements and two explained red herrings per case.
- Matching pass-and-play and multiplayer content structures.

## Review guide

Start with these three contrasting cases to sample the breadth of the collection:

1. **The Blackout Ball** for a classic object-theft deduction.
2. **The Missing Violinist** for a disappearance in which the missing person cooperated.
3. **The Owambé Envelope** for a locally grounded social-event mystery.

Then review the remaining cases in the source file using the case titles in the table above. The tests in `src/content/miniMysteryMultiplayer.test.ts` document the invariants that every current and future case must satisfy.
