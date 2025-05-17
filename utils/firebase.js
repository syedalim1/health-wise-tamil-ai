// import { initializeApp } from "firebase/app";
// import { getMessaging, getToken, onMessage } from "firebase/messaging";

// // Firebase configuration from your environment or hardcoded
// const firebaseConfig = {
//   apiKey:
//     process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
//     "AIzaSyD72JjYaqmgwYw7eSTlyM_9dy-EevE9bUQ",
//   authDomain:
//     process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
//     "asmi-project-notification.firebaseapp.com",
//   projectId:
//     process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "asmi-project-notification",
//   storageBucket:
//     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
//     "asmi-project-notification.firebasestorage.app",
//   messagingSenderId:
//     process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "936650736998",
//   appId:
//     process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
//     "1:936650736998:web:34fbf60a68aa59712574a7",
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);

// // Get messaging instance
// export const getMessagingInstance = () => {
//   try {
//     return getMessaging(app);
//   } catch (error) {
//     console.error("Error getting messaging instance:", error);
//     return null;
//   }
// };

// // Request and store FCM token
// export const requestAndStoreToken = async (userId) => {
//   try {
//     if (typeof window === "undefined") return null;

//     const messaging = getMessagingInstance();
//     if (!messaging) return null;

//     // VAPID key for web push
//     const vapidKey =
//       process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ||
//       "BL6WDWYOmUXReKuOauKDP4VMbPTM5WL1GcdNMUPZdgiwOwg1KVXRIJTITReuBQMsw63OUS2Bn8jyy0ygKSfeZE8";

//     console.log("Requesting FCM token...");

//     // Request permission first
//     if (Notification.permission !== "granted") {
//       const permission = await Notification.requestPermission();
//       if (permission !== "granted") {
//         console.log("Notification permission denied");
//         return null;
//       }
//     }

//     // Get token
//     const token = await getToken(messaging, {
//       vapidKey,
//       serviceWorkerRegistration: await navigator.serviceWorker.getRegistration(
//         "/firebase-messaging-sw.js"
//       ),
//     });

//     if (token) {
//       console.log("FCM Token obtained:", token);

//       // Store token in localStorage for use during browser close
//       localStorage.setItem("fcmToken", token);

//       // Store user ID if provided
//       if (userId) {
//         localStorage.setItem("userId", userId);
//       }

//       // Send token to your backend for storage/association with user
//       await fetch("/api/register-device", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ token, userId }),
//       });

//       return token;
//     } else {
//       console.error("Failed to obtain FCM token");
//       return null;
//     }
//   } catch (error) {
//     console.error("Error requesting FCM token:", error);
//     return null;
//   }
// };

// // Set up handler for foreground messages
// export const setupForegroundMessageHandler = (callback) => {
//   try {
//     const messaging = getMessagingInstance();
//     if (!messaging) return;

//     return onMessage(messaging, (payload) => {
//       console.log("Foreground message received:", payload);
//       if (callback && typeof callback === "function") {
//         callback(payload);
//       }
//     });
//   } catch (error) {
//     console.error("Error setting up foreground message handler:", error);
//   }
// };

// // Initialize Firebase and request permissions on client
// export const initializeFirebaseClient = async (userId) => {
//   if (typeof window === "undefined") return null;

//   try {
//     // Check if service worker is supported
//     if ("serviceWorker" in navigator) {
//       const registration = await navigator.serviceWorker.register(
//         "/firebase-messaging-sw.js",
//         {
//           scope: "/",
//         }
//       );
//       console.log("Service worker registered:", registration);

//       // Request and store FCM token
//       return await requestAndStoreToken(userId);
//     } else {
//       console.warn("Service workers are not supported in this browser");
//       return null;
//     }
//   } catch (error) {
//     console.error("Error initializing Firebase client:", error);
//     return null;
//   }
// };
