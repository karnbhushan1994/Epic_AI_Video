import {
  Box,
  Button,
  Card,
  Icon,
  Layout,
  Page,
  Text,
  TextField,
  BlockStack,
  Divider,
  Grid,
  MediaCard,
  DropZone,
  Badge,
  ButtonGroup,
  Spinner,
  SkeletonBodyText,
  Tooltip,
  ProgressBar as PolarisProgressBar,
  InlineStack,
   OptionList
} from "@shopify/polaris";
import {
  ImageIcon,
  PlusIcon,
  NoteIcon,
  SearchIcon,
  PlayIcon,
} from "@shopify/polaris-icons";
import { Modal, TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useParams } from "react-router-dom";

import {
  VIDEO_DURATIONS,
  VIDEO_MODES,
  TABS,
  MAX_FILE_SIZE,
  VALID_IMAGE_TYPES,
  STATIC_MOTION_PROMPT,
  API_CONFIG,
} from "../../../../utils/videoConstants";

import { validateFile } from "../../../../utils/fileUtils";

// Import the modular socket hook
import {
  useSocketIO,
  VIDEO_STATUS,
  SocketEmitters,
} from "../../../../hooks/useSocketIO";
import { downloadFileFromUrl } from "../../../../../utils/downloadFile";

// Get Shopify context from app bridge
const getShopifyHeaders = (shopify) => {
  const shop = shopify?.config?.shop;
  const accessToken = shopify?.config?.accessToken;

  return {
    "X-Shopify-Access-Token": accessToken,
    "X-Shopify-Shop": shop,
    "Content-Type": "application/json",
  };
};

const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const isValidImageUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Enhanced Loading Components with Polaris
const LoadingStates = {
  // Full page loader
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

  // Card content loader
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
                  <Spinner size="small" />
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

  // Inline loader for buttons
  ButtonLoader: ({ size = "small" }) => (
    <InlineStack gap="200" blockAlign="center">
      <Spinner accessibilityLabel="Processing" size={size} />
      <Text variant="bodyMd" as="span">
        Processing...
      </Text>
    </InlineStack>
  ),

  // Video generation specific loader with three status states
  VideoGenerationLoader: ({ progress, message, status, onCancel }) => (
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
          <PolarisProgressBar
            progress={progress}
            size="medium"
            tone="primary"
          />
        </Box>
      )}
    </BlockStack>
  ),

  // Product grid skeleton loader
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
            {/* Image skeleton */}
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
              <Spinner size="small" />
            </div>

            {/* Text skeleton */}
            <div
              style={{
                height: "20px",
                backgroundColor: "var(--p-color-bg-surface-secondary)",
                borderRadius: "var(--p-border-radius-100)",
                opacity: 0.6,
              }}
            />

            {/* Button skeleton */}
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

  // File upload loader
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

// Helper functions for status handling
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
      return "Video generation failed";
    default:
      return "Processing...";
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

const getProgressByStatus = (status) => {
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

// Enhanced Video Generation Status Component
const VideoGenerationStatus = ({
  isGenerating,
  progress,
  status,
  connectionStatus,
  currentCreationId,
  onCancel,
  estimatedTime,
}) => {
  if (!isGenerating) return null;

  const getTimeRemaining = () => {
    if (!estimatedTime || progress === 0) return null;
    const remainingPercent = 100 - progress;
    const timePerPercent = estimatedTime / 100;
    const remaining = Math.ceil((remainingPercent * timePerPercent) / 60); // in minutes
    return remaining > 0 ? `~${remaining} min remaining` : "Almost done";
  };

  return (
    <Card>
      <Box padding="400">
        <LoadingStates.VideoGenerationLoader
          progress={progress}
          status={status}
          onCancel={onCancel}
          estimatedTime={estimatedTime}
        />
      </Box>
    </Card>
  );
};

// Custom Hook for Video Generation API (Using Socket.IO + Freepik API + Status Polling)
const useVideoGeneration = (shopify) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentCreationId, setCurrentCreationId] = useState(null);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [generationResult, setGenerationResult] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [statusPollingInterval, setStatusPollingInterval] = useState(null);

  const currentTaskIdRef = useRef(null);

  // Use the modular socket hook
  const {
    connected,
    emitEvent,
    subscribeToVideoUpdates,
    subscribeToCreation,
    unsubscribeFromCreation,
    startPolling,
    stopPolling,
  } = useSocketIO();

  const stopStatusPolling = useCallback(() => {
    if (statusPollingInterval) {
      clearInterval(statusPollingInterval);
      setStatusPollingInterval(null);
      stopPolling();
    }
  }, [statusPollingInterval, stopPolling]);

  useEffect(() => {
    return () => {
      stopStatusPolling();
    };
  }, [stopStatusPolling]);

  const handleStatusUpdate = useCallback(
    (data) => {
      const {
        task_id,
        taskId: camelTaskId,
        status,
        generated,
        outputMap,
        failureReason,
      } = data;

      const actualTaskId = camelTaskId || task_id;

      if (actualTaskId !== currentTaskIdRef.current) {
        console.log("⛔ Skipping update for unmatched task:", actualTaskId);
        return;
      }

      const normalizedStatus = status?.toUpperCase();
      setCurrentStatus(normalizedStatus);
      console.log("📡 Received status update:", normalizedStatus, actualTaskId);

      const videoUrl = generated?.[0] || outputMap?.[0]?.outputUrl || null;

      switch (normalizedStatus) {
        case VIDEO_STATUS.CREATED:
          setGenerationProgress(getProgressByStatus(VIDEO_STATUS.CREATED));
          break;
        case VIDEO_STATUS.IN_PROGRESS:
          setGenerationProgress(getProgressByStatus(VIDEO_STATUS.IN_PROGRESS));
          break;
        case VIDEO_STATUS.COMPLETED:
          setGenerationProgress(getProgressByStatus(VIDEO_STATUS.COMPLETED));
          setIsGenerating(false);
          stopStatusPolling();
          //setCurrentCreationId(null);
          setCurrentTaskId(null);
          currentTaskIdRef.current = null;
          setGenerationResult({
            success: !!videoUrl,
            videoUrl,
            taskId: actualTaskId,
            outputMap: {
              ...outputMap,
              videoUrl,
              thumbnail: videoUrl ? `${videoUrl}.jpg` : null,
              duration: outputMap?.duration,
              processingCompletedAt: new Date().toISOString(),
            },
          });
          break;
        case VIDEO_STATUS.FAILED:
        case VIDEO_STATUS.ERROR:
          setIsGenerating(false);
          setGenerationProgress(0);
          stopStatusPolling();
          setCurrentCreationId(null);
          setCurrentTaskId(null);
          currentTaskIdRef.current = null;
          setGenerationResult({
            success: false,
            error: "Video generation failed", //failureReason ||
            taskId: actualTaskId,
          });
          break;
        default:
          console.warn("❓ Unknown status:", normalizedStatus);
      }
    },
    [stopStatusPolling]
  );

