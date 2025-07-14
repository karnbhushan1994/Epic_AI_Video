import {
  Grid,
  Text,
  BlockStack,
  Box,
  Button,
  ProgressBar,
} from "@shopify/polaris";
import DownloadIcon from "../common/icon/DownloadIcon";

const MediaCardItem = ({ title, description, source, type, status }) => (
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
          position: "relative", // enables absolute positioning inside
        }}
      >
        {type === "video" ? (
          status !== "COMPLETED" ? (
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
          )
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

        {/* ProgressBar overlay in center */}
        {status !== "COMPLETED" && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "80%",
              // background: "rgba(255, 255, 255, 0.7)",
              // borderRadius: "4px",
              // padding: "4px 8px",
            }}
          >
            <ProgressBar progress={90} size="small" tone="primary" />
          </div>
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
              display: "flex",
              gap: "8px",
              alignItems: "center",
            }}
          >
            <Button
              variant="secondary"
              size="large"
              icon={<DownloadIcon />}
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
