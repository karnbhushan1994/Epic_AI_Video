import React, { useState, useEffect, useCallback } from "react";

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/app/fetch-product");
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const data = await response.json();

      const array = Array.isArray(data)
        ? data
        : Array.isArray(data.products)
        ? data.products
        : [];

      const transformed = array.flatMap((p) => {
        const numericId = p.id.includes("gid://shopify/Product/")
          ? p.id.split("/").pop()
          : p.id;

        const base = {
          id: numericId,
          handle: p.handle || `product-${numericId}`,
          label: p.title,
          title: p.title,
          date:
            p.created_at?.split("T")[0] ||
            p.createdAt?.split("T")[0] ||
            new Date().toISOString().split("T")[0],
          vendor: p.vendor || "",
          product_type: p.product_type || p.productType || "",
          status: p.status || "active",
        };

        // If product has images, duplicate the product per image
        if (p.images && Array.isArray(p.images) && p.images.length > 0) {
          return p.images.map((img, index) => ({
            ...base,
            value: `product-${numericId}-${index}`,
            thumbnail: img.url || img.src || "",
            imageMeta: img,
          }));
        }

        // Otherwise, return a single product with featuredImage or blank
        return [
          {
            ...base,
            value: `product-${numericId}`,
            thumbnail: p.featuredImage?.url || "",
          },
        ];
      });

      setProducts(transformed);
    } catch (err) {
      console.error("Product fetch error:", err);
      setError("FAILED to load products.");
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
