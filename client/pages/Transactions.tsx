import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Loader2 } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const glassCard = "p-6 bg-[#050505]/20 backdrop-blur-2xl border border-white/[0.08] shadow-2xl rounded-2xl";

export default function Transactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      try { setLoading(true); const res = await fetch("/api/admin/transactions"); const data = await res.json(); setTransactions(data.data?.transactions || []); } 
      catch (err) { setTransactions([]); } finally { setLoading(false); }
    };
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter((txn) => {
    const matchesStatus = filterStatus === "all" || txn.status === filterStatus;
    const matchesSearch = txn.id?.toLowerCase().includes(searchTerm.toLowerCase()) || txn.user?.toLowerCase().includes(searchTerm.toLowerCase()) || txn.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalAmount = filteredTransactions.reduce((sum, txn) => (txn.status === "ACTIVE" ? sum + Number(txn.amount) : sum), 0);
  const completedCount = filteredTransactions.filter((t) => t.status === "ACTIVE").length;

  return (
    <div className="space-y-8 p-4 md:p-8 bg-black/20 rounded-3xl">
      <ScrollReveal direction="down">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Transactions</h1>
        <p className="text-sm text-zinc-400 mt-2 font-medium">View and manage all payment transactions.</p>
      </ScrollReveal>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ScrollReveal direction="up" delay={0.1}>
          <Card className={glassCard}>
            <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Total Transactions</p>
            <p className="text-3xl font-black text-white mt-3">{filteredTransactions.length}</p>
          </Card>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.2}>
          <Card className={glassCard}>
            <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Active Subscriptions</p>
            <p className="text-3xl font-black text-white mt-3">{completedCount}</p>
          </Card>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.3}>
          <Card className={`${glassCard} border-[#fbbf24]/30 bg-[#fbbf24]/5`}>
            <p className="text-[10px] font-extrabold text-[#fbbf24] uppercase tracking-widest">Total Revenue</p>
            <p className="text-3xl font-black text-[#fbbf24] mt-3">${totalAmount.toLocaleString()}</p>
          </Card>
        </ScrollReveal>
      </div>

      {/* Filters */}
      <ScrollReveal direction="up" delay={0.4}>
        <Card className={glassCard}>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1 flex items-center gap-3 bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-2 focus-within:border-[#fbbf24]/50 transition-all w-full md:w-auto">
              <Search className="w-5 h-5 text-zinc-500 flex-shrink-0" />
              <Input placeholder="Search by ID, name, or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-0 text-white text-sm focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none px-0 outline-none placeholder:text-zinc-600" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48 h-12 text-sm bg-white/[0.02] border-white/[0.08] text-white rounded-xl focus:ring-0 focus:ring-offset-0 focus:border-[#fbbf24]/50 transition-colors outline-none">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-white/[0.1] text-white rounded-xl">
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="w-full md:w-auto h-12 bg-white/[0.03] border-white/[0.1] text-white hover:bg-white/[0.1] rounded-xl px-6 font-bold">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>
        </Card>
      </ScrollReveal>

      {/* Responsive Table */}
      <ScrollReveal direction="up" delay={0.5}>
        <Card className={`${glassCard} !p-0 bg-transparent md:bg-[#050505]/20 md:overflow-hidden border-0 md:border md:border-white/[0.08] shadow-none md:shadow-2xl`}>
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-[#fbbf24]" /></div>
          ) : (
            <div className="md:overflow-x-auto">
              <table className="w-full text-sm block md:table">
                
                <thead className="hidden md:table-header-group">
                  <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                    <th className="py-5 px-6 text-left text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Transaction ID</th>
                    <th className="py-5 px-6 text-left text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest whitespace-nowrap">User</th>
                    <th className="py-5 px-6 text-left text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Email</th>
                    <th className="py-5 px-6 text-left text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Plan</th>
                    <th className="py-5 px-6 text-right text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Amount</th>
                    <th className="py-5 px-6 text-left text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Source</th>
                    <th className="py-5 px-6 text-left text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Date</th>
                    <th className="py-5 px-6 text-right text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Status</th>
                  </tr>
                </thead>

                <tbody className="block md:table-row-group">
                  {filteredTransactions.length === 0 && (
                    <tr className="block md:table-row"><td colSpan={8} className="py-16 text-center text-zinc-500 font-medium block md:table-cell">No transactions found.</td></tr>
                  )}
                  {filteredTransactions.map((txn) => (
                    <tr key={txn.id} className="block md:table-row bg-white/[0.02] md:bg-transparent border border-white/[0.05] md:border-0 md:border-b md:border-white/[0.05] rounded-2xl md:rounded-none mb-4 md:mb-0 p-5 md:p-0 hover:bg-white/[0.04] md:hover:bg-white/[0.02] transition-colors group">
                      
                      <td className="flex justify-between items-center md:table-cell py-2 md:py-4 px-0 md:px-6 border-b border-white/[0.05] md:border-0">
                        <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Transaction ID</span>
                        <span className="font-mono text-zinc-400 text-right md:text-left">{txn.id.substring(0, 8)}...</span>
                      </td>

                      <td className="flex justify-between items-center md:table-cell py-3 md:py-4 px-0 md:px-6 border-b border-white/[0.05] md:border-0">
                        <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest shrink-0">User</span>
                        <span className="text-white font-bold text-right md:text-left truncate ml-4 md:ml-0">{txn.user}</span>
                      </td>

                      <td className="flex justify-between items-center md:table-cell py-3 md:py-4 px-0 md:px-6 border-b border-white/[0.05] md:border-0">
                        <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest shrink-0">Email</span>
                        <span className="text-zinc-400 text-right md:text-left truncate ml-4 md:ml-0">{txn.email}</span>
                      </td>

                      <td className="flex justify-between items-center md:table-cell py-3 md:py-4 px-0 md:px-6 border-b border-white/[0.05] md:border-0">
                        <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Plan</span>
                        <span className="text-zinc-300 font-medium text-right md:text-left">{txn.plan}</span>
                      </td>

                      <td className="flex justify-between items-center md:table-cell py-3 md:py-4 px-0 md:px-6 border-b border-white/[0.05] md:border-0">
                        <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Amount</span>
                        <span className="text-[#fbbf24] font-black md:text-right text-right">${Number(txn.amount).toFixed(2)}</span>
                      </td>

                      <td className="flex justify-between items-center md:table-cell py-3 md:py-4 px-0 md:px-6 border-b border-white/[0.05] md:border-0">
                        <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Source</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border text-right md:text-left ${
                          txn.subscriptionSource === 'Converted from Trial' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          txn.subscriptionSource === 'Active Trial' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                        }`}>{txn.subscriptionSource || 'Direct'}</span>
                      </td>

                      <td className="flex justify-between items-center md:table-cell py-3 md:py-4 px-0 md:px-6 border-b border-white/[0.05] md:border-0">
                        <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Date</span>
                        <span className="text-zinc-400 font-medium text-right md:text-left">{new Date(txn.date).toLocaleDateString()}</span>
                      </td>

                      <td className="flex justify-between items-center md:table-cell pt-4 pb-1 md:py-4 px-0 md:px-6">
                        <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Status</span>
                        <div className="md:text-right text-right">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                            txn.status === "ACTIVE" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                            txn.status === "CANCELLED" ? "bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}>{txn.status}</span>
                        </div>
                      </td>

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