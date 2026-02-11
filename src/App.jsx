import React, { useState, useEffect, useMemo } from 'react';
import { X, ChevronUp, ChevronDown, Edit2, Trash2 } from 'lucide-react';

// Component for Recent Form visualization
function RecentFormBar({ matches }) {
  if (!matches || matches.length === 0) {
    return (
      <div className="flex gap-1 justify-center">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-6 h-6 bg-gray-200 rounded-sm"></div>
        ))}
      </div>
    );
  }

  const paddedMatches = [...Array(5)].map((_, i) => matches[i] || null);

  return (
    <div className="flex gap-1 justify-center">
      {paddedMatches.map((result, i) => (
        <div
          key={i}
          className={`w-6 h-6 rounded-sm flex items-center justify-center text-xs font-bold ${
            result === 'W'
              ? 'bg-green-500 text-white'
              : result === 'L'
              ? 'bg-red-500 text-white'
              : 'bg-gray-200'
          }`}
        >
          {result || '—'}
        </div>
      ))}
    </div>
  );
}

const MIN_GAMES_FOR_QUALIFICATION = 5;

// All countries with their ISO codes for flat flags
const COUNTRIES = [
  { name: 'Afghanistan', code: 'af' }, { name: 'Albania', code: 'al' }, { name: 'Algeria', code: 'dz' },
  { name: 'Andorra', code: 'ad' }, { name: 'Angola', code: 'ao' }, { name: 'Argentina', code: 'ar' },
  { name: 'Armenia', code: 'am' }, { name: 'Australia', code: 'au' }, { name: 'Austria', code: 'at' },
  { name: 'Azerbaijan', code: 'az' }, { name: 'Bahamas', code: 'bs' }, { name: 'Bahrain', code: 'bh' },
  { name: 'Bangladesh', code: 'bd' }, { name: 'Barbados', code: 'bb' }, { name: 'Belarus', code: 'by' },
  { name: 'Belgium', code: 'be' }, { name: 'Belize', code: 'bz' }, { name: 'Benin', code: 'bj' },
  { name: 'Bhutan', code: 'bt' }, { name: 'Bolivia', code: 'bo' }, { name: 'Bosnia', code: 'ba' },
  { name: 'Botswana', code: 'bw' }, { name: 'Brazil', code: 'br' }, { name: 'Brunei', code: 'bn' },
  { name: 'Bulgaria', code: 'bg' }, { name: 'Burkina Faso', code: 'bf' }, { name: 'Burundi', code: 'bi' },
  { name: 'Cambodia', code: 'kh' }, { name: 'Cameroon', code: 'cm' }, { name: 'Canada', code: 'ca' },
  { name: 'Cape Verde', code: 'cv' }, { name: 'Central African Republic', code: 'cf' },
  { name: 'Chad', code: 'td' }, { name: 'Chile', code: 'cl' }, { name: 'China', code: 'cn' },
  { name: 'Colombia', code: 'co' }, { name: 'Comoros', code: 'km' }, { name: 'Congo', code: 'cg' },
  { name: 'Costa Rica', code: 'cr' }, { name: 'Croatia', code: 'hr' }, { name: 'Cuba', code: 'cu' },
  { name: 'Cyprus', code: 'cy' }, { name: 'Czech Republic', code: 'cz' }, { name: 'Denmark', code: 'dk' },
  { name: 'Djibouti', code: 'dj' }, { name: 'Dominica', code: 'dm' }, { name: 'Dominican Republic', code: 'do' },
  { name: 'Ecuador', code: 'ec' }, { name: 'Egypt', code: 'eg' }, { name: 'El Salvador', code: 'sv' },
  { name: 'England', code: 'gb-eng' }, { name: 'Equatorial Guinea', code: 'gq' }, { name: 'Eritrea', code: 'er' },
  { name: 'Estonia', code: 'ee' }, { name: 'Ethiopia', code: 'et' }, { name: 'Fiji', code: 'fj' },
  { name: 'Finland', code: 'fi' }, { name: 'France', code: 'fr' }, { name: 'Gabon', code: 'ga' },
  { name: 'Gambia', code: 'gm' }, { name: 'Georgia', code: 'ge' }, { name: 'Germany', code: 'de' },
  { name: 'Ghana', code: 'gh' }, { name: 'Greece', code: 'gr' }, { name: 'Grenada', code: 'gd' },
  { name: 'Guatemala', code: 'gt' }, { name: 'Guinea', code: 'gn' }, { name: 'Guinea-Bissau', code: 'gw' },
  { name: 'Guyana', code: 'gy' }, { name: 'Haiti', code: 'ht' }, { name: 'Honduras', code: 'hn' },
  { name: 'Hong Kong', code: 'hk' }, { name: 'Hungary', code: 'hu' }, { name: 'Iceland', code: 'is' },
  { name: 'India', code: 'in' }, { name: 'Indonesia', code: 'id' }, { name: 'Iran', code: 'ir' },
  { name: 'Iraq', code: 'iq' }, { name: 'Ireland', code: 'ie' }, { name: 'Israel', code: 'il' },
  { name: 'Italy', code: 'it' }, { name: 'Jamaica', code: 'jm' }, { name: 'Japan', code: 'jp' },
  { name: 'Jordan', code: 'jo' }, { name: 'Kazakhstan', code: 'kz' }, { name: 'Kenya', code: 'ke' },
  { name: 'Kiribati', code: 'ki' }, { name: 'Kosovo', code: 'xk' }, { name: 'Kuwait', code: 'kw' },
  { name: 'Kyrgyzstan', code: 'kg' }, { name: 'Laos', code: 'la' }, { name: 'Latvia', code: 'lv' },
  { name: 'Lebanon', code: 'lb' }, { name: 'Lesotho', code: 'ls' }, { name: 'Liberia', code: 'lr' },
  { name: 'Libya', code: 'ly' }, { name: 'Liechtenstein', code: 'li' }, { name: 'Lithuania', code: 'lt' },
  { name: 'Luxembourg', code: 'lu' }, { name: 'Madagascar', code: 'mg' }, { name: 'Malawi', code: 'mw' },
  { name: 'Malaysia', code: 'my' }, { name: 'Maldives', code: 'mv' }, { name: 'Mali', code: 'ml' },
  { name: 'Malta', code: 'mt' }, { name: 'Marshall Islands', code: 'mh' }, { name: 'Mauritania', code: 'mr' },
  { name: 'Mauritius', code: 'mu' }, { name: 'Mexico', code: 'mx' }, { name: 'Micronesia', code: 'fm' },
  { name: 'Moldova', code: 'md' }, { name: 'Monaco', code: 'mc' }, { name: 'Mongolia', code: 'mn' },
  { name: 'Montenegro', code: 'me' }, { name: 'Morocco', code: 'ma' }, { name: 'Mozambique', code: 'mz' },
  { name: 'Myanmar', code: 'mm' }, { name: 'Namibia', code: 'na' }, { name: 'Nauru', code: 'nr' },
  { name: 'Nepal', code: 'np' }, { name: 'Netherlands', code: 'nl' }, { name: 'New Zealand', code: 'nz' },
  { name: 'Nicaragua', code: 'ni' }, { name: 'Niger', code: 'ne' }, { name: 'Nigeria', code: 'ng' },
  { name: 'North Korea', code: 'kp' }, { name: 'North Macedonia', code: 'mk' }, { name: 'Norway', code: 'no' },
  { name: 'Oman', code: 'om' }, { name: 'Pakistan', code: 'pk' }, { name: 'Palau', code: 'pw' },
  { name: 'Palestine', code: 'ps' }, { name: 'Panama', code: 'pa' }, { name: 'Papua New Guinea', code: 'pg' },
  { name: 'Paraguay', code: 'py' }, { name: 'Peru', code: 'pe' }, { name: 'Philippines', code: 'ph' },
  { name: 'Poland', code: 'pl' }, { name: 'Portugal', code: 'pt' }, { name: 'Qatar', code: 'qa' },
  { name: 'Romania', code: 'ro' }, { name: 'Russia', code: 'ru' }, { name: 'Rwanda', code: 'rw' },
  { name: 'Saint Lucia', code: 'lc' }, { name: 'Samoa', code: 'ws' }, { name: 'San Marino', code: 'sm' },
  { name: 'Saudi Arabia', code: 'sa' }, { name: 'Scotland', code: 'gb-sct' }, { name: 'Senegal', code: 'sn' },
  { name: 'Serbia', code: 'rs' }, { name: 'Seychelles', code: 'sc' }, { name: 'Sierra Leone', code: 'sl' },
  { name: 'Singapore', code: 'sg' }, { name: 'Slovakia', code: 'sk' }, { name: 'Slovenia', code: 'si' },
  { name: 'Solomon Islands', code: 'sb' }, { name: 'Somalia', code: 'so' }, { name: 'South Africa', code: 'za' },
  { name: 'South Korea', code: 'kr' }, { name: 'South Sudan', code: 'ss' }, { name: 'Spain', code: 'es' },
  { name: 'Sri Lanka', code: 'lk' }, { name: 'Sudan', code: 'sd' }, { name: 'Suriname', code: 'sr' },
  { name: 'Sweden', code: 'se' }, { name: 'Switzerland', code: 'ch' }, { name: 'Syria', code: 'sy' },
  { name: 'Taiwan', code: 'tw' }, { name: 'Tajikistan', code: 'tj' }, { name: 'Tanzania', code: 'tz' },
  { name: 'Thailand', code: 'th' }, { name: 'Timor-Leste', code: 'tl' }, { name: 'Togo', code: 'tg' },
  { name: 'Tonga', code: 'to' }, { name: 'Trinidad and Tobago', code: 'tt' }, { name: 'Tunisia', code: 'tn' },
  { name: 'Turkey', code: 'tr' }, { name: 'Turkmenistan', code: 'tm' }, { name: 'Tuvalu', code: 'tv' },
  { name: 'Uganda', code: 'ug' }, { name: 'Ukraine', code: 'ua' }, { name: 'United Arab Emirates', code: 'ae' },
  { name: 'United Kingdom', code: 'gb' }, { name: 'United States', code: 'us' }, { name: 'Uruguay', code: 'uy' },
  { name: 'US - Alabama', code: 'us-al' }, { name: 'US - Alaska', code: 'us-ak' },
  { name: 'US - Arizona', code: 'us-az' }, { name: 'US - Arkansas', code: 'us-ar' },
  { name: 'US - California', code: 'us-ca' }, { name: 'US - Colorado', code: 'us-co' },
  { name: 'US - Connecticut', code: 'us-ct' }, { name: 'US - Delaware', code: 'us-de' },
  { name: 'US - Florida', code: 'us-fl' }, { name: 'US - Georgia', code: 'us-ga' },
  { name: 'US - Hawaii', code: 'us-hi' }, { name: 'US - Idaho', code: 'us-id' },
  { name: 'US - Illinois', code: 'us-il' }, { name: 'US - Indiana', code: 'us-in' },
  { name: 'US - Iowa', code: 'us-ia' }, { name: 'US - Kansas', code: 'us-ks' },
  { name: 'US - Kentucky', code: 'us-ky' }, { name: 'US - Louisiana', code: 'us-la' },
  { name: 'US - Maine', code: 'us-me' }, { name: 'US - Maryland', code: 'us-md' },
  { name: 'US - Massachusetts', code: 'us-ma' }, { name: 'US - Michigan', code: 'us-mi' },
  { name: 'US - Minnesota', code: 'us-mn' }, { name: 'US - Mississippi', code: 'us-ms' },
  { name: 'US - Missouri', code: 'us-mo' }, { name: 'US - Montana', code: 'us-mt' },
  { name: 'US - Nebraska', code: 'us-ne' }, { name: 'US - Nevada', code: 'us-nv' },
  { name: 'US - New Hampshire', code: 'us-nh' }, { name: 'US - New Jersey', code: 'us-nj' },
  { name: 'US - New Mexico', code: 'us-nm' }, { name: 'US - New York', code: 'us-ny' },
  { name: 'US - North Carolina', code: 'us-nc' }, { name: 'US - North Dakota', code: 'us-nd' },
  { name: 'US - Ohio', code: 'us-oh' }, { name: 'US - Oklahoma', code: 'us-ok' },
  { name: 'US - Oregon', code: 'us-or' }, { name: 'US - Pennsylvania', code: 'us-pa' },
  { name: 'US - Rhode Island', code: 'us-ri' }, { name: 'US - South Carolina', code: 'us-sc' },
  { name: 'US - South Dakota', code: 'us-sd' }, { name: 'US - Tennessee', code: 'us-tn' },
  { name: 'US - Texas', code: 'us-tx' }, { name: 'US - Utah', code: 'us-ut' },
  { name: 'US - Vermont', code: 'us-vt' }, { name: 'US - Virginia', code: 'us-va' },
  { name: 'US - Washington', code: 'us-wa' }, { name: 'US - West Virginia', code: 'us-wv' },
  { name: 'US - Wisconsin', code: 'us-wi' }, { name: 'US - Wyoming', code: 'us-wy' },
  { name: 'Uzbekistan', code: 'uz' }, { name: 'Vanuatu', code: 'vu' }, { name: 'Vatican City', code: 'va' },
  { name: 'Venezuela', code: 've' }, { name: 'Vietnam', code: 'vn' }, { name: 'Wales', code: 'gb-wls' },
  { name: 'Yemen', code: 'ye' }, { name: 'Zambia', code: 'zm' }, { name: 'Zimbabwe', code: 'zw' }
];

