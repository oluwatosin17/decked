import { getShuffledDeck } from './utils/deckShuffle'
import { CHARADES_MOVIES } from './content/decks/charadesMovies'
import { CHARADES_TV_SHOWS } from './content/decks/charadesTvShows'
import { CHARADES_HOBBIES } from './content/decks/charadesHobbies'
import { CHARADES_SONGS } from './content/decks/charadesSongs'
import { CHARADES_MUSIC_ARTISTS } from './content/decks/charadesMusicArtists'
import { CHARADES_APPS } from './content/decks/charadesApps'
import { CHARADES_COUNTRIES } from './content/decks/charadesCountries'
import { CHARADES_ANIMALS } from './content/decks/charadesAnimals'
import { CHARADES_INTERNET_SLANG } from './content/decks/charadesInternetSlang'
import { CHARADES_FOOD_DRINKS } from './content/decks/charadesFoodDrinks'
import { CHARADES_SPORTS } from './content/decks/charadesSports'
import { CHARADES_AI_TECH } from './content/decks/charadesAiTech'
import { CHARADES_CELEBRITIES } from './content/decks/charadesCelebrities'
import { CHARADES_INFLUENCERS } from './content/decks/charadesInfluencers'
import { CHARADES_NATURAL_DISASTERS } from './content/decks/charadesNaturalDisasters'
import { CHARADES_FOOTBALL_CLUBS } from './content/decks/charadesFootballClubs'
import { CHARADES_MUSIC_GENRES } from './content/decks/charadesMusicGenres'
import { CHARADES_POLITICIANS } from './content/decks/charadesPoliticians'

export interface CharadesCategory {
  id: string
  label: string
  icon: string
}

/* ─── Categories (matches Figma "Select Category" screen) ─── */
export const CHARADES_CATEGORIES: CharadesCategory[] = [
  { id: 'movies',            label: 'Movies',          icon: '/icons/charades-movies.svg' },
  { id: 'tv-shows',          label: 'TV Shows',        icon: '/icons/charades-tv-shows.svg' },
  { id: 'hobbies',           label: 'Hobbies',         icon: '/icons/charades-hobbies.svg' },
  { id: 'songs',             label: 'Songs',           icon: '/icons/charades-songs.svg' },
  { id: 'music-artists',     label: 'Music Artists',   icon: '/icons/charades-music-artists.svg' },
  { id: 'apps',              label: 'Apps',            icon: '/icons/charades-apps.svg' },
  { id: 'countries',         label: 'Countries',       icon: '/icons/charades-countries.svg' },
  { id: 'animals',           label: 'Animals',         icon: '/icons/charades-animals.svg' },
  { id: 'internet-slang',    label: 'Internet Slang',  icon: '/icons/charades-internet-slang.svg' },
  { id: 'food-drinks',       label: 'Food & Drinks',   icon: '/icons/charades-food.svg' },
  { id: 'sports',            label: 'Sports',          icon: '/icons/charades-sports.svg' },
  { id: 'ai-tech',           label: 'AI & Tech',       icon: '/icons/charades-ai-tech.svg' },
  { id: 'celebrities',       label: 'Celebrities',     icon: '/icons/charades-celebrities.svg' },
  { id: 'influencers',       label: 'Influencers',     icon: '/icons/charades-influencers.svg' },
  { id: 'natural-disasters', label: 'Natural Disasters', icon: '/icons/charades-natural-disasters.svg' },
  { id: 'football-clubs',    label: 'Football Clubs',  icon: '/icons/charades-football-clubs.svg' },
  { id: 'music-genres',      label: 'Music Genres',    icon: '/icons/charades-music-genres.svg' },
  { id: 'politicians',       label: 'Politicians',     icon: '/icons/charades-politicians.svg' },
]

