import {
  Page,
  Tabs,
  Grid,
  Text,
  BlockStack,
  EmptyState,
} from "@shopify/polaris";
import { useState, useMemo } from "react";

const tabs = [
  { id: "all", content: "All", panelID: "all-panel" },
  { id: "videos", content: "Videos", panelID: "videos-panel" },
  { id: "images", content: "Images", panelID: "images-panel" },
];

const mediaItems = [
  {
    title: "Grow Your Brand",
    description: "Learn to expand your reach across platforms.",
    source:
      "https://burst.shopifycdn.com/photos/business-woman-smiling-in-office.jpg?width=1850",
    type: "image",
  },
  {
    title: "Boost Conversions",
    description: "Explore strategies to increase your performance.",
    source:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    type: "video",
  },
  {
    title: "Retention Strategy",
    description: "Discover how to retain your customers effectively.",
    source:
      "https://burst.shopifycdn.com/photos/business-woman-smiling-in-office.jpg?width=1850",
    type: "image",
  },
  {
    title: "Marketing Fundamentals",
    description: "Learn to expand your reach across platforms.",
    source:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    type: "video",
  },
  {
    title: "Product Photography",
    description: "Explore strategies to increase your performance.",
    source:
      "https://burst.shopifycdn.com/photos/business-woman-smiling-in-office.jpg?width=1850",
    type: "image",
  },
  {
    title: "Customer Journey",
    description: "Discover how to retain your customers effectively.",
    source:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    type: "video",
  },
  {
    title: "Brand Identity",
    description: "Learn to expand your reach across platforms.",
    source:
      "https://burst.shopifycdn.com/photos/business-woman-smiling-in-office.jpg?width=1850",
    type: "image",
  },
  {
    title: "Sales Optimization",
    description: "Explore strategies to increase your performance.",
    source:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    type: "video",
  },
  {
    title: "Social Media Strategy",
    description: "Discover how to retain your customers effectively.",
    source:
      "https://burst.shopifycdn.com/photos/business-woman-smiling-in-office.jpg?width=1850",
    type: "image",
  },
];

const MediaCardItem = ({ title, description, source, type }) => (
  <Grid.Cell columnSpan={{ xs: 6, sm: 4, md: 3, lg: 2, xl: 2 }}>
    <div
      style={{
        height: "100%",
        minHeight: "100px",
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        border: "1px solid #e1e3e5",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        overflow: "hidden",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "240px",
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#f6f6f7",
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
              display: "block",
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
              display: "block",
            }}
          />
        )}
      </div>

      <div style={{ padding: "16px" }}>
        <BlockStack gap="300">
          <Text variant="headingMd" as="h3" truncate>
            {title}
          </Text>
          {/* <Text as="p" color="subdued" breakWord>
            {description}
          </Text> */}
        </BlockStack>
      </div>
    </div>
  </Grid.Cell>
);

const PolarisLibraryPage = () => {
  const [selected, setSelected] = useState(0);

  const filteredItems = useMemo(() => {
    const selectedTab = tabs[selected];
    if (selectedTab.id === "videos") {
      return mediaItems.filter((item) => item.type === "video");
    } else if (selectedTab.id === "images") {
      return mediaItems.filter((item) => item.type === "image");
    }
    return mediaItems;
  }, [selected]);

  return (
    <Page
      fullWidth
      title="Library"
      backAction={{
        content: "Back",
        onAction: () => window.history.back(),
      }}
    >
      <Tabs tabs={tabs} selected={selected} onSelect={setSelected}>
        <Grid>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <MediaCardItem
                key={item.title}
                title={item.title}
                description={item.description}
                source={item.source}
                type={item.type}
              />
            ))
          ) : (
            <EmptyState
              heading="Something went wrong"
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <Text variant="bodyMd" as="p">
                We couldn't load the templates. Please try refreshing the page.
              </Text>
            </EmptyState>
          )}
        </Grid>
      </Tabs>
    </Page>
  );
};

export default PolarisLibraryPage;
