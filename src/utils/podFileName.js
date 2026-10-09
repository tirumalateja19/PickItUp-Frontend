// The Cloudinary public_id ends with the PDF's name, so the name can be read
// straight off the URL. Old slips just show their old name.
export const podFileNameFromUrl = (url, fallback = "pod-slip.pdf") => {
  try {
    const last = new URL(url).pathname.split("/").pop();
    return last ? decodeURIComponent(last) : fallback;
  } catch {
    return fallback;
  }
};
