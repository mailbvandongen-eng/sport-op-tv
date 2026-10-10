(function () {
    'use strict';

    // Hotfix 2026-09-17: het World Series Finals-toernooi stond wel in de
    // kalender, maar alleen met generieke rondelabels. Vul de echte order of
    // play en de bekende brackets in, zodat Darts een daadwerkelijk programma
    // toont. Dit draait na index.html en rendert daarna de agenda opnieuw.
    if (typeof dartsCalendar === 'undefined') return;

    const worldSeriesSchedule = {
        '2026-09-17': {
            time: '19:00',
            event: 'World Series of Darts Finals',
            matches: [{
                time: '19:00',
                label: 'Eerste ronde - avondsessie',
                items: [
                    'Viktor Tingstrom vs Dirk van Duijvenbode',
                    'Rob Cross vs Ryan Searle',
                    'Karel Sedlacek vs Ben Robb',
                    'Kevin Doets vs Ross Smith',
                    'Stephen Bunting vs Josh Rock',
                    'Luke Humphries vs Jermaine Wattimena',
                    'Michael van Gerwen vs Daryl Gurney',
                    'Gian van Veen vs Chris Dobey'
                ]
            }]
        },
        '2026-09-18': {
            time: '19:00',
            event: 'World Series of Darts Finals',
            matches: [{
                time: '19:00',
                label: 'Eerste ronde - avondsessie',
                items: [
                    'Adam Leek vs Jim Long',
                    'Motomu Sakai vs Callan Rydz',
                    'Wessel Nijman vs Simon Whitlock',
                    'Nathan Aspinall vs Raymond Smith',
                    'James Wade vs Damon Heta',
                    'Gerwyn Price vs Brody Klinge',
                    'Luke Littler vs Danny Noppert',
                    'Jonny Clayton vs Maik Kuivenhoven'
                ]
            }]
        },
        '2026-09-19': {
            time: '13:00',
            event: 'World Series of Darts Finals',
            matches: [
                {
                    time: '13:00',
                    label: 'Tweede ronde - middagsessie',
                    items: [
                        'Van Gerwen/Gurney vs Doets/Ross Smith',
                        'Bunting/Rock vs Cross/Searle',
                        'Humphries/Wattimena vs Tingstrom/Van Duijvenbode',
                        'Van Veen/Dobey vs Sedlacek/Robb'
                    ]
                },
                {
                    time: '19:00',
                    label: 'Tweede ronde - avondsessie',
                    items: [
                        'Price/Klinge vs Leek/Long',
                        'Wade/Heta vs Nijman/Whitlock',
                        'Littler/Noppert vs Aspinall/Raymond Smith',
                        'Clayton/Kuivenhoven vs Sakai/Rydz'
                    ]
                }
            ]
        },
        '2026-09-20': {
            time: '13:00',
            event: 'World Series of Darts Finals - Finale',
            matches: [
                { time: '13:00', label: 'Kwartfinales' },
                { time: '19:00', label: 'Halve finales + finale' }
            ]
        }
    };

    Object.entries(worldSeriesSchedule).forEach(([date, patch]) => {
        const event = dartsCalendar.find(item =>
            item.date === date && /world series.*final/i.test(String(item.event || ''))
        );
        if (!event) return;
        event.time = patch.time;
        event.event = patch.event;
        event.location = 'AFAS Live, Amsterdam';
        event.channel = 'Viaplay';
        event.matches = patch.matches;
    });

    if (typeof renderEvents === 'function') {
        setTimeout(() => renderEvents(), 0);
    }
})();

