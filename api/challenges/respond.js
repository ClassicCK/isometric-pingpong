// api/challenges/respond.js
// Accept or decline a challenge. Auth required.

import { supabase, setCorsHeaders, getAuthUser } from '../_lib/supabase.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const { challengeId, response } = req.body || {};

  if (!challengeId) {
    return res.status(400).json({ error: 'challengeId is required' });
  }

  if (response !== 'accepted' && response !== 'declined') {
    return res.status(400).json({ error: 'response must be "accepted" or "declined"' });
  }

  const db = supabase();

  try {
    // 1. Fetch the challenge
    const { data: challenge } = await db
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    if (challenge.status !== 'pending') {
      return res.status(400).json({ error: `Challenge is already ${challenge.status}` });
    }

    // 2. Verify the user is the challenged party
    let isAuthorized = false;

    if (challenge.challenged_user_id) {
      // If challenged_user_id is set, user must match it
      isAuthorized = challenge.challenged_user_id === user.id;
    } else {
      // If challenged_user_id is null, check if user's player_id matches challenged_id
      const { data: userRow } = await db
        .from('users')
        .select('player_id')
        .eq('id', user.id)
        .single();

      isAuthorized = userRow?.player_id === challenge.challenged_id;
    }

    if (!isAuthorized) {
      return res.status(403).json({ error: 'You are not the challenged player' });
    }

    // 3. Update challenge status
    const respondedAt = new Date().toISOString();

    const { data: updatedChallenge, error: updateError } = await db
      .from('challenges')
      .update({
        status: response,
        responded_at: respondedAt,
      })
      .eq('id', challengeId)
      .select()
      .single();

    if (updateError) throw updateError;

    // 4. Send email notification to the challenger
    if (challenge.challenger_user_id && process.env.RESEND_API_KEY) {
      try {
        // Get challenger email
        const { data: challengerUser } = await db
          .from('users')
          .select('email')
          .eq('id', challenge.challenger_user_id)
          .single();

        // Get challenged player name
        const { data: challengedPlayer } = await db
          .from('players')
          .select('name')
          .eq('id', challenge.challenged_id)
          .single();

        const challengedName = challengedPlayer?.name || 'Your opponent';
        const challengerEmail = challengerUser?.email;

        if (challengerEmail) {
          const statusColor = response === 'accepted' ? '#16a34a' : '#dc2626';
          const statusEmoji = response === 'accepted' ? 'Game on!' : 'Maybe next time.';

          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Isometric Ping Pong <onboarding@resend.dev>',
              to: [challengerEmail],
              subject: `${challengedName} ${response} your ping pong challenge`,
              html: `
                <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
                  <h2 style="color:${statusColor};margin-bottom:8px;">Challenge ${response}!</h2>
                  <p style="color:#444;font-size:16px;"><strong>${challengedName}</strong> has ${response} your ping pong challenge.</p>
                  <p style="color:#444;font-size:16px;">${statusEmoji}</p>
                  <p style="margin-top:24px;">
                    <a href="https://isometric.com" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">View Details</a>
                  </p>
                </div>
              `,
            }),
          });
        }
      } catch (emailErr) {
        // Email failure is non-blocking
        console.error('Failed to send response email:', emailErr);
      }
    }

    // 5. Return updated challenge
    return res.status(200).json({
      success: true,
      challenge: {
        id: updatedChallenge.id,
        challengerId: updatedChallenge.challenger_id,
        challengedId: updatedChallenge.challenged_id,
        message: updatedChallenge.message,
        status: updatedChallenge.status,
        createdAt: updatedChallenge.created_at,
        respondedAt: updatedChallenge.responded_at,
      },
    });
  } catch (err) {
    console.error('Respond to challenge error:', err);
    return res.status(500).json({ error: err.message });
  }
}
