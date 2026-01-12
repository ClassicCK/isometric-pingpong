import React, { useState, useEffect } from 'react';
import { Plus, X, Menu, TrendingUp, TrendingDown, Minus, ChevronUp, ChevronDown } from 'lucide-react';

// Country flag emoji mapping
const COUNTRY_FLAGS = {
  'USA': '🇺🇸', 'UK': '🇬🇧', 'Canada': '🇨🇦', 'Germany': '🇩🇪', 'France': '🇫🇷',
  'Japan': '🇯🇵', 'China': '🇨🇳', 'South Korea': '🇰🇷', 'Australia': '🇦🇺', 'Brazil': '🇧🇷',
  'India': '🇮🇳', 'Mexico': '🇲🇽', 'Spain': '🇪🇸', 'Italy': '🇮🇹', 'Netherlands': '🇳🇱',
  'Sweden': '🇸🇪', 'Switzerland': '🇨🇭', 'Poland': '🇵🇱', 'Belgium': '🇧🇪', 'Denmark': '🇩🇰',
  'Norway': '🇳🇴', 'Finland': '🇫🇮', 'Russia': '🇷🇺', 'Singapore': '🇸🇬', 'Taiwan': '🇹🇼',
  'Hong Kong': '🇭🇰', 'Israel': '🇮🇱', 'Argentina': '🇦🇷', 'Chile': '🇨🇱', 'Portugal': '🇵🇹'
};

const COUNTRY_LIST = Object.keys(COUNTRY_FLAGS).sort();

// GitHub configuration - update these with your values
const GITHUB_CONFIG = {
  owner: 'YOUR_GITHUB_USERNAME',  // e.g., 'christopherkilner'
  repo: 'isometric-pingpong',      // your repository name
  branch: 'main',                  // branch name
  filePath: 'data/pingpong.json'   // path to data file in repo
};

// Probability Cell Component - Full width shaded box
function ProbabilityCell({ probability }) {
  const getBackgroundColor = (prob) => {
    if (prob === 0) return '#ffffff';
    
    const white = { r: 255, g: 255, b: 255 };
    const middle = { r: 249, g: 223, b: 226 }; // #f9dfe2
    const dark = { r: 233, g: 30, b: 99 }; // #e91e63
    
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
        fontSize: '14px',
        fontWeight: probability > 0 ? 'normal' : 'normal'
      }}
    >
      {probability > 0 ? `${probability}%` : '—'}
    </div>
  );
}

