(function () {
    'use strict';

    let query = '';
    let wrapped = false;
    let suggestionsBox = null;
    let observer = null;
    let applying = false;

    const normalize = (value = '') => String(value)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const termsFor = (value) => normalize(value).split(' ').filter(Boolean);

    function getSportLabel(row) {
        if (row.classList.contains('football-slot-match')) return 'voetbal football soccer';
        if (row.classList.contains('darts-row')) return 'darts';
        if (row.classList.contains('f1-row')) return 'f1 formule 1 formula 1';
        if (row.classList.contains('motogp-row')) return 'motogp motor';
        if (row.classList.contains('handbal-row')) return 'handbal handball';
        return '';
    }

    function getSearchRows() {
        return Array.from(document.querySelectorAll([
            '.football-slot-match',
            '.match-row.darts-row',
            '.match-row.f1-row',
            '.match-row.motogp-row',
            '.match-row.handbal-row'
        ].join(', ')));
    }

    function resetVisibility() {
        getSearchRows().forEach(row => {
            row.hidden = false;
            delete row.dataset.searchHidden;
        });
        document.querySelectorAll('.football-slot, .competition-group, .day-section').forEach(node => {
            node.hidden = false;
            delete node.dataset.searchHidden;
        });
    }

    function applySearch() {
        if (applying) return;
        applying = true;
        try {
            const terms = termsFor(query);
            if (!terms.length) {
                resetVisibility();
                return;
            }

            const rows = getSearchRows();
            rows.forEach(row => {
                const haystack = normalize(`${getSportLabel(row)} ${row.textContent || ''}`);
                const visible = terms.every(term => haystack.includes(term));
                row.hidden = !visible;
                row.dataset.searchHidden = visible ? '0' : '1';
            });

            document.querySelectorAll('.football-slot').forEach(slot => {
                const matches = Array.from(slot.querySelectorAll('.football-slot-match'));
                const visible = matches.some(match => !match.hidden);
                slot.hidden = matches.length > 0 && !visible;
                slot.dataset.searchHidden = slot.hidden ? '1' : '0';
            });

            document.querySelectorAll('.competition-group').forEach(group => {
                const rowsInGroup = Array.from(group.querySelectorAll('.match-row'));
                const visible = rowsInGroup.some(row => !row.hidden);
                group.hidden = rowsInGroup.length > 0 && !visible;
                group.dataset.searchHidden = group.hidden ? '1' : '0';
            });

            document.querySelectorAll('.day-section').forEach(day => {
                const rowsInDay = Array.from(day.querySelectorAll('.football-slot-match, .match-row'));
                const visible = rowsInDay.some(row => !row.hidden);
                day.hidden = rowsInDay.length > 0 && !visible;
                day.dataset.searchHidden = day.hidden ? '1' : '0';
            });
        } finally {
            applying = false;
        }
    }

    function collectSuggestions() {
        const selectors = [
            ['.football-team-name', 'Team'],
            ['.football-match-competition', 'Competitie'],
            ['.football-slot-channel', 'Zender'],
            ['.event-title', 'Event'],
            ['.event-competition', 'Competitie'],
            ['.channel-badge', 'Zender']
        ];
        const items = new Map();

        ['Voetbal', 'Darts', 'F1', 'MotoGP', 'Handbal'].forEach(value => {
            items.set(normalize(value), { value, type: 'Sport' });
        });

        selectors.forEach(([selector, type]) => {
            document.querySelectorAll(selector).forEach(node => {
                const value = (node.textContent || '').trim();
                const key = normalize(value);
                if (value && key && !items.has(key)) items.set(key, { value, type });
            });
        });
        return Array.from(items.values());
    }

    function hideSuggestions() {
        if (suggestionsBox) suggestionsBox.hidden = true;
    }

    function renderSuggestions(input) {
        if (!suggestionsBox) return;
        const needle = normalize(input.value);
        if (!needle) {
            hideSuggestions();
            return;
        }

        const matches = collectSuggestions()
            .filter(item => normalize(item.value).includes(needle))
            .sort((a, b) => {
                const aStarts = normalize(a.value).startsWith(needle) ? 0 : 1;
                const bStarts = normalize(b.value).startsWith(needle) ? 0 : 1;
                return aStarts - bStarts || a.value.localeCompare(b.value, 'nl');
            })
            .slice(0, 7);

        if (!matches.length) {
            hideSuggestions();
            return;
        }

        suggestionsBox.innerHTML = matches.map(item => (
            `<button type="button" class="search-suggestion" data-value="${item.value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}">` +
            `<span>${item.value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>` +
            `<small>${item.type}</small></button>`
        )).join('');
        suggestionsBox.hidden = false;
    }

    function installStyles() {
        if (document.getElementById('universal-search-styles')) return;
        const style = document.createElement('style');
        style.id = 'universal-search-styles';
        style.textContent = `
            .quick-search { position: relative; }
            .search-suggestions {
                position: absolute;
                z-index: 400;
                left: 0;
                right: 0;
                top: calc(100% + 6px);
                overflow: hidden;
                border: 1px solid var(--border);
                border-radius: 9px;
                background: var(--card-bg);
                box-shadow: 0 12px 28px rgba(0,0,0,.22);
            }
            .search-suggestion {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 9px 11px;
                border: 0;
                border-bottom: 1px solid var(--border);
                background: transparent;
                color: var(--text);
                font: inherit;
                text-align: left;
                cursor: pointer;
            }
            .search-suggestion:last-child { border-bottom: 0; }
            .search-suggestion:hover, .search-suggestion:focus { background: var(--bg-secondary); outline: none; }
            .search-suggestion small { color: var(--text-secondary); font-size: .68rem; white-space: nowrap; }
        `;
        document.head.appendChild(style);
    }

    function installSuggestions(input) {
        const holder = input.closest('.quick-search');
        if (!holder) return;
        suggestionsBox = document.createElement('div');
        suggestionsBox.className = 'search-suggestions';
        suggestionsBox.hidden = true;
        holder.appendChild(suggestionsBox);

        suggestionsBox.addEventListener('click', event => {
            const button = event.target.closest('.search-suggestion');
            if (!button) return;
            input.value = button.dataset.value || '';
            query = input.value.trim();
            hideSuggestions();
            applySearch();
            input.focus();
        });

        input.addEventListener('focus', () => renderSuggestions(input));
        document.addEventListener('click', event => {
            if (!holder.contains(event.target)) hideSuggestions();
        });
    }

    function clearLegacyClubFilter() {
        try {
            if (typeof filters !== 'undefined') filters.clubs = [];
        } catch (_) {}
        localStorage.removeItem('selectedClubs');
    }

    function wrapRenderEvents() {
        if (wrapped) return;
        try {
            if (typeof renderEvents !== 'function') return;
            const originalRenderEvents = renderEvents;
            renderEvents = function (...args) {
                clearLegacyClubFilter();
                const result = originalRenderEvents.apply(this, args);
                if (result && typeof result.finally === 'function') {
                    return result.finally(() => requestAnimationFrame(applySearch));
                }
                requestAnimationFrame(applySearch);
                return result;
            };
            wrapped = true;
        } catch (_) {}
    }

    function startObserver() {
        if (observer) return;
        const target = document.querySelector('main') || document.body;
        observer = new MutationObserver(() => {
            if (query) requestAnimationFrame(applySearch);
        });
        observer.observe(target, { childList: true, subtree: true });
    }

    document.addEventListener('input', event => {
        const input = event.target;
        if (!input || input.id !== 'filter-clubs') return;

        event.stopImmediatePropagation();
        clearLegacyClubFilter();
        query = input.value.trim();
        applySearch();
        renderSuggestions(input);
    }, true);

    document.addEventListener('keydown', event => {
        const input = event.target;
        if (!input || input.id !== 'filter-clubs') return;
        if (event.key === 'Escape') {
            input.value = '';
            query = '';
            hideSuggestions();
            resetVisibility();
        }
    }, true);

    document.addEventListener('DOMContentLoaded', () => {
        const input = document.getElementById('filter-clubs');
        if (!input) return;

        installStyles();
        input.placeholder = 'Zoek sport, team, competitie of zender...';
        input.setAttribute('aria-label', 'Zoek op sport, team, competitie, land, zender of evenement');
        input.value = '';
        clearLegacyClubFilter();
        installSuggestions(input);
        wrapRenderEvents();
        startObserver();
    });
})();
