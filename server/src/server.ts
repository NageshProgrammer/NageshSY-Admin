// server/src/server.ts
import "dotenv/config";
import express from "express";
import cors from "cors";

// Route Imports
import adminAuth from "../routes/adminAuth";
import { handleUserSync } from "../routes/users";
import {
  getAdminUsers,
  getAdminUserById,
  disableAdminUser,
  suspendAdminUser,
  deleteAdminUser,
  updateAdminUserPlan,
  getAdminUserActivity,
} from "../routes/adminUsers";
import { getAdmins, createAdmin, deleteAdmin } from "../routes/adminManagement";
import { getTransactions, getTransactionById, getTransactionStats } from "../routes/transactions";
import { getEvents, getEventStats } from "../routes/events";
import { handleDemo } from "../routes/demo";
import { getSupportTickets, updateSupportTicketStatus } from "../routes/support";
import { getLoginLogs, getCreditUsage } from "../routes/security";
import {
  handleGetAnalytics,
  handleGetDashboardAnalytics,
  handleGetGeoAnalytics,
  handleGetPlatformAnalytics,
} from "../routes/analytics";
import { handleGetGoogleAnalytics } from "../routes/googleAnalytics";

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  /* ================= HEALTH CHECK ================= */
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  /* ================= API ROUTES ================= */

  app.get("/api/ping", (_req, res) => {
    res.json({ ok: true });
  });

  app.post("/api/users/sync", handleUserSync);

  app.get("/api/demo", handleDemo);

  app.get("/api/analytics", handleGetAnalytics);
  app.get("/api/analytics/dashboard", handleGetDashboardAnalytics);
  app.get("/api/analytics/geo", handleGetGeoAnalytics);
  app.get("/api/analytics/platform", handleGetPlatformAnalytics);
  app.get("/api/analytics/google", handleGetGoogleAnalytics);

  /* ================= ADMIN ================= */

  app.use("/api/admin", adminAuth);

  app.get("/api/admin/users", getAdminUsers);
  app.get("/api/admin/users/:userId", getAdminUserById);
  app.get("/api/admin/users/:userId/activity", getAdminUserActivity);
  app.post("/api/admin/users/:userId/disable", disableAdminUser);
  app.post("/api/admin/users/:userId/suspend", suspendAdminUser);
  app.patch("/api/admin/users/:userId/plan", updateAdminUserPlan);
  app.delete("/api/admin/users/:userId", deleteAdminUser);

  app.get("/api/admin/admins", getAdmins);
  app.post("/api/admin/admins", createAdmin);
  app.delete("/api/admin/admins/:adminId", deleteAdmin);

  app.get("/api/admin/transactions", getTransactions);
  app.get("/api/admin/transactions/stats", getTransactionStats);
  app.get("/api/admin/transactions/:transactionId", getTransactionById);

  app.get("/api/admin/events", getEvents);
  app.get("/api/admin/events/stats", getEventStats);

  app.get("/api/admin/support/tickets", getSupportTickets);
  app.patch("/api/admin/support/tickets/:ticketId/status", updateSupportTicketStatus);

  app.get("/api/admin/security/login-logs", getLoginLogs);
  app.get("/api/admin/security/credit-usage", getCreditUsage);

  return app;
}