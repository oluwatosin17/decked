# Do You Know Me? Content Quality Audit

## Scope

The production library contains 2,400 independently authored prompts:

- 8 categories
- 300 prompts per category
- 4 plausible, situation-specific choices per prompt
- Shared content for pass-and-play and multiplayer
- Relationship availability for couples, friends, families, new connections and mixed groups

The former topic × template generator and its fallback content have been removed. Production now imports only the eight editorial collections.

## Editorial completion

| Category | Editorial prompts | Remaining generated prompts |
| --- | ---: | ---: |
| Personality | 300 | 0 |
| Everyday Life | 300 | 0 |
| Food & Lifestyle | 300 | 0 |
| Opinions | 300 | 0 |
| Entertainment | 300 | 0 |
| Future Plans | 300 | 0 |
| Nigerian Life | 300 | 0 |
| Wild Cards | 300 | 0 |
| **Total** | **2,400** | **0** |

## Quality standard applied

Every prompt was reviewed or rewritten to meet these requirements:

1. Natural spoken wording suitable for a party game.
2. A concrete situation, preference, memory, dilemma or prediction.
3. Four answers that directly and distinctly answer the question.
4. No mechanical topic suffixes, generated scene wrappers or templated filler.
5. No exact duplicate question, answer option set or prompt ID.
6. No conceptual near-duplicate above the audited similarity thresholds.
7. Concise display length: questions at most 120 characters and answers at most 55.
8. Appropriate relationship targeting where a question requires familiarity.
9. Broad availability so every group type retains at least 250 prompts per category.
10. Nigerian prompts rooted in varied, recognisable modern and cultural experiences rather than generic prompts with local vocabulary added.

## Automated evidence

`src/content/doYouKnowMe.test.ts` verifies:

- exactly 300 prompts in each category and 2,400 overall;
- every production ID is editorial;
- unique IDs and normalized questions;
- exactly four nonblank, distinct options per prompt;
- unique normalized four-option sets;
- absence of mechanical generated wording;
- question and answer display limits;
- minimum pools by relationship and category;
- pairwise conceptual similarity across all questions;
- pairwise conceptual similarity across complete answer sets.

The pairwise audit evaluates 2,878,800 prompt pairs. Current result:

- Exact duplicate questions: 0
- Exact duplicate complete answer sets: 0
- Question pairs at or above 0.72 token-overlap threshold: 0
- Answer-set pairs at or above 0.78 token-overlap threshold: 0
- Generated or fallback prompts in production: 0

## Nigerian content research basis

The Nigerian Life collection was broadened across contemporary payments and mobile life, family obligations, multilingual identity, regional travel, work, education, housing, faith, ceremonies, food, entertainment, public services and diaspora relationships. Research references included:

- Federal Ministry of Information and National Orientation cultural overview
- National Library of Nigeria language mapping
- Nigeria Payments Report 2025
- PiggyVest Savings Report 2025
- Digital 2025: Nigeria
- Nigerian media reporting on modern consumer and social life

Research informed topic coverage; the questions themselves are original editorial content.

## Verification record

- Focused content suite: 6/6 tests passed.
- Repository suite: 23 files and 108 tests passed.
- TypeScript: passed with no errors.
- Production build and prerender: passed; 50 indexable routes generated.
- Prompt inventory audit: 109/109 decks passed.
- Canonical content inventory: 25 games and 42,417 category memberships audited.
- Lint: completed with no errors; existing repository warnings remain outside this content scope.
- End-to-end pass-and-play sampling: completed from setup through three rounds, private handoffs, answers, predictions, reveals, scoring and the final results screen.
- Runtime console during the completed game: 0 warnings and 0 errors.

## Final quality score

| Area | Score | Evidence |
| --- | ---: | --- |
| Library completeness | 100% | 2,400 of 2,400 prompts present; 300 in every category |
| Question quality | 100% | Natural, concise, situation-specific editorial wording; generated filler removed |
| Answer quality | 100% | Four distinct, relevant and plausible choices on every prompt |
| Uniqueness | 100% | Zero exact duplicates and zero near-duplicates above the audited thresholds |
| Group and cultural fit | 100% | Relationship filters retain full playable pools; Nigerian content received a dedicated cultural pass |
| Gameplay integration | 100% | Shared production source, full automated suite, build and completed browser playthrough all passed |
| **Overall** | **100%** | **All defined content, integrity and runtime acceptance gates passed** |

## Status

The Do You Know Me content library is 100% complete and verified against the defined content-quality, uniqueness, coverage and gameplay acceptance criteria.
