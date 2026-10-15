export type CourtCaseCategory = 'Everyday Chaos' | 'Friends & Parties' | 'Dating Drama'

export interface CourtCase {
  id: string
  category: CourtCaseCategory
  title: string
  setting: string
  briefing: string[]
  accusation: string
  accusedSecret: string
  prosecutorClue: string
  evidence: [string, string]
  twist: string
  objections: string[]
}

export const COURT_CASES: readonly CourtCase[] = [
  {
    id: 'birthday-cake', category: 'Friends & Parties', title: 'The Vanishing Birthday Cake', setting: 'A birthday after-party, 9:40 p.m.',
    briefing: ['The final piece of Amaka’s birthday cake was sealed inside a blue container.', 'Ten minutes later, the container was empty. Only one person was seen entering the kitchen.'],
    accusation: 'You ate the final piece of birthday cake and tried to conceal the evidence.',
    accusedSecret: 'You opened the container, but the cake was already gone. You noticed pink icing on someone’s phone case.',
    prosecutorClue: 'A fork from the cake table was found inside the Accused’s bag.',
    evidence: ['The kitchen camera stopped recording for exactly four minutes.', 'A message said, “Make sure nobody checks the blue container.”'],
    twist: 'The message was sent from the Judge’s phone.',
    objections: ['Give your alibi in exactly five words.', 'Name a witness and explain what they saw.', 'Explain why this evidence points to somebody else.'],
  },
  {
    id: 'group-chat', category: 'Friends & Parties', title: 'The Leaked Voice Note', setting: 'A private group chat after midnight',
    briefing: ['A voice note mocking the group holiday plan appeared on a public status.', 'It was deleted after ninety seconds—but three people had already saved it.'],
    accusation: 'You leaked the private voice note because your idea for the trip was rejected.',
    accusedSecret: 'You forwarded the note to one person for advice, but never posted it publicly.',
    prosecutorClue: 'The public upload and the Accused’s forwarded copy have the same unusual filename.',
    evidence: ['A screenshot shows the Accused asking, “Would it be terrible if everybody heard this?”', 'The upload happened while the Accused’s phone was connected to the host’s Wi-Fi.'],
    twist: 'The person who received the forwarded copy was using the Accused’s old phone.',
    objections: ['Read the suspicious message in an innocent tone.', 'Explain who benefited most from the leak.', 'Answer without saying “phone”, “post” or “forward”.'],
  },
  {
    id: 'missing-jollof', category: 'Everyday Chaos', title: 'The Midnight Jollof Job', setting: 'A shared flat on Sunday morning',
    briefing: ['A labelled container of party jollof disappeared from the fridge overnight.', 'The kitchen was clean, but the smoke alarm briefly activated at 2:13 a.m.'],
    accusation: 'You reheated and finished the jollof, then washed the evidence before sunrise.',
    accusedSecret: 'You entered the kitchen for water and found the microwave running with nobody nearby.',
    prosecutorClue: 'A grain of orange rice was stuck to the cuff of the Accused’s sweatshirt.',
    evidence: ['The microwave clock was reset after a power interruption.', 'A delivery rider photographed an open kitchen window at 2:16 a.m.'],
    twist: 'The missing container is discovered in the freezer, empty except for a handwritten apology.',
    objections: ['Reconstruct the missing three minutes.', 'Explain the rice on your clothes.', 'Accuse someone else using only the known evidence.'],
  },
  {
    id: 'playlist-sabotage', category: 'Friends & Parties', title: 'The Playlist Sabotage', setting: 'A house party approaching its busiest hour',
    briefing: ['The carefully prepared party playlist suddenly became forty minutes of breakup songs.', 'The host’s laptop was locked, and the music account allowed only one active editor.'],
    accusation: 'You sabotaged the playlist to send a dramatic message to your ex.',
    accusedSecret: 'You requested one breakup song, but someone offered to “make the message clearer.”',
    prosecutorClue: 'The replacement playlist was created from an account using the Accused’s nickname.',
    evidence: ['A smart speaker recorded someone saying, “Queue the devastating one next.”', 'The account was logged in from a device hidden behind the television.'],
    twist: 'The hidden device belongs to the Prosecutor.',
    objections: ['Defend your song choice as if it were completely normal.', 'Explain why the hidden device changes the case.', 'Produce a motive for the Prosecutor.'],
  },
  {
    id: 'double-booked-date', category: 'Dating Drama', title: 'The Double-Booked Date', setting: 'Two restaurants, one suspicious Friday night',
    briefing: ['Two people received nearly identical dinner invitations for the same evening.', 'Both reservations were made under the same nickname, thirty minutes apart.'],
    accusation: 'You deliberately scheduled two dates and planned to choose whoever arrived first.',
    accusedSecret: 'You only invited one person. A friend had access to your dating profile after helping rewrite it.',
    prosecutorClue: 'Both invitations use a phrase the Accused says constantly but never writes online.',
    evidence: ['The second reservation used a phone number ending in the Accused’s birth year.', 'A rideshare receipt places the Accused between both restaurants that evening.'],
    twist: 'The rideshare made an unplanned stop to pick up the Prosecutor.',
    objections: ['Explain the route without mentioning either restaurant.', 'Identify the detail only an impersonator would know.', 'Give the court your most believable innocent explanation.'],
  },
  {
    id: 'borrowed-hoodie', category: 'Dating Drama', title: 'The Borrowed Hoodie Affair', setting: 'A café reunion after three awkward weeks',
    briefing: ['A distinctive hoodie appeared in two different dating-profile photos.', 'Its owner insists it was never loaned to either person in the pictures.'],
    accusation: 'You secretly borrowed the hoodie to make someone jealous, then denied ever having it.',
    accusedSecret: 'The hoodie arrived in a bag of returned belongings, and you assumed it was yours.',
    prosecutorClue: 'The Accused posted a private joke about the hoodie before the photograph appeared.',
    evidence: ['A dry-cleaning receipt has the Accused’s number but another person’s name.', 'The photograph metadata says it was taken inside the hoodie owner’s building.'],
    twist: 'The photo was taken months earlier—before any of the people involved had met.',
    objections: ['Explain the timeline in one clear sentence.', 'Tell the court why the private joke matters.', 'Name the most suspicious coincidence.'],
  },
  {
    id: 'office-lunch', category: 'Everyday Chaos', title: 'The Fridge Note Conspiracy', setting: 'An office kitchen during a tense lunch break',
    briefing: ['Someone repeatedly ate food labelled with other people’s names.', 'A furious anonymous note appeared on the fridge—and then disappeared.'],
    accusation: 'You stole the lunches and removed the note because it described you perfectly.',
    accusedSecret: 'You removed the note because it contained an embarrassing false accusation about your manager.',
    prosecutorClue: 'The Accused’s desk drawer contains three sets of disposable cutlery from the missing meals.',
    evidence: ['Access records show the fridge opened using the Accused’s staff badge.', 'The missing note was printed from the manager’s computer.'],
    twist: 'The office badges were accidentally swapped during a fire drill.',
    objections: ['Explain the cutlery without blaming the manager.', 'Identify which evidence is no longer reliable.', 'Give the jury one reason to doubt your story.'],
  },
  {
    id: 'wifi-password', category: 'Everyday Chaos', title: 'The Wi-Fi Blackout', setting: 'A shared apartment during a major match',
    briefing: ['The Wi-Fi password changed seconds before the winning goal.', 'Every device disconnected except one laptop in the spare room.'],
    accusation: 'You changed the password so you could stream the match without everybody slowing you down.',
    accusedSecret: 'You knew the new password because the router displayed it after restarting itself.',
    prosecutorClue: 'A note on the Accused’s laptop contains the router administrator address and login.',
    evidence: ['The router log shows a password change from inside the apartment.', 'The spare-room laptop was downloading a 70-gigabyte game update.'],
    twist: 'The update was scheduled remotely by someone who was not home.',
    objections: ['Explain why you knew the new password.', 'Make the strongest case against the absent player.', 'Answer without using the word “internet”.'],
  },
  {
    id: 'surprise-party', category: 'Friends & Parties', title: 'The Ruined Surprise', setting: 'The afternoon before a secret celebration',
    briefing: ['The guest of honour arrived three hours early and found the decorations.', 'Only the planning group knew the venue and setup time.'],
    accusation: 'You deliberately ruined the surprise because the group ignored your party ideas.',
    accusedSecret: 'You sent the guest of honour to the building, but to collect a package from another floor.',
    prosecutorClue: 'Your message said, “Come early—you’ll want to see this before everyone else.”',
    evidence: ['The package collection desk closed the previous week.', 'A decoration supplier called the guest of honour by mistake that morning.'],
    twist: 'The supplier received the guest’s number from the Judge.',
    objections: ['Read your message as an innocent instruction.', 'Explain why you mentioned arriving early.', 'Choose which mistake actually ruined the surprise.'],
  },
  {
    id: 'dating-profile', category: 'Dating Drama', title: 'The Profile Rewrite', setting: 'A first date that became an interrogation',
    briefing: ['A dating profile suddenly became much funnier, more adventurous and completely inaccurate.', 'The person behind it now has to explain claims about skydiving, jazz piano and rescuing a goat.'],
    accusation: 'You secretly rewrote your friend’s dating profile and invented an entire personality to attract matches.',
    accusedSecret: 'You edited only the opening sentence. Someone else added the outrageous hobbies later.',
    prosecutorClue: 'The goat story matches an anecdote the Accused tells at every party.',
    evidence: ['The edits came from three devices within eleven minutes.', 'One device was connected through the café where the Accused works.'],
    twist: 'The profile owner approved every edit with a thumbs-up reaction.',
    objections: ['Explain why approval is not the same as permission.', 'Defend the goat story as technically accurate.', 'Identify who had the strongest motive.'],
  },
]

export const COURT_CASE_CATEGORIES = ['All', 'Everyday Chaos', 'Friends & Parties', 'Dating Drama'] as const

export const COURT_CATEGORY_DETAILS: Record<CourtCaseCategory, { description: string; accent: string }> = {
  'Everyday Chaos': { description: 'Missing food, shared spaces and suspicious little disasters.', accent: '#ffca3a' },
  'Friends & Parties': { description: 'Group-chat leaks, ruined surprises and party betrayals.', accent: '#ff665e' },
  'Dating Drama': { description: 'Mixed signals, profile trouble and romantic evidence.', accent: '#ef6fb4' },
}

export function shuffledCourtCases(categories: readonly string[] = ['All']) {
  const pool = categories.includes('All') ? [...COURT_CASES] : COURT_CASES.filter(item => categories.includes(item.category))
  return pool.sort(() => Math.random() - .5)
}
