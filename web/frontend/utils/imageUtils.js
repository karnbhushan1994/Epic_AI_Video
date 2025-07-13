export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch("/api/v1/app/upload", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || "Upload failed");
  }

  return json.url;
};
