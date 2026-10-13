import { NAIJA_MYSTERIES } from './miniMysteryNaija'
import { MODERN_MYSTERIES, MODERN_MYSTERY_ENHANCEMENTS } from './miniMysteryModern'
import { MYSTERY_VARIANT_SEEDS } from './miniMysteryVariants'

export interface MysteryRole {
  name: string
  title: string
  publicStory: string
  secret: string
  clue: string
  objectives: string[]
  guilty?: boolean
  guiltyPlan?: string
}

export interface MiniMysteryCase {
  id: string
  category: 'Stolen & Missing' | 'Sabotage & Secrets' | 'Strange Disappearances' | 'High-Stakes Crimes' | 'Naija Mysteries'
  title: string
  setting: string
  briefing: string[]
  incident: string
  knownFacts: string[]
  evidence: string[]
  solutionBeats: string[]
  motive: string
  culpritProof: string[]
  redHerringResolutions: string[]
  finalReveal: { what: string; how: string; why: string }
  roles: MysteryRole[]
}

export type MiniMysteryDraft = Omit<MiniMysteryCase, 'briefing' | 'culpritProof' | 'redHerringResolutions' | 'finalReveal'>

const MINI_MYSTERY_BASE: MiniMysteryDraft[] = [
  {
    id: 'blackout-ball', category: 'Stolen & Missing', title: 'The Blackout Ball', setting: 'A charity gala inside Hawthorne Manor',
    incident: 'The lights failed for ninety seconds. When they returned, the Ashcroft Diamond was gone from its locked display.',
    knownFacts: ['The display was opened with a key, not forced.', 'Every suspect remained inside the manor.', 'The blackout began at exactly 9:20 PM.'],
    evidence: ['A torn strip of green fabric was caught beside the study door.', 'The spare display key is missing from the event office.', 'A photo taken at 9:19 shows the trophy cabinet already open.'],
    solutionBeats: ['The torn fabric was planted to frame a guest.', 'The diamond never left the ballroom.', 'It was hidden inside the hollow charity trophy.'],
    motive: 'They planned to sell the diamond to cover a secret debt.',
    roles: [
      { name: 'Nora Vale', title: 'Event Planner', publicStory: 'You coordinated the gala and controlled the venue keys.', secret: 'You borrowed money from the victim and cannot repay it.', clue: 'You knew the charity trophy had a removable base.', objectives: ['Learn who entered the event office.', 'Persuade someone that the torn fabric matters.', 'Cast doubt on the photographer’s timeline.'], guilty: true, guiltyPlan: 'You used the spare key during the blackout, hid the diamond in the trophy and planted green fabric near the study.' },
      { name: 'Marcus Reed', title: 'Photographer', publicStory: 'You photographed guests around the ballroom all evening.', secret: 'You entered the office to retrieve a confiscated camera battery.', clue: 'Your 9:19 photo shows the trophy cabinet already open.', objectives: ['Avoid admitting you entered the office in Round 1.', 'Reveal the timestamp on your photograph.', 'Challenge Nora’s reason for handling the trophy.'] },
      { name: 'Celeste Ash', title: 'Donor', publicStory: 'You donated the diamond and expected to present it onstage.', secret: 'The diamond was insured for more than you paid for it.', clue: 'Only you and Nora were told where the spare key was kept.', objectives: ['Find out who knew about the spare key.', 'Defend the diamond’s authenticity.', 'Accuse the person whose story changed most.'] },
      { name: 'Eli Brooks', title: 'Caterer', publicStory: 'You supervised drinks beside the ballroom entrance.', secret: 'You caused a small kitchen fire minutes before the blackout.', clue: 'You saw Nora carrying the charity trophy before guests arrived.', objectives: ['Keep the kitchen fire quiet in Round 1.', 'Reveal who moved the trophy.', 'Ask why the blackout happened at an exact time.'] },
      { name: 'Iris Cole', title: 'Journalist', publicStory: 'You attended to cover the charity and its wealthy guests.', secret: 'You were investigating Celeste for insurance fraud.', clue: 'You recorded someone saying, “The trophy is safer than the safe.”', objectives: ['Get Celeste to discuss the insurance.', 'Reveal your recording without naming its speaker.', 'Connect the trophy to the disappearance.'] },
      { name: 'Theo Grant', title: 'Electrician', publicStory: 'You inspected the manor wiring earlier that afternoon.', secret: 'You left a maintenance panel unlocked.', clue: 'The blackout timer was attached after your inspection.', objectives: ['Explain the unlocked panel.', 'Identify who had access after you left.', 'Prove the blackout was deliberate.'] },
      { name: 'Maya Quinn', title: 'Assistant', publicStory: 'You managed the guest list and event-office desk.', secret: 'You briefly lost the spare key before the gala.', clue: 'Nora asked you to polish the trophy alone in the office.', objectives: ['Do not mention the lost key in Round 1.', 'Admit when the key disappeared.', 'Ask Nora why the trophy needed polishing.'] },
      { name: 'Julian Frost', title: 'Magician', publicStory: 'You were hired to perform immediately after the presentation.', secret: 'Your act contains a fake diamond identical in size.', clue: 'Your prop diamond is still sealed inside your case.', objectives: ['Withhold the duplicate diamond until questioned.', 'Let the group inspect your sealed case.', 'Explain how an object could be hidden in plain sight.'] },
    ],
  },
  {
    id: 'last-toast', category: 'Sabotage & Secrets', title: 'The Last Toast', setting: 'A private anniversary dinner at The Marigold Hotel',
    incident: 'The guest of honour collapsed after a toast. Someone switched their harmless tonic for a dangerous herbal concentrate.',
    knownFacts: ['Only one glass contained the concentrate.', 'The bottle was taken from the hotel spa.', 'The place cards were rearranged before dinner.'],
    evidence: ['A gold place card has a fresh red-wine stain.', 'The spa cabinet log records an opening at 7:42 PM.', 'The waiter’s tray photograph shows two glasses exchanged.'],
    solutionBeats: ['The target was chosen by moving a place card.', 'The stained card marked the intended seat.', 'The culprit switched the glasses while proposing the toast.'],
    motive: 'They wanted to delay the victim from exposing a forged business contract.',
    roles: [
      { name: 'Vivian Cross', title: 'Business Partner', publicStory: 'You organized the anniversary toast.', secret: 'The victim discovered your forged signature that morning.', clue: 'You knew the concentrate causes collapse but is rarely fatal.', objectives: ['Make the place-card swap sound accidental.', 'Suggest the spa manager had opportunity.', 'Keep attention on who poured the drinks.'], guilty: true, guiltyPlan: 'You stole the concentrate, moved the victim’s place card and switched their glass during your toast.' },
      { name: 'Owen Pike', title: 'Head Waiter', publicStory: 'You served every drink at the table.', secret: 'You left the tray unattended to answer a personal call.', clue: 'Your tray photograph shows the glasses before they were switched.', objectives: ['Hide the personal call in Round 1.', 'Reveal the tray photograph.', 'Identify who stood closest to the glasses.'] },
      { name: 'Rina Bell', title: 'Spa Manager', publicStory: 'You manage the cabinet where the concentrate was stored.', secret: 'Your access card was missing for twenty minutes.', clue: 'Vivian asked about the concentrate one week ago.', objectives: ['Recover the timeline of your missing card.', 'Reveal Vivian’s earlier question.', 'Explain who could imitate your access.'] },
      { name: 'Cal Hart', title: 'Hotel Musician', publicStory: 'You performed beside the dining room entrance.', secret: 'You moved a place card so you could sit closer to someone.', clue: 'The stained card was already beside Vivian’s chair.', objectives: ['Do not admit moving a card in Round 1.', 'Explain exactly which card you moved.', 'Ask who spilled the red wine.'] },
      { name: 'June Wells', title: 'Family Lawyer', publicStory: 'You brought documents for the guest of honour to sign.', secret: 'You knew about the forged contract but told no one.', clue: 'The victim planned to confront Vivian after dessert.', objectives: ['Keep the contract private in Round 1.', 'Reveal the planned confrontation.', 'Test Vivian’s reason for organizing the toast.'] },
      { name: 'Felix Moon', title: 'Sommelier', publicStory: 'You poured the wine but not the tonic.', secret: 'You spilled wine on a place card and replaced it.', clue: 'Vivian picked up two glasses immediately before the toast.', objectives: ['Explain the stained card.', 'Name who handled two glasses.', 'Defend Owen from the pouring accusation.'] },
      { name: 'Ada Stone', title: 'Hotel Guest', publicStory: 'You witnessed the dinner from the next table.', secret: 'You secretly recorded the celebration.', clue: 'Your recording captures the words “wrong seat” before the toast.', objectives: ['Do not disclose the recording immediately.', 'Play back the crucial phrase.', 'Ask who expected the victim to sit elsewhere.'] },
      { name: 'Leo Cross', title: 'The Heir', publicStory: 'You argued with the victim over your inheritance.', secret: 'You searched the victim’s coat for a rewritten will.', clue: 'The spa access card was inside the coat when you searched it.', objectives: ['Conceal the coat search in Round 1.', 'Reveal where the access card ended up.', 'Explain why inheritance was not the immediate motive.'] },
    ],
  },
  {
    id: 'vanishing-reel', category: 'Stolen & Missing', title: 'The Vanishing Reel', setting: 'A midnight premiere at the faded Orion Cinema',
    incident: 'The only copy of an unreleased film vanished from the projection booth minutes before its premiere.',
    knownFacts: ['The booth door locks automatically.', 'The reel case was too large to hide under clothing.', 'The fire alarm briefly emptied the upper floor.'],
    evidence: ['Silver film dust appears on a backstage curtain.', 'A delivery trolley made an unscheduled trip downstairs.', 'The fire-alarm glass was broken from inside the booth corridor.'],
    solutionBeats: ['The reel was moved before the alarm sounded.', 'The empty case was left as a distraction.', 'The film was rolled inside a poster-display cylinder.'],
    motive: 'They intended to leak the film and collect a payment from a rival studio.',
    roles: [
      { name: 'Sasha Lane', title: 'Publicist', publicStory: 'You controlled premiere materials and the poster displays.', secret: 'A rival studio offered you money for the film.', clue: 'You knew the poster cylinders were leaving after midnight.', objectives: ['Blame the alarm for the disappearance.', 'Ask who had the booth code.', 'Keep the group away from the poster displays.'], guilty: true, guiltyPlan: 'You removed the film, rolled it into a poster cylinder and triggered the alarm to hide the timing.' },
      { name: 'Dev Moss', title: 'Projectionist', publicStory: 'You prepared the film and were last seen inside the booth.', secret: 'You duplicated thirty seconds of footage as a souvenir.', clue: 'The full reel was gone before the fire alarm sounded.', objectives: ['Hide your copied footage in Round 1.', 'Correct the group’s alarm timeline.', 'Explain the booth’s automatic lock.'] },
      { name: 'Amara King', title: 'Director', publicStory: 'The missing film is your unreleased final cut.', secret: 'You considered cancelling the premiere after bad reviews.', clue: 'Sasha insisted on replacing every poster cylinder personally.', objectives: ['Defend the film’s value.', 'Reveal Sasha’s unusual poster request.', 'Ask who profited from a leak.'] },
      { name: 'Benji Rowe', title: 'Courier', publicStory: 'You delivered promotional boxes to the cinema.', secret: 'You used the trolley for an unauthorized personal package.', clue: 'Sasha sent the trolley downstairs before the alarm.', objectives: ['Avoid explaining your package in Round 1.', 'Reveal who ordered the trolley trip.', 'Describe what could fit inside its long compartment.'] },
      { name: 'Priya Shaw', title: 'Film Critic', publicStory: 'You were invited despite publishing a harsh early review.', secret: 'You entered backstage searching for interview notes.', clue: 'You saw silver film dust on Sasha’s sleeve.', objectives: ['Hide your backstage visit initially.', 'Reveal the dust you observed.', 'Question Sasha about touching the reel.'] },
      { name: 'Kit Ward', title: 'Cinema Owner', publicStory: 'You know every room and alarm in the building.', secret: 'The cinema is facing bankruptcy.', clue: 'The alarm was triggered manually in the booth corridor.', objectives: ['Defend yourself against the insurance motive.', 'Explain where the alarm was triggered.', 'Identify who could leave the corridor unnoticed.'] },
      { name: 'Milo Hart', title: 'Actor', publicStory: 'You arrived late after arguing with the director.', secret: 'You wanted an embarrassing scene removed from the film.', clue: 'The reel case you found after the alarm was already empty.', objectives: ['Admit your argument only if asked.', 'Reveal that the case was empty.', 'Separate your motive from the method.'] },
      { name: 'Tess Blue', title: 'Archivist', publicStory: 'You inspected the reel for damage before the premiere.', secret: 'You discovered the film stock was unusually easy to unspool.', clue: 'A poster cylinder could hold the film without its metal reel.', objectives: ['Explain the missing silver dust.', 'Demonstrate how the film could be transported.', 'Direct attention toward the poster shipment.'] },
    ],
  },
  {
    id: 'museum-after-midnight', category: 'Stolen & Missing', title: 'Museum After Midnight', setting: 'An exclusive preview at the Bellweather Museum',
    incident: 'A priceless golden mask disappeared from a sealed gallery while every guest was attending the curator’s midnight speech.',
    knownFacts: ['The glass display never opened.', 'The gallery camera looped the same twelve seconds.', 'A replica mask was found in the restoration room.'],
    evidence: ['Fresh gold paint marks the inside of a packing crate.', 'The camera loop was uploaded from the education-office tablet.', 'A ventilation plan shows a service hatch behind the display wall.'],
    solutionBeats: ['The real mask was replaced before the speech.', 'The sealed display contained the replica.', 'The original left inside a children’s exhibit crate.'],
    motive: 'They sold the mask to pay for a secret collection of forged antiquities.',
    roles: [
      { name: 'Dorian Beck', title: 'Chief Curator', publicStory: 'You planned the preview and authenticated the golden mask.', secret: 'Several artefacts you acquired are sophisticated fakes.', clue: 'You alone approved the children’s exhibit crate for removal.', objectives: ['Emphasize the sealed display.', 'Question the camera technician.', 'Keep attention away from the outgoing crates.'], guilty: true, guiltyPlan: 'You swapped in the replica during setup, looped the camera and sent the real mask out inside the children’s exhibit crate.' },
      { name: 'Lena Park', title: 'Restorer', publicStory: 'You cleaned and mounted the mask before the preview.', secret: 'You made the replica without the museum’s permission.', clue: 'The replica was supposed to be used for school visits next month.', objectives: ['Hide why the replica exists.', 'Reveal who knew it was finished.', 'Compare the paint found on the crate.'] },
      { name: 'Omar Finch', title: 'Security Chief', publicStory: 'You monitored every camera and locked the gallery.', secret: 'You left the control room for seven minutes.', clue: 'The loop came from a registered museum tablet, not the security system.', objectives: ['Defend the gallery lock.', 'Admit leaving the monitors.', 'Trace the source of the camera loop.'] },
      { name: 'Mae Rivers', title: 'Education Officer', publicStory: 'You manage school exhibits and the education-office tablet.', secret: 'You lent your tablet to Dorian during setup.', clue: 'The children’s crate was unusually heavy when it left.', objectives: ['Explain who used your tablet.', 'Describe the crate’s weight.', 'Ask why Dorian signed the dispatch alone.'] },
      { name: 'Grant Ellis', title: 'Collector', publicStory: 'You sponsored the exhibition and hoped to buy the mask.', secret: 'You offered the museum an illegal private deal.', clue: 'Dorian urgently asked you for a large cash advance.', objectives: ['Conceal your offer at first.', 'Reveal Dorian’s money request.', 'Separate your motive from the method.'] },
      { name: 'Zara Bloom', title: 'Journalist', publicStory: 'You were covering the preview for an arts magazine.', secret: 'You entered the closed restoration room looking for a story.', clue: 'You photographed gold paint on Dorian’s cuff.', objectives: ['Hide your trespass in Round 1.', 'Reveal the cuff photograph.', 'Ask when the mask was last authenticated.'] },
      { name: 'Finn Cole', title: 'Crate Handler', publicStory: 'You moved exhibition materials through the loading bay.', secret: 'You skipped the required weight check to leave early.', clue: 'Dorian changed the destination label on one crate.', objectives: ['Defend the missing weight record.', 'Reveal the changed label.', 'Identify who could access the loading bay.'] },
      { name: 'Asha Wynn', title: 'Architect', publicStory: 'You designed the gallery’s recent security renovation.', secret: 'You never disclosed the service hatch behind the display.', clue: 'The hatch allows a swap without opening the glass.', objectives: ['Delay revealing the hatch.', 'Explain how the display stayed sealed.', 'Name who requested the old plans.'] },
    ],
  },
  {
    id: 'poisoned-pitch', category: 'Sabotage & Secrets', title: 'The Poisoned Pitch', setting: 'A live final for a million-naira startup prize',
    incident: 'The favourite team’s presentation file was replaced with a humiliating fake moments before they went onstage.',
    knownFacts: ['The stage laptop never left the auditorium.', 'The fake file used confidential company numbers.', 'The venue Wi-Fi failed five minutes before the pitch.'],
    evidence: ['A USB cap is wedged beneath the judges’ table.', 'The fake slides use a font licensed to the rival agency.', 'Backstage footage shows someone wearing a volunteer lanyard entering the control booth.'],
    solutionBeats: ['The Wi-Fi failure was a distraction.', 'The presentation was replaced using a USB drive.', 'The culprit borrowed a volunteer lanyard to enter the booth.'],
    motive: 'They needed the favourite to lose so their struggling company would win the investment.',
    roles: [
      { name: 'Kade Mercer', title: 'Rival Founder', publicStory: 'Your startup was competing against the sabotaged favourite.', secret: 'Your company will collapse without tonight’s prize.', clue: 'You previously worked at the agency that designed the fake slides.', objectives: ['Blame the Wi-Fi failure.', 'Question the event technician.', 'Hide your missing volunteer lanyard.'], guilty: true, guiltyPlan: 'You copied confidential numbers, created the fake slides, borrowed a lanyard and replaced the deck by USB during the Wi-Fi distraction.' },
      { name: 'Nia Cole', title: 'Favourite Founder', publicStory: 'Your team created the original presentation.', secret: 'You exaggerated one financial forecast.', clue: 'Only four people had seen the confidential numbers.', objectives: ['Defend your real pitch.', 'Name everyone with access.', 'Admit the exaggerated forecast before it is used against you.'] },
      { name: 'Tomi Vale', title: 'Event Technician', publicStory: 'You operated the stage laptop and projection system.', secret: 'You caused the Wi-Fi outage while installing an update.', clue: 'A USB device connected while you were restarting the router.', objectives: ['Explain the outage.', 'Reveal the USB log.', 'Identify who entered the booth.'] },
      { name: 'Reese Ford', title: 'Judge', publicStory: 'You reviewed each startup’s private financial pack.', secret: 'You planned to invest personally in Nia’s company.', clue: 'You saw a USB cap beneath your table before the pitches began.', objectives: ['Hide your investment interest initially.', 'Reveal where the USB cap appeared.', 'Challenge Kade’s claimed timeline.'] },
      { name: 'Amie Song', title: 'Volunteer', publicStory: 'You checked backstage passes and guided finalists.', secret: 'You lent your spare lanyard to Kade.', clue: 'Kade claimed they needed to retrieve a forgotten charger.', objectives: ['Do not admit lending the pass in Round 1.', 'Reveal Kade’s excuse.', 'Explain the access the lanyard granted.'] },
      { name: 'Sol Grant', title: 'Agency Designer', publicStory: 'Your agency designed Nia’s legitimate presentation.', secret: 'You reused the same licensed font for Kade last year.', clue: 'The fake slides were exported from Kade’s former agency account.', objectives: ['Explain the font connection.', 'Reveal the export metadata.', 'Defend your access to the real numbers.'] },
      { name: 'Efe Stone', title: 'Business Reporter', publicStory: 'You interviewed both finalists before the event.', secret: 'You received the confidential figures from an anonymous source.', clue: 'The source message arrived from a temporary address linked to the venue Wi-Fi.', objectives: ['Protect your source at first.', 'Reveal when the message arrived.', 'Ask who knew the venue network details.'] },
      { name: 'Jules Hart', title: 'Investor', publicStory: 'You sponsored the prize and observed backstage preparation.', secret: 'You quietly offered to buy Nia’s company before the final.', clue: 'You saw Kade remove a small drive from the booth computer.', objectives: ['Hide your rejected offer.', 'Describe what you saw.', 'Force Kade to explain the booth visit.'] },
    ],
  },
  {
    id: 'ruined-wedding', category: 'Sabotage & Secrets', title: 'The Ruined Wedding', setting: 'A lavish wedding at Rosemere Gardens',
    incident: 'The ceremony music, vows and private photographs were replaced by files exposing the couple’s secrets in front of every guest.',
    knownFacts: ['All three files changed at the same time.', 'The venue tablet controls the ceremony screens.', 'The replacement folder was named “Truth”.'],
    evidence: ['A florist’s memory card contains the replacement folder.', 'The venue tablet records a login from the dressing room.', 'A deleted message says, “They deserve to know before the vows.”'],
    solutionBeats: ['The files were prepared before the wedding day.', 'The florist’s memory card was planted.', 'The tablet was accessed using a code copied from the planner’s notebook.'],
    motive: 'They believed the marriage would destroy the family business and wanted the ceremony stopped.',
    roles: [
      { name: 'Simone Grey', title: 'Bride’s Sister', publicStory: 'You helped the bride dress and carried family messages.', secret: 'You will lose control of the family company after the marriage.', clue: 'You photographed the planner’s tablet code earlier that week.', objectives: ['Argue that the florist had access.', 'Question the groom’s secret messages.', 'Hide why you opposed the marriage.'], guilty: true, guiltyPlan: 'You prepared the exposure files, copied the tablet code, uploaded them from the dressing room and planted the memory card.' },
      { name: 'Arlo James', title: 'Wedding Planner', publicStory: 'You controlled the schedule, tablet and supplier access.', secret: 'You wrote the tablet code in an unlocked notebook.', clue: 'Simone borrowed the notebook to check the seating plan.', objectives: ['Defend your security process.', 'Reveal who borrowed the notebook.', 'Explain the synchronized file replacement.'] },
      { name: 'Nadine Wells', title: 'Florist', publicStory: 'You decorated the ceremony and used memory cards for display images.', secret: 'You accidentally left a card in the dressing room.', clue: 'The card found in your bag is not the brand you use.', objectives: ['Admit losing a memory card.', 'Prove the planted card is different.', 'Ask who entered the dressing room.'] },
      { name: 'Miles Grey', title: 'Groom', publicStory: 'You arrived early and tested the ceremony music.', secret: 'You hid a large personal debt from your partner.', clue: 'The exposed debt document came from Simone’s family office.', objectives: ['Address the debt honestly.', 'Identify who could access the document.', 'Explain your early tablet test.'] },
      { name: 'Tara James', title: 'Bride', publicStory: 'You selected the vows, photographs and music.', secret: 'You planned to leave the family company after the honeymoon.', clue: 'Simone begged you to cancel the wedding the previous night.', objectives: ['Reveal your career plan.', 'Describe Simone’s warning.', 'Challenge the claimed motive of protecting you.'] },
      { name: 'Beck Rowe', title: 'Photographer', publicStory: 'You supplied the private photo slideshow.', secret: 'You kept an unauthorized cloud backup.', clue: 'The replacement photos were downloaded, not copied from your camera.', objectives: ['Defend the backup.', 'Explain the download metadata.', 'Trace who received the gallery link.'] },
      { name: 'Cleo Moss', title: 'DJ', publicStory: 'You tested the sound system and ceremony playlist.', secret: 'You changed one song as a surprise without permission.', clue: 'The legitimate playlist was intact at noon.', objectives: ['Admit your harmless song change.', 'Establish the last clean timestamp.', 'Separate the music system from the tablet upload.'] },
      { name: 'Hugh Stone', title: 'Family Lawyer', publicStory: 'You attended to witness the marriage agreement.', secret: 'You drafted the company transfer Simone feared.', clue: 'Simone asked exactly when the transfer became binding.', objectives: ['Keep the agreement confidential initially.', 'Reveal Simone’s question.', 'Explain the financial motive.'] },
    ],
  },
  {
    id: 'missing-violinist', category: 'Strange Disappearances', title: 'The Missing Violinist', setting: 'A sold-out concert inside the Grand Lyric Hall',
    incident: 'The star violinist vanished from a locked dressing room ten minutes before the performance, leaving their priceless violin behind.',
    knownFacts: ['The dressing-room window opens onto a sheer wall.', 'The corridor guard saw nobody leave.', 'A second costume was missing from the wardrobe.'],
    evidence: ['Stage makeup stains a fire-exit handle.', 'A maintenance lift stopped backstage at 7:48 PM.', 'The understudy received a message saying, “Tonight is yours.”'],
    solutionBeats: ['The violinist left willingly in disguise.', 'They used the maintenance lift, not the corridor.', 'Someone helped them escape to force the understudy’s debut.'],
    motive: 'They wanted the understudy to become famous and expose the orchestra director’s exploitation.',
    roles: [
      { name: 'Mira Voss', title: 'Costume Designer', publicStory: 'You prepared concert clothes for the soloist and understudy.', secret: 'You are the understudy’s parent and hid that relationship.', clue: 'You created a stagehand disguise in the violinist’s size.', objectives: ['Emphasize the locked room.', 'Protect the understudy.', 'Hide the missing stagehand costume.'], guilty: true, guiltyPlan: 'You disguised the willing violinist, stopped the maintenance lift and sent the message that placed the understudy onstage.' },
      { name: 'Noah Voss', title: 'Understudy', publicStory: 'You were waiting backstage in case the soloist needed you.', secret: 'Mira is your parent and trained you in secret.', clue: 'The violinist promised you would perform tonight somehow.', objectives: ['Hide your family connection initially.', 'Reveal the violinist’s promise.', 'Ask who controlled the costumes.'] },
      { name: 'Elian Frost', title: 'Orchestra Director', publicStory: 'You conducted rehearsals and managed the soloist’s contract.', secret: 'The contract prevented the violinist from taking breaks.', clue: 'The violinist threatened to expose you after the concert.', objectives: ['Defend the strict contract.', 'Reveal the threat.', 'Accuse someone with access to the lift.'] },
      { name: 'Pia Lane', title: 'Stage Manager', publicStory: 'You controlled backstage calls and the maintenance lift key.', secret: 'You left the lift key in an unlocked cue desk.', clue: 'Mira asked when the lift would be unmonitored.', objectives: ['Explain the missing key.', 'Reveal Mira’s question.', 'Reconstruct the 7:48 timeline.'] },
      { name: 'Drew Bell', title: 'Corridor Guard', publicStory: 'You watched the only public dressing-room exit.', secret: 'You briefly left to deal with a counterfeit ticket.', clue: 'A stagehand with unusual makeup passed during your absence.', objectives: ['Admit leaving your post.', 'Describe the disguised person.', 'Explain why the corridor still matters.'] },
      { name: 'Sena Hart', title: 'Music Critic', publicStory: 'You interviewed the violinist before the show.', secret: 'You knew they planned to denounce the director publicly.', clue: 'They asked whether a disappearance would make a better headline.', objectives: ['Protect your interview notes.', 'Reveal the strange question.', 'Connect the disappearance to the director.'] },
      { name: 'Rafi Cole', title: 'Instrument Keeper', publicStory: 'You guarded the priceless violin outside the room.', secret: 'You entered to photograph the instrument.', clue: 'The violinist deliberately left it positioned beneath the light.', objectives: ['Admit entering the room.', 'Explain why the violin was left.', 'Prove theft was never the goal.'] },
      { name: 'Ivy Snow', title: 'Makeup Artist', publicStory: 'You prepared performers and stagehands.', secret: 'A jar of ageing makeup vanished from your station.', clue: 'The fire-exit stain matches the missing makeup.', objectives: ['Report the missing makeup.', 'Identify who knew how to apply it.', 'Connect the stain to the escape route.'] },
    ],
  },
  {
    id: 'empty-cabin', category: 'Strange Disappearances', title: 'The Empty Cabin', setting: 'An overnight train crossing a frozen mountain pass',
    incident: 'A famous author disappeared from a locked sleeping cabin while the train was moving, leaving an unfinished manuscript on the bed.',
    knownFacts: ['The exterior door alarm never sounded.', 'The cabin key remained with the conductor.', 'The author had announced a career-ending revelation.'],
    evidence: ['Coal dust lies beneath the cabin washbasin.', 'A catering trolley returned with one empty compartment.', 'The manuscript’s final page contains a dining-car table number.'],
    solutionBeats: ['The locked cabin was staged after the author left.', 'They hid inside the catering trolley.', 'The culprit moved them into the disused mail carriage.'],
    motive: 'They wanted to suppress a manuscript exposing a decades-old literary fraud.',
    roles: [
      { name: 'Edwin Crow', title: 'Publisher', publicStory: 'You travelled with the author to announce their final book.', secret: 'You wrote the author’s earliest bestseller and received no credit.', clue: 'You knew the manuscript exposed the hidden authorship deal.', objectives: ['Focus suspicion on the train crew.', 'Question the locked door.', 'Hide your control of the catering schedule.'], guilty: true, guiltyPlan: 'You persuaded the author to hide for a publicity stunt, wheeled them away in the trolley and locked them in the mail carriage to seize the manuscript.' },
      { name: 'Lila March', title: 'Author’s Assistant', publicStory: 'You typed the manuscript and managed the author’s schedule.', secret: 'You secretly copied the complete manuscript.', clue: 'The author feared Edwin would stop the book’s release.', objectives: ['Hide your copy initially.', 'Reveal the author’s fear.', 'Explain the meaning of the table number.'] },
      { name: 'Jonas Pike', title: 'Conductor', publicStory: 'You held the master keys and checked the cabin after the alarm.', secret: 'You lent Edwin a service key to retrieve luggage.', clue: 'The key locks the cabin but does not open the mail carriage.', objectives: ['Admit lending the key.', 'Clarify which doors it opens.', 'Trace the service corridor.'] },
      { name: 'Anya Frost', title: 'Dining-Car Manager', publicStory: 'You supervised the catering trolley and table service.', secret: 'One trolley was missing for twenty minutes.', clue: 'Edwin insisted that table seven remain empty.', objectives: ['Report the missing trolley.', 'Explain table seven.', 'Identify who returned the trolley.'] },
      { name: 'Cole Avery', title: 'Literary Rival', publicStory: 'You publicly accused the author of stealing your ideas.', secret: 'You planned to confront them with legal papers.', clue: 'The manuscript exposed someone else, not you.', objectives: ['Own your public motive.', 'Reveal what the manuscript actually claims.', 'Challenge Edwin’s history with the author.'] },
      { name: 'Mina Shah', title: 'Travel Journalist', publicStory: 'You were documenting the famous train route.', secret: 'You photographed Edwin pushing a trolley near the mail carriage.', clue: 'The photo timestamp is three minutes before the cabin was found empty.', objectives: ['Protect your unpublished photographs.', 'Reveal the timestamp.', 'Ask why Edwin was in the service corridor.'] },
      { name: 'Arthur Vale', title: 'Retired Detective', publicStory: 'You occupied the neighbouring cabin.', secret: 'You heard the author agree to “one last stunt.”', clue: 'The cabin lock clicked after the trolley passed.', objectives: ['Withhold the exact phrase initially.', 'Reconstruct the sound order.', 'Show that the author left before the door was locked.'] },
      { name: 'Etta Blue', title: 'Train Engineer', publicStory: 'You monitored alarms and mechanical systems.', secret: 'You used the mail carriage for unauthorized storage.', clue: 'Coal dust from that carriage matches the dust in the cabin.', objectives: ['Explain your use of the carriage.', 'Match the coal dust.', 'Confirm the exterior alarm never failed.'] },
    ],
  },
  {
    id: 'vanished-chef', category: 'Strange Disappearances', title: 'The Vanished Chef', setting: 'The final night of an elite televised cooking competition',
    incident: 'The head judge vanished between tasting courses, and a cryptic recipe was left burning inside the kitchen oven.',
    knownFacts: ['The studio exits were monitored.', 'The judge’s microphone stopped transmitting in the pantry.', 'The burning recipe was written in the judge’s handwriting.'],
    evidence: ['A freezer inventory lists one crate that does not exist.', 'Flour footprints end at a movable pantry shelf.', 'The recipe’s first letters spell “CELLAR”.'],
    solutionBeats: ['The recipe was a deliberate message.', 'The pantry shelf hides an old service stair.', 'The judge was confined in the wine cellar beneath the studio.'],
    motive: 'They wanted to delay the verdict until a bribery recording could be destroyed.',
    roles: [
      { name: 'Chef Rocco Vale', title: 'Executive Producer', publicStory: 'You ran the show and controlled its schedule.', secret: 'The judge recorded you offering money to favour a contestant.', clue: 'You knew the pantry’s old service stair still worked.', objectives: ['Argue that the recipe is meaningless.', 'Blame a contestant.', 'Persuade the group that the pantry shelf should stay closed.'], guilty: true, guiltyPlan: 'You lured the judge into the pantry, forced them down the service stair and locked the cellar while you searched for the recording.' },
      { name: 'Imani Rose', title: 'Finalist', publicStory: 'You were plating dessert when the judge vanished.', secret: 'Rocco offered you an unfair advantage and you refused.', clue: 'You heard Rocco ask the judge to meet privately in the pantry.', objectives: ['Hide the bribery offer initially.', 'Reveal the pantry meeting.', 'Defend yourself against the competition motive.'] },
      { name: 'Theo Marsh', title: 'Finalist', publicStory: 'You were preparing the opposing final dish.', secret: 'You copied one element of Imani’s recipe.', clue: 'The judge deliberately left the oven door open.', objectives: ['Admit the copied technique.', 'Explain why the burning paper was meant to be found.', 'Decode part of the recipe message.'] },
      { name: 'Penny Ford', title: 'Floor Manager', publicStory: 'You tracked every person entering and leaving the set.', secret: 'You turned off one pantry camera during a technical reset.', clue: 'Rocco ordered that specific camera reset.', objectives: ['Explain the camera gap.', 'Name who ordered it.', 'Confirm nobody used the public exits.'] },
      { name: 'Gabe Lin', title: 'Sound Engineer', publicStory: 'You monitored the judge’s wireless microphone.', secret: 'You kept a private recording of all backstage audio.', clue: 'The final transmission includes a cellar door slamming.', objectives: ['Hide your unauthorized recording.', 'Play the final sound.', 'Identify the voice speaking before it.'] },
      { name: 'Ruth Cole', title: 'Pantry Steward', publicStory: 'You controlled ingredients and freezer inventory.', secret: 'You invented a freezer-crate entry to hide missing wine.', clue: 'The fake crate number matches the cellar padlock code.', objectives: ['Explain the fake inventory line.', 'Reveal the code connection.', 'Show who requested the inventory sheet.'] },
      { name: 'Milo Grant', title: 'Food Critic', publicStory: 'You joined the broadcast as a guest judge.', secret: 'You knew about the bribery rumour before filming.', clue: 'The missing judge said the proof was “small enough to wear.”', objectives: ['Reveal the rumour carefully.', 'Explain the microphone clue.', 'Ask who searched the judge’s clothing.'] },
      { name: 'Sara Wynn', title: 'Set Designer', publicStory: 'You built the modern kitchen around the old building.', secret: 'You left the hidden stair accessible for emergencies.', clue: 'Only you and Rocco received the original cellar plan.', objectives: ['Reveal the moving shelf.', 'Name everyone with the plan.', 'Lead the group to the cellar route.'] },
    ],
  },
  {
    id: 'midnight-express', category: 'High-Stakes Crimes', title: 'The Midnight Express', setting: 'A luxury sleeper train carrying a diplomatic briefcase',
    incident: 'A coded diplomatic briefcase was opened without damage, and one page vanished before the train crossed the border.',
    knownFacts: ['The briefcase never left the observation lounge.', 'Only the diplomat knew the combination.', 'A staged medical emergency cleared the lounge.'],
    evidence: ['A mirror opposite the table carries three fresh fingerprints.', 'The missing page was photographed before it was removed.', 'A medication vial contains harmless coloured water.'],
    solutionBeats: ['The emergency was deliberately staged.', 'The combination was read in the mirror.', 'The page was hidden inside a folded route map.'],
    motive: 'They intended to sell the border agreement to a private mining company.',
    roles: [
      { name: 'Cass Rowan', title: 'Diplomatic Aide', publicStory: 'You guarded the briefcase and organized the border meeting.', secret: 'A mining company paid your hidden gambling debts.', clue: 'You positioned the briefcase opposite the lounge mirror.', objectives: ['Defend the medical emergency.', 'Question the diplomat’s secrecy.', 'Keep the route maps out of sight.'], guilty: true, guiltyPlan: 'You staged the collapse, watched the reflected combination, photographed the page and hid it inside a route map.' },
      { name: 'Ambassador Hale', title: 'Diplomat', publicStory: 'You carried the agreement and knew its combination.', secret: 'You changed one clause without government approval.', clue: 'Cass insisted you open the case at the mirrored table.', objectives: ['Protect the altered clause initially.', 'Reveal who chose the table.', 'Explain exactly when the case opened.'] },
      { name: 'Dr. Suri Beck', title: 'Passenger Doctor', publicStory: 'You treated the apparent medical emergency.', secret: 'You immediately suspected the collapse was fake.', clue: 'The medication vial contained coloured water.', objectives: ['Describe the fake symptoms.', 'Reveal the vial test.', 'Identify who handed you the patient’s bag.'] },
      { name: 'Nico Lane', title: 'Train Attendant', publicStory: 'You cleared the lounge and brought the medical kit.', secret: 'You sold passenger schedules to a tabloid.', clue: 'Cass returned to the empty lounge before anyone else.', objectives: ['Hide your schedule sales.', 'Establish who re-entered first.', 'Explain the observation-lounge locks.'] },
      { name: 'Vera Moss', title: 'Mining Executive', publicStory: 'You happened to be travelling to the same border city.', secret: 'Your company offered money for the agreement.', clue: 'Cass sent you a blank message exactly after the emergency.', objectives: ['Deny direct involvement.', 'Explain the blank message.', 'Reveal who knew about the offer.'] },
      { name: 'Elias Stone', title: 'Photojournalist', publicStory: 'You photographed the mountain route from the lounge.', secret: 'Your camera accidentally captured the briefcase reflection.', clue: 'The image shows Cass watching the combination in the mirror.', objectives: ['Protect your unreleased photos.', 'Reveal the reflection.', 'Compare the timing with the emergency.'] },
      { name: 'June Fox', title: 'Tour Guide', publicStory: 'You distributed route maps to passengers.', secret: 'One map disappeared from your locked cabinet.', clue: 'Cass asked for a replacement map after the lounge reopened.', objectives: ['Report the missing map.', 'Name who requested another.', 'Suggest how a page could fit inside it.'] },
      { name: 'Max Dune', title: 'Security Officer', publicStory: 'You escorted the diplomat throughout the journey.', secret: 'You left your post to pursue an unrelated smuggling tip.', clue: 'Nobody carried the briefcase through the lounge door.', objectives: ['Admit leaving your post.', 'Confirm the case stayed inside.', 'Focus on how it could be opened in place.'] },
    ],
  },
  {
    id: 'lighthouse-signal', category: 'High-Stakes Crimes', title: 'The Lighthouse Signal', setting: 'An isolated lighthouse during a violent coastal storm',
    incident: 'The warning beacon was deliberately extinguished as a cargo vessel approached the rocks, and the emergency radio was smashed.',
    knownFacts: ['The generator remained operational.', 'The beacon was disabled from the lantern room.', 'Someone sent three flashes toward the beach before darkness.'],
    evidence: ['Red paint from a salvage boat marks the lighthouse steps.', 'A wet ledger records the cargo vessel’s exact route.', 'The broken radio still holds a message about crates waiting offshore.'],
    solutionBeats: ['The blackout was not intended to sink the vessel.', 'The three flashes signalled a hidden salvage crew.', 'The culprit planned to force the ship aground and steal its cargo.'],
    motive: 'They needed one final salvage haul to prevent the family business from bankruptcy.',
    roles: [
      { name: 'Mara Flint', title: 'Lighthouse Keeper', publicStory: 'You maintained the beacon and recorded every passing vessel.', secret: 'Your family salvage company is nearly bankrupt.', clue: 'You altered the cargo vessel’s route entry in the ledger.', objectives: ['Blame the storm.', 'Question the generator engineer.', 'Hide the meaning of the three flashes.'], guilty: true, guiltyPlan: 'You disabled the beacon, signalled your salvage crew and smashed the radio so the ship would ground safely near the waiting boats.' },
      { name: 'Kian Reed', title: 'Assistant Keeper', publicStory: 'You checked the lantern room before the storm.', secret: 'You fell asleep during part of your watch.', clue: 'The beacon cutoff lever was tied down by hand.', objectives: ['Admit the missed watch.', 'Describe the tied lever.', 'Name who carried cord upstairs.'] },
      { name: 'Dr. Ada Shore', title: 'Weather Scientist', publicStory: 'You came to record the storm from the lighthouse.', secret: 'You predicted the vessel could survive the rocks at low tide.', clue: 'Mara repeatedly asked about the safest grounding time.', objectives: ['Explain your prediction.', 'Reveal Mara’s questions.', 'Distinguish planned grounding from attempted sinking.'] },
      { name: 'Bram Cole', title: 'Generator Engineer', publicStory: 'You serviced the lighthouse power system that afternoon.', secret: 'You used counterfeit replacement parts.', clue: 'The generator log proves power never failed.', objectives: ['Defend the working generator.', 'Admit the false parts.', 'Prove the beacon was manually disabled.'] },
      { name: 'Elise Ward', title: 'Coastguard Officer', publicStory: 'You arrived to inspect emergency procedures.', secret: 'You ignored an earlier report of illegal salvage boats.', clue: 'The radio’s final message names Mara’s family company.', objectives: ['Explain the ignored report.', 'Recover the radio message.', 'Ask who benefited from the cargo.'] },
      { name: 'Troy Vale', title: 'Salvage Diver', publicStory: 'You sought shelter at the lighthouse during the storm.', secret: 'You work for Mara’s family company.', clue: 'Your boat’s red paint matches the steps.', objectives: ['Hide your employer at first.', 'Explain the paint.', 'Reveal Mara’s signal plan only when cornered.'] },
      { name: 'Nell Price', title: 'Shipping Clerk', publicStory: 'You carried the vessel’s corrected route to the lighthouse.', secret: 'You accepted money to keep the cargo manifest quiet.', clue: 'The ledger route differs from the official route you delivered.', objectives: ['Protect the manifest initially.', 'Compare the two routes.', 'Identify who altered the ledger.'] },
      { name: 'Owen Ray', title: 'Documentary Filmmaker', publicStory: 'You were recording life inside the lighthouse.', secret: 'You secretly filmed after being told to stop.', clue: 'Your footage captures Mara carrying rope toward the lantern room.', objectives: ['Hide the secret footage.', 'Reveal the rope detail.', 'Connect the timing to the three flashes.'] },
    ],
  },
  {
    id: 'final-curtain', category: 'High-Stakes Crimes', title: 'The Final Curtain', setting: 'Opening night of a controversial West End-style stage play',
    incident: 'A loaded antique pistol replaced the harmless prop during the final scene, narrowly missing the lead actor.',
    knownFacts: ['The prop passed a safety check one hour earlier.', 'The weapon cabinet showed no forced entry.', 'The shot occurred after an unscheduled lighting blackout.'],
    evidence: ['A duplicate cabinet key is taped beneath a makeup table.', 'The live round came from a private historical collection.', 'The lighting cue was added from the director’s laptop.'],
    solutionBeats: ['The blackout concealed the weapon swap.', 'The duplicate key was planted to frame the makeup artist.', 'The real pistol came from the producer’s collection.'],
    motive: 'They wanted the scandal to close the play before it exposed their role in a real political cover-up.',
    roles: [
      { name: 'Gideon Pike', title: 'Producer', publicStory: 'You financed the play and supplied its antique props.', secret: 'The play’s final act closely mirrors a cover-up you helped arrange.', clue: 'The live pistol came from your private collection.', objectives: ['Blame the duplicate key.', 'Question the stage manager.', 'Keep your collection records hidden.'], guilty: true, guiltyPlan: 'You added the blackout cue, used your original cabinet key to swap the pistol and planted a duplicate beneath the makeup table.' },
      { name: 'Freya Cole', title: 'Lead Actor', publicStory: 'You fired the pistol during the final scene.', secret: 'You threatened to reveal the producer’s connection to the play.', clue: 'Gideon personally insisted on using his antique prop.', objectives: ['Explain your confrontation.', 'Reveal who supplied the pistol.', 'Ask why the blackout was added.'] },
      { name: 'Miles Hart', title: 'Director', publicStory: 'You staged the scene and controlled the rehearsal plan.', secret: 'You left your laptop unlocked in Gideon’s office.', clue: 'The new cue was entered under your account after rehearsal.', objectives: ['Admit leaving the laptop.', 'Establish when the cue appeared.', 'Identify who was in the office.'] },
      { name: 'Suki Lane', title: 'Stage Manager', publicStory: 'You checked and locked the prop weapon.', secret: 'You skipped the second safety check due to a late scene change.', clue: 'The cabinet was relocked with a valid key.', objectives: ['Admit the skipped check.', 'Explain the lock evidence.', 'List everyone with authorized keys.'] },
      { name: 'Bree Moss', title: 'Makeup Artist', publicStory: 'You prepared the cast beside the prop corridor.', secret: 'You made an unauthorized duplicate key for emergencies.', clue: 'Your duplicate disappeared two days ago and the planted key is newer.', objectives: ['Explain why a duplicate exists.', 'Prove the planted key is different.', 'Name who knew about your missing key.'] },
      { name: 'Theo King', title: 'Historian', publicStory: 'You verified the production’s antique weapons.', secret: 'You discovered Gideon’s collection contained an unregistered pistol.', clue: 'The live round matches ammunition stored with that pistol.', objectives: ['Reveal the unregistered weapon.', 'Match the ammunition.', 'Explain why the harmless prop looked authentic.'] },
      { name: 'Nora Bell', title: 'Playwright', publicStory: 'You wrote the controversial story from confidential testimony.', secret: 'The lead actor was your anonymous source.', clue: 'Gideon demanded the final act be removed before opening night.', objectives: ['Protect your source initially.', 'Reveal Gideon’s demand.', 'Explain why closing the play benefits him.'] },
      { name: 'Cal Wynn', title: 'Lighting Operator', publicStory: 'You executed the unexpected blackout cue.', secret: 'You noticed the cue looked suspicious but followed it anyway.', clue: 'The cue file records Gideon’s office network address.', objectives: ['Defend following the cue.', 'Reveal its network origin.', 'Reconstruct what happened in the darkness.'] },
    ],
  },
  {
    id: 'owambe-envelope', category: 'Naija Mysteries', title: 'The Owambé Envelope', setting: 'A packed Lagos wedding reception on Victoria Island',
    incident: 'The couple’s gift envelope—holding cash, cheques and the keys to their new flat—vanished during the money-spraying entrance.',
    knownFacts: ['The envelope was last seen inside the family gift box.', 'The hall lights dimmed during the couple’s entrance.', 'Only members of the wedding party knew the flat keys were inside.'],
    evidence: ['A strip of matching aso ebi is caught beneath the gift-table wheel.', 'The event livestream briefly shows the gift box being moved.', 'A POS receipt records a large attempted transfer from the venue car park.'],
    solutionBeats: ['The aso ebi strip was planted to blame the bridal train.', 'The gift box was rolled behind the photo wall during the entrance.', 'The envelope was hidden inside an empty souvenir bag.'],
    motive: 'They needed the cash to settle an urgent debt before it became public at the wedding.',
    roles: [
      { name: 'Tunde Akin', title: 'Best Man', publicStory: 'You coordinated the groomsmen and guarded the gift table.', secret: 'You owe a dangerous lender and promised payment tonight.', clue: 'You knew the souvenir bags had false cardboard bottoms.', objectives: ['Blame the crowded dance floor.', 'Ask who touched the gift box.', 'Keep the souvenir bags from being searched.'], guilty: true, guiltyPlan: 'You moved the gift box during the dimmed entrance, hid the envelope in a souvenir bag and planted aso ebi fabric beneath the table.' },
      { name: 'Amaka Obi', title: 'Chief Bridesmaid', publicStory: 'You managed the bridal train and carried the bride’s emergency bag.', secret: 'You argued with the groom about unpaid wedding expenses.', clue: 'Your aso ebi fabric is intact; the planted strip came from spare tailoring cloth.', objectives: ['Defend the bridal train.', 'Prove the fabric was planted.', 'Ask who collected spare cloth from the tailor.'] },
      { name: 'Kemi Balogun', title: 'Event Planner', publicStory: 'You controlled the hall schedule, lighting and supplier access.', secret: 'You ordered the lights dimmed without telling the couple.', clue: 'Tunde asked for the entrance to last two minutes longer.', objectives: ['Explain the lighting change.', 'Reveal Tunde’s timing request.', 'Reconstruct movement around the photo wall.'] },
      { name: 'Chidi Eze', title: 'Groom’s Cousin', publicStory: 'You counted sprayed money beside the dance floor.', secret: 'You quietly removed some sprayed notes to pay a vendor.', clue: 'You saw Tunde pushing the gift table during the entrance.', objectives: ['Hide the missing sprayed notes initially.', 'Reveal what Tunde moved.', 'Separate your theft from the missing envelope.'] },
      { name: 'Bisi Adeyemi', title: 'Bride’s Aunt', publicStory: 'You supervised family gifts and announced important guests.', secret: 'You opened the gift box earlier to check who gave what.', clue: 'The envelope was present immediately before the couple entered.', objectives: ['Admit opening the box.', 'Establish the last confirmed sighting.', 'Question why the table had wheels.'] },
      { name: 'Femi Cole', title: 'Videographer', publicStory: 'You filmed the entrance and streamed the reception online.', secret: 'Your livestream briefly went offline because you took a private call.', clue: 'The saved local footage shows a souvenir bag on Tunde’s shoulder.', objectives: ['Explain the livestream gap.', 'Reveal the local footage.', 'Identify the bag Tunde carried.'] },
      { name: 'Ngozi Nwosu', title: 'Souvenir Vendor', publicStory: 'You supplied and arranged the wedding souvenir bags.', secret: 'You made extra bags to sell privately after the reception.', clue: 'One bag returned to your table much heavier than the others.', objectives: ['Admit making extras.', 'Describe the heavy bag.', 'Explain the false cardboard bottoms.'] },
      { name: 'Seyi Martins', title: 'DJ', publicStory: 'You controlled the entrance music and lighting cues.', secret: 'You accepted money to extend the entrance mix.', clue: 'Tunde paid you cash to repeat the chorus twice.', objectives: ['Hide the private payment at first.', 'Reveal who extended the entrance.', 'Link the extra time to the table movement.'] },
    ],
  },
  {
    id: 'nollywood-master', category: 'Naija Mysteries', title: 'The Missing Master Cut', setting: 'A Nollywood premiere at Filmhouse Lekki',
    incident: 'The only master drive of a highly anticipated film disappeared minutes before its Lagos premiere, replaced by an unfinished cut.',
    knownFacts: ['The master drive was stored in a locked projection case.', 'The unfinished cut contains a scene the producer ordered deleted.', 'The cinema network was disconnected before the swap.'],
    evidence: ['A dispatch rider’s thermal bag contains silver USB packaging.', 'The projection-room access log records a temporary crew badge.', 'A voice note says, “Let them see what really happened on set.”'],
    solutionBeats: ['The network disconnection prevented remote verification.', 'The unfinished cut was placed to expose the deleted scene.', 'The real master left inside a dispatch package addressed to the press.'],
    motive: 'They wanted the premiere stopped until an unsafe on-set incident and its cover-up were made public.',
    roles: [
      { name: 'Dami Okafor', title: 'Assistant Director', publicStory: 'You managed the production schedule and premiere crew.', secret: 'You recorded the producer covering up a serious stunt accident.', clue: 'You could create temporary crew badges from the production portal.', objectives: ['Defend the unfinished cut.', 'Question the producer’s deleted scene.', 'Hide the dispatch booking.'], guilty: true, guiltyPlan: 'You used a temporary badge, swapped the master for the exposing cut and sent the real drive to a journalist through a dispatch rider.' },
      { name: 'Yinka Bello', title: 'Producer', publicStory: 'You financed the film and approved the final master.', secret: 'You suppressed footage of an unsafe stunt accident.', clue: 'Dami threatened to release the deleted scene if you ignored the crew.', objectives: ['Protect the film’s reputation.', 'Reveal Dami’s threat.', 'Explain why the scene was deleted.'] },
      { name: 'Zainab Musa', title: 'Lead Actor', publicStory: 'You star in the film and arrived early for press interviews.', secret: 'You were injured during the hidden stunt accident.', clue: 'The voice note belongs to someone who witnessed the accident.', objectives: ['Reveal your injury when useful.', 'Identify who recorded the voice note.', 'Ask who benefits from showing the unfinished cut.'] },
      { name: 'Kunle Ajayi', title: 'Projectionist', publicStory: 'You received and tested the locked projection case.', secret: 'You left the room to take a selfie with a celebrity guest.', clue: 'A temporary badge opened the room while you were away.', objectives: ['Admit leaving the room.', 'Reveal the badge log.', 'Prove the cinema network was deliberately unplugged.'] },
      { name: 'Ini Peters', title: 'Screenwriter', publicStory: 'You wrote the film and opposed cutting the disputed scene.', secret: 'You kept your own unfinished export at home.', clue: 'The replacement file has Dami’s private production watermark.', objectives: ['Admit owning another copy.', 'Explain the watermark.', 'Separate your creative dispute from the physical swap.'] },
      { name: 'Emeka Ibe', title: 'Dispatch Rider', publicStory: 'You arrived to collect a package from the cinema lobby.', secret: 'You accepted the job without a verified sender name.', clue: 'Dami handed you a sealed thermal bag near the staff entrance.', objectives: ['Protect the customer initially.', 'Describe the handoff.', 'Reveal the destination on the dispatch order.'] },
      { name: 'Roli Danjuma', title: 'Entertainment Journalist', publicStory: 'You attended to review the premiere and interview the cast.', secret: 'You were expecting leaked evidence about the accident.', clue: 'The dispatch package was addressed to your newsroom.', objectives: ['Hide the expected leak in Round 1.', 'Reveal the package destination.', 'Explain why the master itself was sent.'] },
      { name: 'Tayo Lawal', title: 'Publicist', publicStory: 'You managed the red carpet, press list and temporary badges.', secret: 'You shared your badge-creation login with Dami.', clue: 'The temporary badge used Dami’s old crew photograph.', objectives: ['Admit sharing the login.', 'Identify the badge photograph.', 'Reconstruct Dami’s movements during the red carpet.'] },
    ],
  },
  {
    id: 'detty-december-headliner', category: 'Naija Mysteries', title: 'The Missing Headliner', setting: 'A Detty December beach concert at Landmark',
    incident: 'The international headliner vanished from a secured backstage lounge twenty minutes before the show, while a fake cancellation post spread online.',
    knownFacts: ['The artist’s passport and phone remained in the lounge.', 'Every vehicle leaving backstage was searched.', 'The cancellation post was scheduled before the disappearance.'],
    evidence: ['A catering wristband was scanned twice at the beach service gate.', 'A laundry cart returned from the lounge with wet sand underneath.', 'The fake post was uploaded through the promoter’s social-media dashboard.'],
    solutionBeats: ['The artist was moved without using a vehicle.', 'The laundry cart crossed the beach service gate.', 'The disappearance was staged to force a contract renegotiation.'],
    motive: 'They wanted the sold-out show delayed until the promoter agreed to release unpaid performance fees.',
    roles: [
      { name: 'Lola Adebayo', title: 'Artist Manager', publicStory: 'You controlled the artist’s schedule and negotiated the concert contract.', secret: 'The promoter still owed most of the performance fee.', clue: 'You held a spare catering wristband and knew the beach service route.', objectives: ['Focus on security failures.', 'Question the fake social post.', 'Hide the unpaid-fee ultimatum.'], guilty: true, guiltyPlan: 'With the artist’s agreement, you hid them in a laundry cart, used a duplicate wristband and scheduled the fake cancellation to force payment.' },
      { name: 'Mide Johnson', title: 'Concert Promoter', publicStory: 'You booked the artist and ran the sold-out event.', secret: 'You used ticket income to cover another event and delayed payment.', clue: 'Lola threatened that the artist would not touch the stage without full payment.', objectives: ['Defend the payment delay.', 'Reveal Lola’s ultimatum.', 'Trace who accessed your social dashboard.'] },
      { name: 'Chisom Ekene', title: 'Backstage Security', publicStory: 'You guarded the lounge and searched all departing vehicles.', secret: 'You let a catering cart pass without inspection.', clue: 'The cart operator wore a valid wristband but kept their face covered.', objectives: ['Admit the missed cart search.', 'Describe the disguised operator.', 'Explain why vehicles are irrelevant.'] },
      { name: 'Abdul Kareem', title: 'Catering Supervisor', publicStory: 'You managed backstage food staff and wristbands.', secret: 'One spare wristband disappeared from your clipboard.', clue: 'Lola asked when catering used the beach gate.', objectives: ['Report the missing wristband.', 'Reveal Lola’s route question.', 'Identify the double scan.'] },
      { name: 'Ejiro Banks', title: 'Opening Artist', publicStory: 'You were preparing to extend your set after the delay.', secret: 'Your team celebrated the possibility of replacing the headliner.', clue: 'You saw Lola pushing a laundry cart toward the beach.', objectives: ['Own your career motive.', 'Reveal what you saw.', 'Explain why you did not report it immediately.'] },
      { name: 'Temi Fox', title: 'Social Media Lead', publicStory: 'You managed the event’s live updates and promoter dashboard.', secret: 'You left the dashboard logged in on Lola’s tablet.', clue: 'The cancellation post was scheduled from that tablet.', objectives: ['Admit the open session.', 'Identify the device used.', 'Establish when the post was created.'] },
      { name: 'Bayo Prince', title: 'Laundry Contractor', publicStory: 'You collected towels and costumes from backstage.', secret: 'Lola paid you cash to leave your cart unattended.', clue: 'The cart came back heavier, then returned empty from the beach.', objectives: ['Hide the cash payment initially.', 'Describe the cart’s changing weight.', 'Name who asked you to step away.'] },
      { name: 'Nneka Udo', title: 'Entertainment Blogger', publicStory: 'You were livestreaming backstage arrivals.', secret: 'You received the cancellation graphic before it went public.', clue: 'The anonymous sender used language from Lola’s contract emails.', objectives: ['Protect your source initially.', 'Reveal the early graphic.', 'Connect its wording to the payment dispute.'] },
    ],
  },
  {
    id: 'abuja-sealed-file', category: 'Naija Mysteries', title: 'The Abuja Sealed File', setting: 'A private infrastructure summit inside an Abuja hotel',
    incident: 'A sealed procurement report vanished from a locked conference room just before it could expose a fraudulent billion-naira contract.',
    knownFacts: ['The room’s electronic lock never opened.', 'The report arrived in a tamper-evident red folder.', 'A fire drill emptied the entire conference floor.'],
    evidence: ['A ceiling tile above the adjoining media room is displaced.', 'Red sealing tape is stuck inside a document shredder.', 'The fire alarm was triggered using a hotel maintenance code.'],
    solutionBeats: ['The locked door was a deliberate distraction.', 'The file moved through the shared ceiling space.', 'The report was scanned, then shredded inside the media room.'],
    motive: 'They needed to destroy proof connecting their consultancy to inflated project invoices.',
    roles: [
      { name: 'Ifeanyi Nwankwo', title: 'Project Consultant', publicStory: 'You advised the committee on contract costs and delivery.', secret: 'Your consultancy received hidden payments from the winning bidder.', clue: 'You booked the adjoining media room under a staff member’s name.', objectives: ['Focus on the locked conference room.', 'Question hotel maintenance.', 'Hide your media-room booking.'], guilty: true, guiltyPlan: 'You triggered the drill, crossed the ceiling through the media room, scanned the report and shredded the original before everyone returned.' },
      { name: 'Hauwa Sani', title: 'Committee Chair', publicStory: 'You brought the sealed report and scheduled its presentation.', secret: 'You delayed releasing the report for two weeks.', clue: 'Ifeanyi repeatedly asked which hotel room would hold it.', objectives: ['Explain the delay.', 'Reveal Ifeanyi’s questions.', 'Establish who knew the room assignment.'] },
      { name: 'Segun Ade', title: 'Investigative Journalist', publicStory: 'You attended the summit hoping to obtain the report.', secret: 'You offered a staff member money for a copy.', clue: 'You saw fresh ceiling dust on Ifeanyi’s jacket.', objectives: ['Admit seeking the report.', 'Reveal the ceiling dust.', 'Separate leaking the report from destroying it.'] },
      { name: 'Maryam Bello', title: 'Hotel Manager', publicStory: 'You controlled conference-room access and emergency procedures.', secret: 'You shared a maintenance code with the summit organizer.', clue: 'The alarm log shows the code was entered from the media room.', objectives: ['Explain the shared code.', 'Reveal the alarm location.', 'Confirm the conference door stayed locked.'] },
      { name: 'Obinna Kalu', title: 'Contractor', publicStory: 'Your company won the infrastructure contract under scrutiny.', secret: 'Several invoices were inflated without your knowledge.', clue: 'Ifeanyi demanded an emergency payment the previous night.', objectives: ['Defend your company.', 'Reveal the payment demand.', 'Ask who personally profited from the invoices.'] },
      { name: 'Rita Ekanem', title: 'Media Technician', publicStory: 'You prepared the adjoining room for summit broadcasts.', secret: 'You left a scanner and shredder powered on overnight.', clue: 'The scanner retains a timestamp matching the fire drill.', objectives: ['Explain the equipment access.', 'Reveal the scan timestamp.', 'Identify who booked the room.'] },
      { name: 'Dayo Ojo', title: 'Civil Engineer', publicStory: 'You supplied evidence used in the report.', secret: 'One of your cost estimates contained a serious mistake.', clue: 'The shredded tape matches the report folder Hauwa carried.', objectives: ['Admit the estimate error.', 'Identify the sealing tape.', 'Show why you wanted correction, not destruction.'] },
      { name: 'Amina Yusuf', title: 'Summit Organizer', publicStory: 'You assigned rooms and coordinated the fire-drill response.', secret: 'You let Ifeanyi use a staff member’s name for a private booking.', clue: 'Ifeanyi specifically requested a room sharing the conference ceiling void.', objectives: ['Admit approving the booking.', 'Reveal the unusual room request.', 'Connect the room plan to the method.'] },
    ],
  },
]

