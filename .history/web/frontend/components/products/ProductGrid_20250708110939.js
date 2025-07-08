// src/components/products/ProductGrid.js
import React from "react";
import { Card, Box, MediaCard, Button, Badge, Icon, Text } from "@shopify/polaris";
import { ImageIcon } from "@shopify/polaris-icons";

const ProductGrid = ({ products, selectedProduct, onProductSelect }) => {
  if (products.length === 0) {
    return (
      <Card>
        <Box padding="400">
          <div style={{ textAlign: "center" }}>
            <Icon source={ImageIcon} tone="subdued" />
            <Text variant="bodyMd" as="p">No products found.</Text>
          </div>
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
        padding: "8px",
        border: "1px solid var(--p-color-border-subdued)",
        borderRadius: "8px",
      }}
    >
      {products.map((product) => {
        const isSelected = selectedProduct?.value === product.value;
        return (
          <div key={product.value} style={{ position: "relative" }}>
            <Box
              borderColor={isSelected ? "border-focus" : "border"}
              borderStyle="solid"
              borderWidth={isSelected ? "2" : "1"}
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
                  <div style={{ marginTop: "12px", textAlign: "center" }}>
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
};

export default React.memo(ProductGrid);