const pollTaskStatus = useCallback(
  async (taskId) => {
    try {
      const headers = getShopifyHeaders(shopify);

      const res = await fetch(`/api/v1/app/freepik/check-status/${taskId}`, {
        method: "GET",
        headers,
        credentials: "include",
      });

      if (!res.ok) {
        console.warn("❌ Polling failed", res.status);
        return;
      }

      const json = await res.json();
      const data = json?.data || {};

      console.log("📦 Raw API response:", data);

      const status = data.status?.toUpperCase?.();
      console.log("🧪 Polled status:", status);

      handleStatusUpdate({
        task_id: data.task_id,
        status,
        generated: data.generated,
        failureReason: data.failureReason,
      });
     console.log(status);
      // ✅ Update database when status is completed
      //if (status === "COMPLETED") {
        try {
          const updatePayload = {
            status: "completed",
            outputMap: data.generated ? data.generated.map((url, index) => ({
              productId: `generated_${index}`,
              outputUrl: url
            })) : [],
            generated: data.generated,
            videoUrl: data.generated?.[0]
          };
         console.log(currentCreationId);
          const updateRes = await fetch(`${API_CONFIG.baseUrl}/creations/${currentCreationId}`, {
            method: "PUT",
            headers,
            credentials: "include",
            body: JSON.stringify(updatePayload),
          });

          if (updateRes.ok) {
            const updateResult = await updateRes.json();
            console.log("✅ Database updated successfully:", updateResult);
          } else {
            console.warn("⚠️ Failed to update database:", updateRes.status);
          }
        } catch (dbError) {
          console.error("❌ Database update error:", dbError.message);
        }
     //}

      if (
        [
          VIDEO_STATUS.COMPLETED,
          VIDEO_STATUS.FAILED,
          VIDEO_STATUS.ERROR,
        ].includes(status)
      ) {
        stopStatusPolling();
      }
    } catch (err) {
      console.error("⛔ Polling error:", err.message);
    }
  },
  [shopify, handleStatusUpdate, stopStatusPolling, currentCreationId]
);

  const startStatusPolling = useCallback(
    (taskId) => {
      if (!taskId || statusPollingInterval) return;

      pollTaskStatus(taskId);
      const interval = setInterval(() => {
        pollTaskStatus(taskId);
      }, 5000);
      setStatusPollingInterval(interval);

      startPolling(taskId, 5000);
    },
    [pollTaskStatus, statusPollingInterval, startPolling]
  );

  const generateVideo = useCallback(
    async (params) => {
      try {
        setIsGenerating(true);
        setGenerationProgress(0);
        setGenerationResult(null);
       // setCurrentCreationId(null);
        setCurrentStatus(null);

        const freepikPayload = {
          webhook_url: "https://your-domain.com/api/freepik/webhook",
          image: params.image,
          prompt: STATIC_MOTION_PROMPT,
          duration: params.duration.toString(),
          cfg_scale: params.cfgScale || 0.5,
        };

        const res = await fetch("/api/v1/app/freepik/generate-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(freepikPayload),
        });

        const json = await res.json();
        if (!res.ok)
          throw new Error(json.message || "Failed to start generation");

        const taskId = json.data?.task_id;
        if (!taskId) throw new Error("No task_id returned");

        console.log("✅ Task started:", taskId);

        setCurrentTaskId(taskId);
        currentTaskIdRef.current = taskId;
        setGenerationProgress(5);

        startStatusPolling(taskId);

        // Store creation in backend
        const headers = getShopifyHeaders(shopify);
        const creationRes = await fetch(`${API_CONFIG.baseUrl}/creations`, {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({
            templateId: "686393535e6019e1260b17ac",
            type: "video",
            taskId,
            inputMap: params.selectedProduct
              ? [
                  {
                    productId: params.selectedProduct.id,
                    imageUrl: params.selectedProduct.thumbnail,
                  },
                ]
              : [],
            inputImages: [params.image],
            associatedProductIds: params.selectedProduct
              ? [params.selectedProduct.id]
              : [],
            creditsUsed: params.totalCredits,
            meta: {
              duration: parseInt(params.duration),
              mode: params.mode,
              aspectRatio: "16:9",
              prompt: STATIC_MOTION_PROMPT,
              cfg_scale: params.cfgScale,
            },
            image: params.image,
          }),
        });

        const creationData = await creationRes.json();
        if (!creationRes.ok)
          throw new Error(creationData.message || "Creation API failed");

        const creationId =
          creationData.creation?._id || creationData.creation?.id;
        setCurrentCreationId(creationId);
        setCurrentStatus(VIDEO_STATUS.CREATED);

        // Subscribe to creation updates via socket
        subscribeToCreation(creationId, taskId);
      } catch (err) {
        console.error("❌ generateVideo error:", err.message);
        setIsGenerating(false);
        setGenerationProgress(0);
        setCurrentTaskId(null);
        currentTaskIdRef.current = null;
        setCurrentStatus(null);
        stopStatusPolling();
        throw err;
      }
    },
    [shopify, startStatusPolling, stopStatusPolling, subscribeToCreation]
  );

  // const cancelGeneration = useCallback(() => {
  //   if (currentCreationId && currentTaskId) {
  //     unsubscribeFromCreation(currentCreationId, currentTaskId);
  //   }

  //   stopStatusPolling();
  //   setIsGenerating(false);
  //   setGenerationProgress(0);
  //   setCurrentTaskId(null);
  //   currentTaskIdRef.current = null;
  //   setCurrentCreationId(null);
  //   setGenerationResult(null);
  //   setCurrentStatus(null);
  // }, [
  //   currentCreationId,
  //   currentTaskId,
  //   unsubscribeFromCreation,
  //   stopStatusPolling,
  // ]);

  // Listen for socket updates using the modular hook
  useEffect(() => {
    const unsubscribe = subscribeToVideoUpdates(handleStatusUpdate);
    return unsubscribe;
  }, [handleStatusUpdate, subscribeToVideoUpdates]);

  return {
    generateVideo,
   // cancelGeneration,
    isGenerating,
    generationProgress,
    currentCreationId,
    currentTaskId,
    currentStatus,
    connectionStatus: connected ? "Connected" : "Disconnected",
    generationResult,
    isPolling: !!statusPollingInterval,
  };
};