/* ─── Prompt banks — short (1-4 words), family-friendly, actable ─── */
const BASE_CHARADES_PROMPTS: Record<string, string[]> = {
  movies: [
    'Titanic', 'Jaws', 'Frozen', 'Inception', 'Avatar', 'Jurassic Park', 'The Lion King',
    'Star Wars', 'Home Alone', 'Shrek', 'Finding Nemo', 'The Matrix', 'Toy Story',
    'Spider-Man', 'Batman', 'Grease', 'Rocky', 'E.T.', 'Jumanji', 'Aladdin', 'Moana',
    'Up', 'Cars', 'The Grinch', 'Ghostbusters', 'King Kong', 'Godzilla', 'Frankenstein',
    'Dracula', 'Mulan',
  ],
  'tv-shows': [
    'Friends', 'The Office', 'Breaking Bad', 'Stranger Things', 'Game of Thrones',
    'SpongeBob', 'The Simpsons', 'Money Heist', 'Squid Game', 'Peaky Blinders',
    'Sesame Street', 'MasterChef', 'Big Brother', 'Survivor', 'American Idol',
    'The Voice', 'Power Rangers', 'Tom and Jerry', 'Scooby-Doo', 'Teletubbies',
    'Doctor Who', 'The Crown', 'Narcos', 'Dora the Explorer', 'Pokemon',
  ],
  hobbies: [
    'Painting', 'Fishing', 'Knitting', 'Gardening', 'Photography', 'Cooking', 'Dancing',
    'Swimming', 'Skateboarding', 'Chess', 'Yoga', 'Surfing', 'Baking', 'Reading',
    'Gaming', 'Singing', 'Camping', 'Cycling', 'Bowling', 'Sculpting', 'Origami',
    'Juggling', 'Skiing', 'Archery', 'Pottery', 'Karate', 'Boxing', 'Hiking',
    'Sewing', 'Collecting Stamps',
  ],
  songs: [
    'Happy Birthday', 'Jingle Bells', 'Twinkle Twinkle', 'Old MacDonald', 'Row Your Boat',
    'Wheels on the Bus', 'ABC Song', 'Head Shoulders Knees and Toes', "If You're Happy",
    'Itsy Bitsy Spider', 'Rain Rain Go Away', 'London Bridge', 'Mary Had a Lamb',
    'Hokey Pokey', 'Bingo', 'Frere Jacques', 'This Old Man', 'Five Little Ducks',
    'Pop Goes the Weasel', 'Ring Around the Rosie', 'Deck the Halls', 'Thriller',
    'Y.M.C.A.', 'Macarena', 'Gangnam Style',
  ],
  'music-artists': [
    'Michael Jackson', 'Beyonce', 'Elvis Presley', 'Adele', 'Rihanna', 'Elton John',
    'Madonna', 'Whitney Houston', 'Bob Marley', 'Freddie Mercury', 'Taylor Swift',
    'Ed Sheeran', 'Justin Bieber', 'Drake', 'Stevie Wonder', 'Prince', 'Tina Turner',
    'John Lennon', 'Cher', 'Shakira', 'Eminem', 'Kanye West', 'Celine Dion',
    'Mariah Carey', 'Bruno Mars', 'Katy Perry', 'Lady Gaga',
  ],
  apps: [
    'Instagram', 'TikTok', 'WhatsApp', 'Snapchat', 'YouTube', 'Facebook', 'Twitter',
    'Netflix', 'Spotify', 'Zoom', 'Uber', 'Google Maps', 'Gmail', 'Amazon', 'PayPal',
    'LinkedIn', 'Pinterest', 'Reddit', 'Telegram', 'Duolingo', 'Candy Crush', 'Shazam',
    'Venmo', 'Airbnb', 'Discord', 'Tinder', 'Waze', 'Calculator', 'Calendar', 'Camera',
  ],
  countries: [
    'Nigeria', 'Brazil', 'Japan', 'France', 'Egypt', 'India', 'Mexico', 'Canada',
    'Germany', 'Italy', 'China', 'Australia', 'Kenya', 'Spain', 'Russia', 'Greece',
    'Jamaica', 'Ghana', 'South Korea', 'Ireland', 'Argentina', 'Turkey', 'Thailand',
    'Switzerland', 'Netherlands', 'Sweden', 'Morocco', 'Colombia', 'Cuba', 'Iceland',
  ],
  animals: [
    'Elephant', 'Lion', 'Kangaroo', 'Penguin', 'Giraffe', 'Monkey', 'Snake', 'Gorilla',
    'Dolphin', 'Eagle', 'Butterfly', 'Spider', 'Octopus', 'Rabbit', 'Bear', 'Frog',
    'Owl', 'Peacock', 'Crab', 'Shark', 'Zebra', 'Camel', 'Koala', 'Flamingo',
    'Cheetah', 'Turtle', 'Chicken', 'Duck', 'Horse', 'Cat',
  ],
  'internet-slang': [
    'LOL', 'FOMO', 'GOAT', 'Ghosting', 'Flexing', 'Simp', 'No Cap', 'Rizz',
    'Cringe', 'Vibe Check', 'Slay', 'Bet', 'Sus', 'Lowkey', 'Highkey', 'Salty',
    'Savage', 'Extra', 'Mood', 'Yeet', 'Bruh', 'Glow Up', 'Shade', 'Ratio',
  ],
  'food-drinks': [
    'Pizza', 'Jollof Rice', 'Sushi', 'Ice Cream', 'Spaghetti', 'Burger', 'Pancakes',
    'Popcorn', 'Coffee', 'Smoothie', 'Tacos', 'Waffles', 'Fried Chicken', 'Cupcake',
    'Hot Dog', 'Donut', 'Milkshake', 'Sandwich', 'Soup', 'Salad', 'Chocolate',
    'Watermelon', 'Banana', 'Cheese', 'Bread', 'Rice', 'Noodles', 'Pie', 'Lemonade',
  ],
  sports: [
    'Football', 'Basketball', 'Tennis', 'Swimming', 'Boxing', 'Golf', 'Cricket',
    'Baseball', 'Volleyball', 'Hockey', 'Skiing', 'Surfing', 'Wrestling', 'Archery',
    'Bowling', 'Table Tennis', 'Rugby', 'Karate', 'Gymnastics', 'Rowing', 'Fencing',
    'Badminton', 'Darts', 'Sprinting', 'Long Jump', 'Weightlifting', 'Diving',
    'Cycling', 'Snowboarding',
  ],
  'ai-tech': [
    'Robot', 'Chatbot', 'Smartphone', 'Drone', 'Virtual Reality', 'Self-Driving Car',
    'Smartwatch', '3D Printer', 'Video Call', 'Wifi', 'Bluetooth', 'Computer',
    'Keyboard', 'Battery', 'Charger', 'Password', 'Hologram', 'Satellite',
    'Solar Panel', 'GPS', 'QR Code', 'Podcast', 'Livestream', 'Emoji', 'Meme',
    'Selfie', 'Screenshot',
  ],
  celebrities: [
    'Will Smith', 'Oprah Winfrey', 'Dwayne Johnson', 'Chris Rock', 'Rihanna',
    'Tom Cruise', 'Jackie Chan', 'Serena Williams', 'Cristiano Ronaldo', 'Lionel Messi',
    'LeBron James', 'Ellen DeGeneres', 'Kevin Hart', 'Charlie Chaplin', 'Marilyn Monroe',
    'Albert Einstein', 'Steve Jobs', 'Elon Musk', 'Barack Obama', 'Nelson Mandela',
    'Bruce Lee', 'Mr. Bean', 'Zendaya', 'Idris Elba', 'Denzel Washington',
    'Meryl Streep', 'Jim Carrey', 'Angelina Jolie',
  ],
  influencers: [
    'MrBeast', 'Khaby Lame', "Charli D'Amelio", 'Addison Rae', 'PewDiePie',
    'Logan Paul', 'James Charles', 'Jake Paul', 'Bella Poarch', 'Zach King',
    'David Dobrik', 'Emma Chamberlain', 'Casey Neistat', 'Lele Pons', 'Liza Koshy',
    'KSI', 'Markiplier', 'Ninja', 'Kylie Jenner', 'Kim Kardashian', 'Jeffree Star',
  ],
  'natural-disasters': [
    'Earthquake', 'Tsunami', 'Hurricane', 'Volcano Eruption', 'Tornado', 'Flood',
    'Wildfire', 'Blizzard', 'Drought', 'Landslide', 'Avalanche', 'Sandstorm',
    'Lightning Strike', 'Hailstorm', 'Heatwave', 'Cyclone', 'Thunderstorm', 'Frost',
    'Monsoon',
  ],
  'football-clubs': [
    'Manchester United', 'Real Madrid', 'Barcelona', 'Liverpool', 'Chelsea', 'Arsenal',
    'Bayern Munich', 'Juventus', 'Manchester City', 'PSG', 'AC Milan', 'Inter Milan',
    'Tottenham', 'Atletico Madrid', 'Borussia Dortmund', 'Ajax', 'Napoli',
    'Leicester City', 'West Ham', 'Everton', 'Newcastle', 'Aston Villa', 'Sevilla',
    'Porto', 'Benfica', 'Celtic', 'Marseille', 'Lyon', 'Monaco',
  ],
  'music-genres': [
    'Hip Hop', 'Jazz', 'Rock', 'Reggae', 'Country', 'Pop', 'Classical', 'Blues',
    'Afrobeats', 'Gospel', 'Techno', 'Salsa', 'Disco', 'Punk', 'Metal', 'R&B',
    'Folk', 'Opera', 'House', 'Soul', 'Funk', 'Ska', 'Grunge', 'Dancehall',
    'Highlife', 'K-Pop', 'Latin', 'Indie', 'Trap', 'Bluegrass',
  ],
  politicians: [
    'Barack Obama', 'Donald Trump', 'Joe Biden', 'Winston Churchill', 'Nelson Mandela',
    'Abraham Lincoln', 'Margaret Thatcher', 'Angela Merkel', 'Vladimir Putin',
    'Queen Elizabeth', 'Kamala Harris', 'Martin Luther King', 'Mahatma Gandhi',
    'George Washington', 'Napoleon', 'Julius Caesar', 'Justin Trudeau',
    'Emmanuel Macron', 'Boris Johnson', 'Kwame Nkrumah', 'Indira Gandhi',
    'Fidel Castro', 'John F. Kennedy',
  ],
}

