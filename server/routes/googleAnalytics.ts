import { createSign } from "node:crypto";
import { RequestHandler } from "express";

type RangePreset = "7d" | "30d" | "custom";

type ResolvedRange = {
  preset: RangePreset;
  start: Date;
  end: Date;
};

type TrendPoint = {
  date: string;
  activeUsers: number;
  views: number;
  previousActiveUsers?: number;
};

type ReportRowValue = string | number;
type ReportRow = Record<string, ReportRowValue>;
type MetricMap = Record<string, number>;

type ComparisonMetric = {
  value: number;
  deltaPct: number;
};

class GaRequestError extends Error {
  statusCode: number;
  providerStatus?: string;

  constructor(message: string, statusCode: number, providerStatus?: string) {
    super(message);
    this.name = "GaRequestError";
    this.statusCode = statusCode;
    this.providerStatus = providerStatus;
  }
}

const OAUTH_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GA_API_BASE = "https://analyticsdata.googleapis.com/v1beta";

const base64UrlEncode = (value: string) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const parseDateOrNull = (value: unknown): Date | null => {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const resolveRange = (query: any): ResolvedRange => {
  const now = new Date();
  const requested = String(query?.range || "7d") as RangePreset;

  if (requested === "custom") {
    const start = parseDateOrNull(query?.startDate);
    const end = parseDateOrNull(query?.endDate);
    if (start && end && start <= end) {
      return { preset: "custom", start, end };
    }
  }

  if (requested === "30d") {
    return {
      preset: "30d",
      start: new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000),
      end: now,
    };
  }

  return {
    preset: "7d",
    start: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
    end: now,
  };
};

const getEnvFirst = (keys: string[]) => {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
};

const parseServiceAccountJson = () => {
  const rawJson = getEnvFirst(["GA4_SERVICE_ACCOUNT_JSON", "GOOGLE_SERVICE_ACCOUNT_JSON"]);
  if (!rawJson) return { clientEmail: "", privateKey: "" };
  try {
    const parsed = JSON.parse(rawJson);
    return { clientEmail: parsed.client_email || "", privateKey: parsed.private_key || "" };
  } catch {
    return { clientEmail: "", privateKey: "" };
  }
};

const normalizePrivateKey = (rawKey: string | undefined) => {
  if (!rawKey) return "";
  return rawKey.replace(/\\n/g, "\n");
};

const createServiceJwt = (clientEmail: string, privateKey: string) => {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    scope: OAUTH_SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const toSign = `${encodedHeader}.${encodedPayload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(toSign);
  signer.end();
  const signature = signer.sign(privateKey).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  return `${toSign}.${signature}`;
};

const getAccessToken = async (clientEmail: string, privateKey: string) => {
  const assertion = createServiceJwt(clientEmail, privateKey);
  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  const tokenJson = (await tokenRes.json()) as any;
  return tokenJson.access_token || "";
};

const parseGaDate = (raw: string) => raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : raw;

const safeNumber = (value: unknown): number => {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
};

const roundMetric = (value: number, precision = 2) => Number(safeNumber(value).toFixed(precision));
const sanitizeLabel = (value: unknown, fallback = "(not set)") => typeof value === "string" && value.trim() ? value.trim() : fallback;

const pctDelta = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Number((((current - previous) / previous) * 100).toFixed(2));
};

const buildComparisonMetric = (current: number, previous: number): ComparisonMetric => ({
  value: roundMetric(current),
  deltaPct: pctDelta(current, previous),
});

const fetchGaReportRows = async ({
  propertyId, accessToken, startDate, endDate, dimensions = [], metrics, limit, orderBys, keepEmptyRows, dimensionFilter, realtime = false,
}: any): Promise<ReportRow[]> => {
  const body: Record<string, unknown> = { metrics: metrics.map((name: string) => ({ name })) };
  if (dimensions.length > 0) body.dimensions = dimensions.map((name: string) => ({ name }));
  if (!realtime) body.dateRanges = [{ startDate, endDate }];
  if (limit) body.limit = limit;
  if (orderBys) body.orderBys = orderBys;
  if (keepEmptyRows) body.keepEmptyRows = keepEmptyRows;
  if (dimensionFilter) body.dimensionFilter = dimensionFilter;

  const endpoint = realtime ? "runRealtimeReport" : "runReport";
  const res = await fetch(`${GA_API_BASE}/properties/${propertyId}:${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new GaRequestError(text, res.status);
  }

  const json = (await res.json()) as any;
  return (json.rows || []).map((row: any) => {
    const mapped: ReportRow = {};
    dimensions.forEach((dimension: string, index: number) => {
      const val = row.dimensionValues?.[index]?.value || "";
      mapped[dimension] = dimension === "date" ? parseGaDate(val) : sanitizeLabel(val);
    });
    metrics.forEach((metric: string, index: number) => {
      mapped[metric] = safeNumber(row.metricValues?.[index]?.value);
    });
    return mapped;
  });
};

