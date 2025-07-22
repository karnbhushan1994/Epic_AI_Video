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
  OptionList,
  Link,
} from "@shopify/polaris";
import {
  ImageIcon,
  PlusIcon,
  NoteIcon,
  SearchIcon,
  PlayIcon,
  UploadIcon,
  XCircleIcon,
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
import FileGrid from "../../../../components/video/FileGrid";
import { LoadingStates } from "../../../../components/video/loaders";
import ProductDropdown from "../../../../components/video/ProductDropdown";
import ProductGrid from "../../../../components/video/ProductGrid";
import {
  getStatusMessage,
  getStatusTone,
} from "../../../../utils/videoConstants";

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
import { useVideoGenerator } from "../../../../components/video/useVideoGenerator";
import { useProducts } from "../../../../components/video/useProducts";
import ShopifyProductIcon from "../../../../components/common/icon/ShopifyProductIcon";
import { uploadImage } from "../../../../utils/imageUtils";
import { useSearchParams } from "react-router-dom";

const isValidImageUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Main VideoTemplate Component
const VideoTemplate = () => {
  const bottomRef = useRef(null);
  const shopify = useAppBridge();
  const storeName = shopify.config.shop.split('.')[0]; // "epicapp-ekumbh"
const appName = "epicapp-ai-videos"; // Replace with your app's actual slug

const fullUrl = `https://admin.shopify.com/store/${storeName}/apps/${appName}/library`;

  const {
    products,
    loading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useProducts();
  const { id } = useParams();
  const [prompt, setPrompt] = useState("");
  useEffect(() => {
    if (!id) return;
    fetch(`/api/v1/app/template/${id}/prompt`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Cache-Control": "no-cache",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setPrompt(data.prompt || "");
        // alert(data.prompt || "No prompt found");
      })
      .catch((err) => console.error("Fetch error:", err));
  }, [id]);

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
  } = useVideoGenerator(shopify);

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
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (src, title) => {
    setIsDownloading(true);
    const proxyUrl = `/api/v1/app/proxy-download?url=${encodeURIComponent(
      src
    )}&filename=${encodeURIComponent(title || "download")}`;

    try {
      const response = await fetch(proxyUrl, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to download file.");

      const blob = await response.blob();
      const contentType = response.headers.get("content-type");
      const extension = contentType?.split("/")[1] || "bin";
      const fileName = `${title || "download"}.${extension}`;

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle video generation results
  useEffect(() => {
    if (generationResult) {
      if (generationResult.success && generationResult.videoUrl) {
        setGeneratedVideoUrl(generationResult.videoUrl);
        showToast("Video generated successfully!");
      } else if (!generationResult.success) {
        showToast(`Video generation FAILED: ${generationResult.error}`, true);
      }
    }
  }, [generationResult]);

  // Handle video updates from Socket.IO
  useEffect(() => {
    if (videoUpdates) {
      console.log("IN_PROGRESS video update:", videoUpdates);
      if (
        videoUpdates.status === VIDEO_STATUS.COMPLETED &&
        videoUpdates.videoUrl
      ) {
        setGeneratedVideoUrl(videoUpdates.videoUrl);
        showToast("Video generated successfully via Socket.IO!");
      } else if (videoUpdates.status === VIDEO_STATUS.FAILED) {
        showToast(`Video generation FAILED: ${videoUpdates.error}`, true);
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
        showToast("Please upload valid image files only.", true);
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
            `${validFiles.length} image${
              validFiles.length > 1 ? "s" : ""
            } uploaded successfully`
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
      // showToast("Image selected successfully");
      shopify.modal.hide("image-selection-modal");
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });

      // Notify server via Socket.IO
      SocketEmitters.imageConfirmed(
        emitEvent,
        selectedImage.type,
        selectedImage.name
      );
    } else {
      showToast("No image selected or selected product has no image", true);
    }
  }, [selectedFile, selectedProduct, shopify, showToast, emitEvent]);

  // Generate Video Handler with Backend API Integration
  const handleGenerateVideo = useCallback(async () => {
    if (!selectedImagePreview) {
      showToast("Please select an image first", true);
      return;
    }

    const validImageExtensions = [".jpg", ".jpeg", ".png"];
    const acceptedFormatsText = validImageExtensions
      .map((ext) => ext.toUpperCase().replace(".", ""))
      .join(", ");

    const isValidImageExtension = (filenameOrUrl) => {
      if (!filenameOrUrl) return false;
      const lower = filenameOrUrl.toLowerCase();
      return validImageExtensions.some((ext) => lower.includes(ext));
    };

    try {
      let imageUrl = selectedImagePreview;

      if (selectedFile) {
        if (!isValidImageExtension(selectedFile.name)) {
          showToast(
            `Invalid image file type. Accepted formats: ${acceptedFormatsText}`,
            true
          );
          return;
        }

        try {
          showToast("Uploading image...");
          imageUrl = await uploadImage(selectedFile); // S3 Upload
        } catch (uploadError) {
          console.error("S3 upload failed:", uploadError);
          showToast("S3 Upload failed: " + uploadError.message, true);
          SocketEmitters.videoGenerationFAILED?.(
            emitEvent,
            uploadError.message
          );
          return;
        }
      } else {
        if (
          !isValidImageExtension(selectedImagePreview) ||
          !isValidImageUrl(selectedImagePreview)
        ) {
          showToast(
            `Invalid image URL. Accepted formats: ${acceptedFormatsText}`,
            true
          );
          return;
        }
      }

      const params = {
        image: imageUrl,
        duration: VIDEO_DURATIONS[videoDurationIndex].value,
        mode: VIDEO_MODES[videoModeIndex].label,
        prompt: prompt,
        cfgScale: videoModeIndex === 1 ? 0.8 : 0.5,
        totalCredits: calculateTotalCredits(),
        selectedProduct: selectedProduct,
      };

      const totalCredits = calculateTotalCredits();

      SocketEmitters.videoGenerationStarted(
        emitEvent,
        params.duration,
        prompt,
        params.mode,
        totalCredits,
        !!selectedProduct
      );

      showToast(`Starting video generation`, false);

      await generateVideo(params);
    } catch (error) {
      console.error("Video generation FAILED:", error);
      showToast(`Video generation FAILED: ${error.message}`, true);
      SocketEmitters.videoGenerationFAILED(emitEvent, error.message);
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
            <DropZone.FileUpload
              accept="image/jpeg, image/png"
              actionHint="Supported formats: .jpg, .png (max 10 mb each)"
            />
          </BlockStack>
        );

        return (
          <BlockStack gap="400">
            <DropZone
              accept="image/jpeg, image/png"
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
                  {/* <TextField
                    label=""
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onFocus={() => setPopoverActive(true)}
                    placeholder="Search products..."
                    autoComplete="off"
                    prefix={<Icon source={SearchIcon} />}
                  /> */}

                  <TextField
                    label=""
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onFocus={() => setPopoverActive(true)}
                    placeholder="Search products..."
                    autoComplete="off"
                    prefix={<Icon source={SearchIcon} />}
                    suffix={
                      searchQuery && (
                        <div
                          style={{
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                          }}
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedProduct(null);
                            setSelectedProductValue("");
                          }}
                        >
                          <Icon source={XCircleIcon} tone="base" />
                        </div>
                      )
                    }
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
                  products={filteredProducts}
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
                  Choose or upload a fashion model image to convert to AI video.
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

            {/* Video Settings */}
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd">Video duration</Text>
                {/* <ButtonGroup variant="segmented">
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
                </ButtonGroup> */}
                <Tooltip content="5s">
                  <Button
                    pressed={videoModeIndex === 0}
                    onClick={() => handleModeClick(1)}
                  >
                    {VIDEO_DURATIONS.find((mode) => mode.index === 0)?.label ||
                      "Mode 1"}
                  </Button>
                </Tooltip>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd">Video Mode</Text>
                {/* <ButtonGroup variant="segmented">
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
                </ButtonGroup> */}
                <Tooltip content="Standard quality video">
                  <Button
                    pressed={videoModeIndex === 0}
                    onClick={() => handleModeClick(1)}
                  >
                    {VIDEO_MODES.find((mode) => mode.index === 0)?.label ||
                      "Mode 1"}
                  </Button>
                </Tooltip>
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
                  {/* {isGenerating
                    ? `Video is ${getStatusMessage(
                        currentStatus
                      ).toLowerCase()}`
                    : "Select an image to generate a video"} */}
                  Generated video will appear here.
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
                      height: "202px",
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
                            "FAILED to load video:",
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
                          // gap: "16px",
                        }}
                      >
                        <Spinner size="small" />
                        <div style={{ textAlign: "center" }}>
                          <Text variant="bodyMd" as="p" tone="subdued">
                            Generating… You can leave this screen at any time.
                            Your video will appear in your{" "}
                            <Link url={fullUrl}>Library</Link> when it's ready.
                          </Text>
                        </div>
                        {currentStatus && (
                          <Badge tone={getStatusTone(currentStatus)}>
                            {/* {currentStatus.replace("_", " ")} */}
                          </Badge>
                        )}
                        {generationProgress > 0 && (
                          <Box minWidth="150px">
                            {/* <PolarisProgressBar
                              progress={generationProgress}
                              size="small"
                              tone="primary"
                            /> */}
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
                      <Tooltip content="Download">
                        <Button
                          disabled={!generatedVideoUrl}
                          variant="secondary"
                          size="small"
                          icon={<DownloadIcon />}
                          onClick={() =>
                            handleDownload(generatedVideoUrl, "generated Video")
                          }
                          loading={isDownloading}
                        />
                        {/* <Button
                          variant="secondary"
                          size="large"
                          icon={<DownloadIcon />}
                          disabled={!generatedVideoUrl}
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = generatedVideoUrl;
                            link.download = "generated-video.mp4";
                            link.click();
                          }}
                        /> */}
                      </Tooltip>
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
                ? `${currentStatus?.replace("_", " ") || "Generating"}`
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
      <div ref={bottomRef}></div>
    </Page>
  );
};

export default VideoTemplate;
