import { Grid, SkeletonThumbnail, SkeletonBodyText, BlockStack, Box, SkeletonDisplayText } from "@shopify/polaris";

const MediaCardSkeleton = () => (
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
      {/* Placeholder media area */}
      <div
        style={{
          width: "100%",
          height: "220px",
          backgroundColor: "#f6f6f7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SkeletonThumbnail size="large" />
      </div>

      {/* Title placeholder */}
      <div style={{ padding: "16px" }}>
        <BlockStack gap="300">
          <SkeletonDisplayText size="small" />
        </BlockStack>
      </div>

      {/* Button placeholder */}
      <Box padding="400">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "30%",
              height: "40px",
              borderRadius: "4px",
              backgroundColor: "#e1e3e5",
            }}
          />
        </div>
      </Box>
    </div>
  </Grid.Cell>
);

export default MediaCardSkeleton;