// Custom Hook for Products
const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/app/fetch-product");

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      let productsArray = [];

      if (Array.isArray(data)) {
        productsArray = data;
      } else if (data.products && Array.isArray(data.products)) {
        productsArray = data.products;
      } else {
        throw new Error("Invalid product data format received");
      }

      const transformedProducts = productsArray.map((product) => {
        const numericId = product.id.includes("gid://shopify/Product/")
          ? product.id.split("/").pop()
          : product.id;

        let thumbnail = "";
        if (product.featuredImage?.url) {
          thumbnail = product.featuredImage.url;
        } else if (product.images && product.images.length > 0) {
          if (product.images[0]?.url) {
            thumbnail = product.images[0].url;
          } else if (product.images[0]?.src) {
            thumbnail = product.images[0].src;
          }
        }

        return {
          value: `product-${numericId}`,
          label: product.title,
          thumbnail,
          id: numericId,
          handle: product.handle || `product-${numericId}`,
          date:
            product.created_at?.split("T")[0] ||
            product.createdAt?.split("T")[0] ||
            new Date().toISOString().split("T")[0],
          vendor: product.vendor || "",
          product_type: product.product_type || product.productType || "",
          status: product.status || "active",
        };
      });

      setProducts(transformedProducts);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setError("Failed to load products. Please try again.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
};

// Custom Icons Components
const UploadIcon = React.memo(() => (
  <svg
    viewBox="0 0 20 20"
    width="20"
    height="20"
    focusable="false"
    aria-hidden="true"
  >
    <path d="M4.5 6.75c0-.69.56-1.25 1.25-1.25h1.514c.473 0 .906.268 1.118.691l.17.342c.297.592.903.967 1.566.967h4.132c.69 0 1.25.56 1.25 1.25 0 .414.336.75.75.75s.75-.336.75-.75c0-1.519-1.231-2.75-2.75-2.75h-4.132c-.095 0-.181-.053-.224-.138l-.17-.342c-.466-.931-1.418-1.52-2.46-1.52h-1.514c-1.519 0-2.75 1.231-2.75 2.75v6.5c0 1.519 1.231 2.75 2.75 2.75h5c.414 0 .75-.336.75-.75s-.336-.75-.75-.75h-5c-.69 0-1.25-.56-1.25-1.25v-6.5Z" />
    <path d="M15.75 13.31v2.94c0 .414-.336.75-.75.75s-.75-.336-.75-.75v-2.94l-.72.72c-.293.293-.767.293-1.06 0-.293-.293-.293-.767 0-1.06l2-2c.293-.293.767-.293 1.06 0l2 2c.293.293.293.767 0 1.06-.293.293-.767.293-1.06 0l-.72-.72Z" />
  </svg>
));

