// Import necessary React hooks for state management and lifecycle
import { useState, useEffect, useCallback } from "react";
// Import Socket.IO client library for real-time communication
import { io } from "socket.io-client";

// Socket.IO Configuration - Server connection details
const SOCKET_URL = "https://imports-wife-collective-communication.trycloudflare.com"; // CloudFlare tunnel URL for the backend server
const SOCKET_OPTIONS = {
  transports: ["websocket"], // Force WebSocket transport only (no fallback to polling)
  withCredentials: true, // Include cookies and authentication headers in requests
  timeout: 10000, // Connection timeout in milliseconds (10 seconds)
};

// Create a single socket instance that will be shared across all hook instances
// This ensures we don't create multiple connections for the same app
const socket = io(SOCKET_URL, SOCKET_OPTIONS);

// Video Generation Status Constants - Enum-like object for consistent status tracking
export const VIDEO_STATUS = {
  CREATED: "CREATED", // Video creation task has been initiated
  IN_PROGRESS: "IN_PROGRESS", // Video is currently being processed
  COMPLETED: "COMPLETED", // Video generation COMPLETED successfully
  FAILED: "FAILED", // Video generation FAILED due to IN_PROGRESS error
  ERROR: "ERROR", // Video generation FAILED due to system error
};

/**
 * Custom hook for Socket.IO functionality
 * Provides a clean interface for real-time communication
 * Can be used across different components/pages without duplicating connection logic
 */
