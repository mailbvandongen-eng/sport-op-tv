(function () {
    'use strict';

    const RELEASE = Object.freeze({
        version: '3.12.0',
        date: '5 september 2026',
        title: 'Zoeken en competitiefilters hersteld',
        notes: [
            'De universele zoekfunctie start nu betrouwbaar bij de eerste opening.',
            'Zoeken werkt over alle sporten op sport, team, competitie, land, evenement en zender.',
            'Zoeksuggesties zijn bedienbaar met aanraken, pijltjestoetsen en Enter.',
            'Bij voetbal is een doorzoekbaar competitiefilter met selectievakjes toegevoegd.',
            'Geselecteerde voetbalcompetities blijven op dit apparaat bewaard.',
            'Een zoekopdracht zonder treffers toont voortaan een duidelijke melding.',
            'Dit wijzigingsvenster en het versienummer laden nu zonder herladen van de app.'
        ]
    });

    const STORAGE_KEY = 'sportOpTvSeenRelease';

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function installStyles() {
        if (document.getElementById('release-notes-styles')) return;
        const style = document.createElement('style');
        style.id = 'release-notes-styles';
        style.textContent = `
            .release-notes-backdrop {
                position: fixed;
                inset: 0;
                z-index: 2000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 18px;
                background: rgba(0,0,0,.58);
                backdrop-filter: blur(4px);
            }
            .release-notes-dialog {
                width: min(520px, 100%);
                max-height: min(78vh, 680px);
                overflow: auto;
                background: var(--card-bg, #fff);
                color: var(--text, #111);
                border: 1px solid var(--border, #ddd);
                border-radius: 16px;
                box-shadow: 0 24px 60px rgba(0,0,0,.35);
                padding: 22px;
            }
            .release-notes-kicker {
                margin: 0 0 4px;
                color: var(--text-secondary, #666);
                font-size: .76rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: .06em;
            }
            .release-notes-dialog h2 {
                margin: 0;
                font-size: 1.25rem;
                line-height: 1.25;
            }
            .release-notes-date {
                margin: 5px 0 16px;
                color: var(--text-secondary, #666);
                font-size: .78rem;
            }
            .release-notes-dialog ul {
                margin: 0;
                padding-left: 20px;
            }
            .release-notes-dialog li {
                margin: 0 0 9px;
                line-height: 1.45;
            }
            .release-notes-close {
                width: 100%;
                margin-top: 18px;
                padding: 10px 14px;
                border: 0;
                border-radius: 9px;
                background: var(--primary, #22c55e);
                color: #fff;
                font: inherit;
                font-weight: 700;
                cursor: pointer;
            }
            .version-footer.release-notes-link {
                cursor: pointer;
                text-decoration: underline;
                text-underline-offset: 3px;
            }
        `;
        document.head.appendChild(style);
    }

    function closeReleaseNotes(backdrop, markSeen) {
        if (markSeen) localStorage.setItem(STORAGE_KEY, RELEASE.version);
        backdrop.remove();
    }

    function showReleaseNotes(markSeenOnClose = true) {
        const existing = document.querySelector('.release-notes-backdrop');
        if (existing) existing.remove();

        const backdrop = document.createElement('div');
        backdrop.className = 'release-notes-backdrop';
        backdrop.setAttribute('role', 'presentation');
        backdrop.innerHTML = `
            <section class="release-notes-dialog" role="dialog" aria-modal="true" aria-labelledby="release-notes-title">
                <p class="release-notes-kicker">Nieuw in v${escapeHtml(RELEASE.version)}</p>
                <h2 id="release-notes-title">${escapeHtml(RELEASE.title)}</h2>
                <p class="release-notes-date">${escapeHtml(RELEASE.date)}</p>
                <ul>${RELEASE.notes.map(note => `<li>${escapeHtml(note)}</li>`).join('')}</ul>
                <button type="button" class="release-notes-close">Begrepen</button>
            </section>`;

        document.body.appendChild(backdrop);
        const closeButton = backdrop.querySelector('.release-notes-close');
        closeButton.focus();
        closeButton.addEventListener('click', () => closeReleaseNotes(backdrop, markSeenOnClose));
        backdrop.addEventListener('click', event => {
            if (event.target === backdrop) closeReleaseNotes(backdrop, markSeenOnClose);
        });
        document.addEventListener('keydown', function onKeydown(event) {
            if (event.key !== 'Escape' || !document.body.contains(backdrop)) return;
            document.removeEventListener('keydown', onKeydown);
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
        if (localStorage.getItem(STORAGE_KEY) !== RELEASE.version) {
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
