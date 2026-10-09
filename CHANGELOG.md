## 3.14.4 — 10 oktober 2026

- Ook dubbele clubnamen uit de Duitse, Franse, Italiaanse en Spaanse bronnen samengevoegd.
- Exacte bronvarianten getest, met aparte identiteiten voor Paris FC/PSG en eerste teams/reserves.
- Filters gebruiken nu correct enkelvoud bij één team of competitie.

## 3.14.3 — 2026-10-10
- Clubidentiteiten gedeeld tussen filters en bronontdubbeling; ESPN heeft voorrang op OpenFootball.
- Expliciete brontijdzones en Nederlandse weergavetijd, zomer/wintertijd, eenmalige migratie van oude OpenFootball-cache.
- Cache en renderpad beide ontdubbeld; geen verzonnen 15.00 voor ontbrekende starttijd.
- Native filterdialoog in top layer, zichtbare Wis filters en afzonderlijke teamverwijdering.
- Bestaande voorkeuren behouden.

## 3.14.2 — 2026-10-10
- Definitieve stylesheet na filterstylesheet: filterknop blijft leesbaar, weergavetabs krijgen ruimte en compacte bediening blijft consequent.
- Extra regressiecontrole op daadwerkelijke CSS-volgorde, tabafstand en knopkleuren.

## 3.14.1 — 2026-10-10
- Livecontrole: oude automatische scroll voorbij bediening vervangen door één gekozen dag, met bediening bovenaan.
- Zoeken doorloopt expliciet alle dagen binnen sport/filters; wissen herstelt de gekozen dag.
- Datum blijft gekozen zonder scroll-observer die onverwacht dagen wisselt.

## 3.14.0 — 2026-10-10
- Herindeling als tv-gids: rustige sporttabs, compacte wedstrijdregels en één accentkleur.
- Alleen datumregel blijft vast; vorige/volgende dag, native kalender en Vandaag.
- Korte filtersamenvatting; bestaande keuzes eenmalig overgenomen als Mijn voorkeuren. Voorkeuren bewaren/herstellen zonder tijdelijke filters te vermengen.
- Thema, verversen en standen onder Meer; focusherstel, achtergrond inert en Escape/Tab-bediening.
- Aanraakvlakken van 44 CSS-pixels, contrast, reflow en verminderde beweging.
- Bronnen, sportgebonden zoekfunctie en wedstrijdcache behouden.

# Changelog

## 3.13.1 — 2026-10-09
- Club-oefenwedstrijden blijven bij Clubs in plaats van Landenteams.
- Teamkeuzes en competitieaantallen gebruiken de getoonde periode (drie dagen terug, dertig vooruit), met vaste Nederlandse clubs en opgeslagen keuzes.
- Meer exacte club- en landnaamvarianten samengevoegd.
- Opgeslagen filters gelden direct bij openen, ook bij snel laden uit cache.

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

