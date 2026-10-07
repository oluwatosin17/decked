# DECKED prompt library

All production prompt decks except Truth or Dare and Spicy Opener must contain at least 300 normalized-unique cards per selectable category. `Random` is a mixer, not a separately authored category, and is therefore excluded from per-category counts.

Run `npm run audit:prompts` to audit every production deck. The command exits unsuccessfully when a deck has fewer than 300 cards, blank cards, exact duplicates, close paraphrases, known generated suffix variants, or prompts reused across categories. A different string is not automatically a unique idea.

The audit also checks game-mechanic format, practical card length, category vocabulary coverage, and known unsafe or coercive challenge patterns. These automated checks are a floor, not a substitute for editorial review.

The prompt expansion utilities are transitional and do not satisfy the editorial standard. A deck passes only after generated variants and shared filler have been replaced with explicit, category-owned prompts.

## Editorial standards

- Preserve the distinctive mechanic of each game: experiences for Never Have I Ever and Hands Tell All; questions for conversation decks; debatable scenarios for Dateable or Dealbreaker; physical, recognizable clues for Charades; and performable challenges for Keep a Straight Face / Dare or Pour.
- Mix accessible, funny, reflective, imaginative and higher-intensity cards instead of allowing one tone to dominate.
- Keep cards readable on a phone and understandable without additional instructions.
- Avoid coercion, dangerous consumption, discriminatory assumptions, outing private identities, illegal challenges and humiliation presented as consent.
- Drinking-game cards always permit a non-alcoholic substitute; the app never instructs users to consume multiple drinks rapidly.
- Do not copy commercial card decks or online prompt lists. Research is used to understand mechanics, pacing, category fit and difficulty; DECKED’s cards remain independently worded.

## Research-informed design

The expansion follows established play patterns: icebreakers should warm a defined group toward conversation; Charades clues should be recognizable and physically actable within a short timer; conversation games benefit from progressive self-disclosure; voting scenarios work best when context can create genuine disagreement; and large decks need mixed difficulty, rotating turns and no repeats.

Research references used for the October 2026 audit include public descriptions of Charades conventions and difficulty design, facilitation guidance for icebreakers, published descriptions of Never Have I Ever and conversation-card mechanics, and player discussions about category variety, repetition and safety. Source material informed editorial rules only; its prompt wording was not copied into the game.
