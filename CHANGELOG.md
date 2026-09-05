# Changelog

## 3.12.0 — 2026-09-05
- Raceconditie bij het laden van zoeken en release notes opgelost; beide werken nu direct bij de eerste opening.
- Universeel zoeken zoekt tijdelijk in alle sporten en herstelt na wissen de eerdere sportkeuze.
- Zoekbereik uitgebreid en herbouwd voor sport, team, competitie, land, evenementtitel en zender.
- Suggesties verbeterd met typeaanduiding, ontdubbeling en bediening via aanraken, pijltjestoetsen en Enter.
- Duidelijke melding met wisknop toegevoegd wanneer een zoekopdracht geen resultaten heeft.
- Nieuw doorzoekbaar competitiefilter voor voetbal toegevoegd als compact venster naast het zoekveld.
- Competities in het filter worden dynamisch uit de geladen wedstrijden opgebouwd en tonen het aantal wedstrijden.
- Geselecteerde voetbalcompetities blijven lokaal bewaard; niets geselecteerd betekent alle competities.
- Oude verborgen club- en competitiefiltercode verwijderd.

## 3.11.0 — 2026-08-31
- Nieuwe release-notes-popup toegevoegd.
- De popup verschijnt automatisch één keer wanneer een nieuwe versie beschikbaar is.
- De popup toont alle gebruikersrelevante wijzigingen van die release.
- Het zichtbare versienummer onderaan de app is verhoogd naar v3.11.0 en opent de release notes opnieuw wanneer erop wordt getikt.
- Vaste releaseprocedure vastgelegd in `AGENTS.md`: iedere functionele wijziging vereist voortaan een versiebump, release notes en changelog-update.
- Universele zoekfunctie uit 3.10.1 meegenomen in de release notes: zoeken op sport, team, competitie, evenementtitel en zender, inclusief suggesties.

## 3.10.1 — 2026-08-31
- Zoekveld verbreed van alleen voetbalteams naar alle sporten.
- Zoeken werkt nu op sport, team, competitie, evenementtitel en zender.
- Voorbeelden: Ajax, Ziggo, Darts, MotoGP, Champions League.
- Suggesties toegevoegd tijdens het typen.
- Zoeklogica ondergebracht in `search-enhancements.js` en geladen via `football-policy.js`.
