import { Grid, Text, BlockStack ,Box,Button} from "@shopify/polaris";
import DownloadIcon from "../common/icon/DownloadIcon"
const MediaCardItem = ({ title, description, source, type }) => (
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
          height: "240px",
          backgroundColor: "#f6f6f7",
          overflow: "hidden",
        }}
      >
        {type === "video" ? (
          <video
            src={source}
            controls
            title={title}
            aria-label={title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <img
            src={source}
            alt={title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}
      </div>

      <div style={{ padding: "16px" }}>
        <BlockStack gap="300">
          <Text variant="headingMd" as="h3" truncate>
            {title}
          </Text>
          {/* Optional description */}
          {/* <Text as="p" color="subdued">{description}</Text> */}
        </BlockStack>
      </div>
      <Box  padding="400">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
            }}
          >
            <Button
              variant="secondary"
              size="large"
              icon={<DownloadIcon />}
             // disabled={!generatedVideoUrl}
              onClick={() => {
                const link = document.createElement("a");
                link.href = source;
                link.download = "generated-video.mp4";
                link.click();
              }}
            />
          </div>
        </div>
      </Box>
    </div>
  </Grid.Cell>
);

export default MediaCardItem;
