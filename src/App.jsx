import React, { useState, useEffect, useMemo } from 'react';
import { X, ChevronUp, ChevronDown, Edit2 } from 'lucide-react';

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
  { name: 'Uzbekistan', code: 'uz' }, { name: 'Vanuatu', code: 'vu' }, { name: 'Vatican City', code: 'va' },
  { name: 'Venezuela', code: 've' }, { name: 'Vietnam', code: 'vn' }, { name: 'Wales', code: 'gb-wls' },
  { name: 'Yemen', code: 'ye' }, { name: 'Zambia', code: 'zm' }, { name: 'Zimbabwe', code: 'zw' }
];

const OFFICES = ["NYC", "LON"];

// GitHub configuration
const GITHUB_CONFIG = {
  owner: "ClassicCK",
  repo: "isometric-pingpong",
  branch: "main",
  filePath: "data/pingpong.json",
};

// =========================
// RANDOM / ELO HELPERS
// =========================
function randn() {
  // Box-Muller transform
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function eloWinProb(eloA, eloB, matchNoiseStd = 0) {
  // Match-day performance noise
  const a = eloA + randn() * matchNoiseStd;
  const b = eloB + randn() * matchNoiseStd;
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}

// =========================
// SEASON + TOURNAMENT SIMS
// =========================
function simulateSeason(players, { seasonMatchesPerPlayer = 10, K = 24, matchNoiseStd = 60 } = {}) {
  // Clone minimal player objects
  const sims = players.map((p) => ({ ...p }));
  const n = sims.length;
  const totalMatches = Math.max(0, Math.round((n * seasonMatchesPerPlayer) / 2));

  // Track games played to keep schedule roughly balanced
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

  // March Madness seed pairing (1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15)
  const seedPairs = [
    [0, 15],
    [7, 8],
    [4, 11],
    [3, 12],
    [5, 10],
    [2, 13],
    [6, 9],
    [1, 14],
  ];

  // regions built from regionIndex + seed
  const regions = [0, 1, 2, 3].map((ri) =>
    seededTop64
      .filter((p) => p.regionIndex === ri)
      .sort((a, b) => a.seed - b.seed)
      .slice(0, 16)
  );

  const regionChamps = [];

  regions.forEach((region16) => {
    const r64Ordered = [];
    seedPairs.forEach(([a, b]) => {
      r64Ordered.push(region16[a] || null);
      r64Ordered.push(region16[b] || null);
    });

    // R64 -> R32
    const r32 = [];
    for (let i = 0; i < r64Ordered.length; i += 2) r32.push(simMatch(r64Ordered[i], r64Ordered[i + 1]));
    r32.forEach((p) => p && (counters[p.id].round32 += 1));

    // R32 -> S16
    const s16 = [];
    for (let i = 0; i < r32.length; i += 2) s16.push(simMatch(r32[i], r32[i + 1]));
    s16.forEach((p) => p && (counters[p.id].sweet16 += 1));

    // S16 -> E8 (region finalists)
    const e8 = [];
    for (let i = 0; i < s16.length; i += 2) e8.push(simMatch(s16[i], s16[i + 1]));
    e8.forEach((p) => p && (counters[p.id].elite8 += 1));

    // E8 -> region champ
    const champ = simMatch(e8[0], e8[1]);
    if (champ) regionChamps.push(champ);
  });

  // Final Four (region champs)
  regionChamps.forEach((p) => p && (counters[p.id].final4 += 1));

  // Finals
  const f1 = simMatch(regionChamps[0], regionChamps[1]);
  const f2 = simMatch(regionChamps[2], regionChamps[3]);
  if (f1) counters[f1.id].finals += 1;
  if (f2) counters[f2.id].finals += 1;

  // Champion
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

  // init counters for everyone
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

  // Minimal player snapshot for speed
  const base = allPlayers.map((p) => ({
    id: p.id,
    name: p.name,
    office: p.office,
    countryCode: p.countryCode,
    elo: p.elo,
  }));

  for (let sim = 0; sim < numSimulations; sim++) {
    // 1) simulate season to get end-of-season Elo
    const postSeason = simulateSeason(base, {
      seasonMatchesPerPlayer,
      K: seasonK,
      matchNoiseStd: seasonMatchNoiseStd,
    });

    // 2) seed top 64 after season
    const seededTop64 = [...postSeason]
      .sort((a, b) => b.elo - a.elo)
      .slice(0, 64)
      .map((p, index) => ({
        ...p,
        seed: Math.floor(index / 4) + 1, // 1..16
        regionIndex: index % 4, // distribute seeds across 4 regions
      }));

    // everyone in the field made tournament + round64
    seededTop64.forEach((p) => {
      counters[p.id].makeTournament += 1;
      counters[p.id].round64 += 1;
    });

    // 3) simulate tournament
    simulateTournamentAndCollect(seededTop64, counters, {
      matchNoiseStd: tournamentMatchNoiseStd,
    });
  }

  // Convert to percent
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

// =========================
// UI COMPONENTS
// =========================
function ProbabilityCell({ probability }) {
  const getBackgroundColor = (prob) => {
    if (prob === 0) return "#ffffff";
    const white = { r: 255, g: 255, b: 255 };
    const middle = { r: 249, g: 223, b: 226 };
    const dark = { r: 233, g: 30, b: 99 };

    let color;
    if (prob <= 50) {
      const t = prob / 50;
      color = {
        r: Math.round(white.r + (middle.r - white.r) * t),
        g: Math.round(white.g + (middle.g - white.g) * t),
        b: Math.round(white.b + (middle.b - white.b) * t),
      };
    } else {
      const t = (prob - 50) / 50;
      color = {
        r: Math.round(middle.r + (dark.r - middle.r) * t),
        g: Math.round(middle.g + (dark.g - middle.g) * t),
        b: Math.round(middle.b + (dark.b - middle.b) * t),
      };
    }
    return `rgb(${color.r}, ${color.g}, ${color.b})`;
  };

  const bgColor = getBackgroundColor(probability);
  const textColor = probability > 60 ? "#ffffff" : "#000000";

  return (
    <div
      className="absolute inset-0 flex items-center justify-center px-2"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        fontFamily: "monospace",
        fontSize: "13px",
        whiteSpace: "nowrap",
      }}
    >
      {probability > 0 ? `${probability}%` : "—"}
    </div>
  );
}

