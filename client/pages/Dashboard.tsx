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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import {
  Users,
  CreditCard,
  MessageSquare,
  Search,
  TrendingUp,
  DollarSign,
  Loader2,
} from "lucide-react";

type PlatformAnalytics = {
  overview: {
    totalUsers: number;
    activeSubscriptions: number;
    totalKeywordsTracked: number;
    totalConversationsDetected: number;
    leadsGenerated: number;
    monthlyRevenue: number;
  };
  charts: {
    leadsPerDay: Array<{ date: string; leads: number }>;
    conversationsDetected: Array<{ date: string; conversations: number }>;
    conversionRate: Array<{ date: string; rate: number }>;
    topKeywords: Array<{ keyword: string; count: number }>;
    worldHeatmap: Array<{
      country: string;
      users: number;
      lat: number;
      lng: number;
      region: string;
    }>;
  };
  reports: {
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
  meta: {
    dateFilter: "24h" | "7d" | "30d" | "custom";
    startDate: string;
    endDate: string;
    dataSource: string;
  };
};

const axisStyle = { fontSize: "11px" };

export default function Dashboard() {
  const [data, setData] = useState<PlatformAnalytics | null>(null);
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
        if (!res.ok) throw new Error("Failed to load platform analytics");

        const json = await res.json();
        setData(json.data || null);
      } catch (loadError) {
        console.error("Dashboard load error:", loadError);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [range, startDate, endDate]);

  const totalHeatmapUsers = useMemo(
    () => (data?.charts.worldHeatmap || []).reduce((sum, point) => sum + point.users, 0),
    [data]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return <div className="p-4 text-red-500 text-sm">{error || "No data available"}</div>;
  }

  const { overview, charts } = data;

  const kpis = [
    {
      label: "Total Users",
      value: overview.totalUsers.toLocaleString(),
      icon: Users,
      helper: "All registered users",
    },
    {
      label: "Active Subscriptions",
      value: overview.activeSubscriptions.toLocaleString(),
      icon: CreditCard,
      helper: "Paying active plans",
    },
    {
      label: "Total Keywords Being Tracked",
      value: overview.totalKeywordsTracked.toLocaleString(),
      icon: Search,
      helper: "Buyer keywords configured",
    },
    {
      label: "Total Conversations Detected",
      value: overview.totalConversationsDetected.toLocaleString(),
      icon: MessageSquare,
      helper: "Cross-platform conversation volume",
    },
    {
      label: "Leads Generated",
      value: overview.leadsGenerated.toLocaleString(),
      icon: TrendingUp,
      helper: "Leads captured from interactions",
    },
    {
      label: "Monthly Revenue",
      value: `$${overview.monthlyRevenue.toLocaleString()}`,
      icon: DollarSign,
      helper: "Current month gross revenue",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Platform Dashboard</h1>
        <p className="text-muted-foreground text-xs mt-1">
          Complete SaaS overview with users, subscriptions, conversations, leads, and monetization.
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
            Source: {data.meta.dataSource.replace("_", " ")}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium">{kpi.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-2">{kpi.value}</p>
                  <p className="text-xs text-primary mt-2">{kpi.helper}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4 text-foreground">Leads Per Day</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={charts.leadsPerDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" style={axisStyle} />
              <YAxis stroke="hsl(var(--muted-foreground))" style={axisStyle} />
              <Tooltip />
              <Line type="monotone" dataKey="leads" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4 text-foreground">Conversations Detected</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={charts.conversationsDetected}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" style={axisStyle} />
              <YAxis stroke="hsl(var(--muted-foreground))" style={axisStyle} />
              <Tooltip />
              <Area type="monotone" dataKey="conversations" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4 text-foreground">Conversion Rate</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={charts.conversionRate}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" style={axisStyle} />
              <YAxis stroke="hsl(var(--muted-foreground))" style={axisStyle} />
              <Tooltip formatter={(value: number) => [`${Number(value).toFixed(2)}%`, "Rate"]} />
              <Line type="monotone" dataKey="rate" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4 text-foreground">Top Keywords Generating Leads</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={charts.topKeywords}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="keyword" stroke="hsl(var(--muted-foreground))" style={axisStyle} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis stroke="hsl(var(--muted-foreground))" style={axisStyle} />
              <Tooltip />
              <Bar dataKey="count" fill="#60a5fa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">World Heatmap: Users By Region</h3>
          <p className="text-xs text-muted-foreground mt-2 md:mt-0">
            {charts.worldHeatmap.length} countries • {totalHeatmapUsers.toLocaleString()} users
          </p>
        </div>

        <ResponsiveContainer width="100%" height={340}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" dataKey="lng" name="Longitude" domain={[-180, 180]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis type="number" dataKey="lat" name="Latitude" domain={[-90, 90]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <ZAxis type="number" dataKey="users" range={[40, 600]} name="Users" />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              formatter={(value: number) => [value, "Users"]}
              labelFormatter={(_, payload: any) => payload?.[0]?.payload?.country || "Country"}
            />
            <Scatter data={charts.worldHeatmap} fill="hsl(var(--primary))" fillOpacity={0.65} />
          </ScatterChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Event Users</p>
          <p className="text-2xl font-bold mt-2">{data.reports.eventDetails.users.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Revenue: ${data.reports.eventDetails.revenue.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Newsletter Subscribers</p>
          <p className="text-2xl font-bold mt-2">{data.reports.newsletterDetails.subscribers.toLocaleString()}</p>
        </Card>
      </div>
    </div>
  );
}
