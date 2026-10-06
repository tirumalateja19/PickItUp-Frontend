const DEFAULT_CC = import.meta.env.VITE_DEFAULT_COUNTRY_CODE || "91";
const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;

export const toWaNumber = (phone = "") => {
  const digits = String(phone).replace(/\D/g, "").replace(/^0+/, "");
  return digits.length === 10 ? DEFAULT_CC + digits : digits;
};

export const buildJobMessage = (job) =>
  [
    "📦 *NEW PICKUP JOB ASSIGNED*",
    "-----------------------------",
    `👤 *Client:* ${job.clientName}`,
    `📞 *Phone:* ${job.clientNumber}`,
    `📍 *Address:* ${[job.clientAddress, job.clientCity].filter(Boolean).join(", ")}`,
    job.approxWeight && `⚖️ *Approx Weight:* ${job.approxWeight} kg`,
    job.networkName && `🚚 *Network:* ${job.networkName}`,
    "",
    job.mapLink && `🗺️ *Map:* ${job.mapLink}`,
    `🔗 *Job Link:* ${APP_URL}/partner/jobs/${job._id}`,
  ]
    .filter((l) => l !== false && l != null && l !== undefined)
    .join("\n");

export const openWhatsApp = (partnerPhone, job) => {
  const number = toWaNumber(partnerPhone);
  if (!number) return false;
  const url = `https://wa.me/${number}?text=${encodeURIComponent(
    buildJobMessage(job),
  )}`;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
};