export default function PingPongELO() {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState('');
  const [selectedLoser, setSelectedLoser] = useState('');
  const [loading, setLoading] = useState(true);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerCountry, setNewPlayerCountry] = useState('');
  const [activeTab, setActiveTab] = useState('match');
  const [sortColumn, setSortColumn] = useState('rank');
  const [sortDirection, setSortDirection] = useState('asc');
  const [fileSha, setFileSha] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  // Load data from GitHub
  const loadData = async () => {
    try {
      setLoading(true);
      
      // For local development, use localStorage as fallback
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const localPlayers = localStorage.getItem('pingpong:players_local');
        const localMatches = localStorage.getItem('pingpong:matches_local');
        
        if (localPlayers) setPlayers(JSON.parse(localPlayers));
        if (localMatches) setMatches(JSON.parse(localMatches));
        setLoading(false);
        return;
      }

      // Fetch from GitHub
      const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.filePath}?ref=${GITHUB_CONFIG.branch}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const fileData = await response.json();
        setFileSha(fileData.sha);
        
        // Decode base64 content
        const content = atob(fileData.content);
        const data = JSON.parse(content);
        
        setPlayers(data.players || []);
        setMatches(data.matches || []);
      } else if (response.status === 404) {
        // File doesn't exist yet, start with empty data
        console.log('No data file found, starting fresh');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save data to GitHub
  const saveData = async (newPlayers, newMatches) => {
    try {
      // For local development, use localStorage
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        localStorage.setItem('pingpong:players_local', JSON.stringify(newPlayers));
        localStorage.setItem('pingpong:matches_local', JSON.stringify(newMatches));
        return;
      }

      const data = {
        players: newPlayers,
        matches: newMatches,
        lastUpdated: new Date().toISOString()
      };

      // Convert data to base64
      const content = btoa(JSON.stringify(data, null, 2));

      // Prepare request body
      const body = {
        message: `Update ping pong data - ${new Date().toLocaleString()}`,
        content: content,
        branch: GITHUB_CONFIG.branch
      };

      // Include SHA if we're updating existing file
      if (fileSha) {
        body.sha = fileSha;
      }

      // Update file in GitHub
      const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.filePath}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // Note: For production, you'll need to use GitHub Actions or a backend API
          // to handle authentication securely
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const result = await response.json();
        setFileSha(result.content.sha);
        console.log('Data saved to GitHub successfully');
      } else {
        console.error('Failed to save to GitHub:', await response.text());
      }
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const calculateELO = (winnerELO, loserELO, K = 32) => {
    const expectedWinner = 1 / (1 + Math.pow(10, (loserELO - winnerELO) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winnerELO - loserELO) / 400));
    
    return {
      winnerNew: Math.round(winnerELO + K * (1 - expectedWinner)),
      loserNew: Math.round(loserELO + K * (0 - expectedLoser))
    };
  };

  const calculateTournamentProbabilities = (playerELO, allPlayers) => {
    if (allPlayers.length < 2) {
      return { playoff: 0, quarterfinals: 0, semifinals: 0, finals: 0 };
    }

    const sortedByELO = [...allPlayers].sort((a, b) => b.elo - a.elo);
    const playerRank = sortedByELO.findIndex(p => p.elo === playerELO) + 1;
    const totalPlayers = sortedByELO.length;
    
    const avgOpponentELO = allPlayers
      .filter(p => p.elo !== playerELO)
      .reduce((sum, p) => sum + p.elo, 0) / (allPlayers.length - 1);
    
    const avgWinProb = 1 / (1 + Math.pow(10, (avgOpponentELO - playerELO) / 400));
    const rankFactor = 1 - ((playerRank - 1) / totalPlayers) * 0.3;
    
    const playoff = Math.min(100, Math.round(avgWinProb * 100 * rankFactor));
    const quarterfinals = Math.min(100, Math.round(Math.pow(avgWinProb, 1.5) * 100 * rankFactor));
    const semifinals = Math.min(100, Math.round(Math.pow(avgWinProb, 2) * 100 * rankFactor));
    const finals = Math.min(100, Math.round(Math.pow(avgWinProb, 2.5) * 100 * rankFactor));
    
    return { playoff, quarterfinals, semifinals, finals };
  };

  const addPlayer = () => {
    if (!newPlayerName.trim() || !newPlayerCountry) return;
    
    const newPlayer = {
      id: Date.now().toString(),
      name: newPlayerName.trim(),
      country: newPlayerCountry,
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

    const { winnerNew, loserNew } = calculateELO(winner.elo, loser.elo);
    const timestamp = new Date().toISOString();

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
      return p;
    });

    const playersWithRanks = calculateRankChanges(updatedPlayers);

    const newMatch = {
      id: Date.now().toString(),
      winnerId: selectedWinner,
      loserId: selectedLoser,
      winner: winner.name,
      loser: loser.name,
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
    const playersWithRanks = calculateRankChanges([...players]);
    const playersWithData = playersWithRanks.map((player, index) => {
      const rank = playersWithRanks.sort((a, b) => b.elo - a.elo).findIndex(p => p.id === player.id) + 1;
      const probabilities = calculateTournamentProbabilities(player.elo, playersWithRanks);
      return { ...player, rank, probabilities };
    });

    return playersWithData.sort((a, b) => {
      let compareA, compareB;
      
      switch (sortColumn) {
        case 'rank':
          compareA = a.rank;
          compareB = b.rank;
          break;
        case 'country':
          compareA = a.country;
          compareB = b.country;
          break;
        case 'name':
          compareA = a.name.toLowerCase();
          compareB = b.name.toLowerCase();
          break;
        case 'elo':
          compareA = a.elo;
          compareB = b.elo;
          break;
        case 'playoff':
          compareA = a.probabilities.playoff;
          compareB = b.probabilities.playoff;
          break;
        case 'quarterfinals':
          compareA = a.probabilities.quarterfinals;
          compareB = b.probabilities.quarterfinals;
          break;
        case 'semifinals':
          compareA = a.probabilities.semifinals;
          compareB = b.probabilities.semifinals;
          break;
        case 'finals':
          compareA = a.probabilities.finals;
          compareB = b.probabilities.finals;
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
      className={`py-4 ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'} ${column === 'playoff' ? 'border-l-2 border-gray-300' : ''} ${column === 'rank' ? 'pr-6' : column === 'country' || column === 'name' || column === 'elo' ? 'px-6' : 'px-0'} text-sm font-normal text-gray-500 uppercase tracking-wide cursor-pointer hover:bg-gray-50 transition-colors select-none`}
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

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-start justify-between mb-6">
            <div className="text-sm text-gray-500 uppercase tracking-wider" style={{ fontFamily: 'sans-serif', letterSpacing: '0.1em' }}>
              UPDATED {formatDate(new Date().toISOString())}, AT {formatTime(new Date().toISOString())}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="px-5 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
              style={{ fontFamily: 'sans-serif' }}
            >
              + Record Match
            </button>
          </div>
          
          <h1 className="text-6xl font-black mb-4" style={{ fontFamily: 'sans-serif', letterSpacing: '-0.02em' }}>
            Isometric Ping Pong Rankings
          </h1>
          
          <p className="text-xl text-gray-700" style={{ fontFamily: 'sans-serif' }}>
            How {players.length} players compare by ELO rating, updated after each match.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="flex items-end justify-end mb-3">
          <div className="text-right">
            <div className="text-sm text-gray-500 uppercase tracking-wide mb-2" style={{ fontFamily: 'sans-serif' }}>
              Probability of Winning Tournament
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ fontFamily: 'monospace' }}>
            <thead>
              <tr className="border-b border-gray-300">
                <SortableHeader column="rank">↑ Rank</SortableHeader>
                <SortableHeader column="country">Country</SortableHeader>
                <SortableHeader column="name">Name</SortableHeader>
                <SortableHeader column="elo" align="right">ELO</SortableHeader>
                <SortableHeader column="playoff" align="center">Playoff</SortableHeader>
                <SortableHeader column="quarterfinals" align="center">Quarters</SortableHeader>
                <SortableHeader column="semifinals" align="center">Semis</SortableHeader>
                <SortableHeader column="finals" align="center">Finals</SortableHeader>
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
                sortedPlayers.map((player) => {
                  const rankChange = player.lastWeekRank ? player.lastWeekRank - player.rank : 0;
                  
                  return (
                    <tr key={player.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
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
                        <span className="text-3xl" title={player.country}>
                          {COUNTRY_FLAGS[player.country] || '🏳️'}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <span className="text-base text-gray-900">{player.name}</span>
                      </td>
                      <td className="py-5 px-6 text-right">
                        <span className="text-xl font-normal text-gray-900">{player.elo}</span>
                      </td>
                      <td className="px-0 border-l-2 border-gray-300">
                        <ProbabilityCell probability={player.probabilities.playoff} />
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
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('match')}
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
              onClick={() => setActiveTab('player')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'player'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
              style={{ fontFamily: 'sans-serif' }}
            >
              Add Player
            </button>
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
                        {COUNTRY_FLAGS[player.country]} {player.name} (ELO: {player.elo})
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
                        {COUNTRY_FLAGS[player.country]} {player.name} (ELO: {player.elo})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedWinner && selectedLoser && selectedWinner !== selectedLoser && (
                  <div className="bg-gray-100 p-4 rounded border border-gray-300">
                    <div className="text-sm text-gray-700" style={{ fontFamily: 'sans-serif' }}>
                      <strong>Preview:</strong> This match will update both players' ELO ratings and tournament probabilities.
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
                    {COUNTRY_LIST.map(country => (
                      <option key={country} value={country}>
                        {COUNTRY_FLAGS[country]} {country}
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
                  disabled={!newPlayerName.trim() || !newPlayerCountry}
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
