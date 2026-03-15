import { RequestHandler } from "express";
import { sql } from "drizzle-orm";
import { db } from "../src/lib/db";
import { pool } from "../src/lib/neon";

const ensureControlTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_user_controls (
      user_id VARCHAR(255) PRIMARY KEY,
      is_suspended BOOLEAN DEFAULT false NOT NULL,
      plan_override VARCHAR(100),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);
};

const tableExists = async (tableName: string): Promise<boolean> => {
  const result = await pool.query("SELECT to_regclass($1) AS table_ref", [tableName]);
  return !!result.rows[0]?.table_ref;
};

/* =========================================================
   ADMIN: LIST USERS (TABLE VIEW)
   GET /api/admin/users
========================================================= */
export const getAdminUsers: RequestHandler = async (_req, res) => {
  try {
    await ensureControlTable();

    const result = await db.execute(sql`
      SELECT
        u.id,
        u.name,
        u.email,
        u.credits,
        u.created_at,
        COALESCE(auc.is_suspended, false) AS is_suspended,
        COALESCE(auc.plan_override, us.plan_name, 'Trial') AS plan,
        COALESCE(k.keyword_count, 0) AS keyword_count,
        COALESCE(c.conversation_count, 0) AS conversation_count,
        COALESCE(l.lead_count, 0) AS lead_count
      FROM users u
      LEFT JOIN admin_user_controls auc ON auc.user_id = u.id
      LEFT JOIN LATERAL (
        SELECT us2.plan_name
        FROM user_subscriptions us2
        WHERE us2.user_id = u.id
        ORDER BY us2.created_at DESC
        LIMIT 1
      ) us ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS keyword_count
        FROM buyer_keywords bk
        WHERE bk.user_id = u.id
      ) k ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS conversation_count
        FROM event_waitlist ew
        WHERE LOWER(ew.email) = LOWER(u.email)
      ) c ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS lead_count
        FROM event_payments ep
        WHERE LOWER(ep.email) = LOWER(u.email)
      ) l ON true
      ORDER BY u.created_at DESC
    `);

    const users = result.rows.map((u: any) => {
      const signupDate = new Date(u.created_at);
      const daysUsed = Math.floor((Date.now() - signupDate.getTime()) / (1000 * 60 * 60 * 24));
      const trialDaysLeft = Math.max(0, 14 - daysUsed);

      return {
        id: u.id,
        name: u.name || "-",
        email: u.email,
        status: u.is_suspended ? "suspended" : trialDaysLeft > 0 ? "trial" : "paid",
        trialDaysLeft: trialDaysLeft > 0 ? trialDaysLeft : null,
        signupDate: signupDate.toISOString().split("T")[0],
        plan: u.plan,
        creditsLeft: Number(u.credits || 0),
        keywordsUsed: Number(u.keyword_count),
        conversationsDetected: Number(u.conversation_count),
        leadsGenerated: Number(u.lead_count),
        lastLogin: signupDate.toISOString(),
      };
    });

    res.json({ success: true, data: users });
  } catch (err) {
    console.error("Admin list users error:", err);
    res.status(500).json({ error: "Failed to load users" });
  }
};

