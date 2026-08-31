(function () {
    'use strict';

    const RELEASE = Object.freeze({
        version: '3.11.0',
        date: '31 augustus 2026',
        title: 'Zoeken en release notes',
        notes: [
            'Nieuwe universele zoekfunctie over alle sporten.',
            'Zoeken werkt nu op team, sport, competitie, evenementtitel en zender.',
            'Zoeksuggesties verschijnen tijdens het typen.',
            'Release notes worden voortaan automatisch één keer getoond na iedere nieuwe versie.',
            'Het versienummer onderaan de app opent de release notes opnieuw.'
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

    document.addEventListener('DOMContentLoaded', () => {
        installStyles();
        installVersionLink();
        if (localStorage.getItem(STORAGE_KEY) !== RELEASE.version) {
            setTimeout(() => showReleaseNotes(true), 250);
        }
    });

    window.SPORT_OP_TV_RELEASE = RELEASE;
})();
