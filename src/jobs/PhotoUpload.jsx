import { useState, useEffect } from "react";
import { X, Trash2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import PhotoPicker from "./PhotoPicker";

const LABEL_OPTIONS = [
  { value: "id_proof", label: "ID Proof" },
  { value: "waybill", label: "Waybill" },
  { value: "invoice", label: "Invoice" },
  { value: "packed_box", label: "Packed Box" },
  { value: "item_evidence", label: "Item Evidence" },
];

const LABEL_LOOKUP = LABEL_OPTIONS.reduce((acc, opt) => {
  acc[opt.value] = opt.label;
  return acc;
}, {});

const PhotoUpload = ({ jobId, locked = false }) => {
  const [label, setLabel] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [photos, setPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const response = await api.get(`/api/jobs/pickup/${jobId}/photos`);
        setPhotos(response.data.photos || []);
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to load photos");
      } finally {
        setPhotosLoading(false);
      }
    };

    fetchPhotos();
  }, [jobId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!label) {
      toast.error("Pick a label first");
      return;
    }
    if (!file) {
      toast.error("Pick a photo first");
      return;
    }

    const formData = new FormData();
    formData.append("photo", file);
    formData.append("label", label);

    setUploading(true);
    try {
      const response = await api.post(
        `/api/jobs/pickup/${jobId}/photos`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      toast.success(response.data.message || "Photo uploaded");
      setPhotos((prev) => [...prev, response.data.photo]);
      setLabel("");
      setFile(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId) => {
    setDeletingId(photoId);
    try {
      const response = await api.delete(
        `/api/jobs/pickup/${jobId}/photos/${photoId}`,
      );
      toast.success(response.data.message || "Photo deleted");
      setPhotos((prev) => prev.filter((p) => p._id !== photoId));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete photo");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  // payment proofs are managed in the Payment section, not in this grid
  const visiblePhotos = photos.filter((p) => p.label !== "payment_proof");

  const grouped = visiblePhotos.reduce((acc, photo) => {
    (acc[photo.label] = acc[photo.label] || []).push(photo);
    return acc;
  }, {});

  return (
    <div>
      {!locked && (
        <form onSubmit={handleUpload} className="flex flex-col gap-3">
          <select
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="p-2 rounded-lg border border-gray-300 text-sm w-full"
          >
            <option value="">Select label</option>
            {LABEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <PhotoPicker file={file} onChange={setFile} disabled={uploading} />

          <button
            type="submit"
            disabled={uploading}
            className="self-start text-sm px-4 py-1.5 rounded-lg bg-black text-white hover:bg-gray-800 transition disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload photo"}
          </button>
        </form>
      )}

      {locked && (
        <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          Job is locked — photos can no longer be added or removed.
        </p>
      )}

      {/* Gallery */}
      <div className="mt-5">
        {photosLoading && (
          <div className="flex justify-center py-6">
            <Loader2 className="size-5 animate-spin text-gray-400" />
          </div>
        )}

        {!photosLoading && visiblePhotos.length === 0 && (
          <p className="text-sm text-gray-400">No photos uploaded yet.</p>
        )}

        {!photosLoading &&
          Object.entries(grouped).map(([labelKey, group]) => (
            <div key={labelKey} className="mb-5">
              <p className="text-xs font-medium text-gray-500 mb-2">
                {LABEL_LOOKUP[labelKey] || labelKey} — {group.length} photo
                {group.length !== 1 ? "s" : ""}
              </p>

              <div className="flex flex-row flex-wrap w-full gap-2">
                {group.map((photo) => (
                  <div
                    key={photo._id}
                    className="relative group w-24 h-24 sm:w-28 sm:h-28 shrink-0"
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewPhoto(photo)}
                      className="block w-full h-full rounded-lg border border-gray-200 overflow-hidden"
                    >
                      <img
                        src={photo.fileUrl}
                        alt={LABEL_LOOKUP[labelKey] || labelKey}
                        className="w-full h-full object-cover"
                      />
                    </button>

                    {!locked && (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(photo._id)}
                        disabled={deletingId === photo._id}
                        title="Delete photo"
                        className="absolute top-1 right-1 flex items-center justify-center size-6 rounded-full bg-white/90 border border-gray-200 text-gray-500 hover:text-red-600 hover:bg-white transition opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      >
                        {deletingId === photo._id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Trash2 className="size-3" />
                        )}
                      </button>
                    )}

                    {confirmDeleteId === photo._id && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 rounded-lg bg-black/70 p-2">
                        <p className="text-xs text-white text-center">
                          Delete this photo?
                        </p>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs px-2 py-1 rounded-md bg-white text-gray-700 hover:bg-gray-100 transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(photo._id)}
                            className="text-xs px-2 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>

      {/* Lightbox */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <button
            type="button"
            onClick={() => setPreviewPhoto(null)}
            className="absolute top-4 right-4 flex items-center justify-center size-9 rounded-full bg-white/90 text-gray-700 hover:bg-white transition"
          >
            <X className="size-5" />
          </button>
          <img
            src={previewPhoto.fileUrl}
            alt={LABEL_LOOKUP[previewPhoto.label] || previewPhoto.label}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
