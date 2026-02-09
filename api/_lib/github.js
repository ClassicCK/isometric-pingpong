// api/_lib/github.js
// Shared utilities for atomic GitHub data operations

function getGitHubConfig() {
  return {
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    branch: 'main',
    filePath: 'data/pingpong.json',
    token: process.env.GITHUB_TOKEN,
  };
}

function getHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'Ping-Pong-Tracker',
  };
}

// Fetch the latest data + SHA from GitHub
export async function fetchData() {
  const config = getGitHubConfig();
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.filePath}?ref=${config.branch}`;

  const response = await fetch(url, { headers: getHeaders(config.token) });

  if (response.ok) {
    const fileData = await response.json();
    const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
    const data = JSON.parse(content);
    return {
      players: data.players || [],
      matches: data.matches || [],
      sha: fileData.sha,
    };
  } else if (response.status === 404) {
    return { players: [], matches: [], sha: null };
  } else {
    const errorText = await response.text();
    throw new Error(`Failed to fetch data from GitHub: ${response.status} ${errorText}`);
  }
}

// Write data to GitHub with a specific SHA (for optimistic concurrency)
// Returns { ok, sha, status }
export async function writeData(players, matches, sha) {
  const config = getGitHubConfig();
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.filePath}`;

  const data = {
    players,
    matches,
    lastUpdated: new Date().toISOString(),
  };

  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

  const body = {
    message: `Update ping pong data - ${new Date().toLocaleString()}`,
    content,
    branch: config.branch,
  };

  if (sha) {
    body.sha = sha;
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers: getHeaders(config.token),
    body: JSON.stringify(body),
  });

  if (response.ok) {
    const result = await response.json();
    return { ok: true, sha: result.content.sha, status: response.status };
  } else {
    return { ok: false, sha: null, status: response.status };
  }
}

// Atomic update: fetch latest data, apply a function, write back, retry on conflict
// applyFn receives { players, matches } and must return { players, matches } (the updated state)
export async function atomicUpdate(applyFn, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const { players, matches, sha } = await fetchData();

    const updated = await applyFn({ players, matches });

    const result = await writeData(updated.players, updated.matches, sha);

    if (result.ok) {
      return {
        success: true,
        players: updated.players,
        matches: updated.matches,
        sha: result.sha,
      };
    }

    if (result.status === 409) {
      console.log(`SHA conflict on attempt ${attempt}/${maxRetries}, retrying...`);
      if (attempt === maxRetries) {
        throw new Error('Failed to save after max retries due to concurrent writes');
      }
      continue;
    }

    throw new Error(`GitHub write failed with status ${result.status}`);
  }
}

// ELO calculation — must be identical to the client-side version in App.jsx
export function calculateELO(winnerELO, loserELO, winnerScoreVal = null, loserScoreVal = null, K = 32) {
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
    kFactorUsed: adjustedK,
    expectedWinProbability: expectedWinner,
  };
}

// Calculate rank changes (last week's rank) — must match App.jsx
export function calculateRankChanges(updatedPlayers) {
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
}

// CORS helper for all endpoints
export function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Validate that required env vars are present
export function validateEnv() {
  if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_OWNER || !process.env.GITHUB_REPO) {
    return false;
  }
  return true;
}
