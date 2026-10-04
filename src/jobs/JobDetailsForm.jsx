import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import ItemNameInput from "./ItemNameInput";
import PaymentSection from "./PaymentSection";
import SectionCard from "./SectionCard";

const PACKING_OPTIONS = [
  { value: "packed_at_source", label: "Packed at client" },
  { value: "packed_at_office", label: "Packed at Office" },
];

const MAX_PACKAGES = 7;

const newObjectId = () =>
  Math.floor(Date.now() / 1000).toString(16) +
  Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");

const normName = (s) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");

const getDuplicateKeys = (pkg) => {
  const seen = new Map();
  const dups = new Set();
  pkg.items.forEach((it) => {
    const n = normName(it.itemName);
    if (!n) return;
    if (seen.has(n)) {
      dups.add(it.key);
      dups.add(seen.get(n));
    } else {
      seen.set(n, it.key);
    }
  });
  return dups;
};

const emptyItem = () => ({
  key: newObjectId(), // React key only, never sent to the server
  itemName: "",
  quantity: "",
  fragile: false,
});

const emptyPackage = () => ({
  _id: newObjectId(),
  unit: "cm",
  weight: "", // actual weight
  length: "",
  breadth: "",
  height: "",
  items: [emptyItem()],
});

const JobDetailsForm = ({ jobData, jobId, setJobData, items, setItems }) => {
  const [receiverName, setReceiverName] = useState(jobData.receiverName || "");
  const [receiverNumber, setReceiverNumber] = useState(
    jobData.receiverNumber || "",
  );
  const [receiverAddress, setReceiverAddress] = useState(
    jobData.receiverAddress || "",
  );
  const [receiverCity, setReceiverCity] = useState(jobData.receiverCity || "");
  const [receiverCountry, setReceiverCountry] = useState(
    jobData.receiverCountry || "",
  );
  const [receiverZipCode, setReceiverZipCode] = useState(
    jobData.receiverZipCode || "",
  );
  const [savingReceiver, setSavingReceiver] = useState(false);

  const [packingStatus, setPackingStatus] = useState(
    jobData.packingStatus || "",
  );

  // One box by default; saved boxes carry their items inside them
  const [packages, setPackages] = useState(() => {
    if (!jobData.packages?.length) return [emptyPackage()];

    const ids = new Set(jobData.packages.map((p) => String(p._id)));
    return jobData.packages.map((p, i) => {
      const mine = (items || []).filter(
        (it) =>
          String(it.packageId) === String(p._id) ||
          // legacy / orphaned items fall into the first box
          (i === 0 && !ids.has(String(it.packageId))),
      );
      return {
        ...p,
        unit: p.unit || "cm",
        weight: p.actualWeight ?? p.weight ?? "",
        items: mine.length
          ? mine.map((it) => ({
              key: it._id,
              itemName: it.itemName,
              quantity: it.quantity,
              fragile: it.fragile,
            }))
          : [emptyItem()],
      };
    });
  });

  const [savingPackage, setSavingPackage] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  // Server-calculated weights (volumetric + chargeable), shown on each card
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    api
      .get("/api/jobs/pickup/items/suggestions")
      .then((r) => setSuggestions(r.data.suggestions || []))
      .catch(() => {});
  }, []);

  // Debounced call to the weight calculator whenever dimensions/weights change
  const calcKey = JSON.stringify(
    packages.map(({ unit, weight, length, breadth, height }) => ({
      unit,
      actualWeight: weight,
      length,
      breadth,
      height,
    })),
  );

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await api.post("/api/jobs/pickup/weight/calculate", {
          packages: JSON.parse(calcKey),
        });
        if (!cancelled) setPreview(res.data);
      } catch {
        // preview is a convenience; the save route recalculates anyway
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [calcKey]);

  const updatePackageField = (index, field, value) => {
    setPackages((prev) =>
      prev.map((pkg, i) => (i === index ? { ...pkg, [field]: value } : pkg)),
    );
  };

  const addPackage = () => {
    setPackages((prev) =>
      prev.length >= MAX_PACKAGES ? prev : [...prev, emptyPackage()],
    );
  };

  const removePackage = (id) => {
    if (!window.confirm("Remove this box and its items?")) return;
    setPackages((prev) => prev.filter((p) => p._id !== id));
  };

  const addItem = (pi) => {
    setPackages((prev) =>
      prev.map((p, i) =>
        i === pi ? { ...p, items: [...p.items, emptyItem()] } : p,
      ),
    );
  };

  const updateItem = (pi, key, field, value) => {
    setPackages((prev) =>
      prev.map((p, i) =>
        i === pi
          ? {
              ...p,
              items: p.items.map((it) =>
                it.key === key ? { ...it, [field]: value } : it,
              ),
            }
          : p,
      ),
    );
  };

  const removeItem = (pi, key) => {
    setPackages((prev) =>
      prev.map((p, i) =>
        i === pi ? { ...p, items: p.items.filter((it) => it.key !== key) } : p,
      ),
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

    // Same item name twice in one box is not allowed
    const dupBox = packages.findIndex((p) => getDuplicateKeys(p).size > 0);
    if (dupBox !== -1) {
      toast.error(
        `Box ${dupBox + 1} has the same item twice. Combine their quantities.`,
      );
      return;
    }

    setSavingPackage(true);
    try {
      const payload = packages.map((pkg) => ({
        _id: pkg._id,
        unit: pkg.unit,
        actualWeight: parseFloat(pkg.weight) || 0,
        length: parseFloat(pkg.length) || 0,
        breadth: parseFloat(pkg.breadth) || 0,
        height: parseFloat(pkg.height) || 0,
        items: pkg.items.map(({ itemName, quantity, fragile }) => ({
          itemName: itemName.trim(),
          quantity: Number(quantity),
          fragile,
        })),
      }));

      const response = await api.put(`/api/jobs/pickup/${jobId}/packages`, {
        packages: payload,
        packingStatus,
      });
      setJobData((prev) => ({ ...prev, ...response.data.jobData }));
      setItems(response.data.items);
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
  const itemInputClass = "p-2 rounded-lg border border-gray-300 text-sm";
  const labelClass = "block text-xs font-medium text-gray-700 mb-1";

  const fmt = (n) =>
    n === undefined || n === null ? "--" : Number(n).toFixed(2);

  const boxCountBadge = (
    <span className="text-xs text-gray-600 bg-gray-100 border border-gray-200 rounded-full px-2.5 py-1 shrink-0">
      {packages.length} box{packages.length !== 1 ? "es" : ""}
    </span>
  );

  const isPaid = jobData.paymentStatus === "paid";
  const paymentBadge = (
    <span
      className={`text-xs rounded-full px-2.5 py-1 shrink-0 border ${
        isPaid
          ? "bg-black text-white border-black"
          : "bg-gray-100 text-gray-600 border-gray-200"
      }`}
    >
      {isPaid
        ? `Paid · ${jobData.paymentMethod === "upi" ? "UPI" : "Cash"}`
        : "Not paid"}
    </span>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* 1. RECEIVER DETAILS */}
      <SectionCard
        step={1}
        title="Receiver Details"
        subtitle="Who the parcel is going to"
      >
        <form onSubmit={handleSaveReceiver} className="flex flex-col gap-2">
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
            className="self-start mt-1 text-sm px-4 py-1.5 rounded-lg bg-black text-white hover:bg-gray-800 transition disabled:opacity-50"
          >
            {savingReceiver ? "Saving..." : "Save Receiver Details"}
          </button>
        </form>
      </SectionCard>

      {/* 2. PACKAGE INFO */}
      <SectionCard
        step={2}
        title="Package Info"
        subtitle="Boxes, their items and weights"
        right={boxCountBadge}
      >
        <form onSubmit={handleSavePackage} className="flex flex-col gap-3">
          {/* Box cards */}
          {packages.map((pkg, index) => {
            const unit = pkg.unit || "cm";
            const calc = preview?.packages?.[index];
            const dupKeys = getDuplicateKeys(pkg);

            return (
              <div
                key={pkg._id}
                className="border border-gray-200 rounded-lg p-3 bg-gray-50"
              >
                <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-black">
                    Box {index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={unit}
                      onChange={(e) =>
                        updatePackageField(index, "unit", e.target.value)
                      }
                      className="p-1.5 rounded-lg border border-gray-300 text-xs bg-white"
                    >
                      <option value="cm">Centimeter</option>
                      <option value="in">Inch</option>
                    </select>
                    {packages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePackage(pkg._id)}
                        className="text-xs px-2 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    ["weight", "Actual Weight (kg)", "0.0"],
                    ["length", `Length (${unit})`, "L"],
                    ["breadth", `Breadth (${unit})`, "B"],
                    ["height", `Height (${unit})`, "H"],
                  ].map(([field, label, ph]) => (
                    <div key={field}>
                      <label className={labelClass}>{label}</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder={ph}
                        value={pkg[field]}
                        required
                        onChange={(e) =>
                          updatePackageField(index, field, e.target.value)
                        }
                        className={`${inputClass} bg-white`}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-2">
                  <span className="flex-1 text-xs bg-white border border-gray-200 rounded px-2 py-1.5">
                    Vol. Weight: <strong>{fmt(calc?.volWeight)} kg</strong>
                  </span>
                  <span className="flex-1 text-xs font-medium text-black bg-gray-200 rounded px-2 py-1.5">
                    Charge Weight: <strong>{fmt(calc?.weight)} kg</strong>
                  </span>
                </div>

                {/* Items inside this box */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs font-semibold text-black mb-2">
                    Items in this box
                  </p>
                  <div className="flex flex-col gap-2">
                    {pkg.items.map((it) => (
                      <div
                        key={it.key}
                        className="flex flex-wrap items-center gap-2"
                      >
                        <div className="w-40">
                          <ItemNameInput
                            value={it.itemName}
                            onChange={(v) =>
                              updateItem(index, it.key, "itemName", v)
                            }
                            suggestions={suggestions}
                            placeholder="Item name"
                            required
                            className={`${itemInputClass} w-full bg-white ${
                              dupKeys.has(it.key) ? "border-red-500!" : ""
                            }`}
                          />
                        </div>
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          required
                          value={it.quantity}
                          onChange={(e) =>
                            updateItem(
                              index,
                              it.key,
                              "quantity",
                              e.target.value,
                            )
                          }
                          className={`${itemInputClass} w-20 bg-white`}
                        />
                        <label className="flex items-center gap-1.5 text-sm text-gray-600">
                          <input
                            type="checkbox"
                            checked={it.fragile}
                            onChange={(e) =>
                              updateItem(
                                index,
                                it.key,
                                "fragile",
                                e.target.checked,
                              )
                            }
                          />
                          Fragile
                        </label>
                        {pkg.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index, it.key)}
                            className="text-xs px-2 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {dupKeys.size > 0 && (
                    <p className="text-xs text-red-600 mt-2">
                      The same item is listed more than once in this box.
                      Combine them into one row with the total quantity.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => addItem(index)}
                    className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 transition"
                  >
                    + Add item
                  </button>
                </div>
              </div>
            );
          })}

          {packages.length < MAX_PACKAGES && (
            <button
              type="button"
              onClick={addPackage}
              className="self-start text-sm px-4 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
            >
              + Add another box
            </button>
          )}

          {/* Total Chargeable Weight directly above Packing Status */}
          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
            <span className="text-sm font-semibold text-gray-700">
              Total Chargeable Weight:
            </span>
            <span className="text-base font-bold text-black">
              {fmt(preview?.totalChargeableWeight)} kg
            </span>
          </div>

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
      </SectionCard>

      {/* 3. PAYMENT */}
      <SectionCard
        step={3}
        title="Payment"
        subtitle="Paid or not, method and proof"
        right={paymentBadge}
      >
        <PaymentSection
          jobData={jobData}
          jobId={jobId}
          setJobData={setJobData}
        />
      </SectionCard>
    </div>
  );
};

export default JobDetailsForm;
