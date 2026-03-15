import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Globe, Users, TrendingUp, Loader2 } from "lucide-react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

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
  return value
    .trim()
    .toLowerCase()
    .replace(/[.,'()-]/g, " ")
    .replace(/\s+/g, " ");
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
  return value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getWorldFeatureName = (geo: any) => {
  return (
    geo?.properties?.name ||
    geo?.properties?.NAME ||
    geo?.properties?.NAME_LONG ||
    geo?.properties?.ADMIN ||
    ""
  );
};

const getHeatColor = (countryUsers: number, maxUsers: number) => {
  if (!countryUsers || !maxUsers) return "hsl(0 0% 12%)";
  const ratio = Math.min(countryUsers / maxUsers, 1);

  // Low user count -> light green, high user count -> dark green.
  const lightness = 70 - ratio * 48;
  const saturation = 48 + ratio * 28;
  return `hsl(136 ${saturation.toFixed(0)}% ${lightness.toFixed(0)}%)`;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const normalizeRotationLng = (value: number) => {
  let lng = value;
  while (lng > 180) lng -= 360;
  while (lng < -180) lng += 360;
  return lng;
};

export default function GeoAnalytics() {
  const [geoData, setGeoData] = useState<GeoCountryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rotation, setRotation] = useState<[number, number, number]>([-15, -18, 0]);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; rotation: [number, number, number] } | null>(null);

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

  const normalizedCountries = useMemo(() => {
    const aggregated: Record<string, GeoCountryRow> = {};

    geoData.forEach((country) => {
      const key = normalizeCountryKey(country.country);
      if (key === "unknown") {
        return;
      }

      if (!aggregated[key]) {
        aggregated[key] = {
          country: toDisplayCountry(key),
          totalUsers: 0,
          activeUsers: 0,
          activityPercentage: 0,
        };
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
  const maxCountryUsers = normalizedCountries[0]?.totalUsers || 0;

  const usersByCountry = useMemo(() => {
    const map = new Map<string, number>();
    normalizedCountries.forEach((item) => {
      map.set(item.normalizedKey, item.totalUsers);
    });
    return map;
  }, [normalizedCountries]);

  useEffect(() => {
    if (isDragging) return;

    const timer = window.setInterval(() => {
      setRotation((prev) => [normalizeRotationLng(prev[0] + 0.22), prev[1], 0]);
    }, 24);

    return () => window.clearInterval(timer);
  }, [isDragging]);

  const handleMouseDown = (event: any) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      rotation,
    };
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Geo Analytics
        </h1>
        <p className="text-muted-foreground text-xs mt-1">
          User distribution and activity across different regions and countries.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs font-medium">
                Total Users
              </p>
              <p className="text-2xl font-bold text-foreground mt-2">
                {totalUsers.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs font-medium">
                Active Users
              </p>
              <p className="text-2xl font-bold text-foreground mt-2">
                {totalActiveUsers.toLocaleString()}
              </p>
              <p className="text-primary text-xs mt-2">
                {totalUsers > 0 ? ((totalActiveUsers / totalUsers) * 100).toFixed(1) : "0.0"}% active
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs font-medium">
                Countries with Users
              </p>
              <p className="text-2xl font-bold text-foreground mt-2">
                {normalizedCountries.length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
          </div>
        </Card>
      </div>

      {/* World Heatmap */}
      <Card className="relative z-0 p-[6px] border-yellow-500/20 bg-black overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <div>
            <h3 className="font-semibold text-foreground text-xs">World User Heatmap</h3>
            <p className="text-[11px] text-muted-foreground mt-1">
              Dark green indicates higher user concentration by country.
            </p>
          </div>
          <p className="text-[11px] text-yellow-400 font-medium">
            {normalizedCountries.length} countries mapped
          </p>
        </div>

        <div
          className={`rounded-lg border border-yellow-500/20 bg-black p-[6px] select-none overflow-hidden ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
        >
          <div className="relative z-0 mx-auto w-[380px] h-[380px] md:w-[460px] md:h-[460px] rounded-full overflow-hidden">
            <div className="absolute inset-0 rounded-full bg-black border border-yellow-500/20" />
            <ComposableMap
              width={520}
              height={520}
              projection="geoOrthographic"
              projectionConfig={{ scale: 248, rotate: rotation }}
              style={{ width: "100%", height: "100%", position: "relative", zIndex: 1, display: "block", overflow: "hidden" }}
            >
              <Geographies geography={GEO_JSON_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const worldCountry = normalizeCountryKey(getWorldFeatureName(geo));
                    const userCount = usersByCountry.get(worldCountry) || 0;
                    const fill = getHeatColor(userCount, maxCountryUsers);

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        stroke="hsl(0 0% 8%)"
                        strokeWidth={0.55}
                        fill={fill}
                        style={{
                          default: { outline: "none" },
                          hover: { outline: "none", fill: "hsl(45 95% 55%)" },
                          pressed: { outline: "none" },
                        }}
                      >
                        <title>
                          {`${toDisplayCountry(worldCountry)}: ${userCount.toLocaleString()} users`}
                        </title>
                      </Geography>
                    );
                  })
                }
              </Geographies>
            </ComposableMap>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
          <p className="text-[11px] text-muted-foreground">Color scale: lighter green = lower users, darker green = higher users</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">Low</span>
            <div className="w-36 h-2 rounded-full bg-gradient-to-r from-[hsl(136_48%_70%)] to-[hsl(136_76%_22%)] border border-yellow-500/20" />
            <span className="text-[10px] text-muted-foreground">High</span>
          </div>
        </div>
      </Card>

      {/* Top Countries */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold text-foreground mb-4 text-xs">
            Total Users by Country (Top 10)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={normalizedCountries.slice(0, 10)}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
              <XAxis
                dataKey="country"
                stroke="hsl(0 0% 70%)"
                style={{ fontSize: "10px" }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="hsl(0 0% 70%)" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0 0% 8%)",
                  border: "1px solid hsl(0 0% 20%)",
                  borderRadius: "4px",
                  color: "#ffffff",
                }}
                itemStyle={{ color: "#ffffff" }}
                labelStyle={{ color: "#ffffff" }}
              />
              <Bar
                dataKey="totalUsers"
                fill="hsl(136 62% 42%)"
                name="Total Users"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Country Table */}
      <Card className="p-4">
        <h3 className="font-semibold text-foreground mb-4 text-xs">
          Detailed Country Statistics
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                  #
                </th>
                <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                  Country
                </th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                  Total Users
                </th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                  Active Users
                </th>
                <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                  Activity Rate
                </th>
                <th className="text-center py-3 px-2 font-medium text-muted-foreground">
                  % of Total
                </th>
              </tr>
            </thead>
            <tbody>
              {normalizedCountries.map((country, index) => {
                const percentage = ((country.totalUsers / totalUsers) * 100).toFixed(1);
                return (
                  <tr key={country.normalizedKey} className="border-b border-border hover:bg-card">
                    <td className="py-3 px-2 text-muted-foreground">
                      {index + 1}
                    </td>
                    <td className="py-3 px-2 text-foreground font-medium">
                      {country.country || "Unknown"}
                    </td>
                    <td className="py-3 px-2 text-right text-foreground">
                      {country.totalUsers.toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-right text-primary font-medium">
                      {country.activeUsers.toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-right text-foreground">
                      {country.activityPercentage.toFixed(1)}%
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-1.5 bg-secondary rounded overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-muted-foreground">{percentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
