import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  User,
  Phone,
  MapPin,
  Building2,
  Weight,
  Ship,
  Loader2,
  Link2,
  UserCheck,
  MessageCircle,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { openWhatsApp } from "../utils/whatsapp";

const JOBS_LIST_PATH = "/admin/dashboard";

const EDITABLE_FIELDS = [
  "clientName",
  "clientNumber",
  "clientAddress",
  "mapLink",
  "clientCity",
  "approxWeight",
  "networkName",
];

// Everything the form can change, including the partner
const FORM_KEYS = [...EDITABLE_FIELDS, "partnerId"];

// The partner can only be changed before pickup
const PARTNER_CHANGEABLE_STATUSES = ["Created", "Assigned"];

// Pull only the editable fields out of a job, as strings the inputs can hold
const toFormValues = (job) => ({
  ...EDITABLE_FIELDS.reduce((acc, field) => {
    acc[field] = job?.[field] == null ? "" : String(job[field]);
    return acc;
  }, {}),
  partnerId: job?.assignedToId ? String(job.assignedToId) : "",
});

const EditJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [savedJob, setSavedJob] = useState(null);
  const [formData, setFormData] = useState(null);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notify, setNotify] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const [jobRes, partnersRes] = await Promise.all([
          api.get(`/api/jobs/${id}`),
          api.get("/api/admin/partners"),
        ]);
        const job = jobRes.data.jobData;
        setSavedJob(job);
        setFormData(toFormValues(job));
        setPartners(partnersRes.data.partners);
      } catch (err) {
        setLoadError(err?.response?.data?.message || "Failed to load job");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const getChanges = () => {
    if (!savedJob || !formData) return {};
    const saved = toFormValues(savedJob);
    return FORM_KEYS.reduce((acc, field) => {
      if (formData[field].trim() !== saved[field].trim()) {
        acc[field] = formData[field].trim();
      }
      return acc;
    }, {});
  };

  const changes = getChanges();
  const isDirty = Object.keys(changes).length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isDirty) {
      toast("No changes to save");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { data } = await api.patch(`/api/jobs/${id}`, changes);
      setSavedJob(data.jobData);
      setFormData(toFormValues(data.jobData));
      toast.success(data?.message || "Job updated");
      if (data.partnerPhone) {
        setNotify({ job: data.jobData, partnerPhone: data.partnerPhone });
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update job");
    } finally {
      setSaving(false);
    }
  };

  const handleResendWhatsApp = () => {
    const partner = partners.find((p) => p._id === savedJob.assignedToId);
    if (!partner) {
      toast.error("Partner not found");
      return;
    }
    if (!openWhatsApp(partner.contactNumber, savedJob)) {
      toast.error("Partner has no phone number");
    }
  };

  const handleSendWhatsApp = () => {
    if (!openWhatsApp(notify.partnerPhone, notify.job)) {
      toast.error("Partner has no phone number");
    }
  };

  const fields = [
    {
      label: "Client Name",
      name: "clientName",
      type: "text",
      placeholder: "Enter client name",
      icon: User,
      required: true,
    },
    {
      label: "Client Number",
      name: "clientNumber",
      type: "tel",
      maxLength: 10,
      placeholder: "Enter mobile number",
      icon: Phone,
      required: true,
    },
    {
      label: "Client Area",
      name: "clientCity",
      type: "text",
      placeholder: "Enter Area",
      icon: Building2,
      required: true,
    },
    {
      label: "Client Address",
      name: "clientAddress",
      type: "text",
      placeholder: "Enter address",
      icon: MapPin,
      required: true,
    },
    {
      label: "Approx Weight (kg)",
      name: "approxWeight",
      type: "number",
      placeholder: "Enter weight",
      icon: Weight,
      required: true,
    },
    {
      label: "Map Link (optional)",
      name: "mapLink",
      type: "url",
      placeholder: "Paste Google Maps link",
      icon: Link2,
      required: false,
    },
  ];

  const fullWidthFields = ["clientAddress", "mapLink"];

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-black" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
        <div className="w-full max-w-4xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {loadError}
        </div>
      </div>
    );
  }

  const isEditable =
    !savedJob.locked && !savedJob.cancelled && !savedJob.isArchived;

  if (!isEditable) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
        <div className="w-full max-w-4xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg">
          <p className="text-gray-700">This job can no longer be edited.</p>
          <button
            type="button"
            onClick={() => navigate(JOBS_LIST_PATH)}
            className="mt-5 rounded-lg border border-gray-300 px-5 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            Back to jobs
          </button>
        </div>
      </div>
    );
  }

  const canChangePartner = PARTNER_CHANGEABLE_STATUSES.includes(
    savedJob.status,
  );
  const partnerOptions = partners.filter(
    (p) => !p.isDeactivated || p._id === savedJob.assignedToId,
  );
  const holderInList = partners.some((p) => p._id === savedJob.assignedToId);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
        <button
          type="button"
          onClick={() => navigate(JOBS_LIST_PATH)}
          className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-black"
        >
          <ArrowLeft size={16} />
          Back to jobs
        </button>

        <h2 className="mb-6 text-center text-3xl font-bold text-gray-800">
          Edit Job
        </h2>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-3">
          {fields.map(({ icon: Icon, label, ...field }) => (
            <div
              key={field.name}
              className={
                fullWidthFields.includes(field.name) ? "md:col-span-2" : ""
              }
            >
              <label
                htmlFor={field.name}
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                {label}
              </label>

              <div className="relative">
                <Icon
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  id={field.name}
                  {...field}
                  value={formData[field.name]}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-4 outline-none transition focus:border-black"
                />
              </div>
            </div>
          ))}

          <div>
            <label
              htmlFor="networkName"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Network Name
            </label>

            <div className="relative">
              <Ship
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              />

              <select
                id="networkName"
                name="networkName"
                value={formData.networkName}
                onChange={handleChange}
                required
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-3 pl-11 pr-4 outline-none transition focus:border-black"
              >
                <option value="">Select Network</option>
                <option value="DHL">DHL</option>
                <option value="UPS">UPS</option>
                <option value="FedEx">FedEx</option>
                <option value="DPD">DPD</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="partnerId"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Assigned To
            </label>

            <div className="relative">
              <UserCheck
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              />

              {canChangePartner ? (
                <select
                  id="partnerId"
                  name="partnerId"
                  value={formData.partnerId}
                  onChange={handleChange}
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-3 pl-11 pr-4 outline-none transition focus:border-black"
                >
                  <option value="">Select Partner</option>
                  {savedJob.assignedToId && !holderInList && (
                    <option value={String(savedJob.assignedToId)}>
                      {savedJob.assignedTo}
                    </option>
                  )}
                  {partnerOptions.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.userName}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="partnerId"
                  type="text"
                  value={savedJob.assignedTo || "Unassigned"}
                  disabled
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-gray-500"
                />
              )}
            </div>
            {!canChangePartner && (
              <p className="mt-1.5 text-xs text-gray-500">
                The partner can't be changed after pickup.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 md:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <button
                type="submit"
                disabled={saving || !isDirty}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-black py-3 font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>

              <button
                type="button"
                onClick={handleResendWhatsApp}
                disabled={
                  saving ||
                  isDirty ||
                  !savedJob.assignedToId ||
                  savedJob.assignedToRole !== "partner"
                }
                title={
                  isDirty
                    ? "Save your changes first, then resend"
                    : "Send the saved job details to the partner"
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
              >
                <MessageCircle size={18} />
                Resend on WhatsApp
              </button>
            </div>
            {isDirty && (
              <p className="text-sm text-gray-500">
                You have unsaved changes. Save them before resending on
                WhatsApp.
              </p>
            )}
          </div>
        </form>
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

export default EditJob;
