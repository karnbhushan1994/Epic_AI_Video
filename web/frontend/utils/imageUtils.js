export const uploadImage = async (file) => {
  const filename = `${Date.now()}-${file.name}`;

  // Step 1: Get a presigned URL from your backend
  const res = await fetch(`/api/v1/app/s3-presigned-url?filename=${encodeURIComponent(filename)}`);

  if (!res.ok) {
    const errorText = await res.text();
    console.error("❌ Failed to get presigned URL:", errorText);
    throw new Error("Failed to get S3 presigned URL");
  }

  const { uploadUrl, fileUrl } = await res.json();

  // Step 2: Upload file to S3 using presigned PUT URL
  try {
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      console.error("❌ Upload failed:", err);
      throw new Error("Upload to S3 failed");
    }

    console.log("✅ Upload successful:", fileUrl);
    return fileUrl;
  } catch (err) {
    console.error("❌ S3 upload failed:", err);
    throw new Error("S3 upload error: " + err.message);
  }
};
