# Sport op TV - werkinstructies

## Release discipline
Bij iedere functionele wijziging aan de app:

1. Verhoog het zichtbare versienummer in `release-notes.js` volgens semver.
2. Voeg in `release-notes.js` duidelijke release notes toe met alle gebruikersrelevante wijzigingen van die versie.
3. Werk `CHANGELOG.md` bij met dezelfde versie en wijzigingen.
4. Zorg dat de popup bij de nieuwe versie automatisch één keer verschijnt per browser via de bestaande `sportOpTvSeenRelease` localStorage-key.
5. Laat het versienummer in de footer de release notes opnieuw openen.
6. Gebruik cache-busting querystrings bij geladen extensies wanneer hun inhoud wijzigt.
7. Controleer na de wijziging dat de publieke GitHub Pages-versie de nieuwe bestanden daadwerkelijk serveert.

Geen functionele wijziging afronden zonder versiebump en release notes.
