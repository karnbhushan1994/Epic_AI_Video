import React from "react";
import {
  Box,
  Card,
  Grid,
  BlockStack,
  Text,
  Spinner,
} from "@shopify/polaris";
import { Modal, TitleBar } from "@shopify/app-bridge-react";

const ImageSelectionModal = ({
  id,
  tabs,
  activeTab,
  onTabChange,
  selectedFile,
  selectedProduct,
  productsLoading,
  renderTabContent,
  onUseSelectedItems,
}) => {
  return (
    <Modal id={id || "image-selection-modal"} variant="large">
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
          {/* Sidebar Tabs */}
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
                      onClick={() => onTabChange(index)}
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

          {/* Content Panel */}
          <Grid.Cell area="content">
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h3">
                  {tabs[activeTab].content}
                </Text>
                {productsLoading ? (
                  <div style={{ padding: "1rem", textAlign: "center" }}>
                    <Spinner size="large" />
                    <Text variant="bodyMd" as="p" tone="subdued">
                      Loading your products...
                    </Text>
                  </div>
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
          onClick={onUseSelectedItems}
          disabled={(!selectedFile && !selectedProduct) || productsLoading}
        >
          {productsLoading ? (
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Spinner size="small" />
              Loading...
            </span>
          ) : (
            "Add Selected Image"
          )}
        </button>
      </TitleBar>
    </Modal>
  );
};

export default React.memo(ImageSelectionModal);
