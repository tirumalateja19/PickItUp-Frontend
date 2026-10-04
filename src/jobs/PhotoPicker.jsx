import { useState, useRef, useEffect } from "react";
import { Camera, ImagePlus, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const MAX_DIM = 1600;
const SKIP_COMPRESS_UNDER = 1024 * 1024; // 1 MB
const SAFE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Shrinks big camera/gallery photos so they stay under the 5 MB upload limit.
// If anything fails, the original file is used.
const compressImage = (file) =>
  new Promise((resolve) => {
    if (SAFE_TYPES.includes(file.type) && file.size <= SKIP_COMPRESS_UNDER) {
      return resolve(file);
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) return resolve(file);
          const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
          resolve(new File([blob], name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.85,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });

// Camera button is shown only on touch devices; on a laptop the browser
// ignores "capture" and would just open the file picker anyway.
const hasTouch =
  typeof window !== "undefined" &&
  window.matchMedia?.("(pointer: coarse)").matches;

const PhotoPicker = ({ file, onChange, disabled = false }) => {
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const [preview, setPreview] = useState({ file: null, url: null });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    const reader = new FileReader();
    reader.onload = () => {
      if (!cancelled) setPreview({ file, url: reader.result });
    };
    reader.readAsDataURL(file);
    return () => {
      cancelled = true;
    };
  }, [file]);

  const previewUrl = preview.file === file ? preview.url : null;

  const handlePick = async (e) => {
    const picked = e.target.files?.[0];
    e.target.value = ""; // lets the same photo be picked again
    if (!picked) return;

    setProcessing(true);
    try {
      onChange(await compressImage(picked));
    } catch {
      toast.error("Could not read that photo, try another");
    } finally {
      setProcessing(false);
    }
  };

  const busy = disabled || processing;

  return (
    <div className="flex flex-col gap-2">
      {/* hidden inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePick}
        className="hidden"
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        onChange={handlePick}
        className="hidden"
      />

      <div className="flex flex-wrap gap-2">
        {hasTouch && (
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={busy}
            className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-gray-300 text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition disabled:opacity-50"
          >
            <Camera className="size-4 shrink-0" />
            Take photo
          </button>
        )}
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          disabled={busy}
          className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-gray-300 text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition disabled:opacity-50"
        >
          <ImagePlus className="size-4 shrink-0" />
          {hasTouch ? "Choose from gallery" : "Choose a photo"}
        </button>
      </div>

      {processing && (
        <p className="flex items-center gap-2 text-xs text-gray-500">
          <Loader2 className="size-3 animate-spin" /> Preparing photo...
        </p>
      )}

      {file && previewUrl && !processing && (
        <div className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 bg-white">
          <img
            src={previewUrl}
            alt="Selected"
            className="size-14 rounded-md object-cover shrink-0"
          />
          <span className="flex-1 min-w-0 text-sm text-gray-600 truncate">
            {file.name}
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            title="Remove selected photo"
            className="flex items-center justify-center size-7 rounded-full bg-gray-100 text-gray-500 hover:text-red-600 hover:bg-gray-200 transition disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PhotoPicker;
