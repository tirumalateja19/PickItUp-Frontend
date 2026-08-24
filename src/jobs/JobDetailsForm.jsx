import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";

const PACKING_OPTIONS = [
  { value: "packed_at_source", label: "Packed at client" },
  { value: "packed_at_office", label: "Packed at Office" },
];

const emptyPackage = () => ({
  weight: "",
  length: "",
  breadth: "",
  height: "",
});

// Single source of truth for Volumetric + Courier Chargeable Weight calculation
const getChargeableWeight = (pkg) => {
  const actual = parseFloat(pkg.weight) || 0;
  const l = parseFloat(pkg.length) || 0;
  const b = parseFloat(pkg.breadth) || 0;
  const h = parseFloat(pkg.height) || 0;

  const rawVolumetric = (l * b * h) / 5000;

  let roundedVolumetric = 0;
  if (rawVolumetric > 0) {
    roundedVolumetric =
      rawVolumetric < 20
        ? Math.ceil(rawVolumetric * 2) / 2
        : Math.ceil(rawVolumetric);
  }

  const chargeable = Math.max(actual, roundedVolumetric);
  return chargeable > 0 ? chargeable.toFixed(2) : "0.00";
};

const JobDetailsForm = ({ jobData, jobId, setJobData }) => {
  const [receiverName, setReceiverName] = useState(jobData.receiverName || "");
  const [receiverNumber, setReceiverNumber] = useState(
    jobData.receiverNumber || "",
  );
  const [receiverAddress, setReceiverAddress] = useState(
    jobData.receiverAddress || "",
  );
  const [receiverCity, setReceiverCity] = useState(jobData.receiverCity || "");
  const [receiverCountry, setReceiverCountry] = useState(jobData.receiverCountry || "");
  const [receiverZipCode, setReceiverZipCode] = useState(
    jobData.receiverZipCode || "",
  );
  const [savingReceiver, setSavingReceiver] = useState(false);

  const [packingStatus, setPackingStatus] = useState(
    jobData.packingStatus || "",
  );
  const [price, setPrice] = useState(
    jobData.price && jobData.price !== "1" ? jobData.price : "",
  );
  const [numberOfPackages, setNumberOfPackages] = useState(
    jobData.numberOfPackages || "",
  );

  const [packages, setPackages] = useState(() => {
    if (jobData.packages && jobData.packages.length > 0)
      return jobData.packages;
    const n = parseInt(jobData.numberOfPackages, 10) || 0;
    return Array.from({ length: n }, emptyPackage);
  });

  const [savingPackage, setSavingPackage] = useState(false);

  // Calculates total chargeable weight cleanly across all packages
  const totalChargeableWeight = useMemo(() => {
    let total = 0;
    packages.forEach((pkg) => {
      total += parseFloat(getChargeableWeight(pkg)) || 0;
    });
    return total.toFixed(2);
  }, [packages]);

  const handleNumberOfPackagesChange = (value) => {
    setNumberOfPackages(value);
    const n = parseInt(value, 10) || 0;
    setPackages((prev) => {
      const next = [...prev];
      while (next.length < n) next.push(emptyPackage());
      return next.slice(0, n);
    });
  };

  const updatePackageField = (index, field, value) => {
    setPackages((prev) =>
      prev.map((pkg, i) => (i === index ? { ...pkg, [field]: value } : pkg)),
    );
  };

  const handleSaveReceiver = async (e) => {
    e.preventDefault();
    setSavingReceiver(true);
    try {
      const response = await api.patch(`/api/jobs/pickup/${jobId}/details`, {
        receiverName,
        receiverNumber,
        receiverAddress,
        receiverCity,
        receiverCountry,
        receiverZipCode,
      });
      setJobData((prev) => ({ ...prev, ...response.data.jobData }));
      toast.success("Receiver details saved");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to save receiver details",
      );
    } finally {
      setSavingReceiver(false);
    }
  };

  const handleSavePackage = async (e) => {
    e.preventDefault();
    setSavingPackage(true);
    try {
      const processedPackages = packages.map((pkg) => {
        const chargeableWeight = parseFloat(getChargeableWeight(pkg)) || 0;
        return {
          weight: chargeableWeight,
          length: parseFloat(pkg.length) || 0,
          breadth: parseFloat(pkg.breadth) || 0,
          height: parseFloat(pkg.height) || 0,
        };
      });

      const response = await api.patch(`/api/jobs/pickup/${jobId}/details`, {
        packages: processedPackages,
        packingStatus,
        price: parseFloat(price) || 0,
        numberOfPackages: parseInt(numberOfPackages, 10) || 0,
      });
      setJobData((prev) => ({ ...prev, ...response.data.jobData }));
      toast.success("Package info saved");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to save package info",
      );
    } finally {
      setSavingPackage(false);
    }
  };

  const inputClass = "p-2 rounded-lg border border-gray-300 text-sm w-full";
  const labelClass = "block text-xs font-medium text-gray-700 mb-1";

  return (
    <div className="flex flex-col gap-6">
      {/* RECEIVER DETAILS FORM */}
      <form onSubmit={handleSaveReceiver} className="flex flex-col gap-2">
        <h3 className="font-semibold text-black">Receiver Details</h3>
        <div className="flex gap-2">
          <div className="w-full">
            <input
              type="text"
              placeholder="Receiver Name"
              value={receiverName}
              required
              onChange={(e) => setReceiverName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="w-full">
            <input
              type="text"
              placeholder="Receiver Number"
              value={receiverNumber}
              required
              onChange={(e) => setReceiverNumber(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <input
          type="text"
          placeholder="Receiver Address"
          value={receiverAddress}
          required
          onChange={(e) => setReceiverAddress(e.target.value)}
          className={inputClass}
        />
        <div className="flex gap-2">
          <div className="w-full">
            <input
              type="text"
              placeholder="City"
              value={receiverCity}
              required
              onChange={(e) => setReceiverCity(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="w-full">
            <input
              type="text"
              placeholder="Country"
              value={receiverCountry}
              required
              onChange={(e) => setReceiverCountry(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="w-full">
            <input
              type="text"
              placeholder="Zip Code"
              value={receiverZipCode}
              onChange={(e) => setReceiverZipCode(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={savingReceiver}
          className="self-start text-sm px-4 py-1.5 rounded-lg bg-black text-white hover:bg-gray-800 transition disabled:opacity-50"
        >
          {savingReceiver ? "Saving..." : "Save Receiver Details"}
        </button>
      </form>

      {/* PACKAGE INFO FORM */}
      <form onSubmit={handleSavePackage} className="flex flex-col gap-3">
        <h3 className="font-semibold text-black">Package Info</h3>

        {/* Price & Package Count */}
        <div className="flex gap-2">
          <div className="w-full">
            <label className={labelClass}>Price</label>
            <input
              type="text"
              placeholder="0.00"
              value={price}
              required
              onChange={(e) => setPrice(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="w-full">
            <label className={labelClass}>Number of Packages</label>
            <input
              type="number"
              placeholder="0"
              value={numberOfPackages}
              required
              min="1"
              max="7"
              onChange={(e) => {
                let val = e.target.value;
                if (Number(val) > 7) val = "7";
                handleNumberOfPackagesChange(val);
              }}
              className={inputClass}
            />
          </div>
        </div>

        {/* Dynamic Package Cards */}
        {packages.map((pkg, index) => {
          const preferredWeight = getChargeableWeight(pkg);

          return (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-3 bg-white"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-black">
                  Package {index + 1}
                </span>
                {parseFloat(preferredWeight) > 0 && (
                  <span className="text-xs font-medium text-black bg-gray-100 px-2 py-1 rounded">
                    Preferred Weight: <strong>{preferredWeight} kg</strong>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className={labelClass}>Weight (kg)</label>
                  <input
                    type="number"
                    placeholder="0.0"
                    value={pkg.weight}
                    required
                    onChange={(e) =>
                      updatePackageField(index, "weight", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Length (cm)</label>
                  <input
                    type="number"
                    placeholder="L"
                    value={pkg.length}
                    required
                    onChange={(e) =>
                      updatePackageField(index, "length", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Breadth (cm)</label>
                  <input
                    type="number"
                    placeholder="B"
                    value={pkg.breadth}
                    required
                    onChange={(e) =>
                      updatePackageField(index, "breadth", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Height (cm)</label>
                  <input
                    type="number"
                    placeholder="H"
                    value={pkg.height}
                    required
                    onChange={(e) =>
                      updatePackageField(index, "height", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* Total Chargeable Weight directly above Packing Status */}
        {packages.length > 0 && (
          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
            <span className="text-sm font-semibold text-gray-700">
              Total Chargeable Weight:
            </span>
            <span className="text-base font-bold text-black">
              {totalChargeableWeight} kg
            </span>
          </div>
        )}

        {/* Packing Status Dropdown */}
        <div>
          <label className={labelClass}>Packing Status</label>
          <select
            value={packingStatus}
            onChange={(e) => setPackingStatus(e.target.value)}
            required
            className={inputClass}
          >
            <option value="">Select packing status</option>
            {PACKING_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={savingPackage}
          className="self-start text-sm px-4 py-1.5 rounded-lg bg-black text-white hover:bg-gray-800 transition disabled:opacity-50"
        >
          {savingPackage ? "Saving..." : "Save Package Info"}
        </button>
      </form>
    </div>
  );
};

export default JobDetailsForm;
