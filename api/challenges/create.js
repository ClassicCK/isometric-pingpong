// api/challenges/create.js
// Create a new challenge between two players. Auth required.

import { supabase, setCorsHeaders, getAuthUser } from '../_lib/supabase.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const { challengedPlayerId, message } = req.body || {};

  if (!challengedPlayerId) {
    return res.status(400).json({ error: 'challengedPlayerId is required' });
  }

  if (message && message.length > 200) {
    return res.status(400).json({ error: 'Message must be 200 characters or less' });
  }

  const db = supabase();

  try {
    // 1. Look up user's player_id from users table
    const { data: userRow } = await db
      .from('users')
      .select('player_id')
      .eq('id', user.id)
      .single();

    if (!userRow || !userRow.player_id) {
      return res.status(403).json({ error: 'You must have a linked player profile to create challenges' });
    }

    const challengerPlayerId = userRow.player_id;

    // 2. Validate challenged player exists
    const { data: challengedPlayer } = await db
      .from('players')
      .select('id, name')
      .eq('id', challengedPlayerId)
      .single();

    if (!challengedPlayer) {
      return res.status(404).json({ error: 'Challenged player not found' });
    }

    // 3. Prevent challenging yourself
    if (challengerPlayerId === challengedPlayerId) {
      return res.status(400).json({ error: 'You cannot challenge yourself' });
    }

    // 4. Check no existing pending challenge between these two players (either direction)
    const { data: existingChallenges } = await db
      .from('challenges')
      .select('id')
      .eq('status', 'pending')
      .or(
        `and(challenger_id.eq.${challengerPlayerId},challenged_id.eq.${challengedPlayerId}),and(challenger_id.eq.${challengedPlayerId},challenged_id.eq.${challengerPlayerId})`
      );

    if (existingChallenges && existingChallenges.length > 0) {
      return res.status(409).json({ error: 'A pending challenge already exists between these players' });
    }

    // 5. Look up the challenged player's user_id (may be null if unclaimed)
    const { data: challengedUserRow } = await db
      .from('users')
      .select('id, email')
      .eq('player_id', challengedPlayerId)
      .single();

    const challengedUserId = challengedUserRow?.id || null;
    const challengedEmail = challengedUserRow?.email || null;

    // 6. Look up challenger name for the email
    const { data: challengerPlayer } = await db
      .from('players')
      .select('name')
      .eq('id', challengerPlayerId)
      .single();

    const challengerName = challengerPlayer?.name || 'Someone';

    // 7. Insert the challenge
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: challenge, error: insertError } = await db
      .from('challenges')
      .insert({
        challenger_id: challengerPlayerId,
        challenger_user_id: user.id,
        challenged_id: challengedPlayerId,
        challenged_user_id: challengedUserId,
        message: message || null,
        status: 'pending',
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 8. Send email notification if challenged user has an email
    if (challengedEmail && process.env.RESEND_API_KEY) {
      try {
        const messageHtml = message
          ? `<p style="margin:16px 0;padding:12px 16px;background:#f0f0f0;border-radius:8px;font-style:italic;">"${message}"</p>`
          : '';

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Isometric Ping Pong <onboarding@resend.dev>',
            to: [challengedEmail],
            subject: `${challengerName} challenged you to ping pong!`,
            html: `
              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
                <h2 style="color:#1a1a1a;margin-bottom:8px;">You've been challenged!</h2>
                <p style="color:#444;font-size:16px;"><strong>${challengerName}</strong> wants to play you in ping pong.</p>
                ${messageHtml}
                <p style="margin-top:24px;">
                  <a href="https://isometric.com" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">View Challenge</a>
                </p>
                <p style="color:#888;font-size:13px;margin-top:24px;">This challenge expires in 7 days.</p>
              </div>
            `,
          }),
        });
      } catch (emailErr) {
        // Email failure is non-blocking
        console.error('Failed to send challenge email:', emailErr);
      }
    }

    // 9. Return the challenge
    return res.status(201).json({
      challenge: {
        id: challenge.id,
        challengerId: challenge.challenger_id,
        challengedId: challenge.challenged_id,
        message: challenge.message,
        status: challenge.status,
        createdAt: challenge.created_at,
      },
    });
  } catch (err) {
    console.error('Create challenge error:', err);
    return res.status(500).json({ error: err.message });
  }
}
