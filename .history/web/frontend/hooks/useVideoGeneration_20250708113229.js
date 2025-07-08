import { useState, useCallback } from "react";
import { getShopifyHeaders } from "../utils/shopifyHelpers"; // Adjust the import path as necessary
import { useSocketIO } from "./useSocketIO";

const API_CONFIG = {
  baseUrl: "/api/v1/app",
};

export const useVideoGeneration = (shopify) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentCreationId, setCurrentCreationId] = useState(null);
  const [generationResult, setGenerationResult] = useState(null);

  const { connected, emitEvent, videoUpdates } = useSocketIO();

  const handleUpdate = useCallback(
    (data) => {
      const { creationId, status, progress, outputMap, failureReason } = data;

      if (creationId !== currentCreationId) return;

      switch (status?.toLowerCase()) {
        case "pending":
        case "queued":
          setGenerationProgress(Math.max(5, progress || 5));
          break;
        case "in_progress":
        case "processing":
          setGenerationProgress(Math.max(10, Math.min(progress || 50, 95)));
          break;
        case "completed":
          setGenerationProgress(100);
          setIsGenerating(false);
          setCurrentCreationId(null);
          if (outputMap?.length > 0) {
            setGenerationResult({
              success: true,
              videoUrl: outputMap[0].outputUrl,
              creationId,
            });
          } else {
            setGenerationResult({
              success: false,
              error: "Video completed but no output URL provided",
              creationId,
            });
          }
          break;
        case "failed":
        case "error":
          setIsGenerating(false);
          setCurrentCreationId(null);
          setGenerationProgress(0);
          setGenerationResult({
            success: false,
            error: failureReason || "Video generation failed",
            creationId,
          });
          break;
      }
    },
    [currentCreationId]
  );

  const generateVideo = useCallback(
    async (params) => {
      try {
        setIsGenerating(true);
        setGenerationProgress(0);
        setGenerationResult(null);

        const headers = getShopifyHeaders(shopify);

        const creationPayload = {
          templateId: "686393535e6019e1260b17ac",
          type: "video",
          inputMap: params.selectedProduct
            ? [{ productId: params.selectedProduct.id, imageUrl: params.selectedProduct.thumbnail }]
            : [],
          inputImages: [params.image],
          associatedProductIds: params.selectedProduct ? [params.selectedProduct.id] : [],
          creditsUsed: params.totalCredits,
          meta: {
            duration: parseInt(params.duration),
            mode: params.mode,
            aspectRatio: "16:9",
            prompt: "The camera slowly zooms in while maintaining smooth, natural movement. The subject remains in focus with subtle, realistic motion that enhances the overall visual appeal.",
            cfg_scale: params.cfgScale,
          },
          image: params.image,
        };

        const response = await fetch(`${API_CONFIG.baseUrl}/creations`, {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify(creationPayload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const creationData = await response.json();
        const creationId = creationData._id || creationData.id;

        if (!creationId) throw new Error("No creation ID returned");

        setCurrentCreationId(creationId);

        if (connected) {
          emitEvent("subscribe_creation", { type: "subscribe_creation", creationId });
        }

        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            if (isGenerating) {
              setIsGenerating(false);
              setCurrentCreationId(null);
              reject(new Error("Video generation timed out after 15 minutes"));
            }
          }, 15 * 60 * 1000);

          const check = () => {
            if (generationResult) {
              clearTimeout(timeout);
              generationResult.success
                ? resolve({
                    video_url: generationResult.videoUrl,
                    creation_id: generationResult.creationId,
                  })
                : reject(new Error(generationResult.error));
            } else {
              setTimeout(check, 100);
            }
          };

          check();
        });
      } catch (error) {
        console.error("Video generation error:", error);
        setIsGenerating(false);
        setCurrentCreationId(null);
        setGenerationProgress(0);
        throw error;
      }
    },
    [shopify, connected, emitEvent, generationResult, isGenerating]
  );

  const cancelGeneration = useCallback(() => {
    if (currentCreationId) {
      emitEvent("unsubscribe_creation", {
        type: "unsubscribe_creation",
        creationId: currentCreationId,
      });
    }

    setIsGenerating(false);
    setCurrentCreationId(null);
    setGenerationProgress(0);
    setGenerationResult(null);
  }, [currentCreationId, emitEvent]);

  // Real-time video update reaction
  useEffect(() => {
    if (videoUpdates && videoUpdates.creationId === currentCreationId) {
      handleUpdate(videoUpdates);
    }
  }, [videoUpdates, currentCreationId, handleUpdate]);

  return {
    generateVideo,
    cancelGeneration,
    isGenerating,
    generationProgress,
    currentCreationId,
    connectionStatus: connected ? "Connected" : "Disconnected",
  };
};
