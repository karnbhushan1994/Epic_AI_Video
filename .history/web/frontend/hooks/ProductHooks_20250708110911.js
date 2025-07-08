// src/hooks/ProductHooks.js
import { useState, useEffect, useCallback } from "react";

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/app/fetch-product");
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      let productsArray = [];

      if (Array.isArray(data)) {
        productsArray = data;
      } else if (data.products && Array.isArray(data.products)) {
        productsArray = data.products;
      } else {
        throw new Error("Invalid product data format received");
      }

      const transformed = productsArray.map((product) => {
        const id = product.id.includes("gid://shopify/Product/")
          ? product.id.split("/").pop()
          : product.id;
        let thumbnail = product.featuredImage?.url || product.images?.[0]?.url || product.images?.[0]?.src || "";

        return {
          value: `product-${id}`,
          label: product.title,
          thumbnail,
          id,
          handle: product.handle || `product-${id}`,
          date: product.created_at?.split("T")[0] || product.createdAt?.split("T")[0] || new Date().toISOString().split("T")[0],
          vendor: product.vendor || "",
          product_type: product.product_type || product.productType || "",
          status: product.status || "active",
        };
      });

      setProducts(transformed);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Failed to load products. Please try again.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
};
