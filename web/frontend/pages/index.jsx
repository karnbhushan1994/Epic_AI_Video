import React from "react";
import {
  Card,
  Text,
  Page,
  BlockStack,
  Banner,
  InlineStack,
  Icon,
  Grid,
  Box,
  Button,
  SkeletonBodyText,
  SkeletonDisplayText,
  SkeletonThumbnail,
} from "@shopify/polaris";
import { ImageIcon, PlayIcon, PlusIcon } from "@shopify/polaris-icons";
import useDashboard from "../hooks/useDashboard";

// Template Card Skeleton
const TemplateCardSkeleton = () => (
  <Card>
    <Box padding="400">
      <BlockStack gap="300">
        <InlineStack gap="200" align="center">
          <SkeletonThumbnail size="small" />
          <BlockStack gap="050">
            <SkeletonDisplayText size="small" />
            <SkeletonBodyText lines={1} />
          </BlockStack>
        </InlineStack>
        <SkeletonBodyText lines={2} />
        <Box paddingBlockStart="200">
          <SkeletonDisplayText size="medium" />
        </Box>
      </BlockStack>
    </Box>
  </Card>
);

const Dashboard = () => {
  const { dashboardData, loading, error } = useDashboard();

  if (error) {
    return (
      <Page title="Dashboard">
        <Banner tone="critical">
          <p>There was an error loading the dashboard.</p>
        </Banner>
      </Page>
    );
  }

  return (
    <Page
      fullWidth
      title="Dashboard"
      subtitle=""
      primaryAction={{
        content: "Create Video",
        icon: PlusIcon,
        onAction: () => {
          window.location.href = "/video";
        },
      }}
      secondaryActions={[
        {
          content: "Create Image",
          icon: PlusIcon,
          onAction: () => {
            window.location.href = "/image";
          },
        },
      ]}
    >
      <BlockStack gap="400">
        {/* Info Banner (no height forcing) */}
        <Banner tone="info">
          <InlineStack gap="200" align="right">
            {loading ? (
              <SkeletonBodyText lines={1} />
            ) : (
              <Text as="p" variant="bodyMd">
                You’ve created <strong>{dashboardData.totalCreations}</strong>{" "}
                templates this month. Great job!{" "}
                <Text
                  as="span"
                  variant="bodyMd"
                  tone="accent"
                  fontWeight="medium"
                  underline
                >
                  <a
                    href="/library"
                    style={{
                      fontSize: "14px", // Equivalent to bodyMd
                      fontWeight: 500, // Medium
                      color: "#007bff", // Accent tone (adjust based on your theme)
                      textDecoration: "underline",
                      cursor: "pointer",
                    }}
                  >
                    View them in your Library
                  </a>
                </Text>
                .
              </Text>
            )}
          </InlineStack>
        </Banner>

        {/* Section Heading with matching skeleton */}
        {loading ? (
          <SkeletonDisplayText size="medium" />
        ) : (
          <Text variant="headingLg" as="h2">
            What do you want to do today?
          </Text>
        )}

        {/* Content Grid */}
        <Grid>
          {[0, 1].map((i) => (
            <Grid.Cell
              key={i}
              columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}
            >
              {loading ? (
                <TemplateCardSkeleton />
              ) : (
                <Card>
                  <Box padding="400">
                    <BlockStack gap="300">
                      <InlineStack gap="200" align="center">
                        <Box
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "8px",
                            backgroundColor: "#e3f2fd",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon
                            source={i === 0 ? PlayIcon : ImageIcon}
                            tone={i === 0 ? "primary" : undefined}
                          />
                        </Box>
                        <BlockStack gap="050"  style={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                            }}>
                          <Text
                            variant="bodyLg"
                            fontWeight="semibold"
                          >
                            {i === 0
                              ? "Create an AI Video"
                              : "Edit Images using AI"}
                          </Text>
                        </BlockStack>
                      </InlineStack>

                      <Text variant="bodySm">
                        {i === 0
                          ? "Create engaging video content with our collection of professional templates."
                          : "Edit existing images using AI with our collection of professional templates."}
                      </Text>

                      <Button
                        primary
                        fullWidth
                        icon={i === 0 ? PlayIcon : ImageIcon}
                        onClick={() =>
                          (window.location.href = i === 0 ? "/video" : "/image")
                        }
                      >
                        {i === 0
                          ? "Browse Video Templates"
                          : "Browse Image Templates"}
                      </Button>
                    </BlockStack>
                  </Box>
                </Card>
              )}
            </Grid.Cell>
          ))}
        </Grid>
      </BlockStack>
    </Page>
  );
};

export default Dashboard;
