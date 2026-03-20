// api/orders/cancel.js
// Cancel an open limit order. Auth required.

import { supabase, setCorsHeaders, getAuthUser } from '../_lib/supabase.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const { orderId } = req.body || {};

  if (!orderId) {
    return res.status(400).json({ error: 'orderId is required' });
  }

  const db = supabase();

  try {
    // Fetch the order
    const { data: order, error: fetchError } = await db
      .from('limit_orders')
      .select('id, user_id, direction, amount, filled_amount, status')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.user_id !== user.id) {
      return res.status(403).json({ error: 'Not authorized to cancel this order' });
    }

    if (order.status !== 'open' && order.status !== 'partial') {
      return res.status(400).json({ error: `Cannot cancel order with status "${order.status}"` });
    }

    // For buy orders, refund the unfilled amount
    if (order.direction === 'buy') {
      const unfilledAmount = Math.round((parseFloat(order.amount) - parseFloat(order.filled_amount)) * 100) / 100;

      if (unfilledAmount > 0) {
        // Credit balance
        const { data: balance } = await db
          .from('point_balances')
          .select('balance')
          .eq('user_id', user.id)
          .single();

        const newBalance = Math.round((parseFloat(balance.balance) + unfilledAmount) * 100) / 100;

        await db
          .from('point_balances')
          .update({
            balance: newBalance,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        // Record refund transaction
        await db
          .from('point_transactions')
          .insert({
            user_id: user.id,
            amount: unfilledAmount,
            type: 'market_refund',
            description: `Limit order cancelled: refund ${unfilledAmount.toFixed(2)} points`,
            reference_id: orderId,
            balance_after: newBalance,
          });
      }
    }

    // For sell orders, no balance to refund (shares weren't moved)

    // Update order status
    const { error: updateError } = await db
      .from('limit_orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (updateError) throw updateError;

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Cancel order error:', err);
    return res.status(500).json({ error: err.message });
  }
}