type MysteryEnhancement = { finalEvidence: string; culpritProof: string[]; redHerringResolutions: string[] }

const MYSTERY_ENHANCEMENTS: Record<string, MysteryEnhancement> = {
  'blackout-ball': {
    finalEvidence: 'Maya’s office log shows Nora signed the spare key out at 9:14 PM and never returned it.',
    culpritProof: ['Nora had the unreturned spare key needed to open the display.', 'Eli and Maya independently place Nora with the hollow trophy before the theft.', 'The planted fabric and timer show planning, while the 9:19 photograph proves the hiding place was prepared before the blackout.'],
    redHerringResolutions: ['Julian’s duplicate diamond remained sealed inside his prop case.', 'Celeste’s inflated insurance and Marcus’s office visit provide motives to lie, but neither explains the trophy or missing key.'],
  },
  'last-toast': {
    finalEvidence: 'Ada’s recording clearly captures Vivian saying, “Put them in the wrong seat,” seconds before she lifts both glasses.',
    culpritProof: ['Vivian knew what the concentrate would do and had asked Rina about it earlier.', 'Felix and the tray photograph place two glasses in Vivian’s hands.', 'The moved place card and recorded phrase show how Vivian selected the victim before making the switch.'],
    redHerringResolutions: ['Leo found the missing spa card in the victim’s coat but did not use it.', 'Cal and Felix both moved or replaced place cards for unrelated reasons, explaining the confusing seating evidence.'],
  },
  'vanishing-reel': {
    finalEvidence: 'The outgoing poster manifest bears Sasha’s signature and lists one cylinder that is six kilograms overweight.',
    culpritProof: ['Priya saw film dust on Sasha’s sleeve.', 'Benji confirms Sasha ordered the unexplained trolley trip.', 'The overweight cylinder and Sasha’s personal control of the poster shipment identify both method and escape route.'],
    redHerringResolutions: ['Dev copied only thirty seconds; his souvenir file could not be the missing full reel.', 'Milo wanted a scene removed, but the empty case he found proves the reel had already gone.'],
  },
  'museum-after-midnight': {
    finalEvidence: 'The crate’s revised dispatch label is in Dorian’s handwriting and routes it to a storage unit he privately rents.',
    culpritProof: ['Asha’s hatch explains the swap without opening the display.', 'Mae’s tablet and Omar’s log connect Dorian to the camera loop.', 'Finn’s label and the heavy crate establish how Dorian removed the real mask.'],
    redHerringResolutions: ['Lena created the replica for school visits, not for sale.', 'Grant’s illegal offer and Zara’s trespass explain their secrecy but do not give them control of the crate.'],
  },
  'poisoned-pitch': {
    finalEvidence: 'The USB drive’s device history contains Kade’s laptop name and the fake deck’s original export path.',
    culpritProof: ['The fake deck uses Kade’s former agency account and licensed font.', 'Amie’s lanyard gave Kade access to the booth during the outage.', 'The USB history proves Kade carried and inserted the replacement file.'],
    redHerringResolutions: ['Tomi accidentally caused the Wi-Fi outage, but the replacement was performed offline by USB.', 'Nia exaggerated one forecast, yet sabotaging her own live pitch would only expose it more widely.'],
  },
  'ruined-wedding': {
    finalEvidence: 'The tablet log shows the replacement folder was uploaded with the copied six-digit code from the dressing room, two minutes after the bride was called away.',
    culpritProof: ['Simone had the financial motive to stop the company transfer and had already urged Tara to cancel the wedding.', 'Arlo confirms Simone borrowed the notebook containing the six-digit tablet code.', 'The dressing-room timing gave Simone the opportunity, while Nadine proves the florist’s memory card was planted rather than used for the upload.'],
    redHerringResolutions: ['Cleo changed one harmless song, not the synchronized vows and photo files.', 'Miles’s debt and Beck’s cloud backup explain the exposed material but not the tablet login.'],
  },
  'missing-violinist': {
    finalEvidence: 'The maintenance-lift camera shows Mira entering with one costume bag and returning with two minutes later.',
    culpritProof: ['Mira made a disguise in the violinist’s exact size.', 'Pia’s lift key and Drew’s disguised-stagehand sighting establish the route.', 'The lift footage and Mira’s hidden relationship to Noah explain both assistance and motive.'],
    redHerringResolutions: ['Rafi photographed the violin but left it untouched; theft was never the objective.', 'Noah benefited from the disappearance but did not know how Mira planned the escape.'],
  },
  'empty-cabin': {
    finalEvidence: 'The mail-carriage padlock contains Edwin’s publisher signet pressed into fresh grease.',
    culpritProof: ['Arthur heard the author agree to a stunt before the cabin was relocked.', 'Mina photographed Edwin pushing the trolley toward the mail carriage.', 'The signet and manuscript motive prove Edwin converted the willing stunt into confinement.'],
    redHerringResolutions: ['Cole had a public feud but the manuscript actually cleared him.', 'Lila copied the manuscript to protect it; she had no need to remove the author or original.'],
  },
  'vanished-chef': {
    finalEvidence: 'Gabe’s audio captures Rocco saying, “The recording stays with me,” immediately before the cellar door slams.',
    culpritProof: ['Penny confirms Rocco ordered the pantry-camera reset.', 'Sara confirms only she and Rocco held the cellar plan.', 'The audio connects Rocco directly to the confinement and the bribery recording he sought.'],
    redHerringResolutions: ['Theo copied a cooking technique but had no access to the hidden stair.', 'Ruth’s fake freezer entry concealed missing wine; it accidentally supplied the cellar code clue.'],
  },
  'midnight-express': {
    finalEvidence: 'June opens the replacement route map and finds the missing agreement page folded along its original creases.',
    culpritProof: ['Elias’s photograph shows Cass watching the reflected combination.', 'The fake medicine proves the emergency was staged.', 'Cass requested the exact route map that ultimately contained the missing page.'],
    redHerringResolutions: ['The ambassador altered a clause but was trying to protect that secret, not sell the agreement.', 'Max abandoned his post for another investigation, creating opportunity without participating in the theft.'],
  },
  'lighthouse-signal': {
    finalEvidence: 'The recovered radio message reads, “Three flashes. Ground her at low tide. Red boat at Widow’s Cove,” matching Owen’s footage and the paint on the steps.',
    culpritProof: ['The generator log proves a manual shutdown rather than storm damage.', 'Mara asked for the safest grounding time and altered the vessel route in the lighthouse ledger.', 'The three-flash message, Mara’s family salvage motive and Troy’s matching red boat connect the signal to her planned grounding.'],
    redHerringResolutions: ['Bram’s counterfeit parts were dangerous but did not cause this outage.', 'Nell hid the cargo manifest for money, yet the altered lighthouse ledger was written later by Mara.'],
  },
  'final-curtain': {
    finalEvidence: 'Gideon’s collection ledger is missing the exact pistol and single live round used onstage.',
    culpritProof: ['Theo matches the live round to Gideon’s collection.', 'Cal traces the blackout cue to Gideon’s office network.', 'The missing collection entry and planted duplicate key show Gideon supplied the weapon and framed Bree.'],
    redHerringResolutions: ['Bree made an unauthorized spare key, but the planted key was newly cut and not hers.', 'Suki’s skipped check enabled the swap but did not create the cue or supply the live weapon.'],
  },
  'owambe-envelope': {
    finalEvidence: 'The attempted POS transfer account is registered to Tunde’s lender, and the timestamp falls two minutes after he left the dance floor.',
    culpritProof: ['Femi’s footage shows Tunde moving the gift table and carrying the souvenir bag.', 'Ngozi identifies the unusually heavy bag with a false bottom.', 'The lender-linked transfer supplies a direct financial motive and confirms Tunde possessed the cash.'],
    redHerringResolutions: ['Chidi took sprayed notes to settle a vendor, not the sealed gift envelope.', 'Amaka argued about wedding costs, but her intact outfit proves the aso ebi strip was planted.'],
  },
  'nollywood-master': {
    finalEvidence: 'The dispatch order was created from Dami’s production account and includes the master drive’s serial number.',
    culpritProof: ['The temporary badge carries Dami’s old crew photograph.', 'Ini identifies Dami’s watermark on the replacement cut.', 'Emeka and the dispatch order establish that Dami physically sent the master away.'],
    redHerringResolutions: ['Ini owned another unfinished cut but did not have projection-room access.', 'Kunle abandoned the room for a selfie, creating the opening without joining the plan.'],
  },
  'detty-december-headliner': {
    finalEvidence: 'The duplicate wristband was purchased with Lola’s management card, and the artist confirms the payment protest by voice note.',
    culpritProof: ['Temi traces the scheduled cancellation to Lola’s tablet.', 'Bayo and Ejiro place Lola with the weighted laundry cart.', 'The duplicate wristband and artist’s confirmation establish a coordinated disappearance rather than an abduction.'],
    redHerringResolutions: ['Ejiro benefited from a longer set but only witnessed the cart movement.', 'Chisom’s security lapse explains how the cart passed, not who organized it.'],
  },
  'abuja-sealed-file': {
    finalEvidence: 'The retained scan metadata names Ifeanyi’s consultancy laptop and shows the file was copied during the fire drill.',
    culpritProof: ['Amina confirms Ifeanyi deliberately booked the adjoining room.', 'Maryam’s alarm log and Rita’s scan timestamp align exactly.', 'The consultancy device metadata connects Ifeanyi to both the stolen information and hidden-payment motive.'],
    redHerringResolutions: ['Segun wanted a copy for journalism, not destruction; he never entered the media room.', 'Dayo’s mistaken estimate gave him reason to delay publication, but not to shred evidence of the wider fraud.'],
  },
  'bride-never-arrived': {
    finalEvidence: 'A spa-room keycard log records Adaeze entering with the bride at 1:57 PM and leaving alone.',
    culpritProof: ['Adaeze’s blood created the frightening but misleading gele stain.', 'The spliced voice note and decoy phone turned the bride’s real escape plan into a false trail.', 'The lift, keycard and investment deadline connect Adaeze to the bride’s confinement.'],
    redHerringResolutions: ['The groom’s second family explains why the bride planned to flee, but he did not know her route.', 'Mimi stole a bracelet during the panic; that theft did not cause the disappearance.'],
  },
  'bishops-announcement': {
    finalEvidence: 'The finance folder contains the missing envelope and a sedative receipt charged to Daniel’s staff-payroll card.',
    culpritProof: ['Daniel possessed the clinic key and the payroll card used for the sedative.', 'Tayo’s unused camera angle shows him moving the Bible that covered the envelope.', 'The hidden announcement names the reformer whose audit would expose Daniel’s diverted funds.'],
    redHerringResolutions: ['Pastor Michael wanted the succession, but the wax near him was planted after he reached the pulpit.', 'The physician changed legitimate medication, but it could not produce the bishop’s symptoms without the added sedative.'],
  },
  'harvest-offering': {
    finalEvidence: 'The printer archive shows Funke created the ₦45 million sheet and paper-bag labels before the first offering was counted.',
    culpritProof: ['The original count and unpaid pledge prove ₦45 million was never present.', 'Funke alone produced the inflated sheet and staged bags in advance.', 'The invented shortfall exactly matches withdrawals routed through vendors tied to her address.'],
    redHerringResolutions: ['Chinedu stole ₦80,000, but his original sheet exposes rather than enables the larger fraud.', 'Sade exchanged a damaged bag while it was still full; she did not create the paper-filled replacements.'],
  },
  'reunion-broadcast': {
    finalEvidence: 'A voice memo from inside the store room records Jacobs demanding Tobi delete the fire evidence before he will unlock the door.',
    culpritProof: ['The old payment trail connects Jacobs to the original cover-up.', 'Damilola and Lekan place Jacobs seeking the key and leading Tobi away.', 'The store-room recording proves he detained Tobi to suppress the surviving evidence.'],
    redHerringResolutions: ['Nkiru signed the false statement as a frightened student, but preserved the original log.', 'Tobi staged the reunion broadcast and used a false identity, yet did not stage the current confinement.'],
  },
  'reading-of-will': {
    finalEvidence: 'Nnamdi’s retained copy bears the deceased’s thumbprint and divides the estate, while Chuka’s version contains the land buyer’s invented parcel.',
    culpritProof: ['Amara’s DNA proves the shocking heir is real but does not validate the presented will.', 'The forged wording comes from Chuka’s newer template.', 'The invented parcel and payment into Chuka’s account reveal why he substituted the document.'],
    redHerringResolutions: ['The delayed death report explains the apparently posthumous message; it was scheduled lawfully in advance.', 'Obinna hid a DNA result and wanted the estate, but his secret survey helps expose the land fraud.'],
  },
  'cooperative-payout': {
    finalEvidence: 'The bank’s device log places Bisi’s second phone on every duplicate withdrawal and the final ₦80 million transfer.',
    culpritProof: ['Bisi controlled beneficiary records and the recovery number shared by every false profile.', 'Toyin saw her handling the drugged flask before the chairwoman collapsed.', 'The pre-printed receipt and service-window route prove the locked-room scene was staged.'],
    redHerringResolutions: ['Sikiru’s debts made him an effective target, but his account never received the planted transfer.', 'The chairwoman borrowed improperly in the past, yet repaid it and initiated the audit that threatened Bisi.'],
  },
  'last-bus-enugu': {
    finalEvidence: 'A recovered message from Ikechukwu reads, “Skip the checkpoint; the passports and cash will make the target look guilty.”',
    culpritProof: ['The cash wrappers carry the courier contact’s prints rather than Nora’s.', 'Sunday heard Ikechukwu identify the checkpoint as the place the target must not reach.', 'The message and altered route show Ikechukwu planted evidence and arranged the interception.'],
    redHerringResolutions: ['Uche hid Nora in the goods compartment to protect her, causing the apparent disappearance.', 'Adaobi carried undeclared cash, but its wrappers and denominations differ from the planted bundle.'],
  },
  'grooms-second-ring': {
    finalEvidence: 'The pharmacy record and caterer’s payment both trace to Dele, while the marked cup is visible before the groom accidentally takes it.',
    culpritProof: ['Dele purchased the sedative and supplied the replacement flask.', 'Bisola and Kemi independently confirm his instructions concerning the marked cup.', 'The delayed land signing would give Dele time to conceal his unauthorized sale.'],
    redHerringResolutions: ['The second ring belonged to Tobi’s late mother and was intended as a gift to the bride.', 'Wale’s insurance and business argument created motive, but the policy would not pay for a temporary collapse.'],
  },
  'senators-empty-coffin': {
    finalEvidence: 'Peter produces the removed coffin weight alongside Evelyn’s message ordering him to “make security look responsible.”',
    culpritProof: ['The flight and testimony agreement prove the senator’s staged death preceded the coffin scandal.', 'Captain Musa’s weights explain how the protected exit was concealed.', 'Evelyn’s order and post-death account transfers show she exposed the coffin to frame security and protect her theft.'],
    redHerringResolutions: ['The doctor issued a false certificate under the protection arrangement, not to steal a body.', 'The governor opposed the testimony but did not control the coffin or offshore token.'],
  },
  'missing-afrobeats-star': {
    finalEvidence: 'The ransom project file on Lola’s laptop contains Kairo’s original protest video beneath a later track of demands recorded in Lola’s voice.',
    culpritProof: ['Teni and the tunnel footage establish that Kairo first left voluntarily.', 'Femi’s backup camera shows Lola following Kairo before contact stopped.', 'The altered video, early insurance amendment and rehearsal-room access prove Lola hijacked the plan.'],
    redHerringResolutions: ['The label threatened Kairo and benefited from control of the music, but did not create the ransom edit.', 'Teni helped plan a voluntary escape; she did not authorize confinement or ransom demands.'],
  },
}

