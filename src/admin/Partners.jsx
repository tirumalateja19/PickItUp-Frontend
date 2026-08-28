import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import toast from "react-hot-toast";
import {
  User,
  Phone,
  Search,
  Plus,
  Power,
  Loader2,
  Briefcase,
} from "lucide-react";
import api from "../api/axios";

const AdminPartners = () => {
  const navigate = useNavigate();

  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState(null);
  const [search, setSearch] = useState("");
  const [confirmDeactivateId, setConfirmDeactivateId] = useState(null);

  useEffect(() => {
    const fetchPartners = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get("/api/admin/partners");
        setPartners(data.partners);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load partners");
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, []);

  const filteredPartners = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return partners;

    return partners.filter(
      (partner) =>
        partner.userName.toLowerCase().includes(value) ||
        partner.contactNumber.toLowerCase().includes(value),
    );
  }, [partners, search]);

  const handleToggle = async (partner) => {
    // Deactivating needs confirmation; activating doesn't.
    if (!partner.isDeactivated && confirmDeactivateId !== partner._id) {
      setConfirmDeactivateId(partner._id);
      return;
    }

    setTogglingId(partner._id);
    setConfirmDeactivateId(null);

    try {
      const action = partner.isDeactivated ? "activate" : "deactivate";

      const { data } = await api.patch(
        `/api/admin/partners/${partner._id}/${action}`,
      );

      setPartners((prev) =>
        prev.map((p) =>
          p._id === partner._id
            ? {
                ...p,
                isDeactivated: !p.isDeactivated,
              }
            : p,
        ),
      );

      toast.success(data.message || `Partner ${action}d successfully`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Action failed");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="p-2">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm w-full">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            placeholder="Search by username or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 outline-none transition focus:border-black"
          />
        </div>

        <Link
          to="/admin/jobs/create-partner"
          className="flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 font-semibold text-white transition hover:bg-gray-800 shrink-0"
        >
          <Plus size={18} />
          Create Partner
        </Link>
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <Loader2 size={32} className="animate-spin text-black" />
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && filteredPartners.length === 0 && (
        <p className="text-gray-500">No partners found.</p>
      )}

      {!loading && !error && filteredPartners.length > 0 && (
        <div className="grid gap-3">
          {filteredPartners.map((partner) => (
            <div
              key={partner._id}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 transition hover:shadow-md"
            >
              <div>
                <div className="flex items-center gap-2">
                  <User size={17} className="text-gray-700" />

                  <p className="font-semibold capitalize text-black">
                    {partner.userName}
                  </p>
                </div>

                <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={15} />
                  <span>{partner.contactNumber}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    partner.isDeactivated
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {partner.isDeactivated ? "Deactivated" : "Active"}
                </span>

                <button
                  onClick={() =>
                    navigate(`/admin/dashboard?assignedToId=${partner._id}`)
                  }
                  className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-semibold text-black transition hover:bg-gray-50"
                >
                  <Briefcase size={16} />
                  Jobs
                </button>

                {confirmDeactivateId === partner._id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Deactivate?</span>
                    <button
                      onClick={() => handleToggle(partner)}
                      disabled={togglingId === partner._id}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmDeactivateId(null)}
                      className="rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-gray-300"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleToggle(partner)}
                    disabled={togglingId === partner._id}
                    className={`flex items-center justify-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold transition disabled:opacity-50 ${
                      partner.isDeactivated
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-red-600 text-white hover:bg-red-700"
                    }`}
                  >
                    {togglingId === partner._id ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Power size={16} />
                        {partner.isDeactivated ? "Activate" : "Deactivate"}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPartners;
