import { useEffect, useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import { podFileNameFromUrl } from "../utils/podFileName";

// Short context message that goes with the PDF (attached file or link).
// Lines are skipped when the job doesn't have that detail yet.
const buildMessage = (job, url) => {
  const receiver = [job?.receiverName, job?.receiverCity, job?.receiverCountry]
    .filter(Boolean)
    .join(", ");

  const lines = [
    "📄 *POD Slip*",
    job?.clientName && `👤 *Client:* ${job.clientName}`,
    receiver && `📦 *Receiver:* ${receiver}`,
    job?.assignedTo && `🚚 *Pickup by:* ${job.assignedTo}`,
  ];

  // The link only goes in the message when we are not attaching the file
  if (url) {
    lines.push("", `🔗 ${url}`);
  }

  return lines
    .filter((l) => l !== false && l != null && l !== undefined)
    .join("\n");
};

// True when this browser can hand a PDF file to the system share sheet
// (phones, and desktop browsers that support it, e.g. Chrome/Edge on Windows).
const canShareFiles = () => {
  try {
    return (
      typeof navigator.canShare === "function" &&
      navigator.canShare({
        files: [new File(["x"], "test.pdf", { type: "application/pdf" })],
      })
    );
  } catch {
    return false;
  }
};

// Render with key={url} so a new PDF starts from a clean state.
const SharePodButton = ({ url, fileName: fileNameProp, job }) => {
  const supportsFiles = useMemo(() => canShareFiles(), []);
  const fileName = fileNameProp || podFileNameFromUrl(url);
  const [file, setFile] = useState(null);
  const [failed, setFailed] = useState(false);

  const preparing = supportsFiles && !file && !failed;

  // Download the PDF ahead of time. navigator.share has to be called straight
  // from the click, and iOS rejects it if a fetch is awaited first.
  useEffect(() => {
    if (!supportsFiles || !url) return;
    let cancelled = false;

    const prepare = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch PDF");
        const blob = await response.blob();
        if (!cancelled) {
          setFile(new File([blob], fileName, { type: "application/pdf" }));
        }
      } catch {
        if (!cancelled) setFailed(true); // falls back to sharing the link
      }
    };

    prepare();
    return () => {
      cancelled = true;
    };
  }, [url, fileName, supportsFiles]);

  const shareLink = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(buildMessage(job, url))}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleShare = async () => {
    // Always try the real PDF first (no link in the text, the file is attached)
    if (file) {
      try {
        await navigator.share({
          files: [file],
          title: fileName,
          text: buildMessage(job),
        });
      } catch (err) {
        // AbortError just means the person closed the share sheet
        if (err?.name !== "AbortError") {
          toast.error('Couldn\'t share the file. Try "Send link" or Download.');
        }
      }
      return;
    }

    // File sharing isn't available (or the file couldn't be prepared): send the link
    shareLink();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        disabled={preparing}
        className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50 cursor-pointer"
      >
        <MessageCircle className="size-4" />
        {preparing ? "Preparing..." : "Share on WhatsApp"}
      </button>

      {/* Escape hatch for machines whose share dialog doesn't list WhatsApp */}
      {supportsFiles && (
        <button
          type="button"
          onClick={shareLink}
          className="text-sm px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition cursor-pointer"
        >
          Send link
        </button>
      )}
    </>
  );
};

export default SharePodButton;
