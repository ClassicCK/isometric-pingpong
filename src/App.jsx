import React, { useState, useEffect, useMemo } from 'react';
import { X, ChevronUp, ChevronDown, Edit2, ArrowLeft, KeyRound, Settings2 } from 'lucide-react';

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

const OFFICES = ['NYC', 'LON'];

// GitHub configuration
const GITHUB_CONFIG = {
  owner: 'ClassicCK',
  repo: 'isometric-pingpong',
  branch: 'main',
  filePath: 'data/pingpong.json'
};

// Local storage keys
const LS_PLAYERS = 'pingpong:players_v4';
const LS_MATCHES = 'pingpong:matches_v4';
const LS_GH_TOKEN = 'pingpong:github_token';

// Probability Cell Component
function ProbabilityCell({ probability }) {
  const getBackgroundColor = (prob) => {
    if (prob === 0) return '#ffffff';

    const white = { r: 255, g: 255, b: 255 };
    const middle = { r: 249, g: 223, b: 226 };
    const dark = { r: 233, g: 30, b: 99 };

    let color;
    if (prob <= 50) {
      const t = prob / 50;
      color = {
        r: Math.round(white.r + (middle.r - white.r) * t),
        g: Math.round(white.g + (middle.g - white.g) * t),
        b: Math.round(white.b + (middle.b - white.b) * t)
      };
    } else {
      const t = (prob - 50) / 50;
      color = {
        r: Math.round(middle.r + (dark.r - middle.r) * t),
        g: Math.round(middle.g + (dark.g - middle.g) * t),
        b: Math.round(middle.b + (dark.b - middle.b) * t)
      };
    }

    return `rgb(${color.r}, ${color.g}, ${color.b})`;
  };

  const bgColor = getBackgroundColor(probability);
  const textColor = probability > 60 ? '#ffffff' : '#000000';

  return (
    <div
      className="w-full h-full flex items-center justify-center py-5"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        fontFamily: 'monospace',
        fontSize: '14px'
      }}
    >
      {probability > 0 ? `${probability}%` : '—'}
    </div>
  );
}

// Bracket Player Component
function BracketPlayer({ player, seed, probability, showProbability = true }) {
  if (!player) {
    return (
      <div className="flex items-center justify-between h-8 px-2 bg-white border border-gray-300">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 w-4">{seed}</span>
          <span className="text-xs text-gray-400">TBD</span>
        </div>
      </div>
    );
  }

  const getBackgroundColor = (prob) => {
    if (prob === 0 || !showProbability) return '#ffffff';

    const white = { r: 255, g: 255, b: 255 };
    const middle = { r: 249, g: 223, b: 226 };
    const dark = { r: 233, g: 30, b: 99 };

    let color;
    if (prob <= 50) {
      const t = prob / 50;
      color = {
        r: Math.round(white.r + (middle.r - white.r) * t),
        g: Math.round(white.g + (middle.g - white.g) * t),
        b: Math.round(white.b + (middle.b - white.b) * t)
      };
    } else {
      const t = (prob - 50) / 50;
      color = {
        r: Math.round(middle.r + (dark.r - middle.r) * t),
        g: Math.round(middle.g + (dark.g - middle.g) * t),
        b: Math.round(middle.b + (dark.b - middle.b) * t)
      };
    }

    return `rgb(${color.r}, ${color.g}, ${color.b})`;
  };

  const bgColor = getBackgroundColor(probability);
  const textColor = probability > 60 && showProbability ? '#ffffff' : '#000000';
  const countryData = COUNTRIES.find(c => c.code === player.countryCode);

  return (
    <div
      className="flex items-center justify-between h-8 px-2 border border-gray-300 relative"
      style={{ backgroundColor: bgColor }}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0" style={{ color: textColor }}>
        <span className="text-xs font-semibold w-4 flex-shrink-0">{seed}</span>
        <img
          src={`https://flagcdn.com/16x12/${player.countryCode}.png`}
          srcSet={`https://flagcdn.com/32x24/${player.countryCode}.png 2x`}
          width="16"
          height="12"
          alt={countryData?.name || 'Flag'}
          className="flex-shrink-0"
        />
        <span className="text-xs font-medium truncate">{player.name}</span>
        <span className="text-xs uppercase opacity-70 flex-shrink-0">{player.office}</span>
      </div>
      {showProbability && probability > 0 && (
        <span className="text-xs ml-2 opacity-70 flex-shrink-0" style={{ color: textColor }}>
          {probability}%
        </span>
      )}
    </div>
  );
}

// Matchup Component
function Matchup({ player1, player2, seed1, seed2, prob1, prob2, showProbability = true }) {
  return (
    <div className="relative">
      <BracketPlayer player={player1} seed={seed1} probability={prob1} showProbability={showProbability} />
      <div className="h-px bg-gray-300"></div>
      <BracketPlayer player={player2} seed={seed2} probability={prob2} showProbability={showProbability} />
    </div>
  );
}

