import React, { useState } from "react";
import {
  Grid,
  Text,
  BlockStack,
  Box,
  Button,
  Spinner,
  Tooltip,
} from "@shopify/polaris";
import DownloadIcon from "../common/icon/DownloadIcon";

const MediaCardItem = ({ title, description, source, type, status }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (src, title) => {
    setIsDownloading(true);
    const proxyUrl = `/api/v1/app/proxy-download?url=${encodeURIComponent(
      src
    )}&filename=${encodeURIComponent(title || "download")}`;

    try {
      const response = await fetch(proxyUrl, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to download file.");

      const blob = await response.blob();
      const contentType = response.headers.get("content-type");
      const extension = contentType?.split("/")[1] || "bin";
      const fileName = `${title || "download"}.${extension}`;

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const isVideo = (src) =>
    typeof src === "string" && src.match(/\.(mp4|webm|ogg)$/i);

  const showSpinner = status === "IN_PROGRESS";
  const isFailed = status === "FAILED";

  return (
    <Grid.Cell columnSpan={{ xs: 6, sm: 4, md: 3, lg: 2, xl: 2 }}>
      <div
        style={{
          height: "100%",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e1e3e5",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "220px",
            backgroundColor: "#f6f6f7",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {type === "video" ? (
            <video
              src={source}
              title={title}
              aria-label={title}
              onLoadedData={() => setIsLoaded(true)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
              controls={isLoaded}
            />
          ) : (
            <img
              src={source}
              alt={title}
              onLoad={() => setIsLoaded(true)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          )}

          {showSpinner && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                // backgroundColor: "rgba(255,255,255,0.75)",
                padding: "12px",
                borderRadius: "8px",
              }}
            >
              <Spinner accessibilityLabel="Processing content" size="small" />
              <Text variant="bodySm" as="p" tone="subdued">
                Generating...
              </Text>
            </div>
          )}

          {isFailed && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 2,
                padding: "12px 16px",
                textAlign: "center",
                maxWidth: "90%",
              }}
            >
              <Text variant="bodySm" tone="critical">
                Video generation failed.&nbsp; Please&nbsp;
                <a
                  href="/video"
                  style={{
                    color: "#d72c0d",
                    textDecoration: "underline",
                    fontWeight: 500,
                  }}
                >
                  try again
                </a>
                .
              </Text>
            </div>
          )}
        </div>

        <div style={{ padding: "16px" }}>
          <BlockStack gap="300">
            <Tooltip content={title}>
              <p style={{ fontSize: "12px", fontWeight: 600 }}>{title}</p>
            </Tooltip>
          </BlockStack>
        </div>

        <Box padding="400">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <Tooltip content="Download">
                <Button
                  disabled={showSpinner || isFailed}
                  variant="secondary"
                  size="small"
                  icon={<DownloadIcon />}
                  onClick={() => handleDownload(source, title)}
                  loading={isDownloading}
                />
              </Tooltip>
            </div>
          </div>
        </Box>
      </div>
    </Grid.Cell>
  );
};

export default MediaCardItem;
