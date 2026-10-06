import { useEffect, useState } from "react";
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
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useNavigate } from "react-router";
import { openWhatsApp } from "../utils/whatsapp";

const JOBS_LIST_PATH = "/admin/dashboard";

const initialForm = {
  clientName: "",
  clientNumber: "",
  clientAddress: "",
  mapLink: "",
  clientCity: "",
  approxWeight: "",
  networkName: "",
  partnerId: "",
};

const CreateJob = () => {
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [partners, setPartners] = useState([]);
  const [created, setCreated] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadPartners = async () => {
      try {
        const { data } = await api.get("/api/admin/partners");
        setPartners(data.partners.filter((p) => !p.isDeactivated));
      } catch (err) {
        setError("Could not load partners", err);
      }
    };
    loadPartners();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError("");
  };

  const resetForm = () => {
    setFormData(initialForm);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const { data } = await api.post("/api/jobs/new-job", formData);
      toast.success(data?.message || "Job created");
      setCreated({ job: data.jobData, partnerPhone: data.partnerPhone });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create job");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendWhatsApp = () => {
    const ok = openWhatsApp(created.partnerPhone, created.job);
    if (!ok) toast.error("Partner has no phone number");
  };

  const handleDone = () => navigate(JOBS_LIST_PATH);

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

  const wideFields = ["clientAddress", "mapLink"];

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-center text-3xl font-bold text-gray-800">
          Create Job
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
              className={wideFields.includes(field.name) ? "md:col-span-2" : ""}
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
                <option value="FedEx">FedEX</option>
                <option value="DPD">DPD</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="partnerId"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Assign To
            </label>

            <div className="relative">
              <UserCheck
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              />

              <select
                id="partnerId"
                name="partnerId"
                value={formData.partnerId}
                onChange={handleChange}
                required
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-3 pl-11 pr-4 outline-none transition focus:border-black"
              >
                <option value="">Select Partner</option>
                {partners.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.userName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row sm:items-end">
            <button
              type="submit"
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-black py-3 font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Job"
              )}
            </button>

            <button
              type="button"
              onClick={resetForm}
              disabled={submitting}
              className="flex-1 rounded-lg border border-gray-300 bg-white py-3 font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-60"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
      {created && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gray-800">Job assigned</h3>
            <p className="mt-2 text-sm text-gray-600">
              Send the job details to {created.job.assignedTo} on WhatsApp.
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
                onClick={handleDone}
                className="rounded-lg border border-gray-300 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateJob;
