import { useState, useEffect } from "react";
import { Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import PhotoPicker from "./PhotoPicker";

const METHOD_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
];

const PaymentSection = ({ jobData, jobId, setJobData }) => {
  const locked = !!jobData.locked;

  const [status, setStatus] = useState(jobData.paymentStatus || "unpaid");
  const [method, setMethod] = useState(jobData.paymentMethod || "");
  const [amount, setAmount] = useState(
    jobData.paymentStatus === "paid" ? jobData.price || "" : "",
  );

  const [proof, setProof] = useState(null); // saved payment_proof photo
  const [proofFile, setProofFile] = useState(null); // newly picked, not yet uploaded
  const [proofLoading, setProofLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProof = async () => {
      try {
        const response = await api.get(`/api/jobs/pickup/${jobId}/photos`);
        const found = (response.data.photos || []).find(
          (p) => p.label === "payment_proof",
        );
        setProof(found || null);
      } catch (err) {
        toast.error(
          err?.response?.data?.message || "Failed to load payment photo",
        );
      } finally {
        setProofLoading(false);
      }
    };
    fetchProof();
  }, [jobId]);

  const isUpiPaid = status === "paid" && method === "upi";
  const busy = saving || deleting;

  const handleDeleteProof = async () => {
    setDeleting(true);
    try {
      const response = await api.delete(
        `/api/jobs/pickup/${jobId}/photos/${proof._id}`,
      );
      setProof(null);
      if (response.data.jobData) {
        setJobData((prev) => ({ ...prev, ...response.data.jobData }));
      }
      if (response.data.paymentReset) {
        // UPI without a photo is not allowed: back to not paid, ask again
        setStatus("unpaid");
        setMethod("");
        toast.success("UPI photo removed. Payment reset to not paid");
      } else {
        toast.success("Photo deleted");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete photo");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (status === "paid") {
      if (!method) {
        toast.error("Select cash or UPI");
        return;
      }
      if (!(Number(amount) > 0)) {
        toast.error("Enter the amount received");
        return;
      }
      if (method === "upi" && !proof && !proofFile) {
        toast.error("Add the UPI payment photo");
        return;
      }
    }

    setSaving(true);
    try {
      // upload a newly picked UPI photo first; the server replaces any old one
      if (isUpiPaid && proofFile) {
        const formData = new FormData();
        formData.append("photo", proofFile);
        formData.append("label", "payment_proof");
        const upload = await api.post(
          `/api/jobs/pickup/${jobId}/photos`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
        setProof(upload.data.photo);
        setProofFile(null);
      }

      const response = await api.put(`/api/jobs/pickup/${jobId}/payment`, {
        paymentStatus: status,
        paymentMethod: status === "paid" ? method : undefined,
        price: status === "paid" ? Number(amount) : undefined,
      });
      setJobData((prev) => ({ ...prev, ...response.data.jobData }));

      // the server removes the proof when the payment is no longer UPI
      if (!isUpiPaid) {
        setProof(null);
        setProofFile(null);
      }
      toast.success("Payment saved");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save payment");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "p-2 rounded-lg border border-gray-300 text-sm w-full";
  const labelClass = "block text-xs font-medium text-gray-700 mb-1";
  const segClass = (active) =>
    `flex-1 text-sm px-4 py-2 rounded-lg transition disabled:opacity-50 ${
      active
        ? "bg-black text-white"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`;

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-3">
      {locked && (
        <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          Job is locked — payment can no longer be changed.
        </p>
      )}

      {/* Paid / Not paid */}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={locked || busy}
          onClick={() => setStatus("paid")}
          className={segClass(status === "paid")}
        >
          Paid
        </button>
        <button
          type="button"
          disabled={locked || busy}
          onClick={() => setStatus("unpaid")}
          className={segClass(status === "unpaid")}
        >
          Not paid
        </button>
      </div>

      {status === "unpaid" && (
        <p className="text-xs text-gray-500">No payment received yet.</p>
      )}

      {status === "paid" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Payment Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                disabled={locked || busy}
                className={inputClass}
              >
                <option value="">Select method</option>
                {METHOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Amount Received (₹)</label>
              <input
                type="number"
                step="any"
                min="0"
                max="999999"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={locked || busy}
                className={inputClass}
              />
            </div>
          </div>

          {/* UPI proof */}
          {method === "upi" && (
            <div className="border border-gray-200 rounded-lg p-3 bg-white">
              <p className="text-xs font-semibold text-black mb-2">
                UPI payment photo
              </p>

              {proofLoading && (
                <Loader2 className="size-4 animate-spin text-gray-400" />
              )}

              {!proofLoading && proof && (
                <div className="flex items-center gap-3 mb-2">
                  <div className="relative w-24 h-24 shrink-0">
                    <a
                      href={proof.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block w-full h-full rounded-lg border border-gray-200 overflow-hidden"
                    >
                      <img
                        src={proof.fileUrl}
                        alt="UPI payment"
                        className="w-full h-full object-cover"
                      />
                    </a>

                    {confirmDelete && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 rounded-lg bg-black/70 p-2">
                        <p className="text-xs text-white text-center">
                          Delete? Payment resets to not paid
                        </p>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(false)}
                            className="text-xs px-2 py-1 rounded-md bg-white text-gray-700 hover:bg-gray-100 transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleDeleteProof}
                            disabled={deleting}
                            className="text-xs px-2 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
                          >
                            {deleting ? "..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {!locked && (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      disabled={busy}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition disabled:opacity-50"
                    >
                      <Trash2 className="size-3" /> Delete photo
                    </button>
                  )}
                </div>
              )}

              {!proofLoading && !locked && (
                <>
                  {proof && (
                    <p className="text-xs text-gray-500 mb-2">
                      Pick a new photo below to replace this one on save.
                    </p>
                  )}
                  <PhotoPicker
                    file={proofFile}
                    onChange={setProofFile}
                    disabled={busy}
                  />
                </>
              )}
            </div>
          )}

          {method === "cash" && proof && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Saving as cash will remove the saved UPI photo.
            </p>
          )}
        </>
      )}

      {status === "unpaid" && proof && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Saving as not paid will remove the saved UPI photo.
        </p>
      )}

      {!locked && (
        <button
          type="submit"
          disabled={busy}
          className="self-start text-sm px-4 py-1.5 rounded-lg bg-black text-white hover:bg-gray-800 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Payment"}
        </button>
      )}
    </form>
  );
};

export default PaymentSection;
