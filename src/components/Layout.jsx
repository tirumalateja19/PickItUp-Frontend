import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router";
import {
  UserPlus,
  Users,
  KeyRound,
  LogOut,
  History,
  Menu,
  Archive,
  CircleUserRound,
  ChartNoAxesCombined,
  Package,
  PackagePlus,
  UserCog,
} from "lucide-react";
import { useAuth } from "../context/useAuth";

const ADMIN_LINKS = [
  { to: "/admin/dashboard", label: "Jobs", icon: Package },
  { to: "/admin/jobs/create-job", label: "Create Job", icon: PackagePlus },
  { to: "/admin/partners", label: "Partners", icon: Users },
  { to: "/admin/jobs/create-partner", label: "Create Partner", icon: UserPlus },
  { to: "/admin/stats", label: "Stats", icon: ChartNoAxesCombined },
  { to: "/admin/audit-logs", label: "Audit Logs", icon: History },
  { to: "/admin/jobs/archived", label: "Archive", icon: Archive },
];
const PARTNER_LINKS = [
  { to: "/partner/dashboard", label: "My Jobs", icon: Package },
  { to: "/partner/stats", label: "Stats", icon: ChartNoAxesCombined },
];

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(
    typeof window !== "undefined" && window.innerWidth >= 1024,
  );
  const links = user?.role === "admin" ? ADMIN_LINKS : PARTNER_LINKS;

  const pageTitle =
    links.find((l) => location.pathname.startsWith(l.to))?.label || "PickItUp";

  const closeMobile = () => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-white lg:flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col justify-between border-r border-gray-200 bg-gray-50 transition-all duration-300 ${
          sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full"
        } lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${sidebarOpen ? "lg:w-56" : "lg:w-16"}`}
      >
        <div className="flex flex-col h-full min-h-0">
          {/* Sidebar Header with Toggle */}
          <div
            className={`flex items-center py-4 ${
              sidebarOpen ? "justify-between px-4" : "justify-center"
            }`}
          >
            {sidebarOpen && (
              <span className="font-semibold text-black whitespace-nowrap">
                PickItUp
              </span>
            )}
            <button
              onClick={() => setSidebarOpen((p) => !p)}
              className="rounded-lg p-2 hover:bg-gray-200 shrink-0"
            >
              <Menu className="size-5 text-gray-700" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 px-3 mt-2 overflow-y-auto flex-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-full py-2 transition ${
                      sidebarOpen ? "px-3" : "justify-center"
                    } ${
                      isActive
                        ? "bg-black text-white"
                        : "text-gray-600 hover:bg-gray-200"
                    }`
                  }
                  title={!sidebarOpen ? link.label : undefined}
                >
                  <Icon className="size-5 shrink-0" />
                  {sidebarOpen && (
                    <span className="whitespace-nowrap text-sm font-medium">
                      {link.label}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col gap-1 border-t border-gray-200 px-3 py-4 shrink-0">
          {sidebarOpen && (
            <div className="flex items-center gap-2 truncate px-3 pb-2 text-sm capitalize text-gray-500">
              <CircleUserRound className="size-5 shrink-0" />
              {user?.userName || "User"}
            </div>
          )}
          <NavLink
            to="/auth/change-password"
            onClick={closeMobile}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-full py-2 transition ${
                sidebarOpen ? "px-3" : "justify-center"
              } ${
                isActive
                  ? "bg-black text-white"
                  : "text-gray-600 hover:bg-gray-200"
              }`
            }
            title={!sidebarOpen ? "Change Password" : undefined}
          >
            <KeyRound className="size-5 shrink-0" />
            {sidebarOpen && (
              <span className="whitespace-nowrap text-sm font-medium">
                Change Password
              </span>
            )}
          </NavLink>
          <button
            onClick={logout}
            className={`flex items-center gap-3 rounded-full py-2 text-red-600 hover:bg-red-50 transition ${
              sidebarOpen ? "px-3" : "justify-center"
            }`}
            title={!sidebarOpen ? "Log Out" : undefined}
          >
            <LogOut className="size-5 shrink-0" />
            {sidebarOpen && (
              <span className="whitespace-nowrap text-sm font-medium">
                Log Out
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 hover:bg-gray-200 lg:hidden"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-semibold text-black flex-1">
            {pageTitle}
          </h1>

          {location.pathname === "/admin/jobs/create-partner" && (
            <NavLink
              to="/admin/jobs/create-admin"
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
            >
              <UserCog className="size-4" />
              Create Admin
            </NavLink>
          )}
        </header>
        <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6 bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
