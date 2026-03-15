import { useEffect, useState } from "react";
import { 
  Loader2, AlertCircle, TrendingUp, Users, Monitor, Activity, Globe, 
  Smartphone, Target, Zap, RefreshCcw, BarChart3, ExternalLink, 
  DollarSign, ArrowUpRight, Navigation, MousePointer2, Layers
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, ComposedChart
} from "recharts";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

// --- Types ---
type DateRange = "7d" | "30d" | "custom";
type MetricSummary = { value: number; deltaPct: number };

type GoogleAnalyticsPayload = {
  summary: { views: MetricSummary; eventCount: MetricSummary; activeUsers: MetricSummary; keyEvents: MetricSummary; sessions: MetricSummary; };
  trend: Array<{ date: string; activeUsers: number; previousActiveUsers: number; views: number }>;
  reports: {
    snapshot: { totalRevenue: MetricSummary; ecommercePurchases: MetricSummary; engagementRate: MetricSummary; };
    realtime: { activeUsersLast30Minutes: number; byMinute: Array<{ minute: string; activeUsers: number }>; };
    user: { countries: Array<{ country: string; activeUsers: number }>; };
    tech: { devices: Array<{ device: string; activeUsers: number }>; };
    engagement: { topPages: Array<{ page: string; views: number; activeUsers: number }>; };
    business: { eventFunnel: Array<{ eventName: string; eventCount: number; keyEvents: number }>; stickiness: { dauPerMau: number; dauPerWau: number; wauPerMau: number }; };
  };
  meta: { startDate: string; endDate: string };
};

