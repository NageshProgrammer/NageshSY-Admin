import { useEffect, useState } from "react";
import { 
  Loader2, 
  AlertCircle, 
  TrendingUp, 
  Users, 
  Monitor, 
  Activity, 
  Globe, 
  Smartphone, 
  Target, 
  Zap, 
  RefreshCcw, 
  BarChart3,
  ExternalLink,
  DollarSign,
  ArrowUpRight,
  Navigation,
  MousePointer2,
  Layers
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  ComposedChart
} from "recharts";

// --- Types ---
type DateRange = "7d" | "30d" | "custom";
type MetricSummary = { value: number; deltaPct: number };

type GoogleAnalyticsPayload = {
  summary: {
    views: MetricSummary;
    eventCount: MetricSummary;
    activeUsers: MetricSummary;
    keyEvents: MetricSummary;
    sessions: MetricSummary;
  };
  trend: Array<{ date: string; activeUsers: number; previousActiveUsers: number; views: number }>;
  reports: {
    snapshot: {
      totalRevenue: MetricSummary;
      ecommercePurchases: MetricSummary;
      engagementRate: MetricSummary;
    };
    realtime: {
      activeUsersLast30Minutes: number;
      byMinute: Array<{ minute: string; activeUsers: number }>;
    };
    user: {
      countries: Array<{ country: string; activeUsers: number }>;
    };
    tech: {
      devices: Array<{ device: string; activeUsers: number }>;
    };
    engagement: {
      topPages: Array<{ page: string; views: number; activeUsers: number }>;
    };
    business: {
      eventFunnel: Array<{ eventName: string; eventCount: number; keyEvents: number }>;
      stickiness: { dauPerMau: number; dauPerWau: number; wauPerMau: number };
    };
  };
  meta: { startDate: string; endDate: string };
};

const PIE_COLORS = ["#14b8a6", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];
const integerFormatter = new Intl.NumberFormat("en-US");
const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

// --- UI Components ---
function SectionCard({ id, title, icon: Icon, children, description }: any) {
  return (
    <Card id={id} className="p-6 scroll-mt-6 border-slate-800 bg-[#0f1115] text-white shadow-2xl transition-all duration-500 hover:shadow-teal-500/5 overflow-hidden relative">
      <div className="flex flex-col mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-teal-500/10 rounded-lg">
            <Icon className="w-5 h-5 text-teal-400" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">{title}</h2>
        </div>
        {description && <p className="text-xs text-slate-500 mt-1 ml-11">{description}</p>}
      </div>
      {children}
    </Card>
  );
}

