// src/components/common/LoadingStates.js
import React from "react";
import {
  Spinner,
  SkeletonBodyText,
  Card,
  Box,
  BlockStack,
  Text,
  InlineStack,
  ProgressBar as PolarisProgressBar,
} from "@shopify/polaris";

export const LoadingStates = {
  PageLoader: ({ message = "Loading..." }) => (
    <Box padding="800">
      <BlockStack gap="400" align="center">
        <Spinner accessibilityLabel="Loading" size="large" />
        <Text variant="headingMd" as="h2" alignment="center">{message}</Text>
      </BlockStack>
    </Box>
  ),

  CardLoader: ({ message = "Loading content..." }) => (
    <BlockStack gap="400">
      <SkeletonBodyText lines={1} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        {[...Array(4)].map((_, index) => (
          <Card key={index}>
            <Box padding="200">
              <BlockStack gap="200">
                <div style={{ height: "200px", backgroundColor: "#f6f6f7", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Spinner size="small" />
                </div>
                <SkeletonBodyText lines={1} />
                <div style={{ height: "32px", backgroundColor: "#f6f6f7", borderRadius: "4px" }} />
              </BlockStack>
            </Box>
          </Card>
        ))}
      </div>
    </BlockStack>
  ),

  ProductGridSkeleton: ({ count = 8 }) => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
      {[...Array(count)].map((_, index) => (
        <Card key={index} sectioned>
          <BlockStack gap="300">
            <div style={{ height: "200px", backgroundColor: "var(--p-color-bg-surface-secondary)", borderRadius: "var(--p-border-radius-200)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Spinner size="small" />
            </div>
            <div style={{ height: "20px", backgroundColor: "var(--p-color-bg-surface-secondary)", borderRadius: "var(--p-border-radius-100)", opacity: 0.6 }} />
            <div style={{ height: "36px", backgroundColor: "var(--p-color-bg-surface-secondary)", borderRadius: "var(--p-border-radius-200)", opacity: 0.4 }} />
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
