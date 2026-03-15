import Header from "./Header";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex relative z-10">
        <Sidebar />
        <main className="relative z-10 flex-1 lg:ml-64 w-full overflow-hidden">
          <div className="p-6 relative z-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
