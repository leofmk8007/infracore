import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LayoutDashboard, Users, Menu, X, Settings } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: settingsList = [] } = useQuery({
    queryKey: ["app_settings"],
    queryFn: () => base44.entities.AppSettings.list(),
    staleTime: 0,
  });
  const settings = settingsList[0] || {};
  const appName = settings.app_name || "ProjectFlow";
  const appDesc = settings.app_description || "Gestão de Projetos";
  const logoUrl = settings.logo_url || "";
  const primaryColor = settings.primary_color || "#3B82F6";

  const navItems = [
    { name: "Dashboard", page: "Dashboard", icon: LayoutDashboard },
    { name: "Projetos", page: "Projects", icon: Users },
    { name: "Configurações", page: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-200 fixed h-full z-10">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          {logoUrl && <img src={logoUrl} alt="logo" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />}
          <div>
            <h1 className="text-xl font-bold text-gray-900">{appName}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{appDesc}</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          {logoUrl && <img src={logoUrl} alt="logo" className="w-6 h-6 rounded object-cover" />}
          <h1 className="text-lg font-bold text-gray-900">{appName}</h1>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-10 bg-black/30" onClick={() => setMobileOpen(false)}>
          <div className="bg-white w-60 h-full p-4 pt-16 space-y-1" onClick={(e) => e.stopPropagation()}>
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-60 pt-14 md:pt-0">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}