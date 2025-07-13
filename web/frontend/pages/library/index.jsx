import { Page, Tabs, Grid, EmptyState, Text } from "@shopify/polaris";
import { useState, useEffect, useRef } from "react";
import tabs from "../../components/library/data/tabs";
import MediaCardItem from "../../components/library/MediaCard";
import fetchLibraryData from "../../services/library";
import { useAppBridge } from "@shopify/app-bridge-react";
import MediaCardSkeleton from "../../components/library/mediaCardSkeleton";

const PolarisLibraryPage = () => {
  const [selected, setSelected] = useState(0);
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTabSwitching, setIsTabSwitching] = useState(false);
  const app = useAppBridge();

  const itemsRef = useRef([]);
  const intervalRef = useRef(null);

  const handleTabSelect = (tabIndex) => {
    setIsTabSwitching(true);
    setSelected(tabIndex);
  };

  const pollStatus = async (taskId) => {
    try {
      const res = await fetch(`/api/v1/app/freepik/check-status/${taskId}`, {
        method: "GET",
        headers: {
          "X-Shopify-Access-Token": app?.config?.accessToken,
          "X-Shopify-Shop": app?.config?.shop,
        },
        credentials: "include",
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      return json?.data || null;
    } catch (err) {
      console.error("❌ Polling failed:", err.message);
      return null;
    }
  };

  const updateCreationStatus = async (id, status, meta = {}) => {
    try {
      const res = await fetch(`/api/v1/app/creations/${id}`, {
        method: "PUT",
        credentials: "include",
        body: JSON.stringify({ status, ...meta }),
      });

      return res.ok;
    } catch (err) {
      console.error("❌ DB update failed:", err.message);
      return false;
    }
  };

  useEffect(() => {
    const loadMedia = async () => {
      setLoading(true);
      setMediaItems([]);

      const selectedTab = tabs[selected].id;
      const type =
        selectedTab === "videos"
          ? "video"
          : selectedTab === "images"
          ? "image"
          : "all";

      try {
        const result = await fetchLibraryData(type);
        if (result?.success) {
          setMediaItems(result.data || []);
        } else {
          setMediaItems([]);
        }
      } catch (error) {
        console.error("Error loading media:", error);
        setMediaItems([]);
      } finally {
        setLoading(false);
        setIsTabSwitching(false);
      }
    };

    loadMedia();
  }, [selected]);

  // 🔁 Update ref with latest mediaItems
  useEffect(() => {
    itemsRef.current = mediaItems;
  }, [mediaItems]);

  // 🧠 Single polling interval
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(async () => {
      const items = itemsRef.current;

      for (const item of items) {
        if (!item.outputMap?.length && item.taskId) {
          const result = await pollStatus(item.taskId);

          if (result?.status === "COMPLETED" && result.generated?.length > 0) {
            const videoUrl = result.generated[0];

            const outputMap = [
              {
                productId: item.inputImages?.[0]?.productId || "unknown",
                outputUrl: videoUrl,
              },
            ];

            setMediaItems((prev) =>
              prev.map((i) =>
                i.id === item.id ? { ...i, outputMap } : i
              )
            );

            await updateCreationStatus(item.id, "COMPLETED", {
              processingCompletedAt: new Date().toISOString(),
              outputMap,
            });
          }
        }
      }
    }, 5000);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, []); // only run once

  const hasMedia = mediaItems.some((item) => {
    return (
      (item.outputMap && item.outputMap.length > 0) ||
      (item.inputImages && item.inputImages.length > 0) ||
      item.imageUrl ||
      item.videoUrl ||
      item.source
    );
  });

  return (
    <Page
      fullWidth
      title="Library"
      backAction={{ content: "Back", onAction: () => window.history.back() }}
    >
      <Tabs tabs={tabs} selected={selected} onSelect={handleTabSelect}>
        {loading || isTabSwitching ? (
          <Grid>
            {Array.from({ length: 8 }).map((_, index) => (
              <MediaCardSkeleton key={index} />
            ))}
          </Grid>
        ) : mediaItems.length > 0 && hasMedia ? (
          <Grid>
            {mediaItems.flatMap((item, itemIndex) => {
              const outputs = item.outputMap?.length
                ? item.outputMap
                : item.inputImages || [];

              return outputs.map((media, index) => (
                <MediaCardItem
                  key={`${tabs[selected].id}-${itemIndex}-${
                    media.outputUrl ? "output" : "input"
                  }-${index}`}
                  title={`${
                    item.title || "Untitled"
                  } - ${media.outputUrl ? "Output" : "Input"} ${index + 1}`}
                  description={
                    media.outputUrl
                      ? `Output for product ${media.productId || "unknown"}`
                      : "Input image"
                  }
                  status={media.status}
                  source={media.outputUrl || media.imageUrl}
                  type={item.type}
                />
              ));
            })}
          </Grid>
        ) : (
          <EmptyState
            heading="No media found"
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <Text variant="bodyMd" as="p">
              No media available for this category. Try selecting a different tab.
            </Text>
          </EmptyState>
        )}
      </Tabs>
    </Page>
  );
};

export default PolarisLibraryPage;
