import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid credentials");
        return;
      }

      localStorage.setItem("admin_logged_in", "true");
      localStorage.setItem("admin_user", JSON.stringify(data));
      navigate("/", { replace: true });
    } catch {
      setError("Server not reachable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Gold glow */}
      <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_50%_-200px,hsl(42_100%_55%/0.15),transparent_60%)]" />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-xl shadow-[0_0_0_1px_hsl(42_100%_55%/0.08),0_40px_80px_rgba(0,0,0,0.8)] p-8">

          {/* LOGO */}
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4 h-16 w-16 rounded-full border border-border bg-secondary flex items-center justify-center overflow-hidden">
              <img
                src="/leadequator_logo.png"
                alt="LeadEquator"
                className="w-full h-full object-contain p-2"
              />
            </div>

            <h1 className="text-3xl font-extrabold text-center">
              Admin{" "}
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                Login
              </span>
            </h1>

            <p className="mt-2 text-sm text-muted-foreground text-center">
              Access your LeadEquator dashboard
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs text-muted-foreground">Admin email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@leadequator.ai"
                required
                className="h-11 w-full rounded-md px-3 text-sm bg-black/40 border border-border text-foreground focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-11 w-full rounded-md px-3 text-sm bg-black/40 border border-border text-foreground focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-md font-semibold text-black bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 shadow-lg hover:brightness-110 transition"
            >
              {loading ? "Authenticating..." : "Secure Login"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Don’t have access?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Request admin account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
