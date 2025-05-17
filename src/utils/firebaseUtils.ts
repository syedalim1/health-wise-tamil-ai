import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyD72JjYaqmgwYw7eSTlyM_9dy-EevE9bUQ",
  authDomain: "asmi-project-notification.firebaseapp.com",
  projectId: "asmi-project-notification",
  storageBucket: "asmi-project-notification.firebasestorage.app",
  messagingSenderId: "936650736998",
  appId: "1:936650736998:web:34fbf60a68aa59712574a7",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Request permission and get FCM token
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // Get the FCM token
      const token = await getToken(messaging, {
        vapidKey:
          "BL6WDWYOmUXReKuOauKDP4VMbPTM5WL1GcdNMUPZdgiwOwg1KVXRIJTITReuBQMsw63OUS2Bn8jyy0ygKSfeZE8",
      });

      if (token) {
        console.log("FCM Token:", token);
        // Store the token in localStorage for persistence
        localStorage.setItem("fcmToken", token);
        return true;
      } else {
        console.log("No registration token available");
        return false;
      }
    }
    return false;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
};

// Handle foreground messages
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log("Message received in foreground:", payload);
      resolve(payload);
    });
  });

// Function to check if service worker is registered
export const checkServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        {
          scope: "/",
        }
      );
      console.log("Service Worker registered with scope:", registration.scope);
      return true;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      return false;
    }
  }
  return false;
};

// Initialize Firebase messaging
export const initializeFirebaseMessaging = async () => {
  try {
    // First, check and register service worker
    const swRegistered = await checkServiceWorker();
    if (!swRegistered) {
      console.error("Service Worker registration required for notifications");
      return false;
    }

    // Then request notification permission
    const permissionGranted = await requestNotificationPermission();
    if (!permissionGranted) {
      console.log("Notification permission not granted");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error initializing Firebase messaging:", error);
    return false;
  }
};
