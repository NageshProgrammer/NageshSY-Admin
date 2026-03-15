import { RequestHandler } from "express";
import { pool } from "../src/lib/neon";

const ensureSupportStateTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_support_ticket_states (
      ticket_key VARCHAR(255) PRIMARY KEY,
      source VARCHAR(50) NOT NULL,
      status VARCHAR(50) DEFAULT 'open' NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);
};

export const getSupportTickets: RequestHandler = async (_req, res) => {
  try {
    await ensureSupportStateTable();

    const [demoResult, contactTableResult] = await Promise.all([
      pool.query(`
        SELECT
          'demo-' || ew.id::text AS ticket_key,
          'demo_request' AS source,
          ew.email,
          ew.company,
          ew.industry,
          ew.created_at
        FROM event_waitlist ew
        ORDER BY ew.created_at DESC
        LIMIT 200
      `),
      pool.query("SELECT to_regclass('contact_enquiries') AS table_ref"),
    ]);

    let contactRows: any[] = [];
    const contactTableExists = !!contactTableResult.rows[0]?.table_ref;
    if (contactTableExists) {
      const contactResult = await pool.query(`
        SELECT
          'contact-' || id::text AS ticket_key,
          'contact_enquiry' AS source,
          email,
          company,
          NULL::text AS industry,
          created_at
        FROM contact_enquiries
        ORDER BY created_at DESC
        LIMIT 200
      `);
      contactRows = contactResult.rows;
    }

    const stateResult = await pool.query(`
      SELECT ticket_key, status
      FROM admin_support_ticket_states
    `);

    const stateMap = new Map<string, string>(
      stateResult.rows.map((row: any) => [row.ticket_key, row.status])
    );

    const merged = [...demoResult.rows, ...contactRows]
      .sort((a: any, b: any) => +new Date(b.created_at) - +new Date(a.created_at))
      .map((row: any) => ({
        id: row.ticket_key,
        source: row.source,
        email: row.email,
        company: row.company,
        industry: row.industry,
        createdAt: row.created_at,
        status: stateMap.get(row.ticket_key) || "open",
      }));

    res.json({
      success: true,
      data: {
        summary: {
          demoRequests: demoResult.rows.length,
          contactEnquiries: contactRows.length,
          totalTickets: merged.length,
        },
        tickets: merged,
      },
    });
  } catch (err) {
    console.error("Support tickets error:", err);
    res.status(500).json({ error: "Failed to load support tickets" });
  }
};

export const updateSupportTicketStatus: RequestHandler = async (req, res) => {
  try {
    await ensureSupportStateTable();

    const { ticketId } = req.params;
    const { status, source } = req.body || {};

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    await pool.query(
      `
      INSERT INTO admin_support_ticket_states (ticket_key, source, status, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (ticket_key)
      DO UPDATE SET status = EXCLUDED.status, source = EXCLUDED.source, updated_at = CURRENT_TIMESTAMP
      `,
      [ticketId, source || "demo_request", status]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Update ticket status error:", err);
    res.status(500).json({ error: "Failed to update ticket status" });
  }
};