export const CHARADES_PROMPTS: Record<string, string[]> = {
  movies: Array.from(CHARADES_MOVIES),
  'tv-shows': Array.from(CHARADES_TV_SHOWS),
  hobbies: Array.from(CHARADES_HOBBIES),
  songs: Array.from(CHARADES_SONGS),
  'music-artists': Array.from(CHARADES_MUSIC_ARTISTS),
  apps: Array.from(CHARADES_APPS),
  countries: Array.from(CHARADES_COUNTRIES),
  animals: Array.from(CHARADES_ANIMALS),
  'internet-slang': Array.from(CHARADES_INTERNET_SLANG),
  'food-drinks': Array.from(CHARADES_FOOD_DRINKS),
  sports: Array.from(CHARADES_SPORTS),
  'ai-tech': Array.from(CHARADES_AI_TECH),
  celebrities: Array.from(CHARADES_CELEBRITIES),
  influencers: Array.from(CHARADES_INFLUENCERS),
  'natural-disasters': Array.from(CHARADES_NATURAL_DISASTERS),
  'football-clubs': Array.from(CHARADES_FOOTBALL_CLUBS),
  'music-genres': Array.from(CHARADES_MUSIC_GENRES),
  politicians: Array.from(CHARADES_POLITICIANS),
}

