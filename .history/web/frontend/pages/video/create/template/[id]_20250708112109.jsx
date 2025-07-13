import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Page,
  Layout,
  Box,
  BlockStack,
  Card,
  Text,
  Badge,
  Button,
  Divider,
  TextField,
  Icon,
  ButtonGroup,
  Grid,
  Spinner,
  InlineStack,
  MediaCard,
  Tooltip,
  ProgressBar as PolarisProgressBar,
  DropZone,
} from "@shopify/polaris";
import {
  SearchIcon,
  PlusIcon,
  PlayIcon,
  ImageIcon,
} from "@shopify/polaris-icons";
import { useParams } from "react-router-dom";
import { Modal, TitleBar, useAppBridge } from "@shopify/app-bridge-react";

import { useProducts } from "../../../../hooks/ProductHooks";
import { useSocketIO } from "../../../../hooks/useSocketIO";
import { useVideoGeneration } from "../../../../hooks/useVideoGeneration";
import FileGrid from "../../../../components/files/FileGrid";
import ProductGrid from "../../../../components/products/ProductGrid";
import ProductDropdown from "../../../../components/products/ProductDropdown";
import { LoadingStates } from "../../../../components/common/LoadingStates";
import DownloadIcon from "../../../../components/common/DownloadIcon";

import {
  VIDEO_DURATIONS,
  VIDEO_MODES,
  TABS,
  STATIC_MOTION_PROMPT,
  VALID_IMAGE_TYPES,
  convertFileToBase64,
  validateFile,
  isValidImageUrl,
} from "../../../../utils/constants";

import UploadIcon from "@/components/icons/UploadIcon";
import ShopifyProductIcon from "@/components/icons/ShopifyProductIcon";

// Main Video Template Page
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

  const {
    connected,
    serverMessage,
    videoUpdates,
    emitEvent,
  } = useSocketIO();

  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState("");
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState("");
  const [videoDurationIndex, setVideoDurationIndex] = useState(0);
  const [videoModeIndex, setVideoModeIndex] = useState(0);
  const [activeTab, setActiveTab] = useState(TABS.PRODUCTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [popoverActive, setPopoverActive] = useState(false);
  const [selectedProductValue, setSelectedProductValue] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const showToast = useCallback(
    (msg, isError = false) => {
      if (shopify.toast) {
        shopify.toast.show(msg, {
          duration: isError ? 5000 : 3000,
          isError,
        });
      }
    },
    [shopify]
  );

  const handleDropZoneDrop = useCallback(
    async (_dropFiles, acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        showToast("Some files were rejected", true);
      }

      const validFiles = acceptedFiles.filter((file) => {
        const { valid, error } = validateFile(file);
        if (!valid) showToast(error, true);
        return valid;
      });

      if (validFiles.length > 0) {
        setUploadingFiles(true);
        setSelectedProduct(null);
        setSelectedProductValue("");
        setSearchQuery("");
        setFiles((prev) => [...prev, ...validFiles]);
        const previewUrl = window.URL.createObjectURL(validFiles[0]);
        setSelectedImagePreview(previewUrl);
        setSelectedFile(validFiles[0]);
        setUploadingFiles(false);
        showToast("✅ File uploaded");
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
        setSelectedImagePreview(product.thumbnail || "");
      }
    },
    [products]
  );

  const handleFileSelect = useCallback((file) => {
    setSelectedFile((prev) =>
      prev?.name === file.name ? null : file
    );
    setSelectedProduct(null);
    setSelectedProductValue("");
    setSearchQuery("");
    setSelectedImagePreview(
      prev?.name === file.name ? "" : window.URL.createObjectURL(file)
    );
  }, []);

  const handleGenerateVideo = useCallback(async () => {
    try {
      let imageUrl = selectedImagePreview;

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
        totalCredits: VIDEO_DURATIONS[videoDurationIndex].credits + VIDEO_MODES[videoModeIndex].credits,
        selectedProduct: selectedProduct,
      };

      const result = await generateVideo(params);

      if (result?.video_url) {
        setGeneratedVideoUrl(result.video_url);
        showToast("🎉 Video generated!");
      }
    } catch (error) {
      console.error("Video generation FAILED:", error);
      showToast("❌ Video generation FAILED", true);
    }
  }, [
    selectedFile,
    selectedImagePreview,
    videoDurationIndex,
    videoModeIndex,
    selectedProduct,
    generateVideo,
    showToast,
  ]);

  const renderGeneratedVideo = () => {
    if (generatedVideoUrl) {
      return (
        <video src={generatedVideoUrl} controls style={{ width: "100%" }} />
      );
    } else if (isGenerating) {
      return (
        <BlockStack gap="200" align="center">
          <Spinner size="large" />
          <Text variant="bodyMd" tone="subdued">Generating video...</Text>
          {generationProgress > 0 && (
            <Box minWidth="150px">
              <PolarisProgressBar progress={generationProgress} />
            </Box>
          )}
        </BlockStack>
      );
    } else {
      return (
        <Box height="300px" background="bg-surface-secondary" align="center">
          <Icon source={PlayIcon} tone="subdued" />
        </Box>
      );
    }
  };

  return (
    <Page title="Video Generator">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd">Upload or Select an Image</Text>
              <DropZone
                onDrop={handleDropZoneDrop}
                acceptedFiles={VALID_IMAGE_TYPES}
              >
                <DropZone.FileUpload />
              </DropZone>

              {uploadingFiles && (
                <LoadingStates.FileUploadLoader filesCount={files.length + 1} />
              )}

              <FileGrid
                files={files}
                selectedFile={selectedFile}
                onFileSelect={handleFileSelect}
              />

              <TextField
                value={searchQuery}
                onChange={(value) => {
                  setSearchQuery(value);
                  setPopoverActive(true);
                }}
                placeholder="Search products..."
                prefix={<Icon source={SearchIcon} />}
                autoComplete="off"
              />

              <ProductDropdown
                products={products.filter((p) =>
                  p.label.toLowerCase().includes(searchQuery.toLowerCase())
                )}
                popoverActive={popoverActive}
                selectedProductValue={selectedProductValue}
                onProductSelect={handleProductSelection}
                onClose={() => setPopoverActive(false)}
              />

              <ProductGrid
                products={products}
                selectedProduct={selectedProduct}
                onProductSelect={(product, isSelected) => {
                  if (isSelected) {
                    setSelectedProduct(null);
                    setSelectedImagePreview("");
                  } else {
                    setSelectedProduct(product);
                    setSelectedImagePreview(product.thumbnail);
                    setSelectedFile(null);
                  }
                }}
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section secondary>
          <Card title="Preview & Generate">
            <BlockStack gap="300">
              {renderGeneratedVideo()}
              <Divider />
              <Button
                primary
                disabled={isGenerating || !selectedImagePreview}
                loading={isGenerating}
                onClick={handleGenerateVideo}
              >
                {isGenerating ? "Generating..." : "Generate Video"}
              </Button>

              {generatedVideoUrl && (
                <Button
                  icon={DownloadIcon}
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = generatedVideoUrl;
                    a.download = "video.mp4";
                    a.click();
                  }}
                >
                  Download Video
                </Button>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default VideoTemplate;
