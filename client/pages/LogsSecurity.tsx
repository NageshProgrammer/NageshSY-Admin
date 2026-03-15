import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, ShieldCheck, Activity, KeyRound } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

type LoginLog = { id: number; email: string; success: boolean; ipAddress: string; userAgent: string; createdAt: string; };
type CreditUsage = { totalUsers: number; currentCredits: number; estimatedDistributed: number; estimatedUsed: number; avgCreditsPerUser: number; lowCreditUsers: number; activeRevenue: number; users: Array<{ id: string; name: string; email: string; credits: number }>; };

const glassCard = "p-6 bg-[#050505]/20 backdrop-blur-2xl border border-white/[0.08] shadow-2xl rounded-2xl";

export default function LogsSecurity() {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [credits, setCredits] = useState<CreditUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try { 
        setLoading(true); 
        setError(null); 
        const [logRes, creditRes] = await Promise.all([ 
          fetch("/api/admin/security/login-logs?limit=100"), 
          fetch("/api/admin/security/credit-usage") 
        ]); 
        if (!logRes.ok || !creditRes.ok) throw new Error(); 
        const logJson = await logRes.json(); 
        const creditJson = await creditRes.json(); 
        setLogs(logJson.data || []); 
        setCredits(creditJson.data || null); 
      } 
      catch (loadError) { setError("Failed to load logs & security data"); } 
      finally { setLoading(false); }
    }; 
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-[#fbbf24]" /></div>;
  if (error || !credits) return <div className="p-8 text-red-400 text-sm text-center">{error || "No security data available"}</div>;

  return (
    <div className="space-y-8 p-4 md:p-8">
      <ScrollReveal direction="down">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-emerald-400" /> Logs & Security
        </h1>
        <p className="text-sm text-zinc-400 mt-2 font-medium">Track admin login logs and monitor platform-wide credit usage.</p>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ScrollReveal direction="up" delay={0.1}>
          <Card className={glassCard}>
            <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Estimated Credits Distributed</p>
            <p className="text-3xl font-black text-white mt-3">{credits.estimatedDistributed.toLocaleString()}</p>
          </Card>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.2}>
          <Card className={glassCard}>
            <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Estimated Credits Used</p>
            <p className="text-3xl font-black text-white mt-3">{credits.estimatedUsed.toLocaleString()}</p>
          </Card>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.3}>
          <Card className={`${glassCard} border-red-500/20 bg-red-500/5`}>
            <p className="text-[10px] font-extrabold text-red-400 uppercase tracking-widest">Low Credit Users</p>
            <p className="text-3xl font-black text-red-400 mt-3">{credits.lowCreditUsers}</p>
          </Card>
        </ScrollReveal>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <ScrollReveal direction="up" delay={0.4}>
          <Card className={glassCard}>
            <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><Activity className="w-4 h-4 text-[#fbbf24]" /> Credit Usage Breakdown</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <p className="text-xs text-zinc-500 mb-1">Total Users</p>
                <p className="text-lg font-bold text-white">{credits.totalUsers}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <p className="text-xs text-zinc-500 mb-1">Current Credits</p>
                <p className="text-lg font-bold text-white">{credits.currentCredits.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                <p className="text-xs text-zinc-500 mb-1">Avg Credits/User</p>
                <p className="text-lg font-bold text-white">{credits.avgCreditsPerUser.toFixed(2)}</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-xs text-emerald-400 mb-1">Active Revenue</p>
                <p className="text-lg font-bold text-emerald-400">${credits.activeRevenue.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.5}>
          <Card className={`${glassCard} !p-0 overflow-hidden`}>
            <div className="p-6 border-b border-white/[0.05]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><KeyRound className="w-4 h-4 text-red-400" /> Users with Lowest Credits</h3>
            </div>
            
            <div className="overflow-auto max-h-[300px] custom-scrollbar">
              <table className="w-full text-xs">
                <thead className="sticky top-0 z-10 bg-[#09090b]">
                  <tr className="border-b border-white/[0.05]">
                    <th className="text-left py-3 px-6 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Name</th>
                    <th className="text-left py-3 px-6 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Email</th>
                    <th className="text-right py-3 px-6 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {credits.users.map((user) => (
                    <tr key={user.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6 text-white font-bold">{user.name}</td>
                      <td className="py-4 px-6 text-zinc-400">{user.email}</td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-red-400">{user.credits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </ScrollReveal>
      </div>

      <ScrollReveal direction="up" delay={0.6}>
        <Card className={`${glassCard} !p-0 overflow-hidden`}>
          <div className="p-6 border-b border-white/[0.05]">
             <h3 className="text-sm font-bold text-white flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Admin Login Logs</h3>
          </div>
          <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-[#09090b]">
                <tr className="border-b border-white/[0.05]">
                  <th className="text-left py-4 px-6 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Time</th>
                  <th className="text-left py-4 px-6 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Email</th>
                  <th className="text-left py-4 px-6 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">IP Address</th>
                  <th className="text-left py-4 px-6 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6 text-zinc-400 font-mono text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="py-4 px-6 text-white font-bold">{log.email || "unknown"}</td>
                    <td className="py-4 px-6 text-zinc-500 font-mono text-xs">{log.ipAddress || "unknown"}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${
                        log.success ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                        {log.success ? "Success" : "Failed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </ScrollReveal>
    </div>
  );
}