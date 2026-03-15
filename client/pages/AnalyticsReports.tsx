import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Loader2 } from "lucide-react";

type ReportsPayload = {
  dailyActiveUsers: Array<{ date: string; users: number }>;
  sessionDuration: Array<{ date: string; minutes: number }>;
  pageWiseEngagement: Array<{ page: string; events: number }>;
  usersByChannel: Array<{ channel: string; users: number }>;
  newUsersByPlatform: Array<{ platform: string; users: number }>;
  retention: Array<{ date: string; retention: number }>;
  engagementTime: Array<{ date: string; avgEngagementTime: number }>;
  eventCountByNameOverTime: Array<{ date: string; eventName: string; count: number }>;
  postsGeneratedPerPlatform: Array<{ platform: string; count: number }>;
  eventDetails: { users: number; revenue: number };
  newsletterDetails: { subscribers: number };
};

type ReportsResponse = {
  reports: ReportsPayload;
  meta: {
    dateFilter: "24h" | "7d" | "30d" | "custom";
    startDate: string;
    endDate: string;
    dataSource: string;
  };
};

const PIE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#14b8a6", "#a855f7"];

export default function AnalyticsReports() {
  const [payload, setPayload] = useState<ReportsResponse | null>(null);
  const [range, setRange] = useState<"24h" | "7d" | "30d" | "custom">("7d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({ range });
        if (range === "custom" && startDate && endDate) {
          params.set("startDate", startDate);
          params.set("endDate", endDate);
        }

        const res = await fetch(`/api/analytics/platform?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load analytics reports");

        const json = await res.json();
        if (json.data?.reports) {
          setPayload({ reports: json.data.reports, meta: json.data.meta });
        } else {
          setPayload(null);
        }
      } catch (loadError) {
        console.error("Reports load error:", loadError);
        setError("Failed to load analytics reports");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [range, startDate, endDate]);

  const reports = payload?.reports || null;

  const eventSeries = useMemo(() => {
    const bucket: Record<string, any> = {};
    (reports?.eventCountByNameOverTime || []).forEach((item) => {
      if (!bucket[item.date]) bucket[item.date] = { date: item.date };
      bucket[item.date][item.eventName] = item.count;
    });
    return Object.values(bucket);
  }, [reports]);

  const eventNames = useMemo(() => {
    const names = new Set<string>();
    (reports?.eventCountByNameOverTime || []).forEach((item) => names.add(item.eventName));
    return Array.from(names);
  }, [reports]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !reports || !payload) {
    return <div className="p-4 text-red-500 text-sm">{error || "No reports data found"}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Analytics & Reports</h1>
        <p className="text-muted-foreground text-xs mt-1">
          DAU, session duration, engagement, retention, traffic source, event trends, and platform output.
        </p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
          <div className="w-full lg:w-52">
            <p className="text-xs text-muted-foreground mb-1">Date Filter</p>
            <Select value={range} onValueChange={(value) => setRange(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Past 24 hours</SelectItem>
                <SelectItem value="7d">Past 7 days</SelectItem>
                <SelectItem value="30d">Past 30 days</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {range === "custom" && (
            <>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Start</p>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">End</p>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </>
          )}

          <div className="text-xs text-muted-foreground lg:ml-auto">
            Source: {payload.meta.dataSource.replace("_", " ")}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Event Details</p>
          <p className="text-2xl font-bold mt-2">{reports.eventDetails.users.toLocaleString()} users</p>
          <p className="text-xs text-muted-foreground mt-1">Revenue: ${reports.eventDetails.revenue.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Newsletter Details</p>
          <p className="text-2xl font-bold mt-2">{reports.newsletterDetails.subscribers.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Subscribers</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4">Daily Active Users</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={reports.dailyActiveUsers}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="users" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4">Session Duration (Minutes)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={reports.sessionDuration}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="minutes" stroke="#22c55e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4">Page Wise Engagement / Event</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={reports.pageWiseEngagement}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="page" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="events" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4">Users by Channel</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={reports.usersByChannel} dataKey="users" nameKey="channel" outerRadius={90} label>
                {reports.usersByChannel.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4">New Users by Platform</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={reports.newUsersByPlatform}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="platform" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="users" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4">User Retention (Time)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={reports.retention}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [`${Number(v).toFixed(2)}%`, "Retention"]} />
              <Line type="monotone" dataKey="retention" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4">User Engagement (Avg Time / Active User)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={reports.engagementTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="avgEngagementTime" stroke="#14b8a6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4">Total Posts Generated per Platform</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={reports.postsGeneratedPerPlatform}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="platform" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-4">Event Count by Event Name Over Time</h3>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={eventSeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            {eventNames.map((name, index) => (
              <Line key={name} type="monotone" dataKey={name} stroke={PIE_COLORS[index % PIE_COLORS.length]} strokeWidth={2} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
