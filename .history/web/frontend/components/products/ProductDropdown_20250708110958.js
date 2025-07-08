// src/components/products/ProductDropdown.js
import React from "react";
import { Icon, Text } from "@shopify/polaris";
import { ImageIcon } from "@shopify/polaris-icons";

const ProductDropdown = ({ products, popoverActive, onProductSelect, onClose, selectedProductValue }) => {
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
            <Text variant="bodyMd">{product.label}</Text>
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
};

export default React.memo(ProductDropdown);
