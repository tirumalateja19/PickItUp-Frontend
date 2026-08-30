import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  ChevronDown,
  Calendar,
  Lock,
  Search,
  Loader2,
  Archive,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "Open", label: "Open" },
  { value: "Completed", label: "Closed" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "PickedUp", label: "Picked Up" },
  // { value: "Created", label: "Created" },
  // { value: "Assigned", label: "Assigned" },
  // { value: "AtOffice", label: "At Office" },
];

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const formatDateBadge = (isoString) => {
  if (!isoString) return { day: "--", month: "" };
  const d = new Date(isoString);
  return {
    day: String(d.getDate()).padStart(2, "0"),
    month: MONTHS[d.getMonth()],
  };
};

const STATUS_DOT_COLOR = {
  Created: "bg-gray-400",
  Assigned: "bg-blue-500",
  PickedUp: "bg-purple-500",
  AtOffice: "bg-indigo-500",
  Dispatched: "bg-green-500",
  Cancelled: "bg-red-500",
};

const ARCHIVABLE_STATUSES = ["Dispatched", "Cancelled"];

const PillSelect = ({ children, ...props }) => (
  <div className="relative">
    <select
      {...props}
      className="appearance-none pl-4 pr-8 py-2 rounded-full border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none"
    >
      {children}
    </select>
    <ChevronDown className="size-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
  </div>
);

const AdminDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [clientNameFilter, setClientNameFilter] = useState("");
  const [searchParams] = useSearchParams();
  const [assignedToFilter, setAssignedToFilter] = useState(
    searchParams.get("assignedToId") || "",
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [confirmArchiveId, setConfirmArchiveId] = useState(null);
  const [archivingId, setArchivingId] = useState(null);

  // Wait 400ms after typing stops before updating the debounced value.
  useEffect(() => {
    const timer = setTimeout(() => {
      setClientNameFilter(searchInput);
      setCurrentPage(1); // reset page once the debounced search actually fires
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const [partners, setPartners] = useState([]);
  const [partnersLoading, setPartnersLoading] = useState(true);

  useEffect(() => {
    const fetchPartners = async () => {
      setPartnersLoading(true);
      try {
        const response = await api.get("/api/admin/partners");
        setPartners(response.data.partners);
      } catch (err) {
        console.error("Failed to load partners", err);
      } finally {
        setPartnersLoading(false);
      }
    };
    fetchPartners();
  }, []);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = { page: currentPage, limit: 10 };
        if (statusFilter) params.status = statusFilter;
        if (assignedToFilter) params.assignedToId = assignedToFilter;
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;
        if (clientNameFilter) params.clientName = clientNameFilter;

        const response = await api.get("/api/jobs", { params });
        setJobs(response.data.totalJobs);
        setTotalPages(response.data.totalPages);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load jobs");
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [
    statusFilter,
    assignedToFilter,
    fromDate,
    toDate,
    clientNameFilter,
    currentPage,
  ]);

  const handleArchive = async (jobId) => {
    setArchivingId(jobId);
    try {
      const response = await api.patch(`/api/jobs/${jobId}/archive`);
      toast.success(response.data.message || "Job archived");
      setJobs((prev) => prev.filter((job) => job._id !== jobId));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to archive job");
    } finally {
      setArchivingId(null);
      setConfirmArchiveId(null);
    }
  };

  return (
    <div className="p-2">
      {/* Pill filter bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="relative flex items-center gap-2 pl-4 pr-3 py-2 rounded-full border border-gray-400 bg-white text-sm text-gray-700">
          <Search className="size-4 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search client name"
            className="bg-transparent focus:outline-none text-sm w-40"
          />
        </div>

        <PillSelect
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.value === "" ? "Status" : opt.label}
            </option>
          ))}
        </PillSelect>

        <PillSelect
          value={assignedToFilter}
          onChange={(e) => {
            setAssignedToFilter(e.target.value);
            setCurrentPage(1);
          }}
          disabled={partnersLoading}
        >
          <option value="">Assigned to</option>
          {partners.map((partner) => (
            <option key={partner._id} value={partner._id}>
              {partner.userName}
            </option>
          ))}
        </PillSelect>

        <div className="relative flex items-center gap-2 pl-4 pr-3 py-2 rounded-full border border-gray-200 bg-white text-sm text-gray-700">
          <Calendar className="size-4 text-gray-400" />
          <span className="text-gray-400">From</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-transparent focus:outline-none text-sm"
          />
        </div>

        <div className="relative flex items-center gap-2 pl-4 pr-3 py-2 rounded-full border border-gray-200 bg-white text-sm text-gray-700">
          <Calendar className="size-4 text-gray-400" />
          <span className="text-gray-400">To</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-transparent focus:outline-none text-sm"
          />
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <Loader2 size={32} className="animate-spin text-black" />
        </div>
      )}

      {!loading && !error && jobs.length === 0 && (
        <p className="text-gray-500">No jobs found.</p>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg py-2 px-3 mb-4">
          {error}
        </div>
      )}

      {!loading && !error && jobs.length > 0 && (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => {
            const { day, month } = formatDateBadge(job.scheduledTime);
            const dotColor = STATUS_DOT_COLOR[job.status] || "bg-gray-400";
            const canArchive =
              ARCHIVABLE_STATUSES.includes(job.status) && !job.isArchived;

            return (
              <div
                key={job._id}
                className="flex items-center gap-4 bg-white rounded-2xl border border-gray-200 p-4"
              >
                <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl border border-gray-200 shrink-0">
                  <span className="text-lg font-semibold text-black leading-none">
                    {day}
                  </span>
                  <span className="text-xs text-gray-500">{month}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-serif text-xl text-black capitalize truncate">
                    {job.clientName}
                  </p>
                </div>

                <div className="hidden md:flex flex-col text-sm w-32 shrink-0">
                  <span className="text-gray-400 text-xs">Location</span>
                  <span className="text-black truncate">{job.clientCity}</span>
                </div>

                <div className="hidden md:flex flex-col text-sm w-32 shrink-0">
                  <span className="text-gray-400 text-xs">Status</span>
                  <span className="flex items-center gap-1.5 text-black capitalize">
                    <span className={`size-2 rounded-full ${dotColor}`} />
                    {job.status}
                    {job.locked && <Lock className="size-3.5 text-red-600" />}
                  </span>
                </div>

                <div className="hidden md:flex flex-col text-sm w-32 shrink-0">
                  <span className="text-gray-400 text-xs">Assigned to</span>
                  <span className="text-black truncate">
                    {job.assignedTo || "Unassigned"}
                  </span>
                </div>

                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmArchiveId(
                        confirmArchiveId === job._id ? null : job._id,
                      )
                    }
                    disabled={!canArchive || archivingId === job._id}
                    title={
                      job.isArchived
                        ? "Already archived"
                        : canArchive
                          ? "Archive job"
                          : "Only dispatched or cancelled jobs can be archived"
                    }
                    className="flex items-center justify-center size-9 rounded-full border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-black transition disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                  >
                    {archivingId === job._id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Archive className="size-4" />
                    )}
                  </button>

                  {confirmArchiveId === job._id && canArchive && (
                    <div className="absolute right-0 top-11 z-10 w-56 bg-white border border-gray-200 rounded-xl shadow-lg p-3">
                      <p className="text-sm text-black mb-3">
                        Archive this job?
                      </p>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmArchiveId(null)}
                          className="text-xs px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleArchive(job._id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-black text-white hover:bg-gray-800 transition"
                        >
                          Yes, archive
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  to={`/admin/jobs/${job._id}`}
                  className={`shrink-0 text-sm font-medium px-4 py-2 rounded-full border transition ${
                    job.locked
                      ? "border-red-300 text-red-600 hover:bg-red-50"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  View details
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-1.5 rounded-full border border-gray-300 text-sm text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Prev
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-1.5 rounded-full border border-gray-300 text-sm text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