export const useSocketIO = () => {
  // State to track socket connection status
  const [connected, setConnected] = useState(false);

  // State to store the latest message received from server
  const [serverMessage, setServerMessage] = useState("");

  // State to store video generation updates received from server
  const [videoUpdates, setVideoUpdates] = useState(null);

  // State to store any connection error messages
  const [connectionError, setConnectionError] = useState(null);

  // useEffect runs once when component mounts to set up socket event listeners
  useEffect(() => {
    // Connection handlers - Functions to handle socket connection events

    // Handler for successful socket connection
    const handleConnect = () => {
      console.log("✅ Socket connected"); // Log successful connection
      setConnected(true); // Update connection state
      setConnectionError(null); // Clear any previous errors
      socket.emit("pingServer", "Client connected"); // Send ping to confirm connection
    };

    // Handler for socket disconnection
    const handleDisconnect = () => {
      console.log("🔌 Socket disconnected"); // Log disconnection
      setConnected(false); // Update connection state
    };

    // Handler for connection errors
    const handleConnectError = (err) => {
      console.error("❌ Connect error:", err.message); // Log error details
      setConnectionError(err.message); // Store error message in state
      setConnected(false); // Update connection state
    };

    // Handler for pong response from server (response to ping)
    const handlePong = (msg) => {
      console.log("✅ Server says:", msg); // Log server response
      setServerMessage(msg); // Store message in state
    };

    // Handler for video generation updates from server
    const handleVideoUpdate = (data) => {
      console.log("🎬 Video update:", data); // Log video update data
      setVideoUpdates(data); // Store update data in state
    };

    // Handler for Shopify-related events (e-commerce integration)
    const handleShopifyEvent = (data) => {
      console.log("🛍 Shopify event:", data); // Log Shopify event data
      // Note: This handler doesn't update state, just logs for debugging
    };

    // Handler for database update notifications
    const handleDbUpdate = (data) => {
      console.log("📦 DB update:", data); // Log database update data
      // Note: This handler doesn't update state, just logs for debugging
    };

    // Register event listeners - Connect handler functions to socket events
    socket.on("connect", handleConnect); // Listen for connection event
    socket.on("disconnect", handleDisconnect); // Listen for disconnection event
    socket.on("connect_error", handleConnectError); // Listen for connection errors
    socket.on("pongClient", handlePong); // Listen for server pong responses
    socket.on("videoUpdate", handleVideoUpdate); // Listen for video updates
    socket.on("shopifyEvent", handleShopifyEvent); // Listen for Shopify events
    socket.on("dbUpdate", handleDbUpdate); // Listen for database updates

    // Cleanup function - Removes all event listeners when component unmounts
    // This prevents memory leaks and duplicate event handlers
    return () => {
      socket.off("connect", handleConnect); // Remove connection listener
      socket.off("disconnect", handleDisconnect); // Remove disconnection listener
      socket.off("connect_error", handleConnectError); // Remove error listener
      socket.off("pongClient", handlePong); // Remove pong listener
      socket.off("videoUpdate", handleVideoUpdate); // Remove video update listener
      socket.off("shopifyEvent", handleShopifyEvent); // Remove Shopify listener
      socket.off("dbUpdate", handleDbUpdate); // Remove database update listener
    };
  }, []); // Empty dependency array means this effect runs only once on mount

  /**
   * Generic function to emit events to the server
   * @param {string} event - Event name to emit
   * @param {any} data - Data payload to send with the event
   * @returns {boolean} - Returns true if event was sent, false if not connected
   */
  const emitEvent = useCallback(
    (event, data) => {
      // Check if socket is connected before trying to emit
      if (connected) {
        socket.emit(event, data); // Send event to server
        console.log(`📤 Emitted ${event}:`, data); // Log outgoing event
        return true; // Indicate success
      }
      // If not connected, log warning and return false
      console.warn("Socket not connected, cannot emit event:", event);
      return false; // Indicate failure
    },
    [connected] // Re-create function only when connection state changes
  );

  /**
   * Subscribe to a specific socket event
   * @param {string} event - Event name to listen for
   * @param {function} callback - Function to call when event is received
   */
  const onEvent = useCallback((event, callback) => {
    socket?.on(event, callback); // Use optional chaining in case socket is null
    console.log(`📥 Subscribed to event: ${event}`); // Log subscription
  }, []); // No dependencies, function never changes

  /**
   * Unsubscribe from a specific socket event
   * @param {string} event - Event name to stop listening for
   * @param {function} callback - Specific callback function to remove
   */
  const offEvent = useCallback((event, callback) => {
    socket?.off(event, callback); // Use optional chaining in case socket is null
    console.log(`📤 Unsubscribed from event: ${event}`); // Log unsubscription
  }, []); // No dependencies, function never changes

  /**
   * Subscribe to multiple video generation related events
   * @param {function} callback - Function to handle all video update events
   * @returns {function} - Cleanup function to remove all listeners
   */
  const subscribeToVideoUpdates = useCallback((callback) => {
    // Array of video-related events to listen for
    const handlers = [
      { event: "taskStatusUpdate", handler: callback }, // Task status changes
      { event: "creationUpdate", handler: callback }, // Creation progress updates
      { event: "videoUpdate", handler: callback }, // General video updates
    ];

    // Register the same callback for all video events
    handlers.forEach(({ event, handler }) => {
      socket.on(event, handler);
    });

    // Return cleanup function to remove all listeners
    return () => {
      handlers.forEach(({ event, handler }) => {
        socket.off(event, handler);
      });
    };
  }, []); // No dependencies, function never changes

  /**
   * Subscribe to updates for a specific video creation task
   * @param {string} creationId - Unique identifier for the creation
   * @param {string} taskId - Unique identifier for the task
   */
  const subscribeToCreation = useCallback(
    (creationId, taskId) => {
      // Only emit if socket is connected
      if (connected) {
        emitEvent("subscribe_creation", { creationId, taskId });
      }
    },
    [connected, emitEvent] // Re-create when connection or emitEvent changes
  );

  /**
   * Unsubscribe from updates for a specific video creation task
   * @param {string} creationId - Unique identifier for the creation
   * @param {string} taskId - Unique identifier for the task
   */
  const unsubscribeFromCreation = useCallback(
    (creationId, taskId) => {
      // Only emit if socket is connected
      if (connected) {
        emitEvent("unsubscribe_creation", { creationId, taskId });
      }
    },
    [connected, emitEvent] // Re-create when connection or emitEvent changes
  );

  /**
   * Start server-side polling for task status updates
   * @param {string} taskId - Task ID to poll for
   * @param {number} interval - Polling interval in milliseconds (default: 5000)
   */
  const startPolling = useCallback(
    (taskId, interval = 5000) => {
      // Only start polling if socket is connected
      if (connected) {
        emitEvent("startPolling", {
          taskId, // Which task to poll
          pollInterval: interval, // How often to poll
          timestamp: Date.now(), // When polling started
        });
      }
    },
    [connected, emitEvent] // Re-create when connection or emitEvent changes
  );

  /**
   * Stop server-side polling for task status
   */
  const stopPolling = useCallback(() => {
    // Only stop polling if socket is connected
    if (connected) {
      emitEvent("stopPolling", { timestamp: Date.now() }); // Include timestamp
    }
  }, [connected, emitEvent]); // Re-create when connection or emitEvent changes

  /**
   * Manually disconnect the socket
   */
  const disconnect = useCallback(() => {
    // Check if socket exists before attempting disconnect
    if (socket) {
      socket.disconnect(); // Disconnect from server
      setConnected(false); // Update local state
    }
  }, []); // No dependencies, function never changes

  /**
   * Manually reconnect the socket
   */
  const reconnect = useCallback(() => {
    // Check if socket exists before attempting reconnect
    if (socket) {
      socket.connect(); // Reconnect to server
    }
  }, []); // No dependencies, function never changes

  // Return all socket functionality as an object
  // This allows components to destructure only what they need
  return {
    // Connection state properties
    connected, // Boolean: is socket connected?
    connectionError, // String: latest connection error message
    serverMessage, // String: latest message from server
    videoUpdates, // Object: latest video update data

    // Basic socket operations
    emitEvent, // Function: send event to server
    onEvent, // Function: subscribe to event
    offEvent, // Function: unsubscribe from event
    disconnect, // Function: manually disconnect
    reconnect, // Function: manually reconnect

    // Video-specific operations
    subscribeToVideoUpdates, // Function: subscribe to video events
    subscribeToCreation, // Function: subscribe to specific creation
    unsubscribeFromCreation, // Function: unsubscribe from specific creation
    startPolling, // Function: start server-side polling
    stopPolling, // Function: stop server-side polling

    // Raw socket instance (use with caution)
    socket, // Direct access to socket for advanced use cases
  };
};

