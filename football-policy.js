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
        { slug: 'ned.1', leagueId: '725', name: 'Eredivisie', channel: 'ESPN' },
        { slug: 'ned.2', leagueId: '3933', name: 'Keuken Kampioen Divisie', channel: 'ESPN' },
        { slug: 'eng.1', leagueId: '700', name: 'Premier League', channel: 'Viaplay' },
        { slug: 'ger.1', leagueId: '720', name: 'Bundesliga', channel: 'Viaplay' },
        { slug: 'esp.1', leagueId: '740', name: 'La Liga', channel: 'Ziggo Sport' },
        { slug: 'ita.1', leagueId: '730', name: 'Serie A', channel: 'Ziggo Sport' },
        { slug: 'fra.1', leagueId: '710', name: 'Ligue 1', channel: 'Ziggo Sport' },
        { slug: 'uefa.champions', leagueId: '775', name: 'Champions League', channel: 'Ziggo Sport' },
        { slug: 'uefa.wchampions', leagueId: '19483', name: "Women's Champions League", channel: 'Disney+ / NOS' },
        { slug: 'uefa.champions_qual', leagueId: '19874', name: 'Champions League Kwalificatie', channel: 'Ziggo Sport', dutchClubsOnly: true },
        { slug: 'uefa.europa', leagueId: '776', name: 'Europa League', channel: 'Ziggo Sport' },
        { slug: 'uefa.europa_qual', leagueId: '19887', name: 'Europa League Kwalificatie', channel: 'Ziggo Sport', dutchClubsOnly: true },
        { slug: 'uefa.europa.conf', leagueId: '20296', name: 'Conference League', channel: 'Ziggo Sport' },
        { slug: 'uefa.europa.conf_qual', leagueId: '20221', name: 'Conference League Kwalificatie', channel: 'Ziggo Sport', dutchClubsOnly: true },
        { slug: 'uefa.super_cup', leagueId: '5462', name: 'UEFA Super Cup', channel: 'Ziggo Sport' },
        { slug: 'fifa.world', leagueId: '606', name: 'WK', channel: 'NPO 1 / ESPN' },
        { slug: 'uefa.euro', leagueId: '781', name: 'EK', channel: 'NPO 1 / ESPN' },
        { slug: 'uefa.nations', leagueId: '2395', name: 'Nations League', channel: 'NPO 1 / Ziggo Sport' },
        { slug: 'fifa.worldq.uefa', leagueId: '786', name: 'WK Kwalificatie', channel: 'Ziggo Sport' },
        { slug: 'uefa.euroq', leagueId: '3947', name: 'EK Kwalificatie', channel: 'Ziggo Sport' },
        { slug: 'fifa.friendly', leagueId: '3922', name: 'Vriendschappelijk Internationaal', channel: 'ESPN / Ziggo Sport' },
        { slug: 'fifa.wwc', leagueId: '795', name: 'WK Vrouwen', channel: 'NPO 3 / ESPN' },
        { slug: 'uefa.weuro', leagueId: '17915', name: 'EK Vrouwen', channel: 'NPO 3 / ESPN' },
        { slug: 'fifa.wworldq.uefa', leagueId: '20649', name: 'WK Kwalificatie Vrouwen', channel: 'NPO 3 / ESPN', dutchNationalTeamOnly: true },
        { slug: 'uefa.w.nations', leagueId: '23088', name: 'Nations League Vrouwen', channel: 'NPO 3 / ESPN', dutchNationalTeamOnly: true },
        { slug: 'fifa.friendly.w', leagueId: '3923', name: 'Vriendschappelijk Internationaal Vrouwen', channel: 'NPO 3 / ESPN', dutchNationalTeamOnly: true },
        { slug: 'ned.cup', leagueId: '3957', name: 'KNVB Beker', channel: 'ESPN' },
        { slug: 'ned.supercup', leagueId: '10749', name: 'Johan Cruijff Schaal', channel: 'ESPN' },
        { slug: 'eng.fa', leagueId: '3918', name: 'FA Cup', channel: 'Viaplay' },
        { slug: 'eng.charity', leagueId: '5329', name: 'Community Shield', channel: 'Viaplay' },
        { slug: 'ger.dfb_pokal', leagueId: '3954', name: 'DFB Pokal', channel: 'Viaplay' },
        { slug: 'ger.super_cup', leagueId: '8101', name: 'DFL Supercup', channel: 'Viaplay' },
        { slug: 'esp.copa_del_rey', leagueId: '3951', name: 'Copa del Rey', channel: 'Ziggo Sport' },
        { slug: 'esp.super_cup', leagueId: '8102', name: 'Supercopa de Espana', channel: 'Ziggo Sport' },
        { slug: 'ita.coppa_italia', leagueId: '3956', name: 'Coppa Italia', channel: 'Ziggo Sport' },
        { slug: 'ita.super_cup', leagueId: '8103', name: 'Supercoppa Italiana', channel: 'Ziggo Sport' },
        { slug: 'fra.coupe_de_france', leagueId: '3952', name: 'Coupe de France', channel: 'Ziggo Sport' },
        { slug: 'fra.super_cup', leagueId: '8357', name: 'Trophee des Champions', channel: 'Ziggo Sport' },
        { slug: 'eng.league_cup', leagueId: '3920', name: 'EFL Cup (Carabao Cup)', channel: 'Viaplay', minimumRound: 3 }
    ].map(Object.freeze));

    const DUTCH_NATIONAL_TEAM_COVERAGE = Object.freeze({
        men: Object.freeze([
            'WK', 'EK', 'Nations League', 'WK Kwalificatie', 'EK Kwalificatie',
            'Vriendschappelijk Internationaal'
        ]),
        women: Object.freeze([
            'WK Vrouwen', 'EK Vrouwen', 'Nations League Vrouwen',
            'WK Kwalificatie Vrouwen', 'EK Kwalificatie Vrouwen',
            'Vriendschappelijk Internationaal Vrouwen'
        ])
    });

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
        DUTCH_NATIONAL_TEAM_COVERAGE,
        ESPN_STANDINGS,
        normalizeClubName,
        isDutchClub,
        getEspnRoundText,
        isAtOrAfterRound,
        includesMatch
    });
});
