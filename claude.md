# Sport op TV - Claude Project Notes

## Current Version: 1.1.3

## Changelog

### v1.1.3 (2026-02-11)
- Improved: Standings fallback logic - altijd static data als API faalt
- Added: Debug logging voor standings troubleshooting

### v1.1.2 (2026-02-11)
- Fixed: CORS proxy toegevoegd voor GitHub Pages (API was geblokkeerd door browser)
- API calls gaan nu via corsproxy.io

### v1.1.1 (2026-02-11)
- Improved: Mobile layout (compacter header, tabs, filters)
- Fixed: API status shows "Fallback data (API limiet)" instead of just source name
- Fixed: Footer now clearly shows "API-Football, OpenF1 | Fallback: iservoetbalvanavond.nl"
- Removed: Debug console.log statements

### v1.1.0 (2026-02-11)
- **Major redesign** - Modern UI overhaul
- Added: Inter font (Google Fonts)
- Added: Dark mode toggle (saved to localStorage)
- Added: Glassmorphism effects (backdrop-filter blur)
- Added: Gradient backgrounds for sport tabs and buttons
- Added: Glow shadows that match sport colors (green/orange/red)
- Added: Lucide icons for sport tabs (circle-dot, target, flag)
- Added: Smooth animations and transitions (cubic-bezier)
- Added: Custom scrollbar styling
- Improved: Card hover effects with colored shadows
- Improved: Typography and spacing
- Improved: Mobile responsive design
- Improved: Standings table with position highlighting

### v1.0.0 (2026-02-11)
- Fixed: Uitslagen toggle wasn't working after re-render (show-scores class was being removed)
- Added: Version numbering system in footer
- Added: This claude.md file for version tracking

### Pre-v1.0.0 Features
- Voetbal, Darts en F1 tabs
- Datumnavigatie (dag/week voor/achteruit + vandaag)
- Uitslagen toggle (standaard verborgen)
- Verleden toggle voor afgelopen wedstrijden
- Filters voor voetbal (competities, clubs)
- Programma/Standen toggle
- Standings voor alle sporten:
  - Voetbal: Eredivisie, Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Champions League
  - Darts: Premier League Darts 2026
  - F1: Coureurs en Constructeurs 2026
- WK 2026: Alle 12 groepen + wedstrijdschema (incl. Nederland)
- Internationale competities: WK, EK, Nations League, Kwalificaties, Vrouwen
- API-Football integratie (met rate limit handling)
- OpenF1 API voor F1 data
- Caching: 6 uur voor wedstrijden, 24 uur voor standen
- Static fallback data wanneer API niet beschikbaar
- iservoetbalvanavond.nl als fallback bron (credited in footer)

## API Configuration

### API-Football
- Key: `6299b9b25468371fa7878f188ca297c0`
- Limit: 100 requests/day
- Cache TTL: 6 hours

### OpenF1
- No API key needed
- Used for F1 sessions and schedule

### Ergast (F1 Standings)
- No API key needed
- Note: No 2026 data yet (season starts March 8)
- Using static data for 2026 drivers/constructors

## Key Files
- `index.html` - Single-file web application

## Important Functions
- `getStaticFootballMatches()` - Fallback football data
- `fetchFootballMatches()` - API call with caching
- `updateFilterVisibility()` - Shows/hides filters per sport
- `renderStandings()` - Renders standings for all sports
- `renderEvents()` - Renders match/event schedule

## Static Data (updated manually)
- `wk2026Groups` - WK 2026 group stage
- `wk2026Schedule` - WK 2026 match schedule
- `f1_2026_drivers` - F1 2026 drivers list
- `f1_2026_constructors` - F1 2026 teams list
- `plDartsStandings` - PL Darts 2026 standings (after Night 1)
- `getStaticStandings()` - Football league standings snapshots

## Known Issues
- API-Football rate limit (100/day) causes "Geen voetbal gevonden" when exceeded
- Ergast API has no 2026 F1 data yet

## User Preferences
- No emoji flags for darts players (removed)
- No fake/demo scores
- Uitslagen toggle hidden for darts and F1
- Filters only shown for voetbal
- iservoetbalvanavond.nl as primary fallback source
