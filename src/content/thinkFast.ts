const CORE_PROMPTS = [
  'Name 3 things you always carry with you.',
  'Name 3 foods you can eat without cutlery.',
  'Name 3 things people do before bed.',
  'Name 3 things you might find in a kitchen.',
  'Name 3 reasons someone might be late.',
  'Name 3 apps people open every day.',
  'Name 3 things you can wear on your head.',
  'Name 3 things that make a loud noise.',
  'Name 3 places you would not wear slippers.',
  'Name 3 things you can do with one hand.',
  'Name 3 things people forget at home.',
  'Name 3 things you might see at a wedding.',
  'Name 3 foods that taste better hot.',
  'Name 3 things that can ruin a good mood.',
  'Name 3 things you would take to the beach.',
  'Name 3 things people argue about in a group chat.',
  'Name 3 excuses for not answering a call.',
  'Name 3 things you should never say on a first date.',
  'Name 3 things that are difficult to do quietly.',
  'Name 3 things people pretend to understand.',
  'Name 3 things that can be spicy.',
  'Name 3 things you can lose at a party.',
  'Name 3 things people take pictures of.',
  'Name 3 things that can wake you up.',
  'Name 3 things you would find in a hotel room.',
  'Name 3 jobs that require a uniform.',
  'Name 3 things that are better with friends.',
  'Name 3 things people check before leaving home.',
  'Name 3 things you might buy at a supermarket.',
  'Name 3 places where you have to wait in line.',
  'Name 3 things that come in pairs.',
  'Name 3 things you can charge.',
  'Name 3 things people do when they are nervous.',
  'Name 3 things you should not put in a microwave.',
  'Name 3 things that can be cancelled.',
  'Name 3 things people celebrate.',
  'Name 3 things you might see in Lagos traffic.',
  'Name 3 Nigerian foods you could eat for breakfast.',
  'Name 3 things people say when NEPA takes the light.',
  'Name 3 things you might hear at an owambe.',
  'Name 3 things you can buy from a roadside vendor.',
  'Name 3 things that make a film memorable.',
  'Name 3 musicians everyone in the room probably knows.',
  'Name 3 fictional characters with special powers.',
  'Name 3 things people do during a football match.',
  'Name 3 songs that can fill a dance floor.',
  'Name 3 things you would bring on a road trip.',
  'Name 3 things that are usually red.',
  'Name 3 animals that move slowly.',
  'Name 3 things that can melt.',
  'Name 3 things children learn at school.',
  'Name 3 words that rhyme with light.',
  'Name 3 things with buttons.',
  'Name 3 things that have wheels.',
  'Name 3 things you can open without a key.',
  'Name 3 things that smell good.',
  'Name 3 things people do when nobody is watching.',
  'Name 3 things you would not share with a stranger.',
  'Name 3 reasons to leave a party early.',
  'Name 3 things that feel longer than five minutes.',
] as const