// Region Component (true March Madness seeding)
function Region({ regionName, players, flip = false }) {
  const playerArray = Array.isArray(players) ? players : [];

  // Standard pairing order for a 16-team region
  const SEED_ORDER = [1, 16, 8, 9, 5, 12, 4, 13, 6, 11, 3, 14, 7, 10, 2, 15];

  const bySeed = Array.from({ length: 17 }, () => null);
  for (const p of playerArray) {
    if (p?.seed >= 1 && p?.seed <= 16) bySeed[p.seed] = p;
  }

  const round64Matchups = [];
  for (let i = 0; i < SEED_ORDER.length; i += 2) {
    const seed1 = SEED_ORDER[i];
    const seed2 = SEED_ORDER[i + 1];
    round64Matchups.push({
      seed1,
      seed2,
      player1: bySeed[seed1] || null,
      player2: bySeed[seed2] || null
    });
  }

  return (
    <div className="flex-1">
      <h3
        className="text-lg font-bold mb-4 uppercase tracking-wide text-center"
        style={{ fontFamily: 'Figtree, sans-serif' }}
      >
        {regionName}
      </h3>

      <div className={`flex gap-6 ${flip ? 'flex-row-reverse' : ''}`}>
        <div className="flex-1">
          <div className="text-xs text-gray-500 uppercase mb-2 text-center" style={{ fontFamily: 'sans-serif' }}>
            Round of 64
          </div>
          <div className="space-y-4">
            {round64Matchups.map((matchup, idx) => (
              <Matchup
                key={idx}
                player1={matchup.player1}
                player2={matchup.player2}
                seed1={matchup.seed1}
                seed2={matchup.seed2}
                prob1={matchup.player1?.probabilities?.round32 || 0}
                prob2={matchup.player2?.probabilities?.round32 || 0}
              />
            ))}
          </div>
        </div>

        <div className="flex-1">
          <div className="text-xs text-gray-500 uppercase mb-2 text-center" style={{ fontFamily: 'sans-serif' }}>
            Round of 32
          </div>
          <div className="space-y-10" style={{ marginTop: '20px' }}>
            {Array.from({ length: 4 }).map((_, idx) => (
              <Matchup key={idx} player1={null} player2={null} seed1="—" seed2="—" showProbability={false} />
            ))}
          </div>
        </div>

        <div className="flex-1">
          <div className="text-xs text-gray-500 uppercase mb-2 text-center" style={{ fontFamily: 'sans-serif' }}>
            Sweet 16
          </div>
          <div className="space-y-24" style={{ marginTop: '48px' }}>
            {Array.from({ length: 2 }).map((_, idx) => (
              <Matchup key={idx} player1={null} player2={null} seed1="—" seed2="—" showProbability={false} />
            ))}
          </div>
        </div>

        <div className="flex-1">
          <div className="text-xs text-gray-500 uppercase mb-2 text-center" style={{ fontFamily: 'sans-serif' }}>
            Elite 8
          </div>
          <div style={{ marginTop: '104px' }}>
            <Matchup player1={null} player2={null} seed1="—" seed2="—" showProbability={false} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PingPongELO() {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [currentView, setCurrentView] = useState('rankings'); // 'rankings' or 'bracket'
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [selectedWinner, setSelectedWinner] = useState('');
  const [selectedLoser, setSelectedLoser] = useState('');
  const [winnerScore, setWinnerScore] = useState('');
  const [loserScore, setLoserScore] = useState('');
  const [matchDate, setMatchDate] = useState('');

  const [loading, setLoading] = useState(true);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerCountry, setNewPlayerCountry] = useState('');
  const [newPlayerOffice, setNewPlayerOffice] = useState('');

  const [activeTab, setActiveTab] = useState('match'); // match | player | edit | settings
  const [sortColumn, setSortColumn] = useState('rank');
  const [sortDirection, setSortDirection] = useState('asc');

  const [fileSha, setFileSha] = useState(null);

  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editOffice, setEditOffice] = useState('');

  // GitHub token stored locally (not in bundle)
  const [githubToken, setGithubToken] = useState(() => localStorage.getItem(LS_GH_TOKEN) || '');
  const [syncStatus, setSyncStatus] = useState({ ok: null, message: '' });

  // Bracket scale so it fits on one page
  const [bracketScale, setBracketScale] = useState(1);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentView !== 'bracket') return;

    const BASE_WIDTH = 2100; // adjust if you want it larger/smaller
    const onResize = () => {
      const available = Math.max(320, window.innerWidth - 64);
      setBracketScale(Math.min(1, available / BASE_WIDTH));
    };

    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [currentView]);

  const getAuthHeaders = () => {
    const token = (githubToken || '').trim();
    if (!token) return null;
    return {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Always try GitHub first (public read works without auth)
      const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.filePath}?ref=${GITHUB_CONFIG.branch}`;
      const response = await fetch(url);

      if (response.ok) {
        const fileData = await response.json();
        setFileSha(fileData.sha);

        const content = atob(fileData.content);
        const data = JSON.parse(content);

        const loadedPlayers = data.players || [];
        const loadedMatches = data.matches || [];

        setPlayers(loadedPlayers);
        setMatches(loadedMatches);

        // keep local mirror
        localStorage.setItem(LS_PLAYERS, JSON.stringify(loadedPlayers));
        localStorage.setItem(LS_MATCHES, JSON.stringify(loadedMatches));

        setSyncStatus({ ok: true, message: 'Loaded from GitHub.' });
        return;
      }

      // If GitHub load fails, fall back to local
      const localPlayers = localStorage.getItem(LS_PLAYERS);
      const localMatches = localStorage.getItem(LS_MATCHES);

      if (localPlayers) setPlayers(JSON.parse(localPlayers));
      if (localMatches) setMatches(JSON.parse(localMatches));

      setSyncStatus({ ok: false, message: `GitHub load failed (${response.status}). Using local data.` });
    } catch (error) {
      console.error('Error loading data:', error);

      const localPlayers = localStorage.getItem(LS_PLAYERS);
      const localMatches = localStorage.getItem(LS_MATCHES);

      if (localPlayers) setPlayers(JSON.parse(localPlayers));
      if (localMatches) setMatches(JSON.parse(localMatches));

      setSyncStatus({ ok: false, message: 'Load error. Using local data.' });
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (newPlayers, newMatches) => {
    // Always save locally as a backup
    localStorage.setItem(LS_PLAYERS, JSON.stringify(newPlayers));
    localStorage.setItem(LS_MATCHES, JSON.stringify(newMatches));

    const authHeaders = getAuthHeaders();
    if (!authHeaders) {
      setSyncStatus({
        ok: false,
        message: 'Saved locally. Add a GitHub token in Settings to sync to GitHub.'
      });
      return;
    }

    try {
      const data = {
        players: newPlayers,
        matches: newMatches,
        lastUpdated: new Date().toISOString()
      };

      const content = btoa(JSON.stringify(data, null, 2));

      const body = {
        message: `Update ping pong data - ${new Date().toLocaleString()}`,
        content,
        branch: GITHUB_CONFIG.branch
      };

      if (fileSha) body.sha = fileSha;

      const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.filePath}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const result = await response.json();
        setFileSha(result.content.sha);
        setSyncStatus({ ok: true, message: 'Synced to GitHub successfully.' });
      } else {
        const text = await response.text();
        console.error('Failed to save to GitHub:', text);
        setSyncStatus({
          ok: false,
          message: `Saved locally, GitHub sync failed (${response.status}). Check token permissions.`
        });
      }
    } catch (error) {
      console.error('Error saving data:', error);
      setSyncStatus({ ok: false, message: 'Saved locally, GitHub sync error.' });
    }
  };

  const calculateELO = (winnerELO, loserELO, winnerScoreVal = null, loserScoreVal = null, K = 32) => {
    const expectedWinner = 1 / (1 + Math.pow(10, (loserELO - winnerELO) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winnerELO - loserELO) / 400));

    let adjustedK = K;
    if (winnerScoreVal !== null && loserScoreVal !== null) {
      const scoreDiff = winnerScoreVal - loserScoreVal;
      const movMultiplier = Math.log(Math.abs(scoreDiff) + 1) * (2.2 / ((winnerELO - loserELO) * 0.001 + 2.2));
      adjustedK = K * (1 + movMultiplier * 0.5);
      adjustedK = Math.min(adjustedK, K * 1.75);
      adjustedK = Math.max(adjustedK, K * 0.5);
    }

    return {
      winnerNew: Math.round(winnerELO + adjustedK * (1 - expectedWinner)),
      loserNew: Math.round(loserELO + adjustedK * (0 - expectedLoser)),
      kFactorUsed: adjustedK
    };
  };

  const calculateTournamentProbabilities = (playerELO, allPlayers) => {
    if (allPlayers.length < 2) {
      return { playoff: 0, round32: 0, round16: 0, quarterfinals: 0, semifinals: 0, finals: 0, champ: 0 };
    }

    const sortedByELO = [...allPlayers].sort((a, b) => b.elo - a.elo);
    const playerRank = sortedByELO.findIndex(p => p.elo === playerELO) + 1;
    const totalPlayers = sortedByELO.length;

    const avgOpponentELO = allPlayers
      .filter(p => p.elo !== playerELO)
      .reduce((sum, p) => sum + p.elo, 0) / (allPlayers.length - 1);

    const avgWinProb = 1 / (1 + Math.pow(10, (avgOpponentELO - playerELO) / 400));
    const rankFactor = 1 - ((playerRank - 1) / totalPlayers) * 0.4;

    const playoff = playerRank <= 64 ? Math.min(100, Math.round((64 - playerRank + 10) / 64 * 100)) : Math.round(avgWinProb * 50 * rankFactor);

    const round32 = Math.min(100, Math.round(Math.pow(avgWinProb, 1) * 100 * rankFactor));
    const round16 = Math.min(100, Math.round(Math.pow(avgWinProb, 1.3) * 100 * rankFactor));
    const quarterfinals = Math.min(100, Math.round(Math.pow(avgWinProb, 1.6) * 100 * rankFactor));
    const semifinals = Math.min(100, Math.round(Math.pow(avgWinProb, 2) * 100 * rankFactor));
    const finals = Math.min(100, Math.round(Math.pow(avgWinProb, 2.5) * 100 * rankFactor));
    const champ = Math.min(100, Math.round(Math.pow(avgWinProb, 3) * 100 * rankFactor));

    return { playoff, round32, round16, quarterfinals, semifinals, finals, champ };
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
      lastWeekRank: null
    };

    const updatedPlayers = [...players, newPlayer];
    setPlayers(updatedPlayers);
    saveData(updatedPlayers, matches);

    setNewPlayerName('');
    setNewPlayerCountry('');
    setNewPlayerOffice('');
  };

  const startEditPlayer = (player) => {
    setEditingPlayer(player.id);
    setEditName(player.name);
    setEditCountry(player.countryCode);
    setEditOffice(player.office);
    setActiveTab('edit');
    setSidebarOpen(true);
  };

  const saveEditPlayer = () => {
    if (!editName.trim() || !editCountry || !editOffice) return;

    const updatedPlayers = players.map(p =>
      p.id === editingPlayer
        ? { ...p, name: editName.trim(), countryCode: editCountry, office: editOffice }
        : p
    );

    setPlayers(updatedPlayers);
    saveData(updatedPlayers, matches);

    setEditingPlayer(null);
    setEditName('');
    setEditCountry('');
    setEditOffice('');
    setActiveTab('match');
  };

  const cancelEdit = () => {
    setEditingPlayer(null);
    setEditName('');
    setEditCountry('');
    setEditOffice('');
    setActiveTab('match');
  };

  const calculateRankChanges = (updatedPlayers) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return updatedPlayers.map(player => {
      const weekAgoHistory = player.eloHistory.filter(h => new Date(h.timestamp) <= oneWeekAgo);
      const weekAgoELO = weekAgoHistory.length > 0
        ? weekAgoHistory[weekAgoHistory.length - 1].elo
        : player.eloHistory[0]?.elo || 1500;

      const weekAgoRankings = updatedPlayers
        .map(p => {
          const pWeekAgoHistory = p.eloHistory.filter(h => new Date(h.timestamp) <= oneWeekAgo);
          const pWeekAgoELO = pWeekAgoHistory.length > 0
            ? pWeekAgoHistory[pWeekAgoHistory.length - 1].elo
            : p.eloHistory[0]?.elo || 1500;
          return { id: p.id, elo: pWeekAgoELO };
        })
        .sort((a, b) => b.elo - a.elo);

      const weekAgoRank = weekAgoRankings.findIndex(p => p.id === player.id) + 1;
      return { ...player, lastWeekRank: weekAgoRank };
    });
  };

  const recordMatch = () => {
    if (!selectedWinner || !selectedLoser || selectedWinner === selectedLoser) return;

    const winner = players.find(p => p.id === selectedWinner);
    const loser = players.find(p => p.id === selectedLoser);

    if (!winner || !loser) {
      alert('Selected players not found');
      return;
    }

    const winnerScoreNum = winnerScore ? parseInt(winnerScore, 10) : null;
    const loserScoreNum = loserScore ? parseInt(loserScore, 10) : null;

    if (winnerScoreNum !== null && loserScoreNum !== null) {
      if (winnerScoreNum <= loserScoreNum) {
        alert('Winner score must be greater than loser score');
        return;
      }
      if (winnerScoreNum < 0 || loserScoreNum < 0) {
        alert('Scores must be positive numbers');
        return;
      }
    }

    const { winnerNew, loserNew } = calculateELO(winner.elo, loser.elo, winnerScoreNum, loserScoreNum);
    const timestamp = matchDate ? new Date(matchDate).toISOString() : new Date().toISOString();

    const updatedPlayers = players.map(p => {
      if (p.id === selectedWinner) {
        return {
          ...p,
          elo: winnerNew,
          wins: p.wins + 1,
          eloHistory: [...p.eloHistory, { elo: winnerNew, timestamp }]
        };
      }
      if (p.id === selectedLoser) {
        return {
          ...p,
          elo: loserNew,
          losses: p.losses + 1,
          eloHistory: [...p.eloHistory, { elo: loserNew, timestamp }]
        };
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
      timestamp
    };

    const updatedMatches = [newMatch, ...matches];
    setPlayers(playersWithRanks);
    setMatches(updatedMatches);
    saveData(playersWithRanks, updatedMatches);

    setSelectedWinner('');
    setSelectedLoser('');
    setWinnerScore('');
    setLoserScore('');
    setMatchDate('');
    setSidebarOpen(false);
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection(column === 'rank' ? 'asc' : 'desc');
    }
  };

  const getSortedPlayers = () => {
    const playersCopy = players.map(p => ({ ...p }));
    const playersWithRanks = calculateRankChanges(playersCopy);

    const rankedPlayers = [...playersWithRanks].sort((a, b) => b.elo - a.elo);

    const playersWithData = playersWithRanks.map((player) => {
      const rank = rankedPlayers.findIndex(p => p.id === player.id) + 1;
      const probabilities = calculateTournamentProbabilities(player.elo, playersWithRanks);
      return { ...player, rank, probabilities };
    });

    return [...playersWithData].sort((a, b) => {
      let compareA, compareB;

      switch (sortColumn) {
        case 'rank':
          compareA = a.rank; compareB = b.rank; break;
        case 'name':
          compareA = a.name.toLowerCase(); compareB = b.name.toLowerCase(); break;
        case 'elo':
          compareA = a.elo; compareB = b.elo; break;
        case 'playoff':
          compareA = a.probabilities.playoff; compareB = b.probabilities.playoff; break;
        case 'round32':
          compareA = a.probabilities.round32; compareB = b.probabilities.round32; break;
        case 'round16':
          compareA = a.probabilities.round16; compareB = b.probabilities.round16; break;
        case 'quarterfinals':
          compareA = a.probabilities.quarterfinals; compareB = b.probabilities.quarterfinals; break;
        case 'semifinals':
          compareA = a.probabilities.semifinals; compareB = b.probabilities.semifinals; break;
        case 'finals':
          compareA = a.probabilities.finals; compareB = b.probabilities.finals; break;
        case 'champ':
          compareA = a.probabilities.champ; compareB = b.probabilities.champ; break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') return compareA > compareB ? 1 : compareA < compareB ? -1 : 0;
      return compareA < compareB ? 1 : compareA > compareB ? -1 : 0;
    });
  };

  const sortedPlayers = useMemo(() => getSortedPlayers(), [players, sortColumn, sortDirection]);

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
  };

  const SortableHeader = ({ column, children, align = 'left' }) => (
    <th
      className={`py-4 ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'} ${column === 'playoff' ? 'border-l-2 border-gray-300' : ''} ${column === 'rank' ? 'pr-6' : 'px-6 px-0'} text-sm font-normal text-gray-500 uppercase tracking-wide cursor-pointer hover:bg-gray-50 transition-colors select-none`}
      onClick={() => handleSort(column)}
    >
      <div className={`flex items-center gap-2 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
        {children}
        {sortColumn === column && (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
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
  // Bracket View
  // =========================
  if (currentView === 'bracket') {
    if (sortedPlayers.length < 64) {
      return (
        <div className="min-h-screen bg-white">
          <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;700;900&display=swap" rel="stylesheet" />

          <div className="border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-8 py-8">
              <button
                onClick={() => setCurrentView('rankings')}
                className="flex items-center gap-2 text-gray-600 hover:text-black mb-6"
                style={{ fontFamily: 'sans-serif' }}
              >
                <ArrowLeft size={20} />
                <span>Back to Rankings</span>
              </button>

              <h1 className="text-6xl font-black mb-4" style={{ fontFamily: 'Figtree, sans-serif', letterSpacing: '-0.02em' }}>
                EOY Tournament Bracket
              </h1>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-8 py-12">
            <div className="bg-gray-100 border border-gray-300 rounded p-8 text-center">
              <p className="text-xl text-gray-700 mb-4" style={{ fontFamily: 'Figtree, sans-serif' }}>
                Not enough players for bracket
              </p>
              <p className="text-gray-600" style={{ fontFamily: 'sans-serif' }}>
                The tournament bracket requires at least 64 players. Currently: {sortedPlayers.length} players registered.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Top 64 seeded by ELO (overall), then re-seeded 1–16 inside each region
    const top64 = [...sortedPlayers]
      .sort((a, b) => (b.elo || 0) - (a.elo || 0))
      .slice(0, 64)
      .map((p) => ({
        ...p,
        probabilities: p.probabilities || {}
      }));

    const makeRegion = (slice) => slice.map((p, i) => ({ ...p, seed: i + 1 }));
    const region1 = makeRegion(top64.slice(0, 16));
    const region2 = makeRegion(top64.slice(16, 32));
    const region3 = makeRegion(top64.slice(32, 48));
    const region4 = makeRegion(top64.slice(48, 64));

    return (
      <div className="min-h-screen bg-white">
        <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;700;900&display=swap" rel="stylesheet" />

        <div className="border-b border-gray-200">
          <div className="max-w-full mx-auto px-8 py-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <button
                  onClick={() => setCurrentView('rankings')}
                  className="flex items-center gap-2 text-gray-600 hover:text-black mb-4"
                  style={{ fontFamily: 'sans-serif' }}
                >
                  <ArrowLeft size={20} />
                  <span>Back to Rankings</span>
                </button>
                <div className="text-sm text-gray-500 uppercase tracking-wider" style={{ fontFamily: 'sans-serif', letterSpacing: '0.1em' }}>
                  UPDATED {formatDate(new Date().toISOString())}, AT {formatTime(new Date().toISOString())}
                </div>
              </div>

              <div className="text-right">
                <div className={`text-sm ${syncStatus.ok ? 'text-green-700' : 'text-gray-500'}`} style={{ fontFamily: 'sans-serif' }}>
                  {syncStatus.message}
                </div>
              </div>
            </div>

            <h1 className="text-6xl font-black mb-4" style={{ fontFamily: 'Figtree, sans-serif', letterSpacing: '-0.02em' }}>
              EOY Tournament Bracket
            </h1>

            <p className="text-xl text-gray-700" style={{ fontFamily: 'Figtree, sans-serif' }}>
              Top 64 players seeded by ELO rating • March Madness matchups • Auto-fit single page
            </p>
          </div>
        </div>

        <div className="max-w-full mx-auto px-8 py-10">
          {/* Single-page bracket (auto scales) */}
          <div className="w-full overflow-hidden">
            <div
              className="mx-auto"
              style={{
                transform: `scale(${bracketScale})`,
                transformOrigin: 'top center'
              }}
            >
              <div className="grid grid-cols-[1fr_420px_1fr] gap-10 items-start">
                {/* LEFT SIDE */}
                <div className="space-y-16">
                  <Region regionName="Region 1" players={region1} />
                  <Region regionName="Region 3" players={region3} />
                </div>

                {/* CENTER */}
                <div className="flex flex-col items-center pt-28">
                  <div className="w-full mb-14">
                    <div className="text-xs text-gray-500 uppercase mb-2 text-center" style={{ fontFamily: 'sans-serif' }}>
                      Final Four
                    </div>
                    <div className="space-y-10">
                      <Matchup player1={null} player2={null} seed1="—" seed2="—" showProbability={false} />
                      <Matchup player1={null} player2={null} seed1="—" seed2="—" showProbability={false} />
                    </div>
                  </div>

                  <div className="w-full">
                    <div className="text-sm font-bold uppercase mb-4 text-center" style={{ fontFamily: 'Figtree, sans-serif' }}>
                      Championship
                    </div>
                    <Matchup player1={null} player2={null} seed1="—" seed2="—" showProbability={false} />
                  </div>
                </div>

                {/* RIGHT SIDE (mirrored) */}
                <div className="space-y-16">
                  <Region regionName="Region 2" players={region2} flip />
                  <Region regionName="Region 4" players={region4} flip />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 max-w-5xl mx-auto">
            <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'Figtree, sans-serif' }}>
              Notes
            </h3>
            <div className="grid grid-cols-2 gap-6 text-sm" style={{ fontFamily: 'sans-serif' }}>
              <div>
                <p className="text-gray-700">
                  <strong>Seeding:</strong> Within each region, seeds are 1–16. First round matchups are 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15.
                </p>
              </div>
              <div>
                <p className="text-gray-700">
                  <strong>Shading:</strong> Color intensity is each player’s probability of advancing to the next round (based on current ELO).
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 mt-20">
            <div className="max-w-7xl mx-auto px-8 py-8">
              <div className="text-sm text-gray-500" style={{ fontFamily: 'sans-serif' }}>
                <p>Isometric Ping Pong ELO System</p>
                <p className="mt-1">© 2026 Isometric</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // Rankings View
  // =========================
  return (
    <div className="min-h-screen bg-white">
      <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;700;900&display=swap" rel="stylesheet" />

      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-sm text-gray-500 uppercase tracking-wider" style={{ fontFamily: 'sans-serif', letterSpacing: '0.1em' }}>
                UPDATED {formatDate(new Date().toISOString())}, AT {formatTime(new Date().toISOString())}
              </div>
              <div className={`mt-2 text-sm ${syncStatus.ok ? 'text-green-700' : 'text-gray-500'}`} style={{ fontFamily: 'sans-serif' }}>
                {syncStatus.message}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentView('bracket')}
                className="px-5 py-2 border border-black text-black text-sm font-medium hover:bg-gray-100 transition-colors"
                style={{ fontFamily: 'sans-serif' }}
              >
                View Bracket
              </button>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="px-5 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
                style={{ fontFamily: 'sans-serif' }}
              >
                + Record Match
              </button>
            </div>
          </div>

          <h1 className="text-6xl font-black mb-4" style={{ fontFamily: 'Figtree, sans-serif', letterSpacing: '-0.02em' }}>
            Isometric Ping Pong Rankings
          </h1>

          <p className="text-xl text-gray-700" style={{ fontFamily: 'Figtree, sans-serif' }}>
            How {players.length} players compare by ELO rating, updated after each match.
          </p>
        </div>
      </div>

      {/* Main Content - Rankings Table */}
      <div className="max-w-full mx-auto px-8 py-12">
        <div className="flex items-end justify-end mb-3">
          <div className="text-right">
            <div className="text-sm text-gray-500 uppercase tracking-wide mb-2" style={{ fontFamily: 'sans-serif' }}>
              Probability of Winning EOY Tournament
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ fontFamily: 'monospace' }}>
            <thead>
              <tr className="border-b border-gray-300">
                <SortableHeader column="rank">↑ Rank</SortableHeader>
                <SortableHeader column="name">Name</SortableHeader>
                <SortableHeader column="elo" align="right">ELO</SortableHeader>
                <SortableHeader column="playoff" align="center">Playoff</SortableHeader>
                <SortableHeader column="round32" align="center">RD. OF 32</SortableHeader>
                <SortableHeader column="round16" align="center">SWEET 16</SortableHeader>
                <SortableHeader column="quarterfinals" align="center">ELITE 8</SortableHeader>
                <SortableHeader column="semifinals" align="center">FINAL 4</SortableHeader>
                <SortableHeader column="finals" align="center">FINALS</SortableHeader>
                <SortableHeader column="champ" align="center">CHAMP</SortableHeader>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-16 text-gray-400">
                    No players registered yet. Add a player to get started.
                  </td>
                </tr>
              ) : (
                sortedPlayers.map((player) => {
                  const rankChange = player.lastWeekRank ? player.lastWeekRank - player.rank : 0;
                  const countryData = COUNTRIES.find(c => c.code === player.countryCode);

                  return (
                    <tr key={player.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors group">
                      <td className="py-5 pr-6">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-normal text-gray-900 w-8">{player.rank}</span>
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

                      <td className="py-5 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://flagcdn.com/24x18/${player.countryCode}.png`}
                            srcSet={`https://flagcdn.com/48x36/${player.countryCode}.png 2x,
                                     https://flagcdn.com/72x54/${player.countryCode}.png 3x`}
                            width="24"
                            height="18"
                            alt={countryData?.name || 'Flag'}
                            title={countryData?.name || ''}
                            className="flex-shrink-0"
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-base text-gray-900">{player.name}</span>
                            <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{player.office}</span>
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

                      <td className="py-5 px-6 text-right">
                        <span className="text-xl font-normal text-gray-900">{player.elo}</span>
                      </td>

                      <td className="px-0 border-l-2 border-gray-300">
                        <ProbabilityCell probability={player.probabilities.playoff} />
                      </td>
                      <td className="px-0">
                        <ProbabilityCell probability={player.probabilities.round32} />
                      </td>
                      <td className="px-0">
                        <ProbabilityCell probability={player.probabilities.round16} />
                      </td>
                      <td className="px-0">
                        <ProbabilityCell probability={player.probabilities.quarterfinals} />
                      </td>
                      <td className="px-0">
                        <ProbabilityCell probability={player.probabilities.semifinals} />
                      </td>
                      <td className="px-0">
                        <ProbabilityCell probability={player.probabilities.finals} />
                      </td>
                      <td className="px-0">
                        <ProbabilityCell probability={player.probabilities.champ} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Recent Matches */}
        {matches.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'sans-serif' }}>Recent Matches</h2>
            <div className="space-y-3">
              {matches.slice(0, 15).map((match) => (
                <div key={match.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded">
                  <div className="flex items-center gap-3" style={{ fontFamily: 'sans-serif' }}>
                    <span className="text-sm text-gray-500">{formatDate(match.timestamp)}</span>
                    <span className="font-semibold text-gray-900">{match.winner}</span>
                    {match.winnerScore !== null && match.loserScore !== null && (
                      <span className="text-gray-600">({match.winnerScore}-{match.loserScore})</span>
                    )}
                    <span className="text-gray-500">def.</span>
                    <span className="text-gray-700">{match.loser}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-green-600 font-semibold">+{match.winnerEloChange}</span>
                    <span className="text-sm text-red-600 font-semibold">{match.loserEloChange}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="text-sm text-gray-500" style={{ fontFamily: 'sans-serif' }}>
            <p>Isometric Ping Pong ELO System</p>
            <p className="mt-1">© 2026 Isometric</p>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 border-l border-gray-200 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="px-6 py-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'sans-serif' }}>Actions</h2>
            <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex border-b border-gray-200">
            <button
              onClick={() => { setActiveTab('match'); setEditingPlayer(null); }}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'match' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-700'
              }`}
              style={{ fontFamily: 'sans-serif' }}
            >
              Record Match
            </button>
            <button
              onClick={() => { setActiveTab('player'); setEditingPlayer(null); }}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'player' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-700'
              }`}
              style={{ fontFamily: 'sans-serif' }}
            >
              Add Player
            </button>
            <button
              onClick={() => { setActiveTab('settings'); setEditingPlayer(null); }}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'settings' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-700'
              }`}
              style={{ fontFamily: 'sans-serif' }}
              title="Settings"
            >
              <div className="flex items-center justify-center gap-2">
                <Settings2 size={16} />
                <span>Settings</span>
              </div>
            </button>
            {editingPlayer && (
              <button
                onClick={() => setActiveTab('edit')}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  activeTab === 'edit' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-700'
                }`}
                style={{ fontFamily: 'sans-serif' }}
              >
                Edit Player
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'match' ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'sans-serif' }}>Winner</label>
                  <select
                    value={selectedWinner}
                    onChange={(e) => setSelectedWinner(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                    style={{ fontFamily: 'sans-serif' }}
                  >
                    <option value="">Select winner...</option>
                    {players.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.name} ({player.office}) - ELO: {player.elo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'sans-serif' }}>Loser</label>
                  <select
                    value={selectedLoser}
                    onChange={(e) => setSelectedLoser(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                    style={{ fontFamily: 'sans-serif' }}
                  >
                    <option value="">Select loser...</option>
                    {players.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.name} ({player.office}) - ELO: {player.elo}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'sans-serif' }}>
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
                        style={{ fontFamily: 'sans-serif' }}
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
                        style={{ fontFamily: 'sans-serif' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'sans-serif' }}>
                    Match Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                    style={{ fontFamily: 'sans-serif' }}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Leave blank to use today's date. Use this to add past matches.
                  </p>
                </div>

                {selectedWinner && selectedLoser && selectedWinner !== selectedLoser && (
                  <div className="bg-gray-100 p-4 rounded border border-gray-300">
                    <div className="text-sm text-gray-700" style={{ fontFamily: 'sans-serif' }}>
                      <strong>Preview:</strong> This match will update both players' ELO ratings
                      {winnerScore && loserScore ? ' with score-adjusted calculation' : ''}.
                    </div>
                  </div>
                )}

                <button
                  onClick={recordMatch}
                  disabled={!selectedWinner || !selectedLoser || selectedWinner === selectedLoser}
                  className="w-full px-6 py-3 bg-black text-white font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  style={{ fontFamily: 'sans-serif' }}
                >
                  Record Match
                </button>
              </div>
            ) : activeTab === 'edit' ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'sans-serif' }}>Player Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                    style={{ fontFamily: 'sans-serif' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'sans-serif' }}>Country</label>
                  <select
                    value={editCountry}
                    onChange={(e) => setEditCountry(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                    style={{ fontFamily: 'sans-serif' }}
                  >
                    <option value="">Select country...</option>
                    {COUNTRIES.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'sans-serif' }}>Office</label>
                  <select
                    value={editOffice}
                    onChange={(e) => setEditOffice(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                    style={{ fontFamily: 'sans-serif' }}
                  >
                    <option value="">Select office...</option>
                    {OFFICES.map(office => (
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
                    style={{ fontFamily: 'sans-serif' }}
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-6 py-3 border-2 border-gray-300 font-semibold hover:bg-gray-100 transition-colors"
                    style={{ fontFamily: 'sans-serif' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : activeTab === 'settings' ? (
              <div className="space-y-6">
                <div className="bg-gray-50 border border-gray-200 rounded p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <KeyRound size={16} />
                    <h3 className="font-semibold" style={{ fontFamily: 'sans-serif' }}>GitHub Sync Token</h3>
                  </div>
                  <p className="text-xs text-gray-600 mb-3" style={{ fontFamily: 'sans-serif' }}>
                    To write updates to <code className="px-1 bg-white border rounded">data/pingpong.json</code>, you need a GitHub fine-grained PAT with
                    <strong> Contents: Read and write</strong> on this repo.
                  </p>

                  <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'sans-serif' }}>
                    Token (stored locally in your browser)
                  </label>
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => {
                      const val = e.target.value;
                      setGithubToken(val);
                      localStorage.setItem(LS_GH_TOKEN, val);
                      setSyncStatus({ ok: null, message: 'Token updated locally.' });
                    }}
                    placeholder="github_pat_..."
                    className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                    style={{ fontFamily: 'sans-serif' }}
                  />

                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={() => loadData()}
                      className="flex-1 px-4 py-2 border border-black text-black font-semibold hover:bg-gray-100 transition-colors"
                      style={{ fontFamily: 'sans-serif' }}
                    >
                      Re-load from GitHub
                    </button>
                    <button
                      onClick={() => {
                        setGithubToken('');
                        localStorage.removeItem(LS_GH_TOKEN);
                        setSyncStatus({ ok: false, message: 'Token cleared. Will save locally only.' });
                      }}
                      className="px-4 py-2 border border-gray-300 font-semibold hover:bg-gray-100 transition-colors"
                      style={{ fontFamily: 'sans-serif' }}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="text-xs text-gray-500" style={{ fontFamily: 'sans-serif' }}>
                  <p><strong>Why this is needed:</strong> GitHub blocks anonymous writes. Without a token, the app can only keep local changes.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'sans-serif' }}>Player Name</label>
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Enter player name..."
                    className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                    style={{ fontFamily: 'sans-serif' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'sans-serif' }}>Country</label>
                  <select
                    value={newPlayerCountry}
                    onChange={(e) => setNewPlayerCountry(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                    style={{ fontFamily: 'sans-serif' }}
                  >
                    <option value="">Select country...</option>
                    {COUNTRIES.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'sans-serif' }}>Office</label>
                  <select
                    value={newPlayerOffice}
                    onChange={(e) => setNewPlayerOffice(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                    style={{ fontFamily: 'sans-serif' }}
                  >
                    <option value="">Select office...</option>
                    {OFFICES.map(office => (
                      <option key={office} value={office}>
                        {office}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-gray-100 p-4 rounded border border-gray-300">
                  <div className="text-sm text-gray-700" style={{ fontFamily: 'sans-serif' }}>
                    <strong>Note:</strong> New players start with an ELO rating of 1500.
                  </div>
                </div>

                <button
                  onClick={addPlayer}
                  disabled={!newPlayerName.trim() || !newPlayerCountry || !newPlayerOffice}
                  className="w-full px-6 py-3 bg-black text-white font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  style={{ fontFamily: 'sans-serif' }}
                >
                  Add Player
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