// =========================
// MAIN APP
// =========================
export default function PingPongELO() {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState("rankings"); // "rankings" or "matches"

  const [selectedWinner, setSelectedWinner] = useState("");
  const [selectedLoser, setSelectedLoser] = useState("");
  const [winnerScore, setWinnerScore] = useState("");
  const [loserScore, setLoserScore] = useState("");
  const [matchDate, setMatchDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerCountry, setNewPlayerCountry] = useState("");
  const [newPlayerOffice, setNewPlayerOffice] = useState("");

  const [activeTab, setActiveTab] = useState("match");
  const [sortColumn, setSortColumn] = useState("rank");
  const [sortDirection, setSortDirection] = useState("asc");
  const [fileSha, setFileSha] = useState(null);

  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editOffice, setEditOffice] = useState("");

  // Store all-player season+tournament probabilities
  const [seasonProbs, setSeasonProbs] = useState({});
  const [probsLoading, setProbsLoading] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recompute "538-style" probabilities whenever Elo changes
  useEffect(() => {
    if (!players || players.length === 0) return;

    // Avoid locking the UI: kick to next tick
    setProbsLoading(true);
    setTimeout(() => {
      try {
        const probs = simulateSeasonPlusTournamentProbabilities(players, {
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

      // Check localStorage first (works everywhere)
      const localPlayers = localStorage.getItem("pingpong:players_v4");
      const localMatches = localStorage.getItem("pingpong:matches_v4");

      if (localPlayers && localMatches) {
        setPlayers(JSON.parse(localPlayers));
        setMatches(JSON.parse(localMatches));
        setLoading(false);
        return;
      }

      // If no local data and not localhost, try to load from GitHub
      if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
        try {
          const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.filePath}?ref=${GITHUB_CONFIG.branch}`;
          const response = await fetch(url);

          if (response.ok) {
            const fileData = await response.json();
            setFileSha(fileData.sha);

            const content = atob(fileData.content);
            const data = JSON.parse(content);

            setPlayers(data.players || []);
            setMatches(data.matches || []);
            
            // Save to localStorage for future use
            localStorage.setItem("pingpong:players_v4", JSON.stringify(data.players || []));
            localStorage.setItem("pingpong:matches_v4", JSON.stringify(data.matches || []));
          } else if (response.status === 404) {
            console.log("No data file found on GitHub, starting fresh");
          }
        } catch (error) {
          console.log("Could not load from GitHub, starting fresh");
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (newPlayers, newMatches) => {
    try {
      // For localhost, use localStorage
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        localStorage.setItem("pingpong:players_v4", JSON.stringify(newPlayers));
        localStorage.setItem("pingpong:matches_v4", JSON.stringify(newMatches));
        return;
      }

      // For production, save to localStorage as a backup
      // This allows the app to work without a backend
      localStorage.setItem("pingpong:players_v4", JSON.stringify(newPlayers));
      localStorage.setItem("pingpong:matches_v4", JSON.stringify(newMatches));
      
      console.log("Data saved to local storage");
      
      // Optionally try to save to GitHub via serverless function if available
      // This will fail silently if the function doesn't exist (e.g., on GitHub Pages)
      try {
        const response = await fetch("/api/save-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ players: newPlayers, matches: newMatches }),
        });

        if (response.ok) {
          const result = await response.json();
          setFileSha(result.sha);
          console.log("Data also saved to GitHub");
        }
      } catch (apiError) {
        // Silently fail - data is still saved in localStorage
        console.log("GitHub sync not available (using localStorage only)");
      }
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Failed to save data. Please try again.");
    }
  };

  const calculateELO = (winnerELO, loserELO, winnerScoreVal = null, loserScoreVal = null, K = 32) => {
    const expectedWinner = 1 / (1 + Math.pow(10, (loserELO - winnerELO) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winnerELO - loserELO) / 400));

    let adjustedK = K;
    if (winnerScoreVal !== null && loserScoreVal !== null) {
      const scoreDiff = winnerScoreVal - loserScoreVal;
      const movMultiplier =
        Math.log(Math.abs(scoreDiff) + 1) * (2.2 / ((winnerELO - loserELO) * 0.001 + 2.2));
      adjustedK = K * (1 + movMultiplier * 0.5);
      adjustedK = Math.min(adjustedK, K * 1.75);
      adjustedK = Math.max(adjustedK, K * 0.5);
    }

    return {
      winnerNew: Math.round(winnerELO + adjustedK * (1 - expectedWinner)),
      loserNew: Math.round(loserELO + adjustedK * (0 - expectedLoser)),
      kFactorUsed: adjustedK,
    };
  };

  const calculateRankChanges = (updatedPlayers) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return updatedPlayers.map((player) => {
      const weekAgoHistory = player.eloHistory.filter((h) => new Date(h.timestamp) <= oneWeekAgo);
      const weekAgoELO =
        weekAgoHistory.length > 0 ? weekAgoHistory[weekAgoHistory.length - 1].elo : player.eloHistory[0]?.elo || 1500;

      const weekAgoRankings = updatedPlayers
        .map((p) => {
          const pWeekAgoHistory = p.eloHistory.filter((h) => new Date(h.timestamp) <= oneWeekAgo);
          const pWeekAgoELO =
            pWeekAgoHistory.length > 0 ? pWeekAgoHistory[pWeekAgoHistory.length - 1].elo : p.eloHistory[0]?.elo || 1500;
          return { id: p.id, elo: pWeekAgoELO };
        })
        .sort((a, b) => b.elo - a.elo);

      const weekAgoRank = weekAgoRankings.findIndex((p) => p.id === player.id) + 1;
      return { ...player, lastWeekRank: weekAgoRank };
    });
  };

  const recordMatch = () => {
    if (!selectedWinner || !selectedLoser || selectedWinner === selectedLoser) return;

    const winner = players.find((p) => p.id === selectedWinner);
    const loser = players.find((p) => p.id === selectedLoser);
    if (!winner || !loser) {
      alert("Selected players not found");
      return;
    }

    const winnerScoreNum = winnerScore ? parseInt(winnerScore, 10) : null;
    const loserScoreNum = loserScore ? parseInt(loserScore, 10) : null;

    if (winnerScoreNum !== null && loserScoreNum !== null) {
      if (winnerScoreNum <= loserScoreNum) return alert("Winner score must be greater than loser score");
      if (winnerScoreNum < 0 || loserScoreNum < 0) return alert("Scores must be positive numbers");
    }

    const { winnerNew, loserNew } = calculateELO(winner.elo, loser.elo, winnerScoreNum, loserScoreNum);
    const timestamp = matchDate ? new Date(matchDate).toISOString() : new Date().toISOString();

    const updatedPlayers = players.map((p) => {
      if (p.id === selectedWinner) {
        return { ...p, elo: winnerNew, wins: p.wins + 1, eloHistory: [...p.eloHistory, { elo: winnerNew, timestamp }] };
      }
      if (p.id === selectedLoser) {
        return { ...p, elo: loserNew, losses: p.losses + 1, eloHistory: [...p.eloHistory, { elo: loserNew, timestamp }] };
      }
      return { ...p };
    });

    const playersWithRanks = calculateRankChanges(updatedPlayers);

    const newMatch = {
      id: Date.now().toString(),
      winnerId: selectedWinner,
      loserId: selectedLoser,
      winner: winner.name,
      loser: loser.name,
      winnerScore: winnerScoreNum,
      loserScore: loserScoreNum,
      winnerEloChange: winnerNew - winner.elo,
      loserEloChange: loserNew - loser.elo,
      timestamp,
    };

    const updatedMatches = [newMatch, ...matches];
    setPlayers(playersWithRanks);
    setMatches(updatedMatches);
    saveData(playersWithRanks, updatedMatches);

    setSelectedWinner("");
    setSelectedLoser("");
    setWinnerScore("");
    setLoserScore("");
    setMatchDate("");
    setSidebarOpen(false);
  };

  const addPlayer = () => {
    if (!newPlayerName.trim() || !newPlayerCountry || !newPlayerOffice) return;

    const newPlayer = {
      id: Date.now().toString(),
      name: newPlayerName.trim(),
      countryCode: newPlayerCountry,
      office: newPlayerOffice,
      elo: 1500,
      wins: 0,
      losses: 0,
      eloHistory: [{ elo: 1500, timestamp: new Date().toISOString() }],
      joinedAt: new Date().toISOString(),
      lastWeekRank: null,
    };

    const updatedPlayers = [...players, newPlayer];
    setPlayers(updatedPlayers);
    saveData(updatedPlayers, matches);

    setNewPlayerName("");
    setNewPlayerCountry("");
    setNewPlayerOffice("");
  };

  const startEditPlayer = (player) => {
    setEditingPlayer(player.id);
    setEditName(player.name);
    setEditCountry(player.countryCode);
    setEditOffice(player.office);
    setActiveTab("edit");
    setSidebarOpen(true);
  };

  const saveEditPlayer = () => {
    if (!editName.trim() || !editCountry || !editOffice) return;

    const updatedPlayers = players.map((p) =>
      p.id === editingPlayer ? { ...p, name: editName.trim(), countryCode: editCountry, office: editOffice } : p
    );

    setPlayers(updatedPlayers);
    saveData(updatedPlayers, matches);

    setEditingPlayer(null);
    setEditName("");
    setEditCountry("");
    setEditOffice("");
    setActiveTab("match");
  };

  const cancelEdit = () => {
    setEditingPlayer(null);
    setEditName("");
    setEditCountry("");
    setEditOffice("");
    setActiveTab("match");
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection(column === "rank" ? "asc" : "desc");
    }
  };

  const ZERO = useMemo(
    () => ({ makeTournament: 0, round64: 0, round32: 0, sweet16: 0, elite8: 0, final4: 0, finals: 0, win: 0 }),
    []
  );

  const getSortedPlayers = () => {
    const playersCopy = players.map((p) => ({ ...p }));
    const playersWithRanks = calculateRankChanges(playersCopy);
    const rankedPlayers = [...playersWithRanks].sort((a, b) => b.elo - a.elo);

    const playersWithData = playersWithRanks.map((player) => {
      const rank = rankedPlayers.findIndex((p) => p.id === player.id) + 1;
      const probabilities = seasonProbs[player.id] || ZERO;
      return { ...player, rank, probabilities };
    });

    return [...playersWithData].sort((a, b) => {
      let compareA, compareB;

      switch (sortColumn) {
        case "rank":
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
        case "makeTournament":
          compareA = a.probabilities.makeTournament;
          compareB = b.probabilities.makeTournament;
          break;
        case "round64":
          compareA = a.probabilities.round64;
          compareB = b.probabilities.round64;
          break;
        case "round32":
          compareA = a.probabilities.round32;
          compareB = b.probabilities.round32;
          break;
        case "sweet16":
          compareA = a.probabilities.sweet16;
          compareB = b.probabilities.sweet16;
          break;
        case "elite8":
          compareA = a.probabilities.elite8;
          compareB = b.probabilities.elite8;
          break;
        case "final4":
          compareA = a.probabilities.final4;
          compareB = b.probabilities.final4;
          break;
        case "finals":
          compareA = a.probabilities.finals;
          compareB = b.probabilities.finals;
          break;
        case "win":
          compareA = a.probabilities.win;
          compareB = b.probabilities.win;
          break;
        default:
          return 0;
      }

      if (sortDirection === "asc") return compareA > compareB ? 1 : compareA < compareB ? -1 : 0;
      return compareA < compareB ? 1 : compareA > compareB ? -1 : 0;
    });
  };

  const sortedPlayers = getSortedPlayers();

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
      className={`py-4 ${
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
      } ${column === "makeTournament" ? "border-l-2 border-gray-300" : ""} ${
        column === "rank" ? "pr-6 min-w-[120px]" : "px-6 px-0"
      } text-sm font-normal text-gray-500 uppercase tracking-wide cursor-pointer hover:bg-gray-50 transition-colors select-none`}
      onClick={() => handleSort(column)}
    >
      <div
        className={`flex items-center gap-2 ${
          align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start"
        } whitespace-nowrap`}
      >
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
  // RANKINGS VIEW
  // =========================
  if (currentView === "matches") {
    // Match History View
    return (
      <div className="min-h-screen bg-white">
        <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;700;900&display=swap" rel="stylesheet" />

        <div className="border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <button
              onClick={() => setCurrentView("rankings")}
              className="text-gray-600 hover:text-black mb-6 flex items-center gap-2"
              style={{ fontFamily: "sans-serif" }}
            >
              ← Back to Rankings
            </button>

            <h1 className="text-6xl font-black mb-4" style={{ fontFamily: "Figtree, sans-serif", letterSpacing: "-0.02em" }}>
              Match History
            </h1>

            <p className="text-xl text-gray-700" style={{ fontFamily: "Figtree, sans-serif" }}>
              Complete record of all {matches.length} matches and their impact on player ratings.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-12">
          {matches.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">No matches recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => {
                const matchDate = new Date(match.timestamp);
                const winner = players.find(p => p.id === match.winnerId);
                const loser = players.find(p => p.id === match.loserId);
                
                return (
                  <div 
                    key={match.id} 
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-3 uppercase tracking-wide" style={{ fontFamily: "sans-serif" }}>
                          {formatDate(match.timestamp)} at {formatTime(match.timestamp)}
                        </div>
                        
                        <div className="flex items-center gap-8">
                          {/* Winner */}
                          <div className="flex items-center gap-3 flex-1">
                            {winner && (
                              <img
                                src={`https://flagcdn.com/w40/${winner.countryCode}.png`}
                                width="24"
                                height="18"
                                alt="Flag"
                                className="flex-shrink-0"
                                style={{ objectFit: "cover" }}
                              />
                            )}
                            <div className="flex-1">
                              <div className="font-semibold text-lg text-gray-900" style={{ fontFamily: "Figtree, sans-serif" }}>
                                {match.winner}
                              </div>
                              <div className="text-sm text-green-600 font-medium">
                                +{match.winnerEloChange} ELO
                              </div>
                            </div>
                            {match.winnerScore !== null && (
                              <div className="text-2xl font-bold text-gray-900 min-w-[3rem] text-right" style={{ fontFamily: "Figtree, sans-serif" }}>
                                {match.winnerScore}
                              </div>
                            )}
                          </div>

                          <div className="text-gray-400 font-bold text-xl px-4">vs</div>

                          {/* Loser */}
                          <div className="flex items-center gap-3 flex-1">
                            {match.loserScore !== null && (
                              <div className="text-2xl font-bold text-gray-400 min-w-[3rem]" style={{ fontFamily: "Figtree, sans-serif" }}>
                                {match.loserScore}
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="font-semibold text-lg text-gray-600" style={{ fontFamily: "Figtree, sans-serif" }}>
                                {match.loser}
                              </div>
                              <div className="text-sm text-red-600 font-medium">
                                {match.loserEloChange} ELO
                              </div>
                            </div>
                            {loser && (
                              <img
                                src={`https://flagcdn.com/w40/${loser.countryCode}.png`}
                                width="24"
                                height="18"
                                alt="Flag"
                                className="flex-shrink-0"
                                style={{ objectFit: "cover" }}
                              />
                            )}
                          </div>
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
                onClick={() => setCurrentView("rankings")}
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

  // =========================
  // RANKINGS VIEW
  // =========================
  return (
    <div className="min-h-screen bg-white">
      <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;700;900&display=swap" rel="stylesheet" />

      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-start justify-between mb-6">
            <div className="text-sm text-gray-500 uppercase tracking-wider" style={{ fontFamily: "sans-serif", letterSpacing: "0.1em" }}>
              UPDATED {formatDate(new Date().toISOString())}, AT {formatTime(new Date().toISOString())}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="px-5 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
                style={{ fontFamily: "sans-serif" }}
              >
                + Record Match
              </button>
            </div>
          </div>

          <h1 className="text-6xl font-black mb-4" style={{ fontFamily: "Figtree, sans-serif", letterSpacing: "-0.02em" }}>
            Isometric Table Tennis Rankings
          </h1>

          <p className="text-xl text-gray-700" style={{ fontFamily: "Figtree, sans-serif" }}>
            How {players.length} players compare by ELO rating, updated after each match.
          </p>

          {probsLoading && (
            <div className="mt-3 text-sm text-gray-500" style={{ fontFamily: "sans-serif" }}>
              Updating probabilities (1,000 season+tournament simulations)…
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="flex items-end justify-between mb-3">
          <div className="flex-1"></div>
          <div className="text-center" style={{ flex: "0 0 auto", width: "calc(8 * 120px)" }}>
            <div className="text-sm text-gray-500 uppercase tracking-wide mb-2" style={{ fontFamily: "sans-serif" }}>
              Team Week Tournament Odds
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ fontFamily: "monospace" }}>
            <thead>
              <tr className="border-b border-gray-300">
                <SortableHeader column="rank">↑ Rank</SortableHeader>
                <SortableHeader column="name">Name</SortableHeader>
                <SortableHeader column="elo" align="right">ELO</SortableHeader>

                <SortableHeader column="makeTournament" align="center">
                  Make Tourn.
                </SortableHeader>
                <SortableHeader column="round64" align="center">
                  Rd. of 64
                </SortableHeader>
                <SortableHeader column="round32" align="center">
                  Rd. of 32
                </SortableHeader>
                <SortableHeader column="sweet16" align="center">
                  Sweet 16
                </SortableHeader>
                <SortableHeader column="elite8" align="center">
                  Elite 8
                </SortableHeader>
                <SortableHeader column="final4" align="center">
                  Final 4
                </SortableHeader>
                <SortableHeader column="finals" align="center">
                  Finals
                </SortableHeader>
                <SortableHeader column="win" align="center">
                  Win
                </SortableHeader>
              </tr>
            </thead>

            <tbody>
              {sortedPlayers.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center py-16 text-gray-400">
                    No players registered yet. Add a player to get started.
                  </td>
                </tr>
              ) : (
                sortedPlayers.map((player) => {
                  const rankChange = player.lastWeekRank ? player.lastWeekRank - player.rank : 0;
                  const countryData = COUNTRIES.find((c) => c.code === player.countryCode);
                  const isRank64 = player.rank === 64;

                  return (
                    <React.Fragment key={player.id}>
                      <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors group">
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
                              src={`https://flagcdn.com/w40/${player.countryCode}.png`}
                              width="24"
                              height="18"
                              alt={countryData?.name || "Flag"}
                              title={countryData?.name || ""}
                              className="flex-shrink-0"
                              style={{ objectFit: "cover" }}
                            />
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm text-gray-900 whitespace-nowrap">{player.name}</span>
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

                        {/* Make Tournament divider begins here */}
                        <td className="px-0 relative border-l-2 border-gray-300 align-middle">
                          <ProbabilityCell probability={player.probabilities.makeTournament} />
                        </td>
                        <td className="px-0 relative align-middle">
                          <ProbabilityCell probability={player.probabilities.round64} />
                        </td>
                        <td className="px-0 relative align-middle">
                          <ProbabilityCell probability={player.probabilities.round32} />
                        </td>
                        <td className="px-0 relative align-middle">
                          <ProbabilityCell probability={player.probabilities.sweet16} />
                        </td>
                        <td className="px-0 relative align-middle">
                          <ProbabilityCell probability={player.probabilities.elite8} />
                        </td>
                        <td className="px-0 relative align-middle">
                          <ProbabilityCell probability={player.probabilities.final4} />
                        </td>
                        <td className="px-0 relative align-middle">
                          <ProbabilityCell probability={player.probabilities.finals} />
                        </td>
                        <td className="px-0 relative align-middle">
                          <ProbabilityCell probability={player.probabilities.win} />
                        </td>
                      </tr>

                      {isRank64 && (
                        <tr>
                          <td colSpan="11" className="p-0">
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
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Sidebar / actions UI */}
        <div
          className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 border-l border-gray-200 ${
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="h-full flex flex-col">
            <div className="px-6 py-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "sans-serif" }}>
                Actions
              </h2>
              <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex border-b border-gray-200">
              <button
                onClick={() => {
                  setActiveTab("match");
                  setEditingPlayer(null);
                }}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  activeTab === "match" ? "text-black border-b-2 border-black" : "text-gray-400 hover:text-gray-700"
                }`}
                style={{ fontFamily: "sans-serif" }}
              >
                Record Match
              </button>
              <button
                onClick={() => {
                  setActiveTab("player");
                  setEditingPlayer(null);
                }}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  activeTab === "player" ? "text-black border-b-2 border-black" : "text-gray-400 hover:text-gray-700"
                }`}
                style={{ fontFamily: "sans-serif" }}
              >
                Add Player
              </button>
              {editingPlayer && (
                <button
                  onClick={() => setActiveTab("edit")}
                  className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                    activeTab === "edit" ? "text-black border-b-2 border-black" : "text-gray-400 hover:text-gray-700"
                  }`}
                  style={{ fontFamily: "sans-serif" }}
                >
                  Edit Player
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "match" ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: "sans-serif" }}>
                      Winner
                    </label>
                    <select
                      value={selectedWinner}
                      onChange={(e) => setSelectedWinner(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                      style={{ fontFamily: "sans-serif" }}
                    >
                      <option value="">Select winner...</option>
                      {players.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name} ({player.office}) - ELO: {player.elo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: "sans-serif" }}>
                      Loser
                    </label>
                    <select
                      value={selectedLoser}
                      onChange={(e) => setSelectedLoser(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                      style={{ fontFamily: "sans-serif" }}
                    >
                      <option value="">Select loser...</option>
                      {players.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name} ({player.office}) - ELO: {player.elo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: "sans-serif" }}>
                      Score (Optional)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Winner Score</label>
                        <input
                          type="number"
                          min="0"
                          value={winnerScore}
                          onChange={(e) => setWinnerScore(e.target.value)}
                          placeholder="21"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                          style={{ fontFamily: "sans-serif" }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Loser Score</label>
                        <input
                          type="number"
                          min="0"
                          value={loserScore}
                          onChange={(e) => setLoserScore(e.target.value)}
                          placeholder="19"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                          style={{ fontFamily: "sans-serif" }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: "sans-serif" }}>
                      Match Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={matchDate}
                      onChange={(e) => setMatchDate(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                      style={{ fontFamily: "sans-serif" }}
                    />
                    <p className="text-xs text-gray-500 mt-2">Leave blank to use today's date. Use this to add past matches.</p>
                  </div>

                  <button
                    onClick={recordMatch}
                    disabled={!selectedWinner || !selectedLoser || selectedWinner === selectedLoser}
                    className="w-full px-6 py-3 bg-black text-white font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    style={{ fontFamily: "sans-serif" }}
                  >
                    Record Match
                  </button>
                </div>
              ) : activeTab === "edit" ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: "sans-serif" }}>
                      Player Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                      style={{ fontFamily: "sans-serif" }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: "sans-serif" }}>
                      Country
                    </label>
                    <select
                      value={editCountry}
                      onChange={(e) => setEditCountry(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                      style={{ fontFamily: "sans-serif" }}
                    >
                      <option value="">Select country...</option>
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: "sans-serif" }}>
                      Office
                    </label>
                    <select
                      value={editOffice}
                      onChange={(e) => setEditOffice(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                      style={{ fontFamily: "sans-serif" }}
                    >
                      <option value="">Select office...</option>
                      {OFFICES.map((office) => (
                        <option key={office} value={office}>
                          {office}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={saveEditPlayer}
                      disabled={!editName.trim() || !editCountry || !editOffice}
                      className="flex-1 px-6 py-3 bg-black text-white font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      style={{ fontFamily: "sans-serif" }}
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-6 py-3 border-2 border-gray-300 font-semibold hover:bg-gray-100 transition-colors"
                      style={{ fontFamily: "sans-serif" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: "sans-serif" }}>
                      Player Name
                    </label>
                    <input
                      type="text"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      placeholder="Enter player name..."
                      className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                      style={{ fontFamily: "sans-serif" }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: "sans-serif" }}>
                      Country
                    </label>
                    <select
                      value={newPlayerCountry}
                      onChange={(e) => setNewPlayerCountry(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                      style={{ fontFamily: "sans-serif" }}
                    >
                      <option value="">Select country...</option>
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: "sans-serif" }}>
                      Office
                    </label>
                    <select
                      value={newPlayerOffice}
                      onChange={(e) => setNewPlayerOffice(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                      style={{ fontFamily: "sans-serif" }}
                    >
                      <option value="">Select office...</option>
                      {OFFICES.map((office) => (
                        <option key={office} value={office}>
                          {office}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-gray-100 p-4 rounded border border-gray-300">
                    <div className="text-sm text-gray-700" style={{ fontFamily: "sans-serif" }}>
                      <strong>Note:</strong> New players start with an ELO rating of 1500.
                    </div>
                  </div>

                  <button
                    onClick={addPlayer}
                    disabled={!newPlayerName.trim() || !newPlayerCountry || !newPlayerOffice}
                    className="w-full px-6 py-3 bg-black text-white font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    style={{ fontFamily: "sans-serif" }}
                  >
                    Add Player
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity" onClick={() => setSidebarOpen(false)} />}
      </div>

      {/* 538-style Explanation Section */}
      <div className="max-w-7xl mx-auto px-8 py-12 border-t-2 border-gray-200">
        <h2 className="text-3xl font-bold mb-8" style={{ fontFamily: "Figtree, sans-serif" }}>
          How This Works
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-3 text-gray-900" style={{ fontFamily: "Figtree, sans-serif" }}>
              The ELO Rating System
            </h3>
            <p className="text-gray-700 leading-relaxed mb-3" style={{ fontFamily: "sans-serif" }}>
              Every player starts with an ELO rating of 1,500. When you win a match, your rating goes up; when you lose, it goes down. 
              The amount of change depends on the difference between the two players' ratings — beating a higher-rated opponent 
              earns you more points than beating a lower-rated one.
            </p>
            <p className="text-gray-700 leading-relaxed" style={{ fontFamily: "sans-serif" }}>
              We also factor in the margin of victory. Winning 21-5 has a bigger impact on ratings than winning 21-19, 
              though this effect is capped to prevent extreme swings.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-3 text-gray-900" style={{ fontFamily: "Figtree, sans-serif" }}>
              Tournament Probability Model
            </h3>
            <p className="text-gray-700 leading-relaxed mb-3" style={{ fontFamily: "sans-serif" }}>
              To calculate tournament odds, we simulate the rest of the season and a 64-player tournament 1,000 times. 
              Each simulation plays out a full season of matches (with randomness to account for variance), then seeds 
              the top 64 players into a March Madness-style bracket.
            </p>
            <p className="text-gray-700 leading-relaxed" style={{ fontFamily: "sans-serif" }}>
              The percentages show how often each player reached each round across all simulations. A player with a 75% 
              chance to make the tournament made it into the top 64 in 750 of the 1,000 simulations.
            </p>
          </div>
        </div>

        <div className="bg-gray-100 border border-gray-300 rounded p-6">
          <h3 className="text-xl font-bold mb-3 text-gray-900" style={{ fontFamily: "Figtree, sans-serif" }}>
            Model Assumptions
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700" style={{ fontFamily: "sans-serif" }}>
            <div>
              <span className="font-semibold">Season Length:</span> Each player plays ~100 more matches before the tournament
            </div>
            <div>
              <span className="font-semibold">Match Variance:</span> Real-world performance varies ±60 ELO points per match
            </div>
            <div>
              <span className="font-semibold">Tournament Format:</span> Single elimination, 64 players, seeded by ELO
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500" style={{ fontFamily: "sans-serif" }}>
              <p>Isometric Table Tennis ELO System</p>
              <p className="mt-1">© 2026 Christopher Kilner</p>
            </div>
            <button
              onClick={() => setCurrentView("matches")}
              className="text-sm text-gray-600 hover:text-black underline"
              style={{ fontFamily: "sans-serif" }}
            >
              View Match History →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