const placePrompts = ['an airport','a pharmacy','a classroom','a gym','a bank','a restaurant kitchen','a hospital waiting room','a cinema','a library','a petrol station','a mechanic’s workshop','a hair salon','a playground','a train station','a bakery','a police station','a football stadium','a music studio','a construction site','a market','a birthday party','a campsite','a museum','a courtroom','an office desk','a school bag','a car boot','a refrigerator','a bathroom cabinet','a toolbox','a university hostel','a barbershop','a bus stop','a swimming pool','a church service','a mosque courtyard','a farm','a fashion store','a phone repair shop','a concert'] as const
const reactionPrompts = ['the Wi-Fi stops working','they miss their alarm','they receive good news','they are trying not to laugh','they get caught in the rain','their phone battery reaches one percent','they forget someone’s name','they see a cockroach','the power suddenly returns','they are stuck in traffic','they win an argument','they lose their keys','they are waiting for food','they hear a strange noise at night','they arrive at a party early','they arrive at a party late','they meet a celebrity','they are bored in a meeting','they cannot sleep','they are running late for work','they get an unexpected message','they realise they are in the wrong place','they spill something on their clothes','they are home alone','they hear their favourite song','they are trying to save money','they have a free afternoon','they feel cold','they feel too hot','they are avoiding a conversation','they are preparing for an interview','they are lost in a new city','they have guests coming over','they are watching a scary film','they forget a birthday','they are asked to speak in public','they cannot remember a password','they are waiting for exam results','they find money in an old pocket','their team scores at the last minute'] as const
const bringPrompts = ['a picnic','a job interview','a sleepover','a long flight','a day at the pool','a study session','a music festival','a hiking trip','a family gathering','a barbecue','a first day at work','a game night','a photoshoot','a rainy-day outing','a weekend away','a graduation ceremony','a house party','a boat trip','a camping weekend','a sports match','a visit to a newborn baby','a trip to the village','a beach wedding','an outdoor concert','a school reunion','a cooking class','a karaoke night','a long bus journey','a surprise party','a power outage'] as const
const qualityPrompts = ['soft','fragile','expensive','sticky','transparent','round','tiny','enormous','striped','waterproof','sweet','bitter','sour','crunchy','smooth','rough','heavy','lightweight','colourful','shiny','dangerous when wet','easy to forget','hard to pronounce','fun to collect','annoying to clean','likely to break','made of glass','powered by batteries','found underground','used only at night','older than you','faster than a bicycle','smaller than your hand','taller than a person','colder than ice','hotter than tea','more useful than they look','surprisingly noisy','difficult to carry','impossible to hide'] as const
const typePrompts = ['fruit','vegetables','sports','musical instruments','phone accessories','board games','soft drinks','breakfast foods','public transport','household appliances','dance styles','weather','school subjects','social media posts','shoes','bags','flowers','trees','seafood','sandwich fillings','holiday destinations','things made from wood','things made from metal','things sold in bottles','things kept in a wallet','things with screens','things with handles','things that use electricity','things people subscribe to','things people borrow'] as const
const sayPrompts = ['at a wedding','during a job interview','when answering the phone','when someone sneezes','before taking a group photo','when food tastes amazing','after receiving a gift','when asking for directions','when a meeting runs too long','when a friend is late','when the bill arrives','when the lights go out','when a baby starts crying','when someone tells a bad joke','when entering a crowded room','when saying goodbye at an airport','when trying to bargain','when a match goes into extra time','when a surprise is revealed','when the microphone stops working'] as const
const avoidPrompts = ['giving a presentation','cooking for guests','travelling internationally','meeting someone’s parents','attending a wedding','taking an important exam','going on a first date','hosting a party','using public transport','shopping online','driving at night','sharing a hotel room','working from home','going to the gym','visiting a hospital','joining a video call','moving into a new house','borrowing someone’s car','planning a surprise','sending a voice note'] as const
const naijaPrompts = ['Name 3 things you might hear inside a danfo.','Name 3 foods commonly served at a Nigerian party.','Name 3 things people do when fuel is scarce.','Name 3 Nigerian cities outside Lagos.','Name 3 items sold in traffic.','Name 3 things a conductor might shout.','Name 3 reasons people visit the village in December.','Name 3 Nigerian soups.','Name 3 things you might see at a naming ceremony.','Name 3 things people discuss at a viewing centre.','Name 3 Nigerian street foods.','Name 3 things found in a typical provision shop.','Name 3 ways people respond to “How far?”','Name 3 things that can delay a Nigerian road trip.','Name 3 items people buy at an open market.','Name 3 Nigerian musicians from different generations.','Name 3 things guests take home after a party.','Name 3 things people do when rain starts during an outdoor event.','Name 3 things associated with Detty December.','Name 3 Nigerian meals that include rice.'] as const

const sentence = (middle: string, ending: string) => `Name 3 ${middle} ${ending}.`

export const THINK_FAST_CATEGORIES = {
  core: [...CORE_PROMPTS],
  places: placePrompts.map(place => sentence('things you might find in or around', place)),
  reactions: reactionPrompts.map(moment => sentence('things people do when', moment)),
  packing: bringPrompts.map(event => sentence('things you would bring to', event)),
  qualities: qualityPrompts.map(quality => sentence('things that are', quality)),
  quickLists: typePrompts.map(type => `Name 3 types of ${type}.`),
  thingsPeopleSay: sayPrompts.map(moment => sentence('things people say', moment)),
  pressure: avoidPrompts.map(situation => sentence('things you should avoid while', situation)),
  naija: [...naijaPrompts],
} as const

export const THINK_FAST_PROMPTS = Object.values(THINK_FAST_CATEGORIES).flat()

function shuffled<T>(items: readonly T[]) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}

export function shuffledThinkFastPrompts() {
  const categoryDecks = Object.values(THINK_FAST_CATEGORIES).map(category => shuffled(category))
  const balanced: string[] = []
  for (let row = 0; categoryDecks.some(category => row < category.length); row += 1) {
    for (const category of shuffled(categoryDecks)) {
      if (category[row]) balanced.push(category[row])
    }
  }
  return balanced
}
