import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, ChevronUp, ChevronDown, Edit2, Trash2, LogIn, LogOut } from 'lucide-react';
import { supabase } from './lib/supabase.js';

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

// Chart color palette (Polymarket-inspired)
const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

// Build a smooth SVG path from points using cardinal spline interpolation
function buildSmoothPath(points) {
  if (points.length === 0) return '';
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  if (points.length === 2) {
    d += ` L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;
  } else {
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      const t = 0.3;
      d += ` C ${(p1.x + (p2.x - p0.x) * t).toFixed(1)} ${(p1.y + (p2.y - p0.y) * t).toFixed(1)}, ${(p2.x - (p3.x - p1.x) * t).toFixed(1)} ${(p2.y - (p3.y - p1.y) * t).toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
  }
  return d;
}

// Multi-line mini sparkline for homepage preview cards
function MiniSparkline({ series, width = 120, height = 40, id = 'default' }) {
  if (!series || series.length === 0) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4 2" />
      </svg>
    );
  }

  // Find global min/max across all series
  let allPrices = [];
  series.forEach(s => { if (s.points) s.points.forEach(p => allPrices.push(p.price)); });
  if (allPrices.length === 0) allPrices = [0, 1];
  const minP = Math.min(...allPrices) - 0.02;
  const maxP = Math.max(...allPrices) + 0.02;
  const range = maxP - minP || 0.1;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      {series.map((s, si) => {
        if (!s.points || s.points.length < 2) return null;
        const color = CHART_COLORS[si % CHART_COLORS.length];
        const pts = s.points.map((p, i) => ({
          x: (i / (s.points.length - 1)) * width,
          y: height - ((p.price - minP) / range) * (height - 4) - 2,
        }));
        const pathD = buildSmoothPath(pts);
        const last = pts[pts.length - 1];
        return (
          <g key={s.id || si}>
            <path d={pathD} fill="none" stroke={color} strokeWidth={si === 0 ? 1.5 : 1} strokeLinecap="round" strokeLinejoin="round" opacity={si === 0 ? 1 : 0.5} />
            <circle cx={last.x} cy={last.y} r={si === 0 ? 2.5 : 1.5} fill={color} opacity={si === 0 ? 1 : 0.6} />
          </g>
        );
      })}
    </svg>
  );
}

// Larger multi-line price chart with axes, grid, and legend
function PriceChart({ series, width = 600, height = 280, id = 'chart' }) {
  const padding = { top: 16, right: 16, bottom: 28, left: 44 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  if (!series || series.length === 0) {
    return (
      <div className="flex items-center justify-center bg-gray-50 rounded-xl" style={{ width, height }}>
        <span className="text-sm text-gray-400" style={{ fontFamily: 'monospace' }}>No price data</span>
      </div>
    );
  }

  // Global min/max
  let allPrices = [];
  series.forEach(s => { if (s.points) s.points.forEach(p => allPrices.push(p.price)); });
  if (allPrices.length === 0) allPrices = [0, 1];
  const rawMin = Math.min(...allPrices);
  const rawMax = Math.max(...allPrices);
  const buffer = Math.max(0.05, (rawMax - rawMin) * 0.15);
  const minP = Math.max(0, rawMin - buffer);
  const maxP = Math.min(1, rawMax + buffer);
  const range = maxP - minP || 0.1;

  // Y-axis ticks
  const yTicks = [];
  const step = range <= 0.2 ? 0.05 : range <= 0.5 ? 0.1 : 0.2;
  for (let v = Math.ceil(minP / step) * step; v <= maxP; v += step) {
    yTicks.push(Math.round(v * 100) / 100);
  }

  const toX = (i, len) => padding.left + (i / Math.max(1, len - 1)) * chartW;
  const toY = (price) => padding.top + chartH - ((price - minP) / range) * chartH;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: height }}>
        {/* Grid lines */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={padding.left} y1={toY(v)} x2={width - padding.right} y2={toY(v)} stroke="#f3f4f6" strokeWidth="1" />
            <text x={padding.left - 6} y={toY(v) + 4} textAnchor="end" fill="#9ca3af" fontSize="10" fontFamily="monospace">
              {Math.round(v * 100)}¢
            </text>
          </g>
        ))}

        {/* Series lines */}
        {series.map((s, si) => {
          if (!s.points || s.points.length < 2) return null;
          const color = CHART_COLORS[si % CHART_COLORS.length];
          const pts = s.points.map((p, i) => ({
            x: toX(i, s.points.length),
            y: toY(p.price),
          }));
          const pathD = buildSmoothPath(pts);
          const gradId = `${id}-grad-${si}`;
          const fillD = pathD + ` L ${pts[pts.length - 1].x} ${padding.top + chartH} L ${pts[0].x} ${padding.top + chartH} Z`;
          const last = pts[pts.length - 1];

          return (
            <g key={s.id || si}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={si === 0 ? 0.12 : 0.05} />
                  <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
              </defs>
              {si === 0 && <path d={fillD} fill={`url(#${gradId})`} />}
              <path d={pathD} fill="none" stroke={color} strokeWidth={si === 0 ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" opacity={si < 3 ? 1 : 0.6} />
              <circle cx={last.x} cy={last.y} r={si === 0 ? 3.5 : 2.5} fill="white" stroke={color} strokeWidth="2" />
            </g>
          );
        })}

        {/* Bottom axis line */}
        <line x1={padding.left} y1={padding.top + chartH} x2={width - padding.right} y2={padding.top + chartH} stroke="#e5e7eb" strokeWidth="1" />
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 px-1">
        {series.slice(0, 8).map((s, si) => (
          <div key={s.id || si} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[si % CHART_COLORS.length] }} />
            <span className="text-xs text-gray-600 truncate" style={{ fontFamily: 'monospace', maxWidth: 140 }}>
              {s.label} <span className="font-semibold text-gray-900">{Math.round((s.currentPrice || s.points?.[s.points.length - 1]?.price || 0) * 100)}¢</span>
            </span>
          </div>
        ))}
      </div>
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


// CPMM price calculation (client-side preview — server is authoritative)
function cpmmGetPrices(pools) {
  const inverses = pools.map(q => 1 / q);
  const sumInv = inverses.reduce((a, b) => a + b, 0);
  return inverses.map(inv => inv / sumInv);
}

