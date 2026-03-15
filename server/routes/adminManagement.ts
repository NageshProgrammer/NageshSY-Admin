import { RequestHandler } from "express";
import { pool } from "../src/lib/neon";
import bcrypt from "bcryptjs";

/* =========================================================
   ADMIN: LIST ADMINS
   GET /api/admin/admins
========================================================= */
export const getAdmins: RequestHandler = async (_req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, full_name, email, role, created_at
      FROM admins
      ORDER BY created_at DESC
      `,
    );

    res.json({
      success: true,
      data: result.rows.map((row) => ({
        id: String(row.id),
        name: row.full_name,
        email: row.email,
        role: row.role,
        permissions: [],
        createdAt: row.created_at,
      })),
    });
  } catch (err) {
    console.error("Get admins error:", err);
    res.status(500).json({ error: "Failed to load admins" });
  }
};

/* =========================================================
   ADMIN: CREATE ADMIN
   POST /api/admin/admins
========================================================= */
export const createAdmin: RequestHandler = async (req, res) => {
  try {
    const { name, email, permissions } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const defaultPassword = `Admin@${Date.now()}`;
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    await pool.query(
      `
      INSERT INTO admins (full_name, email, password, role)
      VALUES ($1, $2, $3, 'admin')
      `,
      [name, email, hashedPassword],
    );

    res.json({
      success: true,
      data: {
        temporaryPassword: defaultPassword,
      },
    });
  } catch (err) {
    console.error("Create admin error:", err);
    res.status(500).json({ error: "Failed to create admin" });
  }
};

/* =========================================================
   ADMIN: DELETE ADMIN
   DELETE /api/admin/admins/:adminId
========================================================= */
export const deleteAdmin: RequestHandler = async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await pool.query(
      `
      SELECT id, role
      FROM admins
      WHERE id = $1
      LIMIT 1
      `,
      [adminId],
    );

    if (!admin.rows.length) {
      return res.status(404).json({ error: "Admin not found" });
    }

    if (admin.rows[0].role === "super_admin") {
      return res
        .status(403)
        .json({ error: "Super admin cannot be removed" });
    }

    await pool.query(
      `
      DELETE FROM admins
      WHERE id = $1
      `,
      [adminId],
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Delete admin error:", err);
    res.status(500).json({ error: "Failed to delete admin" });
  }
};
