import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../src/lib/neon";

const router = Router();

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

const writeLoginLog = async (
  email: string,
  success: boolean,
  ipAddress: string,
  userAgent: string
) => {
  await ensureLoginLogTable();
  await pool.query(
    `
    INSERT INTO admin_login_logs (email, success, ip_address, user_agent)
    VALUES ($1, $2, $3, $4)
    `,
    [email, success, ipAddress, userAgent]
  );
};

router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO admins (full_name, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, role
      `,
      [fullName, email, hashedPassword, role || "admin"]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error("SIGNUP ERROR:", err);
    return res.status(500).json({ error: "Signup failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.socket?.remoteAddress || "unknown";
    const userAgent = req.get("user-agent") || "unknown";

    const result = await pool.query(
      "SELECT id, email, password, role FROM admins WHERE email = $1",
      [email]
    );

    if (result.rowCount === 0) {
      await writeLoginLog(email || "unknown", false, ipAddress, userAgent);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const admin = result.rows[0];
    const valid = await bcrypt.compare(password, admin.password);

    if (!valid) {
      await writeLoginLog(email || "unknown", false, ipAddress, userAgent);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await writeLoginLog(email || "unknown", true, ipAddress, userAgent);

    return res.json({
      id: admin.id,
      email: admin.email,
      role: admin.role,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ error: "Login failed" });
  }
});

export default router;