/* =========================================================
   ADMIN: USER DETAILS (MODAL VIEW)
   GET /api/admin/users/:userId
========================================================= */
export const getAdminUserById: RequestHandler = async (req, res) => {
  try {
    await ensureControlTable();

    const { userId } = req.params;

    const userResult = await db.execute(sql`
      SELECT id, name, email, credits, created_at
      FROM users
      WHERE id = ${userId}
      LIMIT 1
    `);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const u: any = userResult.rows[0];
    const signupDate = new Date(u.created_at);
    const daysUsed = Math.floor((Date.now() - signupDate.getTime()) / (1000 * 60 * 60 * 24));
    const trialDaysLeft = Math.max(0, 14 - daysUsed);

    let adminControl: any = null;
    try {
      const controlRes = await pool.query(
        `
        SELECT is_suspended, plan_override
        FROM admin_user_controls
        WHERE user_id = $1
        LIMIT 1
      `,
        [userId]
      );
      adminControl = controlRes.rows[0] || null;
    } catch {
      adminControl = null;
    }

    let subscriptionPlan = "Trial";
    try {
      const planRes = await pool.query(
        `
        SELECT plan_name
        FROM user_subscriptions
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `,
        [userId]
      );
      subscriptionPlan = planRes.rows[0]?.plan_name || "Trial";
    } catch {
      subscriptionPlan = "Trial";
    }

    const resolvedPlan = adminControl?.plan_override || subscriptionPlan;
    const isSuspended = !!adminControl?.is_suspended;

    let onboardingRow: any = null;
    if (await tableExists("onboarding_progress")) {
      try {
        const onboardingRes = await pool.query(
          `SELECT * FROM onboarding_progress WHERE user_id = $1 LIMIT 1`,
          [userId]
        );
        onboardingRow = onboardingRes.rows[0] || null;
      } catch {
        onboardingRow = null;
      }
    }

    let companyRow: any = null;
    if (await tableExists("company_details")) {
      try {
        const companyRes = await pool.query(
          `SELECT * FROM company_details WHERE user_id = $1 LIMIT 1`,
          [userId]
        );
        companyRow = companyRes.rows[0] || null;
      } catch {
        companyRow = null;
      }
    }

    let targetRow: any = null;
    if (await tableExists("target_market")) {
      try {
        const targetRes = await pool.query(
          `SELECT * FROM target_market WHERE user_id = $1 LIMIT 1`,
          [userId]
        );
        targetRow = targetRes.rows[0] || null;
      } catch {
        targetRow = null;
      }
    }

    let platformRow: any = null;
    if (await tableExists("platforms_to_monitor")) {
      try {
        const platformRes = await pool.query(
          `SELECT * FROM platforms_to_monitor WHERE user_id = $1 LIMIT 1`,
          [userId]
        );
        platformRow = platformRes.rows[0] || null;
      } catch {
        platformRow = null;
      }
    }

    let keywords: string[] = [];
    if (await tableExists("buyer_keywords")) {
      try {
        const keywordRes = await pool.query(
          `SELECT keyword FROM buyer_keywords WHERE user_id = $1 ORDER BY created_at DESC`,
          [userId]
        );
        keywords = keywordRes.rows.map((r: any) => String(r.keyword));
      } catch {
        keywords = [];
      }
    }

    let conversationCount = 0;
    if (await tableExists("event_waitlist")) {
      try {
        const convRes = await pool.query(
          `SELECT COUNT(*) AS count FROM event_waitlist WHERE LOWER(email) = LOWER($1)`,
          [u.email]
        );
        conversationCount = Number(convRes.rows[0]?.count || 0);
      } catch {
        conversationCount = 0;
      }
    }

    let leadCount = 0;
    if (await tableExists("event_payments")) {
      try {
        const leadRes = await pool.query(
          `SELECT COUNT(*) AS count FROM event_payments WHERE LOWER(email) = LOWER($1)`,
          [u.email]
        );
        leadCount = Number(leadRes.rows[0]?.count || 0);
      } catch {
        leadCount = 0;
      }
    }

    let renewalDate: string | null = null;
    try {
      const renewalRes = await pool.query(
        `
        SELECT end_date
        FROM user_subscriptions
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `,
        [userId]
      );
      renewalDate = renewalRes.rows[0]?.end_date || null;
    } catch {
      renewalDate = null;
    }

    const posts: Array<{ platform: string; title: string; url: string | null; createdAt: string }> = [];
    const redditExists = await tableExists("reddit_posts");
    const quoraExists = await tableExists("quora_posts");

    if (redditExists) {
      try {
        const redditRes = await pool.query(
          `
          SELECT
            'Reddit' AS platform,
            COALESCE(title, 'Untitled post') AS title,
            permalink AS url,
            created_at
          FROM reddit_posts
          WHERE user_id = $1
          ORDER BY created_at DESC
          LIMIT 50
        `,
          [userId]
        );
        posts.push(...redditRes.rows.map((row: any) => ({
          platform: row.platform,
          title: row.title,
          url: row.url,
          createdAt: row.created_at,
        })));
      } catch {
        // Optional table shape can vary between deployments.
      }
    }

    if (quoraExists) {
      try {
        const quoraRes = await pool.query(
          `
          SELECT
            'Quora' AS platform,
            COALESCE(question, 'Untitled post') AS title,
            url,
            created_at
          FROM quora_posts
          WHERE user_id = $1
          ORDER BY created_at DESC
          LIMIT 50
        `,
          [userId]
        );
        posts.push(...quoraRes.rows.map((row: any) => ({
          platform: row.platform,
          title: row.title,
          url: row.url,
          createdAt: row.created_at,
        })));
      } catch {
        // Optional table shape can vary between deployments.
      }
    }

    posts.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

    const generatedLeadRows: any[] = [];
    if (await tableExists("event_waitlist")) {
      try {
        const waitlistRes = await pool.query(
          `
          SELECT
            'waitlist' AS lead_type,
            ew.email,
            NULL::text AS event_name,
            NULL::numeric AS amount_paid,
            ew.created_at
          FROM event_waitlist ew
          WHERE LOWER(ew.email) = LOWER($1)
          ORDER BY ew.created_at DESC
          LIMIT 100
        `,
          [u.email]
        );
        generatedLeadRows.push(...waitlistRes.rows);
      } catch {
        // Ignore optional lead source failures.
      }
    }

    if (await tableExists("event_payments")) {
      try {
        const paymentLeadsRes = await pool.query(
          `
          SELECT
            'payment' AS lead_type,
            ep.email,
            ep.event_name,
            ep.amount_paid::numeric,
            ep.created_at
          FROM event_payments ep
          WHERE LOWER(ep.email) = LOWER($1)
          ORDER BY ep.created_at DESC
          LIMIT 100
        `,
          [u.email]
        );
        generatedLeadRows.push(...paymentLeadsRes.rows);
      } catch {
        // Ignore optional lead source failures.
      }
    }

    generatedLeadRows.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

    let loginLogs: Array<{ success: boolean; ipAddress: string | null; userAgent: string | null; createdAt: string }> = [];
    if (await tableExists("admin_login_logs")) {
      try {
        const loginRes = await pool.query(
          `
          SELECT success, ip_address, user_agent, created_at
          FROM admin_login_logs
          WHERE LOWER(email) = LOWER($1)
          ORDER BY created_at DESC
          LIMIT 30
        `,
          [u.email]
        );

        loginLogs = loginRes.rows.map((row: any) => ({
          success: !!row.success,
          ipAddress: row.ip_address,
          userAgent: row.user_agent,
          createdAt: row.created_at,
        }));
      } catch {
        loginLogs = [];
      }
    }

    let keywordActivityRows: any[] = [];
    if (await tableExists("buyer_keywords")) {
      try {
        const keywordActivityRes = await pool.query(
          `
          SELECT 'keyword_added' AS action_type, keyword AS description, created_at
          FROM buyer_keywords
          WHERE user_id = $1
          ORDER BY created_at DESC
          LIMIT 50
        `,
          [userId]
        );
        keywordActivityRows = keywordActivityRes.rows;
      } catch {
        keywordActivityRows = [];
      }
    }

    let subscriptionActivityRows: any[] = [];
    if (await tableExists("user_subscriptions")) {
      try {
        const subscriptionActivityRes = await pool.query(
          `
          SELECT
            'subscription' AS action_type,
            CONCAT(COALESCE(plan_name, 'Plan'), ' ', COALESCE(status, 'updated')) AS description,
            created_at
          FROM user_subscriptions
          WHERE user_id = $1
          ORDER BY created_at DESC
          LIMIT 20
        `,
          [userId]
        );
        subscriptionActivityRows = subscriptionActivityRes.rows;
      } catch {
        subscriptionActivityRows = [];
      }
    }

    const mergedActivity = [...keywordActivityRows, ...subscriptionActivityRows]
      .map((row: any) => ({
        actionType: row.action_type,
        description: row.description,
        createdAt: row.created_at,
      }))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 80);

    res.json({
      success: true,
      data: {
        id: u.id,
        name: u.name,
        email: u.email,
        signupDate: signupDate.toISOString(),
        creditsLeft: Number(u.credits || 0),
        renewalDate,
        plan: resolvedPlan,
        status: isSuspended ? "suspended" : trialDaysLeft > 0 ? "trial" : "paid",
        trialDaysLeft,
        onboardingCompleted: !!onboardingRow?.completed,
        onboardingStep: Number(onboardingRow?.current_step || 1),
        onboardingStartedAt: onboardingRow?.created_at || null,
        company: {
          name: companyRow?.company_name || null,
          industry: companyRow?.industry || null,
          website: companyRow?.website_url || null,
          businessEmail: companyRow?.business_email || null,
          phoneNumber: companyRow?.phone_number || null,
          productDescription: companyRow?.product_description || null,
        },
        target: {
          audience: targetRow?.target_audience || null,
          country: targetRow?.target_country || null,
          stateCity: targetRow?.target_state_city || null,
          businessType: targetRow?.business_type || null,
        },
        keywords,
        platforms: {
          linkedin: !!platformRow?.linkedin,
          twitter: !!platformRow?.twitter,
          reddit: !!platformRow?.reddit,
          quora: !!platformRow?.quora,
          facebook: !!platformRow?.facebook,
          youtube: !!platformRow?.youtube,
        },
        conversationsDetected: conversationCount,
        leadsGenerated: leadCount,
        lastLogin: signupDate.toISOString(),
        generatedPosts: posts,
        generatedLeads: generatedLeadRows.map((row: any) => ({
          type: row.lead_type,
          email: row.email,
          eventName: row.event_name,
          amountPaid: row.amount_paid ? Number(row.amount_paid) : null,
          createdAt: row.created_at,
        })),
        loginLogs,
        activityLog: mergedActivity,
      },
    });
  } catch (err) {
    console.error("Admin user detail error:", err);

    try {
      const { userId } = req.params;
      const fallback = await db.execute(sql`
        SELECT id, name, email, credits, created_at
        FROM users
        WHERE id = ${userId}
        LIMIT 1
      `);

      const base = fallback.rows[0] as any;
      if (base) {
        const signupDate = new Date(base.created_at || Date.now());
        const daysUsed = Math.floor((Date.now() - signupDate.getTime()) / (1000 * 60 * 60 * 24));
        const trialDaysLeft = Math.max(0, 14 - daysUsed);

        return res.json({
          success: true,
          data: {
            id: base.id,
            name: base.name || "-",
            email: base.email,
            signupDate: signupDate.toISOString(),
            creditsLeft: Number(base.credits || 0),
            renewalDate: null,
            plan: "Trial",
            status: trialDaysLeft > 0 ? "trial" : "paid",
            trialDaysLeft,
            onboardingCompleted: false,
            onboardingStep: 1,
            onboardingStartedAt: null,
            company: {
              name: null,
              industry: null,
              website: null,
              businessEmail: null,
              phoneNumber: null,
              productDescription: null,
            },
            target: {
              audience: null,
              country: null,
              stateCity: null,
              businessType: null,
            },
            keywords: [],
            platforms: {
              linkedin: false,
              twitter: false,
              reddit: false,
              quora: false,
              facebook: false,
              youtube: false,
            },
            conversationsDetected: 0,
            leadsGenerated: 0,
            lastLogin: signupDate.toISOString(),
            generatedPosts: [],
            generatedLeads: [],
            loginLogs: [],
            activityLog: [],
          },
          warning: err instanceof Error ? err.message : "Partial data returned",
        });
      }
    } catch (fallbackErr) {
      console.error("Admin user detail fallback error:", fallbackErr);
    }

    const errorMessage = err instanceof Error ? err.message : "Failed to fetch user";
    res.status(500).json({ error: errorMessage });
  }
};

