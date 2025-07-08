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
import DownloadIcon from "../../../../components/common/DownloadIcon";

// Constants
const VIDEO_DURATIONS = [
  { index: 0, label: "5s", value: "5", credits: 1.6 },
  { index: 1, label: "10s", value: "10", credits: 1.6 },
];

const VIDEO_MODES = [
  {
    index: 0,
    label: "Std",
    value: "std",
    credits: 1.6,
    endpoint: "kling-std",
  },
  {
    index: 1,
    label: "Pro",
    value: "pro",
    credits: 1.6,
    endpoint: "kling-pro",
  },
];

const TABS = {
  UPLOAD: 0,
  PRODUCTS: 1,
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Static motion prompt
const STATIC_MOTION_PROMPT =
  "The camera slowly zooms in while maintaining smooth, natural movement. The subject remains in focus with subtle, realistic motion that enhances the overall visual appeal.";

// API Configuration
const getWebSocketUrl = () => {
  let url =
    (typeof import.meta !== "undefined" &&
      import.meta.env?.VITE_WEBSOCKET_URL) ||
    (typeof process !== "undefined" && process.env?.REACT_APP_WEBSOCKET_URL) ||
    (typeof window !== "undefined" && window.WEBSOCKET_URL) ||
    "ws://localhost:3000";

  // Fix common mistake: "wss:https//..." → "wss://..."
  url = url.replace(/^wss?:https\/\//, "wss://");

  // Validate: must start with ws:// or wss://
  if (!/^wss?:\/\//.test(url)) {
    console.warn(
      `[WebSocket] Invalid WebSocket URL "${url}", defaulting to ws://localhost:3000`
    );
    return "ws://localhost:3000";
  }

  return url;
};

const API_CONFIG = {
  baseUrl: "/api/v1/app",
  websocketUrl: getWebSocketUrl(),
};

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

// Utility Functions
const validateFile = (file) => {
  if (!file.type.startsWith("image/")) {
    return { valid: false, error: `${file.name} is not a valid image file` };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `${file.name} is too large (max 10MB)` };
  }
  return { valid: true };
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
                                <div style={{ height: "32px", backgroundColor: "#f6f6f7", borderRadius: "4px" }} />
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

  // Video generation specific loader
  VideoGenerationLoader: ({ progress, message, onCancel }) => (
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
        {/* <Text variant="headingMd" as="h3" alignment="center">
          Generating Your Video
        </Text> */}
        <Text variant="bodyMd" as="p" alignment="center" tone="subdued">
          {message || "This may take a few minutes..."}
        </Text>
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

      {/* {onCancel && (
        <Button variant="secondary" tone="critical" onClick={onCancel}>
          Cancel Generation
        </Button>
      )} */}
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

  // return (
  //   <Card sectioned>
  //     <BlockStack gap="400">
  //       {/* Header */}
  //       <InlineStack align="space-between" blockAlign="center">
  //         <InlineStack gap="200" blockAlign="center">
  //           <Spinner size="small" />
  //           <Text variant="headingMd" as="h3">
  //             Generating Video
  //           </Text>
  //         </InlineStack>

  //         <Button
  //           variant="tertiary"
  //           tone="critical"
  //           size="micro"
  //           onClick={onCancel}
  //         >
  //           Cancel
  //         </Button>
  //       </InlineStack>

  //       {/* Progress Section */}
  //       <BlockStack gap="200">
  //         <PolarisProgressBar
  //           progress={progress}
  //           size="large"
  //           tone={progress >= 95 ? "success" : "primary"}
  //         />

  //         <InlineStack align="space-between" blockAlign="center">
  //           <Text variant="bodyMd" as="p">
  //             {progress}% complete
  //           </Text>
  //           {getTimeRemaining() && (
  //             <Text variant="bodyMd" as="p" tone="subdued">
  //               {getTimeRemaining()}
  //             </Text>
  //           )}
  //         </InlineStack>
  //       </BlockStack>

  //       {/* Status and Details */}
  //       <BlockStack gap="200">
  //         <InlineStack gap="200" blockAlign="center">
  //           <Badge tone={progress >= 95 ? "success" : "highlight"}>
  //             {status ||
  //               (progress >= 95
  //                 ? "Finalizing"
  //                 : progress >= 50
  //                   ? "Processing"
  //                   : "In Queue")}
  //           </Badge>

  //           {connectionStatus && (
  //             <Badge
  //               tone={connectionStatus === "Connected" ? "success" : "warning"}
  //             >
  //               WebSocket: {connectionStatus}
  //             </Badge>
  //           )}
  //         </InlineStack>

  //         {currentCreationId && (
  //           <Text variant="bodySm" as="p" tone="subdued">
  //             Creation ID: {currentCreationId.substring(0, 12)}...
  //           </Text>
  //         )}
  //       </BlockStack>

  //       {/* Help Text */}
  //       <Box padding="300" background="bg-surface-secondary" borderRadius="200">
  //         <Text variant="bodySm" as="p" tone="subdued" alignment="center">
  //           💡 Your video is being processed. You can safely navigate away and
  //           return later.
  //         </Text>
  //       </Box>
  //     </BlockStack>
  //   </Card>
  // );
};

// Custom Hook for WebSocket Management
const useWebSocket = (onCreationUpdate) => {
  const [ws, setWs] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [userId] = useState(
    () => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );

  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    try {
      console.log(`Connecting to WebSocket: ${API_CONFIG.websocketUrl}`);
      const websocket = new WebSocket(API_CONFIG.websocketUrl);

      websocket.onopen = () => {
        console.log("WebSocket connected successfully");
        setConnectionStatus("Connected");
        reconnectAttempts.current = 0;
        setWs(websocket);
        // Send authentication
        websocket.send(
          JSON.stringify({
            type: "auth",
            userId: userId,
            timestamp: Date.now(),
          })
        );
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case "creation_update":
              // Handle creation status updates
              if (onCreationUpdate) {
                onCreationUpdate(data);
              }
              break;
            case "auth_success":
              console.log("WebSocket authentication successful");
              break;
            case "error":
              console.error("WebSocket error message:", data.message);
              break;
            default:
              console.log("Unknown WebSocket message:", data);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      websocket.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason);
        setConnectionStatus("Disconnected");
        setWs(null);

        // Attempt to reconnect
        if (event.code !== 1000 && reconnectAttempts.current < 5) {
          reconnectAttempts.current++;
          setConnectionStatus("Reconnecting");

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      websocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnectionStatus("Error");
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      setConnectionStatus("Error");
    }
  }, [userId, onCreationUpdate]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (ws) {
      ws.close(1000, "Manual disconnect");
      setWs(null);
    }

    setConnectionStatus("Disconnected");
    reconnectAttempts.current = 0;
  }, [ws]);

  const sendMessage = useCallback(
    (message) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        const messageWithUserId = {
          ...message,
          userId: userId,
          timestamp: Date.now(),
        };

        ws.send(JSON.stringify(messageWithUserId));
        return true;
      }
      return false;
    },
    [ws, userId]
  );

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    connectionStatus,
    userId,
    sendMessage,
    disconnect,
    reconnect: connect,
  };
};

