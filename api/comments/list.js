// api/comments/list.js
// List comments/trash talk for a given target. Public endpoint.

import { supabase, setCorsHeaders } from '../_lib/supabase.js';

const VALID_TARGET_TYPES = ['market', 'match', 'player'];

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { targetType, targetId, limit: limitParam } = req.query || {};

  if (!targetType || !VALID_TARGET_TYPES.includes(targetType)) {
    return res.status(400).json({ error: 'targetType must be one of: market, match, player' });
  }

  if (!targetId) {
    return res.status(400).json({ error: 'targetId is required' });
  }

  let limit = parseInt(limitParam, 10) || 50;
  if (limit < 1) limit = 1;
  if (limit > 200) limit = 200;

  const db = supabase();

  try {
    const { data: comments, error } = await db
      .from('comments')
      .select('id, user_id, display_name, content, created_at')
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return res.status(200).json({
      comments: (comments || []).map(c => ({
        id: c.id,
        userId: c.user_id,
        displayName: c.display_name,
        content: c.content,
        createdAt: c.created_at,
      })),
    });
  } catch (err) {
    console.error('Comments list error:', err);
    return res.status(500).json({ error: err.message });
  }
}
