import React from 'react';
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
  SkeletonThumbnail
} from '@shopify/polaris';
import {
  ImageIcon,
  PlayIcon,
  PlusIcon
} from '@shopify/polaris-icons';
import useDashboard from '../hooks/useDashboard';

// Reusable Skeleton Component for Template Cards
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

// Reusable Skeleton Component for the Banner
const BannerSkeleton = () => (
  <Card>
    <Box padding="300">
      <SkeletonBodyText lines={1} />
    </Box>
  </Card>
);

// Main Dashboard Component
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

  if (loading) {
    return (
      <Page
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening with your templates."
      >
        <BlockStack gap="400">
          <BannerSkeleton />
          <BlockStack gap="300">
            <SkeletonDisplayText size="medium" />
            <Grid>
              <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                <TemplateCardSkeleton />
              </Grid.Cell>
              <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
                <TemplateCardSkeleton />
              </Grid.Cell>
            </Grid>
          </BlockStack>
        </BlockStack>
      </Page>
    );
  }

  return (
    <Page
      title="Dashboard"
      subtitle="Welcome back! Here's what's happening with your templates."
      primaryAction={{
        content: 'Create Video',
        icon: PlusIcon,
        onAction: () => {
          window.location.href = '/video';
        }
      }}
      secondaryActions={[
        {
          content: 'Create Image',
          icon: PlusIcon,
          onAction: () => {
            window.location.href = '/image';
          }
        }
      ]}
    >
      <BlockStack gap="400">
        {/* Welcome Banner */}
        <Banner tone="info">
          <InlineStack gap="200" align="right">
            <Text variant="bodyMd">
              You've created {dashboardData.totalCreations} templates this month! Keep up the great work.
            </Text>
          </InlineStack>
        </Banner>

        {/* Template Categories */}
        <BlockStack gap="300">
          <Text variant="headingLg" as="h2">Create Content</Text>
          <Grid>
            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
              <Card>
                <Box padding="400">
                  <BlockStack gap="300">
                    <InlineStack gap="200" align="center">
                      <div style={{
                        padding: '12px',
                        borderRadius: '8px',
                        backgroundColor: '#e3f2fd'
                      }}>
                        <Icon source={PlayIcon} tone="primary" />
                      </div>
                      <BlockStack gap="050">
                        <Text variant="bodyLg" fontWeight="semibold">Video Templates</Text>
                      </BlockStack>
                    </InlineStack>

                    <Text variant="bodySm">
                      Create engaging video content with our collection of professional templates.
                    </Text>

                    <Button
                      primary
                      fullWidth
                      icon={PlayIcon}
                      onClick={() => window.location.href = '/video'}
                    >
                      Browse Video Templates
                    </Button>
                  </BlockStack>
                </Box>
              </Card>
            </Grid.Cell>

            <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
              <Card>
                <Box padding="400">
                  <BlockStack gap="300">
                    <InlineStack gap="200" align="center">
                      <div style={{
                        padding: '12px',
                        borderRadius: '8px',
                         backgroundColor: '#e3f2fd'
                      }}>
                        <Icon source={ImageIcon}  />
                      </div>
                      <BlockStack gap="050">
                        <Text variant="bodyLg" fontWeight="semibold">Image Templates</Text>
                      </BlockStack>
                    </InlineStack>

                    <Text variant="bodySm">
                      Create engaging image content with our collection of professional templates.
                    </Text>

                    <Button
                      primary
                      fullWidth
                      icon={ImageIcon}
                      onClick={() => window.location.href = '/image'}
                    >
                      Browse Image Templates
                    </Button>
                  </BlockStack>
                </Box>
              </Card>
            </Grid.Cell>
          </Grid>
        </BlockStack>
      </BlockStack>
    </Page>
  );
};

export default Dashboard;