// Custom Hook for Video Generation API
const useVideoGeneration = (shopify) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentCreationId, setCurrentCreationId] = useState(null);
  const [generationResult, setGenerationResult] = useState(null);

  // Handle creation updates from WebSocket
  const handleCreationUpdate = useCallback(
    (data) => {
      const { creationId, status, progress, outputMap, failureReason } = data;

      console.log("Received creation update:", data);

      // Only process updates for the current creation
      if (creationId !== currentCreationId) {
        return;
      }

      switch (status?.toLowerCase()) {
        case "pending":
        case "queued":
          setGenerationProgress(Math.max(5, progress || 5));
          break;
        case "in_progress":
        case "processing":
          setGenerationProgress(Math.max(10, Math.min(progress || 50, 95)));
          break;
        case "completed":
          setGenerationProgress(100);
          setIsGenerating(false);
          setCurrentCreationId(null);

          if (outputMap && outputMap.length > 0) {
            setGenerationResult({
              success: true,
              videoUrl: outputMap[0].outputUrl,
              creationId: creationId,
            });
          } else {
            setGenerationResult({
              success: false,
              error: "Video completed but no output URL provided",
              creationId: creationId,
            });
          }
          break;
        case "failed":
        case "error":
          setIsGenerating(false);
          setCurrentCreationId(null);
          setGenerationProgress(0);

          setGenerationResult({
            success: false,
            error: failureReason || "Video generation failed",
            creationId: creationId,
          });
          break;
      }
    },
    [currentCreationId]
  );

  const { connectionStatus, sendMessage } = useWebSocket(handleCreationUpdate);

  // Create video generation function
  const generateVideo = useCallback(
    async (params) => {
      try {
        setIsGenerating(true);
        setGenerationProgress(0);
        setGenerationResult(null);

        const headers = getShopifyHeaders(shopify);
        const shop = shopify?.config?.shop;

        // Prepare creation payload that matches your backend expectations
        const creationPayload = {
          templateId: "686393535e6019e1260b17ac",
          type: "video",
          inputMap: params.selectedProduct
            ? [
                {
                  productId: params.selectedProduct.id,
                  imageUrl: params.selectedProduct.thumbnail,
                },
              ]
            : [],
          inputImages: [params.image], // The base64 image data or URL
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
          // Add the image data for Freepik API
          image: params.image,
        };

        console.log("Creating video generation request:", creationPayload);

        // Create the creation record
        const response = await fetch(
          `${API_CONFIG.baseUrl}/creations`, // REMOVE `?shop=...`
          {
            method: "POST",
            headers,
            credentials: "include", // 🛠️ THIS IS CRUCIAL
            body: JSON.stringify(creationPayload),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          );
        }

        const creationData = await response.json();
        const creationId = creationData._id || creationData.id;

        if (!creationId) {
          throw new Error("No creation ID received from API");
        }

        setCurrentCreationId(creationId);
        console.log("Created video generation with ID:", creationId);

        // Subscribe to creation updates via WebSocket if connected
        if (connectionStatus === "Connected") {
          const subscribeMessage = {
            type: "subscribe_creation",
            creationId: creationId,
          };

          const messageSent = sendMessage(subscribeMessage);

          if (!messageSent) {
            console.warn(
              "Failed to subscribe to creation updates via WebSocket"
            );
          }
        }

        // Return a promise that resolves when the video is ready
        return new Promise((resolve, reject) => {
          const checkResult = () => {
            if (generationResult) {
              if (generationResult.success) {
                resolve({
                  video_url: generationResult.videoUrl,
                  creation_id: generationResult.creationId,
                });
              } else {
                reject(new Error(generationResult.error));
              }
            } else {
              setTimeout(checkResult, 100);
            }
          };

          checkResult();

          // Timeout after 15 minutes
          setTimeout(
            () => {
              if (isGenerating) {
                setIsGenerating(false);
                setCurrentCreationId(null);
                reject(
                  new Error(
                    "Video generation timeout - no response after 15 minutes"
                  )
                );
              }
            },
            15 * 60 * 1000
          );
        });
      } catch (error) {
        console.error("Video generation error:", error);
        setIsGenerating(false);
        setGenerationProgress(0);
        setCurrentCreationId(null);
        throw error;
      }
    },
    [connectionStatus, sendMessage, shopify, generationResult, isGenerating]
  );

  // Cancel generation
  const cancelGeneration = useCallback(() => {
    if (currentCreationId) {
      sendMessage({
        type: "unsubscribe_creation",
        creationId: currentCreationId,
      });
    }

    setIsGenerating(false);
    setGenerationProgress(0);
    setCurrentCreationId(null);
    setGenerationResult(null);
  }, [currentCreationId, sendMessage]);

  return {
    generateVideo,
    cancelGeneration,
    isGenerating,
    generationProgress,
    currentCreationId,
    connectionStatus,
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

// Simplified components for brevity
const ProductDropdown = React.memo(
  ({
    products,
    popoverActive,
    onProductSelect,
    onClose,
    selectedProductValue,
  }) => {
    if (!popoverActive || products.length === 0) return null;

    return (
      <>
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "white",
            border: "1px solid var(--p-color-border)",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            maxHeight: "300px",
            overflowY: "auto",
            zIndex: 10001,
            marginTop: "4px",
          }}
        >
          {products.map((product) => (
            <div
              key={product.value}
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                borderBottom: "1px solid var(--p-color-border-subdued)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                backgroundColor:
                  selectedProductValue === product.value
                    ? "var(--p-color-bg-surface-selected)"
                    : "transparent",
              }}
              onClick={() => onProductSelect(product.value)}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "6px",
                  overflow: "hidden",
                  backgroundColor: "#f6f6f7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
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
                  />
                ) : (
                  <Icon source={ImageIcon} tone="subdued" />
                )}
              </div>
              <Text variant="bodyMd" as="p">
                {product.label}
              </Text>
            </div>
          ))}
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
  }
);

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

