import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, UserRoundSearch, ShieldBan, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

type UserStatus = "paid" | "trial" | "suspended";
type UserRow = { id: string; name: string; email: string; status: UserStatus; trialDaysLeft: number | null; signupDate: string; plan: string; keywordsUsed: number; conversationsDetected: number; leadsGenerated: number; lastLogin: string; creditsLeft?: number; };
type UserDetails = { id: string; name: string; email: string; signupDate?: string; creditsLeft?: number; renewalDate?: string | null; plan: string; status: UserStatus; trialDaysLeft: number; onboardingCompleted?: boolean; onboardingStep?: number; onboardingStartedAt?: string; company?: { name?: string; industry?: string; website?: string; businessEmail?: string; phoneNumber?: string; productDescription?: string; }; target?: { country?: string; audience?: string; stateCity?: string; businessType?: string; }; platforms?: Record<string, boolean>; keywords?: string[]; conversationsDetected: number; leadsGenerated: number; lastLogin: string; generatedPosts?: Array<{ platform: string; title: string; url?: string | null; createdAt: string }>; generatedLeads?: Array<{ type: string; email: string; eventName?: string | null; amountPaid?: number | null; createdAt: string; }>; loginLogs?: Array<{ success: boolean; ipAddress?: string | null; userAgent?: string | null; createdAt: string; }>; activityLog?: Array<{ actionType: string; description: string; createdAt: string }>; };

const glassCard = "p-6 bg-[#050505]/40 backdrop-blur-2xl border border-white/[0.08] shadow-2xl rounded-2xl";