const OFFICES = ["NYC", "LON"];

// Convert probability to American betting odds
function probabilityToOdds(probability) {
  if (probability <= 0) return "+10000";
  if (probability >= 100) return "-10000";
  
  const prob = probability / 100;
  
  if (prob >= 0.5) {
    const odds = Math.round((prob / (1 - prob)) * 100);
    return `-${odds}`;
  } else {
    const odds = Math.round(((1 - prob) / prob) * 100);
    return `+${odds}`;
  }
}

// Random number generator for simulations
function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function eloWinProb(eloA, eloB, matchNoiseStd = 0) {
  const a = eloA + randn() * matchNoiseStd;
  const b = eloB + randn() * matchNoiseStd;
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}

function simulateSeason(players, { seasonMatchesPerPlayer = 10, K = 24, matchNoiseStd = 60 } = {}) {
  const sims = players.map((p) => ({ ...p }));
  const n = sims.length;
  const totalMatches = Math.max(0, Math.round((n * seasonMatchesPerPlayer) / 2));

  const games = new Map();
  sims.forEach((p) => games.set(p.id, 0));

  const pickIndex = () => {
    const tries = 6;
    let best = Math.floor(Math.random() * n);
    let bestGames = games.get(sims[best].id) ?? 0;
    for (let t = 0; t < tries; t++) {
      const idx = Math.floor(Math.random() * n);
      const g = games.get(sims[idx].id) ?? 0;
      if (g < bestGames) {
        best = idx;
        bestGames = g;
      }
    }
    return best;
  };

  for (let m = 0; m < totalMatches; m++) {
    const i = pickIndex();
    let j = pickIndex();
    if (j === i) j = (j + 1 + Math.floor(Math.random() * (n - 1))) % n;

    const a = sims[i];
    const b = sims[j];

    const pA = eloWinProb(a.elo, b.elo, matchNoiseStd);
    const aWins = Math.random() < pA;

    const winner = aWins ? a : b;
    const loser = aWins ? b : a;

    const expectedWinner = 1 / (1 + Math.pow(10, (loser.elo - winner.elo) / 400));
    const expectedLoser = 1 - expectedWinner;

    winner.elo = Math.round(winner.elo + K * (1 - expectedWinner));
    loser.elo = Math.round(loser.elo + K * (0 - expectedLoser));

    games.set(a.id, (games.get(a.id) ?? 0) + 1);
    games.set(b.id, (games.get(b.id) ?? 0) + 1);
  }

  return sims;
}

