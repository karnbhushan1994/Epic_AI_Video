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
  LegacyStack,
  Thumbnail,
  InlineStack,
  Bleed,
  VideoThumbnail,
  Badge
} from "@shopify/polaris";
import { ImageAddIcon, ImageIcon, ImageMagicIcon, PlusIcon, NoteIcon } from "@shopify/polaris-icons";
import { Modal, TitleBar, useAppBridge } from '@shopify/app-bridge-react';
import React, { useState, useCallback ,useEffect} from "react";
import { useParams } from "react-router-dom";
import DownloadIcon from "../../../../components/common/DownloadIcon";

const VideoTemplate = () => {
  const { id } = useParams();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState(""); // Empty initially
  const [selectedImagePreview, setSelectedImagePreview] = useState(""); // For preview in select section
  const [activeTab, setActiveTab] = useState(1); // Default to My Products tab
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [files, setFiles] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null); // Changed to single object
  const [selectedFile, setSelectedFile] = useState(null); // Changed to single object
  const shopify = useAppBridge();


    useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/v1/app/fetch-product');

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
       
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
       // setLoading(false);
      }
    };

    fetchProducts();
  }, []);



  const handleImageSelect = () => {
    shopify.modal.show('image-selection-modal');
  };

  const handleImageClick = () => {
    if (imageUrl) {
      console.log("Image clicked for editing");
    }
  };

  const handleImageUpload = () => {
    // Create file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = true; // Allow multiple file selection
    fileInput.onchange = (event) => {
      const uploadedFiles = Array.from(event.target.files);
      if (uploadedFiles.length > 0) {
        // Validate each file
        const validFiles = uploadedFiles.filter(file => {
          if (!file.type.startsWith('image/')) {
            console.error(`${file.name} is not a valid image file`);
            return false;
          }
          if (file.size > 10 * 1024 * 1024) {
            console.error(`${file.name} is too large (max 10MB)`);
            return false;
          }
          return true;
        });

        if (validFiles.length > 0) {
          setFiles(prevFiles => [...prevFiles, ...validFiles]);
          console.log(`${validFiles.length} images uploaded`);
        }
      }
    };
    fileInput.click();
  };

  const handleDropZoneDrop = useCallback(
    (_dropFiles, acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        console.error('Some files were rejected. Please upload valid image files only.');
      }

      if (acceptedFiles.length > 0) {
        const validFiles = acceptedFiles.filter(file => {
          if (file.size > 10 * 1024 * 1024) {
            console.error(`${file.name} is too large (max 10MB)`);
            return false;
          }
          return true;
        });

        if (validFiles.length > 0) {
          setFiles(prevFiles => [...prevFiles, ...validFiles]);
          console.log(`${validFiles.length} images uploaded via dropzone`);
        }
      }
    },
    [],
  );

  const handleProductSearch = () => {
    // Mock Shopify products data
    const mockProducts = [
      { id: 1, title: "demo_2_.png", image: "https://via.placeholder.com/200x350", handle: "product-1", date: "2025-07-04" },
      { id: 2, title: "bubu.png", image: "https://via.placeholder.com/200x350", handle: "product-2", date: "2025-07-03" },
      { id: 3, title: "IMAGE.png", image: "https://via.placeholder.com/200x350", handle: "product-3", date: "2025-06-24" },
      { id: 4, title: "ChatGPT_Image_Jun_12_2025_09_29_08_AM.png", image: "https://via.placeholder.com/200x350", handle: "product-4", date: "2025-06-20" },
      { id: 5, title: "2.webp", image: "https://via.placeholder.com/200x350", handle: "product-5", date: "2025-06-13" },
      { id: 6, title: "Product 6", image: "https://via.placeholder.com/200x350", handle: "product-6", date: "2025-06-10" },
    ];

    // Filter products based on search query
    const filteredProducts = searchQuery
      ? mockProducts.filter(product =>
        product.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
      : mockProducts;

    setProducts(filteredProducts);
  };

  // Updated handleProductSelect for single selection with same name handling
  const handleProductSelect = (product) => {
    setSelectedProduct(prevSelected => {
      // If the same product is clicked again, deselect it
      if (prevSelected && prevSelected.id === product.id && prevSelected.handle === product.handle) {
        return null;
      } else {
        // If same name product is already selected, deselect it first
        if (prevSelected && prevSelected.title === product.title) {
          return null;
        }
        // Select the new product (this will deselect any previously selected product)
        return product;
      }
    });
    console.log("Product selected:", product.title);
  };

  // Updated handleFileSelect for single selection with same name handling
  const handleFileSelect = (file) => {
    setSelectedFile(prevSelected => {
      // If the same file is clicked again, deselect it
      if (prevSelected && prevSelected.name === file.name) {
        return null;
      } else {
        // If same name file is already selected, deselect it first
        if (prevSelected && prevSelected.name === file.name) {
          return null;
        }
        // Select the new file (this will deselect any previously selected file)
        return file;
      }
    });
    console.log("File selected:", file.name);
  };

  // Updated handleUseSelectedItems for single selection
  const handleUseSelectedItems = () => {
    let selectedImage = null;

    // Check if a product is selected
    if (selectedProduct) {
      selectedImage = {
        type: 'product',
        url: selectedProduct.image,
        name: selectedProduct.title,
        id: selectedProduct.id
      };
    }
    // Check if a file is selected (file takes precedence if both are selected)
    else if (selectedFile) {
      selectedImage = {
        type: 'file',
        url: window.URL.createObjectURL(selectedFile),
        name: selectedFile.name,
        file: selectedFile
      };
    }

    if (selectedImage) {
      // Set the selected image preview in the Select section
      setSelectedImagePreview(selectedImage.url);
      console.log(`Selected image preview updated: ${selectedImage.name}`);
      shopify.modal.hide('image-selection-modal');
    }
  };

  // Updated handleRemoveFile to clear selection if selected file is removed
  const handleRemoveFile = (fileToRemove) => {
    setFiles(prevFiles => prevFiles.filter(f => f.name !== fileToRemove.name));
    // Clear selection if the selected file is being removed
    if (selectedFile && selectedFile.name === fileToRemove.name) {
      setSelectedFile(null);
    }
  };

  const handleModalClose = () => {
    shopify.modal.hide('image-selection-modal');
  };

  // Generate image function
  const handleGenerateImage = () => {
    // Mock image generation - in real implementation, this would call your AI service
    const mockGeneratedImage = "https://via.placeholder.com/600x400/4CAF50/FFFFFF?text=Generated+Image";
    setImageUrl(mockGeneratedImage);
    console.log("Image generated successfully");
  };

  // Custom Upload Icon Component
  const UploadIcon = () => (
    <svg viewBox="0 0 20 20" width="20" height="20" focusable="false" aria-hidden="true">
      <path d="M4.5 6.75c0-.69.56-1.25 1.25-1.25h1.514c.473 0 .906.268 1.118.691l.17.342c.297.592.903.967 1.566.967h4.132c.69 0 1.25.56 1.25 1.25 0 .414.336.75.75.75s.75-.336.75-.75c0-1.519-1.231-2.75-2.75-2.75h-4.132c-.095 0-.181-.053-.224-.138l-.17-.342c-.466-.931-1.418-1.52-2.46-1.52h-1.514c-1.519 0-2.75 1.231-2.75 2.75v6.5c0 1.519 1.231 2.75 2.75 2.75h5c.414 0 .75-.336.75-.75s-.336-.75-.75-.75h-5c-.69 0-1.25-.56-1.25-1.25v-6.5Z"></path>
      <path d="M15.75 13.31v2.94c0 .414-.336.75-.75.75s-.75-.336-.75-.75v-2.94l-.72.72c-.293.293-.767.293-1.06 0-.293-.293-.293-.767 0-1.06l2-2c.293-.293.767-.293 1.06 0l2 2c.293.293.293.767 0 1.06-.293.293-.767.293-1.06 0l-.72-.72Z"></path>
    </svg>
  );

  // Custom Shopify Product Icon Component
  const ShopifyProductIcon = () => (
    <svg viewBox="0 0 20 20" width="20" height="20" focusable="false" aria-hidden="true">
      <path fillRule="evenodd" d="M13.257 3h-6.514a1.25 1.25 0 0 0-.983.478l-2.386 3.037a1.75 1.75 0 0 0-.374 1.08v.655a2.75 2.75 0 0 0 1.5 2.45v4.55c0 .966.784 1.75 1.75 1.75h7.5a1.75 1.75 0 0 0 1.75-1.75v-4.55a2.75 2.75 0 0 0 1.5-2.45v-.481c0-.504-.17-.994-.48-1.39l-2.28-2.901a1.25 1.25 0 0 0-.983-.478Zm-.257 12.5h.75a.25.25 0 0 0 .25-.25v-4.25a2.742 2.742 0 0 1-2-.863 2.742 2.742 0 0 1-2 .863 2.742 2.742 0 0 1-2-.863 2.742 2.742 0 0 1-2 .863v4.25c0 .138.112.25.25.25h3.75v-2.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v2.5Zm-7-6h-.25c-.69 0-1.25-.56-1.25-1.25v-.654a.25.25 0 0 1 .053-.155l2.312-2.941h6.27l2.205 2.805a.75.75 0 0 1 .16.464v.481c0 .69-.56 1.25-1.25 1.25h-.25c-.69 0-1.25-.56-1.25-1.25v-.5a.75.75 0 0 0-1.5 0v.5a1.25 1.25 0 1 1-2.5 0v-.5a.75.75 0 0 0-1.5 0v.5c0 .69-.56 1.25-1.25 1.25Z" />
    </svg>
  );

  const handleTabChange = (selectedTabIndex) => {
    setActiveTab(selectedTabIndex);
  };

  const tabs = [
    {
      id: 'upload-tab',
      content: 'Upload from Device',
      icon: UploadIcon,
    },
    {
      id: 'products-tab',
      content: 'My Products',
      icon: ShopifyProductIcon,
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Upload from Device
        const validImageTypes = ['image/gif', 'image/jpeg', 'image/png', 'image/webp'];
        const fileUpload = (
          <BlockStack gap="200">
            <DropZone.FileUpload  actionHint="Supported formats: JPG, PNG, GIF, WebP (Max 10MB each)"/>
          </BlockStack>
        );

        return (
          <BlockStack gap="400">
            <Text variant="bodyMd" as="p">
              Choose image files from your computer to upload.
            </Text>

            {/* Always show drop zone */}
            <DropZone onDrop={handleDropZoneDrop} acceptedFiles={validImageTypes}>
              {fileUpload}
            </DropZone>

            {/* Show uploaded files if any */}
            {files.length > 0 && (
              <BlockStack gap="400">
                <Text variant="headingMd" as="h3">
                  Uploaded Files ({files.length})
                </Text>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '16px',
                  maxHeight: '400px',
                  overflow: 'auto'
                }}>
                  {files.map((file, index) => {
                    const isSelected = selectedFile && selectedFile.name === file.name;
                    return (
                      <div key={index} style={{ position: 'relative' }}>
                        <Box
                          borderColor={isSelected ? 'border-focus' : 'border'}
                          borderStyle="solid"
                          borderWidth={isSelected ? '2' : '1'}
                          borderRadius="200"
                          overflow="hidden"
                          background="bg-surface"
                        >
                          <MediaCard
                            portrait
                            title={file.name}
                            primaryAction={{
                              content: isSelected ? 'Selected' : 'Select',
                              onAction: () => handleFileSelect(file),
                            }}
                            description={`${(file.size / 1024 / 1024).toFixed(2)} MB • ${file.type.split('/')[1].toUpperCase()}`}
                            popoverActions={[
                              {
                                content: 'Remove',
                                onAction: () => handleRemoveFile(file)
                              }
                            ]}
                          >
                            <Box>
                              <div style={{
                                height: '200px',
                                minHeight: '200px',
                                backgroundColor: '#f6f6f7',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                borderRadius: '8px',
                                position: 'relative'
                              }}>
                                {validImageTypes.includes(file.type) ? (
                                  <img
                                    src={window.URL.createObjectURL(file)}
                                    alt={file.name}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      borderRadius: '8px'
                                    }}
                                  />
                                ) : (
                                  <Icon source={NoteIcon} />
                                )}
                                {isSelected && (
                                  <div style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px'
                                  }}>
                                    <Badge tone="success">Selected</Badge>
                                  </div>
                                )}
                              </div>
                            </Box>
                          </MediaCard>
                        </Box>
                      </div>
                    );
                  })}
                </div>

                {selectedFile && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {/* <Text variant="bodyMd" as="p">
                      1 file selected: {selectedFile.name}
                    </Text> */}

                  </div>
                )}
              </BlockStack>
            )}
          </BlockStack>
        );

      case 1: // My Products
        return (
          <BlockStack gap="400">
            <Text variant="bodyMd" as="p">
              Search and select an image from your Shopify products.
            </Text>
            <TextField
              label="Search Products"
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search your products..."
              autoComplete="off"
            />
            <Button
              variant="secondary"
              size="large"
              onClick={handleProductSearch}
              fullWidth
            >
              Search Products
            </Button>

            {products.length > 0 && (
              <BlockStack gap="400">
                <Text variant="headingMd" as="h3">
                  Products ({products.length})
                </Text>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '16px',
                  maxHeight: '400px',
                  overflow: 'auto'
                }}>
                  {products.map((product) => {
                    const isSelected = selectedProduct && (
                      (selectedProduct.id === product.id && selectedProduct.handle === product.handle) ||
                      selectedProduct.title === product.title
                    );
                    return (
                      <div key={product.id} style={{ position: 'relative' }}>
                        <Box
                          borderColor={isSelected ? 'border-focus' : 'border'}
                          borderStyle="solid"
                          borderWidth={isSelected ? '2' : '1'}
                          borderRadius="200"
                          overflow="hidden"
                          background="bg-surface"
                        >
                          <MediaCard
                            portrait
                            title={product.title}
                            primaryAction={{
                              content: isSelected ? 'Selected' : 'Select',
                              onAction: () => handleProductSelect(product),
                            }}
                            description={`Created: ${product.date}`}
                          >
                            <div style={{
                              height: '200px',
                              minHeight: '200px',
                              backgroundColor: '#000',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              borderRadius: '8px',
                              position: 'relative'
                            }}>
                              <img
                                src={product.image}
                                alt={product.title}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  borderRadius: '8px'
                                }}
                              />
                              {isSelected && (
                                <div style={{
                                  position: 'absolute',
                                  top: '8px',
                                  right: '8px'
                                }}>
                                  <Badge tone="success">Selected</Badge>
                                </div>
                              )}
                            </div>
                          </MediaCard>
                        </Box>
                      </div>
                    );
                  })}
                </div>

                {selectedProduct && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="bodyMd" as="p">
                      1 product selected: {selectedProduct.title}
                    </Text>
                    <Button
                      variant="primary"
                      size="large"
                      onClick={handleUseSelectedItems}
                    >
                      Use Selected Image
                    </Button>
                  </div>
                )}
              </BlockStack>
            )}
          </BlockStack>
        );

      default:
        return null;
    }
  };

  return (
    <Page
      backAction={{
        content: "Back to templates",
        onAction: () => window.history.back()
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

              {/* Display selected image preview */}
              {selectedImagePreview && (
                <Box padding="400">
                  <Grid columns={{ xs: 1, sm: 2, md: 4, lg: 4, xl: 4 }}>
                    <Grid.Cell>
                      <div style={{
                        borderRadius: '8px',
                        overflow: 'hidden',
                        height: '200px',
                        backgroundColor: '#f6f6f7',
                        border: '2px solid #0073e6'
                      }}>
                        <img
                          src={selectedImagePreview}
                          alt="Selected"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            display: 'block'
                          }}
                        />
                      </div>
                    </Grid.Cell>
                  </Grid>
                </Box>
              )}

              {/* Alternative: If you want to show the first uploaded file */}
              {/* {files.length > 0 && !selectedImagePreview && (
                <Box padding="400">
                  <Grid columns={{ xs: 1, sm: 2, md: 4, lg: 4, xl: 4 }}>
                    <Grid.Cell>
                      <div style={{ borderRadius: '8px', overflow: 'hidden' }}>
                        <img
                          src={URL.createObjectURL(files[0])}
                          alt="First uploaded file"
                          style={{
                            width: '100%',
                            height: 'auto',
                            borderRadius: '8px',
                            display: 'block'
                          }}
                        />
                      </div>
                    </Grid.Cell>
                  </Grid>
                </Box>
              )} */}
              <Box padding="400">
                <Button
                  icon={PlusIcon}
                  onClick={handleImageSelect}
                >
                  Select image
                </Button>
              </Box>
            </Box>

            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd">Customize your video</Text>
                <TextField
                  label="Title"
                  value={title}
                  onChange={setTitle}
                  autoComplete="off"
                />
                <TextField
                  label="Description"
                  value={description}
                  onChange={setDescription}
                  autoComplete="off"
                  multiline={4}
                />
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
                  Select an image and enter a prompt to generate a new background
                </Text>
              </BlockStack>

              <Divider />

              <Box
                background="bg-surface"
                shadow="card"
                borderRadius="200"
                overflow="hidden"
              >
                {/* Image Area */}
                <Box>
                  <div style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    overflow: 'hidden',
                    height: '310px',
                    width: '100%',
                    borderRadius: '8px 8px 0 0' // Only round top corners
                  }}>
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Selected or Generated image"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          cursor: 'pointer',
                          borderRadius: '8px 8px 0 0' // Only round top corners
                        }}
                        onClick={handleImageClick}
                      />
                    ) : (
                      <div style={{
                        display: 'flex',
                        height: '100%',
                        width: '100%',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#d4d4d8',
                        borderRadius: '8px 8px 0 0' // Only round top corners
                      }}>
                        <Icon source={ImageIcon} tone="subdued" />
                      </div>
                    )}
                  </div>
                </Box>

                {/* Footer with Download Button */}
                <Box
                  background="bg-surface-secondary"
                  padding="400"
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center'
                    }}>
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

      {/* Generate Button - Separate row at bottom */}
      <Layout>
        <Layout.Section>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <Button
              variant="primary"
              size="large"
              onClick={handleGenerateImage}
            >
              Generate
            </Button>
          </div>
        </Layout.Section>
      </Layout>

      {/* Image Selection Modal with Tabs */}
      <Modal id="image-selection-modal" variant="large">
        <Box padding="400">
          <Grid
            columns={{ xs: 1, sm: 4, md: 4, lg: 4, xl: 4 }}
            areas={{
              xs: ['tabs', 'content'],
              sm: ['tabs content content content'],
              md: ['tabs content content content'],
              lg: ['tabs content content content'],
              xl: ['tabs content content content'],
            }}
          >
            {/* Left Side - Tab Navigation (25%) */}
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
                          padding: '12px 16px',
                          backgroundColor: activeTab === index ? 'var(--p-color-bg-surface-selected)' : 'transparent',
                          borderRadius: '8px',
                          marginBottom: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => handleTabChange(index)}
                        onMouseEnter={(e) => {
                          if (activeTab !== index) {
                            e.target.style.backgroundColor = 'var(--p-color-bg-surface-hover)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (activeTab !== index) {
                            e.target.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '20px' }}>
                          {tab.icon === UploadIcon ? (
                            <div style={{ width: '20px', height: '20px', flexShrink: 0 }}>
                              <UploadIcon />
                            </div>
                          ) : tab.icon === ShopifyProductIcon ? (
                            <div style={{ width: '20px', height: '20px', flexShrink: 0 }}>
                              <ShopifyProductIcon />
                            </div>
                          ) : (
                            <div style={{ width: '20px', height: '20px', flexShrink: 0 }}>
                              <Icon source={tab.icon} />
                            </div>
                          )}
                          <Text
                            variant="bodyMd"
                            as="p"
                            tone={activeTab === index ? 'emphasis' : undefined}
                            fontWeight={activeTab === index ? 'semibold' : undefined}
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

            {/* Right Side - Tab Content (75%) */}
            <Grid.Cell area="content">
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h3">
                    {tabs[activeTab].content}
                  </Text>
                  {renderTabContent()}
                </BlockStack>
              </Card>
            </Grid.Cell>
          </Grid>
        </Box>

        {/* <Button
          variant="primary"
          size="large"
          onClick={handleUseSelectedItems}
        >
          Use Selected Image
        </Button> */}

         <TitleBar title="Title">
          <button  variant="primary" onClick={handleUseSelectedItems}>Add</button>
        </TitleBar>
      </Modal>
    </Page>
  );
};

export default VideoTemplate;