const CASE_BRIEFINGS: Record<string, string[]> = {
  'blackout-ball': ['Hawthorne Manor is hosting its most important charity gala of the year. The Ashcroft Diamond is due to be presented before donors, press and invited guests.', 'At exactly 9:20 PM, the lights fail for ninety seconds. When they return, the locked display is empty and everyone is still inside. Who prepared the theft—and where is the diamond now?'],
  'last-toast': ['Friends and business partners have gathered at the Marigold Hotel for an intimate anniversary dinner. A ceremonial toast is meant to close the evening.', 'The guest of honour collapses after drinking from the only contaminated glass. Place cards were moved and the spa cabinet was opened. Who selected the victim and switched the drink?'],
  'vanishing-reel': ['The Orion Cinema is packed for the first public screening of a film expected to transform several careers. Its only complete reel is secured in the projection booth.', 'A fire alarm interrupts final preparations. When staff return, the reel case is empty and the premiere cannot begin. Who removed it, and how did it leave the cinema?'],
  'museum-after-midnight': ['Collectors and journalists are attending a private preview of the Bellweather Museum’s priceless ceremonial mask. Security has sealed the gallery for the night.', 'At midnight, the display is still locked—but the mask inside is a replica and the cameras show an uninterrupted room. Who performed the impossible exchange?'],
  'poisoned-pitch': ['Two founders are competing live for a million-naira investment capable of saving either company. Their final presentations have been checked and loaded.', 'During the decisive pitch, one deck is replaced with fabricated financial records. Was this corporate sabotage, revenge, or an attempt to expose a real lie—and who controlled the switch?'],
  'ruined-wedding': ['Hundreds of guests are seated at Rosemere Gardens as the couple prepares to exchange vows. Music, photographs and private messages are queued on the venue tablet.', 'All three are suddenly replaced by files exposing the couple’s secrets. Someone wanted the marriage stopped publicly. Who prepared the humiliation and gained access to the ceremony system?'],
  'missing-violinist': ['The Grand Lyric Hall is sold out for a celebrated violinist’s most important performance. Ten minutes before curtain, the dressing room is locked from inside.', 'When it is opened, the violinist is gone but the priceless instrument remains. Did someone remove them—or did the performer have help disappearing?'],
  'empty-cabin': ['A famous author boards an overnight mountain train carrying the only manuscript of a dangerous new book. By morning, their cabin is locked and silent.', 'The cabin is opened to reveal the manuscript but no author, while every exterior alarm remained armed. Who engineered the locked-room disappearance, and was the author a willing participant?'],
  'vanished-chef': ['The final of a televised cooking competition is minutes from judging when its most feared judge asks to meet someone near the pantry.', 'The judge disappears, a coded recipe burns in an oven and the pantry appears empty. Who removed the judge, and what recording were they desperate to recover?'],
  'midnight-express': ['A diplomatic agreement capable of preventing an international crisis is being carried aboard a luxury sleeper train under close protection.', 'After a staged medical emergency, one signed page is missing from the locked briefcase. Every passenger has a reason to want it. Who used the confusion to make the exchange?'],
  'lighthouse-signal': ['A cargo vessel approaches an isolated coast during the worst storm of the season. The lighthouse generator is working and the crew depends on its warning beam.', 'The beacon suddenly goes dark, three flashes point toward the beach and the emergency radio is smashed. Was this attempted destruction—or a carefully planned grounding?'],
  'final-curtain': ['Opening night has drawn a full house to a controversial play whose final scene uses a checked and harmless antique prop.', 'An unscheduled blackout interrupts the performance. When the actor fires, a live round narrowly misses the lead. Who replaced the prop, and what did closing the play protect?'],
  'phone-that-could-ruin-everyone': ['A famous creator has invited friends, rivals and business partners to a private birthday weekend—and announced that one phone contains recordings capable of ending several careers.', 'The phone disappears, then its files begin uploading in a different order from the creator’s plan. Who stole it, and who is now choosing which lives to destroy?'],
  'vanished-crypto-wallet': ['The founders of a valuable startup gather at a remote retreat to approve an acquisition that could make everyone wealthy or cost them control of their company.', 'Their hardware wallet vanishes, a founder is found unconscious and a multimillion transfer begins without the device. Was the wallet duplicated, bypassed or merely used as a distraction?'],
  'engagement-ring-came-back': ['Two influential families gather for a rooftop engagement party centred on a celebrated heirloom diamond and the marriage it is meant to represent.', 'The ring disappears and returns inside a locked handbag with a fake stone. Who planted it there—and when was the real diamond actually taken?'],
  'deepfake-confession': ['Investors, press and patients are watching the live launch of a health platform expected to become a billion-dollar company.', 'Every screen suddenly shows the founder confessing to fraud. The video is synthetic, but some details are true. Who built the lie, and which secret was it designed to conceal?'],
  'cancelled-at-midnight': ['A film star reaches the most important premiere of their career while a global publicity campaign and an expensive studio contract hang on their public reputation.', 'At midnight, genuine private messages appear online with altered dates and recipients. Who manufactured the scandal—and why was the replacement actor ready before it happened?'],
  'final-interview': ['Four candidates enter the final interview for an executive role with access to sensitive technology, internal complaints and enormous influence.', 'Confidential files appear inside one candidate’s presentation even though their laptop never downloaded them. Who framed the candidate, and what warning was hidden inside the recruitment process?'],
  'guest-never-checked-out': ['A traveller rents a luxury smart apartment while secretly investigating complaints that previous guests were watched and impersonated.', 'The guest vanishes from a room with no recorded exit while their phone keeps sending messages. Did the building help them escape—or help somebody create a false timeline?'],
  'last-seen-217': ['After an intimate house party, one guest prepares to expose a relationship, confront missing business money and leave the country before anyone can stop them.', 'By morning they are gone, their account is frozen at 2:17 AM and scheduled messages keep arriving. Which messages are genuine, and who continued the story after the disappearance?'],
  'live-after-vanished': ['A lifestyle creator promises a revealing livestream during a launch party already strained by financial disputes, sponsorship pressure and a secret relationship.', 'She vanishes before broadcast but later appears online answering questions. How much was prerecorded—and who is speaking through her after she stopped cooperating?'],
  'smart-home-lockdown': ['An exclusive dinner inside an experimental smart home is meant to prove that luxury automation can make its wealthy owner completely secure.', 'The home seals every exit and fills one room with smoke—but the wrong guest is trapped inside. Who controlled the house, and who was meant to enter that room?'],
  'wrong-person-drank-it': ['Friends and business partners gather to celebrate a deal that will change control of their company immediately after dinner.', 'One guest collapses after drinking from somebody else’s glass, while two people admit ordering separate drink swaps. Who intended a prank, who intended harm and who was the true target?'],
  'crash-already-online': ['A celebrity prepares to launch a global campaign while privately planning a harmless staged breakdown that will help them escape an exploitative contract.', 'The real car crashes—and photographs of the damaged vehicle were already online. Who knew about the performance, and who transformed it into a genuine attack?'],
  'bride-never-arrived': ['More than four hundred guests are seated, the livestream is running and both families are waiting for the bride’s entrance. The marriage will also activate a crucial family investment.', 'Security opens the locked bridal suite to find the dress, a smashed phone and blood on a gele—but no bride. Did she escape, was she abducted, or did someone weaponise her private plan?'],
  'bishops-announcement': ['A televised church anniversary will end with the presiding bishop naming the person who will inherit leadership of the ministry. Ambition, family influence and millions in church funds are at stake.', 'The bishop collapses before speaking and the sealed announcement disappears. He will recover, so who needed him silent—and what would the new leader uncover?'],
  'harvest-offering': ['During the church’s largest anniversary celebration, members, politicians and business leaders make public donations toward a community centre. The pastor announces a record ₦45 million offering.', 'When bank officials arrive, the sealed deposit bags contain cut paper. The room stayed locked and every counter was searched. Who stole the offering—or did ₦45 million ever exist?'],
  'reunion-broadcast': ['An elite secondary-school class gathers for its first major reunion in fifteen years, determined to celebrate old friendships and successful careers.', 'The screens instead accuse the former head girl of covering up a student’s disappearance. Then the person who scheduled the video also vanishes. What happened fifteen years ago—and what happened tonight?'],
  'reading-of-will': ['After a wealthy patriarch’s burial, his family gathers in Anambra expecting a difficult but familiar division of property and ancestral land.', 'The sealed will leaves everything to a stranger, while a voice note recorded after the supposed death warns that the document is false. Is the heir fraudulent, the will forged, or the death timeline itself a lie?'],
  'cooperative-payout': ['For years, market traders have contributed to a cooperative fund now worth ₦80 million. Payout day is meant to reward a lifetime of discipline and trust.', 'The account is emptied and the chairwoman is found unconscious in a locked office holding another member’s receipt. Who attacked her, and how long has the fund been disappearing?'],
  'last-bus-enugu': ['An overnight Christmas bus leaves Lagos packed with travellers, gifts and private reasons for getting home. One passenger is unusually protective of their luggage.', 'After a roadside stop, that passenger vanishes while ₦20 million, three passports and another traveller’s photograph remain behind. Did they flee, were they taken, or are they still on the bus?'],
  'grooms-second-ring': ['Two families gather in Ibadan for a traditional introduction that will unite a couple, their businesses and a disputed parcel of family land.', 'The groom collapses after drinking from the bride’s father’s cup, and a ring bearing another woman’s name is found in his pocket. Who was the intended target—and is the ring evidence of betrayal?'],
  'senators-empty-coffin': ['A prominent senator’s hometown fills with mourners, political allies and television crews for a state burial conducted under tight security.', 'The coffin is opened and found empty as the senator’s son produces a voice note recorded after the official death. Was the body stolen, or was the entire death constructed for another purpose?'],
  'missing-afrobeats-star': ['A sold-out stadium waits for Nigeria’s biggest music star while a contract dispute threatens the tour behind the scenes.', 'Minutes before showtime, the artist disappears and a ransom video appears in clothing from their own wardrobe. Is this a kidnapping, a publicity stunt, or someone hijacking the artist’s escape plan?'],
}

