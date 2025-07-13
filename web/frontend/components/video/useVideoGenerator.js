import { useCallback, useEffect, useRef, useState } from "react";
import { useSocketIO, VIDEO_STATUS } from "../../hooks/useSocketIO";
import { API_CONFIG, STATIC_MOTION_PROMPT } from "../../utils/videoConstants";
import { useParams } from "react-router-dom";

const getShopifyHeaders = (shopify) => {
  const shop = shopify?.config?.shop;
  const accessToken = shopify?.config?.accessToken;

  return {
    "X-Shopify-Access-Token": accessToken,
    "X-Shopify-Shop": shop,
    "Content-Type": "application/json",
  };
};

export const useVideoGenerator = (shopify) => {
  const { id: templateId } = useParams();

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(null);
  const [currentCreationId, setCreationId] = useState(null);
  const [currentTaskId, setTaskId] = useState(null);
  const [result, setResult] = useState(null);

  const taskIdRef = useRef(null);
  const pollRef = useRef(null);
  const creationIdRef = useRef(null); // 🆕 Add ref for creation ID
  const selectedProductRef = useRef(null); // 🆕 Add ref for selected product

  const {
    connected,
    subscribeToVideoUpdates,
    subscribeToCreation,
    startPolling,
    stopPolling,
  } = useSocketIO();

  const stopPollingStatus = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    stopPolling();
    console.log("⛔ Stopped all polling");
  }, [stopPolling]);

  // 🆕 Enhanced database update function
  const updateCreationStatus = useCallback(
    async (creationId, status, additionalData = {}) => {
      console.log("🔄 UPDATING DATABASE:");
      console.log("  - Creation ID:", creationId);
      console.log("  - Status:", status);
      console.log("  - Additional Data:", additionalData);
      
      if (!creationId) {
        console.error("❌ Cannot update: Missing creation ID");
        return false;
      }

      try {
        const headers = getShopifyHeaders(shopify);
        const updatePayload = {
          status,
          updatedAt: new Date().toISOString(),
          ...additionalData,
        };

        const url = `${API_CONFIG.baseUrl}/creations/${creationId}`;
        console.log("📤 UPDATE URL:", url);
        console.log("📤 UPDATE PAYLOAD:", updatePayload);

        const response = await fetch(url, {
          method: "PUT",
          headers,
          credentials: "include",
          body: JSON.stringify(updatePayload),
        });

        console.log("📥 UPDATE RESPONSE:", response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ UPDATE FAILED:", errorText);
          return false;
        }

        const responseData = await response.json();
        console.log("✅ UPDATE SUCCESS:", responseData);
        return true;
        
      } catch (err) {
        console.error("❌ UPDATE ERROR:", err.message);
        return false;
      }
    },
    [shopify]
  );

  const handleStatusUpdate = useCallback(
    async (data) => {
      const {
        status: rawStatus,
        task_id,
        generated,
        outputMap,
        failureReason,
      } = data;

      console.log("🎬 STATUS UPDATE RECEIVED:");
      console.log("  - Status:", rawStatus);
      console.log("  - Task ID:", task_id);
      console.log("  - Current Task:", taskIdRef.current);
      console.log("  - Current Creation ID:", creationIdRef.current);
      console.log("  - Generated URLs:", generated);

      // Only process updates for current task
      if (task_id !== taskIdRef.current) {
        console.log(`🔄 Ignoring update for different task`);
        return;
      }

      const normalizedStatus = rawStatus?.toUpperCase();
      setStatus(normalizedStatus);
      
      const videoUrl = generated?.[0] || (Array.isArray(outputMap) ? outputMap[0]?.outputUrl : null);
      
      console.log("📊 PROCESSING STATUS:", normalizedStatus);
      console.log("🎥 VIDEO URL:", videoUrl);

      // 🆕 Always try to update database if we have a creation ID
      const creationIdToUse = creationIdRef.current || currentCreationId;
      
      switch (normalizedStatus) {
        case VIDEO_STATUS.CREATED:
          setProgress(10);
          if (creationIdToUse) {
            console.log("🔄 Updating to CREATED...");
            await updateCreationStatus(creationIdToUse, "CREATED");
          }
          break;

        case VIDEO_STATUS.IN_PROGRESS:
          setProgress(50);
          if (creationIdToUse) {
            console.log("🔄 Updating to IN_PROGRESS...");
            await updateCreationStatus(creationIdToUse, "IN_PROGRESS", {
              processingStartedAt: new Date().toISOString(),
            });
          }
          break;

        case VIDEO_STATUS.COMPLETED:
          setProgress(100);
          setIsGenerating(false);
          stopPollingStatus();
          setTaskId(null);
          taskIdRef.current = null;

          console.log("🎉 VIDEO COMPLETED!");
          console.log("🎥 Final video URL:", videoUrl);

          if (creationIdToUse) {
            console.log("🔄 Updating to COMPLETED...");
            const updateSuccess = await updateCreationStatus(creationIdToUse, "COMPLETED", {
              processingCompletedAt: new Date().toISOString(),
              outputMap: [
                {
                  productId: selectedProductRef.current?.id || "uploaded_image",
                  outputUrl: videoUrl,
                },
              ],
            });
            console.log("📊 Database update result:", updateSuccess);
          } else {
            console.error("❌ No creation ID available for final update!");
          }

          setResult({
            success: !!videoUrl,
            videoUrl,
            outputMap: {
              videoUrl,
              thumbnail: videoUrl ? `${videoUrl}.jpg` : null,
              ...outputMap?.[0],
            },
          });
          break;

        case VIDEO_STATUS.FAILED:
        case VIDEO_STATUS.ERROR:
          setIsGenerating(false);
          setProgress(0);
          stopPollingStatus();
          setTaskId(null);
          taskIdRef.current = null;

          if (creationIdToUse) {
            console.log("🔄 Updating to", normalizedStatus);
            await updateCreationStatus(creationIdToUse, normalizedStatus, {
              failureReason: failureReason || "Unknown error",
              processingCompletedAt: new Date().toISOString(),
            });
          }

          setResult({
            success: false,
            error: failureReason || "Video generation failed",
          });
          break;

        default:
          console.log(`🔄 Unhandled status: ${normalizedStatus}`);
          break;
      }
    },
    [stopPollingStatus, currentCreationId, updateCreationStatus]
  );

  const pollStatus = useCallback(
    async (taskId) => {
      if (taskId !== taskIdRef.current) return;

      console.log("🔁 Polling task:", taskId);
      try {
        const res = await fetch(`/api/v1/app/freepik/check-status/${taskId}`, {
          method: "GET",
          headers: getShopifyHeaders(shopify),
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const json = await res.json();
        const data = json?.data || {};
        
        console.log("📥 POLL RESPONSE:", data);
        
        // 🆕 CRITICAL: Ensure we call handleStatusUpdate with the polling data
        if (taskId === taskIdRef.current) {
          console.log("🔄 Calling handleStatusUpdate with poll data...");
          await handleStatusUpdate({ ...data, task_id: taskId });
        }
      } catch (err) {
        console.error("❌ Polling error:", err.message);
      }
    },
    [shopify, handleStatusUpdate]
  );

  const startStatusPolling = useCallback(
    (taskId) => {
      if (!taskId) {
        console.warn("❌ Cannot start polling: missing taskId");
        return;
      }

      if (pollRef.current) {
        clearInterval(pollRef.current);
      }

      // 🆕 Immediate poll to check current status
      pollStatus(taskId);
      
      pollRef.current = setInterval(() => {
        if (taskIdRef.current === taskId) {
          pollStatus(taskId);
        } else {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }, 5000);
      
      startPolling(taskId, 5000);
      console.log("📡 Started dual polling for task:", taskId);
    },
    [pollStatus, startPolling]
  );

  const generateVideo = useCallback(
    async (params) => {
      try {
        setIsGenerating(true);
        setProgress(0);
        setResult(null);
        setStatus(null);
        setCreationId(null);
        setTaskId(null);
        taskIdRef.current = null;
        creationIdRef.current = null;
        selectedProductRef.current = null; // 🆕 Reset product ref // 🆕 Reset ref
        selectedProductRef.current = null; // 🆕 Reset product ref
        stopPollingStatus();

        // 🆕 Store selected product in ref for later use
        selectedProductRef.current = params.selectedProduct;

        const payload = {
          webhook_url: "https://your-domain.com/api/freepik/webhook",
          image: params.image,
          prompt: STATIC_MOTION_PROMPT,
          duration: params.duration.toString(),
          cfg_scale: params.cfgScale || 0.5,
        };

        const res = await fetch("/api/v1/app/freepik/generate-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const json = await res.json();
        const taskId = json?.data?.task_id;
        if (!taskId) throw new Error("No task_id returned");

        console.log("✅ Task created:", taskId);
        setTaskId(taskId);
        taskIdRef.current = taskId;
        setProgress(5);

        // Create database record FIRST
        const headers = getShopifyHeaders(shopify);
        const creationRes = await fetch(`${API_CONFIG.baseUrl}/creations`, {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({
            status: "PENDING",
            templateId,
            type: "video",
            taskId,
            inputMap: params.selectedProduct ? [{
              productId: params.selectedProduct.id,
              imageUrl: params.selectedProduct.thumbnail,
            }] : [],
            inputImages: [params.image],
            creditsUsed: params.totalCredits || 1,
            meta: {
              originalImage: params.image,
              processedAt: new Date().toISOString(),
              duration: parseInt(params.duration),
              mode: params.mode,
              aspectRatio: "16:9",
              cfgScale: params.cfgScale,
              prompt: STATIC_MOTION_PROMPT,
            },
            outputMap: [],
          }),
        });

        if (!creationRes.ok) {
          throw new Error(`Database creation failed: ${creationRes.status}`);
        }

        const creationData = await creationRes.json();
        const creationId = creationData?.creation?._id || creationData?.creation?.id;

        if (!creationId) {
          throw new Error("No creation ID returned");
        }

        console.log("✅ Database record created:", creationId);
        setCreationId(creationId);
        creationIdRef.current = creationId; // 🆕 Set ref immediately

        // Subscribe to real-time updates
        subscribeToCreation(creationId, taskId);
        
        // Start polling AFTER we have the creation ID
        startStatusPolling(taskId);

      } catch (err) {
        console.error("❌ Generation error:", err.message);
        stopPollingStatus();
        setIsGenerating(false);
        setProgress(0);
        setResult({ success: false, error: err.message });
        setTaskId(null);
        taskIdRef.current = null;
        creationIdRef.current = null;
        throw err;
      }
    },
    [shopify, startStatusPolling, stopPollingStatus, subscribeToCreation, templateId]
  );

  useEffect(() => {
    const unsubscribe = subscribeToVideoUpdates(handleStatusUpdate);
    return unsubscribe;
  }, [handleStatusUpdate, subscribeToVideoUpdates]);

  useEffect(() => {
    return () => stopPollingStatus();
  }, [stopPollingStatus]);

  return {
    generateVideo,
    isGenerating,
    progress,
    status,
    generationResult: result,
    currentCreationId,
    connectionStatus: connected ? "Connected" : "Disconnected",
    currentTaskId,
  };
};