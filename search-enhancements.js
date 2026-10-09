(function (root, factory) {
    'use strict';

    const core = factory();
    if (typeof module === 'object' && module.exports) module.exports = core;
    if (root) root.SPORT_OP_TV_SEARCH_CORE = core;
})(typeof window !== 'undefined' ? window : null, function () {
    'use strict';

    const SPORTS = Object.freeze({
        voetbal: { label: 'Voetbal', aliases: 'football soccer' },
        darts: { label: 'Darts', aliases: 'dart' },
        f1: { label: 'F1', aliases: 'formule 1 formula 1 autosport' },
        motogp: { label: 'MotoGP', aliases: 'motor motorsport' },
        handbal: { label: 'Handbal', aliases: 'handball' }
    });

    const COUNTRY_RULES = Object.freeze([
        {
            country: 'Nederland',
            aliases: 'nl holland nederlands dutch',
            group: 'Nederland',
            competitions: ['Eredivisie', 'Keuken Kampioen Divisie', 'KNVB Beker', 'Johan Cruijff Schaal']
        },
        {
            country: 'Engeland',
            aliases: 'england engels uk groot-brittannie',
            group: 'Buitenland',
            competitions: ['Premier League', 'FA Cup', 'EFL Cup (Carabao Cup)', 'Community Shield']
        },
        {
            country: 'Duitsland',
            aliases: 'germany duits de bundesliga',
            group: 'Buitenland',
            competitions: ['Bundesliga', 'DFB Pokal', 'DFL Supercup']
        },
        {
            country: 'Spanje',
            aliases: 'spain spaans es',
            group: 'Buitenland',
            competitions: ['La Liga', 'Copa del Rey', 'Supercopa de Espana']
        },
        {
            country: 'Italië',
            aliases: 'italie italy italia it',
            group: 'Buitenland',
            competitions: ['Serie A', 'Coppa Italia', 'Supercoppa Italiana']
        },
        {
            country: 'Frankrijk',
            aliases: 'france frans fr',
            group: 'Buitenland',
            competitions: ['Ligue 1', 'Coupe de France', 'Trophee des Champions']
        },
        {
            country: 'Europa',
            aliases: 'europees uefa eu',
            group: 'Europa',
            competitions: [
                'Champions League',
                "Women's Champions League",
                'Champions League Kwalificatie',
                'Europa League',
                'Europa League Kwalificatie',
                'Conference League',
                'Conference League Kwalificatie',
                'UEFA Super Cup'
            ]
        },
        {
            country: 'Internationaal',
            aliases: 'wereld landen landenteams fifa uefa',
            group: 'Internationaal',
            competitions: [
                'WK',
                'EK',
                'Nations League',
                'WK Kwalificatie',
                'EK Kwalificatie',
                'Vriendschappelijk Internationaal',
                'Oefenwedstrijd',
                'WK Vrouwen',
                'EK Vrouwen',
                'WK Kwalificatie Vrouwen',
                'EK Kwalificatie Vrouwen',
                'Nations League Vrouwen',
                'Vriendschappelijk Internationaal Vrouwen'
            ]
        }
    ]);

    const normalize = (value = '') => String(value)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const termsFor = value => normalize(value).split(' ').filter(Boolean);

    function matchesText(text, query) {
        const haystack = normalize(text);
        const terms = termsFor(query);
        return terms.length === 0 || terms.every(term => haystack.includes(term));
    }

    function getSportInfo(sportType = '') {
        const key = normalize(sportType).replace(/\s/g, '');
        if (key === 'formule1' || key === 'formula1') return SPORTS.f1;
        return SPORTS[key] || { label: String(sportType || 'Sport'), aliases: '' };
    }

    function getCountryInfo(competition = '') {
        const key = normalize(competition);
        return COUNTRY_RULES.find(rule =>
            rule.competitions.some(value => normalize(value) === key)
        ) || null;
    }

    function competitionGroup(competition = '') {
        return getCountryInfo(competition)?.group || 'Overig';
    }

    const TEAM_ALIASES = Object.freeze({
        nederland: 'netherlands holland nl oranje', engeland: 'england',
        duitsland: 'germany deutschland', spanje: 'spain espana',
        italie: 'italy italia', frankrijk: 'france', belgie: 'belgium',
        hongarije: 'hungary', ierland: 'ireland', polen: 'poland',
        portugal: 'portugal', ajax: 'ajax amsterdam', psv: 'psv eindhoven',
        az: 'az alkmaar', nec: 'nec nijmegen n e c'
    });

    // Exact source aliases only: never merge similarly named clubs by fuzzy matching.
    const CLUB_IDENTITIES = [
        ['Feyenoord', ['feyenoord rotterdam']], ['FC Twente', ['fc twente 65']],
        ['Heracles Almelo', ['heracles']], ['Helmond Sport', ['helmond spor']],
        ['Jong FC Utrecht', ['jong utrecht']], ['MVV Maastricht', ['maastricht', 'mvv']],
        ['Roda JC Kerkrade', ['roda jc']], ['SC Cambuur', ['sc cambuur leeuwarden', 'cambuur leeuwarden', 'cambuur']],
        ['Telstar', ['telstar 1963']], ['Willem II', ['willem ii tilburg']],
        ['Sparta Rotterdam', ['sparta']], ['Fortuna Sittard', ['fortuna']],
        ['VVV-Venlo', ['vvv venlo']], ['FC Den Bosch', ['den bosch']],
        ['Excelsior', ['sbv excelsior']],
        ['Manchester United', ['man united']], ['Manchester City', ['man city']],
        ['Tottenham Hotspur', ['spurs', 'tottenham']], ['Paris Saint-Germain', ['psg']],
        ['AS Roma', ['roma']], ['Inter Milan', ['fc internazionale milano inter']],
        ['FC Barcelona', ['barcelona']], ['Real Madrid', ['real madrid cf']],
        ['Club Atlético de Madrid', ['atletico', 'atletico madrid']],
        ['Borussia Dortmund', ['dortmund']], ['FC Bayern München', ['bayern', 'bayern munchen']]
    ];
    const NATIONAL_IDENTITIES = [
        ['Albanië', ['albania']], ['Armenië', ['armenia']], ['Azerbeidzjan', ['azerbaijan']],
        ['Bosnië-Herzegovina', ['bosnia and herzegovina']], ['Bulgarije', ['bulgaria']],
        ['Denemarken', ['denmark']], ['Estland', ['estonia']], ['Faeröer', ['faroe islands']],
        ['Georgië', ['georgia']], ['Griekenland', ['greece']], ['IJsland', ['iceland']],
        ['Israël', ['israel']], ['Kazachstan', ['kazakhstan']], ['Kroatië', ['croatia']],
        ['Letland', ['latvia']], ['Litouwen', ['lithuania']], ['Luxemburg', ['luxembourg']],
        ['Moldavië', ['moldova']], ['Noord-Ierland', ['northern ireland']],
        ['Noord-Macedonië', ['north macedonia']], ['Noorwegen', ['norway']],
        ['Oekraïne', ['ukraine']], ['Oostenrijk', ['austria']], ['Roemenië', ['romania']],
        ['Schotland', ['scotland']], ['Servië', ['serbia']], ['Slovenië', ['slovenia']],
        ['Slowakije', ['slovakia']], ['Tsjechië', ['czechia', 'czech republic']],
        ['Turkije', ['turkey', 'turkiye']], ['Wit-Rusland', ['belarus']],
        ['Zweden', ['sweden']], ['Zwitserland', ['switzerland']]
    ];
    function identityFor(name, identities) {
        const key = normalize(name);
        return identities.find(([label, aliases]) => normalize(label) === key || aliases.includes(key));
    }

    function teamInfo(name, competition = '') {
        const international = competitionGroup(competition) === 'Internationaal' && normalize(competition) !== 'oefenwedstrijd';
        const women = /vrouwen|women|\(w\)|wnt/i.test(`${competition} ${name}`);
        const raw = String(name || '').replace(/\s*(?:\(w\)|women(?:'s national team)?|vrouwen|mannen|wnt|national team)$/i, '').trim();
        const identity = identityFor(raw, international ? NATIONAL_IDENTITIES : CLUB_IDENTITIES);
        const resolved = identity?.[0] || raw;
        const key = normalize(resolved);
        const clubKey = key.replace(/^(afc|fc|sc)\s+/, '').replace(/\s+(afc|fc|sc)$/, '').replace(/^n e c(?: nijmegen)?$/, 'nec').replace(/^nec nijmegen$/, 'nec').replace(/^ado den haag$/, 'ado');
        const canonical = Object.entries(TEAM_ALIASES).find(([value, aliases]) =>
            value === key || aliases === key ||
            (international && aliases.split(' ').includes(key)) ||
            (!international && aliases === key)
        )?.[0] || (international ? key : clubKey);
        const labelNames = { nederland: 'Nederland', engeland: 'Engeland', duitsland: 'Duitsland', spanje: 'Spanje', italie: 'Italië', frankrijk: 'Frankrijk', belgie: 'België', hongarije: 'Hongarije', ierland: 'Ierland', polen: 'Polen', ajax: 'Ajax', psv: 'PSV', az: 'AZ', nec: 'NEC' };
        const label = labelNames[canonical] || resolved;
        const gender = women ? 'vrouwen' : 'mannen';
        return {
            value: `${international ? 'land' : 'club'}:${canonical}:${gender}`,
            label: international || women ? `${label} — ${gender}` : label,
            group: international ? 'Landenteams' : 'Clubs',
            aliases: `${raw} ${identity?.[1].join(' ') || ''} ${TEAM_ALIASES[canonical] || ''} ${international ? gender : ''}`
        };
    }

    function buildTeams(events = [], selected = [], seeds = []) {
        const teams = new Map();
        const add = info => { if (info.value.split(':')[1]) teams.set(info.value, { ...info, count: teams.get(info.value)?.count || 0 }); };
        seeds.forEach(name => add(teamInfo(name, 'Eredivisie')));
        ['Nations League', 'Nations League Vrouwen'].forEach(competition => add(teamInfo('Nederland', competition)));
        events.filter(event => !event.sportType || event.sportType === 'voetbal').forEach(event => {
            [event.home, event.away].filter(Boolean).forEach(name => {
                const info = teamInfo(name, event.competition);
                if (!teams.has(info.value)) add(info);
                teams.get(info.value).count += 1;
            });
        });
        selected.forEach(value => {
            if (!teams.has(value)) {
                const [type, name, gender] = value.split(':');
                if (name) add({ value, label: `${name} — ${gender}`, group: type === 'land' ? 'Landenteams' : 'Clubs', aliases: name });
            }
        });
        return Array.from(teams.values()).sort((a, b) => a.label.localeCompare(b.label, 'nl'));
    }

    function matchesFootballFilters(event, filters = {}) {
        const competitions = filters.competitions || [];
        const teams = filters.teams || [];
        return (!competitions.length || competitions.includes(event.competition)) &&
            (!teams.length || [event.home, event.away].filter(Boolean).some(name => teams.includes(teamInfo(name, event.competition).value)));
    }

    function eventSearchText(event = {}) {
        const sport = getSportInfo(event.sportType);
        const competition = String(event.competition || '').trim();
        const country = getCountryInfo(competition);
        const values = [
            sport.label,
            sport.aliases,
            event.home,
            event.away,
            event.title,
            event.event,
            event.stage,
            competition,
            event.channel,
            event.location,
            event.sportType === 'voetbal' && event.home ? teamInfo(event.home, competition).label : '',
            event.sportType === 'voetbal' && event.away ? teamInfo(event.away, competition).label : '',
            event.sportType === 'voetbal' && event.home ? teamInfo(event.home, competition).aliases : '',
            event.sportType === 'voetbal' && event.away ? teamInfo(event.away, competition).aliases : ''
        ];

        (event.matches || []).forEach(match => {
            if (typeof match === 'string') {
                values.push(match);
                return;
            }
            values.push(match?.label, match?.home, match?.away);
            if (Array.isArray(match?.items)) values.push(...match.items);
        });

        return values.filter(Boolean).join(' ');
    }

    function matchesEvent(event, query) {
        return matchesText(eventSearchText(event), query);
    }

    function splitChannels(value = '') {
        const channel = String(value).trim();
        if (!channel) return [];
        const parts = channel.split(/\s*(?:\/|\||,|;|\+)\s*/).filter(Boolean);
        return [...new Set([channel, ...parts])];
    }

    function buildSuggestions(events = []) {
        const items = new Map();
        const add = (value, type, aliases = '') => {
            const label = String(value || '').trim();
            const key = normalize(label);
            if (!key) return;
            if (items.has(key)) {
                const existing = items.get(key);
                existing.aliases = `${existing.aliases || ''} ${aliases || ''}`.trim();
                return;
            }
            items.set(key, { value: label, type, aliases: String(aliases || '').trim() });
        };

        events.forEach(event => {
            if (event.sportType === 'voetbal') {
                [event.home, event.away].filter(Boolean).forEach(name => {
                    const info = teamInfo(name, event.competition);
                    add(info.label, info.group === 'Landenteams' ? 'Landenteam' : 'Club', info.aliases);
                });
            } else {
                add(event.home, 'Speler');
                add(event.away, 'Speler');
            }

            const competition = String(event.competition || '').trim();
            add(competition, 'Competitie');
            const country = getCountryInfo(competition);

            const title = event.title || event.event || event.stage;
            if (normalize(title) !== normalize(competition)) add(title, 'Evenement');

            (event.matches || []).forEach(match => {
                if (typeof match !== 'object' || !match) return;
                add(match.home, 'Speler');
                add(match.away, 'Speler');
            });

            splitChannels(event.channel).forEach(channel => add(channel, 'Zender'));
        });

        return Array.from(items.values());
    }

    function filterSuggestions(items = [], query = '', limit = 7) {
        const needle = normalize(query);
        if (!needle) return [];
        const typeOrder = { Club: 0, Landenteam: 1, Speler: 2, Competitie: 3, Zender: 4, Evenement: 5 };

        return items
            .filter(item => matchesText(`${item.value} ${item.aliases || ''}`, query))
            .sort((a, b) => {
                const aValue = normalize(a.value);
                const bValue = normalize(b.value);
                const aRank = aValue === needle ? 0 : (aValue.startsWith(needle) ? 1 : (aValue.split(' ').some(word => word.startsWith(needle)) ? 2 : 3));
                const bRank = bValue === needle ? 0 : (bValue.startsWith(needle) ? 1 : (bValue.split(' ').some(word => word.startsWith(needle)) ? 2 : 3));
                return aRank - bRank
                    || (typeOrder[a.type] ?? 9) - (typeOrder[b.type] ?? 9)
                    || a.value.localeCompare(b.value, 'nl');
            })
            .slice(0, limit);
    }

    function countCompetitions(events = []) {
        const counts = new Map();
        events.forEach(event => {
            const competition = String(event.competition || '').trim();
            if (competition) counts.set(competition, (counts.get(competition) || 0) + 1);
        });
        return Array.from(counts, ([value, count]) => ({
            value,
            count,
            group: competitionGroup(value)
        }));
    }

    return Object.freeze({
        SPORTS,
        teamInfo,
        buildTeams,
        matchesFootballFilters,
        buildSuggestions,
        competitionGroup,
        countCompetitions,
        eventSearchText,
        filterSuggestions,
        getCountryInfo,
        getSportInfo,
        matchesEvent,
        matchesText,
        normalize,
        termsFor
    });
});

(function () {
    'use strict';
    if (typeof document === 'undefined') return;
    const core = window.SPORT_OP_TV_SEARCH_CORE;
    const app = () => window.SPORT_OP_TV_APP;
    let input, suggestions, filterButton, backdrop, options, filterSearch, chips, summary;
    let query = '', choices = [], active = -1, scheduled = false;
    let draft = { teams: [], competitions: [] }, tab = 'teams', previousOverflow = '';
    let returnFocus = null;
    let modalBackground = [];

    const el = (tag, className, text) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    };
    const button = (text, className, handler) => {
        const node = el('button', className, text);
        node.type = 'button';
        if (handler) node.addEventListener('click', handler);
        return node;
    };
    function hideSuggestions() {
        suggestions.hidden = true;
        input.setAttribute('aria-expanded', 'false');
        input.removeAttribute('aria-activedescendant');
        active = -1;
    }
    function updateActive() {
        Array.from(suggestions.children).forEach((node, i) => {
            node.classList.toggle('is-active', i === active);
            node.setAttribute('aria-selected', String(i === active));
        });
        if (active >= 0) input.setAttribute('aria-activedescendant', `search-choice-${active}`);
        else input.removeAttribute('aria-activedescendant');
    }
    function choose(index) {
        if (!choices[index]) return;
        input.value = query = choices[index].value;
        hideSuggestions();
        applySearch();
        input.blur();
    }
    function renderSuggestions() {
        choices = core.filterSuggestions(core.buildSuggestions(app()?.getSearchEvents() || []), query, 5);
        suggestions.replaceChildren();
        if (!query || !choices.length) return hideSuggestions();
        choices.forEach((item, index) => {
            const node = button('', 'search-suggestion', () => choose(index));
            node.id = `search-choice-${index}`;
            node.setAttribute('role', 'option');
            node.setAttribute('aria-selected', 'false');
            node.append(el('span', '', item.value), el('small', '', item.type));
            suggestions.append(node);
        });
        suggestions.hidden = false;
        input.setAttribute('aria-expanded', 'true');
        active = -1;
    }
    function applySearch() {
        document.body.dataset.guideSearch = String(!!query);
        const rows = Array.from(document.querySelectorAll('.football-slot-match, .match-row.darts-row, .match-row.f1-row, .match-row.motogp-row, .match-row.handbal-row, .results-row'));
        let count = 0;
        rows.forEach(row => {
            const sport = row.classList.contains('football-slot-match') ? 'voetbal' :
                ['darts', 'f1', 'motogp', 'handbal'].find(sport => row.classList.contains(`${sport}-row`)) || '';
            const text = row.dataset.searchText || `${sport} ${row.textContent}`;
            const visible = !query || core.matchesText(text, query);
            row.hidden = !visible;
            row.dataset.searchHidden = String(!visible);
            if (visible) count++;
        });
        document.querySelectorAll('.football-slot, .competition-group, .day-section').forEach(group => {
            const rows = Array.from(group.querySelectorAll('.football-slot-match, .match-row, .results-row'));
            group.hidden = !!query && !rows.some(row => !row.hidden);
            group.dataset.searchHidden = String(group.hidden);
        });
        document.querySelectorAll('.darts-matches-list').forEach(details => {
            details.hidden = !!query && !!details.previousElementSibling?.hidden;
            details.dataset.searchHidden = String(details.hidden);
        });
        const resultSummary = document.querySelector('.results-summary');
        if (resultSummary) resultSummary.hidden = !!query;
        if (!query || count || document.getElementById('events-container')?.querySelector('.loading, .error-message')) document.getElementById('search-empty-state')?.remove();
        document.getElementById('search-clear').hidden = !query;
        summary.hidden = !query;
        const container = document.getElementById('events-container');
        const loading = !!container?.querySelector('.loading, .error-message');
        summary.textContent = loading ? 'Wedstrijden laden…' : `${count} ${count === 1 ? 'resultaat' : 'resultaten'} · alle dagen`;
        if (query && !count && !loading && container) {
            if (document.getElementById('search-empty-state')?.dataset.query === query) return;
            document.getElementById('search-empty-state')?.remove();
            const empty = el('div', 'no-events search-empty-state');
            empty.dataset.query = query;
            empty.id = 'search-empty-state';
            empty.append(el('h3', '', `Geen resultaten voor “${query}”`),
                el('p', '', 'Zoeken gebruikt je gekozen sport en filters.'),
                button('Wis zoeken', 'filter-secondary', () => clearSearch()));
            if ((app()?.getFootballFilters().teams.length || app()?.getFootballFilters().competitions.length) && ['voetbal', null].includes(app()?.getSportFilter())) {
                empty.append(button('Pas filters aan', 'filter-secondary', openDialog));
            }
            container.append(empty);
        }
    }
    function clearSearch() {
        query = input.value = '';
        hideSuggestions();
        applySearch();
        return Promise.resolve();
    }
    const preferenceKey = 'sportOpTvFootballPreferences';
    function getPreferences() {
        try {
            const saved = JSON.parse(localStorage.getItem(preferenceKey));
            if (saved && Array.isArray(saved.teams) && Array.isArray(saved.competitions)) return saved;
        } catch (_) { /* Storage is optional. */ }
        const initial = app()?.getFootballFilters() || { teams: [], competitions: [] };
        savePreferences(initial);
        return initial;
    }
    function savePreferences(value) {
        try { localStorage.setItem(preferenceKey, JSON.stringify(value)); } catch (_) { /* Keep usable without storage. */ }
    }
    function sameFilters(a, b) {
        return ['teams', 'competitions'].every(key => [...a[key]].sort().join('\n') === [...b[key]].sort().join('\n'));
    }
    function updateToolbar() {
        const sport = app()?.getSportFilter();
        document.querySelectorAll('.sport-filter-btn').forEach(node => node.setAttribute('aria-pressed', String(node.dataset.sport === sport)));
        input.placeholder = `Zoek in ${core.getSportInfo(sport)?.label || 'sport'}…`;
        const visible = ['voetbal', null].includes(sport);
        filterButton.hidden = !visible;
        const current = app()?.getFootballFilters() || { teams: [], competitions: [] };
        const count = current.teams.length + current.competitions.length;
        const preferences = getPreferences();
        filterButton.querySelector('span').textContent = 'Filters';
        filterButton.classList.toggle('active', count > 0);
        chips.replaceChildren();
        if (visible && count) {
            const label = sameFilters(current, preferences) ? 'Mijn voorkeuren' : 'Tijdelijk gefilterd';
            chips.append(el('span', 'filter-context', `${label} · ${current.teams.length} teams · ${current.competitions.length} competities`));
            chips.append(button('Wijzig', 'filter-chip', openDialog));
            chips.append(button('Alles', 'filter-show-all', () => { app().setFootballFilters({ teams: [], competitions: [] }); afterRender(); }));
        } else if (visible && preferences.teams.length + preferences.competitions.length) {
            chips.append(el('span', 'filter-context', 'Alle wedstrijden'));
            chips.append(button('Mijn voorkeuren', 'filter-chip', () => { app().setFootballFilters(getPreferences()); afterRender(); }));
        }
        chips.hidden = !visible || !chips.childNodes.length;
        if (!visible && !backdrop.hidden) closeDialog();
    }
    function afterRender() {
        updateToolbar();
        applySearch();
        if (!backdrop.hidden) renderOptions();
        if (document.activeElement === input) renderSuggestions();
    }
    function scheduleAfterRender() {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => { scheduled = false; afterRender(); });
    }
    function entries() {
        if (tab === 'teams') return app()?.getFootballTeams(draft.teams) || [];
        const counts = new Map((app()?.getFootballCompetitionCounts() || []).map(item => [item.value, item.count]));
        return [...new Set([...(app()?.getFootballCompetitions() || []), ...counts.keys(), ...draft.competitions])].map(value => ({
            value, label: value, group: core.competitionGroup(value), count: counts.get(value) || 0, aliases: ''
        }));
    }
    function updateDraftLabel() {
        const count = draft.teams.length + draft.competitions.length;
        backdrop.querySelector('.filter-selection-count').textContent = count ? `${draft.teams.length} teams · ${draft.competitions.length} competities` : 'Alles zichtbaar';
        backdrop.querySelector('.filter-help').textContent = tab === 'teams' ?
            'Kies clubs of landenteams. Meerdere teams tonen hun wedstrijden. Geen keuze toont alle teams.' :
            'Kies competities. Met een teamkeuze zie je alleen wedstrijden die aan beide filters voldoen.';
    }
    function renderOptions() {
        const selection = new Set(draft[tab]);
        let items = entries().filter(item => core.matchesText(`${item.label} ${item.group} ${item.aliases || ''}`, filterSearch.value));
        const groups = new Map();
        items.sort((a, b) => Number(selection.has(b.value)) - Number(selection.has(a.value)) || a.label.localeCompare(b.label, 'nl')).forEach(item => {
            const name = selection.has(item.value) ? 'Geselecteerd' : item.group;
            if (!groups.has(name)) groups.set(name, []);
            groups.get(name).push(item);
        });
        options.replaceChildren();
        const order = ['Geselecteerd', 'Landenteams', 'Clubs', 'Nederland', 'Europa', 'Internationaal', 'Buitenland', 'Overig'];
        Array.from(groups).sort((a,b) => order.indexOf(a[0]) - order.indexOf(b[0])).forEach(([group, items]) => {
            const section = el('section', 'filter-group');
            section.append(el('h3', '', group));
            items.forEach(item => {
                const label = el('label', 'filter-option');
                const checkbox = el('input');
                checkbox.type = 'checkbox'; checkbox.value = item.value; checkbox.checked = selection.has(item.value);
                checkbox.addEventListener('change', () => {
                    const chosen = new Set(draft[tab]);
                    if (checkbox.checked) chosen.add(item.value); else chosen.delete(item.value);
                    draft[tab] = [...chosen];
                    updateDraftLabel(); // Keep the list still while selecting.
                });
                const name = el('span', '', item.label);
                const count = el('small', '', String(item.count));
                count.title = `${item.count} wedstrijden in de geladen agenda`;
                label.append(checkbox, name, count);
                section.append(label);
            });
            options.append(section);
        });
        if (!items.length) options.append(el('p', 'filter-no-matches', 'Geen matches. Probeer een andere naam.'));
        updateDraftLabel();
    }
    function closeDialog() {
        if (backdrop.hidden) return;
        backdrop.hidden = true;
        modalBackground.forEach(([node, inert]) => { node.inert = inert; });
        modalBackground = [];
        document.body.style.overflow = previousOverflow;
        filterButton.setAttribute('aria-expanded', 'false');
        returnFocus?.focus();
    }
    function openDialog() {
        if (!backdrop.hidden) return;
        const current = app()?.getFootballFilters();
        if (!current) return;
        draft = { teams: [...current.teams], competitions: [...current.competitions] };
        tab = 'teams';
        filterSearch.value = '';
        returnFocus = filterButton;
        backdrop.querySelectorAll('[data-filter-tab]').forEach(node => node.setAttribute('aria-selected', String(node.dataset.filterTab === tab)));
        filterSearch.placeholder = 'Zoek team…';
        filterSearch.setAttribute('aria-label', 'Zoek team');
        renderOptions();
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        modalBackground = [...document.body.children].filter(node => node !== backdrop && !['SCRIPT', 'STYLE', 'LINK'].includes(node.tagName)).map(node => [node, node.inert]);
        modalBackground.forEach(([node]) => { node.inert = true; });
        backdrop.hidden = false;
        filterButton.setAttribute('aria-expanded', 'true');
        backdrop.querySelector('.filter-close').focus(); // Avoid opening the iPhone keyboard before it is needed.
    }
    function installDialog() {
        backdrop = el('div', 'filter-backdrop');
        backdrop.hidden = true;
        backdrop.innerHTML = `
            <section class="filter-dialog" role="dialog" aria-modal="true" aria-labelledby="filter-title">
                <div class="filter-heading"><h2 id="filter-title">Teams en competities</h2><button type="button" class="filter-close" aria-label="Sluiten zonder toepassen">×</button></div>
                <div class="filter-tabs" role="tablist" aria-label="Soort filter">
                    <button type="button" role="tab" id="filter-tab-teams" data-filter-tab="teams" aria-controls="filter-options" aria-selected="true">Teams</button>
                    <button type="button" role="tab" id="filter-tab-competitions" data-filter-tab="competitions" aria-controls="filter-options" aria-selected="false">Competities</button>
                </div>
                <p class="filter-help"></p>
                <input type="search" class="filter-search" autocomplete="off" placeholder="Zoek team…" aria-label="Zoek team">
                <div class="filter-options" id="filter-options" role="tabpanel" aria-labelledby="filter-tab-teams"></div>
                <div class="filter-preferences"><button type="button" class="filter-load-preferences">Gebruik mijn voorkeuren</button><button type="button" class="filter-save-preferences">Bewaar als voorkeur</button></div>
                <div class="filter-footer"><p class="filter-selection-count" aria-live="polite"></p><div><button type="button" class="filter-secondary filter-reset">Wis filters</button><button type="button" class="filter-apply">Toon wedstrijden</button></div></div>
            </section>`;
        document.body.append(backdrop);
        options = backdrop.querySelector('.filter-options');
        filterSearch = backdrop.querySelector('.filter-search');
        filterSearch.addEventListener('input', renderOptions);
        filterSearch.addEventListener('keydown', event => { if (event.key === 'Enter') filterSearch.blur(); });
        backdrop.querySelector('.filter-close').addEventListener('click', closeDialog);
        backdrop.addEventListener('click', event => { if (event.target === backdrop) closeDialog(); });
        backdrop.querySelectorAll('[data-filter-tab]').forEach(node => node.addEventListener('click', () => {
            tab = node.dataset.filterTab;
            filterSearch.value = '';
            filterSearch.placeholder = tab === 'teams' ? 'Zoek team…' : 'Zoek competitie…';
            filterSearch.setAttribute('aria-label', tab === 'teams' ? 'Zoek team' : 'Zoek competitie');
            options.setAttribute('aria-labelledby', node.id);
            backdrop.querySelectorAll('[data-filter-tab]').forEach(other => other.setAttribute('aria-selected', String(other === node)));
            renderOptions();
        }));
        backdrop.querySelector('.filter-load-preferences').addEventListener('click', () => { const saved = getPreferences(); draft = { teams: [...saved.teams], competitions: [...saved.competitions] }; renderOptions(); });
        backdrop.querySelector('.filter-save-preferences').addEventListener('click', () => { savePreferences(draft); closeDialog(); app().setFootballFilters(draft); afterRender(); });
        backdrop.querySelector('.filter-reset').addEventListener('click', () => {
            draft = { teams: [], competitions: [] }; renderOptions();
        });
        backdrop.querySelector('.filter-apply').addEventListener('click', () => {
            closeDialog();
            app().setFootballFilters(draft);
            updateToolbar();
        });
        backdrop.addEventListener('keydown', event => {
            if (event.key === 'Escape') { event.preventDefault(); closeDialog(); }
            if (event.key === 'Tab') {
                const nodes = Array.from(backdrop.querySelectorAll('button, input'));
                const first = nodes[0], last = nodes[nodes.length - 1];
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            }
        });
    }
    function init() {
        input = document.getElementById('sport-search');
        if (!input || !core) return;
        filterButton = document.getElementById('competition-filter-btn');
        chips = document.getElementById('active-filters');
        summary = document.getElementById('search-summary');
        suggestions = el('div', 'search-suggestions');
        suggestions.id = 'search-suggestions'; suggestions.hidden = true; suggestions.setAttribute('role', 'listbox');
        input.closest('.quick-search').append(suggestions);
        input.setAttribute('role', 'combobox');
        input.setAttribute('aria-autocomplete', 'list');
        input.setAttribute('aria-controls', suggestions.id);
        input.setAttribute('aria-expanded', 'false');
        input.addEventListener('input', () => { query = input.value.trim(); applySearch(); renderSuggestions(); });
        input.addEventListener('focus', renderSuggestions);
        input.addEventListener('keydown', event => {
            if (event.key === 'ArrowDown' && choices.length) { event.preventDefault(); active = (active + 1) % choices.length; updateActive(); }
            else if (event.key === 'ArrowUp' && choices.length) { event.preventDefault(); active = (active - 1 + choices.length) % choices.length; updateActive(); }
            else if (event.key === 'Enter') { event.preventDefault(); if (active >= 0) choose(active); else { hideSuggestions(); input.blur(); } }
            else if (event.key === 'Escape') { event.preventDefault(); if (!suggestions.hidden) hideSuggestions(); else clearSearch(); }
        });
        document.getElementById('search-clear').addEventListener('click', () => { clearSearch(); input.focus(); });
        document.addEventListener('click', event => { if (!input.closest('.quick-search').contains(event.target)) hideSuggestions(); });
        installDialog();
        filterButton.addEventListener('click', openDialog);
        const observer = new MutationObserver(scheduleAfterRender);
        observer.observe(document.getElementById('events-container'), { childList: true, subtree: true });
        afterRender();
    }
    window.SPORT_OP_TV_SEARCH = Object.freeze({ apply: () => input && applySearch(), clear: () => input ? clearSearch() : Promise.resolve(), getQuery: () => query });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})();
