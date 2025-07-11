import { Page, Tabs, Grid, EmptyState, Text, Spinner } from "@shopify/polaris";
import { useState, useEffect } from "react";
import tabs from "../../components/library/data/tabs";
import MediaCardItem from "../../components/library/MediaCard";
import fetchLibraryData from "../../services/library";
import { useAppBridge } from "@shopify/app-bridge-react";
import MediaCardSkeleton from "../../components/library/mediaCardSkeleton";

const PolarisLibraryPage = () => {
  const [selected, setSelected] = useState(0);
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const app = useAppBridge();

  useEffect(() => {
    const loadMedia = async () => {
      setLoading(true);
      const selectedTab = tabs[selected].id;
      const type = selectedTab === "videos" ? "video" : "image";

      try {
        const result = await fetchLibraryData(type);
        if (result?.success) {
          setMediaItems(result.data);
        } else {
          setMediaItems([]);
        }
      } catch (error) {
        console.error("Error loading media:", error);
        setMediaItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadMedia();
  }, [selected]);

  const hasMedia = mediaItems.some(
    (item) => item.outputMap && item.outputMap.length > 0
  );

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
        {loading ? (
          <Grid>
            {Array.from({ length: 8 }).map((_, index) => (
              <MediaCardSkeleton key={index} />
            ))}
          </Grid>
        ) : hasMedia ? (
          <Grid>
            {mediaItems.flatMap((item) =>
              item.outputMap.map((output, index) => (
                <MediaCardItem
                  key={`${item._id}-${index}`}
                  title={`${item.title}-${index + 1}`}
                  description={`Output for product ${output.productId}`}
                  source={output.outputUrl}
                  type={item.type}
                />
              ))
            )}
          </Grid>
        ) : (
          <EmptyState
            heading="No media found"
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            {/* <Text variant="bodyMd" as="p">
              We couldn't load any templates. Try changing the tab or refreshing
              the page.
            </Text> */}
          </EmptyState>
        )}
      </Tabs>
    </Page>
  );
};

export default PolarisLibraryPage;
