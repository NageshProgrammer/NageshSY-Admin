import { RequestHandler } from "express";
import { sql } from "drizzle-orm";
import { db } from "../src/lib/db";

/**
 * Get all transactions with pagination
 * GET /api/admin/transactions
 */
export const getTransactions: RequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status as string;

    let whereClause = "";
    if (status && status !== "all") {
      whereClause = `WHERE us.status = '${status}'`;
    }

    const transactions = await db.execute(sql.raw(`
      SELECT
        us.id,
        u.id AS user_id,
        u.name AS user_name,
        u.email,
        u.credits,
        us.plan_name,
        us.billing_cycle,
        us.amount_paid,
        us.currency,
        us.status,
        us.payment_gateway,
        us.created_at,
        us.start_date,
        us.end_date,
        CASE 
          WHEN u.credits > 0 AND us.amount_paid > 0 THEN 'Converted from Trial'
          WHEN u.credits = 100 THEN 'Active Trial'
          ELSE 'Direct Purchase'
        END AS subscription_source
      FROM user_subscriptions us
      JOIN users u ON u.id = us.user_id
      ${whereClause}
      ORDER BY us.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `));

    const countResult = await db.execute(sql.raw(`
      SELECT COUNT(*) AS total
      FROM user_subscriptions us
      ${whereClause}
    `));

    const total = Number((countResult.rows[0] as any).total);

    res.json({
      success: true,
      data: {
        transactions: transactions.rows.map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          user: row.user_name || row.email,
          email: row.email,
          plan: row.plan_name,
          billingCycle: row.billing_cycle,
          amount: Number(row.amount_paid),
          currency: row.currency,
          status: row.status,
          paymentGateway: row.payment_gateway,
          date: row.created_at,
          startDate: row.start_date,
          endDate: row.end_date,
          credits: row.credits,
          subscriptionSource: row.subscription_source,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error("Get transactions error:", err);
    res.status(500).json({ error: "Failed to load transactions" });
  }
};

/**
 * Get transaction by ID
 * GET /api/admin/transactions/:transactionId
 */
export const getTransactionById: RequestHandler = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const result = await db.execute(sql`
      SELECT
        us.id,
        u.id AS user_id,
        u.name AS user_name,
        u.email,
        u.credits,
        us.plan_name,
        us.billing_cycle,
        us.amount_paid,
        us.currency,
        us.status,
        us.payment_gateway,
        us.created_at,
        us.start_date,
        us.end_date,
        us.raw_response
      FROM user_subscriptions us
      JOIN users u ON u.id = us.user_id
      WHERE us.id = ${transactionId}
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const row: any = result.rows[0];

    res.json({
      success: true,
      data: {
        id: row.id,
        userId: row.user_id,
        user: row.user_name,
        email: row.email,
        credits: row.credits,
        plan: row.plan_name,
        billingCycle: row.billing_cycle,
        amount: Number(row.amount_paid),
        currency: row.currency,
        status: row.status,
        paymentGateway: row.payment_gateway,
        date: row.created_at,
        startDate: row.start_date,
        endDate: row.end_date,
        rawResponse: row.raw_response,
      },
    });
  } catch (err) {
    console.error("Get transaction error:", err);
    res.status(500).json({ error: "Failed to load transaction" });
  }
};

/**
 * Get transaction statistics
 * GET /api/admin/transactions/stats
 */
export const getTransactionStats: RequestHandler = async (_req, res) => {
  try {
    const stats = await db.execute(sql`
      SELECT
        COUNT(*) AS total_transactions,
        COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) AS active_subscriptions,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) AS cancelled_subscriptions,
        COALESCE(SUM(amount_paid::numeric), 0) AS total_revenue,
        COALESCE(AVG(amount_paid::numeric), 0) AS avg_transaction_amount
      FROM user_subscriptions
    `);

    const row: any = stats.rows[0];

    // Revenue by month (last 12 months)
    const revenueByMonth = await db.execute(sql`
      SELECT
        DATE_TRUNC('month', created_at) AS month,
        COUNT(*) AS count,
        COALESCE(SUM(amount_paid::numeric), 0) AS revenue
      FROM user_subscriptions
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month DESC
    `);

    res.json({
      success: true,
      data: {
        totalTransactions: Number(row.total_transactions),
        activeSubscriptions: Number(row.active_subscriptions),
        cancelledSubscriptions: Number(row.cancelled_subscriptions),
        totalRevenue: Number(row.total_revenue),
        avgTransactionAmount: Number(row.avg_transaction_amount),
        revenueByMonth: revenueByMonth.rows.map((r: any) => ({
          month: r.month,
          count: Number(r.count),
          revenue: Number(r.revenue),
        })),
      },
    });
  } catch (err) {
    console.error("Get transaction stats error:", err);
    res.status(500).json({ error: "Failed to load transaction statistics" });
  }
};
