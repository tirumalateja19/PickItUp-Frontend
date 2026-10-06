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
import { ArrowLeft, Loader2, MessageCircle, Pencil } from "lucide-react";
import CancelJob from "../jobs/CancelJob";
import SectionCard from "../jobs/SectionCard";
import { openWhatsApp } from "../utils/whatsapp";

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

// Jobs can only be (re)assigned before pickup
const ASSIGNABLE_STATUSES = ["Created", "Assigned"];

const sectionClass = "border-t border-gray-200 pt-5";
const sectionLabelClass = "text-base font-semibold text-black mb-3";
const controlPanelClass = "rounded-xl border border-gray-200 bg-gray-50 p-4";

const AdminJobDetail = () => {
  const { id } = useParams();

  const [jobData, setJobData] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [partners, setPartners] = useState([]);
  const [partnersLoading, setPartnersLoading] = useState(true);
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [notify, setNotify] = useState(null); // { job, partnerPhone } for the WhatsApp popup

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
      setSelectedPartnerId("");
      setShowAssign(false);
      if (response.data.partnerPhone) {
        setNotify({
          job: response.data.jobData,
          partnerPhone: response.data.partnerPhone,
        });
      }
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
      setShowAssign(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to self-assign job");
    } finally {
      setAssigning(false);
    }
  };

  // Runs straight from the click (no await) so browsers don't block the tab
  const handleSendWhatsApp = () => {
    if (!openWhatsApp(notify.partnerPhone, notify.job)) {
      toast.error("Partner has no phone number");
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

  const canAssign =
    ASSIGNABLE_STATUSES.includes(jobData.status) &&
    !jobData.locked &&
    !jobData.cancelled;
  // mirrors the backend rule on PATCH /api/jobs/:id
  const canEdit = !jobData.locked && !jobData.cancelled && !jobData.isArchived;
  const hasAssignee = Boolean(jobData.assignedTo);
  const assignPanelOpen = canAssign && (showAssign || !hasAssignee);

  // Active partners only, and not the one already holding the job
  const assignablePartners = partners.filter(
    (p) => !p.isDeactivated && p._id !== jobData.assignedToId,
  );

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
          {/* Header: client + who holds the job */}
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-2xl font-bold text-black">{clientName}</h2>
              {canEdit && (
                <Link
                  to={`/admin/jobs/${id}/edit`}
                  className="inline-flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-full border border-gray-300 hover:bg-gray-50 transition"
                >
                  <Pencil className="size-3.5" />
                  Edit details
                </Link>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {clientAddress}, {clientCity}
            </p>
            <p className="text-sm text-gray-600">{clientNumber}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-gray-400">Assigned to</span>
              <span className="font-medium text-black">
                {jobData.assignedTo || "Unassigned"}
              </span>
              {canAssign && hasAssignee && (
                <button
                  type="button"
                  onClick={() => setShowAssign((v) => !v)}
                  className="text-xs px-3 py-1 rounded-full border border-gray-300 hover:bg-gray-50 transition"
                >
                  {showAssign ? "Cancel" : "Reassign"}
                </button>
              )}
            </div>

            {assignPanelOpen && (
              <div className={`${controlPanelClass} mt-3 max-w-md`}>
                <p className="text-sm font-medium text-black mb-2">
                  {hasAssignee ? "Reassign job" : "Assign job"}
                </p>
                <div className="flex flex-col gap-2">
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                    disabled={partnersLoading}
                    className="p-2 rounded-lg border border-gray-300 bg-white text-sm w-full"
                  >
                    <option value="">Select a partner</option>
                    {assignablePartners.map((partner) => (
                      <option key={partner._id} value={partner._id}>
                        {partner.userName}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAssign}
                      disabled={assigning || !selectedPartnerId}
                      className="flex-1 text-sm px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition disabled:opacity-50"
                    >
                      {assigning ? "..." : hasAssignee ? "Reassign" : "Assign"}
                    </button>
                    <button
                      type="button"
                      onClick={handleSelfAssign}
                      disabled={assigning}
                      className="flex-1 text-sm px-4 py-2 rounded-lg bg-gray-200 text-black hover:bg-gray-300 transition disabled:opacity-50"
                    >
                      Self-Assign
                    </button>
                  </div>
                </div>
              </div>
            )}
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

          <SectionCard
            step={4}
            title="Photos"
            subtitle="ID proof, waybill, packed box and more"
          >
            <PhotoUpload jobId={id} locked={jobData.locked} />
          </SectionCard>

          <SectionCard
            step={5}
            title="Submit"
            subtitle="Send to office and generate the POD slip"
          >
            <AdminSubmit jobData={jobData} jobId={id} setJobData={setJobData} />
          </SectionCard>

          <SectionCard
            step={6}
            title="Shipment"
            subtitle="Dispatch details"
          >
            <Shipment jobData={jobData} jobId={id} setJobData={setJobData} />
          </SectionCard>

          {/* Job controls: kept at the bottom, away from the day-to-day form */}
          <div className={sectionClass}>
            <h3 className="text-lg font-semibold text-black mb-4">
              Job controls
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={controlPanelClass}>
                <h4 className={sectionLabelClass}>Update status</h4>
                <div className="flex flex-col gap-2">
                  <select
                    value={statusValue}
                    onChange={(e) => setStatusValue(e.target.value)}
                    className="p-2 rounded-lg border border-gray-300 bg-white text-sm w-full"
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
                    disabled={updatingStatus || !statusValue}
                    className="text-sm px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition disabled:opacity-50"
                  >
                    {updatingStatus ? "..." : "Update status"}
                  </button>
                </div>
              </div>

              <div className={controlPanelClass}>
                <h4 className={sectionLabelClass}>Lock / unlock</h4>
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
                      className="p-2 rounded-lg border border-gray-300 bg-white text-sm w-full"
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
                      disabled={lockingOrUnlocking || !lockReason}
                      className="text-sm px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
                    >
                      {lockingOrUnlocking ? "..." : "Lock job"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <CancelJob
                jobData={jobData}
                jobId={id}
                setJobData={setJobData}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 mb-4">Progress</p>
            <JobTimeline status={jobData.status} />
          </div>
          <JobSummary jobData={jobData} />
        </div>
      </div>

      {notify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gray-800">Job assigned</h3>
            <p className="mt-2 text-sm text-gray-600">
              Send the job details to {notify.job.assignedTo} on WhatsApp.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="flex items-center justify-center gap-2 rounded-lg bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700"
              >
                <MessageCircle size={18} />
                Send to WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setNotify(null)}
                className="rounded-lg border border-gray-300 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminJobDetail;