/**
 * Build a shuffled deck for the given selection.
 * Custom cards always take priority; the remainder is filled from the
 * selected categories' prompt pools (deduped, capped at deckSize).
 */
export function buildCharadesDeck(
  customCards: string[],
  selectedCategoryIds: string[],
  deckSize: number,
): string[] {
  const used = new Set<string>()
  const deck: string[] = []

  for (const c of customCards) {
    const trimmed = c.trim()
    if (!trimmed || used.has(trimmed.toLowerCase())) continue
    used.add(trimmed.toLowerCase())
    deck.push(trimmed)
    if (deck.length >= deckSize) return deck
  }

  const remaining = deckSize - deck.length
  if (remaining <= 0) return deck

  const pool: string[] = []
  for (const catId of selectedCategoryIds) {
    for (const prompt of CHARADES_PROMPTS[catId] ?? []) {
      if (!used.has(prompt.toLowerCase())) {
        used.add(prompt.toLowerCase())
        pool.push(prompt)
      }
    }
  }

  // A narrow category can contain fewer items than the requested session.
  // Keep the selected categories first, then fill from the wider Charades
  // library so a session never recycles a prompt or ends with blank cards.
  if (pool.length < remaining) {
    for (const prompts of Object.values(CHARADES_PROMPTS)) {
      for (const prompt of prompts) {
        const key = prompt.toLowerCase()
        if (!used.has(key)) {
          used.add(key)
          pool.push(prompt)
        }
      }
    }
  }

  const shuffledPool = getShuffledDeck(pool, 'charades', remaining)

  deck.push(...shuffledPool)
  return deck
}
