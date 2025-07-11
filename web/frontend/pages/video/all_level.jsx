// React and other library imports
import React, { useState, useEffect, useRef, Suspense } from 'react';
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
} from '@shopify/polaris';
import { useAppBridge } from '@shopify/app-bridge-react';
import { Redirect } from '@shopify/app-bridge/actions';

// Custom component imports
import PaginationControls from '../../components/common/PaginationControls';
import TemplateSkeletonCard from '../../components/common/TemplateSkeletonCard';
import { HeartIcon } from '@shopify/polaris-icons';
import IconWithReactChild from '../../components/common/icon/IconWithReactChild';

// Local video asset
import video from '../../assets/video/video.mp4';
import useCategories from '../../hooks/useCategories';

// Simulated async fetch for templates (mocked)
const fetchTemplates = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return [
    {
      _id: "685d455e489aa8e129f54866",
      name: "Fashion",
      slug: "fashion",
      type: "video",
      banner: video,
      description: "Top-level domain for all fashion-related templates",
      parent: null,
      level: 0,
      sortOrder: 1,
      comingSoon: false,
      tags: ['Product', 'Features'],
      highlightAsNew: true,
      isPremium: false,
      availableForPlans: ["pro"],
      videoDuration: '00:06',
      like: false,
      usageCount: 0,
      lastUsedTimestamp: null,
      createdAt: "2025-06-26T13:04:30.789Z",
      updatedAt: "2025-06-26T13:04:30.789Z",
      __v: 0,
      children: [
        {
          _id: "685d455e489aa8e129f54868",
          name: "Full Body Outfits",
          slug: "full-body-outfits",
          type: "video",
          banner: "https://img.freepik.com/free-photo/young-pretty-brunette-woman-posing-beige-marble-background-wearing-linen-beige-shorts-caramel-leather-luxury-bag-white-shirt-gold-accessories-street-style-outfit_291049-1753.jpg",
          description: "Includes dresses, jumpsuits, co-ords",
          parent: "685d455e489aa8e129f54866",
          level: 1,
          sortOrder: 1,
          comingSoon: false,
          tags: ["outfit", "full-body"],
          highlightAsNew: true,
          isPremium: true,
          availableForPlans: ["pro", "enterprise"],
          videoDuration: '00:12',
          usageCount: 0,
          like: false,
          lastUsedTimestamp: null,
          createdAt: "2025-06-26T13:04:30.814Z",
          updatedAt: "2025-06-26T13:04:30.814Z",
          __v: 0,
          children: [
            {
              _id: "685d455e489aa8e129f5486a",
              name: "Rotate & Detail",
              slug: "rotate-detail",
              type: "video",
              banner: "https://img.freepik.com/free-photo/young-pretty-brunette-woman-posing-beige-marble-background-wearing-linen-beige-shorts-caramel-leather-luxury-bag-white-shirt-gold-accessories-street-style-outfit_291049-1753.jpg",
              description: "Rotating videos with fabric/fit zooms",
              parent: "685d455e489aa8e129f54868",
              level: 2,
              sortOrder: 1,
              comingSoon: false,
              tags: ["rotate", "detail"],
              highlightAsNew: false,
              isPremium: false,
              availableForPlans: ["pro"],
              videoDuration: '00:15',
              usageCount: 0,
              like: true,
              lastUsedTimestamp: "2025-06-26T13:04:30.831Z",
              createdAt: "2025-06-26T13:04:30.833Z",
              updatedAt: "2025-06-26T13:04:30.833Z",
              __v: 0,
              children: []
            },
            {
              _id: "685d455e489aa8e129f5486c",
              name: "Static Pose & Zoom",
              slug: "static-pose-zoom",
              type: "video",
              banner: "https://img.freepik.com/free-photo/young-pretty-brunette-woman-posing-beige-marble-background-wearing-linen-beige-shorts-caramel-leather-luxury-bag-white-shirt-gold-accessories-street-style-outfit_291049-1753.jpg",
              description: "Subtle zooms while model is still",
              parent: "685d455e489aa8e129f54868",
              level: 2,
              sortOrder: 2,
              comingSoon: false,
              tags: ["pose", "zoom"],
              highlightAsNew: false,
              isPremium: false,
              availableForPlans: ["pro"],
              videoDuration: '00:10',
              usageCount: 0,
              like: true,
              lastUsedTimestamp: "2025-06-26T13:04:30.847Z",
              createdAt: "2025-06-26T13:04:30.849Z",
              updatedAt: "2025-06-26T13:04:30.849Z",
              __v: 0,
              children: []
            }
          ]
        }
      ]
    }
  ];
};

