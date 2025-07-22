import React from "react";
import {
  Box,
  Spinner,
  Text,
  Card,
  BlockStack,
  SkeletonBodyText,
  ProgressBar as PolarisProgressBar,
  InlineStack,
  Badge,
} from "@shopify/polaris";

import { VIDEO_STATUS } from "../../utils/videoConstants";

// Status Helpers
const getStatusMessage = (status) => {
  switch (status) {
    case VIDEO_STATUS.CREATED:
      return "Video creation initiated...";
    case VIDEO_STATUS.IN_PROGRESS:
      return "Generating your video...";
    case VIDEO_STATUS.COMPLETED:
      return "Video generated successfully!";
    case VIDEO_STATUS.FAILED:
    case VIDEO_STATUS.ERROR:
      return "Video generation FAILED";
    default:
      return "IN_PROGRESS...";
  }
};

const getStatusTone = (status) => {
  switch (status) {
    case VIDEO_STATUS.CREATED:
      return "info";
    case VIDEO_STATUS.IN_PROGRESS:
      return "attention";
    case VIDEO_STATUS.COMPLETED:
      return "success";
    case VIDEO_STATUS.FAILED:
    case VIDEO_STATUS.ERROR:
      return "critical";
    default:
      return "subdued";
  }
};

export const LoadingStates = {
  PageLoader: ({ message = "Loading..." }) => (
    <Box padding="800">
      <BlockStack gap="400" align="center">
        <Spinner accessibilityLabel="Loading" size="large" />
        <Text variant="headingMd" as="h2" alignment="center">
          {message}
        </Text>
      </BlockStack>
    </Box>
  ),

  CardLoader: ({ message = "Loading content..." }) => (
    <BlockStack gap="400">
      <SkeletonBodyText lines={1} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
        }}
      >
        {[...Array(4)].map((_, index) => (
          <Card key={index}>
            <Box padding="200">
              <BlockStack gap="200">
                <div
                  style={{
                    height: "200px",
                    backgroundColor: "#f6f6f7",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {/* <Spinner size="small" /> */}
                </div>
                <SkeletonBodyText lines={1} />
                <div
                  style={{
                    height: "32px",
                    backgroundColor: "#f6f6f7",
                    borderRadius: "4px",
                  }}
                />
              </BlockStack>
            </Box>
          </Card>
        ))}
      </div>
    </BlockStack>
  ),

  ButtonLoader: ({ size = "small" }) => (
    <InlineStack gap="200" blockAlign="center">
      <Spinner accessibilityLabel="IN_PROGRESS" size={size} />
      <Text variant="bodyMd" as="span">
        IN_PROGRESS...
      </Text>
    </InlineStack>
  ),

  VideoGenerationLoader: ({ progress, message, status }) => (
    <BlockStack gap="400" align="center">
      <div style={{ position: "relative", display: "inline-block" }}>
        <Spinner accessibilityLabel="Generating video" size="large" />
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
          >
            {progress}%
          </div>
        )}
      </div>

      <BlockStack gap="200" align="center">
        <Text variant="bodyMd" as="p" alignment="center" tone="subdued">
          {message || getStatusMessage(status)}
        </Text>
        {status && (
          <Badge tone={getStatusTone(status)}>{status.replace("_", " ")}</Badge>
        )}
      </BlockStack>

      {progress > 0 && (
        <Box minWidth="200px">
          <PolarisProgressBar progress={progress} size="medium" tone="primary" />
        </Box>
      )}
    </BlockStack>
  ),

  ProductGridSkeleton: ({ count = 8 }) => (
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
              {/* <Spinner size="small" /> */}
            </div>
            <div
              style={{
                height: "20px",
                backgroundColor: "var(--p-color-bg-surface-secondary)",
                borderRadius: "var(--p-border-radius-100)",
                opacity: 0.6,
              }}
            />
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
  ),

  FileUploadLoader: ({ filesCount = 0 }) => (
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
  ),
};
export const getProgressByStatus = (status) => {
  switch (status) {
    case VIDEO_STATUS.CREATED:
      return 20;
    case VIDEO_STATUS.IN_PROGRESS:
      return 60;
    case VIDEO_STATUS.COMPLETED:
      return 100;
    default:
      return 0;
  }
};