const ACTIVE_MYSTERY_BASE = [...MODERN_MYSTERIES, ...NAIJA_MYSTERIES]

const BASE_MINI_MYSTERIES: MiniMysteryCase[] = ACTIVE_MYSTERY_BASE.map(mystery => {
  const enhancement = MYSTERY_ENHANCEMENTS[mystery.id] ?? MODERN_MYSTERY_ENHANCEMENTS[mystery.id]
  const culprit = mystery.roles.find(role => role.guilty)
  if (!enhancement || !culprit?.guiltyPlan) throw new Error(`Mini Mystery audit data is missing for ${mystery.id}`)
  return {
    ...mystery,
    briefing: CASE_BRIEFINGS[mystery.id] ?? [`Everyone has gathered at ${mystery.setting.toLowerCase()}, where private ambitions and unresolved tensions sit beneath an important public moment.`, `${mystery.incident} The players must reconstruct the competing schemes and answer one question: who turned the situation into a crime?`],
    evidence: [...mystery.evidence, enhancement.finalEvidence],
    culpritProof: enhancement.culpritProof,
    redHerringResolutions: enhancement.redHerringResolutions,
    finalReveal: {
      what: mystery.solutionBeats.join(' '),
      how: culprit.guiltyPlan,
      why: mystery.motive,
    },
  }
})

