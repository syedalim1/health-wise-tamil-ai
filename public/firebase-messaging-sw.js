// Log service worker initialization
console.log("Firebase messaging service worker initialized");

// Import and initialize the Firebase SDK
importScripts(
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js"
);

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD72JjYaqmgwYw7eSTlyM_9dy-EevE9bUQ",
  authDomain: "asmi-project-notification.firebaseapp.com",
  projectId: "asmi-project-notification",
  storageBucket: "asmi-project-notification.firebasestorage.app",
  messagingSenderId: "936650736998",
  appId: "1:936650736998:web:34fbf60a68aa59712574a7",
};

// VAPID key (only needed for debugging)
self.VAPID_KEY =
  "BL6WDWYOmUXReKuOauKDP4VMbPTM5WL1GcdNMUPZdgiwOwg1KVXRIJTITReuBQMsw63OUS2Bn8jyy0ygKSfeZE8";

// Initialize Firebase
console.log("Initializing Firebase in service worker");
firebase.initializeApp(firebaseConfig);

// Initialize messaging
const messaging = firebase.messaging();
console.log("Firebase messaging initialized in service worker");

// Listen for push messages
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push Received:", event);

  let notificationData = {};

  try {
    notificationData = event.data.json();
    console.log("Push data:", notificationData);
  } catch (e) {
    console.error("Error parsing push data:", e);
  }

  const title = notificationData.notification?.title || "Medication Care";
  const options = {
    body:
      notificationData.notification?.body ||
      "It's time to take your medication",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: notificationData.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle background messages via FCM
messaging.onBackgroundMessage(function (payload) {
  console.log("[Service Worker] Received background message:", payload);

  const notificationTitle = payload.notification?.title || "Medication Care";
  const notificationOptions = {
    body: payload.notification?.body || "It's time to take your medication",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: payload.data?.medicationId || "medication-reminder",
    data: payload.data || {},
  };

  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification click received:", event);

  // Close the notification
  event.notification.close();

  // Get notification data
  const data = event.notification.data || {};

  // Handle click action
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      // If we have a client, focus it and send a message
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          if (event.action === "confirm") {
            client.postMessage({
              action: "MEDICATION_TAKEN",
              medicationId: data.medicationId,
            });
            return;
          }
          if (event.action === "postpone") {
            client.postMessage({
              action: "POSTPONE_REMINDER",
              medicationId: data.medicationId,
            });
            return;
          }
          return;
        }
      }

      // If no client is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow("/");
      }
    })
  );
});

// Ensure the service worker is properly activated
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activate event");
  event.waitUntil(self.clients.claim());
});

// Log installation
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Install event");
  self.skipWaiting();
});
