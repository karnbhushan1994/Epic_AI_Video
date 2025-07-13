// utils/downloadFile.js

export async function downloadFileFromUrl(fileUrl, fileName = "generated-video.mp4") {
  try {
    const response = await fetch(fileUrl, { mode: "cors" });

    if (!response.ok) {
      throw new Error(`FAILED to fetch file: ${response.status}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Download FAILED:", error);
    alert("Download FAILED: " + error.message);
  }
}
