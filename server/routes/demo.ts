import { RequestHandler } from "express";

/**
 * Demo route
 * Used for testing backend connectivity
 * GET /api/demo
 */
export const handleDemo = (_req, res) => {
  res.json({ ok: true });
};