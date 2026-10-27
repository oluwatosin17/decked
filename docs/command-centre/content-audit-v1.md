# Decked content audit v1

Generated deterministically by `pnpm audit:content` at 2026-10-27T07:05:34.440Z.

## Result

- Canonical games: **28**
- Audited games: **28**
- Raw bundled records / category memberships: **43,007**
- Normalized-unique payloads across all games: **40,998**
- Games whose every selectable bundled category meets 300 cards: **20**
- Games below the 300-card target: **6**
- Not applicable: **2** (player-authored and rules-based games have no managed prompt inventory)

The audit does not generate or pad content. Random mixers are excluded because they are selectors over authored categories, not independently authored categories. Player custom cards remain separate and are not migration input.

## Count definitions

- **Raw records** are source-array entries.
- **Rendered card count** is the number available to runtime selection before a session limit is applied.
- **Unique items** are normalized payloads; this is not the same as category membership.
- **Category memberships** count item-to-category relationships and therefore can exceed unique items.
- Existing bundled cards do not have authored persistent IDs. The migration must derive stable IDs without changing or deleting the source content.

## Per-category inventory

| Game ID | Category / mode | Raw | Unique | Memberships | Normalized duplicates | Length min/median/p95/max | 300 readiness | SHA-256 |
|---|---|---:|---:|---:|---:|---:|---|---|
| truth-or-dare | truth | 474 | 474 | 474 | 0 | 17/54/75/98 | meets-300 | `1aca01043ff7` |
| truth-or-dare | dare | 452 | 452 | 452 | 0 | 13/57/77/108 | meets-300 | `f601df68e8c5` |
| spicy-starters | mild | 310 | 310 | 310 | 0 | 32/54/70/101 | meets-300 | `63b5bc4c48cc` |
| spicy-starters | medium | 310 | 310 | 310 | 0 | 33/56/76/121 | meets-300 | `2f2e0f8063cb` |
| spicy-starters | hot | 361 | 361 | 361 | 0 | 32/58/87/206 | meets-300 | `20da85d6be42` |
| never-have-i-ever | main | 300 | 300 | 300 | 0 | 25/53/65/71 | meets-300 | `fc902e73f182` |
| late-night-talks | couples | 300 | 300 | 300 | 0 | 39/60/72/81 | meets-300 | `a40b9d5069c2` |
| late-night-talks | friends | 300 | 300 | 300 | 0 | 36/61/77/86 | meets-300 | `da7d05c1dbff` |
| late-night-talks | family | 300 | 300 | 300 | 0 | 39/66/77/83 | meets-300 | `bd02909c5777` |
| late-night-talks | deep-conversations | 300 | 300 | 300 | 0 | 35/59/74/86 | meets-300 | `346df1e489a1` |
| late-night-talks | first-date | 300 | 300 | 300 | 0 | 31/56/71/95 | meets-300 | `eb2d6d337391` |
| late-night-talks | party | 300 | 300 | 300 | 0 | 38/60/75/83 | meets-300 | `5440f65767b4` |
| late-night-talks | nostalgia | 300 | 300 | 300 | 0 | 45/67/79/91 | meets-300 | `9b87bedd91bb` |
| dinner-table | date-night | 300 | 300 | 300 | 0 | 41/62/75/82 | meets-300 | `976f4b4cdd8b` |
| dinner-table | friends-night | 300 | 300 | 300 | 0 | 40/69/86/96 | meets-300 | `4371ea669768` |
| dinner-table | family | 300 | 300 | 300 | 0 | 41/64/79/93 | meets-300 | `731f91c1f931` |
| dinner-table | team | 300 | 300 | 300 | 0 | 38/63/77/85 | meets-300 | `efe1cb5cb6b6` |
| dinner-table | holiday-gathering | 300 | 300 | 300 | 0 | 43/70/87/116 | meets-300 | `c2b6fb3a8e34` |
| dinner-table | birthday | 300 | 300 | 300 | 0 | 42/62/76/86 | meets-300 | `6627357ce209` |
| dinner-table | everyday | 300 | 300 | 300 | 0 | 32/60/78/84 | meets-300 | `cdc84cc9703f` |
| icebreaker | DEEP | 300 | 300 | 300 | 0 | 28/55/70/76 | meets-300 | `439c37f470bd` |
| icebreaker | FUN | 300 | 300 | 300 | 0 | 34/58/77/89 | meets-300 | `21e394dc99bc` |
| icebreaker | REFLECTIVE | 300 | 300 | 300 | 0 | 35/58/71/84 | meets-300 | `2a4b53471747` |
| icebreaker | SOCIAL | 300 | 300 | 300 | 0 | 33/55/69/79 | meets-300 | `734379b118c4` |
| icebreaker | CREATIVE | 300 | 300 | 300 | 0 | 31/64/80/99 | meets-300 | `c119da1d43ac` |
| everyday-conversation | everyday | 300 | 300 | 300 | 0 | 35/57/70/80 | meets-300 | `60816da982af` |
| everyday-conversation | deep-convo | 300 | 300 | 300 | 0 | 41/68/81/90 | meets-300 | `3f867303885e` |
| everyday-conversation | first-date | 300 | 300 | 300 | 0 | 40/57/72/84 | meets-300 | `d8a69e7e6de2` |
| everyday-conversation | nostalgia | 300 | 300 | 300 | 0 | 35/65/78/93 | meets-300 | `bb21210991c3` |
| everyday-conversation | team | 300 | 300 | 300 | 0 | 35/60/74/80 | meets-300 | `8709d6a68e0c` |
| everyday-conversation | party | 300 | 300 | 300 | 0 | 40/60/75/94 | meets-300 | `ad4c10f9145d` |
| reconnect | partner/light | 300 | 300 | 300 | 0 | 38/58/68/76 | meets-300 | `ea6b1150612f` |
| reconnect | partner/meaningful | 300 | 300 | 300 | 0 | 40/63/74/81 | meets-300 | `9d450a581c50` |
| reconnect | partner/deep | 300 | 300 | 300 | 0 | 50/70/82/96 | meets-300 | `833f2cded74f` |
| reconnect | friends/light | 300 | 300 | 300 | 0 | 34/56/70/82 | meets-300 | `10e770668306` |
| reconnect | friends/meaningful | 300 | 300 | 300 | 0 | 38/57/68/77 | meets-300 | `28f130255582` |
| reconnect | friends/deep | 300 | 300 | 300 | 0 | 40/59/71/80 | meets-300 | `597c3f45ce7f` |
| reconnect | family/light | 300 | 300 | 300 | 0 | 33/56/74/87 | meets-300 | `5192a4e0e8ed` |
| reconnect | family/meaningful | 300 | 300 | 300 | 0 | 45/68/85/107 | meets-300 | `08b0b1750c93` |
| reconnect | family/deep | 300 | 300 | 300 | 0 | 41/73/92/104 | meets-300 | `46a33af9079f` |
| reconnect | colleagues/light | 300 | 300 | 300 | 0 | 39/53/62/69 | meets-300 | `0e43b49c7d02` |
| reconnect | colleagues/meaningful | 300 | 300 | 300 | 0 | 39/57/67/75 | meets-300 | `c009b2f60590` |
| reconnect | colleagues/deep | 300 | 300 | 300 | 0 | 45/63/71/85 | meets-300 | `4cb189ccebf9` |
| reconnect | group/light | 300 | 300 | 300 | 0 | 38/59/70/78 | meets-300 | `dd723ec7421b` |
| reconnect | group/meaningful | 300 | 300 | 300 | 0 | 42/64/74/86 | meets-300 | `63276b9389a0` |
| reconnect | group/deep | 300 | 300 | 300 | 0 | 44/68/81/92 | meets-300 | `55ccba71b055` |
| red-flag-green-flag | main | 300 | 300 | 300 | 0 | 35/59/70/73 | meets-300 | `08e3573a92ae` |
| charades | movies | 300 | 300 | 300 | 0 | 2/14/28/62 | meets-300 | `f51c313735d3` |
| charades | tv-shows | 300 | 300 | 300 | 0 | 2/12/26/39 | meets-300 | `15f101e097a5` |
| charades | hobbies | 300 | 300 | 300 | 0 | 4/12/18/22 | meets-300 | `389110b7a5fc` |
| charades | songs | 300 | 300 | 300 | 0 | 4/14/27/33 | meets-300 | `0ffb93d6c7f2` |
| charades | music-artists | 300 | 300 | 300 | 0 | 2/11/17/24 | meets-300 | `584f691a869d` |
| charades | apps | 300 | 300 | 300 | 0 | 3/7/15/23 | meets-300 | `d420eea0e3d8` |
| charades | countries | 300 | 300 | 300 | 0 | 4/9/21/40 | meets-300 | `c494a1539ddb` |
| charades | animals | 300 | 300 | 300 | 0 | 3/7/13/16 | meets-300 | `35b4bc2e74c3` |
| charades | internet-slang | 300 | 300 | 300 | 0 | 2/11/17/25 | meets-300 | `4a8e3503a21e` |
| charades | food-drinks | 300 | 300 | 300 | 0 | 3/9/16/22 | meets-300 | `28812ab01a44` |
| charades | sports | 300 | 300 | 300 | 0 | 4/13/21/28 | meets-300 | `b6ec63a371c9` |
| charades | ai-tech | 300 | 300 | 300 | 0 | 5/13/19/27 | meets-300 | `29f20b28cf30` |
| charades | celebrities | 300 | 300 | 300 | 0 | 4/12/17/21 | meets-300 | `8868a6032be4` |
| charades | influencers | 300 | 300 | 300 | 0 | 3/11/16/26 | meets-300 | `4d810c8a6308` |
| charades | natural-disasters | 300 | 300 | 300 | 0 | 4/14/23/25 | meets-300 | `b47e116c1ae6` |
| charades | football-clubs | 300 | 300 | 300 | 0 | 4/13/21/26 | meets-300 | `402658ce0bed` |
| charades | music-genres | 300 | 300 | 300 | 0 | 3/8/17/26 | meets-300 | `5ce7cd1bbc63` |
| charades | politicians | 300 | 300 | 300 | 0 | 4/14/21/27 | meets-300 | `ca6927879da0` |
| strangers | partner/warm-up | 300 | 300 | 300 | 0 | 32/55/68/82 | meets-300 | `2e3cc951efad` |
| strangers | partner/connect | 300 | 300 | 300 | 0 | 36/67/82/88 | meets-300 | `3cb2a31c96ce` |
| strangers | partner/reflect | 300 | 300 | 300 | 0 | 43/68/81/90 | meets-300 | `63305480d51f` |
| strangers | friends/warm-up | 300 | 300 | 300 | 0 | 33/56/68/75 | meets-300 | `271575bf02f2` |
| strangers | friends/connect | 300 | 300 | 300 | 0 | 40/64/78/93 | meets-300 | `74c265072464` |
| strangers | friends/reflect | 300 | 300 | 300 | 0 | 51/69/83/93 | meets-300 | `a4680c5617f7` |
| strangers | family/warm-up | 300 | 300 | 300 | 0 | 35/54/68/81 | meets-300 | `e4be22e371a8` |
| strangers | family/connect | 300 | 300 | 300 | 0 | 37/63/77/85 | meets-300 | `e07165dea747` |
| strangers | family/reflect | 300 | 300 | 300 | 0 | 35/67/82/91 | meets-300 | `6aa7e3fb4ef8` |
| strangers | colleagues/warm-up | 300 | 300 | 300 | 0 | 39/59/72/81 | meets-300 | `d4bf5a5ffe14` |
| strangers | colleagues/connect | 300 | 300 | 300 | 0 | 38/61/75/85 | meets-300 | `8db1ec751504` |
| strangers | colleagues/reflect | 300 | 300 | 300 | 0 | 42/69/84/108 | meets-300 | `9e4abfbd709c` |
| strangers | group/warm-up | 300 | 300 | 300 | 0 | 31/57/71/88 | meets-300 | `03d3d4bf9926` |
| strangers | group/connect | 300 | 300 | 300 | 0 | 41/64/76/88 | meets-300 | `41e8c6f1ded8` |
| strangers | group/reflect | 300 | 300 | 300 | 0 | 42/65/79/89 | meets-300 | `0301c373a3f8` |
| finger-down | funny | 300 | 300 | 300 | 0 | 61/88/100/108 | meets-300 | `22a79c28f181` |
| finger-down | relationships | 300 | 300 | 300 | 0 | 61/82/93/99 | meets-300 | `034de055d302` |
| finger-down | friends | 300 | 300 | 300 | 0 | 64/87/102/114 | meets-300 | `6e875d7f12f9` |
| finger-down | spicy | 300 | 300 | 300 | 0 | 63/90/101/117 | meets-300 | `3481c68b9949` |
| finger-down | party | 300 | 300 | 300 | 0 | 61/85/100/109 | meets-300 | `6bf8b7e29316` |
| finger-down | school | 300 | 300 | 300 | 0 | 59/81/93/107 | meets-300 | `dc407373c80e` |
| finger-down | work | 300 | 300 | 300 | 0 | 63/81/93/99 | meets-300 | `4c54ca709335` |
| finger-down | drinking | 300 | 300 | 300 | 0 | 59/83/97/104 | meets-300 | `66ee161878c8` |
| finger-down | travel | 300 | 300 | 300 | 0 | 55/80/95/101 | meets-300 | `bb69766082ce` |
| take-a-sip | funny | 300 | 300 | 300 | 0 | 58/75/86/93 | meets-300 | `9e6adcbfec3e` |
| take-a-sip | relationships | 300 | 300 | 300 | 0 | 60/79/94/106 | meets-300 | `8c1d5536392f` |
| take-a-sip | spicy | 300 | 300 | 300 | 0 | 53/84/96/103 | meets-300 | `b6d0d9d07fd8` |
| take-a-sip | party | 300 | 300 | 300 | 0 | 55/76/88/99 | meets-300 | `b5e4d450f7c7` |
| take-a-sip | drinking | 300 | 300 | 300 | 0 | 47/73/88/100 | meets-300 | `78a1d87a44f2` |
| take-a-sip | school | 300 | 300 | 300 | 0 | 64/81/92/99 | meets-300 | `3b00294bf5d8` |
| take-a-sip | work | 300 | 300 | 300 | 0 | 58/74/82/89 | meets-300 | `eca7f5a8e292` |
| take-a-sip | travel | 300 | 300 | 300 | 0 | 56/82/94/106 | meets-300 | `36273ca69324` |
| take-a-sip | green-flags | 300 | 300 | 300 | 0 | 48/75/87/95 | meets-300 | `9d267c5f1f03` |
| take-a-sip | red-flags | 300 | 300 | 300 | 0 | 52/80/91/97 | meets-300 | `c131737785c7` |
| sip-or-spill | funny | 300 | 300 | 300 | 0 | 68/90/102/115 | meets-300 | `3aa993b236a3` |
| sip-or-spill | relationships | 300 | 300 | 300 | 0 | 64/82/93/103 | meets-300 | `acf742d955c7` |
| sip-or-spill | spicy | 300 | 300 | 300 | 0 | 63/84/95/103 | meets-300 | `59a93af67cf4` |
| sip-or-spill | party | 300 | 300 | 300 | 0 | 68/84/96/108 | meets-300 | `a9ab21a698af` |
| sip-or-spill | drinking | 300 | 300 | 300 | 0 | 61/83/96/105 | meets-300 | `0b69f05222dd` |
| sip-or-spill | friends | 300 | 300 | 300 | 0 | 65/84/94/103 | meets-300 | `1a338b0ef6dc` |
| you-laugh | main | 300 | 300 | 300 | 0 | 35/59/73/92 | meets-300 | `12f9d29dce6a` |
| do-or-drink | funny | 300 | 300 | 300 | 0 | 49/70/85/94 | meets-300 | `56ef63971317` |
| do-or-drink | spicy | 300 | 300 | 300 | 0 | 48/66/77/89 | meets-300 | `f0b3e0199527` |
| do-or-drink | party | 300 | 300 | 300 | 0 | 52/73/86/97 | meets-300 | `06b9f8dd5cb8` |
| do-or-drink | drinking | 300 | 300 | 300 | 0 | 53/87/103/122 | meets-300 | `fd7b585a1de9` |
| do-or-drink | dares | 300 | 300 | 300 | 0 | 53/73/92/115 | meets-300 | `f0c3e701c7af` |
| do-or-drink | social | 300 | 300 | 300 | 0 | 58/77/90/106 | meets-300 | `f31f605dc033` |
| two-truths-bluff | — | 0 | 0 | 0 | 0 | 0/0/0/0 | not-applicable | `e3b0c44298fc` |
| most-likely-to | party | 50 | 50 | 50 | 0 | 74/94/103/108 | below-300 | `87062564d0be` |
| most-likely-to | friends | 50 | 50 | 50 | 0 | 82/98/108/112 | below-300 | `7559cc841a2d` |
| most-likely-to | couples | 50 | 50 | 50 | 0 | 78/98/107/113 | below-300 | `2193937ea8d0` |
| most-likely-to | everyday | 50 | 50 | 50 | 0 | 67/96/104/108 | below-300 | `69035e699cf8` |
| most-likely-to | adventure | 50 | 50 | 50 | 0 | 81/94/107/111 | below-300 | `945085199e99` |
| most-likely-to | bold | 50 | 50 | 50 | 0 | 74/111/121/124 | below-300 | `ad29b1cd6c76` |
| choose-your-side | everyday | 30 | 30 | 30 | 0 | 41/54/64/65 | below-300 | `830039f9e5cb` |
| choose-your-side | funny | 30 | 30 | 30 | 0 | 30/57/74/76 | below-300 | `da5175202d4d` |
| choose-your-side | friends | 30 | 30 | 30 | 0 | 44/67/84/87 | below-300 | `b75f9f8cf1ae` |
| choose-your-side | relationships | 30 | 30 | 30 | 0 | 39/60/70/76 | below-300 | `01a93112878b` |
| choose-your-side | party | 30 | 30 | 30 | 0 | 32/51/73/77 | below-300 | `077a4950c718` |
| choose-your-side | money | 30 | 30 | 30 | 0 | 39/59/71/85 | below-300 | `1792550f303c` |
| choose-your-side | morals | 30 | 30 | 30 | 0 | 31/66/81/95 | below-300 | `d0dcfd100b47` |
| choose-your-side | deep | 30 | 30 | 30 | 0 | 38/58/70/86 | below-300 | `0682f04c8dec` |
| choose-your-side | adventure | 30 | 30 | 30 | 0 | 34/52/64/71 | below-300 | `2dd63448392d` |
| choose-your-side | after-dark | 30 | 30 | 30 | 0 | 33/53/67/71 | below-300 | `c74f2f6571b7` |
| who-said-that | main | 300 | 300 | 300 | 0 | 42/60/81/90 | meets-300 | `3b66e8d36202` |
| we-just-met | easy | 50 | 50 | 50 | 0 | 29/46/55/75 | below-300 | `0f6bd70a15fb` |
| we-just-met | personality | 50 | 50 | 50 | 0 | 30/46/59/66 | below-300 | `f69cf19c1eb7` |
| we-just-met | stories | 50 | 50 | 50 | 0 | 36/51/64/73 | below-300 | `439b990c1ec0` |
| we-just-met | dating | 50 | 50 | 50 | 0 | 34/49/68/75 | below-300 | `16debfc796ef` |
| we-just-met | online | 50 | 50 | 50 | 0 | 37/53/62/66 | below-300 | `481e37806ad7` |
| we-just-met | fun | 50 | 50 | 50 | 0 | 34/54/66/70 | below-300 | `91b366e71c9f` |
| whot | — | 0 | 0 | 0 | 0 | 0/0/0/0 | not-applicable | `e3b0c44298fc` |
| imposter | places | 303 | 303 | 303 | 0 | 11/18/25/33 | meets-300 | `15119ed67b9c` |
| imposter | food | 303 | 303 | 303 | 0 | 11/16/21/27 | meets-300 | `8a3d8f66d3e9` |
| imposter | nature | 303 | 303 | 303 | 0 | 10/15/19/22 | meets-300 | `6619cbf6a0f2` |
| imposter | everyday | 303 | 303 | 303 | 0 | 11/17/22/26 | meets-300 | `e814656c3123` |
| imposter | culture | 303 | 303 | 303 | 0 | 11/18/22/25 | meets-300 | `5edc276f1ef9` |
| imposter | events | 303 | 303 | 303 | 0 | 12/19/26/31 | meets-300 | `0367296830b3` |
| mini-mystery | phone-that-could-ruin-everyone | 69 | 69 | 69 | 0 | 34/69/149/246 | below-300 | `8425b031d743` |
| mini-mystery | vanished-crypto-wallet | 69 | 69 | 69 | 0 | 27/67/155/226 | below-300 | `d71adc335a0f` |
| mini-mystery | engagement-ring-came-back | 69 | 69 | 69 | 0 | 27/67/131/224 | below-300 | `b48013707bd0` |
| mini-mystery | deepfake-confession | 69 | 69 | 69 | 0 | 30/66/124/208 | below-300 | `bfb53f8f27c9` |
| mini-mystery | cancelled-at-midnight | 69 | 69 | 69 | 0 | 29/65/145/190 | below-300 | `e238a642fa6e` |
| mini-mystery | final-interview | 69 | 69 | 69 | 0 | 30/67/133/244 | below-300 | `84966219e949` |
| mini-mystery | guest-never-checked-out | 69 | 69 | 69 | 0 | 27/66/123/222 | below-300 | `5744fb12a83f` |
| mini-mystery | last-seen-217 | 69 | 69 | 69 | 0 | 27/66/109/199 | below-300 | `abe18d697cfa` |
| mini-mystery | live-after-vanished | 69 | 69 | 69 | 0 | 31/66/133/228 | below-300 | `90d8d5037f96` |
| mini-mystery | smart-home-lockdown | 69 | 69 | 69 | 0 | 29/66/122/207 | below-300 | `4a3301f4c929` |
| mini-mystery | wrong-person-drank-it | 69 | 69 | 69 | 0 | 30/66/124/213 | below-300 | `0a7f2be38ae9` |
| mini-mystery | crash-already-online | 69 | 69 | 69 | 0 | 30/66/128/227 | below-300 | `d80095917312` |
| mini-mystery | bride-never-arrived | 69 | 69 | 69 | 0 | 21/53/154/241 | below-300 | `611210c7bde4` |
| mini-mystery | bishops-announcement | 69 | 69 | 69 | 0 | 21/54/125/198 | below-300 | `ebd820000203` |
| mini-mystery | harvest-offering | 69 | 69 | 69 | 0 | 19/47/123/195 | below-300 | `c5b2399f8d37` |
| mini-mystery | reunion-broadcast | 69 | 69 | 69 | 0 | 22/50/139/203 | below-300 | `8fe8958f5b43` |
| mini-mystery | reading-of-will | 69 | 69 | 69 | 0 | 18/51/143/212 | below-300 | `3d764a29ca11` |
| mini-mystery | cooperative-payout | 69 | 69 | 69 | 0 | 15/49/148/183 | below-300 | `01ecc6b0e9af` |
| mini-mystery | last-bus-enugu | 69 | 69 | 69 | 0 | 18/51/138/227 | below-300 | `05dae25ec3c1` |
| mini-mystery | grooms-second-ring | 69 | 69 | 69 | 0 | 17/46/141/195 | below-300 | `d48f94a44328` |
| mini-mystery | senators-empty-coffin | 69 | 69 | 69 | 0 | 22/47/140/217 | below-300 | `048549c9dd95` |
| mini-mystery | missing-afrobeats-star | 69 | 69 | 69 | 0 | 16/50/129/210 | below-300 | `536b3ad03484` |
| mini-mystery | phone-that-could-ruin-everyone--remix | 67 | 67 | 67 | 0 | 34/71/156/180 | below-300 | `d542bd5a5576` |
| mini-mystery | vanished-crypto-wallet--remix | 67 | 67 | 67 | 0 | 27/67/144/186 | below-300 | `9b429c8e4544` |
| mini-mystery | engagement-ring-came-back--remix | 67 | 67 | 67 | 0 | 27/68/131/175 | below-300 | `bbcd7448ddd3` |
| mini-mystery | deepfake-confession--remix | 67 | 67 | 67 | 0 | 30/68/124/177 | below-300 | `3a046b772425` |
| mini-mystery | cancelled-at-midnight--remix | 67 | 67 | 67 | 0 | 29/67/146/175 | below-300 | `bb8ea179c76d` |
| mini-mystery | final-interview--remix | 67 | 67 | 67 | 0 | 30/68/133/195 | below-300 | `80c83576025a` |
| mini-mystery | guest-never-checked-out--remix | 67 | 67 | 67 | 0 | 27/67/123/176 | below-300 | `e45d0fc26cf4` |
| mini-mystery | last-seen-217--remix | 67 | 67 | 67 | 0 | 27/69/109/179 | below-300 | `f1fede89cc43` |
| mini-mystery | live-after-vanished--remix | 67 | 67 | 67 | 0 | 31/67/133/173 | below-300 | `1e78482fb2b3` |
| mini-mystery | smart-home-lockdown--remix | 67 | 67 | 67 | 0 | 29/68/122/174 | below-300 | `88c87b9d7839` |
| mini-mystery | wrong-person-drank-it--remix | 67 | 67 | 67 | 0 | 30/67/127/185 | below-300 | `16f711cb5f47` |
| mini-mystery | crash-already-online--remix | 67 | 67 | 67 | 0 | 30/67/119/177 | below-300 | `5ecd099dfc42` |
| mini-mystery | bride-never-arrived--remix | 67 | 67 | 67 | 0 | 21/53/154/184 | below-300 | `07b709d1319c` |
| mini-mystery | bishops-announcement--remix | 67 | 67 | 67 | 0 | 21/53/136/198 | below-300 | `44404cc62834` |
| mini-mystery | harvest-offering--remix | 67 | 67 | 67 | 0 | 19/47/123/195 | below-300 | `ea4b5e11638d` |
| mini-mystery | reunion-broadcast--remix | 67 | 67 | 67 | 0 | 22/50/145/203 | below-300 | `bfac8ff1cfc0` |
| mini-mystery | reading-of-will--remix | 67 | 67 | 67 | 0 | 18/50/149/212 | below-300 | `1ea1ba3fdca7` |
| mini-mystery | cooperative-payout--remix | 67 | 67 | 67 | 0 | 15/49/153/178 | below-300 | `468f6ab503e6` |
| mini-mystery | last-bus-enugu--remix | 67 | 67 | 67 | 0 | 18/49/138/193 | below-300 | `8c0eb3026500` |
| mini-mystery | grooms-second-ring--remix | 67 | 67 | 67 | 0 | 17/46/141/195 | below-300 | `67757b94ff35` |
| mini-mystery | senators-empty-coffin--remix | 67 | 67 | 67 | 0 | 22/46/140/200 | below-300 | `6351200c87cc` |
| mini-mystery | missing-afrobeats-star--remix | 67 | 67 | 67 | 0 | 16/50/120/198 | below-300 | `4f9ad83f329a` |
| do-you-know-me | personality | 300 | 300 | 300 | 0 | 94/171/201/220 | meets-300 | `47c7f08b67f2` |
| do-you-know-me | everyday | 300 | 300 | 300 | 0 | 122/183/209/222 | meets-300 | `0133e9b605b7` |
| do-you-know-me | food | 300 | 300 | 300 | 0 | 96/182/209/223 | meets-300 | `a88d069e674f` |
| do-you-know-me | opinions | 300 | 300 | 300 | 0 | 129/228/263/282 | meets-300 | `6d61419c6024` |
| do-you-know-me | entertainment | 300 | 300 | 300 | 0 | 159/215/241/258 | meets-300 | `9eeb4dd93fbc` |
| do-you-know-me | future | 300 | 300 | 300 | 0 | 150/219/240/252 | meets-300 | `b87814657f2a` |
| do-you-know-me | nigerian-life | 300 | 300 | 300 | 0 | 167/219/243/260 | meets-300 | `bb254a16c0e2` |
| do-you-know-me | wild-cards | 300 | 300 | 300 | 0 | 112/199/227/245 | meets-300 | `7392fd3184d0` |
| think-fast | main | 300 | 300 | 300 | 0 | 21/48/62/70 | meets-300 | `112d9022960b` |
| not-me-your-honour | birthday-cake | 11 | 11 | 11 | 0 | 38/62/90/104 | below-300 | `502639352e26` |
| not-me-your-honour | group-chat | 11 | 11 | 11 | 0 | 41/77/82/86 | below-300 | `fd2a2d1d30ed` |
| not-me-your-honour | missing-jollof | 11 | 11 | 11 | 0 | 33/73/85/91 | below-300 | `2e60f51cf48b` |
| not-me-your-honour | playlist-sabotage | 11 | 11 | 11 | 0 | 36/69/83/85 | below-300 | `cd9d3b3d0991` |
| not-me-your-honour | double-booked-date | 11 | 11 | 11 | 0 | 52/77/82/97 | below-300 | `043c8164c9e0` |
| not-me-your-honour | borrowed-hoodie | 11 | 11 | 11 | 0 | 37/74/82/85 | below-300 | `f352f49dbc9c` |
| not-me-your-honour | office-lunch | 11 | 11 | 11 | 0 | 45/64/91/94 | below-300 | `569e81f0b860` |
| not-me-your-honour | wifi-password | 11 | 11 | 11 | 0 | 38/62/83/90 | below-300 | `86c0ec35235a` |
| not-me-your-honour | surprise-party | 11 | 11 | 11 | 0 | 41/56/80/90 | below-300 | `db0eec925e12` |
| not-me-your-honour | dating-profile | 11 | 11 | 11 | 0 | 38/66/95/104 | below-300 | `b597fd746c4c` |
| bad-advice-only | dating | 30 | 30 | 30 | 0 | 91/120/197/204 | below-300 | `7b484b5693c0` |
| bad-advice-only | friends | 30 | 30 | 30 | 0 | 88/116/187/207 | below-300 | `ade3888fab5d` |
| bad-advice-only | work | 30 | 30 | 30 | 0 | 91/113/189/190 | below-300 | `269c12b53034` |
| bad-advice-only | everyday | 30 | 30 | 30 | 0 | 73/139/196/235 | below-300 | `e305926144c2` |
| bad-advice-only | naija | 30 | 30 | 30 | 0 | 76/111/203/205 | below-300 | `176eedd91905` |
| bad-advice-only | wild | 30 | 30 | 30 | 0 | 97/123/197/207 | below-300 | `925378c9d441` |