function MetricCard({ label, metric, icon: Icon, format = "number" }: any) {
  if (!metric) return <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl animate-pulse h-32" />;

  const isPos = metric.deltaPct >= 0;
  const val = format === "currency" ? currencyFormatter.format(metric.value) : integerFormatter.format(metric.value);

  return (
    <Card className="p-5 bg-slate-900/50 border-slate-800 hover:border-teal-500/50 transition-all group overflow-hidden relative">
      <div className="flex justify-between items-start text-slate-400 mb-3 relative z-10">
        <p className="text-[10px] font-bold uppercase tracking-widest group-hover:text-teal-400 transition-colors">{label}</p>
        <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
      </div>
      <h3 className="text-3xl font-black text-white relative z-10">{val}</h3>
      <div className={`text-xs mt-2 font-medium flex items-center gap-1 relative z-10 ${isPos ? "text-emerald-400" : "text-rose-400"}`}>
        {isPos ? <ArrowUpRight size={14} /> : <TrendingUp size={14} className="rotate-180" />}
        {Math.abs(metric.deltaPct).toFixed(1)}% 
        <span className="text-slate-500 ml-1 font-normal text-[10px] uppercase">vs last period</span>
      </div>
      <div className="absolute -bottom-2 -right-2 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
        <Icon size={80} />
      </div>
    </Card>
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
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({ range, startDate, endDate });
        const res = await fetch(`/api/analytics/google?${params.toString()}`);
        const result = await res.json();
        if (!res.ok || !result.success || !result.data) throw new Error(result.error || "Failed to fetch analytics");
        setPayload(result.data);
      } catch (err: any) {
        setPayload(null); // Ensure blackout fallback triggers
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [range, startDate, endDate]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#050505] text-teal-500">
      <Loader2 className="w-12 h-12 animate-spin mb-4 opacity-20" />
      <div className="text-center">
        <p className="font-black tracking-[0.3em] text-xs uppercase animate-pulse">Syncing Lead Equator Intel</p>
        <p className="text-[10px] text-slate-600 mt-2 font-mono tracking-tighter">NODE_ESTABLISHING_GA4_CONNECTION</p>
      </div>
    </div>
  );

  // Blackout/fallback screen if no data or error
  if ((!payload && !loading) || error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#050505] text-rose-400">
        <AlertCircle className="w-12 h-12 mb-4" />
        <div className="text-center">
          <p className="font-black tracking-[0.3em] text-xs uppercase">No Analytics Data</p>
          <p className="text-[10px] text-slate-600 mt-2 font-mono tracking-tighter">{error ? error : "Check your Google Analytics setup or try again later."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#050505] min-h-screen text-slate-300 font-sans selection:bg-teal-500/30 pb-20">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-50 bg-[#050505]/90 backdrop-blur-xl border-b border-slate-800 p-4 md:px-8 shadow-2xl">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <h1 className="text-2xl font-black text-white tracking-tighter italic">
                LEAD EQUATOR <span className="text-teal-500">INTELLIGENCE</span>
              </h1>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Business Decision Support System</span>
            </div>
            {payload?.meta && (
              <Badge className="hidden sm:flex bg-teal-500/10 text-teal-400 border-teal-500/20 px-3 py-1 font-mono text-[10px]">
                {payload.meta.startDate} / {payload.meta.endDate}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Select value={range} onValueChange={(v) => setRange(v as DateRange)}>
              <SelectTrigger className="w-40 bg-slate-900 border-slate-700 text-white rounded-xl text-xs h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-white">
                <SelectItem value="7d">Past 7 Days</SelectItem>
                <SelectItem value="30d">Past 30 Days</SelectItem>
                <SelectItem value="custom">Custom Node</SelectItem>
              </SelectContent>
            </Select>
            {range === "custom" && (
              <div className="flex gap-2 animate-in fade-in slide-in-from-right-2">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-32 bg-slate-900 border-slate-800 text-[10px] h-9" />
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-32 bg-slate-900 border-slate-800 text-[10px] h-9" />
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
        {error ? (
          <Alert variant="destructive" className="bg-rose-950/30 border-rose-900 text-rose-200 border-2">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="font-black uppercase text-xs">Analytics Sync Failed</AlertTitle>
            <AlertDescription className="mt-2 text-sm">{error}</AlertDescription>
          </Alert>
        ) : payload && (
          <div className="grid gap-8">
            
            {/* 1. Top-Level Business ROI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard label="Revenue" metric={payload.reports.snapshot?.totalRevenue} icon={DollarSign} format="currency" description="Total money earned from sales and transactions." />
              <MetricCard label="Sales Transactions" metric={payload.reports.snapshot?.ecommercePurchases} icon={Zap} description="Number of completed sales or purchases." />
              <MetricCard label="Active Reach" metric={payload.summary?.activeUsers} icon={Users} description="Number of people who visited your site during the selected period." />
              <MetricCard label="Events Logged" metric={payload.summary?.eventCount} icon={Activity} description="Total actions users took, like clicks, signups, or purchases." />
            </div>

            {/* 1a. Acquisition Channels */}
            <SectionCard title="Acquisition Channels" icon={Navigation} description="Shows how visitors found your website: through search engines, ads, referrals, or social media.">
              <div className="flex flex-col gap-2">
                <div className="text-xs text-slate-400">(Integrate with GA4 acquisition data for real values)</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Sessions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Example static data, replace with real GA4 data */}
                    <TableRow><TableCell>Organic Search</TableCell><TableCell>120</TableCell><TableCell>200</TableCell></TableRow>
                    <TableRow><TableCell>Paid Search</TableCell><TableCell>80</TableCell><TableCell>150</TableCell></TableRow>
                    <TableRow><TableCell>Referral</TableCell><TableCell>40</TableCell><TableCell>60</TableCell></TableRow>
                    <TableRow><TableCell>Social</TableCell><TableCell>30</TableCell><TableCell>50</TableCell></TableRow>
                  </TableBody>
                </Table>
              </div>
            </SectionCard>

            {/* 1b. Conversion Tracking */}
            <SectionCard title="Conversion Tracking" icon={Target} description="See how many people completed important actions, like signing up or making a purchase.">
              <div className="flex flex-col gap-2">
                <div className="text-xs text-slate-400">(Integrate with GA4 conversions for real values)</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Conversion</TableHead>
                      <TableHead>Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow><TableCell>Signups</TableCell><TableCell>25</TableCell></TableRow>
                    <TableRow><TableCell>Purchases</TableCell><TableCell>10</TableCell></TableRow>
                  </TableBody>
                </Table>
              </div>
            </SectionCard>

            {/* 1c. Funnel Analysis */}
            <SectionCard title="Funnel Analysis" icon={BarChart3} description="Understand the steps users take from first visit to final action, and where they drop off.">
              <div className="flex flex-col gap-2">
                <div className="text-xs text-slate-400">(Integrate with GA4 funnel data for real values)</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Step</TableHead>
                      <TableHead>Users</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow><TableCell>Landing Page</TableCell><TableCell>200</TableCell></TableRow>
                    <TableRow><TableCell>Signup Page</TableCell><TableCell>50</TableCell></TableRow>
                    <TableRow><TableCell>Thank You</TableCell><TableCell>25</TableCell></TableRow>
                  </TableBody>
                </Table>
              </div>
            </SectionCard>

            {/* 1d. Cohort Analysis */}
            <SectionCard title="Cohort Analysis" icon={Users} description="See how well you keep users coming back after their first visit, measured over days or weeks.">
              <div className="flex flex-col gap-2">
                <div className="text-xs text-slate-400">(Integrate with GA4 cohort data for real values)</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cohort</TableHead>
                      <TableHead>Day 1 Retention</TableHead>
                      <TableHead>Day 7 Retention</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow><TableCell>March 1-7</TableCell><TableCell>30%</TableCell><TableCell>10%</TableCell></TableRow>
                    <TableRow><TableCell>March 8-14</TableCell><TableCell>25%</TableCell><TableCell>8%</TableCell></TableRow>
                  </TableBody>
                </Table>
              </div>
            </SectionCard>

            {/* 1e. Alerts & Anomalies */}
            <SectionCard title="Alerts & Anomalies" icon={AlertCircle} description="Get notified about unusual changes, like sudden increases or decreases in visitors or sales.">
              <div className="flex flex-col gap-2">
                <div className="text-xs text-slate-400">(Integrate with GA4 or custom alerting for real values)</div>
                <ul className="list-disc ml-6 text-sm text-rose-400">
                  <li>Traffic spike detected on March 10</li>
                  <li>Conversion drop on March 12</li>
                </ul>
              </div>
            </SectionCard>

            {/* 1f. User Flow */}
            <SectionCard title="User Flow" icon={MousePointer2} description="See the most common paths users take through your website, from landing to conversion.">
              <div className="flex flex-col gap-2">
                <div className="text-xs text-slate-400">(Integrate with GA4 user flow for real values)</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Users</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow><TableCell>Landing</TableCell><TableCell>Signup</TableCell><TableCell>50</TableCell></TableRow>
                    <TableRow><TableCell>Signup</TableCell><TableCell>Thank You</TableCell><TableCell>25</TableCell></TableRow>
                  </TableBody>
                </Table>
              </div>
            </SectionCard>

            {/* 1g. Goal Tracking */}
            <SectionCard title="Goal Tracking" icon={Target} description="Track progress toward your business goals, like newsletter signups or demo requests.">
              <div className="flex flex-col gap-2">
                <div className="text-xs text-slate-400">(Integrate with GA4 goals for real values)</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Goal</TableHead>
                      <TableHead>Progress</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow><TableCell>Newsletter Signups</TableCell><TableCell>40%</TableCell></TableRow>
                    <TableRow><TableCell>Demo Requests</TableCell><TableCell>60%</TableCell></TableRow>
                  </TableBody>
                </Table>
              </div>
            </SectionCard>

            {/* 2. Composed Growth Chart */}
            <SectionCard title="Acquisition Velocity" icon={TrendingUp} description="Analyzing the spread between raw reach and visitor intensity.">
              <div className="grid lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 h-[400px] bg-black/40 rounded-3xl p-6 border border-slate-800">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={payload.trend}>
                      <defs>
                        <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px'}} />
                      <Area type="monotone" dataKey="activeUsers" fill="url(#pGrad)" stroke="#14b8a6" strokeWidth={4} name="Active Users" />
                      <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="5 5" name="Page Views" />
                      <Legend verticalAlign="top" align="right" iconType="circle" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-4 justify-center">
                  <div className="p-6 bg-slate-900/40 rounded-2xl border border-slate-800">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Conv. Efficiency</p>
                    <p className="text-4xl font-black text-white mt-1">
                      {(
                        ((payload.summary?.keyEvents?.value ?? 0) / (payload.summary?.sessions?.value || 1)) * 100
                      ).toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-teal-500 mt-2">Actions per session</p>
                  </div>
                  <div className="p-6 bg-slate-900/40 rounded-2xl border border-slate-800">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Bounce Rate</p>
                    <p className="text-4xl font-black text-rose-500 mt-1">
                      {(
                        100 - (payload.reports?.snapshot?.engagementRate?.value ?? 0)
                      ).toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-slate-600 mt-2">One-page sessions</p>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* 3. Loyalty & Funnel Row */}
            <div className="grid lg:grid-cols-2 gap-8">
              <SectionCard title="Customer Loyalty (Stickiness)" icon={RefreshCcw} description="Understanding user return frequency and habit formation.">
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { l: 'DAU / MAU', v: payload.reports.business.stickiness.dauPerMau, d: 'Daily Active / Monthly' },
                    { l: 'DAU / WAU', v: payload.reports.business.stickiness.dauPerWau, d: 'Daily Active / Weekly' },
                    { l: 'WAU / MAU', v: payload.reports.business.stickiness.wauPerMau, d: 'Weekly Active / Monthly' }
                  ].map((item, i) => (
                    <div key={i} className="text-center p-5 bg-black/40 rounded-2xl border border-slate-800 group hover:border-teal-500/40 transition-colors">
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{item.l}</p>
                      <p className="text-2xl font-black text-teal-400 my-1">{(item.v * 100 || 0).toFixed(1)}%</p>
                      <p className="text-[8px] text-slate-600 uppercase font-bold leading-none">{item.d}</p>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-teal-500/5 rounded-2xl border border-teal-500/10 flex items-start gap-3">
                  <div className="mt-1 p-1 bg-teal-500/20 rounded-md"><Zap size={12} className="text-teal-400" /></div>
                  <p className="text-[11px] text-slate-400 italic leading-relaxed">
                    <strong>High Stickiness Alert:</strong> DAU/MAU over 20% indicates your platform is becoming a daily habit for your users.
                  </p>
                </div>
              </SectionCard>

              <SectionCard title="Conversion Quality Funnel" icon={Layers} description="Monitoring the drop-off across high-value session actions.">
                <div className="space-y-6 mt-2">
                  {(payload.reports.business.eventFunnel || []).slice(0, 5).map((event, i) => (
                    <div key={i} className="group">
                      <div className="flex justify-between items-end mb-2">
                        <div className="flex flex-col">
                           <span className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">Stage {i+1}</span>
                           <span className="font-mono text-xs text-teal-400 uppercase">{event.eventName}</span>
                        </div>
                        <div className="text-right">
                           <span className="text-lg font-black text-white">{integerFormatter.format(event.keyEvents)}</span>
                           <span className="text-[9px] text-slate-500 ml-1 uppercase">Hits</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-800/30 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div 
                          className="bg-gradient-to-r from-teal-600 to-teal-200 h-full transition-all duration-[1.5s]" 
                          style={{ width: `${(
                            (event.keyEvents / (payload.summary?.keyEvents?.value || 1)) * 100
                          )}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>

            {/* 4. Realtime Pulse & Demographics */}
            <div className="grid lg:grid-cols-3 gap-8">
              <SectionCard title="Realtime Pulse" icon={Activity}>
                <div className="flex flex-col items-center justify-center pt-4">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 scale-150 blur-[50px] bg-teal-500/20 rounded-full" />
                    <h2 className="text-8xl font-black text-white relative">{payload.reports.realtime.activeUsersLast30Minutes}</h2>
                  </div>
                  <Badge className="bg-teal-500 text-black font-black uppercase text-[10px] tracking-widest animate-pulse px-4">Live Users Online</Badge>
                  <div className="mt-12 h-[150px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={payload.reports.realtime.byMinute}>
                        <Bar dataKey="activeUsers" fill="#14b8a6" radius={[2, 2, 0, 0]} opacity={0.8} />
                        <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', fontSize: '10px'}} cursor={{fill: '#1e293b'}} labelStyle={{display: 'none'}} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Market Reach" icon={Globe} description="Volume breakdown by geo-location.">
                 <div className="space-y-4">
                   {payload.reports.user.countries.slice(0, 8).map((c, i) => (
                     <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-900/50 border border-transparent hover:border-slate-800 transition-all group">
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-black text-slate-700 group-hover:text-teal-500 transition-colors">0{i+1}</span>
                           <span className="text-sm font-medium text-slate-300">{c.country}</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-teal-400">{integerFormatter.format(c.activeUsers)}</span>
                     </div>
                   ))}
                </div>
              </SectionCard>

              <SectionCard title="Tech Distribution" icon={Smartphone}>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={payload.reports.tech.devices} dataKey="activeUsers" nameKey="device" innerRadius={70} outerRadius={95} paddingAngle={10} stroke="none">
                        {payload.reports.tech.devices.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px'}} />
                      <Legend verticalAlign="bottom" align="center" iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
            </div>

            {/* 5. Resource Performance */}
            <SectionCard title="Asset Performance Analysis" icon={Monitor} description="Evaluating high-traffic paths and unique user reach.">
               <div className="border border-slate-800 rounded-3xl overflow-hidden bg-black/20 mt-2">
                 <Table>
                    <TableHeader className="bg-slate-900/50 border-b border-slate-800">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-slate-500 uppercase text-[10px] font-black tracking-widest pl-8 py-5">Internal Path</TableHead>
                        <TableHead className="text-right text-slate-500 uppercase text-[10px] font-black tracking-widest py-5">Gross Hits</TableHead>
                        <TableHead className="text-right text-slate-500 uppercase text-[10px] font-black tracking-widest pr-8 py-5">Unique reach</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payload.reports.engagement.topPages.map((p, i) => (
                        <TableRow key={i} className="border-slate-800/50 hover:bg-slate-900/40 group transition-colors">
                          <TableCell className="font-mono text-[11px] text-teal-400 pl-8 py-5 flex items-center gap-3">
                             <ExternalLink size={10} className="opacity-20 group-hover:opacity-100 group-hover:text-white transition-all" />
                             {p.page}
                          </TableCell>
                          <TableCell className="text-right text-white font-bold py-5">{integerFormatter.format(p.views)}</TableCell>
                          <TableCell className="text-right text-slate-400 pr-8 py-5">{integerFormatter.format(p.activeUsers)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                 </Table>
               </div>
            </SectionCard>

          </div>
        )}
      </main>
    </div>
  );
}