import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import toast from "react-hot-toast";
import api from "../api/axios";
import JobDetailsForm from "../jobs/JobDetailsForm";
import PhotoUpload from "../jobs/PhotoUpload";
import AdminSubmit from "./AdminSubmit";
import Shipment from "../jobs/Shipment";
import JobTimeline from "../jobs/JobTimeline";
import JobSummary from "../jobs/JobSummary";
import { ArrowLeft, Loader2 } from "lucide-react";
import CancelJob from "../jobs/CancelJob";

const LOCK_REASONS = [
  { value: "review", label: "Review" },
  { value: "dispatched", label: "Dispatched" },
  { value: "dispute", label: "Dispute" },
  { value: "mismatch", label: "Mismatch" },
];

const STATUS_OPTIONS = [
  { value: "PickedUp", label: "Picked Up" },
  { value: "AtOffice", label: "At Office" },
  { value: "Dispatched", label: "Dispatched" },
];

const sectionClass = "border-t border-gray-200 pt-5";
const sectionLabelClass = "text-base font-semibold text-black mb-3";

const AdminJobDetail = () => {
  const { id } = useParams();

  const [jobData, setJobData] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [partners, setPartners] = useState([]);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const [lockReason, setLockReason] = useState("");
  const [lockingOrUnlocking, setLockingOrUnlocking] = useState(false);

  const [statusValue, setStatusValue] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/api/jobs/${id}`);
        setJobData(response.data.jobData);
        setItems(response.data.items);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load job");
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

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

  const handleAssign = async () => {
    if (!selectedPartnerId) {
      toast.error("Pick a partner first");
      return;
    }
    setAssigning(true);
    try {
      const response = await api.patch(`/api/jobs/${id}/assign`, {
        partnerId: selectedPartnerId,
      });
      setJobData(response.data.jobData);
      toast.success(response.data.message || "Job assigned");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to assign job");
    } finally {
      setAssigning(false);
    }
  };

  const handleSelfAssign = async () => {
    setAssigning(true);
    try {
      const response = await api.patch(`/api/jobs/${id}/self-assign`);
      setJobData(response.data.jobData);
      toast.success(response.data.message || "Job self-assigned");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to self-assign job");
    } finally {
      setAssigning(false);
    }
  };

  const handleLock = async () => {
    if (!lockReason) {
      toast.error("Pick a lock reason first");
      return;
    }
    setLockingOrUnlocking(true);
    try {
      const response = await api.patch(`/api/jobs/${id}/lock`, {
        lockedReason: lockReason,
      });
      setJobData(response.data.jobData);
      toast.success(response.data.message || "Job locked");
      setLockReason("");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to lock job");
    } finally {
      setLockingOrUnlocking(false);
    }
  };

  const handleUnlock = async () => {
    setLockingOrUnlocking(true);
    try {
      const response = await api.patch(`/api/jobs/${id}/unlock`);
      setJobData(response.data.jobData);
      toast.success(response.data.message || "Job unlocked");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to unlock job");
    } finally {
      setLockingOrUnlocking(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!statusValue) {
      toast.error("Pick a status first");
      return;
    }
    setUpdatingStatus(true);
    try {
      const response = await api.patch(`/api/jobs/${id}/status`, {
        status: statusValue,
      });
      setJobData(response.data.jobData);
      toast.success(response.data.message || "Status updated");
      setStatusValue("");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 size={32} className="animate-spin text-black" />
      </div>
    );
  }

  if (error) return <div className="p-2 text-red-600">{error}</div>;
  if (!jobData) return <div className="p-2">Job not found</div>;

  const { clientName, clientNumber, clientAddress, clientCity } = jobData;

  return (
    <div className="p-2">
      <Link
        to="/admin/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-black transition mb-4"
      >
        <ArrowLeft className="size-4" />
        Back to Dashboard
      </Link>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-5">
          <div>
            <h2 className="text-2xl font-bold text-black mb-1">{clientName}</h2>
            <p className="text-sm text-gray-600">
              {clientAddress}, {clientCity}
            </p>
            <p className="text-sm text-gray-600">{clientNumber}</p>
          </div>

          <div
            className={`${sectionClass} grid grid-cols-1 sm:grid-cols-3 gap-6`}
          >
            <div>
              <h3 className={sectionLabelClass}>Update status</h3>
              <div className="flex flex-col gap-2">
                <select
                  value={statusValue}
                  onChange={(e) => setStatusValue(e.target.value)}
                  className="p-2 rounded-lg border border-gray-300 text-sm w-full"
                >
                  <option value="">Select new status</option>
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleUpdateStatus}
                  disabled={updatingStatus}
                  className="text-sm px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {updatingStatus ? "..." : "Update status"}
                </button>
              </div>
            </div>

            {jobData.status === "Created" && (
              <div>
                <h3 className={sectionLabelClass}>Assign job</h3>
                <div className="flex flex-col gap-2">
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                    disabled={partnersLoading}
                    className="p-2 rounded-lg border border-gray-300 text-sm w-full"
                  >
                    <option value="">Select a partner</option>
                    {partners.map((partner) => (
                      <option key={partner._id} value={partner._id}>
                        {partner.userName}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAssign}
                    disabled={assigning}
                    className="text-sm px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition disabled:opacity-50"
                  >
                    {assigning ? "..." : "Assign"}
                  </button>
                  <span className="text-xs text-gray-400 text-center">or</span>
                  <button
                    onClick={handleSelfAssign}
                    disabled={assigning}
                    className="text-sm px-4 py-2 rounded-lg bg-gray-200 text-black hover:bg-gray-300 transition disabled:opacity-50"
                  >
                    Self-Assign
                  </button>
                </div>
              </div>
            )}

            <div>
              <h3 className={sectionLabelClass}>Lock / unlock</h3>
              {jobData.locked ? (
                <button
                  onClick={handleUnlock}
                  disabled={lockingOrUnlocking}
                  className="text-sm px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50 w-full"
                >
                  {lockingOrUnlocking ? "..." : "Unlock job"}
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <select
                    value={lockReason}
                    onChange={(e) => setLockReason(e.target.value)}
                    className="p-2 rounded-lg border border-gray-300 text-sm w-full"
                  >
                    <option value="">Select a reason</option>
                    {LOCK_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleLock}
                    disabled={lockingOrUnlocking}
                    className="text-sm px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {lockingOrUnlocking ? "..." : "Lock job"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className={sectionClass}>
            <JobDetailsForm
              jobData={jobData}
              jobId={id}
              setJobData={setJobData}
              items={items}
              setItems={setItems}
            />
          </div>

          <div className={sectionClass}>
            <h3 className={sectionLabelClass}>Photo upload</h3>
            <PhotoUpload jobId={id} locked={jobData.locked} />
          </div>

          <div className={sectionClass}>
            <h3 className={sectionLabelClass}>Documents</h3>
            <div className="flex flex-col gap-4">
              <AdminSubmit
                jobData={jobData}
                jobId={id}
                setJobData={setJobData}
              />
            </div>
          </div>

          <div className={sectionClass}>
            <h3 className={sectionLabelClass}>Shipment</h3>
            <Shipment jobData={jobData} jobId={id} setJobData={setJobData} />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 mb-4">Progress</p>
            <JobTimeline status={jobData.status} />
          </div>
          <JobSummary jobData={jobData} />
        </div>
        <div className={sectionClass}>
          <CancelJob jobData={jobData} jobId={id} setJobData={setJobData} />
        </div>
      </div>
    </div>
  );
};

export default AdminJobDetail;
