// api/comments/create.js
// Post a comment on a target. Requires auth.

import { supabase, setCorsHeaders, getAuthUser } from '../_lib/supabase.js';

const VALID_TARGET_TYPES = ['market', 'match', 'player', 'h2h'];

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const { targetType, targetId, content: rawContent } = req.body || {};

  if (!targetType || !VALID_TARGET_TYPES.includes(targetType)) {
    return res.status(400).json({ error: 'targetType must be one of: market, match, player' });
  }

  if (!targetId) {
    return res.status(400).json({ error: 'targetId is required' });
  }

  const content = (rawContent || '').trim();
  if (!content) {
    return res.status(400).json({ error: 'Content cannot be empty' });
  }
  if (content.length > 500) {
    return res.status(400).json({ error: 'Content must be 500 characters or less' });
  }

  const db = supabase();

  try {
    // Look up user's display name
    const { data: userRow, error: userError } = await db
      .from('users')
      .select('display_name')
      .eq('id', user.id)
      .single();

    if (userError) throw userError;

    const displayName = userRow?.display_name || 'Anonymous';

    // Insert comment
    const { data: comment, error: insertError } = await db
      .from('comments')
      .insert({
        user_id: user.id,
        display_name: displayName,
        target_type: targetType,
        target_id: targetId,
        content,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return res.status(200).json({
      comment: {
        id: comment.id,
        userId: comment.user_id,
        displayName: comment.display_name,
        content: comment.content,
        createdAt: comment.created_at,
      },
    });
  } catch (err) {
    console.error('Create comment error:', err);
    return res.status(500).json({ error: err.message });
  }
}
