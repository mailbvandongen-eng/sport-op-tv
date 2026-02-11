# Sport op TV - Claude Project Notes

## Current Version: 1.2.6

## Changelog

### v1.2.6 (2026-02-11)
- Added: Ondersteuning voor lokale logo's in /logos/ map
- Added: CLUB_LOGOS en F1_LOGOS configuratie
- Added: Fallback naar tekst als logo niet gevonden wordt
- Added: BENODIGDE_LOGOS.txt met lijst van alle benodigde bestanden

### v1.2.5 (2026-02-11)
- Changed: Zender iconen/badges nog kleiner op mobiel

### v1.2.4 (2026-02-11)
- Fixed: TV zender nu zichtbaar op mobiel (4-kolom layout)
- Changed: Alle tekst kleiner op mobiel zodat lange clubnamen passen
- Changed: Compactere weergave van wedstrijden op mobiel

### v1.2.3 (2026-02-11)
- Fixed: Competitie tabs in standen nu wit in dark mode

### v1.2.2 (2026-02-11)
- Changed: Verleden periode per sport: voetbal 3 dagen, darts/F1 7 dagen
- Fixed: Darts accordion - andere events sluiten bij openen nieuwe
- Fixed: WK 2026 standen leesbaar in dark mode (standings-title + table kleuren)

### v1.2.1 (2026-02-11)
- Fixed: Standings tabel nu leesbaar in dark mode
- Fixed: WK 2026 groepen werken nu correct in dark mode
- Added: CSS variabelen voor alle kleuren (geen hardcoded waarden meer)

### v1.2.0 (2026-02-11)
- Changed: Competities + Clubs + Reset op één rij
- Changed: Verleden en Uitslagen nu als toggle switches
- Changed: Verleden toont nu 3 dagen terug (was 7 dagen)
- Changed: Cleaner filter layout

### v1.1.9 (2026-02-11)
- Removed: Ververs knop (F5 volstaat)
- Removed: "Data: API-Football..." tekst uit footer
- Changed: API status nu onder "Sport op TV" in footer
- Changed: Footer vereenvoudigd

### v1.1.8 (2026-02-11)
- Changed: Filter (competities + clubs + reset) op één rij
- Changed: Verleden/Uitslagen/Ververs nog compacter
- Changed: Header tekst wit/contrasterend in dark mode
- Changed: Alle filter/button elementen kleiner

### v1.1.7 (2026-02-11)
- Changed: Verleden/Uitslagen/Ververs zijn nu kleine buttons naast elkaar
- Changed: API status indicator verplaatst naar onderaan de pagina
- Changed: Versienummer in header (klein, subtiel)
- Removed: "Geen reclame, gewoon overzicht" tekst uit footer
- Removed: Versienummer uit footer

### v1.1.6 (2026-02-11)
- Changed: Dark mode is nu standaard
- Fixed: "Sport op TV" titel leesbaar in dark mode (lichtere gradient)

### v1.1.5 (2026-02-11)
- Fixed: Mobile layout veel compacter
  - Kleinere sport tabs, filters, toggles
  - Alles past nu beter op één scherm
  - Minder ruimte tussen elementen

### v1.1.4 (2026-02-11)
- Added: Echte uitslagen voor verleden wedstrijden (2-10 feb 2026)
  - Ajax 1-2 PSV, Feyenoord 3-1 AZ
  - Man City 2-2 Liverpool, Real Madrid 2-1 Atlético
  - Bayern 3-1 Dortmund, Barcelona 2-0 Real Sociedad
  - Arsenal 2-1 Chelsea, PSV 3-0 NEC
  - Inter 2-0 Juventus, Napoli 2-2 AC Milan
  - Tottenham 1-2 Newcastle, Chelsea 2-2 Leeds
  - Everton 1-2 Bournemouth, West Ham 1-1 Man United

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
