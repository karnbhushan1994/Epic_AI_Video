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
import DownloadIcon from "../../../../components/common/icon/DownloadIcon";

import {
  TABS,
  MAX_FILE_SIZE,
  VALID_IMAGE_TYPES,
  API_CONFIG,
} from "../../../../utils/videoConstants";

import { validateFile } from "../../../../utils/fileUtils";

// Import the modular socket hook
import {
  useSocketIO,
  SocketEmitters,
} from "../../../../hooks/useSocketIO";
import { downloadFileFromUrl } from "../../../../../utils/downloadFile";

// Background Removal Status Constants
const BG_REMOVAL_STATUS = {
  IDLE: 'IDLE',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  ERROR: 'ERROR'
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

  // Background removal specific loader
  BackgroundRemovalLoader: ({ progress, message, status }) => (
    <BlockStack gap="400" align="center">
      <div style={{ position: "relative", display: "inline-block" }}>
        <Spinner accessibilityLabel="Removing background" size="large" />
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
    case BG_REMOVAL_STATUS.IN_PROGRESS:
      return "Removing background...";
    case BG_REMOVAL_STATUS.COMPLETED:
      return "Background removed successfully!";
    case BG_REMOVAL_STATUS.FAILED:
    case BG_REMOVAL_STATUS.ERROR:
      return "Background removal FAILED";
    case BG_REMOVAL_STATUS.IDLE:
    default:
      return "Ready to process";
  }
};

const getStatusTone = (status) => {
  switch (status) {
    case BG_REMOVAL_STATUS.IN_PROGRESS:
      return "attention";
    case BG_REMOVAL_STATUS.COMPLETED:
      return "success";
    case BG_REMOVAL_STATUS.FAILED:
    case BG_REMOVAL_STATUS.ERROR:
      return "critical";
    case BG_REMOVAL_STATUS.IDLE:
    default:
      return "subdued";
  }
};

const getProgressByStatus = (status) => {
  switch (status) {
    case BG_REMOVAL_STATUS.IN_PROGRESS:
      return 50;
    case BG_REMOVAL_STATUS.COMPLETED:
      return 100;
    default:
      return 0;
  }
};

