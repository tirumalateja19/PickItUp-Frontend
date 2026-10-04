import { useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";

const Shipment = ({ jobData, jobId, setJobData }) => {
  const [trackingId, setTrackingId] = useState("");
  const [networkName, setNetworkName] = useState("");
  const [recording, setRecording] = useState(false);

    if (!jobData.podSlipGenerated) {
      return (
        <p className="text-sm text-gray-500">
          Generate the pod slip first, then record the shipment here.
        </p>
      );
    }

  const handleRecordShipment = async (e) => {
    e.preventDefault();
    setRecording(true);
    try {
      const body = { trackingId };
      if (!jobData.networkName && networkName) body.networkName = networkName;

      const response = await api.post(`/api/jobs/${jobId}/shipment`, body);
      toast.success(response.data.message || "Shipment recorded");

      const refreshed = await api.get(`/api/jobs/${jobId}`);
      setJobData(refreshed.data.jobData);

      setTrackingId("");
      setNetworkName("");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to record shipment");
    } finally {
      setRecording(false);
    }
  };

    if (jobData.status === "Dispatched") {
      return (
        <p className="text-sm text-gray-600">
          Job has been dispatched
          {jobData.networkName ? ` via ${jobData.networkName}` : ""}.
        </p>
      );
    }

  return (
    <form onSubmit={handleRecordShipment} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Tracking ID"
          value={trackingId}
          onChange={(e) => setTrackingId(e.target.value)}
          required
          className="p-2 rounded-lg border border-gray-300 text-sm flex-1"
        />

        {jobData.networkName ? (
          <p className="flex items-center px-2 text-sm text-gray-600 flex-1">
            Network: {jobData.networkName}
          </p>
        ) : (
          <input
            type="text"
            placeholder="Network name"
            value={networkName}
            onChange={(e) => setNetworkName(e.target.value)}
            required
            className="p-2 rounded-lg border border-gray-300 text-sm flex-1"
          />
        )}
      </div>

      <button
        type="submit"
        disabled={recording}
        className="self-start text-sm px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition disabled:opacity-50"
      >
        {recording ? "Recording..." : "Record shipment"}
      </button>
    </form>
  );
};

export default Shipment;
