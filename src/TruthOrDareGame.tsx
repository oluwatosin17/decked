/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useCallback } from 'react'
import SharedPlayerSetup, { type Player } from './components/PlayerSetup'
import { useScaledCard } from './hooks/useCardScale'
import { GameNav, GameFooter } from './components/GameShell'
import { getShuffledDeck } from './utils/deckShuffle'

type SetPlayers = React.Dispatch<React.SetStateAction<Player[]>>

/* ─── Asset URLs (permanently hosted on Cloudinary) ─── */
const HEART_FILLED     = 'https://res.cloudinary.com/oluwatosin17/image/upload/decked/game-assets/heart-filled.svg'
const HEART_GAME       = 'https://res.cloudinary.com/oluwatosin17/image/upload/decked/game-assets/heart-filled.svg'
const SOCIAL_TIKTOK    = '/icons/social-tiktok.svg'
const SOCIAL_INSTAGRAM = '/icons/social-instagram.svg'
const SOCIAL_WHATSAPP  = '/icons/social-whatsapp.svg'

const PLAYER_COLORS = ['#dc2827','#9b59b6','#27ae60','#e67e22','#3498db','#e91e63','#f39c12','#1abc9c']

/* ─── Game prompts ─── */
const TRUTHS = [
  "What was your first impression of your partner, and what do you think now?",
  "Where is the most adventurous place you've ever wanted to be kissed?",
  "What's a romantic fantasy you've never shared with anyone?",
  "What physical feature do you notice first when you're attracted to someone?",
  "Have you ever had a dream about someone in this room that made you blush?",
  "What's the most romantic thing someone has ever done for you?",
  "What's something your partner does that secretly drives you wild?",
  "If you could relive one intimate moment from your relationship, which would it be?",
  "What's a guilty pleasure you enjoy when your partner isn't around?",
  "Have you ever been attracted to someone you definitely shouldn't have been?",
  "What's the boldest move you've ever made on someone you were into?",
  "What outfit does your partner wear that you find irresistible?",
  "What's a secret turn-on you've never admitted out loud?",
  "Have you ever sent a flirty message to the wrong person?",
  "What's the most embarrassing thing that's happened to you during a date?",
  "If we had no plans tomorrow, how would you want to spend tonight?",
  "What's the longest you've ever thought about a single kiss?",
  "What song makes you think about romance or intimacy every time you hear it?",
  "Have you ever pretended to like something in the bedroom just to please your partner?",
  "What's a compliment you've received that still makes your heart race?",
  "What's the most spontaneous romantic thing you've ever done?",
  "If you could describe your ideal date night in three words, what would they be?",
  "What's something you find attractive that most people would find unusual?",
  "Have you ever written something romantic — a letter, poem, or text — that you never sent?",
  "What part of your body do you feel most confident about?",
  "What's the most intimate non-physical thing a partner has ever done for you?",
  "When did you first realize you were genuinely attracted to your partner?",
  "What's a romantic movie scene you secretly wish would happen to you?",
  "Have you ever had a crush on a close friend's partner?",
  "What's the naughtiest thought you've had about your partner in public?",
  "If your partner could read your mind for one hour, what would surprise them most?",
  "What's something you want your partner to do more of in the bedroom?",
  "Have you ever been caught in an embarrassing romantic moment?",
  "What's a dating rule you've broken that turned out really well?",
  "What do you think is the most attractive thing about yourself?",
  "Have you ever faked enjoying a kiss? What happened?",
  "What's the biggest romantic risk you've ever taken?",
  "If you could change one thing about your love life right now, what would it be?",
  "What's something flirty your partner said that you still think about?",
  "Have you ever felt butterflies with someone while you were already in a relationship?",
  "What's the most seductive thing someone has ever whispered to you?",
  "What would you do if your partner dared you to skinny dip right now?",
  "What's a fantasy scenario you've imagined but never brought up?",
  "Have you ever used a dating app while in a 'it's complicated' situation?",
  "What physical affection do you crave most — kisses, cuddles, or something else?",
  "What's the most romantic text you've ever received?",
  "If you had to describe your kissing style, what would you say?",
  "What's one thing your partner does that instantly puts you in the mood?",
  "Have you ever lied about your number of past relationships? By how many?",
  "What's the spiciest thing on your romantic bucket list that you haven't done yet?",
  "What's the worst thing you've ever done at work?", "Do you have any fetishes?", "What's something you're glad your family doesn't know about you?", "Have you ever cheated on someone?", "What's the worst thing you've ever done?", "What are your thoughts on polyamory?", "What's the worst intimate experience you've ever had?", "What's the best intimate experience you've ever had?", "Have you ever broken the law?", "Have you ever slid into someone's DMs?", "If you had to never speak to someone in this room again, who would it be and why?", "Do you have a least favourite sibling and why?", "Do you have a least favourite family member and why?", "Have you ever stayed friends with someone because it benefitted you beyond just the friendship?", "Who would you like to kiss in this room?", "Have you ever had a run in with the law?", "What's the worst thing you've ever said to anyone?", "Have you ever been caught doing something you shouldn't have?", "What's the worst date you've been on?", "What's the best date you've been on?", "What happened on the latest night out you had?", "What's your biggest regret?", "Have you ever said something you regret about someone in this room?", "Have you ever lied to get out of a bad date?", "What's the most trouble you've been in?", "When did you last have sex outside?", "What's the worst thing you've lied about?", "What's one thing you wish you'd lied about?", "Name a time you think you were a bad partner", "If you had to cut one friend out of your life, who would it be?", "What's your guilty pleasure?", "If you had to get back with an ex, who would you choose?", "Do you have a favourite friend?", "What's your biggest turn on?", "If you could swap lives with someone in this room, who would it be?", "Have you ever told a lie about your best friend to make yourself look better?", "Have you ever had a holiday romance?", "Have you ever had a festival romance?", "What is something you would do if you knew there were no consequences?", "What’s your toxic trait?", "Do you still have feelings for any of your exes?", "What’s more important to you - love or money?", "Who do you think should pay on a first date?", "What nickname do you call your partner/they call you?", "What's the worst nickname you've ever been given?", "If you could change one thing you've done, what would it be?", "Where's the weirdest place you peed?", "What's the strangest dream you've had?", "Where's the weirdest place you've had sex?", "What's one thing you only do when you're alone?", "What's the strangest rumour you've heard about yourself?", "What's your favourite gross food combination?", "What's the weirdest lie you've ever told?", "Tell me about your first kiss.", "What was the most inappropriate time you farted?", "What's something you really hope your family never finds out about?", "Who do you think is the worst-dressed person in this room?", "What's your worst fashion moment?", "What's your biggest pet peeve?", "What TV character do you relate to the most?", "Who do you like best - Kris, Kourtney, Kim, Khloé, Kendall or Kylie?", "Have you ever dined and dashed?", "Have you ever had sex on the beach?", "What’s one way I could support you better?", "What makes you feel most loved by me?", "What is one of your happiest childhood memories?", "What’s something you’re proud of right now?", "How has your definition of love changed since we met?", "What’s a dream you’d love us to pursue together?", "What’s something I do that always makes you smile?", "How do you like to be comforted when you’re sad?", "What’s a small habit you’d like us to add into our daily routine?", "What scares you most about the future?", "What’s your love language?", "What did you admire about your parents’ relationship?", "How do you feel when we argue?", "What’s one thing you hope never changes about us?", "What kind of grandparents do you want us to be one day?", "What’s your favourite memory of us so far?", "How do you think we’ve grown as a couple?", "What makes you feel sexy and desired?", "What’s something you’d like us to do more of together?", "What’s one thing you’d like to thank me for?", "What was your first impression of me?", "What’s the cheesiest thing I’ve ever done for you?", "What’s your guilty pleasure TV show?", "If we swapped lives for a day, what would you do first?", "Which celebrity would play me in a film?", "What’s the funniest thing I’ve said in my sleep?", "What’s a secret talent you’ve never told me about?", "If you had to rename me, what name would you pick?", "What’s the weirdest food combo you secretly love?", "Who’s more stubborn: you or me?", "What’s a silly argument we’ve had that makes you laugh now?", "If you could only eat one meal forever, what would it be?", "Which emoji reminds you most of me?", "What’s the first thing you’d buy if we won the lottery?", "What’s my weirdest habit?", "What’s something you’ve always wanted to learn?", "Who’s the bigger romantic?", "What’s my worst dance move?", "If our love was a film, what genre would it be?", "What was your first crush, and do you still remember why?", "What’s your flirting style when you actually like someone?", "What’s the biggest relationship green flag you look for early on?", "What’s your ideal first date vibe?", "What’s a romantic gesture that always works on you?", "What’s your love language, and do you think it’s changed over time?", "What’s the fastest way someone has ever won you over?", "Have you ever caught feelings because of good banter alone?", "What’s a texting habit that instantly makes you feel closer to someone?", "What’s something small that makes a first date feel promising?", "What’s a dating red flag you’ve learned to spot early?", "Do you believe in instant chemistry, or does attraction grow for you?", "What’s your favorite way someone shows romantic interest?", "What’s a compliment you secretly love hearing?", "What’s your biggest dating pet peeve?", "What’s the most attractive personality trait someone can have?", "Have you ever had a crush that surprised you?", "What’s something someone can do that gives you instant butterflies?", "What’s something that feels more intimate than people expect?", "What’s the smoothest thing you’ve ever said while flirting?", "Have you ever kissed more than one person in the same day?", "What’s the biggest age gap you’ve ever had in a relationship or situation?", "Have you ever had a crush on someone you definitely shouldn’t have?", "Have you ever had feelings for two people at once?", "Have you ever lied about being single (or taken)?", "If you opened up your relationship, who would be the first person you’d want to go on a date with?", "Have you ever caught feelings for someone you told yourself was “just for fun”?", "What’s the messiest situation you’ve ever willingly walked into?", "Have you ever gone on a date knowing you were already into someone else?", "Have you ever kept talking to someone even though you knew it wouldn’t end well?", "What’s the most inconvenient crush you’ve had as an adult?", "Have you ever flirted your way into (or out of) a situation?", "What’s a relationship rule you’ve broken—and would you do it again?", "Have you ever wanted someone more because they were unavailable?", "What’s the boldest dating decision you’ve ever made?", "Have you ever gone back to someone you swore you were done with?", "What’s the fastest you’ve ever caught feelings?", "Who’s your biggest dating “what if”?", "What’s a dating choice you’d defend, even if everyone judged you for it?", "Have you ever ignored red flags because the chemistry was too good?", "What’s the most embarrassing thing you’ve done on a date that still haunts you?", "What’s a dating habit you swear you’ll stop…yet keep repeating?", "What’s the worst excuse you’ve ever used to cancel plans?", "Have you ever stalked someone so hard you scared yourself?", "What’s the cringiest thing you’ve said while trying to flirt?", "What’s a red flag you ignored because someone was hot?", "What’s the most unhinged thing you’ve done after one good date?", "Have you ever pretended to like something just to impress someone?", "What’s a dating dealbreaker you loudly claim to have but never enforce?", "What’s the pettiest reason you’ve lost interest in someone?", "Have you ever overanalyzed a text that clearly meant nothing?", "What’s the worst place you’ve run into someone you were dating?", "What’s the fastest you’ve ever gotten the ick?", "Have you ever googled someone and instantly wished you hadn’t?", "What’s a date you knew was a bad idea but agreed to anyway?", "What’s a dating app bio line that makes you immediately swipe left?", "Have you ever stayed on a date just to be polite?", "What’s the funniest misunderstanding you’ve had while dating?", "What’s something you pretended was casual that absolutely was not?", "What’s a dating opinion you have that would start a group chat fight?", "Have you ever laughed so hard that you peed a little?", "If you could swap bodies with any celebrity for a day, who would it be and why?", "What’s your browsing history for 3 days?", "One thing you would do, if you were invisible?", "What are some things you think about sitting on toilet?", "If you farted in an elevator full of people, what would be your reaction?", "Weirdest thing you have done in front of the mirror?", "What’s the most unusual talent you have that most people don’t know about?", "What’s the most hilarious mistake you’ve made while cooking or baking?", "Most embarrassing moment in public?", "Have you ever accidentally sent a sext to the wrong person?", "Who would you like to sext right now?", "...Why don’t you do it?", "Who in your contact list would you most want us to have a threesome with?", "What’s your favorite body part of mine?", "What’s your biggest roleplay fantasy?", "Who was the first person you had a crush on?", "Where’s the craziest place you want to hook up with me?", "Have you ever had a sex dream about me?", "What’s the weirdest thing anyone has ever said to you during sex?", "What’s the weirdest thing you’ve ever said to anyone during sex?", "Would you like to make a sex tape with me?", "Would you rather do a pole dance or a striptease?", "What part of my body would you like to lick right now?", "How many one-night stands have you had?", "Have you ever put a sexy selfie on social media?", "What’s your biggest turn-on when you think about me?", "If I gave you whipped cream right now, what would you do with it?", "What’s the dirtiest thing you’d like me to do to you?", "Do you think my best friend is hot?", "How soon after meeting someone have you slept with them for the first time?", "Have you ever broken a bed during sex?", "Would you rather only sext for the rest of your life, or only have phone sex?", "What common turn-off really turns you on?", "When did you first realize you were attracted to me?", "Have you ever faked an orgasm?", "Have you ever faked an orgasm... with me?", "Have you ever slept with a co-worker?", "Would you want a threesome with me and my best friend?", "Would you want a threesome with me and your best friend?", "What’s the craziest thing you’ve done in a sex dream?", "Have you ever been turned on at work?", "...What happened?", "...And what did you do about it?", "Have you ever been to a sex club?", "...Would you like to?", "When was the last time I turned you on?", "Is there a sex toy you’d like to try on me?", "Have you ever injured yourself during sex?", "Have you ever had sex in a public place?", "When was the last time you touched yourself?", "...What were you thinking about?", "Would you rather be dominant or submissive?", "Have you ever fallen asleep during sex?", "Have you ever been to a strip club?", "Has anyone ever walked in on you during sex?", "Would you rather only use your tongue or only use your fingers?", "What’s your favorite thing about my body?", "Would you rather only have morning sex for the rest of your life, or never have morning sex again?", "What was your first sexual fantasy?", "Have you ever tried swinging or partner swapping?", "...Would you like to?", "Which celebrity would you like to see me make out with?", "Would you like to watch me make out with my best friend?", "Would you like to watch me make out with your best friend?", "How would you describe my sexual personality?", "What’s your favorite memory of us having sex?", "...Is there anything that could have made it even better?", "What’s the sexiest gift I could give you?", "What’s the sexiest gift you’d like to give me?", "Have you ever kept a relationship secret?", "What’s your most romantic memory of me?", "Have you ever experimented with people of different genders?",

]

