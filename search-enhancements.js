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
            country?.country,
            country?.aliases
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

        Object.values(SPORTS).forEach(sport => add(sport.label, 'Sport', sport.aliases));

        events.forEach(event => {
            add(event.home, 'Team');
            add(event.away, 'Team');

            const competition = String(event.competition || '').trim();
            add(competition, 'Competitie');
            const country = getCountryInfo(competition);
            if (country) add(country.country, 'Land', country.aliases);

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
        const typeOrder = { Sport: 0, Team: 1, Speler: 2, Competitie: 3, Land: 4, Zender: 5, Evenement: 6 };

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

    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    const core = window.SPORT_OP_TV_SEARCH_CORE;
    let initialized = false;
    let query = '';
    let searchInput = null;
    let suggestionsBox = null;
    let suggestionItems = [];
    let activeSuggestionIndex = -1;
    let observer = null;
    let scheduled = false;
    let searchMode = false;
    let hasRestoreSport = false;
    let restoreSport = null;
    let competitionButton = null;
    let competitionCount = null;
    let competitionBackdrop = null;
    let competitionSearch = null;
    let competitionOptions = null;
    let previousBodyOverflow = '';

    const getApp = () => window.SPORT_OP_TV_APP || null;

    function getRowSportText(row) {
        if (row.classList.contains('football-slot-match')) return 'Voetbal football soccer';
        if (row.classList.contains('darts-row')) return 'Darts';
        if (row.classList.contains('f1-row')) return 'F1 formule 1 formula 1 autosport';
        if (row.classList.contains('motogp-row')) return 'MotoGP motor motorsport';
        if (row.classList.contains('handbal-row')) return 'Handbal handball';
        return row.querySelector('.results-sport-badge')?.textContent || '';
    }

    function getRowCompetition(row) {
        return row.dataset.competition
            || row.querySelector('.football-match-competition, .event-competition, .results-competition span:last-child')?.textContent
            || row.closest('.competition-group')?.querySelector('.competition-name')?.textContent
            || '';
    }

    function getRowSearchText(row) {
        const competition = String(getRowCompetition(row)).trim();
        const country = core.getCountryInfo(competition);
        return [
            getRowSportText(row),
            competition,
            country?.country,
            country?.aliases,
            row.textContent || ''
        ].filter(Boolean).join(' ');
    }

    function getSearchRows() {
        return Array.from(document.querySelectorAll([
            '.football-slot-match',
            '.match-row.darts-row',
            '.match-row.f1-row',
            '.match-row.motogp-row',
            '.match-row.handbal-row',
            '.results-row'
        ].join(', ')));
    }

    function removeEmptyState() {
        document.getElementById('search-empty-state')?.remove();
    }

    function resetVisibility() {
        document.querySelectorAll('[data-search-hidden]').forEach(node => {
            node.hidden = false;
            delete node.dataset.searchHidden;
        });
        removeEmptyState();
    }

    function showEmptyState() {
        const container = document.getElementById('events-container');
        if (!container || container.querySelector('.loading, .error-message')) return;

        let empty = document.getElementById('search-empty-state');
        if (!empty) {
            empty = document.createElement('div');
            empty.id = 'search-empty-state';
            empty.className = 'no-events search-empty-state';
            const title = document.createElement('h3');
            const description = document.createElement('p');
            const clearButton = document.createElement('button');
            title.className = 'search-empty-title';
            description.textContent = 'Controleer de spelling of wis de zoekopdracht.';
            clearButton.type = 'button';
            clearButton.className = 'search-empty-clear';
            clearButton.textContent = 'Wis zoeken';
            clearButton.addEventListener('click', () => clearSearch());
            empty.append(title, description, clearButton);
            container.appendChild(empty);
        }
        empty.querySelector('.search-empty-title').textContent = `Geen resultaten voor “${query}”`;
    }

    function applySearch() {
        if (!query) {
            resetVisibility();
            return;
        }

        const rows = getSearchRows();
        let visibleRows = 0;
        rows.forEach(row => {
            const visible = core.matchesText(getRowSearchText(row), query);
            row.hidden = !visible;
            row.dataset.searchHidden = visible ? '0' : '1';
            if (visible) visibleRows += 1;
        });

        document.querySelectorAll('.football-slot').forEach(slot => {
            const matches = Array.from(slot.querySelectorAll('.football-slot-match'));
            const visible = matches.some(match => !match.hidden);
            slot.hidden = !visible;
            slot.dataset.searchHidden = visible ? '0' : '1';
        });

        document.querySelectorAll('.competition-group').forEach(group => {
            const matches = Array.from(group.querySelectorAll('.match-row'));
            const visible = matches.some(match => !match.hidden);
            group.hidden = !visible;
            group.dataset.searchHidden = visible ? '0' : '1';
        });

        document.querySelectorAll('.darts-matches-list').forEach(details => {
            const trigger = details.previousElementSibling;
            const visible = trigger?.classList.contains('darts-row') && !trigger.hidden;
            details.hidden = !visible;
            details.dataset.searchHidden = visible ? '0' : '1';
        });

        document.querySelectorAll('.day-section').forEach(day => {
            const matches = Array.from(day.querySelectorAll('.football-slot-match, .match-row, .results-row'));
            const visible = matches.some(match => !match.hidden);
            day.hidden = !visible;
            day.dataset.searchHidden = visible ? '0' : '1';
        });

        const resultsSummary = document.querySelector('.results-summary');
        if (resultsSummary) {
            resultsSummary.hidden = true;
            resultsSummary.dataset.searchHidden = '1';
        }

        if (visibleRows === 0) showEmptyState();
        else removeEmptyState();
    }

    function setActiveSuggestion(index) {
        activeSuggestionIndex = index;
        const buttons = Array.from(suggestionsBox?.querySelectorAll('.search-suggestion') || []);
        buttons.forEach((button, buttonIndex) => {
            const active = buttonIndex === index;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        if (searchInput) {
            const activeButton = buttons[index];
            if (activeButton) searchInput.setAttribute('aria-activedescendant', activeButton.id);
            else searchInput.removeAttribute('aria-activedescendant');
        }
    }

    function hideSuggestions() {
        if (!suggestionsBox) return;
        suggestionsBox.hidden = true;
        searchInput?.setAttribute('aria-expanded', 'false');
        setActiveSuggestion(-1);
    }

    function collectSuggestions() {
        const events = getApp()?.getSearchEvents?.() || [];
        return core.buildSuggestions(events);
    }

    function renderSuggestions() {
        if (!suggestionsBox || !searchInput || !query) {
            hideSuggestions();
            return;
        }

        suggestionItems = core.filterSuggestions(collectSuggestions(), query, 7);
        suggestionsBox.replaceChildren();
        if (!suggestionItems.length) {
            hideSuggestions();
            return;
        }

        suggestionItems.forEach((item, index) => {
            const button = document.createElement('button');
            const value = document.createElement('span');
            const type = document.createElement('small');
            button.type = 'button';
            button.className = 'search-suggestion';
            button.id = `search-suggestion-${index}`;
            button.dataset.index = String(index);
            button.setAttribute('role', 'option');
            button.setAttribute('aria-selected', 'false');
            value.textContent = item.value;
            type.textContent = item.type;
            button.append(value, type);
            suggestionsBox.appendChild(button);
        });

        suggestionsBox.hidden = false;
        searchInput.setAttribute('aria-expanded', 'true');
        setActiveSuggestion(-1);
    }

    function afterRender() {
        applySearch();
        updateCompetitionButton();
        if (
            competitionBackdrop &&
            !competitionBackdrop.hidden &&
            (!competitionOptions?.children.length || competitionOptions.querySelector('.competition-filter-loading'))
        ) {
            renderCompetitionOptions();
        }
    }

    function scheduleAfterRender() {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
            scheduled = false;
            afterRender();
        });
    }

    function enterSearchMode() {
        if (searchMode) {
            applySearch();
            return;
        }

        const app = getApp();
        searchMode = true;
        restoreSport = app?.getSportFilter?.() ?? null;
        hasRestoreSport = true;
        updateCompetitionButton();

        if (app?.getSportFilter?.() !== null) {
            Promise.resolve(app.setSportFilter(null, true)).finally(afterRender);
        } else {
            applySearch();
        }
    }

    function clearSearch(options = {}) {
        const { restoreSport: shouldRestore = true, render = true } = options;
        if (searchInput) searchInput.value = '';
        query = '';
        hideSuggestions();
        resetVisibility();

        const app = getApp();
        const targetSport = restoreSport;
        const restoreAvailable = searchMode && hasRestoreSport && shouldRestore;
        searchMode = false;
        hasRestoreSport = false;
        restoreSport = null;
        updateCompetitionButton();

        if (restoreAvailable && app) {
            return app.setSportFilter(targetSport, render);
        }
        return Promise.resolve();
    }

    function selectSuggestion(index) {
        const item = suggestionItems[index];
        if (!item || !searchInput) return;
        searchInput.value = item.value;
        query = item.value;
        hideSuggestions();
        enterSearchMode();
        searchInput.focus();
    }

    function handleSearchInput() {
        query = searchInput.value.trim();
        if (!query) {
            clearSearch();
            return;
        }
        renderSuggestions();
        enterSearchMode();
    }

    function handleSearchKeydown(event) {
        const suggestionCount = suggestionItems.length;
        if (event.key === 'ArrowDown' && suggestionCount) {
            event.preventDefault();
            setActiveSuggestion((activeSuggestionIndex + 1) % suggestionCount);
        } else if (event.key === 'ArrowUp' && suggestionCount) {
            event.preventDefault();
            setActiveSuggestion((activeSuggestionIndex - 1 + suggestionCount) % suggestionCount);
        } else if (event.key === 'Enter' && activeSuggestionIndex >= 0) {
            event.preventDefault();
            selectSuggestion(activeSuggestionIndex);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            if (suggestionsBox && !suggestionsBox.hidden) hideSuggestions();
            else clearSearch();
        }
    }

    function getCompetitionEntries() {
        const app = getApp();
        const selected = new Set(app?.getCompetitionFilters?.() || []);
        const entries = new Map((app?.getFootballCompetitionCounts?.() || []).map(item => [
            item.value,
            { value: item.value, count: item.count, group: core.competitionGroup(item.value) }
        ]));
        selected.forEach(value => {
            if (!entries.has(value)) entries.set(value, { value, count: 0, group: core.competitionGroup(value) });
        });
        const groupOrder = { Nederland: 0, Europa: 1, Buitenland: 2, Internationaal: 3, Overig: 4 };
        return Array.from(entries.values()).sort((a, b) =>
            (groupOrder[a.group] ?? 9) - (groupOrder[b.group] ?? 9)
            || a.value.localeCompare(b.value, 'nl')
        );
    }

    function filterCompetitionOptions() {
        if (!competitionOptions || !competitionSearch) return;
        const needle = competitionSearch.value;
        competitionOptions.querySelectorAll('.competition-option').forEach(option => {
            option.hidden = !core.matchesText(option.dataset.searchValue || '', needle);
        });
        competitionOptions.querySelectorAll('.competition-option-group').forEach(group => {
            group.hidden = !Array.from(group.querySelectorAll('.competition-option')).some(option => !option.hidden);
        });
    }

    function renderCompetitionOptions() {
        if (!competitionOptions) return;
        const app = getApp();
        const selected = new Set(app?.getCompetitionFilters?.() || []);
        const entries = getCompetitionEntries();
        competitionOptions.replaceChildren();

        if (!entries.length) {
            const loading = document.createElement('p');
            loading.className = 'competition-filter-loading';
            loading.textContent = 'Competities worden geladen…';
            competitionOptions.appendChild(loading);
            return;
        }

        const groups = new Map();
        entries.forEach(entry => {
            if (!groups.has(entry.group)) groups.set(entry.group, []);
            groups.get(entry.group).push(entry);
        });

        groups.forEach((groupEntries, groupName) => {
            const section = document.createElement('section');
            const heading = document.createElement('h3');
            section.className = 'competition-option-group';
            heading.textContent = groupName;
            section.appendChild(heading);

            groupEntries.forEach(entry => {
                const label = document.createElement('label');
                const checkbox = document.createElement('input');
                const name = document.createElement('span');
                const count = document.createElement('small');
                label.className = 'competition-option';
                label.dataset.searchValue = `${entry.value} ${groupName}`;
                checkbox.type = 'checkbox';
                checkbox.value = entry.value;
                checkbox.checked = selected.has(entry.value);
                name.textContent = entry.value;
                count.textContent = String(entry.count);
                count.setAttribute('aria-label', `${entry.count} wedstrijden`);
                label.append(checkbox, name, count);
                section.appendChild(label);
            });
            competitionOptions.appendChild(section);
        });

        filterCompetitionOptions();
    }

    function closeCompetitionDialog() {
        if (!competitionBackdrop || competitionBackdrop.hidden) return;
        competitionBackdrop.hidden = true;
        competitionButton?.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = previousBodyOverflow;
        if (competitionButton && !competitionButton.hidden) competitionButton.focus();
    }

    function openCompetitionDialog() {
        if (!competitionBackdrop || !competitionButton || competitionButton.hidden) return;
        renderCompetitionOptions();
        if (competitionSearch) competitionSearch.value = '';
        filterCompetitionOptions();
        previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        competitionBackdrop.hidden = false;
        competitionButton.setAttribute('aria-expanded', 'true');
        competitionSearch?.focus();
    }

    function updateCompetitionButton() {
        if (!competitionButton) return;
        const app = getApp();
        const selectedCount = app?.getCompetitionFilters?.().length || 0;
        const visible = app?.getSportFilter?.() === 'voetbal'
            && !app?.isResultsMode?.()
            && !searchMode;
        competitionButton.hidden = !visible;
        competitionButton.classList.toggle('active', selectedCount > 0);
        competitionButton.setAttribute(
            'aria-label',
            selectedCount
                ? `Voetbalcompetities kiezen, ${selectedCount} geselecteerd`
                : 'Voetbalcompetities kiezen'
        );
        if (competitionCount) {
            competitionCount.textContent = String(selectedCount);
            competitionCount.hidden = selectedCount === 0;
        }
        if (!visible) closeCompetitionDialog();
    }

    function installCompetitionDialog() {
        competitionButton = document.getElementById('competition-filter-btn');
        competitionCount = document.getElementById('competition-filter-count');
        if (!competitionButton) return;

        competitionBackdrop = document.createElement('div');
        competitionBackdrop.className = 'competition-filter-backdrop';
        competitionBackdrop.hidden = true;
        competitionBackdrop.innerHTML = `
            <section class="competition-filter-dialog" role="dialog" aria-modal="true" aria-labelledby="competition-filter-title">
                <header>
                    <div>
                        <p class="competition-filter-kicker">Voetbal</p>
                        <h2 id="competition-filter-title">Competities</h2>
                    </div>
                    <button type="button" class="competition-filter-close" aria-label="Sluiten">×</button>
                </header>
                <p class="competition-filter-help">Vink één of meer competities aan. Niets aangevinkt toont alles.</p>
                <input type="search" class="competition-filter-search" placeholder="Zoek competitie…" aria-label="Zoek competitie" autocomplete="off">
                <div class="competition-filter-options"></div>
                <footer>
                    <button type="button" class="competition-filter-clear">Alles tonen</button>
                    <button type="button" class="competition-filter-done">Gereed</button>
                </footer>
            </section>
        `;
        document.body.appendChild(competitionBackdrop);

        competitionSearch = competitionBackdrop.querySelector('.competition-filter-search');
        competitionOptions = competitionBackdrop.querySelector('.competition-filter-options');
        competitionButton.addEventListener('click', openCompetitionDialog);
        competitionSearch.addEventListener('input', filterCompetitionOptions);
        competitionBackdrop.querySelector('.competition-filter-close').addEventListener('click', closeCompetitionDialog);
        competitionBackdrop.querySelector('.competition-filter-done').addEventListener('click', closeCompetitionDialog);
        competitionBackdrop.querySelector('.competition-filter-clear').addEventListener('click', () => {
            competitionOptions.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = false;
            });
            Promise.resolve(getApp()?.setCompetitionFilters?.([], true)).finally(afterRender);
            updateCompetitionButton();
        });
        competitionOptions.addEventListener('change', event => {
            if (!event.target.matches('input[type="checkbox"]')) return;
            const values = Array.from(competitionOptions.querySelectorAll('input[type="checkbox"]:checked'))
                .map(checkbox => checkbox.value);
            Promise.resolve(getApp()?.setCompetitionFilters?.(values, true)).finally(afterRender);
            updateCompetitionButton();
        });
        competitionBackdrop.addEventListener('click', event => {
            if (event.target === competitionBackdrop) closeCompetitionDialog();
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && !competitionBackdrop.hidden) {
                event.preventDefault();
                closeCompetitionDialog();
            }
        });

        updateCompetitionButton();
    }

    function installStyles() {
        if (document.getElementById('universal-search-styles')) return;
        const style = document.createElement('style');
        style.id = 'universal-search-styles';
        style.textContent = `
            .quick-search { position: relative; }
            .search-suggestions {
                position: absolute;
                z-index: 600;
                left: 0;
                right: 0;
                top: calc(100% + 6px);
                max-height: min(55vh, 360px);
                overflow-y: auto;
                border: 1px solid var(--border);
                border-radius: 10px;
                background: var(--card-bg);
                box-shadow: 0 12px 28px rgba(0,0,0,.24);
            }
            .search-suggestions[hidden],
            .competition-filter-backdrop[hidden] { display: none !important; }
            .search-suggestion {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 11px 12px;
                border: 0;
                border-bottom: 1px solid var(--border);
                background: transparent;
                color: var(--text);
                font: inherit;
                text-align: left;
                cursor: pointer;
            }
            .search-suggestion:last-child { border-bottom: 0; }
            .search-suggestion:hover,
            .search-suggestion:focus,
            .search-suggestion.is-active {
                background: var(--bg-secondary);
                outline: none;
            }
            .search-suggestion small {
                color: var(--text-secondary);
                font-size: .68rem;
                white-space: nowrap;
            }
            .competition-filter-btn {
                min-height: 34px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 7px;
                padding: 7px 10px;
                border: 1px solid rgba(255,255,255,.18);
                border-radius: 6px;
                background: rgba(255,255,255,.08);
                color: rgba(255,255,255,.9);
                font: inherit;
                font-size: .76rem;
                font-weight: 700;
                cursor: pointer;
            }
            .competition-filter-btn:hover,
            .competition-filter-btn.active {
                background: rgba(34,197,94,.28);
                border-color: rgba(74,222,128,.7);
            }
            .competition-filter-btn svg { width: 17px; height: 17px; }
            .competition-filter-count {
                min-width: 19px;
                height: 19px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 0 5px;
                border-radius: 10px;
                background: var(--success, #22c55e);
                color: #fff;
                font-size: .68rem;
                line-height: 1;
            }
            .competition-filter-backdrop {
                position: fixed;
                inset: 0;
                z-index: 1900;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 18px;
                background: rgba(0,0,0,.6);
                backdrop-filter: blur(4px);
            }
            .competition-filter-dialog {
                width: min(560px, 100%);
                max-height: min(82vh, 720px);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                border: 1px solid var(--border);
                border-radius: 16px;
                background: var(--card-bg);
                color: var(--text);
                box-shadow: 0 24px 60px rgba(0,0,0,.38);
            }
            .competition-filter-dialog > header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
                padding: 17px 18px 10px;
            }
            .competition-filter-dialog h2 { margin: 0; font-size: 1.2rem; }
            .competition-filter-kicker {
                margin: 0 0 2px;
                color: var(--success, #22c55e);
                font-size: .7rem;
                font-weight: 800;
                letter-spacing: .08em;
                text-transform: uppercase;
            }
            .competition-filter-close {
                width: 38px;
                height: 38px;
                border: 0;
                border-radius: 50%;
                background: var(--bg-secondary);
                color: var(--text);
                font-size: 1.5rem;
                cursor: pointer;
            }
            .competition-filter-help {
                margin: 0;
                padding: 0 18px 12px;
                color: var(--text-secondary);
                font-size: .78rem;
            }
            .competition-filter-search {
                margin: 0 18px 12px;
                padding: 10px 12px;
                border: 1px solid var(--border);
                border-radius: 9px;
                background: var(--bg-secondary);
                color: var(--text);
                font: inherit;
            }
            .competition-filter-options {
                min-height: 100px;
                overflow-y: auto;
                padding: 0 18px 12px;
            }
            .competition-option-group h3 {
                position: sticky;
                top: 0;
                z-index: 1;
                margin: 0;
                padding: 10px 0 6px;
                background: var(--card-bg);
                color: var(--text-secondary);
                font-size: .7rem;
                letter-spacing: .06em;
                text-transform: uppercase;
            }
            .competition-option {
                display: grid;
                grid-template-columns: 22px minmax(0, 1fr) auto;
                align-items: center;
                gap: 9px;
                min-height: 42px;
                padding: 6px 4px;
                border-bottom: 1px solid var(--border);
                cursor: pointer;
            }
            .competition-option input {
                width: 18px;
                height: 18px;
                accent-color: var(--success, #22c55e);
            }
            .competition-option small {
                min-width: 26px;
                padding: 3px 6px;
                border-radius: 10px;
                background: var(--bg-secondary);
                color: var(--text-secondary);
                text-align: center;
            }
            .competition-filter-loading {
                padding: 22px 0;
                color: var(--text-secondary);
                text-align: center;
            }
            .competition-filter-dialog > footer {
                display: flex;
                justify-content: space-between;
                gap: 10px;
                padding: 12px 18px 16px;
                border-top: 1px solid var(--border);
            }
            .competition-filter-dialog > footer button,
            .search-empty-clear {
                padding: 10px 14px;
                border: 0;
                border-radius: 9px;
                font: inherit;
                font-weight: 700;
                cursor: pointer;
            }
            .competition-filter-clear { background: var(--bg-secondary); color: var(--text); }
            .competition-filter-done,
            .search-empty-clear { background: var(--success, #22c55e); color: #fff; }
            .search-empty-state { margin-top: 12px; }
            .search-empty-title { margin-bottom: 6px; }
            .search-empty-clear { margin-top: 14px; }
            @media (max-width: 600px) {
                .competition-filter-label,
                .results-toggle-btn span { display: none; }
                .competition-filter-btn,
                .results-toggle-btn {
                    flex: 0 0 38px;
                    width: 38px;
                    min-width: 38px;
                    min-height: 36px;
                    padding: 0;
                }
                .competition-filter-backdrop {
                    align-items: flex-end;
                    padding: 0;
                }
                .competition-filter-dialog {
                    width: 100%;
                    max-height: 86vh;
                    border-radius: 18px 18px 0 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function startObserver() {
        if (observer) return;
        const target = document.getElementById('events-container');
        if (!target) return;
        observer = new MutationObserver(scheduleAfterRender);
        observer.observe(target, { childList: true, subtree: true });
    }

    function init() {
        if (initialized) return;
        searchInput = document.getElementById('sport-search');
        if (!searchInput || !core) return;
        initialized = true;

        installStyles();
        suggestionsBox = document.createElement('div');
        suggestionsBox.className = 'search-suggestions';
        suggestionsBox.id = 'search-suggestions';
        suggestionsBox.hidden = true;
        suggestionsBox.setAttribute('role', 'listbox');
        searchInput.closest('.quick-search')?.appendChild(suggestionsBox);
        searchInput.setAttribute('aria-autocomplete', 'list');
        searchInput.setAttribute('aria-controls', suggestionsBox.id);
        searchInput.setAttribute('aria-expanded', 'false');

        searchInput.addEventListener('input', handleSearchInput);
        searchInput.addEventListener('keydown', handleSearchKeydown);
        searchInput.addEventListener('focus', renderSuggestions);
        suggestionsBox.addEventListener('click', event => {
            const button = event.target.closest('.search-suggestion');
            if (button) selectSuggestion(Number(button.dataset.index));
        });
        document.addEventListener('click', event => {
            if (!searchInput.closest('.quick-search')?.contains(event.target)) hideSuggestions();
        });

        installCompetitionDialog();
        startObserver();
        afterRender();
        window.refreshIcons?.();
    }

    window.SPORT_OP_TV_SEARCH = Object.freeze({
        apply: applySearch,
        clear: clearSearch,
        getQuery: () => query
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
