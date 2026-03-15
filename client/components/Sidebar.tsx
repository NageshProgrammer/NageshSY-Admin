import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Shield,
  Globe,
  CreditCard,
  CalendarDays,
  BarChart3,
  LifeBuoy,
  ShieldCheck,
  ChartSpline,
  // PanelLeftClose,
  // X,
} from "lucide-react";
import { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const location = useLocation();

  useEffect(() => {
    // Handle Window Resize
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setIsOpen(true);
      else setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);

    // Listen for the custom event triggered by Header.tsx
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggleSidebar', handleToggle);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener('toggleSidebar', handleToggle);
    };
  }, []);

  const menuItems = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Users", path: "/users", icon: Users },
    { label: "Admin Management", path: "/admin", icon: Shield },
    { label: "Geo Analytics", path: "/geo", icon: Globe },
    { label: "Transactions", path: "/transactions", icon: CreditCard },
    { label: "Events", path: "/events", icon: CalendarDays },
    { label: "Analytics & Reports", path: "/reports", icon: BarChart3 },
    { label: "Support & Tickets", path: "/support", icon: LifeBuoy },
    { label: "Logs & Security", path: "/security", icon: ShieldCheck },
    { label: "Google Analytics", path: "/google-analytics", icon: ChartSpline },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="fixed inset-0 top-[64px] bg-background/20 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Panel */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed left-0 top-[64px] z-50 h-[calc(100vh-64px)] w-[260px] bg-background/20 backdrop-blur-3xl border-r border-white/[0.05] overflow-y-auto custom-scrollbar flex flex-col shadow-[20px_0_40px_rgba(0,0,0,0.5)] lg:shadow-none"
      >
        {/* Header with Close Button
        <div className="flex items-center justify-between p-4 border-b border-white/[0.05]">
          <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">
            Navigation
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-zinc-400 hover:text-[#fbbf24] hover:bg-[#fbbf24]/10 rounded-lg transition-colors"
            onClick={() => setIsOpen(false)}
            title="Close Sidebar"
          >
            {isMobile ? <X className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </Button>
        </div> */}

        <nav className="flex flex-col gap-1.5 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link key={item.path} to={item.path} className="relative group">
                {isActive && (
                  <motion.div
                    layoutId="active-sidebar-tab"
                    className="absolute inset-0 bg-[#fbbf24]/10 border border-[#fbbf24]/20 rounded-xl shadow-[inset_0_1px_0_0_rgba(251,191,36,0.1)] drop-shadow-lg drop-shadow-[#fbbf24]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                <div
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 z-10",
                    isActive
                      ? "text-[#fbbf24]"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.03]"
                  )}
                  onClick={() => {
                    if (isMobile) setIsOpen(false);
                  }}
                >
                  <Icon className={cn("w-4 h-4 flex-shrink-0 transition-transform", isActive && "scale-110")} />
                  <span className={cn("text-sm font-semibold tracking-wide", isActive ? "font-bold" : "font-medium")}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </motion.aside>
    </>
  );
}