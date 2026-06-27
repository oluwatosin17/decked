# Decked — Session Handoff

## Repo
**GitHub:** https://github.com/oluwatosin17/decked  
**Local:** `~/claude/decked/`  
**Live server:** `http://localhost:3456/` (served from `~/claude/index.html` via `npx serve -p 3456 .`)  
**Figma file:** `tLYkXZSDDlEiPIkNbkw9n8` → https://www.figma.com/design/tLYkXZSDDlEiPIkNbkw9n8/Claude

---

## Architecture — Two Parallel Implementations

### 1. Production (what's live at port 3456) ⬅ PRIMARY
**File:** `~/claude/index.html`  
Vanilla HTML + Tailwind CDN + inline JS. Served directly via `npx serve`.  
This is the file that gets pushed to GitHub and is the source of truth.

### 2. React/Vite dev version (NOT yet in production)
**Files:** `~/claude/decked/src/`  
- `App.jsx` — homepage with card bento grid
- `TruthOrDareGame.jsx` — full React game component (more complete, has Screen 3)
- `index.css` — Tailwind + game styles

The React version runs on `npm run dev` (port 5173/5174 via `.claude/launch.json`).  
It is **NOT** what port 3456 serves. Do not confuse the two.

---

## What's been built (index.html)

### Decked Homepage
- Hero: "The party starts here" + animated starfield canvas
- Card library: 16 game decks in 4 rows (Truth or Dare, Spicy Starters, Red/Green Flag, Icebreaker, Dinner Table, Late Night Talks, Everyday Conversation, Charades, We're Not Really Strangers, Never Have I Ever, Game of Poor Decisions, Let's Reconnect, Put a Finger Down, Take a Sip If, Sip or Spill, You Laugh You're Out, Do or Drink)
- Footer with social icons (TikTok, Instagram, WhatsApp)
- Animated 3-layer particle starfield + CSS star drift (background)

### Truth or Dare Game Flow (inside index.html)
Triggered by clicking the Truth or Dare bento card (`onclick="openTOD()"`).

**Screen 1 — Age Gate** (`#tod-age-gate`)
- White card with red heart bands (top + bottom), 11 alternating hearts per band
- 18+ badge: `Anton` font 56px, #e62a24 background, 4px border #000, 97×96px, rotated -6°
- "MATURE CONTENT" heading: Anton SC 36px black
- Body text: Inter 14px #5d3f3c
- Buttons: "No, go back" (outlined) + "YES, I'm 18+" (red #dc2827 with drop-shadow)

**Screen 2 — Who's Playing** (`#tod-player-setup`)
- Single input row with `+` icon (transforms to colored ✓ as user types)
- "TAP TO ADD →" appears inline on right as user types
- Press Enter or tap "TAP TO ADD" to commit player
- Player rows: `#111113` bg, dashed border, 20px gap, 32×32 colored circle avatar with **white 2.5px ring** (`box-shadow: 0 0 0 2.5px #ffffff`)
- Tap a player name → converts to editable input inline (Enter/blur saves, Escape cancels)
- Remove player with ×
- SKIP FOR NOW (white outline) + NEXT (gray disabled / red active with drop-shadow)
- NEXT activates red when ≥1 player is added

**Space background** (canvas `#tod-bg-canvas`, `position:fixed; z-index:0` inside overlay)
- 445 stars across 3 depth layers with twinkling opacity animation
- 5 concurrent shooting stars on staggered schedules (fire every 1.5–4.5s each)
- Canvas runs only while overlay is open (started/stopped in `openTOD`/`closeTOD`)

**Nav** (sticky top, `z-index:2`)
- DECKED wordmark: clickable → `closeTOD()` → back to homepage
- Browse Games: `closeTOD()` → back to homepage
- How to Play / About: static

**Footer**
- DECKED (Staatliches 32px), tagline (Inter 14px #9ca3af)
- Social icons: TikTok, Instagram, WhatsApp (20×20 rounded-8)
- Divider + copyright + Privacy/Terms/Cookie links

---

## What's built in TruthOrDareGame.jsx (React, not yet production)

The React version has Screen 3 already implemented:

**Screen 3 — GamePlay**
- `TRUTHS` array (20 prompts) + `DARES` array (20 prompts)
- Alternates truth/dare per card index
- Current player label with colored avatar + "TRUTH"/"DARE" pill badge
- Animated card: `tod-card-enter` keyframe, color flips pink (truth) / red (dare)
- Card shows current & next player avatars + heart icon
- "SKIP FOR NOW" + "NEXT" advance through cards
- Players cycle round-robin

The React `PlayerSetup` is slightly different from `index.html`:
- No real-time typing preview (just Enter to add)
- No white ring on avatar (just solid circle)
- No editable names
- gap is 8px not 20px
- These need to be brought in sync if React version ever goes to production

---

## Design Tokens

| Token | Value |
|---|---|
| Background | `#0c0c0e` |
| Red primary | `#dc2827` |
| Red badge | `#e62a24` |
| Player row bg | `#111113` |
| Player row border | `rgba(255,255,255,0.1)` dashed |
| Heart stripe (light) | `#ecc1c9` |
| Body text | `#5d3f3c` |
| Subtext | `#9ca3af` |
| Divider | `#212326` |
| Avatar ring | `#ffffff` 2.5px |

## Fonts (loaded in `<head>`)
- `Anton` → 18+ badge
- `Anton SC` → headings, player names, nav links
- `Staatliches` → buttons, footer DECKED
- `Inter` → body copy, footer tagline
- `Spicy Rice` → hero heading
- `Satoshi` → card text on hero
- Plus: Slackey, Single Day, Luckiest Guy, Stick, Gasoek One, Freckle Face, Fredericka the Great, Inter Tight (for various deck cards)

## Player Colors (assigned in order)
```
#dc2827  #9b59b6  #27ae60  #e67e22  #3498db  #e91e63  #f39c12  #1abc9c
```

---

## Key JS Functions (index.html global scope)

```js
openTOD()           // Show overlay, show age gate, start space animation
closeTOD()          // Hide overlay, stop animation, return to homepage
todShowPlayerSetup() // Age gate → player setup screen
todInputChange()    // Called oninput — shows colored ✓ + TAP TO ADD inline
todCommitPlayer()   // Adds typed player, resets input row
todRemovePlayer(i)  // Removes player at index i
todEditPlayer(i)    // Converts player name span → editable input
```

All are inside an IIFE — `todPlayers` array is NOT on `window`.

---

## Figma Nodes (file: tLYkXZSDDlEiPIkNbkw9n8)

| Screen | Node ID |
|---|---|
| Full batch (4 screens) | `791-50071` |
| Age gate (Desktop 48) | `791-45994` |
| Age gate card content | `791-46951` |
| Who's Playing — empty | `791-47048` |
| Who's Playing — 1 player | `791-48047` |
| Who's Playing — 3 players | `791-49053` |
| Player list + add row | `791-49009` |
| Player row (Tosin) | `791-49010` |
| Header nav | `791-47025` |
| Footer | `791-48031` |

---

## Recent Commits

```
77be7ff  Fix 18+ badge styling and add inline player name editing
bd39cd0  Implement Truth or Dare game flow with animated space background
2ac1695  Initial commit — Decked party card game site
```

---

## What comes next (next Figma batch)

The Figma designs are being delivered in batches. Screens delivered so far:
- ✅ Age Gate
- ✅ Who's Playing (empty, 1 player, 3 players)

**Likely remaining screens (not yet designed/delivered):**
- Screen 3: Game Play card (Truth card / Dare card)
- Screen 4: Game over / round summary
- Any modal overlays or transitions

When the next batch arrives, use node IDs from the Figma URL and call `get_design_context` + `get_screenshot` on each child node.

---

## Dev Notes

- **Screenshot tool** breaks if viewport is resized mid-session (goes black). Fix: `preview_stop` + `preview_start` to get a fresh server.
- **`openTOD()`** must be called as `document.getElementById('tod-overlay').style.display = 'none'; openTOD()` in eval to force a fresh open (in case overlay was already flex from a prior call).
- The canvas `#tod-bg-canvas` is `position:fixed; z-index:0` INSIDE `#tod-overlay`. The overlay content (nav, screens, footer) is at `z-index:1` or `z-index:2` to render above the canvas.
- The static `npx serve` server at port 3456 does NOT hot-reload. After editing `index.html`, reload the page in the preview.
