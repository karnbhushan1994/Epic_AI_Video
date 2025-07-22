// आवश्यक React और Polaris के component आयात करना
import React, { useState } from 'react';
import {
  Page,
  Grid,
  Card,
  BlockStack,
  Text,
  Badge,
  Button,
  SkeletonBodyText,
  Icon,
} from '@shopify/polaris';
import { ArrowLeftIcon } from '@shopify/polaris-icons';
import useCategories from '../../hooks/useCategories'; // category को लाने के लिए custom hook

// मुख्य component शुरू
const TemplateCardGrid = () => {
  // category लाने के लिए custom hook का उपयोग
  const { categories, loading, error } = useCategories();

  // drilldown के लिए stack: किस level तक user गया है
  const [categoryStack, setCategoryStack] = useState([]);

  // अभी कौन सी categories दिखाई जाएंगी (top-level या children)
  const currentCategories =
    categoryStack.length === 0
      ? categories
      : categoryStack[categoryStack.length - 1]?.children || [];

  // किसी category पर क्लिक करने पर उसे stack में जोड़ो
  const handleCategoryClick = (category) => {
    setCategoryStack((prev) => [...prev, category]);
  };

  // back बटन पर क्लिक करने पर एक level पीछे जाओ
  const handleBack = () => {
    setCategoryStack((prev) => prev.slice(0, -1));
  };

  // एक category को Polaris Card में रेंडर करना
  const renderCategoryCard = (cat) => {
    // क्या ये अंतिम लेवल है (leaf node)?
    const isLeaf = !cat.children || cat.children.length === 0;

    // बटन पर क्लिक करने की लॉजिक
    const handleClick = () => {
      if (isLeaf) {
        // यहाँ पर आप templates दिखाने की logic जोड़ सकते हैं
        console.log('View templates for:', cat.name);
      } else {
        // यदि और भी children हैं, तो एक level drilldown करो
        handleCategoryClick(cat);
      }
    };

    // Polaris Card रेंडर
    return (
      <Grid.Cell key={cat._id}>
        <Card padding="400">
          <div className="template-body">
            {/* Banner image */}
            <div className="video-container">
              {cat.banner && (
                <img
                  src={cat.banner}
                  alt={cat.name}
                  style={{
                    width: '100%',
                    height: 180,
                    objectFit: 'cover',
                    borderRadius: 8,
                  }}
                />
              )}
            </div>

            {/* Category details */}
            <div className="card-content">
              <BlockStack gap="200">
                <div
                  className="title-row"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text variant="bodyMd" as="p">
                    {cat.name}
                  </Text>
                </div>

                {/* विवरण */}
                <Text variant="bodySm">{cat.description}</Text>

                {/* Badge और Explore/View बटन */}
                <div
                  className="action-row"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div className="tags-container">
                    {cat.highlightAsNew && (
                      <Badge tone="attention">New</Badge> // नया tag दिखाएं
                    )}
                    {cat.isPremium && <Badge tone="success">Premium</Badge>} // premium tag
                  </div>

                  {/* Explore या View Templates बटन */}
                  <Button size="slim" variant="primary" onClick={handleClick}>
                    {isLeaf ? 'View Templates' : 'Explore'}
                  </Button>
                </div>
              </BlockStack>
            </div>
          </div>
        </Card>
      </Grid.Cell>
    );
  };

  // मुख्य return JSX
  return (
    <Page
      title="Video Maker"
      fullWidth
      backAction={
        categoryStack.length > 0
          ? { content: 'Back', icon: ArrowLeftIcon, onAction: handleBack } // यदि drilldown में हैं तो back बटन दिखाएं
          : undefined
      }
    >
      {/* Error दिखाएं यदि कोई समस्या हो */}
      {error && <Text tone="critical">Error: {error}</Text>}

      {/* Card Grid Layout */}
      <div className="template-card-grid-wrapper">
        <Grid columns={{ xs: 1, sm: 2, md: 2, lg: 3 }} gap="400">
          {/* यदि data loading में है तो skeleton दिखाएं */}
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Grid.Cell key={index}>
                <Card>
                  <SkeletonBodyText lines={5} />
                </Card>
              </Grid.Cell>
            ))
          ) : currentCategories.length === 0 ? (
            <Text variant="bodyMd">No categories found.</Text> // यदि कोई category ना हो
          ) : (
            currentCategories.map((cat) => renderCategoryCard(cat)) // सभी current categories को दिखाएं
          )}
        </Grid>
      </div>
    </Page>
  );
};

// default export
export default TemplateCardGrid;
