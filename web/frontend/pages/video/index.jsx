// React and other library imports
import React, { useState, useEffect, useRef, Suspense } from "react";
import {
  Badge,
  Button,
  Card,
  Grid,
  Page,
  Text,
  BlockStack,
  SkeletonBodyText,
  Spinner,
  Icon,
  EmptyState,
  InlineStack,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from "@shopify/app-bridge/actions";

// Custom component imports
import PaginationControls from "../../components/common/PaginationControls";
import TemplateSkeletonCard from "../../components/common/TemplateSkeletonCard";
import { HeartIcon, SearchIcon } from "@shopify/polaris-icons";

// Local video asset
import video from "../../assets/video/video.mp4";
import useCategories from "../../hooks/useCategories";

// Transform categories data to template format
const transformCategoriesToTemplates = (categories) => {
  if (!categories || !Array.isArray(categories)) return [];

  return categories.map((category) => ({
    _id: category._id || category.id,
    name: category.name || "Untitled",
    slug: category.slug || category.name?.toLowerCase().replace(/\s+/g, "-"),
    type: category.type || "video",
    banner: category.banner || category.image || video, // fallback to local video
    description: category.description || "No description available",
    parent: category.parent,
    level: category.level || 0,
    sortOrder: category.sortOrder || 1,
    comingSoon: category.comingSoon || false,
    tags: category.tags || [],
    highlightAsNew: category.highlightAsNew || false,
    isPremium: category.isPremium || false,
    availableForPlans: category.availableForPlans || ["pro"],
    videoDuration: category.videoDuration || "00:05",
    like: category.like || false,
    usageCount: category.usageCount || 0,
    lastUsedTimestamp: category.lastUsedTimestamp,
    createdAt: category.createdAt || new Date().toISOString(),
    updatedAt: category.updatedAt || new Date().toISOString(),
    __v: category.__v || 0,
    children: category.children
      ? transformCategoriesToTemplates(category.children)
      : [],
  }));
};

// Fallback static templates (your original data)
const getStaticTemplates = () => {
  return [
    // Empty array - uncomment your static data if needed
  ];
};

const TemplateCardGrid = () => {
  const app = useAppBridge();

  // Get categories from the hook
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useCategories("video");

  // State hooks
  const [redirect, setRedirect] = useState(null);
  const [allTemplates, setAllTemplates] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(null); // Will be set dynamically
  const [currentParentId, setCurrentParentId] = useState(null);
  const [navigationPath, setNavigationPath] = useState([]);
  const [videoLoadingStates, setVideoLoadingStates] = useState({});
  const [hoverStates, setHoverStates] = useState({});
  const [timeLefts, setTimeLefts] = useState({});
  const [likedTemplates, setLikedTemplates] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [initialLevel, setInitialLevel] = useState(null); // Track the starting level
  const templatesPerPage = 3;

  // Refs for video elements and countdown intervals
  const videoRefs = useRef({});
  const intervalRefs = useRef({});

  // Helper to convert duration string (e.g., '00:05') into seconds
  const parseDuration = (durationStr = "00:00") => {
    const [minutes, seconds] = durationStr.split(":").map(Number);
    return (minutes || 0) * 60 + (seconds || 0);
  };

  // Helper to determine if banner is a video or image
  const isVideoBanner = (bannerUrl) => {
    if (!bannerUrl) return false;
    const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi"];
    return videoExtensions.some((ext) => bannerUrl.toLowerCase().includes(ext));
  };

  // Helper function to find the minimum level with available templates
  const findStartingLevel = (templates) => {
    if (!templates || templates.length === 0) return 0;

    const flatTemplates = flattenTemplates(templates);
    const levels = flatTemplates
      .map((template) => template.level)
      .filter((level) => level !== undefined);

    if (levels.length === 0) return 0;

    // Find the minimum level
    const minLevel = Math.min(...levels);

    // Check if there are templates at this level that are not coming soon
    const templatesAtMinLevel = flatTemplates.filter(
      (template) => template.level === minLevel && !template.comingSoon
    );

    // If min level has available templates, use it
    if (templatesAtMinLevel.length > 0) {
      return minLevel;
    }

    // Otherwise, find the next level with available templates
    const sortedLevels = [...new Set(levels)].sort((a, b) => a - b);

    for (const level of sortedLevels) {
      const templatesAtLevel = flatTemplates.filter(
        (template) => template.level === level && !template.comingSoon
      );
      if (templatesAtLevel.length > 0) {
        return level;
      }
    }

    return minLevel; // Fallback to minimum level
  };
  const flattenTemplates = (templates) => {
    const flattened = [];

    const flatten = (template) => {
      flattened.push(template);
      if (template.children && template.children.length > 0) {
        template.children.forEach(flatten);
      }
    };

    templates.forEach(flatten);
    return flattened;
  };

  // Get templates at current navigation level
  const getCurrentLevelTemplates = () => {
    if (currentLevel === null || allTemplates.length === 0) return [];

    const flatTemplates = flattenTemplates(allTemplates);

    if (currentLevel === initialLevel && currentParentId === null) {
      // At the starting level, show all templates at that level
      return flatTemplates.filter(
        (template) => template.level === currentLevel && !template.comingSoon
      );
    } else {
      // Show templates at current level with specific parent
      return flatTemplates.filter(
        (template) =>
          template.parent === currentParentId &&
          template.level === currentLevel &&
          !template.comingSoon
      );
    }
  };

  // Get page title based on navigation level
  const getPageTitle = () => {
    if (navigationPath.length === 0) {
      return "Video Templates";
    }
    return navigationPath[navigationPath.length - 1].name;
  };

  // Check if current templates are leaf nodes (have no children)
  const areCurrentTemplatesLeafNodes = () => {
    const currentTemplates = getCurrentLevelTemplates();
    return currentTemplates.every(
      (template) => !template.children || template.children.length === 0
    );
  };

  // Updated function to handle multiple status badges
  const getStatusBadges = (template) => {
    const badges = [];

    if (template.comingSoon) {
      badges.push(
        <Badge key="coming-soon" tone="info">
          Coming Soon
        </Badge>
      );
    }

    if (template.isPremium) {
      badges.push(
        <Badge key="premium" tone="success">
          Premium
        </Badge>
      );
    }

    if (template.highlightAsNew) {
      badges.push(
        <Badge key="new" tone="attention">
          New
        </Badge>
      );
    }

    return badges;
  };

  // Handle template selection - either navigate deeper or go to creation
  const handleTemplateSelect = (template) => {
    if (template.children && template.children.length > 0) {
      setCurrentLevel(currentLevel + 1);
      setCurrentParentId(template._id);
      setNavigationPath([
        ...navigationPath,
        { id: template._id, name: template.name },
      ]);
      setCurrentPage(1);
    } else {
      const target = `/video/create/template/${template._id}`;
      try {
        if (!redirect) {
          window.location.href = target;
          return;
        }
        redirect.dispatch(Redirect.Action.APP, target);
      } catch {
        window.location.href = target;
      }
    }
  };

  // Handle back navigation
  const handleBackAction = () => {
    if (navigationPath.length > 0) {
      const newPath = [...navigationPath];
      newPath.pop();

      if (newPath.length === 0) {
        // Return to starting level
        setCurrentLevel(initialLevel);
        setCurrentParentId(null);
      } else {
        setCurrentLevel(currentLevel - 1);
        setCurrentParentId(newPath[newPath.length - 1].id);
      }

      setNavigationPath(newPath);
      setCurrentPage(1);
    } else {
      try {
        if (redirect) {
          redirect.dispatch(Redirect.Action.APP, "/");
        } else {
          window.history.back();
        }
      } catch {
        window.history.back();
      }
    }
  };

  // Handle refresh/retry action
  const handleRefresh = () => {
    window.location.reload();
  };

  // Set up Shopify redirect object on mount
  useEffect(() => {
    if (app && !redirect) {
      try {
        const redirectInstance = Redirect.create(app);
        setRedirect(redirectInstance);
      } catch (error) {
        console.error("FAILED to initialize redirect:", error);
      }
    }
  }, [app]);

  // Process categories data when it changes
  useEffect(() => {
    if (!categoriesLoading) {
      let processedTemplates;

      if (categories && categories.length > 0) {
        // Transform dynamic categories data
        console.log("Using dynamic categories data:", categories);
        processedTemplates = transformCategoriesToTemplates(categories);
      } else {
        // Fallback to static data
        console.log("Using static fallback data");
        processedTemplates = getStaticTemplates();
      }

      setAllTemplates(processedTemplates);

      // Determine and set the starting level dynamically
      const startingLevel = findStartingLevel(processedTemplates);
      setInitialLevel(startingLevel);
      setCurrentLevel(startingLevel);

      console.log("Starting level detected:", startingLevel);

      // Initialize liked state from all templates
      const initialLikes = {};
      const flatTemplates = flattenTemplates(processedTemplates);

      flatTemplates.forEach((template) => {
        initialLikes[template._id] = template.like || false;
      });
      setLikedTemplates(initialLikes);

      console.log("Processed templates:", processedTemplates);
    }
  }, [categories, categoriesLoading]);

  // Update video loading states when current level changes
  useEffect(() => {
    const currentTemplates = getCurrentLevelTemplates();
    const initialLoadingStates = {};

    currentTemplates.forEach((template) => {
      if (template.banner && isVideoBanner(template.banner)) {
        initialLoadingStates[template._id] = true;
      }
    });

    setVideoLoadingStates(initialLoadingStates);
  }, [currentLevel, currentParentId, allTemplates]);

  // Cleanup video intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(intervalRefs.current).forEach(clearInterval);
    };
  }, []);

  // Persist liked templates in localStorage
  useEffect(() => {
    localStorage.setItem("likedTemplates", JSON.stringify(likedTemplates));
  }, [likedTemplates]);

  // Callback when video has loaded
  const handleVideoLoaded = (id) => {
    setVideoLoadingStates((prev) => ({
      ...prev,
      [id]: false,
    }));
  };

  // Handle video hover: play video and start countdown
  const handleMouseEnter = (id) => {
    const currentTemplates = getCurrentLevelTemplates();
    const template = currentTemplates.find((template) => template._id === id);

    if (!template || !template.videoDuration) {
      console.warn("Template or videoDuration not found for id:", id);
      return;
    }

    const duration = parseDuration(template.videoDuration);

    console.log(
      "Starting timer for template:",
      template.name,
      "Duration:",
      duration,
      "seconds"
    );

    const video = videoRefs.current[id];
    if (video) {
      video.play();

      // Clear any existing interval first
      if (intervalRefs.current[id]) {
        clearInterval(intervalRefs.current[id]);
        intervalRefs.current[id] = null;
      }

      // Always start with the full duration
      setTimeLefts((prev) => ({ ...prev, [id]: duration }));
      setHoverStates((prev) => ({ ...prev, [id]: true }));

      // Start countdown
      intervalRefs.current[id] = setInterval(() => {
        setTimeLefts((prev) => {
          const currentTime = prev[id];
          const newTime = currentTime > 1 ? currentTime - 1 : 0;

          console.log(`Timer for ${id}: ${currentTime} -> ${newTime}`);

          if (newTime === 0) {
            clearInterval(intervalRefs.current[id]);
            intervalRefs.current[id] = null;
          }

          return { ...prev, [id]: newTime };
        });
      }, 1000);
    }
  };

  // Reset video and timer on mouse leave
  const handleMouseLeave = (id) => {
    const video = videoRefs.current[id];
    if (video) {
      video.pause();
      requestAnimationFrame(() => {
        video.currentTime = 0;
      });
    }

    // Clear interval
    if (intervalRefs.current[id]) {
      clearInterval(intervalRefs.current[id]);
      intervalRefs.current[id] = null;
    }

    setHoverStates((prev) => ({ ...prev, [id]: false }));
    setTimeLefts((prev) => ({ ...prev, [id]: 0 }));
  };

  // Toggle like state
  const handleLikeToggle = (templateId) => {
    setLikedTemplates((prev) => ({
      ...prev,
      [templateId]: !prev[templateId],
    }));
  };

  // Show loading while categories are being fetched OR while determining starting level
  const isLoading = categoriesLoading || currentLevel === null;

  // Get templates for the current page
  const currentTemplates = getCurrentLevelTemplates();
  const paginatedTemplates = currentTemplates.slice(
    (currentPage - 1) * templatesPerPage,
    currentPage * templatesPerPage
  );

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Determine button text based on whether template has children or is leaf
  const getButtonText = (template) => {
    if (template.children && template.children.length > 0) {
      return "Explore";
    }
    return "Use Template";
  };

  // Show error state if categories FAILED to load
  if (categoriesError) {
    return (
      <Page title="Video Templates" fullWidth>
        <EmptyState
          heading="Something went wrong"
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <Text variant="bodyMd" as="p">
            We couldn't load the templates. Please try refreshing the page.
          </Text>
          <div style={{ marginTop: "16px" }}>
            <InlineStack gap="200">
              <Button onClick={handleRefresh}>Try again</Button>
              <Button variant="plain" onClick={handleBackAction}>
                Go back
              </Button>
            </InlineStack>
          </div>
        </EmptyState>
      </Page>
    );
  }

  // Show empty state if no templates are available after loading
  if (!isLoading && currentTemplates.length === 0) {
    const isAtRootLevel = navigationPath.length === 0;

    return (
      <Page
        title={getPageTitle()}
        backAction={{ content: "Back", onAction: handleBackAction }}
        fullWidth
      >
        <EmptyState
          heading={
            isAtRootLevel
              ? "No templates available"
              : "No templates in this category"
          }
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <Text variant="bodyMd" as="p">
            {isAtRootLevel
              ? "There are no templates available at the moment. Check back later for new content."
              : "This category doesn't contain any templates yet. Try exploring other categories or go back to browse more options."}
          </Text>
          <div style={{ marginTop: "16px" }}>
            <InlineStack gap="200">
              {!isAtRootLevel && (
                <Button onClick={handleBackAction}>Back to categories</Button>
              )}
              <Button variant="plain" onClick={handleRefresh}>
                Refresh
              </Button>
            </InlineStack>
          </div>
        </EmptyState>
      </Page>
    );
  }

  // Main render
  return (
    <Page
      title={getPageTitle()}
      backAction={{ content: "Back", onAction: handleBackAction }}
      fullWidth
    >
      <div className="template-card-grid-wrapper">
        <Suspense fallback={<SkeletonBodyText lines={3} />}>
          <Grid columns={{ xs: 1, sm: 2, md: 2, lg: 3 }} gap="400">
            {isLoading ? (
              <TemplateSkeletonCard count={templatesPerPage} />
            ) : (
              paginatedTemplates.map((template) => (
                <Grid.Cell key={template._id}>
                  <Card className="template-card">
                    <div className="template-body">
                      {/* Video/Image Banner */}
                      <div className="video-container">
                        {getStatusBadges(template).length > 0 && (
                          <div
                            className="status-ribbon"
                            style={{
                              display: "flex",
                              gap: "4px",
                              flexWrap: "wrap",
                            }}
                          >
                            {getStatusBadges(template).map((badge) => badge)}
                          </div>
                        )}
                        {template.banner && !template.comingSoon ? (
                          <>
                            {isVideoBanner(template.banner) ? (
                              // Video Banner
                              <>
                                {videoLoadingStates[template._id] && (
                                  <div className="video-loader">
                                    <Spinner
                                      accessibilityLabel="Loading video"
                                      size="large"
                                    />
                                  </div>
                                )}
                                {/* <video
                                  ref={el => (videoRefs.current[template._id] = el)}
                                  src={template.banner}
                                  poster='https://epicappaivideos.s3.us-east-1.amazonaws.com/uploads/Thumbnail_for_Video.jpg'
                                  loop
                                  muted
                                  playsInline
                                  className="video-element"
                                  onLoadedData={() => handleVideoLoaded(template._id)}
                                  onMouseEnter={() => handleMouseEnter(template._id)}
                                  onMouseLeave={() => handleMouseLeave(template._id)}
                                  style={{ display: videoLoadingStates[template._id] ? 'none' : 'block' }}
                                />   */}
                                <video
                                  ref={(el) =>
                                    (videoRefs.current[template._id] = el)
                                  }
                                  src={template.banner}
                                  poster="https://epicappaivideos.s3.us-east-1.amazonaws.com/uploads/Thumbnail_for_Video.jpg"
                                  muted
                                  playsInline
                                  loop
                                  className="video-element"
                                  onLoadedData={() =>
                                    handleVideoLoaded(template._id)
                                  }
                                  onMouseEnter={() =>
                                    handleMouseEnter(template._id)
                                  }
                                  onMouseLeave={() =>
                                    handleMouseLeave(template._id)
                                  }
                                  style={{
                                    display: videoLoadingStates[template._id]
                                      ? "none"
                                      : "block",
                                  }}
                                />

                                <div className="video-duration">
                                  <Text variant="bodyMd" tone="subdued">
                                    {hoverStates[template._id] &&
                                    timeLefts[template._id] > 0
                                      ? formatTime(timeLefts[template._id])
                                      : template.videoDuration || "00:00"}
                                  </Text>
                                </div>
                              </>
                            ) : (
                              // Image Banner
                              <img
                                src={template.banner}
                                alt={template.name}
                                className="image-element"
                                style={{
                                  width: "100%",
                                  height: "250px",
                                  objectFit: "cover",
                                  borderRadius: "8px 8px 0 0",
                                }}
                              />
                            )}
                          </>
                        ) : (
                          <div className="coming-soon-overlay">
                            <Text variant="headingMd" as="p" tone="inverse">
                              {template.comingSoon
                                ? "Coming Soon"
                                : "No Preview Available"}
                            </Text>
                          </div>
                        )}
                      </div>

                      {/* Template Info & Actions */}
                      <div className="card-content">
                        <BlockStack gap="200">
                          <div
                            className="title-row"
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Text variant="bodyMd" as="p">
                              {template.name}
                            </Text>
                            {/* Like Button - Only show on leaf nodes (last children) */}
                            {(!template.children ||
                              template.children.length === 0) && (
                              <button
                                onClick={() => handleLikeToggle(template._id)}
                                aria-label="Toggle like"
                                style={{
                                  background: "none",
                                  border: "none",
                                  padding: 0,
                                  cursor: "pointer",
                                  lineHeight: 0,
                                  transform: likedTemplates[template._id]
                                    ? "scale(1.2)"
                                    : "scale(1)",
                                  transition: "transform 0.2s ease",
                                }}
                              >
                                {/* IconWithReactChild component commented out - uncomment if available */}
                                {/* <IconWithReactChild fill={likedTemplates[template._id] ? 'red' : 'none'} /> */}
                              </button>
                            )}
                          </div>

                          <Text variant="bodySm">{template.description}</Text>

                          {/* Tags and Action Button */}
                          <div
                            className="action-row"
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <div className="tags-container">
                              {template.tags &&
                                template.tags.map((tag, index) => (
                                  <Badge key={index} tone="info">
                                    {tag}
                                  </Badge>
                                ))}
                            </div>
                            <Button
                              size="slim"
                              onClick={() => handleTemplateSelect(template)}
                              disabled={template.comingSoon}
                              primary={areCurrentTemplatesLeafNodes()}
                            >
                              {getButtonText(template)}
                            </Button>
                          </div>
                        </BlockStack>
                      </div>
                    </div>
                  </Card>
                </Grid.Cell>
              ))
            )}
          </Grid>
        </Suspense>

        {/* Pagination - only show if there are more templates than templatesPerPage */}
        {!isLoading && currentTemplates.length > templatesPerPage && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={Math.ceil(currentTemplates.length / templatesPerPage)}
            onPrevious={() => setCurrentPage((p) => p - 1)}
            onNext={() => setCurrentPage((p) => p + 1)}
          />
        )}
      </div>
    </Page>
  );
};

export default TemplateCardGrid;