const REMIX_MYSTERIES: MiniMysteryCase[] = MYSTERY_VARIANT_SEEDS.map(seed => {
  const base = BASE_MINI_MYSTERIES.find(mystery => mystery.id === seed.baseId)
  if (!base) throw new Error(`Mini Mystery remix base is missing for ${seed.baseId}`)
  const culprit = base.roles.find(role => role.name === seed.culpritName)
  const originalCulprit = base.roles.find(role => role.guilty)
  if (!culprit || !originalCulprit) throw new Error(`Mini Mystery remix culprit is missing for ${seed.baseId}`)
  const evidence = [
    base.evidence[0],
    `A recovered account confirms this detail: ${culprit.clue}`,
    `Investigators learn that ${culprit.name} concealed something important: ${culprit.secret}`,
    seed.finalEvidence,
  ]
  const remixedRoles = base.roles.map(role => ({ ...role, guilty: role.name === seed.culpritName || undefined, guiltyPlan: role.name === seed.culpritName ? seed.guiltyPlan : undefined }))
  const guiltyRole = remixedRoles.find(role => role.guilty)!
  return {
    ...base,
    id: `${base.id}--remix`,
    evidence,
    motive: seed.motive,
    solutionBeats: [`The original evidence against ${originalCulprit.name} explains a separate secret, not the central crime.`, `${culprit.name} used their existing access and private knowledge to redirect the investigation.`, seed.guiltyPlan],
    culpritProof: [`${culprit.name} possessed the knowledge or access described in their private clue.`, `Their concealed secret supplies a credible motive: ${culprit.secret}`, seed.finalEvidence],
    redHerringResolutions: [`${originalCulprit.name} concealed suspicious behaviour, but the remix evidence disconnects it from the final method.`, base.redHerringResolutions[0]],
    finalReveal: { what: `The apparent case against ${originalCulprit.name} concealed a second scheme. ${culprit.name} exploited the same incident and redirected the evidence to make the original suspect appear guilty.`, how: seed.guiltyPlan, why: seed.motive },
    // Multiplayer deliberately assigns role slot zero to the culprit.
    roles: [guiltyRole, ...remixedRoles.filter(role => !role.guilty)],
  }
})

