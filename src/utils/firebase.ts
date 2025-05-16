import { initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  MessagePayload,
  isSupported,
} from "firebase/messaging";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD72JjYaqmgwYw7eSTlyM_9dy-EevE9bUQ",
  authDomain: "asmi-project-notification.firebaseapp.com",
  projectId: "asmi-project-notification",
  storageBucket: "asmi-project-notification.firebasestorage.app",
  messagingSenderId: "936650736998",
  appId: "1:936650736998:web:34fbf60a68aa59712574a7",
};

// VAPID key for web push notifications
const vapidKey =
  "BL6WDWYOmUXReKuOauKDP4VMbPTM5WL1GcdNMUPZdgiwOwg1KVXRIJTITReuBQMsw63OUS2Bn8jyy0ygKSfeZE8";

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// We need to check if the browser supports Firebase Messaging before initializing it
export let messaging = null;

// Function to register service worker manually
const registerServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) {
    console.log("Service workers not supported");
    return null;
  }

  try {
    console.log("Registering service worker...");
    return await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  } catch (error) {
    console.error("Service worker registration failed:", error);
    return null;
  }
};

// Initialize messaging
const initMessaging = async () => {
  if (messaging) return messaging;

  try {
    // Check if messaging is supported
    const isMessagingSupported = await isSupported();

    if (!isMessagingSupported) {
      console.log("Firebase messaging is not supported in this browser");
      return null;
    }

    // Make sure we're in a browser
    if (typeof window === "undefined") {
      console.log("Not in browser environment");
      return null;
    }

    console.log("Initializing Firebase messaging...");
    messaging = getMessaging(app);
    return messaging;
  } catch (error) {
    console.error("Error initializing Firebase messaging:", error);
    return null;
  }
};

// A simpler approach that uses proper fallbacks
export const requestFCMToken = async (): Promise<string | null> => {
  // First check if we're in a secure context (HTTPS or localhost)
  if (
    window.location.protocol !== "https:" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    console.error("Push notifications require HTTPS (except on localhost)");
    return null;
  }

  try {
    // 1. Request notification permission first
    console.log("Requesting notification permission...");
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    // 2. Register service worker before initializing messaging
    console.log("Registering service worker...");
    const swReg = await registerServiceWorker();

    // 3. Initialize messaging
    await initMessaging();

    if (!messaging) {
      console.error("Could not initialize Firebase messaging");
      return null;
    }

    // 4. Try to get token
    console.log("Getting FCM token...");
    let token;
    try {
      // First try with full configuration
      token = await getToken(messaging, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: swReg,
      });
    } catch (tokenError) {
      console.log(
        "Error getting token, trying alternative approach:",
        tokenError
      );

      // Alternative approach
      try {
        // Wait for service worker to be ready
        const serviceWorkerRegistration = await navigator.serviceWorker.ready;

        token = await getToken(messaging, {
          vapidKey: vapidKey,
          serviceWorkerRegistration,
        });
      } catch (fallbackError) {
        console.error("Alternative approach failed:", fallbackError);
        throw fallbackError; // Re-throw for the outer catch
      }
    }

    // Success!
    if (token) {
      console.log(
        "FCM token successfully retrieved:",
        token.substring(0, 10) + "..."
      );
      localStorage.setItem("fcmToken", token);
      return token;
    } else {
      console.log("No token received");
      return null;
    }
  } catch (error) {
    console.error("Failed to get FCM token:", error);
    console.log("Debug info:", {
      browser: navigator.userAgent,
      isSecureContext: window.isSecureContext,
      protocol: window.location.protocol,
      serviceWorkerSupported: "serviceWorker" in navigator,
    });

    // Display user-friendly error
    if (error instanceof Error) {
      if (error.message.includes("push service")) {
        console.log(
          "This might be due to using an unsupported browser or missing HTTPS"
        );
      }
    }

    return null;
  }
};

// Callback function for receiving messages
export const onMessageListener = () =>
  new Promise<MessagePayload>(async (resolve, reject) => {
    try {
      if (!messaging) {
        await initMessaging();
        if (!messaging) {
          reject(new Error("Messaging service not available"));
          return;
        }
      }

      onMessage(messaging, (payload) => {
        console.log("Firebase message received:", payload);
        resolve(payload);
      });
    } catch (error) {
      console.error("Error setting up message listener:", error);
      reject(error);
    }
  });

// Function to send FCM token to backend
export const sendTokenToServer = async (token: string) => {
  try {
    console.log("Sending token to server...");
    const response = await fetch("/api/register-fcm-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    if (response.ok) {
      console.log("FCM token registered with server");
      return true;
    } else {
      console.error("Failed to register FCM token with server");
      return false;
    }
  } catch (error) {
    console.error("Error sending FCM token to server:", error);
    return false;
  }
};