// Main Component
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
    cancelGeneration,
    isGenerating,
    generationProgress,
    currentCreationId,
    connectionStatus,
  } = useVideoGeneration(shopify);

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
      if (isError) {
        shopify.toast.show(message, { duration: 5000, isError: true });
      } else {
        shopify.toast.show(message, { duration: 3000 });
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
    [showToast]
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

        if (product.thumbnail) {
          setSelectedImagePreview(product.thumbnail);
        } else {
          setSelectedImagePreview("");
          showToast("Product selected but no image available", true);
        }
      }
    },
    [products, showToast]
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

        if (product.thumbnail) {
          setSelectedImagePreview(product.thumbnail);
        } else {
          setSelectedImagePreview("");
          showToast("Product selected but no image available", true);
        }
      }
    },
    [showToast]
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
    } else {
      showToast("❌ No image selected or selected product has no image", true);
    }
  }, [selectedFile, selectedProduct, shopify, showToast]);

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
        image: imageUrl, // Send base64 or URL
        duration: VIDEO_DURATIONS[videoDurationIndex].value,
        mode: VIDEO_MODES[videoModeIndex].label,
        cfgScale: videoModeIndex === 1 ? 0.8 : 0.5,
        totalCredits: calculateTotalCredits(),
        selectedProduct: selectedProduct,
      };

      const totalCredits = calculateTotalCredits();
      showToast(
        `🚀 Starting video generation... (${totalCredits} credits)`,
        false
      );

      const result = await generateVideo(params);

      if (result?.video_url) {
        setGeneratedVideoUrl(result.video_url);
        showToast("🎉 Video generated successfully!", false);
      } else {
        throw new Error("No video URL in response");
      }
    } catch (error) {
      console.error("Video generation failed:", error);
      showToast(`❌ Video generation failed: ${error.message}`, true);
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

            {uploadingFiles && (
              <LoadingStates.FileUploadLoader filesCount={files.length + 1} />
            )}

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
    >
      {/* Connection Status Indicator */}
      {connectionStatus !== "Connected" && (
        <Box padding="200">
          <InlineStack gap="200" blockAlign="center">
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
          </InlineStack>
        </Box>
      )}

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
                    >
                      {duration.label}
                    </Button>
                  ))}
                </ButtonGroup>
                {/* <Text variant="bodyMd" as="p" tone="subdued">
                  Duration cost: {VIDEO_DURATIONS[videoDurationIndex].credits}{" "}
                  credits
                </Text> */}
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

                {/* <Text variant="bodyMd" as="p" tone="subdued">
                  Mode cost: {VIDEO_MODES[videoModeIndex].credits} credits
                </Text> */}
              </BlockStack>
            </Card>

            {/* Credit Summary & Generation Info - Only show when image is selected */}
            {/* {isImageSelected && (
              <Card>
                <Box padding="400">
                  <BlockStack gap="200">
                    <Text variant="headingMd">Generation Summary</Text>
                    <div
                      style={{
                        backgroundColor: "#f6f6f7",
                        padding: "16px",
                        borderRadius: "8px",
                        border: "1px solid #e1e3e5",
                      }}
                    >
                      <BlockStack gap="100">
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Text variant="bodyMd" as="p">
                            Duration (
                            {VIDEO_DURATIONS[videoDurationIndex].label}):
                          </Text>
                          <Text variant="bodyMd" as="p" fontWeight="semibold">
                            {VIDEO_DURATIONS[videoDurationIndex].credits}{" "}
                            credits
                          </Text>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Text variant="bodyMd" as="p">
                            Mode ({VIDEO_MODES[videoModeIndex].label}):
                          </Text>
                          <Text variant="bodyMd" as="p" fontWeight="semibold">
                            {VIDEO_MODES[videoModeIndex].credits} credits
                          </Text>
                        </div>
                        <Divider />
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Text variant="bodyMd" as="p" fontWeight="bold">
                            Total Cost:
                          </Text>
                          <Text
                            variant="bodyMd"
                            as="p"
                            fontWeight="bold"
                            tone="success"
                          >
                            {calculateTotalCredits()} credits
                          </Text>
                        </div>
                      </BlockStack>
                    </div>
                    <Text variant="bodyMd" as="p" tone="subdued">
                      Motion optimized automatically • Enhanced with Polaris UI
                    </Text>
                    {selectedProduct && (
                      <Text variant="bodyMd" as="p" tone="info">
                        🛍️ Associated with product:{" "}
                        <strong>{selectedProduct.label}</strong>
                      </Text>
                    )}
                  </BlockStack>
                </Box>
              </Card>
            )} */}
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <BlockStack gap="100">
                <Text as="h3" variant="headingMd">
                  Generated Image
                </Text>
                <Text variant="bodyMd" as="p">
                  {isGenerating
                    ? "Image is generating, you can check it in the library"
                    : "Select an image and enter a prompt to generate a new background"}
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
                      <img
                        src={generatedVideoUrl}
                        alt="Selected or Generated image"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          cursor: "pointer",
                          borderRadius: "8px 8px 0 0",
                        }}
                        onClick={() => {
                          if (generatedVideoUrl) {
                            console.log("Image clicked for editing");
                          }
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
                          Generating image...
                        </Text>
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
                        <Icon source={ImageIcon} tone="subdued" />
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
                      <Button
                        variant="secondary"
                        size="large"
                        icon={<DownloadIcon />}
                        disabled={!generatedVideoUrl}
                      />
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
            >
              Generate Video
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