function simulateTournamentAndCollect(seededTop64, counters, { matchNoiseStd = 15 } = {}) {
  const simMatch = (p1, p2) => {
    if (!p1) return p2;
    if (!p2) return p1;
    const p = eloWinProb(p1.elo, p2.elo, matchNoiseStd);
    return Math.random() < p ? p1 : p2;
  };

  const seedPairs = [[0, 15], [7, 8], [4, 11], [3, 12], [5, 10], [2, 13], [6, 9], [1, 14]];

  const regions = [0, 1, 2, 3].map((ri) =>
    seededTop64.filter((p) => p.regionIndex === ri).sort((a, b) => a.seed - b.seed).slice(0, 16)
  );

  const regionChamps = [];

  regions.forEach((region16) => {
    const r64Ordered = [];
    seedPairs.forEach(([a, b]) => {
      r64Ordered.push(region16[a] || null);
      r64Ordered.push(region16[b] || null);
    });

    const r32 = [];
    for (let i = 0; i < r64Ordered.length; i += 2) r32.push(simMatch(r64Ordered[i], r64Ordered[i + 1]));
    r32.forEach((p) => p && (counters[p.id].round32 += 1));

    const s16 = [];
    for (let i = 0; i < r32.length; i += 2) s16.push(simMatch(r32[i], r32[i + 1]));
    s16.forEach((p) => p && (counters[p.id].sweet16 += 1));

    const e8 = [];
    for (let i = 0; i < s16.length; i += 2) e8.push(simMatch(s16[i], s16[i + 1]));
    e8.forEach((p) => p && (counters[p.id].elite8 += 1));

    const champ = simMatch(e8[0], e8[1]);
    if (champ) regionChamps.push(champ);
  });

  regionChamps.forEach((p) => p && (counters[p.id].final4 += 1));

  const f1 = simMatch(regionChamps[0], regionChamps[1]);
  const f2 = simMatch(regionChamps[2], regionChamps[3]);
  if (f1) counters[f1.id].finals += 1;
  if (f2) counters[f2.id].finals += 1;

  const champ = simMatch(f1, f2);
  if (champ) counters[champ.id].win += 1;
}

function simulateSeasonPlusTournamentProbabilities(allPlayers, opts = {}) {
  const {
    numSimulations = 1000,
    seasonMatchesPerPlayer = 10,
    seasonK = 24,
    seasonMatchNoiseStd = 60,
    tournamentMatchNoiseStd = 15,
  } = opts;

  const counters = {};
  allPlayers.forEach((p) => {
    counters[p.id] = {
      makeTournament: 0,
      round64: 0,
      round32: 0,
      sweet16: 0,
      elite8: 0,
      final4: 0,
      finals: 0,
      win: 0,
    };
  });

  const base = allPlayers.map((p) => ({
    id: p.id,
    name: p.name,
    office: p.office,
    countryCode: p.countryCode,
    elo: p.elo,
  }));

  for (let sim = 0; sim < numSimulations; sim++) {
    const postSeason = simulateSeason(base, {
      seasonMatchesPerPlayer,
      K: seasonK,
      matchNoiseStd: seasonMatchNoiseStd,
    });

    const seededTop64 = [...postSeason]
      .sort((a, b) => b.elo - a.elo)
      .slice(0, 64)
      .map((p, index) => ({
        ...p,
        seed: Math.floor(index / 4) + 1,
        regionIndex: index % 4,
      }));

    seededTop64.forEach((p) => {
      counters[p.id].makeTournament += 1;
      counters[p.id].round64 += 1;
    });

    simulateTournamentAndCollect(seededTop64, counters, {
      matchNoiseStd: tournamentMatchNoiseStd,
    });
  }

  const probs = {};
  Object.entries(counters).forEach(([id, c]) => {
    probs[id] = {
      makeTournament: Math.round((c.makeTournament / numSimulations) * 100),
      round64: Math.round((c.round64 / numSimulations) * 100),
      round32: Math.round((c.round32 / numSimulations) * 100),
      sweet16: Math.round((c.sweet16 / numSimulations) * 100),
      elite8: Math.round((c.elite8 / numSimulations) * 100),
      final4: Math.round((c.final4 / numSimulations) * 100),
      finals: Math.round((c.finals / numSimulations) * 100),
      win: Math.round((c.win / numSimulations) * 100),
    };
  });

  return probs;
}