// Custom Hook for Background Removal API
const useBackgroundRemoval = (shopify) => {
  const [isIN_PROGRESS, setIsIN_PROGRESS] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState(BG_REMOVAL_STATUS.IDLE);
  const [result, setResult] = useState(null);

  // Use the modular socket hook
  const {
    connected,
    emitEvent,
  } = useSocketIO();

  const removeBackground = useCallback(
    async (params) => {
      try {
        setIsIN_PROGRESS(true);
        setProgress(10);
        setResult(null);
        setCurrentStatus(BG_REMOVAL_STATUS.IN_PROGRESS);

        const headers = getShopifyHeaders(shopify);

        // Prepare the API payload
        const payload = {
          image_url: params.imageUrl,
        };

        setProgress(30);

        // Call the background removal API
        const res = await fetch("/api/v1/app/freepik/remove-background", {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify(payload),
        });

        setProgress(70);

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.message || "FAILED to remove background");
        }

        setProgress(90);

        // Store the result in backend
        const creationRes = await fetch(`${API_CONFIG.baseUrl}/creations`, {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({
            templateId: "bg-removal-template",
            type: "background_removal",
            inputMap: params.selectedProduct
              ? [
                  {
                    productId: params.selectedProduct.id,
                    imageUrl: params.selectedProduct.thumbnail,
                  },
                ]
              : [],
            inputImages: [params.imageUrl],
            associatedProductIds: params.selectedProduct
              ? [params.selectedProduct.id]
              : [],
            creditsUsed: 1, // Background removal typically costs 1 credit
            meta: {
              originalImage: params.imageUrl,
              processedAt: new Date().toISOString(),
            },
            outputMap: [
              {
                productId: params.selectedProduct?.id || "uploaded_image",
                outputUrl: json.url || json.high_resolution,
                previewUrl: json.preview,
                originalUrl: json.original,
              }
            ],
          }),
        });

        if (!creationRes.ok) {
          console.warn("FAILED to store creation in backend");
        }

        setProgress(100);
        setCurrentStatus(BG_REMOVAL_STATUS.COMPLETED);
        setIsIN_PROGRESS(false);

        setResult({
          success: true,
          original: json.original,
          high_resolution: json.high_resolution,
          preview: json.preview,
          url: json.url,
          originalImageUrl: params.imageUrl,
        });
      } catch (err) {
        console.error("❌ removeBackground error:", err.message);
        setIsIN_PROGRESS(false);
        setProgress(0);
        setCurrentStatus(BG_REMOVAL_STATUS.FAILED);
        setResult({
          success: false,
          error: err.message,
        });
        throw err;
      }
    },
    [shopify]
  );

  const resetState = useCallback(() => {
    setIsIN_PROGRESS(false);
    setProgress(0);
    setCurrentStatus(BG_REMOVAL_STATUS.IDLE);
    setResult(null);
  }, []);

  return {
    removeBackground,
    resetState,
    isIN_PROGRESS,
    progress,
    currentStatus,
    connectionStatus: connected ? "Connected" : "Disconnected",
    result,
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
      console.error("FAILED to fetch products:", error);
      setError("FAILED to load products. Please try again.");
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

// Main Background Removal Component
const BackgroundRemovalTemplate = () => {
  const { id } = useParams();
  const shopify = useAppBridge();
  const {
    products,
    loading: productsLoading,
    error: productsError,
  } = useProducts();
  const {
    removeBackground,
    resetState,
    isIN_PROGRESS,
    progress,
    currentStatus,
    connectionStatus,
    result,
  } = useBackgroundRemoval(shopify);

  // Use the modular Socket.IO hook
  const { connected, serverMessage, emitEvent } = useSocketIO();

  // State
  const [selectedImagePreview, setSelectedImagePreview] = useState("");
  const [activeTab, setActiveTab] = useState(TABS.PRODUCTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [files, setFiles] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [popoverActive, setPopoverActive] = useState(false);
  const [selectedProductValue, setSelectedProductValue] = useState("");
  const [processedImageUrl, setProcessedImageUrl] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Handle background removal results
  useEffect(() => {
    if (result) {
      if (result.success && result.url) {
        setProcessedImageUrl(result.url);
        showToast("🎉 Background removed successfully!");
      } else if (!result.success) {
        showToast(
          `❌ Background removal FAILED: ${result.error}`,
          true
        );
      }
    }
  }, [result]);

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

          // Simulate IN_PROGRESS time for user feedback
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

  // Remove Background Handler
  const handleRemoveBackground = useCallback(async () => {
    if (!selectedImagePreview) {
      showToast("Please select an image first", true);
      return;
    }

    try {
      let imageUrl = selectedImagePreview;

      // If it's a file, we need to upload it first or convert to a publicly accessible URL
      if (selectedFile) {
        // For the API call, we need a publicly accessible URL
        // You might need to upload the file to your server first and get a public URL
        // For now, we'll assume the selectedImagePreview is already a valid URL
        // In a real implementation, you'd upload the file and get its URL
        showToast("Please note: For file uploads, ensure the image is publicly accessible", true);
        return;
      } else if (!isValidImageUrl(selectedImagePreview)) {
        showToast("Invalid image URL", true);
        return;
      }

      const params = {
        imageUrl: imageUrl,
        selectedProduct: selectedProduct,
      };

      // Notify server via Socket.IO about background removal start
      SocketEmitters.backgroundRemovalStarted && SocketEmitters.backgroundRemovalStarted(
        emitEvent,
        !!selectedProduct
      );

      showToast("Starting background removal...", false);
      await removeBackground(params);
    } catch (error) {
      console.error("Background removal FAILED:", error);
      showToast(`❌ Background removal FAILED: ${error.message}`, true);

      // Notify server via Socket.IO about removal failure
      SocketEmitters.backgroundRemovalFAILED && SocketEmitters.backgroundRemovalFAILED(emitEvent, error.message);
    }
  }, [
    selectedImagePreview,
    selectedFile,
    removeBackground,
    showToast,
    selectedProduct,
    emitEvent,
  ]);

  const handleTabChange = useCallback((selectedTabIndex) => {
    setActiveTab(selectedTabIndex);
  }, []);

  const handleReset = useCallback(() => {
    resetState();
    setProcessedImageUrl("");
  }, [resetState]);

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
      title="Background Removal"
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
          {/* Display current IN_PROGRESS status */}
          {isIN_PROGRESS && currentStatus && (
            <Badge tone={getStatusTone(currentStatus)}>
              Status: {currentStatus.replace("_", " ")}
            </Badge>
          )}
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
                  Choose or upload an image to remove its background
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
                                "FAILED to load image:",
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

            {/* IN_PROGRESS Info */}
            {/* <Card>
              <BlockStack gap="400">
                <Text variant="headingMd">Background Removal</Text>
                <Text variant="bodyMd" as="p" tone="subdued">
                  Remove the background from your selected image using AI technology. 
                  This process typically costs 1 credit per image.
                </Text>
                {result && !result.success && (
                  <div style={{ marginTop: "16px" }}>
                    <Button onClick={handleReset} variant="secondary" size="medium">
                      Try Again
                    </Button>
                  </div>
                )}
              </BlockStack>
            </Card> */}
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <BlockStack gap="100">
                <Text as="h3" variant="headingMd">
                  Processed Image
                </Text>
                <Text variant="bodyMd" as="p">
                  {isIN_PROGRESS
                    ? `${getStatusMessage(currentStatus)}`
                    : processedImageUrl
                    ? "Background removed successfully"
                    : "Select an image to remove its background"}
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
                    {processedImageUrl ? (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: "linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)",
                          backgroundSize: "20px 20px",
                          backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <img
                          src={processedImageUrl}
                          alt="Background removed"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                            borderRadius: "8px 8px 0 0",
                          }}
                          onError={(e) => {
                            console.error(
                              "FAILED to load processed image:",
                              processedImageUrl
                            );
                          }}
                        />
                      </div>
                    ) : isIN_PROGRESS ? (
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
                        <LoadingStates.BackgroundRemovalLoader
                          progress={progress}
                          status={currentStatus}
                        />
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
                        disabled={!processedImageUrl}
                        onClick={() => {
                          if (processedImageUrl) {
                            downloadFileFromUrl(
                              processedImageUrl,
                              "background-removed.png"
                            );
                          }
                        }}
                      >
                      </Button>
                    </div>
                  </div>
                </Box>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Process Button */}
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
              onClick={handleRemoveBackground}
              disabled={isIN_PROGRESS || !isImageSelected}
              loading={isIN_PROGRESS}
            >
              {isIN_PROGRESS
                ? `${currentStatus?.replace("_", " ") || "IN_PROGRESS"}...`
                : "Remove Background"}
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

export default BackgroundRemovalTemplate;