/**
 * Socket event emitters - Standalone functions for specific actions
 * These provide a consistent interface for common application events
 */
export const SocketEmitters = {
  /**
   * Notify server about file upload activity
   * @param {function} emitEvent - The emitEvent function from useSocketIO hook
   * @param {number} fileCount - Number of files uploaded
   * @param {number} totalSize - Total size of uploaded files in bytes
   */
  fileUpload: (emitEvent, fileCount, totalSize) => {
    emitEvent("fileUpload", {
      fileCount, // How many files were uploaded
      totalSize, // Total size in bytes
      timestamp: Date.now(), // When the upload occurred
    });
  },

  /**
   * Notify server about product selection
   * @param {function} emitEvent - The emitEvent function from useSocketIO hook
   * @param {string} productId - Unique identifier for the selected product
   * @param {string} productTitle - Display name of the selected product
   * @param {boolean} hasImage - Whether the product has an associated image
   */
  productSelected: (emitEvent, productId, productTitle, hasImage) => {
    emitEvent("productSelected", {
      productId, // Product's unique ID
      productTitle, // Product's display name
      hasImage, // Boolean: does product have image?
      timestamp: Date.now(), // When selection occurred
    });
  },

  /**
   * Notify server about image confirmation
   * @param {function} emitEvent - The emitEvent function from useSocketIO hook
   * @param {string} imageType - Type/format of the confirmed image
   * @param {string} imageName - Name/identifier of the confirmed image
   */
  imageConfirmed: (emitEvent, imageType, imageName) => {
    emitEvent("imageConfirmed", {
      imageType, // Image format (e.g., "jpg", "png")
      imageName, // Image filename or identifier
      timestamp: Date.now(), // When confirmation occurred
    });
  },

  /**
   * Notify server about video generation start
   * @param {function} emitEvent - The emitEvent function from useSocketIO hook
   * @param {number} duration - Duration of video to generate (in seconds)
   * @param {string} mode - Generation mode (e.g., "fast", "quality")
   * @param {number} credits - Number of credits to be consumed
   * @param {boolean} hasProduct - Whether generation includes product
   */
  videoGenerationStarted: (emitEvent, duration, mode, credits, hasProduct) => {
    emitEvent("videoGenerationStarted", {
      duration, // Video length in seconds
      mode, // Generation mode/quality setting
      credits, // Credits that will be consumed
      hasProduct, // Boolean: includes product in video?
      timestamp: Date.now(), // When generation started
    });
  },

  /**
   * Notify server about video generation failure
   * @param {function} emitEvent - The emitEvent function from useSocketIO hook
   * @param {string} error - Error message describing the failure
   */
  videoGenerationFAILED: (emitEvent, error) => {
    emitEvent("videoGenerationFAILED", {
      error, // Error message or error object
      timestamp: Date.now(), // When failure occurred
    });
  },

  /**
   * Notify server about video download
   * @param {function} emitEvent - The emitEvent function from useSocketIO hook
   * @param {string} videoUrl - URL of the downloaded video
   */
  videoDownloaded: (emitEvent, videoUrl) => {
    emitEvent("videoDownloaded", {
      videoUrl, // URL where video was downloaded from
      timestamp: Date.now(), // When download occurred
    });
  },
};

// Export the hook as default export for easy importing
export default useSocketIO;
