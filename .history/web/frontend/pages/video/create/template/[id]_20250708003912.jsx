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
  SkeletonTabs,
  SkeletonBodyText,
  SkeletonDisplayText,
  SkeletonPage,
} from "@shopify/polaris";
import {
  ImageIcon,
  PlusIcon,
  NoteIcon,
  SearchIcon,
} from "@shopify/polaris-icons";
import { Modal, TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import DownloadIcon from "../../../../components/common/DownloadIcon";

// Constants
const VIDEO_DURATIONS = [
  { index: 0, label: "5s" },
  { index: 1, label: "10s" },
];

const VIDEO_MODES = [
  { index: 0, label: "Standard" },
  { index: 1, label: "Pro" },
];

const TABS = {
  UPLOAD: 0,
  PRODUCTS: 1,
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Custom Icons Components
const UploadIcon = React.memo(() => (
  <svg viewBox="0 0 20 20" width="20" height="20" focusable="false" aria-hidden="true">
    <path d="M4.5 6.75c0-.69.56-1.25 1.25-1.25h1.514c.473 0 .906.268 1.118.691l.17.342c.297.592.903.967 1.566.967h4.132c.69 0 1.25.56 1.25 1.25 0 .414.336.75.75.75s.75-.336.75-.75c0-1.519-1.231-2.75-2.75-2.75h-4.132c-.095 0-.181-.053-.224-.138l-.17-.342c-.466-.931-1.418-1.52-2.46-1.52h-1.514c-1.519 0-2.75 1.231-2.75 2.75v6.5c0 1.519 1.231 2.75 2.75 2.75h5c.414 0 .75-.336.75-.75s-.336-.75-.75-.75h-5c-.69 0-1.25-.56-1.25-1.25v-6.5Z" />
    <path d="M15.75 13.31v2.94c0 .414-.336.75-.75.75s-.75-.336-.75-.75v-2.94l-.72.72c-.293.293-.767.293-1.06 0-.293-.293-.293-.767 0-1.06l2-2c.293-.293.767-.293 1.06 0l2 2c.293.293.293.767 0 1.06-.293.293-.767.293-1.06 0l-.72-.72Z" />
  </svg>
));

const ShopifyProductIcon = React.memo(() => (
  <svg viewBox="0 0 20 20" width="20" height="20" focusable="false" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M13.257 3h-6.514a1.25 1.25 0 0 0-.983.478l-2.386 3.037a1.75 1.75 0 0 0-.374 1.08v.655a2.75 2.75 0 0 0 1.5 2.45v4.55c0 .966.784 1.75 1.75 1.75h7.5a1.75 1.75 0 0 0 1.75-1.75v-4.55a2.75 2.75 0 0 0 1.5-2.45v-.481c0-.504-.17-.994-.48-1.39l-2.28-2.901a1.25 1.25 0 0 0-.983-.478Zm-.257 12.5h.75a.25.25 0 0 0 .25-.25v-4.25a2.742 2.742 0 0 1-2-.863 2.742 2.742 0 0 1-2 .863 2.742 2.742 0 0 1-2-.863 2.742 2.742 0 0 1-2 .863v4.25c0 .138.112.25.25.25h3.75v-2.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v2.5Zm-7-6h-.25c-.69 0-1.25-.56-1.25-1.25v-.654a.25.25 0 0 1 .053-.155l2.312-2.941h6.27l2.205 2.805a.75.75 0 0 1 .16.464v.481c0 .69-.56 1.25-1.25 1.25h-.25c-.69 0-1.25-.56-1.25-1.25v-.5a.75.75 0 0 0-1.5 0v.5a1.25 1.25 0 1 1-2.5 0v-.5a.75.75 0 0 0-1.5 0v.5c0 .69-.56 1.25-1.25 1.25Z"
    />
  </svg>
));

// Custom Hooks
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

      const transformedProducts = productsArray.map(product => {
        const numericId = product.id.includes('gid://shopify/Product/') 
          ? product.id.split('/').pop() 
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
          date: product.created_at?.split('T')[0] || 
                product.createdAt?.split('T')[0] || 
                new Date().toISOString().split('T')[0],
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

// File Validation Utility
const validateFile = (file) => {
  if (!file.type.startsWith("image/")) {
    return { valid: false, error: `${file.name} is not a valid image file` };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `${file.name} is too large (max 10MB)` };
  }
  return { valid: true };
};

// Product Dropdown Component
const ProductDropdown = React.memo(({ 
  products, 
  popoverActive, 
  onProductSelect, 
  onClose, 
  selectedProductValue 
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
            onMouseEnter={(e) => {
              if (selectedProductValue !== product.value) {
                e.target.style.backgroundColor = "var(--p-color-bg-surface-hover)";
              }
            }}
            onMouseLeave={(e) => {
              if (selectedProductValue !== product.value) {
                e.target.style.backgroundColor = "transparent";
              }
            }}
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
            <div>
              <Text variant="bodyMd" as="p">
                {product.label}
              </Text>
            </div>
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
});

// File Grid Component
const FileGrid = React.memo(({ files, selectedFile, onFileSelect, onFileRemove }) => {
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
          <div key={`${file.name}-${file.size}-${index}`} style={{ position: "relative" }}>
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
const ProductGrid = React.memo(({ 
  products, 
  selectedProduct, 
  onProductSelect, 
  showAll = false 
}) => {
  const displayProducts = showAll ? products : (selectedProduct ? [selectedProduct] : products);

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
      {displayProducts.map((product) => {
        const isSelected = selectedProduct && selectedProduct.value === product.value;
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
                          e.target.style.display = 'none';
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
                    <Button onClick={() => onProductSelect(product, isSelected)}>
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

// Main Component
const VideoTemplate = () => {
  const { id } = useParams();
  const shopify = useAppBridge();
  const { products, loading: productsLoading, error: productsError } = useProducts();

  // State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
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
  const [isGenerating, setIsGenerating] = useState(false);

  // Add CSS for spinner animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Filtered products based on search
  const filteredProducts = useMemo(() => {
    return products.filter((product) =>
      product.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  // Event Handlers
  const handleDurationClick = useCallback((index) => {
    if (videoDurationIndex === index) return;
    setVideoDurationIndex(index);
  }, [videoDurationIndex]);

  const handleModeClick = useCallback((index) => {
    if (videoModeIndex === index) return;
    setVideoModeIndex(index);
  }, [videoModeIndex]);

  const handleImageSelect = useCallback(() => {
    shopify.modal.show("image-selection-modal");
  }, [shopify]);

  const handleImageUpload = useCallback(() => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.multiple = true;
    fileInput.onchange = (event) => {
      const uploadedFiles = Array.from(event.target.files);
      if (uploadedFiles.length > 0) {
        const validFiles = uploadedFiles.filter((file) => {
          const validation = validateFile(file);
          if (!validation.valid) {
            console.error(validation.error);
            return false;
          }
          return true;
        });

        if (validFiles.length > 0) {
          setFiles((prevFiles) => [...prevFiles, ...validFiles]);
          const firstFile = validFiles[0];
          const previewUrl = window.URL.createObjectURL(firstFile);
          setSelectedImagePreview(previewUrl);
          console.log(`${validFiles.length} images uploaded`);
        }
      }
    };
    fileInput.click();
  }, []);

  const handleDropZoneDrop = useCallback((_dropFiles, acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      console.error("Some files were rejected. Please upload valid image files only.");
    }

    if (acceptedFiles.length > 0) {
      const validFiles = acceptedFiles.filter((file) => {
        const validation = validateFile(file);
        if (!validation.valid) {
          console.error(validation.error);
          return false;
        }
        return true;
      });

      if (validFiles.length > 0) {
        setSelectedProduct(null);
        setSelectedProductValue("");
        setSearchQuery("");

        setFiles((prevFiles) => [...prevFiles, ...validFiles]);
        const firstFile = validFiles[0];
        const previewUrl = window.URL.createObjectURL(firstFile);
        setSelectedImagePreview(previewUrl);
        setSelectedFile(firstFile);
        console.log(`${validFiles.length} images uploaded via dropzone`);
      }
    }
  }, []);

  const handleProductSelection = useCallback((productValue) => {
    const product = products.find((p) => p.value === productValue);
    if (product) {
      setSelectedFile(null);
      setSelectedProduct(product);
      setSelectedProductValue(productValue);
      setSearchQuery(product.label);
      setPopoverActive(false);

      if (product.thumbnail) {
        setSelectedImagePreview(product.thumbnail);
        console.log("Product selected from dropdown:", {
          title: product.label,
          thumbnail: product.thumbnail,
          hasImage: !!product.thumbnail
        });
      } else {
        setSelectedImagePreview("");
        console.log("Product selected but no thumbnail:", product.label);
      }
    }
  }, [products]);

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

    console.log("File selected:", file.name);
  }, []);

  const handleProductGridSelect = useCallback((product, isCurrentlySelected) => {
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
        console.log("Product selected with image:", product.thumbnail);
      } else {
        setSelectedImagePreview("");
        console.log("Product selected but no image available");
      }
    }
  }, []);

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
      console.log(`Image preview updated in main section:`, {
        type: selectedImage.type,
        name: selectedImage.name,
        url: selectedImage.url
      });
      shopify.modal.hide("image-selection-modal");
    } else {
      console.log("No image selected or selected product has no image");
    }
  }, [selectedFile, selectedProduct, shopify]);

  const handleGenerateImage = useCallback(() => {
    setIsGenerating(true);
    setTimeout(() => {
      const mockGeneratedImage = "https://via.placeholder.com/600x400/4CAF50/FFFFFF?text=Generated+Image";
      setImageUrl(mockGeneratedImage);
      setIsGenerating(false);
      console.log("Image generated successfully");
    }, 2000);
  }, []);

  const handleTabChange = useCallback((selectedTabIndex) => {
    setActiveTab(selectedTabIndex);
  }, []);

  const tabs = useMemo(() => [
    {
      id: "upload-tab",
      content: "Upload from Device",
      icon: UploadIcon,
    },
    {
      id: "products-tab",
      content: "My Products",
      icon: ShopifyProductIcon,
    },
  ], []);

  // Tab Content Renderer
  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case TABS.UPLOAD:
        const fileUpload = (
          <BlockStack gap="200">
            <DropZone.FileUpload actionHint="Supported formats: JPG, PNG, GIF, WebP (Max 10MB each)" />
          </BlockStack>
        );

        return (
          <BlockStack gap="400">
            <DropZone onDrop={handleDropZoneDrop} acceptedFiles={VALID_IMAGE_TYPES}>
              {fileUpload}
            </DropZone>

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
            {productsLoading && (
              <Card>
                <Box padding="400">
                  <BlockStack gap="400" align="center">
                    <Spinner accessibilityLabel="Loading products" size="large" />
                    <Text variant="bodyMd" as="p" alignment="center">
                      Loading products...
                    </Text>
                  </BlockStack>
                </Box>
              </Card>
            )}

            {productsError && (
              <Card>
                <Box padding="400">
                  <BlockStack gap="400" align="center">
                    <Text variant="bodyMd" as="p" tone="critical" alignment="center">
                      {productsError}
                    </Text>
                    <Button onClick={() => window.location.reload()} variant="secondary">
                      Retry
                    </Button>
                  </BlockStack>
                </Box>
              </Card>
            )}

            {!productsLoading && !productsError && (
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
    handleProductGridSelect
  ]);

  return (
    <Page
      backAction={{
        content: "Back to templates",
        onAction: () => window.history.back(),
      }}
      title="Video Template"
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
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
                          className="image-preview-container"
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
                              console.error("Failed to load image:", selectedImagePreview);
                              e.target.style.display = 'none';
                              const container = e.target.parentElement;
                              container.innerHTML = `
                                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 8px;">
                                  <div style="color: #bf0711;">⚠</div>
                                  <div style="font-size: 12px; color: #6b7280;">Failed to load image</div>
                                </div>
                              `;
                            }}
                            onLoadStart={() => {
                              const container = document.querySelector('.image-preview-container');
                              if (container && !container.querySelector('.preview-loader')) {
                                const loader = document.createElement('div');
                                loader.className = 'preview-loader';
                                loader.style.cssText = `
                                  position: absolute;
                                  top: 50%;
                                  left: 50%;
                                  transform: translate(-50%, -50%);
                                  z-index: 1;
                                `;
                                loader.innerHTML = '<div style="width: 20px; height: 20px; border: 2px solid #e5e7eb; border-top: 2px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>';
                                container.appendChild(loader);
                              }
                            }}
                            onLoad={() => {
                              console.log("Image loaded successfully:", selectedImagePreview);
                              const loader = document.querySelector('.preview-loader');
                              if (loader) loader.remove();
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
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd">Video Mode</Text>
                <ButtonGroup variant="segmented">
                  {VIDEO_MODES.map((mode) => (
                    <Button
                      key={mode.index}
                      pressed={videoModeIndex === mode.index}
                      onClick={() => handleModeClick(mode.index)}
                    >
                      {mode.label}
                    </Button>
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
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Selected or Generated image"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          cursor: "pointer",
                          borderRadius: "8px 8px 0 0",
                        }}
                        onClick={() => {
                          if (imageUrl) {
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
                        disabled={!imageUrl}
                      />
                    </div>
                  </div>
                </Box>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

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
              size="large"
              onClick={handleGenerateImage}
              loading={isGenerating}
            >
              Generate
            </Button>
          </div>
        </Layout.Section>
      </Layout>

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
                        onMouseEnter={(e) => {
                          if (activeTab !== index) {
                            e.target.style.backgroundColor = "var(--p-color-bg-surface-hover)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (activeTab !== index) {
                            e.target.style.backgroundColor = "transparent";
                          }
                        }}
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
                            fontWeight={activeTab === index ? "semibold" : undefined}
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
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Spinner size="small" />
                Loading...
              </span>
            ) : (
              "Add"
            )}
          </button>
        </TitleBar>
      </Modal>
    </Page>
  );
};

export default VideoTemplate;