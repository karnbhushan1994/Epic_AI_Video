import React from 'react';
import {
  Card,
  Grid,
  BlockStack,
  SkeletonBodyText,
  SkeletonDisplayText,
  SkeletonThumbnail,
} from '@shopify/polaris';

const TemplateSkeletonCard = ({ count = 3 }) => {
  return (
    <>
      {Array(count).fill(0).map((_, index) => (
        <Grid.Cell key={`skeleton-${index}`}>
          <Card className="template-card">
            <div className="template-body">
              <div className="video-container">
                <SkeletonThumbnail size="large" />
              </div>
              <div className="card-content">
                <BlockStack gap="200">
                  <div className="category-row">
                    <SkeletonBodyText lines={1} />
                    <SkeletonThumbnail size="small" />
                  </div>
                  <SkeletonDisplayText size="medium" />
                  <SkeletonBodyText lines={2} />
                  <div className="action-row">
                    <SkeletonThumbnail size="small" />
                  </div>
                </BlockStack>
              </div>
            </div>
          </Card>
        </Grid.Cell>
      ))}
    </>
  );
};

export default TemplateSkeletonCard;
