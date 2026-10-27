export type BadAdviceCategory = "dating" | "friends" | "work" | "everyday" | "naija" | "wild"

export interface BadAdviceSituation {
  id: string
  category: BadAdviceCategory
  intensity: string
  situation: string
}

export const BAD_ADVICE_CATEGORIES = [
  {
    "id": "dating",
    "label": "Love & Dating"
  },
  {
    "id": "friends",
    "label": "Friends & Betrayal"
  },
  {
    "id": "work",
    "label": "Work & Money"
  },
  {
    "id": "everyday",
    "label": "Public Embarrassment"
  },
  {
    "id": "naija",
    "label": "Family Drama"
  },
  {
    "id": "wild",
    "label": "Absolute Chaos"
  }
] as const

export const BAD_ADVICE_SITUATIONS: readonly BadAdviceSituation[] = [
  {
    "id": "610f9db1-2104-51fd-a668-b95d56941442",
    "category": "everyday",
    "intensity": "mild",
    "situation": "You ordered a congratulations cake for your friend. The bakery printed 'GOOD LUCK WITH THE DIVORCE' across it, and the delivery person is already at your friend's door asking for a speech."
  },
  {
    "id": "24aada30-3e26-570a-bc63-59ffed803f73",
    "category": "everyday",
    "intensity": "mild",
    "situation": "You enter the wrong meeting room, introduce yourself as the guest speaker, and discover it is a surprise retirement party."
  },
  {
    "id": "2621d37e-1b20-5e09-9fa4-da4359761e99",
    "category": "everyday",
    "intensity": "mild",
    "situation": "You clap halfway through a magician's trick, and the magician mistakes you for the volunteer. They hand you a sealed envelope and tell the audience you know what happens next."
  },
  {
    "id": "391448e4-8dce-58ff-9672-291e4f709727",
    "category": "everyday",
    "intensity": "mild",
    "situation": "You trip on a perfectly flat floor, then pretend you stopped to inspect it. Someone asks what you found."
  },
  {
    "id": "427eecef-1299-5a07-a3c3-030d1a1e124d",
    "category": "everyday",
    "intensity": "mild",
    "situation": "You wander onto a film set and sit inside a parked car that looks exactly like your ride. The director shouts 'Action,' and the actor in the driver's seat asks you to improvise the next line."
  },
  {
    "id": "9fc0a8dd-ee60-54b0-96cc-43f82ee445c0",
    "category": "everyday",
    "intensity": "mild",
    "situation": "You accidentally start a clap rhythm at a wedding, and half the guests think it's the signal to change tables. The seating plan is collapsing, and the event coordinator wants you to restore order."
  },
  {
    "id": "4aa58740-c3c7-58a2-aebc-c72a50984d54",
    "category": "everyday",
    "intensity": "mild",
    "situation": "You confidently sing the wrong lyrics at karaoke. The songwriter is in the audience, and the host invites you to perform the next verse as a duet."
  },
  {
    "id": "51b7f2b5-e7ad-519c-9edc-696c492dfd65",
    "category": "everyday",
    "intensity": "mild",
    "situation": "Your umbrella turns inside out in heavy rain, and a stranger offers to buy it because they think it is modern art."
  },
  {
    "id": "528c44b3-3cb2-547c-98e5-8f505c69749b",
    "category": "everyday",
    "intensity": "mild",
    "situation": "You confidently direct someone to a café, then realise you sent them to its old address. They send you a photo of an empty shop."
  },
  {
    "id": "54a2794c-6136-5377-8768-fc5b8f329b69",
    "category": "everyday",
    "intensity": "mild",
    "situation": "You fiercely defend your place in a queue, then discover it's registration for a public talent show. The organiser has already written your name on the competition bracket, and your friends are debating what talent you supposedly have."
  },
  {
    "id": "fff40a0d-96c1-5a91-a080-63f797d60639",
    "category": "everyday",
    "intensity": "messy",
    "situation": "You spend an entire networking event interviewing someone you think is the guest of honour. They finally explain they are the photographer."
  },
  {
    "id": "5ea9a214-507a-5fca-b6a2-c0c611d2acd2",
    "category": "everyday",
    "intensity": "messy",
    "situation": "You settle into a reserved train seat and unpack a full meal before its owner arrives."
  },
  {
    "id": "60509799-1633-5fbf-b869-8e2c5d4d8dc4",
    "category": "everyday",
    "intensity": "messy",
    "situation": "You politely call a chef's mysterious new dip 'interesting.' The chef announces that you're the guest judge for tomorrow's televised tasting and asks you to name its best feature."
  },
  {
    "id": "5af0833d-7aa9-516a-a3c1-91d6e5e10675",
    "category": "everyday",
    "intensity": "messy",
    "situation": "Your neighbour hangs the hand-painted welcome sign you made for your own front door outside their flat. Now every delivery goes to them, and they've invited you over to admire the sign."
  },
  {
    "id": "614c01d6-f2fd-5c73-bf2a-6b3f2f1a9e1e",
    "category": "everyday",
    "intensity": "messy",
    "situation": "Your card declines after you loudly insist on paying for the whole table."
  },
  {
    "id": "762c496a-f638-5142-b06d-c0080d9beebf",
    "category": "everyday",
    "intensity": "messy",
    "situation": "You post a complaint meant for your close friends as a public story and the person involved is first to view it."
  },
  {
    "id": "8387b5e7-cfde-5a03-b94b-947a71b6c65f",
    "category": "everyday",
    "intensity": "messy",
    "situation": "You fall asleep on a stranger’s shoulder during a journey, and wake up holding their snack."
  },
  {
    "id": "86718fac-aef6-5f35-b4d2-f95d27ef9d2c",
    "category": "everyday",
    "intensity": "messy",
    "situation": "Your microphone stays on while you describe the meeting you are currently attending."
  },
  {
    "id": "910eb8e2-bf5e-5928-9e9b-067b64531058",
    "category": "everyday",
    "intensity": "messy",
    "situation": "You join a conversation because you think you heard your name. Everyone asks you to settle an argument about a wedding you never attended."
  },
  {
    "id": "bbae7514-dee1-58c0-b889-61fa45e83871",
    "category": "everyday",
    "intensity": "messy",
    "situation": "Your family mistakes a joke audition video for an actual talent-show application. They've printed matching shirts and invited twenty relatives to watch your performance, which doesn't exist."
  },
  {
    "id": "1ecd8a3c-6a6b-5be7-8d86-aadff58b87b1",
    "category": "everyday",
    "intensity": "unhinged",
    "situation": "You confidently tell visitors at a museum that you're an art expert. One visitor brings you a very strange painting and insists you identify its subject before they'll donate it to the museum."
  },
  {
    "id": "16a9d383-b28b-5d13-9dc4-6f80d85d5050",
    "category": "everyday",
    "intensity": "unhinged",
    "situation": "You turn up to a costume party dressed for the wrong theme. Everyone else came as vegetables; you are dressed as a pirate."
  },
  {
    "id": "bde472ab-3324-5382-87ce-da5a05cf4869",
    "category": "everyday",
    "intensity": "unhinged",
    "situation": "Your trousers rip while dancing, but stopping now would draw more attention than continuing."
  },
  {
    "id": "c60142aa-f1d1-5a1a-9a4f-5a3e07466376",
    "category": "everyday",
    "intensity": "unhinged",
    "situation": "The music drowns out somebody’s name when they introduce themselves. Five minutes later, they ask you to introduce them to your friend."
  },
  {
    "id": "1c31f720-45c0-57de-b094-00adf20c66d2",
    "category": "everyday",
    "intensity": "unhinged",
    "situation": "You accidentally register your best friend for a charity fun-run instead of yourself. The organisers print their face on a giant poster labelled 'LOCAL RUNNING LEGEND,' and your friend thinks you did it deliberately."
  },
  {
    "id": "b6cab383-7847-580c-bdfb-5bf01284e22f",
    "category": "everyday",
    "intensity": "unhinged",
    "situation": "You baked the birthday cake, but everyone gives a standing ovation to the person who merely carried it into the room."
  },
  {
    "id": "0049433e-1e07-5b5d-8a19-29e805a10b64",
    "category": "everyday",
    "intensity": "unhinged",
    "situation": "Your video call freezes on the most theatrical expression you have ever made. Everyone assumes you are reacting to the manager’s announcement."
  },
  {
    "id": "0dc7f8b9-1e5e-5b8b-97ad-73e4b5373f28",
    "category": "everyday",
    "intensity": "unhinged",
    "situation": "You order seven groceries online. All seven arrive as cucumbers, and customer support asks whether you would like to reorder the same basket."
  },
  {
    "id": "6e36105f-a5db-58fc-a0d9-8d30ef466276",
    "category": "everyday",
    "intensity": "unhinged",
    "situation": "Your pottery instructor selects your lopsided bowl as the class mascot. A local gallery now wants twelve identical copies for an exhibition, and the instructor has volunteered you to make them."
  },
  {
    "id": "82ee83de-d1ec-5400-8b62-6871aedc6a45",
    "category": "everyday",
    "intensity": "unhinged",
    "situation": "You complain that your neighbourhood café never remembers your name. The staff paint a giant misspelled version of it on their loyalty wall, and the opening-day flyers have already gone to print."
  },
  {
    "id": "00601e4c-97ab-5da6-8f02-3307e20bdd59",
    "category": "friends",
    "intensity": "mild",
    "situation": "A friend reveals your secret as a funny story and only realises halfway through that nobody else knew."
  },
  {
    "id": "0480f596-7a18-5cb7-9a9f-9bf612c7b95e",
    "category": "friends",
    "intensity": "mild",
    "situation": "Your best friend and your sibling create a group chat called 'Planning Your Life' without you. They accidentally add you just as they vote on your next birthday theme."
  },
  {
    "id": "07c360bd-7c29-5aa1-aaf3-ed66afd636f0",
    "category": "friends",
    "intensity": "mild",
    "situation": "Your friend volunteers your home for a party because “you have the nicest chairs.” Invitations are already circulating."
  },
  {
    "id": "0fca81f7-ca7f-5c9f-9717-192ab0e11803",
    "category": "friends",
    "intensity": "mild",
    "situation": "A friend adds two strangers to a private weekend trip after everyone has already paid for rooms."
  },
  {
    "id": "250fadf5-2c71-526d-a14c-3b3d743e74d7",
    "category": "friends",
    "intensity": "mild",
    "situation": "Your friend asks for honest feedback on a logo they have already printed on five hundred shirts."
  },
  {
    "id": "2a622971-ba7b-5dca-a8ad-9cce3e3d4ee7",
    "category": "friends",
    "intensity": "mild",
    "situation": "A friend screenshots your sarcastic group-chat message without its punchline. The rest of the group now believes you announced your engagement."
  },
  {
    "id": "2dd18975-ce0c-5911-9cec-aad583710195",
    "category": "friends",
    "intensity": "mild",
    "situation": "Two friends arguing over who ruined game night each send you a five-slide presentation proving the other person is responsible."
  },
  {
    "id": "348dfa7a-5765-5e84-be42-2e5cadd4ed25",
    "category": "friends",
    "intensity": "mild",
    "situation": "After forty minutes choosing a restaurant, the one friend who said “anywhere is fine” reveals they once got banned from the winning venue."
  },
  {
    "id": "83aa4bfb-1769-5908-a2cf-a67da81e99be",
    "category": "friends",
    "intensity": "mild",
    "situation": "Your friends make you keeper of the group's shared calendar. Someone adds 'International Day of Apologising to Me' under your name, and thirty people have already accepted the invitation."
  },
  {
    "id": "3976c131-feee-51a5-97d0-fdf0f8f838f9",
    "category": "friends",
    "intensity": "mild",
    "situation": "Your best friend copies your birthday theme, venue, and outfit, then schedules their party the weekend before yours."
  },
  {
    "id": "3f413b95-20d8-5efc-a853-cdbcd96ebf8a",
    "category": "friends",
    "intensity": "messy",
    "situation": "Your friend keeps correcting your favourite story even though they weren't there. A podcast now wants both of you to tell the 'definitive version' together in a live recording tomorrow."
  },
  {
    "id": "4c2b8160-dff3-55c9-b3b2-a7d612831d55",
    "category": "friends",
    "intensity": "messy",
    "situation": "Nobody admits changing the group-chat name to “People I Tolerate,” and everyone suspects you."
  },
  {
    "id": "5ffc3776-00fb-528d-9e5d-ee0bf1ce8583",
    "category": "friends",
    "intensity": "messy",
    "situation": "You forget to add a friend to your trivia team. They join the opposing team and announce they know all your weaknesses."
  },
  {
    "id": "63e55a2f-25ba-527f-96e8-29e95c285157",
    "category": "friends",
    "intensity": "messy",
    "situation": "A friend invites themselves to your weekend away and has already requested annual leave."
  },
  {
    "id": "64b9adc3-be82-54d2-8025-c83b9a70111e",
    "category": "friends",
    "intensity": "messy",
    "situation": "A friend owes you ₦50,000 and has just invited you to celebrate their new designer shoes."
  },
  {
    "id": "6a564357-7f81-5de4-b11d-b6f844e10f24",
    "category": "friends",
    "intensity": "messy",
    "situation": "The friend organising your holiday has made a fourteen-tab spreadsheet and scheduled “mandatory spontaneity.”"
  },
  {
    "id": "aa407632-75bd-512a-88a2-05dacb432687",
    "category": "friends",
    "intensity": "messy",
    "situation": "Your friend asks you to give a toast at their birthday party, then hands you a list of forty-six forbidden topics about their own life."
  },
  {
    "id": "4d753b47-5d30-5846-8b1b-11b6c856bb71",
    "category": "friends",
    "intensity": "messy",
    "situation": "Your housemate creates a 'fridge loyalty programme' and starts charging points for using the top shelf. They give you a bill for last week's leftovers and ask whether you'd like to upgrade to premium access."
  },
  {
    "id": "78317d64-c184-5d02-93a0-6e3e7755ed97",
    "category": "friends",
    "intensity": "messy",
    "situation": "Your friend starts a podcast about your friendship and uses the first episode to review your personality without telling you."
  },
  {
    "id": "a0beff66-3cd9-525c-9dd7-5216bee51c3d",
    "category": "friends",
    "intensity": "messy",
    "situation": "Your friend asks you to cover for why they missed game night but refuses to tell you where they went. Their excuse must be delivered in person."
  },
  {
    "id": "a0fcc86f-63db-58af-a344-a332e3367b3e",
    "category": "friends",
    "intensity": "unhinged",
    "situation": "Your friend sends a twenty-minute voice note, then asks why you have not replied two minutes later."
  },
  {
    "id": "a6157609-0081-58ba-ad0e-38f9da702f63",
    "category": "friends",
    "intensity": "unhinged",
    "situation": "Your friend posts a birthday carousel of ten photos from your party. Nine are selfies of them; the tenth is the back of your head."
  },
  {
    "id": "a7014aa0-a6ca-5920-b1db-13ac7988c055",
    "category": "friends",
    "intensity": "unhinged",
    "situation": "A friend brings their new partner to every plan, including the private conversation you arranged about that partner."
  },
  {
    "id": "a90b0539-1613-5af0-bab9-118ebe6de4c4",
    "category": "friends",
    "intensity": "unhinged",
    "situation": "A friend returns the outfit they borrowed with a stain and a confident claim that it was always there."
  },
  {
    "id": "d5994100-5408-5ba0-b25e-46b04bd51b15",
    "category": "friends",
    "intensity": "unhinged",
    "situation": "Your friend insists on controlling the music for your road trip and arrives with a twelve-hour playlist containing only their own voice notes."
  },
  {
    "id": "bf94db62-09b5-5e75-b074-41820e1c0847",
    "category": "friends",
    "intensity": "unhinged",
    "situation": "Your friends run a mock election to decide the group's next holiday destination. You win the role of 'Minister of Vibes' by accident, and now everyone expects you to deliver an actual campaign promise."
  },
  {
    "id": "bb2301c2-97cc-5018-b3ff-d2bf5cc84207",
    "category": "friends",
    "intensity": "unhinged",
    "situation": "Your friend is ninety minutes late and arrives annoyed that you started eating without them."
  },
  {
    "id": "bc55a06c-7c25-56e9-bd74-5ea516a04408",
    "category": "friends",
    "intensity": "unhinged",
    "situation": "A friend announces they are moving in with you because you once said, “You can always stay here.”"
  },
  {
    "id": "c9afe2ce-743c-5179-b847-2c8d4153255e",
    "category": "friends",
    "intensity": "unhinged",
    "situation": "A friend borrowed your charger six months ago and now corrects you when you call it yours."
  },
  {
    "id": "ed28bfa0-0463-52bb-96cd-4e0671d9bf62",
    "category": "friends",
    "intensity": "unhinged",
    "situation": "Your housemate has eaten the meal you labelled for tomorrow and replaced it with half a cucumber."
  },
  {
    "id": "0b33ceeb-9d4c-5704-886a-9da0fcc1c891",
    "category": "dating",
    "intensity": "mild",
    "situation": "A romantic picnic is interrupted by heavy rain, and the only shelter is the tiny playhouse in a children’s park."
  },
  {
    "id": "5feb4f9b-dab4-51c5-9b85-36a2f30ff87c",
    "category": "dating",
    "intensity": "mild",
    "situation": "Your partner unveils a giant anniversary portrait of both of you. Everyone agrees it looks like two completely different people."
  },
  {
    "id": "0eeedd9f-6b68-54d4-ad39-ebab42890971",
    "category": "dating",
    "intensity": "mild",
    "situation": "Your partner gives you a thoughtful anniversary gift. You have remembered the date but bought absolutely nothing."
  },
  {
    "id": "1145f4c9-367f-501f-8449-a8ae89065eab",
    "category": "dating",
    "intensity": "mild",
    "situation": "Your date's dog refuses to leave the seat between you. Your date says the dog gets the deciding vote on second dates and hands you a squeaky toy to make your case."
  },
  {
    "id": "fdafc5da-6399-50c4-b50a-8a04c34066b3",
    "category": "dating",
    "intensity": "mild",
    "situation": "Your date says they believe in taking things slowly, then pulls out a colour-coded presentation called “Our First Five Anniversaries.”"
  },
  {
    "id": "1f55c8cc-6044-5034-9aac-88ae21b9feac",
    "category": "dating",
    "intensity": "mild",
    "situation": "Your partner loves their dramatic new haircut and has booked matching portraits for today. The photographer asks you to describe the look in one word for the caption, while your partner listens."
  },
  {
    "id": "296f2bc0-e096-5d4b-be26-3ff58f2973e6",
    "category": "dating",
    "intensity": "mild",
    "situation": "Your new partner uses the same pet name your ex used, and you react before you can hide it."
  },
  {
    "id": "323de0d1-3fde-5d71-a1ad-ebb28ab19273",
    "category": "dating",
    "intensity": "mild",
    "situation": "A flirty message meant for your crush lands in the family group chat, and your aunt replies with edits."
  },
  {
    "id": "1425798c-e68e-5844-a565-6d20f4200b6c",
    "category": "dating",
    "intensity": "mild",
    "situation": "You create a playlist for your crush and accidentally make it public with the title “Songs To Make Them Fall In Love With Me.” They follow it."
  },
  {
    "id": "43e62cdb-e092-5908-b7a2-c1c89b3dff44",
    "category": "dating",
    "intensity": "mild",
    "situation": "Your date suggests splitting the bill, then calculates that you ate three more chips than they did."
  },
  {
    "id": "49391121-e24c-5c08-8853-00d76d43dbc3",
    "category": "dating",
    "intensity": "messy",
    "situation": "Your crush introduces you as “the sibling I never had” five minutes before asking for dating advice."
  },
  {
    "id": "f758c198-fbcb-5efe-81c6-85d0e4132e1d",
    "category": "dating",
    "intensity": "messy",
    "situation": "At an awards dinner, your partner introduces you to everyone as 'my plus-one.' Halfway through, the host announces you are the surprise guest of honour and asks your partner to introduce you on stage."
  },
  {
    "id": "536fc4e3-fb5c-5692-96b0-e55555a3018d",
    "category": "dating",
    "intensity": "messy",
    "situation": "Your date looks nothing like their profile photos but immediately complains that your shoes were different online."
  },
  {
    "id": "5483f34a-86a2-5dc9-a899-f5a9ecf1d5e6",
    "category": "dating",
    "intensity": "messy",
    "situation": "Your date orders for you without asking and confidently chooses the one thing you cannot stand."
  },
  {
    "id": "b356054b-51ec-5819-bbcc-6545bc4b5964",
    "category": "dating",
    "intensity": "messy",
    "situation": "You discover that your new crush is the anonymous neighbour you've been arguing with in the building group chat for weeks. They've invited you to the next residents' meeting to finally settle the dispute."
  },
  {
    "id": "5c71e16a-ecd8-55f4-adcb-9a219e41b3ce",
    "category": "dating",
    "intensity": "messy",
    "situation": "Your partner invents a couple nickname that sounds like a cleaning product and has it embroidered on matching jackets. They want you to wear yours to meet your closest friends tonight."
  },
  {
    "id": "53f90e44-2218-5341-bc01-2207e8817806",
    "category": "dating",
    "intensity": "messy",
    "situation": "Your date tells the restaurant that it's your birthday to get a free dessert. A staff member arrives with a giant candle, and someone you work with is seated at the next table."
  },
  {
    "id": "8052f464-0d52-5e65-81e5-56b69206973d",
    "category": "dating",
    "intensity": "messy",
    "situation": "You discover your date has been live-reviewing the evening in a private chat, but they accidentally send the latest review to you."
  },
  {
    "id": "881d7074-8142-548c-b65f-7e46e988eaca",
    "category": "dating",
    "intensity": "messy",
    "situation": "You said you were an excellent cook. Your date has arrived early and can see the takeaway containers you were hiding."
  },
  {
    "id": "9439e712-2ef2-5803-831b-a29bedff257e",
    "category": "dating",
    "intensity": "messy",
    "situation": "A promising first date is going well until you discover you have both brought the same ex as your funniest dating story."
  },
  {
    "id": "a0d81ded-1433-5d8c-adca-05bbd8ad71b2",
    "category": "dating",
    "intensity": "unhinged",
    "situation": "Your partner texts “We need to talk,” then sends a calendar invitation titled “Relationship Performance Review” for next Thursday."
  },
  {
    "id": "adeed93b-46fa-5971-8ac3-0e5a4ba0961e",
    "category": "dating",
    "intensity": "unhinged",
    "situation": "Your crush replies 'that's so sweet' to your unmistakable confession, then asks you to help rewrite their dating profile because 'you understand me better than anyone.' Their first date is tonight."
  },
  {
    "id": "b68b48f8-2bc9-5596-8a4a-b817d68ca0eb",
    "category": "dating",
    "intensity": "unhinged",
    "situation": "Your date brings a close friend along “for safety,” and the friend keeps scoring your answers out of ten."
  },
  {
    "id": "b29cc40d-65b9-53a8-aeb3-5dcccdac784f",
    "category": "dating",
    "intensity": "unhinged",
    "situation": "You've been texting someone for weeks and arrange to meet at a masked costume party. Three people arrive claiming to be your date, and all three know the private joke from your messages."
  },
  {
    "id": "cc849e93-f2c2-57ab-ab86-be9e212f3dea",
    "category": "dating",
    "intensity": "unhinged",
    "situation": "You promised a quiet night in. Your partner arrives with twelve friends and calls it an intimate gathering."
  },
  {
    "id": "d578839e-97b4-5b8e-a179-125a84ceaee0",
    "category": "dating",
    "intensity": "unhinged",
    "situation": "You agree to a blind date and discover the matchmaker also booked a table beside you to monitor the chemistry."
  },
  {
    "id": "f56df524-d519-55da-b78c-458f04045a6c",
    "category": "dating",
    "intensity": "unhinged",
    "situation": "Two people you have been casually dating arrive at the same trivia night and both save you a seat."
  },
  {
    "id": "f79c6f7a-1ce5-5699-8aa2-124b3f8062f8",
    "category": "dating",
    "intensity": "unhinged",
    "situation": "You have been calling your date “Sam” for an hour. Their name is Alex, and they have finally corrected you."
  },
  {
    "id": "fce21516-d6e9-5652-af91-88f21ec4452e",
    "category": "dating",
    "intensity": "unhinged",
    "situation": "Your crush correctly guesses that you like them but assumes you're joking. They suggest pretending you're a couple as a prank at tonight's game night, and everyone else is already in on the plan."
  },
  {
    "id": "adae2c89-4166-52d8-992e-b5264350f3de",
    "category": "dating",
    "intensity": "unhinged",
    "situation": "At dinner with your partner's parents, they mistake you for the caterer and ask you to give an honest review of the food. Your partner has heard everything and still hasn't corrected them."
  },
  {
    "id": "023520c5-45d4-5970-8b61-d44aa20efb36",
    "category": "work",
    "intensity": "mild",
    "situation": "You accepted two meetings at the same time and promised both organisers your full attention."
  },
  {
    "id": "bed82429-8a2f-5b75-a785-e7bfd1211242",
    "category": "work",
    "intensity": "mild",
    "situation": "You accidentally attach your lunch order to the quarterly strategy email. The CEO replies, “Interesting priorities. Can you present this at noon?”"
  },
  {
    "id": "c859474a-53d5-51da-8049-81fe38b43baa",
    "category": "work",
    "intensity": "mild",
    "situation": "You reply 'sounds great' to a vague calendar invitation. It turns out you agreed to be the company's mascot at its annual conference, and the costume has already been ordered in your size."
  },
  {
    "id": "12b3078b-f9d1-5481-a8a0-4f75e67388a3",
    "category": "work",
    "intensity": "mild",
    "situation": "The office printer refuses every job you send but prints perfectly whenever your manager walks over."
  },
  {
    "id": "15ddd620-e2b2-52d4-9559-9b5fde62072b",
    "category": "work",
    "intensity": "mild",
    "situation": "You are asked to organise the office party with no budget, no alcohol, and a list of compulsory fun requirements."
  },
  {
    "id": "17ecd6ec-b069-52ad-9b20-b22599ddb5c8",
    "category": "work",
    "intensity": "mild",
    "situation": "Your manager announces a return-to-office policy from a beach resort and calls it a team-building opportunity."
  },
  {
    "id": "31ddfafa-fe8a-5305-bca7-b97cd41302bb",
    "category": "work",
    "intensity": "mild",
    "situation": "Your coworker keeps using Reply All to ask everyone to stop using Reply All. The CEO has now appointed you chair of an emergency 'Email Etiquette Task Force' and expects a speech by lunch."
  },
  {
    "id": "3d6358d3-bd1e-5bfb-b47c-1cc7c69e7a95",
    "category": "work",
    "intensity": "mild",
    "situation": "Your work best friend asks you to deliver their farewell speech, but every memorable story is unsuitable for work."
  },
  {
    "id": "4fb6f812-657d-59b2-8e0a-5c0234e3f96d",
    "category": "work",
    "intensity": "mild",
    "situation": "Your lunch hour has been replaced by recurring meetings titled “Protecting Work-Life Balance.”"
  },
  {
    "id": "60d38af3-b8e4-58a7-a925-dccf21338fc2",
    "category": "work",
    "intensity": "mild",
    "situation": "Finance rejects your ₦9 million budget because it's off by exactly ₦1. The CFO demands an investigation report, and your team has split into rival factions over whether to round up or down."
  },
  {
    "id": "692e8d4d-3687-5209-9b1d-94e222bc92bc",
    "category": "work",
    "intensity": "messy",
    "situation": "You inherit a spreadsheet nobody understands. Its creator left the company and named every tab after a fruit."
  },
  {
    "id": "7cb474fe-6d06-5e16-95b9-a294a6fc8898",
    "category": "work",
    "intensity": "messy",
    "situation": "You promised a client an impressive new feature. The demo is tomorrow, and the only thing built is a button labelled “Coming Soon.”"
  },
  {
    "id": "806ac9cb-13ff-5d5d-a194-475ba80198d4",
    "category": "work",
    "intensity": "messy",
    "situation": "A colleague keeps stealing your lunch but leaves detailed reviews of it in the office chat."
  },
  {
    "id": "84633c84-f3fd-51c2-bcde-850dde2de2a5",
    "category": "work",
    "intensity": "messy",
    "situation": "A teammate presents your idea as their own, then asks you to answer all the difficult questions about it."
  },
  {
    "id": "360970d2-d8ec-5b95-bbdb-59ac004af87d",
    "category": "work",
    "intensity": "messy",
    "situation": "During a serious virtual presentation, your colleague accidentally replaces the company logo with a giant dancing potato. Nobody knows how to stop it."
  },
  {
    "id": "9f413a2f-7251-577d-98f3-9b0c7cb218f0",
    "category": "work",
    "intensity": "messy",
    "situation": "Your sarcastic suggestion to replace every office chair with an exercise ball wins the company's cost-saving contest. Facilities now expects you to present the rollout plan on Monday."
  },
  {
    "id": "ac75c121-8285-583b-ac3b-c89d4a402fbc",
    "category": "work",
    "intensity": "messy",
    "situation": "Your boss asks for honest feedback on a forty-slide presentation while hovering behind your chair."
  },
  {
    "id": "b61b1a23-5a9c-50b1-9812-9dc73b74900e",
    "category": "work",
    "intensity": "messy",
    "situation": "A new colleague thinks you are their manager because everyone kept sending them to you for help."
  },
  {
    "id": "ba4219af-e716-52ae-981d-a80922b00865",
    "category": "work",
    "intensity": "messy",
    "situation": "Your camera switches on while you are eating noodles directly from the pot during a leadership meeting."
  },
  {
    "id": "0abebae7-8d35-500e-ae15-a732b3386566",
    "category": "work",
    "intensity": "messy",
    "situation": "A customer wants a refund because the fancy notebook they bought has not made them more productive, despite using it for two whole days."
  },
  {
    "id": "bc15256a-7e7b-5202-a83b-df8ca7a034aa",
    "category": "work",
    "intensity": "unhinged",
    "situation": "You reach the final interview and realise you have been confidently using the wrong company name."
  },
  {
    "id": "c03aa2a0-3252-59c5-a149-69c5d14ca7c9",
    "category": "work",
    "intensity": "unhinged",
    "situation": "Every morning, a teammate messages “Hello” and waits for your reply before explaining the request. Today they have sent “Hello???” to the entire team."
  },
  {
    "id": "5e2a8659-0974-55db-9377-b3466187c02e",
    "category": "work",
    "intensity": "unhinged",
    "situation": "The office votes to replace its boring hold music with staff singing. Someone submits a recording of you humming while making tea, and HR announces you as the lead vocalist."
  },
  {
    "id": "9a538526-dc12-5d4c-b3cb-f94061fcff0f",
    "category": "work",
    "intensity": "unhinged",
    "situation": "Your company's new meeting-summary assistant ranks 'talking about lunch' as your team's top achievement this quarter. Your manager asks you to present the findings at the performance review."
  },
  {
    "id": "d4e519ed-2f2a-5bee-ab80-2a736048cf7f",
    "category": "work",
    "intensity": "unhinged",
    "situation": "Your boss has started calling your favourite mug 'our mug.' It appears on the company culture brochure, and now colleagues are signing up to borrow it for their official staff photos."
  },
  {
    "id": "d6c720fb-5a3a-59b4-8493-ad65b744f714",
    "category": "work",
    "intensity": "unhinged",
    "situation": "You complain about your boss in a message and accidentally send it to the project group they lead."
  },
  {
    "id": "d7958e7e-6574-55b3-96ec-1fc71ad0b6ef",
    "category": "work",
    "intensity": "unhinged",
    "situation": "A client has called you by another employee’s name for six months, and correcting them now feels impossibly late."
  },
  {
    "id": "d90f449d-6d43-5df9-928d-4cbc88cc8b70",
    "category": "work",
    "intensity": "unhinged",
    "situation": "You accidentally send a client twelve documents all labelled some version of FINAL. They love the work but want you to explain your 'innovative versioning strategy' to their board tomorrow."
  },
  {
    "id": "ebccfded-9fc5-576d-89ae-b5c74b947446",
    "category": "work",
    "intensity": "unhinged",
    "situation": "Your resignation email is scheduled for Friday, but a promotion announcement featuring you goes out on Thursday."
  },
  {
    "id": "5fcfd5d7-7961-5ccd-8319-9b6dcf3f7d94",
    "category": "work",
    "intensity": "unhinged",
    "situation": "The company celebrates your tenth work anniversary with a giant cake. You joined ten days ago, and the CEO is about to make a speech."
  },
  {
    "id": "05f46633-fd59-518f-b642-14baa0b60d8e",
    "category": "naija",
    "intensity": "mild",
    "situation": "Your family insists you take food home, then criticises the size of the container you choose."
  },
  {
    "id": "0db23a65-2bcf-59fb-8533-b21053e56d1c",
    "category": "naija",
    "intensity": "mild",
    "situation": "Your mother finds the outfit you hid for a night out and wears it while asking why it was hidden."
  },
  {
    "id": "1e0d0831-df58-5610-bc5a-3d5dfee484f1",
    "category": "naija",
    "intensity": "mild",
    "situation": "Your parents discover that the “study weekend” you attended had a swimming pool and matching party shirts."
  },
  {
    "id": "2275473c-10c9-5bb7-8fb8-a6ee76356d54",
    "category": "naija",
    "intensity": "mild",
    "situation": "Your mother calls to ask whether you have eaten. You say yes, and she immediately asks you to list the ingredients."
  },
  {
    "id": "28cbec68-8a9e-5618-8a5b-a11de13db250",
    "category": "naija",
    "intensity": "mild",
    "situation": "Your cousin posts holiday photos from Dubai on the same day they ask to delay repaying your money again."
  },
  {
    "id": "343fe1ec-41f2-54c5-b756-d5a027e3277b",
    "category": "naija",
    "intensity": "mild",
    "situation": "Your cousin borrows your favourite outfit, posts photos in it, and tells everyone you copied their look."
  },
  {
    "id": "fa79f810-3b6f-5198-80a0-fb7d6f6cddf1",
    "category": "naija",
    "intensity": "mild",
    "situation": "Your uncle drops a huge cooler of jollof at your house and says it's a gift. An hour later he sends a list of twenty takeaway packs you must deliver to relatives before evening, each with a personal note."
  },
  {
    "id": "407a5726-11c6-540d-adaa-4cde42485f2d",
    "category": "naija",
    "intensity": "mild",
    "situation": "You joke in the family group chat that you're retiring early to become a full-time jollof critic. Your auntie starts organising a thanksgiving service, and relatives are sending retirement contributions."
  },
  {
    "id": "479552e6-12f4-5776-be15-03baa86d38ed",
    "category": "naija",
    "intensity": "mild",
    "situation": "A peaceful family lunch becomes a serious debate about who makes the correct jollof rice. You are appointed judge."
  },
  {
    "id": "4dc79f57-3380-5c97-8136-db639639d763",
    "category": "naija",
    "intensity": "mild",
    "situation": "You arrive at an owambe wearing the same fabric as the family, but nobody remembers selling it to you."
  },
  {
    "id": "5784e04e-7eb1-51e3-aa62-e28539db7331",
    "category": "naija",
    "intensity": "messy",
    "situation": "At a family contribution meeting, the treasurer’s spreadsheet lists one uncle as “payment pending since 2018.” He insists the debt is a technical error."
  },
  {
    "id": "5375898f-f784-57b3-80cb-44f70cac1d57",
    "category": "naija",
    "intensity": "messy",
    "situation": "Your cousin asks for your streaming password and promises it is only for one device. Seven new profiles appear."
  },
  {
    "id": "55fb3fb1-3bf8-5198-a99c-a90cddb49c16",
    "category": "naija",
    "intensity": "messy",
    "situation": "A family member volunteers your car for an airport pickup at 4 a.m. and informs you at bedtime."
  },
  {
    "id": "5a3e9f15-fbf1-5673-a9e1-0bba0e242441",
    "category": "naija",
    "intensity": "messy",
    "situation": "Your sibling finishes the drink you saved, puts the empty bottle back in the fridge, and proudly announces they washed it for you."
  },
  {
    "id": "9cf1f41e-1095-525d-b972-8e789b826157",
    "category": "naija",
    "intensity": "messy",
    "situation": "Your sibling pulls up an ancient video of you dancing badly to win an argument about who should be in charge of the family playlist."
  },
  {
    "id": "667dc74d-31fd-5646-bd91-cde03368d850",
    "category": "naija",
    "intensity": "messy",
    "situation": "Your uncle begins a speech before dinner and keeps saying “finally” without finishing. The food is getting cold."
  },
  {
    "id": "6a2a5571-bf38-5b33-a370-fd372b7adc7d",
    "category": "naija",
    "intensity": "messy",
    "situation": "Your parents compare you with a successful cousin. Later, that cousin privately asks to borrow money from you."
  },
  {
    "id": "70541f30-fdc0-5cc2-bc00-cd4cb93bec0c",
    "category": "naija",
    "intensity": "messy",
    "situation": "Your parent has saved your number as “Do Not Lend Money” but calls you first whenever money is needed."
  },
  {
    "id": "708b39de-6da5-5d23-b69e-dc38f164dd69",
    "category": "naija",
    "intensity": "messy",
    "situation": "A relative arrives with three surprise guests after saying they were “just passing by.” Dinner serves four."
  },
  {
    "id": "3a2fb146-8a28-5f44-92a3-f6f365390139",
    "category": "naija",
    "intensity": "messy",
    "situation": "Your family asks you to MC your cousin’s naming ceremony because you once sang karaoke. Nobody has written a programme."
  },
  {
    "id": "83bc1faa-2ec7-59b0-92e7-2d46f6dec19a",
    "category": "naija",
    "intensity": "unhinged",
    "situation": "Your parents invite your ex to dinner because “we still like them even if you are confused.”"
  },
  {
    "id": "8c590664-1c4c-54d9-954e-e6de41004ef7",
    "category": "naija",
    "intensity": "unhinged",
    "situation": "Your younger cousin calls you “old” and then asks you to pay for everyone’s food because you are the eldest."
  },
  {
    "id": "549b529e-46d8-5ca3-87a5-bbd22e7d7eae",
    "category": "naija",
    "intensity": "unhinged",
    "situation": "An auntie shares your professional headshot in the family group with the caption “Our future minister.” Congratulations start arriving."
  },
  {
    "id": "a259af3f-77f9-54f1-acb2-ae5ac162070f",
    "category": "naija",
    "intensity": "unhinged",
    "situation": "Your father appoints you the family's 'Energy Minister' after accusing you of leaving lights on. Your siblings start filing formal complaints, and he expects your first electricity-saving policy by dinner."
  },
  {
    "id": "ae40794b-db9f-54d5-be4b-226ef9376a45",
    "category": "naija",
    "intensity": "unhinged",
    "situation": "A relative asks your salary in front of the whole table and starts estimating before you answer."
  },
  {
    "id": "bc4d6429-9805-5ecc-bd32-bc51cdd5f03c",
    "category": "naija",
    "intensity": "unhinged",
    "situation": "Your family adds you as admin of another prayer group, then makes you responsible for sending eighty relatives a 'good morning' reminder before 6 a.m. A rota bearing your name is already circulating."
  },
  {
    "id": "a9f636fa-048b-5c8b-9ec1-64f5726a8629",
    "category": "naija",
    "intensity": "unhinged",
    "situation": "Just as you sit down after cleaning the entire house, a relative announces a family competition for “Best Person at Doing Chores.” You are the judge."
  },
  {
    "id": "c6ff0e6c-4c2e-510f-a7d3-9901cb4e00b4",
    "category": "naija",
    "intensity": "unhinged",
    "situation": "A relative announces your new relationship before you have told the family—or decided what the relationship is."
  },
  {
    "id": "e72b435d-cbc6-5c73-95be-29cf7faed918",
    "category": "naija",
    "intensity": "unhinged",
    "situation": "Your sibling hides your charger, then offers to rent you theirs by the hour."
  },
  {
    "id": "fbce9e6a-d86c-5433-bba0-b68f5a9e135e",
    "category": "naija",
    "intensity": "unhinged",
    "situation": "Your parent tells a neighbour you can repair laptops because you once restarted the router. The laptop is now on your table."
  },
  {
    "id": "0025213d-5966-5317-873a-16ba30362189",
    "category": "wild",
    "intensity": "mild",
    "situation": "Your alarm clock has started snoozing itself and leaves notes explaining why you both deserve more rest."
  },
  {
    "id": "3b9ee339-f9ef-568d-ad0d-2df348a4a5a2",
    "category": "wild",
    "intensity": "mild",
    "situation": "You win a lifetime supply of left-foot slippers. The prize company has parked three delivery trucks outside and calls you its brand ambassador."
  },
  {
    "id": "221efee0-c04d-5df3-bf5a-e8a30a412163",
    "category": "wild",
    "intensity": "mild",
    "situation": "A street magician borrows your watch, disappears, and sends you a calendar invitation to collect it next Tuesday."
  },
  {
    "id": "2f47d4d9-7782-52d1-8fe9-27f5bf3cd6e3",
    "category": "wild",
    "intensity": "mild",
    "situation": "A child at a wedding insists you are their imaginary friend and demands you explain why you missed yesterday’s imaginary tea party."
  },
  {
    "id": "de2a2429-c615-52da-984a-8fe680a04705",
    "category": "wild",
    "intensity": "mild",
    "situation": "Your shadow resigns from following you and demands weekends off. It has already posted the resignation on social media."
  },
  {
    "id": "3ac1781e-aafe-5aec-ae09-417fe8b7640e",
    "category": "wild",
    "intensity": "mild",
    "situation": "A local cat escorts you to work every morning. Your boss has given the cat your parking space and named it Employee of the Month."
  },
  {
    "id": "2b49e52b-0f64-5ba5-9e19-d7968f6c247c",
    "category": "wild",
    "intensity": "mild",
    "situation": "Every fortune cookie at dinner says, 'Ask the person in blue who cancelled dessert.' You're wearing blue, and the waiter insists the whole table's dessert order was cancelled under your name."
  },
  {
    "id": "47343253-1b8a-5fde-9484-4ed081ef74ea",
    "category": "wild",
    "intensity": "mild",
    "situation": "Your houseplant grows a flower every time you insult it. Your family catches you giving it a dramatic roast in the living room."
  },
  {
    "id": "56e41264-22cf-5656-8b54-f6068972636c",
    "category": "wild",
    "intensity": "mild",
    "situation": "Your smart speaker introduces everyone entering the kitchen like a boxing champion. It calls your landlord 'The Midnight Fridge Raider' during a flat viewing, and the landlord demands an official correction."
  },
  {
    "id": "949e701d-7ef1-5a03-ad14-2075e4b5b4e1",
    "category": "wild",
    "intensity": "mild",
    "situation": "A crow appoints itself your debt collector and delivers one pebble to your window each day with a handwritten invoice."
  },
  {
    "id": "742923db-2513-5f9b-825d-32803e8aa392",
    "category": "wild",
    "intensity": "messy",
    "situation": "Your new flat has a door that opens into a cupboard in the daytime and your neighbour’s kitchen after midnight."
  },
  {
    "id": "63c16324-a5b6-5361-8603-8f5f7f79a883",
    "category": "wild",
    "intensity": "messy",
    "situation": "A vending machine begins printing your dreams on every receipt. It promises to erase the most embarrassing one if you read it into its microphone, and a queue is forming behind you."
  },
  {
    "id": "82dd99a8-5e09-59b6-92a9-b358a51e8c1a",
    "category": "wild",
    "intensity": "messy",
    "situation": "A taxi driver is certain you are a famous musician and refuses to accept your denial or your fare."
  },
  {
    "id": "8fc68cdc-f67a-5b94-b697-30280212c714",
    "category": "wild",
    "intensity": "messy",
    "situation": "A restaurant gives you a loyalty card labelled “Most Dramatic Customer.” You have never eaten there, but the waiter asks for your autograph."
  },
  {
    "id": "98bc402b-eb58-5b15-90b8-61ecba379288",
    "category": "wild",
    "intensity": "messy",
    "situation": "Your neighbour names their Wi-Fi after your most embarrassing habit and denies knowing anything about it."
  },
  {
    "id": "f2f09ac2-ffae-57fb-9f76-70e5411d5d4c",
    "category": "wild",
    "intensity": "messy",
    "situation": "Your office stapler forms a one-item union and refuses to work until someone gives it a proper job title."
  },
  {
    "id": "c244258b-b686-5c94-ab1e-99380e5bd273",
    "category": "wild",
    "intensity": "messy",
    "situation": "Your landlord adds a “ghost maintenance fee” to the rent and provides a blurry photo as evidence."
  },
  {
    "id": "4086c851-a735-5843-8aff-917247518df1",
    "category": "wild",
    "intensity": "messy",
    "situation": "Your childhood superhero alias starts receiving fan mail addressed to your garden shed. The town council has planned a ceremony to unveil the shed as your 'secret headquarters' tonight."
  },
  {
    "id": "cde5e193-9242-5a33-bfdc-4f63884bfd9d",
    "category": "wild",
    "intensity": "messy",
    "situation": "You are mistakenly added to a highly organised neighbourhood committee, and your first assigned task is “manage the geese.”"
  },
  {
    "id": "ce2c821a-3443-52c6-b7c2-0a619cc8d5ba",
    "category": "wild",
    "intensity": "messy",
    "situation": "A stranger challenges you to a dance battle in a supermarket aisle and nearby shoppers quietly make space."
  },
  {
    "id": "d5ff9664-70ec-5d3a-b754-f42ee8544d36",
    "category": "wild",
    "intensity": "unhinged",
    "situation": "You collect the wrong suitcase at the airport. Every item inside has your name on it, but none of it belongs to you. Airline staff want proof."
  },
  {
    "id": "de048ddd-7795-5a84-9b29-0436421202a1",
    "category": "wild",
    "intensity": "unhinged",
    "situation": "Your mirror reflection starts practising job-interview answers before you speak—and somehow answers better than you do."
  },
  {
    "id": "1a004bde-1e77-5b36-838b-edd4a32ad4df",
    "category": "wild",
    "intensity": "unhinged",
    "situation": "An inflatable flamingo appears in every photo from your holiday. At baggage claim, it turns up wearing your luggage tag, and airport staff insist you declare it as an extra passenger."
  },
  {
    "id": "e784de3b-5174-5b46-820c-dd871cdf1c58",
    "category": "wild",
    "intensity": "unhinged",
    "situation": "A goat follows you home from the market and refuses to leave your doorway. Nobody nearby admits owning it."
  },
  {
    "id": "4c73ba47-910f-504c-8970-57490753ad7d",
    "category": "wild",
    "intensity": "unhinged",
    "situation": "Your family's portraits have started rearranging themselves each night according to who behaved best at dinner. You're now at the very back of the family photo, and relatives are visiting tomorrow."
  },
  {
    "id": "4cefc594-a616-5a2b-95ca-bb2471102b04",
    "category": "wild",
    "intensity": "unhinged",
    "situation": "Your future self sends an apology card for ruining tomorrow’s surprise party and asks you not to cancel it."
  },
  {
    "id": "71a2dd39-ed27-5bc9-a86a-6e39479969d4",
    "category": "wild",
    "intensity": "unhinged",
    "situation": "Your shoes have started a band without you and booked their first concert for tonight. They expect you to explain to the audience why their drummer—a missing sock—hasn't arrived."
  },
  {
    "id": "cc28e8a0-4687-5a0c-afa0-54fbde1138a0",
    "category": "wild",
    "intensity": "unhinged",
    "situation": "A photo booth prints a picture of you winning tomorrow's gardening competition. You don't own a single plant, but the organisers have entered you as a finalist and sent you an enormous trophy display case."
  },
  {
    "id": "ff1b8d22-fa93-5e3d-8e38-4a6018dca17b",
    "category": "wild",
    "intensity": "unhinged",
    "situation": "Your office chair squeaks only when you say something untrue, and your coworkers have noticed the pattern."
  },
  {
    "id": "9bae3eee-29e6-5412-9b59-6c4b012a1f03",
    "category": "wild",
    "intensity": "unhinged",
    "situation": "Your sofa declares itself a holiday rental and accepts a booking from a family of cushions for tonight. Twelve actual human guests are coming, and the sofa refuses to cancel the reservation."
  }
]

export function situationsFor(categories: readonly BadAdviceCategory[]) {
  const selected = new Set(categories)
  return BAD_ADVICE_SITUATIONS.filter(item => selected.has(item.category))
}

export function shuffledSituations(items: readonly BadAdviceSituation[]) {
  return [...items].sort(() => Math.random() - 0.5)
}
