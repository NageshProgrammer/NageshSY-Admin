import { RequestHandler } from "express";
import { pool } from "../src/lib/neon";

const ensureLoginLogTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_login_logs (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255),
      success BOOLEAN NOT NULL,
      ip_address VARCHAR(255),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);
};

export const getLoginLogs: RequestHandler = async (req, res) => {
  try {
    await ensureLoginLogTable();

    const limit = Math.min(Number(req.query.limit || 100), 500);

    const result = await pool.query(
      `
      SELECT id, email, success, ip_address, user_agent, created_at
      FROM admin_login_logs
      ORDER BY created_at DESC
      LIMIT $1
      `,
      [limit]
    );

    res.json({
      success: true,
      data: result.rows.map((row: any) => ({
        id: row.id,
        email: row.email,
        success: row.success,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        createdAt: row.created_at,
      })),
    });
  } catch (err) {
    console.error("Get login logs error:", err);
    res.status(500).json({ error: "Failed to load login logs" });
  }
};

export const getCreditUsage: RequestHandler = async (_req, res) => {
  try {
    const summaryResult = await pool.query(`
      SELECT
        COUNT(*) AS total_users,
        COALESCE(SUM(credits), 0) AS current_credits,
        COALESCE(AVG(credits), 0) AS avg_credits_per_user,
        COALESCE(SUM(CASE WHEN credits <= 20 THEN 1 ELSE 0 END), 0) AS low_credit_users
      FROM users
    `);

    const subscriptionResult = await pool.query(`
      SELECT COALESCE(SUM(amount_paid::numeric), 0) AS total_paid_revenue
      FROM user_subscriptions
      WHERE status = 'ACTIVE'
    `);

    const topUsersResult = await pool.query(`
      SELECT id, name, email, credits
      FROM users
      ORDER BY credits ASC
      LIMIT 10
    `);

    const summary = summaryResult.rows[0] || {};
    const totalUsers = Number(summary.total_users || 0);
    const estimatedDistributed = totalUsers * 300;
    const currentCredits = Number(summary.current_credits || 0);

    res.json({
      success: true,
      data: {
        totalUsers,
        currentCredits,
        estimatedDistributed,
        estimatedUsed: Math.max(estimatedDistributed - currentCredits, 0),
        avgCreditsPerUser: Number(summary.avg_credits_per_user || 0),
        lowCreditUsers: Number(summary.low_credit_users || 0),
        activeRevenue: Number(subscriptionResult.rows[0]?.total_paid_revenue || 0),
        users: topUsersResult.rows.map((row: any) => ({
          id: row.id,
          name: row.name || "-",
          email: row.email,
          credits: Number(row.credits || 0),
        })),
      },
    });
  } catch (err) {
    console.error("Get credit usage error:", err);
    res.status(500).json({ error: "Failed to load credit usage" });
  }
};
