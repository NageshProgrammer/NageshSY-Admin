import { useNavigate } from "react-router-dom";
import { LogOut, Settings, User, ShieldAlert, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type AdminUser = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};

export default function Header() {
  const navigate = useNavigate();

  let admin: AdminUser | null = null;
  try {
    const storedAdmin = localStorage.getItem("admin_user");
    if (storedAdmin) admin = JSON.parse(storedAdmin);
  } catch (e) {
    console.error("Failed to parse admin user");
  }

  const handleLogout = () => {
    localStorage.removeItem("admin_logged_in");
    localStorage.removeItem("admin_user");
    navigate("/login");
  };

  const getInitials = (email?: string) => {
    if (!email) return "AD";
    return email
      .split("@")[0]
      .split(".")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-[120] isolate w-full border-b border-white/[0.05] bg-black/40 backdrop-blur-2xl shadow-sm">
      <div className="relative z-10 flex items-center justify-between px-4 md:px-6 py-3">
        
        {/* Left: Menu Toggle, Branding & Admin Badge */}
        <div className="flex items-center gap-3">
          {/* ✅ FIX: Removed lg:hidden so this button appears on laptop too */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-zinc-400 hover:text-white hover:bg-white/[0.1] transition-colors rounded-xl"
            onClick={() => window.dispatchEvent(new Event('toggleSidebar'))}
          >
            <Menu className="w-6 h-6" />
          </Button>

          <div className="hidden sm:flex w-9 h-9 rounded-xl bg-[#fbbf24]/10 border border-[#fbbf24]/20 items-center justify-center shadow-[inset_0_1px_0_0_rgba(251,191,36,0.2)]">
            <ShieldAlert className="w-5 h-5 text-[#fbbf24]" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-extrabold text-white text-lg leading-tight tracking-tight">
              Lead<span className="text-[#fbbf24]">Equator</span>
            </h1>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">
              Admin Portal
            </span>
          </div>
        </div>

        {/* Right: Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="rounded-full w-10 h-10 p-0 ring-2 ring-transparent focus-visible:ring-[#fbbf24]/50 transition-all hover:opacity-80">
              <Avatar className="w-10 h-10 border border-white/[0.1] shadow-lg">
                <AvatarImage src="https://avatar.vercel.sh/admin" alt="Admin" />
                <AvatarFallback className="bg-zinc-800 text-zinc-200 font-bold">
                  {getInitials(admin?.email)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-64 bg-[#09090b]/95 backdrop-blur-3xl border border-white/[0.1] rounded-[1.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] p-2">
            <div className="flex items-center gap-3 px-3 py-3 bg-white/[0.02] rounded-xl border border-white/[0.05] mb-2">
              <Avatar className="w-10 h-10 border border-white/[0.1]">
                <AvatarImage src="https://avatar.vercel.sh/admin" alt="Admin" />
                <AvatarFallback className="bg-zinc-800 text-zinc-200 font-bold">
                  {getInitials(admin?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {admin?.full_name || "Admin User"}
                </p>
                <p className="text-[10px] text-zinc-400 truncate">
                  {admin?.email || "admin@leadequator.live"}
                </p>
                <div className="mt-1">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#fbbf24]/10 text-[#fbbf24] text-[9px] font-bold uppercase tracking-wider border border-[#fbbf24]/20">
                    {admin?.role || "Super Admin"}
                  </span>
                </div>
              </div>
            </div>

            <DropdownMenuItem className="text-sm font-medium text-zinc-300 focus:bg-white/[0.05] focus:text-white rounded-lg cursor-pointer py-2.5 transition-colors">
              <User className="w-4 h-4 mr-3 text-zinc-500" />
              <span>Profile</span>
            </DropdownMenuItem>

            <DropdownMenuItem className="text-sm font-medium text-zinc-300 focus:bg-white/[0.05] focus:text-white rounded-lg cursor-pointer py-2.5 transition-colors">
              <Settings className="w-4 h-4 mr-3 text-zinc-500" />
              <span>Settings</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-white/[0.08] my-1" />

            <DropdownMenuItem className="text-sm font-medium text-red-400 focus:bg-red-500/10 focus:text-red-400 rounded-lg cursor-pointer py-2.5 transition-colors" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-3" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}