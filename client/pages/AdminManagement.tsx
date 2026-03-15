import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

type AdminRole = "super_admin" | "admin";
type Admin = { id: string; name: string; email: string; role: AdminRole; permissions: string[]; createdAt: string; };
type ApiResponse<T> = { success: boolean; data: T; };

const ALL_PERMISSIONS = [
  { id: "manage_users", label: "Manage Users" }, { id: "manage_admins", label: "Manage Admins" },
  { id: "view_analytics", label: "View Analytics" }, { id: "manage_payments", label: "Manage Payments" },
  { id: "system_settings", label: "System Settings" },
];

const glassCard = "p-6 bg-[#050505]/20 backdrop-blur-2xl border border-white/[0.08] shadow-2xl rounded-2xl";

export default function AdminManagement() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);

  const loadAdmins = async () => {
    try { setLoading(true); setError(null); const res = await fetch("/api/admin/admins"); const json: ApiResponse<Admin[]> = await res.json(); setAdmins(json.data); } 
    catch { setError("Failed to load admins"); } finally { setLoading(false); }
  };

  useEffect(() => { loadAdmins(); }, []);

  const addAdmin = async () => {
    await fetch("/api/admin/admins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, permissions }) });
    setDialogOpen(false); setName(""); setEmail(""); setPermissions([]); loadAdmins();
  };

  const removeAdmin = async (id: string) => {
    await fetch(`/api/admin/admins/${id}`, { method: "DELETE" }); loadAdmins();
  };

  return (
    <div className="space-y-8 p-4 md:p-8 bg-black/20 rounded-3xl">
      {/* Header Section */}
      <ScrollReveal direction="down" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Management</h1>
          <p className="text-sm text-zinc-400 mt-2 font-medium">Manage internal admin access, roles, and permissions.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#fbbf24] text-black hover:bg-[#fbbf24]/90 font-bold rounded-xl shadow-[0_0_15px_rgba(251,191,36,0.2)] w-full sm:w-auto">
              <Plus className="w-5 h-5 mr-2" /> Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#09090b]/95 backdrop-blur-3xl border border-white/[0.1] rounded-3xl shadow-2xl text-white w-[95vw] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">Add Admin</DialogTitle>
              <DialogDescription className="text-zinc-400">Grant admin access with specific permissions.</DialogDescription>
            </DialogHeader>
            <div className="space-y-5 mt-4">
              <div className="space-y-2"><Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Name</Label><Input className="bg-white/[0.02] border-white/[0.08] text-white focus-visible:ring-[#fbbf24]/50 h-12 rounded-xl" value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Email</Label><Input type="email" className="bg-white/[0.02] border-white/[0.08] text-white focus-visible:ring-[#fbbf24]/50 h-12 rounded-xl" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div>
                <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Permissions</Label>
                <div className="mt-3 space-y-3">
                  {ALL_PERMISSIONS.map((p) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <Checkbox checked={permissions.includes(p.id)} onCheckedChange={(checked) => { setPermissions( checked ? [...permissions, p.id] : permissions.filter((x) => x !== p.id)); }} className="border-white/[0.2] data-[state=checked]:bg-[#fbbf24] data-[state=checked]:text-black" />
                      <span className="text-sm font-medium text-zinc-300">{p.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button className="w-full h-12 mt-4 bg-[#fbbf24] text-black font-bold rounded-xl hover:bg-[#fbbf24]/90" disabled={!name || !email} onClick={addAdmin}>Create Admin</Button>
            </div>
          </DialogContent>
        </Dialog>
      </ScrollReveal>

      {/* Table Section */}
      <ScrollReveal direction="up" delay={0.2}>
        <Card className={`${glassCard} !p-0 bg-transparent md:bg-[#050505]/20 md:overflow-hidden border-0 md:border md:border-white/[0.08] shadow-none md:shadow-2xl`}>
          <div className="md:overflow-x-auto">
            <table className="w-full text-sm block md:table">
              
              {/* Desktop Header */}
              <thead className="hidden md:table-header-group">
                <tr className="border-b border-white/[0.08] bg-white/[0.02] text-left">
                  <th className="py-5 px-6 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Admin</th>
                  <th className="py-5 px-6 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Email</th>
                  <th className="py-5 px-6 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Role</th>
                  <th className="py-5 px-6 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Permissions</th>
                  <th className="py-5 px-6 text-center text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Action</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="block md:table-row-group">
                {loading && <tr className="block md:table-row"><td colSpan={5} className="block md:table-cell py-10 text-center text-zinc-500">Loading admins…</td></tr>}
                {!loading && error && <tr className="block md:table-row"><td colSpan={5} className="block md:table-cell py-10 text-center text-red-400">{error}</td></tr>}
                
                {!loading && admins.map((admin) => (
                  <tr key={admin.id} className="block md:table-row bg-white/[0.02] md:bg-transparent border border-white/[0.05] md:border-0 md:border-b md:border-white/[0.05] rounded-2xl md:rounded-none mb-4 md:mb-0 p-5 md:p-0 hover:bg-white/[0.04] md:hover:bg-white/[0.02] transition-colors group">
                    
                    {/* Name */}
                    <td className="flex justify-between items-center md:table-cell py-2 md:py-4 px-0 md:px-6 border-b border-white/[0.05] md:border-0">
                      <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Admin</span>
                      <span className="font-bold text-white text-right md:text-left">{admin.name}</span>
                    </td>

                    {/* Email */}
                    <td className="flex justify-between items-center md:table-cell py-3 md:py-4 px-0 md:px-6 border-b border-white/[0.05] md:border-0">
                      <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest shrink-0">Email</span>
                      <span className="text-zinc-400 text-right md:text-left truncate ml-4 md:ml-0">{admin.email}</span>
                    </td>

                    {/* Role */}
                    <td className="flex justify-between items-center md:table-cell py-3 md:py-4 px-0 md:px-6 border-b border-white/[0.05] md:border-0">
                      <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Role</span>
                      <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/20">
                        {admin.role === "super_admin" ? "Super Admin" : "Admin"}
                      </span>
                    </td>

                    {/* Permissions */}
                    <td className="flex flex-col sm:flex-row justify-between sm:items-center md:table-cell py-3 md:py-4 px-0 md:px-6 border-b border-white/[0.05] md:border-0 gap-2">
                      <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest shrink-0">Permissions</span>
                      <span className="text-xs text-zinc-300 sm:text-right md:text-left">{admin.permissions.join(", ")}</span>
                    </td>

                    {/* Action */}
                    <td className="flex justify-between items-center md:table-cell pt-4 pb-1 md:py-4 px-0 md:px-6 md:text-center">
                      <span className="md:hidden text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Action</span>
                      <div className="flex justify-end md:justify-center">
                        {admin.role !== "super_admin" && (
                          <Button size="icon" variant="ghost" className="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg h-9 w-9 transition-colors" onClick={() => removeAdmin(admin.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
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