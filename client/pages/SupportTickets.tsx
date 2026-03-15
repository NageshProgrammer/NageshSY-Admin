import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

type Ticket = { id: string; source: "demo_request" | "contact_enquiry"; email: string; company: string | null; industry: string | null; createdAt: string; status: string; };
type SupportResponse = { summary: { demoRequests: number; contactEnquiries: number; totalTickets: number; }; tickets: Ticket[]; };

const STATUSES = ["open", "in_progress", "resolved", "closed"];
const glassCard = "p-6 bg-[#050505]/20 backdrop-blur-2xl border border-white/[0.08] shadow-2xl rounded-2xl";

export default function SupportTickets() {
  const [payload, setPayload] = useState<SupportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try { setLoading(true); setError(null); const res = await fetch("/api/admin/support/tickets"); if (!res.ok) throw new Error("Failed to load support tickets"); const json = await res.json(); setPayload(json.data || null); } 
    catch (loadError) { setError("Failed to load support tickets"); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const sortedTickets = useMemo(() => [...(payload?.tickets || [])].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)), [payload]);

  const updateStatus = async (ticket: Ticket, status: string) => {
    await fetch(`/api/admin/support/tickets/${ticket.id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, source: ticket.source }) });
    await load();
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-[#fbbf24]" /></div>;
  if (error || !payload) return <div className="p-8 text-red-500 text-sm font-bold text-center">{error || "No support data available"}</div>;

  return (
    <div className="space-y-8 p-4 md:p-8">
      <ScrollReveal direction="down">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Support & Tickets</h1>
        <p className="text-sm text-zinc-400 mt-2 font-medium">Manage demo requests and contact form enquiries from one queue.</p>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ScrollReveal direction="up" delay={0.1}>
          <Card className={glassCard}>
            <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Demo Requests</p>
            <p className="text-3xl font-black text-[#fbbf24] mt-3">{payload.summary.demoRequests}</p>
          </Card>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.2}>
          <Card className={glassCard}>
            <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Contact Enquiries</p>
            <p className="text-3xl font-black text-white mt-3">{payload.summary.contactEnquiries}</p>
          </Card>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.3}>
          <Card className={glassCard}>
            <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Total Tickets</p>
            <p className="text-3xl font-black text-white mt-3">{payload.summary.totalTickets}</p>
          </Card>
        </ScrollReveal>
      </div>

      <ScrollReveal direction="up" delay={0.4}>
        <Card className={`${glassCard} !p-0 overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                  <th className="py-4 px-6 text-left text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Source</th>
                  <th className="py-4 px-6 text-left text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Email</th>
                  <th className="py-4 px-6 text-left text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Company</th>
                  <th className="py-4 px-6 text-left text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Industry</th>
                  <th className="py-4 px-6 text-left text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Created</th>
                  <th className="py-4 px-6 text-left text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-white/[0.05] border border-white/[0.1] text-white">
                        {ticket.source === "demo_request" ? "Demo" : "Contact"}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-white">{ticket.email}</td>
                    <td className="py-4 px-6 text-zinc-400 font-medium">{ticket.company || "-"}</td>
                    <td className="py-4 px-6 text-zinc-400 font-medium">{ticket.industry || "-"}</td>
                    <td className="py-4 px-6 text-zinc-400 font-medium">{new Date(ticket.createdAt).toLocaleString()}</td>
                    <td className="py-4 px-6">
                      <Select value={ticket.status} onValueChange={(status) => updateStatus(ticket, status)}>
                        <SelectTrigger className="h-10 text-xs w-[140px] bg-white/[0.02] border-white/[0.08] text-white rounded-xl font-bold uppercase tracking-wider">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-white/[0.1] text-white rounded-xl">
                          {STATUSES.map((status) => (
                            <SelectItem key={status} value={status} className="font-bold uppercase tracking-wider text-xs">
                              {status.replace("_", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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