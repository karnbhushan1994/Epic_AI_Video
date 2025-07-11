// Loaders.jsx
import React from "react";
import {
  Spinner,
  Text,
  Box,
  Card,
  Badge,
  BlockStack,
  SkeletonBodyText,
  ProgressBar,
} from "@shopify/polaris";

const getStatusMessage = (status) => {
  switch (status) {
    case "PROCESSING":
      return "Removing background...";
    case "COMPLETED":
      return "Background removed successfully!";
    case "FAILED":
    case "ERROR":
      return "Background removal failed.";
    case "IDLE":
    default:
      return "Preparing...";
  }
};

const getStatusTone = (status) => {
  switch (status) {
    case "PROCESSING":
      return "attention";
    case "COMPLETED":
      return "success";
    case "FAILED":
    case "ERROR":
      return "critical";
    case "IDLE":
    default:
      return "subdued";
  }
};

export const LoadingStates = {
  PageLoader: ({ message }) => <Spinner />,
  CardLoader: ({ message }) => <SkeletonBodyText />,
  ProductGridSkeleton: ({ count = 4 }) => (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
        }}
      >
        {[...Array(count)].map((_, index) => (
          <Card key={index} sectioned>
            <BlockStack gap="300">
              {/* Image skeleton */}
              <div
                style={{
                  height: "200px",
                  backgroundColor: "var(--p-color-bg-surface-secondary)",
                  borderRadius: "var(--p-border-radius-200)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Spinner size="small" />
              </div>

              {/* Text skeleton */}
              <div
                style={{
                  height: "20px",
                  backgroundColor: "var(--p-color-bg-surface-secondary)",
                  borderRadius: "var(--p-border-radius-100)",
                  opacity: 0.6,
                }}
              />

              {/* Button skeleton */}
              <div
                style={{
                  height: "36px",
                  backgroundColor: "var(--p-color-bg-surface-secondary)",
                  borderRadius: "var(--p-border-radius-200)",
                  opacity: 0.4,
                }}
              />
            </BlockStack>
          </Card>
        ))}
      </div>
    </>
  ), // truncate or simplify
  BackgroundRemovalLoader: ({ progress, status }) => (
    <>
      {" "}
      <BlockStack gap="400" align="center">
        <div style={{ position: "relative", display: "inline-block" }}>
          <Spinner accessibilityLabel="Removing background" size="large" />
          {progress > 0 && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: "10px",
                fontWeight: "bold",
                color: "var(--p-color-text)",
              }}
            ></div>
          )}
        </div>

        {/* <BlockStack gap="200" align="center">
          <Text variant="bodyMd" as="p" alignment="center" tone="subdued">
            {getStatusMessage(status)}


          </Text>
          {status && (
            <Badge tone={getStatusTone(status)}>
              {status.replace("_", " ")}
            </Badge>
          )}
        </BlockStack> */}

        {progress > 0 && (
          <Box minWidth="200px">
            <ProgressBar progress={progress} size="small" tone="primary" />
          </Box>
        )}
      </BlockStack>
    </>
  ),
  FileUploadLoader: ({ filesCount = 0 }) => (
    <>
      <Box padding="400" background="bg-surface-secondary" borderRadius="200">
        <BlockStack gap="300" align="center">
          <Spinner accessibilityLabel="Uploading files" size="medium" />
          <Text variant="bodyMd" as="p" alignment="center">
            Uploading {filesCount} file{filesCount !== 1 ? "s" : ""}...
          </Text>
          <Text variant="bodySm" as="p" alignment="center" tone="subdued">
            Please wait while we process your images
          </Text>
        </BlockStack>
      </Box>
    </>
  ),
};

export default LoadingStates;
