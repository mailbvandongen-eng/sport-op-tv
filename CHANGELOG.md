# Changelog

## 3.13.0 — 2026-10-09
- Compact zoekveld met wisknop; zoeken behoudt sportkeuze en voetbalfilters.
- Duidelijke Programma/Uitslagen-knoppen zonder onnodig verversen bij wisselen.
- Eén filterpaneel voor teams en competities; wijzigingen pas toepassen via Toon wedstrijden.
- Clubs en landenteams gescheiden, met Nederland mannen en vrouwen apart; selecties blijven bewaard.
- Actieve filters zichtbaar en afzonderlijk verwijderbaar; filters werken ook bij voetbaluitslagen.
- Nederland zoeken verwijst naar het team, niet naar alle Nederlandse competities.
- Hersteld: verborgen filterknoppen en zoekresultaten werden door CSS toch getoond.

## 3.12.8 — 2026-10-04
- Dagkoppen bedekken de wedstrijdregels niet meer: dartsdetails en starttijden zijn weer zichtbaar en aanklikbaar.
- Dartssessies zijn ook met Enter en de spatiebalk te openen en te sluiten.
- F1 toont Nederlandse sessienamen, circuitinformatie en starttijden in Nederlandse tijd.

## 3.12.7 — 2026-10-04
- De voetbalbron haalt nu ook wedstrijden van de afgelopen drie dagen op, inclusief Europese competities en interlands.
- Met Mijn competities blijven de afgelopen drie dagen aanklikbaar. Een lege dag meldt dat er geen wedstrijden in je selectie zijn.
- Verversen behoudt de gekozen datum, zodat de agenda niet terug springt naar vandaag.

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

