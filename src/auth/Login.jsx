import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Eye,
  EyeOff,
  PackageCheck,
  Users,
  Camera,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { useAuth } from "../context/useAuth";

const FEATURES = [
  { icon: PackageCheck, label: "Assign pickups to partners in seconds" },
  { icon: Camera, label: "Photo evidence captured on every job" },
  { icon: ShieldCheck, label: "Auto-generated proof-of-delivery slips" },
  { icon: Users, label: "Full audit trail across every action" },
];

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { loginAdmin, loginPartner } = useAuth();

  const [activeRole, setActiveRole] = useState(
    location.state?.preselectRole || "admin",
  );

  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setError(null);
    setUserName("");
    setPassword("");
  };

  const handleTabSwitch = (role) => {
    if (role === activeRole) return;
    setActiveRole(role);
    reset();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (activeRole === "admin") {
        await loginAdmin({ userName, password });
        navigate("/admin/dashboard");
      } else {
        await loginPartner({ userName, password });
        navigate("/partner/dashboard");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const tabClass = (role) =>
    `flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
      activeRole === role
        ? "bg-black text-white"
        : "text-gray-500 hover:bg-gray-100"
    }`;

  return (
    <div className="h-screen w-screen flex bg-gray-50">
      {/* Sleek Left Branding Panel with Sidebar Image Theme */}
      <div
        className="hidden lg:flex lg:w-[40%] text-black flex-col justify-between p-12 relative overflow-hidden bg-cover bg-center border-r border-gray-200 shadow-sm"
        style={{
          backgroundImage: `linear-gradient(rgba(249, 250, 251, 0.92), rgba(249, 250, 251, 0.92)), url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop')`,
        }}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-16">
            <div className="bg-black text-white p-1.5 rounded-lg shadow-sm">
              <PackageCheck className="size-6" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-black">
              PickItUp - A Courier Logistics Platform
            </h1>
          </div>

          <h2 className="text-4xl font-light leading-tight mb-5 text-black">
            Manage every pickup with{" "}
            <span className="font-semibold">precision.</span>
          </h2>
          <p className="text-gray-600 text-lg mb-12 max-w-md">
            The operations hub for courier teams. Assign jobs, track partners,
            and generate proof-of-delivery seamlessly.
          </p>

          <div className="flex flex-col gap-6">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-sm">
                  <Icon className="size-5 text-gray-700" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-sm text-gray-500 font-medium">
            © {new Date().getFullYear()} PickItUp. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right — login card */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        {/* Soft ambient glow behind the card */}
        <div
          aria-hidden
          className="absolute size-105 rounded-full bg-black/5 blur-3xl pointer-events-none"
        />

        <div className="w-full max-w-md relative">
          <style>{`
            @keyframes cardFlipIn {
              from { transform: rotateY(90deg); opacity: 0; }
              to { transform: rotateY(0deg); opacity: 1; }
            }
            .card-flip-wrap {
              perspective: 1000px;
            }
            .card-flip {
              transform-style: preserve-3d;
              animation: cardFlipIn 0.35s ease-out;
            }
          `}</style>

          <div className="bg-white border border-gray-200 shadow-2xl rounded-3xl p-10">
            {/* Icon badge */}
            <div className="flex items-center justify-center size-12 rounded-2xl bg-black text-white mb-5 shadow-sm">
              <Lock className="size-5" strokeWidth={2.5} />
            </div>

            {/* Role tabs */}
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1 mb-7">
              <button
                type="button"
                onClick={() => handleTabSwitch("admin")}
                className={tabClass("admin")}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleTabSwitch("partner")}
                className={tabClass("partner")}
              >
                Partner
              </button>
            </div>

            <div className="card-flip-wrap">
              <div key={activeRole} className="card-flip">
                <h2 className="text-3xl font-serif text-black mb-1.5">
                  {activeRole === "admin" ? "Admin login" : "Partner login"}
                </h2>
                <p className="text-sm text-gray-500 mb-7">
                  Sign in to your {activeRole === "admin" ? "admin" : "partner"}{" "}
                  dashboard
                </p>

                {error && (
                  <div className="text-sm text-red-600 text-center bg-red-50 border border-red-200 rounded-lg py-2.5 px-3 mb-5">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <label
                    htmlFor="userName"
                    className="block text-sm font-medium text-black mb-1.5"
                  >
                    Username
                  </label>
                  <input
                    type="text"
                    id="userName"
                    name="userName"
                    className="w-full p-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                    placeholder="Username"
                    pattern="[A-Za-z][A-Za-z0-9\-]*"
                    minLength="3"
                    maxLength="30"
                    title="Only letters, numbers or dash"
                  />

                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-black mt-5 mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-3 pr-11 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-black focus:ring-2 focus:ring-black/5 transition"
                      required
                      placeholder="Password"
                      minLength="8"
                      pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                      title="Must be more than 8 characters, including number, lowercase letter, uppercase letter"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 mt-7 bg-black text-white font-semibold py-3 rounded-xl hover:bg-gray-800 active:scale-[0.99] transition disabled:opacity-50"
                    >
                      {submitting ? "Logging in..." : "Sign in"}
                    </button>

                    <button
                      type="button"
                      onClick={reset}
                      disabled={submitting}
                      className="mt-7 px-5 bg-gray-100 text-black font-semibold rounded-xl hover:bg-gray-200 transition disabled:opacity-50"
                    >
                      Clear
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