const ShopifyProductIcon = React.memo(() => (
  <svg
    viewBox="0 0 20 20"
    width="20"
    height="20"
    focusable="false"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M13.257 3h-6.514a1.25 1.25 0 0 0-.983.478l-2.386 3.037a1.75 1.75 0 0 0-.374 1.08v.655a2.75 2.75 0 0 0 1.5 2.45v4.55c0 .966.784 1.75 1.75 1.75h7.5a1.75 1.75 0 0 0 1.75-1.75v-4.55a2.75 2.75 0 0 0 1.5-2.45v-.481c0-.504-.17-.994-.48-1.39l-2.28-2.901a1.25 1.25 0 0 0-.983-.478Zm-.257 12.5h.75a.25.25 0 0 0 .25-.25v-4.25a2.742 2.742 0 0 1-2-.863 2.742 2.742 0 0 1-2 .863 2.742 2.742 0 0 1-2-.863 2.742 2.742 0 0 1-2 .863v4.25c0 .138.112.25.25.25h3.75v-2.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v2.5Zm-7-6h-.25c-.69 0-1.25-.56-1.25-1.25v-.654a.25.25 0 0 1 .053-.155l2.312-2.941h6.27l2.205 2.805a.75.75 0 0 1 .16.464v.481c0 .69-.56 1.25-1.25 1.25h-.25c-.69 0-1.25-.56-1.25-1.25v-.5a.75.75 0 0 0-1.5 0v.5a1.25 1.25 0 1 1-2.5 0v-.5a.75.75 0 0 0-1.5 0v.5c0 .69-.56 1.25-1.25 1.25Z"
    />
  </svg>
));


const ProductDropdown = React.memo(({
  products,
  popoverActive,
  onProductSelect,
  onClose,
  selectedProductValue,
}) => {
  if (!popoverActive || products.length === 0) return null;

  // Transform products to match OptionList format
  const options = products.map((product) => ({
    value: product.value,
    label: product.label,
    media: product.thumbnail ? (
      <img
        src={product.thumbnail}
        alt={product.label}
        style={{
          width: "20px",
          height: "20px",
          borderRadius: "6px",
          objectFit: "cover",
        }}
      />
    ) : undefined,
  }));

  const handleChange = (selected) => {
    if (selected.length > 0) {
      onProductSelect(selected[0]); // Take the first selected item
    }
  };

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          zIndex: 10001,
          marginTop: "4px",
        }}
      >
        <Card>
          <OptionList
            title=""
            onChange={handleChange}
            options={options}
            selected={selectedProductValue ? [selectedProductValue] : []}
            allowMultiple={false}
          />
        </Card>
      </div>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
        }}
        onClick={onClose}
      />
    </>
  );
});
// File Grid Component
const FileGrid = React.memo(({ files, selectedFile, onFileSelect }) => {
  if (files.length === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "16px",
        maxHeight: "300px",
        overflowY: "auto",
        overflowX: "hidden",
        padding: "8px",
        border: "1px solid var(--p-color-border-subdued)",
        borderRadius: "8px",
      }}
    >
      {files.map((file, index) => {
        const isSelected = selectedFile && selectedFile.name === file.name;
        return (
          <div
            key={`${file.name}-${file.size}-${index}`}
            style={{ position: "relative" }}
          >
            <Box>
              <MediaCard portrait>
                <Box>
                  <div
                    style={{
                      height: "200px",
                      minHeight: "200px",
                      backgroundColor: "#f6f6f7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {VALID_IMAGE_TYPES.includes(file.type) ? (
                      <img
                        src={window.URL.createObjectURL(file)}
                        alt={file.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "8px",
                        }}
                      />
                    ) : (
                      <Icon source={NoteIcon} />
                    )}
                    {isSelected && (
                      <div
                        style={{
                          position: "absolute",
                          top: "8px",
                          right: "8px",
                        }}
                      >
                        <Badge tone="success">Selected</Badge>
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      marginTop: "12px",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <Button onClick={() => onFileSelect(file)}>
                      {isSelected ? "Deselect" : "Select"}
                    </Button>
                  </div>
                </Box>
              </MediaCard>
            </Box>
          </div>
        );
      })}
    </div>
  );
});

// Product Grid Component
const ProductGrid = React.memo(
  ({ products, selectedProduct, onProductSelect }) => {
    if (products.length === 0) {
      return (
        <Card>
          <Box padding="400">
            <BlockStack gap="400" align="center">
              <Icon source={ImageIcon} tone="subdued" />
              <Text variant="bodyMd" as="p" alignment="center">
                No products found.
              </Text>
            </BlockStack>
          </Box>
        </Card>
      );
    }

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          maxHeight: "300px",
          overflowY: "auto",
          overflowX: "hidden",
          padding: "8px",
          border: "1px solid var(--p-color-border-subdued)",
          borderRadius: "8px",
        }}
      >
        {products.map((product) => {
          const isSelected =
            selectedProduct && selectedProduct.value === product.value;
          return (
            <div key={product.value} style={{ position: "relative" }}>
              <Box
                borderColor={isSelected ? "border-focus" : "border"}
                borderStyle="solid"
                borderWidth={isSelected ? "2" : "1"}
                overflow="hidden"
                background="bg-surface"
                style={{ height: "350px" }}
              >
                <MediaCard portrait>
                  <Box>
                    <div
                      style={{
                        height: "200px",
                        backgroundColor: "#000",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      {product.thumbnail ? (
                        <img
                          src={product.thumbnail}
                          alt={product.label}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <Icon source={ImageIcon} tone="subdued" />
                      )}
                      {isSelected && (
                        <div
                          style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                          }}
                        >
                          <Badge tone="success">Selected</Badge>
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        marginTop: "12px",
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <Button
                        onClick={() => onProductSelect(product, isSelected)}
                      >
                        {isSelected ? "Deselect" : "Select"}
                      </Button>
                    </div>
                  </Box>
                </MediaCard>
              </Box>
            </div>
          );
        })}
      </div>
    );
  }
);

