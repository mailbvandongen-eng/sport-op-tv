(function (root, factory) {
    const policy = factory();
    if (typeof module === 'object' && module.exports) module.exports = policy;
    root.ISER_FOOTBALL_POLICY = policy;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const DUTCH_FOOTBALL_CLUBS = Object.freeze([
        'ADO Den Haag', 'Ajax', 'Ajax Amsterdam', 'Almere City', 'AZ', 'AZ Alkmaar',
        'Cambuur', 'De Graafschap', 'Excelsior', 'FC Dordrecht', 'FC Eindhoven',
        'FC Emmen', 'FC Groningen', 'FC Twente', 'FC Utrecht', 'FC Volendam',
        'Feyenoord', 'Fortuna Sittard', 'Go Ahead Eagles', 'Helmond Sport',
        'Heracles Almelo', 'Jong Ajax', 'Jong AZ', 'Jong FC Utrecht', 'Jong PSV',
        'MVV Maastricht', 'NAC Breda', 'NEC', 'NEC Nijmegen', 'N.E.C.',
        'N.E.C. Nijmegen', 'PEC Zwolle', 'PSV', 'PSV Eindhoven', 'RKC Waalwijk',
        'Roda JC Kerkrade', 'SC Cambuur', 'SC Heerenveen', 'Sparta Rotterdam',
        'Telstar', 'TOP Oss', 'Vitesse', 'VVV-Venlo', 'Willem II'
    ]);

    const ESPN_COMPETITIONS = Object.freeze([
        { slug: 'ned.1', name: 'Eredivisie', channel: 'ESPN' },
        { slug: 'ned.2', name: 'Keuken Kampioen Divisie', channel: 'ESPN' },
        { slug: 'eng.1', name: 'Premier League', channel: 'Viaplay' },
        { slug: 'ger.1', name: 'Bundesliga', channel: 'Viaplay' },
        { slug: 'esp.1', name: 'La Liga', channel: 'Ziggo Sport' },
        { slug: 'ita.1', name: 'Serie A', channel: 'Ziggo Sport' },
        { slug: 'fra.1', name: 'Ligue 1', channel: 'Ziggo Sport' },
        { slug: 'uefa.champions', name: 'Champions League', channel: 'Ziggo Sport' },
        { slug: 'uefa.champions_qual', name: 'Champions League Kwalificatie', channel: 'Ziggo Sport', dutchClubsOnly: true },
        { slug: 'uefa.europa', name: 'Europa League', channel: 'Ziggo Sport' },
        { slug: 'uefa.europa_qual', name: 'Europa League Kwalificatie', channel: 'Ziggo Sport', dutchClubsOnly: true },
        { slug: 'uefa.europa.conf', name: 'Conference League', channel: 'Ziggo Sport' },
        { slug: 'uefa.europa.conf_qual', name: 'Conference League Kwalificatie', channel: 'Ziggo Sport', dutchClubsOnly: true },
        { slug: 'uefa.super_cup', name: 'UEFA Super Cup', channel: 'Ziggo Sport' },
        { slug: 'fifa.world', name: 'WK', channel: 'NPO 1 / ESPN' },
        { slug: 'uefa.euro', name: 'EK', channel: 'NPO 1 / ESPN' },
        { slug: 'uefa.nations', name: 'Nations League', channel: 'NPO 1 / Ziggo Sport' },
        { slug: 'fifa.worldq.uefa', name: 'WK Kwalificatie', channel: 'Ziggo Sport' },
        { slug: 'uefa.euroq', name: 'EK Kwalificatie', channel: 'Ziggo Sport' },
        { slug: 'fifa.friendly', name: 'Vriendschappelijk Internationaal', channel: 'ESPN / Ziggo Sport' },
        { slug: 'fifa.wwc', name: 'WK Vrouwen', channel: 'NPO 3 / ESPN' },
        { slug: 'uefa.weuro', name: 'EK Vrouwen', channel: 'NPO 3 / ESPN' },
        { slug: 'fifa.wworldq.uefa', name: 'WK Kwalificatie Vrouwen', channel: 'NPO 3 / ESPN', dutchNationalTeamOnly: true },
        { slug: 'uefa.w.nations', name: 'Nations League Vrouwen', channel: 'NPO 3 / ESPN', dutchNationalTeamOnly: true },
        { slug: 'fifa.friendly.w', name: 'Vriendschappelijk Internationaal Vrouwen', channel: 'NPO 3 / ESPN', dutchNationalTeamOnly: true },
        { slug: 'ned.cup', name: 'KNVB Beker', channel: 'ESPN' },
        { slug: 'ned.supercup', name: 'Johan Cruijff Schaal', channel: 'ESPN' },
        { slug: 'eng.fa', name: 'FA Cup', channel: 'Viaplay' },
        { slug: 'eng.charity', name: 'Community Shield', channel: 'Viaplay' },
        { slug: 'ger.dfb_pokal', name: 'DFB Pokal', channel: 'Viaplay' },
        { slug: 'ger.super_cup', name: 'DFL Supercup', channel: 'Viaplay' },
        { slug: 'esp.copa_del_rey', name: 'Copa del Rey', channel: 'Ziggo Sport' },
        { slug: 'esp.super_cup', name: 'Supercopa de Espana', channel: 'Ziggo Sport' },
        { slug: 'ita.coppa_italia', name: 'Coppa Italia', channel: 'Ziggo Sport' },
        { slug: 'ita.super_cup', name: 'Supercoppa Italiana', channel: 'Ziggo Sport' },
        { slug: 'fra.coupe_de_france', name: 'Coupe de France', channel: 'Ziggo Sport' },
        { slug: 'fra.super_cup', name: 'Trophee des Champions', channel: 'Ziggo Sport' },
        { slug: 'eng.league_cup', name: 'EFL Cup (Carabao Cup)', channel: 'Viaplay', minimumRound: 3 }
    ].map(Object.freeze));

    const ESPN_STANDINGS = Object.freeze({
        88: 'ned.1',
        39: 'eng.1',
        78: 'ger.1',
        140: 'esp.1',
        135: 'ita.1',
        61: 'fra.1',
        2: 'uefa.champions'
    });

    function normalizeClubName(name = '') {
        return String(name)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/['’.-]/g, ' ')
            .replace(/^(afc|fc|fk|sc)\s+/, '')
            .replace(/\s+(afc|fc|fk|sc)$/, '')
            .replace(/\bamsterdam\b/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    const NORMALIZED_DUTCH_CLUBS = new Set(DUTCH_FOOTBALL_CLUBS.map(normalizeClubName));

    function isDutchClub(name = '') {
        const normalized = normalizeClubName(name);
        return Boolean(normalized) && NORMALIZED_DUTCH_CLUBS.has(normalized);
    }

    function getEspnRoundText(event, competition) {
        return [
            event?.season?.type?.name,
            event?.season?.type?.abbreviation,
            event?.season?.slug,
            event?.week?.text,
            competition?.type?.text,
            competition?.type?.abbreviation,
            ...(competition?.notes || []).map(note => note?.headline),
            competition?.status?.type?.detail,
            event?.name,
            event?.shortName
        ].filter(Boolean).join(' ').toLowerCase();
    }

    function isAtOrAfterRound(roundText, minimumRound = 3) {
        const text = String(roundText || '').toLowerCase().replace(/[-_]+/g, ' ');
        if (!text) return false;
        if (/round of (32|16)|last (32|16)|quarter|semi|\bfinal\b/.test(text)) return true;

        const wordRounds = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6 };
        for (const [word, round] of Object.entries(wordRounds)) {
            if (new RegExp(`\\b${word}\\s+(?:proper\\s+)?round\\b|\\bround\\s+${word}\\b`).test(text)) {
                return round >= minimumRound;
            }
        }

        const numericRound = text.match(/\b(?:round|rnd)\s*(\d+)|\b(\d+)(?:st|nd|rd|th)\s+(?:proper\s+)?round\b/);
        return numericRound ? Number(numericRound[1] || numericRound[2]) >= minimumRound : false;
    }

    function includesMatch(comp, homeTeam, awayTeam, event, competition, options = {}) {
        if (comp.dutchClubsOnly && !isDutchClub(homeTeam) && !isDutchClub(awayTeam)) return false;
        if (comp.dutchNationalTeamOnly && !options.isDutchNationalTeam(homeTeam) && !options.isDutchNationalTeam(awayTeam)) return false;
        if (comp.minimumRound && !isAtOrAfterRound(getEspnRoundText(event, competition), comp.minimumRound)) return false;
        return options.isRelevantInternationalMatch(comp.name, homeTeam, awayTeam);
    }

    return Object.freeze({
        DUTCH_FOOTBALL_CLUBS,
        ESPN_COMPETITIONS,
        ESPN_STANDINGS,
        normalizeClubName,
        isDutchClub,
        getEspnRoundText,
        isAtOrAfterRound,
        includesMatch
    });
});

// Browser extensions are loaded here so the large single-file app does not
// need to be rewritten merely to add a script tag. Node policy tests ignore it.
if (typeof document !== 'undefined') {
    const searchScript = document.createElement('script');
    searchScript.src = 'search-enhancements.js?v=3.11.0';
    searchScript.defer = true;
    document.head.appendChild(searchScript);

    const releaseScript = document.createElement('script');
    releaseScript.src = 'release-notes.js?v=3.11.0';
    releaseScript.defer = true;
    document.head.appendChild(releaseScript);
}
