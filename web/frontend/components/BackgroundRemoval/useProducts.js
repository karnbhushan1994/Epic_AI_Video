// useProducts.js
import { useCallback, useEffect, useState } from "react";

const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/app/fetch-product");

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      let productsArray = [];

      if (Array.isArray(data)) {
        productsArray = data;
      } else if (data.products && Array.isArray(data.products)) {
        productsArray = data.products;
      } else {
        throw new Error("Invalid product data format received");
      }

      const transformedProducts = productsArray.map((product) => {
        const numericId = product.id.includes("gid://shopify/Product/")
          ? product.id.split("/").pop()
          : product.id;

        let thumbnail = "";
        if (product.featuredImage?.url) {
          thumbnail = product.featuredImage.url;
        } else if (product.images && product.images.length > 0) {
          if (product.images[0]?.url) {
            thumbnail = product.images[0].url;
          } else if (product.images[0]?.src) {
            thumbnail = product.images[0].src;
          }
        }

        return {
          value: `product-${numericId}`,
          label: product.title,
          thumbnail,
          id: numericId,
          handle: product.handle || `product-${numericId}`,
          date:
            product.created_at?.split("T")[0] ||
            product.createdAt?.split("T")[0] ||
            new Date().toISOString().split("T")[0],
          vendor: product.vendor || "",
          product_type: product.product_type || product.productType || "",
          status: product.status || "active",
        };
      });

      setProducts(transformedProducts);
    } catch (error) {
      console.error("FAILED to fetch products:", error);
      setError("FAILED to load products. Please try again.");
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

export default useProducts;