const DARES = [
  "Give your partner a slow, 30-second kiss right now.",
  "Whisper something in your partner's ear that would make them blush.",
  "Give your partner a neck massage for one full minute.",
  "Do your most seductive walk across the room.",
  "Let your partner choose a spot on your body and kiss it.",
  "Send your partner the flirtiest text you can think of — read it aloud first.",
  "Recreate the most romantic scene from a movie with your partner.",
  "Slow dance with your partner for 60 seconds — no music allowed.",
  "Look into your partner's eyes for 60 seconds without looking away or laughing.",
  "Give your partner three genuine compliments about their appearance right now.",
  "Let your partner feed you something using only their hands.",
  "Do your best impression of how your partner flirts with you.",
  "Kiss your partner's hand like you're in a romance novel.",
  "Describe your partner using only words that start with 'S' for 30 seconds.",
  "Give your partner a piggyback ride across the room.",
  "Tell your partner the exact moment you knew you wanted to kiss them.",
  "Let your partner style your hair however they want for the rest of the game.",
  "Hold your partner's face and tell them three things you adore about them.",
  "Act out the story of your first kiss together — with full dramatic flair.",
  "Remove one piece of clothing — your choice.",
  "Let your partner draw a heart anywhere on your body with their finger.",
  "Serenade your partner with any love song — even badly.",
  "Give your partner a forehead kiss and tell them why they're special to you.",
  "Show your partner the last photo you secretly took of them on your phone.",
  "Do your best 'bedroom eyes' look and hold it for 10 seconds.",
  "Let your partner pick a dare from the next round for you in advance.",
  "Blindfold yourself and let your partner guide you around the room for 30 seconds.",
  "Write 'I love you' on your partner's arm with your finger — very slowly.",
  "Share the lock screen on your phone and explain why you chose it.",
  "Sit on your partner's lap for the next two rounds.",
  "Give your partner a butterfly kiss using only your eyelashes.",
  "Reenact the first time you said 'I love you' to each other.",
  "Let your partner choose your outfit for the rest of the evening.",
  "Kiss each of your partner's fingertips one at a time.",
  "Record a 15-second voice note telling your partner why they're attractive.",
  "Do a dramatic reading of your last flirty text exchange with your partner.",
  "Give your partner a compliment that would make a stranger uncomfortable.",
  "Let your partner take a selfie with you in the most romantic pose possible.",
  "Hug your partner from behind and whisper something sweet.",
  "Play with your partner's hair for 30 seconds while maintaining eye contact.",
  "Tell your partner about a time they looked so good it distracted you.",
  "Demonstrate your ideal first-date goodbye on your partner.",
  "Write a two-line love poem about your partner and read it dramatically.",
  "Trace the outline of your partner's lips with your finger.",
  "Put on your partner's favorite song and dance together for the full chorus.",
  "Carry your partner bridal-style across the room — or at least try.",
  "Let your partner leave a lipstick mark (or pretend to) anywhere they choose.",
  "Share one thing you want to try together that you've been too shy to mention.",
  "Take your partner's hand and kiss their wrist slowly.",
  "Describe in detail what your perfect romantic evening with your partner looks like.",
  "Put an ice cube in your underwear for one minute.", "Perform a sexy belly dance for your partner.", "Blindfold your partner and guide them around your body using only touch.", "Undress your partner using only your teeth.", "Clean the house naked.", "Go about your normal day but with no underwear on.", "Give your partner a massage, blindfolded.", "Remove your partner’s underwear using only your feet.", "Use each other as a human plate — whipped cream, chocolate sauce, whatever takes your fancy!", "Share a fantasy that your loved one’s never heard before.", "Handcuff your partner and treat them to their favorite turn-ons.", "Read an erotic bedtime story out loud.", "Set up a nude photo shoot and capture your favorite poses.", "Go skinny dipping in your local river or lake.", "Sext your partner during work.", "Touch yourselves while your partner watches.", "Give your partner a lap dance.", "Pick one part of your body and have your partner focus all their attention there.", "Choose a place you’ve never had sex and take your partner there.", "Draw a picture with whipped cream on your partner’s body.", "...Then lick it off.", "Try a new pick-up line on your partner.", "Re-enact an X-rated version of your first kiss.", "Choose your fantasy orgy guests from your partner’s contact list.", "Play the rest of the game naked.", "Feed your partner using only your mouth.", "Give your significant other a full-body massage.", "Kiss your partner passionately, like the climax of a movie.", "Perform a sexy pole dance with a broom or a mop.", "Use body paint to turn each other into a work of art.", "Twerk to the sexiest song you can think of.", "Confess your kinky guilty pleasure and try it together.", "Let your partner dress you up, then direct you in a striptease.", "Challenge your loved one to a sexy pillow fight.", "Spell out what you want to do to your partner using only emojis.", "Pretend you work at a phone sex line and have your partner call in.", "Blindfold yourself and guess which part of your partner’s body you’re touching.", "Play with melted wax (but be careful!)", "Hide chocolate or candy in your clothes and have your significant other find it.", "Send a sexy selfie when they least expect it.", "Balance an ice cube on your belly button for as long as you can bear it.", "Show your partner the last X-rated clip you watched.", "...And describe why it turned you on.", "Put on your significant other’s underwear and strut your stuff on the catwalk.", "Shave your partner’s body hair.", "Pretend to give oral sex to the nearest object you see.", "Leave a steamy voicemail for an ex or another friend.", "Lick peanut butter, whipped cream, or chocolate sauce off someone else’s finger.", "Fake an orgasm for one minute.", "Play spin the bottle and kiss the person the bottle chooses.", "Act out your favorite sex position with the person to your left.", "Pretend to give oral sex to a bottle for 30 seconds.", "If there’s a pool or a hot tub, go skinny-dipping.", "Hold hands with the person you know least in the group for one minute.", "Send a sexy selfie to someone in your contact list.", "Take a body shot. Balance the glass in your cleavage, on your torso — get creative!", "At the beach or a pool party? Draw a steamy image in sunscreen on a friend.", "Swap underwear with the person to your right.", "Reply to a social media post or story with a sexy emoji.", "Perform a pole dance on a nearby streetlight, or anything else that works!", "Transfer an ice cube from your mouth to someone else’s.", "Give a lap dance to a friend of your choice.", "Remove an item of clothing (or take a shot!)", "Snap a photo of a mystery part of your body and have the others guess.", "Wherever you are, twerk for 30 seconds.", "Hand over your dating apps to the group for two minutes.", "Perform a striptease for 30 seconds (if in private!)", "Roleplay a fantasy of your choice with another member of the group.", "Give a foot massage to the person on your right for one minute", "Send me a selfie making a funny or silly face.", "Text me a flirtatious message using only emojis.", "Send me a voice message singing a romantic song or reciting a cheesy pickup line.", "Text me a picture of something that reminds you of our relationship.", "Send me a screenshot of the last text conversation you had with a friend, with a funny caption added by you.", "Text me a funny joke or a meme that you think will make me laugh.", "Send me a message describing your favorite memory of us and why it’s special to you.", "Text me a list of three things you love about me and why they make you smile.", "Send me a short video of you doing a silly dance.", "Text me a creative and romantic goodnight message that will make me smile before going to bed.", "Do your best impression of someone trying way too hard on a first date.", "Read your last text out loud like you’re auditioning for a soap opera.", "Scroll your camera roll and show the least flattering photo of yourself.", "Say “I’m fine” in five dramatically different tones.", "Pretend you’re explaining what a situationship is to your grandma.", "Let the group choose a word you have to casually work into your next answer.", "Act out the moment you realized a date was going terribly—no words.", "Say your dating red flag like it’s a personal confession.", "Read the last thing you screenshotted and explain why.", "Do your best impression of yourself when you’re pretending not to care.", "Narrate your love life like it’s a nature documentary.", "Let someone scroll your emojis and pick three you must use in a sentence.", "Pretend you’re rejecting someone—but make it aggressively polite.", "Say your most-used dating phrase and immediately roast yourself for it.", "Act like you just ran into someone you ghosted.", "Reenact your worst date in 10 seconds or less.", "Lean in and say one word you’d only use when flirting.", "Send a 😏 emoji to the person you’re playing with.", "Say one flirty sentence you’d feel confident texting someone.", "Give someone a compliment that’s not about their appearance.", "Say someone’s name in your flirtiest tone.", "Show a pic of the last outfit you wore that made you feel hot.", "Read a song lyric you think is secretly sexy.", "Strike a pose you’d do if someone said, “Okay, work it.”", "Text someone a single “hey” and nothing else.", "Change one small thing about your appearance like you’re getting ready to be noticed.", "Give your best “I know I look good” smile.", "Pick a celebrity and say why they’re attractive—in one sentence.", "Let someone else rewrite your dating app bio (and you have to keep it as-is for the rest of the game).", "Say one thing that instantly boosts your confidence.", "Choose a word you think sounds sexy and say it out loud.", "Describe your vibe like you’re the mysterious love interest in a rom-com.", "Give someone a playful nickname.", "Say “your turn” in your flirtiest voice.", "Pick one item you’re wearing and explain why it makes you feel good.", "Kiss me somewhere unexpected.", "Whisper three things you want me to do later.", "Write me a flirty note and hide it in my pocket.", "Recreate our steamiest kiss right now.", "Dance for me — your style, your rules.", "Blindfold me and kiss me.", "Whisper something naughty while looking me in the eye.", "Give me a massage for three minutes.", "Let me choose where you kiss me next.", "Share a secret fantasy aloud.", "Record a silly love rap and perform it.", "Post a photo of us with a funny caption.", "Do an impression of me until I guess who you are.", "Send me a flirty text — while I’m sitting next to you.", "Draw a portrait of me in 1 minute.", "Re-create our first date with whatever’s in the fridge.", "Serenade me with your worst singing voice.", "Make up a 30-second poem about our love.", "Pretend you’re proposing to me — in the silliest way possible.", "Call me by a pet name you invent on the spot.", "Let me redo your hairstyle.", "Tell me three truths and one lie — I have to guess the lie.", "Act out your favourite rom-com scene with me.", "Draw a heart on my hand with lipstick.", "Swap clothes with me for 10 minutes.", "Speak only in rhymes for the next five minutes.", "Hug me without letting go for one full minute.", "Pretend to be me ordering coffee.", "Share a TikTok dance attempt with me.", "Do a “serious” runway walk in the living room.", "Try to lick your elbow", "Peel a banana with your toes", "Say everything in a whisper for the next 10 minutes", "Smell another player's armpit", "Put as many snacks into your mouth at once as you can", "Put your clothing on backwards for the rest of the evening", "Put on as many layers as possible in 60 seconds", "Smile as widely as you can and hold it for two minutes", "Do your best impression of a celebrity", "Sit with your back to the room for the rest of the evening", "Sit on the floor for the rest of the evening", "Eat a raw egg", "Sit in the corner of the room without speaking to anyone for the next 10 minutes", "Let someone order something random on your Amazon account (£10 or under)", "Text your best friend that you can’t stop thinking about me.", "Go like the photo on my Instagram where I look my ~most alluring.~", "Tell me the last outfit I wore that you loved.", "List your favorite things about me.", "I dare you to write a haiku about me and read it out loud.", "Show me your last Google (or Instagram) search.", "I dare you to send me the last screenshot you took on your phone.", "DM your celebrity crush and ask them to marry you.", "I dare you to text your group chat a random selfie with no explanation.", "I dare you to FaceTime me and tell me how you feel about me.", "Change my contact name in your phone to something flirty for 24 hours.", "Text me the emoji that best describes how you feel about me—no explanation.", "Screenshot your lock screen and send it to me.", "Tell me what kind of date you think I’d be surprisingly good at planning.", "Send me a photo of something in your space that feels very you.", "Text me one thing you’d want to know about me but haven’t asked yet.", "Send me a voice memo saying my name.", "Tell me what vibe you think I bring into a room.", "Pick a random emoji and explain how it applies to us.", "Text me the first thought you had when you saw my last photo.", "Tell me one small thing I do that you find endearing.", "Send me the last meme you laughed at (no context).", "Tell me what kind of first impression you think you give off.", "Text me a hypothetical: “If we were hanging out right now, we’d be ___.”", "Send me a selfie only if you’re smiling.", "Tell me what kind of compliment you secretly love receiving.", "Describe our dynamic as if it were a TV trope.", "Text me something you’d say if you weren’t worried about sounding obvious.", "Send me a photo of what you’re drinking right now.", "Tell me what kind of energy you hope people feel when they’re with you.", "Text me a question you’ve been debating asking me.", "Pick one word you associate with me and sit with it for a second. Then tell me why.", "Tell me what kind of date feels the most *you.*", "Screenshot your emoji recents and explain the vibe.", "Tell me one habit you have that people find unexpectedly charming.", "Text me something that would absolutely make me smile if I read it out of the blue.", "Tell me what you think makes flirting fun instead of stressful.", "Send me a GIF that matches how this conversation feels right now.", "Tell me one thing you’re looking forward to this week.", "Take a spoonful of something spicy and try not to react.", "Demonstrate your best twerk moves.", "Kiss your partner in a way you’ve never tried before.", "Recreate the moment of your first kiss.", "Dance to a romantic song chosen by your partner.", "Let your partner draw a temporary tattoo on you.", "Act out a scene from your favorite romantic movie.", "Share a steamy secret you’ve been holding back.", "Attempt to balance an ice cube on your body for 30 seconds.", "Give your partner a back massage using only your elbows.", "Kiss your partner’s stomach.", "Dirty talk in a different language.", "Have a make-out session in the car.", "Kiss your partner’s body without using your hands.", "Perform a strip dance for your partner.",
]

