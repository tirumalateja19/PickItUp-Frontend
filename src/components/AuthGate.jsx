import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../context/useAuth";
import { Loader2 } from "lucide-react";

const dashboardFor = (role) =>
  role === "admin" ? "/admin/dashboard" : "/partner/dashboard";

const AuthGate = ({ requiredRole, guestOnly = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center py-10">
        <Loader2 size={42} className="animate-spin text-black" />
      </div>
    );
  }

  if (guestOnly) {
    if (user) {
      // If the person was sent to login from a protected page (e.g. a job link
      // from WhatsApp), send them back there, but only within their own area.
      const from = location.state?.from;
      const target =
        typeof from === "string" && from.startsWith(`/${user.role}/`)
          ? from
          : dashboardFor(user.role);
      return <Navigate to={target} replace />;
    }
    return <Outlet />;
  }

  if (!user) {
    return (
      <Navigate
        to="/"
        replace
        state={{
          preselectRole: requiredRole,
          from: location.pathname + location.search,
        }}
      />
    );
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={dashboardFor(user.role)} replace />;
  }

  return <Outlet />;
};

export default AuthGate;
