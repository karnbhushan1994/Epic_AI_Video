// BackgroundRemovalTemplate.jsx
import { useRef } from "react";
import useBackgroundRemoval from "../../../../components/BackgroundRemoval/useBackgroundRemoval";
import useProducts from "../../../../components/BackgroundRemoval/useProducts";
import FileGrid from "../../../../components/BackgroundRemoval/FileGrid";
import ProductGrid from "../../../../components/BackgroundRemoval/ProductGrid";
import ProductDropdown from "../../../../components/BackgroundRemoval/ProductDropdown";
//import Loaders from "../../../../components/BackgroundRemoval/Loaders";
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
} from "@shopify/polaris";
import { Modal, TitleBar, useAppBridge } from "@shopify/app-bridge-react";
const VALID_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
import { validateFile } from "../../../../utils/fileUtils";

import {
  ImageIcon,
  PlusIcon,
  NoteIcon,
  SearchIcon,
  PlayIcon,
} from "@shopify/polaris-icons";

import { LoadingStates } from "../../../../components/BackgroundRemoval/Loaders";
import DownloadIcon from "../../../../components/common/icon/DownloadIcon";
// other imports..
import { useParams } from "react-router-dom";
import { useSocketIO, SocketEmitters } from "../../../../hooks/useSocketIO";
import { useState, useEffect, useMemo, useCallback } from "react";
import { TABS } from "../../../../utils/videoConstants";
import UploadIcon from "../../../../components/common/icon/UploadIcon";
import ShopifyProductIcon from "../../../../components/common/icon/ShopifyProductIcon";
import { uploadImage } from "../../../../utils/imageUtils";
const BackgroundRemovalTemplate = () => {
  const bottomRef = useRef(null);

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
  //const [modalOpen, setModalOpen] = useState(false);
  //const handleImageSelect = () => setModalOpen(true);

  const isValidImageUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
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

  const BG_REMOVAL_STATUS = {
    IDLE: "IDLE",
    IN_PROGRESS: "IN_PROGRESS",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
    ERROR: "ERROR",
  };

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

  useEffect(() => {
    if (result) {
      if (result.success) {
        const imageUrl =
          result.url ||
          result.high_resolution ||
          result.preview ||
          result.original;

        if (imageUrl) {
          setProcessedImageUrl(imageUrl);
          showToast("Background removed successfully!");
        } else {
          showToast("No valid processed image URL received", true);
        }
      } else {
        showToast(`Background removal FAILED: ${result.error}`, true);
      }
    }
  }, [result, showToast]);

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
            `${validFiles.length} image${validFiles.length > 1 ? "s" : ""} uploaded successfully`
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
    setProcessedImageUrl("");
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
      showToast("Image selected successfully");
      shopify.modal.hide("image-selection-modal");
      // Scroll to bottom
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
  const handleRemoveBackground = useCallback(() => {
    const run = async () => {
      if (!selectedImagePreview) {
        showToast("Please select an image first", true);
        return;
      }

      try {
        setProcessedImageUrl(""); // clear previous result
        let imageUrl = selectedImagePreview;

        if (selectedFile) {
          try {
            showToast("Uploading image to S3...");
            imageUrl = await uploadImage(selectedFile); // ← S3 Upload

            if (!imageUrl) {
              showToast("Failed to upload image to S3", true);
              return;
            }
          } catch (uploadError) {
            console.error("S3 upload failed:", uploadError);
            showToast("S3 Upload failed: " + uploadError.message, true);
            SocketEmitters.backgroundRemovalFAILED?.(
              emitEvent,
              uploadError.message
            );
            return;
          }
        }

        if (!isValidImageUrl(imageUrl)) {
          showToast("Invalid image URL", true);
          return;
        }

        const params = {
          imageUrl,
          selectedProduct: selectedProduct || null,
        };

        SocketEmitters.backgroundRemovalStarted?.(
          emitEvent,
          !!selectedProduct || !!selectedFile
        );
        showToast("Starting background removal...");
        await removeBackground(params);
      } catch (error) {
        console.error("Background removal FAILED:", error);
        showToast(`Background removal FAILED: ${error.message}`, true);
        SocketEmitters.backgroundRemovalFAILED?.(emitEvent, error.message);
      }
    };

    run(); // Call the async function
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
            <DropZone.FileUpload actionHint="Supported formats: JPG, PNG, WebP,gif (Max 10MB each)" />
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
                    {/* <Text variant="bodyMd" as="p" tone="subdued">
                      Selected Image Preview:
                    </Text> */}
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
                          background:
                            "linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)",
                          backgroundSize: "20px 20px",
                          backgroundPosition:
                            "0 0, 0 10px, 10px -10px, -10px 0px",
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
                          const link = document.createElement("a");
                          link.href = processedImageUrl;
                          link.download = "background-removed.png";
                          link.click();
                        }}
                      />
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
              disabled={isIN_PROGRESS || !isImageSelected || processedImageUrl}
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
      <div ref={bottomRef}></div>
    </Page>
  );
};

export default BackgroundRemovalTemplate;
