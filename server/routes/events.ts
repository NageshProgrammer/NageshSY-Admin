import { RequestHandler } from "express";
import { sql } from "drizzle-orm";
import { db } from "../src/lib/db";

/**
 * Get all events
 * GET /api/admin/events
 */
export const getEvents: RequestHandler = async (req, res) => {
  try {
    const limit = Number(req.query.limit ?? 100);
    
    const events = await db.execute(sql`
      SELECT
        ew.id,
        ew.email,
        ew.company,
        ew.industry,
        ew.created_at,
        COUNT(ep.id) AS payment_count,
        COALESCE(SUM(CAST(ep.amount_paid AS numeric)), 0) AS total_payments,
        MAX(ep.created_at) AS last_payment_at,
        STRING_AGG(DISTINCT ep.event_name, ', ') AS events_attended,
        STRING_AGG(DISTINCT ep.ticket_type, ', ') AS ticket_types
      FROM event_waitlist ew
      LEFT JOIN event_payments ep ON LOWER(ep.email) = LOWER(ew.email)
      GROUP BY ew.id, ew.email, ew.company, ew.industry, ew.created_at
      ORDER BY ew.created_at DESC
      LIMIT ${limit}
    `);

    res.json({
      success: true,
      data: events.rows.map((row: any) => ({
        id: row.id,
        email: row.email,
        company: row.company,
        industry: row.industry,
        paymentCount: Number(row.payment_count),
        totalPayments: Number(row.total_payments),
        lastPaymentAt: row.last_payment_at,
        eventsAttended: row.events_attended || "No events",
        ticketTypes: row.ticket_types || "No tickets",
        createdAt: row.created_at,
      })),
    });
  } catch (err) {
    console.error("Get events error:", err);
    res.status(500).json({ error: "Failed to load events" });
  }
};

/**
 * Get event statistics
 * GET /api/admin/events/stats
 */
export const getEventStats: RequestHandler = async (_req, res) => {
  try {
    const stats = await db.execute(sql`
      SELECT
        COUNT(*) AS total_registrations,
        COUNT(DISTINCT industry) AS unique_industries,
        COUNT(DISTINCT company) AS unique_companies
      FROM event_waitlist
    `);

    const paymentStats = await db.execute(sql`
      SELECT
        COUNT(DISTINCT email) AS registrations_with_payments,
        COALESCE(SUM(CAST(amount_paid AS numeric)), 0) AS total_revenue,
        COUNT(*) AS total_payment_transactions,
        COUNT(DISTINCT event_name) AS unique_events,
        AVG(CAST(amount_paid AS numeric)) AS avg_payment_amount
      FROM event_payments
    `);

    const row: any = stats.rows[0];
    const paymentRow: any = paymentStats.rows[0];

    // Get registrations by industry
    const byIndustry = await db.execute(sql`
      SELECT
        industry,
        COUNT(*) AS count
      FROM event_waitlist
      WHERE industry IS NOT NULL AND industry != ''
      GROUP BY industry
      ORDER BY count DESC
      LIMIT 10
    `);

    // Get payment breakdown by event
    const byEvent = await db.execute(sql`
      SELECT
        event_name,
        COUNT(*) AS ticket_count,
        COALESCE(SUM(CAST(amount_paid AS numeric)), 0) AS revenue
      FROM event_payments
      GROUP BY event_name
      ORDER BY revenue DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        totalRegistrations: Number(row.total_registrations),
        uniqueIndustries: Number(row.unique_industries),
        uniqueCompanies: Number(row.unique_companies),
        registrationsWithPayments: Number(paymentRow.registrations_with_payments),
        totalRevenue: Number(paymentRow.total_revenue),
        totalPaymentTransactions: Number(paymentRow.total_payment_transactions),
        uniqueEvents: Number(paymentRow.unique_events),
        avgPaymentAmount: Number(paymentRow.avg_payment_amount || 0),
        byIndustry: byIndustry.rows.map((r: any) => ({
          industry: r.industry,
          count: Number(r.count),
        })),
        byEvent: byEvent.rows.map((r: any) => ({
          eventName: r.event_name,
          ticketCount: Number(r.ticket_count),
          revenue: Number(r.revenue),
        })),
      },
    });
  } catch (err) {
    console.error("Get event stats error:", err);
    res.status(500).json({ error: "Failed to load event statistics" });
  }
};
