export interface ImposterWordPair { category: string; regular: string; imposter: string }
export type ImposterCategory = 'places' | 'food' | 'nature' | 'everyday' | 'culture' | 'events'

export const IMPOSTER_CATEGORIES: ReadonlyArray<{ id: ImposterCategory; label: string }> = [
  { id: 'places', label: 'Places & Travel' }, { id: 'food', label: 'Food & Drinks' },
  { id: 'nature', label: 'Nature' }, { id: 'everyday', label: 'Everyday Life' },
  { id: 'culture', label: 'Culture & Tech' }, { id: 'events', label: 'Games & Events' },
]

// Every unordered pair stays inside one narrow semantic theme. Five 11-term
// groups plus one 8-term group produce 303 distinct cards per category.
const TERMS: Record<ImposterCategory, readonly (readonly string[])[]> = {
  places: [
    ['Airport','Runway','Terminal','Passport','Suitcase','Boarding pass','Pilot','Flight attendant','Airplane','Gate','Customs'],
    ['Hotel','Hostel','Resort','Motel','Lobby','Reception','Room service','Suite','Key card','Concierge','Housekeeping'],
    ['Beach','Island','Coast','Lagoon','Harbour','Pier','Lighthouse','Boardwalk','Marina','Bay','Cliff'],
    ['Train station','Bus stop','Taxi rank','Subway','Tram','Ferry','Coach','Platform','Railway','Highway','Roundabout'],
    ['Museum','Gallery','Library','Theatre','Cinema','Stadium','Aquarium','Zoo','Monument','Palace','Castle'],
    ['Village','Town','City','Capital','Suburb','Countryside','Downtown','Neighbourhood'],
  ],
  food: [
    ['Pizza','Burger','Hot dog','Sandwich','Taco','Burrito','Shawarma','Kebab','Wrap','Panini','Toast'],
    ['Rice','Pasta','Noodles','Couscous','Quinoa','Oats','Cereal','Bread','Potato','Yam','Plantain'],
    ['Apple','Banana','Orange','Mango','Pineapple','Watermelon','Grape','Strawberry','Peach','Pear','Papaya'],
    ['Coffee','Tea','Hot chocolate','Latte','Espresso','Cappuccino','Smoothie','Milkshake','Juice','Lemonade','Soda'],
    ['Chicken','Beef','Pork','Lamb','Turkey','Salmon','Tuna','Shrimp','Sausage','Bacon','Meatball'],
    ['Cake','Cookie','Brownie','Doughnut','Cupcake','Ice cream','Pudding','Pie'],
  ],
  nature: [
    ['Lion','Tiger','Leopard','Cheetah','Jaguar','Panther','Hyena','Wolf','Fox','Bear','Lynx'],
    ['Dog','Cat','Rabbit','Hamster','Guinea pig','Parrot','Goldfish','Turtle','Goat','Sheep','Horse'],
    ['Eagle','Hawk','Falcon','Owl','Crow','Raven','Pigeon','Sparrow','Peacock','Flamingo','Pelican'],
    ['Rain','Snow','Hail','Storm','Thunder','Lightning','Fog','Wind','Tornado','Hurricane','Rainbow'],
    ['River','Lake','Ocean','Sea','Waterfall','Pond','Stream','Glacier','Swamp','Reef','Cave'],
    ['Rose','Tulip','Sunflower','Daisy','Lily','Orchid','Lavender','Hibiscus'],
  ],
  everyday: [
    ['Kitchen','Bathroom','Bedroom','Living room','Dining room','Garage','Balcony','Garden','Hallway','Basement','Attic'],
    ['Teacher','Principal','Student','Classroom','Homework','Exam','Textbook','Notebook','Pencil','Backpack','Uniform'],
    ['Doctor','Nurse','Dentist','Pharmacist','Hospital','Clinic','Ambulance','Medicine','Bandage','Thermometer','Stethoscope'],
    ['Sofa','Chair','Table','Bed','Wardrobe','Bookshelf','Desk','Stool','Bench','Cabinet','Mirror'],
    ['Shirt','Trousers','Dress','Skirt','Jacket','Sweater','Shorts','Suit','Pyjamas','Uniform','Coat'],
    ['Soap','Shampoo','Toothpaste','Towel','Sponge','Broom','Mop','Bucket'],
  ],
  culture: [
    ['Cinema','Theatre','Concert','Festival','Opera','Musical','Comedy show','Exhibition','Premiere','Carnival','Parade'],
    ['Laptop','Tablet','Desktop','Smartphone','Smartwatch','Keyboard','Mouse','Monitor','Printer','Router','Charger'],
    ['Instagram','TikTok','YouTube','WhatsApp','Snapchat','Facebook','X','Reddit','Netflix','Spotify','Telegram'],
    ['Movie','Series','Documentary','Cartoon','Anime','Podcast','Radio','News','Trailer','Episode','Season'],
    ['Guitar','Piano','Drums','Violin','Trumpet','Saxophone','Flute','Cello','Harp','Microphone','Speaker'],
    ['Camera','Photograph','Portrait','Selfie','Video','Filter','Tripod','Lens'],
  ],
  events: [
    ['Football','Basketball','Tennis','Volleyball','Rugby','Cricket','Baseball','Hockey','Golf','Boxing','Wrestling'],
    ['Wedding','Birthday','Anniversary','Graduation','Engagement','Baby shower','Reunion','Retirement','Naming ceremony','Housewarming','Prom'],
    ['Chess','Checkers','Ludo','Scrabble','Monopoly','Dominoes','Jenga','Charades','Sudoku','Crossword','Bingo'],
    ['Medal','Trophy','Referee','Coach','Captain','Team','Opponent','Scoreboard','Whistle','Jersey','Tournament'],
    ['Invitation','Cake','Candles','Balloons','Confetti','Gift','Decorations','Music','Photographer','Speech','Toast'],
    ['Running','Swimming','Cycling','Skiing','Surfing','Skating','Climbing','Gymnastics'],
  ],
}

const pairsFor = (category: ImposterCategory): ImposterWordPair[] => TERMS[category].flatMap(group => group.flatMap((regular, index) => group.slice(index + 1).map(imposter => ({ category, regular, imposter }))))
export const IMPOSTER_DECKS: Record<ImposterCategory, readonly ImposterWordPair[]> = Object.fromEntries(IMPOSTER_CATEGORIES.map(({ id }) => [id, pairsFor(id)])) as unknown as Record<ImposterCategory, readonly ImposterWordPair[]>
export const IMPOSTER_WORD_PAIRS: readonly ImposterWordPair[] = IMPOSTER_CATEGORIES.flatMap(({ id }) => IMPOSTER_DECKS[id])
export function getImposterPairs(categories: readonly ImposterCategory[]) { return categories.flatMap(category => IMPOSTER_DECKS[category] ?? []) }
