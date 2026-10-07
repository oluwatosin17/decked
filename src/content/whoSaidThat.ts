type PromptFrame = (topic: string) => string

const build = (topics: readonly string[], frames: readonly PromptFrame[]) => frames.flatMap(frame => topics.map(frame))

const memorySettings = ['primary school', 'secondary school', 'a family gathering', 'a birthday', 'a holiday', 'a road trip', 'a party', 'a sleepover', 'a first date', 'a group chat'] as const
const memoryFrames: PromptFrame[] = [
  topic => `What is your funniest memory from ${topic}?`,
  topic => `What is the most embarrassing thing that happened to you during ${topic}?`,
  topic => `What is one detail from ${topic} that you will never forget?`,
  topic => `What is the strangest decision you made during ${topic}?`,
  topic => `What harmless lie did you tell around the time of ${topic}?`,
  topic => `What would your friends be surprised to learn about your experience of ${topic}?`,
]

const preferenceTopics = ['food', 'music', 'movies', 'fashion', 'travel', 'dating', 'sports', 'social media', 'weekends', 'gifts'] as const
const preferenceFrames: PromptFrame[] = [
  topic => `What is your most controversial opinion about ${topic}?`,
  topic => `What is your guilty pleasure when it comes to ${topic}?`,
  topic => `What is one popular thing about ${topic} that you secretly dislike?`,
  topic => `What is your oddly specific rule about ${topic}?`,
  topic => `What is the most money you have regretted spending on ${topic}?`,
  topic => `What choice involving ${topic} says the most about your personality?`,
]

const everydayTopics = ['cooking', 'shopping', 'public transport', 'work', 'cleaning', 'technology', 'money', 'photos', 'mornings', 'late nights'] as const
const everydayFrames: PromptFrame[] = [
  topic => `What is the most chaotic thing you have done while ${topic}?`,
  topic => `What mistake involving ${topic} do you keep making?`,
  topic => `What shortcut do you always take with ${topic}?`,
  topic => `What is your weirdest habit connected to ${topic}?`,
  topic => `What would your warning label say about you and ${topic}?`,
  topic => `What is the funniest excuse you have used because of ${topic}?`,
]

const hypotheticalTopics = ['being invisible', 'reading minds', 'time travel', 'winning the lottery', 'living on Mars', 'becoming famous', 'switching bodies', 'having a clone', 'stopping time', 'talking to animals'] as const
const hypotheticalFrames: PromptFrame[] = [
  topic => `What is the first thing you would do if you suddenly experienced ${topic}?`,
  topic => `What is the most irresponsible thing you might do with ${topic}?`,
  topic => `Who would you tell first if ${topic} became real for you?`,
  topic => `What everyday problem would you solve using ${topic}?`,
  topic => `What part of ${topic} would become annoying surprisingly quickly?`,
  topic => `What secret rule would you make for yourself if you had ${topic}?`,
]

const socialTopics = ['your best friend', 'your family', 'your coworkers', 'your neighbors', 'your exes', 'your classmates', 'your group chat', 'your childhood friends', 'your travel companions', 'people at parties'] as const
const socialFrames: PromptFrame[] = [
  topic => `What is something ${topic} would immediately recognize as being yours?`,
  topic => `What story would ${topic} tell to embarrass you?`,
  topic => `What phrase do ${topic} hear you say too often?`,
  topic => `What role do you naturally play around ${topic}?`,
  topic => `What harmless habit would ${topic} tease you about?`,
  topic => `What surprising compliment would ${topic} give you?`,
]

export const WHO_SAID_THAT_PROMPTS = [
  ...build(memorySettings, memoryFrames),
  ...build(preferenceTopics, preferenceFrames),
  ...build(everydayTopics, everydayFrames),
  ...build(hypotheticalTopics, hypotheticalFrames),
  ...build(socialTopics, socialFrames),
]