export default function PingPongELO() {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState("rankings");
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

  const [selectedWinner, setSelectedWinner] = useState("");
  const [selectedLoser, setSelectedLoser] = useState("");
  const [winnerScore, setWinnerScore] = useState("");
  const [loserScore, setLoserScore] = useState("");
  const [matchDate, setMatchDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerCountry, setNewPlayerCountry] = useState("");
  const [newPlayerOffice, setNewPlayerOffice] = useState("");

  const [activeTab, setActiveTab] = useState("match");
  const [sortColumn, setSortColumn] = useState("rank");
  const [sortDirection, setSortDirection] = useState("asc");

  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editOffice, setEditOffice] = useState("");

  const [hoveredPlayer, setHoveredPlayer] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [hoveredPointElo, setHoveredPointElo] = useState(null);
  const [hoveredPointDate, setHoveredPointDate] = useState(null);

  // Store tournament probabilities
  const [seasonProbs, setSeasonProbs] = useState({});
  const [probsLoading, setProbsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Simulate tournament probabilities
  useEffect(() => {
    if (!players || players.length === 0) return;

    setProbsLoading(true);
    setTimeout(() => {
      try {
        const eligiblePlayers = players.filter(p => (p.wins + p.losses) >= MIN_GAMES_FOR_QUALIFICATION);
        const probs = simulateSeasonPlusTournamentProbabilities(eligiblePlayers, {
          numSimulations: 1000,
          seasonMatchesPerPlayer: 100,
          seasonK: 24,
          seasonMatchNoiseStd: 60,
          tournamentMatchNoiseStd: 15,
        });
        setSeasonProbs(probs);
      } finally {
        setProbsLoading(false);
      }
    }, 0);
  }, [players]);


  const loadData = async () => {
    try {
      setLoading(true);
      console.log('📡 Loading data from GitHub...');

      const response = await fetch('/api/load-data');

      if (response.ok) {
        const data = await response.json();
        setPlayers(data.players || []);
        setMatches(data.matches || []);
        console.log('✅ Loaded:', data.players?.length || 0, 'players');
      } else {
        console.error('❌ Load failed');
        alert('Failed to load data. Please refresh.');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      alert(`Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };


  // K-factor based on games played — new players converge fast, veterans are stable
  const getKFactor = (gamesPlayed) => {
    if (gamesPlayed < 5) return 40;
    if (gamesPlayed < 15) return 32;
    if (gamesPlayed < 30) return 24;
    return 20;
  };

  const calculateELO = (winnerELO, loserELO, winnerScoreVal = null, loserScoreVal = null, winnerGamesPlayed = 0, loserGamesPlayed = 0) => {
    const expectedWinner = 1 / (1 + Math.pow(10, (loserELO - winnerELO) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winnerELO - loserELO) / 400));

    // Use the less experienced player's K-factor so new player matches have fair impact
    const K = getKFactor(Math.min(winnerGamesPlayed, loserGamesPlayed));

    let adjustedK = K;
    if (winnerScoreVal !== null && loserScoreVal !== null) {
      const scoreDiff = winnerScoreVal - loserScoreVal;
      const movMultiplier = Math.log(Math.abs(scoreDiff) + 1) * (2.2 / ((winnerELO - loserELO) * 0.001 + 2.2));
      adjustedK = K * (1 + movMultiplier * 0.5);
      adjustedK = Math.min(adjustedK, K * 1.75);
      adjustedK = Math.max(adjustedK, K * 0.5);
    }

    // Asymmetric K: winners gain slightly more than losers drop (1.1x / 0.9x)
    // Incentivises playing — top players aren't punished for taking on lower opponents
    const winnerK = adjustedK * 1.1;
    const loserK = adjustedK * 0.9;

    return {
      winnerNew: Math.round(winnerELO + winnerK * (1 - expectedWinner)),
      loserNew: Math.round(loserELO + loserK * (0 - expectedLoser)),
      kFactorUsed: adjustedK,
      expectedWinProbability: expectedWinner,
    };
  };

  const calculateRankChanges = (updatedPlayers) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return updatedPlayers.map((player) => {
      const weekAgoHistory = player.eloHistory.filter((h) => new Date(h.timestamp) <= oneWeekAgo);
      const weekAgoELO = weekAgoHistory.length > 0 ? weekAgoHistory[weekAgoHistory.length - 1].elo : player.eloHistory[0]?.elo || 1500;

      const weekAgoRankings = updatedPlayers.map((p) => {
        const pWeekAgoHistory = p.eloHistory.filter((h) => new Date(h.timestamp) <= oneWeekAgo);
        const pWeekAgoELO = pWeekAgoHistory.length > 0 ? pWeekAgoHistory[pWeekAgoHistory.length - 1].elo : p.eloHistory[0]?.elo || 1500;
        return { id: p.id, elo: pWeekAgoELO };
      }).sort((a, b) => b.elo - a.elo);

      const weekAgoRank = weekAgoRankings.findIndex((p) => p.id === player.id) + 1;
      return { ...player, lastWeekRank: weekAgoRank };
    });
  };

  const recordMatch = async () => {
    if (!selectedWinner || !selectedLoser || selectedWinner === selectedLoser) return;

    const winnerScoreNum = winnerScore ? parseInt(winnerScore, 10) : null;
    const loserScoreNum = loserScore ? parseInt(loserScore, 10) : null;

    if (winnerScoreNum !== null && loserScoreNum !== null) {
      if (winnerScoreNum <= loserScoreNum) return alert("Winner score must be greater than loser score");
      if (winnerScoreNum < 0 || loserScoreNum < 0) return alert("Scores must be positive numbers");
    }

    setSaving(true);
    try {
      const response = await fetch('/api/record-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winnerId: selectedWinner,
          loserId: selectedLoser,
          winnerScore: winnerScoreNum,
          loserScore: loserScoreNum,
          matchDate: matchDate || null,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setPlayers(result.players);
        setMatches(result.matches);
        setSelectedWinner("");
        setSelectedLoser("");
        setWinnerScore("");
        setLoserScore("");
        setMatchDate("");
        setSidebarOpen(false);
      } else {
        alert(`Failed to record match: ${result.error}`);
      }
    } catch (error) {
      alert(`Network error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const addPlayer = async () => {
    if (!newPlayerName.trim() || !newPlayerCountry || !newPlayerOffice) return;

    setSaving(true);
    try {
      const response = await fetch('/api/add-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPlayerName.trim(),
          countryCode: newPlayerCountry,
          office: newPlayerOffice,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setPlayers(result.players);
        setMatches(result.matches);
        setNewPlayerName("");
        setNewPlayerCountry("");
        setNewPlayerOffice("");
      } else {
        alert(`Failed to add player: ${result.error}`);
      }
    } catch (error) {
      alert(`Network error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const startEditPlayer = (player) => {
    setEditingPlayer(player.id);
    setEditName(player.name);
    setEditCountry(player.countryCode);
    setEditOffice(player.office);
    setActiveTab("edit");
    setSidebarOpen(true);
  };

  const saveEditPlayer = async () => {
    if (!editName.trim() || !editCountry || !editOffice) return;

    setSaving(true);
    try {
      const response = await fetch('/api/edit-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: editingPlayer,
          name: editName.trim(),
          countryCode: editCountry,
          office: editOffice,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setPlayers(result.players);
        setMatches(result.matches);
        setEditingPlayer(null);
        setEditName("");
        setEditCountry("");
        setEditOffice("");
        setActiveTab("match");
      } else {
        alert(`Failed to edit player: ${result.error}`);
      }
    } catch (error) {
      alert(`Network error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditingPlayer(null);
    setEditName("");
    setEditCountry("");
    setEditOffice("");
    setActiveTab("match");
  };

  const deleteMatch = async (matchId) => {
    if (!window.confirm("Delete this match? This will recalculate all ELO ratings.")) return;

    setSaving(true);
    try {
      const response = await fetch('/api/delete-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId }),
      });

      const result = await response.json();

      if (response.ok) {
        setPlayers(result.players);
        setMatches(result.matches);
      } else {
        alert(`Failed to delete match: ${result.error}`);
      }
    } catch (error) {
      alert(`Network error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection(column === "rank" ? "asc" : "desc");
    }
  };

  const getSortedPlayers = () => {
    const playersCopy = players.map((p) => ({ ...p }));
    const playersWithRanks = calculateRankChanges(playersCopy);
    const rankedPlayers = [...playersWithRanks].sort((a, b) => b.elo - a.elo);

    const playersWithData = playersWithRanks.map((player) => {
      const rank = rankedPlayers.findIndex((p) => p.id === player.id) + 1;
      
      // Get player's matches (sorted by date, most recent first)
      const playerMatches = matches
        .filter(m => m.winnerId === player.id || m.loserId === player.id)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Recent form (last 5 matches)
      const recentMatches = playerMatches.slice(0, 5).map(m => m.winnerId === player.id ? 'W' : 'L');
      
      // Clutch % (close games = decided by 2 points or less)
      const closeGames = playerMatches.filter(m => {
        if (m.winnerScore === null || m.loserScore === null) return false;
        return Math.abs(m.winnerScore - m.loserScore) <= 2;
      });
      const closeGameWins = closeGames.filter(m => m.winnerId === player.id).length;
      const closeGameLosses = closeGames.length - closeGameWins;
      
      // Efficiency (actual wins vs expected wins)
      let expectedWins = 0;
      playerMatches.forEach(m => {
        if (m.expectedWinProbability) {
          if (m.winnerId === player.id) {
            expectedWins += m.expectedWinProbability;
          } else {
            expectedWins += (1 - m.expectedWinProbability);
          }
        }
      });
      
      // Points differential
      let pointsFor = 0;
      let pointsAgainst = 0;
      playerMatches.forEach(m => {
        if (m.winnerScore !== null && m.loserScore !== null) {
          if (m.winnerId === player.id) {
            pointsFor += m.winnerScore;
            pointsAgainst += m.loserScore;
          } else {
            pointsFor += m.loserScore;
            pointsAgainst += m.winnerScore;
          }
        }
      });

      return { 
        ...player, 
        rank,
        recentMatches,
        closeGameWins,
        closeGameLosses,
        expectedWins,
        pointsFor,
        pointsAgainst,
        bettingOdds: probabilityToOdds((seasonProbs[player.id]?.win || 0)),
      };
    });

    return [...playersWithData].sort((a, b) => {
      let compareA, compareB;

      // When sorting by rank, push unqualified players (<MIN_GAMES games) below qualified ones
      const aQualified = (a.wins + a.losses) >= MIN_GAMES_FOR_QUALIFICATION;
      const bQualified = (b.wins + b.losses) >= MIN_GAMES_FOR_QUALIFICATION;

      switch (sortColumn) {
        case "rank":
          if (aQualified !== bQualified) {
            return aQualified ? -1 : 1;
          }
          compareA = a.rank;
          compareB = b.rank;
          break;
        case "name":
          compareA = a.name.toLowerCase();
          compareB = b.name.toLowerCase();
          break;
        case "elo":
          compareA = a.elo;
          compareB = b.elo;
          break;
        case "winRate":
          compareA = a.wins / (a.wins + a.losses || 1);
          compareB = b.wins / (b.wins + b.losses || 1);
          break;
        case "clutch":
          const aClutch = (a.closeGameWins + a.closeGameLosses) > 0 ? a.closeGameWins / (a.closeGameWins + a.closeGameLosses) : 0;
          const bClutch = (b.closeGameWins + b.closeGameLosses) > 0 ? b.closeGameWins / (b.closeGameWins + b.closeGameLosses) : 0;
          compareA = aClutch;
          compareB = bClutch;
          break;
        case "efficiency":
          compareA = a.wins - a.expectedWins;
          compareB = b.wins - b.expectedWins;
          break;
        case "pointsDiff":
          compareA = a.pointsFor - a.pointsAgainst;
          compareB = b.pointsFor - b.pointsAgainst;
          break;
        case "gp":
          compareA = a.wins + a.losses;
          compareB = b.wins + b.losses;
          break;
        case "bettingOdds":
          compareA = a.bettingOdds;
          compareB = b.bettingOdds;
          break;
        default:
          return 0;
      }

      if (sortDirection === "asc") return compareA > compareB ? 1 : compareA < compareB ? -1 : 0;
      return compareA < compareB ? 1 : compareA > compareB ? -1 : 0;
    });
  };

  const sortedPlayers = getSortedPlayers();

  // Sort matches by date (most recent first)
  const sortedMatches = [...matches].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };
  
  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase();
  };

  const SortableHeader = ({ column, children, align = "left" }) => (
    <th
      className={`py-4 ${align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"} ${column === "rank" ? "pr-6 min-w-[120px]" : "px-6"} text-sm font-normal text-gray-500 uppercase tracking-wide cursor-pointer hover:bg-gray-50 transition-colors select-none`}
      onClick={() => handleSort(column)}
    >
      <div className={`flex items-center gap-2 ${align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start"} whitespace-nowrap`}>
        {children}
        {sortColumn === column && (sortDirection === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
      </div>
    </th>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // =========================
  // PLAYER DETAIL VIEW
  // =========================
  if (currentView === "player" && selectedPlayerId) {
    const player = players.find(p => p.id === selectedPlayerId);
    if (!player) {
      setCurrentView("rankings");
      return null;
    }

    // Calculate proper rank for this player
    const rankedPlayers = [...players].sort((a, b) => b.elo - a.elo);
    const playerRank = rankedPlayers.findIndex(p => p.id === selectedPlayerId) + 1;

    const playerMatches = matches
      .filter(m => m.winnerId === selectedPlayerId || m.loserId === selectedPlayerId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const countryData = COUNTRIES.find(c => c.code === player.countryCode);

    // Extend each player's history to current date with their current ELO
    const currentDate = new Date().toISOString();
    
    const extendHistoryToNow = (eloHistory, currentElo, joinedAt) => {
      if (!eloHistory || eloHistory.length === 0) {
        return [{ elo: currentElo, timestamp: currentDate }];
      }
      
      // Sort by timestamp to ensure chronological order
      const sortedHistory = [...eloHistory].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      // Filter out the initial 1500 starting point (matches joinedAt timestamp and elo of 1500)
      // This is the point created when the player first joins, before any matches
      const filteredHistory = sortedHistory.filter(entry => {
        // Keep entries that are NOT the initial starting point
        const isStartingPoint = entry.elo === 1500 && entry.timestamp === joinedAt;
        return !isStartingPoint;
      });
      
      if (filteredHistory.length === 0) {
        return [{ elo: currentElo, timestamp: currentDate }];
      }
      
      const lastEntry = filteredHistory[filteredHistory.length - 1];
      const lastTimestamp = new Date(lastEntry.timestamp);
      const now = new Date();
      
      // If last entry is not today, add a point for today with same ELO
      if (lastTimestamp.toDateString() !== now.toDateString()) {
        return [...filteredHistory, { elo: currentElo, timestamp: currentDate }];
      }
      
      return filteredHistory;
    };

    // Use raw ELO history for the chart extended to current date
    const currentPlayerHistory = extendHistoryToNow(player.eloHistory, player.elo, player.joinedAt);
    const allPlayerHistories = players.map(p => ({
      ...p,
      history: extendHistoryToNow(p.eloHistory, p.elo, p.joinedAt)
    }));

    // Get min and max ELO across all players for chart scaling
    const allEloValues = allPlayerHistories.flatMap(p => p.history.map(h => h.elo));
    const minElo = Math.min(...allEloValues, 1300);
    const maxElo = Math.max(...allEloValues, 1700);
    const eloRange = maxElo - minElo;

    // Chart dimensions - use full container width
    const chartWidth = 1200; // Increased from 800 for full width
    const chartHeight = 400;
    const padding = { top: 40, right: 40, bottom: 60, left: 60 };
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;

    // Get time range
    const allTimestamps = allPlayerHistories.flatMap(p => p.history.map(h => new Date(h.timestamp).getTime()));
    const minTime = Math.min(...allTimestamps);
    const maxTime = Math.max(...allTimestamps);
    const timeRange = maxTime - minTime || 1;

    const xScale = (timestamp) => {
      const time = new Date(timestamp).getTime();
      return padding.left + ((time - minTime) / timeRange) * innerWidth;
    };

    const yScale = (elo) => {
      return chartHeight - padding.bottom - ((elo - minElo) / eloRange) * innerHeight;
    };

    // Create path for a player's ELO history
    const createPath = (eloHistory) => {
      if (eloHistory.length === 0) return "";
      
      let path = `M ${xScale(eloHistory[0].timestamp)} ${yScale(eloHistory[0].elo)}`;
      for (let i = 1; i < eloHistory.length; i++) {
        path += ` L ${xScale(eloHistory[i].timestamp)} ${yScale(eloHistory[i].elo)}`;
      }
      return path;
    };

    // Grid lines (horizontal)
    const gridLines = [];
    const numGridLines = 5;
    for (let i = 0; i <= numGridLines; i++) {
      const elo = minElo + (eloRange * i / numGridLines);
      const y = yScale(elo);
      gridLines.push(
        <g key={i}>
          <line
            x1={padding.left}
            y1={y}
            x2={chartWidth - padding.right}
            y2={y}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
          <text
            x={padding.left - 10}
            y={y}
            textAnchor="end"
            alignmentBaseline="middle"
            fill="#9ca3af"
            fontSize="12"
            fontFamily="sans-serif"
          >
            {Math.round(elo)}
          </text>
        </g>
      );
    }

    return (
      <div className="min-h-screen bg-white">
        <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;700;900&display=swap" rel="stylesheet" />

        <div className="border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <button
              onClick={() => {
                setCurrentView("rankings");
                setSelectedPlayerId(null);
              }}
              className="text-gray-600 hover:text-black mb-6 flex items-center gap-2"
              style={{ fontFamily: "sans-serif" }}
            >
              ← Back to Rankings
            </button>

            <div className="flex items-center gap-4 mb-4">
              <img
                src={`https://flagcdn.com/w40/${player.countryCode}.png`}
                width="48"
                height="36"
                alt={countryData?.name || "Flag"}
                title={countryData?.name || ""}
                style={{ objectFit: "cover" }}
              />
              <div>
                <h1 className="text-6xl font-black" style={{ fontFamily: "monospace", letterSpacing: "-0.02em" }}>
                  {player.name}
                </h1>
                <p className="text-xl text-gray-500 mt-2" style={{ fontFamily: "monospace" }}>
                  {player.office} • Current ELO: {player.elo}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-6 mt-6">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-500 uppercase tracking-wide mb-1" style={{ fontFamily: "monospace" }}>
                  Current Rank
                </div>
                <div className="text-3xl font-bold text-gray-900" style={{ fontFamily: "monospace" }}>
                  #{playerRank}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-500 uppercase tracking-wide mb-1" style={{ fontFamily: "monospace" }}>
                  Record
                </div>
                <div className="text-3xl font-bold text-gray-900" style={{ fontFamily: "monospace" }}>
                  {player.wins}-{player.losses}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-500 uppercase tracking-wide mb-1" style={{ fontFamily: "monospace" }}>
                  Win Rate
                </div>
                <div className="text-3xl font-bold text-gray-900" style={{ fontFamily: "monospace" }}>
                  {player.wins + player.losses > 0 ? Math.round((player.wins / (player.wins + player.losses)) * 100) : 0}%
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-500 uppercase tracking-wide mb-1" style={{ fontFamily: "monospace" }}>
                  Total Matches
                </div>
                <div className="text-3xl font-bold text-gray-900" style={{ fontFamily: "monospace" }}>
                  {player.wins + player.losses}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-12">
          <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: "Figtree, sans-serif" }}>
            ELO Rating Over Time
          </h2>

          <div className="bg-white border border-gray-200 rounded-lg p-8 mb-12 relative overflow-x-auto">
            <div className="flex justify-center">
              <svg 
                width={chartWidth} 
                height={chartHeight}
                onMouseLeave={() => {
                  setHoveredPlayer(null);
                  setHoveredPointElo(null);
                  setHoveredPointDate(null);
                }}
              >
              {/* Grid lines */}
              {gridLines}

              {/* Background lines for all other players with hover */}
              {allPlayerHistories
                .filter(p => p.id !== selectedPlayerId)
                .map(p => {
                  const findClosestPoint = (clientX, svg) => {
                    const rect = svg.getBoundingClientRect();
                    const x = clientX - rect.left;
                    
                    let closestPoint = null;
                    let closestDistance = Infinity;
                    
                    p.history.forEach(point => {
                      const px = xScale(point.timestamp);
                      const distance = Math.abs(px - x);
                      if (distance < closestDistance) {
                        closestDistance = distance;
                        closestPoint = point;
                      }
                    });
                    
                    return closestPoint;
                  };

                  return (
                    <g key={p.id}>
                      {/* Visible line */}
                      <path
                        d={createPath(p.history)}
                        stroke="#9ca3af"
                        strokeWidth="2"
                        fill="none"
                        pointerEvents="none"
                        style={{ 
                          opacity: hoveredPlayer?.name === p.name ? 1 : 0.4,
                          stroke: hoveredPlayer?.name === p.name ? '#6b7280' : '#9ca3af',
                          transition: 'all 0.2s'
                        }}
                      />
                      {/* Invisible wider hit area */}
                      <path
                        d={createPath(p.history)}
                        stroke="transparent"
                        strokeWidth="20"
                        fill="none"
                        onMouseEnter={(e) => {
                          const svg = e.currentTarget.ownerSVGElement;
                          const point = findClosestPoint(e.clientX, svg);
                          setHoveredPlayer({ name: p.name, elo: p.elo });
                          setHoveredPointElo(point?.elo || p.elo);
                          setHoveredPointDate(point?.timestamp || null);
                          setTooltipPos({ x: e.clientX, y: e.clientY });
                        }}
                        onMouseMove={(e) => {
                          const svg = e.currentTarget.ownerSVGElement;
                          const point = findClosestPoint(e.clientX, svg);
                          setHoveredPointElo(point?.elo || p.elo);
                          setHoveredPointDate(point?.timestamp || null);
                          setTooltipPos({ x: e.clientX, y: e.clientY });
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                    </g>
                  );
                })}

              {/* Highlighted line for selected player */}
              <g>
                <path
                  d={createPath(currentPlayerHistory)}
                  stroke="#e91e63"
                  strokeWidth="3"
                  fill="none"
                  pointerEvents="none"
                />
                <path
                  d={createPath(currentPlayerHistory)}
                  stroke="transparent"
                  strokeWidth="20"
                  fill="none"
                  onMouseEnter={(e) => {
                    const svg = e.currentTarget.ownerSVGElement;
                    const rect = svg.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    
                    let closestPoint = null;
                    let closestDistance = Infinity;
                    
                    currentPlayerHistory.forEach(point => {
                      const px = xScale(point.timestamp);
                      const distance = Math.abs(px - x);
                      if (distance < closestDistance) {
                        closestDistance = distance;
                        closestPoint = point;
                      }
                    });
                    
                    setHoveredPlayer({ name: player.name, elo: player.elo });
                    setHoveredPointElo(closestPoint?.elo || player.elo);
                    setHoveredPointDate(closestPoint?.timestamp || null);
                    setTooltipPos({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseMove={(e) => {
                    const svg = e.currentTarget.ownerSVGElement;
                    const rect = svg.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    
                    let closestPoint = null;
                    let closestDistance = Infinity;
                    
                    currentPlayerHistory.forEach(point => {
                      const px = xScale(point.timestamp);
                      const distance = Math.abs(px - x);
                      if (distance < closestDistance) {
                        closestDistance = distance;
                        closestPoint = point;
                      }
                    });
                    
                    setHoveredPointElo(closestPoint?.elo || player.elo);
                    setHoveredPointDate(closestPoint?.timestamp || null);
                    setTooltipPos({ x: e.clientX, y: e.clientY });
                  }}
                  style={{ cursor: 'pointer' }}
                />
              </g>

              {/* Axis labels */}
              <text
                x={padding.left}
                y={chartHeight - 20}
                fill="#6b7280"
                fontSize="12"
                fontFamily="monospace"
              >
                {formatDate(new Date(minTime).toISOString())}
              </text>
              <text
                x={chartWidth - padding.right - 10}
                y={chartHeight - 20}
                textAnchor="end"
                fill="#6b7280"
                fontSize="12"
                fontFamily="monospace"
              >
                {formatDate(new Date(maxTime).toISOString())}
              </text>
              <text
                x={chartWidth / 2}
                y={chartHeight - 20}
                textAnchor="middle"
                fill="#6b7280"
                fontSize="12"
                fontFamily="monospace"
                fontWeight="600"
              >
                Date
              </text>
              <text
                x={20}
                y={chartHeight / 2}
                textAnchor="middle"
                fill="#6b7280"
                fontSize="12"
                fontFamily="monospace"
                fontWeight="600"
                transform={`rotate(-90, 20, ${chartHeight / 2})`}
              >
                ELO Rating
              </text>
            </svg>
            </div>

            {/* Tooltip */}
            {hoveredPlayer && (
              <div
                className="fixed bg-gray-900 text-white px-3 py-2 rounded shadow-lg text-sm pointer-events-none z-50"
                style={{
                  left: `${tooltipPos.x + 10}px`,
                  top: `${tooltipPos.y - 10}px`,
                  fontFamily: 'monospace'
                }}
              >
                <div className="font-bold">{hoveredPlayer.name}</div>
                <div className="text-gray-300">ELO: {hoveredPointElo !== null ? hoveredPointElo : hoveredPlayer.elo}</div>
                {hoveredPointDate && (
                  <div className="text-gray-400 text-xs mt-1">{formatDate(hoveredPointDate)}</div>
                )}
              </div>
            )}

            <div className="mt-4 flex items-center gap-6 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-pink-600"></div>
                <span className="text-sm text-gray-600" style={{ fontFamily: "monospace" }}>
                  {player.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-gray-400"></div>
                <span className="text-sm text-gray-600" style={{ fontFamily: "monospace" }}>
                  Other Players
                </span>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: "Figtree, sans-serif" }}>
            Match History ({playerMatches.length} matches)
          </h2>

          {playerMatches.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg" style={{ fontFamily: "monospace" }}>No matches played yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {playerMatches.map((match) => {
                const isWinner = match.winnerId === selectedPlayerId;
                const opponent = isWinner 
                  ? players.find(p => p.id === match.loserId)
                  : players.find(p => p.id === match.winnerId);
                const opponentName = isWinner ? match.loser : match.winner;
                const playerScore = isWinner ? match.winnerScore : match.loserScore;
                const opponentScore = isWinner ? match.loserScore : match.winnerScore;
                const eloChange = isWinner ? match.winnerEloChange : match.loserEloChange;

                return (
                  <div 
                    key={match.id} 
                    className={`border-2 rounded-lg p-6 ${
                      isWinner ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <div className="flex-1 max-w-4xl">
                        <div className="text-xs uppercase tracking-wide mb-3 text-center" style={{ fontFamily: "monospace" }}>
                          <span className={isWinner ? 'text-green-700 font-bold' : 'text-red-700 font-bold'}>
                            {isWinner ? 'WIN' : 'LOSS'}
                          </span>
                          <span className="text-gray-500 mx-2">•</span>
                          <span className="text-gray-600">
                            {formatDate(match.timestamp)} at {formatTime(match.timestamp)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-center gap-6">
                          <div className="flex items-center gap-3">
                            <img
                              src={`https://flagcdn.com/w40/${player.countryCode}.png`}
                              width="24"
                              height="18"
                              alt="Flag"
                              className="flex-shrink-0"
                              style={{ objectFit: "cover" }}
                            />
                            <div className="font-semibold text-lg text-gray-900" style={{ fontFamily: "monospace" }}>
                              {player.name}
                            </div>
                            {playerScore !== null && (
                              <div className={`text-2xl font-bold ${isWinner ? 'text-green-700' : 'text-red-700'}`} style={{ fontFamily: "monospace" }}>
                                {playerScore}
                              </div>
                            )}
                          </div>

                          <div className="text-gray-400 font-bold text-xl px-4" style={{ fontFamily: "monospace" }}>vs</div>

                          <div className="flex items-center gap-3">
                            {opponentScore !== null && (
                              <div className="text-2xl font-bold text-gray-500" style={{ fontFamily: "monospace" }}>
                                {opponentScore}
                              </div>
                            )}
                            <div className="font-semibold text-lg text-gray-700" style={{ fontFamily: "monospace" }}>
                              {opponentName}
                            </div>
                            {opponent && (
                              <img
                                src={`https://flagcdn.com/w40/${opponent.countryCode}.png`}
                                width="24"
                                height="18"
                                alt="Flag"
                                className="flex-shrink-0"
                                style={{ objectFit: "cover" }}
                              />
                            )}
                          </div>
                        </div>

                        <div className={`mt-3 text-sm font-medium text-center ${
                          isWinner ? 'text-green-600' : 'text-red-600'
                        }`} style={{ fontFamily: "monospace" }}>
                          {eloChange > 0 ? '+' : ''}{eloChange} ELO
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500" style={{ fontFamily: "sans-serif" }}>
                <p>Isometric Table Tennis ELO System</p>
                <p className="mt-1">© 2026 Christopher Kilner</p>
              </div>
              <button
                onClick={() => {
                  setCurrentView("rankings");
                  setSelectedPlayerId(null);
                }}
                className="text-sm text-gray-600 hover:text-black underline"
                style={{ fontFamily: "sans-serif" }}
              >
                ← Back to Rankings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MATCHES VIEW
  if (currentView === "matches") {
    return (
      <div className="min-h-screen bg-white">
        <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;700;900&display=swap" rel="stylesheet" />
        <div className="border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <button onClick={() => setCurrentView("rankings")} className="text-gray-600 hover:text-black mb-6 flex items-center gap-2">
              ← Back to Rankings
            </button>
            <h1 className="text-6xl font-black mb-4" style={{ fontFamily: "Figtree, sans-serif" }}>Match History</h1>
            <p className="text-xl text-gray-700" style={{ fontFamily: "monospace" }}>Complete record of all {matches.length} matches.</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-12">
          {sortedMatches.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">No matches recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedMatches.map((match) => {
                const winner = players.find(p => p.id === match.winnerId);
                const loser = players.find(p => p.id === match.loserId);
                
                return (
                  <div key={match.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white group">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-3 uppercase tracking-wide">
                          {formatDate(match.timestamp)} at {formatTime(match.timestamp)}
                        </div>
                        
                        <div className="flex items-center gap-8">
                          <div className="flex items-center gap-3 flex-1">
                            {winner && (
                              <img src={`https://flagcdn.com/w40/${winner.countryCode}.png`} width="24" height="18" alt="Flag" className="flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <div className="font-semibold text-lg text-gray-900">{match.winner}</div>
                              <div className="text-sm text-green-600 font-medium">+{match.winnerEloChange} ELO</div>
                            </div>
                            {match.winnerScore !== null && (
                              <div className="text-2xl font-bold text-gray-900 min-w-[3rem] text-right">{match.winnerScore}</div>
                            )}
                          </div>

                          <div className="text-gray-400 font-bold text-xl px-4">vs</div>

                          <div className="flex items-center gap-3 flex-1">
                            {match.loserScore !== null && (
                              <div className="text-2xl font-bold text-gray-400 min-w-[3rem]">{match.loserScore}</div>
                            )}
                            <div className="flex-1">
                              <div className="font-semibold text-lg text-gray-600">{match.loser}</div>
                              <div className="text-sm text-red-600 font-medium">{match.loserEloChange} ELO</div>
                            </div>
                            {loser && (
                              <img src={`https://flagcdn.com/w40/${loser.countryCode}.png`} width="24" height="18" alt="Flag" className="flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      </div>

                      <button onClick={() => deleteMatch(match.id)} className="ml-6 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100" title="Delete match">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // RANKINGS VIEW
  return (
    <div className="min-h-screen bg-white">
      <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;700;900&display=swap" rel="stylesheet" />

      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-start justify-between mb-6">
            <div className="text-sm text-gray-500 uppercase tracking-wider">
              UPDATED {formatDate(new Date().toISOString())}, AT {formatTime(new Date().toISOString())}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setCurrentView("matches")} className="px-5 py-2 border border-black text-black text-sm font-medium hover:bg-gray-100 transition-colors">
                View Matches
              </button>
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="px-5 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors">
                + Record Match
              </button>
            </div>
          </div>

          <h1 className="text-6xl font-black mb-4" style={{ fontFamily: "Figtree, sans-serif" }}>
            Isometric Table Tennis Rankings
          </h1>

          <p className="text-xl text-gray-700" style={{ fontFamily: "Figtree, sans-serif" }}>
            How {players.length} players compare by ELO rating, updated after each match.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ fontFamily: "monospace" }}>
            <thead>
              <tr className="border-b border-gray-300">
                <SortableHeader column="rank">↑ Rank</SortableHeader>
                <SortableHeader column="name">Name</SortableHeader>
                <SortableHeader column="elo" align="right">ELO</SortableHeader>
                <SortableHeader column="form" align="center">Recent Form</SortableHeader>
                <SortableHeader column="winRate" align="center">Win Rate</SortableHeader>
                <SortableHeader column="efficiency" align="center">Efficiency</SortableHeader>
                <SortableHeader column="pointsDiff" align="center">Points Diff</SortableHeader>
                <SortableHeader column="bettingOdds" align="center">Odds</SortableHeader>
              </tr>
            </thead>

            <tbody>
              {sortedPlayers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-16 text-gray-400">
                    No players registered yet. Add a player to get started.
                  </td>
                </tr>
              ) : (
                (() => {
                  // Find the last qualified player to render the cutoff after (64th, or last if fewer)
                  const qualifiedByRank = sortedPlayers
                    .filter(p => (p.wins + p.losses) >= MIN_GAMES_FOR_QUALIFICATION)
                    .sort((a, b) => a.rank - b.rank);
                  const cutoffIndex = Math.min(63, qualifiedByRank.length - 1);
                  const cutoffPlayerId = cutoffIndex >= 0 ? qualifiedByRank[cutoffIndex].id : null;

                  return sortedPlayers.map((player) => {
                  const rankChange = player.lastWeekRank ? player.lastWeekRank - player.rank : 0;
                  const countryData = COUNTRIES.find((c) => c.code === player.countryCode);

                  const totalMatches = player.wins + player.losses;
                  const isQualified = totalMatches >= MIN_GAMES_FOR_QUALIFICATION;
                  const isCutoffPlayer = player.id === cutoffPlayerId;
                  const winRate = totalMatches > 0 ? ((player.wins / totalMatches) * 100).toFixed(1) : '0.0';

                  const pointsDiff = player.pointsFor - player.pointsAgainst;
                  const pointsDiffStr = pointsDiff > 0 ? `+${pointsDiff}` : pointsDiff.toString();

                  const performanceVsExpected = player.wins - player.expectedWins;
                  const performanceStr = performanceVsExpected > 0 ? `+${performanceVsExpected.toFixed(1)}` : performanceVsExpected.toFixed(1);

                  return (
                    <React.Fragment key={player.id}>
                      <tr className={`border-b border-gray-200 hover:bg-gray-50 transition-colors group${!isQualified ? ' opacity-40' : ''}`}>
                        <td className="py-3 pr-6">
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-normal text-gray-900 w-12">{player.rank}</span>
                            {rankChange > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-green-600 font-bold">▲</span>
                                <span className="text-sm font-normal text-green-600">{rankChange}</span>
                              </div>
                            )}
                            {rankChange < 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-red-600 font-bold">▼</span>
                                <span className="text-sm font-normal text-red-600">{Math.abs(rankChange)}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-6">
                          <div className="flex items-center gap-3">
                            <img
                              src={`https://flagcdn.com/24x18/${player.countryCode}.png`}
                              srcSet={`https://flagcdn.com/48x36/${player.countryCode}.png 2x`}
                              width="24"
                              height="18"
                              alt={countryData?.name || "Flag"}
                              className="flex-shrink-0"
                            />
<div className="flex items-center gap-2 min-w-0">
  <button
    onClick={() => {
      setSelectedPlayerId(player.id);
      setCurrentView("player");
    }}
    className="text-sm text-gray-900 whitespace-nowrap hover:text-pink-600 hover:underline transition-colors"
  >
    {player.name}
  </button>
  <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold flex-shrink-0">
    {player.office}
  </span>
</div>
                            <button
                              onClick={() => startEditPlayer(player)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                              title="Edit player"
                            >
                              <Edit2 size={14} className="text-gray-500" />
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-6 text-right">
                          <span className="text-lg font-normal text-gray-900">{player.elo}</span>
                        </td>

                        <td className="py-3 px-6">
                          <RecentFormBar matches={player.recentMatches} />
                        </td>

                        <td className="py-3 px-6 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-semibold text-gray-900">{winRate}%</span>
                            <span className="text-xs text-gray-400">{player.wins}-{player.losses}</span>
                          </div>
                        </td>

                        <td className="py-3 px-6 text-center">
                          <span className={`text-sm font-semibold ${
                            performanceVsExpected > 0.5 ? 'text-green-600' : 
                            performanceVsExpected < -0.5 ? 'text-red-600' : 
                            'text-gray-900'
                          }`}>
                            {performanceStr}
                          </span>
                        </td>

                        <td className="py-3 px-6 text-center">
                          <span className={`text-sm font-semibold ${
                            pointsDiff > 0 ? 'text-green-600' : pointsDiff < 0 ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {pointsDiffStr}
                          </span>
                        </td>

                        <td className="py-3 px-6 text-center">
                          <span className="text-sm font-mono font-semibold text-gray-900">
                            {player.bettingOdds || '+10000'}
                          </span>
                        </td>
                      </tr>

                      {isCutoffPlayer && (
                        <tr>
                          <td colSpan="8" className="p-0">
                            <div className="border-t-4 border-red-500 relative z-10">
                              <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4 py-1 border-2 border-red-500 rounded text-xs font-bold text-red-600 uppercase tracking-wider z-20">
                                Tournament Cutoff
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                });
                })()
              )}
            </tbody>
          </table>
        </div>

        {/* Explainer Section */}
<div className="max-w-7xl mx-auto px-8 py-12 border-t-2 border-gray-200">
  <h2 className="text-3xl font-bold mb-8" style={{ fontFamily: "Figtree, sans-serif" }}>
    How This Works
  </h2>

   <div className="grid md:grid-cols-2 gap-8">
    <div>
      <h3 className="text-xl font-bold mb-3 text-gray-900" style={{ fontFamily: "Figtree, sans-serif" }}>
        Efficiency
      </h3>
      <p className="text-gray-700 leading-relaxed" style={{ fontFamily: "sans-serif" }}>
        How many more (or fewer) games you've won compared to what your ELO predicted. Positive numbers mean you're overperforming.
      </p>
    </div>

    <div>
      <h3 className="text-xl font-bold mb-3 text-gray-900" style={{ fontFamily: "Figtree, sans-serif" }}>
        Odds
      </h3>
      <p className="text-gray-700 leading-relaxed" style={{ fontFamily: "sans-serif" }}>
        Betting odds for winning the 64-player tournament based on 1,000 simulated seasons and tournaments. +2500 means a $100 bet wins $2500. -200 means you need to bet $200 to win $100.
      </p>
    </div>
  </div>
</div>

        {/* Sidebar */}
        <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 border-l border-gray-200 ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="h-full flex flex-col">
            <div className="px-6 py-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Actions</h2>
              <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex border-b border-gray-200">
              <button onClick={() => { setActiveTab("match"); setEditingPlayer(null); }} className={`flex-1 px-6 py-4 font-semibold transition-colors ${activeTab === "match" ? "text-black border-b-2 border-black" : "text-gray-400 hover:text-gray-700"}`}>
                Record Match
              </button>
              <button onClick={() => { setActiveTab("player"); setEditingPlayer(null); }} className={`flex-1 px-6 py-4 font-semibold transition-colors ${activeTab === "player" ? "text-black border-b-2 border-black" : "text-gray-400 hover:text-gray-700"}`}>
                Add Player
              </button>
              {editingPlayer && (
                <button onClick={() => setActiveTab("edit")} className={`flex-1 px-6 py-4 font-semibold transition-colors ${activeTab === "edit" ? "text-black border-b-2 border-black" : "text-gray-400 hover:text-gray-700"}`}>
                  Edit Player
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "match" ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Winner</label>
                    <select value={selectedWinner} onChange={(e) => setSelectedWinner(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all">
                      <option value="">Select winner...</option>
                      {players.map((player) => (
                        <option key={player.id} value={player.id}>{player.name} ({player.office}) - ELO: {player.elo}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Loser</label>
                    <select value={selectedLoser} onChange={(e) => setSelectedLoser(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all">
                      <option value="">Select loser...</option>
                      {players.map((player) => (
                        <option key={player.id} value={player.id}>{player.name} ({player.office}) - ELO: {player.elo}</option>
                      ))}
                    </select>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Score (Optional)</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Winner Score</label>
                        <input type="number" min="0" value={winnerScore} onChange={(e) => setWinnerScore(e.target.value)} placeholder="21" className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Loser Score</label>
                        <input type="number" min="0" value={loserScore} onChange={(e) => setLoserScore(e.target.value)} placeholder="19" className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Match Date (Optional)</label>
                    <input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} max={new Date().toISOString().split("T")[0]} className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none" />
                    <p className="text-xs text-gray-500 mt-2">Leave blank to use today's date.</p>
                  </div>

                  <button onClick={recordMatch} disabled={saving || !selectedWinner || !selectedLoser || selectedWinner === selectedLoser} className="w-full px-6 py-3 bg-black text-white font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                    {saving ? 'Saving...' : 'Record Match'}
                  </button>
                </div>
              ) : activeTab === "edit" ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Player Name</label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                    <select value={editCountry} onChange={(e) => setEditCountry(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all">
                      <option value="">Select country...</option>
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>{country.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Office</label>
                    <select value={editOffice} onChange={(e) => setEditOffice(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all">
                      <option value="">Select office...</option>
                      {OFFICES.map((office) => (
                        <option key={office} value={office}>{office}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={saveEditPlayer} disabled={saving || !editName.trim() || !editCountry || !editOffice} className="flex-1 px-6 py-3 bg-black text-white font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button onClick={cancelEdit} className="px-6 py-3 border-2 border-gray-300 font-semibold hover:bg-gray-100 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Player Name</label>
                    <input type="text" value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Enter player name..." className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                    <select value={newPlayerCountry} onChange={(e) => setNewPlayerCountry(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all">
                      <option value="">Select country...</option>
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>{country.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Office</label>
                    <select value={newPlayerOffice} onChange={(e) => setNewPlayerOffice(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all">
                      <option value="">Select office...</option>
                      {OFFICES.map((office) => (
                        <option key={office} value={office}>{office}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-gray-100 p-4 rounded border border-gray-300">
                    <div className="text-sm text-gray-700">
                      <strong>Note:</strong> New players start with an ELO rating of 1500.
                    </div>
                  </div>

                  <button onClick={addPlayer} disabled={saving || !newPlayerName.trim() || !newPlayerCountry || !newPlayerOffice} className="w-full px-6 py-3 bg-black text-white font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                    {saving ? 'Saving...' : 'Add Player'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity" onClick={() => setSidebarOpen(false)} />}
      </div>
    </div>
  );
}
