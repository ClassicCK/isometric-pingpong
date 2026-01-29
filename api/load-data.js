// api/load-data.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const GITHUB_CONFIG = {
    owner: process.env.GITHUB_OWNER || 'ClassicCK',
    repo: process.env.GITHUB_REPO || 'isometric-pingpong',
    branch: 'main',
    filePath: 'data/pingpong.json'
  };

  if (!process.env.GITHUB_TOKEN) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.filePath}?ref=${GITHUB_CONFIG.branch}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Ping-Pong-Tracker'
      }
    });

    if (response.ok) {
      const fileData = await response.json();
      const content = atob(fileData.content);
      const data = JSON.parse(content);
      
      return res.status(200).json({
        players: data.players || [],
        matches: data.matches || [],
        lastUpdated: data.lastUpdated || new Date().toISOString(),
        sha: fileData.sha
      });
    } else if (response.status === 404) {
      return res.status(200).json({
        players: [],
        matches: [],
        sha: null
      });
    } else {
      return res.status(response.status).json({ error: 'Failed to load from GitHub' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