/* =========================================================
   ADMIN: USER ACTIVITY
   GET /api/admin/users/:userId/activity
========================================================= */
export const getAdminUserActivity: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;

    const rows = await db.execute(sql`
      WITH activity AS (
        SELECT DATE(created_at) AS day, COUNT(*) AS actions
        FROM buyer_keywords
        WHERE user_id = ${userId}
        GROUP BY DATE(created_at)
      )
      SELECT day, actions
      FROM activity
      ORDER BY day DESC
      LIMIT 14
    `);

    res.json({
      success: true,
      data: rows.rows
        .map((r: any) => ({ date: r.day, actions: Number(r.actions) }))
        .reverse(),
    });
  } catch (err) {
    console.error("User activity error:", err);
    res.status(500).json({ error: "Failed to fetch user activity" });
  }
};

/* =========================================================
   ADMIN: SUSPEND / UNSUSPEND USER
   POST /api/admin/users/:userId/suspend
========================================================= */
export const suspendAdminUser: RequestHandler = async (req, res) => {
  try {
    await ensureControlTable();

    const { userId } = req.params;
    const suspended = req.body?.suspended !== false;

    await pool.query(
      `
      INSERT INTO admin_user_controls (user_id, is_suspended, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id)
      DO UPDATE SET is_suspended = EXCLUDED.is_suspended, updated_at = CURRENT_TIMESTAMP
      `,
      [userId, suspended]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Suspend user error:", err);
    res.status(500).json({ error: "Failed to update user status" });
  }
};

/* =========================================================
   ADMIN: UPGRADE / DOWNGRADE PLAN
   PATCH /api/admin/users/:userId/plan
========================================================= */
export const updateAdminUserPlan: RequestHandler = async (req, res) => {
  try {
    await ensureControlTable();

    const { userId } = req.params;
    const { plan } = req.body || {};

    if (!plan) {
      return res.status(400).json({ error: "Plan is required" });
    }

    await pool.query(
      `
      INSERT INTO admin_user_controls (user_id, plan_override, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id)
      DO UPDATE SET plan_override = EXCLUDED.plan_override, updated_at = CURRENT_TIMESTAMP
      `,
      [userId, String(plan)]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Update user plan error:", err);
    res.status(500).json({ error: "Failed to update user plan" });
  }
};

/* =========================================================
   ADMIN: DELETE USER
   DELETE /api/admin/users/:userId
========================================================= */
export const deleteAdminUser: RequestHandler = async (req, res) => {
  const { userId } = req.params;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query("DELETE FROM buyer_keywords WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM target_market WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM company_details WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM platforms_to_monitor WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM onboarding_progress WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM user_subscriptions WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM admin_user_controls WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM users WHERE id = $1", [userId]);

    await client.query("COMMIT");

    res.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  } finally {
    client.release();
  }
};

/* =========================================================
   ADMIN: DISABLE USER (LEGACY COMPAT)
   POST /api/admin/users/:userId/disable
========================================================= */
export const disableAdminUser: RequestHandler = async (req, res) => {
  try {
    await ensureControlTable();
    const { userId } = req.params;

    await pool.query(
      `
      INSERT INTO admin_user_controls (user_id, is_suspended, updated_at)
      VALUES ($1, true, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id)
      DO UPDATE SET is_suspended = true, updated_at = CURRENT_TIMESTAMP
      `,
      [userId]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("Disable user error:", err);
    res.status(500).json({ error: "Failed to disable user" });
  }
};
