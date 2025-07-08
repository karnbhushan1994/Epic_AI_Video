import React, { useState, useRef, useEffect } from 'react';
import {
  Badge,
  Button,
  Card,
  Text,
  BlockStack,
  Spinner,
  InlineStack,
} from '@shopify/polaris';
import HeartIcon from '../../assets/icons/HeartIcon.svg';
import LikeIcon from '../../assets/icons/like.svg';

const TemplateCard = ({
  template,
  onTemplateSelect,
  onLikeToggle,
  isLiked,
  videoLoadingState,
  onVideoLoaded,
  onMouseEnter,
  onMouseLeave,
  hoverState,
  timeLeft,
}) => {
  const videoRef = useRef(null);
  const [videoIsLoaded, setVideoIsLoaded] = useState(videoLoadingState);

  useEffect(() => {
    setVideoIsLoaded(videoLoadingState);
  }, [videoLoadingState]);

  const handleVideoLoaded = () => {
    setVideoIsLoaded(true);
    onVideoLoaded(template.id);
  };

  const handleMouseEnter = () => {
    onMouseEnter(template.id);
  };

  const handleMouseLeave = () => {
    onMouseLeave(template.id);
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'premium':
        return <Badge tone="success">Premium</Badge>;
      case 'new':
        return <Badge tone="attention">New</Badge>;
      case 'coming soon':
      case 'post launch':
        return <Badge tone="info">{status}</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="template-card">
      <div className="template-body">
        <div className="video-container">
          {template.status && (
            <div className="status-ribbon">{renderStatusBadge(template.status)}</div>
          )}
          {template.video ? (
            <>
              {!videoIsLoaded && (
                <div className="video-loader">
                  <Spinner accessibilityLabel="Loading video" size="large" />
                </div>
              )}
              <video
                ref={videoRef}
                src={template.video}
                loop
                muted
                playsInline
                className="video-element"
                onLoadedData={handleVideoLoaded}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{ display: videoIsLoaded ? 'block' : 'none' }}
              />
              <div className="video-duration">
                <Text variant="bodyMd" tone="subdued">
                  {hoverState && timeLeft > 0
                    ? `00:${String(timeLeft).padStart(2, '0')}`
                    : template.videoDuration}
                </Text>
              </div>
            </>
          ) : (
            <div className="coming-soon-overlay">
              <Text variant="headingMd" as="p" tone="inverse">
                {template.status === 'post launch' ? 'Post Launch' : 'Coming Soon'}
              </Text>
            </div>
          )}
        </div>

        <div className="card-content">
          <BlockStack gap="200">
            <InlineStack alignment="center" blockAlign="center">
              <Text variant="bodySm" tone="subdued">
                {template.category}
              </Text>
              <img
                src={isLiked ? LikeIcon : HeartIcon}
                alt="Heart Icon"
                className="heart-icon"
                onClick={() => onLikeToggle(template.id)}
              />
            </InlineStack>
            <Text as="h3" variant="headingMd">
              {template.title}
            </Text>
            <Text variant="bodyMd" as="p">
              {template.description}
            </Text>

            <InlineStack alignment="center" blockAlign="center">
              <div className="tags-container">
                {template.tags.map((tag, index) => (
                  <Badge key={index} tone="info" className="tag-badge">
                    {tag}
                  </Badge>
                ))}
              </div>
              <Button
                variant="primary"
                size="slim"
                onClick={() => onTemplateSelect(template.id)}
                disabled={
                  !template.video || template.status === 'coming soon' || template.status === 'post launch'
                }
              >
                Use Template
              </Button>
            </InlineStack>
          </BlockStack>
        </div>
      </div>
    </Card>
  );
};

export default TemplateCard;