/* ─── Hearts band (age-gate card) ─── */
function HeartsRow({ top }: { top: boolean }) {
  return (
    <div style={{
      position: 'absolute',
      [top ? 'top' : 'bottom']: '0',
      left: 0, right: 0,
      height: '87px',
      background: '#dc2827',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        [top ? 'bottom' : 'top']: '14px',
        left: 0, right: 0,
        display: 'flex', flexDirection: 'column', gap: '1px',
      }}>
        {top
          ? <><div style={{ height: '7px', background: '#ecc1c9' }} /><div style={{ height: '4px', background: '#ecc1c9' }} /></>
          : <><div style={{ height: '4px', background: '#ecc1c9' }} /><div style={{ height: '7px', background: '#ecc1c9' }} /></>
        }
      </div>
      <div style={{
        position: 'absolute',
        [top ? 'top' : 'bottom']: '15px',
        left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: '5px', alignItems: 'center',
      }}>
        {Array.from({ length: 11 }, (_, i) => (
          <img key={i} src={HEART_FILLED} alt=""
            style={{ width: '32px', height: '32px', flexShrink: 0, transform: i % 2 === 1 ? 'scaleY(-1)' : 'none' }}
          />
        ))}
      </div>
    </div>
  )
}

/* ─── Screen 1: Age Gate ─── */
function AgeGate({ onBack, onConfirm }: { onBack: () => void; onConfirm: () => void }) {
  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '40px' }}>
      <div className="card-float-up" style={{
        background: '#fff', borderRadius: '20px',
        width: '454px', position: 'relative', overflow: 'hidden', zIndex: 2,
      }}>
        <HeartsRow top={true} />
        <div style={{ padding: '107px 90px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <div style={{ transform: 'rotate(-6deg)', marginBottom: '4px' }}>
            <div style={{
              background: '#e62a24', border: '4px solid #000', borderRadius: '9999px',
              width: '97px', height: '96px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px',
            }}>
              <span style={{ fontFamily: "'Anton', sans-serif", fontSize: '72px', color: '#fff', letterSpacing: '1.44px', lineHeight: '72px', display: 'block', textAlign: 'center', whiteSpace: 'nowrap' }}>
                18+
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#000', margin: 0, textAlign: 'center', lineHeight: '45px', whiteSpace: 'nowrap' }}>
              MATURE CONTENT
            </h2>
            <div style={{ textAlign: 'center', color: '#5d3f3c', fontSize: '14px', fontFamily: "'Satoshi', sans-serif", fontWeight: 400, lineHeight: '20px', letterSpacing: '-0.2px' }}>
              <p style={{ margin: 0 }}>Truth or Dare includes</p>
              <p style={{ margin: 0 }}>mature content for ages 18+</p>
              <p style={{ margin: '8px 0 0' }}>Continue?</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '215px', marginTop: '4px' }}>
            <button className="game-btn" onClick={() => setTimeout(onBack, 100)} style={{ flex: 1, border: '1px solid #000', background: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#131416', textAlign: 'center', boxShadow: '0 10px 24px rgba(0,0,0,0.25)' }}>
              No, go back
            </button>
            <button className="game-btn-primary" onClick={() => setTimeout(onConfirm, 100)} style={{ flex: 1, background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', textAlign: 'center' }}>
              YES, I'm 18+
            </button>
          </div>
        </div>
        <HeartsRow top={false} />
      </div>
    </div>
  )
}

/* ─── Screen 2: Player Setup ─── */
/* ─── Screen 2: Player Setup — uses shared component ─── */

/* ─── Screen 3: Deck Size ─── */
function DeckSize({ onBack, onStart }: { onBack: () => void; onStart: (n: number) => void }) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const parsed   = parseInt(value, 10)
  const valid    = !isNaN(parsed) && parsed > 0 && parsed <= 200

  return (
    <div className="screen-enter" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '40px' }}>
      <div style={{ width: '600px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '50px', alignItems: 'center' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', width: '100%' }}>
          <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center', lineHeight: '45px' }}>
            DECK SIZE
          </h2>
          <p style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0, textAlign: 'center' }}>
            How many cards do you want to play?
          </p>

          <div
            style={{ background: '#111113', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'text', width: '100%', marginTop: '16px', boxSizing: 'border-box' }}
            onClick={() => inputRef.current?.focus()}
          >
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '18px', lineHeight: 1 }}>#</span>
            </div>
            <input
              ref={inputRef}
              type="number"
              min={1}
              max={200}
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="Enter number"
              style={{ background: 'none', border: 'none', outline: 'none', fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', flex: 1, lineHeight: 'normal' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '292px' }}>
          <button
            onClick={onBack}
            style={{ flex: 1, border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', cursor: 'pointer', textAlign: 'center', boxShadow: '0 10px 24px rgba(0,0,0,0.25)' }}
          >
            GO BACK
          </button>
          <button className={valid ? 'game-btn-primary' : ''} onClick={() => valid && setTimeout(() => onStart(parsed), 100)}
            style={{ flex: 1, background: valid ? '#dc2827' : '#626262', border: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: valid ? '#fff' : '#a0a0a0', cursor: valid ? 'pointer' : 'not-allowed', textAlign: 'center', transition: 'background 0.2s, color 0.2s' }}
          >
            START THE GAME
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Screen 4: Get Ready ─── */
function GetReady({ player, onReady }: { player: Player | null; onReady: () => void }) {
  useEffect(() => {
    const id = setTimeout(onReady, 2400)
    return () => clearTimeout(id)
  }, [onReady])

  return (
    <div className="screen-enter" onClick={onReady} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <h2 style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#fff', margin: 0, textAlign: 'center', lineHeight: '45px', textTransform: 'uppercase' }}>
          Get ready...
        </h2>

        {player && (
          <div className="stagger-item" style={{ background: '#18181b', borderRadius: '12px', height: '56px', display: 'flex', alignItems: 'center', padding: '12px', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: player.color, flexShrink: 0 }} />
            <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '18px', color: '#fff', lineHeight: 'normal', whiteSpace: 'nowrap' }}>
              {player.name.toUpperCase()}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
          <span className="get-ready-dot" />
          <span className="get-ready-dot" />
          <span className="get-ready-dot" />
        </div>
      </div>
    </div>
  )
}

/* ─── Screen 5: Game Play ─── */
type CardState = 'picking' | 'truth' | 'dare'

function GamePlay({ players, cardIndex, totalCards, truthCount, dareCount, skipCount, shuffledTruths, shuffledDares, onAdvance, onPlayAgain, onBrowseGames }: {
  players: Player[]
  cardIndex: number
  totalCards: number
  truthCount: number
  dareCount: number
  skipCount: number
  shuffledTruths: string[]
  shuffledDares: string[]
  onAdvance: (type: 'truth' | 'dare' | 'skip') => void
  onPlayAgain: () => void
  onBrowseGames: () => void
}) {
  const [cardState, setCardState] = useState<CardState>('picking')
  const [flipPhase, setFlipPhase] = useState<'idle' | 'out' | 'in'>('idle')
  const flippingRef = useRef(false)
  const { wrapperStyle: splitWrapperStyle, cardStyle: splitCardStyle } = useScaledCard(454, 457)
  const { wrapperStyle: revealWrapperStyle, cardStyle: revealCardStyle } = useScaledCard(454, 400)

  const currentPlayer = players.length > 0 ? players[cardIndex % players.length] : null

  const truthPrompt = shuffledTruths[cardIndex % shuffledTruths.length]
  const darePrompt  = shuffledDares[cardIndex % shuffledDares.length]

  const pickChoice = useCallback((choice: 'truth' | 'dare') => {
    if (flippingRef.current || cardState !== 'picking') return
    flippingRef.current = true
    setFlipPhase('out')
    setTimeout(() => {
      setCardState(choice)
      setFlipPhase('in')
      setTimeout(() => { setFlipPhase('idle'); flippingRef.current = false }, 300)
    }, 160)
  }, [cardState])

  // advance: flip current card OUT then immediately call cb().
  // GamePlay will unmount (step → getReady), so no flip-in needed —
  // next card starts fresh with cardState='picking' on remount.
  const advance = (cb: () => void) => {
    if (flippingRef.current) return
    flippingRef.current = true
    setFlipPhase('out')
    setTimeout(() => {
      flippingRef.current = false
      setFlipPhase('idle')
      cb() // → handleAdvance → step='getReady'
    }, 220)
  }

  const isDone = totalCards > 0 && cardIndex >= totalCards

  if (isDone) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '32px', padding: '40px' }}>
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
          <h2 className="done-heading" style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '48px', color: '#fff', margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            You're Decked
          </h2>
          <p className="done-subtitle" style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            You played all {totalCards} Truth or Dare cards
          </p>
        </div>

        {/* Stats card */}
        <div style={{ position: 'relative', zIndex: 2, background: '#18181b', borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '20px 32px', gap: '0' }}>
          {[
            { count: truthCount, label: 'TRUTHS',  cls: 'done-stat-1' },
            { count: dareCount,  label: 'DARES',   cls: 'done-stat-2' },
            { count: skipCount,  label: 'SKIPPED', cls: 'done-stat-3' },
          ].map((stat, i) => (
            <div key={i} className={stat.cls} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.1)', margin: '0 28px' }} />}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '40px', color: '#fff', lineHeight: 1 }}>{stat.count}</span>
                <span style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Mini Truth or Dare card */}
        <div className="done-card" style={{
          position: 'relative', zIndex: 2,
          width: '199px', height: '200px',
          background: '#fff', borderRadius: '9px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          flexShrink: 0,
        }}>
          {/* Top red band: hearts at top, stripes toward inner edge */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '38px', background: '#dc2827', overflow: 'hidden' }}>
            {/* Stripes near inner edge (bottom of top band) */}
            <div style={{ position: 'absolute', top: '27px', left: 0, right: 0, display: 'flex', flexDirection: 'column', gap: '0.4px' }}>
              <div style={{ height: '3px', background: '#ecc1c9', width: '100%' }} />
              <div style={{ height: '1.7px', background: '#ecc1c9', width: '100%' }} />
            </div>
            {/* Hearts row centered */}
            <div style={{ position: 'absolute', top: '6.5px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '2.2px', alignItems: 'center', whiteSpace: 'nowrap' }}>
              {Array.from({ length: 11 }, (_, i) => (
                <img key={i} src={HEART_FILLED} alt="" style={{ width: '14px', height: '14px', flexShrink: 0, transform: i % 2 === 1 ? 'scaleY(-1)' : 'none' }} />
              ))}
            </div>
          </div>

          {/* Center text block — two overlapping layers create the shadow effect */}
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '106px', height: '71px' }}>
            {/* Black shadow layer */}
            <p style={{ position: 'absolute', left: '1px', right: '-1px', top: '1px', fontFamily: "'Satoshi', sans-serif", fontWeight: 500, fontSize: '21.9px', color: '#000', textAlign: 'center', lineHeight: 1.2, margin: 0 }}>
              TRUTH OR DARE
            </p>
            {/* Pink main text */}
            <p style={{ position: 'absolute', left: '1px', right: '-1px', top: '0', fontFamily: "'Satoshi', sans-serif", fontWeight: 500, fontSize: '21.9px', color: '#d39293', textAlign: 'center', lineHeight: 1.2, margin: 0 }}>
              TRUTH OR DARE
            </p>
            {/* FOR COUPLES */}
            <p style={{ position: 'absolute', left: 0, right: 0, top: '60px', fontFamily: "'Satoshi', sans-serif", fontSize: '10.5px', color: '#181b25', textAlign: 'center', margin: 0 }}>
              FOR COUPLES
            </p>
          </div>

          {/* Bottom red band: stripes near inner edge (top of bottom band), hearts toward bottom */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '38px', background: '#dc2827', overflow: 'hidden' }}>
            {/* Stripes near inner edge (top of bottom band) */}
            <div style={{ position: 'absolute', top: '6px', left: 0, right: 0, display: 'flex', flexDirection: 'column', gap: '0.4px' }}>
              <div style={{ height: '1.7px', background: '#ecc1c9', width: '100%' }} />
              <div style={{ height: '3px', background: '#ecc1c9', width: '100%' }} />
            </div>
            {/* Hearts row centered */}
            <div style={{ position: 'absolute', top: '17.5px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '2.2px', alignItems: 'center', whiteSpace: 'nowrap' }}>
              {Array.from({ length: 11 }, (_, i) => (
                <img key={i} src={HEART_FILLED} alt="" style={{ width: '14px', height: '14px', flexShrink: 0, transform: i % 2 === 1 ? 'scaleY(-1)' : 'none' }} />
              ))}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="done-btns" style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="game-btn" onClick={onBrowseGames} style={{ border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em', boxShadow: '0 10px 24px rgba(0,0,0,0.25)' }}>
            BROWSE GAMES
          </button>
          <button className="game-btn-primary" onClick={onPlayAgain} style={{ background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 24px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', letterSpacing: '0.05em' }}>
            PLAY AGAIN
          </button>
        </div>
      </div>
    )
  }

  /* Split card (picking) */
  if (cardState === 'picking') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '30px', padding: '40px 40px 60px', position: 'relative' }}>

        {currentPlayer && (
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: currentPlayer.color, flexShrink: 0, border: '2px solid rgba(255,255,255,0.2)' }} />
            <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '16px', color: 'rgba(255,255,255,0.65)', letterSpacing: '0.04em' }}>
              {currentPlayer.name.toUpperCase()}'S TURN
            </span>
          </div>
        )}

        {/* Split card */}
        <div style={splitWrapperStyle}>
        <div
          className={`tod-split-card tod-card-enter game-card${flipPhase === 'out' ? ' tod-flip-out' : flipPhase === 'in' ? ' tod-flip-in' : ''}`}
          style={{
            ...splitCardStyle,
            position: 'relative', zIndex: 2,
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 32px 80px rgba(220,40,39,0.35)',
          }}
        >
          {/* TRUTH — top half */}
          <div
            className="tod-truth-half"
            onClick={() => pickChoice('truth')}
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '228.5px',
              background: '#e9b1ba',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span className="tod-half-label" style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#dd2a25', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              TRUTH
            </span>
          </div>

          {/* DARE — bottom half */}
          <div
            className="tod-dare-half"
            onClick={() => pickChoice('dare')}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '228.5px',
              background: '#dd2a25',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span className="tod-half-label" style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '36px', color: '#e9b1ba', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              DARE
            </span>
          </div>

          {/* Hearts at divider */}
          <div className="tod-hearts" style={{
            position: 'absolute', left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex', gap: '5px', alignItems: 'center',
            zIndex: 3, pointerEvents: 'none',
          }}>
            <img src={HEART_GAME} alt="" style={{ width: '32px', height: '32px' }} />
            <img src={HEART_GAME} alt="" style={{ width: '32px', height: '32px', transform: 'scaleY(-1)' }} />
          </div>
        </div>
        </div>

        {/* SKIP THIS CARD */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center' }}>
          <button
            className="game-btn"
            onClick={() => advance(() => onAdvance('skip'))}
            style={{
              border: '1px solid #fff', background: 'none', borderRadius: '999px',
              padding: '12px 18px', width: '160px',
              fontFamily: "'Staatliches', sans-serif", fontSize: '16px',
              color: '#fff', textAlign: 'center',
              boxShadow: '0 10px 24px rgba(0,0,0,0.25)', letterSpacing: '0.05em',
            }}
          >
            SKIP THIS CARD
          </button>
        </div>

        {/* Card counter */}
        {totalCards > 0 && (
          <div key={cardIndex} className="counter-in" style={{ position: 'relative', zIndex: 2, fontFamily: "'Staatliches', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em' }}>
            CARD {cardIndex + 1} OF {totalCards}
          </div>
        )}
      </div>
    )
  }

  /* Revealed card (truth or dare) */
  const isTruth    = cardState === 'truth'
  const cardBg     = isTruth ? '#f7b8bc' : '#dc2827'
  const cardText   = isTruth ? '#dc2827' : '#f7b8bc'
  const prompt     = isTruth ? truthPrompt : darePrompt
  const typeLabel  = isTruth ? '— TRUTH —' : '— DARE —'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 40px 60px', gap: '24px', position: 'relative' }}>

      {currentPlayer && (
        <div key={currentPlayer.name} className="player-chip-enter" style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: currentPlayer.color, flexShrink: 0, border: '2px solid rgba(255,255,255,0.2)', boxShadow: `0 0 0 3px ${currentPlayer.color}33` }} />
          <span style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '16px', color: 'rgba(255,255,255,0.65)', letterSpacing: '0.04em' }}>
            {currentPlayer.name.toUpperCase()}'S TURN
          </span>
          <span style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '14px', color: isTruth ? '#f7b8bc' : '#dc2827', background: isTruth ? 'rgba(247,184,188,0.12)' : 'rgba(220,40,39,0.12)', border: `1px solid ${isTruth ? 'rgba(247,184,188,0.3)' : 'rgba(220,40,39,0.3)'}`, borderRadius: '999px', padding: '3px 12px', letterSpacing: '0.1em' }}>
            {isTruth ? 'TRUTH' : 'DARE'}
          </span>
        </div>
      )}

      <div style={revealWrapperStyle}>
      <div
        className={`tod-card-enter game-card${flipPhase === 'out' ? ' tod-flip-out' : flipPhase === 'in' ? ' tod-flip-in' : ''}`}
        style={{
          ...revealCardStyle,
          position: 'relative', zIndex: 2,
          background: cardBg, borderRadius: '20px',
          minHeight: '400px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '52px 48px 44px', gap: '24px',
          boxShadow: `0 32px 80px ${isTruth ? 'rgba(247,100,100,0.25)' : 'rgba(220,40,39,0.45)'}`,
        }}
      >
        <div style={{ fontFamily: "'Staatliches', sans-serif", fontSize: '13px', letterSpacing: '0.18em', color: cardText, opacity: 0.65, textTransform: 'uppercase' }}>
          {typeLabel}
        </div>

        <p style={{ fontFamily: "'Anton SC', sans-serif", fontWeight: 400, fontSize: '28px', color: cardText, textAlign: 'center', textTransform: 'uppercase', lineHeight: 1.2, margin: 0, letterSpacing: '0.02em' }}>
          {prompt}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
          <img src={HEART_GAME} alt="" style={{ width: '36px', height: '36px', opacity: 0.85 }} />
        </div>
      </div>
      </div>

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '8px', alignItems: 'center', width: '402px' }}>
        <button className="game-btn"
          onClick={() => advance(() => onAdvance('skip'))}
          style={{ flex: 1, border: '1px solid #fff', background: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', textAlign: 'center', boxShadow: '0 10px 24px rgba(0,0,0,0.25)', letterSpacing: '0.05em' }}
        >
          SKIP
        </button>
        <button className="game-btn-primary"
          onClick={() => advance(() => onAdvance(isTruth ? 'truth' : 'dare'))}
          style={{ flex: 1, background: '#dc2827', border: 'none', borderRadius: '999px', padding: '12px 18px', fontFamily: "'Staatliches', sans-serif", fontSize: '16px', color: '#fff', textAlign: 'center', letterSpacing: '0.05em' }}
        >
          NEXT
        </button>
      </div>

      {totalCards > 0 && (
        <div key={cardIndex} className="counter-in" style={{ position: 'relative', zIndex: 2, fontFamily: "'Staatliches', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em' }}>
          CARD {cardIndex + 1} OF {totalCards}
        </div>
      )}
    </div>
  )
}

/* ─── Root Game Component ─── */
type Step = 'ageGate' | 'playerSetup' | 'deckSize' | 'getReady' | 'game'

export default function TruthOrDareGame({ onClose }: { onClose: () => void }) {
  const [step,           setStep]           = useState<Step>('ageGate')
  const [players,        setPlayers]        = useState<Player[]>([])
  const [totalCards,     setTotalCards]     = useState(0)
  const [cardIndex,      setCardIndex]      = useState(0)
  const [playerIndex,    setPlayerIndex]    = useState(0)
  const [truthCount,     setTruthCount]     = useState(0)
  const [dareCount,      setDareCount]      = useState(0)
  const [skipCount,      setSkipCount]      = useState(0)
  const [shuffledTruths, setShuffledTruths] = useState(() => getShuffledDeck(TRUTHS, 'truth-or-dare-truths'))
  const [shuffledDares,  setShuffledDares]  = useState(() => getShuffledDeck(DARES, 'truth-or-dare-dares'))

  const currentPlayer = players.length > 0 ? players[playerIndex] : null

  const handleAdvance = useCallback((type: 'truth' | 'dare' | 'skip') => {
    if (type === 'truth')     setTruthCount(c => c + 1)
    else if (type === 'dare') setDareCount(c => c + 1)
    else                      setSkipCount(c => c + 1)
    const nextCard   = cardIndex + 1
    const nextPlayer = players.length > 0 ? (playerIndex + 1) % players.length : 0
    setCardIndex(nextCard)
    setPlayerIndex(nextPlayer)
    if (totalCards > 0 && nextCard >= totalCards) {
      setStep('game')
    } else {
      setStep('getReady')
    }
  }, [cardIndex, playerIndex, players.length, totalCards])

  const goToGame = useCallback(() => setStep('game'), [])

  const handlePlayAgain = useCallback(() => {
    setCardIndex(0)
    setPlayerIndex(0)
    setTruthCount(0)
    setDareCount(0)
    setSkipCount(0)
    setShuffledTruths(getShuffledDeck(TRUTHS, 'truth-or-dare-truths'))
    setShuffledDares(getShuffledDeck(DARES, 'truth-or-dare-dares'))
    setStep('getReady')
  }, [])

  return (
    <div className="game-fullscreen">
      <GameNav onBack={onClose} />

      {step === 'ageGate' && (
        <AgeGate onBack={onClose} onConfirm={() => setStep('playerSetup')} />
      )}

      {step === 'playerSetup' && (
        <SharedPlayerSetup
          initialPlayers={players}
          skipLabel="GO BACK"
          onSkip={() => setStep('ageGate')}
          onNext={p => { setPlayers(p); setStep('deckSize') }}
        />
      )}

      {step === 'deckSize' && (
        <DeckSize
          onBack={() => setStep('playerSetup')}
          onStart={n => { setTotalCards(n); setCardIndex(0); setPlayerIndex(0); setShuffledTruths(getShuffledDeck(TRUTHS, 'truth-or-dare-truths')); setShuffledDares(getShuffledDeck(DARES, 'truth-or-dare-dares')); setStep('getReady') }}
        />
      )}

      {step === 'getReady' && (
        <GetReady
          player={currentPlayer}
          onReady={goToGame}
        />
      )}

      {step === 'game' && (
        <GamePlay
          players={players}
          cardIndex={cardIndex}
          totalCards={totalCards}
          truthCount={truthCount}
          dareCount={dareCount}
          skipCount={skipCount}
          shuffledTruths={shuffledTruths}
          shuffledDares={shuffledDares}
          onAdvance={handleAdvance}
          onPlayAgain={handlePlayAgain}
          onBrowseGames={onClose}
        />
      )}

      <GameFooter />
    </div>
  )
}
