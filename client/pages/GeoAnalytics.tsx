import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Globe, Users, TrendingUp, Loader2 } from "lucide-react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const GEO_JSON_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type GeoCountryRow = {
  country: string;
  totalUsers: number;
  activeUsers: number;
  activityPercentage: number;
};

const COUNTRY_ALIAS: Record<string, string> = {
  usa: "united states",
  us: "united states",
  "u s a": "united states",
  "united states of america": "united states",
  "united states america": "united states",
  uk: "united kingdom",
  "u k": "united kingdom",
  uae: "united arab emirates",
  "u a e": "united arab emirates",
  "cote d ivoire": "ivory coast",
  "czech republic": "czechia",
  "south korea": "korea republic of",
  "north korea": "korea democratic peoples republic of",
  russia: "russian federation",
};

const sanitizeCountry = (value: string | null | undefined) => {
  if (!value) return "unknown";
  return value.trim().toLowerCase().replace(/[.,'()-]/g, " ").replace(/\s+/g, " ");
};

const normalizeCountryKey = (value: string | null | undefined) => {
  const sanitized = sanitizeCountry(value);
  return COUNTRY_ALIAS[sanitized] || sanitized;
};

const toDisplayCountry = (value: string) => {
  if (!value || value === "unknown") return "Unknown";
  if (value === "united states") return "United States";
  if (value === "united kingdom") return "United Kingdom";
  if (value === "united arab emirates") return "United Arab Emirates";
  return value.split(" ").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
};

const getWorldFeatureName = (geo: any) => {
  return geo?.properties?.name || geo?.properties?.NAME || geo?.properties?.NAME_LONG || geo?.properties?.ADMIN || "";
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const normalizeRotationLng = (value: number) => {
  let lng = value;
  while (lng > 180) lng -= 360;
  while (lng < -180) lng += 360;
  return lng;
};

const glassCard = "p-6 bg-[#050505]/40 backdrop-blur-2xl border border-white/[0.08] shadow-2xl rounded-2xl";
const chartTooltipStyle = { backgroundColor: "#09090b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "12px" };

export default function GeoAnalytics() {
  const [geoData, setGeoData] = useState<GeoCountryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rotation, setRotation] = useState<[number, number, number]>([-15, -18, 0]);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; rotation: [number, number, number] } | null>(null);

  // Fetch Data
  useEffect(() => {
    const fetchGeoData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/analytics/geo");
        if (!res.ok) throw new Error("Failed to fetch geographic data");
        const data = await res.json();
        setGeoData(data.data || []);
      } catch (err) {
        console.error("Geo fetch error:", err);
        setError("Failed to load geographic analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchGeoData();
  }, []);

  // Process Data
  const normalizedCountries = useMemo(() => {
    const aggregated: Record<string, GeoCountryRow> = {};

    geoData.forEach((country) => {
      const key = normalizeCountryKey(country.country);
      if (key === "unknown") return;

      if (!aggregated[key]) {
        aggregated[key] = { country: toDisplayCountry(key), totalUsers: 0, activeUsers: 0, activityPercentage: 0 };
      }
      aggregated[key].totalUsers += Number(country.totalUsers || 0);
      aggregated[key].activeUsers += Number(country.activeUsers || 0);
    });

    return Object.entries(aggregated)
      .map(([key, row]) => ({
        ...row,
        normalizedKey: key,
        activityPercentage: row.totalUsers > 0 ? (row.activeUsers / row.totalUsers) * 100 : 0,
      }))
      .sort((a, b) => b.totalUsers - a.totalUsers);
  }, [geoData]);

  const totalUsers = normalizedCountries.reduce((sum, c) => sum + c.totalUsers, 0);
  const totalActiveUsers = normalizedCountries.reduce((sum, c) => sum + c.activeUsers, 0);
  const maxCountryUsers = normalizedCountries[0]?.totalUsers || 1;

  // 🚀 PERFORMANCE FIX: Convert to Map for O(1) Instant Lookup inside the Globe Render Loop
  const usersByCountry = useMemo(() => {
    const map = new Map<string, number>();
    normalizedCountries.forEach((item) => map.set(item.normalizedKey, item.totalUsers));
    return map;
  }, [normalizedCountries]);

  // Auto-Rotation logic using requestAnimationFrame for smoothness
  useEffect(() => {
    if (isDragging) return;
    let frameId: number;
    let lastTime = performance.now();
    
    const animate = (time: number) => {
      const delta = time - lastTime;
      // 🚀 PERFORMANCE FIX: Throttled to ~25fps (40ms) to save CPU while remaining smooth
      if (delta > 40) {
        setRotation((prev) => [normalizeRotationLng(prev[0] + 0.15), prev[1], 0]);
        lastTime = time;
      }
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isDragging]);

  // Drag Handlers
  const handleMouseDown = (event: any) => {
    setIsDragging(true);
    dragStartRef.current = { x: event.clientX, y: event.clientY, rotation };
  };

  const handleMouseMove = (event: any) => {
    if (!dragStartRef.current) return;
    const deltaX = event.clientX - dragStartRef.current.x;
    const deltaY = event.clientY - dragStartRef.current.y;
    const newLng = normalizeRotationLng(dragStartRef.current.rotation[0] + deltaX * 0.28);
    const newLat = clamp(dragStartRef.current.rotation[1] - deltaY * 0.2, -45, 45);
    setRotation([newLng, newLat, 0]);
  };

  const stopDragging = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-black/20 rounded-3xl"><Loader2 className="w-8 h-8 animate-spin text-[#fbbf24]" /></div>;
  if (error) return <div className="text-red-400 p-8 text-center font-bold">{error}</div>;

  return (
    <div className="space-y-8 p-4 md:p-8 bg-black/20 rounded-3xl">
      
      {/* Header */}
      <ScrollReveal direction="down">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Geo Analytics</h1>
        <p className="text-sm text-zinc-400 mt-2 font-medium">User distribution and activity across different regions and countries.</p>
      </ScrollReveal>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ScrollReveal direction="up" delay={0.1}>
          <Card className={glassCard}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Total Users</p>
                <p className="text-3xl font-black text-white mt-2">{totalUsers.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center border border-white/[0.1]">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.2}>
          <Card className={glassCard}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Active Users</p>
                <p className="text-3xl font-black text-white mt-2">{totalActiveUsers.toLocaleString()}</p>
                <p className="text-[#fbbf24] font-bold text-xs mt-2">{totalUsers > 0 ? ((totalActiveUsers / totalUsers) * 100).toFixed(1) : "0.0"}% active</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#fbbf24]/10 flex items-center justify-center border border-[#fbbf24]/20">
                <TrendingUp className="w-6 h-6 text-[#fbbf24]" />
              </div>
            </div>
          </Card>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.3}>
          <Card className={glassCard}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Countries Reached</p>
                <p className="text-3xl font-black text-white mt-2">{normalizedCountries.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Globe className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </Card>
        </ScrollReveal>
      </div>

      {/* Massive World Heatmap */}
      <ScrollReveal direction="up" delay={0.4}>
        <Card className={glassCard}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-6">
            <div>
              <h3 className="font-bold text-white text-lg tracking-tight">World User Heatmap</h3>
              <p className="text-xs text-zinc-400 mt-1">Brighter amber indicates higher user concentration by country. Click and drag to rotate.</p>
            </div>
            <p className="text-[10px] font-extrabold text-[#fbbf24] uppercase tracking-widest bg-[#fbbf24]/10 border border-[#fbbf24]/20 px-3 py-1.5 rounded-md self-start md:self-auto">
              {normalizedCountries.length} countries mapped
            </p>
          </div>

          <div
            className={`relative w-full h-[400px] md:h-[600px] rounded-2xl border border-white/[0.05] bg-[#050505] overflow-hidden select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDragging}
            onMouseLeave={stopDragging}
          >
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[300px] h-[300px] bg-[#fbbf24]/10 rounded-full blur-[100px]" />
            </div>

            <ComposableMap
              projection="geoOrthographic"
              projectionConfig={{ scale: 280, rotate: rotation }}
              style={{ width: "100%", height: "100%", outline: "none" }}
            >
              <Geographies geography={GEO_JSON_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const worldCountry = normalizeCountryKey(getWorldFeatureName(geo));
                    // O(1) Instant map lookup prevents the globe from lagging!
                    const userCount = usersByCountry.get(worldCountry) || 0;
                    
                    // Determine Color based on user count
                    let fill = "rgba(255,255,255,0.02)"; // Empty countries
                    if (userCount > 0) {
                      const ratio = userCount / maxCountryUsers;
                      const opacity = 0.2 + (ratio * 0.8); // Scale opacity from 20% to 100%
                      fill = `rgba(251, 191, 36, ${opacity})`;
                    }

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth={0.5}
                        fill={fill}
                        style={{
                          default: { outline: "none", transition: "all 0.3s" },
                          hover: { outline: "none", fill: "rgba(251, 191, 36, 0.9)", cursor: "pointer", transition: "all 0.1s" },
                          pressed: { outline: "none" },
                        }}
                      >
                        <title>{`${toDisplayCountry(worldCountry)}: ${userCount.toLocaleString()} users`}</title>
                      </Geography>
                    );
                  })
                }
              </Geographies>
            </ComposableMap>
          </div>

          {/* Color Scale Legend */}
          <div className="mt-6 flex items-center justify-between flex-wrap gap-3 border-t border-white/[0.05] pt-6">
            <p className="text-xs font-medium text-zinc-500">Global Heat Distribution</p>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-zinc-500 uppercase">Low</span>
              <div className="w-48 h-2.5 rounded-full bg-gradient-to-r from-[rgba(251,191,36,0.1)] to-[rgba(251,191,36,1)] border border-white/[0.1]" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase">High</span>
            </div>
          </div>
        </Card>
      </ScrollReveal>

      {/* Top Countries Bar Chart */}
      <ScrollReveal direction="up" delay={0.5}>
        <Card className={glassCard}>
          <h3 className="font-bold text-white mb-6 tracking-tight">Top 10 Countries by Volume</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={normalizedCountries.slice(0, 10)} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="country" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10, fill: "#a1a1aa" }} angle={-35} textAnchor="end" height={60} />
              <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11, fill: "#a1a1aa" }} />
              <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="totalUsers" fill="#fbbf24" name="Total Users" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </ScrollReveal>

      {/* Country Table - Responsive Design */}
      <ScrollReveal direction="up" delay={0.6}>
        <Card className={`${glassCard} !p-0 bg-transparent md:bg-[#050505]/40 md:overflow-hidden border-0 md:border md:border-white/[0.08] shadow-none md:shadow-2xl`}>
          
          <div className="hidden md:block p-6 border-b border-white/[0.05]">
            <h3 className="font-bold text-white tracking-tight">Detailed Country Statistics</h3>
          </div>

          <div className="md:overflow-x-auto max-h-none md:max-h-[400px] custom-scrollbar">
            <table className="w-full text-sm block md:table">
              
              <thead className="hidden md:table-header-group sticky top-0 z-10 bg-[#09090b]">
                <tr className="border-b border-white/[0.05]">
                  <th className="text-left py-4 px-6 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">#</th>
                  <th className="text-left py-4 px-6 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Country</th>
                  <th className="text-right py-4 px-6 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Total Users</th>
                  <th className="text-right py-4 px-6 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Active Users</th>
                  <th className="text-center py-4 px-6 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">% of Total</th>
                </tr>
              </thead>
              
              <tbody className="block md:table-row-group">
                {normalizedCountries.map((country, index) => {
                  const percentage = ((country.totalUsers / totalUsers) * 100).toFixed(1);
                  return (
                    <tr key={country.normalizedKey} className="block md:table-row bg-white/[0.02] md:bg-transparent border border-white/[0.05] md:border-0 md:border-b md:border-white/[0.05] rounded-2xl md:rounded-none mb-4 md:mb-0 p-5 md:p-0 hover:bg-white/[0.04] md:hover:bg-white/[0.02] transition-colors group">
                      
                      {/* Index # */}
                      <td className="flex justify-between items-center md:table-cell py-2 md:py-4 px-0 md:px-6 border-b border-white/[0.05] md:border-0 text-zinc-500 font-bold group-hover:text-[#fbbf24] transition-colors">
                        <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Rank</span>
                        {index + 1}
                      </td>

                      {/* Country Name */}
                      <td className="flex justify-between items-center md:table-cell py-3 md:py-4 px-0 md:px-6 border-b border-white/[0.05] md:border-0 text-white font-bold">
                        <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Country</span>
                        <span className="text-right md:text-left">{country.country || "Unknown"}</span>
                      </td>

                      {/* Total Users */}
                      <td className="flex justify-between items-center md:table-cell py-3 md:py-4 px-0 md:px-6 border-b border-white/[0.05] md:border-0 text-zinc-300 font-mono">
                        <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Total Users</span>
                        <span className="text-right">{country.totalUsers.toLocaleString()}</span>
                      </td>

                      {/* Active Users */}
                      <td className="flex justify-between items-center md:table-cell py-3 md:py-4 px-0 md:px-6 border-b border-white/[0.05] md:border-0 text-[#fbbf24] font-bold font-mono">
                        <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Active Users</span>
                        <span className="text-right">{country.activeUsers.toLocaleString()}</span>
                      </td>

                      {/* Percentage Bar */}
                      <td className="flex justify-between items-center md:table-cell pt-4 pb-1 md:py-4 px-0 md:px-6 md:text-center">
                        <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">% of Total</span>
                        <div className="flex items-center justify-end md:justify-center gap-3">
                          <div className="hidden sm:block w-24 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                            <div className="h-full bg-[#fbbf24] transition-all" style={{ width: `${percentage}%` }} />
                          </div>
                          <span className="text-zinc-500 font-mono text-[10px] font-bold">{percentage}%</span>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
        </Card>
      </ScrollReveal>

    </div>
  );
}