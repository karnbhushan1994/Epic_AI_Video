// useBackgroundRemoval.js
import { useState, useCallback } from "react";
//import { getShopifyHeaders } from "../../utils/shopifyUtils";
import { API_CONFIG } from "../../utils/videoConstants";
import { useSocketIO, SocketEmitters } from "../../hooks/useSocketIO";
import { useParams } from "react-router-dom";

const BG_REMOVAL_STATUS = {
  IDLE: "IDLE",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  ERROR: "ERROR",
};

const getShopifyHeaders = (shopify) => {
  const shop = shopify?.config?.shop;
  const accessToken = shopify?.config?.accessToken;

  return {
    "X-Shopify-Access-Token": accessToken,
    "X-Shopify-Shop": shop,
    "Content-Type": "application/json",
  };
};

export const useBackgroundRemoval = (shopify) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState(BG_REMOVAL_STATUS.IDLE);
  const [result, setResult] = useState(null);
  const { connected, emitEvent } = useSocketIO();
  const { id } = useParams();
  const removeBackground = useCallback(
    async (params) => {
      try {
        setIsProcessing(true);
        setProgress(10);
        setResult(null);
        setCurrentStatus(BG_REMOVAL_STATUS.PROCESSING);

        const headers = getShopifyHeaders(shopify);

        const payload = {
          image_url: params.imageUrl,
        };

        console.log("📤 Payload:", payload);
        setProgress(30);

        const res = await fetch("/api/v1/app/freepik/remove-background", {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify(payload),
        });

        setProgress(70);
        const json = await res.json();

        console.warn("📥 API Response:", json);

        if (!res.ok) {
          throw new Error(
            json.message ||
              "Failed to remove background. Please contact support."
          );
        }

        if (!json.processedImageUrl) {
          throw new Error("No processed image URL returned from API.");
        }

        setProgress(90);

        // Store the result in backend
        const creationRes = await fetch(`${API_CONFIG.baseUrl}/creations`, {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({
            templateId: id,
            type: "image",
            inputMap: params.selectedProduct
              ? [
                  {
                    productId: params.selectedProduct.id,
                    imageUrl: params.selectedProduct.thumbnail,
                  },
                ]
              : [],
            inputImages: [params.imageUrl],
            creditsUsed: 1,
            meta: {
              originalImage: params.imageUrl,
              processedAt: new Date().toISOString(),
            },
            outputMap: [
              {
                productId: params.selectedProduct?.id || "uploaded_image",
                outputUrl: json.processedImageUrl,
                // previewUrl: json.processedImageUrl,
                // originalUrl: json.originalImageUrl,
              },
            ],
          }),
        });

        if (!creationRes.ok) {
          console.warn("⚠️ Failed to store creation in backend");
        }

        setProgress(100);
        setCurrentStatus(BG_REMOVAL_STATUS.COMPLETED);
        setIsProcessing(false);

        setResult({
          success: true,
          url: json.processedImageUrl,
          original: json.originalImageUrl,
          high_resolution: json.processedImageUrl,
          preview: json.processedImageUrl,
          originalImageUrl: params.imageUrl,
        });
      } catch (err) {
        console.error("❌ removeBackground error:", err.message);
        setIsProcessing(false);
        setProgress(0);
        setCurrentStatus(BG_REMOVAL_STATUS.FAILED);
        setResult({
          success: false,
          error: err.message,
        });
        throw err;
      }
    },
    [shopify]
  );

  const resetState = useCallback(() => {
    setIsProcessing(false);
    setProgress(0);
    setCurrentStatus(BG_REMOVAL_STATUS.IDLE);
    setResult(null);
  }, []);

  return {
    removeBackground,
    resetState,
    isProcessing,
    progress,
    currentStatus,
    result,
    connectionStatus: connected ? "Connected" : "Disconnected",
  };
};

export default useBackgroundRemoval;
