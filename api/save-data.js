// api/save-data.js
// Vercel Serverless Function to securely save ping pong data to GitHub

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { players, matches } = req.body;

  // Validate request body
  if (!players || !matches) {
    return res.status(400).json({ error: 'Missing players or matches data' });
  }

  // GitHub configuration from environment variables
  const GITHUB_CONFIG = {
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    branch: 'main',
    filePath: 'data/pingpong.json'
  };

  // Check if environment variables are set
  if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_OWNER || !process.env.GITHUB_REPO) {
    console.error('Missing environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Step 1: Get current file SHA (required for updates)
    const getUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.filePath}?ref=${GITHUB_CONFIG.branch}`;
    
    const getResponse = await fetch(getUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Ping-Pong-Tracker'
      }
    });

    let sha = null;
    if (getResponse.ok) {
      const fileData = await getResponse.json();
      sha = fileData.sha;
    } else if (getResponse.status !== 404) {
      // If not a 404 (file doesn't exist), something else went wrong
      const errorText = await getResponse.text();
      console.error('Failed to get file SHA:', errorText);
      return res.status(500).json({ error: 'Failed to fetch current file' });
    }

    // Step 2: Prepare data to save
    const data = {
      players,
      matches,
      lastUpdated: new Date().toISOString()
    };

    // Convert to base64 (GitHub API requirement)
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

    // Step 3: Prepare GitHub API request body
    const body = {
      message: `Update ping pong data - ${new Date().toLocaleString()}`,
      content: content,
      branch: GITHUB_CONFIG.branch
    };

    // Include SHA if file exists (required for updates)
    if (sha) {
      body.sha = sha;
    }

    // Step 4: Save to GitHub
    const putUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.filePath}`;
    
    const putResponse = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Ping-Pong-Tracker'
      },
      body: JSON.stringify(body)
    });

    // Step 5: Handle response
    if (putResponse.ok) {
      const result = await putResponse.json();
      console.log('Successfully saved to GitHub');
      return res.status(200).json({ 
        success: true, 
        sha: result.content.sha,
        message: 'Data saved successfully'
      });
    } else {
      const errorText = await putResponse.text();
      console.error('GitHub API error:', errorText);
      
      // Try to parse error for more details
      try {
        const errorJson = JSON.parse(errorText);
        return res.status(putResponse.status).json({ 
          error: 'Failed to save to GitHub',
          details: errorJson.message || 'Unknown error'
        });
      } catch {
        return res.status(putResponse.status).json({ 
          error: 'Failed to save to GitHub',
          details: errorText
        });
      }
    }
  } catch (error) {
    console.error('Error saving data:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