const fetchTrendMetrics = async (propertyId: string, accessToken: string, startDate: string, endDate: string) => {
  const rows = await fetchGaReportRows({
    propertyId, accessToken, startDate, endDate, dimensions: ["date"],
    metrics: ["activeUsers", "screenPageViews"],
    orderBys: [{ dimension: { dimensionName: "date" } }],
    keepEmptyRows: true,
  });
  return {
    trend: rows.map(row => ({ 
      date: String(row.date), 
      activeUsers: safeNumber(row.activeUsers),
      views: safeNumber(row.screenPageViews)
    }))
  };
};

const safeFetchReport = async <T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> => {
  try { return await fn(); } catch (e) { return fallback; }
};

export const handleGetGoogleAnalytics: RequestHandler = async (req, res) => {
  try {
    const serviceAccount = parseServiceAccountJson();
    const propertyId = getEnvFirst(["GA4_PROPERTY_ID", "GOOGLE_ANALYTICS_PROPERTY_ID"]);
    const clientEmail = getEnvFirst(["GA4_CLIENT_EMAIL", "GOOGLE_CLIENT_EMAIL"]) || serviceAccount.clientEmail;
    const privateKey = normalizePrivateKey(getEnvFirst(["GA4_PRIVATE_KEY", "GOOGLE_PRIVATE_KEY"]) || serviceAccount.privateKey);

    if (!propertyId || !clientEmail || !privateKey) {
      return res.status(400).json({ success: false, error: "Missing GA4 configuration" });
    }

    const currentRange = resolveRange(req.query);
    const currentStart = formatDate(currentRange.start);
    const currentEnd = formatDate(currentRange.end);

    const msPerDay = 86400000;
    const currentDays = Math.max(1, Math.round((currentRange.end.getTime() - currentRange.start.getTime()) / msPerDay) + 1);
    const previousStart = formatDate(new Date(currentRange.start.getTime() - currentDays * msPerDay));
    const previousEnd = formatDate(new Date(currentRange.end.getTime() - currentDays * msPerDay));

    const accessToken = await getAccessToken(clientEmail, privateKey);

    // Only 10 metrics allowed by GA4 API
    const metricsList = [
      "activeUsers", 
      "screenPageViews", 
      "eventCount", 
      "sessions", 
      "newUsers", 
      "totalUsers", 
      "engagementRate", 
      "totalRevenue", 
      "ecommercePurchases",
      "active28DayUsers" // 10th metric
    ];

    const [currentTotals, previousTotals, currentTrend, previousTrend] = await Promise.all([
      fetchGaReportRows({ propertyId, accessToken, startDate: currentStart, endDate: currentEnd, metrics: metricsList, limit: 1 }),
      fetchGaReportRows({ propertyId, accessToken, startDate: previousStart, endDate: previousEnd, metrics: metricsList, limit: 1 }),
      fetchTrendMetrics(propertyId, accessToken, currentStart, currentEnd),
      fetchTrendMetrics(propertyId, accessToken, previousStart, previousEnd),
    ]);

    // TYPE FIX: Assertion to number for buildComparisonMetric parameters
    const cT = currentTotals[0] || {};
    const pT = previousTotals[0] || {};

    const otherReports = await Promise.all([
      safeFetchReport("realtime", () => fetchGaReportRows({ propertyId, accessToken, realtime: true, metrics: ["activeUsers"], limit: 1 }), []),
      safeFetchReport("realtime-m", () => fetchGaReportRows({ propertyId, accessToken, realtime: true, dimensions: ["minutesAgo"], metrics: ["activeUsers"], limit: 30, orderBys: [{ dimension: { dimensionName: "minutesAgo" }, desc: true }] }), []),
      safeFetchReport("countries", () => fetchGaReportRows({ propertyId, accessToken, startDate: currentStart, endDate: currentEnd, dimensions: ["country"], metrics: ["activeUsers"], limit: 8, orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }] }), []),
      safeFetchReport("devices", () => fetchGaReportRows({ propertyId, accessToken, startDate: currentStart, endDate: currentEnd, dimensions: ["deviceCategory"], metrics: ["activeUsers"], limit: 5 }), []),
      safeFetchReport("pages", () => fetchGaReportRows({ propertyId, accessToken, startDate: currentStart, endDate: currentEnd, dimensions: ["pagePath"], metrics: ["screenPageViews", "activeUsers"], limit: 10, orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }] }), []),
      safeFetchReport("event-funnel", () => fetchGaReportRows({ propertyId, accessToken, startDate: currentStart, endDate: currentEnd, dimensions: ["eventName"], metrics: ["eventCount", "activeUsers"], limit: 5, orderBys: [{ metric: { metricName: "eventCount" }, desc: true }] }), []),
      safeFetchReport("stickiness", () => fetchGaReportRows({ propertyId, accessToken, startDate: currentStart, endDate: currentEnd, metrics: ["dauPerMau", "dauPerWau", "wauPerMau"], limit: 1 }), []),
    ]);

    const trend: TrendPoint[] = currentTrend.trend.map((p, i) => ({
      ...p,
      previousActiveUsers: safeNumber(previousTrend.trend[i]?.activeUsers)
    }));

    return res.json({
      success: true,
      data: {
        summary: {
          views: buildComparisonMetric(cT.screenPageViews as number, pT.screenPageViews as number),
          eventCount: buildComparisonMetric(cT.eventCount as number, pT.eventCount as number),
          activeUsers: buildComparisonMetric(cT.activeUsers as number, pT.activeUsers as number),
          sessions: buildComparisonMetric(cT.sessions as number, pT.sessions as number),
          newUsers: buildComparisonMetric(cT.newUsers as number, pT.newUsers as number),
        },
        trend,
        reports: {
          snapshot: {
            totalRevenue: buildComparisonMetric(cT.totalRevenue as number, pT.totalRevenue as number),
            ecommercePurchases: buildComparisonMetric(cT.ecommercePurchases as number, pT.ecommercePurchases as number),
            engagementRate: buildComparisonMetric((cT.engagementRate as number) * 100, (pT.engagementRate as number) * 100),
          },
          realtime: {
            activeUsersLast30Minutes: safeNumber(otherReports[0][0]?.activeUsers),
            byMinute: otherReports[1].map(r => ({ minute: `${r.minutesAgo}m`, activeUsers: r.activeUsers })),
          },
          user: { countries: otherReports[2] },
          tech: { devices: otherReports[3].map((r:any) => ({ device: r.deviceCategory, activeUsers: r.activeUsers })) },
          engagement: { topPages: otherReports[4].map((r:any) => ({ page: r.pagePath, views: r.screenPageViews, activeUsers: r.activeUsers })) },
          business: {
            eventFunnel: otherReports[5],
            stickiness: otherReports[6][0] || { dauPerMau: 0, dauPerWau: 0, wauPerMau: 0 }
          }
        },
        meta: { startDate: currentStart, endDate: currentEnd, dataSource: "GA4 Admin Engine v3" }
      }
    });
  } catch (e: any) {
    console.error("Backend Intelligence Error:", e);
    return res.status(500).json({ success: false, error: e.message || "Internal Server Error" });
  }
};