const TemplateCardGrid = () => {
  const app = useAppBridge();

  // State hooks
  const [redirect, setRedirect] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allTemplates, setAllTemplates] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [currentParentId, setCurrentParentId] = useState(null);
  const [navigationPath, setNavigationPath] = useState([]);
  const [videoLoadingStates, setVideoLoadingStates] = useState({});
  const [hoverStates, setHoverStates] = useState({});
  const [timeLefts, setTimeLefts] = useState({});
  const [likedTemplates, setLikedTemplates] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const templatesPerPage = 4;

  const { categories, error } = useCategories();

  // Refs for video elements and countdown intervals
  const videoRefs = useRef({});
  const intervalRefs = useRef({});

  // Helper to convert duration string (e.g., '00:05') into seconds
  const parseDuration = (durationStr = '00:00') => {
    const [minutes, seconds] = durationStr.split(':').map(Number);
    return (minutes || 0) * 60 + (seconds || 0);
  };

  // Helper to determine if banner is a video or image
  const isVideoBanner = (bannerUrl) => {
    if (!bannerUrl) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    return videoExtensions.some(ext => bannerUrl.toLowerCase().includes(ext));
  };

  // Helper to flatten nested templates structure
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
    const flatTemplates = flattenTemplates(allTemplates);
    
    if (currentLevel === 0) {
      return allTemplates; // Root level
    } else {
      return flatTemplates.filter(template => 
        template.parent === currentParentId && template.level === currentLevel
      );
    }
  };

  // Check if current templates are leaf nodes (have no children)
  const areCurrentTemplatesLeafNodes = () => {
    const currentTemplates = getCurrentLevelTemplates();
    return currentTemplates.every(template => 
      !template.children || template.children.length === 0
    );
  };

  // Updated function to handle multiple status badges
  const getStatusBadges = (template) => {
    const badges = [];
    
    if (template.comingSoon) {
      badges.push(<Badge key="coming-soon" tone="info">Coming Soon</Badge>);
    }
    
    if (template.isPremium) {
      badges.push(<Badge key="premium" tone="success">Premium</Badge>);
    }
    
    if (template.highlightAsNew) {
      badges.push(<Badge key="new" tone="attention">New</Badge>);
    }
    
    return badges;
  };

  // Get page title based on navigation level
  const getPageTitle = () => {
    if (navigationPath.length === 0) {
      return "Video Maker";
    }
    return navigationPath[navigationPath.length - 1].name;
  };

  // Handle template selection - either navigate deeper or go to creation
  const handleTemplateSelect = (template) => {
    if (template.children && template.children.length > 0) {
      // Navigate deeper into the hierarchy
      setCurrentLevel(currentLevel + 1);
      setCurrentParentId(template._id);
      setNavigationPath([...navigationPath, { id: template._id, name: template.name }]);
      setCurrentPage(1); // Reset pagination
    } else {
      // This is a leaf node, go to template creation
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
      // Go back one level in the hierarchy
      const newPath = [...navigationPath];
      newPath.pop();
      
      if (newPath.length === 0) {
        setCurrentLevel(0);
        setCurrentParentId(null);
      } else {
        setCurrentLevel(currentLevel - 1);
        setCurrentParentId(newPath[newPath.length - 1].id);
      }
      
      setNavigationPath(newPath);
      setCurrentPage(1); // Reset pagination
    } else {
      // At root level, go back to main app
      try {
        if (redirect) {
          redirect.dispatch(Redirect.Action.APP, '/');
        } else {
          window.history.back();
        }
      } catch {
        window.history.back();
      }
    }
  };

  // Set up Shopify redirect object on mount
  useEffect(() => {
    if (app && !redirect) {
      try {
        const redirectInstance = Redirect.create(app);
        setRedirect(redirectInstance);
      } catch (error) {
        console.error('Failed to initialize redirect:', error);
      }
    }
  }, [app]);

  // Fetch templates and initialize state on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedTemplates = await fetchTemplates();
        setAllTemplates(fetchedTemplates);

        // Initialize liked state from all templates
        const initialLikes = {};
        const flatTemplates = flattenTemplates(fetchedTemplates);
        
        flatTemplates.forEach(template => {
          initialLikes[template._id] = template.like || false;
        });
        setLikedTemplates(initialLikes);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching templates:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Update video loading states when current level changes
  useEffect(() => {
    const currentTemplates = getCurrentLevelTemplates();
    const initialLoadingStates = {};
    
    currentTemplates.forEach(template => {
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
    localStorage.setItem('likedTemplates', JSON.stringify(likedTemplates));
  }, [likedTemplates]);

  // Callback when video has loaded
  const handleVideoLoaded = (id) => {
    setVideoLoadingStates(prev => ({
      ...prev,
      [id]: false,
    }));
  };

  // Handle video hover: play video and start countdown
  const handleMouseEnter = (id) => {
    const currentTemplates = getCurrentLevelTemplates();
    const template = currentTemplates.find(template => template._id === id);
    
    if (!template || !template.videoDuration) {
      console.warn('Template or videoDuration not found for id:', id);
      return;
    }

    const duration = parseDuration(template.videoDuration);
    
    console.log('Starting timer for template:', template.name, 'Duration:', duration, 'seconds');

    const video = videoRefs.current[id];
    if (video) {
      video.play();
      
      // Clear any existing interval first
      if (intervalRefs.current[id]) {
        clearInterval(intervalRefs.current[id]);
        intervalRefs.current[id] = null;
      }
      
      // Always start with the full duration
      setTimeLefts(prev => ({ ...prev, [id]: duration }));
      setHoverStates(prev => ({ ...prev, [id]: true }));

      // Start countdown
      intervalRefs.current[id] = setInterval(() => {
        setTimeLefts(prev => {
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
    
    setHoverStates(prev => ({ ...prev, [id]: false }));
    setTimeLefts(prev => ({ ...prev, [id]: 0 }));
  };

  // Toggle like state
  const handleLikeToggle = (templateId) => {
    setLikedTemplates(prev => ({
      ...prev,
      [templateId]: !prev[templateId],
    }));
  };

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
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Determine button text based on whether template has children or is leaf
  const getButtonText = (template) => {
    if (template.children && template.children.length > 0) {
      return "Explore";
    }
    return "Use Template";
  };

  // Main render
  return (
    <Page
      title={getPageTitle()}
      backAction={{ content: 'Back', onAction: handleBackAction }}
      fullWidth>

      <div className="template-card-grid-wrapper">
        <Suspense fallback={<SkeletonBodyText lines={3} />}>
          <Grid columns={{ xs: 1, sm: 2, md: 2, lg: 3 }} gap="400">
            {loading ? (
              <TemplateSkeletonCard count={templatesPerPage} />
            ) : (
              paginatedTemplates.map(template => (
                <Grid.Cell key={template._id}>
                  <Card className="template-card">
                    <div className="template-body">
                      {/* Video/Image Banner */}
                      <div className="video-container">
                        {getStatusBadges(template).length > 0 && (
                          <div className="status-ribbon" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {getStatusBadges(template).map(badge => badge)}
                          </div>
                        )}
                        {template.banner && !template.comingSoon ? (
                          <>
                            {isVideoBanner(template.banner) ? (
                              // Video Banner
                              <>
                                {videoLoadingStates[template._id] && (
                                  <div className="video-loader">
                                    <Spinner accessibilityLabel="Loading video" size="large" />
                                  </div>
                                )}
                                <video
                                  ref={el => (videoRefs.current[template._id] = el)}
                                  src={template.banner}
                                  loop
                                  muted
                                  playsInline
                                  className="video-element"
                                  onLoadedData={() => handleVideoLoaded(template._id)}
                                  onMouseEnter={() => handleMouseEnter(template._id)}
                                  onMouseLeave={() => handleMouseLeave(template._id)}
                                  style={{ display: videoLoadingStates[template._id] ? 'none' : 'block' }}
                                />
                                <div className="video-duration">
                                  <Text variant="bodyMd" tone="subdued">
                                    {hoverStates[template._id] && timeLefts[template._id] > 0
                                      ? formatTime(timeLefts[template._id])
                                      : template.videoDuration || '00:00'}
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
                                  width: '100%',
                                  height: '200px',
                                  objectFit: 'cover',
                                  borderRadius: '8px 8px 0 0'
                                }}
                              />
                            )}
                          </>
                        ) : (
                          <div className="coming-soon-overlay">
                            <Text variant="headingMd" as="p" tone="inverse">
                              {template.comingSoon ? 'Coming Soon' : 'No Preview Available'}
                            </Text>
                          </div>
                        )}
                      </div>

                      {/* Template Info & Actions */}
                      <div className="card-content">
                        <BlockStack gap="200">
                          <div className="title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text variant="bodyMd" as="p">
                              {template.name}
                            </Text>
                            {/* Like Button - Only show on leaf nodes (last children) */}
                            {(!template.children || template.children.length === 0) && (
                              <button
                                onClick={() => handleLikeToggle(template._id)}
                                aria-label="Toggle like"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  cursor: 'pointer',
                                  lineHeight: 0,
                                  transform: likedTemplates[template._id] ? 'scale(1.2)' : 'scale(1)',
                                  transition: 'transform 0.2s ease',
                                }}
                              >
                                <IconWithReactChild fill={likedTemplates[template._id] ? 'red' : 'none'} />
                              </button>
                            )}
                          </div>

                          <Text variant="bodySm">{template.description}</Text>

                          {/* Tags and Action Button */}
                          <div className="action-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div className="tags-container">
                              {template.tags && template.tags.map((tag, index) => (
                                <Badge key={index} tone="info">{tag}</Badge>
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
        {!loading && currentTemplates.length > templatesPerPage && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={Math.ceil(currentTemplates.length / templatesPerPage)}
            onPrevious={() => setCurrentPage(p => p - 1)}
            onNext={() => setCurrentPage(p => p + 1)}
          />
        )}
      </div>
    </Page>
  );
};

export default TemplateCardGrid;