export const MINI_MYSTERIES = BASE_MINI_MYSTERIES
export const ALL_MINI_MYSTERIES = [...BASE_MINI_MYSTERIES, ...REMIX_MYSTERIES]
export const findMiniMystery = (id: string) => ALL_MINI_MYSTERIES.find(mystery => mystery.id === id)
export const miniMysteryBaseId = (id: string) => id.replace(/--remix$/, '')
export function isMiniMysterySolved(id: string) {
  return typeof window !== 'undefined' && window.localStorage.getItem(`decked:mini-mystery:solved:${miniMysteryBaseId(id)}`) === '1'
}
export function markMiniMysterySolved(id: string) {
  if (typeof window !== 'undefined') window.localStorage.setItem(`decked:mini-mystery:solved:${miniMysteryBaseId(id)}`, '1')
}
export function chooseMiniMysteryVariant(baseId: string): MiniMysteryCase {
  baseId = miniMysteryBaseId(baseId)
  const choices = ALL_MINI_MYSTERIES.filter(mystery => mystery.id === baseId || mystery.id.startsWith(`${baseId}--`))
  if (choices.length < 2 || typeof window === 'undefined') return choices[0] ?? BASE_MINI_MYSTERIES[0]
  const key = `decked:mini-mystery:variant:${baseId}`
  const previous = window.localStorage.getItem(key)
  const available = choices.filter(choice => choice.id !== previous)
  const random = new Uint32Array(1); crypto.getRandomValues(random)
  const selected = available[random[0] % available.length]
  window.localStorage.setItem(key, selected.id)
  return selected
}

export function evidenceForRound(mystery: MiniMysteryCase, round: number, totalRounds: number): string[] {
  if (totalRounds === 2) return round === 1 ? mystery.evidence.slice(0, 2) : mystery.evidence.slice(2, 4)
  if (totalRounds === 3) return round < 3 ? [mystery.evidence[round - 1]] : mystery.evidence.slice(2, 4)
  return [mystery.evidence[Math.min(round - 1, mystery.evidence.length - 1)]]
}
