# MTG Draft Trainer

A Progressive Web App (PWA) designed to help Magic: The Gathering players improve their draft picks, financial knowledge, and win-rate intelligence.

## 🏆 Game Modes

### 1. Draft Mode (ATA)
- **Goal:** Pick the card that is drafted earlier by "Top Players" on 17Lands.
- **Data Source:** 17Lands Average Taken At (ATA).
- **Tie Logic:** If the ATA difference between two cards is ≤ 0.20, both are considered a "Tie" and either choice is correct.

### 2. Value Mode (USD)
- **Goal:** Pick the card with the higher secondary market value.
- **Data Source:** Scryfall USD Prices.
- **Bulk Filter:** Any card priced below $1.00 is treated as "Bulk".
- **Special Logic:**
  - If both cards are < $1.00, it is a "Bulk Tie".
  - Color filters are disabled in this mode to ensure a wide pool of valuable cards.
  - Commons are hidden to focus on higher-value items.

### 3. Win Rate Mode (GIH WR)
- **Goal:** Pick the card that has the highest Games-In-Hand (GIH) Win Rate.
- **Data Source:** 17Lands GIH Win Rate percentage.
- **Tie Logic:** If the Win Rate difference is ≤ 0.5%, it is considered a "Tie".

---

## 🏗 Architecture

### Data Management (Master/Stats v2)
To maximize performance and minimize redundancy, the app uses a split-file architecture:
- **`[set]_metadata.json`**: Contains static card info (Name, Color, Rarity, Image URL, Price). Loaded once per set.
- **`[set]_stats.json`**: Contains all pick-order and win-rate stats for all 10 archetypes + Overall data.

### Mobile-First Design
- **Edge-to-Edge:** Cards are displayed flush to the screen edges on mobile devices to maximize card art visibility.
- **Responsive Layouts:** Supports "Stack" (vertical) and "Wide" (side-by-side) viewing modes.
- **Touch Stability:** Uses `matchMedia('(hover: hover)')` to prevent sticky hover borders on touchscreens.
- **Stability:** Includes a global React Error Boundary and defensive null-guards to prevent "Black Screen" crashes if data is missing.

---

## 🛠 Development & Data Updates

### Updating Set Data
The project includes a Python pipeline in `/backend/fetch_set_data.py`. To update a set or add a new one:

```bash
# From the project root
python3 backend/fetch_set_data.py MH3
```

This script:
1. Fetches current USD prices and image URLs from Scryfall.
2. Fetches Top Player stats for all 11 archetypes from 17Lands.
3. Consolidates them into the optimized Master/Stats JSON format.

### Tech Stack
- **Frontend:** React + Vite (Vanilla CSS)
- **Deployment:** GitHub Pages
- **Icons:** Modern Emoji symbols
- **Fonts:** Inter / System Sans-Serif
