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
import { ScrollReveal } from "@/components/ui/ScrollReveal";

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

const PIE_COLORS = ["#fbbf24", "#3b82f6", "#22c55e", "#ef4444", "#a855f7", "#14b8a6"];
const glassCard = "p-6 bg-[#050505]/40 backdrop-blur-2xl border border-white/[0.08] shadow-2xl rounded-2xl";
const chartTooltipStyle = { backgroundColor: "#09090b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "12px" };

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
      <div className="flex items-center justify-center min-h-screen bg-black/20 rounded-3xl">
        <Loader2 className="w-8 h-8 animate-spin text-[#fbbf24]" />
      </div>
    );
  }

  if (error || !reports || !payload) {
    return <div className="p-8 text-red-400 text-sm font-bold text-center">{error || "No reports data found"}</div>;
  }

  return (
    <div className="space-y-8 p-4 md:p-8 bg-black/20 rounded-3xl">
      
      {/* Header */}
      <ScrollReveal direction="down">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Analytics & Reports</h1>
        <p className="text-sm text-zinc-400 mt-2 font-medium">
          DAU, session duration, engagement, retention, traffic source, event trends, and platform output.
        </p>
      </ScrollReveal>

      {/* Date Filter */}
      <ScrollReveal direction="up" delay={0.1}>
        <Card className={glassCard}>
          <div className="flex flex-col lg:flex-row gap-4 lg:items-end w-full">
            <div className="w-full lg:w-52 space-y-1.5">
              <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Date Filter</p>
              <Select value={range} onValueChange={(value) => setRange(value as any)}>
                <SelectTrigger className="w-full h-12 bg-white/[0.02] border-white/[0.08] text-white rounded-xl focus:ring-[#fbbf24]/50 focus:ring-offset-0 outline-none">
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
              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                <div className="space-y-1.5 w-full sm:w-auto">
                  <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Start</p>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full sm:w-36 h-12 bg-white/[0.02] border-white/[0.08] text-white rounded-xl focus-visible:ring-[#fbbf24]/50 [color-scheme:dark]" />
                </div>
                <div className="space-y-1.5 w-full sm:w-auto">
                  <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">End</p>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full sm:w-36 h-12 bg-white/[0.02] border-white/[0.08] text-white rounded-xl focus-visible:ring-[#fbbf24]/50 [color-scheme:dark]" />
                </div>
              </div>
            )}

            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest lg:ml-auto mb-3 mt-4 lg:mt-0">
              Source: <span className="text-[#fbbf24]">{payload.meta.dataSource.replace("_", " ")}</span>
            </div>
          </div>
        </Card>
      </ScrollReveal>

      {/* Top Details Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ScrollReveal direction="up" delay={0.2}>
          <Card className={glassCard}>
            <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Event Details</p>
            <p className="text-3xl font-black text-white mt-3">
              {reports.eventDetails.users.toLocaleString()} <span className="text-sm font-medium text-zinc-500">users</span>
            </p>
            <p className="text-sm font-bold text-[#fbbf24] mt-2">Revenue: ${reports.eventDetails.revenue.toLocaleString()}</p>
          </Card>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.3}>
          <Card className={glassCard}>
            <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Newsletter Details</p>
            <p className="text-3xl font-black text-white mt-3">{reports.newsletterDetails.subscribers.toLocaleString()}</p>
            <p className="text-sm font-bold text-zinc-400 mt-2">Active Subscribers</p>
          </Card>
        </ScrollReveal>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ScrollReveal direction="up" delay={0.4}>
          <Card className={glassCard}>
            <h3 className="text-sm font-bold text-white mb-6">Daily Active Users</h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={reports.dailyActiveUsers}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#a1a1aa" }} stroke="rgba(255,255,255,0.1)" />
                <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} stroke="rgba(255,255,255,0.1)" />
                <Tooltip contentStyle={chartTooltipStyle} itemStyle={{ color: "#fff" }} />
                <Area type="monotone" dataKey="users" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.5}>
          <Card className={glassCard}>
            <h3 className="text-sm font-bold text-white mb-6">Session Duration (Minutes)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={reports.sessionDuration}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#a1a1aa" }} stroke="rgba(255,255,255,0.1)" />
                <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} stroke="rgba(255,255,255,0.1)" />
                <Tooltip contentStyle={chartTooltipStyle} itemStyle={{ color: "#fff" }} />
                <Line type="monotone" dataKey="minutes" stroke="#22c55e" strokeWidth={3} dot={{ r: 3, fill: "#22c55e", strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.2}>
          <Card className={glassCard}>
            <h3 className="text-sm font-bold text-white mb-6">Page Wise Engagement / Event</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={reports.pageWiseEngagement}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="page" tick={{ fontSize: 11, fill: "#a1a1aa" }} stroke="rgba(255,255,255,0.1)" />
                <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} stroke="rgba(255,255,255,0.1)" />
                <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                <Bar dataKey="events" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.3}>
          <Card className={glassCard}>
            <h3 className="text-sm font-bold text-white mb-6">Users by Channel</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={reports.usersByChannel} dataKey="users" nameKey="channel" outerRadius={90} label={{ fill: "#fff", fontSize: 11 }}>
                  {reports.usersByChannel.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="rgba(0,0,0,0.5)" />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} itemStyle={{ color: "#fff" }} />
                <Legend wrapperStyle={{ fontSize: "12px", color: "#a1a1aa" }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.4}>
          <Card className={glassCard}>
            <h3 className="text-sm font-bold text-white mb-6">New Users by Platform</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={reports.newUsersByPlatform}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="platform" tick={{ fontSize: 11, fill: "#a1a1aa" }} stroke="rgba(255,255,255,0.1)" />
                <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} stroke="rgba(255,255,255,0.1)" />
                <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                <Bar dataKey="users" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.5}>
          <Card className={glassCard}>
            <h3 className="text-sm font-bold text-white mb-6">User Retention (Time)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={reports.retention}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#a1a1aa" }} stroke="rgba(255,255,255,0.1)" />
                <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} stroke="rgba(255,255,255,0.1)" />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${Number(v).toFixed(2)}%`, "Retention"]} />
                <Line type="monotone" dataKey="retention" stroke="#ef4444" strokeWidth={3} dot={{ r: 3, fill: "#ef4444", strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.6}>
          <Card className={glassCard}>
            <h3 className="text-sm font-bold text-white mb-6">User Engagement (Avg Time / Active User)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={reports.engagementTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#a1a1aa" }} stroke="rgba(255,255,255,0.1)" />
                <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} stroke="rgba(255,255,255,0.1)" />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Line type="monotone" dataKey="avgEngagementTime" stroke="#14b8a6" strokeWidth={3} dot={{ r: 3, fill: "#14b8a6", strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.7}>
          <Card className={glassCard}>
            <h3 className="text-sm font-bold text-white mb-6">Total Posts Generated per Platform</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={reports.postsGeneratedPerPlatform}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="platform" tick={{ fontSize: 11, fill: "#a1a1aa" }} stroke="rgba(255,255,255,0.1)" />
                <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} stroke="rgba(255,255,255,0.1)" />
                <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </ScrollReveal>
      </div>

      {/* Full Width Event Chart */}
      <ScrollReveal direction="up" delay={0.8}>
        <Card className={glassCard}>
          <h3 className="text-sm font-bold text-white mb-6">Event Count by Event Name Over Time</h3>
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={eventSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#a1a1aa" }} stroke="rgba(255,255,255,0.1)" />
              <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} stroke="rgba(255,255,255,0.1)" />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "12px", color: "#a1a1aa", paddingTop: "20px" }} />
              {eventNames.map((name, index) => (
                <Line 
                  key={name} 
                  type="monotone" 
                  dataKey={name} 
                  stroke={PIE_COLORS[index % PIE_COLORS.length]} 
                  strokeWidth={3} 
                  dot={{ r: 2, fill: PIE_COLORS[index % PIE_COLORS.length], strokeWidth: 0 }} 
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </ScrollReveal>
      
    </div>
  );
}