export default function Users() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | UserStatus>("all");
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const loadUsers = async () => {
    try { setLoading(true); const res = await fetch("/api/admin/users"); const json = await res.json(); setUsers(json.data || []); } 
    catch { setUsers([]); } finally { setLoading(false); }
  };

  useEffect(() => { loadUsers(); }, []);

  const viewUser = async (userId: string) => {
    setDialogOpen(true); setSelectedUser(null); setDetailsLoading(true); setDetailsError(null);
    try {
      const [userRes] = await Promise.all([ fetch(`/api/admin/users/${userId}`) ]);
      if (!userRes.ok) throw new Error("Failed to load user profile details");
      const userJson = await userRes.json();
      setSelectedUser(userJson.data || null);
      if (!userJson.data) setDetailsError("No user details found for this account.");
    } catch (error) { setDetailsError(error instanceof Error ? error.message : "Failed to load user details"); } 
    finally { setDetailsLoading(false); }
  };

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      const matchesSearch = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchesFilter = filter === "all" || u.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [users, search, filter]);

  const toggleSuspendUser = async (userId: string, currentlySuspended: boolean) => {
    await fetch(`/api/admin/users/${userId}/suspend`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ suspended: !currentlySuspended }) });
    await loadUsers(); if (selectedUser?.id === userId) await viewUser(userId);
  };

  return (
    <div className="space-y-8 p-4 md:p-8 bg-black/20 rounded-3xl">
      <ScrollReveal direction="down">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">User Management</h1>
        <p className="text-sm text-zinc-400 mt-2 font-medium">
          View, search, suspend, delete, and manage plan/activity for all users.
        </p>
      </ScrollReveal>

      {/* --- Filter / Search Card --- */}
      <ScrollReveal direction="up" delay={0.1}>
        <Card className={glassCard}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex items-center gap-3 bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-2 focus-within:border-[#fbbf24]/50 transition-all">
              <Search className="w-5 h-5 text-zinc-500 flex-shrink-0" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-0 bg-transparent text-sm text-white placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-0 outline-none"
              />
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
              <SelectTrigger className="w-full md:w-48 text-sm h-12 bg-white/[0.02] border-white/[0.08] text-white rounded-xl focus:ring-0 focus:ring-offset-0 focus:border-[#fbbf24]/50 transition-colors outline-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-white/[0.1] text-white rounded-xl">
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
      </ScrollReveal>

      {/* --- Users Table Card --- */}
      <ScrollReveal direction="up" delay={0.2}>
        <Card className={`${glassCard} !p-0 md:overflow-hidden bg-transparent md:bg-[#050505]/40`}>
          <div className="md:overflow-x-auto">
            
            <table className="w-full text-sm block md:table">
              
              {/* Header (Hidden on Mobile) */}
              <thead className="hidden md:table-header-group">
                <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                  <th className="py-5 px-6 text-left text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest whitespace-nowrap">User Info</th>
                  <th className="py-5 px-6 text-left text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Plan</th>
                  <th className="py-5 px-6 text-center text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Keywords</th>
                  <th className="py-5 px-6 text-center text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Convs</th>
                  <th className="py-5 px-6 text-center text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Leads</th>
                  <th className="py-5 px-6 text-center text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Status</th>
                  <th className="py-5 px-6 text-right text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Actions</th>
                </tr>
              </thead>

              <tbody className="block md:table-row-group">
                {loading && (
                  <tr className="block md:table-row"><td colSpan={8} className="py-16 text-center text-zinc-500 block md:table-cell"><Loader2 className="w-8 h-8 animate-spin inline mr-3 text-[#fbbf24]" /> Loading user database...</td></tr>
                )}
                {!loading && filteredUsers.length === 0 && (
                  <tr className="block md:table-row"><td colSpan={8} className="py-16 text-center text-zinc-500 font-medium block md:table-cell">No users found matching your criteria.</td></tr>
                )}
                {!loading && filteredUsers.map((u) => {
                  const isSuspended = u.status === "suspended";
                  return (
                    // Responsive Row: Card on mobile, standard row on desktop
                    <tr key={u.id} className="block md:table-row bg-white/[0.02] md:bg-transparent border border-white/[0.05] md:border-0 md:border-b md:border-white/[0.05] rounded-2xl md:rounded-none mb-6 md:mb-0 p-5 md:p-0 hover:bg-white/[0.04] md:hover:bg-white/[0.02] transition-colors group">
                      
                      {/* User Info Stack */}
                      <td className="flex justify-between items-center md:table-cell py-2 md:py-4 px-0 md:px-6 border-b border-white/[0.05] md:border-0">
                        <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">User Info</span>
                        <div className="flex flex-col text-right md:text-left">
                          <span className="font-bold text-white text-sm">{u.name || "Unknown User"}</span>
                          <span className="text-zinc-500 text-xs mt-0.5">{u.email}</span>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="flex justify-between items-center md:table-cell py-3 md:py-4 px-0 md:px-6 border-b border-white/[0.05] md:border-0">
                        <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Plan</span>
                        <span className="text-zinc-300 font-medium">{u.plan}</span>
                      </td>

                      {/* Keywords */}
                      <td className="flex justify-between items-center md:table-cell py-3 md:py-4 px-0 md:px-6 border-b border-white/[0.05] md:border-0">
                        <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Keywords</span>
                        <span className="text-zinc-400 font-mono md:text-center block">{u.keywordsUsed}</span>
                      </td>

                      {/* Convs */}
                      <td className="flex justify-between items-center md:table-cell py-3 md:py-4 px-0 md:px-6 border-b border-white/[0.05] md:border-0">
                        <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Convs</span>
                        <span className="text-zinc-400 font-mono md:text-center block">{u.conversationsDetected}</span>
                      </td>

                      {/* Leads */}
                      <td className="flex justify-between items-center md:table-cell py-3 md:py-4 px-0 md:px-6 border-b border-white/[0.05] md:border-0">
                        <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Leads</span>
                        <span className="text-zinc-400 font-mono md:text-center block">{u.leadsGenerated}</span>
                      </td>
                      
                      {/* Status */}
                      <td className="flex justify-between items-center md:table-cell py-3 md:py-4 px-0 md:px-6 border-b border-white/[0.05] md:border-0">
                        <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Status</span>
                        <div className="md:text-center">
                          <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${
                            u.status === "paid" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                            u.status === "trial" ? "bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/20" :
                            "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}>
                            {u.status}
                          </span>
                        </div>
                      </td>
                      
                      {/* Actions */}
                      <td className="flex justify-between items-center md:table-cell pt-5 pb-1 md:py-4 px-0 md:px-6">
                        <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Actions</span>
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="bg-white/[0.03] border-white/[0.1] hover:bg-white/[0.1] text-white hover:text-white transition-all h-8 rounded-lg" 
                            onClick={() => viewUser(u.id)}
                          >
                            <UserRoundSearch className="w-3.5 h-3.5 md:mr-2" />
                            <span className="hidden md:inline">View</span>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => toggleSuspendUser(u.id, isSuspended)} 
                            className={`border-white/[0.1] transition-all h-8 rounded-lg ${
                              isSuspended 
                                ? "bg-green-500/10 hover:bg-green-500/20 text-green-400 hover:text-green-300 border-green-500/20" 
                                : "bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border-red-500/20"
                            }`}
                          >
                            {isSuspended ? <ShieldCheck className="w-3.5 h-3.5 md:mr-2" /> : <ShieldBan className="w-3.5 h-3.5 md:mr-2" />}
                            <span className="hidden md:inline">{isSuspended ? "Unsuspend" : "Suspend"}</span>
                          </Button>
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

      {/* --- User Details Dialog --- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-[#09090b]/95 backdrop-blur-3xl border-white/[0.1] shadow-2xl rounded-3xl custom-scrollbar text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">User Profile</DialogTitle>
            <DialogDescription className="text-zinc-400">Account profile, plan controls, and activity metrics.</DialogDescription>
          </DialogHeader>

          {detailsLoading && <div className="py-12 text-center text-zinc-400"><Loader2 className="w-6 h-6 animate-spin inline mr-2 text-[#fbbf24]" /> Loading details...</div>}
          {!detailsLoading && detailsError && <div className="py-12 text-center text-red-400">{detailsError}</div>}
          
          {/* Detail Block */}
          {!detailsLoading && !detailsError && selectedUser && (
             <div className="space-y-6 text-sm text-zinc-300 p-4">
                <p>User details successfully loaded for {selectedUser.email}</p>
                {/* [Keep your massive detail block logic here] */}
             </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}