export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("https://ai.epicapp.store/api/v1/app/upload", {
    method: "POST",
    body: formData,
    credentials: "include",
    headers: {
      "Cache-Control": "no-cache",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${errorText}`);
  }

  const data = await response.json();

  if (!data.fileUrl) {
    throw new Error("No file URL returned from server");
  }

  return data.fileUrl;
};


// Upload an image from a remote URL (server fetches it and pushes to S3)
export const uploadImageFromUrl = async (imageUrl) => {
  const response = await fetch("https://ai.epicapp.store/api/v1/app/upload-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
    body: JSON.stringify({ imageUrl }),
    credentials: "include",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload from URL failed: ${errorText}`);
  }

  const data = await response.json();

  if (!data.fileUrl) {
    throw new Error("No file URL returned from upload-url endpoint");
  }

  return data.fileUrl;
};