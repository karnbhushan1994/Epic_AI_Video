// src/api/productApi.js

export const getProducts = async () => {
  try {
    const response = await fetch("/api/shopify/products", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "FAILED to fetch products");
    }

    const data = await response.json();
    return data; // Expected: array of product objects with id, title, image, etc.
  } catch (error) {
    console.error("getProducts error:", error);
    throw error;
  }
};