## Per-game reconciliation

| Game | Raw | Unique | Memberships | Enabled | Disabled / legacy | Missing authored IDs | Readiness |
|---|---:|---:|---:|---:|---:|---:|---|
| Truth or Dare (`truth-or-dare`) | 926 | 926 | 926 | 926 | 0 | 926 | meets-300 |
| Spicy Opener (`spicy-starters`) | 981 | 600 | 981 | 981 | 0 | 981 | meets-300 |
| Never Have I Ever (`never-have-i-ever`) | 300 | 300 | 300 | 300 | 0 | 300 | meets-300 |
| Late Night Talks (`late-night-talks`) | 2100 | 2100 | 2100 | 2100 | 0 | 2100 | meets-300 |
| Dinner Table (`dinner-table`) | 2100 | 2100 | 2100 | 2100 | 0 | 2100 | meets-300 |
| Icebreaker (`icebreaker`) | 1500 | 1500 | 1500 | 1500 | 0 | 1500 | meets-300 |
| Real Talk, Every Day (`everyday-conversation`) | 1800 | 1800 | 1800 | 1800 | 0 | 1800 | meets-300 |
| Back to Us (`reconnect`) | 4500 | 4500 | 4500 | 4500 | 0 | 4500 | meets-300 |
| Dateable or Dealbreaker (`red-flag-green-flag`) | 300 | 300 | 300 | 300 | 0 | 300 | meets-300 |
| Charades (`charades`) | 5400 | 5400 | 5400 | 5400 | 0 | 5400 | meets-300 |
| Beyond Small Talk (`strangers`) | 4500 | 4500 | 4500 | 4500 | 0 | 4500 | meets-300 |
| Drop a Finger (`finger-down`) | 2700 | 2700 | 2700 | 2700 | 0 | 2700 | meets-300 |
| Take a Sip (`take-a-sip`) | 3000 | 3000 | 3000 | 3000 | 0 | 3000 | meets-300 |
| Answer or Drink (`sip-or-spill`) | 1800 | 1800 | 1800 | 1800 | 0 | 1800 | meets-300 |
| Keep a Straight Face (`you-laugh`) | 300 | 300 | 300 | 300 | 0 | 300 | meets-300 |
| Dare or Pour (`do-or-drink`) | 1800 | 1800 | 1800 | 1800 | 0 | 1800 | meets-300 |
| Two Truths and a Bluff (`two-truths-bluff`) | 0 | 0 | 0 | 0 | 0 | 0 | not-applicable |
| Who’s Most Likely To? (`most-likely-to`) | 300 | 300 | 300 | 300 | 0 | 300 | below-300 |
| Choose Your Side (`choose-your-side`) | 300 | 300 | 300 | 300 | 0 | 300 | below-300 |
| Who Said That? (`who-said-that`) | 300 | 300 | 300 | 300 | 0 | 300 | meets-300 |
| We Just Met (`we-just-met`) | 300 | 300 | 300 | 300 | 0 | 300 | below-300 |
| Whot (`whot`) | 0 | 0 | 0 | 0 | 0 | 0 | not-applicable |
| Imposter (`imposter`) | 1818 | 1818 | 1818 | 1818 | 0 | 1818 | meets-300 |
| Mini Mystery (`mini-mystery`) | 2992 | 1753 | 2992 | 2992 | 0 | 2992 | below-300 |
| Do You Know Me? (`do-you-know-me`) | 2400 | 2400 | 2400 | 2400 | 0 | 2400 | meets-300 |
| Think Fast (`think-fast`) | 300 | 300 | 300 | 300 | 0 | 300 | meets-300 |
| Not Me, Your Honour! (`not-me-your-honour`) | 110 | 110 | 110 | 110 | 0 | 110 | below-300 |
| Bad Advice Only (`bad-advice-only`) | 180 | 180 | 180 | 180 | 0 | 180 | below-300 |

## Decisions and migration constraints

1. Categories below 300 are reported as gaps; no synthetic cards were added.
2. Two Truths and a Bluff is not applicable because its statements are player-authored. Whot is not applicable because it uses a fixed rules-based card deck rather than managed prompt content.
3. Every bundled source entry lacks an authored persistent ID. The migration must use deterministic IDs derived from game, category, normalized payload, and occurrence, with a mapping artifact for reversibility.
4. Existing arrays stay in the repository as the fallback and rollback source until a separately approved removal.
5. Composite Choose Your Side records are counted as one card with two options. The migration must preserve that structure rather than treating the two options as two prompts.

Machine-readable evidence: [content-audit-v1.json](./content-audit-v1.json).
