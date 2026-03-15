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
import { ScrollReveal } from "@/components/ui/ScrollReveal";

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

const glassCard = "p-6 bg-[#050505]/20 backdrop-blur-2xl border border-white/[0.08] shadow-2xl rounded-2xl";
const chartTooltipStyle = { backgroundColor: "#09090b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "12px" };

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
      <div className="flex items-center justify-center min-h-screen bg-black/20 rounded-3xl">
        <Loader2 className="w-8 h-8 animate-spin text-[#fbbf24]" />
      </div>
    );
  }

  if (error || !data) {
    return <div className="p-8 text-red-400 text-sm text-center">{error || "No data available"}</div>;
  }

  const { overview, charts } = data;

  const kpis = [
    { label: "Total Users", value: overview.totalUsers.toLocaleString(), icon: Users, helper: "All registered users" },
    { label: "Active Subscriptions", value: overview.activeSubscriptions.toLocaleString(), icon: CreditCard, helper: "Paying active plans" },
    { label: "Keywords Tracked", value: overview.totalKeywordsTracked.toLocaleString(), icon: Search, helper: "Buyer keywords configured" },
    { label: "Conversations Detected", value: overview.totalConversationsDetected.toLocaleString(), icon: MessageSquare, helper: "Cross-platform volume" },
    { label: "Leads Generated", value: overview.leadsGenerated.toLocaleString(), icon: TrendingUp, helper: "Captured interactions" },
    { label: "Monthly Revenue", value: `$${overview.monthlyRevenue.toLocaleString()}`, icon: DollarSign, helper: "Current month gross" },
  ];

  return (
    <div className="space-y-8 p-4 md:p-8 bg-black/20 rounded-3xl">
      {/* Header */}
      <ScrollReveal direction="down">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Platform Dashboard</h1>
        <p className="text-sm text-zinc-400 mt-2 font-medium">
          Complete SaaS overview with users, subscriptions, conversations, leads, and monetization.
        </p>
      </ScrollReveal>

      {/* Date Filter */}
      <ScrollReveal direction="up" delay={0.1}>
        <Card className={glassCard}>
          <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
            <div className="w-full lg:w-52 space-y-1.5">
              <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Date Filter</p>
              <Select value={range} onValueChange={(value) => setRange(value as any)}>
                <SelectTrigger className="w-full h-12 bg-white/[0.02] border-white/[0.08] text-white rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-white/[0.1] text-white rounded-xl">
                  <SelectItem value="24h">Past 24 hours</SelectItem>
                  <SelectItem value="7d">Past 7 days</SelectItem>
                  <SelectItem value="30d">Past 30 days</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {range === "custom" && (
              <>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Start</p>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-12 bg-white/[0.02] border-white/[0.08] text-white rounded-xl [color-scheme:dark]" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">End</p>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-12 bg-white/[0.02] border-white/[0.08] text-white rounded-xl [color-scheme:dark]" />
                </div>
              </>
            )}

            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest lg:ml-auto mb-3">
              Source: <span className="text-[#fbbf24]">{data.meta.dataSource.replace("_", " ")}</span>
            </div>
          </div>
        </Card>
      </ScrollReveal>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 bg-black/20 rounded-3xl">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <ScrollReveal key={kpi.label} direction="up" delay={0.1 * (idx + 1)}>
              <Card className={`${glassCard} hover:border-[#fbbf24]/30 transition-colors group`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">{kpi.label}</p>
                    <p className="text-3xl font-black text-white mt-2">{kpi.value}</p>
                    <p className="text-xs text-[#fbbf24] font-medium mt-2">{kpi.helper}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-[#fbbf24]/10 flex items-center justify-center border border-[#fbbf24]/20 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-[#fbbf24]" />
                  </div>
                </div>
              </Card>
            </ScrollReveal>
          );
        })}
      </div>

      {/* Primary Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Leads Per Day */}
        <ScrollReveal direction="up" delay={0.2}>
          <Card className={glassCard}>
            <h3 className="text-sm font-bold text-white mb-6">Leads Per Day</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={charts.leadsPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.1)" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                <YAxis stroke="rgba(255,255,255,0.1)" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                <Tooltip contentStyle={chartTooltipStyle} itemStyle={{color: '#fff'}} />
                <Line type="monotone" dataKey="leads" stroke="#fbbf24" strokeWidth={3} dot={{ r: 4, fill: '#fbbf24', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </ScrollReveal>

        {/* Conversations Detected */}
        <ScrollReveal direction="up" delay={0.3}>
          <Card className={glassCard}>
            <h3 className="text-sm font-bold text-white mb-6">Conversations Detected</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={charts.conversationsDetected}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.1)" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                <YAxis stroke="rgba(255,255,255,0.1)" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                <Tooltip contentStyle={chartTooltipStyle} itemStyle={{color: '#fff'}} />
                <Area type="monotone" dataKey="conversations" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </ScrollReveal>

        {/* Conversion Rate */}
        <ScrollReveal direction="up" delay={0.4}>
          <Card className={glassCard}>
            <h3 className="text-sm font-bold text-white mb-6">Conversion Rate</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={charts.conversionRate}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.1)" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                <YAxis stroke="rgba(255,255,255,0.1)" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                <Tooltip contentStyle={chartTooltipStyle} itemStyle={{color: '#fff'}} formatter={(value: number) => [`${Number(value).toFixed(2)}%`, "Rate"]} />
                <Line type="monotone" dataKey="rate" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </ScrollReveal>

        {/* Top Keywords */}
        <ScrollReveal direction="up" delay={0.5}>
          <Card className={glassCard}>
            <h3 className="text-sm font-bold text-white mb-6">Top Keywords Generating Leads</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={charts.topKeywords}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="keyword" stroke="rgba(255,255,255,0.1)" tick={{ fontSize: 11, fill: '#a1a1aa' }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis stroke="rgba(255,255,255,0.1)" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                <Tooltip contentStyle={chartTooltipStyle} itemStyle={{color: '#fff'}} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="count" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </ScrollReveal>
      </div>

      {/* World Heatmap */}
      <ScrollReveal direction="up" delay={0.6}>
        <Card className={glassCard}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h3 className="text-sm font-bold text-white">World Heatmap: Users By Region</h3>
            <p className="text-xs font-medium text-[#fbbf24] mt-2 md:mt-0 px-3 py-1 rounded-full bg-[#fbbf24]/10 border border-[#fbbf24]/20">
              {charts.worldHeatmap.length} countries • {totalHeatmapUsers.toLocaleString()} users
            </p>
          </div>

          <ResponsiveContainer width="100%" height={340}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" dataKey="lng" name="Longitude" domain={[-180, 180]} tick={{ fontSize: 10, fill: "#a1a1aa" }} stroke="rgba(255,255,255,0.1)" />
              <YAxis type="number" dataKey="lat" name="Latitude" domain={[-90, 90]} tick={{ fontSize: 10, fill: "#a1a1aa" }} stroke="rgba(255,255,255,0.1)" />
              <ZAxis type="number" dataKey="users" range={[40, 600]} name="Users" />
              <Tooltip
                contentStyle={chartTooltipStyle}
                cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.2)" }}
                formatter={(value: number) => [value, "Users"]}
                labelFormatter={(_, payload: any) => payload?.[0]?.payload?.country || "Country"}
              />
              <Scatter data={charts.worldHeatmap} fill="#fbbf24" fillOpacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
      </ScrollReveal>

      {/* Bottom Footer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ScrollReveal direction="up" delay={0.7}>
          <Card className={glassCard}>
            <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Event Users</p>
            <p className="text-3xl font-black text-white mt-2">{data.reports.eventDetails.users.toLocaleString()}</p>
            <p className="text-sm font-bold text-[#fbbf24] mt-1">Revenue: ${data.reports.eventDetails.revenue.toLocaleString()}</p>
          </Card>
        </ScrollReveal>
        
        <ScrollReveal direction="up" delay={0.8}>
          <Card className={glassCard}>
            <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Newsletter Subscribers</p>
            <p className="text-3xl font-black text-white mt-2">{data.reports.newsletterDetails.subscribers.toLocaleString()}</p>
            <p className="text-sm font-medium text-zinc-400 mt-1">Active list size</p>
          </Card>
        </ScrollReveal>
      </div>

    </div>
  );
}