(function () {
    'use strict';

    const RELEASES = [
    {
        "version": "3.15.2",
        "date": "10 oktober 2026",
        "title": "Wijzigingen overzichtelijk teruglezen",
        "notes": [
            "Wijzigingsscherm zoals Detect: vaste kop met sluitknop, scrollbare versiekaarten en een vaste knop Gezien.",
            "Nieuwste versie bovenaan met Nieuw-label; eerdere updates blijven terug te lezen.",
            "Eén keer automatisch per nieuwe versie; opnieuw openen via het versienummer. Agenda en filters blijven behouden."
        ]
    },
    {
        "version": "3.15.1",
        "date": "10 oktober 2026",
        "title": "Wedstrijdmarges en racekalender hersteld",
        "notes": [
            "Ingesprongen wedstrijdachtergrond rechtgetrokken: vlak sluit aan onder de datumbalk, terwijl tijd en zender dezelfde binnenmarge als de header behouden.",
            "F1-racekalender uit Jolpica beschikbaar in naamdetails en bij volgende races.",
            "Racenamen en sessietitels behouden in details; onbekende tijden expliciet weergegeven.",
            "Punten in de stand gebruiken het leesbare accent voor licht en donker thema."
        ]
    },
    {
        "version": "3.15.0",
        "date": "10 oktober 2026",
        "title": "Jouw standen en toernooien onder Meer",
        "notes": [
            "Meer is een standenmenu met sport/competitiekeuze, favorieten, laatst bekeken stand en instellingen onderaan.",
            "Eredivisie, Premier League, Champions/Europa/Conference League; WK/EK/Nations League dames en heren met groepsstanden, schema, uitslagen en bevestigde knock-outwedstrijden.",
            "F1 via Jolpica, PDC Order of Merit via Darts Rankings, Premier League darts via Mastercaller, MotoGP via officiële statistieken en handbal Champions League en EK/WK dames/heren via EHF.",
            "Bron, seizoen, ophaaltijd, peildatum, archief en bronfouten zichtbaar; oude februari/noodtabellen verwijderd.",
            "Dagelijks meerdere bronupdates met behoud van laatste betrouwbare gegevens; handmatig verversen herstart de app niet.",
            "Geïsoleerde standenstate, bescherming tegen verlate antwoorden bij tabwissels en naamdetails zonder agenda/filters te veranderen."
        ]
    },
    {
        "version": "3.14.4",
        "date": "10 oktober 2026",
        "title": "Verbeteringen en herstel",
        "notes": [
            "Ook dubbele clubnamen uit de Duitse, Franse, Italiaanse en Spaanse bronnen samengevoegd.",
            "Exacte bronvarianten getest, met aparte identiteiten voor Paris FC/PSG en eerste teams/reserves.",
            "Filters gebruiken nu correct enkelvoud bij één team of competitie."
        ]
    },
    {
        "version": "3.14.3",
        "date": "2026-10-10",
        "title": "Verbeteringen en herstel",
        "notes": [
            "Clubidentiteiten gedeeld tussen filters en bronontdubbeling; ESPN heeft voorrang op OpenFootball.",
            "Expliciete brontijdzones en Nederlandse weergavetijd, zomer/wintertijd, eenmalige migratie van oude OpenFootball-cache.",
            "Cache en renderpad beide ontdubbeld; geen verzonnen 15.00 voor ontbrekende starttijd.",
            "Native filterdialoog in top layer, zichtbare Wis filters en afzonderlijke teamverwijdering.",
            "Bestaande voorkeuren behouden."
        ]
    },
    {
        "version": "3.14.2",
        "date": "2026-10-10",
        "title": "Verbeteringen en herstel",
        "notes": [
            "Definitieve stylesheet na filterstylesheet: filterknop blijft leesbaar, weergavetabs krijgen ruimte en compacte bediening blijft consequent.",
            "Extra regressiecontrole op daadwerkelijke CSS-volgorde, tabafstand en knopkleuren."
        ]
    },
    {
        "version": "3.14.1",
        "date": "2026-10-10",
        "title": "Verbeteringen en herstel",
        "notes": [
            "Livecontrole: oude automatische scroll voorbij bediening vervangen door één gekozen dag, met bediening bovenaan.",
            "Zoeken doorloopt expliciet alle dagen binnen sport/filters; wissen herstelt de gekozen dag.",
            "Datum blijft gekozen zonder scroll-observer die onverwacht dagen wisselt."
        ]
    },
    {
        "version": "3.14.0",
        "date": "2026-10-10",
        "title": "Verbeteringen en herstel",
        "notes": [
            "Herindeling als tv-gids: rustige sporttabs, compacte wedstrijdregels en één accentkleur.",
            "Alleen datumregel blijft vast; vorige/volgende dag, native kalender en Vandaag.",
            "Korte filtersamenvatting; bestaande keuzes eenmalig overgenomen als Mijn voorkeuren. Voorkeuren bewaren/herstellen zonder tijdelijke filters te vermengen.",
            "Thema, verversen en standen onder Meer; focusherstel, achtergrond inert en Escape/Tab-bediening.",
            "Aanraakvlakken van 44 CSS-pixels, contrast, reflow en verminderde beweging.",
            "Bronnen, sportgebonden zoekfunctie en wedstrijdcache behouden."
        ]
    },
    {
        "version": "3.13.1",
        "date": "2026-10-09",
        "title": "Verbeteringen en herstel",
        "notes": [
            "Club-oefenwedstrijden blijven bij Clubs in plaats van Landenteams.",
            "Teamkeuzes en competitieaantallen gebruiken de getoonde periode (drie dagen terug, dertig vooruit), met vaste Nederlandse clubs en opgeslagen keuzes.",
            "Meer exacte club- en landnaamvarianten samengevoegd.",
            "Opgeslagen filters gelden direct bij openen, ook bij snel laden uit cache."
        ]
    },
    {
        "version": "3.13.0",
        "date": "2026-10-09",
        "title": "Verbeteringen en herstel",
        "notes": [
            "Compact zoekveld met wisknop; zoeken behoudt sportkeuze en voetbalfilters.",
            "Duidelijke Programma/Uitslagen-knoppen zonder onnodig verversen bij wisselen.",
            "Eén filterpaneel voor teams en competities; wijzigingen pas toepassen via Toon wedstrijden.",
            "Clubs en landenteams gescheiden, met Nederland mannen en vrouwen apart; selecties blijven bewaard.",
            "Actieve filters zichtbaar en afzonderlijk verwijderbaar; filters werken ook bij voetbaluitslagen.",
            "Nederland zoeken verwijst naar het team, niet naar alle Nederlandse competities.",
            "Hersteld: verborgen filterknoppen en zoekresultaten werden door CSS toch getoond."
        ]
    },
    {
        "version": "3.12.8",
        "date": "2026-10-04",
        "title": "Verbeteringen en herstel",
        "notes": [
            "Dagkoppen bedekken de wedstrijdregels niet meer: dartsdetails en starttijden zijn weer zichtbaar en aanklikbaar.",
            "Dartssessies zijn ook met Enter en de spatiebalk te openen en te sluiten.",
            "F1 toont Nederlandse sessienamen, circuitinformatie en starttijden in Nederlandse tijd."
        ]
    },
    {
        "version": "3.12.7",
        "date": "2026-10-04",
        "title": "Verbeteringen en herstel",
        "notes": [
            "De voetbalbron haalt nu ook wedstrijden van de afgelopen drie dagen op, inclusief Europese competities en interlands.",
            "Met Mijn competities blijven de afgelopen drie dagen aanklikbaar. Een lege dag meldt dat er geen wedstrijden in je selectie zijn.",
            "Verversen behoudt de gekozen datum, zodat de agenda niet terug springt naar vandaag."
        ]
    },
    {
        "version": "3.12.0",
        "date": "2026-09-05",
        "title": "Verbeteringen en herstel",
        "notes": [
            "Raceconditie bij het laden van zoeken en release notes opgelost; beide werken nu direct bij de eerste opening.",
            "Universeel zoeken zoekt tijdelijk in alle sporten en herstelt na wissen de eerdere sportkeuze.",
            "Zoekbereik uitgebreid en herbouwd voor sport, team, competitie, land, evenementtitel en zender.",
            "Suggesties verbeterd met typeaanduiding, ontdubbeling en bediening via aanraken, pijltjestoetsen en Enter.",
            "Duidelijke melding met wisknop toegevoegd wanneer een zoekopdracht geen resultaten heeft.",
            "Nieuw doorzoekbaar competitiefilter voor voetbal toegevoegd als compact venster naast het zoekveld.",
            "Competities in het filter worden dynamisch uit de geladen wedstrijden opgebouwd en tonen het aantal wedstrijden.",
            "Geselecteerde voetbalcompetities blijven lokaal bewaard; niets geselecteerd betekent alle competities.",
            "Oude verborgen club- en competitiefiltercode verwijderd."
        ]
    },
    {
        "version": "3.11.0",
        "date": "2026-08-31",
        "title": "Verbeteringen en herstel",
        "notes": [
            "Nieuwe release-notes-popup toegevoegd.",
            "De popup verschijnt automatisch één keer wanneer een nieuwe versie beschikbaar is.",
            "De popup toont alle gebruikersrelevante wijzigingen van die release.",
            "Het zichtbare versienummer onderaan de app is verhoogd naar v3.11.0 en opent de release notes opnieuw wanneer erop wordt getikt.",
            "Vaste releaseprocedure vastgelegd in `AGENTS.md`: iedere functionele wijziging vereist voortaan een versiebump, release notes en changelog-update.",
            "Universele zoekfunctie uit 3.10.1 meegenomen in de release notes: zoeken op sport, team, competitie, evenementtitel en zender, inclusief suggesties."
        ]
    },
    {
        "version": "3.10.1",
        "date": "2026-08-31",
        "title": "Verbeteringen en herstel",
        "notes": [
            "Zoekveld verbreed van alleen voetbalteams naar alle sporten.",
            "Zoeken werkt nu op sport, team, competitie, evenementtitel en zender.",
            "Voorbeelden: Ajax, Ziggo, Darts, MotoGP, Champions League.",
            "Suggesties toegevoegd tijdens het typen.",
            "Zoeklogica ondergebracht in `search-enhancements.js` en geladen via `football-policy.js`."
        ]
    }
];
    const RELEASE = Object.freeze(RELEASES[0]);

    const STORAGE_KEY = 'sportOpTvSeenRelease';

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\"/g, '&quot;');
    }

    function installStyles() {
        if (document.getElementById('release-notes-styles')) return;
        const style = document.createElement('style');
        style.id = 'release-notes-styles';
        style.textContent = `
            .release-notes-backdrop { --release-latest-bg:#eef7f0; position:fixed; inset:0; z-index:2000; display:flex; align-items:center; justify-content:center; padding:16px; background:rgba(0,0,0,.5); backdrop-filter:blur(4px); }
            .release-notes-dialog { width:min(560px,100%); max-height:calc(100vh - 32px); max-height:calc(100dvh - 32px); display:flex; flex-direction:column; overflow:hidden; background:var(--card-bg,#fff); color:var(--text,#111); border:1px solid var(--border,#ddd); border-radius:16px; box-shadow:0 24px 60px rgba(0,0,0,.35); }
            .release-notes-header { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 16px; border-bottom:1px solid var(--border,#ddd); flex-shrink:0; }
            .release-notes-header h2 { display:flex; align-items:center; gap:8px; margin:0; font-size:1.1rem; }
            .release-notes-dismiss { display:grid; place-items:center; width:44px; height:44px; flex-shrink:0; border:0; border-radius:8px; background:transparent; color:inherit; font:inherit; cursor:pointer; }
            .release-notes-body { min-height:0; overflow:auto; overscroll-behavior:contain; padding:16px; }
            .release-notes-intro { margin:0 0 16px; color:var(--text-secondary,#666); line-height:1.5; }
            .release-notes-entry { background:var(--bg,#f5f5f5); border:1px solid var(--border,#ddd); border-radius:12px; padding:14px; margin-bottom:16px; }
            .release-notes-entry:last-child { margin-bottom:0; }
            .release-notes-entry.is-latest { border-color:var(--guide-accent,#166534); background:var(--release-latest-bg); }
            .release-notes-version { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
            .release-notes-version h3 { margin:0; font-size:1rem; }
            .release-notes-badge { border-radius:999px; padding:2px 7px; background:#166534; color:#fff; font-size:.72rem; font-weight:700; }
            .release-notes-date { margin:5px 0 12px; color:var(--text-secondary,#666); font-size:.8rem; }
            .release-notes-entry h4 { margin:0 0 12px; font-size:1rem; line-height:1.4; }
            .release-notes-entry ul { margin:0; padding:0; list-style:none; }
            .release-notes-entry li { display:flex; align-items:flex-start; gap:8px; margin:0 0 10px; line-height:1.5; }
            .release-notes-entry li:last-child { margin-bottom:0; }
            .release-notes-check { flex-shrink:0; width:16px; height:16px; margin-top:4px; color:var(--guide-accent,#166534); }
            .release-notes-footer { flex-shrink:0; padding:12px 16px; border-top:1px solid var(--border,#ddd); }
            .release-notes-close { width:100%; min-height:44px; padding:10px 14px; border:0; border-radius:9px; background:#166534; color:#fff; font:inherit; font-weight:700; cursor:pointer; }
            [data-theme="dark"] .release-notes-backdrop { --release-latest-bg:#17352b; }
            .release-notes-dialog :focus-visible { outline:3px solid var(--guide-accent,#166534); outline-offset:2px; }
            .version-footer.release-notes-link { cursor:pointer; text-decoration:underline; text-underline-offset:3px; }
            @media(max-width:480px) { .release-notes-backdrop { padding:12px; } .release-notes-dialog { max-height:calc(100vh - 24px); max-height:calc(100dvh - 24px); } }
        `;
        document.head.appendChild(style);
    }

    function closeReleaseNotes(backdrop, markSeen) {
        if (markSeen) { try { localStorage.setItem(STORAGE_KEY, RELEASE.version); } catch (_) {} }
        backdrop.releaseBackground?.forEach(([node, inert]) => { node.inert = inert; });
        document.body.style.overflow = backdrop.previousOverflow || '';
        backdrop.remove();
        backdrop.returnFocus?.focus();
    }

    function showReleaseNotes(markSeenOnClose = true) {
        const existing = document.querySelector('.release-notes-backdrop');
        if (existing) closeReleaseNotes(existing, false);

        const backdrop = document.createElement('div');
        backdrop.className = 'release-notes-backdrop';
        backdrop.setAttribute('role', 'presentation');
        const check = '<svg class="release-notes-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 12 4 4 10-10"/></svg>';
        backdrop.innerHTML = `
            <section class="release-notes-dialog" role="dialog" aria-modal="true" aria-labelledby="release-notes-title">
                <header class="release-notes-header">
                    <h2 id="release-notes-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 11a9 9 0 1 1 2 7M3 4v7h7M12 7v5l3 2"/></svg>Wijzigingen</h2>
                    <button type="button" class="release-notes-dismiss" aria-label="Wijzigingen sluiten"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg></button>
                </header>
                <div class="release-notes-body" role="region" aria-label="Wijzigingen inhoud" tabindex="0">
                    <p class="release-notes-intro">Dit is er aangepast. De nieuwste versie staat bovenaan; eerdere updates blijven hieronder terug te lezen.</p>
                    ${RELEASES.map((entry,index) => `<article class="release-notes-entry ${index === 0 ? 'is-latest' : ''}">
                        <div class="release-notes-version"><h3>Versie ${escapeHtml(entry.version)}</h3>${index === 0 ? '<span class="release-notes-badge">Nieuw</span>' : ''}</div>
                        <p class="release-notes-date">${escapeHtml(entry.date)}</p>
                        <h4>${escapeHtml(entry.title)}</h4>
                        <ul>${entry.notes.map(note => `<li>${check}<span>${escapeHtml(note)}</span></li>`).join('')}</ul>
                    </article>`).join('')}
                </div>
                <footer class="release-notes-footer"><button type="button" class="release-notes-close">Gezien</button></footer>
            </section>`;

        backdrop.returnFocus = document.activeElement;
        backdrop.previousOverflow = document.body.style.overflow;
        backdrop.releaseBackground = [...document.body.children].filter(node => !['SCRIPT', 'STYLE', 'LINK'].includes(node.tagName)).map(node => [node, node.inert]);
        backdrop.releaseBackground.forEach(([node]) => { node.inert = true; });
        document.body.style.overflow = 'hidden';
        document.body.appendChild(backdrop);
        const closeButton = backdrop.querySelector('.release-notes-close');
        closeButton.focus();
        const dismissButton = backdrop.querySelector('.release-notes-dismiss');
        dismissButton.addEventListener('click', () => closeReleaseNotes(backdrop, markSeenOnClose));
        backdrop.addEventListener('keydown', event => {
            if (event.key !== 'Tab') return;
            if (!event.shiftKey && document.activeElement === closeButton) { event.preventDefault(); dismissButton.focus(); }
            else if (event.shiftKey && document.activeElement === dismissButton) { event.preventDefault(); closeButton.focus(); }
        });
        closeButton.addEventListener('click', () => closeReleaseNotes(backdrop, markSeenOnClose));
        backdrop.addEventListener('click', event => {
            if (event.target === backdrop) closeReleaseNotes(backdrop, markSeenOnClose);
        });
        backdrop.addEventListener('keydown', function onKeydown(event) {
            if (event.key !== 'Escape' || !document.body.contains(backdrop)) return;
            backdrop.removeEventListener('keydown', onKeydown);
            closeReleaseNotes(backdrop, markSeenOnClose);
        });
    }

    function installVersionLink() {
        const version = document.querySelector('.version-footer');
        if (!version) return;
        version.textContent = `v${RELEASE.version}`;
        version.classList.add('release-notes-link');
        version.setAttribute('role', 'button');
        version.setAttribute('tabindex', '0');
        version.setAttribute('title', 'Bekijk release notes');
        version.addEventListener('click', () => showReleaseNotes(false));
        version.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                showReleaseNotes(false);
            }
        });
    }

    let initialized = false;

    function init() {
        if (initialized) return;
        initialized = true;
        installStyles();
        installVersionLink();
        let seen;
        try { seen = localStorage.getItem(STORAGE_KEY); } catch (_) {}
        if (seen !== RELEASE.version) {
            setTimeout(() => showReleaseNotes(true), 250);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }

    window.SPORT_OP_TV_RELEASE = RELEASE;
})();