function cpmmSharesForCost(pools, outcomeIndex, cost) {
  if (cost <= 0) return 0;
  const n = pools.length;
  let k = 1;
  for (let i = 0; i < n; i++) k *= pools[i];
  let productOthers = 1;
  for (let i = 0; i < n; i++) {
    if (i === outcomeIndex) continue;
    productOthers *= (pools[i] + cost);
  }
  const newPool = k / productOthers;
  return Math.max(0, pools[outcomeIndex] + cost - newPool);
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

  // Markets & betting state
  const [marketsData, setMarketsData] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [marketDetail, setMarketDetail] = useState(null);
  const [betAmount, setBetAmount] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [pointBalance, setPointBalance] = useState(null);
  const [userPositions, setUserPositions] = useState([]);
  const [marketsLoading, setMarketsLoading] = useState(false);
  const [marketFilter, setMarketFilter] = useState('open');
  const [featuredMarkets, setFeaturedMarkets] = useState([]);

  // Head-to-head state
  const [h2hPlayer1, setH2hPlayer1] = useState('');
  const [h2hPlayer2, setH2hPlayer2] = useState('');
  const [h2hData, setH2hData] = useState(null);
  const [h2hLoading, setH2hLoading] = useState(false);

  // Activity feed
  const [activityFeed, setActivityFeed] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Traders leaderboard
  const [tradersData, setTradersData] = useState([]);
  const [tradersLoading, setTradersLoading] = useState(false);

  // Achievements
  const [playerAchievements, setPlayerAchievements] = useState([]);

  // Challenges
  const [challenges, setChallenges] = useState([]);
  const [challengeMessage, setChallengeMessage] = useState('');
  const [challengeTarget, setChallengeTarget] = useState('');

  // Comments
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Limit orders
  const [userOrders, setUserOrders] = useState([]);
  const [showLimitOrder, setShowLimitOrder] = useState(false);
  const [limitTargetPrice, setLimitTargetPrice] = useState('');
  const [limitAmount, setLimitAmount] = useState('');

  // Portfolio history
  const [portfolioHistory, setPortfolioHistory] = useState(null);

  // Auth state
  const [session, setSession] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimMode, setClaimMode] = useState('existing'); // 'existing' or 'new'
  const [claimPlayerId, setClaimPlayerId] = useState('');
  const [claimName, setClaimName] = useState('');
  const [claimCountry, setClaimCountry] = useState('');
  const [claimOffice, setClaimOffice] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);

  // Admin state
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [editBalanceUserId, setEditBalanceUserId] = useState(null);
  const [editBalanceValue, setEditBalanceValue] = useState('');
  const [editBalanceReason, setEditBalanceReason] = useState('');
  const [showCreateMarket, setShowCreateMarket] = useState(false);
  const [newMarketTitle, setNewMarketTitle] = useState('');
  const [newMarketDesc, setNewMarketDesc] = useState('');
  const [newMarketCategory, setNewMarketCategory] = useState('season');
  const [newMarketResolution, setNewMarketResolution] = useState('');
  const [newMarketOutcomes, setNewMarketOutcomes] = useState([{ label: '', playerId: '' }, { label: '', playerId: '' }]);

  // Auth helpers
  const getAuthHeaders = useCallback(() => {
    if (!session?.access_token) return { 'Content-Type': 'application/json' };
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    };
  }, [session]);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) alert(`Sign in failed: ${error.message}`);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setAuthUser(null);
    setShowClaimModal(false);
  };

  // Fetch full user profile from our API
  const fetchUserProfile = async (s) => {
    if (!s?.access_token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${s.access_token}`,
        },
      });
      if (res.ok) {
        const profile = await res.json();
        setAuthUser({
          email: profile.email,
          displayName: profile.displayName,
          playerId: profile.playerId,
          isAdmin: profile.isAdmin,
        });
        // Show claim modal if user has no linked player
        if (!profile.playerId) {
          setShowClaimModal(true);
        }
      } else {
        // Fallback to basic info from session
        setAuthUser({
          email: s.user.email,
          displayName: s.user.user_metadata?.full_name || s.user.email?.split('@')[0],
          playerId: null,
          isAdmin: false,
        });
        setShowClaimModal(true);
      }
    } catch {
      setAuthUser({
        email: s.user.email,
        displayName: s.user.user_metadata?.full_name || s.user.email?.split('@')[0],
        playerId: null,
        isAdmin: false,
      });
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        fetchUserProfile(s);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        fetchUserProfile(s);
      } else {
        setAuthUser(null);
        setShowClaimModal(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    loadData();
    loadFeaturedMarkets();
    loadActivityFeed();
    loadChallenges();
  }, []);

  // Load markets data
  const loadMarkets = async (filter) => {
    setMarketsLoading(true);
    try {
      const response = await fetch(`/api/markets/list?status=${filter || marketFilter}`);
      if (response.ok) {
        const data = await response.json();
        setMarketsData(data.markets || []);
      }
    } catch (err) {
      console.error('Failed to load markets:', err);
    } finally {
      setMarketsLoading(false);
    }
  };

  // Load featured markets for homepage preview
  const loadFeaturedMarkets = async () => {
    try {
      const response = await fetch('/api/markets/featured');
      if (response.ok) {
        const data = await response.json();
        setFeaturedMarkets(data.featured || []);
      }
    } catch (err) {
      console.error('Failed to load featured markets:', err);
    }
  };

  // Load activity feed
  const loadActivityFeed = async () => {
    setActivityLoading(true);
    try {
      const res = await fetch('/api/activity/feed');
      if (res.ok) { const data = await res.json(); setActivityFeed(data.events || []); }
    } catch (err) { console.error('Failed to load activity feed:', err); }
    finally { setActivityLoading(false); }
  };

  // Load head-to-head data
  const loadH2H = async (p1, p2) => {
    if (!p1 || !p2 || p1 === p2) return;
    setH2hLoading(true);
    try {
      const res = await fetch(`/api/head-to-head?player1=${p1}&player2=${p2}`);
      if (res.ok) { const data = await res.json(); setH2hData(data); }
    } catch (err) { console.error('Failed to load H2H:', err); }
    finally { setH2hLoading(false); }
  };

  // Load traders leaderboard
  const loadTraders = async () => {
    setTradersLoading(true);
    try {
      const res = await fetch('/api/leaderboard/traders');
      if (res.ok) { const data = await res.json(); setTradersData(data.traders || []); }
    } catch (err) { console.error('Failed to load traders:', err); }
    finally { setTradersLoading(false); }
  };

  // Load achievements for a player
  const loadAchievements = async (playerId) => {
    try {
      const url = playerId ? `/api/achievements/list?playerId=${playerId}` : '/api/achievements/list';
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) { const data = await res.json(); setPlayerAchievements(data.achievements || []); }
    } catch (err) { console.error('Failed to load achievements:', err); }
  };

  // Check achievements for current user
  const checkAchievements = async () => {
    if (!session) return;
    try {
      const res = await fetch('/api/achievements/check', { method: 'POST', headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.newAchievements?.length > 0) {
          // Could show a toast here
          console.log('New achievements:', data.newAchievements);
        }
      }
    } catch (err) { console.error('Failed to check achievements:', err); }
  };

  // Load user's limit orders
  const loadOrders = async (status = 'open') => {
    if (!session) return;
    try {
      const res = await fetch(`/api/orders/list?status=${status}`, { headers: getAuthHeaders() });
      if (res.ok) { const data = await res.json(); setUserOrders(data.orders || []); }
    } catch (err) { console.error('Failed to load orders:', err); }
  };

  // Place limit order
  const placeLimitOrder = async (marketId, outcomeId, direction) => {
    if (!session || !limitTargetPrice || !limitAmount) return;
    setSaving(true);
    try {
      const res = await fetch('/api/orders/place', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          marketId,
          outcomeId,
          direction,
          targetPrice: parseFloat(limitTargetPrice) / 100, // convert from cents
          amount: parseFloat(limitAmount),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowLimitOrder(false);
        setLimitTargetPrice('');
        setLimitAmount('');
        if (data.filled) {
          alert('Order filled immediately!');
          loadBalance();
          loadMarketDetail(marketId);
        } else {
          alert('Limit order placed!');
        }
        loadOrders();
      } else {
        alert(`Order failed: ${data.error}`);
      }
    } catch (err) { alert(`Error: ${err.message}`); }
    finally { setSaving(false); }
  };

  // Cancel limit order
  const cancelOrder = async (orderId) => {
    if (!session || !window.confirm('Cancel this order?')) return;
    try {
      const res = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ orderId }),
      });
      if (res.ok) { loadOrders(); loadBalance(); }
      else { const data = await res.json(); alert(`Failed: ${data.error}`); }
    } catch (err) { alert(`Error: ${err.message}`); }
  };

  // Load portfolio history
  const loadPortfolioHistory = async () => {
    if (!session) return;
    try {
      const res = await fetch('/api/portfolio/history', { headers: getAuthHeaders() });
      if (res.ok) { const data = await res.json(); setPortfolioHistory(data); }
    } catch (err) { console.error('Failed to load portfolio history:', err); }
  };

  // Load challenges
  const loadChallenges = async (scope = 'all') => {
    try {
      const headers = session ? getAuthHeaders() : { 'Content-Type': 'application/json' };
      const res = await fetch(`/api/challenges/list?scope=${scope}`, { headers });
      if (res.ok) { const data = await res.json(); setChallenges(data.challenges || []); }
    } catch (err) { console.error('Failed to load challenges:', err); }
  };

  // Send a challenge
  const sendChallenge = async (challengedPlayerId) => {
    if (!session) return alert('Please sign in to challenge players.');
    setSaving(true);
    try {
      const res = await fetch('/api/challenges/create', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ challengedPlayerId, message: challengeMessage.trim() || null }),
      });
      const data = await res.json();
      if (res.ok) {
        setChallengeMessage('');
        setChallengeTarget('');
        loadChallenges();
        alert('Challenge sent!');
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (err) { alert(`Error: ${err.message}`); }
    finally { setSaving(false); }
  };

  // Respond to a challenge
  const respondToChallenge = async (challengeId, response) => {
    if (!session) return;
    try {
      const res = await fetch('/api/challenges/respond', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ challengeId, response }),
      });
      if (res.ok) { loadChallenges(); }
      else { const data = await res.json(); alert(`Failed: ${data.error}`); }
    } catch (err) { alert(`Error: ${err.message}`); }
  };

  // Load comments for a target
  const loadComments = async (targetType, targetId) => {
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/comments/list?targetType=${targetType}&targetId=${targetId}`);
      if (res.ok) { const data = await res.json(); setComments(data.comments || []); }
    } catch (err) { console.error('Failed to load comments:', err); }
    finally { setCommentsLoading(false); }
  };

  // Post a comment
  const postComment = async (targetType, targetId) => {
    if (!session || !commentText.trim()) return;
    try {
      const res = await fetch('/api/comments/create', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ targetType, targetId, content: commentText.trim() }),
      });
      if (res.ok) {
        setCommentText('');
        loadComments(targetType, targetId);
      } else {
        const data = await res.json();
        alert(`Failed: ${data.error}`);
      }
    } catch (err) { alert(`Error: ${err.message}`); }
  };

  // Send weekly recap (admin)
  const sendWeeklyRecap = async () => {
    if (!session) return;
    setSaving(true);
    try {
      const res = await fetch('/api/weekly-recap', { method: 'POST', headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok) {
        alert(data.slackPosted ? 'Recap posted to Slack!' : 'Recap generated (no Slack webhook configured).\n\n' + (data.recap || '').substring(0, 500));
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (err) { alert(`Error: ${err.message}`); }
    finally { setSaving(false); }
  };

  // Load point balance
  const loadBalance = async () => {
    if (!session) return;
    try {
      const response = await fetch('/api/points/balance', { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        if (!data.initialized) {
          // Auto-initialize points
          const initRes = await fetch('/api/points/initialize', {
            method: 'POST',
            headers: getAuthHeaders(),
          });
          if (initRes.ok) {
            const initData = await initRes.json();
            setPointBalance(initData.balance);
          }
        } else {
          setPointBalance(data.balance);
          setUserPositions(data.positions || []);
        }
      }
    } catch (err) {
      console.error('Failed to load balance:', err);
    }
  };

  // Load market detail
  const loadMarketDetail = async (marketId) => {
    try {
      const response = await fetch(`/api/markets/detail?id=${marketId}`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setMarketDetail(data);
      }
      // Load comments for this market
      loadComments('market', marketId);
    } catch (err) {
      console.error('Failed to load market detail:', err);
    }
  };

  // Place a bet
  const placeBet = async () => {
    if (!session) return alert('Please sign in to place a bet.');
    if (!selectedOutcome || !betAmount || parseFloat(betAmount) <= 0) return;

    setSaving(true);
    try {
      const response = await fetch('/api/bets/place', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          marketId: selectedMarket,
          outcomeId: selectedOutcome,
          amount: parseFloat(betAmount),
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setPointBalance(result.newBalance);
        setBetAmount('');
        setSelectedOutcome(null);
        // Refresh market detail
        await loadMarketDetail(selectedMarket);
        await loadBalance();
      } else {
        alert(`Bet failed: ${result.error}`);
      }
    } catch (err) {
      alert(`Network error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Sell shares
  const sellShares = async (outcomeId, shares) => {
    if (!session) return alert('Please sign in.');

    setSaving(true);
    try {
      const response = await fetch('/api/bets/sell', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          marketId: selectedMarket,
          outcomeId,
          shares,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setPointBalance(result.newBalance);
        await loadMarketDetail(selectedMarket);
        await loadBalance();
      } else {
        alert(`Sale failed: ${result.error}`);
      }
    } catch (err) {
      alert(`Network error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Load balance when session changes
  useEffect(() => {
    if (session) {
      loadBalance();
    } else {
      setPointBalance(null);
      setUserPositions([]);
    }
  }, [session]);


  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading data...');

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

  const claimPlayer = async () => {
    if (!session) return;
    setClaimLoading(true);
    try {
      const body = claimMode === 'new'
        ? { createNew: true, name: claimName.trim(), countryCode: claimCountry, office: claimOffice }
        : { playerId: claimPlayerId };

      const response = await fetch('/api/auth/claim-player', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (response.ok) {
        setAuthUser(prev => ({ ...prev, playerId: result.playerId }));
        setShowClaimModal(false);
        setClaimPlayerId('');
        setClaimName('');
        setClaimCountry('');
        setClaimOffice('');
        // Reload data to include new player if created
        await loadData();
        // Initialize points now that they have a player
        await loadBalance();
      } else {
        alert(`Failed: ${result.error}`);
      }
    } catch (err) {
      alert(`Network error: ${err.message}`);
    } finally {
      setClaimLoading(false);
    }
  };

  // Admin functions
  const loadAdminUsers = async () => {
    if (!session) return;
    setAdminLoading(true);
    try {
      const response = await fetch('/api/admin/users', { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setAdminUsers(data.users || []);
      } else {
        const err = await response.json();
        alert(`Admin access denied: ${err.error}`);
        setCurrentView('rankings');
      }
    } catch (err) {
      console.error('Admin load error:', err);
    } finally {
      setAdminLoading(false);
    }
  };

  const updateUserBalance = async (userId) => {
    if (!editBalanceValue) return;
    setSaving(true);
    try {
      const response = await fetch('/api/admin/update-balance', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId,
          balance: parseFloat(editBalanceValue),
          reason: editBalanceReason || 'Admin adjustment',
        }),
      });
      const result = await response.json();
      if (response.ok) {
        setEditBalanceUserId(null);
        setEditBalanceValue('');
        setEditBalanceReason('');
        await loadAdminUsers();
      } else {
        alert(`Failed: ${result.error}`);
      }
    } catch (err) {
      alert(`Network error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const createMarket = async () => {
    const validOutcomes = newMarketOutcomes.filter(o => o.label.trim());
    if (!newMarketTitle.trim() || validOutcomes.length < 2) {
      return alert('Title and at least 2 outcomes required.');
    }

    setSaving(true);
    try {
      const response = await fetch('/api/markets/create', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: newMarketTitle.trim(),
          description: newMarketDesc.trim() || null,
          category: newMarketCategory,
          resolutionDate: newMarketResolution || null,
          outcomes: validOutcomes.map(o => ({
            label: o.label.trim(),
            playerId: o.playerId || null,
          })),
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setShowCreateMarket(false);
        setNewMarketTitle('');
        setNewMarketDesc('');
        setNewMarketCategory('season');
        setNewMarketResolution('');
        setNewMarketOutcomes([{ label: '', playerId: '' }, { label: '', playerId: '' }]);
        await loadMarkets('all');
      } else {
        alert(`Failed: ${result.error}`);
      }
    } catch (err) {
      alert(`Network error: ${err.message}`);
    } finally {
      setSaving(false);
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
    if (!session) return alert("Please sign in to record a match.");
    if (!selectedWinner || !selectedLoser || selectedWinner === selectedLoser) return;
    if (!authUser?.isAdmin && authUser?.playerId !== selectedWinner && authUser?.playerId !== selectedLoser) {
      return alert("You can only record matches you played in.");
    }

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
        headers: getAuthHeaders(),
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
    if (!session) return alert("Please sign in to add a player.");
    if (!newPlayerName.trim() || !newPlayerCountry || !newPlayerOffice) return;

    setSaving(true);
    try {
      const response = await fetch('/api/add-player', {
        method: 'POST',
        headers: getAuthHeaders(),
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
    if (!session) return alert("Please sign in to edit a player.");
    if (!editName.trim() || !editCountry || !editOffice) return;

    setSaving(true);
    try {
      const response = await fetch('/api/edit-player', {
        method: 'POST',
        headers: getAuthHeaders(),
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
    if (!session) return alert("Please sign in to delete a match.");
    if (!window.confirm("Delete this match? This will recalculate all ELO ratings.")) return;

    setSaving(true);
    try {
      const response = await fetch('/api/delete-match', {
        method: 'POST',
        headers: getAuthHeaders(),
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
        bettingOdds: null, // Removed tournament-based odds
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

  // Compute which players are already claimed (for the claim modal)
  const claimedPlayerIds = new Set(); // We'll filter on the server side, but show all in dropdown

  // Claim modal — rendered as overlay on any view
  const claimModal = showClaimModal && session && (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
        <h2 className="text-2xl font-black mb-2" style={{ fontFamily: 'Figtree, sans-serif' }}>
          Welcome to Isometric Ping Pong!
        </h2>
        <p className="text-gray-600 mb-6">
          Link your account to your player profile to track stats, earn Hall of Fame points, and bet on prediction markets.
        </p>

        {/* Toggle between claim existing and create new */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setClaimMode('existing')}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
              claimMode === 'existing' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            I'm an existing player
          </button>
          <button
            onClick={() => setClaimMode('new')}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
              claimMode === 'new' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            I'm new here
          </button>
        </div>

        {claimMode === 'existing' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Which player are you?</label>
              <select
                value={claimPlayerId}
                onChange={(e) => setClaimPlayerId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
              >
                <option value="">Select your profile...</option>
                {players
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.office}) — {p.elo} ELO
                    </option>
                  ))
                }
              </select>
            </div>

            <button
              onClick={claimPlayer}
              disabled={claimLoading || !claimPlayerId}
              className="w-full px-6 py-3 bg-black text-white font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors rounded"
            >
              {claimLoading ? 'Linking...' : 'That\'s me!'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
              <input
                type="text"
                value={claimName}
                onChange={(e) => setClaimName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
              <select
                value={claimCountry}
                onChange={(e) => setClaimCountry(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
              >
                <option value="">Select country...</option>
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Office</label>
              <select
                value={claimOffice}
                onChange={(e) => setClaimOffice(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
              >
                <option value="">Select office...</option>
                {OFFICES.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            <div className="bg-gray-100 p-3 rounded text-sm text-gray-600">
              You'll start with 1500 ELO and receive 1,000 Hall of Fame points.
            </div>

            <button
              onClick={claimPlayer}
              disabled={claimLoading || !claimName.trim() || !claimCountry || !claimOffice}
              className="w-full px-6 py-3 bg-black text-white font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors rounded"
            >
              {claimLoading ? 'Creating...' : 'Create my profile'}
            </button>
          </div>
        )}

        <button
          onClick={() => setShowClaimModal(false)}
          className="w-full mt-3 px-6 py-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );

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

          {/* Achievements */}
          {playerAchievements.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Figtree, sans-serif' }}>Achievements</h2>
              <div className="flex flex-wrap gap-3">
                {playerAchievements.map(a => (
                  <div key={a.key} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 hover:shadow-sm transition-shadow" title={a.description}>
                    <span className="text-xl">{a.icon}</span>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{a.name}</div>
                      <div className="text-xs text-gray-400">{a.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
        {claimModal}
      </div>
    );
  }

  // MARKETS LIST VIEW
  if (currentView === "markets") {
    return (
      <div className="min-h-screen bg-white">
        <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;700;900&display=swap" rel="stylesheet" />
        <div className="border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="flex items-start justify-between mb-6">
              <button onClick={() => setCurrentView("rankings")} className="text-gray-600 hover:text-black flex items-center gap-2">
                ← Back to Rankings
              </button>
              {session && pointBalance !== null && (
                <button
                  onClick={() => { setCurrentView("portfolio"); loadBalance(); loadPortfolioHistory(); loadOrders(); }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  style={{ fontFamily: 'monospace' }}
                >
                  <span className="text-sm font-semibold">{pointBalance.toFixed(0)} pts</span>
                  <span className="text-xs text-gray-500">Portfolio →</span>
                </button>
              )}
            </div>
            <h1 className="text-6xl font-black mb-4" style={{ fontFamily: "Figtree, sans-serif" }}>Prediction Markets</h1>
            <p className="text-xl text-gray-700" style={{ fontFamily: "monospace" }}>
              Buy and sell shares on ping pong outcomes. Shares pay 1 pt if the outcome happens.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* Filter tabs + leaderboard link */}
          <div className="flex items-center justify-between border-b border-gray-200 mb-8">
            <div className="flex">
            {[
              { key: 'open', label: 'Open' },
              { key: 'all', label: 'All' },
              { key: 'resolved', label: 'Resolved' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => { setMarketFilter(f.key); loadMarkets(f.key); }}
                className={`px-6 py-4 font-semibold transition-colors ${marketFilter === f.key ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-700'}`}
                style={{ fontFamily: 'monospace' }}
              >
                {f.label}
              </button>
            ))}
            </div>
            <button
              onClick={() => { setCurrentView("leaderboard"); loadTraders(); }}
              className="text-sm text-gray-500 hover:text-gray-900 font-medium mb-1 transition-colors"
              style={{ fontFamily: 'monospace' }}
            >
              📈 Top Traders
            </button>
          </div>

          {marketsLoading ? (
            <div className="text-center py-16 text-gray-400" style={{ fontFamily: 'monospace' }}>
              Loading markets...
            </div>
          ) : marketsData.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">No markets found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {marketsData.map(market => {
                const histories = market.priceHistories || [];
                return (
                  <button
                    key={market.id}
                    onClick={() => {
                      setSelectedMarket(market.id);
                      loadMarketDetail(market.id);
                      setCurrentView("market-detail");
                    }}
                    className="w-full text-left border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-gray-300 transition-all bg-white"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Figtree, sans-serif' }}>
                          {market.title}
                        </h3>
                        {market.description && (
                          <p className="text-sm text-gray-500 mt-1">{market.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded font-semibold uppercase tracking-wider ${
                          market.status === 'open' ? 'bg-green-100 text-green-700' :
                          market.status === 'resolved' ? 'bg-blue-100 text-blue-700' :
                          market.status === 'closed' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {market.status}
                        </span>
                        {market.volume > 0 && (
                          <span className="text-xs text-gray-400" style={{ fontFamily: 'monospace' }}>
                            {market.volume.toFixed(0)} pts vol
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price chart + outcomes side by side */}
                    <div className="flex gap-6">
                      {/* Chart */}
                      {histories.length > 0 && (
                        <div className="flex-shrink-0" style={{ width: 240 }}>
                          <MiniSparkline series={histories.slice(0, 5)} width={240} height={80} id={`list-${market.id}`} />
                          {/* Legend */}
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                            {histories.slice(0, 5).map((s, si) => (
                              <div key={s.id} className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CHART_COLORS[si % CHART_COLORS.length] }} />
                                <span className="text-xs text-gray-400 truncate" style={{ fontFamily: 'monospace', maxWidth: 80, fontSize: '10px' }}>
                                  {s.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Top outcomes */}
                      <div className="flex-1 space-y-2 min-w-0">
                        {market.outcomes.slice(0, 5).map((outcome, oi) => (
                          <div key={outcome.id} className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[oi % CHART_COLORS.length] }} />
                                  <span className="text-sm font-medium text-gray-700 truncate" style={{ fontFamily: 'monospace' }}>
                                    {outcome.label}
                                  </span>
                                </div>
                                <span className="text-sm font-bold text-gray-900 flex-shrink-0 ml-2" style={{ fontFamily: 'monospace' }}>
                                  {Math.round(outcome.price * 100)}¢
                                </span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${Math.min(100, outcome.price * 100)}%`, backgroundColor: CHART_COLORS[oi % CHART_COLORS.length] }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        {market.outcomes.length > 5 && (
                          <p className="text-xs text-gray-400 mt-2 pl-3.5">
                            + {market.outcomes.length - 5} more outcomes
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // MARKET DETAIL VIEW
  if (currentView === "market-detail" && selectedMarket) {
    const md = marketDetail;

    // Preview calculation
    const previewShares = (() => {
      if (!md || !selectedOutcome || !betAmount || parseFloat(betAmount) <= 0) return null;
      const outcome = md.outcomes.find(o => o.id === selectedOutcome);
      if (!outcome) return null;
      const pools = md.outcomes.map(o => o.poolShares);
      const idx = md.outcomes.findIndex(o => o.id === selectedOutcome);
      const shares = cpmmSharesForCost(pools, idx, parseFloat(betAmount));
      const avgPrice = shares > 0 ? parseFloat(betAmount) / shares : 0;
      return { shares, avgPrice, potentialPayout: shares };
    })();

    return (
      <div className="min-h-screen bg-white">
        <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;700;900&display=swap" rel="stylesheet" />
        <div className="border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="flex items-start justify-between mb-6">
              <button onClick={() => { setCurrentView("markets"); setSelectedMarket(null); setMarketDetail(null); setSelectedOutcome(null); setBetAmount(''); }} className="text-gray-600 hover:text-black flex items-center gap-2">
                ← Back to Markets
              </button>
              {session && pointBalance !== null && (
                <div className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'monospace' }}>
                  Balance: {pointBalance.toFixed(0)} pts
                </div>
              )}
            </div>

            {md ? (
              <>
                <h1 className="text-5xl font-black mb-3" style={{ fontFamily: "Figtree, sans-serif" }}>
                  {md.market.title}
                </h1>
                {md.market.description && (
                  <p className="text-lg text-gray-600 mb-2">{md.market.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500" style={{ fontFamily: 'monospace' }}>
                  <span className={`px-2 py-1 rounded font-semibold uppercase text-xs ${
                    md.market.status === 'open' ? 'bg-green-100 text-green-700' :
                    md.market.status === 'resolved' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{md.market.status}</span>
                  <span>Volume: {md.market.volume.toFixed(0)} pts</span>
                  {md.market.resolutionDate && (
                    <span>Resolves: {new Date(md.market.resolutionDate).toLocaleDateString()}</span>
                  )}
                </div>

                {/* Price history chart */}
                {md.priceHistories && md.priceHistories.length > 0 && (
                  <div className="mt-6 bg-white border border-gray-200 rounded-xl p-5">
                    <PriceChart series={md.priceHistories.slice(0, 8)} width={700} height={260} id={`detail-${md.market.id}`} />
                  </div>
                )}
              </>
            ) : (
              <div className="text-gray-400">Loading...</div>
            )}
          </div>
        </div>

        {md && (
          <div className="max-w-7xl mx-auto px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Outcomes list */}
              <div className="lg:col-span-2 space-y-3">
                <h2 className="text-sm uppercase tracking-wider text-gray-400 font-semibold mb-4">Outcomes</h2>
                {md.outcomes.map(outcome => {
                  const isSelected = selectedOutcome === outcome.id;
                  const pricePercent = Math.round(outcome.price * 100);
                  const position = md.userPositions?.find(p => p.outcomeId === outcome.id);

                  return (
                    <div
                      key={outcome.id}
                      className={`border rounded-xl p-4 transition-all ${
                        isSelected ? 'border-black shadow-md' : 'border-gray-200 hover:border-gray-300'
                      } ${outcome.isWinner === true ? 'bg-green-50 border-green-300' : outcome.isWinner === false ? 'bg-gray-50 opacity-60' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {outcome.player?.countryCode && (
                            <img
                              src={`https://flagcdn.com/24x18/${outcome.player.countryCode}.png`}
                              width="24" height="18" alt="" className="flex-shrink-0"
                            />
                          )}
                          <div>
                            <span className="font-semibold text-gray-900">{outcome.label}</span>
                            {outcome.player && (
                              <span className="text-xs text-gray-400 ml-2">{outcome.player.office} · {outcome.player.elo} ELO</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'monospace' }}>
                            {pricePercent}¢
                          </span>
                          {md.market.status === 'open' && session && (
                            <button
                              onClick={() => setSelectedOutcome(isSelected ? null : outcome.id)}
                              className={`px-4 py-2 text-sm font-semibold rounded transition-colors ${
                                isSelected ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                              }`}
                            >
                              {isSelected ? 'Selected' : 'Buy'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Price bar */}
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                        <div
                          className={`h-full rounded-full transition-all ${outcome.isWinner === true ? 'bg-green-500' : 'bg-gray-900'}`}
                          style={{ width: `${Math.min(100, pricePercent)}%` }}
                        />
                      </div>

                      {/* User position */}
                      {position && position.shares > 0 && (
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                          <span className="text-xs text-gray-500">
                            You own {position.shares.toFixed(2)} shares (avg {(position.avgCostBasis * 100).toFixed(0)}¢)
                          </span>
                          {md.market.status === 'open' && (
                            <button
                              onClick={() => sellShares(outcome.id, position.shares)}
                              className="text-xs text-red-600 hover:text-red-800 font-semibold"
                            >
                              Sell All
                            </button>
                          )}
                        </div>
                      )}

                      {outcome.isWinner === true && (
                        <div className="mt-2 text-sm font-bold text-green-700">✓ Winner</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bet placement sidebar */}
              <div className="lg:col-span-1">
                {md.market.status === 'open' && session ? (
                  <div className="sticky top-8 border border-gray-200 rounded-xl p-6">
                    <h3 className="font-bold text-gray-900 mb-4" style={{ fontFamily: 'Figtree, sans-serif' }}>Place a Bet</h3>

                    {selectedOutcome ? (
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-3 rounded">
                          <span className="text-sm font-medium text-gray-700">
                            {md.outcomes.find(o => o.id === selectedOutcome)?.label}
                          </span>
                          <span className="text-sm text-gray-500 ml-2">
                            @ {Math.round((md.outcomes.find(o => o.id === selectedOutcome)?.price || 0) * 100)}¢
                          </span>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (pts)</label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={betAmount}
                            onChange={(e) => setBetAmount(e.target.value)}
                            placeholder="10"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                            style={{ fontFamily: 'monospace' }}
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            Available: {pointBalance?.toFixed(0) || 0} pts
                          </p>
                        </div>

                        {/* Preview */}
                        {previewShares && (
                          <div className="bg-gray-50 p-4 rounded space-y-2" style={{ fontFamily: 'monospace' }}>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Shares</span>
                              <span className="font-semibold">{previewShares.shares.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Avg Price</span>
                              <span className="font-semibold">{(previewShares.avgPrice * 100).toFixed(1)}¢</span>
                            </div>
                            <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                              <span className="text-gray-500">If YES, payout</span>
                              <span className="font-bold text-green-700">{previewShares.potentialPayout.toFixed(2)} pts</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Potential profit</span>
                              <span className="font-bold text-green-700">+{(previewShares.potentialPayout - parseFloat(betAmount)).toFixed(2)} pts</span>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={placeBet}
                          disabled={saving || !betAmount || parseFloat(betAmount) <= 0 || parseFloat(betAmount) > (pointBalance || 0)}
                          className="w-full px-6 py-3 bg-black text-white font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors rounded-lg"
                        >
                          {saving ? 'Placing...' : `Buy for ${betAmount || '0'} pts`}
                        </button>

                        {/* Limit order toggle */}
                        <div className="border-t border-gray-200 pt-3 mt-1">
                          <button
                            onClick={() => setShowLimitOrder(!showLimitOrder)}
                            className="text-xs text-gray-500 hover:text-gray-800 font-medium transition-colors"
                          >
                            {showLimitOrder ? '▾ Hide limit order' : '▸ Set a limit order'}
                          </button>

                          {showLimitOrder && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-3">
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Target Price (¢)</label>
                                <input
                                  type="number" min="1" max="99" step="1"
                                  value={limitTargetPrice}
                                  onChange={e => setLimitTargetPrice(e.target.value)}
                                  placeholder={`e.g. ${Math.max(1, Math.round((md.outcomes.find(o => o.id === selectedOutcome)?.price || 0.5) * 80))}¢`}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                                  style={{ fontFamily: 'monospace' }}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Amount (pts)</label>
                                <input
                                  type="number" min="1" step="1"
                                  value={limitAmount}
                                  onChange={e => setLimitAmount(e.target.value)}
                                  placeholder="10"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                                  style={{ fontFamily: 'monospace' }}
                                />
                              </div>
                              <button
                                onClick={() => placeLimitOrder(md.market.id, selectedOutcome, 'buy')}
                                disabled={saving || !limitTargetPrice || !limitAmount || parseFloat(limitAmount) <= 0}
                                className="w-full px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                              >
                                {saving ? 'Placing...' : `Limit Buy @ ${limitTargetPrice || '—'}¢`}
                              </button>
                              <p className="text-xs text-gray-400">Order fills when price drops to your target.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">Select an outcome to place a bet.</p>
                    )}
                  </div>
                ) : !session ? (
                  <div className="border border-gray-200 rounded-lg p-6 text-center">
                    <p className="text-gray-500 mb-4">Sign in to place bets</p>
                    <button onClick={signInWithGoogle} className="px-6 py-2 bg-black text-white rounded font-semibold hover:bg-gray-800 transition-colors">
                      Sign in with Google
                    </button>
                  </div>
                ) : md.market.status === 'resolved' ? (
                  <div className="border border-gray-200 rounded-lg p-6">
                    <p className="text-sm font-semibold text-blue-700">This market has been resolved.</p>
                    <p className="text-xs text-gray-500 mt-2">Winning shares have been paid out at 1 pt each.</p>
                  </div>
                ) : null}

                {/* Recent activity */}
                {md.recentBets && md.recentBets.length > 0 && (
                  <div className="mt-6 border border-gray-200 rounded-xl p-6">
                    <h3 className="font-bold text-gray-900 mb-4" style={{ fontFamily: 'Figtree, sans-serif' }}>Recent Activity</h3>
                    <div className="space-y-2">
                      {md.recentBets.slice(0, 10).map(bet => {
                        const outcome = md.outcomes.find(o => o.id === bet.outcomeId);
                        return (
                          <div key={bet.id} className="flex items-center justify-between text-xs" style={{ fontFamily: 'monospace' }}>
                            <span className={bet.direction === 'buy' ? 'text-green-600' : 'text-red-600'}>
                              {bet.direction === 'buy' ? 'BUY' : 'SELL'} {bet.shares.toFixed(1)} · {outcome?.label || '?'}
                            </span>
                            <span className="text-gray-400">
                              {new Date(bet.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Comments / Trash Talk */}
                <div className="mt-6 border border-gray-200 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-4" style={{ fontFamily: 'Figtree, sans-serif' }}>
                    Trash Talk {comments.length > 0 && <span className="text-gray-400 font-normal text-sm ml-1">({comments.length})</span>}
                  </h3>

                  {commentsLoading ? (
                    <div className="text-xs text-gray-400 text-center py-4">Loading comments...</div>
                  ) : comments.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">No comments yet. Be the first!</p>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                      {comments.map(c => (
                        <div key={c.id} className="flex gap-2">
                          <div className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-500">
                            {(c.display_name || '?')[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs font-semibold text-gray-900">{c.display_name}</span>
                              <span className="text-xs text-gray-300" style={{ fontFamily: 'monospace' }}>
                                {new Date(c.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 break-words">{c.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {session ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && commentText.trim()) postComment('market', md.market.id); }}
                        placeholder="Drop some trash talk..."
                        maxLength={500}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                      />
                      <button
                        onClick={() => postComment('market', md.market.id)}
                        disabled={!commentText.trim()}
                        className="px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        Send
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 text-center">Sign in to comment</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // PORTFOLIO VIEW
  if (currentView === "portfolio") {
    const totalInvested = userPositions.reduce((sum, p) => sum + p.costBasis, 0);
    const totalCurrentValue = userPositions.reduce((sum, p) => sum + p.currentValue, 0);
    const totalPnL = totalCurrentValue - totalInvested;
    const fmtPts = (v) => v >= 10 ? v.toFixed(0) : v.toFixed(2);

    return (
      <div className="min-h-screen bg-white">
        <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;700;900&display=swap" rel="stylesheet" />
        <div className="border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <button onClick={() => setCurrentView("markets")} className="text-gray-600 hover:text-black mb-6 flex items-center gap-2 text-sm">
              ← Back to Markets
            </button>
            <h1 className="text-5xl font-black mb-4" style={{ fontFamily: "Figtree, sans-serif" }}>Portfolio</h1>

            {/* Total value headline */}
            {portfolioHistory && (
              <div className="mb-2">
                <div className="text-4xl font-black text-gray-900" style={{ fontFamily: 'monospace' }}>
                  {fmtPts(portfolioHistory.currentTotalValue || (pointBalance || 0) + totalCurrentValue)} pts
                </div>
                <div className={`text-sm font-semibold ${(portfolioHistory.totalProfit || totalPnL) >= 0 ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: 'monospace' }}>
                  {(portfolioHistory.totalProfit || totalPnL) >= 0 ? '+' : ''}{fmtPts(portfolioHistory.totalProfit || totalPnL)} pts all time
                </div>
              </div>
            )}

            {/* Portfolio performance chart */}
            {portfolioHistory?.history && portfolioHistory.history.length >= 2 && (
              <div className="mt-4 mb-2 bg-white border border-gray-200 rounded-xl p-5">
                <PriceChart
                  series={[{
                    id: 'portfolio',
                    label: 'Total Value',
                    currentPrice: (portfolioHistory.currentTotalValue || 0) / 100,
                    points: portfolioHistory.history.map(h => ({ time: h.time, price: h.totalValue / Math.max(1, portfolioHistory.totalDeposited || 100) })),
                  }]}
                  width={700}
                  height={200}
                  id="portfolio-chart"
                />
              </div>
            )}

            {/* Balance summary */}
            <div className="grid grid-cols-4 gap-6 mt-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-xs uppercase tracking-wider text-gray-400 mb-1">Available</div>
                <div className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'monospace' }}>
                  {fmtPts(pointBalance || 0)}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-xs uppercase tracking-wider text-gray-400 mb-1">Invested</div>
                <div className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'monospace' }}>
                  {fmtPts(totalInvested)}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-xs uppercase tracking-wider text-gray-400 mb-1">Current Value</div>
                <div className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'monospace' }}>
                  {fmtPts(totalCurrentValue)}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-xs uppercase tracking-wider text-gray-400 mb-1">P&L</div>
                <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: 'monospace' }}>
                  {totalPnL >= 0 ? '+' : ''}{fmtPts(totalPnL)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* Limit Orders */}
          {userOrders.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Figtree, sans-serif' }}>Open Orders</h2>
              <div className="space-y-2">
                {userOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between border border-gray-200 rounded-xl p-4">
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-wider">{order.marketTitle}</div>
                      <div className="font-semibold text-gray-900">
                        <span className={order.direction === 'buy' ? 'text-green-600' : 'text-red-600'}>{order.direction.toUpperCase()}</span>
                        {' '}{order.outcomeLabel} @ {Math.round(order.targetPrice * 100)}¢
                      </div>
                      <div className="text-xs text-gray-500" style={{ fontFamily: 'monospace' }}>
                        Amount: {order.amount} pts · Filled: {order.filledAmount}
                      </div>
                    </div>
                    <button
                      onClick={() => cancelOrder(order.id)}
                      className="text-xs text-red-600 hover:text-red-800 font-semibold px-3 py-1 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {userPositions.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg mb-4">No positions yet.</p>
              <button
                onClick={() => { setCurrentView("markets"); loadMarkets(); }}
                className="px-6 py-3 bg-black text-white font-semibold rounded hover:bg-gray-800 transition-colors"
              >
                Browse Markets
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {userPositions.map(pos => {
                const pnl = pos.currentValue - pos.costBasis;
                return (
                  <div key={pos.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">{pos.marketTitle}</div>
                        <div className="font-semibold text-gray-900">{pos.outcomeLabel}</div>
                      </div>
                      <div className="text-right" style={{ fontFamily: 'monospace' }}>
                        <div className="text-sm text-gray-500">{pos.shares.toFixed(2)} shares</div>
                        <div className="text-sm">
                          <span className="text-gray-500">Avg: {(pos.avgCostBasis * 100).toFixed(0)}¢</span>
                          <span className="mx-2">·</span>
                          <span className="text-gray-500">Now: {(pos.currentPrice * 100).toFixed(0)}¢</span>
                        </div>
                        <div className={`font-bold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {pnl >= 0 ? '+' : ''}{pnl >= 10 ? pnl.toFixed(0) : pnl.toFixed(2)} pts
                        </div>
                      </div>
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

  // ADMIN VIEW
  if (currentView === "admin" && authUser?.isAdmin) {
    return (
      <div className="min-h-screen bg-white">
        <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;700;900&display=swap" rel="stylesheet" />
        <div className="border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <button onClick={() => setCurrentView("rankings")} className="text-gray-600 hover:text-black mb-6 flex items-center gap-2 text-sm">
              ← Back to Rankings
            </button>
            <h1 className="text-5xl font-black mb-2" style={{ fontFamily: "Figtree, sans-serif" }}>Admin Panel</h1>
            <p className="text-lg text-gray-600" style={{ fontFamily: "monospace" }}>
              Manage users, balances, and markets.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* Users & Balances */}
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Figtree, sans-serif' }}>Users & Balances</h2>

          {adminLoading ? (
            <div className="text-center py-12 text-gray-400" style={{ fontFamily: 'monospace' }}>Loading...</div>
          ) : (
            <div className="overflow-x-auto mb-12">
              <table className="w-full border-collapse" style={{ fontFamily: 'monospace' }}>
                <thead>
                  <tr className="border-b-2 border-gray-200 text-left">
                    <th className="py-3 pr-4 text-xs uppercase tracking-wider text-gray-400 font-semibold">User</th>
                    <th className="py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-semibold">Player</th>
                    <th className="py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-semibold text-right">Balance</th>
                    <th className="py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-semibold text-right">Wagered</th>
                    <th className="py-3 px-4 text-xs uppercase tracking-wider text-gray-400 font-semibold text-center">Admin</th>
                    <th className="py-3 pl-4 text-xs uppercase tracking-wider text-gray-400 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map(u => (
                    <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="text-sm font-medium text-gray-900">{u.displayName}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        {u.playerName ? (
                          <div className="text-sm">
                            <span className="text-gray-900">{u.playerName}</span>
                            <span className="text-gray-400 ml-1">({u.playerElo})</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">Not linked</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.balance !== null ? (
                          <span className="text-sm font-semibold text-gray-900">{u.balance.toFixed(0)}</span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm text-gray-500">{u.totalWagered ? u.totalWagered.toFixed(0) : '0'}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {u.isAdmin && <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full">Admin</span>}
                      </td>
                      <td className="py-3 pl-4">
                        {editBalanceUserId === u.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={editBalanceValue}
                              onChange={(e) => setEditBalanceValue(e.target.value)}
                              placeholder="New balance"
                              className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                            />
                            <input
                              type="text"
                              value={editBalanceReason}
                              onChange={(e) => setEditBalanceReason(e.target.value)}
                              placeholder="Reason"
                              className="w-32 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                            />
                            <button
                              onClick={() => updateUserBalance(u.id)}
                              disabled={saving}
                              className="px-3 py-1 bg-black text-white text-xs font-semibold rounded-lg hover:bg-gray-800 disabled:bg-gray-300 transition-colors"
                            >
                              {saving ? '...' : 'Save'}
                            </button>
                            <button
                              onClick={() => { setEditBalanceUserId(null); setEditBalanceValue(''); setEditBalanceReason(''); }}
                              className="px-2 py-1 text-xs text-gray-400 hover:text-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditBalanceUserId(u.id); setEditBalanceValue(u.balance?.toFixed(0) || '1000'); }}
                            className="text-xs text-gray-500 hover:text-black font-medium transition-colors"
                          >
                            Edit Balance
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Weekly Recap */}
          <div className="mb-12 border border-gray-200 rounded-xl p-6 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: 'Figtree, sans-serif' }}>Weekly Recap</h2>
                <p className="text-sm text-gray-500 mt-1">Generate and post the weekly recap to Slack. Runs automatically Fridays at 5:15 PM GMT.</p>
              </div>
              <button
                onClick={sendWeeklyRecap}
                disabled={saving}
                className="px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {saving ? 'Sending...' : '📨 Send Recap Now'}
              </button>
            </div>
          </div>

          {/* Markets Management */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Figtree, sans-serif' }}>Markets</h2>
            <button
              onClick={() => setShowCreateMarket(!showCreateMarket)}
              className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              {showCreateMarket ? 'Cancel' : '+ Create Market'}
            </button>
          </div>

          {showCreateMarket && (
            <div className="border border-gray-200 rounded-xl p-6 mb-6 bg-gray-50">
              <h3 className="font-semibold text-lg mb-4">New Market</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newMarketTitle}
                    onChange={e => setNewMarketTitle(e.target.value)}
                    placeholder="e.g. Who will be #1 ranked at year end?"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                  <textarea
                    value={newMarketDesc}
                    onChange={e => setNewMarketDesc(e.target.value)}
                    placeholder="Additional context about this market..."
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={newMarketCategory}
                      onChange={e => setNewMarketCategory(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
                    >
                      <option value="season">Season</option>
                      <option value="match">Match</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Date (optional)</label>
                    <input
                      type="date"
                      value={newMarketResolution}
                      onChange={e => setNewMarketResolution(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Outcomes</label>
                  <div className="space-y-2">
                    {newMarketOutcomes.map((outcome, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={outcome.label}
                          onChange={e => {
                            const updated = [...newMarketOutcomes];
                            updated[i] = { ...updated[i], label: e.target.value };
                            setNewMarketOutcomes(updated);
                          }}
                          placeholder={`Outcome ${i + 1}`}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        />
                        <select
                          value={outcome.playerId || ''}
                          onChange={e => {
                            const updated = [...newMarketOutcomes];
                            updated[i] = { ...updated[i], playerId: e.target.value || null };
                            setNewMarketOutcomes(updated);
                          }}
                          className="w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
                        >
                          <option value="">Link player (optional)</option>
                          {players.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        {newMarketOutcomes.length > 2 && (
                          <button
                            onClick={() => setNewMarketOutcomes(newMarketOutcomes.filter((_, j) => j !== i))}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setNewMarketOutcomes([...newMarketOutcomes, { label: '', playerId: '' }])}
                    className="mt-2 text-sm text-gray-500 hover:text-black font-medium transition-colors"
                  >
                    + Add Outcome
                  </button>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={createMarket}
                    disabled={saving}
                    className="px-6 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Creating...' : 'Create Market'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {marketsData.map(market => (
              <div key={market.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{market.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400" style={{ fontFamily: 'monospace' }}>
                      <span>{market.outcomes.length} outcomes</span>
                      <span>{market.volume.toFixed(0)} pts volume</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      market.status === 'open' ? 'bg-green-100 text-green-700' :
                      market.status === 'resolved' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{market.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {claimModal}
      </div>
    );
  }

  // =========================
  // HEAD-TO-HEAD VIEW
  // =========================
  if (currentView === "h2h") {
    return (
      <div className="min-h-screen bg-white">
        <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;700;900&display=swap" rel="stylesheet" />
        <div className="border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <button onClick={() => setCurrentView("rankings")} className="text-gray-600 hover:text-black mb-6 flex items-center gap-2 text-sm">
              ← Back to Rankings
            </button>
            <h1 className="text-5xl font-black mb-4" style={{ fontFamily: "Figtree, sans-serif" }}>Head to Head</h1>
            <p className="text-lg text-gray-600">Compare any two players' rivalry history.</p>

            {/* Player selectors */}
            <div className="flex items-center gap-4 mt-6">
              <select value={h2hPlayer1} onChange={e => setH2hPlayer1(e.target.value)} className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none flex-1">
                <option value="">Select Player 1...</option>
                {players.map(p => <option key={p.id} value={p.id}>{p.name} ({p.office})</option>)}
              </select>
              <span className="text-2xl font-black text-gray-300">VS</span>
              <select value={h2hPlayer2} onChange={e => setH2hPlayer2(e.target.value)} className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none flex-1">
                <option value="">Select Player 2...</option>
                {players.map(p => <option key={p.id} value={p.id}>{p.name} ({p.office})</option>)}
              </select>
              <button
                onClick={() => loadH2H(h2hPlayer1, h2hPlayer2)}
                disabled={!h2hPlayer1 || !h2hPlayer2 || h2hPlayer1 === h2hPlayer2 || h2hLoading}
                className="px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {h2hLoading ? 'Loading...' : 'Compare'}
              </button>
            </div>
          </div>
        </div>

        {h2hData && (
          <div className="max-w-7xl mx-auto px-8 py-8">
            {/* Score summary */}
            <div className="grid grid-cols-3 gap-6 mb-10">
              <div className="text-center bg-gray-50 rounded-xl p-6">
                <div className="text-sm text-gray-500 mb-1">{h2hData.player1.name}</div>
                <div className="text-5xl font-black text-gray-900">{h2hData.h2h.p1Wins}</div>
                <div className="text-xs text-gray-400 mt-1">{h2hData.player1.elo} ELO · {h2hData.player1.office}</div>
              </div>
              <div className="text-center flex flex-col items-center justify-center">
                <div className="text-sm text-gray-400 mb-2">Total Matches</div>
                <div className="text-3xl font-bold text-gray-900">{h2hData.h2h.p1Wins + h2hData.h2h.p2Wins}</div>
                {h2hData.h2h.currentStreak && h2hData.h2h.currentStreak.count >= 2 && (
                  <div className="mt-3 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                    🔥 {h2hData.h2h.currentStreak.count}-match streak
                  </div>
                )}
              </div>
              <div className="text-center bg-gray-50 rounded-xl p-6">
                <div className="text-sm text-gray-500 mb-1">{h2hData.player2.name}</div>
                <div className="text-5xl font-black text-gray-900">{h2hData.h2h.p2Wins}</div>
                <div className="text-xs text-gray-400 mt-1">{h2hData.player2.elo} ELO · {h2hData.player2.office}</div>
              </div>
            </div>

            {/* Win bar */}
            {(h2hData.h2h.p1Wins + h2hData.h2h.p2Wins > 0) && (
              <div className="mb-10">
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
                  <div className="bg-green-500 transition-all" style={{ width: `${(h2hData.h2h.p1Wins / (h2hData.h2h.p1Wins + h2hData.h2h.p2Wins)) * 100}%` }} />
                  <div className="bg-blue-500 transition-all" style={{ width: `${(h2hData.h2h.p2Wins / (h2hData.h2h.p1Wins + h2hData.h2h.p2Wins)) * 100}%` }} />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500" style={{ fontFamily: 'monospace' }}>
                  <span>Avg margin: {h2hData.h2h.p1AvgMargin?.toFixed(1) || '—'} pts</span>
                  <span>Avg margin: {h2hData.h2h.p2AvgMargin?.toFixed(1) || '—'} pts</span>
                </div>
              </div>
            )}

            {/* Match history */}
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Figtree, sans-serif' }}>Match History</h2>
            {h2hData.h2h.matches.length === 0 ? (
              <p className="text-gray-400 py-8 text-center">These players haven't faced each other yet.</p>
            ) : (
              <div className="space-y-2">
                {[...h2hData.h2h.matches].reverse().map((m, i) => {
                  const isP1Winner = m.winnerId === h2hData.player1.id;
                  return (
                    <div key={m.id || i} className="flex items-center justify-between border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold px-2 py-0.5 rounded ${isP1Winner ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {isP1Winner ? 'W' : 'L'}
                        </span>
                        <span className="font-semibold text-gray-900">{h2hData.player1.name}</span>
                        {m.winnerScore != null && (
                          <span className="text-sm text-gray-500" style={{ fontFamily: 'monospace' }}>
                            {isP1Winner ? m.winnerScore : m.loserScore} - {isP1Winner ? m.loserScore : m.winnerScore}
                          </span>
                        )}
                        <span className="font-semibold text-gray-900">{h2hData.player2.name}</span>
                        <span className={`text-sm font-bold px-2 py-0.5 rounded ${!isP1Winner ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {!isP1Winner ? 'W' : 'L'}
                        </span>
                      </div>
                      <div className="text-right text-xs text-gray-400" style={{ fontFamily: 'monospace' }}>
                        <div>{new Date(m.recordedAt).toLocaleDateString()}</div>
                        {m.p1Elo && m.p2Elo && (
                          <div className="text-gray-300">ELO: {m.p1Elo} vs {m.p2Elo}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {claimModal}
      </div>
    );
  }

  // =========================
  // TRADERS LEADERBOARD VIEW
  // =========================
  if (currentView === "leaderboard") {
    return (
      <div className="min-h-screen bg-white">
        <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;700;900&display=swap" rel="stylesheet" />
        <div className="border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <button onClick={() => setCurrentView("markets")} className="text-gray-600 hover:text-black mb-6 flex items-center gap-2 text-sm">
              ← Back to Markets
            </button>
            <h1 className="text-5xl font-black mb-4" style={{ fontFamily: "Figtree, sans-serif" }}>Top Traders</h1>
            <p className="text-lg text-gray-600">Who's making the best predictions?</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8">
          {tradersLoading ? (
            <div className="text-center py-16 text-gray-400">Loading...</div>
          ) : tradersData.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No trading activity yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ fontFamily: 'monospace' }}>
                <thead>
                  <tr className="border-b border-gray-300 text-xs uppercase tracking-wider text-gray-400">
                    <th className="text-left py-3 pr-4">Rank</th>
                    <th className="text-left py-3 px-4">Trader</th>
                    <th className="text-right py-3 px-4">Profit</th>
                    <th className="text-right py-3 px-4">ROI</th>
                    <th className="text-right py-3 px-4">Invested</th>
                    <th className="text-right py-3 px-4">Current Val</th>
                    <th className="text-right py-3 px-4">Trades</th>
                    <th className="text-right py-3 pl-4">Markets</th>
                  </tr>
                </thead>
                <tbody>
                  {tradersData.map((t, i) => (
                    <tr key={t.userId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4">
                        <span className={`text-lg font-bold ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-700' : 'text-gray-900'}`}>
                          {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{t.displayName}</div>
                        {t.playerName && <div className="text-xs text-gray-400">{t.playerName}</div>}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${t.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {t.totalProfit >= 0 ? '+' : ''}{t.totalProfit.toFixed(1)}
                      </td>
                      <td className={`py-3 px-4 text-right ${t.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {t.roi >= 0 ? '+' : ''}{t.roi.toFixed(0)}%
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">{t.totalInvested.toFixed(0)}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{t.currentValue.toFixed(0)}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{t.tradesCount}</td>
                      <td className="py-3 pl-4 text-right text-gray-600">{t.marketsTraded}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {claimModal}
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
                  <div key={match.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow bg-white group">
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

                      {(authUser?.isAdmin || authUser?.playerId === match.winnerId || authUser?.playerId === match.loserId) && (
                        <button onClick={() => deleteMatch(match.id)} className="ml-6 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100" title="Delete match">
                          <Trash2 size={18} />
                        </button>
                      )}
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

            <div className="flex items-center gap-3">
              {authUser ? (
                <div className="flex items-center gap-2 mr-2">
                  <span className="text-sm text-gray-600" style={{ fontFamily: "monospace" }}>{authUser.displayName}</span>
                  {pointBalance !== null && (
                    <button
                      onClick={() => { setCurrentView("portfolio"); loadBalance(); loadPortfolioHistory(); loadOrders(); }}
                      className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full hover:bg-gray-200 transition-colors"
                      style={{ fontFamily: 'monospace' }}
                    >
                      {pointBalance.toFixed(0)} pts
                    </button>
                  )}
                  <button onClick={signOut} className="p-2 text-gray-400 hover:text-gray-700 transition-colors" title="Sign out">
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button onClick={signInWithGoogle} className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors rounded-lg">
                  <LogIn size={16} />
                  Sign in
                </button>
              )}
              <button onClick={() => { setCurrentView("markets"); loadMarkets(); }} className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors rounded-lg">
                Markets
              </button>
              <button onClick={() => setCurrentView("matches")} className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors rounded-lg">
                Matches
              </button>
              {(authUser?.playerId || authUser?.isAdmin) && (
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="px-5 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors rounded-lg">
                  + Record Match
                </button>
              )}
              {authUser?.isAdmin && (
                <button
                  onClick={() => { setCurrentView("admin"); loadAdminUsers(); loadMarkets('all'); }}
                  className="px-4 py-2 bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors rounded-lg"
                >
                  Admin
                </button>
              )}
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

      {/* Featured Markets Preview */}
      {featuredMarkets.length > 0 && (
        <div className="max-w-7xl mx-auto px-8 pt-10 pb-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Figtree, sans-serif' }}>
              Prediction Markets
            </h2>
            <button
              onClick={() => { setCurrentView("markets"); loadMarkets(); }}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
              style={{ fontFamily: 'monospace' }}
            >
              View all →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredMarkets.map(market => {
              const histories = market.priceHistories || [];
              const lead = histories[0];
              const leadPrice = lead ? (lead.currentPrice || lead.points?.[lead.points.length - 1]?.price || 0) : 0;
              const leadInitial = lead?.points?.[0]?.price || leadPrice;
              const priceChange = leadPrice - leadInitial;
              const changeColor = priceChange >= 0 ? 'text-green-600' : 'text-red-500';
              const changeSign = priceChange >= 0 ? '+' : '';

              return (
                <button
                  key={market.id}
                  onClick={() => {
                    setSelectedMarket(market.id);
                    loadMarketDetail(market.id);
                    setCurrentView("market-detail");
                  }}
                  className="text-left bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-gray-300 transition-all group"
                >
                  {/* Market title */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2" style={{ fontFamily: 'Figtree, sans-serif' }}>
                      {market.title}
                    </h3>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-semibold uppercase flex-shrink-0" style={{ fontSize: '10px' }}>
                      Live
                    </span>
                  </div>

                  {/* Multi-line sparkline chart */}
                  <div className="mb-2">
                    <MiniSparkline series={histories.slice(0, 5)} width={260} height={48} id={market.id} />
                  </div>

                  {/* Top outcomes with color dots */}
                  <div className="space-y-1">
                    {histories.slice(0, 4).map((s, si) => {
                      const price = s.currentPrice || s.points?.[s.points.length - 1]?.price || 0;
                      return (
                        <div key={s.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[si % CHART_COLORS.length] }} />
                            <span className="text-xs text-gray-600 truncate" style={{ fontFamily: 'monospace' }}>
                              {s.label}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-gray-900 flex-shrink-0 ml-2" style={{ fontFamily: 'monospace' }}>
                            {Math.round(price * 100)}¢
                          </span>
                        </div>
                      );
                    })}
                    {market.totalOutcomes > 4 && (
                      <p className="text-xs text-gray-400 pl-3.5" style={{ fontFamily: 'monospace' }}>
                        +{market.totalOutcomes - 4} more
                      </p>
                    )}
                  </div>

                  {/* Volume */}
                  {market.volume > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-400" style={{ fontFamily: 'monospace' }}>
                        Vol: {market.volume.toFixed(0)} pts
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Open Challenges */}
      {challenges.length > 0 && (
        <div className="max-w-7xl mx-auto px-8 pt-6 pb-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">⚔️ Open Challenges</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {challenges.filter(c => c.status === 'pending').slice(0, 6).map(c => (
              <div key={c.id} className="border border-amber-200 bg-amber-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-sm">{c.challenger?.name}</span>
                    <span className="text-xs text-gray-400">vs</span>
                    <span className="font-semibold text-gray-900 text-sm">{c.challenged?.name}</span>
                  </div>
                  <span className="text-xs text-amber-600 font-semibold">Pending</span>
                </div>
                {c.message && <p className="text-xs text-gray-600 mb-2 italic">"{c.message}"</p>}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400" style={{ fontFamily: 'monospace' }}>
                    {c.challenger?.elo} vs {c.challenged?.elo} ELO
                  </span>
                  {authUser?.playerId === c.challenged?.id && (
                    <div className="flex gap-2">
                      <button onClick={() => respondToChallenge(c.id, 'accepted')} className="text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-lg hover:bg-green-200 transition-colors">Accept</button>
                      <button onClick={() => respondToChallenge(c.id, 'declined')} className="text-xs font-semibold text-red-700 bg-red-100 px-2.5 py-1 rounded-lg hover:bg-red-200 transition-colors">Decline</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Activity Feed */}
      {activityFeed.length > 0 && (
        <div className="max-w-7xl mx-auto px-8 pb-2 pt-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Live Activity</span>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {activityFeed.slice(0, 8).map((evt, i) => (
                <div key={i} className="flex items-center justify-between text-xs" style={{ fontFamily: 'monospace' }}>
                  <span className="text-gray-700">
                    {evt.type === 'match' && (
                      <>🏓 <span className="font-semibold">{evt.data.winnerName}</span> beat <span className="font-semibold">{evt.data.loserName}</span>{evt.data.winnerScore != null ? ` ${evt.data.winnerScore}-${evt.data.loserScore}` : ''} <span className="text-gray-400">({evt.data.winnerEloChange > 0 ? '+' : ''}{evt.data.winnerEloChange?.toFixed?.(0) || evt.data.winnerEloChange} ELO)</span></>
                    )}
                    {evt.type === 'bet' && (
                      <>💰 <span className="font-semibold">{evt.data.userName}</span> {evt.data.direction === 'buy' ? 'bought' : 'sold'} {evt.data.shares?.toFixed?.(1) || evt.data.shares} shares of <span className="font-semibold">{evt.data.outcomeLabel}</span> <span className="text-gray-400">in {evt.data.marketTitle}</span></>
                    )}
                    {evt.type === 'market_created' && (
                      <>📊 New market: <span className="font-semibold">{evt.data.title}</span></>
                    )}
                    {evt.type === 'market_resolved' && (
                      <>✅ Market resolved: <span className="font-semibold">{evt.data.title}</span></>
                    )}
                  </span>
                  <span className="text-gray-400 flex-shrink-0 ml-3">
                    {(() => {
                      const d = new Date(evt.timestamp);
                      const diff = Date.now() - d.getTime();
                      if (diff < 60000) return 'just now';
                      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
                      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
                      return d.toLocaleDateString();
                    })()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="max-w-7xl mx-auto px-8 pt-4 pb-2">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => { setCurrentView("h2h"); }}
            className="px-4 py-2 text-xs font-semibold border border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all text-gray-600"
          >
            ⚔️ Head to Head
          </button>
          <button
            onClick={() => { setCurrentView("leaderboard"); loadTraders(); }}
            className="px-4 py-2 text-xs font-semibold border border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all text-gray-600"
          >
            📈 Top Traders
          </button>
          {authUser?.playerId && (
            <div className="flex items-center gap-2 ml-auto">
              <select
                value={challengeTarget}
                onChange={e => setChallengeTarget(e.target.value)}
                className="text-xs px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-gray-400"
              >
                <option value="">Challenge someone...</option>
                {players.filter(p => p.id !== authUser.playerId).map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.elo})</option>
                ))}
              </select>
              <input
                type="text"
                value={challengeMessage}
                onChange={e => setChallengeMessage(e.target.value)}
                placeholder="Trash talk (optional)"
                maxLength={200}
                className="text-xs px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-gray-400 w-40"
              />
              <button
                onClick={() => challengeTarget && sendChallenge(challengeTarget)}
                disabled={!challengeTarget || saving}
                className="px-4 py-2 text-xs font-semibold bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? '...' : '⚔️ Send'}
              </button>
            </div>
          )}
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
              </tr>
            </thead>

            <tbody>
              {sortedPlayers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-16 text-gray-400">
                    No players registered yet. Add a player to get started.
                  </td>
                </tr>
              ) : (
                (() => {
                  return sortedPlayers.map((player) => {
                  const rankChange = player.lastWeekRank ? player.lastWeekRank - player.rank : 0;
                  const countryData = COUNTRIES.find((c) => c.code === player.countryCode);

                  const totalMatches = player.wins + player.losses;
                  const isQualified = totalMatches >= MIN_GAMES_FOR_QUALIFICATION;
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
      loadAchievements(player.id);
    }}
    className="text-sm text-gray-900 whitespace-nowrap hover:text-pink-600 hover:underline transition-colors"
  >
    {player.name}
  </button>
  <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold flex-shrink-0">
    {player.office}
  </span>
</div>
                            {(authUser?.isAdmin || authUser?.playerId === player.id) && (
                              <button
                                onClick={() => startEditPlayer(player)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                                title="Edit player"
                              >
                                <Edit2 size={14} className="text-gray-500" />
                              </button>
                            )}
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

                      </tr>

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
        Prediction Markets
      </h3>
      <p className="text-gray-700 leading-relaxed" style={{ fontFamily: "sans-serif" }}>
        Use your Hall of Fame points to buy shares on outcomes — who'll finish #1, who makes top 5, and more. Shares are priced 1¢–99¢ based on demand. If your outcome wins, each share pays 1 pt.
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
                    <select value={selectedWinner} onChange={(e) => setSelectedWinner(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all">
                      <option value="">Select winner...</option>
                      {players.map((player) => (
                        <option key={player.id} value={player.id}>{player.name} ({player.office}) - ELO: {player.elo}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Loser</label>
                    <select value={selectedLoser} onChange={(e) => setSelectedLoser(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all">
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
                        <input type="number" min="0" value={winnerScore} onChange={(e) => setWinnerScore(e.target.value)} placeholder="21" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Loser Score</label>
                        <input type="number" min="0" value={loserScore} onChange={(e) => setLoserScore(e.target.value)} placeholder="19" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Match Date (Optional)</label>
                    <input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} max={new Date().toISOString().split("T")[0]} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none" />
                    <p className="text-xs text-gray-500 mt-2">Leave blank to use today's date.</p>
                  </div>

                  {!authUser?.isAdmin && authUser?.playerId && selectedWinner && selectedLoser && authUser.playerId !== selectedWinner && authUser.playerId !== selectedLoser && (
                    <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">You can only record matches you played in.</p>
                  )}
                  <button onClick={recordMatch} disabled={saving || !selectedWinner || !selectedLoser || selectedWinner === selectedLoser || (!authUser?.isAdmin && authUser?.playerId !== selectedWinner && authUser?.playerId !== selectedLoser)} className="w-full px-6 py-3 bg-black text-white font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors rounded-lg">
                    {saving ? 'Saving...' : 'Record Match'}
                  </button>
                </div>
              ) : activeTab === "edit" ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Player Name</label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                    <select value={editCountry} onChange={(e) => setEditCountry(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all">
                      <option value="">Select country...</option>
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>{country.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Office</label>
                    <select value={editOffice} onChange={(e) => setEditOffice(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all">
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
                    <button onClick={cancelEdit} className="px-6 py-3 border-2 border-gray-300 font-semibold hover:bg-gray-100 transition-colors rounded-lg">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Player Name</label>
                    <input type="text" value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Enter player name..." className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                    <select value={newPlayerCountry} onChange={(e) => setNewPlayerCountry(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all">
                      <option value="">Select country...</option>
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>{country.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Office</label>
                    <select value={newPlayerOffice} onChange={(e) => setNewPlayerOffice(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all">
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

                  <button onClick={addPlayer} disabled={saving || !newPlayerName.trim() || !newPlayerCountry || !newPlayerOffice} className="w-full px-6 py-3 bg-black text-white font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors rounded-lg">
                    {saving ? 'Saving...' : 'Add Player'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity" onClick={() => setSidebarOpen(false)} />}
        {claimModal}
      </div>
    </div>
  );
}