// Main VideoTemplate Component
const VideoTemplate = () => {
  const { id } = useParams();
  const shopify = useAppBridge();
  const {
    products,
    loading: productsLoading,
    error: productsError,
  } = useProducts();
  const {
    generateVideo,
    //cancelGeneration,
    isGenerating,
    generationProgress,
    currentCreationId,
    currentStatus,
    connectionStatus,
    generationResult,
    isPolling,
  } = useVideoGeneration(shopify);

  // Use the modular Socket.IO hook
  const { connected, serverMessage, videoUpdates, emitEvent } = useSocketIO();

  // State
  const [selectedImagePreview, setSelectedImagePreview] = useState("");
  const [activeTab, setActiveTab] = useState(TABS.PRODUCTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [files, setFiles] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [popoverActive, setPopoverActive] = useState(false);
  const [selectedProductValue, setSelectedProductValue] = useState("");
  const [videoDurationIndex, setVideoDurationIndex] = useState(0);
  const [videoModeIndex, setVideoModeIndex] = useState(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Handle video generation results
  useEffect(() => {
    if (generationResult) {
      if (generationResult.success && generationResult.videoUrl) {
        setGeneratedVideoUrl(generationResult.videoUrl);
        showToast("🎉 Video generated successfully!");
      } else if (!generationResult.success) {
        showToast(
          `❌ Video generation failed: ${generationResult.error}`,
          true
        );
      }
    }
  }, [generationResult]);

  // Handle video updates from Socket.IO
  useEffect(() => {
    if (videoUpdates) {
      console.log("🎬 Processing video update:", videoUpdates);
      if (
        videoUpdates.status === VIDEO_STATUS.COMPLETED &&
        videoUpdates.videoUrl
      ) {
        setGeneratedVideoUrl(videoUpdates.videoUrl);
        showToast("🎉 Video generated successfully via Socket.IO!");
      } else if (videoUpdates.status === VIDEO_STATUS.FAILED) {
        showToast(`❌ Video generation failed: ${videoUpdates.error}`, true);
      }
    }
  }, [videoUpdates]);

  // Calculate total credits
  const calculateTotalCredits = useCallback(() => {
    const durationCredits = VIDEO_DURATIONS[videoDurationIndex].credits;
    const modeCredits = VIDEO_MODES[videoModeIndex].credits;
    return durationCredits + modeCredits;
  }, [videoDurationIndex, videoModeIndex]);

  // Check if image is selected (either from file upload or product)
  const isImageSelected = useMemo(() => {
    return Boolean(selectedImagePreview && (selectedFile || selectedProduct));
  }, [selectedImagePreview, selectedFile, selectedProduct]);

  // Filtered products based on search
  const filteredProducts = useMemo(() => {
    return products.filter((product) =>
      product.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  // Toast handlers
  const showToast = useCallback(
    (message, isError = false) => {
      if (shopify.toast) {
        if (isError) {
          shopify.toast.show(message, { duration: 5000, isError: true });
        } else {
          shopify.toast.show(message, { duration: 3000 });
        }
      }
    },
    [shopify]
  );

  // Event Handlers
  const handleDurationClick = useCallback(
    (index) => {
      if (videoDurationIndex === index) return;
      setVideoDurationIndex(index);
    },
    [videoDurationIndex]
  );

  const handleModeClick = useCallback(
    (index) => {
      if (videoModeIndex === index) return;
      setVideoModeIndex(index);
    },
    [videoModeIndex]
  );

  const handleImageSelect = useCallback(() => {
    shopify.modal.show("image-selection-modal");
  }, [shopify]);

  const handleDropZoneDrop = useCallback(
    async (_dropFiles, acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        showToast(
          "Some files were rejected. Please upload valid image files only.",
          true
        );
      }

      if (acceptedFiles.length > 0) {
        setUploadingFiles(true);

        const validFiles = acceptedFiles.filter((file) => {
          const validation = validateFile(file);
          if (!validation.valid) {
            showToast(validation.error, true);
            return false;
          }
          return true;
        });

        if (validFiles.length > 0) {
          setSelectedProduct(null);
          setSelectedProductValue("");
          setSearchQuery("");

          // Notify server via Socket.IO about file upload
          SocketEmitters.fileUpload(
            emitEvent,
            validFiles.length,
            validFiles.reduce((sum, file) => sum + file.size, 0)
          );

          // Simulate processing time for user feedback
          await new Promise((resolve) => setTimeout(resolve, 1000));

          setFiles((prevFiles) => [...prevFiles, ...validFiles]);
          const firstFile = validFiles[0];
          const previewUrl = window.URL.createObjectURL(firstFile);
          setSelectedImagePreview(previewUrl);
          setSelectedFile(firstFile);
          showToast(
            `✅ ${validFiles.length} image${validFiles.length > 1 ? "s" : ""} uploaded successfully`
          );
        }

        setUploadingFiles(false);
      }
    },
    [showToast, emitEvent]
  );

  const handleProductSelection = useCallback(
    (productValue) => {
      const product = products.find((p) => p.value === productValue);
      if (product) {
        setSelectedFile(null);
        setSelectedProduct(product);
        setSelectedProductValue(productValue);
        setSearchQuery(product.label);
        setPopoverActive(false);

        // Notify server via Socket.IO about product selection
        SocketEmitters.productSelected(
          emitEvent,
          product.id,
          product.label,
          !!product.thumbnail
        );

        if (product.thumbnail) {
          setSelectedImagePreview(product.thumbnail);
        } else {
          setSelectedImagePreview("");
          showToast("Product selected but no image available", true);
        }
      }
    },
    [products, showToast, emitEvent]
  );

  const handleSearchInputChange = useCallback((value) => {
    setSearchQuery(value);
    if (value === "") {
      setSelectedProduct(null);
      setSelectedProductValue("");
    }
    setPopoverActive(true);
  }, []);

  const handleFileSelect = useCallback((file) => {
    setSelectedFile((prevSelected) => {
      if (prevSelected && prevSelected.name === file.name) {
        setSelectedImagePreview("");
        return null;
      } else {
        setSelectedProduct(null);
        setSelectedProductValue("");
        setSearchQuery("");

        const previewUrl = window.URL.createObjectURL(file);
        setSelectedImagePreview(previewUrl);
        return file;
      }
    });
  }, []);

  const handleProductGridSelect = useCallback(
    (product, isCurrentlySelected) => {
      if (isCurrentlySelected) {
        setSelectedProduct(null);
        setSelectedProductValue("");
        setSearchQuery("");
        setSelectedImagePreview("");
      } else {
        setSelectedFile(null);
        setSelectedProduct(product);
        setSelectedProductValue(product.value);
        setSearchQuery(product.label);

        // Notify server via Socket.IO
        SocketEmitters.productSelected(
          emitEvent,
          product.id,
          product.label,
          !!product.thumbnail
        );

        if (product.thumbnail) {
          setSelectedImagePreview(product.thumbnail);
        } else {
          setSelectedImagePreview("");
          showToast("Product selected but no image available", true);
        }
      }
    },
    [showToast, emitEvent]
  );

  const handleUseSelectedItems = useCallback(() => {
    let selectedImage = null;

    if (selectedFile) {
      selectedImage = {
        type: "file",
        url: window.URL.createObjectURL(selectedFile),
        name: selectedFile.name,
        file: selectedFile,
      };
    } else if (selectedProduct && selectedProduct.thumbnail) {
      selectedImage = {
        type: "product",
        url: selectedProduct.thumbnail,
        name: selectedProduct.label,
        id: selectedProduct.id,
      };
    }

    if (selectedImage) {
      setSelectedImagePreview(selectedImage.url);
      showToast("✅ Image selected successfully");
      shopify.modal.hide("image-selection-modal");

      // Notify server via Socket.IO
      SocketEmitters.imageConfirmed(
        emitEvent,
        selectedImage.type,
        selectedImage.name
      );
    } else {
      showToast("❌ No image selected or selected product has no image", true);
    }
  }, [selectedFile, selectedProduct, shopify, showToast, emitEvent]);

  // Generate Video Handler with Backend API Integration
  const handleGenerateVideo = useCallback(async () => {
    if (!selectedImagePreview) {
      showToast("Please select an image first", true);
      return;
    }

    try {
      let imageUrl = selectedImagePreview;

      // If it's a file, convert to base64 for the API
      if (selectedFile) {
        imageUrl = await convertFileToBase64(selectedFile);
      } else if (!isValidImageUrl(selectedImagePreview)) {
        showToast("Invalid image URL", true);
        return;
      }

      const params = {
        image: imageUrl,
        duration: VIDEO_DURATIONS[videoDurationIndex].value,
        mode: VIDEO_MODES[videoModeIndex].label,
        cfgScale: videoModeIndex === 1 ? 0.8 : 0.5,
        totalCredits: calculateTotalCredits(),
        selectedProduct: selectedProduct,
      };

      const totalCredits = calculateTotalCredits();

      // Notify server via Socket.IO about video generation start
      SocketEmitters.videoGenerationStarted(
        emitEvent,
        params.duration,
        params.mode,
        totalCredits,
        !!selectedProduct
      );

      // `Starting video generation... (${totalCredits} credits)`,
      showToast(
        `Starting video generation... (${totalCredits} credits)`,
        false
      );

      await generateVideo(params);
    } catch (error) {
      console.error("Video generation failed:", error);
      showToast(`❌ Video generation failed: ${error.message}`, true);

      // Notify server via Socket.IO about generation failure
      SocketEmitters.videoGenerationFailed(emitEvent, error.message);
    }
  }, [
    selectedImagePreview,
    selectedFile,
    videoDurationIndex,
    videoModeIndex,
    generateVideo,
    showToast,
    calculateTotalCredits,
    selectedProduct,
    emitEvent,
  ]);

  const handleTabChange = useCallback((selectedTabIndex) => {
    setActiveTab(selectedTabIndex);
  }, []);

  const tabs = useMemo(
    () => [
      { id: "upload-tab", content: "Upload from Device", icon: UploadIcon },
      { id: "products-tab", content: "My Products", icon: ShopifyProductIcon },
    ],
    []
  );

  // Tab Content Renderer
  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case TABS.UPLOAD:
        const fileUpload = (
          <BlockStack gap="200">
            <DropZone.FileUpload actionHint="Supported formats: JPG, PNG, WebP (Max 10MB each)" />
          </BlockStack>
        );

        return (
          <BlockStack gap="400">
            <DropZone
              onDrop={handleDropZoneDrop}
              acceptedFiles={VALID_IMAGE_TYPES}
            >
              {fileUpload}
            </DropZone>

            {uploadingFiles && <LoadingStates.ProductGridSkeleton count={4} />}

            <FileGrid
              files={files}
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
            />
          </BlockStack>
        );

      case TABS.PRODUCTS:
        return (
          <BlockStack gap="400">
            {productsLoading ? (
              <LoadingStates.ProductGridSkeleton count={4} />
            ) : productsError ? (
              <Card sectioned>
                <BlockStack gap="400" align="center">
                  <Text
                    variant="bodyMd"
                    as="p"
                    tone="critical"
                    alignment="center"
                  >
                    {productsError}
                  </Text>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="secondary"
                  >
                    Retry Loading Products
                  </Button>
                </BlockStack>
              </Card>
            ) : (
              <>
                <div style={{ position: "relative", zIndex: 10000 }}>
                  <TextField
                    label=""
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onFocus={() => setPopoverActive(true)}
                    placeholder="Search products..."
                    autoComplete="off"
                    prefix={<Icon source={SearchIcon} />}
                  />

                  <ProductDropdown
                    products={filteredProducts}
                    popoverActive={popoverActive}
                    selectedProductValue={selectedProductValue}
                    onProductSelect={handleProductSelection}
                    onClose={() => setPopoverActive(false)}
                  />
                </div>

                <ProductGrid
                  products={products}
                  selectedProduct={selectedProduct}
                  onProductSelect={handleProductGridSelect}
                />
              </>
            )}
          </BlockStack>
        );

      default:
        return null;
    }
  }, [
    activeTab,
    handleDropZoneDrop,
    uploadingFiles,
    files,
    selectedFile,
    handleFileSelect,
    productsLoading,
    productsError,
    searchQuery,
    handleSearchInputChange,
    popoverActive,
    filteredProducts,
    selectedProductValue,
    handleProductSelection,
    products,
    selectedProduct,
    handleProductGridSelect,
  ]);

  return (
    <Page
      backAction={{
        content: "Back to templates",
        onAction: () => window.history.back(),
      }}
      title="Video Generator"
      fullWidth
    >
      {/* Socket.IO Connection Status */}
      <Box padding="200">
        <InlineStack gap="200" blockAlign="center">
          <Badge tone={connected ? "success" : "critical"}>
            Socket.IO: {connected ? "Connected" : "Disconnected"}
          </Badge>
          {serverMessage && (
            <Text variant="bodySm" as="p" tone="subdued">
              Server: {serverMessage}
            </Text>
          )}
          {connectionStatus !== "Connected" && (
            <>
              <Badge
                tone={
                  connectionStatus === "Connecting" ||
                  connectionStatus === "Reconnecting"
                    ? "attention"
                    : "critical"
                }
              >
                WebSocket: {connectionStatus}
              </Badge>
              {connectionStatus === "Error" && (
                <Button
                  variant="tertiary"
                  size="micro"
                  onClick={() => window.location.reload()}
                >
                  Retry Connection
                </Button>
              )}
            </>
          )}
          {/* Display current video generation status */}
          {isGenerating && currentStatus && (
            <Badge tone={getStatusTone(currentStatus)}>
              Status: {currentStatus.replace("_", " ")}
            </Badge>
          )}
          {/* Show polling indicator */}
          {isPolling && <Badge tone="info">📊 Polling Status</Badge>}
        </InlineStack>
      </Box>

      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            {/* Image Selection Section */}
            <Box
              background="bg-surface"
              shadow="card"
              borderRadius="200"
              overflow="hidden"
            >
              <Box padding="400">
                <Text variant="headingMd" as="h2">
                  Select image
                </Text>
                <Text variant="bodyMd" as="p">
                  Choose or upload an image to animate
                </Text>
              </Box>
              <Divider />

              {selectedImagePreview && (
                <Box padding="400">
                  <BlockStack gap="200">
                    <Text variant="bodyMd" as="p" tone="subdued">
                      Selected Image Preview:
                    </Text>
                    <Grid columns={{ xs: 1, sm: 2, md: 4, lg: 4, xl: 4 }}>
                      <Grid.Cell>
                        <div
                          style={{
                            borderRadius: "8px",
                            overflow: "hidden",
                            height: "200px",
                            backgroundColor: "#f6f6f7",
                            border: "2px solid #0073e6",
                            position: "relative",
                          }}
                        >
                          <img
                            src={selectedImagePreview}
                            alt="Selected"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: "6px",
                              display: "block",
                            }}
                            onError={(e) => {
                              console.error(
                                "Failed to load image:",
                                selectedImagePreview
                              );
                              e.target.style.display = "none";
                            }}
                          />
                        </div>
                      </Grid.Cell>
                    </Grid>
                  </BlockStack>
                </Box>
              )}

              <Box padding="400">
                <Button icon={PlusIcon} onClick={handleImageSelect}>
                  Select image
                </Button>
              </Box>
            </Box>

            {/* Video Settings */}
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd">Video duration</Text>
                <ButtonGroup variant="segmented">
                  {VIDEO_DURATIONS.map((duration) => (
                    <Button
                      key={duration.index}
                      pressed={videoDurationIndex === duration.index}
                      onClick={() => handleDurationClick(duration.index)}
                      disabled={duration.index === 1} // Disable second button
                    >
                      {duration.label}
                    </Button>
                  ))}
                </ButtonGroup>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd">Video Mode</Text>
                <ButtonGroup variant="segmented">
                  {VIDEO_MODES.map((mode) => (
                    <Tooltip
                      key={`tooltip-${mode.index}`}
                      content={
                        mode.index === 1
                          ? "Higher quality with enhanced motion"
                          : "Balanced quality and speed"
                      }
                    >
                      <Button
                        key={mode.index}
                        pressed={videoModeIndex === mode.index}
                        onClick={() => handleModeClick(mode.index)}
                        disabled={mode.index === 1} // Disable second button
                      >
                        {mode.label}
                      </Button>
                    </Tooltip>
                  ))}
                </ButtonGroup>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <BlockStack gap="100">
                <Text as="h3" variant="headingMd">
                  Generated Video
                </Text>
                <Text variant="bodyMd" as="p">
                  {isGenerating
                    ? `Video is ${getStatusMessage(currentStatus).toLowerCase()}`
                    : "Select an image to generate a video"}
                </Text>
              </BlockStack>

              <Divider />

              <Box
                background="bg-surface"
                shadow="card"
                borderRadius="200"
                overflow="hidden"
              >
                <Box>
                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      overflow: "hidden",
                      height: "310px",
                      width: "100%",
                      borderRadius: "8px 8px 0 0",
                    }}
                  >
                    {generatedVideoUrl ? (
                      <video
                        src={generatedVideoUrl}
                        controls
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "8px 8px 0 0",
                        }}
                        onError={(e) => {
                          console.error(
                            "Failed to load video:",
                            generatedVideoUrl
                          );
                        }}
                      />
                    ) : isGenerating ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          height: "100%",
                          width: "100%",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#f6f6f7",
                          borderRadius: "8px 8px 0 0",
                          gap: "16px",
                        }}
                      >
                        <Spinner size="large" />
                        <Text variant="bodyMd" as="p" tone="subdued">
                          {getStatusMessage(currentStatus)}
                        </Text>
                        {currentStatus && (
                          <Badge tone={getStatusTone(currentStatus)}>
                            {currentStatus.replace("_", " ")}
                          </Badge>
                        )}
                        {generationProgress > 0 && (
                          <Box minWidth="150px">
                            <PolarisProgressBar
                              progress={generationProgress}
                              size="small"
                              tone="primary"
                            />
                          </Box>
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          height: "100%",
                          width: "100%",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#d4d4d8",
                          borderRadius: "8px 8px 0 0",
                        }}
                      >
                        <Icon source={PlayIcon} tone="subdued" />
                      </div>
                    )}
                  </div>
                </Box>

                <Box background="bg-surface-secondary" padding="400">
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
                       {/* later i will use  */}
                        {/* <Button
                          variant="secondary"
                          size="large"
                          icon={<DownloadIcon />}
                          disabled={!generatedVideoUrl}
                          onClick={() => {
                            if (generatedVideoUrl) {
                              downloadFileFromUrl(
                                generatedVideoUrl,
                                "generated-video.mp4"
                              );
                            }
                          }}
                        /> */}
                    </div>
                  </div>
                </Box>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Generate Button */}
      <Layout>
        <Layout.Section>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "40px",
              marginBottom: "40px",
            }}
          >
            <Button
              variant="primary"
              size="medium"
              onClick={handleGenerateVideo}
              disabled={isGenerating || !isImageSelected}
              loading={isGenerating}
            >
              {isGenerating
                ? `${currentStatus?.replace("_", " ") || "Generating"}...`
                : "Generate Video"}
            </Button>
          </div>
        </Layout.Section>
      </Layout>

      {/* Image Selection Modal */}
      <Modal id="image-selection-modal" variant="large">
        <Box padding="400">
          <Grid
            columns={{ xs: 1, sm: 4, md: 4, lg: 4, xl: 4 }}
            areas={{
              xs: ["tabs", "content"],
              sm: ["tabs content content content"],
              md: ["tabs content content content"],
              lg: ["tabs content content content"],
              xl: ["tabs content content content"],
            }}
          >
            <Grid.Cell area="tabs">
              <Card>
                <BlockStack gap="300">
                  <Text variant="headingMd" as="h3">
                    My library
                  </Text>
                  <div>
                    {tabs.map((tab, index) => (
                      <div
                        key={tab.id}
                        style={{
                          padding: "12px 16px",
                          backgroundColor:
                            activeTab === index
                              ? "var(--p-color-bg-surface-selected)"
                              : "transparent",
                          borderRadius: "8px",
                          marginBottom: "4px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onClick={() => handleTabChange(index)}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            minHeight: "20px",
                          }}
                        >
                          <div
                            style={{
                              width: "20px",
                              height: "20px",
                              flexShrink: 0,
                            }}
                          >
                            <tab.icon />
                          </div>
                          <Text
                            variant="bodyMd"
                            as="p"
                            tone={activeTab === index ? "emphasis" : undefined}
                            fontWeight={
                              activeTab === index ? "semibold" : undefined
                            }
                          >
                            {tab.content}
                          </Text>
                        </div>
                      </div>
                    ))}
                  </div>
                </BlockStack>
              </Card>
            </Grid.Cell>

            <Grid.Cell area="content">
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h3">
                    {tabs[activeTab].content}
                  </Text>
                  {productsLoading ? (
                    <LoadingStates.CardLoader message="Loading your products..." />
                  ) : (
                    renderTabContent()
                  )}
                </BlockStack>
              </Card>
            </Grid.Cell>
          </Grid>
        </Box>

        <TitleBar title="Select Image">
          <button
            variant="primary"
            onClick={handleUseSelectedItems}
            disabled={(!selectedFile && !selectedProduct) || productsLoading}
          >
            {productsLoading ? (
              <span
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Spinner size="small" />
                Loading...
              </span>
            ) : (
              "Add Selected Image"
            )}
          </button>
        </TitleBar>
      </Modal>
    </Page>
  );
};

export default VideoTemplate;
