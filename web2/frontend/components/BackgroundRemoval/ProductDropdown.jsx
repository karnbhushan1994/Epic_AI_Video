// ProductDropdown.jsx
import React from "react";
import { OptionList, Card } from "@shopify/polaris";

const ProductDropdown = ({
  products,
  popoverActive,
  onProductSelect,
  onClose,
  selectedProductValue,
}) => {
  if (!popoverActive || products.length === 0) return null;

  // Transform products to match OptionList format
  const options = products.map((product) => ({
    value: product.value,
    label: product.label,
    media: product.thumbnail ? (
      <img
        src={product.thumbnail}
        alt={product.label}
        style={{
          width: "20px",
          height: "20px",
          borderRadius: "6px",
          objectFit: "cover",
        }}
      />
    ) : undefined,
  }));

  const handleChange = (selected) => {
    if (selected.length > 0) {
      onProductSelect(selected[0]); // Take the first selected item
    }
  };

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          zIndex: 10001,
          marginTop: "4px",
        }}
      >
        <Card>
          <OptionList
            title=""
            onChange={handleChange}
            options={options}
            selected={selectedProductValue ? [selectedProductValue] : []}
            allowMultiple={false}
          />
        </Card>
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

export default ProductDropdown;