const PIE_COLORS = ["#fbbf24", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];
const integerFormatter = new Intl.NumberFormat("en-US");
const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const chartTooltipStyle = { backgroundColor: "#09090b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "12px" };

// --- Premium UI Components ---
function SectionCard({ id, title, icon: Icon, children, description, delay = 0.1, className = "" }: any) {
  return (
    <ScrollReveal direction="up" delay={delay} className={className}>
      <Card id={id} className="p-6 bg-[#050505]/40 backdrop-blur-2xl border border-white/[0.08] shadow-2xl rounded-2xl transition-all duration-500 hover:border-[#fbbf24]/30 overflow-hidden relative h-full flex flex-col">
        <div className="flex flex-col mb-6 relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#fbbf24]/10 rounded-xl border border-[#fbbf24]/20">
              <Icon className="w-5 h-5 text-[#fbbf24]" />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-white">{title}</h2>
          </div>
          {description && <p className="text-xs text-zinc-400 mt-2 font-medium ml-12">{description}</p>}
        </div>
        <div className="relative z-10 flex-1 flex flex-col">{children}</div>
      </Card>
    </ScrollReveal>
  );
}

function MetricCard({ label, metric, icon: Icon, format = "number", delay = 0.1 }: any) {
  if (!metric) return <ScrollReveal delay={delay}><div className="p-6 bg-white/[0.02] border border-white/[0.05] rounded-2xl animate-pulse h-32" /></ScrollReveal>;

  const isPos = metric.deltaPct >= 0;
  const val = format === "currency" ? currencyFormatter.format(metric.value) : integerFormatter.format(metric.value);

  return (
    <ScrollReveal direction="up" delay={delay}>
      <Card className="p-6 bg-[#050505]/40 backdrop-blur-2xl border border-white/[0.08] hover:border-[#fbbf24]/40 transition-all group overflow-hidden relative shadow-2xl rounded-2xl h-full flex flex-col justify-between">
        <div className="flex justify-between items-start text-zinc-400 mb-4 relative z-10">
          <p className="text-[10px] font-extrabold uppercase tracking-widest group-hover:text-[#fbbf24] transition-colors">{label}</p>
          <Icon className="w-5 h-5 group-hover:scale-110 transition-transform text-zinc-500 group-hover:text-[#fbbf24]" />
        </div>
        <h3 className="text-3xl font-black text-white relative z-10">{val}</h3>
        <div className={`text-xs mt-3 font-bold flex items-center gap-1.5 relative z-10 ${isPos ? "text-green-400" : "text-red-400"}`}>
          {isPos ? <ArrowUpRight size={14} strokeWidth={3} /> : <TrendingUp size={14} strokeWidth={3} className="rotate-180" />}
          {Math.abs(metric.deltaPct).toFixed(1)}% 
          <span className="text-zinc-500 ml-1 font-medium text-[10px] uppercase tracking-wider">vs last period</span>
        </div>
        <div className="absolute -bottom-4 -right-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity text-[#fbbf24]">
          <Icon size={100} />
        </div>
      </Card>
    </ScrollReveal>
  );
}

export default function GoogleAnalytics() {
  const [range, setRange] = useState<DateRange>("7d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [payload, setPayload] = useState<GoogleAnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (range === "custom" && (!startDate || !endDate)) return;
      try {
        setLoading(true); setError(null);
        const params = new URLSearchParams({ range, startDate, endDate });
        const res = await fetch(`/api/analytics/google?${params.toString()}`);
        const result = await res.json();
        if (!res.ok || !result.success || !result.data) throw new Error(result.error || "Failed to fetch analytics");
        setPayload(result.data);
      } catch (err: any) {
        setPayload(null); setError(err.message);
      } finally { setLoading(false); }
    }; fetchData();
  }, [range, startDate, endDate]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-black/20 text-[#fbbf24] rounded-3xl">
      <Loader2 className="w-12 h-12 animate-spin mb-4" />
      <div className="text-center">
        <p className="font-black tracking-[0.3em] text-xs uppercase animate-pulse">Syncing Intel</p>
        <p className="text-[10px] text-zinc-600 mt-2 font-mono tracking-tighter">NODE_ESTABLISHING_GA4_CONNECTION</p>
      </div>
    </div>
  );

  if ((!payload && !loading) || error) return (
    <div className="h-screen flex flex-col items-center justify-center bg-black/20 text-red-400 rounded-3xl">
      <AlertCircle className="w-12 h-12 mb-4" />
      <div className="text-center">
        <p className="font-black tracking-[0.3em] text-xs uppercase">No Analytics Data</p>
        <p className="text-[10px] text-zinc-600 mt-2 font-mono tracking-tighter">{error ? error : "Check your Google Analytics setup or try again later."}</p>
      </div>
    </div>
  );

  return (
    <div className="bg-black/20 rounded-3xl min-h-screen text-zinc-300 font-sans pb-20 overflow-x-hidden">
      
      {/* Dynamic Header */}
      <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-2xl border-b border-white/[0.05] p-4 md:px-8 shadow-2xl rounded-t-3xl">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <h1 className="text-2xl font-black text-white tracking-tighter italic">
                LEAD EQUATOR <span className="text-[#fbbf24]">INTELLIGENCE</span>
              </h1>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Business Decision Support System</span>
            </div>
            {payload?.meta && (
              <Badge className="hidden sm:flex bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/20 px-3 py-1 font-mono text-[10px]">
                {payload.meta.startDate} / {payload.meta.endDate}
              </Badge>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <Select value={range} onValueChange={(v) => setRange(v as DateRange)}>
              <SelectTrigger className="w-full sm:w-40 bg-white/[0.02] border-white/[0.08] text-white rounded-xl text-xs h-10 font-bold focus:ring-[#fbbf24]/50 focus:ring-offset-0 outline-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-white/[0.1] text-white rounded-xl">
                <SelectItem value="7d">Past 7 Days</SelectItem>
                <SelectItem value="30d">Past 30 Days</SelectItem>
                <SelectItem value="custom">Custom Node</SelectItem>
              </SelectContent>
            </Select>
            {range === "custom" && (
              <div className="flex gap-2 w-full sm:w-auto animate-in fade-in slide-in-from-right-2">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full sm:w-36 bg-white/[0.02] border-white/[0.08] text-[10px] h-10 rounded-xl focus-visible:ring-[#fbbf24]/50 [color-scheme:dark]" />
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full sm:w-36 bg-white/[0.02] border-white/[0.08] text-[10px] h-10 rounded-xl focus-visible:ring-[#fbbf24]/50 [color-scheme:dark]" />
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
        {payload && (
          <div className="grid gap-8">
            
            {/* 1. Top-Level Business ROI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard label="Revenue" metric={payload.reports.snapshot?.totalRevenue} icon={DollarSign} format="currency" delay={0.1} />
              <MetricCard label="Sales Transactions" metric={payload.reports.snapshot?.ecommercePurchases} icon={Zap} delay={0.2} />
              <MetricCard label="Active Reach" metric={payload.summary?.activeUsers} icon={Users} delay={0.3} />
              <MetricCard label="Events Logged" metric={payload.summary?.eventCount} icon={Activity} delay={0.4} />
            </div>

            {/* Sub-Tables Grid (Responsive Stacked Cards) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              
              <SectionCard title="Acquisition Channels" icon={Navigation} delay={0.1} description="Integration with GA4 acquisition data">
                <table className="w-full text-sm block md:table">
                  <thead className="hidden md:table-header-group">
                    <tr className="border-b border-white/[0.05]">
                      <th className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest text-left pb-3 pl-4">Channel</th>
                      <th className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest text-right pb-3 pr-4">Users</th>
                    </tr>
                  </thead>
                  <tbody className="block md:table-row-group">
                    {[
                      { c: "Organic Search", u: 120 }, { c: "Paid Search", u: 80 }, 
                      { c: "Referral", u: 40 }, { c: "Social", u: 30 }
                    ].map((row, i) => (
                      <tr key={i} className="block md:table-row border border-white/[0.05] md:border-0 md:border-b md:border-white/[0.05] rounded-xl md:rounded-none mb-3 md:mb-0 bg-white/[0.02] md:bg-transparent">
                        <td className="flex justify-between items-center md:table-cell py-3 px-4">
                          <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Channel</span>
                          <span className="font-bold text-white text-right md:text-left">{row.c}</span>
                        </td>
                        <td className="flex justify-between items-center md:table-cell py-3 px-4 border-t border-white/[0.05] md:border-0">
                          <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Users</span>
                          <span className="text-right text-[#fbbf24] font-bold font-mono">{row.u}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </SectionCard>

              <SectionCard title="Conversion Tracking" icon={Target} delay={0.2} description="Integration with GA4 conversions">
                <table className="w-full text-sm block md:table">
                  <thead className="hidden md:table-header-group">
                    <tr className="border-b border-white/[0.05]">
                      <th className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest text-left pb-3 pl-4">Action</th>
                      <th className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest text-right pb-3 pr-4">Count</th>
                    </tr>
                  </thead>
                  <tbody className="block md:table-row-group">
                    {[
                      { a: "Signups", c: 25 }, { a: "Purchases", c: 10 }
                    ].map((row, i) => (
                      <tr key={i} className="block md:table-row border border-white/[0.05] md:border-0 md:border-b md:border-white/[0.05] rounded-xl md:rounded-none mb-3 md:mb-0 bg-white/[0.02] md:bg-transparent">
                        <td className="flex justify-between items-center md:table-cell py-3 px-4">
                          <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Action</span>
                          <span className="font-bold text-white text-right md:text-left">{row.a}</span>
                        </td>
                        <td className="flex justify-between items-center md:table-cell py-3 px-4 border-t border-white/[0.05] md:border-0">
                          <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Count</span>
                          <span className="text-right text-[#fbbf24] font-bold font-mono">{row.c}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </SectionCard>

              <SectionCard title="Funnel Analysis" icon={BarChart3} delay={0.3} description="Integration with GA4 funnel data">
                <table className="w-full text-sm block md:table">
                  <thead className="hidden md:table-header-group">
                    <tr className="border-b border-white/[0.05]">
                      <th className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest text-left pb-3 pl-4">Step</th>
                      <th className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest text-right pb-3 pr-4">Users</th>
                    </tr>
                  </thead>
                  <tbody className="block md:table-row-group">
                    {[
                      { s: "Landing Page", u: 200 }, { s: "Signup Page", u: 50 }, { s: "Thank You", u: 25 }
                    ].map((row, i) => (
                      <tr key={i} className="block md:table-row border border-white/[0.05] md:border-0 md:border-b md:border-white/[0.05] rounded-xl md:rounded-none mb-3 md:mb-0 bg-white/[0.02] md:bg-transparent">
                        <td className="flex justify-between items-center md:table-cell py-3 px-4">
                          <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Step</span>
                          <span className="font-bold text-white text-right md:text-left">{row.s}</span>
                        </td>
                        <td className="flex justify-between items-center md:table-cell py-3 px-4 border-t border-white/[0.05] md:border-0">
                          <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Users</span>
                          <span className="text-right text-[#fbbf24] font-bold font-mono">{row.u}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </SectionCard>

              <SectionCard title="Cohort Analysis" icon={Users} delay={0.4} description="Integration with GA4 cohort data">
                <table className="w-full text-sm block md:table">
                  <thead className="hidden md:table-header-group">
                    <tr className="border-b border-white/[0.05]">
                      <th className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest text-left pb-3 pl-4">Cohort</th>
                      <th className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest text-right pb-3 pr-4">D1 Ret.</th>
                      <th className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest text-right pb-3 pr-4">D7 Ret.</th>
                    </tr>
                  </thead>
                  <tbody className="block md:table-row-group">
                    {[
                      { c: "Mar 1-7", d1: "30%", d7: "10%" }, { c: "Mar 8-14", d1: "25%", d7: "8%" }
                    ].map((row, i) => (
                      <tr key={i} className="block md:table-row border border-white/[0.05] md:border-0 md:border-b md:border-white/[0.05] rounded-xl md:rounded-none mb-3 md:mb-0 bg-white/[0.02] md:bg-transparent">
                        <td className="flex justify-between items-center md:table-cell py-3 px-4 border-b border-white/[0.05] md:border-0">
                          <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Cohort</span>
                          <span className="font-bold text-white text-right md:text-left">{row.c}</span>
                        </td>
                        <td className="flex justify-between items-center md:table-cell py-3 px-4 border-b border-white/[0.05] md:border-0">
                          <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">D1 Ret.</span>
                          <span className="text-right text-zinc-300 font-bold font-mono">{row.d1}</span>
                        </td>
                        <td className="flex justify-between items-center md:table-cell py-3 px-4">
                          <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">D7 Ret.</span>
                          <span className="text-right text-[#fbbf24] font-bold font-mono">{row.d7}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </SectionCard>

              <SectionCard title="User Flow" icon={MousePointer2} delay={0.5} description="Integration with GA4 user flow">
                <table className="w-full text-sm block md:table">
                  <thead className="hidden md:table-header-group">
                    <tr className="border-b border-white/[0.05]">
                      <th className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest text-left pb-3 pl-4">Path</th>
                      <th className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest text-right pb-3 pr-4">Users</th>
                    </tr>
                  </thead>
                  <tbody className="block md:table-row-group">
                    {[
                      { p: "Landing → Signup", u: 50 }, { p: "Signup → Thank You", u: 25 }
                    ].map((row, i) => (
                      <tr key={i} className="block md:table-row border border-white/[0.05] md:border-0 md:border-b md:border-white/[0.05] rounded-xl md:rounded-none mb-3 md:mb-0 bg-white/[0.02] md:bg-transparent">
                        <td className="flex justify-between items-center md:table-cell py-3 px-4">
                          <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Path</span>
                          <span className="font-bold text-white text-right md:text-left">{row.p}</span>
                        </td>
                        <td className="flex justify-between items-center md:table-cell py-3 px-4 border-t border-white/[0.05] md:border-0">
                          <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Users</span>
                          <span className="text-right text-[#fbbf24] font-bold font-mono">{row.u}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </SectionCard>

              <SectionCard title="Goal Tracking" icon={Target} delay={0.6} description="Integration with GA4 goals">
                <table className="w-full text-sm block md:table">
                  <thead className="hidden md:table-header-group">
                    <tr className="border-b border-white/[0.05]">
                      <th className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest text-left pb-3 pl-4">Goal</th>
                      <th className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest text-right pb-3 pr-4">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="block md:table-row-group">
                    {[
                      { g: "Newsletter", p: "40%" }, { g: "Demo Req", p: "60%" }
                    ].map((row, i) => (
                      <tr key={i} className="block md:table-row border border-white/[0.05] md:border-0 md:border-b md:border-white/[0.05] rounded-xl md:rounded-none mb-3 md:mb-0 bg-white/[0.02] md:bg-transparent">
                        <td className="flex justify-between items-center md:table-cell py-3 px-4">
                          <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Goal</span>
                          <span className="font-bold text-white text-right md:text-left">{row.g}</span>
                        </td>
                        <td className="flex justify-between items-center md:table-cell py-3 px-4 border-t border-white/[0.05] md:border-0">
                          <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Progress</span>
                          <span className="text-right text-[#fbbf24] font-bold font-mono">{row.p}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </SectionCard>
            </div>

            {/* 2. Composed Growth Chart */}
            <SectionCard title="Acquisition Velocity" icon={TrendingUp} description="Analyzing the spread between raw reach and visitor intensity." delay={0.2}>
              <div className="grid lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 h-[400px] bg-white/[0.02] rounded-3xl p-6 border border-white/[0.05]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={payload.trend}>
                      <defs>
                        <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="date" stroke="#a1a1aa" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#a1a1aa" fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={chartTooltipStyle} cursor={{fill: 'rgba(255,255,255,0.02)'}} />
                      <Area type="monotone" dataKey="activeUsers" fill="url(#pGrad)" stroke="#fbbf24" strokeWidth={4} name="Active Users" />
                      <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="5 5" name="Page Views" />
                      <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-4 justify-center">
                  <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/[0.05]">
                    <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Conv. Efficiency</p>
                    <p className="text-4xl font-black text-white mt-2">
                      {(((payload.summary?.keyEvents?.value ?? 0) / (payload.summary?.sessions?.value || 1)) * 100).toFixed(1)}%
                    </p>
                    <p className="text-[10px] font-bold text-[#fbbf24] uppercase tracking-widest mt-2">Actions per session</p>
                  </div>
                  <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/[0.05]">
                    <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Bounce Rate</p>
                    <p className="text-4xl font-black text-red-400 mt-2">
                      {(100 - (payload.reports?.snapshot?.engagementRate?.value ?? 0)).toFixed(1)}%
                    </p>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">One-page sessions</p>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* 3. Loyalty & Funnel Row */}
            <div className="grid lg:grid-cols-2 gap-8">
              <SectionCard title="Customer Loyalty" icon={RefreshCcw} description="Understanding user return frequency and habit formation." delay={0.3}>
                <div className="grid grid-cols-3 gap-4 mb-6 mt-4">
                  {[
                    { l: 'DAU / MAU', v: payload.reports.business.stickiness.dauPerMau, d: 'Daily / Monthly' },
                    { l: 'DAU / WAU', v: payload.reports.business.stickiness.dauPerWau, d: 'Daily / Weekly' },
                    { l: 'WAU / MAU', v: payload.reports.business.stickiness.wauPerMau, d: 'Weekly / Monthly' }
                  ].map((item, i) => (
                    <div key={i} className="text-center p-5 bg-white/[0.02] rounded-2xl border border-white/[0.05] group hover:border-[#fbbf24]/40 transition-colors">
                      <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{item.l}</p>
                      <p className="text-2xl font-black text-[#fbbf24] my-2">{(item.v * 100 || 0).toFixed(1)}%</p>
                      <p className="text-[8px] text-zinc-600 uppercase font-bold leading-none">{item.d}</p>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-[#fbbf24]/10 rounded-2xl border border-[#fbbf24]/20 flex items-start gap-3">
                  <div className="mt-1 p-1 bg-[#fbbf24]/20 rounded-md"><Zap size={12} className="text-[#fbbf24]" /></div>
                  <p className="text-[11px] text-zinc-300 italic leading-relaxed">
                    <strong>High Stickiness Alert:</strong> DAU/MAU over 20% indicates your platform is becoming a daily habit.
                  </p>
                </div>
              </SectionCard>

              <SectionCard title="Conversion Funnel" icon={Layers} description="Monitoring the drop-off across high-value session actions." delay={0.4}>
                <div className="space-y-6 mt-6">
                  {(payload.reports.business.eventFunnel || []).slice(0, 5).map((event, i) => (
                    <div key={i} className="group">
                      <div className="flex justify-between items-end mb-2">
                        <div className="flex flex-col">
                           <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest">Stage {i+1}</span>
                           <span className="font-bold text-sm text-white uppercase mt-0.5">{event.eventName}</span>
                        </div>
                        <div className="text-right">
                           <span className="text-lg font-black text-[#fbbf24]">{integerFormatter.format(event.keyEvents)}</span>
                           <span className="text-[9px] text-zinc-500 ml-1 uppercase font-bold tracking-widest">Hits</span>
                        </div>
                      </div>
                      <div className="w-full bg-white/[0.05] h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#fbbf24] h-full transition-all duration-[1.5s]" 
                          style={{ width: `${((event.keyEvents / (payload.summary?.keyEvents?.value || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>

            {/* 4. Realtime Pulse & Demographics */}
            <div className="grid lg:grid-cols-3 gap-8">
              <SectionCard title="Realtime Pulse" icon={Activity} delay={0.5}>
                <div className="flex flex-col items-center justify-center pt-8">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 scale-150 blur-[50px] bg-[#fbbf24]/20 rounded-full" />
                    <h2 className="text-8xl font-black text-white relative">{payload.reports.realtime.activeUsersLast30Minutes}</h2>
                  </div>
                  <Badge className="bg-[#fbbf24] text-black font-black uppercase text-[10px] tracking-widest animate-pulse px-4 py-1">Live Users Online</Badge>
                  <div className="mt-12 h-[150px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={payload.reports.realtime.byMinute}>
                        <Bar dataKey="activeUsers" fill="#fbbf24" radius={[4, 4, 0, 0]} opacity={0.9} />
                        <Tooltip contentStyle={chartTooltipStyle} cursor={{fill: 'rgba(255,255,255,0.05)'}} labelStyle={{display: 'none'}} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Market Reach" icon={Globe} description="Volume breakdown by geo-location." delay={0.6}>
                 <div className="space-y-3 mt-4">
                   {payload.reports.user.countries.slice(0, 8).map((c, i) => (
                     <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-transparent hover:border-white/[0.08] transition-all group">
                        <div className="flex items-center gap-4">
                           <span className="text-[10px] font-black text-zinc-600 group-hover:text-[#fbbf24] transition-colors">0{i+1}</span>
                           <span className="text-sm font-bold text-white">{c.country}</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-[#fbbf24]">{integerFormatter.format(c.activeUsers)}</span>
                     </div>
                   ))}
                </div>
              </SectionCard>

              <SectionCard title="Tech Distribution" icon={Smartphone} delay={0.7}>
                <div className="h-[300px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={payload.reports.tech.devices} dataKey="activeUsers" nameKey="device" innerRadius={70} outerRadius={95} paddingAngle={5} stroke="none">
                        {payload.reports.tech.devices.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
            </div>

            {/* 5. Resource Performance */}
            <SectionCard title="Asset Performance Analysis" icon={Monitor} description="Evaluating high-traffic paths and unique user reach." delay={0.8}>
               <div className="border border-white/[0.05] rounded-2xl overflow-hidden bg-white/[0.01] mt-4">
                 
                 <table className="w-full text-sm block md:table">
                    <thead className="hidden md:table-header-group bg-white/[0.02]">
                      <tr className="border-b border-white/[0.05]">
                        <th className="text-zinc-500 uppercase text-[10px] font-extrabold tracking-widest pl-6 py-4 text-left">Internal Path</th>
                        <th className="text-right text-zinc-500 uppercase text-[10px] font-extrabold tracking-widest py-4">Gross Hits</th>
                        <th className="text-right text-zinc-500 uppercase text-[10px] font-extrabold tracking-widest pr-6 py-4">Unique reach</th>
                      </tr>
                    </thead>
                    <tbody className="block md:table-row-group">
                      {payload.reports.engagement.topPages.map((p, i) => (
                        <tr key={i} className="block md:table-row border border-white/[0.05] md:border-0 md:border-b md:border-white/[0.02] rounded-xl md:rounded-none mb-4 md:mb-0 bg-white/[0.02] md:bg-transparent hover:bg-white/[0.04] transition-colors group">
                          
                          <td className="flex justify-between items-center md:table-cell py-3 md:py-5 px-4 md:px-6 md:pl-6 border-b border-white/[0.05] md:border-0">
                            <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Internal Path</span>
                            <span className="font-mono text-xs font-bold text-[#fbbf24] flex items-center gap-2 text-right md:text-left">
                               <ExternalLink size={12} className="opacity-30 group-hover:opacity-100 group-hover:text-white transition-all hidden md:block" />
                               {p.page}
                            </span>
                          </td>

                          <td className="flex justify-between items-center md:table-cell py-3 md:py-5 px-4 md:px-6 border-b border-white/[0.05] md:border-0">
                            <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Gross Hits</span>
                            <span className="text-right text-white font-bold">{integerFormatter.format(p.views)}</span>
                          </td>

                          <td className="flex justify-between items-center md:table-cell py-3 md:py-5 px-4 md:px-6 md:pr-6">
                            <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Unique Reach</span>
                            <span className="text-right text-zinc-400">{integerFormatter.format(p.activeUsers)}</span>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                 </table>

               </div>
            </SectionCard>

          </div>
        )}
      </main>
    </div>
  );
}