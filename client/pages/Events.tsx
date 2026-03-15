import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

type EventItem = { id: number; email: string; company: string | null; industry: string | null; paymentCount: number; totalPayments: number; lastPaymentAt: string | null; eventsAttended: string; ticketTypes: string; createdAt: string; };
type EventStats = { totalRegistrations: number; uniqueIndustries: number; uniqueCompanies: number; registrationsWithPayments: number; totalRevenue: number; totalPaymentTransactions: number; uniqueEvents: number; avgPaymentAmount: number; byEvent: Array<{ eventName: string; ticketCount: number; revenue: number; }>; };

const glassCard = "p-6 bg-[#050505]/20 backdrop-blur-2xl border border-white/[0.08] shadow-2xl rounded-2xl";

export default function Events() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const load = async () => {
      try { setLoading(true); setError(null); const [eventsRes, statsRes] = await Promise.all([ fetch("/api/admin/events?limit=500"), fetch("/api/admin/events/stats") ]); if (!eventsRes.ok || !statsRes.ok) throw new Error("Failed to load events data"); const eventsJson = await eventsRes.json(); const statsJson = await statsRes.json(); setEvents(eventsJson.data || []); setStats(statsJson.data || null); } 
      catch (loadError) { setError("Failed to load events"); } finally { setLoading(false); }
    }; load();
  }, []);

  const filteredEvents = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return events.filter((event) => event.email.toLowerCase().includes(lower) || (event.company || "").toLowerCase().includes(lower) || (event.industry || "").toLowerCase().includes(lower));
  }, [events, searchTerm]);

  const paymentRate = stats?.totalRegistrations ? (stats.registrationsWithPayments / stats.totalRegistrations) * 100 : 0;

  return (
    <div className="space-y-8 p-4 md:p-8">
      <ScrollReveal direction="down">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Events Management</h1>
        <p className="text-sm text-zinc-400 mt-2 font-medium">Manage event registrations, track conversions, and monitor payment details for all organized events.</p>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <ScrollReveal direction="up" delay={0.1}>
          <Card className={glassCard}>
            <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Total Registrations</p>
            <p className="text-3xl font-black text-white mt-3">{stats?.totalRegistrations ?? 0}</p>
          </Card>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.2}>
          <Card className={glassCard}>
            <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Paid Registrations</p>
            <p className="text-3xl font-black text-white mt-3">{stats?.registrationsWithPayments ?? 0}</p>
            <p className="text-xs font-bold text-green-400 mt-2">{paymentRate.toFixed(1)}% paid tickets</p>
          </Card>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.3}>
          <Card className={`${glassCard} border-[#fbbf24]/30 bg-[#fbbf24]/5`}>
            <p className="text-[10px] font-extrabold text-[#fbbf24] uppercase tracking-widest">Total Revenue</p>
            <p className="text-3xl font-black text-[#fbbf24] mt-3">${Number(stats?.totalRevenue ?? 0).toFixed(2)}</p>
            <p className="text-xs font-bold text-zinc-400 mt-2">${Number(stats?.avgPaymentAmount ?? 0).toFixed(2)} avg</p>
          </Card>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.4}>
          <Card className={glassCard}>
            <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Events Organized</p>
            <p className="text-3xl font-black text-white mt-3">{stats?.uniqueEvents ?? 0}</p>
            <p className="text-xs font-bold text-zinc-400 mt-2">{stats?.totalPaymentTransactions ?? 0} tickets sold</p>
          </Card>
        </ScrollReveal>
      </div>

      <ScrollReveal direction="up" delay={0.5}>
        <Card className={glassCard}>
          <div className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-2 focus-within:ring-1 focus-within:ring-[#fbbf24]/50 transition-all">
            <Search className="w-5 h-5 text-zinc-500 flex-shrink-0" />
            <Input type="text" placeholder="Search by email, company, or industry..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="bg-transparent border-0 text-white text-sm focus-visible:ring-0 shadow-none px-0 placeholder:text-zinc-600" />
          </div>
        </Card>
      </ScrollReveal>

      <ScrollReveal direction="up" delay={0.6}>
        <Card className={`${glassCard} !p-0 overflow-hidden`}>
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#fbbf24]" /></div>
          ) : error ? (
            <div className="text-center py-16 text-red-400">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                    <th className="py-4 px-6 text-left text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Attendee Email</th>
                    <th className="py-4 px-6 text-left text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Company</th>
                    <th className="py-4 px-6 text-left text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Industry</th>
                    <th className="py-4 px-6 text-left text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Events Attended</th>
                    <th className="py-4 px-6 text-left text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Ticket Types</th>
                    <th className="py-4 px-6 text-right text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Payments</th>
                    <th className="py-4 px-6 text-right text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Total Paid</th>
                    <th className="py-4 px-6 text-left text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6 font-bold text-white">{event.email}</td>
                      <td className="py-4 px-6 text-zinc-400">{event.company || "Not provided"}</td>
                      <td className="py-4 px-6 text-zinc-400">{event.industry || "Not provided"}</td>
                      <td className="py-4 px-6">
                        {event.eventsAttended !== "No events" ? <span className="font-bold text-[#fbbf24]">{event.eventsAttended}</span> : <span className="text-zinc-600">No events yet</span>}
                      </td>
                      <td className="py-4 px-6 text-zinc-300 font-medium">{event.ticketTypes !== "No tickets" ? event.ticketTypes : "-"}</td>
                      <td className="py-4 px-6 text-right font-bold text-zinc-300">{event.paymentCount}</td>
                      <td className="py-4 px-6 text-right font-black text-[#fbbf24]">${Number(event.totalPayments).toFixed(2)}</td>
                      <td className="py-4 px-6 text-zinc-400 font-medium">{new Date(event.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </ScrollReveal>
    </div>
  );
}