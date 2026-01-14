import React, { useState, useEffect } from 'react';
import { Plus, X, Menu, TrendingUp, TrendingDown, Minus, ChevronUp, ChevronDown, Edit2, ArrowLeft } from 'lucide-react';

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

// Compact Bracket Player Component
function BracketPlayer({ player, seed, probability, showProbability = true }) {
  if (!player) {
    return (
      <div className="flex items-center justify-between h-6 px-2 bg-white border border-gray-300 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-gray-400 w-3">{seed}</span>
          <span className="text-gray-400">TBD</span>
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
      className="flex items-center justify-between h-6 px-2 border border-gray-300 text-xs"
      style={{ backgroundColor: bgColor }}
    >
      <div className="flex items-center gap-1.5 flex-1 min-w-0" style={{ color: textColor }}>
        <span className="font-semibold w-3 flex-shrink-0">{seed}</span>
        <img 
          src={`https://flagcdn.com/12x9/${player.countryCode}.png`}
          srcSet={`https://flagcdn.com/24x18/${player.countryCode}.png 2x`}
          width="12"
          height="9"
          alt={countryData?.name || 'Flag'}
          className="flex-shrink-0"
        />
        <span className="font-medium truncate">{player.name}</span>
        <span className="uppercase opacity-70 flex-shrink-0 text-[10px]">{player.office}</span>
      </div>
      {showProbability && probability > 0 && (
        <span className="ml-1 opacity-70 flex-shrink-0" style={{ color: textColor }}>{probability}%</span>
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

// Left Region Component (R64 → R32 → S16 → E8, left to right)
function RegionLeft({ regionName, players, startSeed = 1, filledData }) {
  const playerArray = Array.isArray(players) ? players : [];
  
  // March Madness seeding: 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15
  const seedPairs = [
    [0, 15],  // 1 vs 16
    [7, 8],   // 8 vs 9
    [4, 11],  // 5 vs 12
    [3, 12],  // 4 vs 13
    [5, 10],  // 6 vs 11
    [2, 13],  // 3 vs 14
    [6, 9],   // 7 vs 10
    [1, 14]   // 2 vs 15
  ];
  
  const round64Matchups = seedPairs.map(([idx1, idx2]) => ({
    player1: playerArray[idx1] || null,
    player2: playerArray[idx2] || null,
    seed1: startSeed + idx1,
    seed2: startSeed + idx2
  }));

  // Get R32, S16, E8 data from filled bracket
  const r32Start = Math.floor((startSeed - 1) / 16) * 4;
  const s16Start = Math.floor((startSeed - 1) / 16) * 2;
  const e8Index = Math.floor((startSeed - 1) / 16);

  const round32Players = filledData?.round32?.slice(r32Start, r32Start + 4) || [];
  const sweet16Players = filledData?.sweet16?.slice(s16Start, s16Start + 2) || [];
  const elite8Player = filledData?.elite8?.[e8Index] || null;

  return (
    <div className="flex-1">
      <h3 className="text-sm font-bold mb-2 uppercase tracking-wide text-center" style={{ fontFamily: 'Figtree, sans-serif' }}>
        {regionName}
      </h3>
      
      <div className="flex gap-2">
        {/* Round of 64 */}
        <div className="flex-1">
          <div className="text-[10px] text-gray-500 uppercase mb-1 text-center font-semibold">R64</div>
          <div className="flex flex-col justify-around h-[520px]">
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

        {/* Round of 32 */}
        <div className="flex-1">
          <div className="text-[10px] text-gray-500 uppercase mb-1 text-center font-semibold">R32</div>
          <div className="flex flex-col justify-around h-[520px]">
            {Array.from({ length: 4 }).map((_, idx) => {
              const p1 = round32Players[idx * 2];
              const p2 = round32Players[idx * 2 + 1];
              return (
                <Matchup 
                  key={idx} 
                  player1={p1} 
                  player2={p2} 
                  seed1={p1?.seed || "—"} 
                  seed2={p2?.seed || "—"}
                  prob1={p1?.probabilities?.sweet16 || 0}
                  prob2={p2?.probabilities?.sweet16 || 0}
                  showProbability={!!(p1 || p2)}
                />
              );
            })}
          </div>
        </div>

        {/* Sweet 16 */}
        <div className="flex-1">
          <div className="text-[10px] text-gray-500 uppercase mb-1 text-center font-semibold">S16</div>
          <div className="flex flex-col justify-around h-[520px]">
            {Array.from({ length: 2 }).map((_, idx) => {
              const p1 = sweet16Players[idx * 2];
              const p2 = sweet16Players[idx * 2 + 1];
              return (
                <Matchup 
                  key={idx} 
                  player1={p1} 
                  player2={p2} 
                  seed1={p1?.seed || "—"} 
                  seed2={p2?.seed || "—"}
                  prob1={p1?.probabilities?.elite8 || 0}
                  prob2={p2?.probabilities?.elite8 || 0}
                  showProbability={!!(p1 || p2)}
                />
              );
            })}
          </div>
        </div>

        {/* Elite 8 */}
        <div className="flex-1">
          <div className="text-[10px] text-gray-500 uppercase mb-1 text-center font-semibold">E8</div>
          <div className="flex flex-col justify-center h-[520px]">
            <Matchup 
              player1={elite8Player} 
              player2={null} 
              seed1={elite8Player?.seed || "—"} 
              seed2="—"
              prob1={elite8Player?.probabilities?.final4 || 0}
              showProbability={!!elite8Player}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Right Region Component (E8 ← S16 ← R32 ← R64, right to left, mirrored)
function RegionRight({ regionName, players, startSeed = 1, filledData }) {
  const playerArray = Array.isArray(players) ? players : [];
  
  // March Madness seeding: 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15
  const seedPairs = [
    [0, 15],  // 1 vs 16
    [7, 8],   // 8 vs 9
    [4, 11],  // 5 vs 12
    [3, 12],  // 4 vs 13
    [5, 10],  // 6 vs 11
    [2, 13],  // 3 vs 14
    [6, 9],   // 7 vs 10
    [1, 14]   // 2 vs 15
  ];
  
  const round64Matchups = seedPairs.map(([idx1, idx2]) => ({
    player1: playerArray[idx1] || null,
    player2: playerArray[idx2] || null,
    seed1: startSeed + idx1,
    seed2: startSeed + idx2
  }));

  // Get R32, S16, E8 data from filled bracket
  const r32Start = Math.floor((startSeed - 1) / 16) * 4;
  const s16Start = Math.floor((startSeed - 1) / 16) * 2;
  const e8Index = Math.floor((startSeed - 1) / 16);

  const round32Players = filledData?.round32?.slice(r32Start, r32Start + 4) || [];
  const sweet16Players = filledData?.sweet16?.slice(s16Start, s16Start + 2) || [];
  const elite8Player = filledData?.elite8?.[e8Index] || null;

  return (
    <div className="flex-1">
      <h3 className="text-sm font-bold mb-2 uppercase tracking-wide text-center" style={{ fontFamily: 'Figtree, sans-serif' }}>
        {regionName}
      </h3>
      
      <div className="flex gap-2 flex-row-reverse">
        {/* Round of 64 (on right side) */}
        <div className="flex-1">
          <div className="text-[10px] text-gray-500 uppercase mb-1 text-center font-semibold">R64</div>
          <div className="flex flex-col justify-around h-[520px]">
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

        {/* Round of 32 */}
        <div className="flex-1">
          <div className="text-[10px] text-gray-500 uppercase mb-1 text-center font-semibold">R32</div>
          <div className="flex flex-col justify-around h-[520px]">
            {Array.from({ length: 4 }).map((_, idx) => {
              const p1 = round32Players[idx * 2];
              const p2 = round32Players[idx * 2 + 1];
              return (
                <Matchup 
                  key={idx} 
                  player1={p1} 
                  player2={p2} 
                  seed1={p1?.seed || "—"} 
                  seed2={p2?.seed || "—"}
                  prob1={p1?.probabilities?.sweet16 || 0}
                  prob2={p2?.probabilities?.sweet16 || 0}
                  showProbability={!!(p1 || p2)}
                />
              );
            })}
          </div>
        </div>

        {/* Sweet 16 */}
        <div className="flex-1">
          <div className="text-[10px] text-gray-500 uppercase mb-1 text-center font-semibold">S16</div>
          <div className="flex flex-col justify-around h-[520px]">
            {Array.from({ length: 2 }).map((_, idx) => {
              const p1 = sweet16Players[idx * 2];
              const p2 = sweet16Players[idx * 2 + 1];
              return (
                <Matchup 
                  key={idx} 
                  player1={p1} 
                  player2={p2} 
                  seed1={p1?.seed || "—"} 
                  seed2={p2?.seed || "—"}
                  prob1={p1?.probabilities?.elite8 || 0}
                  prob2={p2?.probabilities?.elite8 || 0}
                  showProbability={!!(p1 || p2)}
                />
              );
            })}
          </div>
        </div>

        {/* Elite 8 (on left side) */}
        <div className="flex-1">
          <div className="text-[10px] text-gray-500 uppercase mb-1 text-center font-semibold">E8</div>
          <div className="flex flex-col justify-center h-[520px]">
            <Matchup 
              player1={elite8Player} 
              player2={null} 
              seed1={elite8Player?.seed || "—"} 
              seed2="—"
              prob1={elite8Player?.probabilities?.final4 || 0}
              showProbability={!!elite8Player}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PingPongELO() {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [currentView, setCurrentView] = useState('rankings');
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
  const [activeTab, setActiveTab] = useState('match');
  const [sortColumn, setSortColumn] = useState('rank');
  const [sortDirection, setSortDirection] = useState('asc');
  const [fileSha, setFileSha] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editOffice, setEditOffice] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const localPlayers = localStorage.getItem('pingpong:players_v4');
        const localMatches = localStorage.getItem('pingpong:matches_v4');
        
        if (localPlayers) setPlayers(JSON.parse(localPlayers));
        if (localMatches) setMatches(JSON.parse(localMatches));
        setLoading(false);
        return;
      }

      const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.filePath}?ref=${GITHUB_CONFIG.branch}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const fileData = await response.json();
        setFileSha(fileData.sha);
        
        const content = atob(fileData.content);
        const data = JSON.parse(content);
        
        setPlayers(data.players || []);
        setMatches(data.matches || []);
      } else if (response.status === 404) {
        console.log('No data file found, starting fresh');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (newPlayers, newMatches) => {
    try {
      // For local development, use localStorage
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        localStorage.setItem('pingpong:players_v4', JSON.stringify(newPlayers));
        localStorage.setItem('pingpong:matches_v4', JSON.stringify(newMatches));
        return;
      }

      // For production, use Vercel serverless function
      const response = await fetch('/api/save-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          players: newPlayers,
          matches: newMatches
        })
      });

      if (response.ok) {
        const result = await response.json();
        setFileSha(result.sha);
        console.log('Data saved successfully');
      } else {
        const error = await response.json();
        console.error('Failed to save:', error);
        alert('Failed to save data. Please try again.');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Failed to save data. Please try again.');
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

  // Helper function to simulate a single round
  const simulateRound = (players) => {
    const winners = [];
    for (let i = 0; i < players.length; i += 2) {
      const p1 = players[i];
      const p2 = players[i + 1];
      
      if (!p2) {
        winners.push(p1);
        continue;
      }

      const expectedP1 = 1 / (1 + Math.pow(10, (p2.elo - p1.elo) / 400));
      const random = Math.random();
      winners.push(random < expectedP1 ? p1 : p2);
    }
    return winners;
  };

  // Function to get most probable winner between two players
  const getMostLikely = (p1, p2) => {
    if (!p1 && !p2) return null;
    if (!p1) return p2;
    if (!p2) return p1;
    return p1.elo >= p2.elo ? p1 : p2;
  };

  // Function to fill bracket with most probable outcomes
  const fillBracket = (seededPlayers) => {
    const bracket = {
      round64: seededPlayers,
      round32: [],
      sweet16: [],
      elite8: [],
      final4: [],
      finals: [],
      champion: null
    };

    // Round of 64 -> 32
    for (let i = 0; i < bracket.round64.length; i += 2) {
      bracket.round32.push(getMostLikely(bracket.round64[i], bracket.round64[i + 1]));
    }

    // Round of 32 -> Sweet 16
    for (let i = 0; i < bracket.round32.length; i += 2) {
      bracket.sweet16.push(getMostLikely(bracket.round32[i], bracket.round32[i + 1]));
    }

    // Sweet 16 -> Elite 8
    for (let i = 0; i < bracket.sweet16.length; i += 2) {
      bracket.elite8.push(getMostLikely(bracket.sweet16[i], bracket.sweet16[i + 1]));
    }

    // Elite 8 -> Final 4
    for (let i = 0; i < bracket.elite8.length; i += 2) {
      bracket.final4.push(getMostLikely(bracket.elite8[i], bracket.elite8[i + 1]));
    }

    // Final 4 -> Finals
    for (let i = 0; i < bracket.final4.length; i += 2) {
      bracket.finals.push(getMostLikely(bracket.final4[i], bracket.final4[i + 1]));
    }

    // Finals -> Champion
    if (bracket.finals.length >= 2) {
      bracket.champion = getMostLikely(bracket.finals[0], bracket.finals[1]);
    }

    return bracket;
  };

  const calculateTournamentProbabilities = (playerELO, allPlayers) => {
    if (allPlayers.length < 2) {
      return { round64: 0, round32: 0, sweet16: 0, elite8: 0, final4: 0, finals: 0, win: 0 };
    }

    const numSimulations = 1000;
    const results = {
      round64: 0,
      round32: 0,
      sweet16: 0,
      elite8: 0,
      final4: 0,
      finals: 0,
      win: 0
    };

    const player = allPlayers.find(p => p.elo === playerELO);
    if (!player) return results;

    for (let sim = 0; sim < numSimulations; sim++) {
      const seededPlayers = [...allPlayers]
        .sort((a, b) => b.elo - a.elo)
        .slice(0, 64)
        .map(p => ({ ...p }));

      const playerInTournament = seededPlayers.find(p => p.id === player.id);
      if (!playerInTournament) continue;

      results.round64++;

      let currentRound = [...seededPlayers];
      
      currentRound = simulateRound(currentRound);
      if (currentRound.find(p => p.id === player.id)) results.round32++;
      else continue;

      currentRound = simulateRound(currentRound);
      if (currentRound.find(p => p.id === player.id)) results.sweet16++;
      else continue;

      currentRound = simulateRound(currentRound);
      if (currentRound.find(p => p.id === player.id)) results.elite8++;
      else continue;

      currentRound = simulateRound(currentRound);
      if (currentRound.find(p => p.id === player.id)) results.final4++;
      else continue;

      currentRound = simulateRound(currentRound);
      if (currentRound.find(p => p.id === player.id)) results.finals++;
      else continue;

      currentRound = simulateRound(currentRound);
      if (currentRound.find(p => p.id === player.id)) results.win++;
    }

    return {
      round64: Math.round((results.round64 / numSimulations) * 100),
      round32: Math.round((results.round32 / numSimulations) * 100),
      sweet16: Math.round((results.sweet16 / numSimulations) * 100),
      elite8: Math.round((results.elite8 / numSimulations) * 100),
      final4: Math.round((results.final4 / numSimulations) * 100),
      finals: Math.round((results.finals / numSimulations) * 100),
      win: Math.round((results.win / numSimulations) * 100)
    };
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
          return {
            id: p.id,
            elo: pWeekAgoELO
          };
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

    const winnerScoreNum = winnerScore ? parseInt(winnerScore) : null;
    const loserScoreNum = loserScore ? parseInt(loserScore) : null;

    if ((winnerScoreNum !== null && loserScoreNum !== null)) {
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
          compareA = a.rank;
          compareB = b.rank;
          break;
        case 'name':
          compareA = a.name.toLowerCase();
          compareB = b.name.toLowerCase();
          break;
        case 'elo':
          compareA = a.elo;
          compareB = b.elo;
          break;
        case 'round64':
          compareA = a.probabilities.round64;
          compareB = b.probabilities.round64;
          break;
        case 'round32':
          compareA = a.probabilities.round32;
          compareB = b.probabilities.round32;
          break;
        case 'sweet16':
          compareA = a.probabilities.sweet16;
          compareB = b.probabilities.sweet16;
          break;
        case 'elite8':
          compareA = a.probabilities.elite8;
          compareB = b.probabilities.elite8;
          break;
        case 'final4':
          compareA = a.probabilities.final4;
          compareB = b.probabilities.final4;
          break;
        case 'finals':
          compareA = a.probabilities.finals;
          compareB = b.probabilities.finals;
          break;
        case 'win':
          compareA = a.probabilities.win;
          compareB = b.probabilities.win;
          break;
        default:
          return 0;
      }
      
      if (sortDirection === 'asc') {
        return compareA > compareB ? 1 : compareA < compareB ? -1 : 0;
      } else {
        return compareA < compareB ? 1 : compareA > compareB ? -1 : 0;
      }
    });
  };

  const sortedPlayers = getSortedPlayers();
  
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
      className={`py-4 ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'} ${column === 'round64' ? 'border-l-2 border-gray-300' : ''} ${column === 'rank' ? 'pr-6' : 'px-6 px-0'} text-sm font-normal text-gray-500 uppercase tracking-wide cursor-pointer hover:bg-gray-50 transition-colors select-none`}
      onClick={() => handleSort(column)}
    >
      <div className={`flex items-center gap-2 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
        {children}
        {sortColumn === column && (
          sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
        )}
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

  // Bracket View
  if (currentView === 'bracket') {
    const top64 = [...sortedPlayers]
      .sort((a, b) => (b.elo || 0) - (a.elo || 0))
      .slice(0, 64)
      .map((p, index) => ({
        ...p,
        seed: index + 1,
        probabilities: p.probabilities || {}
      }));

    const region1 = top64.slice(0, 16);
    const region2 = top64.slice(16, 32);
    const region3 = top64.slice(32, 48);
    const region4 = top64.slice(48, 64);

    // Fill the bracket with most probable outcomes
    const filledBracket = fillBracket(top64);

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

    return (
      <div className="min-h-screen bg-white">
        <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;700;900&display=swap" rel="stylesheet" />
        
        <div className="border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-8 py-8">
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
            </div>
            
            <h1 className="text-5xl font-black mb-4" style={{ fontFamily: 'Figtree, sans-serif', letterSpacing: '-0.02em' }}>
              EOY Tournament Bracket
            </h1>
            
            <p className="text-lg text-gray-700" style={{ fontFamily: 'Figtree, sans-serif' }}>
              Top 64 players seeded by ELO • Probabilities from 1,000 simulated tournaments
            </p>
          </div>
        </div>

        <div className="w-full max-w-screen-xl mx-auto px-4 py-8">
          {/* Top Half */}
          <div className="grid grid-cols-2 gap-6 mb-4">
            <RegionLeft regionName="East" players={region1} startSeed={1} filledData={filledBracket} />
            <RegionRight regionName="West" players={region2} startSeed={17} filledData={filledBracket} />
          </div>

          {/* Final Four Top */}
          <div className="flex justify-center my-3">
            <div className="w-64">
              <div className="text-[10px] text-gray-500 uppercase mb-1 text-center font-semibold">Final Four</div>
              <Matchup 
                player1={filledBracket.final4[0]} 
                player2={filledBracket.final4[1]} 
                seed1={filledBracket.final4[0]?.seed || "—"} 
                seed2={filledBracket.final4[1]?.seed || "—"}
                prob1={filledBracket.final4[0]?.probabilities?.finals || 0}
                prob2={filledBracket.final4[1]?.probabilities?.finals || 0}
                showProbability={!!(filledBracket.final4[0] || filledBracket.final4[1])}
              />
            </div>
          </div>

          {/* Championship */}
          <div className="flex justify-center my-6">
            <div className="w-64">
              <div className="text-sm font-bold uppercase mb-2 text-center" style={{ fontFamily: 'Figtree, sans-serif' }}>Championship</div>
              <Matchup 
                player1={filledBracket.finals[0]} 
                player2={filledBracket.finals[1]} 
                seed1={filledBracket.finals[0]?.seed || "—"} 
                seed2={filledBracket.finals[1]?.seed || "—"}
                prob1={filledBracket.finals[0]?.probabilities?.win || 0}
                prob2={filledBracket.finals[1]?.probabilities?.win || 0}
                showProbability={!!(filledBracket.finals[0] || filledBracket.finals[1])}
              />
            </div>
          </div>

          {/* Final Four Bottom */}
          <div className="flex justify-center my-3">
            <div className="w-64">
              <div className="text-[10px] text-gray-500 uppercase mb-1 text-center font-semibold">Final Four</div>
              <Matchup 
                player1={filledBracket.final4[2]} 
                player2={filledBracket.final4[3]} 
                seed1={filledBracket.final4[2]?.seed || "—"} 
                seed2={filledBracket.final4[3]?.seed || "—"}
                prob1={filledBracket.final4[2]?.probabilities?.finals || 0}
                prob2={filledBracket.final4[3]?.probabilities?.finals || 0}
                showProbability={!!(filledBracket.final4[2] || filledBracket.final4[3])}
              />
            </div>
          </div>

          {/* Bottom Half */}
          <div className="grid grid-cols-2 gap-6 mt-4">
            <RegionLeft regionName="South" players={region3} startSeed={33} filledData={filledBracket} />
            <RegionRight regionName="Midwest" players={region4} startSeed={49} filledData={filledBracket} />
          </div>
        </div>

        {/* Explainer Section for Bracket */}
        <div className="max-w-7xl mx-auto px-8 py-12 border-t-2 border-gray-200 mt-8">
          <h2 className="text-3xl font-bold mb-8" style={{ fontFamily: 'Figtree, sans-serif' }}>How This Works</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-900" style={{ fontFamily: 'Figtree, sans-serif' }}>
                Bracket Predictions
              </h3>
              <p className="text-gray-700 leading-relaxed mb-3" style={{ fontFamily: 'sans-serif' }}>
                This bracket shows the most likely outcome based on current ELO ratings. At each matchup, the player 
                with the higher ELO advances. The probabilities shown are each player's chance of reaching the next round, 
                calculated from 1,000 tournament simulations.
              </p>
              <p className="text-gray-700 leading-relaxed" style={{ fontFamily: 'sans-serif' }}>
                The predicted champion ({filledBracket.champion?.name || 'TBD'}) has a {filledBracket.champion?.probabilities?.win || 0}% 
                chance of winning based on simulations, but upsets happen—especially in ping pong!
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-900" style={{ fontFamily: 'Figtree, sans-serif' }}>
                Tournament Format
              </h3>
              <p className="text-gray-700 leading-relaxed mb-3" style={{ fontFamily: 'sans-serif' }}>
                The top 64 players by ELO rating qualify for the tournament. Seeding follows March Madness format: 
                #1 plays #16, #2 plays #15, and so on. This gives top seeds easier first-round matchups while creating 
                potential for dramatic upsets.
              </p>
              <p className="text-gray-700 leading-relaxed" style={{ fontFamily: 'sans-serif' }}>
                The bracket is divided into four regions (East, West, South, Midwest) of 16 players each. Winners 
                advance through six rounds: Round of 64 → Round of 32 → Sweet 16 → Elite 8 → Final Four → Championship.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="text-sm text-gray-500" style={{ fontFamily: 'sans-serif' }}>
              <p>Isometric Ping Pong ELO System</p>
              <p className="mt-1">© 2026 Isometric</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Rankings View
  return (
    <div className="min-h-screen bg-white">
      <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;700;900&display=swap" rel="stylesheet" />
      
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-start justify-between mb-6">
            <div className="text-sm text-gray-500 uppercase tracking-wider" style={{ fontFamily: 'sans-serif', letterSpacing: '0.1em' }}>
              UPDATED {formatDate(new Date().toISOString())}, AT {formatTime(new Date().toISOString())}
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
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="flex items-end justify-between mb-3">
          <div className="flex-1"></div>
          <div className="text-center" style={{ flex: '0 0 auto', width: 'calc(7 * 120px)' }}>
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
                <SortableHeader column="round64" align="center">Rd. of 64</SortableHeader>
                <SortableHeader column="round32" align="center">Rd. of 32</SortableHeader>
                <SortableHeader column="sweet16" align="center">Sweet 16</SortableHeader>
                <SortableHeader column="elite8" align="center">Elite 8</SortableHeader>
                <SortableHeader column="final4" align="center">Final 4</SortableHeader>
                <SortableHeader column="finals" align="center">Finals</SortableHeader>
                <SortableHeader column="win" align="center">Win</SortableHeader>
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
                sortedPlayers.map((player, index) => {
                  const rankChange = player.lastWeekRank ? player.lastWeekRank - player.rank : 0;
                  const countryData = COUNTRIES.find(c => c.code === player.countryCode);
                  const isRank64 = player.rank === 64;
                  
                  return (
                    <React.Fragment key={player.id}>
                      <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors group">
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
                          <ProbabilityCell probability={player.probabilities.round64} />
                        </td>
                        <td className="px-0">
                          <ProbabilityCell probability={player.probabilities.round32} />
                        </td>
                        <td className="px-0">
                          <ProbabilityCell probability={player.probabilities.sweet16} />
                        </td>
                        <td className="px-0">
                          <ProbabilityCell probability={player.probabilities.elite8} />
                        </td>
                        <td className="px-0">
                          <ProbabilityCell probability={player.probabilities.final4} />
                        </td>
                        <td className="px-0">
                          <ProbabilityCell probability={player.probabilities.finals} />
                        </td>
                        <td className="px-0">
                          <ProbabilityCell probability={player.probabilities.win} />
                        </td>
                      </tr>
                      {isRank64 && (
                        <tr>
                          <td colSpan="10" className="p-0">
                            <div className="border-t-4 border-red-500 relative">
                              <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4 py-1 border-2 border-red-500 rounded text-xs font-bold text-red-600 uppercase tracking-wider">
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

        {/* 538-Style Explainer */}
        <div className="mt-20 border-t-2 border-gray-200 pt-12">
          <h2 className="text-3xl font-bold mb-8" style={{ fontFamily: 'Figtree, sans-serif' }}>How This Works</h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-900" style={{ fontFamily: 'Figtree, sans-serif' }}>
                What is ELO?
              </h3>
              <p className="text-gray-700 leading-relaxed mb-3" style={{ fontFamily: 'sans-serif' }}>
                ELO is a rating system originally designed for chess that calculates the relative skill levels of players. 
                When you win a match, your ELO goes up; when you lose, it goes down. The amount of change depends on the 
                difference between players' ratings and the match score.
              </p>
              <p className="text-gray-700 leading-relaxed" style={{ fontFamily: 'sans-serif' }}>
                A player with a 200-point ELO advantage has roughly a 76% chance of winning. All players start at 1500 ELO, 
                and ratings adjust after each match based on expected vs. actual outcomes.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-900" style={{ fontFamily: 'Figtree, sans-serif' }}>
                Tournament Simulations
              </h3>
              <p className="text-gray-700 leading-relaxed mb-3" style={{ fontFamily: 'sans-serif' }}>
                We run 1,000 simulated tournaments to calculate each player's probability of reaching each round. 
                In each simulation, players are seeded 1-64 by ELO rating, then matches are simulated using 
                ELO-based win probabilities.
              </p>
              <p className="text-gray-700 leading-relaxed" style={{ fontFamily: 'sans-serif' }}>
                For example, if a player appears in the finals in 150 of 1,000 simulations, their "Finals" probability 
                is 15%. This Monte Carlo approach accounts for the bracket structure and provides more accurate 
                predictions than simple formulas.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-900" style={{ fontFamily: 'Figtree, sans-serif' }}>
                How Rankings Work
              </h3>
              <p className="text-gray-700 leading-relaxed" style={{ fontFamily: 'sans-serif' }}>
                Rankings are based purely on current ELO ratings. The rank change arrows (▲▼) show movement 
                compared to one week ago. The "Tournament Cutoff" line indicates the top 64 players who would 
                qualify for the end-of-year tournament bracket based on current standings.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-900" style={{ fontFamily: 'Figtree, sans-serif' }}>
                Probability Shading
              </h3>
              <p className="text-gray-700 leading-relaxed" style={{ fontFamily: 'sans-serif' }}>
                The color intensity in probability columns indicates likelihood: white (0-10%), light pink (10-50%), 
                medium pink (50-75%), dark pink (75-100%). This visual gradient makes it easy to spot favorites 
                and underdogs at a glance.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-2 text-gray-900" style={{ fontFamily: 'Figtree, sans-serif' }}>
              Limitations
            </h3>
            <p className="text-sm text-gray-600" style={{ fontFamily: 'sans-serif' }}>
              ELO ratings assume consistent player skill and don't account for factors like recent form, injuries, 
              or matchup-specific advantages. Probabilities are estimates based on current ratings and may not reflect 
              real-world variance. Past performance does not guarantee future results.
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

      {/* Sidebar - keeping full sidebar code from previous version */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 border-l border-gray-200 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="px-6 py-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'sans-serif' }}>Actions</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex border-b border-gray-200">
            <button
              onClick={() => { setActiveTab('match'); setEditingPlayer(null); }}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'match'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
              style={{ fontFamily: 'sans-serif' }}
            >
              Record Match
            </button>
            <button
              onClick={() => { setActiveTab('player'); setEditingPlayer(null); }}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'player'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
              style={{ fontFamily: 'sans-serif' }}
            >
              Add Player
            </button>
            {editingPlayer && (
              <button
                onClick={() => setActiveTab('edit')}
                className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                  activeTab === 'edit'
                    ? 'text-black border-b-2 border-black'
                    : 'text-gray-400 hover:text-gray-700'
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
