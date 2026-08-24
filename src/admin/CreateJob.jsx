import { useState } from "react";
import {
  User,
  Phone,
  MapPin,
  Building2,
  Weight,
  Ship,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useNavigate } from "react-router";

const initialForm = {
  clientName: "",
  clientNumber: "",
  clientAddress: "",
  clientCity: "",
  approxWeight: "",
  networkName: "",
};

const CreateJob = () => {
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate=useNavigate();

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
      navigate(`/admin/jobs/${data.jobData._id}`);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create job");
    } finally {
      setSubmitting(false);
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
      maxLength:10,
      placeholder: "Enter mobile number",
      icon: Phone,
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
      label: "Client Area",
      name: "clientCity",
      type: "text",
      placeholder: "Enter Area",
      icon: Building2,
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
  ];

  return (
    <div className="mt-10 flex justify-center px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-center text-3xl font-bold text-gray-800">
          Create Job
        </h2>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
          {fields.map(({ icon: Icon, label, ...field }) => (
            <div
              key={field.name}
              className={field.name === "clientAddress" ? "md:col-span-2" : ""}
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

          <div className="flex flex-col gap-3 pt-2 md:col-span-2 sm:flex-row">
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
    </div>
  );
};

export default CreateJob;
