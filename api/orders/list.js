// api/orders/list.js
// List user's limit orders. Auth required.

import { supabase, setCorsHeaders, getAuthUser } from '../_lib/supabase.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const status = req.query?.status || 'open';
  const validStatuses = ['all', 'open', 'filled', 'cancelled', 'partial'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const db = supabase();

  try {
    let query = db
      .from('limit_orders')
      .select(`
        id,
        market_id,
        outcome_id,
        direction,
        target_price,
        amount,
        filled_amount,
        status,
        created_at,
        markets ( title ),
        market_outcomes ( label )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: orders, error } = await query;

    if (error) throw error;

    const formatted = (orders || []).map(o => ({
      id: o.id,
      marketId: o.market_id,
      marketTitle: o.markets?.title || null,
      outcomeId: o.outcome_id,
      outcomeLabel: o.market_outcomes?.label || null,
      direction: o.direction,
      targetPrice: o.target_price,
      amount: o.amount,
      filledAmount: o.filled_amount,
      status: o.status,
      createdAt: o.created_at,
    }));

    return res.status(200).json({ orders: formatted });
  } catch (err) {
    console.error('List orders error:', err);
    return res.status(500).json({ error: err.message });
  }
}
