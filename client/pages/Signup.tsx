import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const ROLES = ["super_admin", "admin", "ceo", "founder"];

export default function Signup() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!fullName || !email || !password) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed");
        return;
      }

      navigate("/login");
    } catch {
      setError("Server not reachable. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black/40 font-sans py-12">
      
      {/* Continuous Moving Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div 
          animate={{ 
            x: ["-20%", "20%", "-10%", "-20%"],
            y: ["-20%", "10%", "20%", "-20%"],
            scale: [1, 1.2, 0.9, 1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#fbbf24]/10 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            x: ["20%", "-20%", "10%", "20%"],
            y: ["20%", "-10%", "-20%", "20%"],
            scale: [0.9, 1.1, 1, 0.9]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[#fbbf24]/10 rounded-full blur-[120px]" 
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="bg-[#050505]/60 backdrop-blur-3xl border border-white/[0.08] shadow-[0_20px_80px_rgba(0,0,0,0.8)] rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden">
          
          {/* Top edge highlight */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#fbbf24]/50 to-transparent" />

          {/* LOGO & HEADER */}
          <div className="flex flex-col items-center mb-8">
            <div className="mb-6 h-16 w-16 rounded-2xl border border-white/[0.1] bg-white/[0.02] flex items-center justify-center overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] relative group">
              <div className="absolute inset-0 bg-[#fbbf24]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <ShieldCheck className="w-8 h-8 text-[#fbbf24] absolute -z-10" /> 
              <img
                src="/leadequator_logo.png"
                alt="LeadEquator"
                className="w-full h-full object-contain p-2 relative z-10 drop-shadow-lg"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            </div>

            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Lead<span className="text-[#fbbf24]">Equator</span>
            </h1>
            <p className="mt-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">
              Request Admin Access
            </p>
          </div>

          {/* ERROR ALERT */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0, mb: 0 }}
              animate={{ opacity: 1, height: "auto", mb: 20 }}
              className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 font-medium"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest ml-1">
                Full Name
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="h-12 w-full rounded-xl px-4 text-sm bg-white/[0.02] border border-white/[0.08] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/30 focus:border-[#fbbf24]/50 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest ml-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@leadequator.ai"
                className="h-12 w-full rounded-xl px-4 text-sm bg-white/[0.02] border border-white/[0.08] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/30 focus:border-[#fbbf24]/50 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest ml-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 w-full rounded-xl px-4 text-sm bg-white/[0.02] border border-white/[0.08] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/30 focus:border-[#fbbf24]/50 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest ml-1">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-12 w-full rounded-xl px-4 text-sm bg-[#0a0a0a] border border-white/[0.08] text-white focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/30 focus:border-[#fbbf24]/50 transition-all appearance-none"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.toUpperCase().replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full flex items-center justify-center rounded-xl font-bold text-black bg-[#fbbf24] hover:bg-[#fbbf24]/90 shadow-[0_0_20px_rgba(251,191,36,0.2)] hover:shadow-[0_0_25px_rgba(251,191,36,0.4)] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin text-black/70" />
                    Creating...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-xs text-zinc-500 font-medium">
            Already have an account?{" "}
            <Link to="/login" className="text-[#fbbf24] hover:text-[#fbbf24]/80 hover:underline transition-colors font-bold">
              Secure Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}