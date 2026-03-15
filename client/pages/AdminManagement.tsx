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
    <div className="space-y-8 p-4 md:p-8">
      <ScrollReveal direction="down" className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Management</h1>
          <p className="text-sm text-zinc-400 mt-2 font-medium">Manage internal admin access, roles, and permissions.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#fbbf24] text-black hover:bg-[#fbbf24]/90 font-bold rounded-xl shadow-[0_0_15px_rgba(251,191,36,0.2)]">
              <Plus className="w-5 h-5 mr-2" /> Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#09090b]/95 backdrop-blur-3xl border border-white/[0.1] rounded-3xl shadow-2xl text-white">
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

      <ScrollReveal direction="up" delay={0.2}>
        <Card className={`${glassCard} !p-0 overflow-hidden`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02] text-left">
                <th className="py-4 px-6 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Admin</th>
                <th className="py-4 px-6 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Email</th>
                <th className="py-4 px-6 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Role</th>
                <th className="py-4 px-6 text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Permissions</th>
                <th className="py-4 px-6 text-center text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="py-10 text-center text-zinc-500">Loading admins…</td></tr>}
              {!loading && error && <tr><td colSpan={5} className="py-10 text-center text-red-400">{error}</td></tr>}
              {!loading && admins.map((admin) => (
                <tr key={admin.id} className="border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-6 font-bold text-white">{admin.name}</td>
                  <td className="py-4 px-6 text-zinc-400">{admin.email}</td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/20">
                      {admin.role === "super_admin" ? "Super Admin" : "Admin"}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-xs text-zinc-300">{admin.permissions.join(", ")}</td>
                  <td className="py-4 px-6 text-center">
                    {admin.role !== "super_admin" && (
                      <Button size="icon" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg" onClick={() => removeAdmin(admin.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </ScrollReveal>
    </div>
  );
}